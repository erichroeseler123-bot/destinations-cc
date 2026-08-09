import type { Metadata } from "next";
import { Suspense } from "react";
import AskDccClient from "./AskDccClient";

export const metadata: Metadata = {
  title: "Ask DCC | Travel Decision Assistant",
  description: "Ask Destination Command Center a travel decision question. DCC searches its published research graph first, then routes to the right specialist only when the decision is clear.",
  alternates: { canonical: "/ask" },
};

export default function AskDccPage() {
  return (
    <main className="min-h-screen bg-[#090d13] text-slate-100">
      <section className="mx-auto max-w-5xl px-5 pb-8 pt-16 text-center sm:px-8 md:pt-24">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-300">Destination Command Center · conversational decision layer</p>
        <h1 className="mt-5 text-5xl font-black tracking-[-0.05em] text-white sm:text-6xl md:text-7xl">What are you trying to figure out?</h1>
        <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-300">Ask about the trip, the tradeoff, the group, the timing, or the thing you are worried about. DCC traces the published decision graph, explains the useful answer, shows the research it used, and only then offers the governed next step.</p>
      </section>
      <Suspense fallback={<div className="mx-auto max-w-5xl px-5 pb-20 text-sm text-slate-400 sm:px-8">Loading Ask DCC…</div>}><AskDccClient /></Suspense>
    </main>
  );
}
