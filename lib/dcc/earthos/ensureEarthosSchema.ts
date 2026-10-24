import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { sql } from "drizzle-orm";
import { getDb, hasConfiguredDatabaseUrl, type DccDb } from "@/lib/db/client";

let schemaEnsured = false;

export const EARTHOS_MIGRATION_ID = "0003_earthos_reference_maintenance";

export function resetEarthosSchemaEnsuredForTests() {
  schemaEnsured = false;
}

export async function getRequiredEarthosDb(): Promise<DccDb> {
  if (!hasConfiguredDatabaseUrl()) {
    throw new Error(
      "Durable EarthOS persistence requires an active database connection (DCC_DATABASE_URL, DATABASE_URL, or POSTGRES_URL).",
    );
  }
  const db = getDb();
  if (!db) {
    throw new Error("Failed to initialize durable database client for EarthOS persistence.");
  }
  await ensureEarthosSchema();
  return db;
}

export async function runRepeatableEarthosMigration(): Promise<{
  migrationId: string;
  checksum: string;
  executionCount: number;
  lastAppliedAt: string;
}> {
  if (!hasConfiguredDatabaseUrl()) {
    throw new Error(
      "Durable EarthOS persistence requires an active database connection (DCC_DATABASE_URL, DATABASE_URL, or POSTGRES_URL).",
    );
  }
  const db = getDb();
  if (!db) {
    throw new Error("Failed to initialize durable database client for EarthOS persistence.");
  }

  const migrationPath = path.resolve(
    process.cwd(),
    "drizzle",
    `${EARTHOS_MIGRATION_ID}.sql`,
  );
  const rawSql = fs.existsSync(migrationPath)
    ? fs.readFileSync(migrationPath, "utf8")
    : EARTHOS_MIGRATION_ID;
  const checksum = createHash("sha256").update(rawSql).digest("hex");

  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE earthos_mission_entity AS ENUM ('gosno', 'alaska', 'redrocks', 'earthos');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `);

  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE earthos_mission_status AS ENUM ('running', 'waiting', 'failed', 'completed');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS earthos_schema_migrations (
      migration_id text PRIMARY KEY,
      checksum text NOT NULL,
      first_applied_at timestamptz NOT NULL DEFAULT now(),
      last_applied_at timestamptz NOT NULL DEFAULT now(),
      execution_count integer NOT NULL DEFAULT 1
    );
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS earthos_missions (
      mission_id text PRIMARY KEY,
      entity earthos_mission_entity NOT NULL,
      region text NOT NULL,
      mission text NOT NULL,
      status earthos_mission_status NOT NULL,
      current_step text,
      started_at timestamptz NOT NULL,
      updated_at timestamptz NOT NULL,
      last_checkpoint_at timestamptz,
      waiting_for_event text,
      payload jsonb NOT NULL DEFAULT '{}'::jsonb,
      result jsonb,
      error jsonb,
      intelligence jsonb,
      workflow_source text NOT NULL DEFAULT 'earthos',
      created_at timestamptz NOT NULL DEFAULT now()
    );
  `);

  await db.execute(sql`CREATE INDEX IF NOT EXISTS earthos_missions_entity_idx ON earthos_missions (entity);`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS earthos_missions_status_idx ON earthos_missions (status);`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS earthos_missions_updated_at_idx ON earthos_missions (updated_at);`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS earthos_missions_waiting_event_idx ON earthos_missions (waiting_for_event);`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS earthos_missions_entity_region_idx ON earthos_missions (entity, region);`);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS earthos_mission_steps (
      step_id text PRIMARY KEY,
      mission_id text NOT NULL REFERENCES earthos_missions(mission_id) ON DELETE CASCADE,
      name text NOT NULL,
      status earthos_mission_status NOT NULL,
      started_at timestamptz,
      ended_at timestamptz,
      retry_count integer NOT NULL DEFAULT 0,
      output jsonb,
      error_message text,
      created_at timestamptz NOT NULL DEFAULT now()
    );
  `);

  await db.execute(sql`CREATE INDEX IF NOT EXISTS earthos_mission_steps_mission_id_idx ON earthos_mission_steps (mission_id);`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS earthos_mission_steps_mission_status_idx ON earthos_mission_steps (mission_id, status);`);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS earthos_control_map_findings (
      finding_id text PRIMARY KEY,
      status text NOT NULL,
      severity text NOT NULL,
      owner text NOT NULL,
      note text,
      metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  `);

  await db.execute(sql`CREATE INDEX IF NOT EXISTS earthos_control_map_findings_status_idx ON earthos_control_map_findings (status);`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS earthos_control_map_findings_severity_idx ON earthos_control_map_findings (severity);`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS earthos_control_map_findings_updated_at_idx ON earthos_control_map_findings (updated_at);`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS earthos_control_map_findings_owner_status_idx ON earthos_control_map_findings (owner, status);`);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS earthos_control_map_finding_history (
      event_sequence bigserial PRIMARY KEY,
      finding_id text NOT NULL REFERENCES earthos_control_map_findings(finding_id) ON DELETE CASCADE,
      event text NOT NULL,
      status text NOT NULL,
      severity text NOT NULL,
      owner text NOT NULL,
      node_slug text NOT NULL,
      corridor text NOT NULL,
      recorded_at timestamptz NOT NULL,
      summary text NOT NULL,
      approved_at timestamptz,
      approved_by text,
      control_surface text,
      metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
      created_at timestamptz NOT NULL DEFAULT now()
    );
  `);

  await db.execute(sql`CREATE INDEX IF NOT EXISTS earthos_control_map_finding_history_finding_recorded_idx ON earthos_control_map_finding_history (finding_id, recorded_at);`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS earthos_control_map_finding_history_event_idx ON earthos_control_map_finding_history (event);`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS earthos_control_map_finding_history_recorded_at_idx ON earthos_control_map_finding_history (recorded_at);`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS earthos_control_map_finding_history_corridor_idx ON earthos_control_map_finding_history (corridor);`);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS governance_drift_events (
      id text PRIMARY KEY,
      created_at timestamptz NOT NULL DEFAULT now(),
      source_surface text NOT NULL,
      affected_surface text NOT NULL,
      corridor_id text NOT NULL,
      event_type text NOT NULL,
      severity text NOT NULL,
      status text NOT NULL,
      finding_id text,
      summary text NOT NULL,
      evidence_json jsonb NOT NULL DEFAULT '{}'::jsonb,
      expected_role text,
      observed_role text,
      continuity_state text,
      machine_interpretation_risk text NOT NULL,
      resolved_at timestamptz,
      resolved_by text
    );
  `);

  await db.execute(sql`CREATE INDEX IF NOT EXISTS governance_drift_events_created_at_idx ON governance_drift_events (created_at);`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS governance_drift_events_corridor_idx ON governance_drift_events (corridor_id);`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS governance_drift_events_status_idx ON governance_drift_events (status);`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS governance_drift_events_severity_idx ON governance_drift_events (severity);`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS governance_drift_events_finding_idx ON governance_drift_events (finding_id);`);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS governance_reconciliation_packets (
      id text PRIMARY KEY,
      created_at timestamptz NOT NULL DEFAULT now(),
      packet_type text NOT NULL,
      status text NOT NULL,
      proposed_changes_json jsonb NOT NULL DEFAULT '{}'::jsonb,
      affected_routes_json jsonb NOT NULL DEFAULT '[]'::jsonb,
      affected_surfaces_json jsonb NOT NULL DEFAULT '[]'::jsonb,
      reason text NOT NULL,
      approval_required boolean NOT NULL DEFAULT true,
      approved_at timestamptz,
      approved_by text,
      applied_at timestamptz,
      result_json jsonb
    );
  `);

  await db.execute(sql`CREATE INDEX IF NOT EXISTS governance_reconciliation_packets_created_at_idx ON governance_reconciliation_packets (created_at);`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS governance_reconciliation_packets_type_idx ON governance_reconciliation_packets (packet_type);`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS governance_reconciliation_packets_status_idx ON governance_reconciliation_packets (status);`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS governance_reconciliation_packets_approval_required_idx ON governance_reconciliation_packets (approval_required);`);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS governance_findings_history (
      id bigserial PRIMARY KEY,
      finding_id text NOT NULL,
      drift_event_id text REFERENCES governance_drift_events(id) ON DELETE SET NULL,
      packet_id text REFERENCES governance_reconciliation_packets(id) ON DELETE SET NULL,
      event_type text NOT NULL,
      status text NOT NULL,
      summary text NOT NULL,
      metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
      recorded_at timestamptz NOT NULL DEFAULT now(),
      recorded_by text
    );
  `);

  await db.execute(sql`CREATE INDEX IF NOT EXISTS governance_findings_history_finding_recorded_idx ON governance_findings_history (finding_id, recorded_at);`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS governance_findings_history_drift_event_idx ON governance_findings_history (drift_event_id);`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS governance_findings_history_packet_idx ON governance_findings_history (packet_id);`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS governance_findings_history_event_type_idx ON governance_findings_history (event_type);`);

  const migrationRecord = await db.execute(sql`
    INSERT INTO earthos_schema_migrations (migration_id, checksum, first_applied_at, last_applied_at, execution_count)
    VALUES (${EARTHOS_MIGRATION_ID}, ${checksum}, now(), now(), 1)
    ON CONFLICT (migration_id) DO UPDATE
      SET checksum = EXCLUDED.checksum,
          last_applied_at = now(),
          execution_count = earthos_schema_migrations.execution_count + 1
    RETURNING migration_id, checksum, execution_count, last_applied_at;
  `);

  schemaEnsured = true;
  const row = (migrationRecord.rows[0] || {}) as Record<string, unknown>;
  return {
    migrationId: String(row.migration_id || EARTHOS_MIGRATION_ID),
    checksum: String(row.checksum || checksum),
    executionCount: Number(row.execution_count || 1),
    lastAppliedAt: String(row.last_applied_at || new Date().toISOString()),
  };
}

export async function ensureEarthosSchema(): Promise<void> {
  if (schemaEnsured) return;
  await runRepeatableEarthosMigration();
}
