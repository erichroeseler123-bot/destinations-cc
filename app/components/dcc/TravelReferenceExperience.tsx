import React from "react";
import Link from "next/link";
import { getGoSnoRouteSnapshotDisplayPricing } from "@/lib/dcc/applicability";
import { syncDurableLedgerWithPostgres } from "@/lib/dcc/storage/durableTransactionalStore";
import {
  evaluateNodeClaimDependencies,
  type EvidenceCitation,
  type TravelReferenceNode,
} from "@/lib/dcc/travelReference";
import { readLocationIntelligence } from "@/lib/dcc/locationIntelligence";
import { readExtendedCoordinateFeeds } from "@/lib/dcc/extendedCoordinateFeeds";
import {
  AuthorityBadge,
  EntryDependencyExplorer,
  IntegrationBadge,
  LiveCoordinateTelemetryCards,
  SpecialistHandoffInteractive,
} from "@/app/components/dcc/TravelReferenceClientInteractive";
import JuneauPortDayPlanner from "@/app/components/dcc/JuneauPortDayPlanner";
import FactualErrorReportForm from "@/app/components/dcc/FactualErrorReportForm";
import TransitComparisonTable from "@/app/components/dcc/TransitComparisonTable";

async function fetchCoordinateTelemetrySummary(lat: number, lng: number) {
  try {
    const [coreRaw, extendedRaw] = await Promise.all([
      readLocationIntelligence({ lat, lng }, { minRevalidateSeconds: 3600 }),
      readExtendedCoordinateFeeds({ lat, lng }, { minRevalidateSeconds: 3600 }),
    ]);
    const rawCoreAny = coreRaw as any;
    const rawExtAny = extendedRaw as any;
    const firstSnowItem = Array.isArray(rawCoreAny?.conditions?.next12Hours)
      ? rawCoreAny.conditions.next12Hours.find(
          (h: any) => typeof h?.snowDepthM === "number",
        )
      : null;

    const core = rawCoreAny
      ? {
          checkedAt: rawCoreAny.checkedAt || null,
          now: {
            weather: rawCoreAny.now?.weather
              ? {
                  temperature_2m: rawCoreAny.now.weather.temperature_2m ?? null,
                  apparent_temperature:
                    rawCoreAny.now.weather.apparent_temperature ?? null,
                  description: rawCoreAny.now.weather.description ?? null,
                  wind_speed_10m: rawCoreAny.now.weather.wind_speed_10m ?? null,
                }
              : null,
            airQuality: rawCoreAny.now?.airQuality
              ? { us_aqi: rawCoreAny.now.airQuality.us_aqi ?? null }
              : null,
          },
          conditions: {
            next12Hours: firstSnowItem
              ? [{ snowDepthM: firstSnowItem.snowDepthM }]
              : [],
            next3Days: [],
          },
          hazards: {
            alerts: Array.isArray(rawCoreAny.hazards?.alerts)
              ? rawCoreAny.hazards.alerts.slice(0, 3).map((a: any) => ({
                  id: a.id,
                  event: a.event,
                  headline: a.headline,
                }))
              : [],
          },
          sources: Array.isArray(rawCoreAny.sources)
            ? rawCoreAny.sources
                .filter(
                  (s: any) =>
                    s?.provider === "nws" || s?.provider === "open-meteo",
                )
                .map((s: any) => ({
                  provider: s.provider,
                  available: Boolean(s.available),
                  checkedAt: s.checkedAt || null,
                  error: s.error || null,
                }))
            : [],
        }
      : null;

    const extended = rawExtAny
      ? {
          coastal: {
            coops: Array.isArray(rawExtAny.coastal?.coops)
              ? rawExtAny.coastal.coops.slice(0, 1).map((c: any) => ({
                  id: c.id,
                  name: c.name,
                  pageUrl: c.pageUrl,
                  observation: c.observation?.v
                    ? { v: c.observation.v }
                    : undefined,
                }))
              : [],
            ndbc: [],
          },
          aviation: Array.isArray(rawExtAny.aviation)
            ? rawExtAny.aviation.slice(0, 1).map((av: any) => ({
                airport: av.airport?.icao ? { icao: av.airport.icao } : undefined,
                metar: av.metar
                  ? {
                      rawOb: av.metar.rawOb || null,
                      fltCat: av.metar.fltCat || null,
                    }
                  : undefined,
              }))
            : [],
          sources: [],
        }
      : null;

    return { core, extended, fetchError: null };
  } catch (err) {
    return {
      core: null,
      extended: null,
      fetchError: err instanceof Error ? err.message : "Telemetry fetch failed",
    };
  }
}

