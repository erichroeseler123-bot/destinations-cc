import type { Metadata } from "next";
import Link from "next/link";
import { getPlanetaryEvents, getPlanetarySummary } from "@/lib/dcc/memory/resolve";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Historical Travel Signals | Destination Command Center",
  description: "A dated, read-only view of DCC's existing place-memory timeline. Historical records are explicitly separated from current live conditions.",
  alternates: { canonical: "/signals/history" },
};

function ageDays(value: string | undefined) {
  if (!value) return null;
  const ms = Date.now() - Date.parse(value);
  return Number.isFinite(ms) ? Math.max(0, Math.floor(ms / 86_400_000)) : null;
}

export default function HistoricalSignalsPage() {
  const summary = getPlanetarySummary();
  const events = getPlanetaryEvents(60);
  const generatedAge = ageDays(summary?.generated_at);
  const isStale = generatedAge === null || generatedAge > 7;

  return (
    <main className="min-h-screen bg-[#090d13] text-slate-100">
      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <p className="text-sm font-black uppercase tracking-[0.22em] text-amber-300">DCC memory · historical record</p>
        <h1 className="mt-4 max-w-4xl text-5xl font-black tracking-[-0.045em] text-white sm:text-6xl">How places changed in the stored DCC timeline.</h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
          This page reads DCC's existing snapshot/event memory without generating new history. It is historical evidence, not a claim about present conditions.
        </p>

        <div className={`mt-8 rounded-2xl border px-5 py-4 text-sm ${isStale ? "border-amber-400/25 bg-amber-500/10 text-amber-100" : "border-emerald-400/20 bg-emerald-500/10 text-emerald-100"}`}>
          Memory index generated: {summary?.generated_at ? new Date(summary.generated_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }) + " UTC" : "unknown"}.
          {generatedAge !== null ? ` ${generatedAge} day${generatedAge === 1 ? "" : "s"} old.` : ""}
          {isStale ? " It is intentionally not presented as live data." : ""}
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-[#0d131d] p-5"><div className="text-xs font-black uppercase tracking-wider text-slate-500">Stored events</div><div className="mt-2 text-3xl font-black">{summary?.count ?? events.length}</div></div>
          <div className="rounded-2xl border border-slate-800 bg-[#0d131d] p-5"><div className="text-xs font-black uppercase tracking-wider text-slate-500">Unique places</div><div className="mt-2 text-3xl font-black">{summary?.unique_places ?? new Set(events.map((event) => event.place_id)).size}</div></div>
          <div className="rounded-2xl border border-slate-800 bg-[#0d131d] p-5"><div className="text-xs font-black uppercase tracking-wider text-slate-500">Baseline window</div><div className="mt-2 text-3xl font-black">{summary?.window_days ?? 0}d</div></div>
        </div>

        <section className="mt-12">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div><p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">Stored event timeline</p><h2 className="mt-2 text-3xl font-black text-white">Most recent historical events</h2></div>
            <Link href="/signals" className="rounded-xl border border-slate-700 px-4 py-3 text-sm font-bold hover:border-cyan-600">Back to current signals</Link>
          </div>
          <div className="mt-6 grid gap-3">
            {events.length ? events.map((event) => (
              <article key={event.id || `${event.place_id}-${event.timestamp}-${event.event_type}`} className="rounded-2xl border border-slate-800 bg-[#0d131d] p-5">
                <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <span>{new Date(event.timestamp).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" })} UTC</span>
                  <span>·</span><span>{event.severity}</span><span>·</span><span>{event.confidence} confidence</span>
                </div>
                <h3 className="mt-2 text-lg font-black text-white">{event.title}</h3>
                <p className="mt-2 text-xs text-slate-500">{event.place_id} · {event.event_type}</p>
                {event.signals?.length ? <p className="mt-3 text-sm leading-6 text-slate-400">{event.signals.join(" · ")}</p> : null}
              </article>
            )) : <div className="rounded-2xl border border-slate-800 bg-[#0d131d] p-5 text-sm text-slate-400">No stored planetary events were found.</div>}
          </div>
        </section>
      </section>
    </main>
  );
}
