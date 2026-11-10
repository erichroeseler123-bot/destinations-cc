import type { Metadata } from "next";
import FactualErrorReportForm from "@/app/components/dcc/FactualErrorReportForm";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Contact & Factual Corrections | Destination Command Center",
  description: "Report factual discrepancies, outdated schedules, or broken citations to Destination Command Center.",
  alternates: { canonical: "/contact" },
  robots: { index: false, follow: false },
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
            <h2 className="text-2xl font-bold text-white">Operations Base &amp; Specialist Desks</h2>
            <p className="mt-2">
              Denver, Colorado · Submit DCC reference updates via the{" "}
              <a
                href="/report-error#report-factual-error"
                className="text-cyan-300 underline underline-offset-4"
              >
                in-app factual-error report form
              </a>
              .
            </p>
            <ul className="mt-3 space-y-1 text-sm text-zinc-400">
              <li>
                Red Rocks rides:{" "}
                <a
                  href="mailto:hello@partyatredrocks.com"
                  className="text-cyan-300 underline underline-offset-4"
                >
                  hello@partyatredrocks.com
                </a>
              </li>
              <li>
                Colorado mountain transfers:{" "}
                <a
                  href="mailto:dispatch@gosno.co"
                  className="text-cyan-300 underline underline-offset-4"
                >
                  dispatch@gosno.co
                </a>
              </li>
              <li>
                Cruise port planning:{" "}
                <a
                  href="mailto:concierge@cruisepromenade.com"
                  className="text-cyan-300 underline underline-offset-4"
                >
                  concierge@cruisepromenade.com
                </a>
              </li>
              <li>
                New Orleans tours:{" "}
                <a
                  href="mailto:help@welcometoneworleanstours.com"
                  className="text-cyan-300 underline underline-offset-4"
                >
                  help@welcometoneworleanstours.com
                </a>
              </li>
            </ul>
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
