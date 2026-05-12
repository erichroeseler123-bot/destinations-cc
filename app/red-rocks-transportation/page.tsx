import type { Metadata } from "next";
import Link from "next/link";
import ParrCtaLink from "@/app/components/dcc/ParrCtaLink";
import RedRocksFunnelTelemetry from "@/app/components/dcc/RedRocksFunnelTelemetry";
import {
  buildParrPrivateRedRocksUrl,
  buildParrSharedRedRocksUrl,
} from "@/lib/dcc/contracts/dccParrBridge";
import { buildDecisionContinuationParams } from "@/lib/dcc/contracts/decisionContinuation";

export const metadata: Metadata = {
  title: "Best Way to Get to Red Rocks from Denver | Shuttle First",
  description:
    "For most Denver visitors, the shared Red Rocks shuttle is the right first move because it solves parking, pickup, and the ride home before the show.",
  alternates: { canonical: "/red-rocks-transportation" },
  keywords: [
    "best way to get to red rocks",
    "red rocks transportation",
    "red rocks shuttle",
    "red rocks parking",
    "red rocks uber",
  ],
  openGraph: {
    title: "Best Way To Get To Red Rocks Without The Parking Mess",
    description:
      "For most concert-goers, the shared shuttle is the cleanest move. Private is the exception when your group needs more control.",
    url: "/red-rocks-transportation",
    type: "article",
  },
};

const PAGE_PATH = "/red-rocks-transportation";

