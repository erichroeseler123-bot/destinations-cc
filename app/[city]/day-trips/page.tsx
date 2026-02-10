export const dynamicParams = false;



import { notFound } from "next/navigation";
import type { Metadata } from "next";
import CityCrossLinks from "@/components/CityCrossLinks";

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
  region?: string;
}

type DayTrip = {
  title: string;
  description: string;
  query: string;
  badge?: string;
};

type RegionKey =
  | "california"
  | "florida"
  | "arizona"
  | "colorado"
  | "nevada"
  | "texas"
  | "georgia"
  | "louisiana"
  | "tennessee"
  | "washington"
  | "oregon"
  | "massachusetts"
  | "rhode-island"
  | "vermont"
  | "new-hampshire"
  | "minnesota"
  | "wisconsin"
  | "michigan"
  | "ohio"
  | "pennsylvania"
  | "illinois"
  | "alaska"
  | "default";

/* ========================================
   Affiliate
======================================== */

const VIATOR_PID = "P00281144";
const VIATOR_MCID = "42383";

/* ========================================
   Helpers
======================================== */

function normalizeCityKey(city: string) {
  return city.trim().toLowerCase();
}

function titleCaseFromSlug(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function viatorLink(city: string, query: string) {
  const q = encodeURIComponent(`${city} ${query}`);
  const place = encodeURIComponent(city);

  return `https://www.viator.com/search/${place}?pid=${VIATOR_PID}&mcid=${VIATOR_MCID}&query=${q}`;
}

/* ========================================
   Manual Day Trip Catalog (Overrides)
   Only put cities here when you want custom, hand-picked offers.
======================================== */

const DAY_TRIPS: Record<string, DayTrip[]> = {
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
        "Visit the iconic South Rim with scenic overlooks and park access.",
      query: "Grand Canyon South Rim Day Trip from Las Vegas",
      badge: "Best Views",
    },
    {
      title: "Hoover Dam & Boulder City Tour",
      description:
        "Guided tour of Hoover Dam, Boulder City, and Lake Mead.",
      query: "Hoover Dam Tour from Las Vegas",
    },
    {
      title: "Antelope Canyon & Horseshoe Bend",
      description:
        "Small-group trip to Antelope Canyon and Horseshoe Bend.",
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
        "Explore Bryce Canyon’s hoodoos and viewpoints.",
      query: "Bryce Canyon Day Trip from Las Vegas",
    },
  ],
};

/* ========================================
   Region-Smart Defaults (Higher EPC)
   These are used when a city doesn't have manual overrides above.
======================================== */

