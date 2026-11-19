"use client";

import { useState, useTransition } from "react";
import type { NetworkAndTripAnalyticsReport } from "@/lib/dcc/analytics/reporting";

const WINDOW_OPTIONS = ["24h", "7d", "28d"] as const;

const CONTENT_FAMILY_OPTIONS = [
  { value: "all", label: "All Content & Journey Families" },
  { value: "cruise_sailing", label: "Cruise Sailings & Port Plans" },
  { value: "hosted_group", label: "Hosted Group Cruises" },
  { value: "uncruise", label: "UnCruise / Expedition Voyages" },
  { value: "independent_alaska_ferry", label: "Independent Alaska (Ferry & Air)" },
  { value: "alaska_rv", label: "Alaska RV Planning" },
  { value: "fishing_lodges", label: "SE Alaska Fishing Lodges" },
  { value: "weekend_in_juneau", label: "Weekend in Juneau Stay Guide" },
  { value: "flightseeing", label: "Juneau Flightseeing (JFD)" },
  { value: "new_orleans_swamp", label: "New Orleans & Swamp Discovery" },
  { value: "operating_mor", label: "Direct Operating MoR (GoSno / PARR / Feastly)" },
  { value: "general_discovery", label: "General Discovery" },
] as const;

function renderMetricOrUnavailable(
  val: number | "unavailable" | "excluded" | "not_applicable" | null | undefined,
  opts?: { currency?: boolean },
) {
  if (val === "unavailable" || val === null || val === undefined) {
    return (
      <span className="inline-flex items-center rounded-md border border-amber-400/40 bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-200">
        Unavailable
      </span>
    );
  }
  if (val === "excluded") {
    return (
      <span className="inline-flex items-center rounded-md border border-zinc-600 bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
        Excluded
      </span>
    );
  }
  if (val === "not_applicable") {
    return <span className="text-xs text-zinc-500">N/A</span>;
  }
  if (opts?.currency) {
    return `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return val.toLocaleString();
}

function tierBadge(tier: string) {
  switch (tier) {
    case "v2_end_to_end":
      return (
        <span className="rounded-md border border-emerald-400/40 bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-200">
          v2 End-to-End
        </span>
      );
    case "v2_server_adapter":
      return (
        <span className="rounded-md border border-sky-400/40 bg-sky-500/15 px-2 py-0.5 text-xs font-semibold text-sky-200">
          Server Adapter
        </span>
      );
    case "supplemental_manifest":
      return (
        <span className="rounded-md border border-violet-400/40 bg-violet-500/15 px-2 py-0.5 text-xs font-semibold text-violet-200">
          Supplemental
        </span>
      );
    case "uninstrumented_unavailable":
      return (
        <span className="rounded-md border border-amber-400/40 bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-200">
          Uninstrumented
        </span>
      );
    case "retired_or_redirected":
      return (
        <span className="rounded-md border border-zinc-500/40 bg-zinc-800/80 px-2 py-0.5 text-xs text-zinc-400">
          Retired
        </span>
      );
    case "excluded_external":
      return (
        <span className="rounded-md border border-orange-400/40 bg-orange-500/15 px-2 py-0.5 text-xs text-orange-200">
          Contained External
        </span>
      );
    default:
      return (
        <span className="rounded-md border border-zinc-600 bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
          Excluded Community
        </span>
      );
  }
}

export default function AnalyticsDashboardClient({
  initialReport,
}: {
  initialReport: NetworkAndTripAnalyticsReport;
}) {
  const [report, setReport] = useState<NetworkAndTripAnalyticsReport>(initialReport);
  const [windowPreset, setWindowPreset] = useState<"24h" | "7d" | "28d">(
    initialReport.filters.windowPreset,
  );
  const [siteFilter, setSiteFilter] = useState<string>(initialReport.filters.siteId);
  const [familyFilter, setFamilyFilter] = useState<string>(initialReport.filters.contentFamily);
  const [envFilter, setEnvFilter] = useState<string>(initialReport.environment);
  const [isPending, startTransition] = useTransition();

  function refreshReport(next: {
    window?: "24h" | "7d" | "28d";
    site?: string;
    family?: string;
    env?: string;
    processPending?: boolean;
  }) {
    const w = next.window ?? windowPreset;
    const s = next.site ?? siteFilter;
    const f = next.family ?? familyFilter;
    const e = next.env ?? envFilter;

    startTransition(async () => {
      try {
        const qs = new URLSearchParams({
          window: w,
          site: s,
          family: f,
          env: e,
          ...(next.processPending ? { processPending: "1" } : {}),
        });
        const res = await fetch(`/api/admin/analytics/report?${qs.toString()}`, {
          cache: "no-store",
        });
        const data = (await res.json()) as NetworkAndTripAnalyticsReport;
        if (data && data.schemaVersion) {
          setReport(data);
        }
      } catch {
        // Keep current snapshot displayed if network request fails
      }
    });
  }

  function toggleRuntimeKillSwitch(nextActive: boolean) {
    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/analytics/control", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            killSwitchActive: nextActive,
            actorNote: "admin_dashboard_toggle",
          }),
        });
        if (res.ok) {
          refreshReport({ processPending: false });
        }
      } catch {
        // ignore
      }
    });
  }

  const ts = report.trafficSummary;
  const tl = report.tripLifecycle;
  const th = report.telemetryHealth;
  const hyg = report.trafficHygieneAndExclusions;
  const fin = report.financialOutcomesSeparation;

  return (
    <main
      className="min-h-screen bg-zinc-950 px-6 py-8 text-white"
      data-testid="dcc-analytics-v2-dashboard"
    >
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header & Governance Metadata */}
        <header className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-zinc-900/70 p-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-300">
              <span>DCC Network &amp; Trip Lifecycle Analytics</span>
              <span>·</span>
              <code className="rounded bg-white/10 px-1.5 py-0.5 text-zinc-200">
                {report.metricDictionaryVersion}
              </code>
              <span>·</span>
              <span className="rounded bg-indigo-500/20 px-2 py-0.5 text-indigo-200">
                Env: {report.environment}
              </span>
              <span>·</span>
              <span
                data-testid="analytics-backend-badge"
                className="rounded border border-emerald-400/30 bg-emerald-500/15 px-2 py-0.5 text-emerald-200"
              >
                DB: {report.backendInfo?.backend}:{report.backendInfo?.databaseName}
                {report.backendInfo?.cacheHit ? " (cached)" : ""}
              </span>
              {report.dbTelemetry && (
                <span className="rounded bg-white/10 px-2 py-0.5 text-zinc-300">
                  {report.dbTelemetry.queryCount}q · {(report.dbTelemetry.transferredBytes / 1024).toFixed(1)} KB ·{" "}
                  {report.dbTelemetry.dbElapsedMs.toFixed(1)}ms
                </span>
              )}
            </div>
            <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
              Acquisition Traffic &amp; Connected Trip Lifecycle
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              Window: <code>{report.filters.startIso.slice(0, 19)}Z</code> →{" "}
              <code>{report.filters.endIso.slice(0, 19)}Z</code> (UTC) · Watermark:{" "}
              <code>{th?.watermark.processedThroughIso || "No events processed yet"}</code>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {WINDOW_OPTIONS.map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => {
                  setWindowPreset(w);
                  refreshReport({ window: w });
                }}
                className={`rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                  windowPreset === w
                    ? "bg-indigo-500 text-white"
                    : "border border-white/15 bg-black/40 text-zinc-300 hover:bg-white/10"
                }`}
              >
                {w.toUpperCase()}
              </button>
            ))}

            <select
              aria-label="Environment filter"
              value={envFilter}
              onChange={(e) => {
                setEnvFilter(e.target.value);
                refreshReport({ env: e.target.value });
              }}
              className="rounded-xl border border-white/15 bg-zinc-900 px-3 py-2 text-xs font-semibold text-zinc-200"
            >
              <option value="preview">Preview (Nonprod)</option>
              <option value="production">Production</option>
              <option value="development">Development</option>
              <option value="test">Test</option>
            </select>

            <button
              type="button"
              disabled={isPending}
              onClick={() => refreshReport({ processPending: true })}
              className="rounded-xl border border-emerald-400/40 bg-emerald-500/15 px-3.5 py-2 text-xs font-bold text-emerald-200 hover:bg-emerald-500/25 disabled:opacity-50"
            >
              {isPending ? "Refreshing…" : "Run Worker & Refresh"}
            </button>
          </div>
        </header>

        {/* Stale / Outage Honest Banner */}
        {report.dataStatus !== "live_verified" && (
          <section
            role="alert"
            data-testid="analytics-degraded-banner"
            className={`rounded-2xl border p-5 ${
              report.dataStatus === "stale_last_good_snapshot"
                ? "border-amber-400/50 bg-amber-500/10 text-amber-100"
                : "border-rose-400/50 bg-rose-500/10 text-rose-100"
            }`}
          >
            <h2 className="text-base font-bold">
              {report.dataStatus === "stale_last_good_snapshot"
                ? "Showing Stale Last-Good Snapshot (Live Store Degraded)"
                : "Analytics Store Currently Unavailable — Metrics Not Zeroed"}
            </h2>
            <p className="mt-1 text-sm opacity-90">{report.staleOrUnavailableReason}</p>
          </section>
        )}

        {/* Dimension Filters + Ingestion Pipeline Health Strip */}
        <section className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-4 lg:col-span-2">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-zinc-400">
                  Property / Spoke Filter
                </label>
                <select
                  aria-label="Site filter"
                  value={siteFilter}
                  onChange={(e) => {
                    setSiteFilter(e.target.value);
                    refreshReport({ site: e.target.value });
                  }}
                  className="mt-1.5 w-full rounded-xl border border-white/15 bg-zinc-950 px-3 py-2 text-sm text-white"
                >
                  <option value="all">All Registered Properties</option>
                  <option value="cruisepromenade">Cruise Promenade (CP)</option>
                  <option value="lastfrontiershoreexcursions">
                    Last Frontier Shore Excursions (LFSE)
                  </option>
                  <option value="juneauflightdeck">Juneau Flight Deck (JFD)</option>
                  <option value="destinationcommandcenter">Destination Command Center (DCC)</option>
                  <option value="welcometoneworleanstours">Welcome to New Orleans Tours (WTNO)</option>
                  <option value="welcometotheswamp">Welcome to the Swamp (WTS)</option>
                  <option value="gosno">GoSno (Direct MoR)</option>
                  <option value="partyatredrocks">Party at Red Rocks (Direct MoR)</option>
                  <option value="feastlyspread">FeastlySpread</option>
                  <option value="vibearoundtown">Vibing Around Tour Co.</option>
                  <option value="brinkberry">Brinkberry</option>
                  <option value="420friendlyairportpickup">420 Friendly Airport Pickup</option>
                  <option value="bluehillsoutpost">Blue Hills Outpost</option>
                  <option value="somersetshuttle">Somerset Amphitheater Shuttle</option>
                  <option value="welcometoalaskatours">Welcome to Alaska Tours (Contained)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400">
                  Content &amp; Journey Family
                </label>
                <select
                  aria-label="Content family filter"
                  value={familyFilter}
                  onChange={(e) => {
                    setFamilyFilter(e.target.value);
                    refreshReport({ family: e.target.value });
                  }}
                  className="mt-1.5 w-full rounded-xl border border-white/15 bg-zinc-950 px-3 py-2 text-sm text-white"
                >
                  {CONTENT_FAMILY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-4 text-xs">
            <div className="flex items-center justify-between gap-2 font-bold text-zinc-200">
              <span>Pipeline Health &amp; Runtime Kill Switch</span>
              <div className="flex items-center gap-1.5">
                <span
                  data-testid="kill-switch-status-badge"
                  className={`rounded px-2 py-0.5 ${
                    th?.killSwitchActive
                      ? "bg-rose-500/20 text-rose-200"
                      : "bg-emerald-500/20 text-emerald-200"
                  }`}
                >
                  {th?.killSwitchActive
                    ? `Kill Switch ON (${th.killSwitchSource})`
                    : "Collector Healthy"}
                </span>
                {th && th.killSwitchSource !== "env_override" && (
                  <button
                    type="button"
                    data-testid="runtime-kill-switch-toggle"
                    disabled={isPending}
                    onClick={() => toggleRuntimeKillSwitch(!th.killSwitchActive)}
                    className="rounded border border-white/20 bg-white/5 px-2 py-0.5 text-[11px] font-semibold text-zinc-200 hover:bg-white/15 disabled:opacity-50"
                  >
                    {th.killSwitchActive ? "Resume" : "Halt Ingest"}
                  </button>
                )}
              </div>
            </div>
            {th ? (
              <div className="mt-2 grid grid-cols-3 gap-2 text-zinc-300">
                <div>
                  <span className="text-zinc-500">Pending Queue:</span>{" "}
                  <strong>{th.watermark.pendingQueueDepth}</strong>
                </div>
                <div>
                  <span className="text-zinc-500">Processed:</span>{" "}
                  <strong>{th.counters.processedTotal}</strong>
                </div>
                <div>
                  <span className="text-zinc-500">Deduped:</span>{" "}
                  <strong>
                    {th.counters.deduplicatedIngestTotal + th.counters.deduplicatedWorkerTotal}
                  </strong>
                </div>
                <div>
                  <span className="text-zinc-500">Late Fixed:</span>{" "}
                  <strong>{th.counters.lateEventsReconciledTotal}</strong>
                </div>
                <div>
                  <span className="text-zinc-500">Rejected:</span>{" "}
                  <strong>
                    {th.counters.rejectedInvalidTotal +
                      th.counters.rejectedUnauthorizedOutcomeTotal}
                  </strong>
                </div>
                <div>
                  <span className="text-zinc-500">Dead Letter:</span>{" "}
                  <strong>{th.watermark.deadLetterCount}</strong>
                </div>
              </div>
            ) : (
              <div className="mt-2">{renderMetricOrUnavailable("unavailable")}</div>
            )}
          </div>
        </section>

        {/* Layer 1: Acquisition & Observed Browser Traffic */}
        <section className="space-y-4 rounded-2xl border border-white/10 bg-zinc-900/60 p-6">
          <div>
            <h2 className="text-xl font-bold">
              Layer 1 — Network Acquisition &amp; Observed Browser Traffic
            </h2>
            <p className="text-xs text-zinc-400">
              Visitors without a trip belong here. Click-only outbound requests without pageviews are
              excluded from visitor counts.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-xl border border-white/10 bg-black/40 p-4">
              <div className="text-xs text-zinc-400">Observed Browsers (`rsub_v1`)</div>
              <div className="mt-1 text-2xl font-black text-white">
                {renderMetricOrUnavailable(ts?.observedBrowsers)}
              </div>
              <div className="mt-1 text-xs text-zinc-500">Pageview-backed only</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/40 p-4">
              <div className="text-xs text-zinc-400">Defined Sessions (30m)</div>
              <div className="mt-1 text-2xl font-black text-white">
                {renderMetricOrUnavailable(ts?.sessions)}
              </div>
              <div className="mt-1 text-xs text-zinc-500">
                Returning browsers: {renderMetricOrUnavailable(ts?.returningBrowsers)}
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/40 p-4">
              <div className="text-xs text-zinc-400">Logical Pageviews</div>
              <div className="mt-1 text-2xl font-black text-white">
                {renderMetricOrUnavailable(ts?.pageviews)}
              </div>
              <div className="mt-1 text-xs text-zinc-500">
                Guides: {renderMetricOrUnavailable(ts?.guideEngagements)} · Prints:{" "}
                {renderMetricOrUnavailable(ts?.printableOpens)}
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/40 p-4">
              <div className="text-xs text-zinc-400">Cross-Site Handoffs</div>
              <div className="mt-1 text-2xl font-black text-cyan-200">
                {renderMetricOrUnavailable(ts?.crossSiteHandoffArrivals)}
              </div>
              <div className="mt-1 text-xs text-zinc-500">
                Verified `dcc_ctx_`: {renderMetricOrUnavailable(ts?.verifiedDccCtxArrivals)} ·
                Clicks: {renderMetricOrUnavailable(ts?.crossSiteHandoffClicks)}
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/40 p-4">
              <div className="text-xs text-zinc-400">Seller Handoffs (Clicks Only)</div>
              <div className="mt-1 text-2xl font-black text-amber-200">
                {renderMetricOrUnavailable(ts?.sellerHandoffsTotal)}
              </div>
              <div className="mt-1 text-xs text-amber-300/80">Not bookings or revenue</div>
            </div>
          </div>

          {/* Traffic Classification & Hygiene Separation */}
          {hyg && (
            <div className="rounded-xl border border-white/10 bg-zinc-950/80 p-4 text-xs">
              <div className="font-bold text-zinc-200">
                Traffic Classification Separation (Mutually Exclusive Event Counts)
              </div>
              <div className="mt-2 flex flex-wrap gap-4 text-zinc-300">
                <span>
                  Observed Browser: <strong className="text-emerald-300">{hyg.observedBrowserEvents}</strong>
                </span>
                <span>
                  Known Bots Excluded: <strong className="text-rose-300">{hyg.knownBotEvents}</strong>
                </span>
                <span>
                  Suspected Automation / Prefetch:{" "}
                  <strong className="text-amber-300">{hyg.suspectedAutomationAndPrefetchEvents}</strong>
                </span>
                <span>
                  QA / Synthetic Excluded:{" "}
                  <strong className="text-sky-300">{hyg.qaOrSyntheticEvents}</strong>
                </span>
                <span>
                  Internal Operator: <strong>{hyg.internalOperatorEvents}</strong>
                </span>
                <span>
                  Unidentified Outbound Requests:{" "}
                  <strong className="text-zinc-400">{hyg.unclassifiedClickOnlyRequests}</strong>
                </span>
              </div>
            </div>
          )}

          {/* Content Family, Landing Pages, Sources & Cross-Site Transitions */}
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-black/30 p-4">
              <h3 className="text-sm font-bold text-zinc-200">By Content / Journey Family</h3>
              <div className="mt-2 space-y-1.5 text-xs">
                {report.byContentFamily.length === 0 ? (
                  <p className="text-zinc-500">No observed browser pageviews in selected slice.</p>
                ) : (
                  report.byContentFamily.map((row) => (
                    <div key={row.contentFamily} className="flex items-center justify-between">
                      <code className="text-zinc-300">{row.contentFamily}</code>
                      <span className="text-zinc-200">
                        {row.observedBrowsers} browsers · {row.pageviews} pv · {row.printableOpens}{" "}
                        prints
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/30 p-4">
              <h3 className="text-sm font-bold text-zinc-200">Top Redacted Landing Pages</h3>
              <div className="mt-2 space-y-1.5 text-xs">
                {report.topLandingPages.length === 0 ? (
                  <p className="text-zinc-500">No landing sessions in selected slice.</p>
                ) : (
                  report.topLandingPages.map((row) => (
                    <div key={row.value} className="flex items-center justify-between gap-2">
                      <code className="truncate text-zinc-300">{row.value}</code>
                      <span className="shrink-0 text-zinc-200">
                        {row.sessions} sess · {row.pageviews} pv
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/30 p-4">
              <h3 className="text-sm font-bold text-zinc-200">
                Sources, Campaigns &amp; Cross-Site Handoffs
              </h3>
              <div className="mt-2 space-y-1.5 text-xs">
                {report.topSourcesAndCampaigns.map((row) => (
                  <div key={row.value} className="flex items-center justify-between">
                    <span className="text-zinc-300">{row.value}</span>
                    <span className="text-zinc-200">{row.sessions} sess</span>
                  </div>
                ))}
                {report.crossSiteTransitions.length > 0 && (
                  <div className="mt-3 border-t border-white/10 pt-2">
                    <div className="font-semibold text-cyan-200">Supported Handoff Transitions</div>
                    {report.crossSiteTransitions.map((t, idx) => (
                      <div key={idx} className="mt-1 flex items-center justify-between">
                        <span>
                          {t.fromSiteId} → {t.toSiteId} ({t.continuityTier})
                        </span>
                        <strong>{t.transitionCount}</strong>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Layer 2: 10-Stage Trip Lifecycle & Confirmation Provenance */}
        <section className="space-y-4 rounded-2xl border border-indigo-400/25 bg-zinc-900/60 p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <h2 className="text-xl font-bold text-indigo-100">
                Layer 2 — Trip Lifecycle Cohorts (10 Distinct Milestones)
              </h2>
              <p className="text-xs text-zinc-400">
                Anonymous local drafts linked to persisted trips:{" "}
                <strong>{tl ? tl.draftToPersistedLinkedCount : "—"}</strong> (counted once, never
                double-counted). Invitations never count as collaboration; client events never
                certify payment.
              </p>
            </div>
          </div>

          {tl ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {[
                  {
                    label: "1. Planning Entry",
                    val: tl.milestones.stage1_planningEntrySelected,
                    sub: "Guide / sailing CTA",
                  },
                  {
                    label: "2. Draft Started",
                    val: tl.milestones.stage2_draftStarted,
                    sub: "Unified with persisted",
                  },
                  {
                    label: "3. Persisted Trip",
                    val: tl.milestones.stage3_tripPersisted,
                    sub: "Durable server save",
                  },
                  {
                    label: "4. Customized (Real)",
                    val: tl.milestones.stage4_firstMeaningfulCustomization,
                    sub: "Excludes templates/no-ops",
                  },
                  {
                    label: "5. Confirmation Applied",
                    val: tl.milestones.stage5_confirmationApplied,
                    sub: `Staged: ${tl.milestones.stage5_confirmationStaged} · Rejected: ${tl.milestones.stage5_confirmationRejected}`,
                  },
                  {
                    label: "6. Invitation Shared",
                    val: tl.milestones.stage6_invitationShared,
                    sub: "Not collaboration",
                  },
                  {
                    label: "7. Companion Participated",
                    val: tl.milestones.stage7_companionContributed,
                    sub: `Opened: ${tl.milestones.stage7_companionFirstOpened} · Companions: ${tl.milestones.stage7_distinctCompanionsCount} · Merges: ${tl.milestones.stage7_duplicateMergesReconciled}`,
                  },
                  {
                    label: "8. Later Return",
                    val: tl.milestones.stage8_returnedLaterSession,
                    sub: `D1+ (${tl.agedRetentionCohorts.d1Plus.returnedTrips}/${tl.agedRetentionCohorts.d1Plus.eligiblePersistedTrips} aged)`,
                  },
                  {
                    label: "9. Seller Handoff",
                    val: tl.milestones.stage9_sellerHandoffInitiated,
                    sub: "Clicks / handoffs only",
                  },
                  {
                    label: "10. Verified Outcome",
                    val: tl.milestones.stage10_confirmedOutcome,
                    sub: "Server-authenticated only",
                  },
                ].map((stage) => (
                  <div
                    key={stage.label}
                    className="rounded-xl border border-white/10 bg-black/40 p-3.5"
                  >
                    <div className="text-xs font-semibold text-indigo-200">{stage.label}</div>
                    <div className="mt-1 text-2xl font-black text-white">
                      {stage.val.toLocaleString()}
                    </div>
                    <div className="mt-1 text-[11px] text-zinc-400">{stage.sub}</div>
                  </div>
                ))}
              </div>

              {/* Confirmation 4-Dimension Provenance + Aged Retention */}
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-black/30 p-4 text-xs">
                  <h3 className="text-sm font-bold text-zinc-200">
                    4-Dimension Confirmation Provenance (Zero PII / Zero Bodies)
                  </h3>
                  <div className="mt-2 grid grid-cols-2 gap-3 text-zinc-300">
                    <div>
                      <div className="font-semibold text-zinc-400">1. Extraction Channel</div>
                      {Object.entries(tl.confirmationProvenanceBreakdown.byExtractionChannel).map(
                        ([k, v]) => (
                          <div key={k} className="flex justify-between">
                            <code>{k}</code>
                            <strong>{v}</strong>
                          </div>
                        ),
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-zinc-400">2. Traveler Review / Edit</div>
                      {Object.entries(tl.confirmationProvenanceBreakdown.byReviewState).map(
                        ([k, v]) => (
                          <div key={k} className="flex justify-between">
                            <code>{k}</code>
                            <strong>{v}</strong>
                          </div>
                        ),
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-zinc-400">3. Provider Verification</div>
                      {Object.entries(tl.confirmationProvenanceBreakdown.byProviderVerification).map(
                        ([k, v]) => (
                          <div key={k} className="flex justify-between">
                            <code>{k}</code>
                            <strong>{v}</strong>
                          </div>
                        ),
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-zinc-400">4. DCC Day/Catalog Inference</div>
                      {Object.entries(tl.confirmationProvenanceBreakdown.byDccDayMatchMethod).map(
                        ([k, v]) => (
                          <div key={k} className="flex justify-between">
                            <code>{k}</code>
                            <strong>{v}</strong>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/30 p-4 text-xs">
                  <h3 className="text-sm font-bold text-zinc-200">
                    Aged Cohort Retention &amp; Financial Track Separation
                  </h3>
                  <div className="mt-2 space-y-2 text-zinc-300">
                    <div className="flex justify-between">
                      <span>D1+ Multi-Day Return (Trips Persisted &ge; 24h ago):</span>
                      <strong>
                        {tl.agedRetentionCohorts.d1Plus.retentionRate === "insufficient_aged_cohort"
                          ? "Insufficient aged cohort (0 eligible)"
                          : `${tl.agedRetentionCohorts.d1Plus.retentionRate}% (${tl.agedRetentionCohorts.d1Plus.returnedTrips}/${tl.agedRetentionCohorts.d1Plus.eligiblePersistedTrips})`}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span>D7+ Multi-Day Return (Trips Persisted &ge; 7d ago):</span>
                      <strong>
                        {tl.agedRetentionCohorts.d7Plus.retentionRate === "insufficient_aged_cohort"
                          ? "Insufficient aged cohort (0 eligible)"
                          : `${tl.agedRetentionCohorts.d7Plus.retentionRate}% (${tl.agedRetentionCohorts.d7Plus.returnedTrips}/${tl.agedRetentionCohorts.d7Plus.eligiblePersistedTrips})`}
                      </strong>
                    </div>
                    {fin && (
                      <div className="mt-3 space-y-1 border-t border-white/10 pt-2">
                        <div className="flex justify-between">
                          <span>Direct MoR Gross Sales (Not Profit):</span>
                          <strong>
                            {renderMetricOrUnavailable(fin.directMorPaidGrossSalesUsd, {
                              currency: true,
                            })}
                          </strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Verified Affiliate Commissions:</span>
                          <strong>
                            {renderMetricOrUnavailable(fin.verifiedAffiliateCommissionsUsd, {
                              currency: true,
                            })}
                          </strong>
                        </div>
                        <div className="flex justify-between text-zinc-400">
                          <span>Net Operating Profit:</span>
                          <span>{fin.netOperatingProfitLabel}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div>{renderMetricOrUnavailable("unavailable")}</div>
          )}
        </section>

        {/* Full Ecosystem Property & Instrumentation Coverage Table */}
        <section className="rounded-2xl border border-white/10 bg-zinc-900/60 p-6">
          <h2 className="text-lg font-bold">
            Canonical Ecosystem Registry &amp; Instrumentation Coverage ({report.sites.length}{" "}
            Properties)
          </h2>
          <p className="text-xs text-zinc-400">
            Configured registry status is distinct from observed traffic. Unconnected provider feeds
            display as <code>Unavailable</code>, never zero.
          </p>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-white/10 text-zinc-400">
                <tr>
                  <th className="py-2 pr-3">Property</th>
                  <th className="py-2 pr-3">Coverage</th>
                  <th className="py-2 pr-3">Browsers</th>
                  <th className="py-2 pr-3">Sessions</th>
                  <th className="py-2 pr-3">Pageviews</th>
                  <th className="py-2 pr-3">Guides / Prints</th>
                  <th className="py-2 pr-3">Handoffs (Clicks)</th>
                  <th className="py-2 pr-3">Bots / QA Filtered</th>
                  <th className="py-2 pr-3">Verified Bookings</th>
                  <th className="py-2">MoR Gross / Comm</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-zinc-200">
                {report.sites.map((s) => (
                  <tr key={s.siteId}>
                    <td className="py-2.5 pr-3 max-w-xs">
                      <div className="font-semibold text-white">{s.displayName}</div>
                      <div className="text-[11px] text-zinc-400">{s.canonicalDomain}</div>
                      <div className="mt-0.5 text-[10px] text-zinc-500 leading-snug">
                        {s.redirectAndSourceNotes}
                      </div>
                    </td>
                    <td className="py-2.5 pr-3">
                      <div>{tierBadge(s.instrumentationTier)}</div>
                      <div className="mt-1 text-[10px] text-zinc-500">
                        GSC:{" "}
                        {s.externalSourcesStatus.gsc === "snapshot_attached_2026_11_19"
                          ? "Nov 19 zip"
                          : "Unavailable"}{" "}
                        · GA4: Unavailable
                      </div>
                    </td>
                    <td className="py-2.5 pr-3">
                      {renderMetricOrUnavailable(s.observedBrowsers)}
                    </td>
                    <td className="py-2.5 pr-3">{renderMetricOrUnavailable(s.sessions)}</td>
                    <td className="py-2.5 pr-3">{renderMetricOrUnavailable(s.pageviews)}</td>
                    <td className="py-2.5 pr-3">
                      {renderMetricOrUnavailable(s.guideEngagements)} /{" "}
                      {renderMetricOrUnavailable(s.printableOpens)}
                    </td>
                    <td className="py-2.5 pr-3">{s.sellerHandoffs}</td>
                    <td className="py-2.5 pr-3 text-zinc-400">
                      {s.knownBotEventsExcluded}b / {s.qaEventsExcluded}qa
                    </td>
                    <td className="py-2.5 pr-3">
                      {renderMetricOrUnavailable(s.confirmedBookings)}
                    </td>
                    <td className="py-2.5">
                      {s.commercialModel === "owned_direct_checkout"
                        ? renderMetricOrUnavailable(s.ownedMorGrossSalesUsd, { currency: true })
                        : renderMetricOrUnavailable(s.verifiedCommissionsUsd, { currency: true })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
