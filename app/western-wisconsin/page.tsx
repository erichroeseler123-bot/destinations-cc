import type { Metadata } from "next";
import Link from "next/link";

const PAGE_PATH = "/western-wisconsin";

export const metadata: Metadata = {
  title: "Eau Claire or La Crosse? | Western Wisconsin Weekend Decision",
  description:
    "Choose Eau Claire for the easiest western Wisconsin weekend. Choose La Crosse when scenic bluff-country payoff matters more than town energy.",
  alternates: { canonical: PAGE_PATH },
};

export default function WesternWisconsinPage() {
  return (
    <main className="min-h-screen bg-[#f7f5ef] text-slate-950">
      <section className="border-b border-emerald-900/10 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-800">
            Western Wisconsin decision
          </p>
          <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight md:text-6xl">
            Choose Eau Claire for the easiest western Wisconsin weekend.
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-700">
            Start with Eau Claire if you want the weekend to work with the least planning.
            Switch to La Crosse only when bluff views and Mississippi scenery matter more
            than town energy.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/western-wisconsin/eau-claire-vs-la-crosse?destination=eau-claire"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-emerald-700 px-6 text-sm font-black uppercase tracking-[0.16em] text-white transition hover:bg-emerald-800"
            >
              Plan Eau Claire first
            </Link>
            <Link
              href="/western-wisconsin/eau-claire-vs-la-crosse?destination=la-crosse"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-emerald-900/15 bg-white px-6 text-sm font-black uppercase tracking-[0.16em] text-slate-950 transition hover:bg-emerald-50"
            >
              Choose La Crosse for scenery
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-5 px-6 py-12 md:grid-cols-3">
        <article className="rounded-[1.5rem] border border-emerald-900/10 bg-white p-5 shadow-[0_18px_55px_rgba(18,38,31,0.08)]">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">
            Verdict
          </p>
          <h2 className="mt-3 text-2xl font-black">Eau Claire is the default.</h2>
          <p className="mt-3 text-sm leading-7 text-slate-700">
            It gives most first-time weekenders the clearest base: easier downtown momentum,
            food and drink stops, and less route planning.
          </p>
        </article>

        <article className="rounded-[1.5rem] border border-emerald-900/10 bg-white p-5 shadow-[0_18px_55px_rgba(18,38,31,0.08)]">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">
            Use La Crosse when
          </p>
          <h2 className="mt-3 text-2xl font-black">Scenery is the point.</h2>
          <p className="mt-3 text-sm leading-7 text-slate-700">
            Choose La Crosse when Mississippi views, bluff overlooks, and a slower river
            weekend matter more than town energy.
          </p>
        </article>

        <article className="rounded-[1.5rem] border border-emerald-900/10 bg-white p-5 shadow-[0_18px_55px_rgba(18,38,31,0.08)]">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">
            What happens next
          </p>
          <h2 className="mt-3 text-2xl font-black">Open the plan, then pick the lane.</h2>
          <p className="mt-3 text-sm leading-7 text-slate-700">
            Start with the destination decision, then choose the stay, activity, and food
            shape around that choice instead of browsing every river town.
          </p>
        </article>
      </section>
    </main>
  );
}
