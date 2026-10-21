import { randomUUID } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "@/lib/db/schema";
import { LIVE_CORRIDOR_CATALOG } from "@/lib/dcc/telemetry/corridorCatalog";

export type DccDb = NeonHttpDatabase<typeof schema>;

let cachedDb: DccDb | null | undefined;

function resolveDatabaseUrl() {
  return (
    process.env.DCC_DATABASE_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    ""
  ).trim();
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

    if (qLower.startsWith("create table") || qLower.startsWith("create index")) {
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

    return formatResult([], [], options);
  };

  return drizzle(client as any, { schema });
}

export function getDb(): DccDb | null {
  if (cachedDb !== undefined) return cachedDb;

  const connectionString = resolveDatabaseUrl();
  if (!connectionString) {
    if (process.env.DCC_ISOLATED_TEST_DB === "1") {
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
  return Boolean(resolveDatabaseUrl() || process.env.DCC_ISOLATED_TEST_DB === "1");
}
