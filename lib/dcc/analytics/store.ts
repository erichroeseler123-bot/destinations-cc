import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { loadServerNodeModule } from "./nodeRuntimeHelper";
import type {
  AnalyticsEnvironment,
  AnalyticsEventType,
  CanonicalAnalyticsSiteId,
  ConfirmationProvenance,
  ContentFamily,
  TrafficClassification,
} from "./contract";

export interface NormalizedAnalyticsRecord {
  logicalEventId: string;
  deliveryId: string | null;
  schemaVersion: string;
  eventType: AnalyticsEventType;
  layer: "traffic" | "trip_lifecycle";
  environment: AnalyticsEnvironment;
  siteId: CanonicalAnalyticsSiteId;
  rawSiteInput: string;
  trafficClass: TrafficClassification;
  classificationReason: string;
  occurredAt: string;
  receivedAt: string;
  reportingSubjectId: string | null;
  keyVersion: number;
  sessionKey: string | null;
  navigationType: string | null;
  canonicalPath: string;
  landingPath: string;
  referrerDomain: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  contentFamily: ContentFamily;
  handoffId: string | null;
  clickId: string | null;
  continuityTier: "verified_dcc_ctx" | "public_param_referral" | "none";
  targetSiteId: CanonicalAnalyticsSiteId | null;
  provider: string | null;
  productCode: string | null;
  physicalSailingId: string | null;
  hostedDepartureId: string | null;
  journeyKind: string | null;
  draftKeyHash: string | null;
  analyticsTripKey: string | null;
  participantRole: string | null;
  participantKey: string | null;
  mergedFromParticipantKey: string | null;
  partyHeadcountTotal: number | null;
  subMilestone: string | null;
  isTemplateOrHydration: boolean;
  isNoOpSave: boolean;
  leadTimeBucket: string | null;
  confirmationProvenance: ConfirmationProvenance | null;
  outcomeType: string | null;
  grossAmountUsd: number | null;
  commissionAmountUsd: number | null;
  props: Record<string, string | number | boolean>;
}

export interface AnalyticsHealthCounters {
  receivedTotal: number;
  queuedTotal: number;
  processedTotal: number;
  deduplicatedIngestTotal: number;
  deduplicatedWorkerTotal: number;
  rejectedInvalidTotal: number;
  rejectedUnauthorizedOutcomeTotal: number;
  retriedTotal: number;
  deadLetterTotal: number;
  droppedBackpressureTotal: number;
  droppedKillSwitchTotal: number;
  lateEventsReconciledTotal: number;
  botClassifiedTotal: number;
  qaClassifiedTotal: number;
  tombstonedTripsTotal: number;
}

export interface AnalyticsWatermarkState {
  processedThroughIso: string | null;
  lastQueueSeq: number;
  lastWorkerSuccessAt: string | null;
  lastWorkerRunDurationMs: number | null;
  pendingQueueDepth: number;
  deadLetterCount: number;
}

