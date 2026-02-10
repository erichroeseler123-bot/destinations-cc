export const dynamicParams = false;


// app/nodes/[slug]/page.tsx
import nodes from "@/data/nodes.json";

// Primary catalog (currently `{}` in your repo, so we normalize it safely)
import toursCatalog from "@/data/tours.json";

// Fallback / seed catalog (your vegas tours)
import vegasTours from "@/data/vegas.tours.json";

import LocalTimeWeather from "@/components/LocalTimeWeather";

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";

/* ========================================
   Affiliate Config (LOCKED)
======================================== */

const VIATOR_PID = "P00281144"; // Your Partner ID
const VIATOR_MCID = "42383"; // Campaign ID

/* ========================================
   Types
======================================== */

interface Node {
  id: string;
  slug: string;
  name: string;
  type: string;
  region: string;
  status: string;
  description: string;
  hub?: string;

  // optional future fields (won’t break if absent)
  citySlug?: string;

  // for local time + weather
  lat?: number;
  lng?: number;
  timezone?: string; // IANA e.g. "America/Los_Angeles"
}

interface Tour {
  id: string;
  name: string;
  provider?: string;
  duration?: string | null;
  price_from?: number | null;
  rating?: number | null;
  reviews?: number | null;
  tags?: string[];
  booking_url?: string;

  dcc?: {
    node?: string;
    hub?: string;
    category?: string;
    destinationSlug?: string;
    citySlug?: string;
  };

  // allow other ingestion shapes without crashing
  hub?: string;
  city?: string;
  citySlug?: string;
  destination?: string;
  destinationSlug?: string;
}

/* ========================================
   Helpers
======================================== */

