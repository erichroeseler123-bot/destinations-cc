import React from "react";
import Link from "next/link";
import {
  getAllTravelReferenceNodes,
  resolveTravelReferenceForCoordinate,
} from "@/lib/dcc/travelReference";
import {
  AuthorityBadge,
  IntegrationBadge,
} from "@/app/components/dcc/TravelReferenceClientInteractive";

export default function CoordinateReferenceBridge({
  lat,
  lng,
}: {
  lat: number;
  lng: number;
}) {
  const match = resolveTravelReferenceForCoordinate(lat, lng);

  if (!match) {
    const featuredNodes = getAllTravelReferenceNodes();
    return (
      <section
        aria-label="Travel reference coverage and operational boundary notice"
        className="mx-auto max-w-6xl px-4 sm:px-6 pt-6"
      >
        <div className="rounded-2xl border border-amber-500/30 bg-zinc-900/90 p-5 space-y-4 text-zinc-100">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-amber-500/40 bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-amber-300">
                Coordinate Coverage & Safety Boundary
              </span>
              <AuthorityBadge type="observation" />
            </div>
            <span className="text-xs font-mono text-zinc-400">
              Coordinate Telemetry Only ({lat.toFixed(5)}, {lng.toFixed(5)})
            </span>
          </div>

          <p className="text-xs md:text-sm text-zinc-300 leading-relaxed">
            This coordinate page provides live public sensor and model feeds
            (Open-Meteo weather/AQI, USGS seismic, NASA EONET, OSM 5 km
            infrastructure, and U.S. NWS/NOAA where geographically applicable).{" "}
            <strong className="text-white">
              DCC does not have a curated destination reference guide for this
              specific coordinate yet.
            </strong>{" "}
            Weather observations alone do not establish venue operating status,
            highway traction/chain restrictions, activity safety, or border
            entry requirements (which depend on nationality, passport,
            residence, transit routing, purpose, and dates).
          </p>

          <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="text-zinc-400 font-semibold">
              Explore DCC Verified Destination Reference Guides:
            </span>
            <div className="flex flex-wrap gap-2">
              {featuredNodes.map((node) => (
                <Link
                  key={node.id}
                  href={node.canonicalPath}
                  className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 px-3 py-1.5 font-semibold text-cyan-200 transition"
                >
                  {node.title.split("—")[0].trim()} →
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  const { primaryNode, relatedNodes, distanceKm, matchedAnchorLabel, matchType } =
    match;

  return (
    <section
      aria-labelledby="coordinate-reference-bridge-heading"
      className="mx-auto max-w-6xl px-4 sm:px-6 pt-6"
    >
      <div className="rounded-3xl border border-cyan-500/35 bg-gradient-to-br from-zinc-900 via-zinc-950 to-slate-950 p-5 md:p-7 space-y-5 text-zinc-100 shadow-xl">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-4">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-cyan-400/40 bg-cyan-500/15 px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider text-cyan-300">
                Connected DCC Travel Reference
              </span>
              <IntegrationBadge status="curated_verified" />
              <span className="text-[11px] font-mono text-zinc-400">
                {matchType === "exact_anchor"
                  ? `Exact Anchor: ${matchedAnchorLabel}`
                  : `${distanceKm} km from ${matchedAnchorLabel}`}
              </span>
            </div>
            <h2
              id="coordinate-reference-bridge-heading"
              className="text-xl md:text-2xl font-black text-white"
            >
              {primaryNode.title}
            </h2>
            <p className="text-xs md:text-sm text-zinc-300 leading-relaxed">
              {primaryNode.heroSummary}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 shrink-0">
            <Link
              href={primaryNode.canonicalPath}
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-xs md:text-sm font-black text-zinc-950 hover:bg-cyan-400 transition shadow-md"
            >
              <span>Open Full Travel Reference Guide</span>
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        {/* Key Reference Highlights + Operational Non-Conflation */}
        <div className="grid gap-3 md:grid-cols-4">
          {primaryNode.atAGlance.map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-white/10 bg-zinc-950/80 p-3.5 space-y-1"
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                {item.label}
              </span>
              <p className="text-xs font-bold text-white leading-snug">
                {item.value}
              </p>
            </div>
          ))}
        </div>

        {/* Operational Non-Conflation Banner */}
        <div className="rounded-xl border border-amber-500/35 bg-amber-950/25 p-3.5 text-xs space-y-1.5">
          <div className="font-bold text-amber-300">
            ⚠ {primaryNode.operationalBoundaries.headline}
          </div>
          <p className="text-zinc-200 leading-relaxed">
            {primaryNode.operationalBoundaries.weatherVsOperationsExplanation}
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            {primaryNode.operationalBoundaries.whatRequiresOfficialExternalCheck.map(
              (ext) => (
                <a
                  key={ext.capability}
                  href={ext.officialSourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-cyan-300 hover:underline"
                >
                  <span>{ext.officialSourceLabel}</span>
                  <span aria-hidden="true">↗</span>
                </a>
              ),
            )}
          </div>
        </div>

        {/* Connected Places & Corridors */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/10 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold uppercase tracking-wider text-zinc-400">
              Connected Graph:
            </span>
            {primaryNode.relationships.slice(0, 5).map((rel) => (
              <Link
                key={rel.id}
                href={rel.href}
                className="rounded-lg border border-white/10 bg-zinc-900 hover:bg-zinc-800 px-2.5 py-1 text-zinc-200 transition"
              >
                {rel.label}
              </Link>
            ))}
          </div>

          {relatedNodes.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-zinc-400">Adjacent Reference Guides:</span>
              {relatedNodes.map((rNode) => (
                <Link
                  key={rNode.id}
                  href={rNode.canonicalPath}
                  className="font-semibold text-cyan-300 hover:underline"
                >
                  {rNode.title.split("—")[0].trim()} →
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
