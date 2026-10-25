import type { Metadata } from "next";
import FactualErrorReportForm from "@/app/components/dcc/FactualErrorReportForm";

export const metadata: Metadata = {
  title: "Contact & Factual Corrections | Destination Command Center",
  description: "Report factual discrepancies, outdated schedules, or broken citations to Destination Command Center.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-4xl px-6 py-16 space-y-8">
        <header className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(24,24,27,0.96),rgba(9,9,11,0.98))] p-8 shadow-[0_28px_80px_rgba(0,0,0,0.45)]">
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Contact &amp; Corrections</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">How to reach DCC &amp; report factual changes</h1>
          <p className="mt-4 max-w-3xl text-lg text-zinc-300">
            Destination Command Center maintains sourced destination reference guides and interactive decision planners. If you spot an outdated fare, schedule change, transfer window, or broken source link, submit a report below.
          </p>
        </header>

        <section
          id="report-factual-error"
          className="rounded-3xl border border-white/10 bg-white/[0.04] p-6"
        >
          <h2 className="mb-3 text-xl font-bold text-white">Submit a Factual-Error Report</h2>
          <FactualErrorReportForm defaultPagePath="/juneau" />
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <article className="rounded-3xl border border-white/10 bg-white/[0.05] p-6 text-zinc-300">
            <h2 className="text-2xl font-bold text-white">Operations Base</h2>
            <p className="mt-2">Denver, Colorado</p>
          </article>
          <article className="rounded-3xl border border-white/10 bg-white/[0.05] p-6 text-zinc-300">
            <h2 className="text-2xl font-bold text-white">How Reports Are Handled</h2>
            <p className="mt-2 text-sm leading-relaxed">
              Submitted reports are persisted directly into the DCC reference maintenance review queue and checked against the primary agency or operator source before updating published claims.
            </p>
          </article>
        </section>
      </div>
    </main>
  );
}
