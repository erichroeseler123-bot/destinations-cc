import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/app/components/dcc/JsonLd";
import { buildArticleJsonLd, buildBreadcrumbJsonLd } from "@/lib/dcc/jsonld";
import { SITE_IDENTITY } from "@/src/data/site-identity";
import CinematicBackdrop from "@/app/components/dcc/CinematicBackdrop";
import RouteHeroMark from "@/app/components/dcc/RouteHeroMark";
import NextStepEngine from "@/app/components/dcc/NextStepEngine";
import { getRedRocksRecommendationActions } from "@/lib/dcc/handoffAnalytics";
import { buildNoindexRobots } from "@/lib/seo/indexingPolicy";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Travel Guides and Planning Hubs | Destination Command Center",
  description:
    "Use the main DCC guide hubs for destinations, ports, tours, alerts, and trip-planning context.",
  alternates: { canonical: "/authority" },
  robots: buildNoindexRobots(),
};

const PLANNING_HUBS = [
  {
    href: "/cities",
    title: "Cities",
    description: "Use destination guides, city pages, live shows, attractions, and trip-planning context.",
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
  const actions = getRedRocksRecommendationActions();

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
                "Use the main DCC guide hubs for destinations, ports, tours, alerts, and trip-planning context.",
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
          <p className="text-xs uppercase tracking-wider text-zinc-500">Understand → decide → execute</p>
          <h1 className="text-4xl font-black tracking-tight">Use the right DCC surface fast</h1>
          <p className="max-w-3xl text-zinc-300">
            This page is for one job only: move into the right DCC surface quickly when the question is about destination planning, port logistics, tours, or changing conditions.
          </p>
        </header>

        <section className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-6 space-y-4">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.22em] text-cyan-200">What this page does</p>
            <h2 className="text-2xl font-bold">Choose the right planning lane</h2>
            <p className="text-sm text-zinc-200">
              If you already know the problem but not the right DCC section, this page gets you to the correct lane without extra browsing.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <article className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Start here when</p>
              <p className="mt-2 text-sm font-medium text-zinc-100">
                You know the planning problem, but not yet the correct DCC route.
              </p>
            </article>
            <article className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Best result</p>
              <p className="mt-2 text-sm font-medium text-zinc-100">
                Less time bouncing between unrelated sections before you find the correct path.
              </p>
            </article>
            <article className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Typical next step</p>
              <p className="mt-2 text-sm font-medium text-zinc-100">
                Move into a city, port, tours, or alerts surface and then keep going from there.
              </p>
            </article>
          </div>
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

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold">What DCC is not</h2>
            <p className="max-w-3xl text-zinc-300">
              DCC is not trying to be a generic OTA, a review platform, or a giant travel directory. Its job is to make the next move obvious and route travelers into the right planning or execution path.
            </p>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <Link href="/about" className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-5 hover:bg-cyan-500/20">
            <div className="font-semibold text-cyan-100">About DCC</div>
            <p className="mt-2 text-sm text-zinc-300">
              See how {SITE_IDENTITY.name} fits destination guides, tours, transportation, and execution paths together.
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

        <NextStepEngine
          title="Canonical Next Step Engine"
          eyebrow="Network routing"
          description="DCC should decide the next move first, then release travelers into the correct route only after the answer is clear."
          actions={actions}
        />
      </div>
    </main>
  );
}
