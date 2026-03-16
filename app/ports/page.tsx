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

        <PortsSearchClient ports={ports} />

        <section className="grid gap-4 md:grid-cols-3">
          <Link href="/cruises" className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-5 hover:bg-cyan-500/20">
            <div className="font-semibold text-cyan-100">Cruises explorer</div>
            <p className="mt-2 text-sm text-zinc-300">
              Move into ships, cruise routes, and embarkation-focused planning once you know the port question.
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
      </div>
    </main>
  );
}
