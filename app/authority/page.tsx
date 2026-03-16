import type { Metadata } from "next";
import Link from "next/link";
import StatGrid from "@/app/components/StatGrid";
import JsonLd from "@/app/components/dcc/JsonLd";
import { buildArticleJsonLd, buildBreadcrumbJsonLd } from "@/lib/dcc/jsonld";
import { getGraphHealth } from "@/lib/dcc/graph/health";
import { SITE_IDENTITY } from "@/src/data/site-identity";
import CinematicBackdrop from "@/app/components/dcc/CinematicBackdrop";
import RouteHeroMark from "@/app/components/dcc/RouteHeroMark";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Travel Guides and Planning Hubs | Destination Command Center",
  description:
    "Explore the main DCC guide hubs for destinations, ports, tours, alerts, and trip-planning context.",
  alternates: { canonical: "/authority" },
};

const PLANNING_HUBS = [
  {
    href: "/cities",
    title: "Cities",
    description: "Browse destination guides, city pages, live shows, attractions, and trip-planning context.",
  },
  {
    href: "/ports",
    title: "Ports",
    description: "Find embarkation guidance, cruise-port context, nearby planning, and shore-day support.",
  },
  {
    href: "/tours",
    title: "Tours",
    description: "Search tours and activities by destination, city intent, and trip fit.",
  },
  {
    href: "/alerts",
    title: "Alerts & Trends",
    description: "Check graph-backed travel pressure, changing conditions, and planning signals before you commit.",
  },
];

export default function AuthorityPage() {
  const health = getGraphHealth();

  return (
    <main className="relative min-h-screen overflow-hidden bg-zinc-950 text-white">
      <CinematicBackdrop />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            buildArticleJsonLd({
              path: "/authority",
              headline: "Travel Guides and Planning Hubs",
              description:
                "Explore the main DCC guide hubs for destinations, ports, tours, alerts, and trip-planning context.",
            }),
            buildBreadcrumbJsonLd([
              { name: "Home", item: "/" },
              { name: "Authority", item: "/authority" },
            ]),
          ],
        }}
      />

      <div className="relative mx-auto max-w-6xl px-6 py-16 space-y-8">
        <header className="space-y-3">
          <RouteHeroMark eyebrow="Destination Command Center" title="PLANNING HUBS" tone="emerald" />
          <p className="text-xs uppercase tracking-wider text-zinc-500">Destination discovery</p>
          <h1 className="text-4xl font-black tracking-tight">Planning hubs and guide surfaces</h1>
          <p className="max-w-3xl text-zinc-300">
            Use this page to move into the right DCC surface quickly, whether the question is destination discovery,
            port logistics, tours, or changing travel conditions.
          </p>
        </header>

        <section className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-6 space-y-4">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.22em] text-cyan-200">Trip Planning Snapshot</p>
            <h2 className="text-2xl font-bold">What this hub helps you decide quickly</h2>
            <p className="text-sm text-zinc-200">
              Which DCC surface best matches the question in front of you, so you spend less time jumping between unrelated pages.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <article className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Best for</p>
              <p className="mt-2 text-sm font-medium text-zinc-100">
                Travelers choosing between cities, ports, tours, planning tools, and live-condition hubs.
              </p>
            </article>
            <article className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Typical use</p>
              <p className="mt-2 text-sm font-medium text-zinc-100">
                Start here when you know the planning problem but not yet the right DCC section.
              </p>
            </article>
            <article className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Good companion pages</p>
              <p className="mt-2 text-sm font-medium text-zinc-100">
                About DCC • Cities • Ports • Tours • Alerts & Trends
              </p>
            </article>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold">Platform snapshot</h2>
            <p className="text-sm text-zinc-400">
              A quick read on the scale of the current DCC graph and the guide hubs travelers use most.
            </p>
          </div>
          <StatGrid
            items={[
              { label: "Guide hubs", value: PLANNING_HUBS.length },
              { label: "Places tracked", value: health.places },
              { label: "Edges tracked", value: health.edges },
              { label: "Brand promise", value: "Find what’s happening and how to get there" },
            ]}
          />
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {PLANNING_HUBS.map((hub) => (
            <Link
              key={hub.href}
              href={hub.href}
              className={`rounded-2xl p-5 ${
                hub.href === "/alerts"
                  ? "border border-amber-400/20 bg-amber-500/10 hover:bg-amber-500/20"
                  : hub.href === "/ports"
                    ? "border border-emerald-400/20 bg-emerald-500/10 hover:bg-emerald-500/20"
                    : hub.href === "/tours"
                      ? "border border-cyan-400/20 bg-cyan-500/10 hover:bg-cyan-500/20"
                      : "border border-white/10 bg-white/5 hover:bg-white/10"
              }`}
            >
              <div className={`font-semibold ${
                hub.href === "/alerts"
                  ? "text-amber-100"
                  : hub.href === "/ports"
                    ? "text-emerald-100"
                    : hub.href === "/tours"
                      ? "text-cyan-100"
                      : "text-zinc-100"
              }`}>{hub.title}</div>
              <p className="mt-2 text-sm text-zinc-300">{hub.description}</p>
            </Link>
          ))}
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <Link href="/about" className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-5 hover:bg-cyan-500/20">
            <div className="font-semibold text-cyan-100">About DCC</div>
            <p className="mt-2 text-sm text-zinc-300">
              See how {SITE_IDENTITY.name} fits destination guides, tours, transportation, and partner booking paths together.
            </p>
          </Link>
          <Link href="/ai" className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-5 hover:bg-emerald-500/20">
            <div className="font-semibold text-emerald-100">AI & Machine-Readable Guide</div>
            <p className="mt-2 text-sm text-zinc-300">
              Read the clean canonical explanation of what DCC is and which public sections matter most.
            </p>
          </Link>
          <Link href="/alerts" className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-5 hover:bg-amber-500/20">
            <div className="font-semibold text-amber-100">Live planning signals</div>
            <p className="mt-2 text-sm text-zinc-300">
              Check current trend pressure, recent changes, and operational context before making a tight plan.
            </p>
          </Link>
        </section>
      </div>
    </main>
  );
}
