import type { Metadata } from "next";
import Link from "next/link";
import ParrCtaLink from "@/app/components/dcc/ParrCtaLink";
import RedRocksFunnelTelemetry from "@/app/components/dcc/RedRocksFunnelTelemetry";
import { buildParrSharedRedRocksUrl } from "@/lib/dcc/contracts/dccParrBridge";

export const metadata: Metadata = {
  title: "Red Rocks Shuttle vs Uber | Which Is Better After the Show?",
  description:
    "For most people, a Red Rocks shuttle is more reliable than Uber after the show. Compare surge risk, pickup chaos, and the cleanest ride-home option.",
  alternates: { canonical: "/red-rocks-shuttle-vs-uber" },
  openGraph: {
    title: "Red Rocks Shuttle vs Uber | Which Is Better After the Show?",
    description:
      "Uber can work on the way in. Shuttle usually wins on the way home. This page explains why.",
    url: "/red-rocks-shuttle-vs-uber",
    type: "article",
  },
};

const PAGE_PATH = "/red-rocks-shuttle-vs-uber";

export default function RedRocksShuttleVsUberPage() {
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
            Shuttle usually beats Uber at Red Rocks for one reason: the ride home is where the plan breaks.
          </h1>
          <p className="mt-4 max-w-4xl text-base leading-8 text-zinc-300">
            Uber can feel fine before the show. After the encore, it turns into surge pricing, pickup confusion, and waiting in a crowd that is all trying to leave at once. If you already know you want the safer move, stop comparing and book the shuttle.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <ParrCtaLink
              href={sharedBookingHref}
              page={PAGE_PATH}
              cta="primary"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#3df3ff] px-6 text-sm font-black uppercase tracking-[0.16em] text-[#07111d] transition hover:bg-[#62f6ff]"
            >
              Book The Shuttle
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
            <div className="text-[11px] font-black uppercase tracking-[0.18em] text-[#ffb07c]">Uber failure point</div>
            <p className="mt-3 text-sm leading-7 text-zinc-300">
              The problem is rarely the ride in. It is the compressed exit when thousands of people open the app at the same time.
            </p>
          </article>
          <article className="rounded-[1.6rem] border border-white/10 bg-white/[0.05] p-5">
            <div className="text-[11px] font-black uppercase tracking-[0.18em] text-[#ffb07c]">Shuttle advantage</div>
            <p className="mt-3 text-sm leading-7 text-zinc-300">
              Shuttle removes the hardest part of the decision by solving the ride home before the venue empties out.
            </p>
          </article>
          <article className="rounded-[1.6rem] border border-white/10 bg-white/[0.05] p-5">
            <div className="text-[11px] font-black uppercase tracking-[0.18em] text-[#ffb07c]">Best-fit user</div>
            <p className="mt-3 text-sm leading-7 text-zinc-300">
              Visitors staying in Denver who want certainty, fewer moving parts, and less chance of the night dragging on.
            </p>
          </article>
        </section>

        <section className="rounded-[1.9rem] border border-cyan-400/20 bg-cyan-500/10 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-200">Short answer</p>
          <h2 className="mt-3 text-3xl font-black">If your real question is what happens after the show, shuttle is usually the better answer.</h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-200">
            Uber still works for people who are comfortable gambling on price and pickup timing. That is not most people. Most people want the night solved, not one more uncertain step after the encore.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <article className="rounded-[1.5rem] border border-cyan-300/20 bg-[#08141d] p-5">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-200">Why shuttle wins</p>
              <ul className="mt-4 space-y-2 text-sm leading-7 text-zinc-200">
                <li>• The return trip is decided before the crowd compresses.</li>
                <li>• You avoid the worst surge and pickup uncertainty window.</li>
                <li>• The choice is clearer for first-time visitors and out-of-town groups.</li>
              </ul>
            </article>
            <article className="rounded-[1.5rem] border border-white/10 bg-white/[0.05] p-5">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">When Uber is acceptable</p>
              <ul className="mt-4 space-y-2 text-sm leading-7 text-zinc-200">
                <li>• You are fine waiting longer than expected after the show.</li>
                <li>• You care more about improvisation than certainty.</li>
                <li>• Your group accepts that the ride home may cost more and feel worse.</li>
              </ul>
            </article>
          </div>
        </section>

        <section className="rounded-[1.9rem] border border-white/10 bg-[linear-gradient(180deg,rgba(10,16,32,0.96),rgba(6,9,18,0.96))] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.26)]">
          <p className="text-xs uppercase tracking-[0.2em] text-[#ffb07c]">Recommendation</p>
          <h2 className="mt-3 text-3xl font-black">If you already know you do not want a messy pickup after the show, stop here and book the shuttle.</h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-300">
            This page exists to answer one narrow question. For most people, the answer is shuttle. If you still need to compare parking and the broader venue plan, go to the transport hub. Otherwise move straight to booking.
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
          <Link href="/how-to-get-to-red-rocks-without-parking-hassle" className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 hover:bg-white/10">
            Red Rocks without parking hassle
          </Link>
          <Link href="/best-way-to-leave-red-rocks" className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 hover:bg-white/10">
            Best way to leave
          </Link>
        </div>
      </div>
    </main>
  );
}
