import nodes from "@/data/nodes.json";
import tours from "@/data/vegas.tours.json";

import { notFound } from "next/navigation";
import type { Metadata } from "next";

/* ========================================
   Affiliate Config (LOCKED)
======================================== */

const VIATOR_PID = "P00281144"; // Your Partner ID
const VIATOR_MCID = "42383";   // Campaign ID

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
}

interface Tour {
  id: string;
  name: string;
  provider: string;
  duration?: string | null;
  price_from?: number | null;
  rating?: number | null;
  reviews?: number | null;
  tags: string[];
  booking_url: string;

  dcc: {
    node: string;
  };
}

/* ========================================
   Helpers
======================================== */

/**
 * Build high-conversion Viator search URL
 * (Pre-filtered + affiliate-safe)
 */
/**
 * Build optimized high-conversion Viator search URL
 */
/**
 * Build high-conversion Viator search URL
 * Cleans junk words + avoids duplication
 */
/**
 * Build high-conversion Viator search URL
 * - Deduplicates keywords
 * - Preserves strong phrases
 * - Prevents spam repetition
 */
function buildViatorLink(tour: Tour, city: string) {

  const STOP = new Set([
    "tour",
    "trip",
    "experience",
    "flight",
    "with",
    "and",
    "the",
    "from",
    "day",
    "half",
    "optional",
    "las",
    "vegas"
  ]);

  const clean = (str: string) =>
    str
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(" ")
      .filter(w => w.length > 2 && !STOP.has(w));

  const words = new Set<string>();

  if (tour.tags?.length) {
    tour.tags.forEach(tag => {
      clean(tag.replace("-", " ")).forEach(w => words.add(w));
    });
  }

  clean(tour.name).forEach(w => words.add(w));

  const core = Array.from(words).slice(0, 3).join(" ");

  const phrase = `${city} ${core} tour`;

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

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const node = (nodes as Node[]).find(
    (n) => n.slug === params.slug
  );

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

export default function NodePage({
  params,
}: {
  params: { slug: string };
}) {

  /* ---------- Resolve Node ---------- */

  const node = (nodes as Node[]).find(
    (n) => n.slug === params.slug
  );

  if (!node || node.status !== "active") {
    return notFound();
  }

  /* ---------- Resolve Hub ---------- */

  const hubId =
    node.hub ||
    node.slug.replace("-guide", "");

  /* ---------- Filter + Rank Tours ---------- */

  const nodeTours = (tours as Tour[])
    .filter((t) => t?.dcc?.node === hubId)
    .sort((a, b) => (b.rating || 0) - (a.rating || 0));

  const cityName = node.name.replace(" Guide", "");

  /* ---------- Dev Debug ---------- */

  if (process.env.NODE_ENV === "development") {
    console.log("NODE:", node.slug);
    console.log("HUB:", hubId);
    console.log("TOURS:", nodeTours.length);
  }

  return (
    <main className="max-w-6xl mx-auto px-6 py-24 space-y-20">

      {/* ================= HERO ================= */}

      <header className="space-y-6 border-b border-zinc-800 pb-12">

        <h1 className="text-4xl md:text-6xl font-black tracking-tight">
          {node.name}
        </h1>

        <p className="text-zinc-400 max-w-3xl text-lg leading-relaxed">
          {node.description}
        </p>

        <div className="flex gap-3 text-xs uppercase tracking-wider text-cyan-400">
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

      {/* ================= OVERVIEW ================= */}

      <section className="space-y-4">

        <h2 className="text-2xl font-bold">
          Travel Overview
        </h2>

        <p className="text-zinc-300 leading-relaxed max-w-3xl">

          {cityName} is a verified destination inside the Destination
          Command Center network. We analyze pricing, reliability,
          demand, and user reviews to surface the best-performing
          tours and activities.

        </p>

      </section>

      {/* ================= CAPABILITIES ================= */}

      <section className="space-y-6">

        <h2 className="text-2xl font-bold">
          How We Rank Experiences
        </h2>

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

      {nodeTours.length > 0 && (

        <section className="space-y-12">

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

            <h2 className="text-3xl font-black">
              Top Tours & Experiences
            </h2>

            <span className="text-sm text-zinc-400">
              Ranked by Rating • Popularity • Trust
            </span>

          </div>

          <div className="grid gap-8 md:grid-cols-2">

            {nodeTours.map((tour, index) => {

              const affiliateUrl = buildViatorLink(
                tour,
                cityName
              );

              const isTop = index === 0;

              return (

                <div
                  key={tour.id}
                  className="relative group rounded-2xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900/80 transition p-6 space-y-5"
                >

                  {/* Bestseller Badge */}

                  {isTop && (
                    <div className="absolute -top-3 right-4 bg-cyan-600 text-white text-xs px-3 py-1 rounded-full font-semibold">
                      🔥 Bestseller
                    </div>
                  )}

                  {/* Title */}

                  <h3 className="text-lg font-semibold group-hover:text-cyan-400 transition">
                    {tour.name}
                  </h3>

                  {/* Meta */}

                  <div className="grid grid-cols-2 gap-2 text-sm text-zinc-400">

                    {tour.duration && (
                      <div>⏱ {tour.duration}</div>
                    )}

                    {tour.price_from !== null &&
                      tour.price_from !== undefined && (
                        <div>💵 From ${tour.price_from}</div>
                    )}

                    {tour.rating && (
                      <div className="col-span-2">
                        ⭐ {tour.rating}
                        {tour.reviews && (
                          <> ({tour.reviews.toLocaleString()} reviews)</>
                        )}
                      </div>
                    )}

                  </div>

                  {/* Tags */}

                  {tour.tags?.length > 0 && (

                    <div className="flex flex-wrap gap-2">

                      {tour.tags.map((tag) => (

                        <span
                          key={tag}
                          className="text-xs px-3 py-1 rounded-full bg-zinc-800 text-zinc-300"
                        >
                          #{tag}
                        </span>

                      ))}

                    </div>

                  )}

                  {/* CTA */}

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

        </section>

      )}

      {/* ================= STATUS ================= */}

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-7 space-y-3">

        <h3 className="font-semibold text-lg">
          Network Status
        </h3>

        <p className="text-sm text-zinc-400">

          This destination node is currently{" "}
          <span className="text-cyan-400 font-medium">
            {node.status}
          </span>{" "}
          and synchronized with the authority layer.

        </p>

      </section>

      {/* ================= FOOTER ================= */}

      <footer className="pt-10 border-t border-zinc-800 text-sm text-zinc-500">

        <p>
          © {new Date().getFullYear()} Destination Command Center •
          Optimized Travel Intelligence Network
        </p>

      </footer>

    </main>
  );
}