export const ANALYTICS_V2_SQLITE_DDL = `
CREATE TABLE IF NOT EXISTS dcc_analytics_ingest_queue (
  queue_seq INTEGER PRIMARY KEY AUTOINCREMENT,
  logical_event_id TEXT NOT NULL UNIQUE,
  delivery_id TEXT,
  environment TEXT NOT NULL,
  site_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  traffic_class TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  received_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  payload_json TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_analytics_queue_status_seq ON dcc_analytics_ingest_queue(status, queue_seq);

CREATE TABLE IF NOT EXISTS dcc_analytics_events (
  logical_event_id TEXT PRIMARY KEY,
  delivery_id TEXT,
  schema_version TEXT NOT NULL,
  event_type TEXT NOT NULL,
  layer TEXT NOT NULL,
  environment TEXT NOT NULL,
  site_id TEXT NOT NULL,
  traffic_class TEXT NOT NULL,
  classification_reason TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  received_at TEXT NOT NULL,
  processed_at TEXT NOT NULL,
  reporting_subject_id TEXT,
  key_version INTEGER NOT NULL DEFAULT 1,
  session_key TEXT,
  canonical_path TEXT NOT NULL,
  landing_path TEXT NOT NULL,
  referrer_domain TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  content_family TEXT NOT NULL,
  handoff_id TEXT,
  click_id TEXT,
  continuity_tier TEXT NOT NULL DEFAULT 'none',
  target_site_id TEXT,
  provider TEXT,
  product_code TEXT,
  physical_sailing_id TEXT,
  hosted_departure_id TEXT,
  journey_kind TEXT,
  draft_key_hash TEXT,
  analytics_trip_key TEXT,
  participant_role TEXT,
  participant_key TEXT,
  party_headcount_total INTEGER,
  sub_milestone TEXT,
  is_template_or_hydration INTEGER NOT NULL DEFAULT 0,
  is_noop_save INTEGER NOT NULL DEFAULT 0,
  lead_time_bucket TEXT,
  confirmation_provenance_json TEXT,
  outcome_type TEXT,
  gross_amount_usd REAL,
  commission_amount_usd REAL,
  props_json TEXT NOT NULL DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS idx_analytics_events_env_time ON dcc_analytics_events(environment, occurred_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_env_site_time ON dcc_analytics_events(environment, site_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_trip ON dcc_analytics_events(environment, analytics_trip_key, occurred_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_handoff ON dcc_analytics_events(environment, handoff_id);

CREATE TABLE IF NOT EXISTS dcc_analytics_hourly_rollups (
  environment TEXT NOT NULL,
  hour_bucket_iso TEXT NOT NULL,
  site_id TEXT NOT NULL,
  content_family TEXT NOT NULL,
  traffic_class TEXT NOT NULL,
  pageviews_count INTEGER NOT NULL DEFAULT 0,
  guide_engagements_count INTEGER NOT NULL DEFAULT 0,
  printable_opens_count INTEGER NOT NULL DEFAULT 0,
  cross_site_clicks_count INTEGER NOT NULL DEFAULT 0,
  cross_site_arrivals_count INTEGER NOT NULL DEFAULT 0,
  verified_ctx_arrivals_count INTEGER NOT NULL DEFAULT 0,
  seller_handoffs_count INTEGER NOT NULL DEFAULT 0,
  unidentified_outbound_count INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (environment, hour_bucket_iso, site_id, content_family, traffic_class)
);
CREATE INDEX IF NOT EXISTS idx_analytics_hourly_env_hour ON dcc_analytics_hourly_rollups(environment, hour_bucket_iso);

CREATE TABLE IF NOT EXISTS dcc_analytics_subject_activity (
  environment TEXT NOT NULL,
  site_id TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  first_pageview_at TEXT NOT NULL,
  last_pageview_at TEXT NOT NULL,
  total_pageviews INTEGER NOT NULL DEFAULT 1,
  distinct_session_count INTEGER NOT NULL DEFAULT 1,
  distinct_day_count INTEGER NOT NULL DEFAULT 1,
  last_session_key TEXT,
  last_day_bucket TEXT NOT NULL,
  first_landing_path TEXT NOT NULL,
  first_utm_source TEXT,
  first_utm_campaign TEXT,
  first_referrer_domain TEXT,
  PRIMARY KEY (environment, site_id, subject_id)
);

CREATE TABLE IF NOT EXISTS dcc_analytics_daily_subjects (
  environment TEXT NOT NULL,
  day_bucket TEXT NOT NULL,
  site_id TEXT NOT NULL,
  content_family TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  session_count INTEGER NOT NULL DEFAULT 1,
  pageview_count INTEGER NOT NULL DEFAULT 1,
  first_seen_in_day_at TEXT NOT NULL,
  last_seen_in_day_at TEXT NOT NULL,
  is_returning_subject INTEGER NOT NULL DEFAULT 0,
  landing_path TEXT NOT NULL,
  utm_source TEXT,
  utm_campaign TEXT,
  referrer_domain TEXT,
  PRIMARY KEY (environment, day_bucket, site_id, content_family, subject_id)
);
CREATE INDEX IF NOT EXISTS idx_analytics_daily_subj_env_day ON dcc_analytics_daily_subjects(environment, day_bucket);

CREATE TABLE IF NOT EXISTS dcc_analytics_daily_sessions (
  environment TEXT NOT NULL,
  day_bucket TEXT NOT NULL,
  site_id TEXT NOT NULL,
  content_family TEXT NOT NULL,
  session_key TEXT NOT NULL,
  subject_id TEXT,
  first_pageview_at TEXT NOT NULL,
  last_pageview_at TEXT NOT NULL,
  pageview_count INTEGER NOT NULL DEFAULT 1,
  landing_path TEXT NOT NULL,
  utm_source TEXT,
  utm_campaign TEXT,
  referrer_domain TEXT,
  PRIMARY KEY (environment, day_bucket, site_id, content_family, session_key)
);

CREATE TABLE IF NOT EXISTS dcc_analytics_trip_links (
  environment TEXT NOT NULL,
  draft_key_hash TEXT NOT NULL,
  analytics_trip_key TEXT NOT NULL,
  linked_at TEXT NOT NULL,
  PRIMARY KEY (environment, draft_key_hash)
);

CREATE TABLE IF NOT EXISTS dcc_analytics_trip_state (
  environment TEXT NOT NULL,
  trip_unit_key TEXT NOT NULL,
  analytics_trip_key TEXT,
  draft_key_hash TEXT,
  origin_site_id TEXT NOT NULL,
  journey_kind TEXT NOT NULL DEFAULT 'cruise_sailing',
  content_family TEXT NOT NULL DEFAULT 'cruise_sailing',
  physical_sailing_id TEXT,
  hosted_departure_id TEXT,
  organizer_subject_id TEXT,
  organizer_first_session_key TEXT,
  entry_selected_at TEXT,
  draft_started_at TEXT,
  persisted_at TEXT,
  first_customized_at TEXT,
  customization_count INTEGER NOT NULL DEFAULT 0,
  confirmation_staged_at TEXT,
  confirmation_reviewed_at TEXT,
  confirmation_applied_at TEXT,
  confirmation_rejected_at TEXT,
  confirmation_amended_at TEXT,
  confirmation_cancelled_at TEXT,
  latest_confirmation_provenance_json TEXT,
  invitation_shared_at TEXT,
  invitation_share_count INTEGER NOT NULL DEFAULT 0,
  companion_first_opened_at TEXT,
  companion_first_contributed_at TEXT,
  companion_keys_json TEXT NOT NULL DEFAULT '[]',
  merged_companion_map_json TEXT NOT NULL DEFAULT '{}',
  latest_party_headcount INTEGER,
  later_session_return_at TEXT,
  later_day_d1_return_at TEXT,
  later_day_d7_return_at TEXT,
  seller_handoff_at TEXT,
  seller_handoff_count INTEGER NOT NULL DEFAULT 0,
  confirmed_outcome_at TEXT,
  confirmed_outcome_type TEXT,
  confirmed_gross_usd REAL NOT NULL DEFAULT 0,
  confirmed_commission_usd REAL NOT NULL DEFAULT 0,
  first_touch_utm_source TEXT,
  first_touch_referrer_domain TEXT,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (environment, trip_unit_key)
);
CREATE INDEX IF NOT EXISTS idx_analytics_trip_env_updated ON dcc_analytics_trip_state(environment, updated_at);
CREATE INDEX IF NOT EXISTS idx_analytics_trip_env_persisted ON dcc_analytics_trip_state(environment, persisted_at);

CREATE TABLE IF NOT EXISTS dcc_analytics_tombstones (
  environment TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_key TEXT NOT NULL,
  deleted_at TEXT NOT NULL,
  reason TEXT,
  PRIMARY KEY (environment, target_type, target_key)
);

CREATE TABLE IF NOT EXISTS dcc_analytics_health_counters (
  counter_key TEXT PRIMARY KEY,
  counter_value INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS dcc_analytics_watermarks (
  scope_key TEXT PRIMARY KEY,
  processed_through_iso TEXT,
  last_queue_seq INTEGER NOT NULL DEFAULT 0,
  last_worker_success_at TEXT,
  last_worker_duration_ms INTEGER,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS dcc_analytics_worker_lease (
  lease_name TEXT PRIMARY KEY,
  worker_id TEXT NOT NULL,
  leased_until_ms INTEGER NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS dcc_analytics_report_cache (
  cache_key TEXT PRIMARY KEY,
  environment TEXT NOT NULL,
  window_preset TEXT NOT NULL,
  watermark_iso TEXT,
  generated_at TEXT NOT NULL,
  payload_json TEXT NOT NULL
);
`;

