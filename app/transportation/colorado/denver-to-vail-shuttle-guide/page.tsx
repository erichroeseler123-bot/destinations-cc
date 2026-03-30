import type { Metadata } from "next";
import Link from "next/link";
import NextStepEngine from "@/app/components/dcc/NextStepEngine";
import type { RecommendationAction } from "@/lib/dcc/handoffAnalytics";

export const metadata: Metadata = {
  title: "Denver to Vail Shuttle Guide | Timing, Group Fit, and Transfer Logic",
  description:
    "DCC authority page for Denver to Vail shuttle decisions, transfer timing, and group-fit before execution on GOSNO.",
  alternates: { canonical: "/transportation/colorado/denver-to-vail-shuttle-guide" },
};

const actions: RecommendationAction[] = [
  {
    id: "gosno-vail",
    label: "Continue to GOSNO Vail Shuttle",
    href: "/denver-to-vail-shuttle",
    kind: "internal",
    score: 3,
    reason: "Use the execution lane once the traveler already knows the corridor and transfer day.",
  },
  {
    id: "colorado-directory",
    label: "Colorado transportation directory",
    href: "/transportation/colorado",
    kind: "internal",
    score: 2,
    reason: "Best when the traveler still needs to compare venue, corridor, and region-level transport options.",
  },
  {
    id: "ski-shuttle",
    label: "Broader ski shuttle lane",
    href: "/ski-shuttle",
    kind: "internal",
    score: 1,
    reason: "Best when the traveler knows the trip type but not yet the exact corridor.",
  },
];

export default function DenverToVailShuttleGuidePage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-5xl px-6 py-16 space-y-8">
        <header className="rounded-[2rem] border border-white/10 bg-white/5 p-7">
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Colorado ski-transfer authority</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">
            Denver to Vail shuttle planning should solve timing and baggage friction before price-only comparison.
          </h1>
          <p className="mt-4 max-w-4xl text-base leading-8 text-zinc-300">
            DCC’s job here is to help the traveler choose the right transfer pattern: shared shuttle, private ride,
            or flexible backup plan. The satellite execution site should come after that decision.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-2">
          <article className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-2xl font-bold">When shared shuttle is strongest</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-300">
              Strongest for visitors arriving on predictable flight windows with ski bags, standard hotel drop-off needs,
              and less desire to customize stops.
            </p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-2xl font-bold">When private transfer wins</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-300">
              Strongest for groups, tight arrival timing, premium lodging, or travelers who care more about control than seat price.
            </p>
          </article>
        </section>

        <NextStepEngine
          title="Best next step for this ski-transfer intent"
          description="DCC should own the corridor comparison and then route the traveler into the correct execution lane."
          actions={actions}
        />

        <div className="flex flex-wrap gap-3">
          <Link href="/transportation/colorado" className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm hover:bg-white/10">
            Colorado transportation directory
          </Link>
          <Link href="/authority" className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm hover:bg-white/10">
            Authority hub
          </Link>
        </div>
      </div>
    </main>
  );
}
