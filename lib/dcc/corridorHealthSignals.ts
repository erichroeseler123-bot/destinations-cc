import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { appendEarthOSAuditEvent } from "@/lib/dcc/earthos/auditLog";

export type CorridorHealthStatus =
  | "healthy"
  | "stale"
  | "degraded"
  | "recovery_required"
  | "blocked";

export type CorridorHealthSignalInput = {
  corridorId: string;
  status: CorridorHealthStatus;
  lastSuccessfulSyncAt?: string | null;
  lastAttemptedSyncAt: string;
  freshUntil?: string | null;
  activeEventCount: number;
  sourceCount: number;
  primarySource?: string | null;
  lastError?: string | null;
  recoveryMissionId?: string | null;
  metadata?: Record<string, unknown>;
};

export type CorridorHealthSignal = {
  corridorId: string;
  status: CorridorHealthStatus;
  lastSuccessfulSyncAt: string | null;
  lastAttemptedSyncAt: string | null;
  freshUntil: string | null;
  activeEventCount: number;
  sourceCount: number;
  primarySource: string | null;
  lastError: string | null;
  recoveryMissionId: string | null;
  metadata: Record<string, unknown>;
};

const TABLE = "dcc_corridor_health_signals";

async function ensureCorridorHealthTable() {
  const db = getDb();
  if (!db) return null;

  await db.execute(sql.raw(`
    DO $$
    BEGIN
      CREATE TYPE dcc_corridor_health_status AS ENUM (
        'healthy',
        'stale',
        'degraded',
        'recovery_required',
        'blocked'
      );
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;
  `));

  await db.execute(sql.raw(`
    CREATE TABLE IF NOT EXISTS ${TABLE} (
      corridor_id text PRIMARY KEY,
      status dcc_corridor_health_status NOT NULL,
      last_successful_sync_at timestamptz,
      last_attempted_sync_at timestamptz NOT NULL,
      fresh_until timestamptz,
      active_event_count integer NOT NULL DEFAULT 0,
      source_count integer NOT NULL DEFAULT 0,
      primary_source text,
      last_error text,
      recovery_mission_id text,
      metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `));

  return db;
}

function buildRecoveryMissionId(input: CorridorHealthSignalInput) {
  if (input.recoveryMissionId) return input.recoveryMissionId;
  if (input.status !== "recovery_required") return null;
  return `${input.corridorId}-recovery-${input.lastAttemptedSyncAt.replace(/[^0-9]/g, "").slice(0, 14)}`;
}

export async function recordCorridorHealthSignal(input: CorridorHealthSignalInput) {
  const db = await ensureCorridorHealthTable();
  if (!db) return null;

  const recoveryMissionId = buildRecoveryMissionId(input);
  const metadata = input.metadata || {};

  await db.execute(sql`
    insert into ${sql.raw(TABLE)} (
      corridor_id,
      status,
      last_successful_sync_at,
      last_attempted_sync_at,
      fresh_until,
      active_event_count,
      source_count,
      primary_source,
      last_error,
      recovery_mission_id,
      metadata,
      updated_at
    )
    values (
      ${input.corridorId},
      ${input.status}::dcc_corridor_health_status,
      ${input.lastSuccessfulSyncAt || null},
      ${input.lastAttemptedSyncAt},
      ${input.freshUntil || null},
      ${input.activeEventCount},
      ${input.sourceCount},
      ${input.primarySource || null},
      ${input.lastError || null},
      ${recoveryMissionId},
      ${JSON.stringify(metadata)}::jsonb,
      now()
    )
    on conflict (corridor_id)
    do update set
      status = excluded.status,
      last_successful_sync_at = coalesce(excluded.last_successful_sync_at, ${sql.raw(TABLE)}.last_successful_sync_at),
      last_attempted_sync_at = excluded.last_attempted_sync_at,
      fresh_until = excluded.fresh_until,
      active_event_count = excluded.active_event_count,
      source_count = excluded.source_count,
      primary_source = excluded.primary_source,
      last_error = excluded.last_error,
      recovery_mission_id = excluded.recovery_mission_id,
      metadata = excluded.metadata,
      updated_at = now()
  `);

  if (input.status === "recovery_required") {
    appendEarthOSAuditEvent({
      eventType: "corridor_recovery_required",
      entity: "redrocks",
      corridorId: input.corridorId,
      severity: "critical",
      summary: `Recovery required for ${input.corridorId}: ${input.lastError || "unsafe sync candidate"}`,
      metadata: {
        ...metadata,
        activeEventCount: input.activeEventCount,
        sourceCount: input.sourceCount,
        lastAttemptedSyncAt: input.lastAttemptedSyncAt,
        recoveryMissionId,
      },
    });
  }

  return {
    corridorId: input.corridorId,
    status: input.status,
    recoveryMissionId,
  };
}

function dateToIso(value: unknown) {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string" && value.trim()) return value;
  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

export async function getCorridorHealthSignal(corridorId: string): Promise<CorridorHealthSignal | null> {
  const db = await ensureCorridorHealthTable();
  if (!db) return null;

  const result = await db.execute(sql`
    select
      corridor_id,
      status,
      last_successful_sync_at,
      last_attempted_sync_at,
      fresh_until,
      active_event_count,
      source_count,
      primary_source,
      last_error,
      recovery_mission_id,
      metadata
    from ${sql.raw(TABLE)}
    where corridor_id = ${corridorId}
    limit 1
  `);

  const row = result.rows[0];
  if (!row) return null;

  return {
    corridorId: String(row.corridor_id || corridorId),
    status: String(row.status || "blocked") as CorridorHealthStatus,
    lastSuccessfulSyncAt: dateToIso(row.last_successful_sync_at),
    lastAttemptedSyncAt: dateToIso(row.last_attempted_sync_at),
    freshUntil: dateToIso(row.fresh_until),
    activeEventCount: Number(row.active_event_count || 0),
    sourceCount: Number(row.source_count || 0),
    primarySource: row.primary_source ? String(row.primary_source) : null,
    lastError: row.last_error ? String(row.last_error) : null,
    recoveryMissionId: row.recovery_mission_id ? String(row.recovery_mission_id) : null,
    metadata: isRecord(row.metadata) ? row.metadata : {},
  };
}

export function isCorridorFresh(signal: CorridorHealthSignal | null) {
  if (!signal) return false;
  if (signal.status !== "healthy") return false;
  if (!signal.freshUntil) return false;
  const freshUntilMs = new Date(signal.freshUntil).getTime();
  return Number.isFinite(freshUntilMs) && freshUntilMs > Date.now();
}
