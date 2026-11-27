import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  ANALYTICS_SCHEMA_VERSION,
  ANALYTICS_SITE_REGISTRY,
  METRIC_DICTIONARY_VERSION,
  type AnalyticsEnvironment,
  type CanonicalAnalyticsSiteId,
  type ConfirmationProvenance,
  type ContentFamily,
  type InstrumentationCoverageTier,
} from "./contract";
import {
  describeActiveAnalyticsBackend,
  ensureAnalyticsStoreAvailable,
  getAnalyticsRuntimeControls,
  normalizeSqlJson,
  readAnalyticsHealthCounters,
  readAnalyticsWatermarkState,
  withAnalyticsDbTelemetry,
  type AnalyticsDbTelemetry,
  type AnalyticsHealthCounters,
  type AnalyticsRuntimeControls,
  type AnalyticsWatermarkState,
} from "./store";

export type AnalyticsWindowPreset = "24h" | "7d" | "28d";

const WINDOW_HOURS: Record<AnalyticsWindowPreset, number> = {
  "24h": 24,
  "7d": 7 * 24,
  "28d": 28 * 24,
};

export type SiteCollectionRuntimeState =
  | "collecting_real_traffic"
  | "synthetic_verification_only"
  | "wired_awaiting_traffic"
  | "handoff_adapter_only"
  | "registered_only_not_collecting"
  | "contained_or_retired"
  | "excluded_community";

export interface SiteTrafficAndCoverageRow {
  siteId: string;
  displayName: string;
  canonicalDomain: string;
  residency: string;
  redirectAndSourceNotes: string;
  externalSourcesStatus: {
    ga4: "unavailable" | "not_configured";
    gsc: "snapshot_attached_2026_11_19" | "unavailable";
    vercelWebAnalytics: "unavailable" | "not_configured";
  };
  inActive12Portfolio: boolean;
  initialRolloutTarget: boolean;
  instrumentationTier: InstrumentationCoverageTier;
  pageviewCollectionWired: boolean;
  collectionRuntimeState: SiteCollectionRuntimeState;
  lastRealEventAt: string | null;
  lastSyntheticEventAt: string | null;
  commercialModel: string;
  outcomeFeedMode: string;
  observedBrowsers: number | "unavailable" | "excluded";
  sessions: number | "unavailable" | "excluded";
  returningBrowsers: number | "unavailable" | "excluded";
  pageviews: number | "unavailable" | "excluded";
  guideEngagements: number | "unavailable";
  printableOpens: number | "unavailable";
  crossSiteClicks: number;
  crossSiteArrivals: number;
  verifiedCtxArrivals: number;
  sellerHandoffs: number;
  knownBotEventsExcluded: number;
  qaEventsExcluded: number;
  suspectedAutomationExcluded: number;
  unidentifiedOutboundRequests: number;
  confirmedBookings: number | "unavailable";
  ownedMorGrossSalesUsd: number | "unavailable" | "not_applicable";
  verifiedCommissionsUsd: number | "unavailable" | "not_applicable";
}

export interface CrossSiteTransitionRow {
  fromSiteId: string;
  toSiteId: string;
  continuityTier: string;
  transitionCount: number;
}

export interface TopDimensionRow {
  value: string;
  pageviews: number;
  sessions: number;
}

export interface TripLifecycleFunnelReport {
  totalDistinctTripUnitsInWindow: number;
  draftToPersistedLinkedCount: number;
  milestones: {
    stage1_planningEntrySelected: number;
    stage2_draftStarted: number;
    stage3_tripPersisted: number;
    stage4_firstMeaningfulCustomization: number;
    stage5_confirmationStaged: number;
    stage5_confirmationReviewed: number;
    stage5_confirmationApplied: number;
    stage5_confirmationRejected: number;
    stage5_confirmationAmended: number;
    stage5_confirmationCancelled: number;
    stage6_invitationShared: number;
    stage7_companionFirstOpened: number;
    stage7_companionContributed: number;
    stage7_distinctCompanionsCount: number;
    stage7_duplicateMergesReconciled: number;
    stage8_returnedLaterSession: number;
    stage9_sellerHandoffInitiated: number;
    stage10_confirmedOutcome: number;
  };
  agedRetentionCohorts: {
    d1Plus: {
      minAgeHours: 24;
      eligiblePersistedTrips: number;
      returnedTrips: number;
      retentionRate: number | "insufficient_aged_cohort";
    };
    d7Plus: {
      minAgeHours: 168;
      eligiblePersistedTrips: number;
      returnedTrips: number;
      retentionRate: number | "insufficient_aged_cohort";
    };
  };
  confirmationProvenanceBreakdown: {
    byExtractionChannel: Record<string, number>;
    byReviewState: Record<string, number>;
    byProviderVerification: Record<string, number>;
    byDccDayMatchMethod: Record<string, number>;
  };
  byJourneyKind: Array<{
    journeyKind: string;
    tripsTotal: number;
    persisted: number;
    customized: number;
    companionContributed: number;
    sellerHandoffs: number;
  }>;
}

export interface NetworkAndTripAnalyticsReport {
  ok: boolean;
  dataStatus: "live_verified" | "stale_last_good_snapshot" | "unavailable";
  staleOrUnavailableReason: string | null;
  snapshotCapturedAt: string;
  generatedAt: string;
  schemaVersion: typeof ANALYTICS_SCHEMA_VERSION;
  metricDictionaryVersion: typeof METRIC_DICTIONARY_VERSION;
  environment: AnalyticsEnvironment;
  timezone: "UTC";
  backendInfo: {
    backend: string;
    databaseName: string;
    cacheHit: boolean;
  };
  dbTelemetry?: AnalyticsDbTelemetry;
  runtimeControls?: AnalyticsRuntimeControls;
  filters: {
    windowPreset: AnalyticsWindowPreset;
    startIso: string;
    endIso: string;
    siteId: CanonicalAnalyticsSiteId | "all";
    contentFamily: ContentFamily | "all";
  };
  telemetryHealth: {
    watermark: AnalyticsWatermarkState;
    counters: AnalyticsHealthCounters;
    ingestionLagSeconds: number | null;
    killSwitchActive: boolean;
    killSwitchSource: "env_override" | "runtime_db" | "off";
  } | null;
  trafficSummary: {
    observedBrowsers: number;
    sessions: number;
    returningBrowsers: number;
    singlePageviewBrowserIds: number;
    multiPageviewBrowserIds: number;
    singlePageviewCpPlannerIds: number;
    pageviews: number;
    guideEngagements: number;
    printableOpens: number;
    crossSiteHandoffClicks: number;
    crossSiteHandoffArrivals: number;
    verifiedDccCtxArrivals: number;
    sellerHandoffsTotal: number;
    honestyDisclosures: string[];
  } | null;
  trafficHygieneAndExclusions: {
    observedBrowserEvents: number;
    knownBotEvents: number;
    suspectedAutomationAndPrefetchEvents: number;
    qaOrSyntheticEvents: number;
    internalOperatorEvents: number;
    unclassifiedClickOnlyRequests: number;
  } | null;
  syntheticVerificationSummary?: {
    totalSyntheticVerificationEvents: number;
    bySite: Record<string, number>;
    excludedFromHumanKpisAndFunnel: true;
  } | null;
  portfolioCollectionSummary?: {
    collectingRealTrafficSites: string[];
    syntheticVerificationOnlySites: string[];
    wiredAwaitingTrafficSites: string[];
    serverHandoffOnlySites: string[];
    registeredCatalogOnlyNotCollectingSites: string[];
    containedRetiredOrExcludedSites: string[];
  } | null;
  topLandingPages: TopDimensionRow[];
  topSourcesAndCampaigns: TopDimensionRow[];
  byContentFamily: Array<{
    contentFamily: string;
    pageviews: number;
    observedBrowsers: number;
    guideEngagements: number;
    printableOpens: number;
    sellerHandoffs: number;
  }>;
  crossSiteTransitions: CrossSiteTransitionRow[];
  tripLifecycle: TripLifecycleFunnelReport | null;
  financialOutcomesSeparation: {
    directMorPaidGrossSalesUsd: number | "unavailable";
    verifiedAffiliateCommissionsUsd: number | "unavailable";
    unverifiedAffiliateClicksCount: number;
    netOperatingProfitLabel: "Unreconciled in analytics (never equated with gross sales)";
    disclosures: string[];
  } | null;
  sites: SiteTrafficAndCoverageRow[];
}

