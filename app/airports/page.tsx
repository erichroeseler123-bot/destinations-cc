import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/app/components/dcc/JsonLd";
import StatGrid from "@/app/components/StatGrid";
import CinematicBackdrop from "@/app/components/dcc/CinematicBackdrop";
import RouteHeroMark from "@/app/components/dcc/RouteHeroMark";
import { getEffectiveAirports } from "@/lib/dcc/airports";
import { buildArticleJsonLd, buildBreadcrumbJsonLd } from "@/lib/dcc/jsonld";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Airport Guides and Transfer Planning | Destination Command Center",
  description:
    "Compare U.S. airports with transfer-first guidance into cities, cruise ports, and logistics-heavy arrival lanes.",
  keywords: [
    "airport transfer guides",
    "airport to port planning",
    "airport arrival logistics",
    "airport guides usa",
    "airport to city transfer",
  ],
  alternates: { canonical: "/airports" },
};

export default function AirportsIndexPage() {
  const airports = getEffectiveAirports();
  const cityCount = new Set(airports.map((airport) => airport.cityName)).size;
  const cruiseLinkedCount = airports.filter((airport) => airport.nearbyCruisePortSlugs?.length).length;

  return (
    <main className="relative min-h-screen overflow-hidden bg-zinc-950 text-white">
      <CinematicBackdrop />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            buildArticleJsonLd({
              path: "/airports",
              headline: "Airport Guides and Transfer Planning",
              description:
                "Compare U.S. airports with transfer-first guidance into cities, cruise ports, and logistics-heavy arrival lanes.",
            }),
            buildBreadcrumbJsonLd([
              { name: "Home", item: "/" },
              { name: "Airports", item: "/airports" },
            ]),
          ],
        }}
      />
      <div className="relative max-w-6xl mx-auto px-6 py-16 space-y-10">
        <header className="space-y-3">
          <RouteHeroMark eyebrow="Destination Command Center" title="AIRPORTS" tone="cyan" />
          <p className="text-xs uppercase tracking-wider text-zinc-500">Arrival-first planning</p>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight">Airport guides and transfer planning</h1>
          <p className="max-w-3xl text-zinc-300">
            Use this hub when the real trip problem starts at the airport: city arrivals, cruise embarkation buffers, venue transfers, and logistics-heavy first-day routing.
          </p>
        </header>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
          <h2 className="text-2xl font-bold">Airport network snapshot</h2>
          <StatGrid
            items={[
              { label: "Airport guides", value: airports.length },
              { label: "Cities covered", value: cityCount },
              { label: "Cruise-linked airports", value: cruiseLinkedCount },
              { label: "Main use", value: "Transfers • Buffers • Arrival routing" },
            ]}
          />
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-bold">How to use the airport hub</h2>
          <div className="mt-4 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-4 text-sm leading-7 text-zinc-300">
              <p>
                Airport pages work best when the first real question is not the attraction or tour itself, but how the traveler gets into the city, port, or venue corridor without breaking the day.
              </p>
              <p>
                This hub is designed to route people into the right city guide, cruise-port guide, or transportation surface after the arrival problem is understood clearly.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <div className="text-xs uppercase tracking-[0.18em] text-cyan-300">Best next clicks</div>
              <div className="mt-4 grid gap-3">
                <Link href="/ports" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm hover:bg-white/10">Cruise ports</Link>
                <Link href="/cities" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm hover:bg-white/10">Cities directory</Link>
                <Link href="/transportation" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm hover:bg-white/10">Transportation</Link>
                <Link href="/cruises" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm hover:bg-white/10">Cruise explorer</Link>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {airports.map((airport) => (
            <Link
              key={airport.slug}
              href={`/airports/${airport.slug}`}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10"
            >
              <div className="text-xs font-black uppercase tracking-[0.22em] text-cyan-200">{airport.iata}</div>
              <h2 className="mt-3 text-2xl font-black tracking-tight">{airport.name}</h2>
              <p className="mt-2 text-sm text-zinc-400">{airport.cityName}, {airport.state}</p>
              <p className="mt-4 text-sm leading-6 text-zinc-300">{airport.summary}</p>
              <div className="mt-5 text-sm font-bold text-cyan-200">Open airport guide →</div>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
