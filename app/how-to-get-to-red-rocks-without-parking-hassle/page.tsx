import type { Metadata } from "next";
import Link from "next/link";
import ParrCtaLink from "@/app/components/dcc/ParrCtaLink";
import RedRocksFunnelTelemetry from "@/app/components/dcc/RedRocksFunnelTelemetry";
import { buildParrSharedRedRocksUrl } from "@/lib/dcc/contracts/dccParrBridge";

export const metadata: Metadata = {
  title: "How to Get to Red Rocks Without Parking Hassle | Best Options",
  description:
    "If you want to get to Red Rocks without dealing with parking, walking, or post-show car chaos, a shuttle is usually the easiest answer.",
  alternates: { canonical: "/how-to-get-to-red-rocks-without-parking-hassle" },
  openGraph: {
    title: "How to Get to Red Rocks Without Parking Hassle | Best Options",
    description:
      "Most Red Rocks transport problems are really parking problems. This page explains the cleanest way around that.",
    url: "/how-to-get-to-red-rocks-without-parking-hassle",
    type: "article",
  },
};

const PAGE_PATH = "/how-to-get-to-red-rocks-without-parking-hassle";

export default function NoParkingHassleGuidePage() {
  const sharedBookingHref = buildParrSharedRedRocksUrl({
    sourcePage: PAGE_PATH,
    cta: "primary",
  });

  const recommendationBookingHref = buildParrSharedRedRocksUrl({
    sourcePage: PAGE_PATH,
    cta: "recommendation-primary",
  });

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <RedRocksFunnelTelemetry page={PAGE_PATH} />
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-16">
        <header className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(61,243,255,0.14),transparent_24%),linear-gradient(180deg,rgba(9,15,31,0.96),rgba(7,11,25,0.96))] p-7 shadow-[0_20px_70px_rgba(0,0,0,0.35)]">
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Red Rocks feeder page</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">
            If you already know you do not want to deal with Red Rocks parking, shuttle is usually the cleanest answer.
          </h1>
          <p className="mt-4 max-w-4xl text-base leading-8 text-zinc-300">
            Parking sounds manageable until the real costs show up: where you end up parked, how far you walk, how early you need to arrive, and how long it takes to get out after the encore. If your goal is to remove that entire layer, solve the ride before the show starts.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <ParrCtaLink
              href={sharedBookingHref}
              page={PAGE_PATH}
              cta="primary"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#3df3ff] px-6 text-sm font-black uppercase tracking-[0.16em] text-[#07111d] transition hover:bg-[#62f6ff]"
            >
              Skip The Parking Hassle
            </ParrCtaLink>
            <Link
              href="/red-rocks-transportation"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/14 bg-white/6 px-6 text-sm font-black uppercase tracking-[0.16em] text-white transition hover:bg-white/10"
            >
              Compare The Full Transport Plan
            </Link>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-[1.6rem] border border-white/10 bg-white/[0.05] p-5">
            <div className="text-[11px] font-black uppercase tracking-[0.18em] text-[#ffb07c]">Parking failure point</div>
            <p className="mt-3 text-sm leading-7 text-zinc-300">
              The pain is not just finding a lot. It is the walking, timing pressure, and slower exit that stack onto the night.
            </p>
          </article>
          <article className="rounded-[1.6rem] border border-white/10 bg-white/[0.05] p-5">
            <div className="text-[11px] font-black uppercase tracking-[0.18em] text-[#ffb07c]">Shuttle advantage</div>
            <p className="mt-3 text-sm leading-7 text-zinc-300">
              Shuttle removes the parking decision entirely and makes the return plan clearer before the venue empties out.
            </p>
          </article>
          <article className="rounded-[1.6rem] border border-white/10 bg-white/[0.05] p-5">
            <div className="text-[11px] font-black uppercase tracking-[0.18em] text-[#ffb07c]">Best-fit user</div>
            <p className="mt-3 text-sm leading-7 text-zinc-300">
              People staying in Denver or Golden who want the night to feel lighter instead of building around lot strategy.
            </p>
          </article>
        </section>

        <section className="rounded-[1.9rem] border border-cyan-400/20 bg-cyan-500/10 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-200">Short answer</p>
          <h2 className="mt-3 text-3xl font-black">If parking is the part you already know you do not want, stop treating driving like the default.</h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-200">
            Most no-parking Red Rocks searches are really asking the same thing: how do I make the night simpler? For most people, the answer is shared shuttle. It removes the lot, the uphill walk, and the slow post-show exit from the plan.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <article className="rounded-[1.5rem] border border-cyan-300/20 bg-[#08141d] p-5">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-200">Why shuttle wins</p>
              <ul className="mt-4 space-y-2 text-sm leading-7 text-zinc-200">
                <li>• You remove the parking strategy before the night starts.</li>
                <li>• You avoid the long walk and slow lot exit that wear the night down.</li>
                <li>• The plan is clearer for visitors who do not know the venue well.</li>
              </ul>
            </article>
            <article className="rounded-[1.5rem] border border-white/10 bg-white/[0.05] p-5">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">When driving still makes sense</p>
              <ul className="mt-4 space-y-2 text-sm leading-7 text-zinc-200">
                <li>• You are comfortable optimizing for lot logistics instead of convenience.</li>
                <li>• Your group accepts a longer walk and a slower exit.</li>
                <li>• You care more about full car control than reducing friction.</li>
              </ul>
            </article>
          </div>
        </section>

        <section className="rounded-[1.9rem] border border-white/10 bg-[linear-gradient(180deg,rgba(10,16,32,0.96),rgba(6,9,18,0.96))] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.26)]">
          <p className="text-xs uppercase tracking-[0.2em] text-[#ffb07c]">Recommendation</p>
          <h2 className="mt-3 text-3xl font-black">If your goal is a Red Rocks night without lot stress, book the shuttle and treat parking as solved.</h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-300">
            This page exists to solve one narrow constraint. For most people, the move is shuttle. If you still need to compare the broader venue stack, use the decision hub. Otherwise go straight to booking.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <ParrCtaLink
              href={recommendationBookingHref}
              page={PAGE_PATH}
              cta="recommendation-primary"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#3df3ff] px-6 text-sm font-black uppercase tracking-[0.16em] text-[#07111d] transition hover:bg-[#62f6ff]"
            >
              Book Your Guaranteed Ride Home
            </ParrCtaLink>
            <Link
              href="/red-rocks-transportation"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/14 bg-white/6 px-6 text-sm font-black uppercase tracking-[0.16em] text-white transition hover:bg-white/10"
            >
              Use The Decision Hub Instead
            </Link>
          </div>
        </section>

        <div className="flex flex-wrap gap-3 text-sm">
          <Link href="/red-rocks-transportation" className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 hover:bg-white/10">
            Transportation decision hub
          </Link>
          <Link href="/red-rocks-shuttle-vs-uber" className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 hover:bg-white/10">
            Shuttle vs Uber
          </Link>
          <Link href="/best-way-to-leave-red-rocks" className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 hover:bg-white/10">
            Best way to leave
          </Link>
        </div>
      </div>
    </main>
  );
}
