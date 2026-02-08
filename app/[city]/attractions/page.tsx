import { notFound } from "next/navigation";
import type { Metadata } from "next";

import nodes from "@/data/nodes.json";
import tours from "@/data/vegas.tours.json";

import { getNodeSlugFromCity } from "@/src/data/city-aliases";

/* ========================================
   Types
======================================== */

interface Node {
  slug: string;
  name: string;
  description: string;
  status: string;
}

interface Tour {
  id: string;
  name: string;
  rating?: number | null;
  reviews?: number | null;
  price_from?: number | null;
  tags: string[];
  booking_url: string;

  dcc: {
    node: string;
  };
}

/* ========================================
   Affiliate Config
======================================== */

const VIATOR_PID = "P00281144";
const VIATOR_MCID = "42383";

/* ========================================
   Helpers
======================================== */

function buildViatorSearch(
  city: string,
  attraction: string
) {
  const q = encodeURIComponent(`${city} ${attraction}`);

  return `https://www.viator.com/search/${encodeURIComponent(
    city
  )}?pid=${VIATOR_PID}&mcid=${VIATOR_MCID}&query=${q}`;
}

/* ========================================
   Core Attractions (Extendable)
======================================== */

const ATTRACTIONS: Record<string, string[]> = {
  "las-vegas": [
    "Hoover Dam Tour",
    "Sphere Experience",
    "Stratosphere Tower",
    "Fremont Street",
    "Grand Canyon Day Trip",
    "Antelope Canyon Tour",
    "Las Vegas Strip Tour",
    "Helicopter Night Flight",
    "Red Rock Canyon",
    "High Roller Observation Wheel",
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
  const city = params.city;

  const title = `${city
    .replace(/-/g, " ")} Attractions Guide | Top Things To Do`;

  const description = `Explore the best attractions, landmarks, and experiences in ${city.replace(
    /-/g,
    " "
  )}. Compare tours, tickets, and guided experiences.`;

  return {
    title,
    description,

    openGraph: {
      title,
      description,
      type: "website",
    },
  };
}

/* ========================================
   Page
======================================== */

export default async function AttractionsPage({
  params,
}: {
  params: { city: string };
}) {
  const { city } = params;

  /* ---------- Resolve Node ---------- */

  const nodeSlug = getNodeSlugFromCity(city);

  if (!nodeSlug) {
    notFound();
  }

  const node = (nodes as Node[]).find(
    (n) => n.slug === nodeSlug
  );

  if (!node || node.status !== "active") {
    notFound();
  }

  const cityName = node.name.replace(" Guide", "");

  /* ---------- Get Attractions ---------- */

  const attractions =
    ATTRACTIONS[city] || [];

  /* ---------- Fallback ---------- */

  if (!attractions.length) {
    return (
      <main className="max-w-4xl mx-auto px-6 py-24">
        <h1 className="text-3xl font-bold">
          Attractions in {cityName}
        </h1>

        <p className="mt-6 text-zinc-500">
          Attractions coming soon.
        </p>
      </main>
    );
  }

  /* ====================================
     Render
  ==================================== */

  return (
    <main className="max-w-7xl mx-auto px-6 py-24 space-y-20">

      {/* ================= HERO ================= */}

      <header className="space-y-6 border-b border-zinc-800 pb-12">

        <h1 className="text-4xl md:text-6xl font-black tracking-tight">
          Top Attractions in {cityName}
        </h1>

        <p className="max-w-3xl text-zinc-400 text-lg leading-relaxed">
          Discover must-see landmarks, iconic experiences,
          and top-rated tours in {cityName}. Compare verified
          providers and book with confidence.
        </p>

      </header>

      {/* ================= GRID ================= */}

      <section className="grid md:grid-cols-2 gap-8">

        {attractions.map((item) => {

          const affiliateUrl = buildViatorSearch(
            cityName,
            item
          );

          return (

            <div
              key={item}
              className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-5 hover:bg-zinc-900/80 transition"
            >

              <h2 className="text-xl font-semibold">
                {item}
              </h2>

              <p className="text-sm text-zinc-400 leading-relaxed">

                Explore guided tours, ticketed experiences,
                and local operators offering {item} in{" "}
                {cityName}.

              </p>

              <a
                href={affiliateUrl}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="inline-block mt-2 text-sm font-semibold text-white bg-cyan-600 hover:bg-cyan-500 px-5 py-3 rounded-xl transition shadow-lg shadow-cyan-600/20"
              >
                View Tours & Tickets →
              </a>

            </div>

          );
        })}

      </section>

      {/* ================= TRUST ================= */}

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-7 text-center space-y-3">

        <h3 className="font-semibold text-lg">
          Why Book Through DCC?
        </h3>

        <p className="text-sm text-zinc-400 max-w-xl mx-auto">

          We analyze pricing, availability, reliability, and
          reviews to surface the highest-performing attraction
          experiences.

        </p>

        <div className="flex justify-center gap-4 text-sm text-cyan-400">

          <span>✔ Verified Providers</span>
          <span>✔ Free Cancellation</span>
          <span>✔ Secure Booking</span>

        </div>

      </section>

      {/* ================= FOOTER ================= */}

      <footer className="pt-10 border-t border-zinc-800 text-sm text-zinc-500 text-center">

        © {new Date().getFullYear()} Destination Command Center

      </footer>

    </main>
  );
}
