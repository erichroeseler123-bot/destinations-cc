import { notFound } from "next/navigation";
import type { Metadata } from "next";

import nodes from "@/data/nodes.json";
import { getNodeSlugFromCity } from "@/src/data/city-aliases";

/* ========================================
   Types
======================================== */

interface Node {
  slug: string;
  name: string;
  description?: string;
  status: string;
}

type Attraction = {
  title: string;
  description: string;
  /** What we pass into Viator search */
  query: string;
  /** Optional badge for conversion (e.g. "Best Seller") */
  badge?: string;
};

/* ========================================
   Affiliate
======================================== */

const VIATOR_PID = "P00281144";
const VIATOR_MCID = "42383";

/* ========================================
   Helpers
======================================== */

function normalizeCityKey(cityParam: string) {
  return cityParam.trim().toLowerCase();
}

/**
 * Viator search link (affiliate-safe)
 * We build:
 *   https://www.viator.com/search/<city>?pid=...&mcid=...&query=<city + topic>
 */
function viatorSearch(cityLabel: string, topic: string) {
  const q = encodeURIComponent(`${cityLabel} ${topic}`);
  const place = encodeURIComponent(cityLabel);

  return `https://www.viator.com/search/${place}?pid=${VIATOR_PID}&mcid=${VIATOR_MCID}&query=${q}`;
}

/* ========================================
   Attractions Catalog
   (keyed by city route param: "las-vegas", "new-orleans", etc.)
======================================== */

const ATTRACTIONS: Record<string, Attraction[]> = {
  "las-vegas": [
    {
      title: "Hoover Dam",
      description:
        "Visit one of America’s greatest engineering landmarks just outside Las Vegas.",
      query: "Hoover Dam Tour",
      badge: "Iconic",
    },
    {
      title: "Sphere Experience",
      description:
        "Immersive concerts and digital experiences inside the world’s largest spherical venue.",
      query: "Las Vegas Sphere Experience",
      badge: "New",
    },
    {
      title: "Stratosphere Tower",
      description:
        "Sky-high observation deck and thrill rides overlooking the Strip.",
      query: "Stratosphere Tower SkyJump Observation Deck",
    },
    {
      title: "Fremont Street",
      description:
        "Historic downtown Las Vegas with live music and the LED canopy.",
      query: "Fremont Street Experience Tour",
    },
    {
      title: "Grand Canyon",
      description:
        "Full-day guided trips to the Grand Canyon from Las Vegas (multiple rim options).",
      query: "Grand Canyon Day Trip from Las Vegas",
      badge: "Best Seller",
    },
    {
      title: "Antelope Canyon",
      description:
        "Guided tours through iconic slot canyons in Arizona — insanely photogenic.",
      query: "Antelope Canyon Tour from Las Vegas",
      badge: "Top Rated",
    },
    {
      title: "Las Vegas Strip",
      description:
        "Guided sightseeing tours along the Strip — great for first-timers.",
      query: "Las Vegas Strip Sightseeing Tour",
    },
    {
      title: "Helicopter Night Flight",
      description:
        "Scenic night helicopter flights over the Las Vegas Strip.",
      query: "Las Vegas Helicopter Night Flight",
      badge: "Bestseller",
    },
    {
      title: "Red Rock Canyon",
      description:
        "Scenic desert landscapes and hiking minutes from Vegas — the best local escape.",
      query: "Red Rock Canyon Tour",
    },
    {
      title: "High Roller Wheel",
      description:
        "Giant observation wheel with sweeping Strip views.",
      query: "High Roller Observation Wheel",
    },
  ],

  "new-orleans": [
    {
      title: "French Quarter Walking Tour",
      description:
        "Explore the historic heart of New Orleans with local guides.",
      query: "French Quarter walking tour",
      badge: "Most Popular",
    },
    {
      title: "Garden District Tour",
      description:
        "Stroll past antebellum mansions and oak-lined streets.",
      query: "Garden District tour",
    },
    {
      title: "Swamp Airboat Tour",
      description:
        "See alligators and wetlands outside the city — classic Louisiana.",
      query: "swamp tour airboat",
      badge: "Top Rated",
    },
    {
      title: "Jackson Square & St. Louis Cathedral",
      description:
        "The iconic heart of the French Quarter — history + architecture.",
      query: "Jackson Square St Louis Cathedral tour",
    },
    {
      title: "Steamboat Natchez Jazz Cruise",
      description:
        "Mississippi River paddlewheel cruise — the signature New Orleans vibe.",
      query: "Steamboat Natchez jazz cruise",
      badge: "Best Seller",
    },
    {
      title: "Ghost / Voodoo / Vampire Tour",
      description:
        "Night tours through the Quarter’s haunted + voodoo legends.",
      query: "ghost voodoo vampire walking tour",
      badge: "Night Pick",
    },
    {
      title: "Food & Cocktail Tour",
      description:
        "Taste the city — gumbo, beignets, pralines, and classic cocktails.",
      query: "food and cocktail tour",
      badge: "High Conversion",
    },
  ],
};

