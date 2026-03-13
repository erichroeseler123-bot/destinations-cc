import Link from "next/link";
import { getGraphHealth } from "@/lib/dcc/graph/health";
import { listPlaceGraphSummaries } from "@/lib/dcc/graph/placeActionGraph";
import { serializeAliveFilter } from "@/lib/dcc/taxonomy/lanes";
import PoweredByViator from "@/app/components/dcc/PoweredByViator";

export const dynamic = "force-static";

export default function ToursPage() {
  const health = getGraphHealth();
  const rows = listPlaceGraphSummaries(200)
    .filter((r) => r.action_counts.tours > 0)
    .sort((a, b) => {
      const scoreA = a.action_counts.tours + a.action_counts.cruises;
      const scoreB = b.action_counts.tours + b.action_counts.cruises;
      return scoreB - scoreA || a.title.localeCompare(b.title);
    })
    .slice(0, 48);

  return (
    <main className="max-w-6xl mx-auto px-6 py-16 space-y-8">
      <header className="space-y-3 border-b border-white/10 pb-8">
        <p className="text-xs uppercase tracking-wider text-zinc-500">DCC Lane Hub</p>
        <h1 className="text-4xl font-black tracking-tight">Tours</h1>
        <p className="text-zinc-300 max-w-3xl">
          Use DCC as the discovery layer for tours, activities, and excursions. Choose a place, compare options in context, and continue into booking with a trusted partner.
        </p>
        <p className="text-xs text-zinc-500">
          graph_places={health.places} • graph_edges={health.edges} • stale={health.stale ? "yes" : "no"}
        </p>
        <PoweredByViator
          compact
          disclosure
          body="DCC helps you discover the right experience faster. When you're ready to book, you can book with DCC via Viator, a trusted global tours and activities partner with secure checkout and broad inventory."
        />
        <div className="pt-2">
          <Link
            href="/cities"
            className="inline-flex items-center rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/20"
          >
            Browse Destinations and Find Tours →
          </Link>
        </div>
      </header>

      {rows.length === 0 ? (
        <section className="rounded-xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm text-zinc-500">No graph-backed tours entries available yet.</p>
        </section>
      ) : (
        <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {rows.map((row) => (
            <Link
              key={row.place_id}
              href={`/nodes/${row.place_slug}?alive=${encodeURIComponent(serializeAliveFilter(["tours"]))}`}
              className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition p-4"
            >
              <div className="text-zinc-100 font-medium">{row.title}</div>
              <div className="text-xs text-zinc-400 mt-1">
                tours {row.action_counts.tours} • cruises {row.action_counts.cruises} • trend {row.trend}
              </div>
              <div className="text-xs text-cyan-300 mt-3">Open tours lane →</div>
            </Link>
          ))}
        </section>
      )}
    </main>
  );
}
