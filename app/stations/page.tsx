import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/app/components/dcc/JsonLd";
import StatGrid from "@/app/components/StatGrid";
import CinematicBackdrop from "@/app/components/dcc/CinematicBackdrop";
import RouteHeroMark from "@/app/components/dcc/RouteHeroMark";
import { getEffectiveStations, getStationsBySubtype, getStationSubtypeLabel } from "@/lib/dcc/stations";
import { buildArticleJsonLd, buildBreadcrumbJsonLd } from "@/lib/dcc/jsonld";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Train and Bus Station Guides | Destination Command Center",
  description:
    "Compare U.S. train stations and bus stations with transfer-first guidance into cities, cruise ports, and logistics-heavy venue lanes.",
  keywords: [
    "train station guides usa",
    "bus station guides usa",
    "station to port planning",
    "station to venue planning",
    "transit arrival logistics",
  ],
  alternates: { canonical: "/stations" },
};

export default function StationsIndexPage() {
  const stations = getEffectiveStations();
  const cityCount = new Set(stations.map((station) => station.cityName)).size;
  const trainCount = getStationsBySubtype("train-station").length;
  const busCount = getStationsBySubtype("bus-station").length;

  return (
    <main className="relative min-h-screen overflow-hidden bg-zinc-950 text-white">
      <CinematicBackdrop />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            buildArticleJsonLd({
              path: "/stations",
              headline: "Train and Bus Station Guides",
              description:
                "Compare U.S. train stations and bus stations with transfer-first guidance into cities, cruise ports, and logistics-heavy venue lanes.",
            }),
            buildBreadcrumbJsonLd([
              { name: "Home", item: "/" },
              { name: "Stations", item: "/stations" },
            ]),
          ],
        }}
      />
      <div className="relative mx-auto max-w-6xl space-y-10 px-6 py-16">
        <header className="space-y-3">
          <RouteHeroMark eyebrow="Destination Command Center" title="STATIONS" tone="cyan" />
          <p className="text-xs uppercase tracking-wider text-zinc-500">Train and bus arrival planning</p>
          <h1 className="text-4xl font-black tracking-tight md:text-6xl">Station guides and transit-first routing</h1>
          <p className="max-w-3xl text-zinc-300">
            Use this hub when the trip starts at a train station or bus station and the real question is how to route into the city, port, or venue corridor without losing the day.
          </p>
        </header>

        <section className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-bold">Station network snapshot</h2>
          <StatGrid
            items={[
              { label: "Station guides", value: stations.length },
              { label: "Cities covered", value: cityCount },
              { label: getStationSubtypeLabel("train-station"), value: trainCount },
              { label: getStationSubtypeLabel("bus-station"), value: busCount },
            ]}
          />
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-bold">How to use the station hub</h2>
          <div className="mt-4 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-4 text-sm leading-7 text-zinc-300">
              <p>
                Station pages work best when the traveler is already rail-first or bus-first and the next real decision is transfer logic: downtown staging, port timing, venue movement, or which side of a city should anchor the trip.
              </p>
              <p>
                DCC treats stations as trip-shaping arrival surfaces, not generic transit blurbs. That is what makes long-tail station pages useful instead of thin.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <div className="text-xs uppercase tracking-[0.18em] text-cyan-300">Best next clicks</div>
              <div className="mt-4 grid gap-3">
                <Link href="/airports" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm hover:bg-white/10">
                  Airports
                </Link>
                <Link href="/ports" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm hover:bg-white/10">
                  Ports
                </Link>
                <Link href="/cities" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm hover:bg-white/10">
                  Cities
                </Link>
                <Link href="/transportation" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm hover:bg-white/10">
                  Transportation
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {stations.map((station) => (
            <Link
              key={station.slug}
              href={`/stations/${station.slug}`}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10"
            >
              <div className="text-xs font-black uppercase tracking-[0.22em] text-cyan-200">
                {getStationSubtypeLabel(station.subtype)}
              </div>
              <h2 className="mt-3 text-2xl font-black tracking-tight">{station.name}</h2>
              <p className="mt-2 text-sm text-zinc-400">
                {station.cityName}, {station.state}
              </p>
              <p className="mt-4 text-sm leading-6 text-zinc-300">{station.summary}</p>
              <div className="mt-5 text-sm font-bold text-cyan-200">Open station guide →</div>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
