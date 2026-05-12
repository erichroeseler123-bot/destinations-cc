import type { Metadata } from "next";
import Link from "next/link";
import RedRocksFunnelTelemetry from "@/app/components/dcc/RedRocksFunnelTelemetry";

export const metadata: Metadata = {
  title: "How to Get to Red Rocks Without Parking: Easy Denver Shuttle Option",
  description:
    "Avoid Red Rocks parking and post-show exit traffic with a simple shuttle option from Denver.",
  alternates: { canonical: "/how-to-get-to-red-rocks-without-parking-hassle" },
  openGraph: {
    title: "How to Get to Red Rocks Without Parking Hassle | Cleanest Move",
    description:
      "Most Red Rocks transport problems are really parking problems. This page explains the cleanest way around that.",
    url: "/how-to-get-to-red-rocks-without-parking-hassle",
    type: "article",
  },
};

const PAGE_PATH = "/how-to-get-to-red-rocks-without-parking-hassle";

export default function NoParkingHassleGuidePage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <RedRocksFunnelTelemetry page={PAGE_PATH} />
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-16">
        <header className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(61,243,255,0.14),transparent_24%),linear-gradient(180deg,rgba(9,15,31,0.96),rgba(7,11,25,0.96))] p-7 shadow-[0_20px_70px_rgba(0,0,0,0.35)]">
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Red Rocks feeder page</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">
            Skip Red Rocks parking. Take the shuttle.
          </h1>
          <section>
            <h2>Decision Locked</h2>
            <p>
              If parking is the problem you want gone, the answer is shuttle. Do not
              turn this into another transport comparison.
            </p>
          </section>
          <p className="mt-4 max-w-4xl text-base leading-8 text-zinc-300">
            For most concert nights, this is the move: take the shared shuttle, remove
            the lot strategy, avoid the uphill parking walk, and keep the exit plan
            handled before the show starts.
          </p>
          <section className="mt-5 rounded-[1.5rem] border border-cyan-300/20 bg-cyan-500/10 p-5">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-200">Quick answer</p>
            <p className="mt-3 text-sm leading-7 text-zinc-100">
              Shared shuttle is the cleanest answer when parking is the problem you want
              to remove.
            </p>
          </section>
          <section className="mt-5 rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-5">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-200">What happens after click</p>
            <p className="mt-3 text-sm leading-7 text-zinc-300">
              The next page confirms shared shuttle vs private, then hands booking-ready
              riders to Party at Red Rocks.
            </p>
          </section>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/red-rocks-transportation"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#3df3ff] px-6 text-sm font-black uppercase tracking-[0.16em] text-[#07111d] transition hover:bg-[#62f6ff]"
            >
              Check Shared Shuttle Availability
            </Link>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-[1.25fr_0.875fr_0.875fr]">
          <article className="rounded-[1.6rem] border border-cyan-300/30 bg-cyan-500/10 p-6 shadow-[0_18px_60px_rgba(61,243,255,0.12)]">
            <div className="text-[11px] font-black uppercase tracking-[0.18em] text-cyan-200">Recommended</div>
            <h2 className="mt-2 text-2xl font-black text-white">Shared Shuttle</h2>
            <p className="mt-3 text-sm leading-7 text-zinc-300">
              The cleanest way to remove lot strategy, uphill walking, and post-show traffic from the night.
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
              Only choose this if you&apos;re okay dealing with parking and traffic leaving the venue.
            </p>
          </article>
        </section>

        <section className="rounded-[1.9rem] border border-cyan-400/20 bg-cyan-500/10 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-200">Short answer</p>
          <h2 className="mt-3 text-3xl font-black">If parking is the part you already know you do not want, stop treating driving like the default.</h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-200">
            Most no-parking Red Rocks searches are really asking the same thing: how do I make the night simpler? The answer is shared shuttle. It removes the lot, the uphill walk, and the slow post-show exit from the plan.
          </p>
          <ul className="mt-4 space-y-2 text-sm leading-7 text-zinc-200">
            <li>• Parking chaos avoided before the show starts.</li>
            <li>• No post-show waiting around rideshare pickup.</li>
            <li>• Predictable timing for getting there and getting back.</li>
          </ul>
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
          <p className="text-xs uppercase tracking-[0.2em] text-[#ffb07c]">Use the hub when you are ready to act</p>
          <h2 className="mt-3 text-3xl font-black">If parking is the problem you want to remove, the next step is the Red Rocks transportation hub.</h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-300">
            This page exists to answer one narrow question fast. Once the answer is shuttle, move into the main hub and make the actual booking decision once: shared for most groups, private when you need tighter control.
          </p>
          <div className="mt-5 rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-200">What happens next</p>
            <p className="mt-2 text-sm leading-7 text-zinc-300">
              Open the Red Rocks transportation hub, confirm shared shuttle or private, then continue to the Party at Red Rocks operator booking path.
            </p>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/red-rocks-transportation"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#3df3ff] px-6 text-sm font-black uppercase tracking-[0.16em] text-[#07111d] transition hover:bg-[#62f6ff]"
            >
              Check shuttle availability
            </Link>
          </div>
          <p className="mt-4 text-sm leading-7 text-zinc-400">
            If you still need another narrow answer first, use a nearby Red Rocks feeder. Otherwise
            go straight into the hub and make the transport decision once.{" "}
            <Link
              href="/red-rocks-transportation"
              className="font-semibold text-cyan-200 underline decoration-cyan-300/50 underline-offset-4"
            >
              Open the Red Rocks transportation hub
            </Link>
            .
          </p>
        </section>

        <div className="flex flex-wrap gap-3 text-sm">
          <Link href="/red-rocks-transportation" className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 hover:bg-white/10">
            Red Rocks transportation
          </Link>
          <Link href="/red-rocks-shuttle" className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 hover:bg-white/10">
            Red Rocks shuttle
          </Link>
          <Link href="/red-rocks-shuttle-vs-uber" className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 hover:bg-white/10">
            Red Rocks shuttle vs Uber
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
      </div>
    </main>
  );
}
