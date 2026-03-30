import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/app/components/dcc/JsonLd";
import { getEffectivePorts } from "@/lib/dcc/ports";
import PortsSearchClient from "@/app/ports/PortsSearchClient";
import { SITE_IDENTITY } from "@/src/data/site-identity";
import { buildArticleJsonLd, buildBreadcrumbJsonLd } from "@/lib/dcc/jsonld";
import StatGrid from "@/app/components/StatGrid";
import CinematicBackdrop from "@/app/components/dcc/CinematicBackdrop";
import RouteHeroMark from "@/app/components/dcc/RouteHeroMark";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Cruise Ports and Embarkation Guides | Destination Command Center",
  description:
    "Find cruise ports, embarkation guidance, nearby planning, and transportation context from Destination Command Center.",
  keywords: [
    "cruise ports",
    "embarkation guides",
    "cruise port guide",
    "ports directory",
    "shore excursion planning",
  ],
  alternates: { canonical: "/ports" },
};

type Port = { slug: string; name: string; area?: string; country?: string; tags?: string[] };

export default function PortsIndex() {
  const ports = getEffectivePorts() as Port[];
  const uniqueAreas = new Set(ports.map((port) => port.area).filter(Boolean));
  const usPorts = ports.filter((port) => port.country === "US").length;

  return (
    <main className="relative min-h-screen overflow-hidden bg-zinc-950 text-white">
      <CinematicBackdrop />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            buildArticleJsonLd({
              path: "/ports",
              headline: "Cruise Ports and Embarkation Guides",
              description:
                "Find cruise ports, embarkation guidance, nearby planning, and transportation context from Destination Command Center.",
            }),
            buildBreadcrumbJsonLd([
              { name: "Home", item: "/" },
              { name: "Ports", item: "/ports" },
            ]),
          ],
        }}
      />
      <div className="relative max-w-6xl mx-auto px-6 py-16 space-y-10">
        <header className="space-y-3">
          <RouteHeroMark eyebrow="Destination Command Center" title="PORTS" tone="emerald" />
          <p className="text-xs uppercase tracking-wider text-zinc-500">Cruise planning</p>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight">Cruise ports and embarkation guides</h1>
          <p className="max-w-3xl text-zinc-300">
            Use this hub to compare embarkation ports, understand what is nearby, and move into the right cruise-planning surface quickly.
          </p>
          <p className="max-w-3xl text-sm text-zinc-500">
            {SITE_IDENTITY.name} helps travelers understand where they are going, what is nearby, and how to move through busy port areas.
          </p>
        </header>

        <section className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-6 space-y-4">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.22em] text-cyan-200">Trip Planning Snapshot</p>
            <h2 className="text-2xl font-bold">What this hub helps you decide quickly</h2>
            <p className="text-sm text-zinc-200">
              Which embarkation port matters, what kind of nearby planning support you need, and whether to move into transfers, shore excursions, or port-specific guides next.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <article className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Best for</p>
              <p className="mt-2 text-sm font-medium text-zinc-100">
                Embarkation planning, nearby hotel stays, transfers, pre-cruise timing, and port-area context.
              </p>
            </article>
            <article className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Typical use</p>
              <p className="mt-2 text-sm font-medium text-zinc-100">
                Start here when the real question is your cruise port, not just the ship or destination region.
              </p>
            </article>
            <article className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Good companion guides</p>
              <p className="mt-2 text-sm font-medium text-zinc-100">
                Cruises • Shore excursions • Tendering • Alerts & Trends
              </p>
            </article>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold">Port network snapshot</h2>
            <p className="text-sm text-zinc-400">
              A quick read on the current directory size and the spread of embarkation regions in the DCC port network.
            </p>
          </div>
          <StatGrid
            items={[
              { label: "Ports listed", value: ports.length },
              { label: "Areas covered", value: uniqueAreas.size },
              { label: "US ports", value: usPorts },
              { label: "Companion planning", value: "Cruises • Transfers • Excursions" },
            ]}
          />
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-bold">How to use the ports directory</h2>
          <div className="mt-4 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-4 text-sm leading-7 text-zinc-300">
              <p>
                Port searches usually mean one of two things: either the traveler is trying to solve embarkation logistics before the cruise starts, or they are trying to understand what the port day actually supports once the ship arrives. That makes a port directory different from a ship or destination page.
              </p>
              <p>
                This hub is meant to route visitors into the right port page first, then into nearby planning, shore excursions, transfer logic, or the cruise explorer if the ship question becomes more important than the port itself.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <div className="text-xs uppercase tracking-[0.18em] text-cyan-300">Best next clicks</div>
              <div className="mt-4 grid gap-3">
                <Link href="/cruises" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm hover:bg-white/10">Cruise explorer</Link>
                <Link href="/airports" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm hover:bg-white/10">Airport guides</Link>
                <Link href="/cruises/shore-excursions" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm hover:bg-white/10">Shore excursions</Link>
                <Link href="/cruises/tendering" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm hover:bg-white/10">Tendering guide</Link>
                <Link href="/alerts" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm hover:bg-white/10">Alerts and trends</Link>
              </div>
            </div>
          </div>
        </section>

        <PortsSearchClient ports={ports} />

        <section className="grid gap-4 md:grid-cols-3">
          <Link href="/cruises" className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-5 hover:bg-cyan-500/20">
            <div className="font-semibold text-cyan-100">Cruises explorer</div>
            <p className="mt-2 text-sm text-zinc-300">
              Move into ships, cruise routes, and embarkation-focused planning once you know the port question.
            </p>
          </Link>
          <Link href="/airports" className="rounded-2xl border border-sky-400/20 bg-sky-500/10 p-5 hover:bg-sky-500/20">
            <div className="font-semibold text-sky-100">Airport guides</div>
            <p className="mt-2 text-sm text-zinc-300">
              Compare airport-to-port and airport-to-city arrival logic when the transfer chain is the real planning problem.
            </p>
          </Link>
          <Link href="/cruises/shore-excursions" className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-5 hover:bg-emerald-500/20">
            <div className="font-semibold text-emerald-100">Shore excursions guide</div>
            <p className="mt-2 text-sm text-zinc-300">
              Compare excursion styles and timing logic when the port day itself is the main decision.
            </p>
          </Link>
          <Link href="/alerts" className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-5 hover:bg-amber-500/20">
            <div className="font-semibold text-amber-100">Alerts & Trends</div>
            <p className="mt-2 text-sm text-zinc-300">
              Check signal pressure and route friction before you commit to a tight embarkation or shore-day plan.
            </p>
          </Link>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-bold">Best-fit port planning lanes</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-xl border border-white/10 bg-black/20 p-4">
              <h3 className="font-semibold">Embarkation hotel stay</h3>
              <p className="mt-2 text-sm text-zinc-300">Use port pages when you need a smoother pre-cruise night, transfer timing, and airport-to-port logic.</p>
            </article>
            <article className="rounded-xl border border-white/10 bg-black/20 p-4">
              <h3 className="font-semibold">Short shore day</h3>
              <p className="mt-2 text-sm text-zinc-300">Port guides help when the real question is what fits the time window without risking the all-aboard buffer.</p>
            </article>
            <article className="rounded-xl border border-white/10 bg-black/20 p-4">
              <h3 className="font-semibold">Excursion-first</h3>
              <p className="mt-2 text-sm text-zinc-300">Move into shore-excursion pages when the stop itself is the core buying decision.</p>
            </article>
            <article className="rounded-xl border border-white/10 bg-black/20 p-4">
              <h3 className="font-semibold">Tendering risk</h3>
              <p className="mt-2 text-sm text-zinc-300">Use the tendering guide when queues, uplifts, or transfer friction can change what is realistic in port.</p>
            </article>
          </div>
        </section>
      </div>
    </main>
  );
}