const REGION_DAY_TRIPS: Record<RegionKey, DayTrip[]> = {
  florida: [
    {
      title: "Everglades & Wildlife Day Trip",
      description: "Airboats, wildlife, and wetlands tours.",
      query: "everglades day trip tour",
      badge: "Best Seller",
    },
    {
      title: "Boat Cruise & Island Excursion",
      description: "Waterfront sightseeing, cruises, and islands.",
      query: "boat cruise island day trip",
    },
    {
      title: "Snorkeling & Water Adventure",
      description: "Reefs, dolphins, and ocean activities.",
      query: "snorkeling day trip",
    },
    {
      title: "Private Day Trip",
      description: "Custom private excursion with a local guide.",
      query: "private day trip",
    },
  ],

  california: [
    {
      title: "Coastal Scenic Day Trip",
      description: "Ocean views, beach towns, and coastal drives.",
      query: "coastal scenic day trip",
      badge: "Top Pick",
    },
    {
      title: "Wine Country Excursion",
      description: "Wine tasting and vineyard day trips.",
      query: "wine tasting day trip",
    },
    {
      title: "National Parks & Nature",
      description: "Parks, hikes, and outdoors escapes.",
      query: "national park day trip",
    },
    {
      title: "Private Day Trip",
      description: "Custom private tour with flexible itinerary.",
      query: "private day trip",
    },
  ],

  nevada: [
    {
      title: "Canyon & Desert Day Trip",
      description: "Epic desert landscapes and scenic viewpoints.",
      query: "canyon desert day trip",
      badge: "High Demand",
    },
    {
      title: "National Parks Excursion",
      description: "Guided tours to nearby parks and trails.",
      query: "national park day trip",
    },
    {
      title: "Private Day Trip",
      description: "Private guide with custom stops.",
      query: "private day trip tour",
    },
    {
      title: "Scenic Highlights Tour",
      description: "A fast way to see the best nearby sights.",
      query: "scenic highlights day trip",
    },
  ],

  arizona: [
    {
      title: "Canyons & Red Rock Excursion",
      description: "Slot canyons, red rocks, and desert views.",
      query: "canyon red rock day trip",
      badge: "Top Rated",
    },
    {
      title: "National Parks Day Trip",
      description: "Guided trips to parks and landmarks.",
      query: "national park day trip",
    },
    {
      title: "Scenic Drives & Viewpoints",
      description: "High-conversion sightseeing itineraries.",
      query: "scenic drive day trip",
    },
    {
      title: "Private Day Trip",
      description: "Private tour with flexible pickup and stops.",
      query: "private day trip",
    },
  ],

  colorado: [
    {
      title: "Rocky Mountain Day Trip",
      description: "Scenic mountain tours, wildlife, and viewpoints.",
      query: "rocky mountain day trip tour",
      badge: "Top Pick",
    },
    {
      title: "Hot Springs Excursion",
      description: "A high-conversion relaxation category.",
      query: "hot springs day trip",
    },
    {
      title: "Red Rocks & Foothills Tour",
      description: "Hikes, overlooks, and outdoor adventure.",
      query: "red rocks foothills day trip",
    },
    {
      title: "Private Day Trip",
      description: "Custom itinerary with a local driver/guide.",
      query: "private day trip",
    },
  ],

  texas: [
    {
      title: "Hill Country / Scenic Day Trip",
      description: "Scenic drives, small towns, and viewpoints.",
      query: "hill country day trip",
      badge: "Popular",
    },
    {
      title: "BBQ & Food Excursion",
      description: "One of the highest converting categories in Texas.",
      query: "bbq food tour day trip",
    },
    {
      title: "Historic Towns & Culture",
      description: "Museums, landmarks, and local history.",
      query: "historic towns day trip",
    },
    {
      title: "Private Day Trip",
      description: "Private guide with flexible stops.",
      query: "private day trip",
    },
  ],

  washington: [
    {
      title: "Mountains & Nature Day Trip",
      description: "National parks, viewpoints, and outdoor escapes.",
      query: "mountain national park day trip",
      badge: "Top Pick",
    },
    {
      title: "Waterfront & Islands",
      description: "Ferries, islands, and coastal sightseeing.",
      query: "island day trip ferry tour",
    },
    {
      title: "Wine & Brewery Excursion",
      description: "Tastings and local favorites.",
      query: "wine brewery day trip",
    },
    {
      title: "Private Day Trip",
      description: "Custom itinerary with a local guide.",
      query: "private day trip",
    },
  ],

  oregon: [
    {
      title: "Waterfalls & Gorge Day Trip",
      description: "Scenic nature, waterfalls, and viewpoints.",
      query: "waterfalls gorge day trip",
      badge: "Top Rated",
    },
    {
      title: "Coastal Scenic Excursion",
      description: "Ocean towns and coastline views.",
      query: "oregon coast day trip",
    },
    {
      title: "Wine Country Day Trip",
      description: "Vineyards and tastings.",
      query: "wine tasting day trip",
    },
    {
      title: "Private Day Trip",
      description: "Custom itinerary with flexible stops.",
      query: "private day trip",
    },
  ],

  alaska: [
    {
      title: "Glacier & Icefield Excursion",
      description: "Glaciers, icefields, and scenic viewpoints.",
      query: "glacier day trip",
      badge: "Iconic",
    },
    {
      title: "Whale Watching & Wildlife",
      description: "Boats, wildlife, and coastal tours.",
      query: "whale watching day trip",
      badge: "Top Rated",
    },
    {
      title: "Fjord & Scenic Cruise",
      description: "High-conversion scenic cruises and boat tours.",
      query: "fjord scenic cruise",
    },
    {
      title: "Private Day Trip",
      description: "Private excursions with flexible timing.",
      query: "private tour day trip",
    },
  ],

  // Everything else falls back to this
  default: [
    {
      title: "Scenic Highlights Tour",
      description: "Visit nearby landmarks and scenic viewpoints.",
      query: "scenic day trip tour",
      badge: "Popular",
    },
    {
      title: "Nature & Wildlife Excursion",
      description: "Explore parks and natural attractions.",
      query: "nature wildlife day trip",
    },
    {
      title: "Historic Towns Tour",
      description: "Discover charming towns and local culture.",
      query: "historic town day trip",
    },
    {
      title: "Private Day Trip",
      description: "Custom private excursion with a local guide.",
      query: "private day trip tour",
    },
  ],

  // These are mapped to default for now (safe)
  georgia: [],
  louisiana: [],
  tennessee: [],
  massachusetts: [],
  "rhode-island": [],
  vermont: [],
  "new-hampshire": [],
  minnesota: [],
  wisconsin: [],
  michigan: [],
  ohio: [],
  pennsylvania: [],
  illinois: [],
};

/* ========================================
   Region Route/Tip Blocks (Optional UX Lift)
======================================== */