/* ========================================
   Metadata
======================================== */

export async function generateMetadata({
  params,
}: {
  params: { city: string };
}): Promise<Metadata> {
  const cityKey = normalizeCityKey(params.city);
  const pretty = cityKey.replace(/-/g, " ");

  return {
    title: `${pretty} Attractions | Best Things To Do`,
    description: `Discover top attractions and experiences in ${pretty}. Compare tours and tickets with verified providers and real reviews.`,
    openGraph: {
      title: `${pretty} Attractions | Destination Command Center`,
      description: `Top attractions, landmarks, and experiences in ${pretty}.`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${pretty} Attractions | Destination Command Center`,
      description: `Top attractions and experiences in ${pretty}.`,
    },
  };
}

/* ========================================
   Page
======================================== */

export default function AttractionsPage({
  params,
}: {
  params: { city: string };
}) {
  const cityKey = normalizeCityKey(params.city);

  const nodeSlug = getNodeSlugFromCity(cityKey);
  if (!nodeSlug) notFound();

  const node = (nodes as Node[]).find((n) => n.slug === nodeSlug);
  if (!node || node.status !== "active") notFound();

  const cityName = node.name.replace(" Guide", "");
  const attractions = ATTRACTIONS[cityKey] ?? [];

  return (
    <main className="max-w-7xl mx-auto px-6 py-24 space-y-20">
      {/* ================= HERO ================= */}

      <header className="space-y-6 border-b border-zinc-800 pb-12">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-wider text-cyan-400">
            Attractions • Tickets • Tours
          </p>

          <h1 className="text-4xl md:text-6xl font-black">
            Top Attractions in {cityName}
          </h1>
        </div>

        <p className="max-w-3xl text-zinc-400 text-lg leading-relaxed">
          Hand-picked landmarks and “must-do” experiences in {cityName}. Each
          card drops you into a pre-filtered Viator search (affiliate-safe) so
          users land closer to checkout.
        </p>
      </header>

      {/* ================= GRID ================= */}

      {attractions.length > 0 ? (
        <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {attractions.map((a) => {
            const link = viatorSearch(cityName, a.query);

            return (
              <div
                key={a.title}
                className="relative rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-4 hover:bg-zinc-900/80 transition"
              >
                {a.badge && (
                  <div className="absolute -top-3 right-4 bg-cyan-600 text-white text-xs px-3 py-1 rounded-full font-semibold">
                    {a.badge}
                  </div>
                )}

                <h2 className="text-xl font-semibold">{a.title}</h2>

                <p className="text-sm text-zinc-400 leading-relaxed">
                  {a.description}
                </p>

                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  className="inline-block mt-2 w-full text-center text-sm font-semibold text-white bg-cyan-600 hover:bg-cyan-500 px-4 py-3 rounded-xl transition shadow-cyan-600/20 shadow-lg"
                >
                  View Tours & Tickets →
                </a>
              </div>
            );
          })}
        </section>
      ) : (
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-10 text-center space-y-3">
          <h2 className="text-2xl font-bold">Attractions are loading</h2>
          <p className="text-zinc-400">
            We don’t have an attractions catalog for{" "}
            <span className="text-cyan-400 font-semibold">{cityName}</span> yet.
          </p>
        </section>
      )}

      {/* ================= TRUST ================= */}

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center space-y-4">
        <h3 className="text-xl font-semibold">
          Why Book Through Destination Command Center?
        </h3>

        <p className="text-sm text-zinc-400 max-w-2xl mx-auto">
          We optimize the click path: better search intent → better landing page
          → higher conversion. Providers are ranked using availability, price
          stability, and verified review density.
        </p>

        <div className="flex flex-wrap justify-center gap-4 text-sm text-cyan-400">
          <span>✔ Verified Providers</span>
          <span>✔ Free Cancellation</span>
          <span>✔ Secure Booking</span>
          <span>✔ Real Reviews</span>
        </div>
      </section>

      {/* ================= FOOTER ================= */}

      <footer className="pt-10 border-t border-zinc-800 text-sm text-zinc-500 text-center">
        © {new Date().getFullYear()} Destination Command Center
      </footer>
    </main>
  );
}
