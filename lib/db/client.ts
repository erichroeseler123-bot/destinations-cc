import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "@/lib/db/schema";
import { LIVE_CORRIDOR_CATALOG } from "@/lib/dcc/telemetry/corridorCatalog";

const randomUUID = () => globalThis.crypto.randomUUID();

export type DccDb = NeonHttpDatabase<typeof schema>;

let cachedDb: DccDb | null | undefined;
let cachedConnectionKey: string | undefined;

export function hasConfiguredDatabaseUrl() {
  return Boolean(resolveDatabaseUrl());
}

export type DatabaseIdentitySummary = {
  hostPrefix: string;
  databaseName: string;
  databaseRole: string;
  sharedClusterEndpoint: boolean;
  credentialLevelIsolation: boolean;
  targetEnvironment: "production" | "nonprod";
  productionTarget: boolean;
  isIsolatedFromProduction: boolean;
};

export function isProductionDatabaseTarget(): boolean {
  const explicitDbTarget = (
    process.env.DCC_TARGET_DB ||
    process.env.DCC_EARTHOS_ENV ||
    ""
  )
    .trim()
    .toLowerCase();
  if (explicitDbTarget === "production") return true;
  if (
    explicitDbTarget === "nonprod" ||
    explicitDbTarget === "preview" ||
    explicitDbTarget === "development" ||
    explicitDbTarget === "test"
  ) {
    return false;
  }

  const candidateUrl = (
    process.env.DCC_PRODUCTION_DATABASE_URL ||
    process.env.DCC_NONPROD_DATABASE_URL ||
    process.env.DCC_DATABASE_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    ""
  ).trim();
  if (
    !process.env.DCC_PRODUCTION_DATABASE_URL &&
    (candidateUrl.includes("dcc_nonprod_app") || candidateUrl.includes("/neondb_nonprod"))
  ) {
    return false;
  }

  const explicitScope = (process.env.DCC_ENVIRONMENT_SCOPE || "").trim().toLowerCase();
  if (
    explicitScope === "nonprod" ||
    explicitScope === "preview" ||
    explicitScope === "development" ||
    explicitScope === "test"
  ) {
    return false;
  }
  if (explicitScope === "production") return true;

  return process.env.VERCEL_ENV?.trim().toLowerCase() === "production";
}

