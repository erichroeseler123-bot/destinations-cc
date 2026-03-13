import Link from "next/link";
import { notFound } from "next/navigation";
import { getPlaceActionGraphBySlug } from "@/lib/dcc/graph/placeActionGraph";

export const dynamicParams = true;

export default async function InternalGraphPlacePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolved = await params;
  const graph = getPlaceActionGraphBySlug(resolved.slug);
  if (!graph) return notFound();

  return (
    <main className="max-w-6xl mx-auto px-6 py-16 space-y-8">
      <header className="space-y-2 border-b border-white/10 pb-6">
        <p className="text-xs uppercase tracking-wider text-zinc-500">Internal Graph Debug</p>
        <h1 className="text-3xl font-black tracking-tight">{graph.place_name}</h1>
        <p className="text-sm text-zinc-400">
          place_id={graph.place_id} • slug={graph.place_slug}
        </p>
      </header>

      <section className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-2">
        <h2 className="text-xl font-semibold">Observations</h2>
        <p className="text-sm text-zinc-300">
          trend={graph.observations.trend} • latest_event_type=
          {graph.observations.latest_event_type || "n/a"} • latest_event_severity=
          {graph.observations.latest_event_severity || "n/a"}
        </p>
      </section>

      <section className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-3">
        <h2 className="text-xl font-semibold">Actions</h2>
        <p className="text-sm text-zinc-400">
          tours={graph.counts.tours} • cruises={graph.counts.cruises} • events={graph.counts.events} •
          transport={graph.counts.transport}
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="rounded-lg border border-white/10 bg-black/20 p-4">
            <h3 className="font-medium mb-2">Tours</h3>
            <ul className="text-sm text-zinc-300 space-y-1">
              {graph.actions.tours.slice(0, 8).map((a) => (
                <li key={a.id}>
                  {a.title} ({a.provider})
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/20 p-4">
            <h3 className="font-medium mb-2">Cruises</h3>
            <ul className="text-sm text-zinc-300 space-y-1">
              {graph.actions.cruises.slice(0, 8).map((a) => (
                <li key={a.id}>
                  {a.title} ({a.provider})
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-2">
        <h2 className="text-xl font-semibold">Providers</h2>
        <p className="text-sm text-zinc-300">{graph.providers.join(", ") || "n/a"}</p>
      </section>

      <section className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-2">
        <h2 className="text-xl font-semibold">Related Places</h2>
        {graph.related_places.length === 0 ? (
          <p className="text-sm text-zinc-500">No related places indexed.</p>
        ) : (
          <ul className="text-sm text-zinc-300 space-y-1">
            {graph.related_places.slice(0, 20).map((r) => (
              <li key={`${r.place_id}:${r.reason}`}>
                {r.place_name || r.place_slug || r.place_id} ({r.reason})
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-2">
        <h2 className="text-xl font-semibold">Edges</h2>
        <p className="text-sm text-zinc-400">total_edges={graph.edges.length}</p>
        <div className="max-h-72 overflow-auto rounded border border-white/10 bg-black/20 p-3">
          <pre className="text-xs text-zinc-300 whitespace-pre-wrap">
            {JSON.stringify(graph.edges.slice(0, 120), null, 2)}
          </pre>
        </div>
      </section>

      <footer className="pt-2">
        <Link href={`/nodes/${graph.place_slug}`} className="text-sm text-cyan-300 hover:text-cyan-200">
          Open public node page →
        </Link>
      </footer>
    </main>
  );
}