const memorySnapshotFallback = new Map<string, NetworkAndTripAnalyticsReport>();

function resolveLastGoodBackupFilePath(): string {
  const dir = path.join(os.tmpdir(), "dcc-analytics-v2");
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch {
    // ignore
  }
  return path.join(dir, `last-good-snapshots-${process.pid}.json`);
}

function saveLastGoodSnapshot(cacheKey: string, report: NetworkAndTripAnalyticsReport): void {
  memorySnapshotFallback.set(cacheKey, report);
  try {
    const p = resolveLastGoodBackupFilePath();
    let all: Record<string, NetworkAndTripAnalyticsReport> = {};
    if (fs.existsSync(p)) {
      all = JSON.parse(fs.readFileSync(p, "utf8"));
    }
    all[cacheKey] = report;
    fs.writeFileSync(p, JSON.stringify(all), "utf8");
  } catch {
    // best-effort snapshot persistence
  }
}

function loadLastGoodSnapshot(cacheKey: string): NetworkAndTripAnalyticsReport | null {
  const mem = memorySnapshotFallback.get(cacheKey);
  if (mem) return mem;
  try {
    const p = resolveLastGoodBackupFilePath();
    if (fs.existsSync(p)) {
      const all = JSON.parse(fs.readFileSync(p, "utf8")) as Record<
        string,
        NetworkAndTripAnalyticsReport
      >;
      return all[cacheKey] || null;
    }
  } catch {
    // ignore
  }
  return null;
}

export function clearReportMemorySnapshotsForTests(): void {
  memorySnapshotFallback.clear();
  try {
    const p = resolveLastGoodBackupFilePath();
    if (fs.existsSync(p)) fs.unlinkSync(p);
  } catch {
    // ignore
  }
}

