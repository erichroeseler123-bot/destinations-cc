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

  const getBuiltin = (process as unknown as {
    getBuiltinModule?: (id: string) => unknown;
  }).getBuiltinModule;
  const nodeFs = getBuiltin
    ? (getBuiltin("fs") as typeof import("node:fs"))
    : undefined;
  const nodePath = getBuiltin
    ? (getBuiltin("path") as typeof import("node:path"))
    : undefined;
  const nodeCrypto = getBuiltin
    ? (getBuiltin("crypto") as typeof import("node:crypto"))
    : undefined;

  const migrationPath = nodePath
    ? nodePath.resolve(process.cwd(), "drizzle", `${EARTHOS_MIGRATION_ID}.sql`)
    : `${EARTHOS_MIGRATION_ID}.sql`;
  const rawSql =
    nodeFs && nodeFs.existsSync(migrationPath)
      ? nodeFs.readFileSync(migrationPath, "utf8")
      : EARTHOS_MIGRATION_ID;
  const checksum = nodeCrypto
    ? nodeCrypto.createHash("sha256").update(rawSql).digest("hex")
    : EARTHOS_MIGRATION_ID;

  async function executeDdl(query: ReturnType<typeof sql>) {
    try {
      await db!.execute(query);
    } catch (err: any) {
      const code = err?.code || err?.cause?.code;
      const msg = String(err?.message || err?.cause?.message || "");
      if (code === "42501" || /must be owner of|permission denied for schema/i.test(msg)) {
        return;
      }
      throw err;
    }
  }

  await executeDdl(sql`
    DO $$ BEGIN
      CREATE TYPE earthos_mission_entity AS ENUM ('gosno', 'alaska', 'redrocks', 'earthos');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `);

  await executeDdl(sql`
    DO $$ BEGIN
      CREATE TYPE earthos_mission_status AS ENUM ('running', 'waiting', 'failed', 'completed');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `);

  await executeDdl(sql`
    CREATE TABLE IF NOT EXISTS earthos_schema_migrations (
      migration_id text PRIMARY KEY,
      checksum text NOT NULL,
      first_applied_at timestamptz NOT NULL DEFAULT now(),
      last_applied_at timestamptz NOT NULL DEFAULT now(),
      execution_count integer NOT NULL DEFAULT 1
    );
  `);

  await executeDdl(sql`
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

  await executeDdl(sql`CREATE INDEX IF NOT EXISTS earthos_missions_entity_idx ON earthos_missions (entity);`);
  await executeDdl(sql`CREATE INDEX IF NOT EXISTS earthos_missions_status_idx ON earthos_missions (status);`);
  await executeDdl(sql`CREATE INDEX IF NOT EXISTS earthos_missions_updated_at_idx ON earthos_missions (updated_at);`);
  await executeDdl(sql`CREATE INDEX IF NOT EXISTS earthos_missions_waiting_event_idx ON earthos_missions (waiting_for_event);`);
  await executeDdl(sql`CREATE INDEX IF NOT EXISTS earthos_missions_entity_region_idx ON earthos_missions (entity, region);`);

  await executeDdl(sql`
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

  await executeDdl(sql`CREATE INDEX IF NOT EXISTS earthos_mission_steps_mission_id_idx ON earthos_mission_steps (mission_id);`);
  await executeDdl(sql`CREATE INDEX IF NOT EXISTS earthos_mission_steps_mission_status_idx ON earthos_mission_steps (mission_id, status);`);

  await executeDdl(sql`
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

  await executeDdl(sql`CREATE INDEX IF NOT EXISTS earthos_control_map_findings_status_idx ON earthos_control_map_findings (status);`);
  await executeDdl(sql`CREATE INDEX IF NOT EXISTS earthos_control_map_findings_severity_idx ON earthos_control_map_findings (severity);`);
  await executeDdl(sql`CREATE INDEX IF NOT EXISTS earthos_control_map_findings_updated_at_idx ON earthos_control_map_findings (updated_at);`);
  await executeDdl(sql`CREATE INDEX IF NOT EXISTS earthos_control_map_findings_owner_status_idx ON earthos_control_map_findings (owner, status);`);

  await executeDdl(sql`
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

  await executeDdl(sql`CREATE INDEX IF NOT EXISTS earthos_control_map_finding_history_finding_recorded_idx ON earthos_control_map_finding_history (finding_id, recorded_at);`);
  await executeDdl(sql`CREATE INDEX IF NOT EXISTS earthos_control_map_finding_history_event_idx ON earthos_control_map_finding_history (event);`);
  await executeDdl(sql`CREATE INDEX IF NOT EXISTS earthos_control_map_finding_history_recorded_at_idx ON earthos_control_map_finding_history (recorded_at);`);
  await executeDdl(sql`CREATE INDEX IF NOT EXISTS earthos_control_map_finding_history_corridor_idx ON earthos_control_map_finding_history (corridor);`);

  await executeDdl(sql`
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

  await executeDdl(sql`CREATE INDEX IF NOT EXISTS governance_drift_events_created_at_idx ON governance_drift_events (created_at);`);
  await executeDdl(sql`CREATE INDEX IF NOT EXISTS governance_drift_events_corridor_idx ON governance_drift_events (corridor_id);`);
  await executeDdl(sql`CREATE INDEX IF NOT EXISTS governance_drift_events_status_idx ON governance_drift_events (status);`);
  await executeDdl(sql`CREATE INDEX IF NOT EXISTS governance_drift_events_severity_idx ON governance_drift_events (severity);`);
  await executeDdl(sql`CREATE INDEX IF NOT EXISTS governance_drift_events_finding_idx ON governance_drift_events (finding_id);`);

  await executeDdl(sql`
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

  await executeDdl(sql`CREATE INDEX IF NOT EXISTS governance_reconciliation_packets_created_at_idx ON governance_reconciliation_packets (created_at);`);
  await executeDdl(sql`CREATE INDEX IF NOT EXISTS governance_reconciliation_packets_type_idx ON governance_reconciliation_packets (packet_type);`);
  await executeDdl(sql`CREATE INDEX IF NOT EXISTS governance_reconciliation_packets_status_idx ON governance_reconciliation_packets (status);`);
  await executeDdl(sql`CREATE INDEX IF NOT EXISTS governance_reconciliation_packets_approval_required_idx ON governance_reconciliation_packets (approval_required);`);

  await executeDdl(sql`
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

  await executeDdl(sql`CREATE INDEX IF NOT EXISTS governance_findings_history_finding_recorded_idx ON governance_findings_history (finding_id, recorded_at);`);
  await executeDdl(sql`CREATE INDEX IF NOT EXISTS governance_findings_history_drift_event_idx ON governance_findings_history (drift_event_id);`);
  await executeDdl(sql`CREATE INDEX IF NOT EXISTS governance_findings_history_packet_idx ON governance_findings_history (packet_id);`);
  await executeDdl(sql`CREATE INDEX IF NOT EXISTS governance_findings_history_event_type_idx ON governance_findings_history (event_type);`);

  await executeDdl(sql`
    CREATE TABLE IF NOT EXISTS octo_normalized_products (
      id text PRIMARY KEY,
      supplier_connection_id text NOT NULL,
      supplier_product_reference text NOT NULL,
      title text NOT NULL,
      description text,
      destination_slug text,
      destination_name text,
      country text,
      location_name text,
      latitude numeric,
      longitude numeric,
      default_currency text NOT NULL DEFAULT 'USD',
      duration_minutes integer,
      meeting_point text,
      cancellation_policy text,
      capabilities jsonb NOT NULL DEFAULT '[]'::jsonb,
      options jsonb NOT NULL DEFAULT '[]'::jsonb,
      pricing_from integer,
      image_url text,
      source_freshness timestamptz,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  `);

  await executeDdl(sql`
    CREATE TABLE IF NOT EXISTS octo_bookings (
      id text PRIMARY KEY,
      booking_uuid text NOT NULL,
      idempotency_key text,
      idempotency_hash text,
      supplier_connection_id text NOT NULL,
      reseller_id text,
      product_id text NOT NULL,
      option_id text NOT NULL,
      availability_id text NOT NULL,
      status text NOT NULL DEFAULT 'ON_HOLD',
      expiration_minutes integer NOT NULL DEFAULT 15,
      utc_hold_expires timestamptz,
      total_price numeric(12, 2) NOT NULL,
      currency text NOT NULL DEFAULT 'USD',
      unit_items jsonb NOT NULL DEFAULT '[]'::jsonb,
      contact jsonb,
      supplier_reference text,
      reseller_reference text,
      checkout_url text,
      voucher jsonb,
      cancellation_reason text,
      confirmed_at timestamptz,
      cancelled_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  `);

  await executeDdl(sql`DROP INDEX IF EXISTS octo_bookings_idempotency_key_idx;`);
  await executeDdl(sql`
    DELETE FROM octo_bookings a
    USING octo_bookings b
    WHERE a.idempotency_key IS NOT NULL
      AND a.idempotency_key = b.idempotency_key
      AND a.ctid > b.ctid;
  `);
  await executeDdl(sql`CREATE UNIQUE INDEX IF NOT EXISTS octo_bookings_booking_uuid_uidx ON octo_bookings (booking_uuid);`);
  await executeDdl(sql`CREATE UNIQUE INDEX IF NOT EXISTS octo_bookings_idempotency_key_uidx ON octo_bookings (idempotency_key);`);
  await executeDdl(sql`CREATE INDEX IF NOT EXISTS octo_bookings_status_idx ON octo_bookings (status);`);
  await executeDdl(sql`CREATE INDEX IF NOT EXISTS octo_bookings_product_id_idx ON octo_bookings (product_id);`);
  await executeDdl(sql`CREATE INDEX IF NOT EXISTS octo_bookings_supplier_conn_idx ON octo_bookings (supplier_connection_id);`);

  await executeDdl(sql`
    CREATE TABLE IF NOT EXISTS octo_settlement_ledger (
      id text PRIMARY KEY,
      booking_id text NOT NULL REFERENCES octo_bookings(id) ON DELETE CASCADE,
      dcc_reference text NOT NULL,
      supplier_reference text,
      operator_slug text NOT NULL,
      operator_name text NOT NULL,
      currency text NOT NULL DEFAULT 'USD',
      gross_amount numeric(12, 2) NOT NULL,
      dcc_share_percent numeric(5, 2) DEFAULT '0.00',
      dcc_share_amount numeric(12, 2) NOT NULL,
      operator_share_amount numeric(12, 2) NOT NULL,
      payment_status text NOT NULL DEFAULT 'unpaid',
      settlement_status text NOT NULL DEFAULT 'pending',
      cancellation_status text NOT NULL DEFAULT 'none',
      metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  `);
  await executeDdl(sql`CREATE INDEX IF NOT EXISTS octo_settlement_ledger_booking_id_idx ON octo_settlement_ledger (booking_id);`);
  await executeDdl(sql`CREATE INDEX IF NOT EXISTS octo_settlement_ledger_operator_slug_idx ON octo_settlement_ledger (operator_slug);`);
  await executeDdl(sql`CREATE INDEX IF NOT EXISTS octo_settlement_ledger_settlement_status_idx ON octo_settlement_ledger (settlement_status);`);

  await executeDdl(sql`
    CREATE TABLE IF NOT EXISTS octo_audit_logs (
      id bigserial PRIMARY KEY,
      occurred_at timestamptz NOT NULL DEFAULT now(),
      action text NOT NULL,
      entity_type text NOT NULL,
      entity_id text NOT NULL,
      status text NOT NULL,
      payload jsonb NOT NULL DEFAULT '{}'::jsonb,
      error_message text
    );
  `);
  await executeDdl(sql`CREATE INDEX IF NOT EXISTS octo_audit_logs_entity_idx ON octo_audit_logs (entity_type, entity_id);`);
  await executeDdl(sql`CREATE INDEX IF NOT EXISTS octo_audit_logs_occurred_at_idx ON octo_audit_logs (occurred_at);`);

  await executeDdl(sql`
    CREATE TABLE IF NOT EXISTS dcc_order_payments (
      id text PRIMARY KEY,
      order_id text NOT NULL,
      traveler_id text,
      amount numeric(12, 2) NOT NULL,
      currency text NOT NULL DEFAULT 'USD',
      provider text NOT NULL,
      status text NOT NULL,
      payment_method text,
      receipt_url text,
      customer_email text,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  `);
  await executeDdl(sql`CREATE INDEX IF NOT EXISTS dcc_order_payments_order_id_idx ON dcc_order_payments (order_id);`);
  await executeDdl(sql`CREATE INDEX IF NOT EXISTS dcc_order_payments_traveler_id_idx ON dcc_order_payments (traveler_id);`);
  await executeDdl(sql`CREATE INDEX IF NOT EXISTS dcc_order_payments_status_idx ON dcc_order_payments (status);`);

  await executeDdl(sql`
    CREATE TABLE IF NOT EXISTS dcc_orders (
      id text PRIMARY KEY,
      traveler_id text,
      reseller_id text,
      status text NOT NULL DEFAULT 'PENDING_HOLD',
      currency text NOT NULL DEFAULT 'USD',
      total_price numeric(12, 2) NOT NULL,
      payment_id text,
      payment_status text NOT NULL DEFAULT 'unpaid',
      idempotency_key text,
      idempotency_hash text,
      utc_hold_expires timestamptz,
      customer_full_name text,
      customer_email text,
      customer_phone text,
      customer_country text,
      customer_notes text,
      saga_id text,
      saga_status text NOT NULL DEFAULT 'NOT_STARTED',
      last_error_code text,
      last_error_message text,
      metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  `);
  await executeDdl(sql`CREATE INDEX IF NOT EXISTS dcc_orders_traveler_id_idx ON dcc_orders (traveler_id);`);
  await executeDdl(sql`CREATE INDEX IF NOT EXISTS dcc_orders_status_idx ON dcc_orders (status);`);
  await executeDdl(sql`CREATE INDEX IF NOT EXISTS dcc_orders_idempotency_key_idx ON dcc_orders (idempotency_key);`);
  await executeDdl(sql`CREATE INDEX IF NOT EXISTS dcc_orders_saga_id_idx ON dcc_orders (saga_id);`);
  await executeDdl(sql`CREATE INDEX IF NOT EXISTS dcc_orders_created_at_idx ON dcc_orders (created_at);`);

  await executeDdl(sql`
    CREATE TABLE IF NOT EXISTS dcc_order_items (
      id text PRIMARY KEY,
      order_id text NOT NULL,
      booking_id text,
      booking_uuid text,
      product_id text NOT NULL,
      option_id text NOT NULL,
      availability_id text NOT NULL,
      supplier_connection_id text,
      operator_slug text NOT NULL,
      operator_name text NOT NULL,
      price numeric(12, 2) NOT NULL,
      currency text NOT NULL DEFAULT 'USD',
      unit_items jsonb NOT NULL DEFAULT '[]'::jsonb,
      status text NOT NULL DEFAULT 'ON_HOLD',
      event_date date,
      event_time text,
      service_completed boolean NOT NULL DEFAULT false,
      service_completed_at timestamptz,
      voucher jsonb,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  `);
  await executeDdl(sql`CREATE INDEX IF NOT EXISTS dcc_order_items_order_id_idx ON dcc_order_items (order_id);`);
  await executeDdl(sql`CREATE INDEX IF NOT EXISTS dcc_order_items_booking_id_idx ON dcc_order_items (booking_id);`);
  await executeDdl(sql`CREATE INDEX IF NOT EXISTS dcc_order_items_operator_slug_idx ON dcc_order_items (operator_slug);`);
  await executeDdl(sql`CREATE INDEX IF NOT EXISTS dcc_order_items_status_idx ON dcc_order_items (status);`);

  await executeDdl(sql`
    CREATE TABLE IF NOT EXISTS dcc_operator_payables (
      id text PRIMARY KEY,
      order_id text NOT NULL,
      order_item_id text NOT NULL,
      booking_id text NOT NULL,
      operator_slug text NOT NULL,
      operator_name text NOT NULL,
      currency text NOT NULL DEFAULT 'USD',
      gross_amount numeric(12, 2) NOT NULL,
      dcc_commission_percent numeric(5, 2),
      dcc_commission_amount numeric(12, 2) NOT NULL,
      operator_payable_amount numeric(12, 2) NOT NULL,
      reserve_amount numeric(12, 2) NOT NULL DEFAULT '0.00',
      settlement_status text NOT NULL DEFAULT 'pending',
      service_date date,
      service_completed_at timestamptz,
      paid_at timestamptz,
      cancellation_status text NOT NULL DEFAULT 'none',
      metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  `);
  await executeDdl(sql`CREATE INDEX IF NOT EXISTS dcc_operator_payables_order_id_idx ON dcc_operator_payables (order_id);`);
  await executeDdl(sql`CREATE INDEX IF NOT EXISTS dcc_operator_payables_operator_slug_idx ON dcc_operator_payables (operator_slug);`);
  await executeDdl(sql`CREATE INDEX IF NOT EXISTS dcc_operator_payables_settlement_status_idx ON dcc_operator_payables (settlement_status);`);
  await executeDdl(sql`CREATE INDEX IF NOT EXISTS dcc_operator_payables_service_date_idx ON dcc_operator_payables (service_date);`);

  await executeDdl(sql`
    CREATE TABLE IF NOT EXISTS dcc_disputes_and_refunds (
      id text PRIMARY KEY,
      type text NOT NULL,
      order_id text NOT NULL,
      order_item_id text,
      booking_id text,
      payment_id text NOT NULL,
      operator_slug text NOT NULL,
      amount numeric(12, 2) NOT NULL,
      currency text NOT NULL DEFAULT 'USD',
      status text NOT NULL DEFAULT 'succeeded',
      reason text,
      settlement_impact text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  `);
  await executeDdl(sql`CREATE INDEX IF NOT EXISTS dcc_disputes_and_refunds_order_id_idx ON dcc_disputes_and_refunds (order_id);`);
  await executeDdl(sql`CREATE INDEX IF NOT EXISTS dcc_disputes_and_refunds_operator_slug_idx ON dcc_disputes_and_refunds (operator_slug);`);
  await executeDdl(sql`CREATE INDEX IF NOT EXISTS dcc_disputes_and_refunds_type_idx ON dcc_disputes_and_refunds (type);`);

  await executeDdl(sql`
    CREATE TABLE IF NOT EXISTS dcc_square_webhook_events (
      id text PRIMARY KEY,
      square_event_id text NOT NULL,
      event_type text NOT NULL,
      payment_id text,
      order_id text,
      processing_status text NOT NULL DEFAULT 'processing',
      error_metadata jsonb,
      received_at timestamptz NOT NULL DEFAULT now(),
      processed_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  `);
  await executeDdl(sql`CREATE UNIQUE INDEX IF NOT EXISTS dcc_square_webhook_events_event_id_uidx ON dcc_square_webhook_events (square_event_id);`);
  await executeDdl(sql`CREATE INDEX IF NOT EXISTS dcc_square_webhook_events_event_type_idx ON dcc_square_webhook_events (event_type);`);
  await executeDdl(sql`CREATE INDEX IF NOT EXISTS dcc_square_webhook_events_payment_id_idx ON dcc_square_webhook_events (payment_id);`);
  await executeDdl(sql`CREATE INDEX IF NOT EXISTS dcc_square_webhook_events_order_id_idx ON dcc_square_webhook_events (order_id);`);
  await executeDdl(sql`CREATE INDEX IF NOT EXISTS dcc_square_webhook_events_status_idx ON dcc_square_webhook_events (processing_status);`);

  await executeDdl(sql`
    INSERT INTO earthos_schema_migrations (migration_id, checksum, first_applied_at, last_applied_at, execution_count)
    VALUES ('0008_octo_bookings_idempotency_unique_idx', ${checksum}, now(), now(), 1)
    ON CONFLICT (migration_id) DO UPDATE
      SET checksum = EXCLUDED.checksum,
          last_applied_at = now(),
          execution_count = earthos_schema_migrations.execution_count + 1;
  `);

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
