import { AsyncLocalStorage } from "node:async_hooks";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { Pool, type PoolClient } from "@neondatabase/serverless";
import { resolveDatabaseUrl } from "../../db/client";
import { loadServerNodeModule } from "./nodeRuntimeHelper";
import type {
  AnalyticsEnvironment,
  AnalyticsEventType,
  CanonicalAnalyticsSiteId,
  ConfirmationProvenance,
  ContentFamily,
  TrafficClassification,
} from "./contract";

export type AnalyticsBackendMode = "postgres" | "sqlite_local_test";

export class AnalyticsStoreUnavailableError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "AnalyticsStoreUnavailableError";
    this.code = code;
  }
}

export interface AnalyticsDbTelemetry {
  backend: AnalyticsBackendMode;
  databaseName: string;
  queryCount: number;
  rowsReturned: number;
  transferredBytes: number;
  dbElapsedMs: number;
}

const dbTelemetryAls = new AsyncLocalStorage<{
  queryCount: number;
  rowsReturned: number;
  transferredBytes: number;
  dbElapsedMs: number;
  backend: AnalyticsBackendMode;
  databaseName: string;
}>();

export async function withAnalyticsDbTelemetry<T>(
  fn: () => Promise<T>,
): Promise<{ result: T; dbTelemetry: AnalyticsDbTelemetry }> {
  const modeInfo = describeActiveAnalyticsBackend();
  const tracker = {
    queryCount: 0,
    rowsReturned: 0,
    transferredBytes: 0,
    dbElapsedMs: 0,
    backend: modeInfo.backend,
    databaseName: modeInfo.databaseName,
  };
  const result = await dbTelemetryAls.run(tracker, fn);
  return {
    result,
    dbTelemetry: {
      backend: tracker.backend,
      databaseName: tracker.databaseName,
      queryCount: tracker.queryCount,
      rowsReturned: tracker.rowsReturned,
      transferredBytes: tracker.transferredBytes,
      dbElapsedMs: Number(tracker.dbElapsedMs.toFixed(3)),
    },
  };
}

function recordQueryTelemetry(
  backend: AnalyticsBackendMode,
  databaseName: string,
  rows: unknown[],
  elapsedMs: number,
): void {
  const store = dbTelemetryAls.getStore();
  if (!store) return;
  store.backend = backend;
  store.databaseName = databaseName;
  store.queryCount += 1;
  store.rowsReturned += rows.length;
  store.dbElapsedMs += elapsedMs;
  if (rows.length > 0) {
    try {
      store.transferredBytes += Buffer.byteLength(JSON.stringify(rows), "utf8");
    } catch {
      // ignore serialization edge case
    }
  }
}

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

export interface AnalyticsRuntimeControls {
  killSwitchActive: boolean;
  killSwitchSource: "env_override" | "runtime_db" | "off";
  simulateOutageActive: boolean;
  updatedBy: string | null;
  updatedAt: string | null;
}