export default function RedRocksTransportationPage() {
  const sharedHref = buildParrSharedRedRocksUrl({
    sourcePage: PAGE_PATH,
    cta: "primary",
    ...buildDecisionContinuationParams({
      sourcePage: PAGE_PATH,
      corridor: "red-rocks-transport",
      cta: "primary",
      action: "book_shared_red_rocks_shuttle",
      option: "shared",
      product: "shared-red-rocks-shuttle-seat",
      entryMode: "dcc-first",
      destinationSurface: "operator",
    }),
  });

  const noticeSharedHref = buildParrSharedRedRocksUrl({
    sourcePage: PAGE_PATH,
    cta: "notice-primary",
    ...buildDecisionContinuationParams({
      sourcePage: PAGE_PATH,
      corridor: "red-rocks-transport",
      cta: "notice-primary",
      action: "book_shared_red_rocks_shuttle",
      option: "shared",
      product: "shared-red-rocks-shuttle-seat",
      entryMode: "dcc-first",
      destinationSurface: "operator",
    }),
  });

  const privateHref = buildParrPrivateRedRocksUrl({
    sourcePage: PAGE_PATH,
    cta: "secondary",
    ...buildDecisionContinuationParams({
      sourcePage: PAGE_PATH,
      corridor: "red-rocks-transport",
      cta: "secondary",
      action: "book_private_red_rocks_ride",
      option: "private",
      product: "parr-private",
      entryMode: "dcc-first",
      destinationSurface: "operator",
    }),
  });

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <RedRocksFunnelTelemetry page={PAGE_PATH} />
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-16">
        <section className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(255,176,124,0.16),transparent_28%),radial-gradient(circle_at_top_right,rgba(61,243,255,0.12),transparent_28%),linear-gradient(180deg,rgba(9,15,31,0.96),rgba(7,11,25,0.96))] p-8 shadow-[0_20px_70px_rgba(0,0,0,0.35)]">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">Red Rocks transportation</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">
            For most Red Rocks nights, take the shared shuttle.
          </h1>
          <section>
            <h2>Decision Locked</h2>
            <p>
              The default is shared shuttle. Private is only the move when your group
              needs its own vehicle and tighter control.
            </p>
          </section>
          <p className="mt-4 max-w-4xl text-base leading-8 text-zinc-300">
            The ride home is where Red Rocks plans break. A shared shuttle solves that
            before the show starts: no parking strategy, no rideshare scramble, no
            last-minute exit plan.
          </p>
          <section className="mt-5 rounded-[1.5rem] border border-cyan-300/20 bg-cyan-500/10 p-5">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-200">Quick answer</p>
            <p className="mt-3 text-sm leading-7 text-zinc-100">
              Shared shuttle is the move for most concert nights. Choose private only
              when one vehicle, one pickup, and one return plan are worth paying for.
            </p>
          </section>
          <div className="mt-5 max-w-3xl rounded-[1.4rem] border border-white/10 bg-white/[0.04] px-5 py-4">
            <p className="text-sm font-black uppercase tracking-[0.14em] text-zinc-200">The ride home is the real decision.</p>
            <p className="mt-2 text-sm leading-7 text-zinc-300">
              Do not build the night around getting there. Build it around getting back
              cleanly. That is why shuttle wins as the default.
            </p>
          </div>
          <section className="mt-5 rounded-[1.4rem] border border-[#ffb07c]/20 bg-[#ffb07c]/10 px-5 py-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#ffd6bc]">DCC field note</p>
            <p className="mt-2 text-sm leading-7 text-zinc-100">
              Leaving Red Rocks is the hard part. Lock the return plan now, then enjoy
              the show without negotiating the exit later.
            </p>
          </section>
        </section>

        <section className="rounded-[1.9rem] border border-cyan-300/20 bg-[linear-gradient(180deg,rgba(16,33,43,0.96),rgba(7,15,21,0.96))] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.26)]">
          <div className="text-xs font-black uppercase tracking-[0.2em] text-cyan-200">Recommended</div>
          <h2 className="mt-3 text-3xl font-black text-white">Shared Red Rocks Shuttle</h2>
          <p className="mt-4 rounded-2xl border border-cyan-200/20 bg-cyan-400/10 px-4 py-3 text-sm font-black uppercase tracking-[0.16em] text-cyan-100">
            For most concert nights, this is the move.
          </p>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-300">
            This is the best fit when you want the whole night simplified. Party at
            Red Rocks handles the booking and ride execution after DCC makes the
            transport decision clear.
          </p>
          <ul className="mt-4 space-y-2 text-sm leading-7 text-zinc-200">
            <li>• Parking chaos avoided.</li>
            <li>• No post-show waiting around rideshare pickup.</li>
            <li>• Predictable timing before and after the show.</li>
          </ul>
          <div className="mt-5 rounded-[1.4rem] border border-white/10 bg-black/20 p-4 text-sm leading-7 text-zinc-300">
            Skip the extra decision loop when the real problems are the exit, parking,
            and ride-home uncertainty.
          </div>
          <div className="mt-5 rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-200">Best for</p>
            <p className="mt-2 text-sm leading-7 text-zinc-300">
              Most riders who want parking, timing, and the return trip handled before
              arriving at the venue.
            </p>
          </div>
          <div className="mt-6">
            <ParrCtaLink
              href={noticeSharedHref}
              page={PAGE_PATH}
              cta="notice-primary"
              mapperMeta={{
                routeKey: "red-rocks-shared-operator",
                provider: "internal",
                targetKind: "operator_checkout",
                operatorId: "partyatredrocks",
              }}
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#3df3ff] px-6 text-sm font-black uppercase tracking-[0.16em] text-[#07111d] transition hover:bg-[#62f6ff]"
            >
              Check Shared Shuttle Availability
            </ParrCtaLink>
            <div className="mt-3 text-sm font-semibold text-cyan-100">
              Next: Party at Red Rocks opens the shared shuttle booking path.
            </div>
          </div>
        </section>

        <section className="rounded-[1.9rem] border border-white/10 bg-white/[0.06] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.26)]">
          <div className="text-xs font-black uppercase tracking-[0.2em] text-[#ffb07c]">If you want more control instead</div>
          <h2 className="mt-3 text-3xl font-black text-white">Private Ride (Your Group Only)</h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-300">
            Private is the exception, not the default. Choose it when group control matters more than price and you want your own timing plan.
          </p>
          <div className="mt-4 rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#ffb07c]">Best for</p>
            <p className="mt-2 text-sm leading-7 text-zinc-300">
              Groups, tighter timing, or riders who want more control over the night.
            </p>
          </div>
          <div className="mt-6">
            <ParrCtaLink
              href={privateHref}
              page={PAGE_PATH}
              cta="secondary"
              mapperMeta={{
                routeKey: "red-rocks-private-operator",
                provider: "internal",
                targetKind: "operator_checkout",
                operatorId: "partyatredrocks",
              }}
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/14 bg-white/6 px-6 text-sm font-black uppercase tracking-[0.16em] text-white transition hover:bg-white/10"
            >
              Book a Private Red Rocks Ride
            </ParrCtaLink>
          </div>
        </section>

        <section className="rounded-[1.9rem] border border-white/10 bg-white/[0.06] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.26)]">
          <div className="text-xs font-black uppercase tracking-[0.2em] text-zinc-300">Fast comparison</div>
          <h2 className="mt-3 text-3xl font-black text-white">Red Rocks shuttle vs Uber</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <article className="rounded-[1.5rem] border border-cyan-300/25 bg-cyan-500/10 p-5">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-200">Recommended</p>
              <h3 className="mt-2 text-2xl font-black text-white">Shared shuttle</h3>
              <ul className="mt-3 space-y-2 text-sm leading-7 text-zinc-200">
                <li>• Best when you want the ride home solved now.</li>
                <li>• Removes the parking and pickup scramble.</li>
                <li>• Sends you straight to the booking path.</li>
              </ul>
            </article>
            <article className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 opacity-85">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#ffb07c]">Alternative</p>
              <h3 className="mt-2 text-2xl font-black text-white">Uber or drive</h3>
              <ul className="mt-3 space-y-2 text-sm leading-7 text-zinc-300">
                <li>• Uber only works if you accept post-show waiting and surge pricing.</li>
                <li>• Driving only works if you accept parking, walking, and exit traffic.</li>
                <li>• Both keep the hardest part of the night less predictable.</li>
              </ul>
            </article>
          </div>
        </section>

        <section className="rounded-[1.9rem] border border-white/10 bg-white/[0.06] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.26)]">
          <div className="text-xs font-black uppercase tracking-[0.2em] text-zinc-300">Why this is the recommended next step</div>
          <h3 className="mt-3 text-2xl font-bold text-white">Solve the hard part before you arrive</h3>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-300">
            Red Rocks transportation usually breaks down in the same places: parking friction, post-show pickup chaos, and unclear ride-home plans. This path is meant to solve that before you go.
          </p>
          <ul className="mt-4 space-y-3 text-sm leading-7 text-zinc-300">
            <li>
              <strong className="text-white">Direct booking path</strong> rather than a generic directory.
            </li>
            <li>
              <strong className="text-white">Shared and private options</strong> based on real use case.
            </li>
            <li>
              <strong className="text-white">Cleaner handoff</strong> into the actual operator booking page.
            </li>
          </ul>
          <Link
            href="/red-rocks-shuttle-vs-uber"
            className="mt-5 inline-flex rounded-2xl border border-white/10 bg-black/20 px-4 py-3 hover:bg-white/10"
          >
            Red Rocks shuttle vs Uber
          </Link>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <Link href="/red-rocks-shuttle" className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 hover:bg-white/10">
              Red Rocks shuttle
            </Link>
            <Link href="/how-to-get-to-red-rocks-without-parking-hassle" className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 hover:bg-white/10">
              how to get to Red Rocks without parking hassle
            </Link>
            <Link href="/red-rocks-parking" className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 hover:bg-white/10">
              Red Rocks parking
            </Link>
            <Link href="/how-to-leave-red-rocks-after-a-concert" className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 hover:bg-white/10">
              best way to leave Red Rocks
            </Link>
            <a href="https://www.partyatredrocks.com/shuttles" className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 hover:bg-white/10">
              Party at Red Rocks shuttles
            </a>
          </div>
        </section>

        <section className="rounded-[1.9rem] border border-cyan-300/20 bg-cyan-500/10 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.26)]">
          <div className="text-xs font-black uppercase tracking-[0.2em] text-cyan-200">What happens next</div>
          <h2 className="mt-3 text-2xl font-bold text-white">Pick shared shuttle, then continue to the operator booking path.</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-200">
            DCC makes the recommendation. Party at Red Rocks handles the booking and Red Rocks shuttle execution path when users arrive ready to book.
          </p>
        </section>
      </div>
    </main>
  );
}