export async function buildNetworkAndTripAnalyticsReport(options?: {
  environment?: AnalyticsEnvironment;
  windowPreset?: AnalyticsWindowPreset;
  startIso?: string;
  endIso?: string;
  asOfWatermarkIso?: string;
  siteId?: CanonicalAnalyticsSiteId | "all";
  contentFamily?: ContentFamily | "all";
  bypassCache?: boolean;
}): Promise<NetworkAndTripAnalyticsReport> {
  const environment: AnalyticsEnvironment = options?.environment || "preview";
  const windowPreset: AnalyticsWindowPreset = options?.windowPreset || "28d";
  const siteFilter = options?.siteId || "all";
  const familyFilter = options?.contentFamily || "all";

  const nowIso = new Date().toISOString();
  const effectiveEndIso = options?.endIso || options?.asOfWatermarkIso || nowIso;
  const endMs = Date.parse(effectiveEndIso);
  const hours = WINDOW_HOURS[windowPreset] || 28 * 24;
  const effectiveStartIso =
    options?.startIso || new Date(endMs - hours * 3600_000).toISOString();

  const snapshotFallbackKey = `${environment}|${windowPreset}|${siteFilter}|${familyFilter}`;
  const activeBackendInfo = describeActiveAnalyticsBackend();

  try {
    const { result: builtReport, dbTelemetry } = await withAnalyticsDbTelemetry(async () => {
      const exec = await ensureAnalyticsStoreAvailable();
      const runtimeControls = await getAnalyticsRuntimeControls();
      const watermark = await readAnalyticsWatermarkState(exec);
      const counters = await readAnalyticsHealthCounters(exec);

      const upperBoundIso = options?.endIso
        ? effectiveEndIso
        : options?.asOfWatermarkIso || watermark.processedThroughIso || effectiveEndIso;
      const lowerBoundIso = options?.startIso
        ? effectiveStartIso
        : new Date(Date.parse(upperBoundIso) - hours * 3600_000).toISOString();

      const exactCacheKey = `browser-id-depth-v1|${snapshotFallbackKey}|${lowerBoundIso}|${upperBoundIso}|${watermark.lastQueueSeq}`;
      if (!options?.bypassCache) {
        const cacheRes = await exec.query<{ payload_json: unknown }>(
          "SELECT payload_json FROM dcc_analytics_report_cache WHERE cache_key = $1",
          [exactCacheKey],
        );
        const cachedParsed = normalizeSqlJson<NetworkAndTripAnalyticsReport | null>(
          cacheRes.rows[0]?.payload_json,
          null,
        );
        if (cachedParsed && cachedParsed.schemaVersion) {
          return {
            ...cachedParsed,
            generatedAt: nowIso,
            runtimeControls,
            telemetryHealth: cachedParsed.telemetryHealth
              ? {
                  ...cachedParsed.telemetryHealth,
                  killSwitchActive: runtimeControls.killSwitchActive,
                  killSwitchSource: runtimeControls.killSwitchSource,
                }
              : null,
            backendInfo: {
              backend: exec.backend,
              databaseName: exec.databaseName,
              cacheHit: true,
            },
          } satisfies NetworkAndTripAnalyticsReport;
        }
      }

      // Aggregate from exact event timestamps. Whole-hour rollups included
      // both boundary hours even when the displayed window starts/ends mid-hour.
      const rollupParams: unknown[] = [environment, lowerBoundIso, upperBoundIso];
      let rollupWhere =
        "environment = $1 AND occurred_at >= $2::timestamptz AND occurred_at <= $3::timestamptz";
      if (siteFilter !== "all") {
        rollupParams.push(siteFilter);
        rollupWhere += ` AND site_id = $${rollupParams.length}`;
      }
      if (familyFilter !== "all") {
        rollupParams.push(familyFilter);
        rollupWhere += ` AND content_family = $${rollupParams.length}`;
      }

      const rollupRes = await exec.query<{
        site_id: string;
        content_family: string;
        traffic_class: string;
        pv: string | number | null;
        ge: string | number | null;
        pr: string | number | null;
        xsc: string | number | null;
        xsa: string | number | null;
        ctxa: string | number | null;
        sh: string | number | null;
        uo: string | number | null;
      }>(
        `SELECT site_id, content_family, traffic_class,
                SUM(CASE WHEN event_type = 'page_viewed' THEN 1 ELSE 0 END) AS pv,
                SUM(CASE WHEN event_type = 'guide_engaged' THEN 1 ELSE 0 END) AS ge,
                SUM(CASE WHEN event_type = 'printable_view_opened' THEN 1 ELSE 0 END) AS pr,
                SUM(CASE WHEN event_type = 'cross_site_handoff_clicked' THEN 1 ELSE 0 END) AS xsc,
                SUM(CASE WHEN event_type = 'cross_site_handoff_arrived' THEN 1 ELSE 0 END) AS xsa,
                SUM(CASE WHEN event_type = 'cross_site_handoff_arrived' AND continuity_tier = 'verified_dcc_ctx' THEN 1 ELSE 0 END) AS ctxa,
                SUM(CASE WHEN event_type = 'seller_handoff_initiated' THEN 1 ELSE 0 END) AS sh,
                SUM(CASE WHEN event_type = 'seller_handoff_initiated' AND reporting_subject_id IS NULL THEN 1 ELSE 0 END) AS uo
         FROM dcc_analytics_events
         WHERE ${rollupWhere}
         GROUP BY site_id, content_family, traffic_class`,
        rollupParams,
      );
      const rollupRows = rollupRes.rows;

      // All three acquisition metrics use the same exact event window. Daily
      // rollups span whole UTC days, which overstated browser/session counts
      // for a rolling 24-hour window and could exceed its pageview total.
      const pageviewParams: unknown[] = [environment, lowerBoundIso, upperBoundIso];
      let pageviewWhere =
        "e.environment = $1 AND e.occurred_at >= $2::timestamptz AND e.occurred_at <= $3::timestamptz AND e.event_type = 'page_viewed' AND e.traffic_class = 'observed_browser'";
      if (siteFilter !== "all") {
        pageviewParams.push(siteFilter);
        pageviewWhere += ` AND e.site_id = $${pageviewParams.length}`;
      }
      if (familyFilter !== "all") {
        pageviewParams.push(familyFilter);
        pageviewWhere += ` AND e.content_family = $${pageviewParams.length}`;
      }
      const distinctSubjectRes = await exec.query<{
        observed_browsers: string | number | null;
        returning_browsers: string | number | null;
        pageviews: string | number | null;
      }>(
        `SELECT COUNT(DISTINCT e.site_id || ':' || e.reporting_subject_id) AS observed_browsers,
                COUNT(DISTINCT CASE WHEN a.first_pageview_at::timestamptz < $2::timestamptz THEN e.site_id || ':' || e.reporting_subject_id END) AS returning_browsers,
                COUNT(*) AS pageviews
         FROM dcc_analytics_events e
         LEFT JOIN dcc_analytics_subject_activity a ON a.environment = e.environment
           AND a.site_id = e.site_id AND a.subject_id = e.reporting_subject_id
         WHERE ${pageviewWhere}`, pageviewParams,
      );
      const distinctSubjectRow = distinctSubjectRes.rows[0];
      // A one-pageview ID can be a person or a stateless crawler. Expose the
      // measured distribution without treating either bucket as verified humans.
      const subjectDepthRes = await exec.query<{
        single_view_ids: string | number | null;
        multi_view_ids: string | number | null;
        cp_planner_one_view_ids: string | number | null;
      }>(
        `SELECT
           COALESCE(SUM(CASE WHEN depth.pageviews = 1 THEN 1 ELSE 0 END), 0) AS single_view_ids,
           COALESCE(SUM(CASE WHEN depth.pageviews > 1 THEN 1 ELSE 0 END), 0) AS multi_view_ids,
           COALESCE(SUM(CASE WHEN depth.pageviews = 1 AND depth.cp_planner_views = 1 THEN 1 ELSE 0 END), 0) AS cp_planner_one_view_ids
         FROM (
           SELECT e.site_id, e.reporting_subject_id, COUNT(*) AS pageviews,
                  SUM(CASE WHEN e.site_id = 'cruisepromenade'
                    AND (e.canonical_path = '/planner' OR e.canonical_path LIKE '/planner/%')
                    THEN 1 ELSE 0 END) AS cp_planner_views
           FROM dcc_analytics_events e
           WHERE ${pageviewWhere} AND e.reporting_subject_id IS NOT NULL
           GROUP BY e.site_id, e.reporting_subject_id
         ) depth`,
        pageviewParams,
      );
      const subjectDepth = subjectDepthRes.rows[0];
      const distinctSessionRes = await exec.query<{ sessions_cnt: string | number | null }>(
        `SELECT COUNT(DISTINCT e.site_id || ':' || e.session_key) AS sessions_cnt
         FROM dcc_analytics_events e WHERE ${pageviewWhere}`, pageviewParams,
      );
      const distinctSessionRow = distinctSessionRes.rows[0];
      const perSiteSubjectsRes = await exec.query<{
        site_id: string; browsers_cnt: string | number | null;
        returning_cnt: string | number | null; pageviews_cnt: string | number | null;
      }>(
        `SELECT e.site_id, COUNT(DISTINCT e.reporting_subject_id) AS browsers_cnt,
                COUNT(DISTINCT CASE WHEN a.first_pageview_at::timestamptz < $2::timestamptz THEN e.reporting_subject_id END) AS returning_cnt,
                COUNT(*) AS pageviews_cnt
         FROM dcc_analytics_events e
         LEFT JOIN dcc_analytics_subject_activity a ON a.environment = e.environment
           AND a.site_id = e.site_id AND a.subject_id = e.reporting_subject_id
         WHERE ${pageviewWhere} GROUP BY e.site_id`, pageviewParams,
      );
      const perSiteSubjects = perSiteSubjectsRes.rows;
      const perSiteSessionsRes = await exec.query<{
        site_id: string; sessions_cnt: string | number | null;
      }>(
        `SELECT e.site_id, COUNT(DISTINCT e.session_key) AS sessions_cnt
         FROM dcc_analytics_events e WHERE ${pageviewWhere} GROUP BY e.site_id`, pageviewParams,
      );
      const perSiteSessions = perSiteSessionsRes.rows;
      const perFamilySubjectsRes = await exec.query<{
        content_family: string; browsers_cnt: string | number | null;
        pageviews_cnt: string | number | null;
      }>(
        `SELECT e.content_family, COUNT(DISTINCT e.site_id || ':' || e.reporting_subject_id) AS browsers_cnt,
                COUNT(*) AS pageviews_cnt
         FROM dcc_analytics_events e WHERE ${pageviewWhere} GROUP BY e.content_family`, pageviewParams,
      );
      const perFamilySubjects = perFamilySubjectsRes.rows;
      const topLandingRes = await exec.query<{
        value: string; pageviews: string | number | null; sessions: string | number | null;
      }>(
        `SELECT e.landing_path AS value, COUNT(*) AS pageviews,
                COUNT(DISTINCT e.site_id || ':' || e.session_key) AS sessions
         FROM dcc_analytics_events e WHERE ${pageviewWhere}
         GROUP BY e.landing_path ORDER BY pageviews DESC, value ASC LIMIT 12`, pageviewParams,
      );
      const topLandingRows = topLandingRes.rows;
      const topSourceRes = await exec.query<{
        value: string; pageviews: string | number | null; sessions: string | number | null;
      }>(
        `SELECT COALESCE(e.utm_source, e.referrer_domain, 'direct_or_none') AS value,
                COUNT(*) AS pageviews, COUNT(DISTINCT e.site_id || ':' || e.session_key) AS sessions
         FROM dcc_analytics_events e WHERE ${pageviewWhere}
         GROUP BY COALESCE(e.utm_source, e.referrer_domain, 'direct_or_none')
         ORDER BY pageviews DESC, value ASC LIMIT 12`, pageviewParams,
      );
      const topSourceRows = topSourceRes.rows;

      // 3. Cross-site transitions within exact [lowerBoundIso, upperBoundIso]
      const transParams: unknown[] = [environment, lowerBoundIso, upperBoundIso];
      let transWhere =
        "environment = $1 AND occurred_at >= $2::timestamptz AND occurred_at <= $3::timestamptz AND event_type = 'cross_site_handoff_clicked' AND traffic_class = 'observed_browser'";
      if (siteFilter !== "all") {
        transParams.push(siteFilter, siteFilter);
        transWhere += ` AND (site_id = $${transParams.length - 1} OR target_site_id = $${transParams.length})`;
      }
      const transitionRes = await exec.query<{
        from_site: string;
        to_site: string;
        continuity_tier: string;
        cnt: string | number | null;
      }>(
        `SELECT site_id AS from_site,
                COALESCE(target_site_id, 'unspecified') AS to_site,
                continuity_tier,
                COUNT(*) AS cnt
         FROM dcc_analytics_events
         WHERE ${transWhere}
         GROUP BY site_id, COALESCE(target_site_id, 'unspecified'), continuity_tier
         ORDER BY cnt DESC
         LIMIT 20`,
        transParams,
      );
      const transitionRows = transitionRes.rows;

      // 4. Verified booking/financial outcomes per site within [lowerBoundIso, upperBoundIso]
      const outcomeRes = await exec.query<{
        site_id: string;
        outcome_type: string | null;
        cnt: string | number | null;
        gross_sum: string | number | null;
        comm_sum: string | number | null;
      }>(
        `SELECT site_id, outcome_type,
                COUNT(*) AS cnt,
                COALESCE(SUM(gross_amount_usd), 0) AS gross_sum,
                COALESCE(SUM(commission_amount_usd), 0) AS comm_sum
         FROM dcc_analytics_events
         WHERE environment = $1 AND occurred_at >= $2::timestamptz AND occurred_at <= $3::timestamptz
           AND event_type = 'booking_outcome_confirmed'
           AND traffic_class NOT IN ('qa_or_synthetic', 'known_bot', 'suspected_automation', 'internal')
         GROUP BY site_id, outcome_type`,
        [environment, lowerBoundIso, upperBoundIso],
      );
      const outcomeRows = outcomeRes.rows;

      // 5. Traffic hygiene & per-site runtime collection state within [lowerBoundIso, upperBoundIso]
      const hygieneParams: unknown[] = [environment, lowerBoundIso, upperBoundIso];
      let hygieneWhere =
        "environment = $1 AND occurred_at >= $2::timestamptz AND occurred_at <= $3::timestamptz";
      if (siteFilter !== "all") {
        hygieneParams.push(siteFilter);
        hygieneWhere += ` AND site_id = $${hygieneParams.length}`;
      }
      if (familyFilter !== "all") {
        hygieneParams.push(familyFilter);
        hygieneWhere += ` AND content_family = $${hygieneParams.length}`;
      }
      const hygieneRes = await exec.query<{
        site_id: string;
        traffic_class: string;
        cnt: string | number | null;
        last_at: string | Date | null;
      }>(
        `SELECT site_id, traffic_class, COUNT(*) AS cnt, MAX(occurred_at) AS last_at
         FROM dcc_analytics_events
         WHERE ${hygieneWhere}
         GROUP BY site_id, traffic_class`,
        hygieneParams,
      );
      const hygieneRows = hygieneRes.rows;
      const perSiteHygiene = new Map<
        string,
        {
          realEvents: number;
          qaEvents: number;
          botEvents: number;
          autoEvents: number;
          lastRealAt: string | null;
          lastSyntheticAt: string | null;
        }
      >();
      const syntheticBySite: Record<string, number> = {};
      for (const hr of hygieneRows) {
        const sId = String(hr.site_id);
        const tc = String(hr.traffic_class);
        const c = Number(hr.cnt || 0);
        const iso =
          hr.last_at instanceof Date
            ? hr.last_at.toISOString()
            : hr.last_at
              ? String(hr.last_at)
              : null;
        const cur = perSiteHygiene.get(sId) || {
          realEvents: 0,
          qaEvents: 0,
          botEvents: 0,
          autoEvents: 0,
          lastRealAt: null,
          lastSyntheticAt: null,
        };
        if (tc === "observed_browser" || tc === "unclassified_non_pageview") {
          cur.realEvents += c;
          if (iso && (!cur.lastRealAt || iso > cur.lastRealAt)) cur.lastRealAt = iso;
        } else if (tc === "qa_or_synthetic") {
          cur.qaEvents += c;
          syntheticBySite[sId] = (syntheticBySite[sId] || 0) + c;
          if (iso && (!cur.lastSyntheticAt || iso > cur.lastSyntheticAt)) cur.lastSyntheticAt = iso;
        } else if (tc === "known_bot") {
          cur.botEvents += c;
        } else if (tc === "suspected_automation") {
          cur.autoEvents += c;
        }
        perSiteHygiene.set(sId, cur);
      }

      // Aggregate rollup structures
      const siteSubjMap = new Map<string, { browsers: number; returning: number }>();
      for (const r of perSiteSubjects) {
        siteSubjMap.set(String(r.site_id), {
          browsers: Number(r.browsers_cnt || 0),
          returning: Number(r.returning_cnt || 0),
        });
      }
      const siteSessMap = new Map<string, number>();
      for (const r of perSiteSessions) {
        siteSessMap.set(String(r.site_id), Number(r.sessions_cnt || 0));
      }

      const familyBrowsersMap = new Map<string, number>();
      for (const r of perFamilySubjects) {
        familyBrowsersMap.set(String(r.content_family), Number(r.browsers_cnt || 0));
      }

      let totalObservedPageviews = 0;
      let totalGuideEngagements = 0;
      let totalPrintableOpens = 0;
      let totalCrossSiteClicks = 0;
      let totalCrossSiteArrivals = 0;
      let totalVerifiedCtxArrivals = 0;
      let totalSellerHandoffs = 0;

      const perSiteRollup = new Map<
        string,
        {
          pv: number;
          ge: number;
          pr: number;
          xsc: number;
          xsa: number;
          ctxa: number;
          sh: number;
          uo: number;
          bots: number;
          qa: number;
          auto: number;
        }
      >();

      const perFamilyRollup = new Map<
        string,
        { pv: number; ge: number; pr: number; sh: number }
      >();

      for (const r of rollupRows) {
        const sId = String(r.site_id);
        const cf = String(r.content_family);
        const tc = String(r.traffic_class);
        const pv = Number(r.pv || 0);
        const ge = Number(r.ge || 0);
        const pr = Number(r.pr || 0);
        const xsc = Number(r.xsc || 0);
        const xsa = Number(r.xsa || 0);
        const ctxa = Number(r.ctxa || 0);
        const sh = Number(r.sh || 0);
        const uo = Number(r.uo || 0);

        let sAcc = perSiteRollup.get(sId);
        if (!sAcc) {
          sAcc = { pv: 0, ge: 0, pr: 0, xsc: 0, xsa: 0, ctxa: 0, sh: 0, uo: 0, bots: 0, qa: 0, auto: 0 };
          perSiteRollup.set(sId, sAcc);
        }

        if (tc === "observed_browser") {
          sAcc.pv += pv;
          sAcc.ge += ge;
          sAcc.pr += pr;
          sAcc.xsc += xsc;
          sAcc.xsa += xsa;
          sAcc.ctxa += ctxa;
          sAcc.sh += sh;

          totalObservedPageviews += pv;
          totalGuideEngagements += ge;
          totalPrintableOpens += pr;
          totalCrossSiteClicks += xsc;
          totalCrossSiteArrivals += xsa;
          totalVerifiedCtxArrivals += ctxa;
          totalSellerHandoffs += sh;

          const fAcc = perFamilyRollup.get(cf) || { pv: 0, ge: 0, pr: 0, sh: 0 };
          fAcc.pv += pv;
          fAcc.ge += ge;
          fAcc.pr += pr;
          fAcc.sh += sh;
          perFamilyRollup.set(cf, fAcc);
        } else if (tc === "unclassified_non_pageview") {
          sAcc.uo += uo || sh;
          sAcc.sh += sh;
          totalSellerHandoffs += sh;
        } else if (tc === "known_bot") {
          sAcc.bots += pv + ge + sh;
        } else if (tc === "qa_or_synthetic") {
          sAcc.qa += pv + ge + sh;
        } else if (tc === "suspected_automation") {
          sAcc.auto += pv + ge + sh;
        }
      }

      // Use exact pageview counts beside exact browser/session counts in every
      // report slice; other interaction totals still come from compact rollups.
      totalObservedPageviews = Number(distinctSubjectRow?.pageviews || 0);
      for (const r of perSiteSubjects) {
        const bucket = perSiteRollup.get(String(r.site_id));
        if (bucket) bucket.pv = Number(r.pageviews_cnt || 0);
      }
      for (const r of perFamilySubjects) {
        const bucket = perFamilyRollup.get(String(r.content_family));
        if (bucket) bucket.pv = Number(r.pageviews_cnt || 0);
      }

      const siteOutcomesMap = new Map<
        string,
        { confirmedCnt: number; morGrossUsd: number; commUsd: number }
      >();
      let totalMorGrossUsd = 0;
      let totalVerifiedCommUsd = 0;
      let hasAnyMorFeedRecord = false;
      let hasAnyCommFeedRecord = false;

      for (const o of outcomeRows) {
        const sId = String(o.site_id);
        const oType = String(o.outcome_type || "");
        if (oType === "cancelled" || oType === "refunded") continue;
        const cur = siteOutcomesMap.get(sId) || { confirmedCnt: 0, morGrossUsd: 0, commUsd: 0 };
        const cnt = Number(o.cnt || 0);
        const gross = Number(o.gross_sum || 0);
        const comm = Number(o.comm_sum || 0);
        cur.confirmedCnt += cnt;

        const regEntry = ANALYTICS_SITE_REGISTRY.find((e) => e.siteId === sId);
        if (regEntry?.commercialModel === "owned_direct_checkout") {
          cur.morGrossUsd += gross;
          totalMorGrossUsd += gross;
          hasAnyMorFeedRecord = true;
        } else {
          cur.commUsd += comm;
          totalVerifiedCommUsd += comm;
          hasAnyCommFeedRecord = true;
        }
        siteOutcomesMap.set(sId, cur);
      }

      const collectingRealTrafficSites: string[] = [];
      const syntheticVerificationOnlySites: string[] = [];
      const wiredAwaitingTrafficSites: string[] = [];
      const serverHandoffOnlySites: string[] = [];
      const registeredCatalogOnlyNotCollectingSites: string[] = [];
      const containedRetiredOrExcludedSites: string[] = [];

      const sitesReport: SiteTrafficAndCoverageRow[] = ANALYTICS_SITE_REGISTRY.filter(
        (entry) => siteFilter === "all" || entry.siteId === siteFilter,
      ).map((entry) => {
        const isCommunityExcluded = entry.instrumentationTier === "excluded_community";
        const isContainedExternal = entry.instrumentationTier === "excluded_external";
        const isRetired = entry.instrumentationTier === "retired_or_redirected";
        const sAcc = perSiteRollup.get(entry.siteId);
        const sHyg = perSiteHygiene.get(entry.siteId);
        const sSubj = siteSubjMap.get(entry.siteId);
        const sSess = siteSessMap.get(entry.siteId) || 0;
        const out = siteOutcomesMap.get(entry.siteId);

        const hasObservedPv = Boolean(sAcc && sAcc.pv > 0);
        const isPageviewDataUnavailable =
          isContainedExternal || isRetired || (!entry.pageviewCollectionWired && !hasObservedPv);

        const realEventsCnt = (sHyg?.realEvents ?? 0) + (out?.confirmedCnt ?? 0);
        const qaEventsCnt = sHyg?.qaEvents ?? sAcc?.qa ?? 0;

        let collectionRuntimeState: SiteCollectionRuntimeState;
        if (isCommunityExcluded) {
          collectionRuntimeState = "excluded_community";
          containedRetiredOrExcludedSites.push(entry.siteId);
        } else if (isContainedExternal || isRetired) {
          collectionRuntimeState = "contained_or_retired";
          containedRetiredOrExcludedSites.push(entry.siteId);
        } else if (entry.pageviewCollectionWired) {
          if (realEventsCnt > 0) {
            collectionRuntimeState = "collecting_real_traffic";
            collectingRealTrafficSites.push(entry.siteId);
          } else if (qaEventsCnt > 0) {
            collectionRuntimeState = "synthetic_verification_only";
            syntheticVerificationOnlySites.push(entry.siteId);
          } else {
            collectionRuntimeState = "wired_awaiting_traffic";
            wiredAwaitingTrafficSites.push(entry.siteId);
          }
        } else if (entry.instrumentationTier === "v2_server_adapter") {
          collectionRuntimeState = "handoff_adapter_only";
          serverHandoffOnlySites.push(entry.siteId);
        } else {
          collectionRuntimeState = "registered_only_not_collecting";
          registeredCatalogOnlyNotCollectingSites.push(entry.siteId);
        }

        // Missing provider outcome feeds display as "unavailable", NEVER silently 0!
        let confirmedBookings: number | "unavailable" = "unavailable";
        if (out && out.confirmedCnt > 0) {
          confirmedBookings = out.confirmedCnt;
        }

        let ownedMorGrossSalesUsd: number | "unavailable" | "not_applicable" = "not_applicable";
        if (entry.commercialModel === "owned_direct_checkout") {
          ownedMorGrossSalesUsd = out ? Number(out.morGrossUsd.toFixed(2)) : "unavailable";
        }

        let verifiedCommissionsUsd: number | "unavailable" | "not_applicable" = "not_applicable";
        if (
          entry.commercialModel !== "owned_direct_checkout" &&
          !isCommunityExcluded &&
          !isContainedExternal &&
          entry.commercialModel !== "retired_or_redirected"
        ) {
          verifiedCommissionsUsd = out ? Number(out.commUsd.toFixed(2)) : "unavailable";
        }

        return {
          siteId: entry.siteId,
          displayName: entry.displayName,
          canonicalDomain: entry.canonicalDomain,
          residency: entry.residency,
          redirectAndSourceNotes: entry.redirectAndSourceNotes,
          externalSourcesStatus: entry.externalSourcesStatus,
          inActive12Portfolio: entry.inActive12Portfolio,
          initialRolloutTarget: Boolean(entry.initialRolloutTarget),
          instrumentationTier: entry.instrumentationTier,
          pageviewCollectionWired: entry.pageviewCollectionWired,
          collectionRuntimeState,
          lastRealEventAt: sHyg?.lastRealAt || null,
          lastSyntheticEventAt: sHyg?.lastSyntheticAt || null,
          commercialModel: entry.commercialModel,
          outcomeFeedMode: entry.outcomeFeedMode,
          observedBrowsers: isCommunityExcluded
            ? "excluded"
            : isPageviewDataUnavailable
              ? "unavailable"
              : (sSubj?.browsers ?? 0),
          sessions: isCommunityExcluded
            ? "excluded"
            : isPageviewDataUnavailable
              ? "unavailable"
              : sSess,
          returningBrowsers: isCommunityExcluded
            ? "excluded"
            : isPageviewDataUnavailable
              ? "unavailable"
              : (sSubj?.returning ?? 0),
          pageviews: isCommunityExcluded
            ? "excluded"
            : isPageviewDataUnavailable
              ? "unavailable"
              : (sAcc?.pv ?? 0),
          guideEngagements:
            isContainedExternal || (!entry.pageviewCollectionWired && !(sAcc && sAcc.ge > 0))
              ? "unavailable"
              : (sAcc?.ge ?? 0),
          printableOpens:
            isContainedExternal || (!entry.pageviewCollectionWired && !(sAcc && sAcc.pr > 0))
              ? "unavailable"
              : (sAcc?.pr ?? 0),
          crossSiteClicks: sAcc?.xsc ?? 0,
          crossSiteArrivals: sAcc?.xsa ?? 0,
          verifiedCtxArrivals: sAcc?.ctxa ?? 0,
          sellerHandoffs: sAcc?.sh ?? 0,
          knownBotEventsExcluded: sHyg?.botEvents ?? sAcc?.bots ?? 0,
          qaEventsExcluded: qaEventsCnt,
          suspectedAutomationExcluded: sHyg?.autoEvents ?? sAcc?.auto ?? 0,
          unidentifiedOutboundRequests: sAcc?.uo ?? 0,
          confirmedBookings,
          ownedMorGrossSalesUsd,
          verifiedCommissionsUsd,
        };
      });

      // 6. Layer 2 — Trip Lifecycle Cohort Aggregation
      const tripParams: unknown[] = [environment, lowerBoundIso, upperBoundIso];
      let tripWhere = "environment = $1 AND updated_at >= $2 AND updated_at <= $3";
      if (siteFilter !== "all") {
        tripParams.push(siteFilter);
        tripWhere += ` AND origin_site_id = $${tripParams.length}`;
      }
      if (familyFilter !== "all") {
        tripParams.push(familyFilter);
        tripWhere += ` AND content_family = $${tripParams.length}`;
      }

      const tripRes = await exec.query<Record<string, unknown>>(
        `SELECT * FROM dcc_analytics_trip_state WHERE ${tripWhere}`,
        tripParams,
      );
      const tripRows = tripRes.rows;

      const linkedCountRes = await exec.query<{ cnt: string | number | null }>(
        "SELECT COUNT(*) AS cnt FROM dcc_analytics_trip_links WHERE environment = $1 AND linked_at >= $2::timestamptz AND linked_at <= $3::timestamptz",
        [environment, lowerBoundIso, upperBoundIso],
      );
      const linkedCountRow = linkedCountRes.rows[0];

      const upperBoundMs = Date.parse(upperBoundIso);
      const d1CutoffMs = upperBoundMs - 24 * 3600_000;
      const d7CutoffMs = upperBoundMs - 7 * 24 * 3600_000;

      let s1Entry = 0;
      let s2Draft = 0;
      let s3Persisted = 0;
      let s4Customized = 0;
      let s5Staged = 0;
      let s5Reviewed = 0;
      let s5Applied = 0;
      let s5Rejected = 0;
      let s5Amended = 0;
      let s5Cancelled = 0;
      let s6Invited = 0;
      let s7CompOpened = 0;
      let s7CompContrib = 0;
      let s7TotalDistinctCompanions = 0;
      let s7MergesCount = 0;
      let s8LaterSession = 0;
      let s9SellerHandoff = 0;
      let s10ConfirmedOutcome = 0;

      let d1Eligible = 0;
      let d1Returned = 0;
      let d7Eligible = 0;
      let d7Returned = 0;

      const byExtractionChannel: Record<string, number> = {};
      const byReviewState: Record<string, number> = {};
      const byProviderVerification: Record<string, number> = {};
      const byDccDayMatchMethod: Record<string, number> = {};

      const journeyMap = new Map<
        string,
        {
          journeyKind: string;
          tripsTotal: number;
          persisted: number;
          customized: number;
          companionContributed: number;
          sellerHandoffs: number;
        }
      >();

      for (const tr of tripRows) {
        if (tr.entry_selected_at) s1Entry += 1;
        if (tr.draft_started_at || tr.persisted_at) s2Draft += 1;
        if (tr.persisted_at) {
          s3Persisted += 1;
          const pMs = Date.parse(String(tr.persisted_at));
          if (Number.isFinite(pMs) && pMs <= d1CutoffMs) {
            d1Eligible += 1;
            if (tr.later_day_d1_return_at) d1Returned += 1;
          }
          if (Number.isFinite(pMs) && pMs <= d7CutoffMs) {
            d7Eligible += 1;
            if (tr.later_day_d7_return_at) d7Returned += 1;
          }
        }
        if (tr.first_customized_at) s4Customized += 1;
        if (tr.confirmation_staged_at) s5Staged += 1;
        if (tr.confirmation_reviewed_at) s5Reviewed += 1;
        if (tr.confirmation_applied_at) s5Applied += 1;
        if (tr.confirmation_rejected_at) s5Rejected += 1;
        if (tr.confirmation_amended_at) s5Amended += 1;
        if (tr.confirmation_cancelled_at) s5Cancelled += 1;
        if (tr.invitation_shared_at) s6Invited += 1;
        if (tr.companion_first_opened_at) s7CompOpened += 1;
        if (tr.companion_first_contributed_at) s7CompContrib += 1;
        if (tr.later_session_return_at) s8LaterSession += 1;
        if (tr.seller_handoff_at) s9SellerHandoff += 1;
        if (
          tr.confirmed_outcome_at &&
          tr.confirmed_outcome_type !== "cancelled" &&
          tr.confirmed_outcome_type !== "refunded"
        ) {
          s10ConfirmedOutcome += 1;
        }

        const compArr = normalizeSqlJson<string[]>(tr.companion_keys_json, []);
        s7TotalDistinctCompanions += compArr.length;

        const mergeObj = normalizeSqlJson<Record<string, string>>(
          tr.merged_companion_map_json,
          {},
        );
        s7MergesCount += Object.keys(mergeObj).length;

        const prov = normalizeSqlJson<ConfirmationProvenance | null>(
          tr.latest_confirmation_provenance_json,
          null,
        );
        if (prov) {
          if (prov.extraction?.channel) {
            byExtractionChannel[prov.extraction.channel] =
              (byExtractionChannel[prov.extraction.channel] || 0) + 1;
          }
          if (prov.travelerReview?.state) {
            byReviewState[prov.travelerReview.state] =
              (byReviewState[prov.travelerReview.state] || 0) + 1;
          }
          if (prov.providerVerification?.state) {
            byProviderVerification[prov.providerVerification.state] =
              (byProviderVerification[prov.providerVerification.state] || 0) + 1;
          }
          if (prov.dccInference?.dayMatchMethod) {
            byDccDayMatchMethod[prov.dccInference.dayMatchMethod] =
              (byDccDayMatchMethod[prov.dccInference.dayMatchMethod] || 0) + 1;
          }
        }

        const jk = String(tr.journey_kind || "cruise_sailing");
        const jBucket = journeyMap.get(jk) || {
          journeyKind: jk,
          tripsTotal: 0,
          persisted: 0,
          customized: 0,
          companionContributed: 0,
          sellerHandoffs: 0,
        };
        jBucket.tripsTotal += 1;
        if (tr.persisted_at) jBucket.persisted += 1;
        if (tr.first_customized_at) jBucket.customized += 1;
        if (tr.companion_first_contributed_at) jBucket.companionContributed += 1;
        jBucket.sellerHandoffs += Number(tr.seller_handoff_count || 0);
        journeyMap.set(jk, jBucket);
      }

      const hygieneMap = new Map<string, number>();
      for (const h of hygieneRows) {
        const tc = String(h.traffic_class);
        hygieneMap.set(tc, (hygieneMap.get(tc) || 0) + Number(h.cnt || 0));
      }

      const lagSeconds = watermark.lastWorkerSuccessAt
        ? Math.max(0, Math.round((Date.now() - Date.parse(watermark.lastWorkerSuccessAt)) / 1000))
        : null;

      const report: NetworkAndTripAnalyticsReport = {
        ok: true,
        dataStatus: "live_verified",
        staleOrUnavailableReason: null,
        snapshotCapturedAt: nowIso,
        generatedAt: nowIso,
        schemaVersion: ANALYTICS_SCHEMA_VERSION,
        metricDictionaryVersion: METRIC_DICTIONARY_VERSION,
        environment,
        timezone: "UTC",
        backendInfo: {
          backend: exec.backend,
          databaseName: exec.databaseName,
          cacheHit: false,
        },
        runtimeControls,
        filters: {
          windowPreset,
          startIso: lowerBoundIso,
          endIso: upperBoundIso,
          siteId: siteFilter,
          contentFamily: familyFilter,
        },
        telemetryHealth: {
          watermark,
          counters,
          ingestionLagSeconds: lagSeconds,
          killSwitchActive: runtimeControls.killSwitchActive,
          killSwitchSource: runtimeControls.killSwitchSource,
        },
        trafficSummary: {
          observedBrowsers: Number(distinctSubjectRow?.observed_browsers || 0),
          sessions: Number(distinctSessionRow?.sessions_cnt || 0),
          returningBrowsers: Number(distinctSubjectRow?.returning_browsers || 0),
          singlePageviewBrowserIds: Number(subjectDepth?.single_view_ids || 0),
          multiPageviewBrowserIds: Number(subjectDepth?.multi_view_ids || 0),
          singlePageviewCpPlannerIds: Number(subjectDepth?.cp_planner_one_view_ids || 0),
          pageviews: totalObservedPageviews,
          guideEngagements: totalGuideEngagements,
          printableOpens: totalPrintableOpens,
          crossSiteHandoffClicks: totalCrossSiteClicks,
          crossSiteHandoffArrivals: totalCrossSiteArrivals,
          verifiedDccCtxArrivals: totalVerifiedCtxArrivals,
          sellerHandoffsTotal: totalSellerHandoffs,
          honestyDisclosures: [
            "Pageview-backed browser IDs (`rsub_v1_*`) are first-party pseudonymous IDs, not verified people. Stateless crawlers can generate a new ID per visit; one-view and multi-view counts are behavioral diagnostics, not human counts.",
            "Cross-domain continuity is reported only where supported via redeemed `dcc_ctx_*` tokens or explicit handoff parameters; unrelated cross-domain or cross-device sessions are never merged.",
            "Uninstrumented properties and inaccessible external sources (GA4, GSC, Vercel Web Analytics, contained WTA) display as `unavailable`, never zero.",
          ],
        },
        trafficHygieneAndExclusions: {
          observedBrowserEvents: hygieneMap.get("observed_browser") || 0,
          knownBotEvents: hygieneMap.get("known_bot") || 0,
          suspectedAutomationAndPrefetchEvents: hygieneMap.get("suspected_automation") || 0,
          qaOrSyntheticEvents: hygieneMap.get("qa_or_synthetic") || 0,
          internalOperatorEvents: hygieneMap.get("internal") || 0,
          unclassifiedClickOnlyRequests: hygieneMap.get("unclassified_non_pageview") || 0,
        },
        syntheticVerificationSummary: {
          totalSyntheticVerificationEvents: hygieneMap.get("qa_or_synthetic") || 0,
          bySite: syntheticBySite,
          excludedFromHumanKpisAndFunnel: true,
        },
        portfolioCollectionSummary: {
          collectingRealTrafficSites,
          syntheticVerificationOnlySites,
          wiredAwaitingTrafficSites,
          serverHandoffOnlySites,
          registeredCatalogOnlyNotCollectingSites,
          containedRetiredOrExcludedSites,
        },
        topLandingPages: topLandingRows.map((r) => ({
          value: String(r.value),
          pageviews: Number(r.pageviews || 0),
          sessions: Number(r.sessions || 0),
        })),
        topSourcesAndCampaigns: topSourceRows.map((r) => ({
          value: String(r.value),
          pageviews: Number(r.pageviews || 0),
          sessions: Number(r.sessions || 0),
        })),
        byContentFamily: Array.from(perFamilyRollup.entries())
          .map(([cf, vals]) => ({
            contentFamily: cf,
            pageviews: vals.pv,
            observedBrowsers: familyBrowsersMap.get(cf) || 0,
            guideEngagements: vals.ge,
            printableOpens: vals.pr,
            sellerHandoffs: vals.sh,
          }))
          .sort((a, b) => b.pageviews - a.pageviews),
        crossSiteTransitions: transitionRows.map((r) => ({
          fromSiteId: String(r.from_site),
          toSiteId: String(r.to_site),
          continuityTier: String(r.continuity_tier),
          transitionCount: Number(r.cnt || 0),
        })),
        tripLifecycle: {
          totalDistinctTripUnitsInWindow: tripRows.length,
          draftToPersistedLinkedCount: Number(linkedCountRow?.cnt || 0),
          milestones: {
            stage1_planningEntrySelected: s1Entry,
            stage2_draftStarted: s2Draft,
            stage3_tripPersisted: s3Persisted,
            stage4_firstMeaningfulCustomization: s4Customized,
            stage5_confirmationStaged: s5Staged,
            stage5_confirmationReviewed: s5Reviewed,
            stage5_confirmationApplied: s5Applied,
            stage5_confirmationRejected: s5Rejected,
            stage5_confirmationAmended: s5Amended,
            stage5_confirmationCancelled: s5Cancelled,
            stage6_invitationShared: s6Invited,
            stage7_companionFirstOpened: s7CompOpened,
            stage7_companionContributed: s7CompContrib,
            stage7_distinctCompanionsCount: s7TotalDistinctCompanions,
            stage7_duplicateMergesReconciled: s7MergesCount,
            stage8_returnedLaterSession: s8LaterSession,
            stage9_sellerHandoffInitiated: s9SellerHandoff,
            stage10_confirmedOutcome: s10ConfirmedOutcome,
          },
          agedRetentionCohorts: {
            d1Plus: {
              minAgeHours: 24,
              eligiblePersistedTrips: d1Eligible,
              returnedTrips: d1Returned,
              retentionRate:
                d1Eligible > 0
                  ? Number(((d1Returned / d1Eligible) * 100).toFixed(1))
                  : "insufficient_aged_cohort",
            },
            d7Plus: {
              minAgeHours: 168,
              eligiblePersistedTrips: d7Eligible,
              returnedTrips: d7Returned,
              retentionRate:
                d7Eligible > 0
                  ? Number(((d7Returned / d7Eligible) * 100).toFixed(1))
                  : "insufficient_aged_cohort",
            },
          },
          confirmationProvenanceBreakdown: {
            byExtractionChannel,
            byReviewState,
            byProviderVerification,
            byDccDayMatchMethod,
          },
          byJourneyKind: Array.from(journeyMap.values()).sort((a, b) => b.tripsTotal - a.tripsTotal),
        },
        financialOutcomesSeparation: {
          directMorPaidGrossSalesUsd: hasAnyMorFeedRecord
            ? Number(totalMorGrossUsd.toFixed(2))
            : "unavailable",
          verifiedAffiliateCommissionsUsd: hasAnyCommFeedRecord
            ? Number(totalVerifiedCommUsd.toFixed(2))
            : "unavailable",
          unverifiedAffiliateClicksCount: totalSellerHandoffs,
          netOperatingProfitLabel: "Unreconciled in analytics (never equated with gross sales)",
          disclosures: [
            "Seller handoffs are Clicks / Handoffs Only — Not Bookings or Revenue.",
            "Unconnected provider feeds display as `unavailable`, never zero.",
            "GoSno and Party at Red Rocks Direct MoR gross merchant sales are strictly separated from affiliate commissions and net profit.",
          ],
        },
        sites: sitesReport,
      };

      // Persist into DB cache + last-good fallback snapshot
      try {
        await exec.query(
          `INSERT INTO dcc_analytics_report_cache (
             cache_key, environment, window_preset, watermark_iso, generated_at, payload_json
           ) VALUES ($1, $2, $3, $4, $5, $6::jsonb)
           ON CONFLICT (cache_key) DO UPDATE SET
             generated_at = excluded.generated_at,
             payload_json = excluded.payload_json`,
          [
            exactCacheKey,
            environment,
            windowPreset,
            watermark.processedThroughIso,
            nowIso,
            JSON.stringify(report),
          ],
        );
      } catch {
        // non-fatal cache write
      }
      saveLastGoodSnapshot(snapshotFallbackKey, report);

      return report;
    });

    return {
      ...builtReport,
      dbTelemetry,
    };
  } catch (err) {
    const reason = err instanceof Error ? err.message : "analytics_store_unavailable";
    const fallback = loadLastGoodSnapshot(snapshotFallbackKey);
    if (fallback) {
      return {
        ...fallback,
        ok: true,
        dataStatus: "stale_last_good_snapshot",
        staleOrUnavailableReason: `Live analytics store unavailable (${reason}). Showing explicitly labeled last-good snapshot captured at ${fallback.snapshotCapturedAt}.`,
        generatedAt: nowIso,
      };
    }

    // No last-good snapshot exists -> return explicit `unavailable` state, NEVER fabricated zeros!
    return {
      ok: false,
      dataStatus: "unavailable",
      staleOrUnavailableReason: `Analytics store is currently unavailable (${reason}) and no prior cached snapshot exists for this filter.`,
      snapshotCapturedAt: nowIso,
      generatedAt: nowIso,
      schemaVersion: ANALYTICS_SCHEMA_VERSION,
      metricDictionaryVersion: METRIC_DICTIONARY_VERSION,
      environment,
      timezone: "UTC",
      backendInfo: {
        backend: activeBackendInfo.backend,
        databaseName: activeBackendInfo.databaseName,
        cacheHit: false,
      },
      filters: {
        windowPreset,
        startIso: effectiveStartIso,
        endIso: effectiveEndIso,
        siteId: siteFilter,
        contentFamily: familyFilter,
      },
      telemetryHealth: null,
      trafficSummary: null,
      trafficHygieneAndExclusions: null,
      topLandingPages: [],
      topSourcesAndCampaigns: [],
      byContentFamily: [],
      crossSiteTransitions: [],
      tripLifecycle: null,
      financialOutcomesSeparation: null,
      sites: [],
    };
  }
}
