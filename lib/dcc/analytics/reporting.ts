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
  getAnalyticsSqliteDb,
  readAnalyticsHealthCounters,
  readAnalyticsWatermarkState,
  type AnalyticsHealthCounters,
  type AnalyticsWatermarkState,
} from "./store";

export type AnalyticsWindowPreset = "24h" | "7d" | "28d";

const WINDOW_HOURS: Record<AnalyticsWindowPreset, number> = {
  "24h": 24,
  "7d": 7 * 24,
  "28d": 28 * 24,
};

export interface SiteTrafficAndCoverageRow {
  siteId: string;
  displayName: string;
  canonicalDomain: string;
  inActive12Portfolio: boolean;
  instrumentationTier: InstrumentationCoverageTier;
  commercialModel: string;
  outcomeFeedMode: string;
  observedBrowsers: number | "excluded";
  sessions: number | "excluded";
  returningBrowsers: number | "excluded";
  pageviews: number | "excluded";
  guideEngagements: number;
  printableOpens: number;
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
  } | null;
  trafficSummary: {
    observedBrowsers: number;
    sessions: number;
    returningBrowsers: number;
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

export function buildNetworkAndTripAnalyticsReport(options?: {
  environment?: AnalyticsEnvironment;
  windowPreset?: AnalyticsWindowPreset;
  startIso?: string;
  endIso?: string;
  asOfWatermarkIso?: string;
  siteId?: CanonicalAnalyticsSiteId | "all";
  contentFamily?: ContentFamily | "all";
  bypassCache?: boolean;
}): NetworkAndTripAnalyticsReport {
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
  const killSwitchActive =
    (process.env.DCC_ANALYTICS_KILL_SWITCH || "").trim().toLowerCase() === "1" ||
    (process.env.DCC_ANALYTICS_KILL_SWITCH || "").trim().toLowerCase() === "true";

  try {
    const db = getAnalyticsSqliteDb();
    const watermark = readAnalyticsWatermarkState(db);
    const counters = readAnalyticsHealthCounters(db);

    const upperBoundIso = options?.endIso
      ? effectiveEndIso
      : options?.asOfWatermarkIso || watermark.processedThroughIso || effectiveEndIso;
    const lowerBoundIso = options?.startIso
      ? effectiveStartIso
      : new Date(Date.parse(upperBoundIso) - hours * 3600_000).toISOString();

    const exactCacheKey = `${snapshotFallbackKey}|${lowerBoundIso}|${upperBoundIso}|${watermark.lastQueueSeq}`;
    if (!options?.bypassCache) {
      const cachedRow = db
        .prepare("SELECT payload_json FROM dcc_analytics_report_cache WHERE cache_key = ?")
        .get(exactCacheKey);
      if (cachedRow?.payload_json) {
        const parsed = JSON.parse(String(cachedRow.payload_json)) as NetworkAndTripAnalyticsReport;
        return {
          ...parsed,
          generatedAt: nowIso,
        };
      }
    }

    const startHourBucket = `${lowerBoundIso.slice(0, 13)}:00:00.000Z`;
    const endHourBucket = `${upperBoundIso.slice(0, 13)}:00:00.000Z`;
    const startDayBucket = lowerBoundIso.slice(0, 10);
    const endDayBucket = upperBoundIso.slice(0, 10);

    // 1. Query pre-aggregated hourly rollups (bounded KB transfer!)
    const rollupParams: unknown[] = [environment, startHourBucket, endHourBucket];
    let rollupWhere = "environment = ? AND hour_bucket_iso >= ? AND hour_bucket_iso <= ?";
    if (siteFilter !== "all") {
      rollupWhere += " AND site_id = ?";
      rollupParams.push(siteFilter);
    }
    if (familyFilter !== "all") {
      rollupWhere += " AND content_family = ?";
      rollupParams.push(familyFilter);
    }

    const rollupRows = db
      .prepare(
        `SELECT site_id, content_family, traffic_class,
                SUM(pageviews_count) AS pv,
                SUM(guide_engagements_count) AS ge,
                SUM(printable_opens_count) AS pr,
                SUM(cross_site_clicks_count) AS xsc,
                SUM(cross_site_arrivals_count) AS xsa,
                SUM(verified_ctx_arrivals_count) AS ctxa,
                SUM(seller_handoffs_count) AS sh,
                SUM(unidentified_outbound_count) AS uo
         FROM dcc_analytics_hourly_rollups
         WHERE ${rollupWhere}
         GROUP BY site_id, content_family, traffic_class`,
      )
      .all(...rollupParams);

    // 2. Query exact distinct subjects, returning subjects, and sessions from compact daily rollup tables
    const dailyParams: unknown[] = [environment, startDayBucket, endDayBucket];
    let dailyWhere = "environment = ? AND day_bucket >= ? AND day_bucket <= ?";
    if (siteFilter !== "all") {
      dailyWhere += " AND site_id = ?";
      dailyParams.push(siteFilter);
    }
    if (familyFilter !== "all") {
      dailyWhere += " AND content_family = ?";
      dailyParams.push(familyFilter);
    }

    const distinctSubjectRow = db
      .prepare(
        `SELECT
           COUNT(DISTINCT site_id || ':' || subject_id) AS observed_browsers,
           COUNT(DISTINCT CASE WHEN is_returning_subject = 1 THEN site_id || ':' || subject_id END) AS returning_browsers
         FROM dcc_analytics_daily_subjects
         WHERE ${dailyWhere}`,
      )
      .get(...dailyParams);

    const distinctSessionRow = db
      .prepare(
        `SELECT COUNT(DISTINCT site_id || ':' || session_key) AS sessions_cnt
         FROM dcc_analytics_daily_sessions
         WHERE ${dailyWhere}`,
      )
      .get(...dailyParams);

    const perSiteSubjects = db
      .prepare(
        `SELECT site_id,
                COUNT(DISTINCT subject_id) AS browsers_cnt,
                COUNT(DISTINCT CASE WHEN is_returning_subject = 1 THEN subject_id END) AS returning_cnt
         FROM dcc_analytics_daily_subjects
         WHERE ${dailyWhere}
         GROUP BY site_id`,
      )
      .all(...dailyParams);

    const perSiteSessions = db
      .prepare(
        `SELECT site_id, COUNT(DISTINCT session_key) AS sessions_cnt
         FROM dcc_analytics_daily_sessions
         WHERE ${dailyWhere}
         GROUP BY site_id`,
      )
      .all(...dailyParams);

    const perFamilySubjects = db
      .prepare(
        `SELECT content_family, COUNT(DISTINCT site_id || ':' || subject_id) AS browsers_cnt
         FROM dcc_analytics_daily_subjects
         WHERE ${dailyWhere}
         GROUP BY content_family`,
      )
      .all(...dailyParams);

    const topLandingRows = db
      .prepare(
        `SELECT landing_path AS value,
                SUM(pageview_count) AS pageviews,
                COUNT(DISTINCT site_id || ':' || session_key) AS sessions
         FROM dcc_analytics_daily_sessions
         WHERE ${dailyWhere}
         GROUP BY landing_path
         ORDER BY pageviews DESC, value ASC
         LIMIT 12`,
      )
      .all(...dailyParams);

    const topSourceRows = db
      .prepare(
        `SELECT COALESCE(utm_source, referrer_domain, 'direct_or_none') AS value,
                SUM(pageview_count) AS pageviews,
                COUNT(DISTINCT site_id || ':' || session_key) AS sessions
         FROM dcc_analytics_daily_sessions
         WHERE ${dailyWhere}
         GROUP BY COALESCE(utm_source, referrer_domain, 'direct_or_none')
         ORDER BY pageviews DESC, value ASC
         LIMIT 12`,
      )
      .all(...dailyParams);

    // 3. Cross-site transitions within exact [lowerBoundIso, upperBoundIso]
    const transParams: unknown[] = [environment, lowerBoundIso, upperBoundIso];
    let transWhere =
      "environment = ? AND occurred_at >= ? AND occurred_at <= ? AND event_type = 'cross_site_handoff_clicked' AND traffic_class = 'observed_browser'";
    if (siteFilter !== "all") {
      transWhere += " AND (site_id = ? OR target_site_id = ?)";
      transParams.push(siteFilter, siteFilter);
    }
    const transitionRows = db
      .prepare(
        `SELECT site_id AS from_site,
                COALESCE(target_site_id, 'unspecified') AS to_site,
                continuity_tier,
                COUNT(*) AS cnt
         FROM dcc_analytics_events
         WHERE ${transWhere}
         GROUP BY site_id, COALESCE(target_site_id, 'unspecified'), continuity_tier
         ORDER BY cnt DESC
         LIMIT 20`,
      )
      .all(...transParams);

    // 4. Verified booking/financial outcomes per site within [lowerBoundIso, upperBoundIso]
    const outcomeRows = db
      .prepare(
        `SELECT site_id, outcome_type,
                COUNT(*) AS cnt,
                COALESCE(SUM(gross_amount_usd), 0) AS gross_sum,
                COALESCE(SUM(commission_amount_usd), 0) AS comm_sum
         FROM dcc_analytics_events
         WHERE environment = ? AND occurred_at >= ? AND occurred_at <= ?
           AND event_type = 'booking_outcome_confirmed'
         GROUP BY site_id, outcome_type`,
      )
      .all(environment, lowerBoundIso, upperBoundIso);

    // 5. Traffic hygiene counts across classes within [lowerBoundIso, upperBoundIso]
    const hygieneParams: unknown[] = [environment, lowerBoundIso, upperBoundIso];
    let hygieneWhere = "environment = ? AND occurred_at >= ? AND occurred_at <= ?";
    if (siteFilter !== "all") {
      hygieneWhere += " AND site_id = ?";
      hygieneParams.push(siteFilter);
    }
    if (familyFilter !== "all") {
      hygieneWhere += " AND content_family = ?";
      hygieneParams.push(familyFilter);
    }
    const hygieneRows = db
      .prepare(
        `SELECT traffic_class, COUNT(*) AS cnt
         FROM dcc_analytics_events
         WHERE ${hygieneWhere}
         GROUP BY traffic_class`,
      )
      .all(...hygieneParams);

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

    const sitesReport: SiteTrafficAndCoverageRow[] = ANALYTICS_SITE_REGISTRY.filter(
      (entry) => siteFilter === "all" || entry.siteId === siteFilter,
    ).map((entry) => {
      const isExcluded =
        entry.instrumentationTier === "excluded_community" ||
        entry.instrumentationTier === "excluded_external";
      const sAcc = perSiteRollup.get(entry.siteId);
      const sSubj = siteSubjMap.get(entry.siteId);
      const sSess = siteSessMap.get(entry.siteId) || 0;
      const out = siteOutcomesMap.get(entry.siteId);

      // Missing provider outcome feeds display as "unavailable", NEVER silently 0!
      let confirmedBookings: number | "unavailable" = "unavailable";
      if (out && out.confirmedCnt > 0) {
        confirmedBookings = out.confirmedCnt;
      } else if (entry.outcomeFeedMode === "not_applicable") {
        confirmedBookings = "unavailable";
      }

      let ownedMorGrossSalesUsd: number | "unavailable" | "not_applicable" = "not_applicable";
      if (entry.commercialModel === "owned_direct_checkout") {
        ownedMorGrossSalesUsd = out ? Number(out.morGrossUsd.toFixed(2)) : "unavailable";
      }

      let verifiedCommissionsUsd: number | "unavailable" | "not_applicable" = "not_applicable";
      if (entry.commercialModel !== "owned_direct_checkout" && !isExcluded) {
        verifiedCommissionsUsd = out ? Number(out.commUsd.toFixed(2)) : "unavailable";
      }

      return {
        siteId: entry.siteId,
        displayName: entry.displayName,
        canonicalDomain: entry.canonicalDomain,
        inActive12Portfolio: entry.inActive12Portfolio,
        instrumentationTier: entry.instrumentationTier,
        commercialModel: entry.commercialModel,
        outcomeFeedMode: entry.outcomeFeedMode,
        observedBrowsers: isExcluded ? "excluded" : (sSubj?.browsers ?? 0),
        sessions: isExcluded ? "excluded" : sSess,
        returningBrowsers: isExcluded ? "excluded" : (sSubj?.returning ?? 0),
        pageviews: isExcluded ? "excluded" : (sAcc?.pv ?? 0),
        guideEngagements: sAcc?.ge ?? 0,
        printableOpens: sAcc?.pr ?? 0,
        crossSiteClicks: sAcc?.xsc ?? 0,
        crossSiteArrivals: sAcc?.xsa ?? 0,
        verifiedCtxArrivals: sAcc?.ctxa ?? 0,
        sellerHandoffs: sAcc?.sh ?? 0,
        knownBotEventsExcluded: sAcc?.bots ?? 0,
        qaEventsExcluded: sAcc?.qa ?? 0,
        suspectedAutomationExcluded: sAcc?.auto ?? 0,
        unidentifiedOutboundRequests: sAcc?.uo ?? 0,
        confirmedBookings,
        ownedMorGrossSalesUsd,
        verifiedCommissionsUsd,
      };
    });

    // 6. Layer 2 — Trip Lifecycle Cohort Aggregation
    const tripParams: unknown[] = [environment, lowerBoundIso, upperBoundIso];
    let tripWhere = "environment = ? AND updated_at >= ? AND updated_at <= ?";
    if (siteFilter !== "all") {
      tripWhere += " AND origin_site_id = ?";
      tripParams.push(siteFilter);
    }
    if (familyFilter !== "all") {
      tripWhere += " AND content_family = ?";
      tripParams.push(familyFilter);
    }

    const tripRows = db
      .prepare(`SELECT * FROM dcc_analytics_trip_state WHERE ${tripWhere}`)
      .all(...tripParams);

    const linkedCountRow = db
      .prepare(
        "SELECT COUNT(*) AS cnt FROM dcc_analytics_trip_links WHERE environment = ? AND linked_at >= ? AND linked_at <= ?",
      )
      .get(environment, lowerBoundIso, upperBoundIso);

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

      try {
        const compArr = JSON.parse(String(tr.companion_keys_json || "[]")) as string[];
        s7TotalDistinctCompanions += compArr.length;
      } catch {
        // ignore
      }
      try {
        const mergeObj = JSON.parse(String(tr.merged_companion_map_json || "{}")) as Record<
          string,
          string
        >;
        s7MergesCount += Object.keys(mergeObj).length;
      } catch {
        // ignore
      }

      if (tr.latest_confirmation_provenance_json) {
        try {
          const prov = JSON.parse(
            String(tr.latest_confirmation_provenance_json),
          ) as ConfirmationProvenance;
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
        } catch {
          // ignore
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
      hygieneMap.set(String(h.traffic_class), Number(h.cnt || 0));
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
        killSwitchActive,
      },
      trafficSummary: {
        observedBrowsers: Number(distinctSubjectRow?.observed_browsers || 0),
        sessions: Number(distinctSessionRow?.sessions_cnt || 0),
        returningBrowsers: Number(distinctSubjectRow?.returning_browsers || 0),
        pageviews: totalObservedPageviews,
        guideEngagements: totalGuideEngagements,
        printableOpens: totalPrintableOpens,
        crossSiteHandoffClicks: totalCrossSiteClicks,
        crossSiteHandoffArrivals: totalCrossSiteArrivals,
        verifiedDccCtxArrivals: totalVerifiedCtxArrivals,
        sellerHandoffsTotal: totalSellerHandoffs,
        honestyDisclosures: [
          "Observed browser subjects (`rsub_v1_*`) are site-scoped first-party pseudonymous IDs requiring >= 1 pageview; click-only requests without pageviews are never counted as visitors.",
          "Cross-domain continuity is reported only where supported via redeemed `dcc_ctx_*` tokens or explicit handoff parameters; unrelated cross-domain or cross-device sessions are never merged.",
          "Ordinary browser user-agent strings do not prove human identity; known bots, prefetchers, suspected velocity bursts, QA/synthetic markers, and internal actors are separated.",
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
      db.prepare(
        `INSERT INTO dcc_analytics_report_cache (
           cache_key, environment, window_preset, watermark_iso, generated_at, payload_json
         ) VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(cache_key) DO UPDATE SET
           generated_at = excluded.generated_at,
           payload_json = excluded.payload_json`,
      ).run(
        exactCacheKey,
        environment,
        windowPreset,
        watermark.processedThroughIso,
        nowIso,
        JSON.stringify(report),
      );
    } catch {
      // non-fatal cache write
    }
    saveLastGoodSnapshot(snapshotFallbackKey, report);

    return report;
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
