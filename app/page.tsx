import Link from "next/link";
import CityGrid from "@/app/components/CityGrid";
import HomeCitySearch from "@/app/components/HomeCitySearch";
import FeaturedIntel from "@/app/components/FeaturedIntel";
import { getAllCities } from "@/lib/data/locations";
import { pickCitySlugByName, topCities } from "@/lib/data/cityPick";
import { getPlanetaryEvents, getPlanetarySummary } from "@/lib/dcc/memory/resolve";
import { listPlaceGraphSummaries } from "@/lib/dcc/graph/placeActionGraph";
import { getGraphHealth } from "@/lib/dcc/graph/health";
import { serializeAliveFilter } from "@/lib/dcc/taxonomy/lanes";

export const dynamic = "force-static";

export default function HomePage() {
  const cities = getAllCities();

  const vegas = pickCitySlugByName("Las Vegas") || "cities?q=las%20vegas";
  const miami = pickCitySlugByName("Miami") || "cities?q=miami";

  const topUS = topCities({ country: "US", limit: 18 });
  const topGlobal = topCities({ limit: 18 });
  const planetarySummary = getPlanetarySummary();
  const planetaryRecent = getPlanetaryEvents(10);
  const graphPulse = listPlaceGraphSummaries(8);
  const graphHealth = getGraphHealth();

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-6xl mx-auto px-6 py-16 space-y-14">

        {/* HERO */}
        <section id="featured-hubs" className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent p-10 md:p-14 space-y-8">
          <div className="space-y-3">
            <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
              Destination Command Center
            </h1>
            <p className="text-zinc-300 max-w-2xl">
              Verified city guides, tours, and travel intelligence — built to help you book better and travel smarter.
            </p>
          </div>

          <HomeCitySearch cities={cities as any} />

          
          <FeaturedIntel />
<div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/cities"
              className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-zinc-200 hover:bg-white/10 transition"
            >
              Browse All Cities →
            </Link>

            <Link
              href="/usa"
              className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-zinc-200 hover:bg-white/10 transition"
            >
              USA Tourist Cities →
            </Link>

            <Link
              href="/authority"
              className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-zinc-200 hover:bg-white/10 transition"
            >
              Authority Layer →
            </Link>

            <Link
              href={vegas.startsWith("cities?") ? `/${vegas}` : `/${vegas}`}
              className="rounded-2xl bg-cyan-600 px-5 py-3 text-sm font-semibold text-white hover:bg-cyan-500 transition shadow-lg shadow-cyan-600/25"
            >
              Explore Las Vegas →
            </Link>

            <Link
              href={miami.startsWith("cities?") ? `/${miami}` : `/${miami}`}
              className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-5 py-3 text-sm text-cyan-200 hover:bg-cyan-500/15 transition"
            >
              Explore Miami →
            </Link>
          </div>
        </section>

        {/* TOP US */}
        <CityGrid
          title="Top USA Cities"
          subtitle="Fast entry points to high-intent pages"
          cities={topUS}
        />

        {/* TOP GLOBAL */}
        <CityGrid
          title="Top Global Cities"
          subtitle="Highest population hubs (good for search + authority growth)"
          cities={topGlobal}
        />

        {/* AUTHORITY + PORTS */}
        <section className="grid md:grid-cols-3 gap-4">
          <Link
            href="/authority"
            className="rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition p-6"
          >
            <div className="text-lg font-semibold">Authority Layer</div>
            <div className="text-sm text-zinc-400 mt-1">Ports, logistics, constraints, reality checks</div>
            <div className="text-xs text-cyan-300 mt-3">Open →</div>
          </Link>

          <Link
            href="/ports"
            className="rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition p-6"
          >
            <div className="text-lg font-semibold">Ports Directory</div>
            <div className="text-sm text-zinc-400 mt-1">Cruise ports + routing anchors</div>
            <div className="text-xs text-cyan-300 mt-3">Open →</div>
          </Link>

          <Link
            href="/tours"
            className="rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition p-6"
          >
            <div className="text-lg font-semibold">Tours Hub</div>
            <div className="text-sm text-zinc-400 mt-1">Browse tour catalog and city tour pages</div>
            <div className="text-xs text-cyan-300 mt-3">Open →</div>
          </Link>
        </section>

        {/* GRAPH PULSE */}
        <section id="trend-watch" className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-5">
          <header className="space-y-1">
            <h2 className="text-2xl font-bold">What&apos;s Alive Now</h2>
            <p className="text-sm text-zinc-400">
              Graph-backed place pulse with lane-preserving handoff.
            </p>
          </header>
          <p className="text-xs text-zinc-500">
            places={graphHealth.places} • edges={graphHealth.edges} • stale={graphHealth.stale ? "yes" : "no"}
          </p>
          {graphPulse.length > 0 ? (
            <div className="grid sm:grid-cols-2 gap-3">
              {graphPulse.map((row) => (
                <Link
                  key={row.place_id}
                  href={`/nodes/${row.place_slug}?alive=${encodeURIComponent(serializeAliveFilter(["tours", "cruises"]))}`}
                  className="rounded-xl border border-white/10 bg-black/20 p-4 hover:bg-black/30 transition"
                >
                  <div className="text-zinc-100 font-medium">{row.title}</div>
                  <div className="text-xs text-zinc-400 mt-1">
                    tours {row.action_counts.tours} • cruises {row.action_counts.cruises} • trend {row.trend}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-500">No graph pulse entries available yet.</p>
          )}
        </section>

        {/* MEMORY BRAIN */}
        <section id="planetary-timeline" className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-5">
          <header className="space-y-1">
            <h2 className="text-2xl font-bold">Planetary Timeline</h2>
            <p className="text-sm text-zinc-400">
              Memory Brain global activity snapshot.
            </p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="text-zinc-500">Events (window)</div>
              <div className="text-xl font-semibold text-cyan-300">
                {planetarySummary?.count ?? 0}
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="text-zinc-500">Active Places</div>
              <div className="text-xl font-semibold text-cyan-300">
                {planetarySummary?.unique_places ?? 0}
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="text-zinc-500">Window Days</div>
              <div className="text-xl font-semibold text-cyan-300">
                {planetarySummary?.window_days ?? 0}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm uppercase tracking-wider text-zinc-500">Latest 10 Events</h3>
            {planetaryRecent.length > 0 ? (
              <div className="space-y-2">
                {planetaryRecent.map((ev) => {
                  const dt = new Date(ev.timestamp);
                  const ts = Number.isNaN(dt.getTime())
                    ? ev.timestamp
                    : dt.toISOString().replace("T", " ").slice(0, 16);
                  return (
                    <div
                      key={ev.id}
                      className="rounded-lg border border-white/10 bg-black/20 px-4 py-3"
                    >
                      <div className="text-[11px] uppercase tracking-wider text-zinc-500">{ts}</div>
                      <div className="text-sm text-zinc-200 mt-1">
                        {ev.title} <span className="text-zinc-500">({ev.event_type})</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-zinc-500">No planetary events yet.</p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