interface SqliteDatabaseSync {
  exec(sql: string): void;
  prepare(sql: string): {
    run(...params: unknown[]): { changes: number; lastInsertRowid: number | bigint };
    get(...params: unknown[]): Record<string, unknown> | undefined;
    all(...params: unknown[]): Array<Record<string, unknown>>;
  };
  close(): void;
}

let activeSqliteDb: SqliteDatabaseSync | null = null;
let activeSqlitePath: string | null = null;
let simulateAnalyticsStoreOutage = false;

export function setSimulateAnalyticsStoreOutageForTests(enabled: boolean): void {
  simulateAnalyticsStoreOutage = enabled;
}

export function isAnalyticsStoreOutageSimulated(): boolean {
  return simulateAnalyticsStoreOutage;
}

export function resolveAnalyticsSqlitePath(): string {
  const explicit = process.env.DCC_ANALYTICS_SQLITE_PATH?.trim();
  if (explicit) return explicit === ":memory:" ? ":memory:" : path.resolve(explicit);

  if (process.env.DCC_ISOLATED_TEST_DB === "1" || process.env.NODE_ENV === "test") {
    const dir = path.join(os.tmpdir(), "dcc-analytics-v2-tests");
    fs.mkdirSync(dir, { recursive: true });
    return path.join(dir, `dcc-analytics-test-${process.pid}.sqlite`);
  }

  const preferredDir = path.join(process.cwd(), ".next", "cache");
  try {
    fs.mkdirSync(preferredDir, { recursive: true });
    return path.join(preferredDir, "dcc-analytics-preview-v2.sqlite");
  } catch {
    const tmpDir = path.join(os.tmpdir(), "dcc-analytics-v2");
    fs.mkdirSync(tmpDir, { recursive: true });
    return path.join(tmpDir, "dcc-analytics-preview-v2.sqlite");
  }
}

