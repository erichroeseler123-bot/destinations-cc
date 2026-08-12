import type { Metadata } from "next";
import Link from "next/link";
import { getGraphHealth } from "@/lib/dcc/graph/health";
import { listPlaceGraphSummaries } from "@/lib/dcc/graph/placeActionGraph";
import { getPlanetarySummary } from "@/lib/dcc/memory/resolve";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Live Travel Signals | Destination Command Center",
  description:
    "A public gateway into DCC's existing graph, city, port, cruise, trend, and machine-readable travel intelligence.",
  alternates: { canonical: "/signals" },
};

const SYSTEMS = [
  {
    title: "Alerts & trends",
    body: "Graph-backed destination pressure, recent events, cruise-port risk, and operational trend signals already tracked by DCC.",
    href: "/alerts",
    label: "Open alerts & trends",
  },
  {
    title: "Ports",
    body: "Port authority pages and cruise-day context built from DCC's port and cruise intelligence layers.",
    href: "/ports",
    label: "Browse ports",
  },
  {
    title: "Decision guides",
    body: "Travel decisions organized around timing, tradeoffs, transportation, cruise-day constraints, and what to do next.",
    href: "/guides",
    label: "Browse guides",
  },
  {
    title: "Ask DCC",
    body: "Use the decision graph in plain English instead of starting with another list of travel products.",
    href: "/ask",
    label: "Ask a question",
  },
];

export default function SignalsPage() {
  const graph = getGraphHealth();
  const places = listPlaceGraphSummaries(500);
  const memory = getPlanetarySummary();
  const degrading = places.filter((row) => row.trend === "degrading").length;
  const improving = places.filter((row) => row.trend === "improving").length;

  return (
    <main className="min-h-screen bg-[#090d13] text-slate-100">
      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <p className="text-sm font-black uppercase tracking-[0.22em] text-cyan-300">Destination Command Center · Existing intelligence</p>
        <h1 className="mt-4 max-w-4xl text-5xl font-black tracking-[-0.045em] text-white sm:text-6xl">The systems behind DCC, made visible.</h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
          DCC already maintains graph, city, port, cruise, trend, memory, routing, and machine-readable layers. This page is the public doorway into the parts that are useful to travelers now.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-800 bg-[#0d131d] p-5"><div className="text-xs font-black uppercase tracking-wider text-slate-500">Places tracked</div><div className="mt-2 text-3xl font-black">{graph.places}</div></div>
          <div className="rounded-2xl border border-slate-800 bg-[#0d131d] p-5"><div className="text-xs font-black uppercase tracking-wider text-slate-500">Graph edges</div><div className="mt-2 text-3xl font-black">{graph.edges}</div></div>
          <div className="rounded-2xl border border-slate-800 bg-[#0d131d] p-5"><div className="text-xs font-black uppercase tracking-wider text-slate-500">Improving</div><div className="mt-2 text-3xl font-black">{improving}</div></div>
          <div className="rounded-2xl border border-slate-800 bg-[#0d131d] p-5"><div className="text-xs font-black uppercase tracking-wider text-slate-500">Degrading</div><div className="mt-2 text-3xl font-black">{degrading}</div></div>
        </div>

        {graph.stale ? (
          <div className="mt-5 rounded-2xl border border-amber-400/20 bg-amber-500/10 px-5 py-4 text-sm text-amber-100">
            Some graph data is currently marked stale. DCC exposes that condition instead of presenting old signals as live facts.
          </div>
        ) : null}

        <section className="mt-14">
          <h2 className="text-3xl font-black tracking-tight text-white">Use what is already built</h2>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            {SYSTEMS.map((system) => (
              <Link key={system.href} href={system.href} className="rounded-3xl border border-slate-800 bg-[#0d131d] p-6 transition hover:-translate-y-1 hover:border-cyan-700">
                <h3 className="text-xl font-black text-white">{system.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">{system.body}</p>
                <span className="mt-5 inline-block text-sm font-bold text-cyan-200">{system.label} →</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-14 rounded-3xl border border-slate-800 bg-[#0d131d] p-7">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-300">Machine-readable DCC</p>
          <h2 className="mt-3 text-2xl font-black text-white">The network is also published for machines.</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
            DCC already exposes public network and agent surfaces. These are useful for search systems, AI agents, diagnostics, and satellite integrations without turning the consumer site into an engineering console.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a href="/api/public/network-feed" className="rounded-xl border border-slate-700 px-4 py-3 text-sm font-bold hover:border-cyan-600">Network feed</a>
            <a href="/agent.json" className="rounded-xl border border-slate-700 px-4 py-3 text-sm font-bold hover:border-cyan-600">Agent manifest</a>
            <a href="/llms.txt" className="rounded-xl border border-slate-700 px-4 py-3 text-sm font-bold hover:border-cyan-600">LLM guidance</a>
          </div>
          <p className="mt-5 text-xs text-slate-500">Current memory-event count: {memory?.count ?? 0}. Live and historical signals are kept distinct from permanent destination facts.</p>
        </section>
      </section>
    </main>
  );
}
