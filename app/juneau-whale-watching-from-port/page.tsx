import type { Metadata } from "next";
import Link from "next/link";
import NextStepEngine from "@/app/components/dcc/NextStepEngine";
import { getPortRecommendationActions } from "@/lib/dcc/handoffAnalytics";

export const metadata: Metadata = {
  title: "Juneau Whale Watching From Cruise Port | Best-Fit Shore Day Decision",
  description:
    "Use DCC to decide whether Juneau whale watching fits your port window before moving into booking execution.",
  alternates: { canonical: "/juneau-whale-watching-from-port" },
};

export default function JuneauWhaleWatchingFromPortPage() {
  const actions = getPortRecommendationActions("juneau-alaska");

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-5xl px-6 py-16 space-y-8">
        <header className="rounded-[2rem] border border-white/10 bg-white/5 p-7">
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Alaska narrow-intent page</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">
            Juneau whale watching from cruise port works best when the day stays excursion-first.
          </h1>
          <p className="mt-4 max-w-4xl text-base leading-8 text-zinc-300">
            DCC should answer the authority question first: is Juneau a whale-watching day, a glacier day, or a split
            day with too much transfer drag to do both well?
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-xl font-bold">Best fit</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-300">Travelers who want one strong wildlife decision instead of trying to overpack the port day.</p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-xl font-bold">Main risk</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-300">Stacking whale watching and glacier logistics into one day can make the return window tighter than it looks.</p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-xl font-bold">DCC role</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-300">Decide if this is the right shore-day lane first, then send the traveler to the execution partner.</p>
          </article>
        </section>

        <NextStepEngine
          title="Best next step for Juneau"
          description="Keep the traveler on the DCC authority layer until the port-day choice is clear, then move into execution."
          actions={actions}
        />

        <div className="flex flex-wrap gap-3">
          <Link href="/cruises/port/juneau-alaska" className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm hover:bg-white/10">
            Juneau cruise port guide
          </Link>
          <Link href="/alaska" className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm hover:bg-white/10">
            Alaska authority hub
          </Link>
        </div>
      </div>
    </main>
  );
}
