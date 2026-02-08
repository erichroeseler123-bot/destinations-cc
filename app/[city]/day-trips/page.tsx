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
   Day Trip Offers
======================================== */

const DAY_TRIPS: Record<
  string,
  {
    title: string;
    description: string;
    query: string;
    badge?: string;
  }[]
> = {
  "las-vegas": [
    {
      title: "Grand Canyon West Rim Bus Tour",
      description:
        "Full-day coach tour to Grand Canyon West with Skywalk option and lunch.",
      query: "Grand Canyon West Rim Bus Tour from Las Vegas",
      badge: "Most Popular",
    },
    {
      title: "Grand Canyon South Rim Day Trip",
      description:
        "Visit the iconic South Rim with scenic overlooks and national park access.",
      query: "Grand Canyon South Rim Day Trip from Las Vegas",
      badge: "Best Views",
    },
    {
      title: "Hoover Dam & Boulder City Tour",
      description:
        "Half-day guided tour of Hoover Dam, Boulder City, and Lake Mead.",
      query: "Hoover Dam Tour from Las Vegas",
    },
    {
      title: "Antelope Canyon & Horseshoe Bend",
      description:
        "Small-group trip to Antelope Canyon and Horseshoe Bend in Arizona.",
      query: "Antelope Canyon Horseshoe Bend Tour from Las Vegas",
      badge: "Top Rated",
    },
    {
      title: "Zion National Park Day Trip",
      description:
        "Scenic drive and guided hike through Zion National Park.",
      query: "Zion National Park Day Trip from Las Vegas",
    },
    {
      title: "Bryce Canyon Day Tour",
      description:
        "Explore Bryce Canyon’s hoodoos and panoramic viewpoints.",
      query: "Bryce Canyon Day Trip from Las Vegas",
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
    title: `${city} Day Trips | Grand Canyon, Hoover Dam & Parks`,
    description: `Discover the best day trips from ${city}. Compare Grand Canyon, Hoover Dam, Antelope Canyon, and national park tours.`,
  };
}

/* ========================================
   Page
======================================== */

export default function DayTripsPage({
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

  const offers = DAY_TRIPS[city] || [];

  return (
    <main className="max-w-7xl mx-auto px-6 py-24 space-y-20">

      {/* ================= HERO ================= */}

      <header className="space-y-8 border-b border-zinc-800 pb-14">

        <h1 className="text-4xl md:text-6xl font-black leading-tight">
          Best Day Trips from {cityName}
        </h1>

        <p className="max-w-3xl text-zinc-400 text-lg">

          Escape {cityName} for unforgettable day trips to
          the Grand Canyon, Hoover Dam, Antelope Canyon, and
          Southwest national parks. Compare verified tours
          and book with confidence.

        </p>

        <div className="flex flex-wrap gap-4 text-sm text-emerald-400 font-medium">

          <span>✔ Hotel Pickup</span>
          <span>✔ Park Fees Included</span>
          <span>✔ Expert Guides</span>
          <span>✔ Free Cancellation</span>

        </div>

      </header>

      {/* ================= OFFERS ================= */}

      <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">

        {offers.map((o) => {

          const link = viatorLink(cityName, o.query);

          return (

            <div
              key={o.title}
              className="relative rounded-2xl border border-zinc-800 bg-zinc-900/60 p-7 space-y-4 hover:bg-zinc-900 transition"
            >

              {/* Badge */}
              {o.badge && (

                <span className="absolute top-4 right-4 text-xs font-bold uppercase bg-emerald-500 text-black px-3 py-1 rounded-full">

                  {o.badge}

                </span>

              )}

              <h2 className="text-xl font-semibold">
                {o.title}
              </h2>

              <p className="text-sm text-zinc-400 leading-relaxed">
                {o.description}
              </p>

              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="block mt-3 w-full text-center text-sm font-semibold text-black bg-emerald-500 hover:bg-emerald-400 px-4 py-3 rounded-xl transition shadow-lg shadow-emerald-600/30"
              >
                View Tour Options →
              </a>

            </div>

          );

        })}

      </section>

      {/* ================= INFO ================= */}

      <section className="grid md:grid-cols-2 gap-10">

        <div className="space-y-4">

          <h3 className="text-2xl font-semibold">
            Popular Day Trip Routes
          </h3>

          <ul className="text-sm text-zinc-400 space-y-3 list-disc list-inside">

            <li>Las Vegas → Grand Canyon West (4–5 hrs RT)</li>
            <li>Las Vegas → South Rim (12–14 hrs RT)</li>
            <li>Las Vegas → Zion (10 hrs RT)</li>
            <li>Las Vegas → Antelope Canyon (13 hrs RT)</li>
            <li>Las Vegas → Bryce Canyon (13 hrs RT)</li>

          </ul>

        </div>

        <div className="space-y-4">

          <h3 className="text-2xl font-semibold">
            Booking Tips
          </h3>

          <ul className="text-sm text-zinc-400 space-y-3 list-disc list-inside">

            <li>South Rim trips require early departures</li>
            <li>West Rim tours are shorter and easier</li>
            <li>Small-group tours cost more but deliver better experience</li>
            <li>Check weather in winter months</li>
            <li>Bring water and sunscreen</li>

          </ul>

        </div>

      </section>

      {/* ================= TRUST ================= */}

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-10 text-center space-y-5">

        <h3 className="text-xl font-semibold">
          Why Book Day Trips Through DCC?
        </h3>

        <p className="text-sm text-zinc-400 max-w-2xl mx-auto">

          We compare operators, pricing models, group sizes,
          and cancellation policies to highlight the most
          reliable and highest-value excursions.

        </p>

        <div className="flex flex-wrap justify-center gap-4 text-sm text-emerald-400">

          <span>✔ No Middlemen</span>
          <span>✔ Verified Reviews</span>
          <span>✔ Transparent Pricing</span>
          <span>✔ Real Availability</span>

        </div>

      </section>

      {/* ================= FOOTER ================= */}

      <footer className="pt-12 border-t border-zinc-800 text-center text-sm text-zinc-500">

        © {new Date().getFullYear()} Destination Command Center

      </footer>

    </main>
  );
}
