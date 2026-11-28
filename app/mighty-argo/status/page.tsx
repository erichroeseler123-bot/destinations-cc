import Link from "next/link";
import type { Metadata } from "next";

const SHUTTLEYA_DISCOVERY_URL =
  "https://shuttleya.com/?utm_source=dcc&utm_medium=referral&utm_campaign=mighty_argo_status";

export const metadata: Metadata = {
  title: "Mighty Argo Cable Car — Retired Shuttle Notice & Arrival Status",
  description:
    "Current DCC transportation status for the Mighty Argo Cable Car in Idaho Springs: the former Denver-to-Mighty-Argo scheduled shuttle is retired and is not operating.",
  alternates: { canonical: "/mighty-argo/status" },
};

export default function MightyArgoStatusPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <section className="border-b border-white/10">
        <div className="mx-auto max-w-5xl px-6 py-14">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-300">
            DCC transportation status · Retired corridor notice
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-black tracking-tight md:text-6xl">
            Mighty Argo Cable Car Transportation Status
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-zinc-300">
            The former Denver ↔ Mighty Argo scheduled shuttle is retired and is
            not operating. Neither Destination Command Center nor ShuttleYa
            operates vehicles, sets a house shuttle schedule, or takes direct
            transportation payment.
          </p>

          <section className="mt-6 rounded-2xl border border-amber-400/25 bg-amber-500/10 p-5">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-200">
              DCC field note
            </p>
            <p className="mt-2 text-sm leading-7 text-zinc-100">
              Plan Idaho Springs arrival and return logistics before leaving
              Denver—especially if visiting without a personal car—and confirm
              current attraction opening details directly with Mighty Argo.
            </p>
          </section>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/mighty-argo"
              className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-3 font-semibold text-black"
            >
              Read the Mighty Argo overview
            </Link>
            <a
              href={SHUTTLEYA_DISCOVERY_URL}
              className="inline-flex items-center justify-center rounded-xl border border-white/15 px-5 py-3 font-semibold text-white hover:bg-white/5"
            >
              Compare active corridors on ShuttleYa ↗
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-4 px-6 py-12 md:grid-cols-3">
        <article className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">
            Retired shuttle status
          </p>
          <h2 className="mt-3 text-2xl font-bold">No house Argo shuttle</h2>
          <p className="mt-3 text-sm leading-7 text-zinc-300">
            The historical Denver-to-Mighty-Argo scheduled shuttle is retired
            (`retired_not_operating`) and has no active booking checkout.
          </p>
        </article>

        <article className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">
            How ShuttleYa works
          </p>
          <h2 className="mt-3 text-2xl font-bold">
            Comparison &amp; operator handoff
          </h2>
          <p className="mt-3 text-sm leading-7 text-zinc-300">
            ShuttleYa compares verified per-seat shuttles and private transfers
            by corridor, then sends travelers to the operating carrier that
            controls vehicles, live pricing, availability, and payment.
          </p>
        </article>

        <article className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">
            Idaho Springs planning
          </p>
          <h2 className="mt-3 text-2xl font-bold">Decide the return upfront</h2>
          <p className="mt-3 text-sm leading-7 text-zinc-300">
            Whether driving I-70 or arranging private transportation, confirm
            both legs and check current attraction hours before heading into
            Clear Creek Canyon.
          </p>
        </article>
      </section>
    </main>
  );
}