export function getAnalyticsSqliteDb(): SqliteDatabaseSync {
  if (simulateAnalyticsStoreOutage) {
    throw new Error("ANALYTICS_STORE_UNAVAILABLE: Simulated collector/storage outage");
  }

  const targetPath = resolveAnalyticsSqlitePath();
  if (activeSqliteDb && activeSqlitePath === targetPath) {
    return activeSqliteDb;
  }

  if (activeSqliteDb) {
    try {
      activeSqliteDb.close();
    } catch {
      // ignore close errors
    }
    activeSqliteDb = null;
    activeSqlitePath = null;
  }

  const { DatabaseSync } = loadServerNodeModule<{
    DatabaseSync: new (p: string, opts?: { timeout?: number }) => SqliteDatabaseSync;
  }>("node:sqlite");

  const db = new DatabaseSync(targetPath, { timeout: 5000 });
  db.exec("PRAGMA busy_timeout = 5000;");
  if (targetPath !== ":memory:") {
    try {
      db.exec("PRAGMA journal_mode = WAL;");
      db.exec("PRAGMA synchronous = NORMAL;");
    } catch {
      // WAL optional on restricted filesystems
    }
  }

  const initialized = db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='dcc_analytics_ingest_queue'",
    )
    .get();
  if (!initialized) {
    db.exec(ANALYTICS_V2_SQLITE_DDL);
  }

  activeSqliteDb = db;
  activeSqlitePath = targetPath;
  return db;
}

