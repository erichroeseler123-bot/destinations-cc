export const dynamicParams = false;



import { notFound } from "next/navigation";
import type { Metadata } from "next";

import nodes from "@/data/nodes.json";
import { getNodeSlugFromCity } from "@/src/data/city-aliases";

import aliases from "@/data/city-aliases.json";


export async function generateStaticParams() {
  return Object.keys(aliases).map((city) => ({ city }));
}


/* ========================================
   Types
======================================== */

interface Node {
  slug: string;
  name: string;
  status: string;
}

/* ========================================
   Affiliate
======================================== */

const VIATOR_PID = "P00281144";
const VIATOR_MCID = "42383";

/* ========================================
   Helpers
======================================== */

function viatorLink(city: string, query: string) {
  const q = encodeURIComponent(`${city} ${query}`);

  return `https://www.viator.com/search/${encodeURIComponent(
    city
  )}?pid=${VIATOR_PID}&mcid=${VIATOR_MCID}&query=${q}`;
}

/* ========================================
   Shows Catalog
======================================== */

const SHOWS: Record<
  string,
  {
    title: string;
    description: string;
    query: string;
    category: string;
    badge?: string;
  }[]
> = {
  "las-vegas": [
    {
      title: "Cirque du Soleil – O",
      description:
        "Iconic water-based acrobatics at the Bellagio. One of the most popular shows in Las Vegas.",
      query: "Cirque du Soleil O Las Vegas tickets",
      category: "Cirque du Soleil",
      badge: "Best Seller",
    },
    {
      title: "Cirque du Soleil – KA",
      description:
        "Epic martial-arts inspired production with massive rotating stage at MGM Grand.",
      query: "Cirque du Soleil KA Las Vegas tickets",
      category: "Cirque du Soleil",
    },
    {
      title: "Cirque du Soleil – Michael Jackson ONE",
      description:
        "High-energy tribute show celebrating the music and legacy of Michael Jackson.",
      query: "Michael Jackson ONE Las Vegas tickets",
      category: "Cirque du Soleil",
      badge: "Top Rated",
    },
    {
      title: "Residency Headliner Shows",
      description:
        "See world-famous artists performing limited-run residencies on the Strip.",
      query: "Las Vegas residency concert tickets",
      category: "Concert Residencies",
    },
    {
      title: "Magic Shows",
      description:
        "World-class illusionists and mind-bending magic performances.",
      query: "Las Vegas magic show tickets",
      category: "Magic",
    },
    {
      title: "Comedy Shows",
      description:
        "Stand-up comedy and improv from top touring comedians.",
      query: "Las Vegas comedy show tickets",
      category: "Comedy",
    },
    {
      title: "Adult & Variety Shows",
      description:
        "Classic Vegas-style variety, burlesque, and adult-themed productions.",
      query: "Las Vegas adult variety shows tickets",
      category: "Variety",
    },
  ],
};

/* ========================================
   Metadata
======================================== */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;

  const city = resolvedParams.city.replace(/-/g, " ");

  return {
    title: `${city} Shows | Cirque du Soleil, Concerts & Tickets`,
    description: `Discover the best shows in ${city}. Compare Cirque du Soleil, residencies, comedy, magic, and live performances.`,
  };
}

/* ========================================
   Page
======================================== */

export default async function ShowsPage({
  params,
}: {
  params: Promise<{ city: string }>;
}) {
  const resolvedParams = await params;

  const { city } = resolvedParams;

  const nodeSlug = getNodeSlugFromCity(city);
  if (!nodeSlug) notFound();

  const node = (nodes as Node[]).find(
    (n) => n.slug === nodeSlug
  );

  if (!node || node.status !== "active") notFound();

  const cityName = node.name.replace(" Guide", "");
  const shows = SHOWS[city] || [];

  return (
    <main className="max-w-7xl mx-auto px-6 py-24 space-y-20">

      {/* ================= HERO ================= */}

      <header className="space-y-8 border-b border-zinc-800 pb-14">

        <h1 className="text-4xl md:text-6xl font-black leading-tight">
          Best Shows in {cityName}
        </h1>

        <p className="max-w-3xl text-zinc-400 text-lg">
          From Cirque du Soleil and concert residencies to
          comedy, magic, and classic Vegas productions.
          Compare top-rated shows and book verified tickets.
        </p>

        <div className="flex flex-wrap gap-4 text-sm text-emerald-400 font-medium">
          <span>✔ Official Tickets</span>
          <span>✔ Instant Confirmation</span>
          <span>✔ Seating Options</span>
          <span>✔ Trusted Vendors</span>
        </div>

      </header>

      {/* ================= SHOW GRID ================= */}

      <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">

        {shows.map((s) => {

          const link = viatorLink(cityName, s.query);

          return (

            <div
              key={s.title}
              className="relative rounded-2xl border border-zinc-800 bg-zinc-900/60 p-7 space-y-4 hover:bg-zinc-900 transition"
            >

              {s.badge && (
                <span className="absolute top-4 right-4 text-xs font-bold uppercase bg-emerald-500 text-black px-3 py-1 rounded-full">
                  {s.badge}
                </span>
              )}

              <div className="text-xs uppercase tracking-wide text-zinc-500">
                {s.category}
              </div>

              <h2 className="text-xl font-semibold">
                {s.title}
              </h2>

              <p className="text-sm text-zinc-400 leading-relaxed">
                {s.description}
              </p>

              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="block mt-3 w-full text-center text-sm font-semibold text-black bg-emerald-500 hover:bg-emerald-400 px-4 py-3 rounded-xl transition shadow-lg shadow-emerald-600/30"
              >
                View Tickets →
              </a>

            </div>

          );

        })}

      </section>

      {/* ================= TIPS ================= */}

      <section className="grid md:grid-cols-2 gap-10">

        <div className="space-y-4">
          <h3 className="text-2xl font-semibold">
            How to Choose the Right Show
          </h3>

          <ul className="text-sm text-zinc-400 space-y-3 list-disc list-inside">
            <li>Cirque du Soleil = safe bet for first-timers</li>
            <li>Residencies sell out quickly on weekends</li>
            <li>Midweek shows often have better seating deals</li>
            <li>Adult shows are 18+ only</li>
          </ul>
        </div>

        <div className="space-y-4">
          <h3 className="text-2xl font-semibold">
            Seating & Timing Tips
          </h3>

          <ul className="text-sm text-zinc-400 space-y-3 list-disc list-inside">
            <li>Center sections offer best sightlines</li>
            <li>Arrive 30 minutes early</li>
            <li>Early shows pair well with dinner plans</li>
            <li>Late shows often cost less</li>
          </ul>
        </div>

      </section>

      {/* ================= TRUST ================= */}

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-10 text-center space-y-5">

        <h3 className="text-xl font-semibold">
          Why Book Shows Through DCC?
        </h3>

        <p className="text-sm text-zinc-400 max-w-2xl mx-auto">
          We surface the most reliable ticket providers,
          compare pricing tiers, and eliminate low-quality
          listings so you can book with confidence.
        </p>

        <div className="flex flex-wrap justify-center gap-4 text-sm text-emerald-400">
          <span>✔ Verified Sellers</span>
          <span>✔ No Hidden Fees</span>
          <span>✔ Real Availability</span>
          <span>✔ Secure Checkout</span>
        </div>

      </section>

      {/* ================= FOOTER ================= */}

      <footer className="pt-12 border-t border-zinc-800 text-center text-sm text-zinc-500">
        © {new Date().getFullYear()} Destination Command Center
      </footer>

    </main>
  );
}
