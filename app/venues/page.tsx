import type { Metadata } from "next";
import Link from "next/link";
import { SPORTS_VENUES_CONFIG, getSportsVenuesByCity } from "@/src/data/sports-venues-config";

const PAGE_URL = "https://destinationcommandcenter.com/venues";
const LAST_UPDATED = "2026-03-12";

const CITY_ORDER = [
  { slug: "las-vegas", label: "Las Vegas" },
  { slug: "miami", label: "Miami" },
  { slug: "orlando", label: "Orlando" },
  { slug: "new-orleans", label: "New Orleans" },
];

export const metadata: Metadata = {
  title: "Venue Guides and Ticket Nodes | Destination Command Center",
  description:
    "Browse venue authority pages for stadiums and arenas connected to DCC sports team nodes, city hubs, and ticket discovery.",
  alternates: { canonical: "/venues" },
};

function JsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": PAGE_URL,
        url: PAGE_URL,
        name: "Venue Guides and Ticket Nodes",
        description: "Venue authority hub for stadiums and arenas in the DCC sports graph.",
        dateModified: LAST_UPDATED,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://destinationcommandcenter.com/" },
          { "@type": "ListItem", position: 2, name: "Venues", item: PAGE_URL },
        ],
      },
    ],
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export default function VenuesHubPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <JsonLd />
      <div className="mx-auto max-w-6xl px-6 py-16 space-y-8">
        <header className="space-y-4">
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">DCC Venue Layer</p>
          <h1 className="text-4xl font-black tracking-tight md:text-6xl">Venue guides and ticket nodes</h1>
          <p className="max-w-3xl text-zinc-300">
            Venue pages connect team nodes, city hubs, and live ticket discovery into one authority layer. Use them for
            stadium and arena context, primary teams, and event-intent routing.
          </p>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Last updated: March 2026</p>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Node count</p>
            <p className="mt-2 text-3xl font-black">{SPORTS_VENUES_CONFIG.length}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Covered cities</p>
            <p className="mt-2 text-3xl font-black">{CITY_ORDER.length}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Primary use</p>
            <p className="mt-2 text-lg font-semibold">Sports venues, arenas, and ticket intent</p>
          </div>
        </section>

        {CITY_ORDER.map((city) => {
          const venues = getSportsVenuesByCity(city.slug);
          if (venues.length === 0) return null;
          return (
            <section key={city.slug} className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">{city.label}</p>
                  <h2 className="mt-2 text-2xl font-bold">{city.label} venue nodes</h2>
                </div>
                <Link
                  href={`/${city.slug === "las-vegas" ? "vegas" : city.slug}`}
                  className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-200 hover:bg-white/10"
                >
                  Open {city.label} hub
                </Link>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {venues.map((venue) => (
                  <Link
                    key={venue.slug}
                    href={`/venues/${venue.slug}`}
                    className="rounded-2xl border border-white/10 bg-black/20 p-4 hover:bg-white/10"
                  >
                    <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                      {venue.sportsLeagues.map((league) => league.toUpperCase()).join(" • ")}
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-white">{venue.name}</h3>
                    <p className="mt-2 text-sm text-zinc-300">{venue.addressNote}</p>
                    <p className="mt-3 text-sm text-zinc-400 line-clamp-3">{venue.description}</p>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
