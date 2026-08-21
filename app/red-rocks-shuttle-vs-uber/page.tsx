import type { Metadata } from "next";
import Link from "next/link";
import ParrCtaLink from "@/app/components/dcc/ParrCtaLink";
import RedRocksFunnelTelemetry from "@/app/components/dcc/RedRocksFunnelTelemetry";
import { buildParrPrivateRedRocksUrl } from "@/lib/dcc/contracts/dccParrBridge";

export const metadata: Metadata = {
  title: "Red Rocks Private Ride vs Uber | Which Is Better After the Show?",
  description:
    "Compare a pre-booked private Red Rocks ride with Uber after the show, including surge risk, pickup friction, and the value of having one vehicle for your group.",
  alternates: { canonical: "/red-rocks-shuttle-vs-uber" },
  openGraph: {
    title: "Red Rocks Private Ride vs Uber | Which Is Better After the Show?",
    description:
      "Uber can work on the way in. A pre-booked private ride solves the harder part: getting your group home after the show.",
    url: "/red-rocks-shuttle-vs-uber",
    type: "article",
  },
};

const PAGE_PATH = "/red-rocks-shuttle-vs-uber";

export default function RedRocksShuttleVsUberPage() {
  const privateBookingHref = buildParrPrivateRedRocksUrl({
    sourcePage: PAGE_PATH,
    cta: "primary",
    decision_option: "private",
    decision_product: "parr-private",
    requested_lane: "private",
  });

  const recommendationBookingHref = buildParrPrivateRedRocksUrl({
    sourcePage: PAGE_PATH,
    cta: "recommendation-primary",
    decision_option: "private",
    decision_product: "parr-private",
    requested_lane: "private",
  });

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <RedRocksFunnelTelemetry page={PAGE_PATH} />
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-16">
        <header className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(61,243,255,0.14),transparent_24%),linear-gradient(180deg,rgba(9,15,31,0.96),rgba(7,11,25,0.96))] p-7 shadow-[0_20px_70px_rgba(0,0,0,0.35)]">
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Red Rocks transport comparison</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">
            Private Red Rocks transportation beats improvising after the show for one reason: your ride home is already solved.
          </h1>
          <p className="mt-4 max-w-4xl text-base leading-8 text-zinc-300">
            Uber can feel easy before the show. After the encore, thousands of people are trying to leave at once. Party at Red Rocks now offers private transportation only, so your group can reserve one vehicle for the concert night instead of gambling on post-show pickup timing.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <ParrCtaLink
              href={privateBookingHref}
              page={PAGE_PATH}
              cta="primary"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#3df3ff] px-6 text-sm font-black uppercase tracking-[0.16em] text-[#07111d] transition hover:bg-[#62f6ff]"
            >
              Reserve Private Transportation
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
            <div className="text-[11px] font-black uppercase tracking-[0.18em] text-[#ffb07c]">Private ride advantage</div>
            <p className="mt-3 text-sm leading-7 text-zinc-300">
              Your group has one vehicle and one plan for the night, with the return already accounted for before the encore ends.
            </p>
          </article>
          <article className="rounded-[1.6rem] border border-white/10 bg-white/[0.05] p-5">
            <div className="text-[11px] font-black uppercase tracking-[0.18em] text-[#ffb07c]">Current offer</div>
            <p className="mt-3 text-sm leading-7 text-zinc-300">
              Party at Red Rocks offers private service: a $399 Private Suburban, with a $599 private van option for larger groups.
            </p>
          </article>
        </section>

        <section className="rounded-[1.9rem] border border-cyan-400/20 bg-cyan-500/10 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-200">Short answer</p>
          <h2 className="mt-3 text-3xl font-black">If your group wants the ride home decided before the show starts, reserve private transportation.</h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-200">
            Uber can still work if you are comfortable with changing prices, pickup timing, and post-show congestion. A private ride costs more than improvising, but it removes those variables and keeps the group together.
          </p>
        </section>

        <section className="rounded-[1.9rem] border border-white/10 bg-[linear-gradient(180deg,rgba(10,16,32,0.96),rgba(6,9,18,0.96))] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.26)]">
          <p className="text-xs uppercase tracking-[0.2em] text-[#ffb07c]">Recommendation</p>
          <h2 className="mt-3 text-3xl font-black">Already know you do not want to manage parking or post-show rideshare? Go straight to the private booking path.</h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-300">
            Party at Red Rocks currently offers private transportation only. The standard private Suburban is $399, and larger groups can choose the $599 private van option.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <ParrCtaLink
              href={recommendationBookingHref}
              page={PAGE_PATH}
              cta="recommendation-primary"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#3df3ff] px-6 text-sm font-black uppercase tracking-[0.16em] text-[#07111d] transition hover:bg-[#62f6ff]"
            >
              Reserve Your Private Ride
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
