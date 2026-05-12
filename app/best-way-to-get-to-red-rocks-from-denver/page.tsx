import type { Metadata } from "next";
import Link from "next/link";
import RedRocksFunnelTelemetry from "@/app/components/dcc/RedRocksFunnelTelemetry";
import { buildDecisionContinuationUrl } from "@/lib/dcc/contracts/decisionContinuation";

export const metadata: Metadata = {
  title: "Best Way to Get to Red Rocks From Denver | Shuttle vs Driving vs Uber",
  description:
    "The best way to get to Red Rocks from Denver usually comes down to one thing: whether you want the ride home solved before the show starts.",
  alternates: { canonical: "/best-way-to-get-to-red-rocks-from-denver" },
  openGraph: {
    title: "Best Way to Get to Red Rocks From Denver | Shuttle vs Driving vs Uber",
    description:
      "For most Denver visitors, shuttle is the cleanest Red Rocks move because it solves the return before the encore.",
    url: "/best-way-to-get-to-red-rocks-from-denver",
    type: "article",
  },
};

const PAGE_PATH = "/best-way-to-get-to-red-rocks-from-denver";

const options = [
  {
    title: "Shuttle",
    body: "Recommended for most visitors. Round-trip is handled before the show starts.",
  },
  {
    title: "Drive",
    body: "Works if you want control and accept parking strategy, walking load, and a slower exit.",
  },
  {
    title: "Uber / Lyft",
    body: "Usually fine on the way in. Less reliable on the way out when the crowd leaves together.",
  },
];

export default function BestWayToGetToRedRocksFromDenverPage() {
  const hubHref = buildDecisionContinuationUrl("https://www.destinationcommandcenter.com/red-rocks-transportation", {
    sourcePage: PAGE_PATH,
    corridor: "red-rocks-transport",
    cta: "primary",
    action: "continue_to_red_rocks_transport_hub",
    option: "shuttle",
    product: "shared-vs-private-decision",
    entryMode: "dcc-first",
    state: "chosen",
    destinationSurface: "dcc",
  });

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <RedRocksFunnelTelemetry page={PAGE_PATH} />
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-16">
        <header className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(61,243,255,0.14),transparent_24%),linear-gradient(180deg,rgba(9,15,31,0.96),rgba(7,11,25,0.96))] p-7 shadow-[0_20px_70px_rgba(0,0,0,0.35)]">
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Red Rocks decision page</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">
            From Denver to Red Rocks, shuttle is the move for most concert nights.
          </h1>
          <section>
            <h2>Decision Locked</h2>
            <p>
              Choose shuttle unless you want to own parking, walking, exit traffic, or
              post-show rideshare risk yourself.
            </p>
          </section>
          <p className="mt-4 max-w-4xl text-base leading-8 text-zinc-300">
            The decision is not really about the ride in. It is whether the ride home is
            already solved before the show starts. For most Denver visitors, shuttle is
            the clean answer.
          </p>
          <section className="mt-5 rounded-[1.5rem] border border-cyan-300/20 bg-cyan-500/10 p-5">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-200">What happens after click</p>
            <p className="mt-3 text-sm leading-7 text-zinc-100">
              DCC carries your shuttle choice into the Red Rocks transportation hub, then
              booking-ready riders continue to Party at Red Rocks.
            </p>
          </section>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={hubHref}
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#3df3ff] px-6 text-sm font-black uppercase tracking-[0.16em] text-[#07111d] transition hover:bg-[#62f6ff]"
            >
              Check Shared Shuttle Availability
            </Link>
            <Link
              href="/red-rocks-transportation"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/14 bg-white/6 px-6 text-sm font-black uppercase tracking-[0.16em] text-white transition hover:bg-white/10"
            >
              Compare Shared vs Private
            </Link>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {options.map((option) => (
              <article key={option.title} className="rounded-[1.6rem] border border-white/10 bg-white/[0.05] p-5">
                <div className="text-[11px] font-black uppercase tracking-[0.18em] text-[#ffb07c]">{option.title}</div>
                <p className="mt-3 text-sm leading-7 text-zinc-300">{option.body}</p>
              </article>
            ))}
          </div>
          <section className="mt-6 rounded-[1.6rem] border border-cyan-300/20 bg-cyan-500/10 p-5">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-200">Decision rule</p>
            <p className="mt-3 text-sm leading-7 text-zinc-200">
              Choose shuttle if you want the cleanest full-night plan. Choose driving only if you want full control and accept the parking burden. Choose Uber only if you accept a weaker return plan after the encore.
            </p>
          </section>
        </header>
      </div>
    </main>
  );
}
