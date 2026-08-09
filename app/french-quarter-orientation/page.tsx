import type { Metadata } from "next";
import Link from "next/link";

const PAGE_PATH = "/french-quarter-orientation";
const SPECIALIST = "https://frenchquarterorientation.com";

const DECISIONS = [
  ["First hour", "How should you use your first hour in the French Quarter?", "/guides/how-to-get-oriented-in-the-french-quarter-first-hour"],
  ["Street choice", "Bourbon Street or Royal Street first?", "/guides/french-quarter-bourbon-street-vs-royal-street-first-visit"],
  ["Navigation", "How do you stop getting turned around?", "/guides/how-not-to-get-lost-in-french-quarter-new-orleans"],
  ["First-day mistakes", "What wastes the most time on day one?", "/guides/new-orleans-french-quarter-first-day-mistakes"],
  ["Worth it?", "Is a short orientation actually worth doing?", "/guides/is-a-french-quarter-orientation-worth-it"],
  ["Groups", "Where should everyone regroup if you split up?", "/guides/french-quarter-group-meeting-point-strategy"],
] as const;

export const metadata: Metadata = {
  title: "French Quarter Orientation | First-Hour New Orleans Decision Guide",
  description: "Understand the French Quarter before you start spending the day solving navigation, meeting-point, nightlife, and walking-route questions one at a time.",
  alternates: { canonical: PAGE_PATH },
};

export default function FrenchQuarterOrientationDecisionCenter() {
  return (
    <main className="min-h-screen bg-[#0d0b10] text-[#f7f0e7]">
      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8 md:py-24">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-amber-300">DCC · New Orleans pre-site</p>
        <h1 className="mt-5 max-w-4xl text-5xl font-black tracking-[-0.05em] sm:text-6xl">
          Understand the Quarter before you start wandering it.
        </h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-stone-300">
          This is the research layer before French Quarter Orientation. Solve the practical questions here—layout, first-hour strategy, group meeting points, street choice, and whether a short orientation is worth doing—then move into the specialist experience only when that is the useful next step.
        </p>

        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {DECISIONS.map(([eyebrow, title, href]) => (
            <Link key={href} href={href} className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 transition hover:-translate-y-1 hover:border-amber-300/50">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-300">{eyebrow}</p>
              <h2 className="mt-3 text-xl font-black leading-7 text-white">{title}</h2>
              <span className="mt-6 inline-block text-sm font-bold text-stone-200">Work through the decision →</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#151119]">
        <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-300">The handoff boundary</p>
          <div className="mt-4 grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
            <div>
              <h2 className="text-3xl font-black tracking-tight text-white">DCC answers whether and why. The specialist handles the orientation.</h2>
              <p className="mt-4 max-w-2xl leading-7 text-stone-300">
                DCC should not duplicate a walking experience, a welcome briefing, or later tour-shopping surfaces. Its job is to resolve uncertainty first. French Quarter Orientation then owns the short orientation layer; full tours, swamp excursions, and other bookings remain with their respective specialist sites.
              </p>
            </div>
            <div className="rounded-3xl border border-amber-300/20 bg-amber-300/[0.06] p-6">
              <p className="text-sm font-black text-white">Ready for the practical first step?</p>
              <p className="mt-2 text-sm leading-6 text-stone-300">Move into French Quarter Orientation when your question is no longer “what do I need to understand?” and becomes “show me the short orientation experience.”</p>
              <a href={SPECIALIST} className="mt-5 inline-flex rounded-xl bg-amber-300 px-5 py-3 text-sm font-black text-[#17110a]">
                Continue to French Quarter Orientation ↗
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
