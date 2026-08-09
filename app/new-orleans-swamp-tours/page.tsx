import type { Metadata } from "next";
import Link from "next/link";

const PAGE_PATH = "/new-orleans-swamp-tours";
const SPECIALIST = "https://welcometotheswamp.com";

const DECISIONS = [
  ["Ride style", "Airboat or covered swamp boat?", "/guides/new-orleans-airboat-vs-covered-swamp-boat"],
  ["With kids", "Which swamp tour style works best with kids?", "/guides/new-orleans-swamp-tour-with-kids"],
  ["Transportation", "Pickup or self-drive?", "/guides/new-orleans-swamp-tour-pickup-vs-self-drive"],
  ["Airboat size", "Small airboat or larger airboat?", "/guides/new-orleans-small-vs-large-airboat"],
  ["Timing", "What time of day fits best?", "/guides/best-time-of-day-for-new-orleans-swamp-tour"],
  ["Worth it?", "Does the swamp deserve a major block of the trip?", "/guides/is-a-new-orleans-swamp-tour-worth-it"],
] as const;

export const metadata: Metadata = {
  title: "New Orleans Swamp Tour Decision Guide | DCC",
  description: "Decide whether to go, which ride style fits, how transportation changes the day, and when to go before comparing bookable swamp tours.",
  alternates: { canonical: PAGE_PATH },
};

export default function NewOrleansSwampDecisionCenter() {
  return (
    <main className="min-h-screen bg-[#07110d] text-[#f3efe2]">
      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8 md:py-24">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-300">DCC · New Orleans pre-site</p>
        <h1 className="mt-5 max-w-4xl text-5xl font-black tracking-[-0.05em] sm:text-6xl">
          Decide the swamp trip before choosing the boat.
        </h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-stone-300">
          Start with the questions that change the purchase: is the swamp worth the time, airboat or covered boat, kids, pickup, boat size, and when the excursion fits the rest of the New Orleans day. Once those are clear, Welcome to the Swamp takes over as the specialist booking surface.
        </p>

        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {DECISIONS.map(([eyebrow, title, href]) => (
            <Link key={href} href={href} className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 transition hover:-translate-y-1 hover:border-emerald-300/50">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">{eyebrow}</p>
              <h2 className="mt-3 text-xl font-black leading-7 text-white">{title}</h2>
              <span className="mt-6 inline-block text-sm font-bold text-stone-200">Resolve this question →</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#0b1711]">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-14 sm:px-8 lg:grid-cols-[1.1fr_.9fr]">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-300">Clear ownership</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-white">DCC answers the trip question. Welcome to the Swamp sells the swamp choice.</h2>
            <p className="mt-4 max-w-2xl leading-7 text-stone-300">
              DCC should not become a duplicate swamp storefront. It owns the pre-purchase reasoning. Welcome to the Swamp owns current swamp formats and provider handoffs. Welcome to New Orleans Tours remains the broader destination marketplace for travelers who have not specifically chosen a swamp day.
            </p>
          </div>
          <div className="rounded-3xl border border-emerald-300/20 bg-emerald-300/[0.06] p-6">
            <p className="text-sm font-black text-white">Swamp decision made?</p>
            <p className="mt-2 text-sm leading-6 text-stone-300">Move downstream only when the question has changed from “should we do this?” to “which actual swamp option fits us?”</p>
            <a href={SPECIALIST} className="mt-5 inline-flex rounded-xl bg-emerald-300 px-5 py-3 text-sm font-black text-[#07110d]">
              Continue to Welcome to the Swamp ↗
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