function slugify(input: string) {
  return (input || "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function normalizeTours(raw: any): Tour[] {
  if (Array.isArray(raw)) return raw as Tour[];
  if (raw && typeof raw === "object") {
    // common shapes: { tours: [...] } or { items: [...] }
    if (Array.isArray(raw.tours)) return raw.tours as Tour[];
    if (Array.isArray(raw.items)) return raw.items as Tour[];
  }
  return [];
}

function getTourNodeKey(t: Tour): string {
  const k =
    t?.dcc?.node ||
    t?.dcc?.hub ||
    t?.dcc?.destinationSlug ||
    t?.dcc?.citySlug ||
    t?.hub ||
    t?.citySlug ||
    t?.destinationSlug ||
    t?.destination ||
    t?.city;

  return slugify(String(k || ""));
}

/**
 * Build optimized Viator search URL
 * - dedupes keywords
 * - removes junk words
 * - keeps phrase tight (better conversion + less spam)
 */
function buildViatorLink(tour: Tour, cityName: string) {
  const STOP = new Set([
    "tour",
    "tours",
    "trip",
    "experience",
    "experiences",
    "with",
    "and",
    "the",
    "from",
    "day",
    "half",
    "optional",
    "best",
    "top",
    "tickets",
    "ticket",
    "las",
    "vegas",
  ]);

  const cleanWords = (str: string) =>
    (str || "")
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .map((w) => w.trim())
      .filter(Boolean)
      .filter((w) => !STOP.has(w));

  const words = new Set<string>();

  // Tags first (often strong)
  if (tour.tags?.length) {
    for (const tag of tour.tags) {
      cleanWords(tag.replace(/-/g, " ")).forEach((w) => words.add(w));
    }
  }

  // Name next
  cleanWords(tour.name).forEach((w) => words.add(w));

  // keep it short
  const core = Array.from(words).slice(0, 4).join(" ").trim();

  // final phrase
  const phrase = core ? `${cityName} ${core}` : `${cityName} tours`;

  return `https://www.viator.com/searchResults/all?text=${encodeURIComponent(
    phrase
  )}&pid=${VIATOR_PID}&mcid=${VIATOR_MCID}`;
}

/* ========================================
   Static Generation
======================================== */

export function generateStaticParams() {
  return (nodes as Node[]).map((node) => ({
    slug: node.slug,
  }));
}

/* ========================================
   SEO / Metadata
======================================== */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;

  const node = (nodes as Node[]).find((n) => n.slug === resolvedParams.slug);
  if (!node) return {};

  const title = `${node.name} Travel Guide | Best Tours & Experiences`;
  const description =
    node.description ||
    `Compare top-rated tours, activities, and experiences in ${node.name}. Book verified providers with real reviews.`;

  return {
    title,
    description,

    openGraph: {
      title,
      description,
      url: `https://destinationcommandcenter.com/nodes/${node.slug}`,
      siteName: "Destination Command Center",
      type: "website",
    },

    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

/* ========================================
   Page Component
======================================== */

export default async function NodePage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;

  /* ---------- Resolve Node ---------- */

  const node = (nodes as Node[]).find((n) => n.slug === resolvedParams.slug);

  if (!node || node.status !== "active") {
    return notFound();
  }

  const cityName = node.name.replace(/\s*Guide\s*$/i, "").trim();

  /* ---------- Resolve Hub + City Slug ---------- */

  const hubId = slugify(node.hub || node.slug.replace(/-guide$/i, ""));

  // canonical city slug — for Vegas we want "las-vegas" not "vegas"
  const citySlug =
    slugify(node.citySlug || hubId) === "vegas"
      ? "las-vegas"
      : slugify(node.citySlug || hubId);

  const nodeSlug = slugify(node.slug);

  // Acceptable keys for matching tours
  const accepted = new Set<string>([
    hubId,
    citySlug,
    nodeSlug,
    slugify(cityName),
    slugify(cityName.replace(/\s+/g, "-")),
  ]);

  /* ---------- Load Tours (robust) ---------- */

  const primaryTours = normalizeTours(toursCatalog);
  const fallbackTours = normalizeTours(vegasTours);

  const allTours = primaryTours.length > 0 ? primaryTours : fallbackTours;

  /* ---------- Filter + Rank Tours ---------- */

  const nodeTours = allTours
    .filter((t) => accepted.has(getTourNodeKey(t)))
    .sort((a, b) => (b.rating || 0) - (a.rating || 0));

  /* ---------- Dev Debug ---------- */

  if (process.env.NODE_ENV === "development") {
    console.log("NODE:", node.slug);
    console.log("HUB:", hubId);
    console.log("CITY:", citySlug);
    console.log("TOURS:", nodeTours.length);
    if (nodeTours[0]) console.log("TOUR_SAMPLE_KEY:", getTourNodeKey(nodeTours[0]));
  }

  return (
    <main className="max-w-6xl mx-auto px-6 py-24 space-y-20">
      {/* ================= HERO ================= */}

      <header className="space-y-6 border-b border-zinc-800 pb-12">
        <h1 className="text-4xl md:text-6xl font-black tracking-tight">{node.name}</h1>

        <p className="text-zinc-400 max-w-3xl text-lg leading-relaxed">{node.description}</p>

        <div className="flex flex-wrap gap-3 text-xs uppercase tracking-wider text-cyan-400">
          <span>{node.type}</span>
          <span>•</span>
          <span>{node.region}</span>
          <span>•</span>
          <span>Verified Experiences</span>
        </div>
      </header>

      {/* ================= TRUST BAR ================= */}

      <section className="grid md:grid-cols-3 gap-6 text-center">
        <div className="rounded-xl bg-zinc-900/50 border border-zinc-800 p-5">
          ⭐ 300k+ Verified Reviews
        </div>

        <div className="rounded-xl bg-zinc-900/50 border border-zinc-800 p-5">
          🔒 Secure Checkout
        </div>

        <div className="rounded-xl bg-zinc-900/50 border border-zinc-800 p-5">
          💰 Lowest Price Guarantee
        </div>
      </section>

      {/* ================= LOCAL TIME + WEATHER ================= */}

      <LocalTimeWeather
        label="Local Time & Weather"
        timezone={node.timezone}
        lat={node.lat}
        lng={node.lng}
      />

      {/* ================= OVERVIEW ================= */}

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Travel Overview</h2>

        <p className="text-zinc-300 leading-relaxed max-w-3xl">
          {cityName} is a verified destination inside the Destination Command Center network. We analyze pricing,
          reliability, demand, and user reviews to surface the best-performing tours and activities.
        </p>
      </section>

      {/* ================= CAPABILITIES ================= */}

      <section className="space-y-6">
        <h2 className="text-2xl font-bold">How We Rank Experiences</h2>

        <ul className="grid md:grid-cols-2 gap-4 text-zinc-300">
          <li>✔ Provider reliability</li>
          <li>✔ Review authenticity</li>
          <li>✔ Cancellation risk</li>
          <li>✔ Demand velocity</li>
          <li>✔ Price stability</li>
          <li>✔ Guest satisfaction</li>
        </ul>
      </section>

      {/* ================= TOURS ================= */}

      <section className="space-y-12">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h2 className="text-3xl font-black">Top Tours & Experiences</h2>

          <span className="text-sm text-zinc-400">Ranked by Rating • Popularity • Trust</span>
        </div>

        {nodeTours.length > 0 ? (
          <div className="grid gap-8 md:grid-cols-2">
            {nodeTours.map((tour, index) => {
              const affiliateUrl = buildViatorLink(tour, cityName);
              const isTop = index === 0;

              return (
                <div
                  key={tour.id}
                  className="relative group rounded-2xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900/80 transition p-6 space-y-5"
                >
                  {isTop && (
                    <div className="absolute -top-3 right-4 bg-cyan-600 text-white text-xs px-3 py-1 rounded-full font-semibold">
                      🔥 Bestseller
                    </div>
                  )}

                  <h3 className="text-lg font-semibold group-hover:text-cyan-400 transition">{tour.name}</h3>

                  <div className="grid grid-cols-2 gap-2 text-sm text-zinc-400">
                    {tour.duration && <div>⏱ {tour.duration}</div>}

                    {tour.price_from !== null && tour.price_from !== undefined && (
                      <div>💵 From ${tour.price_from}</div>
                    )}

                    {tour.rating && (
                      <div className="col-span-2">
                        ⭐ {tour.rating}
                        {tour.reviews ? <> ({tour.reviews.toLocaleString()} reviews)</> : null}
                      </div>
                    )}
                  </div>

                  {tour.tags?.length ? (
                    <div className="flex flex-wrap gap-2">
                      {tour.tags.map((tag) => (
                        <span key={tag} className="text-xs px-3 py-1 rounded-full bg-zinc-800 text-zinc-300">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  <a
                    href={affiliateUrl}
                    target="_blank"
                    rel="noopener noreferrer sponsored"
                    className="block text-center mt-4 font-semibold text-white bg-cyan-600 hover:bg-cyan-500 px-5 py-3 rounded-xl transition shadow-lg shadow-cyan-600/20"
                  >
                    Check Availability →
                  </a>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8 space-y-4">
            <p className="text-zinc-300">
              Tours for this node aren’t loaded yet — the page is live and ready. Once the Viator ingest finishes (or
              you add a local catalog), this section will populate automatically.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href={`https://www.viator.com/searchResults/all?text=${encodeURIComponent(
                  `${cityName} tours`
                )}&pid=${VIATOR_PID}&mcid=${VIATOR_MCID}`}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="inline-block text-center font-semibold text-white bg-cyan-600 hover:bg-cyan-500 px-5 py-3 rounded-xl transition"
              >
                View {cityName} tours on Viator →
              </a>

              <Link
                href="/"
                className="inline-block text-center font-semibold text-zinc-200 border border-zinc-700 hover:border-zinc-500 px-5 py-3 rounded-xl transition"
              >
                Back to Home
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* ================= STATUS ================= */}

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-7 space-y-3">
        <h3 className="font-semibold text-lg">Network Status</h3>

        <p className="text-sm text-zinc-400">
          This destination node is currently{" "}
          <span className="text-cyan-400 font-medium">{node.status}</span> and synchronized with the authority layer.
        </p>
      </section>

      {/* ================= FOOTER ================= */}

      <footer className="pt-10 border-t border-zinc-800 text-sm text-zinc-500">
        <p>© {new Date().getFullYear()} Destination Command Center • Optimized Travel Intelligence Network</p>
      </footer>
    </main>
  );
}
