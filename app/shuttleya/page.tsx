import type { Metadata } from "next";
import Link from "next/link";

const SPECIALIST = "https://shuttleya.com";

const DECISIONS = [
  ["No car", "How do you get from Denver to Idaho Springs without driving?", "/guides/denver-to-idaho-springs-without-driving"],
  ["Worth the trip?", "Is Mighty Argo worth using half a day from Denver?", "/guides/is-mighty-argo-worth-a-half-day-from-denver"],
  ["Drive or shuttle", "Should you drive or take a shuttle?", "/guides/drive-vs-shuttle-denver-to-idaho-springs"],
  ["Timing", "How much time should you allow for the day trip?", "/guides/how-much-time-for-idaho-springs-day-trip-from-denver"],
  ["I-70", "What if I-70 disrupts the mountain day?", "/guides/what-if-i70-closes-on-denver-day-trip"],
] as const;

export const metadata: Metadata = {
  title: "Denver to Idaho Springs Day Trip | Shuttle Decision Guide",
  description:
    "Decide whether an Idaho Springs day trip fits, whether to drive or shuttle, how much time to protect, and what to consider about I-70 before booking transportation.",
  alternates: { canonical: "/shuttleya" },
};

export default function ShuttleyaDecisionCenter() {
  return (
    <main className="min-h-screen bg-[#0c1015] text-[#f6f2e8]">
      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8 md:py-24">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-sky-300">
          DCC · Colorado pre-site
        </p>
        <h1 className="mt-5 max-w-4xl text-5xl font-black tracking-[-0.05em] sm:text-6xl">
          Decide the Idaho Springs day trip before buying the ride.
        </h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
          Start with the questions that determine whether transportation is even the right purchase: is the outing worth the time, do you need a car, drive or shuttle, how much margin does the day need, and what happens if I-70 changes the plan. Once those are solved, ShuttleYa becomes the direct-service next step.
        </p>

        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {DECISIONS.map(([eyebrow, title, href]) => (
            <Link
              key={href}
              href={href}
              className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 transition hover:-translate-y-1 hover:border-sky-300/50"
            >
              <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-300">{eyebrow}</p>
              <h2 className="mt-3 text-xl font-black leading-7 text-white">{title}</h2>
              <span className="mt-6 inline-block text-sm font-bold text-slate-200">Resolve this question →</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#111821]">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-14 sm:px-8 lg:grid-cols-[1.1fr_.9fr]">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-sky-300">The handoff boundary</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-white">
              DCC answers the trip question. ShuttleYa sells the scheduled ride.
            </h2>
            <p className="mt-4 max-w-2xl leading-7 text-slate-300">
              Destination Command Center should not duplicate ShuttleYa checkout or pretend to be the transportation operator. DCC owns comparison and trip-fit reasoning. ShuttleYa owns its current schedule, pickup details, fare, operating rules, disruption policy, and booking flow.
            </p>
          </div>

          <div className="rounded-3xl border border-sky-300/20 bg-sky-300/[0.06] p-6">
            <p className="text-sm font-black text-white">A scheduled shuttle fits the day?</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Move downstream when the question changes from “how should we do this?” to “show me ShuttleYa's current ride and booking details.”
            </p>
            <a
              href={SPECIALIST}
              className="mt-5 inline-flex rounded-xl bg-sky-300 px-5 py-3 text-sm font-black text-[#081018]"
            >
              Continue to ShuttleYa ↗
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