function getRegionTips(region: RegionKey) {
  // Keep it short and always true; avoid city-specific claims.
  switch (region) {
    case "florida":
      return {
        routes: [
          "Coast → Everglades / wetlands",
          "Downtown → boat cruise / islands",
          "City → beach escape",
        ],
        tips: [
          "Book earlier for morning wildlife tours",
          "Bring sun protection and water",
          "Check pickup zones before checkout",
        ],
      };

    case "colorado":
      return {
        routes: [
          "City → mountains / viewpoints",
          "City → hot springs",
          "City → foothills / hikes",
        ],
        tips: [
          "Layer clothing — weather changes fast",
          "Altitude can hit first-timers; hydrate",
          "Weekends sell out faster in peak season",
        ],
      };

    case "california":
      return {
        routes: [
          "City → coast / beach towns",
          "City → wine country",
          "City → parks / nature",
        ],
        tips: [
          "Traffic matters — morning departures help",
          "Wine tours often require 21+",
          "Confirm what’s included (fees, tastings)",
        ],
      };

    case "nevada":
    case "arizona":
      return {
        routes: [
          "City → canyons / viewpoints",
          "City → parks / trails",
          "City → scenic drives",
        ],
        tips: [
          "Desert trips need extra water",
          "Check seasonal conditions and closures",
          "Small-group tours cost more but feel better",
        ],
      };

    default:
      return {
        routes: [
          "City → scenic viewpoints",
          "City → nearby nature",
          "City → historic towns",
        ],
        tips: [
          "Book earlier in peak season",
          "Read cancellation policies before checkout",
          "Bring comfortable shoes and water",
        ],
      };
  }
}

/* ========================================
   Metadata
======================================== */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;

  const cityKey = normalizeCityKey(resolvedParams.city);
  const pretty = titleCaseFromSlug(cityKey);

  return {
    title: `${pretty} Day Trips | Best Nearby Excursions`,
    description: `Discover the best day trips from ${pretty}. Explore nearby parks, landmarks, scenic tours, and guided escapes.`,
  };
}

/* ========================================
   Page
======================================== */

export default async function DayTripsPage({
  params,
}: {
  params: Promise<{ city: string }>;
}) {
  const resolvedParams = await params;

  const cityKey = normalizeCityKey(resolvedParams.city);

  const nodeSlug = getNodeSlugFromCity(cityKey);
  if (!nodeSlug) notFound();

  const node = (nodes as Node[]).find((n) => n.slug === nodeSlug);
  if (!node || node.status !== "active") notFound();

  const cityName = node.name.replace(" Guide", "");

  const region = (node.region as RegionKey) || "default";

  // Offer priority: manual overrides → region defaults → global default
  const offers =
    DAY_TRIPS[cityKey] ??
    (REGION_DAY_TRIPS[region]?.length ? REGION_DAY_TRIPS[region] : undefined) ??
    REGION_DAY_TRIPS["default"];

  const tips = getRegionTips(region);

  return (
    <main className="max-w-7xl mx-auto px-6 py-24 space-y-20">
      {/* ================= HERO ================= */}

      <header className="space-y-8 border-b border-zinc-800 pb-14">
        <h1 className="text-4xl md:text-6xl font-black leading-tight">
          Best Day Trips from {cityName}
        </h1>

        <p className="max-w-3xl text-zinc-400 text-lg">
          Escape {cityName} for nearby adventures. Compare verified excursions,
          scenic tours, and guided escapes — optimized for value and real
          traveler reviews.
        </p>

        <div className="flex flex-wrap gap-4 text-sm text-emerald-400 font-medium">
          <span>✔ Hotel Pickup</span>
          <span>✔ Free Cancellation</span>
          <span>✔ Verified Operators</span>
          <span>✔ Real Reviews</span>
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
              {o.badge && (
                <span className="absolute top-4 right-4 text-xs font-bold uppercase bg-emerald-500 text-black px-3 py-1 rounded-full">
                  {o.badge}
                </span>
              )}

              <h2 className="text-xl font-semibold">{o.title}</h2>

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

      {/* ================= INFO (REGION SMART) ================= */}

      <section className="grid md:grid-cols-2 gap-10">
        <div className="space-y-4">
          <h3 className="text-2xl font-semibold">
            Popular Day Trip Routes
          </h3>

          <ul className="text-sm text-zinc-400 space-y-3 list-disc list-inside">
            {tips.routes.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>

        <div className="space-y-4">
          <h3 className="text-2xl font-semibold">
            Booking Tips
          </h3>

          <ul className="text-sm text-zinc-400 space-y-3 list-disc list-inside">
            {tips.tips.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* ================= TRUST ================= */}

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-10 text-center space-y-5">
        <h3 className="text-xl font-semibold">
          Why Book Day Trips Through DCC?
        </h3>

        <p className="text-sm text-zinc-400 max-w-2xl mx-auto">
          We optimize the click path and highlight reliable operators to help
          travelers book faster and with confidence.
        </p>

        <div className="flex flex-wrap justify-center gap-4 text-sm text-emerald-400">
          <span>✔ Transparent Pricing</span>
          <span>✔ Verified Reviews</span>
          <span>✔ Real Availability</span>
          <span>✔ Fast Checkout</span>
        </div>
      </section>

      {/* ================= CROSS LINKS ================= */}

      <CityCrossLinks city={cityKey} cityName={cityName} />

      {/* ================= FOOTER ================= */}

      <footer className="pt-12 border-t border-zinc-800 text-center text-sm text-zinc-500">
        © {new Date().getFullYear()} Destination Command Center
      </footer>
    </main>
  );
}
