import React from "react";
import Link from "next/link";
import JsonLd from "@/app/components/dcc/JsonLd";
import TransitComparisonTable from "@/app/components/dcc/TransitComparisonTable";
import MsyTaxiFareScheduleCard from "@/app/components/dcc/MsyTaxiFareScheduleCard";
import ColoradoSeasonalSpotlightCard from "@/app/components/dcc/ColoradoSeasonalSpotlightCard";
import {
  buildBreadcrumbJsonLd,
  buildCollectionPageJsonLd,
  buildPlaceJsonLd,
} from "@/lib/dcc/jsonld";
import {
  listRegionalHubs,
  type RegionalHubModel,
} from "@/lib/dcc/regionalHubs";

export default function RegionalHubTemplate({
  hub,
  routePrefix = "/destinations",
}: {
  hub: RegionalHubModel;
  routePrefix?: "/destinations" | "/regions";
}) {
  const allHubs = listRegionalHubs();
  const pagePath =
    routePrefix === "/regions" ? hub.regionAliasPath : hub.canonicalPath;

  const collectionItems = [
    ...hub.referenceNodes.map((n) => ({
      name: n.title,
      url: n.canonicalPath,
      description: n.heroSummary,
    })),
    ...hub.venues.map((v) => ({
      name: v.name,
      url: v.href,
      description: v.description,
    })),
    ...hub.ports.map((p) => ({
      name: p.name,
      url: p.href,
      description: p.summary,
    })),
    ...hub.decisionGuides.map((g) => ({
      name: g.title,
      url: g.href,
      description: g.summary,
    })),
    ...hub.coordinates.map((c) => ({
      name: `${c.title} (${c.lat}, ${c.lng})`,
      url: c.locationPath,
      description: c.summary,
    })),
  ];

  return (
    <main
      data-testid={`regional-hub-${hub.slug}`}
      className="min-h-screen bg-zinc-950 text-white"
    >
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            buildCollectionPageJsonLd({
              path: hub.canonicalPath,
              name: `${hub.name} Destination Hub & Topic Cluster`,
              description: hub.heroSummary,
              items: collectionItems,
            }),
            buildPlaceJsonLd({
              path: hub.canonicalPath,
              name: hub.name,
              description: hub.heroSummary,
              address: {
                region: hub.stateCode.replace("US-", ""),
                country: hub.countryCode,
              },
              geo: hub.centroid,
            }),
            buildBreadcrumbJsonLd([
              { name: "Home", item: "/" },
              { name: "Destinations", item: "/destinations" },
              { name: hub.name, item: pagePath },
            ]),
          ],
        }}
      />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 md:py-14 space-y-10">
        {/* Hero Header */}
        <header className="rounded-3xl border border-cyan-500/30 bg-gradient-to-br from-zinc-900 via-zinc-950 to-slate-950 p-6 md:p-9 space-y-5 shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/destinations"
                className="text-xs font-bold uppercase tracking-wider text-cyan-400 hover:underline"
              >
                ← All Regional Hubs
              </Link>
              <span className="text-zinc-600">/</span>
              <span className="rounded-full border border-cyan-500/40 bg-cyan-500/15 px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider text-cyan-200">
                {hub.stateCode} Topic Cluster Hub
              </span>
              {hub.manifestRecord && (
                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[10px] text-emerald-300">
                  {hub.manifestRecord.acceptanceState}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <a
                href={hub.llmsTxtPath}
                className="rounded-xl border border-indigo-400/40 bg-indigo-500/15 hover:bg-indigo-500/25 px-3.5 py-1.5 font-mono text-xs font-bold text-indigo-200 transition"
              >
                🤖 {hub.llmsTxtPath}
              </a>
            </div>
          </div>

          <div className="space-y-3 max-w-4xl">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white">
              {hub.heroHeadline}
            </h1>
            <p className="text-sm md:text-base text-zinc-300 leading-relaxed">
              {hub.heroSummary}
            </p>
          </div>

          {/* Cluster Stat Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
            <div className="rounded-2xl border border-white/10 bg-zinc-900/70 p-3.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Reference Nodes
              </div>
              <div className="text-xl font-black text-cyan-300 mt-0.5">
                {hub.referenceNodes.length}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-zinc-900/70 p-3.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Coordinates
              </div>
              <div className="text-xl font-black text-white mt-0.5">
                {hub.coordinates.length}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-zinc-900/70 p-3.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Venues &amp; Ports
              </div>
              <div className="text-xl font-black text-white mt-0.5">
                {hub.venues.length + hub.ports.length}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-zinc-900/70 p-3.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Decision Guides
              </div>
              <div className="text-xl font-black text-white mt-0.5">
                {hub.decisionGuides.length}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-zinc-900/70 p-3.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                AI Sub-Manifests
              </div>
              <div className="text-xl font-black text-indigo-300 mt-0.5">
                {hub.aiSubManifests.length}
              </div>
            </div>
          </div>
        </header>

        {hub.slug === "louisiana" && <MsyTaxiFareScheduleCard />}
        {hub.slug === "colorado" && <ColoradoSeasonalSpotlightCard />}

        {/* Section 1: Verified Reference Nodes & Side-by-Side Transit Comparisons */}
        {hub.referenceNodes.length > 0 && (
          <section className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-xl md:text-2xl font-black text-white">
                1. Authoritative {hub.name} Reference Guides &amp; Transit Matrices
              </h2>
              <p className="text-xs md:text-sm text-zinc-400">
                Each reference node is governed by DCC&apos;s primary-source citation registry, 6-factor entry dependency rules, and live coordinate telemetry.
              </p>
            </div>

            <div className="space-y-6">
              {hub.referenceNodes.map((node) => {
                const nodeLlms =
                  node.id === "denver-breckenridge"
                    ? "/routes/denver-breckenridge/llms.txt"
                    : `${node.canonicalPath}/llms.txt`;
                return (
                  <div
                    key={node.id}
                    className="rounded-3xl border border-white/10 bg-zinc-900/60 p-5 md:p-7 space-y-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="space-y-1.5 max-w-3xl">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cyan-300">
                            {node.placeType.replace(/_/g, " ")}
                          </span>
                          <span className="font-mono text-xs text-zinc-400">
                            Primary Anchor: {node.primaryCoordinate.lat},{" "}
                            {node.primaryCoordinate.lng}
                          </span>
                        </div>
                        <h3 className="text-lg md:text-xl font-black text-white">
                          <Link
                            href={node.canonicalPath}
                            className="hover:text-cyan-300 transition"
                          >
                            {node.title}
                          </Link>
                        </h3>
                        <p className="text-xs md:text-sm text-zinc-300 leading-relaxed">
                          {node.heroSummary}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <Link
                          href={node.canonicalPath}
                          className="rounded-xl bg-cyan-500 px-4 py-2 text-xs font-black text-zinc-950 hover:bg-cyan-400 transition"
                        >
                          Open Reference Guide →
                        </Link>
                        <a
                          href={nodeLlms}
                          className="rounded-xl border border-white/15 bg-zinc-950 px-3 py-2 font-mono text-xs text-zinc-200 hover:border-cyan-400/50 transition"
                        >
                          {nodeLlms}
                        </a>
                      </div>
                    </div>

                    <TransitComparisonTable
                      modes={node.gettingThereAndAround.modes}
                      compact
                      title={`${node.title.split("—")[0].trim()} — Transit & Route Comparison`}
                      subtitle={node.gettingThereAndAround.keyDecisionTakeaway}
                    />
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Section 2: Registered Coordinate Telemetry Cluster */}
        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-xl md:text-2xl font-black text-white">
              2. Registered {hub.name} Coordinate Pages ({hub.coordinates.length})
            </h2>
            <p className="text-xs md:text-sm text-zinc-400">
              Every coordinate below resolves both an interactive HTML telemetry view and a machine-readable JSON API endpoint (`dcc-location-v2`).
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {hub.coordinates.map((coord) => (
              <div
                key={coord.locationPath}
                className="rounded-2xl border border-white/10 bg-zinc-900/75 p-4 md:p-5 flex flex-col justify-between space-y-3"
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="rounded border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cyan-300">
                      {coord.roleOrCategory}
                    </span>
                    <span className="font-mono text-xs text-zinc-400">
                      {coord.lat.toFixed(5)}, {coord.lng.toFixed(5)}
                      {coord.elevationFt
                        ? ` · ${coord.elevationFt.toLocaleString()} ft`
                        : ""}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white">
                    <Link
                      href={coord.locationPath}
                      className="hover:text-cyan-300 transition"
                    >
                      {coord.title}
                    </Link>
                  </h3>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    {coord.summary}
                  </p>
                </div>

                <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <Link
                    href={coord.locationPath}
                    className="font-bold text-cyan-300 hover:underline"
                  >
                    Open Coordinate Page ({coord.locationPath}) →
                  </Link>
                  <a
                    href={coord.apiPath}
                    className="font-mono text-[11px] text-zinc-400 hover:text-zinc-200"
                  >
                    JSON API
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 3: Venues, Cruise Ports & Decision Guides */}
        {(hub.venues.length > 0 ||
          hub.ports.length > 0 ||
          hub.decisionGuides.length > 0) && (
          <section className="space-y-6">
            <h2 className="text-xl md:text-2xl font-black text-white">
              3. Registered Venues, Ports &amp; Decision Guides in {hub.name}
            </h2>

            {hub.venues.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-300">
                  Event &amp; Sports Venues ({hub.venues.length})
                </h3>
                <div className="grid gap-3 md:grid-cols-2">
                  {hub.venues.map((v) => (
                    <Link
                      key={v.slug}
                      href={v.href}
                      className="rounded-2xl border border-white/10 bg-zinc-900/70 hover:border-cyan-400/40 p-4 transition space-y-1.5 block"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-white text-sm">
                          {v.name}
                        </span>
                        <span className="text-xs text-zinc-400">
                          {v.cityName}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-300 leading-relaxed">
                        {v.description}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {hub.ports.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-300">
                  Cruise &amp; Ferry Ports ({hub.ports.length})
                </h3>
                <div className="grid gap-3 md:grid-cols-2">
                  {hub.ports.map((p) => (
                    <Link
                      key={p.slug}
                      href={p.href}
                      className="rounded-2xl border border-white/10 bg-zinc-900/70 hover:border-cyan-400/40 p-4 transition space-y-1.5 block"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-white text-sm">
                          {p.name}
                        </span>
                        <span className="text-xs text-zinc-400">{p.area}</span>
                      </div>
                      <p className="text-xs text-zinc-300 leading-relaxed">
                        {p.summary}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {hub.decisionGuides.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-300">
                  Published Decision Guides ({hub.decisionGuides.length})
                </h3>
                <div className="grid gap-3 md:grid-cols-2">
                  {hub.decisionGuides.map((g) => (
                    <Link
                      key={g.slug}
                      href={g.href}
                      className="rounded-2xl border border-white/10 bg-zinc-900/70 hover:border-cyan-400/40 p-4 transition space-y-1.5 block"
                    >
                      <div className="font-bold text-white text-sm">
                        {g.title}
                      </div>
                      <p className="text-xs text-zinc-300 leading-relaxed">
                        {g.summary}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Section 4: Regional AI Sub-Manifests (/llms.txt) */}
        <section className="rounded-3xl border border-indigo-500/30 bg-indigo-950/20 p-5 md:p-7 space-y-4">
          <div className="space-y-1">
            <h2 className="text-lg md:text-xl font-black text-white">
              4. Granular AI Readmes (/llms.txt) for {hub.name}
            </h2>
            <p className="text-xs md:text-sm text-zinc-300">
              AI travel agents can ingest lightweight, region-specific sub-manifests containing rule-based math, transit matrices, and verified citations for {hub.name} without parsing unrelated states.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {hub.aiSubManifests.map((sub) => (
              <a
                key={sub.href}
                href={sub.href}
                className="rounded-2xl border border-indigo-400/30 bg-zinc-950/80 hover:border-indigo-400 p-4 transition space-y-1 block"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-white text-sm">
                    {sub.label}
                  </span>
                  <span className="font-mono text-xs text-indigo-300">
                    {sub.href}
                  </span>
                </div>
                <p className="text-xs text-zinc-400">{sub.scope}</p>
              </a>
            ))}
          </div>
        </section>

        {/* Footer: Other Regional Hubs */}
        <nav
          aria-label="Other Regional Destination Hubs"
          className="rounded-2xl border border-white/10 bg-zinc-900/60 p-5 space-y-3"
        >
          <div className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Explore All Manifest-Driven Regional Hubs
          </div>
          <div className="flex flex-wrap gap-2">
            {allHubs.map((other) => (
              <Link
                key={other.slug}
                href={other.canonicalPath}
                className={`rounded-xl border px-3.5 py-2 text-xs font-bold transition ${
                  other.slug === hub.slug
                    ? "border-cyan-400 bg-cyan-500/20 text-white"
                    : "border-white/10 bg-zinc-950 text-zinc-300 hover:border-cyan-500/40"
                }`}
              >
                {other.name} ({other.stateCode})
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </main>
  );
}