export function resolveDatabaseUrl(): string {
  const baseConfigured = (
    process.env.DCC_DATABASE_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    ""
  ).trim();
  if (!baseConfigured && !process.env.DCC_TARGET_DB) {
    return "";
  }
  const isProdTarget = isProductionDatabaseTarget();
  const raw = (
    (isProdTarget
      ? process.env.DCC_PRODUCTION_DATABASE_URL || process.env.DCC_DATABASE_URL
      : process.env.DCC_NONPROD_DATABASE_URL || process.env.DCC_DATABASE_URL) ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    ""
  ).trim();

  if (!raw) return "";

  try {
    const parsed = new URL(raw);
    const currentDb = parsed.pathname.replace(/^\//, "");
    const username = decodeURIComponent(parsed.username || "").toLowerCase();
    if (!isProdTarget && currentDb === "neondb") {
      parsed.pathname = "/neondb_nonprod";
      return parsed.toString();
    }
    if (isProdTarget && currentDb === "neondb_nonprod" && !username.includes("nonprod")) {
      parsed.pathname = "/neondb";
      return parsed.toString();
    }
    return parsed.toString();
  } catch {
    return raw;
  }
}

export function getResolvedDatabaseIdentity(): DatabaseIdentitySummary {
  const resolved = resolveDatabaseUrl();
  const productionTarget = isProductionDatabaseTarget();
  const targetEnvironment: "production" | "nonprod" = productionTarget
    ? "production"
    : "nonprod";
  if (!resolved) {
    return {
      hostPrefix: "unconfigured",
      databaseName: "unconfigured",
      databaseRole: "unconfigured",
      sharedClusterEndpoint: true,
      credentialLevelIsolation: false,
      targetEnvironment,
      productionTarget,
      isIsolatedFromProduction: false,
    };
  }
  try {
    const parsed = new URL(resolved);
    const databaseName = parsed.pathname.replace(/^\//, "") || "unknown";
    const databaseRole = decodeURIComponent(parsed.username || "unknown");
    const credentialLevelIsolation =
      databaseName === "neondb_nonprod" && databaseRole === "dcc_nonprod_app";
    return {
      hostPrefix: parsed.hostname.split(".")[0] || "unknown",
      databaseName,
      databaseRole,
      sharedClusterEndpoint: true,
      credentialLevelIsolation,
      targetEnvironment,
      productionTarget,
      isIsolatedFromProduction:
        databaseName === "neondb_nonprod" && credentialLevelIsolation,
    };
  } catch {
    return {
      hostPrefix: "invalid-url",
      databaseName: "unknown",
      databaseRole: "unknown",
      sharedClusterEndpoint: true,
      credentialLevelIsolation: false,
      targetEnvironment,
      productionTarget,
      isIsolatedFromProduction: false,
    };
  }
}

const CONTEXT_COLS = [
  "context_id",
  "context_hash",
  "idempotency_key",
  "version",
  "status",
  "source_site",
  "destination",
  "target_owner",
  "target_intent",
  "timezone",
  "schedule_date",
  "arrival",
  "departure",
  "travelers",
  "ship_or_venue",
  "buffer_minutes",
  "latest_safe_return_date",
  "latest_safe_return_time",
  "midnight_crossed",
  "attribution",
  "issued_at",
  "expires_at",
  "redeemed_at",
  "redeemed_by",
  "created_at",
  "updated_at",
] as const;

const SESSION_COLS = [
  "session_id",
  "context_id",
  "owner",
  "reason",
  "invalidated_at",
  "expires_at",
] as const;

const CATALOG_COLS = [
  "corridor_id",
  "corridor_name",
  "family",
  "app_path",
  "status",
  "continuity_level",
  "pattern_family",
  "created_at",
  "updated_at",
] as const;

const EVENT_COLS = [
  "event_id",
  "occurred_at",
  "corridor_id",
  "family",
  "event_name",
  "handoff_id",
  "session_id",
  "user_id",
  "source_page",
  "landing_path",
  "target_path",
  "requested_lane",
  "resolved_lane",
  "topic",
  "subtype",
  "port",
  "handoff_date",
  "default_card_slug",
  "clicked_product_slug",
  "route_target",
  "fit_signal",
  "urgency",
  "confidence_downgraded",
  "winning_rule_ids",
  "winning_fields",
  "page_variant",
  "metadata",
] as const;

function parseInsertValues(sqlText: string, params: unknown[], columns: readonly string[]): Record<string, any> {
  const valuesIdx = sqlText.search(/\bvalues\s*\(/i);
  const openParen = sqlText.indexOf("(", valuesIdx);
  let depth = 0;
  let closeParen = -1;
  for (let i = openParen; i < sqlText.length; i++) {
    if (sqlText[i] === "(") depth++;
    else if (sqlText[i] === ")") {
      depth--;
      if (depth === 0) {
        closeParen = i;
        break;
      }
    }
  }
  const inner = sqlText.slice(openParen + 1, closeParen);
  const tokens: string[] = [];
  let cur = "";
  let inQuotes = false;
  let pDepth = 0;
  for (let i = 0; i < inner.length; i++) {
    const ch = inner[i];
    if (ch === "'") inQuotes = !inQuotes;
    if (!inQuotes) {
      if (ch === "(") pDepth++;
      else if (ch === ")") pDepth--;
      else if (ch === "," && pDepth === 0) {
        tokens.push(cur.trim());
        cur = "";
        continue;
      }
    }
    cur += ch;
  }
  if (cur.trim()) tokens.push(cur.trim());

  const row: Record<string, any> = {};
  const nowIso = new Date().toISOString();
  columns.forEach((col, idx) => {
    const tok = tokens[idx] ?? "null";
    const paramMatch = tok.match(/^\$(\d+)$/);
    if (paramMatch) {
      let val: any = params[Number(paramMatch[1]) - 1];
      if (
        (col === "attribution" || col === "winning_fields" || col === "metadata") &&
        typeof val === "string"
      ) {
        try {
          val = JSON.parse(val);
        } catch {}
      }
      row[col] = val;
    } else if (/^default$/i.test(tok)) {
      if (col === "event_id") row[col] = randomUUID();
      else if (col.endsWith("_at")) row[col] = nowIso;
      else if (col === "version") row[col] = "1.0";
      else if (col === "status") row[col] = "issued";
      else if (col === "travelers") row[col] = 1;
      else if (col === "buffer_minutes") row[col] = 0;
      else if (col === "midnight_crossed" || col === "confidence_downgraded") row[col] = false;
      else if (col === "winning_rule_ids") row[col] = [];
      else if (col === "winning_fields" || col === "metadata") row[col] = {};
      else row[col] = null;
    } else {
      row[col] = null;
    }
  });
  return row;
}

function formatResult(
  rowsObj: Record<string, any>[],
  cols: readonly string[],
  options?: { arrayMode?: boolean }
) {
  if (options?.arrayMode) {
    return {
      rows: rowsObj.map((r) => cols.map((c) => r[c])),
      fields: cols.map((name) => ({ name })),
      rowCount: rowsObj.length,
    };
  }
  return {
    rows: rowsObj,
    rowCount: rowsObj.length,
  };
}

function createInMemoryTestDb(): DccDb {
  const contexts: Record<string, any>[] = [];
  const sessions: Record<string, any>[] = [];
  const catalog = new Map<string, Record<string, any>>();
  const events: Record<string, any>[] = [];

  const nowIso = new Date().toISOString();
  for (const entry of LIVE_CORRIDOR_CATALOG) {
    catalog.set(entry.corridorId, {
      corridor_id: entry.corridorId,
      corridor_name: entry.corridorName,
      family: entry.family,
      app_path: entry.appPath,
      status: entry.status,
      continuity_level: entry.continuityLevel,
      pattern_family: entry.patternFamily ?? null,
      created_at: nowIso,
      updated_at: nowIso,
    });
  }

  const client = async (queryText: string, params: any[] = [], options?: any) => {
    const q = queryText.trim();
    const qLower = q.toLowerCase();

    if (
      (qLower.startsWith("create table") ||
        qLower.startsWith("create index") ||
        qLower.startsWith("create unique index")) &&
      !sqliteBackedTablesRegex.test(qLower)
    ) {
      return formatResult([], [], options);
    }

    // 1. dcc_corridor_catalog
    if (qLower.includes('"dcc_corridor_catalog"')) {
      if (qLower.startsWith("insert into")) {
        const row = parseInsertValues(q, params, CATALOG_COLS);
        catalog.set(row.corridor_id, row);
        return formatResult([row], CATALOG_COLS, options);
      }
      if (qLower.startsWith("select")) {
        let rows = Array.from(catalog.values());
        if (qLower.includes('where "dcc_corridor_catalog"."corridor_id" = $1')) {
          rows = rows.filter((r) => r.corridor_id === params[0]);
        }
        return formatResult(rows, CATALOG_COLS, options);
      }
    }

    // 2. dcc_corridor_events
    if (qLower.includes('"dcc_corridor_events"')) {
      if (qLower.startsWith("insert into")) {
        const row = parseInsertValues(q, params, EVENT_COLS);
        events.push(row);
        return formatResult([row], EVENT_COLS, options);
      }
      if (qLower.startsWith("delete from")) {
        if (qLower.includes('"session_id" = $1')) {
          for (let i = events.length - 1; i >= 0; i--) {
            if (events[i].session_id === params[0]) events.splice(i, 1);
          }
        }
        return formatResult([], EVENT_COLS, options);
      }
      if (qLower.startsWith("select")) {
        let rows = [...events];
        if (qLower.includes('"session_id" = $1')) {
          rows = rows.filter((r) => r.session_id === params[0]);
        }
        if (qLower.includes("order by")) {
          rows.sort(
            (a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime()
          );
        }
        if (qLower.includes("limit $1")) {
          rows = rows.slice(0, Number(params[0]) || 5000);
        }
        return formatResult(rows, EVENT_COLS, options);
      }
    }

    // 3. dcc_invalidated_sessions
    if (qLower.includes('"dcc_invalidated_sessions"')) {
      if (qLower.startsWith("insert into")) {
        const row = parseInsertValues(q, params, SESSION_COLS);
        const existingIdx = sessions.findIndex((s) => s.session_id === row.session_id);
        if (existingIdx >= 0) {
          if (!qLower.includes("on conflict do nothing")) {
            sessions[existingIdx] = row;
          }
        } else {
          sessions.push(row);
        }
        return formatResult([row], SESSION_COLS, options);
      }
      if (qLower.startsWith("select")) {
        let rows = [...sessions];
        if (qLower.includes('"session_id" = $1')) {
          const cutoffMs = params[1] ? new Date(params[1]).getTime() : -Infinity;
          rows = rows.filter(
            (s) => s.session_id === params[0] && new Date(s.expires_at).getTime() >= cutoffMs
          );
        }
        return formatResult(rows, SESSION_COLS, options);
      }
      if (qLower.startsWith("delete from")) {
        const cutoffMs = params[0] ? new Date(params[0]).getTime() : Infinity;
        const removed: Record<string, any>[] = [];
        for (let i = sessions.length - 1; i >= 0; i--) {
          if (new Date(sessions[i].expires_at).getTime() <= cutoffMs) {
            removed.push(sessions[i]);
            sessions.splice(i, 1);
          }
        }
        return formatResult(removed, ["session_id"], options);
      }
    }

    // 4. dcc_contexts
    if (qLower.includes('"dcc_contexts"')) {
      if (qLower.startsWith("insert into")) {
        const row = parseInsertValues(q, params, CONTEXT_COLS);
        if (
          row.idempotency_key &&
          contexts.some((c) => c.idempotency_key === row.idempotency_key)
        ) {
          const err: any = new Error(
            'duplicate key value violates unique constraint "dcc_contexts_idempotency_uidx"'
          );
          err.code = "23505";
          throw err;
        }
        if (contexts.some((c) => c.context_hash === row.context_hash)) {
          const err: any = new Error(
            'duplicate key value violates unique constraint "dcc_contexts_hash_uidx"'
          );
          err.code = "23505";
          throw err;
        }
        contexts.push(row);
        return formatResult([row], CONTEXT_COLS, options);
      }

      if (qLower.startsWith("update")) {
        if (qLower.includes('"redeemed_at" =') && qLower.includes('"context_id" =')) {
          const [nextStatus, redeemedAt, redeemedBy, targetContextId] = params;
          const matched = contexts.filter((c) => c.context_id === targetContextId);
          for (const c of matched) {
            c.status = nextStatus;
            c.redeemed_at = redeemedAt;
            c.redeemed_by = redeemedBy;
          }
          return formatResult(matched, CONTEXT_COLS, options);
        }
        if (qLower.includes('"redeemed_at" =')) {
          // Atomic redemption update: SET status=$1, redeemed_at=$2, redeemed_by=$3, updated_at=$4 WHERE context_hash=$5 AND status=$6 AND target_owner=$7 AND expires_at >= $8
          const [nextStatus, redeemedAt, redeemedBy, updatedAt, hash, reqStatus, reqOwner, nowParam] = params;
          const nowMs = new Date(nowParam).getTime();
          const matched = contexts.filter(
            (c) =>
              c.context_hash === hash &&
              c.status === reqStatus &&
              c.target_owner === reqOwner &&
              new Date(c.expires_at).getTime() >= nowMs
          );
          for (const c of matched) {
            c.status = nextStatus;
            c.redeemed_at = redeemedAt;
            c.redeemed_by = redeemedBy;
            c.updated_at = updatedAt;
          }
          return formatResult(matched, CONTEXT_COLS, options);
        }
        if (qLower.includes('"context_hash" =')) {
          // Revocation update: SET status=$1, updated_at=$2 WHERE context_hash=$3 AND status=$4 RETURNING *
          const [nextStatus, updatedAt, hash, reqStatus] = params;
          const matched = contexts.filter(
            (c) => c.context_hash === hash && c.status === reqStatus
          );
          for (const c of matched) {
            c.status = nextStatus;
            c.updated_at = updatedAt;
          }
          return formatResult(matched, CONTEXT_COLS, options);
        }
        // Expiration cleanup update: SET status=$1 WHERE status=$2 AND expires_at <= $3 RETURNING context_id
        const nextStatus = params[0];
        const curStatus = params[params.length - 2];
        const cutoffParam = params[params.length - 1];
        const cutoffMs = new Date(cutoffParam).getTime();
        const updated: Record<string, any>[] = [];
        for (const c of contexts) {
          if (c.status === curStatus && new Date(c.expires_at).getTime() <= cutoffMs) {
            c.status = nextStatus;
            updated.push({ context_id: c.context_id });
          }
        }
        return formatResult(updated, ["context_id"], options);
      }

      if (qLower.startsWith("delete from")) {
        // Purge cleanup delete: DELETE FROM dcc_contexts WHERE status=$1 AND expires_at <= $2 RETURNING context_id
        const [reqStatus, cutoffParam] = params;
        const cutoffMs = cutoffParam ? new Date(cutoffParam).getTime() : Infinity;
        const purged: Record<string, any>[] = [];
        for (let i = contexts.length - 1; i >= 0; i--) {
          if (
            contexts[i].status === reqStatus &&
            new Date(contexts[i].expires_at).getTime() <= cutoffMs
          ) {
            purged.push({ context_id: contexts[i].context_id });
            contexts.splice(i, 1);
          }
        }
        return formatResult(purged, ["context_id"], options);
      }

      if (qLower.startsWith("select")) {
        // Yield a macrotask on idempotency lookup so concurrent Promise.all([issueContext, issueContext]) exercises the unique constraint race path
        if (
          qLower.includes('"dcc_contexts"."idempotency_key" = $1') &&
          !qLower.includes("group by") &&
          !qLower.includes("count(")
        ) {
          await new Promise((resolve) => setImmediate(resolve));
          const rows = contexts.filter((c) => c.idempotency_key === params[0]);
          return formatResult(rows, CONTEXT_COLS, options);
        }

        if (
          qLower.includes('"dcc_contexts"."context_hash" = $1') &&
          !qLower.includes("group by")
        ) {
          const rows = contexts.filter((c) => c.context_hash === params[0]);
          return formatResult(rows, CONTEXT_COLS, options);
        }

        // Analytics queries (groupBy or total count)
        const filterAnalyticsRows = (includeTestExclusion: boolean) => {
          let pIdx = 0;
          const destFilter = qLower.includes('lower("dcc_contexts"."destination") =')
            ? String(params[pIdx++]).toLowerCase()
            : null;
          const sourceFilter = qLower.includes('lower("dcc_contexts"."source_site") =')
            ? String(params[pIdx++]).toLowerCase()
            : null;
          const ownerFilter = qLower.includes('lower("dcc_contexts"."target_owner") =')
            ? String(params[pIdx++]).toLowerCase()
            : null;
          const startDateFilter = qLower.includes('"dcc_contexts"."issued_at" >=')
            ? new Date(params[pIdx++]).getTime()
            : null;
          const endDateFilter = qLower.includes('"dcc_contexts"."issued_at" <=')
            ? new Date(params[pIdx++]).getTime()
            : null;

          return contexts.filter((c) => {
            if (destFilter && String(c.destination).toLowerCase() !== destFilter) return false;
            if (sourceFilter && String(c.source_site).toLowerCase() !== sourceFilter) return false;
            if (ownerFilter && String(c.target_owner).toLowerCase() !== ownerFilter) return false;
            const issuedMs = new Date(c.issued_at).getTime();
            if (startDateFilter !== null && issuedMs < startDateFilter) return false;
            if (endDateFilter !== null && issuedMs > endDateFilter) return false;

            if (includeTestExclusion) {
              const campaign = c.attribution?.campaign || "";
              if (campaign === "staging-verification-test" || campaign === "test_campaign") {
                return false;
              }
              const ik = c.idempotency_key;
              if (
                typeof ik === "string" &&
                (ik.startsWith("live-staging-") ||
                  ik.startsWith("pw-browser-") ||
                  ik.startsWith("test-") ||
                  ik.startsWith("expire-test-"))
              ) {
                return false;
              }
            }
            return true;
          });
        };

        const hasTestExclusion = qLower.includes("staging-verification-test");
        const filtered = filterAnalyticsRows(hasTestExclusion);

        if (qLower.includes("group by")) {
          const groups = new Map<string, Record<string, any>>();
          for (const c of filtered) {
            const key = `${c.source_site}::${c.target_owner}::${c.destination}`;
            let g = groups.get(key);
            if (!g) {
              g = {
                source_site: c.source_site,
                target_owner: c.target_owner,
                destination: c.destination,
                issuedCount: 0,
                redeemedCount: 0,
                expiredCount: 0,
                revokedCount: 0,
              };
              groups.set(key, g);
            }
            g.issuedCount++;
            if (c.status === "redeemed") g.redeemedCount++;
            else if (c.status === "expired") g.expiredCount++;
            else if (c.status === "revoked") g.revokedCount++;
          }
          return formatResult(
            Array.from(groups.values()),
            [
              "source_site",
              "target_owner",
              "destination",
              "issuedCount",
              "redeemedCount",
              "expiredCount",
              "revokedCount",
            ],
            options
          );
        }

        if (qLower.includes("count(*)")) {
          return formatResult([{ count: filtered.length }], ["count"], options);
        }

        return formatResult(filtered, CONTEXT_COLS, options);
      }
    }

    if (sqliteBackedTablesRegex.test(qLower)) {
      return executeSqliteQuery(getOrCreateSqliteDb(), queryText, params, options);
    }

    return formatResult([], [], options);
  };

  return drizzle(client as any, { schema });
}

const sqliteBackedTablesRegex =
  /\b(octo_bookings|octo_booking_idempotency_conflicts|octo_settlement_ledger|octo_audit_logs|octo_supplier_connections|octo_normalized_products|octo_participants|dcc_order_payments|dcc_payment_allocations|dcc_orders|dcc_order_items|dcc_operator_payables|dcc_disputes_and_refunds|dcc_supplier_bookings|dcc_saga_steps|dcc_saga_audit_events|dcc_square_webhook_events|dcc_traveler_profiles|dcc_auth_tokens)\b/i;

const SQLITE_BOOLEAN_COLS = new Set(["is_sandbox", "service_completed", "signature_verified"]);
const SQLITE_JSON_COLS = new Set([
  "destinations",
  "capabilities",
  "authorized_product_ids",
  "cancellation_rules",
  "options",
  "unit_items",
  "contact",
  "voucher",
  "metadata",
  "payload",
  "retry_policy",
  "input_payload",
  "output_payload",
  "sanitized_details",
  "error_metadata",
  "row_snapshot",
]);

let simulateDbFailureForTests = false;
let simulateDbReadFailureForTests = false;

export function setSimulateDbFailureForTests(enabled: boolean): void {
  simulateDbFailureForTests = enabled;
}

export function setSimulateDbReadFailureForTests(enabled: boolean): void {
  simulateDbReadFailureForTests = enabled;
}

export function resetTestSqliteDb(): void {
  if (activeSqliteDbInstance) {
    try {
      activeSqliteDbInstance.close();
    } catch {}
    activeSqliteDbInstance = null;
    activeSqliteDbPath = null;
  }
  cachedDb = undefined;
  cachedConnectionKey = undefined;
}

let activeSqliteDbInstance: any = null;
let activeSqliteDbPath: string | null = null;

function getOrCreateSqliteDb(): any {
  const targetPath = (process.env.DCC_TEST_SQLITE_PATH || ":memory:").trim();
  if (activeSqliteDbInstance && activeSqliteDbPath === targetPath) {
    return activeSqliteDbInstance;
  }
  if (activeSqliteDbInstance) {
    try {
      activeSqliteDbInstance.close();
    } catch {}
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { DatabaseSync } = require("node:sqlite") as {
    DatabaseSync: new (p: string, opts?: { timeout?: number }) => any;
  };
  const db = new DatabaseSync(targetPath, { timeout: 10000 });
  db.exec("PRAGMA busy_timeout = 10000;");
  db.exec("PRAGMA foreign_keys = OFF;");
  const existingTable = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='octo_bookings'")
    .get();
  if (!existingTable) {
    if (targetPath !== ":memory:") {
      try {
        db.exec("PRAGMA journal_mode = WAL;");
      } catch {}
    }
    initializeSqliteSchema(db);
  }
  activeSqliteDbInstance = db;
  activeSqliteDbPath = targetPath;
  return db;
}

function initializeSqliteSchema(db: any): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS "octo_participants" (
      "id" TEXT PRIMARY KEY,
      "name" TEXT NOT NULL,
      "role" TEXT NOT NULL,
      "website" TEXT NOT NULL,
      "contact_email" TEXT NOT NULL,
      "contact_name" TEXT,
      "destinations" TEXT NOT NULL DEFAULT '[]',
      "endpoint" TEXT,
      "certification_evidence" TEXT,
      "consent_status" TEXT NOT NULL DEFAULT 'not_requested',
      "credential_status" TEXT NOT NULL DEFAULT 'none',
      "products_available_count" INTEGER NOT NULL DEFAULT 0,
      "booking_payment_model" TEXT NOT NULL DEFAULT 'supplier_hosted',
      "outreach_status" TEXT NOT NULL DEFAULT 'identified',
      "agreed_commission_percent" TEXT,
      "notes" TEXT,
      "created_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      "updated_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );

    CREATE TABLE IF NOT EXISTS "octo_supplier_connections" (
      "id" TEXT PRIMARY KEY,
      "operator_slug" TEXT NOT NULL,
      "operator_name" TEXT NOT NULL,
      "endpoint" TEXT NOT NULL,
      "encrypted_api_key" TEXT,
      "encrypted_bearer_token" TEXT,
      "capabilities" TEXT NOT NULL DEFAULT '["octo/core"]',
      "is_sandbox" INTEGER NOT NULL DEFAULT 0,
      "connection_status" TEXT NOT NULL DEFAULT 'discovery_only',
      "reservation_platform" TEXT NOT NULL DEFAULT 'direct_octo',
      "octo_base_url" TEXT,
      "api_credential_ref" TEXT,
      "authorized_product_ids" TEXT NOT NULL DEFAULT '[]',
      "onboarding_stage" TEXT NOT NULL DEFAULT 'discovered',
      "operator_legal_name" TEXT,
      "business_address" TEXT,
      "signatory_name" TEXT,
      "signatory_email" TEXT,
      "consent_agreement_version" TEXT NOT NULL DEFAULT '1.0',
      "consent_terms_text" TEXT,
      "consented_at" TEXT,
      "sandbox_verified_at" TEXT,
      "production_verified_at" TEXT,
      "payment_model" TEXT NOT NULL DEFAULT 'supplier_hosted',
      "settlement_terms" TEXT,
      "commission_percent" TEXT,
      "cancellation_rules" TEXT,
      "health_status" TEXT NOT NULL DEFAULT 'untested',
      "last_health_check_at" TEXT,
      "last_health_check_status" TEXT,
      "provenance" TEXT,
      "last_verification_time" TEXT,
      "catalog_sync_status" TEXT,
      "catalog_synced_at" TEXT,
      "availability_test_status" TEXT,
      "availability_tested_at" TEXT,
      "booking_test_status" TEXT,
      "booking_tested_at" TEXT,
      "last_sync_at" TEXT,
      "last_error_message" TEXT,
      "created_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      "updated_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );

    CREATE TABLE IF NOT EXISTS "octo_normalized_products" (
      "id" TEXT PRIMARY KEY,
      "supplier_connection_id" TEXT NOT NULL,
      "supplier_product_reference" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "description" TEXT,
      "destination_slug" TEXT NOT NULL,
      "destination_name" TEXT,
      "country" TEXT,
      "location_name" TEXT,
      "latitude" TEXT,
      "longitude" TEXT,
      "default_currency" TEXT NOT NULL DEFAULT 'USD',
      "duration_minutes" INTEGER,
      "meeting_point" TEXT,
      "cancellation_policy" TEXT,
      "capabilities" TEXT NOT NULL DEFAULT '["octo/core"]',
      "options" TEXT NOT NULL DEFAULT '[]',
      "pricing_from" TEXT,
      "image_url" TEXT,
      "source_freshness" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      "created_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      "updated_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );

    CREATE TABLE IF NOT EXISTS "octo_bookings" (
      "id" TEXT PRIMARY KEY,
      "booking_uuid" TEXT NOT NULL UNIQUE,
      "idempotency_key" TEXT,
      "idempotency_hash" TEXT,
      "supplier_connection_id" TEXT NOT NULL,
      "reseller_id" TEXT,
      "product_id" TEXT NOT NULL,
      "option_id" TEXT NOT NULL,
      "availability_id" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'ON_HOLD',
      "expiration_minutes" INTEGER NOT NULL DEFAULT 15,
      "utc_hold_expires" TEXT,
      "total_price" TEXT NOT NULL,
      "currency" TEXT NOT NULL DEFAULT 'USD',
      "unit_items" TEXT NOT NULL DEFAULT '[]',
      "contact" TEXT,
      "supplier_reference" TEXT,
      "reseller_reference" TEXT,
      "checkout_url" TEXT,
      "voucher" TEXT,
      "cancellation_reason" TEXT,
      "confirmed_at" TEXT,
      "cancelled_at" TEXT,
      "created_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      "updated_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );

    CREATE UNIQUE INDEX IF NOT EXISTS "octo_bookings_idempotency_key_uidx"
      ON "octo_bookings" ("idempotency_key")
      WHERE "idempotency_key" IS NOT NULL;

    CREATE TABLE IF NOT EXISTS "octo_booking_idempotency_conflicts" (
      "id" TEXT PRIMARY KEY,
      "idempotency_key" TEXT NOT NULL,
      "booking_id" TEXT NOT NULL,
      "booking_uuid" TEXT NOT NULL,
      "status" TEXT NOT NULL,
      "supplier_reference" TEXT,
      "total_price" TEXT NOT NULL,
      "currency" TEXT NOT NULL DEFAULT 'USD',
      "conflict_classification" TEXT NOT NULL,
      "resolution_status" TEXT NOT NULL DEFAULT 'unresolved',
      "authoritative_booking_id" TEXT,
      "resolution_reason" TEXT,
      "resolved_by" TEXT,
      "row_snapshot" TEXT NOT NULL DEFAULT '{}',
      "detected_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      "resolved_at" TEXT
    );

    CREATE TABLE IF NOT EXISTS "octo_settlement_ledger" (
      "id" TEXT PRIMARY KEY,
      "booking_id" TEXT NOT NULL,
      "dcc_reference" TEXT NOT NULL,
      "supplier_reference" TEXT,
      "operator_slug" TEXT NOT NULL,
      "operator_name" TEXT NOT NULL,
      "currency" TEXT NOT NULL DEFAULT 'USD',
      "gross_amount" TEXT NOT NULL,
      "dcc_share_percent" TEXT DEFAULT '0.00',
      "dcc_share_amount" TEXT NOT NULL,
      "operator_share_amount" TEXT NOT NULL,
      "payment_status" TEXT NOT NULL DEFAULT 'unpaid',
      "settlement_status" TEXT NOT NULL DEFAULT 'pending',
      "cancellation_status" TEXT NOT NULL DEFAULT 'none',
      "metadata" TEXT NOT NULL DEFAULT '{}',
      "created_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      "updated_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );

    CREATE TABLE IF NOT EXISTS "octo_audit_logs" (
      "id" INTEGER PRIMARY KEY AUTOINCREMENT,
      "occurred_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      "action" TEXT NOT NULL,
      "entity_type" TEXT NOT NULL,
      "entity_id" TEXT NOT NULL,
      "status" TEXT NOT NULL,
      "payload" TEXT NOT NULL DEFAULT '{}',
      "error_message" TEXT
    );

    CREATE TABLE IF NOT EXISTS "dcc_traveler_profiles" (
      "id" TEXT PRIMARY KEY,
      "email" TEXT NOT NULL UNIQUE,
      "full_name" TEXT,
      "phone_number" TEXT,
      "metadata" TEXT NOT NULL DEFAULT '{}',
      "created_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      "updated_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );

    CREATE TABLE IF NOT EXISTS "dcc_auth_tokens" (
      "id" TEXT PRIMARY KEY,
      "email" TEXT NOT NULL,
      "token_hash" TEXT NOT NULL,
      "otp_code" TEXT NOT NULL,
      "expires_at" TEXT NOT NULL,
      "consumed_at" TEXT,
      "created_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );

    CREATE TABLE IF NOT EXISTS "dcc_order_payments" (
      "id" TEXT PRIMARY KEY,
      "order_id" TEXT NOT NULL,
      "traveler_id" TEXT,
      "amount" TEXT NOT NULL,
      "currency" TEXT NOT NULL DEFAULT 'USD',
      "provider" TEXT NOT NULL,
      "status" TEXT NOT NULL,
      "payment_method" TEXT,
      "receipt_url" TEXT,
      "customer_email" TEXT,
      "created_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      "updated_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );

    CREATE TABLE IF NOT EXISTS "dcc_payment_allocations" (
      "id" TEXT PRIMARY KEY,
      "payment_id" TEXT NOT NULL,
      "order_id" TEXT NOT NULL,
      "obligation_key" TEXT NOT NULL,
      "allocated_amount_cents" INTEGER NOT NULL DEFAULT 0,
      "currency" TEXT NOT NULL DEFAULT 'USD',
      "created_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      "updated_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );

    CREATE UNIQUE INDEX IF NOT EXISTS "dcc_payment_allocations_payment_obligation_uidx"
      ON "dcc_payment_allocations" ("payment_id", "obligation_key");

    CREATE TABLE IF NOT EXISTS "dcc_orders" (
      "id" TEXT PRIMARY KEY,
      "traveler_id" TEXT,
      "reseller_id" TEXT,
      "status" TEXT NOT NULL DEFAULT 'PENDING_HOLD',
      "currency" TEXT NOT NULL DEFAULT 'USD',
      "total_price" TEXT NOT NULL,
      "payment_id" TEXT,
      "payment_status" TEXT NOT NULL DEFAULT 'unpaid',
      "idempotency_key" TEXT,
      "idempotency_hash" TEXT,
      "utc_hold_expires" TEXT,
      "customer_full_name" TEXT,
      "customer_email" TEXT,
      "customer_phone" TEXT,
      "customer_country" TEXT,
      "customer_notes" TEXT,
      "saga_id" TEXT,
      "saga_status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
      "last_error_code" TEXT,
      "last_error_message" TEXT,
      "metadata" TEXT NOT NULL DEFAULT '{}',
      "created_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      "updated_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );

    CREATE TABLE IF NOT EXISTS "dcc_order_items" (
      "id" TEXT PRIMARY KEY,
      "order_id" TEXT NOT NULL,
      "booking_id" TEXT,
      "booking_uuid" TEXT,
      "product_id" TEXT NOT NULL,
      "option_id" TEXT NOT NULL,
      "availability_id" TEXT NOT NULL,
      "supplier_connection_id" TEXT,
      "operator_slug" TEXT NOT NULL,
      "operator_name" TEXT NOT NULL,
      "price" TEXT NOT NULL,
      "currency" TEXT NOT NULL DEFAULT 'USD',
      "unit_items" TEXT NOT NULL DEFAULT '[]',
      "status" TEXT NOT NULL DEFAULT 'ON_HOLD',
      "event_date" TEXT,
      "event_time" TEXT,
      "service_completed" INTEGER NOT NULL DEFAULT 0,
      "service_completed_at" TEXT,
      "voucher" TEXT,
      "created_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      "updated_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );

    CREATE TABLE IF NOT EXISTS "dcc_operator_payables" (
      "id" TEXT PRIMARY KEY,
      "order_id" TEXT NOT NULL,
      "order_item_id" TEXT NOT NULL,
      "booking_id" TEXT NOT NULL,
      "operator_slug" TEXT NOT NULL,
      "operator_name" TEXT NOT NULL,
      "currency" TEXT NOT NULL DEFAULT 'USD',
      "gross_amount" TEXT NOT NULL,
      "dcc_commission_percent" TEXT,
      "dcc_commission_amount" TEXT NOT NULL,
      "operator_payable_amount" TEXT NOT NULL,
      "reserve_amount" TEXT NOT NULL DEFAULT '0.00',
      "settlement_status" TEXT NOT NULL DEFAULT 'pending',
      "service_date" TEXT,
      "service_completed_at" TEXT,
      "paid_at" TEXT,
      "cancellation_status" TEXT NOT NULL DEFAULT 'none',
      "metadata" TEXT NOT NULL DEFAULT '{}',
      "created_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      "updated_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );

    CREATE TABLE IF NOT EXISTS "dcc_disputes_and_refunds" (
      "id" TEXT PRIMARY KEY,
      "type" TEXT NOT NULL,
      "order_id" TEXT NOT NULL,
      "order_item_id" TEXT,
      "booking_id" TEXT,
      "payment_id" TEXT NOT NULL,
      "operator_slug" TEXT NOT NULL,
      "amount" TEXT NOT NULL,
      "currency" TEXT NOT NULL DEFAULT 'USD',
      "status" TEXT NOT NULL DEFAULT 'succeeded',
      "reason" TEXT,
      "settlement_impact" TEXT NOT NULL,
      "created_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      "updated_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );

    CREATE TABLE IF NOT EXISTS "dcc_supplier_bookings" (
      "id" TEXT PRIMARY KEY,
      "order_id" TEXT NOT NULL,
      "order_item_id" TEXT NOT NULL,
      "supplier_connection_id" TEXT NOT NULL,
      "operator_slug" TEXT NOT NULL,
      "operator_name" TEXT NOT NULL,
      "product_id" TEXT NOT NULL,
      "option_id" TEXT NOT NULL,
      "availability_id" TEXT NOT NULL,
      "provider_booking_id" TEXT,
      "provider_booking_uuid" TEXT,
      "status" TEXT NOT NULL DEFAULT 'PENDING_HOLD',
      "hold_expires_at" TEXT,
      "confirmed_at" TEXT,
      "cancelled_at" TEXT,
      "cancellation_reason" TEXT,
      "price" TEXT NOT NULL,
      "currency" TEXT NOT NULL DEFAULT 'USD',
      "unit_items" TEXT NOT NULL DEFAULT '[]',
      "idempotency_key" TEXT,
      "idempotency_hash" TEXT,
      "external_request_id" TEXT,
      "attempt_count" INTEGER NOT NULL DEFAULT 0,
      "last_error_code" TEXT,
      "last_error_message" TEXT,
      "voucher_code" TEXT,
      "voucher_url" TEXT,
      "voucher_instructions" TEXT,
      "created_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      "updated_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );

    CREATE TABLE IF NOT EXISTS "dcc_saga_steps" (
      "id" TEXT PRIMARY KEY,
      "saga_id" TEXT NOT NULL,
      "order_id" TEXT NOT NULL,
      "step_name" TEXT NOT NULL,
      "step_index" INTEGER NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'PENDING',
      "idempotency_key" TEXT NOT NULL,
      "attempt_count" INTEGER NOT NULL DEFAULT 0,
      "max_retries" INTEGER NOT NULL DEFAULT 3,
      "retry_policy" TEXT NOT NULL DEFAULT '{}',
      "next_retry_at" TEXT,
      "external_reference_id" TEXT,
      "input_payload" TEXT NOT NULL DEFAULT '{}',
      "output_payload" TEXT DEFAULT '{}',
      "error_code" TEXT,
      "error_message" TEXT,
      "compensation_status" TEXT NOT NULL DEFAULT 'NOT_APPLICABLE',
      "started_at" TEXT,
      "completed_at" TEXT,
      "created_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      "updated_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );

    CREATE TABLE IF NOT EXISTS "dcc_saga_audit_events" (
      "id" INTEGER PRIMARY KEY AUTOINCREMENT,
      "saga_id" TEXT NOT NULL,
      "order_id" TEXT NOT NULL,
      "step_id" TEXT,
      "event_type" TEXT NOT NULL,
      "action" TEXT NOT NULL,
      "entity_type" TEXT NOT NULL,
      "entity_id" TEXT NOT NULL,
      "idempotency_key" TEXT,
      "attempt_number" INTEGER NOT NULL DEFAULT 1,
      "status" TEXT NOT NULL,
      "error_code" TEXT,
      "error_message" TEXT,
      "sanitized_details" TEXT NOT NULL DEFAULT '{}',
      "occurred_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );

    CREATE TABLE IF NOT EXISTS "dcc_square_webhook_events" (
      "id" TEXT PRIMARY KEY,
      "square_event_id" TEXT NOT NULL UNIQUE,
      "event_type" TEXT NOT NULL,
      "payment_id" TEXT,
      "order_id" TEXT,
      "processing_status" TEXT NOT NULL DEFAULT 'processing',
      "error_metadata" TEXT,
      "received_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      "processed_at" TEXT,
      "created_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      "updated_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );
  `);
}

function rewritePostgresInsertDefaults(sqlText: string): string {
  const insertMatch = sqlText.match(/^(\s*insert\s+into\s+"[^"]+"\s*)\(([^)]+)\)\s*values\s*\(/i);
  if (!insertMatch) return sqlText;
  const prefix = insertMatch[1];
  const colsRaw = insertMatch[2].split(",").map((c) => c.trim());
  const valuesKeywordIdx = sqlText.search(/\bvalues\s*\(/i);
  const openParen = sqlText.indexOf("(", valuesKeywordIdx);
  let depth = 0;
  let closeParen = -1;
  let inQuotes = false;
  for (let i = openParen; i < sqlText.length; i++) {
    const ch = sqlText[i];
    if (ch === "'") inQuotes = !inQuotes;
    if (!inQuotes) {
      if (ch === "(") depth++;
      else if (ch === ")") {
        depth--;
        if (depth === 0) {
          closeParen = i;
          break;
        }
      }
    }
  }
  if (closeParen === -1) return sqlText;
  const inner = sqlText.slice(openParen + 1, closeParen);
  const tokens: string[] = [];
  let cur = "";
  inQuotes = false;
  let pDepth = 0;
  for (let i = 0; i < inner.length; i++) {
    const ch = inner[i];
    if (ch === "'") inQuotes = !inQuotes;
    if (!inQuotes) {
      if (ch === "(") pDepth++;
      else if (ch === ")") pDepth--;
      else if (ch === "," && pDepth === 0) {
        tokens.push(cur.trim());
        cur = "";
        continue;
      }
    }
    cur += ch;
  }
  if (cur.trim()) tokens.push(cur.trim());
  if (colsRaw.length !== tokens.length) return sqlText;

  const keptCols: string[] = [];
  const keptTokens: string[] = [];
  for (let i = 0; i < colsRaw.length; i++) {
    if (/^default$/i.test(tokens[i])) continue;
    keptCols.push(colsRaw[i]);
    keptTokens.push(tokens[i]);
  }
  const suffix = sqlText.slice(closeParen + 1);
  if (keptCols.length === 0) {
    return `${prefix}default values${suffix}`;
  }
  return `${prefix}(${keptCols.join(", ")}) values (${keptTokens.join(", ")})${suffix}`;
}

function bindPostgresParamsToSqlite(
  sqlText: string,
  params: unknown[]
): { sql: string; bindArgs: any[] } {
  const bindArgs: any[] = [];
  let out = "";
  let inSingle = false;
  let inDouble = false;
  for (let i = 0; i < sqlText.length; i++) {
    const ch = sqlText[i];
    if (ch === "'" && !inDouble) {
      inSingle = !inSingle;
      out += ch;
      continue;
    }
    if (ch === '"' && !inSingle) {
      inDouble = !inDouble;
      out += ch;
      continue;
    }
    if (!inSingle && !inDouble && ch === "$") {
      let j = i + 1;
      while (j < sqlText.length && sqlText[j] >= "0" && sqlText[j] <= "9") {
        j++;
      }
      if (j > i + 1) {
        const paramIdx = Number(sqlText.slice(i + 1, j)) - 1;
        const rawVal = params[paramIdx];
        let normVal: any;
        if (rawVal === undefined || rawVal === null) {
          normVal = null;
        } else if (typeof rawVal === "boolean") {
          normVal = rawVal ? 1 : 0;
        } else if (rawVal instanceof Date) {
          normVal = rawVal.toISOString();
        } else if (typeof rawVal === "object" && !(rawVal instanceof Uint8Array)) {
          normVal = JSON.stringify(rawVal);
        } else {
          normVal = rawVal;
        }
        bindArgs.push(normVal);
        out += "?";
        i = j - 1;
        continue;
      }
    }
    out += ch;
  }
  return { sql: out, bindArgs };
}

function executeSqliteQuery(
  sqliteDb: any,
  query: string,
  params: unknown[],
  options?: { arrayMode?: boolean }
) {
  const isWriteQuery = /^\s*(insert|update|delete)\b/i.test(query);
  if (
    isWriteQuery &&
    (simulateDbFailureForTests || process.env.DCC_SIMULATE_DB_FAILURE === "1")
  ) {
    const simulatedErr: any = new Error(
      "SIMULATED_DB_PERSISTENCE_FAILURE: database write rejected"
    );
    simulatedErr.code = "57P01";
    throw simulatedErr;
  }
  if (
    !isWriteQuery &&
    (simulateDbReadFailureForTests || process.env.DCC_SIMULATE_DB_READ_FAILURE === "1")
  ) {
    const simulatedReadErr: any = new Error(
      "SIMULATED_DB_READ_FAILURE: database select rejected"
    );
    simulatedReadErr.code = "57P01";
    throw simulatedReadErr;
  }

  const rewrittenInsert = rewritePostgresInsertDefaults(query);
  const { sql, bindArgs } = bindPostgresParamsToSqlite(rewrittenInsert, params);
  const returnsRows = /^\s*select\b|\breturning\b/i.test(sql);

  try {
    const stmt = sqliteDb.prepare(sql);
    if (!returnsRows) {
      const info = stmt.run(...bindArgs);
      return {
        rows: [],
        rowCount: Number(info?.changes ?? 0),
      };
    }

    const rawRows = stmt.all(...bindArgs) as Record<string, any>[];
    if (rawRows.length === 0) {
      return formatResult([], [], options);
    }

    const cols = Object.keys(rawRows[0]);
    const normalizedRows = rawRows.map((raw) => {
      const obj: Record<string, any> = {};
      for (const col of cols) {
        let val = raw[col];
        if (val !== null && val !== undefined) {
          if (SQLITE_BOOLEAN_COLS.has(col)) {
            val = Boolean(val);
          } else if (SQLITE_JSON_COLS.has(col) && typeof val === "string") {
            try {
              val = JSON.parse(val);
            } catch {}
          }
        }
        obj[col] = val;
      }
      return obj;
    });

    return formatResult(normalizedRows, cols, options);
  } catch (err: any) {
    if (err && typeof err.message === "string" && err.message.includes("UNIQUE constraint failed")) {
      err.code = "23505";
    }
    throw err;
  }
}

export function getDb(): DccDb | null {
  const connectionString = resolveDatabaseUrl();
  const key = `${connectionString}::${process.env.DCC_ISOLATED_TEST_DB || ""}::${process.env.DCC_TEST_SQLITE_PATH || ""}`;
  if (cachedDb !== undefined && cachedConnectionKey === key) {
    return cachedDb;
  }
  cachedConnectionKey = key;

  if (!connectionString) {
    if (process.env.DCC_ISOLATED_TEST_DB === "1" || process.env.DCC_TEST_SQLITE_PATH) {
      cachedDb = createInMemoryTestDb();
      return cachedDb;
    }
    cachedDb = null;
    return cachedDb;
  }

  const client = neon(connectionString);
  cachedDb = drizzle(client, { schema });
  return cachedDb;
}

export function hasDb() {
  return Boolean(
    resolveDatabaseUrl() ||
      process.env.DCC_ISOLATED_TEST_DB === "1" ||
      process.env.DCC_TEST_SQLITE_PATH
  );
}

