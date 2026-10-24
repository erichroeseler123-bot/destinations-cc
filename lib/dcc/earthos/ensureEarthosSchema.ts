import { sql } from "drizzle-orm";
import { getDb, hasConfiguredDatabaseUrl, type DccDb } from "@/lib/db/client";

let schemaEnsured = false;

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

export async function ensureEarthosSchema(): Promise<void> {
  if (!hasConfiguredDatabaseUrl()) {
    throw new Error(
      "Durable EarthOS persistence requires an active database connection (DCC_DATABASE_URL, DATABASE_URL, or POSTGRES_URL).",
    );
  }
  const db = getDb();
  if (!db) {
    throw new Error("Failed to initialize durable database client for EarthOS persistence.");
  }

  if (schemaEnsured) return;

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

  schemaEnsured = true;
}