export default async function TravelReferenceExperience({
  node,
  embeddedMode = false,
  embedded = false,
  initialContext,
  initialSearchParams,
}: {
  node: TravelReferenceNode;
  embeddedMode?: boolean;
  embedded?: boolean;
  initialContext?: {
    date?: string;
    partySize?: string;
    customChoice?: string;
  };
  initialSearchParams?: Record<string, string | string[] | undefined>;
}) {
  await syncDurableLedgerWithPostgres();
  const gosnoBreckPricing = getGoSnoRouteSnapshotDisplayPricing({
    routeId: "DEN-BRECKENRIDGE",
  });
  const isEmbedded = embeddedMode || embedded;
  const evidenceMap: Record<string, EvidenceCitation> = {};
  for (const item of node.evidenceRegistry) {
    evidenceMap[item.id] = item;
  }
  const claimDependencies = evaluateNodeClaimDependencies(node);

  // Fetch baseline coordinate intelligence for primary coordinate and (if corridor/dual-anchor) first secondary coordinate
  const [primaryTelemetry, secondaryTelemetry] = await Promise.all([
    fetchCoordinateTelemetrySummary(
      node.primaryCoordinate.lat,
      node.primaryCoordinate.lng,
    ),
    node.secondaryCoordinates[0]
      ? fetchCoordinateTelemetrySummary(
          node.secondaryCoordinates[0].lat,
          node.secondaryCoordinates[0].lng,
        )
      : Promise.resolve(null),
  ]);

  return (
    <div className="space-y-10 text-zinc-100">
      {/* HERO & CANONICAL IDENTITY */}
      {!isEmbedded && (
        <header className="rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 via-zinc-950 to-slate-950 p-6 md:p-8 space-y-4 shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-cyan-500/40 bg-cyan-500/15 px-3 py-1 text-xs font-bold uppercase tracking-widest text-cyan-300">
                DCC Destination Guide
              </span>
              <span className="rounded-full border border-white/15 bg-zinc-900 px-3 py-1 text-xs font-mono text-zinc-300">
                Coordinates: {node.primaryCoordinate.lat.toFixed(5)},{" "}
                {node.primaryCoordinate.lng.toFixed(5)}
              </span>
            </div>
            <div className="text-xs text-zinc-400 font-mono">
              Reviewed: {node.lastReviewedAt} •{" "}
              {node.evidenceRegistry.length} Verified Sources
            </div>
          </div>

          <div className="space-y-2 max-w-4xl">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white leading-[1.1]">
              {node.title}
            </h1>
            <p className="text-sm md:text-base font-medium text-cyan-200/90">
              {node.subtitle}
            </p>
            {node.id !== "juneau" && (
              <p className="text-sm md:text-base text-zinc-300 leading-relaxed">
                {node.heroSummary}
              </p>
            )}
          </div>

          {/* At-a-Glance Evidence Strip (expandable on Juneau so the port-day question & inputs lead immediately) */}
          {node.id === "juneau" ? (
            <details className="rounded-2xl border border-white/10 bg-zinc-950/60 p-3.5 text-xs">
              <summary className="cursor-pointer font-bold text-zinc-200 hover:text-cyan-300">
                Port Overview & Quick Reference Facts ({node.atAGlance.length} items)
              </summary>
              <p className="mt-2 text-xs text-zinc-300 leading-relaxed">
                {node.heroSummary}
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {node.atAGlance.map((fact) => (
                  <div
                    key={fact.label}
                    className="rounded-xl border border-white/10 bg-zinc-950/90 p-3 flex flex-col justify-between space-y-2"
                  >
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                        {fact.label}
                      </span>
                      <p className="text-xs font-bold text-white leading-snug">
                        {fact.value}
                      </p>
                    </div>
                    <div className="pt-1 flex flex-wrap items-center justify-between gap-1">
                      <AuthorityBadge type={fact.authorityType} />
                      {fact.citationIds?.length ? (
                        <span className="inline-flex flex-wrap gap-1">
                          {fact.citationIds.map((cid) => (
                            <a
                              key={cid}
                              href={`#cite-${cid}`}
                              className="text-[10px] font-mono text-cyan-300 hover:underline"
                            >
                              [{cid}]
                            </a>
                          ))}
                        </span>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </details>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 pt-2">
              {node.atAGlance.map((fact) => (
                <div
                  key={fact.label}
                  className="rounded-2xl border border-white/10 bg-zinc-950/80 p-4 flex flex-col justify-between space-y-2"
                >
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">
                      {fact.label}
                    </span>
                    <p className="text-sm font-bold text-white leading-snug">
                      {fact.value}
                    </p>
                  </div>
                  <div className="pt-1 flex flex-wrap items-center justify-between gap-1">
                    <AuthorityBadge type={fact.authorityType} />
                    {fact.citationIds?.length ? (
                      <span className="inline-flex flex-wrap gap-1">
                        {fact.citationIds.map((cid) => (
                          <a
                            key={cid}
                            href={`#cite-${cid}`}
                            className="text-[10px] font-mono text-cyan-300 hover:underline"
                          >
                            [{cid}]
                          </a>
                        ))}
                      </span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quick Section Jump Navigation */}
          <nav
            aria-label="Destination reference sections"
            className="flex flex-wrap items-center gap-2 pt-3 border-t border-white/10 text-xs font-semibold"
          >
            <span className="text-zinc-400 uppercase tracking-wider mr-1">
              On this page:
            </span>
            {node.id === "juneau" && (
              <a
                href="#port-day-decision-engine"
                className="rounded-lg border border-cyan-400/40 bg-cyan-500/15 hover:bg-cyan-500/25 px-3 py-1.5 text-cyan-200 transition"
              >
                Port-Day Planner
              </a>
            )}
            <a
              href="#section-overview"
              className="rounded-lg border border-white/10 bg-zinc-900 hover:bg-zinc-800 px-3 py-1.5 text-zinc-200 transition"
            >
              1. Overview & Context
            </a>
            <a
              href="#section-getting-there"
              className="rounded-lg border border-white/10 bg-zinc-900 hover:bg-zinc-800 px-3 py-1.5 text-zinc-200 transition"
            >
              2. Getting There & Around
            </a>
            <a
              href="#section-before-you-go"
              className="rounded-lg border border-white/10 bg-zinc-900 hover:bg-zinc-800 px-3 py-1.5 text-zinc-200 transition"
            >
              3. Before You Go (Entry & Safety)
            </a>
            <a
              href="#section-timing-seasonality"
              className="rounded-lg border border-white/10 bg-zinc-900 hover:bg-zinc-800 px-3 py-1.5 text-zinc-200 transition"
            >
              4. Timing, Seasonality & Access
            </a>
            <a
              href="#section-live-conditions"
              className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 px-3 py-1.5 text-cyan-200 transition"
            >
              5. Live Conditions & Alerts
            </a>
            <a
              href="#section-specialist-handoffs"
              className="rounded-lg border border-white/10 bg-zinc-900 hover:bg-zinc-800 px-3 py-1.5 text-zinc-200 transition"
            >
              6. Optional Booking & Direct Links
            </a>
            <a
              href="#sources-and-verification"
              className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 text-emerald-200 transition"
            >
              7. Sources & Verification ({node.evidenceRegistry.length})
            </a>
          </nav>
        </header>
      )}

      {/* JUNEAU INTERACTIVE PORT-DAY DECISION ENGINE */}
      {node.id === "juneau" && (
        <React.Suspense fallback={null}>
          <JuneauPortDayPlanner
            evidenceCount={node.evidenceRegistry.length}
            initialSearchParams={initialSearchParams}
          />
        </React.Suspense>
      )}


      {/* SECTION 5 (SURFACED HIGH OR ANCHORED): LIVE CONDITIONS + OPERATIONAL NON-CONFLATION */}
      <section
        id="section-live-conditions"
        aria-labelledby="heading-live-conditions"
        className="rounded-3xl border border-cyan-500/30 bg-zinc-900/80 p-6 md:p-8 space-y-6"
      >
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-5">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <AuthorityBadge type="observation" />
              <AuthorityBadge type="forecast" />
              <IntegrationBadge status="live_integrated" />
            </div>
            <h2
              id="heading-live-conditions"
              className="text-2xl md:text-3xl font-black text-white"
            >
              Current Conditions, Alerts & Operational Boundaries
            </h2>
            <p className="text-sm text-zinc-300 leading-relaxed">
              {node.coverageScopeStatement}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={node.primaryCoordinate.canonicalLocationPath}
              className="rounded-xl border border-cyan-500/40 bg-cyan-500/15 px-3.5 py-2 text-xs font-bold text-cyan-200 hover:bg-cyan-500/25 transition"
            >
              Full Weather & Map View →
            </Link>
            <a
              href={node.primaryCoordinate.canonicalApiPath}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-white/15 bg-zinc-950 px-3.5 py-2 text-xs font-mono text-zinc-300 hover:bg-zinc-900 transition"
            >
              JSON API ({node.primaryCoordinate.lat.toFixed(2)},{" "}
              {node.primaryCoordinate.lng.toFixed(2)})
            </a>
          </div>
        </div>

        {/* CRITICAL OPERATIONAL NON-CONFLATION GUARDRAIL */}
        <div
          role="region"
          aria-label="Operational boundary and safety notice"
          className="rounded-2xl border border-amber-500/40 bg-amber-950/25 p-4 md:p-5 space-y-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-amber-300">
              ⚠ {node.operationalBoundaries.headline}
            </span>
            <span className="text-[11px] font-mono text-amber-200/80">
              Weather ≠ Venue Status, Road Legality, or Activity Safety
            </span>
          </div>
          <p className="text-xs md:text-sm text-zinc-200 leading-relaxed">
            {node.operationalBoundaries.weatherVsOperationsExplanation}
          </p>
          <p className="text-xs text-amber-200/90 font-medium">
            <strong>Missing / Expired Data Rule:</strong>{" "}
            {node.operationalBoundaries.missingOrExpiredDataRule}
          </p>
        </div>

        {/* LIVE TELEMETRY CARDS FOR PRIMARY & SECONDARY ANCHORS */}
        <LiveCoordinateTelemetryCards
          primaryCoordinate={node.primaryCoordinate}
          secondaryCoordinate={node.secondaryCoordinates[0] || null}
          initialPrimaryTelemetry={primaryTelemetry}
          initialSecondaryTelemetry={secondaryTelemetry}
          whatRequiresOfficialExternalCheck={
            node.operationalBoundaries.whatRequiresOfficialExternalCheck
          }
        />
      </section>

      {/* SECTION 1: OVERVIEW, GEOGRAPHY, HISTORY & LOCAL CONTEXT */}
      <section
        id="section-overview"
        aria-labelledby="heading-overview"
        className="rounded-3xl border border-white/10 bg-zinc-900/60 p-6 md:p-8 space-y-6"
      >
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <IntegrationBadge status="curated_verified" />
            <AuthorityBadge type="dcc_interpretation" />
          </div>
          <h2
            id="heading-overview"
            className="text-2xl md:text-3xl font-black text-white"
          >
            {node.overviewAndContext.sectionTitle}
          </h2>
          <p className="text-sm md:text-base text-zinc-200 leading-relaxed max-w-4xl">
            {node.overviewAndContext.leadSummary}
          </p>
          {node.overviewAndContext.citationIds.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                Supporting Sources:
              </span>
              {node.overviewAndContext.citationIds.map((cid) => (
                <a
                  key={cid}
                  href={`#cite-${cid}`}
                  className="rounded border border-white/10 bg-zinc-950 px-2 py-0.5 font-mono text-[10px] text-cyan-300 hover:border-cyan-500/40"
                >
                  [{cid}]
                </a>
              ))}
            </div>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-zinc-950/70 p-5 space-y-3">
            <h3 className="text-base font-bold text-cyan-300 uppercase tracking-wider text-xs">
              Geography & Physical Setting
            </h3>
            {node.overviewAndContext.geographyAndTopography.map((para, i) => (
              <p key={i} className="text-xs md:text-sm text-zinc-300 leading-relaxed">
                {para}
              </p>
            ))}
          </div>

          <div className="rounded-2xl border border-white/10 bg-zinc-950/70 p-5 space-y-3">
            <h3 className="text-base font-bold text-emerald-300 uppercase tracking-wider text-xs">
              History, Stewardship & Culture
            </h3>
            {node.overviewAndContext.historyAndCulture.map((para, i) => (
              <p key={i} className="text-xs md:text-sm text-zinc-300 leading-relaxed">
                {para}
              </p>
            ))}
          </div>

          <div className="rounded-2xl border border-indigo-500/30 bg-indigo-950/20 p-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                What This Means For Your Trip
              </h3>
              <AuthorityBadge type="dcc_interpretation" />
            </div>
            {node.overviewAndContext.localContextWhatItMeans.map((para, i) => (
              <p key={i} className="text-xs md:text-sm text-zinc-200 leading-relaxed">
                {para}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 2: GETTING THERE & GETTING AROUND */}
      <section
        id="section-getting-there"
        aria-labelledby="heading-getting-there"
        className="rounded-3xl border border-white/10 bg-zinc-900/60 p-6 md:p-8 space-y-6"
      >
        <div className="space-y-2 max-w-4xl">
          <div className="flex flex-wrap items-center gap-2">
            <AuthorityBadge type="official_rule" />
            <AuthorityBadge type="dcc_interpretation" />
          </div>
          <h2
            id="heading-getting-there"
            className="text-2xl md:text-3xl font-black text-white"
          >
            {node.gettingThereAndAround.sectionTitle}
          </h2>
          <p className="text-sm md:text-base text-zinc-300 leading-relaxed">
            {node.gettingThereAndAround.leadSummary}
          </p>
        </div>

        <TransitComparisonTable
          modes={node.gettingThereAndAround.modes}
          transportModeQualificationById={
            claimDependencies.transportModeQualificationById
          }
          title="Alternative Route & Transit Comparison Matrix"
          subtitle="Side-by-side comparison of pricing models, egress timing, bottlenecks, and statutory operating laws"
        />

        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <AuthorityBadge type="editorial_recommendation" />
            </div>
            <p className="text-xs md:text-sm text-zinc-100 font-medium leading-relaxed mt-1">
              <strong>Key Transport Takeaway:</strong>{" "}
              {node.gettingThereAndAround.keyDecisionTakeaway}
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 3: BEFORE YOU GO (ENTRY DEPENDENCIES, SAFETY ADVISORIES, HEALTH & EMERGENCY) */}
      <section
        id="section-before-you-go"
        aria-labelledby="heading-before-you-go"
        className="rounded-3xl border border-white/10 bg-zinc-900/60 p-6 md:p-8 space-y-6"
      >
        <div className="space-y-2 max-w-4xl">
          <h2
            id="heading-before-you-go"
            className="text-2xl md:text-3xl font-black text-white"
          >
            {node.beforeYouGo.sectionTitle}
          </h2>
          <p className="text-sm md:text-base text-zinc-300 leading-relaxed">
            {node.beforeYouGo.leadSummary}
          </p>
        </div>

        {/* Interactive 6-Factor Entry & Regulatory Dependency Model */}
        <EntryDependencyExplorer
          whyCoordinatesCannotAnswerEntry={
            node.beforeYouGo.whyCoordinatesCannotAnswerEntry
          }
          scenarios={node.beforeYouGo.entryScenarios}
          evidenceMap={evidenceMap}
        />

        {/* Safety Advisories, Health Guidance & Emergency Information */}
        <div className="grid gap-4 md:grid-cols-3">
          {node.beforeYouGo.safetyHealthAndEmergency.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-white/10 bg-zinc-950/80 p-5 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <AuthorityBadge type={item.authorityType} />
                  <IntegrationBadge status={item.integrationStatus} />
                </div>
                <h3 className="text-base font-bold text-white">{item.title}</h3>
                <p className="text-[11px] font-semibold text-zinc-400">
                  Authority: {item.issuingAuthority}
                </p>
                <p className="text-xs md:text-sm text-zinc-300 leading-relaxed">
                  {item.summary}
                </p>
                <div className="rounded-xl border border-amber-500/20 bg-amber-950/20 p-3 text-xs text-amber-100">
                  <strong>What to do:</strong> {item.travelerAction}
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
                <a
                  href={item.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-bold text-cyan-300 hover:underline"
                >
                  <span>{item.officialUrlLabel}</span>
                  <span aria-hidden="true">↗</span>
                </a>
                <div className="flex flex-wrap items-center gap-1">
                  {item.citationIds.map((cid) => (
                    <a
                      key={cid}
                      href={`#cite-${cid}`}
                      className="rounded border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 font-mono text-[10px] text-cyan-200 hover:bg-cyan-500/20"
                    >
                      [{cid}]
                    </a>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* SECTION 4: TIMING, SEASONALITY, ACCESSIBILITY, CLOSURES & PRACTICAL CONSTRAINTS */}
      <section
        id="section-timing-seasonality"
        aria-labelledby="heading-timing-seasonality"
        className="rounded-3xl border border-white/10 bg-zinc-900/60 p-6 md:p-8 space-y-6"
      >
        <div className="space-y-2 max-w-4xl">
          <h2
            id="heading-timing-seasonality"
            className="text-2xl md:text-3xl font-black text-white"
          >
            {node.timingSeasonalityAndAccess.sectionTitle}
          </h2>
          <p className="text-sm md:text-base text-zinc-300 leading-relaxed">
            {node.timingSeasonalityAndAccess.leadSummary}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {node.timingSeasonalityAndAccess.items.map((item) => {
            const qualification =
              claimDependencies.seasonalityQualificationById[item.id];
            return (
              <article
                key={item.id}
                data-seasonality-id={item.id}
                className="rounded-2xl border border-white/10 bg-zinc-950/80 p-5 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">
                    {item.category.replaceAll("_", " ")} • {item.windowOrScope}
                  </span>
                  <AuthorityBadge type={item.authorityType} />
                </div>
                <h3 className="text-lg font-bold text-white">{item.title}</h3>
                {qualification && (
                  <div
                    role="note"
                    className="rounded-xl border border-amber-400/40 bg-amber-950/40 p-3 text-xs text-amber-100"
                  >
                    <strong className="text-amber-300">
                      Evidence Qualification:
                    </strong>{" "}
                    {qualification}
                  </div>
                )}
                <p className="text-xs md:text-sm text-zinc-300 leading-relaxed">
                  <strong className="text-zinc-100">Factual Basis:</strong>{" "}
                  {item.factualBasis}
                </p>
                <div className="rounded-xl border border-indigo-500/20 bg-indigo-950/20 p-3 text-xs md:text-sm text-zinc-200 leading-relaxed">
                  <strong className="text-indigo-300">Trip Impact:</strong>{" "}
                  {item.dccInterpretation}
                </div>
                <div className="pt-1 flex flex-wrap items-center justify-between gap-2">
                  {item.officialUrl ? (
                    <a
                      href={item.officialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-bold text-cyan-300 hover:underline"
                    >
                      <span>{item.officialUrlLabel || "Official Reference"}</span>
                      <span aria-hidden="true">↗</span>
                    </a>
                  ) : (
                    <span />
                  )}
                  <div className="flex flex-wrap items-center gap-1">
                    {item.citationIds.map((cid) => (
                      <a
                        key={cid}
                        href={`#cite-${cid}`}
                        className="rounded border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 font-mono text-[10px] text-cyan-200 hover:bg-cyan-500/20"
                      >
                        [{cid}]
                      </a>
                    ))}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* SECTION 6: OPTIONAL BOOKING, DIRECT PROVIDERS & CONTEXT-PRESERVING HANDOFFS */}
      <section
        id="section-specialist-handoffs"
        aria-labelledby="heading-specialist-handoffs"
      >
        <React.Suspense fallback={null}>
          <SpecialistHandoffInteractive
            config={node.specialistHandoffs}
            nodeId={node.id}
            initialContext={initialContext}
            gosnoVanOneWayLabel={gosnoBreckPricing.vanOneWayLabel}
          />
        </React.Suspense>
      </section>


      {/* CONNECTED PLACE GRAPH: COORDINATES, REGIONS, PORTS, VENUES, ROUTES */}
      <section
        aria-labelledby="heading-connected-graph"
        className="rounded-3xl border border-white/10 bg-zinc-900/60 p-6 md:p-8 space-y-5"
      >
        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">
            Related Places & Routes
          </span>
          <h2
            id="heading-connected-graph"
            className="text-2xl font-black text-white"
          >
            Nearby Places, Ports, Venues & Corridors
          </h2>
          <p className="text-sm text-zinc-300">
            Explore related destination guides, regional hubs, and route pages.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {node.relationships.map((rel) => (
            <Link
              key={rel.id}
              href={rel.href}
              className="rounded-2xl border border-white/10 bg-zinc-950/80 p-4 hover:border-cyan-500/40 hover:bg-zinc-900 transition flex flex-col justify-between space-y-2"
            >
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 block">
                  {rel.relationship.replaceAll("_", " ")}
                </span>
                <h3 className="text-sm font-bold text-white">{rel.label}</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {rel.summary}
                </p>
              </div>
              <span className="text-xs font-mono text-cyan-300 pt-1">
                {rel.href} →
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* SECTION 7: SOURCES & VERIFICATION (EVIDENCE & SOURCE ATTRIBUTION LEDGER) */}
      <div id="sources-and-verification">
        <section
          id="section-evidence-ledger"
          aria-labelledby="heading-evidence-ledger"
          className="rounded-3xl border border-emerald-500/30 bg-zinc-900/70 p-6 md:p-8 space-y-6"
        >
          <div className="space-y-2 max-w-4xl">
            <div className="flex flex-wrap items-center gap-2">
              <AuthorityBadge type="official_rule" />
              <AuthorityBadge type="observation" />
              <AuthorityBadge type="dcc_interpretation" />
            </div>
            <h2
              id="heading-evidence-ledger"
              className="text-2xl md:text-3xl font-black text-white"
            >
              Sources & Verification — Verifiable Evidence & Attribution Ledger
            </h2>
            <p className="text-xs md:text-sm text-zinc-300 leading-relaxed">
              Every consequential rule, geographic constraint, and live signal in
              this reference retains its issuing publisher, supporting URL, exact
              claim supported, source effective date, distinct observation /
              retrieval / verification timestamps, freshness policy, current
              evidence status, and known limitations. When sources conflict, the
              discrepancy is explained below rather than hidden.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {node.evidenceRegistry.map((cite) => {
              const freshness = claimDependencies.byCitationId[cite.id];
              const statusBadgeColor =
                freshness?.evidenceStatus === "current"
                  ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-200"
                  : freshness?.evidenceStatus === "stale"
                  ? "border-amber-500/40 bg-amber-500/15 text-amber-200"
                  : "border-rose-500/40 bg-rose-500/15 text-rose-200";

              return (
                <article
                  key={cite.id}
                  id={`cite-${cite.id}`}
                  data-citation-id={cite.id}
                  data-last-checked={cite.lastCheckedAt}
                  data-evidence-status={freshness?.evidenceStatus || "current"}
                  data-upstream-sha256={cite.upstreamContentSha256 || undefined}
                  className="rounded-2xl border border-white/10 bg-zinc-950/90 p-4 space-y-2.5 text-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-mono text-[11px] font-bold text-cyan-300">
                        [{cite.id}]
                      </span>
                      <AuthorityBadge type={cite.authorityType} />
                      <IntegrationBadge status={cite.integrationStatus} />
                    </div>
                    {freshness && (
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusBadgeColor}`}
                      >
                        Status: {freshness.evidenceStatus}
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-white">
                    {cite.sourceTitle}
                  </h3>
                  <p className="text-zinc-300 leading-relaxed">
                    <strong className="text-zinc-100">Supported Claim:</strong>{" "}
                    {cite.claimSummary}
                  </p>
                  {cite.verificationNote ? (
                    <p className="text-[11px] text-emerald-300/90 leading-relaxed">
                      <strong className="text-emerald-200">
                        Source Review Note:
                      </strong>{" "}
                      {cite.verificationNote}
                    </p>
                  ) : null}
                  {cite.verifiedSourceExcerpt ? (
                    <p className="text-[11px] font-mono text-cyan-200/80 leading-relaxed border-l-2 border-cyan-500/40 pl-2">
                      <strong className="text-cyan-300">
                        Upstream Evidence Excerpt:
                      </strong>{" "}
                      {cite.verifiedSourceExcerpt}
                    </p>
                  ) : null}

                  {/* Discrepancy / Source Conflict Explanation when present */}
                  {cite.conflictDetail && (
                    <div className="rounded-xl border border-amber-400/40 bg-amber-950/30 p-3 text-[11px] text-amber-100 space-y-1">
                      <div className="font-bold uppercase tracking-wider text-amber-300">
                        Source Discrepancy & Applicability Analysis (
                        {cite.conflictDetail.resolutionStatus})
                      </div>
                      <p>
                        <strong>Conflicting / Competing Sources:</strong>{" "}
                        {cite.conflictDetail.conflictingSourceTitle}
                      </p>
                      <p>
                        <strong>Discrepancy:</strong>{" "}
                        {cite.conflictDetail.discrepancyExplanation}
                      </p>
                      <p>
                        <strong>Why Primary Authority Applies:</strong>{" "}
                        {cite.conflictDetail.resolutionExplanation}
                      </p>
                    </div>
                  )}

                  <dl className="grid grid-cols-2 gap-2 text-[11px] text-zinc-400 pt-1">
                    <div>
                      <dt className="font-semibold text-zinc-300">
                        Publisher / Issuing Authority
                      </dt>
                      <dd>{cite.issuingOrganization}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-zinc-300">
                        Geographic Scope & Dates
                      </dt>
                      <dd>
                        {cite.geographicScope}
                        {cite.applicableDates ? ` (${cite.applicableDates})` : ""}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-zinc-300">
                        Traveler Context
                      </dt>
                      <dd>{cite.applicableTravelerContext}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-zinc-300">
                        Freshness Policy
                      </dt>
                      <dd>
                        {freshness?.policy.category.replace(/_/g, " ")} (stale{" "}
                        {Math.round((freshness?.policy.staleAfterHours ?? 336) / 24) || 1}d / expires{" "}
                        {Math.round((freshness?.policy.expireAfterHours ?? 720) / 24) || 1}d)
                      </dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-zinc-300">
                        Source Effective / Observed
                      </dt>
                      <dd>
                        Pub: {cite.publishedOrUpdatedDate || "Ongoing"} • Obs:{" "}
                        {cite.observedAt ? cite.observedAt.slice(0, 10) : "Rule/Static"}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-zinc-300">
                        Retrieved vs. Verified
                      </dt>
                      <dd>
                        Retr: {(cite.retrievedAt || cite.lastCheckedAt).slice(0, 10)} •
                        Ver: {(cite.verifiedAt || cite.lastCheckedAt).slice(0, 10)}
                      </dd>
                    </div>
                  </dl>

                  {(cite.limitations || cite.conditionsAndExceptions) && (
                    <p className="text-[11px] text-zinc-400 leading-relaxed pt-1">
                      <strong className="text-zinc-300">
                        Limitations & Exceptions:
                      </strong>{" "}
                      {cite.limitations || cite.conditionsAndExceptions}
                    </p>
                  )}

                  <div className="pt-2 border-t border-white/10">
                    <a
                      href={cite.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-mono text-[11px] text-cyan-300 hover:underline break-all"
                    >
                      <span>{cite.sourceUrl}</span>
                      <span aria-hidden="true">↗</span>
                    </a>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Editorial Authorship, Verification Methodology, Commercial Disclosures & Error Reporting */}
          <div
            id="editorial-methodology-and-disclosures"
            className="rounded-2xl border border-white/15 bg-zinc-950/90 p-5 text-xs text-zinc-300 space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                Editorial Responsibility, Methodology, Commercial Disclosures &
                Error Reporting
              </h3>
              <Link
                href={`/contact?report=factual-error&node=${node.id}`}
                className="rounded-lg border border-cyan-400/40 bg-cyan-500/15 px-3 py-1.5 text-xs font-bold text-cyan-200 hover:bg-cyan-500/25 transition"
              >
                Report a Factual Error or Outdated Rule →
              </Link>
            </div>
            <div className="grid gap-4 md:grid-cols-3 leading-relaxed">
              <div>
                <strong className="text-white block mb-1">
                  Authorship & Review Responsibility
                </strong>
                Maintained by Destination Command Center (DCC) Reference
                Engineering & Editorial Verification. DCC does not invent
                first-party guest reviews, ratings, or unverified personal
                credentials. Substantive review dates (
                <code>{node.lastReviewedAt}</code>) advance only when underlying
                claims and excerpts are verified—never merely because a
                scheduled check ran.
              </div>
              <div>
                <strong className="text-white block mb-1">
                  Freshness & Dependency Methodology
                </strong>
                Each claim is assigned a volatility policy (live conditions,
                operating restrictions, pricing/booking terms, seasonal
                schedules, regulatory rules, or geography). When a supporting
                citation expires, conflicts, or fails verification, dependent
                recommendations are explicitly qualified or withdrawn while
                unrelated supported facts remain intact.
              </div>
              <div>
                <strong className="text-white block mb-1">
                  Commercial & Affiliate Independence
                </strong>
                DCC&apos;s primary product is destination understanding and
                practical travel decisions. Where optional booking links appear
                (including partner/affiliate marketplaces such as Viator or
                owned specialist portals), they are presented after decision
                facts alongside direct operator and public/free alternatives.
                Commercial relationships carry zero weight in feasibility or
                ranking calculations.
              </div>
            </div>

            <div className="pt-3 border-t border-white/10">
              <FactualErrorReportForm
                defaultPagePath={node.canonicalPath}
                nodeId={node.id}
                citationChoices={node.evidenceRegistry.map((c) => ({
                  id: c.id,
                  label: c.sourceTitle,
                }))}
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