export function closeAndResetAnalyticsDbForTests(deleteSqliteFile = false): void {
  const prevPath = activeSqlitePath;
  if (activeSqliteDb) {
    try {
      activeSqliteDb.close();
    } catch {
      // ignore
    }
    activeSqliteDb = null;
    activeSqlitePath = null;
  }
  if (deleteSqliteFile && prevPath && prevPath !== ":memory:" && fs.existsSync(prevPath)) {
    for (const suffix of ["", "-wal", "-shm"]) {
      try {
        if (fs.existsSync(`${prevPath}${suffix}`)) {
          fs.unlinkSync(`${prevPath}${suffix}`);
        }
      } catch {
        // ignore
      }
    }
  }
}

export function incrementHealthCounter(
  db: SqliteDatabaseSync,
  key: string,
  delta = 1,
  nowIso = new Date().toISOString(),
): void {
  if (delta === 0) return;
  db.prepare(
    `INSERT INTO dcc_analytics_health_counters (counter_key, counter_value, updated_at)
     VALUES (?, ?, ?)
     ON CONFLICT(counter_key) DO UPDATE SET
       counter_value = counter_value + excluded.counter_value,
       updated_at = excluded.updated_at`,
  ).run(key, delta, nowIso);
}

export function readAnalyticsHealthCounters(db: SqliteDatabaseSync): AnalyticsHealthCounters {
  const rows = db
    .prepare("SELECT counter_key, counter_value FROM dcc_analytics_health_counters")
    .all();
  const map = new Map<string, number>();
  for (const r of rows) {
    map.set(String(r.counter_key), Number(r.counter_value || 0));
  }
  return {
    receivedTotal: map.get("received_total") || 0,
    queuedTotal: map.get("queued_total") || 0,
    processedTotal: map.get("processed_total") || 0,
    deduplicatedIngestTotal: map.get("deduplicated_ingest_total") || 0,
    deduplicatedWorkerTotal: map.get("deduplicated_worker_total") || 0,
    rejectedInvalidTotal: map.get("rejected_invalid_total") || 0,
    rejectedUnauthorizedOutcomeTotal: map.get("rejected_unauthorized_outcome_total") || 0,
    retriedTotal: map.get("retried_total") || 0,
    deadLetterTotal: map.get("dead_letter_total") || 0,
    droppedBackpressureTotal: map.get("dropped_backpressure_total") || 0,
    droppedKillSwitchTotal: map.get("dropped_kill_switch_total") || 0,
    lateEventsReconciledTotal: map.get("late_events_reconciled_total") || 0,
    botClassifiedTotal: map.get("bot_classified_total") || 0,
    qaClassifiedTotal: map.get("qa_classified_total") || 0,
    tombstonedTripsTotal: map.get("tombstoned_trips_total") || 0,
  };
}

export function getPendingQueueDepth(db: SqliteDatabaseSync): number {
  const row = db
    .prepare(
      "SELECT COUNT(*) AS cnt FROM dcc_analytics_ingest_queue WHERE status IN ('queued', 'processing')",
    )
    .get();
  return Number(row?.cnt || 0);
}

