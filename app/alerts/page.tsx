import type { Metadata } from "next";
import Link from "next/link";
import StatGrid from "@/app/components/StatGrid";
import StaleWarning from "@/app/components/StaleWarning";
import CinematicBackdrop from "@/app/components/dcc/CinematicBackdrop";
import RouteHeroMark from "@/app/components/dcc/RouteHeroMark";
import { getGraphHealth } from "@/lib/dcc/graph/health";
import { listPlaceGraphSummaries } from "@/lib/dcc/graph/placeActionGraph";
import { getPlanetaryEvents, getPlanetarySummary } from "@/lib/dcc/memory/resolve";
import { serializeAliveFilter } from "@/lib/dcc/taxonomy/lanes";

const PAGE_URL = "https://destinationcommandcenter.com/alerts";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Alerts & Trends | Destination Command Center",
  description:
    "Track live travel signals, cruise-port trends, routing pressure, and recent operational events across the DCC graph.",
  alternates: { canonical: "/alerts" },
  openGraph: {
    title: "Alerts & Trends",
    description:
      "Live travel signals, graph-backed trend pressure, and operational context across cities, ports, and cruise planning surfaces.",
    url: PAGE_URL,
    type: "website",
  },
};

function formatTimestamp(input: string): string {
  const dt = new Date(input);
  if (Number.isNaN(dt.getTime())) return input;
  return dt.toISOString().replace("T", " ").slice(0, 16);
}