export const ANALYTICS_V2_SQLITE_DDL = `
CREATE TABLE IF NOT EXISTS dcc_analytics_runtime_controls (
  control_key TEXT PRIMARY KEY,
  bool_value INTEGER NOT NULL DEFAULT 0,
  str_value TEXT,
  updated_by TEXT,
  updated_at TEXT NOT NULL
);

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
  claimed_by TEXT,
  claim_expires_at TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  payload_json TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_analytics_queue_status_seq ON dcc_analytics_ingest_queue(status, claim_expires_at, queue_seq);

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
let activePgPool: Pool | null = null;
let activePgUrl: string | null = null;
let simulateAnalyticsStoreOutageInMemory = false;

let runtimeControlsCache: {
  expiresAtMs: number;
  value: AnalyticsRuntimeControls;
} | null = null;

const RUNTIME_CONTROL_CACHE_TTL_MS = 1_500;

export function setSimulateAnalyticsStoreOutageForTests(enabled: boolean): void {
  simulateAnalyticsStoreOutageInMemory = enabled;
  runtimeControlsCache = null;
}

export function isAnalyticsStoreOutageSimulated(): boolean {
  return simulateAnalyticsStoreOutageInMemory;
}

/**
 * Strict backend resolution:
 * - Deployed runtimes (`process.env.VERCEL`) or `DCC_ANALYTICS_BACKEND=postgres` ALWAYS require PostgreSQL.
 * - SQLite is ONLY permitted in local non-deployed unit tests (`DCC_ANALYTICS_BACKEND=sqlite`, `DCC_ISOLATED_TEST_DB=1`, `NODE_ENV=test`, or explicit `DCC_ANALYTICS_SQLITE_PATH`).
 * - NEVER silently falls back from PostgreSQL to SQLite!
 */
export function resolveAnalyticsBackendMode(): AnalyticsBackendMode {
  const explicit = (process.env.DCC_ANALYTICS_BACKEND || "").trim().toLowerCase();
  if (explicit === "postgres") return "postgres";

  // Deployed Vercel functions (Preview or Production) MUST NEVER use local SQLite
  if (process.env.VERCEL || process.env.VERCEL_ENV) {
    if (explicit === "sqlite") {
      throw new AnalyticsStoreUnavailableError(
        "SQLITE_FORBIDDEN_IN_DEPLOYED_RUNTIME",
        "SQLite analytics backend is strictly forbidden in deployed Vercel runtimes.",
      );
    }
    return "postgres";
  }

  if (
    explicit === "sqlite" ||
    Boolean(process.env.DCC_ANALYTICS_SQLITE_PATH?.trim()) ||
    process.env.DCC_ISOLATED_TEST_DB === "1" ||
    process.env.NODE_ENV === "test"
  ) {
    return "sqlite_local_test";
  }

  return "postgres";
}

export function resolveAnalyticsPostgresConnection(): {
  connectionString: string;
  databaseName: string;
} {
  const explicitAnalyticsUrl = (
    process.env.DCC_ANALYTICS_DATABASE_URL ||
    process.env.DCC_NONPROD_DATABASE_URL ||
    ""
  ).trim();

  const resolved = explicitAnalyticsUrl || resolveDatabaseUrl();
  if (!resolved) {
    throw new AnalyticsStoreUnavailableError(
      "POSTGRES_UNCONFIGURED",
      "Analytics PostgreSQL backend is required, but no database connection string is configured (refusing silent SQLite fallback).",
    );
  }

  let parsed: URL;
  try {
    parsed = new URL(resolved);
  } catch {
    throw new AnalyticsStoreUnavailableError(
      "POSTGRES_INVALID_URL",
      "Configured analytics PostgreSQL URL is malformed.",
    );
  }

  const dbName = parsed.pathname.replace(/^\//, "") || "unknown";
  const isVercelProd =
    process.env.VERCEL_ENV?.trim().toLowerCase() === "production" &&
    process.env.DCC_ANALYTICS_ALLOW_PROD_DB === "1";

  // Hard Production Guard: Preview / local / nonprod runtimes MUST connect to nonprod DB (`neondb_nonprod`), NEVER Production `neondb`!
  if (!isVercelProd && dbName === "neondb") {
    parsed.pathname = "/neondb_nonprod";
    return {
      connectionString: parsed.toString(),
      databaseName: "neondb_nonprod",
    };
  }

  return {
    connectionString: parsed.toString(),
    databaseName: dbName,
  };
}

export function describeActiveAnalyticsBackend(): {
  backend: AnalyticsBackendMode;
  databaseName: string;
} {
  try {
    const mode = resolveAnalyticsBackendMode();
    if (mode === "sqlite_local_test") {
      return { backend: "sqlite_local_test", databaseName: "sqlite_local_test" };
    }
    const pg = resolveAnalyticsPostgresConnection();
    return { backend: "postgres", databaseName: pg.databaseName };
  } catch {
    return { backend: "postgres", databaseName: "unavailable" };
  }
}

export function getAnalyticsPgPool(): { pool: Pool; databaseName: string } {
  if (simulateAnalyticsStoreOutageInMemory) {
    throw new AnalyticsStoreUnavailableError(
      "SIMULATED_STORE_OUTAGE",
      "ANALYTICS_STORE_UNAVAILABLE: Simulated collector/storage outage",
    );
  }
  const { connectionString, databaseName } = resolveAnalyticsPostgresConnection();
  if (activePgPool && activePgUrl === connectionString) {
    return { pool: activePgPool, databaseName };
  }
  if (activePgPool) {
    activePgPool.end().catch(() => undefined);
    activePgPool = null;
    activePgUrl = null;
  }
  activePgPool = new Pool({
    connectionString,
    max: 6,
    connectionTimeoutMillis: 4_000,
    idleTimeoutMillis: 15_000,
  });
  activePgUrl = connectionString;
  return { pool: activePgPool, databaseName };
}

export async function closeAnalyticsPgPool(): Promise<void> {
  if (activePgPool) {
    const p = activePgPool;
    activePgPool = null;
    activePgUrl = null;
    await p.end().catch(() => undefined);
  }
}

export function resolveAnalyticsSqlitePath(): string {
  if (process.env.VERCEL || process.env.VERCEL_ENV) {
    throw new AnalyticsStoreUnavailableError(
      "SQLITE_FORBIDDEN_IN_DEPLOYED_RUNTIME",
      "SQLite analytics path resolution is forbidden in deployed runtimes.",
    );
  }
  const explicit = process.env.DCC_ANALYTICS_SQLITE_PATH?.trim();
  if (explicit) return explicit === ":memory:" ? ":memory:" : path.resolve(explicit);

  const dir = path.join(os.tmpdir(), "dcc-analytics-v2-tests");
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, `dcc-analytics-test-${process.pid}.sqlite`);
}

export function getAnalyticsSqliteDb(): SqliteDatabaseSync {
  if (simulateAnalyticsStoreOutageInMemory) {
    throw new AnalyticsStoreUnavailableError(
      "SIMULATED_STORE_OUTAGE",
      "ANALYTICS_STORE_UNAVAILABLE: Simulated collector/storage outage",
    );
  }
  if (resolveAnalyticsBackendMode() !== "sqlite_local_test") {
    throw new AnalyticsStoreUnavailableError(
      "SQLITE_NOT_ACTIVE_BACKEND",
      "Attempted to open local-test SQLite while PostgreSQL backend is active.",
    );
  }

  const targetPath = resolveAnalyticsSqlitePath();
  if (activeSqliteDb && activeSqlitePath === targetPath) {
    return activeSqliteDb;
  }

  if (activeSqliteDb) {
    try {
      activeSqliteDb.close();
    } catch {
      // ignore
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
      // ignore
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
  runtimeControlsCache = null;
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

/**
 * Unified SQL execution interface supporting real Neon PostgreSQL (`Pool` / `PoolClient`)
 * in deployed/nonprod runtimes and `node:sqlite` strictly in local unit tests.
 */
export interface AnalyticsQueryExecutor {
  readonly backend: AnalyticsBackendMode;
  readonly databaseName: string;
  query<T extends Record<string, unknown> = Record<string, unknown>>(
    pgSql: string,
    params?: unknown[],
  ): Promise<{ rows: T[]; rowCount: number }>;
  advisoryXactLock(lockKey: string): Promise<void>;
}

function compilePgSqlToSqlite(
  pgSql: string,
  params: unknown[] = [],
): { sqliteSql: string; sqliteParams: unknown[] } {
  const sqliteParams: unknown[] = [];
  let sqliteSql = pgSql
    .replace(/::timestamptz\b/gi, "")
    .replace(/::jsonb\b/gi, "")
    .replace(/::text\b/gi, "")
    .replace(/::bigint\b/gi, "")
    .replace(/::numeric(?:\(\d+,\s*\d+\))?\b/gi, "")
    .replace(/\bFOR\s+UPDATE\s+SKIP\s+LOCKED\b/gi, "");

  sqliteSql = sqliteSql.replace(/\$(\d+)/g, (_match, idxStr) => {
    const idx = Number(idxStr) - 1;
    const rawVal = params[idx];
    if (typeof rawVal === "boolean") {
      sqliteParams.push(rawVal ? 1 : 0);
    } else if (rawVal !== null && typeof rawVal === "object" && !(rawVal instanceof Uint8Array)) {
      sqliteParams.push(JSON.stringify(rawVal));
    } else {
      sqliteParams.push(rawVal ?? null);
    }
    return "?";
  });

  return { sqliteSql, sqliteParams };
}

function createPgExecutor(
  clientOrPool: Pool | PoolClient,
  databaseName: string,
): AnalyticsQueryExecutor {
  return {
    backend: "postgres",
    databaseName,
    async query<T extends Record<string, unknown> = Record<string, unknown>>(
      pgSql: string,
      params: unknown[] = [],
    ): Promise<{ rows: T[]; rowCount: number }> {
      const t0 = performance.now();
      const res = await clientOrPool.query(pgSql, params);
      const elapsed = performance.now() - t0;
      const rows = (res.rows || []) as T[];
      recordQueryTelemetry("postgres", databaseName, rows, elapsed);
      return {
        rows,
        rowCount: typeof res.rowCount === "number" ? res.rowCount : rows.length,
      };
    },
    async advisoryXactLock(lockKey: string): Promise<void> {
      const t0 = performance.now();
      await clientOrPool.query("SELECT pg_advisory_xact_lock(hashtext($1))", [lockKey]);
      recordQueryTelemetry("postgres", databaseName, [], performance.now() - t0);
    },
  };
}

function createSqliteExecutor(db: SqliteDatabaseSync): AnalyticsQueryExecutor {
  return {
    backend: "sqlite_local_test",
    databaseName: "sqlite_local_test",
    async query<T extends Record<string, unknown> = Record<string, unknown>>(
      pgSql: string,
      params: unknown[] = [],
    ): Promise<{ rows: T[]; rowCount: number }> {
      const t0 = performance.now();
      const { sqliteSql, sqliteParams } = compilePgSqlToSqlite(pgSql, params);
      const trimmed = sqliteSql.trim();
      const isReader =
        /^(SELECT|WITH)\b/i.test(trimmed) || /\bRETURNING\b/i.test(trimmed);
      if (isReader) {
        const rows = db.prepare(sqliteSql).all(...sqliteParams) as T[];
        recordQueryTelemetry("sqlite_local_test", "sqlite_local_test", rows, performance.now() - t0);
        return { rows, rowCount: rows.length };
      }
      const res = db.prepare(sqliteSql).run(...sqliteParams);
      recordQueryTelemetry("sqlite_local_test", "sqlite_local_test", [], performance.now() - t0);
      return { rows: [], rowCount: Number(res.changes || 0) };
    },
    async advisoryXactLock(): Promise<void> {
      // SQLite uses BEGIN IMMEDIATE database-level write serialization
    },
  };
}

export async function getAnalyticsExecutor(): Promise<AnalyticsQueryExecutor> {
  const mode = resolveAnalyticsBackendMode();
  if (mode === "sqlite_local_test") {
    return createSqliteExecutor(getAnalyticsSqliteDb());
  }
  const { pool, databaseName } = getAnalyticsPgPool();
  return createPgExecutor(pool, databaseName);
}

export async function withAnalyticsTransaction<T>(
  fn: (tx: AnalyticsQueryExecutor) => Promise<T>,
): Promise<T> {
  const mode = resolveAnalyticsBackendMode();
  if (mode === "sqlite_local_test") {
    const db = getAnalyticsSqliteDb();
    const tx = createSqliteExecutor(db);
    db.exec("BEGIN IMMEDIATE TRANSACTION;");
    try {
      const out = await fn(tx);
      db.exec("COMMIT;");
      return out;
    } catch (err) {
      try {
        db.exec("ROLLBACK;");
      } catch {
        // ignore
      }
      throw err;
    }
  }

  const { pool, databaseName } = getAnalyticsPgPool();
  const client = await pool.connect();
  try {
    const t0 = performance.now();
    await client.query("BEGIN");
    recordQueryTelemetry("postgres", databaseName, [], performance.now() - t0);
    const tx = createPgExecutor(client, databaseName);
    const out = await fn(tx);
    const t1 = performance.now();
    await client.query("COMMIT");
    recordQueryTelemetry("postgres", databaseName, [], performance.now() - t1);
    return out;
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // ignore
    }
    throw err;
  } finally {
    client.release();
  }
}

export function normalizeSqlIso(val: unknown): string | null {
  if (!val) return null;
  if (val instanceof Date) return val.toISOString();
  const str = String(val).trim();
  if (!str) return null;
  const ms = Date.parse(str);
  return Number.isFinite(ms) ? new Date(ms).toISOString() : str;
}

export function normalizeSqlJson<T>(val: unknown, fallback: T): T {
  if (val === null || val === undefined) return fallback;
  if (typeof val === "string") {
    try {
      return JSON.parse(val) as T;
    } catch {
      return fallback;
    }
  }
  if (typeof val === "object") return val as T;
  return fallback;
}

function isEnvKillSwitchHardEnabled(): boolean {
  const raw = (
    process.env.DCC_ANALYTICS_KILL_SWITCH ||
    process.env.DCC_ANALYTICS_DISABLE_COLLECTION ||
    ""
  )
    .trim()
    .toLowerCase();
  return raw === "1" || raw === "true" || raw === "on" || raw === "yes";
}

/**
 * Genuine runtime kill-switch & outage control reader (`1.5s` in-process cache TTL,
 * backed by `dcc_analytics_runtime_controls` in Postgres so toggling takes effect
 * cluster-wide in `<= 1.5s` without redeploying!).
 */
export async function getAnalyticsRuntimeControls(options?: {
  bypassCache?: boolean;
}): Promise<AnalyticsRuntimeControls> {
  if (isEnvKillSwitchHardEnabled()) {
    return {
      killSwitchActive: true,
      killSwitchSource: "env_override",
      simulateOutageActive: simulateAnalyticsStoreOutageInMemory,
      updatedBy: "env:DCC_ANALYTICS_KILL_SWITCH",
      updatedAt: null,
    };
  }

  const nowMs = Date.now();
  if (!options?.bypassCache && runtimeControlsCache && runtimeControlsCache.expiresAtMs > nowMs) {
    return {
      ...runtimeControlsCache.value,
      simulateOutageActive:
        simulateAnalyticsStoreOutageInMemory || runtimeControlsCache.value.simulateOutageActive,
    };
  }

  if (simulateAnalyticsStoreOutageInMemory) {
    return {
      killSwitchActive: false,
      killSwitchSource: "off",
      simulateOutageActive: true,
      updatedBy: "in_memory_test_hook",
      updatedAt: null,
    };
  }

  try {
    const exec = await getAnalyticsExecutor();
    const { rows } = await exec.query<{
      control_key: string;
      bool_value: boolean | number;
      updated_by: string | null;
      updated_at: Date | string | null;
    }>(
      "SELECT control_key, bool_value, updated_by, updated_at FROM dcc_analytics_runtime_controls WHERE control_key IN ('kill_switch_active', 'simulate_store_outage')",
    );

    let killActive = false;
    let simOutage = false;
    let updatedBy: string | null = null;
    let updatedAt: string | null = null;

    for (const r of rows) {
      const b = r.bool_value === true || r.bool_value === 1;
      if (r.control_key === "kill_switch_active") {
        killActive = b;
        updatedBy = r.updated_by ? String(r.updated_by) : null;
        updatedAt = normalizeSqlIso(r.updated_at);
      } else if (r.control_key === "simulate_store_outage") {
        simOutage = b;
      }
    }

    const resolved: AnalyticsRuntimeControls = {
      killSwitchActive: killActive,
      killSwitchSource: killActive ? "runtime_db" : "off",
      simulateOutageActive: simOutage,
      updatedBy,
      updatedAt,
    };
    runtimeControlsCache = {
      expiresAtMs: nowMs + RUNTIME_CONTROL_CACHE_TTL_MS,
      value: resolved,
    };
    return resolved;
  } catch {
    return {
      killSwitchActive: false,
      killSwitchSource: "off",
      simulateOutageActive: simulateAnalyticsStoreOutageInMemory,
      updatedBy: null,
      updatedAt: null,
    };
  }
}

export async function setAnalyticsRuntimeControls(params: {
  killSwitchActive?: boolean;
  simulateOutageActive?: boolean;
  actor: string;
}): Promise<AnalyticsRuntimeControls> {
  const nowIso = new Date().toISOString();
  // Temporarily bypass simulated outage so an admin can clear `simulate_store_outage` via API!
  const prevInMem = simulateAnalyticsStoreOutageInMemory;
  simulateAnalyticsStoreOutageInMemory = false;
  try {
    const exec = await getAnalyticsExecutor();
    if (typeof params.killSwitchActive === "boolean") {
      await exec.query(
        `INSERT INTO dcc_analytics_runtime_controls (control_key, bool_value, updated_by, updated_at)
         VALUES ('kill_switch_active', $1, $2, $3::timestamptz)
         ON CONFLICT (control_key) DO UPDATE SET
           bool_value = excluded.bool_value,
           updated_by = excluded.updated_by,
           updated_at = excluded.updated_at`,
        [params.killSwitchActive, params.actor, nowIso],
      );
    }
    if (typeof params.simulateOutageActive === "boolean") {
      await exec.query(
        `INSERT INTO dcc_analytics_runtime_controls (control_key, bool_value, updated_by, updated_at)
         VALUES ('simulate_store_outage', $1, $2, $3::timestamptz)
         ON CONFLICT (control_key) DO UPDATE SET
           bool_value = excluded.bool_value,
           updated_by = excluded.updated_by,
           updated_at = excluded.updated_at`,
        [params.simulateOutageActive, params.actor, nowIso],
      );
    }
    runtimeControlsCache = null;
    return await getAnalyticsRuntimeControls({ bypassCache: true });
  } finally {
    simulateAnalyticsStoreOutageInMemory = prevInMem;
  }
}

export async function ensureAnalyticsStoreAvailable(): Promise<AnalyticsQueryExecutor> {
  if (simulateAnalyticsStoreOutageInMemory) {
    throw new AnalyticsStoreUnavailableError(
      "SIMULATED_STORE_OUTAGE",
      "ANALYTICS_STORE_UNAVAILABLE: Simulated collector/storage outage",
    );
  }
  const controls = await getAnalyticsRuntimeControls();
  if (controls.simulateOutageActive) {
    throw new AnalyticsStoreUnavailableError(
      "RUNTIME_SIMULATED_OUTAGE",
      "ANALYTICS_STORE_UNAVAILABLE: Runtime simulated database outage is active",
    );
  }
  return getAnalyticsExecutor();
}

export async function incrementHealthCounter(
  exec: AnalyticsQueryExecutor,
  key: string,
  delta = 1,
  nowIso = new Date().toISOString(),
): Promise<void> {
  if (delta === 0) return;
  await exec.query(
    `INSERT INTO dcc_analytics_health_counters (counter_key, counter_value, updated_at)
     VALUES ($1, $2, $3::timestamptz)
     ON CONFLICT (counter_key) DO UPDATE SET
       counter_value = dcc_analytics_health_counters.counter_value + excluded.counter_value,
       updated_at = excluded.updated_at`,
    [key, delta, nowIso],
  );
}

export async function readAnalyticsHealthCounters(
  exec: AnalyticsQueryExecutor,
): Promise<AnalyticsHealthCounters> {
  const { rows } = await exec.query<{ counter_key: string; counter_value: string | number }>(
    "SELECT counter_key, counter_value FROM dcc_analytics_health_counters",
  );
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

export async function getPendingQueueDepth(exec: AnalyticsQueryExecutor): Promise<number> {
  const { rows } = await exec.query<{ cnt: string | number }>(
    "SELECT COUNT(*) AS cnt FROM dcc_analytics_ingest_queue WHERE status IN ('queued', 'processing')",
  );
  return Number(rows[0]?.cnt || 0);
}

export async function readAnalyticsWatermarkState(
  exec: AnalyticsQueryExecutor,
  scopeKey = "primary",
): Promise<AnalyticsWatermarkState> {
  const wmRes = await exec.query<{
    processed_through_iso: string | Date | null;
    last_queue_seq: string | number | null;
    last_worker_success_at: string | Date | null;
    last_worker_duration_ms: number | string | null;
  }>(
    "SELECT processed_through_iso, last_queue_seq, last_worker_success_at, last_worker_duration_ms FROM dcc_analytics_watermarks WHERE scope_key = $1",
    [scopeKey],
  );
  const wm = wmRes.rows[0];

  const qRes = await exec.query<{ pending_cnt: string | number | null; dl_cnt: string | number | null }>(
    `SELECT
       COALESCE(SUM(CASE WHEN status IN ('queued', 'processing') THEN 1 ELSE 0 END), 0) AS pending_cnt,
       COALESCE(SUM(CASE WHEN status = 'dead_letter' THEN 1 ELSE 0 END), 0) AS dl_cnt
     FROM dcc_analytics_ingest_queue`,
  );
  const qRow = qRes.rows[0];

  return {
    processedThroughIso: normalizeSqlIso(wm?.processed_through_iso),
    lastQueueSeq: Number(wm?.last_queue_seq || 0),
    lastWorkerSuccessAt: normalizeSqlIso(wm?.last_worker_success_at),
    lastWorkerRunDurationMs:
      wm?.last_worker_duration_ms !== null && wm?.last_worker_duration_ms !== undefined
        ? Number(wm.last_worker_duration_ms)
        : null,
    pendingQueueDepth: Number(qRow?.pending_cnt || 0),
    deadLetterCount: Number(qRow?.dl_cnt || 0),
  };
}

export async function enqueueNormalizedAnalyticsBatch(params: {
  records: NormalizedAnalyticsRecord[];
  maxQueueDepth?: number;
}): Promise<{
  queuedCount: number;
  deduplicatedCount: number;
  droppedBackpressureCount: number;
}> {
  const maxQueueDepth = params.maxQueueDepth ?? 50_000;
  await ensureAnalyticsStoreAvailable();
  const nowIso = new Date().toISOString();

  return withAnalyticsTransaction(async (tx) => {
    const currentDepth = await getPendingQueueDepth(tx);
    let projectedDepth = currentDepth;
    let queuedCount = 0;
    let deduplicatedCount = 0;
    let droppedBackpressureCount = 0;
    let botCount = 0;
    let qaCount = 0;

    for (const rec of params.records) {
      if (rec.trafficClass === "known_bot") botCount += 1;
      if (rec.trafficClass === "qa_or_synthetic") qaCount += 1;

      const effectiveCeiling =
        rec.layer === "trip_lifecycle" ? Math.floor(maxQueueDepth * 1.2) : maxQueueDepth;
      if (projectedDepth >= effectiveCeiling) {
        droppedBackpressureCount += 1;
        continue;
      }

      const res = await tx.query<{ queue_seq: string | number }>(
        `INSERT INTO dcc_analytics_ingest_queue (
           logical_event_id, delivery_id, environment, site_id, event_type,
           traffic_class, occurred_at, received_at, status, attempts, payload_json
         ) VALUES ($1, $2, $3, $4, $5, $6, $7::timestamptz, $8::timestamptz, 'queued', 0, $9::jsonb)
         ON CONFLICT (logical_event_id) DO NOTHING
         RETURNING queue_seq`,
        [
          rec.logicalEventId,
          rec.deliveryId,
          rec.environment,
          rec.siteId,
          rec.eventType,
          rec.trafficClass,
          rec.occurredAt,
          rec.receivedAt,
          JSON.stringify(rec),
        ],
      );

      if (res.rows.length > 0) {
        queuedCount += 1;
        projectedDepth += 1;
      } else {
        deduplicatedCount += 1;
      }
    }

    await incrementHealthCounter(tx, "received_total", params.records.length, nowIso);
    await incrementHealthCounter(tx, "queued_total", queuedCount, nowIso);
    await incrementHealthCounter(tx, "deduplicated_ingest_total", deduplicatedCount, nowIso);
    await incrementHealthCounter(tx, "dropped_backpressure_total", droppedBackpressureCount, nowIso);
    await incrementHealthCounter(tx, "bot_classified_total", botCount, nowIso);
    await incrementHealthCounter(tx, "qa_classified_total", qaCount, nowIso);

    return {
      queuedCount,
      deduplicatedCount,
      droppedBackpressureCount,
    };
  });
}
