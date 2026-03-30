import type { Metadata } from "next";
import Link from "next/link";
import ParrCtaLink from "@/app/components/dcc/ParrCtaLink";
import RedRocksFunnelTelemetry from "@/app/components/dcc/RedRocksFunnelTelemetry";
import { buildParrSharedRedRocksUrl } from "@/lib/dcc/contracts/dccParrBridge";

export const metadata: Metadata = {
  title: "Best Way to Leave Red Rocks | Fastest Reliable Exit",
  description:
    "For most people, the best way to leave Red Rocks is to pre-book the ride home and remove the exit scramble before the show starts.",
  alternates: { canonical: "/best-way-to-leave-red-rocks" },
  openGraph: {
    title: "Best Way to Leave Red Rocks | Fastest Reliable Exit",
    description:
      "Leaving Red Rocks is where the night usually gets messy. This page explains the cleanest way out.",
    url: "/best-way-to-leave-red-rocks",
    type: "article",
  },
};

const PAGE_PATH = "/best-way-to-leave-red-rocks";

export default function BestWayToLeaveRedRocksPage() {
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
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Red Rocks capstone feeder</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">
            The best way to leave Red Rocks without getting stuck is a pre-booked shuttle.
          </h1>
          <p className="mt-4 max-w-4xl text-base leading-8 text-zinc-300">
            The night usually does not break during the show. It breaks when thousands of people try to leave at once. Parking turns into a slow crawl, Uber gets brittle fast, and waiting around after the encore is where the plan falls apart. If you want the cleanest exit, solve the ride home before the first song.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <ParrCtaLink
              href={sharedBookingHref}
              page={PAGE_PATH}
              cta="primary"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#3df3ff] px-6 text-sm font-black uppercase tracking-[0.16em] text-[#07111d] transition hover:bg-[#62f6ff]"
            >
              Lock Your Ride Home
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
            <div className="text-[11px] font-black uppercase tracking-[0.18em] text-[#ffb07c]">Exit collapse point</div>
            <p className="mt-3 text-sm leading-7 text-zinc-300">
              Red Rocks exit friction hits all at once: walking, traffic, pickup confusion, and everyone trying to move at the same time.
            </p>
          </article>
          <article className="rounded-[1.6rem] border border-white/10 bg-white/[0.05] p-5">
            <div className="text-[11px] font-black uppercase tracking-[0.18em] text-[#ffb07c]">Best answer</div>
            <p className="mt-3 text-sm leading-7 text-zinc-300">
              Shuttle wins because it gives you a defined ride home instead of forcing one more decision into the worst moment of the night.
            </p>
          </article>
          <article className="rounded-[1.6rem] border border-white/10 bg-white/[0.05] p-5">
            <div className="text-[11px] font-black uppercase tracking-[0.18em] text-[#ffb07c]">Best-fit user</div>
            <p className="mt-3 text-sm leading-7 text-zinc-300">
              Anyone whose main concern is getting out cleanly, getting back to Denver, and not ending the night in a post-show scramble.
            </p>
          </article>
        </section>

        <section className="rounded-[1.9rem] border border-cyan-400/20 bg-cyan-500/10 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-200">Short answer</p>
          <h2 className="mt-3 text-3xl font-black">If your main question is how to get out of Red Rocks without the night dragging on, stop here and book the shuttle.</h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-200">
            This is the capstone answer for the cluster. Uber can work until the crowd compresses. Driving can work until the lot exit slows to a crawl. Waiting around can work if you do not mind ending the night in chaos. Shuttle is the cleanest default because it removes the scramble.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <article className="rounded-[1.5rem] border border-cyan-300/20 bg-[#08141d] p-5">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-200">Why shuttle wins</p>
              <ul className="mt-4 space-y-2 text-sm leading-7 text-zinc-200">
                <li>• Your ride home is defined before the venue empties out.</li>
                <li>• You avoid the worst pickup and exit uncertainty window.</li>
                <li>• The night ends with a plan, not one more decision.</li>
              </ul>
            </article>
            <article className="rounded-[1.5rem] border border-white/10 bg-white/[0.05] p-5">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">Why the alternatives lose</p>
              <ul className="mt-4 space-y-2 text-sm leading-7 text-zinc-200">
                <li>• Uber becomes less reliable exactly when everyone needs it.</li>
                <li>• Driving adds a slower exit and usually a longer walk than people expect.</li>
                <li>• Waiting around after the encore is the weakest possible plan.</li>
              </ul>
            </article>
          </div>
        </section>

        <section className="rounded-[1.9rem] border border-white/10 bg-[linear-gradient(180deg,rgba(10,16,32,0.96),rgba(6,9,18,0.96))] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.26)]">
          <p className="text-xs uppercase tracking-[0.2em] text-[#ffb07c]">Recommendation</p>
          <h2 className="mt-3 text-3xl font-black">For most people, the strongest exit plan is to pre-book the shuttle and stop thinking about the ride home.</h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-300">
            This page is not here to reopen the comparison. It is here to resolve it. If you still need the broader parent page, use the hub. Otherwise move straight to booking.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <ParrCtaLink
              href={recommendationBookingHref}
              page={PAGE_PATH}
              cta="recommendation-primary"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#3df3ff] px-6 text-sm font-black uppercase tracking-[0.16em] text-[#07111d] transition hover:bg-[#62f6ff]"
            >
              Secure Your Round-Trip Shuttle
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
          <Link href="/how-to-get-to-red-rocks-without-parking-hassle" className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 hover:bg-white/10">
            Without parking hassle
          </Link>
        </div>
      </div>
    </main>
  );
}
