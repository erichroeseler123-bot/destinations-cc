import type { Metadata } from "next";
import Link from "next/link";
import implementation from "@/data/network/handoff-implementation.v1.json";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Network Implementation Status | Destination Command Center",
  description: "What DCC network handoffs are actually implemented today, separated from routes that are only declared in the network registry.",
  alternates: { canonical: "/network/implementation" },
};

const LABELS: Record<string, string> = {
  declared_only: "Declared only",
  context_handoff: "Context handoff",
  receiver_confirmed: "Receiver confirmed",
  end_to_end_verified: "End-to-end verified",
};

export default function NetworkImplementationPage() {
  const counts = implementation.handoffs.reduce<Record<string, number>>((acc, row) => {
    acc[row.status] = (acc[row.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <main className="min-h-screen bg-[#05070b] text-white">
      <div className="mx-auto max-w-6xl px-6 py-10 md:py-14">
        <Link href="/network" className="text-sm font-bold text-cyan-300">← Network map</Link>
        <p className="mt-8 text-xs font-black uppercase tracking-[0.24em] text-[#f5b34b]">Implementation truth</p>
        <h1 className="mt-3 max-w-4xl text-4xl font-black tracking-[-0.04em] md:text-6xl">Declared is not the same as implemented.</h1>
        <p className="mt-5 max-w-3xl text-base leading-8 text-white/70">This ledger separates planned network lanes from real receivers and verified end-to-end flows. It exists specifically so DCC does not overstate what the suite can do today.</p>

        <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Object.keys(LABELS).map((status) => (
            <div key={status} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="text-xs font-black uppercase tracking-[0.14em] text-white/45">{LABELS[status]}</div>
              <div className="mt-2 text-4xl font-black">{counts[status] || 0}</div>
            </div>
          ))}
        </section>

        <section className="mt-10 space-y-3">
          {implementation.handoffs.map((row) => (
            <article key={row.handoff_id} className="rounded-2xl border border-white/10 bg-[#0b1017] p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <code className="text-sm text-white/85">{row.handoff_id}</code>
                <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-cyan-200">{LABELS[row.status] || row.status}</span>
              </div>
              {row.evidence.length ? <div className="mt-3 text-xs leading-6 text-white/45">Evidence: {row.evidence.join(" · ")}</div> : <div className="mt-3 text-xs text-amber-200/70">No receiver evidence confirmed in the current audit.</div>}
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
