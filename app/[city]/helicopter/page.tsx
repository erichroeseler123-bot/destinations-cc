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
   Helicopter Offers
======================================== */

const HELI_OFFERS: Record<
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
      title: "Las Vegas Strip Night Flight",
      description:
        "Fly over the Strip at night with neon-lit views of Bellagio, Caesars, and downtown.",
      query: "Las Vegas Strip Helicopter Night Flight",
      badge: "Most Popular",
    },
    {
      title: "Grand Canyon Helicopter Tour",
      description:
        "Full aerial tour to the Grand Canyon with optional landing and champagne.",
      query: "Las Vegas Grand Canyon Helicopter Tour",
      badge: "Best Value",
    },
    {
      title: "Daytime Strip Flight",
      description:
        "Clear daytime views of the Strip, Hoover Dam, and desert landscape.",
      query: "Las Vegas Strip Helicopter Day Tour",
    },
    {
      title: "Private Helicopter Charter",
      description:
        "Exclusive private helicopter experience for couples and groups.",
      query: "Private Helicopter Tour Las Vegas",
      badge: "VIP",
    },
    {
      title: "Sunset Helicopter Tour",
      description:
        "Golden-hour flight with sunset views over the Strip and Red Rock Canyon.",
      query: "Las Vegas Sunset Helicopter Tour",
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
    title: `${city} Helicopter Tours | Strip & Grand Canyon Flights`,
    description: `Compare the best helicopter tours in ${city}. Night flights, Grand Canyon trips, private charters, and scenic aerial experiences.`,
  };
}

/* ========================================
   Page
======================================== */

export default function HelicopterPage({
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

  const offers = HELI_OFFERS[city] || [];

  return (
    <main className="max-w-7xl mx-auto px-6 py-24 space-y-20">

      {/* ================= HERO ================= */}

      <header className="space-y-8 border-b border-zinc-800 pb-14">

        <h1 className="text-4xl md:text-6xl font-black leading-tight">
          {cityName} Helicopter Tours
        </h1>

        <p className="max-w-3xl text-zinc-400 text-lg">

          Experience {cityName} from the air with luxury helicopter
          flights over the Strip, Grand Canyon, and desert landmarks.
          Compare top-rated operators and book securely.

        </p>

        <div className="flex flex-wrap gap-4 text-sm text-cyan-400 font-medium">

          <span>✔ Hotel Pickup</span>
          <span>✔ Free Cancellation</span>
          <span>✔ FAA Certified Pilots</span>
          <span>✔ Verified Reviews</span>

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

                <span className="absolute top-4 right-4 text-xs font-bold uppercase bg-cyan-600 text-black px-3 py-1 rounded-full">

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
                className="block mt-3 w-full text-center text-sm font-semibold text-black bg-cyan-500 hover:bg-cyan-400 px-4 py-3 rounded-xl transition shadow-lg shadow-cyan-600/30"
              >
                Check Availability →
              </a>

            </div>

          );

        })}

      </section>

      {/* ================= INFO ================= */}

      <section className="grid md:grid-cols-2 gap-10">

        <div className="space-y-4">

          <h3 className="text-2xl font-semibold">
            What to Expect
          </h3>

          <p className="text-zinc-400 text-sm leading-relaxed">

            Most helicopter tours include hotel pickup, safety
            briefing, and professional narration. Flights range
            from 12-minute Strip tours to full-day Grand Canyon
            excursions.

          </p>

          <ul className="text-sm text-zinc-400 space-y-2 list-disc list-inside">

            <li>Noise-canceling headsets</li>
            <li>Climate-controlled cabins</li>
            <li>Window seating guaranteed</li>
            <li>Photo opportunities</li>

          </ul>

        </div>

        <div className="space-y-4">

          <h3 className="text-2xl font-semibold">
            Booking Tips
          </h3>

          <ul className="text-sm text-zinc-400 space-y-3 list-disc list-inside">

            <li>Night flights sell out first (book early)</li>
            <li>Sunset tours offer best lighting</li>
            <li>Weekend slots fill fast</li>
            <li>Weight limits apply (check details)</li>
            <li>Bring ID for check-in</li>

          </ul>

        </div>

      </section>

      {/* ================= TRUST ================= */}

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-10 text-center space-y-5">

        <h3 className="text-xl font-semibold">
          Why Book With Destination Command Center?
        </h3>

        <p className="text-sm text-zinc-400 max-w-2xl mx-auto">

          We analyze pricing trends, cancellation rates, operator
          reliability, and customer reviews to surface the
          highest-performing helicopter experiences.

        </p>

        <div className="flex flex-wrap justify-center gap-4 text-sm text-cyan-400">

          <span>✔ No Hidden Fees</span>
          <span>✔ Verified Operators</span>
          <span>✔ Secure Checkout</span>
          <span>✔ Live Availability</span>

        </div>

      </section>

      {/* ================= FOOTER ================= */}

      <footer className="pt-12 border-t border-zinc-800 text-center text-sm text-zinc-500">

        © {new Date().getFullYear()} Destination Command Center

      </footer>

    </main>
  );
}
