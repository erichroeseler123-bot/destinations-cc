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
  title: "Red Rocks Shuttle vs Uber: Best Way Back to Denver After a Show",
  description:
    "Compare shuttle and Uber for Red Rocks concerts, including pickup timing, post-show waits, surge pricing, and reliability.",
  alternates: { canonical: "/red-rocks-shuttle-vs-uber" },
  openGraph: {
    title: "Red Rocks Shuttle vs Uber | Which Is Better After the Show?",
    description:
      "Most people who want a smoother ride home from Red Rocks book the shuttle ahead of time.",
    url: "/red-rocks-shuttle-vs-uber",
    type: "article",
  },
};

const PAGE_PATH = "/red-rocks-shuttle-vs-uber";

export default function RedRocksShuttleVsUberPage() {
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
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-16">
        <header className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(61,243,255,0.14),transparent_24%),linear-gradient(180deg,rgba(9,15,31,0.96),rgba(7,11,25,0.96))] p-7 shadow-[0_20px_70px_rgba(0,0,0,0.35)]">
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Red Rocks feeder page</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">
            Shuttle beats Uber for most Red Rocks concert nights.
          </h1>
          <section>
            <h2>Decision Locked</h2>
            <p>
              The answer is shuttle unless you are comfortable waiting, paying surge,
              and improvising after the encore.
            </p>
          </section>
          <p className="mt-4 max-w-4xl text-base leading-8 text-zinc-300">
            Uber can be fine on the way in. The weak point is leaving with the whole
            crowd. For most concert nights, the shared shuttle is the move because the
            return is already solved before the show starts.
          </p>
          <section className="mt-5 rounded-[1.5rem] border border-cyan-300/20 bg-cyan-500/10 p-5">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-200">Quick answer</p>
            <p className="mt-3 text-sm leading-7 text-zinc-100">
              Choose shared shuttle if you want the ride home handled. Choose Uber only
              if post-show waiting and surge pricing are acceptable.
            </p>
          </section>
          <section className="mt-5 rounded-[1.4rem] border border-[#ffb07c]/20 bg-[#ffb07c]/10 p-5">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#ffd6bc]">DCC field note</p>
            <p className="mt-3 text-sm leading-7 text-zinc-100">
              The ride into Red Rocks is not the problem. The exit is. Solve the exit
              before the night starts.
            </p>
          </section>
          <div className="mt-6 flex flex-wrap gap-3">
            <ParrCtaLink
              href={sharedHref}
              page={PAGE_PATH}
              cta="primary"
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
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/12 bg-white/6 px-6 text-sm font-black uppercase tracking-[0.16em] text-white transition hover:bg-white/10"
            >
              Price Private Group Ride
            </ParrCtaLink>
          </div>
          <section className="mt-6 rounded-[1.6rem] border border-cyan-300/20 bg-cyan-500/10 p-5">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-200">Short answer</p>
            <p className="mt-3 text-sm leading-7 text-zinc-200">
              The shared shuttle is the default if you want the ride home handled before
              the show starts. Uber is the fallback for people willing to wait after the
              show and absorb surge pricing.
            </p>
          </section>
          <div className="mt-6 grid gap-4 md:grid-cols-[1.25fr_0.875fr_0.875fr]">
            <article className="rounded-[1.6rem] border border-cyan-300/30 bg-cyan-500/10 p-6 shadow-[0_18px_60px_rgba(61,243,255,0.12)]">
              <div className="text-[11px] font-black uppercase tracking-[0.18em] text-cyan-200">Recommended</div>
              <h2 className="mt-2 text-2xl font-black text-white">Shared Shuttle</h2>
              <p className="mt-3 text-sm leading-7 text-zinc-300">
                Pre-booked, planned return, and the clearest concert-night flow for most
                people.
              </p>
            </article>
            <article className="rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-5 opacity-85">
              <div className="text-[11px] font-black uppercase tracking-[0.18em] text-[#ffb07c]">Alternative</div>
              <h2 className="mt-2 text-xl font-black text-white">Uber</h2>
              <p className="mt-3 text-sm leading-7 text-zinc-300">
                Only choose this if you&apos;re okay waiting after the show and paying surge pricing.
              </p>
            </article>
            <article className="rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-5 opacity-85">
              <div className="text-[11px] font-black uppercase tracking-[0.18em] text-[#ffb07c]">Alternative</div>
              <h2 className="mt-2 text-xl font-black text-white">Drive yourself</h2>
              <p className="mt-3 text-sm leading-7 text-zinc-300">
                Only choose this if you&apos;re okay dealing with parking, walking, and traffic leaving the venue.
              </p>
            </article>
          </div>
          <section className="mt-6 rounded-[1.6rem] border border-[#ffb07c]/20 bg-[#ffb07c]/10 p-5">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#ffd6bc]">Decision rule</p>
            <p className="mt-3 text-sm leading-7 text-zinc-200">
              Reserve the shared shuttle if you want the easy default. Choose private only if your group needs its own vehicle and tighter control.
            </p>
            <ul className="mt-4 space-y-2 text-sm leading-7 text-zinc-200">
              <li>• Parking chaos avoided.</li>
              <li>• No post-show waiting around the rideshare zone.</li>
              <li>• Predictable timing before and after the concert.</li>
            </ul>
          </section>
          <section className="mt-6 rounded-[1.6rem] border border-white/10 bg-white/[0.05] p-5">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-200">What happens next</p>
            <h2 className="mt-3 text-2xl font-bold text-white">Book directly if the answer is already clear</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-300">
              Click the shared shuttle CTA and Party at Red Rocks opens the booking path.
              DCC makes the decision; Party at Red Rocks handles the live ride execution.
            </p>
          </section>
          <p className="mt-4 text-sm leading-7 text-zinc-400">
            DCC keeps the decision clear; Party at Red Rocks handles the live transportation execution. If you still need the broader compare page first, use the{" "}
            <Link href="/red-rocks-transportation" className="font-semibold text-cyan-200 underline decoration-cyan-300/50 underline-offset-4">
              main Red Rocks transportation hub
            </Link>
            .
          </p>
          <div className="mt-5 flex flex-wrap gap-3 text-sm">
            <Link href="/red-rocks-transportation" className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 hover:bg-white/10">
              Red Rocks transportation
            </Link>
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
        </header>
      </div>
    </main>
  );
}