export default function AlertsPage() {
  const graphHealth = getGraphHealth();
  const allPulse = listPlaceGraphSummaries(200);
  const planetarySummary = getPlanetarySummary();
  const planetaryRecent = getPlanetaryEvents(14);

  const degrading = allPulse.filter((row) => row.trend === "degrading").slice(0, 8);
  const improving = allPulse.filter((row) => row.trend === "improving").slice(0, 6);
  const normal = allPulse.filter((row) => row.trend === "normal").slice(0, 6);

  const counts = {
    degrading: allPulse.filter((row) => row.trend === "degrading").length,
    improving: allPulse.filter((row) => row.trend === "improving").length,
    normal: allPulse.filter((row) => row.trend === "normal").length,
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-zinc-950 text-white">
      <CinematicBackdrop />
      <div className="relative mx-auto max-w-6xl px-6 py-16 space-y-8">
        <header className="space-y-3">
          <RouteHeroMark eyebrow="Destination Command Center" title="ALERTS & TRENDS" tone="amber" />
          <p className="text-xs uppercase tracking-wider text-zinc-500">DCC Operational Signals</p>
          <h1 className="text-4xl font-black tracking-tight">Current travel alerts and trend pressure</h1>
          <p className="max-w-3xl text-zinc-300">
            Use this hub to spot degrading cruise-port conditions, graph-backed destination pressure,
            and recent planetary event logs before you commit to a route, excursion, or staging plan.
          </p>
        </header>

        <section className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-6 space-y-4">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.22em] text-amber-200">Trip Planning Snapshot</p>
            <h2 className="text-2xl font-bold">What this hub helps you decide quickly</h2>
            <p className="text-sm text-zinc-200">
              Whether conditions are stable enough to keep a plan simple, or whether you should add
              buffer, change timing, or fall back to a cleaner route.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <article className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Best for</p>
              <p className="mt-2 text-sm font-medium text-zinc-100">
                Cruise-day timing, port congestion, routing pressure, and reality checks.
              </p>
            </article>
            <article className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Typical use</p>
              <p className="mt-2 text-sm font-medium text-zinc-100">
                Check this before embarkation, tender ports, high-volume city days, or weather-sensitive outings.
              </p>
            </article>
            <article className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Good companion guides</p>
              <p className="mt-2 text-sm font-medium text-zinc-100">
                Tendering guide • Shore excursions guide • Road trips • Port authority pages
              </p>
            </article>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold">Graph pulse overview</h2>
            <p className="text-sm text-zinc-400">
              A quick read on whether the current DCC graph is skewing toward degrading, normal, or improving destination conditions.
            </p>
          </div>
          <StatGrid
            items={[
              { label: "Places tracked", value: graphHealth.places },
              { label: "Edges tracked", value: graphHealth.edges },
              { label: "Degrading signals", value: counts.degrading },
              { label: "Improving signals", value: counts.improving },
              { label: "Normal signals", value: counts.normal },
              {
                label: "Planetary events",
                value: planetarySummary?.count ?? 0,
              },
            ]}
          />
          <StaleWarning
            stale={graphHealth.stale}
            message="Graph freshness warning: signal data may be behind the current operating day."
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-rose-400/20 bg-rose-500/10 p-6 space-y-4">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.22em] text-rose-200">Degrading Now</p>
              <h2 className="text-2xl font-bold">Signals worth checking before you commit</h2>
            </div>
            <div className="space-y-3">
              {degrading.length > 0 ? (
                degrading.map((row) => (
                  <Link
                    key={row.place_id}
                    href={`/nodes/${row.place_slug}?alive=${encodeURIComponent(
                      serializeAliveFilter(["tours", "cruises", "transport", "events"])
                    )}`}
                    className="block rounded-xl border border-white/10 bg-black/20 p-4 hover:bg-black/30"
                  >
                    <div className="font-semibold text-zinc-100">{row.title}</div>
                    <div className="mt-1 text-sm text-zinc-300">
                      trend {row.trend} • tours {row.action_counts.tours} • cruises {row.action_counts.cruises} • transport {row.action_counts.transport}
                    </div>
                    {row.latest_event ? (
                      <div className="mt-2 text-xs uppercase tracking-wider text-rose-200">
                        latest event: {row.latest_event}
                      </div>
                    ) : null}
                  </Link>
                ))
              ) : (
                <p className="text-sm text-zinc-400">No degrading rows surfaced in the current graph window.</p>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-6 space-y-4">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.22em] text-emerald-200">Stable / Improving</p>
              <h2 className="text-2xl font-bold">Cleaner planning surfaces right now</h2>
            </div>
            <div className="space-y-3">
              {[...improving, ...normal].slice(0, 8).map((row) => (
                <Link
                  key={`${row.place_id}:${row.trend}`}
                  href={`/nodes/${row.place_slug}?alive=${encodeURIComponent(
                    serializeAliveFilter(["tours", "cruises"])
                  )}`}
                  className="block rounded-xl border border-white/10 bg-black/20 p-4 hover:bg-black/30"
                >
                  <div className="font-semibold text-zinc-100">{row.title}</div>
                  <div className="mt-1 text-sm text-zinc-300">
                    trend {row.trend} • tours {row.action_counts.tours} • cruises {row.action_counts.cruises}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">Planetary Timeline</p>
            <h2 className="text-2xl font-bold">Recent event log</h2>
            <p className="text-sm text-zinc-400">
              Recent memory events that can influence how hard or easy a place feels operationally.
            </p>
          </div>
          {planetaryRecent.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2">
              {planetaryRecent.map((ev) => (
                <article
                  key={ev.id}
                  className="rounded-xl border border-white/10 bg-black/20 px-4 py-3"
                >
                  <div className="text-[11px] uppercase tracking-wider text-zinc-500">
                    {formatTimestamp(ev.timestamp)}
                  </div>
                  <div className="mt-1 text-sm text-zinc-200">
                    {ev.title}
                  </div>
                  <div className="mt-2 text-xs uppercase tracking-wider text-cyan-200">
                    {ev.event_type}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-400">No planetary events are available in the current window.</p>
          )}
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <Link
            href="/cruises/tendering"
            className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-5 hover:bg-cyan-500/20"
          >
            <div className="font-semibold text-cyan-100">Tendering Guide</div>
            <p className="mt-2 text-sm text-zinc-300">
              Use when rough-water ports, launch queues, or return timing look fragile.
            </p>
          </Link>
          <Link
            href="/cruises/shore-excursions"
            className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-5 hover:bg-emerald-500/20"
          >
            <div className="font-semibold text-emerald-100">Shore Excursions Guide</div>
            <p className="mt-2 text-sm text-zinc-300">
              Compare ship-run versus independent excursions when timing risk matters.
            </p>
          </Link>
          <Link
            href="/ports"
            className="rounded-2xl border border-white/10 bg-white/5 p-5 hover:bg-white/10"
          >
            <div className="font-semibold text-zinc-100">Ports Directory</div>
            <p className="mt-2 text-sm text-zinc-300">
              Jump into port authority pages when a specific embarkation or call is the real question.
            </p>
          </Link>
        </section>
      </div>
    </main>
  );
}