export function readAnalyticsWatermarkState(
  db: SqliteDatabaseSync,
  scopeKey = "primary",
): AnalyticsWatermarkState {
  const wm = db
    .prepare(
      "SELECT processed_through_iso, last_queue_seq, last_worker_success_at, last_worker_duration_ms FROM dcc_analytics_watermarks WHERE scope_key = ?",
    )
    .get(scopeKey);
  const qRow = db
    .prepare(
      `SELECT
         SUM(CASE WHEN status IN ('queued', 'processing') THEN 1 ELSE 0 END) AS pending_cnt,
         SUM(CASE WHEN status = 'dead_letter' THEN 1 ELSE 0 END) AS dl_cnt
       FROM dcc_analytics_ingest_queue`,
    )
    .get();

  return {
    processedThroughIso: wm?.processed_through_iso ? String(wm.processed_through_iso) : null,
    lastQueueSeq: Number(wm?.last_queue_seq || 0),
    lastWorkerSuccessAt: wm?.last_worker_success_at ? String(wm.last_worker_success_at) : null,
    lastWorkerRunDurationMs:
      wm?.last_worker_duration_ms !== null && wm?.last_worker_duration_ms !== undefined
        ? Number(wm.last_worker_duration_ms)
        : null,
    pendingQueueDepth: Number(qRow?.pending_cnt || 0),
    deadLetterCount: Number(qRow?.dl_cnt || 0),
  };
}

export function enqueueNormalizedAnalyticsBatch(params: {
  records: NormalizedAnalyticsRecord[];
  maxQueueDepth?: number;
}): {
  queuedCount: number;
  deduplicatedCount: number;
  droppedBackpressureCount: number;
} {
  const maxQueueDepth = params.maxQueueDepth ?? 50_000;
  const db = getAnalyticsSqliteDb();
  const nowIso = new Date().toISOString();

  const currentDepth = getPendingQueueDepth(db);
  const insertStmt = db.prepare(
    `INSERT INTO dcc_analytics_ingest_queue (
       logical_event_id, delivery_id, environment, site_id, event_type,
       traffic_class, occurred_at, received_at, status, attempts, payload_json
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'queued', 0, ?)
     ON CONFLICT(logical_event_id) DO NOTHING`,
  );

  let queuedCount = 0;
  let deduplicatedCount = 0;
  let droppedBackpressureCount = 0;
  let botCount = 0;
  let qaCount = 0;

  db.exec("BEGIN IMMEDIATE TRANSACTION;");
  try {
    let projectedDepth = currentDepth;
    for (const rec of params.records) {
      if (rec.trafficClass === "known_bot") botCount += 1;
      if (rec.trafficClass === "qa_or_synthetic") qaCount += 1;

      // Backpressure policy: shed ordinary traffic first if queue depth exceeds ceiling; preserve trip_lifecycle milestones up to 1.2x ceiling
      const effectiveCeiling =
        rec.layer === "trip_lifecycle" ? Math.floor(maxQueueDepth * 1.2) : maxQueueDepth;
      if (projectedDepth >= effectiveCeiling) {
        droppedBackpressureCount += 1;
        continue;
      }

      const res = insertStmt.run(
        rec.logicalEventId,
        rec.deliveryId,
        rec.environment,
        rec.siteId,
        rec.eventType,
        rec.trafficClass,
        rec.occurredAt,
        rec.receivedAt,
        JSON.stringify(rec),
      );
      if (res.changes > 0) {
        queuedCount += 1;
        projectedDepth += 1;
      } else {
        deduplicatedCount += 1;
      }
    }

    incrementHealthCounter(db, "received_total", params.records.length, nowIso);
    incrementHealthCounter(db, "queued_total", queuedCount, nowIso);
    incrementHealthCounter(db, "deduplicated_ingest_total", deduplicatedCount, nowIso);
    incrementHealthCounter(db, "dropped_backpressure_total", droppedBackpressureCount, nowIso);
    incrementHealthCounter(db, "bot_classified_total", botCount, nowIso);
    incrementHealthCounter(db, "qa_classified_total", qaCount, nowIso);

    db.exec("COMMIT;");
  } catch (err) {
    try {
      db.exec("ROLLBACK;");
    } catch {
      // ignore rollback error
    }
    throw err;
  }

  return {
    queuedCount,
    deduplicatedCount,
    droppedBackpressureCount,
  };
}
