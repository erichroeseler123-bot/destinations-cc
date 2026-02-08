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
  description: string;
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

function viatorSearch(city: string, topic: string) {
  const q = encodeURIComponent(`${city} ${topic}`);

  return `https://www.viator.com/search/${encodeURIComponent(
    city
  )}?pid=${VIATOR_PID}&mcid=${VIATOR_MCID}&query=${q}`;
}

/* ========================================
   Attractions
======================================== */

const ATTRACTIONS: Record<
  string,
  {
    title: string;
    description: string;
    query: string;
  }[]
> = {
  "las-vegas": [
    {
      title: "Hoover Dam",
      description:
        "Visit one of America’s greatest engineering landmarks just outside Las Vegas.",
      query: "Hoover Dam Tour",
    },
    {
      title: "Sphere Experience",
      description:
        "Immersive concerts and digital experiences inside the world’s largest spherical venue.",
      query: "Las Vegas Sphere Experience",
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
        "Historic downtown Las Vegas with live music and LED canopy.",
      query: "Fremont Street Experience Tour",
    },
    {
      title: "Grand Canyon",
      description:
        "Full-day guided trips to the Grand Canyon from Las Vegas.",
      query: "Grand Canyon Day Trip from Las Vegas",
    },
    {
      title: "Antelope Canyon",
      description:
        "Guided tours through iconic slot canyons in Arizona.",
      query: "Antelope Canyon Tour from Las Vegas",
    },
    {
      title: "Las Vegas Strip",
      description:
        "Guided sightseeing tours along the Strip and downtown.",
      query: "Las Vegas Strip Sightseeing Tour",
    },
    {
      title: "Helicopter Night Flight",
      description:
        "Scenic night helicopter flights over the Las Vegas Strip.",
      query: "Las Vegas Helicopter Night Flight",
    },
    {
      title: "Red Rock Canyon",
      description:
        "Scenic desert landscapes and hiking minutes from Vegas.",
      query: "Red Rock Canyon Tour",
    },
    {
      title: "High Roller Wheel",
      description:
        "Giant observation wheel overlooking the Strip.",
      query: "High Roller Observation Wheel",
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
  const city = params.city.replace(/-/g, " ");

  return {
    title: `${city} Attractions Guide | Best Things To Do`,
    description: `Discover the top attractions, landmarks, and experiences in ${city}. Compare tours, tickets, and guided trips.`,
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
  const { city } = params;

  const nodeSlug = getNodeSlugFromCity(city);

  if (!nodeSlug) notFound();

  const node = (nodes as Node[]).find(
    (n) => n.slug === nodeSlug
  );

  if (!node || node.status !== "active") notFound();

  const cityName = node.name.replace(" Guide", "");

  const attractions = ATTRACTIONS[city] || [];

  return (
    <main className="max-w-7xl mx-auto px-6 py-24 space-y-20">

      {/* ================= HERO ================= */}

      <header className="space-y-6 border-b border-zinc-800 pb-12">

        <h1 className="text-4xl md:text-6xl font-black">
          Top Attractions in {cityName}
        </h1>

        <p className="max-w-3xl text-zinc-400 text-lg">
          Explore iconic landmarks, guided tours, and must-see
          experiences in {cityName}. Compare verified providers
          and book with confidence.
        </p>

      </header>

      {/* ================= GRID ================= */}

      <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">

        {attractions.map((a) => {

          const link = viatorSearch(
            cityName,
            a.query
          );

          return (

            <div
              key={a.title}
              className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-4 hover:bg-zinc-900/80 transition"
            >

              <h2 className="text-xl font-semibold">
                {a.title}
              </h2>

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

      {/* ================= TRUST ================= */}

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center space-y-4">

        <h3 className="text-xl font-semibold">
          Why Book Through Destination Command Center?
        </h3>

        <p className="text-sm text-zinc-400 max-w-2xl mx-auto">

          We analyze availability, pricing trends, provider
          reliability, and verified reviews to surface the
          highest-performing experiences.

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
