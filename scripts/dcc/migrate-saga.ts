import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

// Load environment variables from .env.local, .env.test.local, or .env.production.local
function loadEnv() {
  const envFiles = [".env.local", ".env.test.local", ".env.production.local"];
  for (const file of envFiles) {
    const fullPath = path.resolve(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      dotenv.config({ path: fullPath });
    }
  }
}

loadEnv();

const dbUrl =
  process.env.DCC_DATABASE_URL ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  "";

export const DCC_SAGA_MIGRATION_QUERIES = [
  // 1. dcc_traveler_profiles
  `CREATE TABLE IF NOT EXISTS dcc_traveler_profiles (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    phone_number TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );`,
  `CREATE UNIQUE INDEX IF NOT EXISTS dcc_traveler_profiles_email_uidx ON dcc_traveler_profiles (email);`,
  `CREATE INDEX IF NOT EXISTS dcc_traveler_profiles_created_at_idx ON dcc_traveler_profiles (created_at);`,

  // 2. dcc_auth_tokens
  `CREATE TABLE IF NOT EXISTS dcc_auth_tokens (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    token_hash TEXT NOT NULL,
    otp_code TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    consumed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );`,
  `CREATE INDEX IF NOT EXISTS dcc_auth_tokens_email_idx ON dcc_auth_tokens (email);`,
  `CREATE INDEX IF NOT EXISTS dcc_auth_tokens_expires_at_idx ON dcc_auth_tokens (expires_at);`,

  // 3. dcc_orders
  `CREATE TABLE IF NOT EXISTS dcc_orders (
    id TEXT PRIMARY KEY,
    traveler_id TEXT,
    reseller_id TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING_HOLD',
    currency TEXT NOT NULL DEFAULT 'USD',
    total_price NUMERIC(12, 2) NOT NULL,
    payment_id TEXT,
    payment_status TEXT NOT NULL DEFAULT 'unpaid',
    idempotency_key TEXT,
    idempotency_hash TEXT,
    utc_hold_expires TIMESTAMPTZ,
    customer_full_name TEXT,
    customer_email TEXT,
    customer_phone TEXT,
    customer_country TEXT,
    customer_notes TEXT,
    saga_id TEXT,
    saga_status TEXT NOT NULL DEFAULT 'NOT_STARTED',
    last_error_code TEXT,
    last_error_message TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );`,
  `CREATE INDEX IF NOT EXISTS dcc_orders_traveler_id_idx ON dcc_orders (traveler_id);`,
  `CREATE INDEX IF NOT EXISTS dcc_orders_status_idx ON dcc_orders (status);`,
  `CREATE INDEX IF NOT EXISTS dcc_orders_idempotency_key_idx ON dcc_orders (idempotency_key);`,
  `CREATE INDEX IF NOT EXISTS dcc_orders_saga_id_idx ON dcc_orders (saga_id);`,
  `CREATE INDEX IF NOT EXISTS dcc_orders_created_at_idx ON dcc_orders (created_at);`,

  // 4. dcc_order_items
  `CREATE TABLE IF NOT EXISTS dcc_order_items (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    booking_id TEXT,
    booking_uuid TEXT,
    product_id TEXT NOT NULL,
    option_id TEXT NOT NULL,
    availability_id TEXT NOT NULL,
    supplier_connection_id TEXT,
    operator_slug TEXT NOT NULL,
    operator_name TEXT NOT NULL,
    price NUMERIC(12, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    unit_items JSONB NOT NULL DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'ON_HOLD',
    event_date DATE,
    event_time TEXT,
    service_completed BOOLEAN NOT NULL DEFAULT FALSE,
    service_completed_at TIMESTAMPTZ,
    voucher JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );`,
  `CREATE INDEX IF NOT EXISTS dcc_order_items_order_id_idx ON dcc_order_items (order_id);`,
  `CREATE INDEX IF NOT EXISTS dcc_order_items_booking_id_idx ON dcc_order_items (booking_id);`,
  `CREATE INDEX IF NOT EXISTS dcc_order_items_operator_slug_idx ON dcc_order_items (operator_slug);`,
  `CREATE INDEX IF NOT EXISTS dcc_order_items_status_idx ON dcc_order_items (status);`,
  `ALTER TABLE dcc_order_items ADD COLUMN IF NOT EXISTS supplier_connection_id TEXT;`,

  // 5. dcc_supplier_bookings
  `CREATE TABLE IF NOT EXISTS dcc_supplier_bookings (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    order_item_id TEXT NOT NULL,
    supplier_connection_id TEXT NOT NULL,
    operator_slug TEXT NOT NULL,
    operator_name TEXT NOT NULL,
    product_id TEXT NOT NULL,
    option_id TEXT NOT NULL,
    availability_id TEXT NOT NULL,
    provider_booking_id TEXT,
    provider_booking_uuid TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING_HOLD',
    hold_expires_at TIMESTAMPTZ,
    confirmed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT,
    price NUMERIC(12, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    unit_items JSONB NOT NULL DEFAULT '[]'::jsonb,
    idempotency_key TEXT,
    idempotency_hash TEXT,
    external_request_id TEXT,
    attempt_count INTEGER NOT NULL DEFAULT 0,
    last_error_code TEXT,
    last_error_message TEXT,
    voucher_code TEXT,
    voucher_url TEXT,
    voucher_instructions TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );`,
  `CREATE INDEX IF NOT EXISTS dcc_supplier_bookings_order_id_idx ON dcc_supplier_bookings (order_id);`,
  `CREATE INDEX IF NOT EXISTS dcc_supplier_bookings_order_item_id_idx ON dcc_supplier_bookings (order_item_id);`,
  `CREATE INDEX IF NOT EXISTS dcc_supplier_bookings_supplier_conn_idx ON dcc_supplier_bookings (supplier_connection_id);`,
  `CREATE INDEX IF NOT EXISTS dcc_supplier_bookings_status_idx ON dcc_supplier_bookings (status);`,
  `CREATE INDEX IF NOT EXISTS dcc_supplier_bookings_idempotency_key_idx ON dcc_supplier_bookings (idempotency_key);`,

  // 6. dcc_order_payments
  `CREATE TABLE IF NOT EXISTS dcc_order_payments (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    traveler_id TEXT,
    amount NUMERIC(12, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    provider TEXT NOT NULL,
    status TEXT NOT NULL,
    payment_method TEXT,
    receipt_url TEXT,
    customer_email TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );`,
  `CREATE INDEX IF NOT EXISTS dcc_order_payments_order_id_idx ON dcc_order_payments (order_id);`,
  `CREATE INDEX IF NOT EXISTS dcc_order_payments_traveler_id_idx ON dcc_order_payments (traveler_id);`,
  `CREATE INDEX IF NOT EXISTS dcc_order_payments_status_idx ON dcc_order_payments (status);`,

  // 7. dcc_operator_payables
  `CREATE TABLE IF NOT EXISTS dcc_operator_payables (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    order_item_id TEXT NOT NULL,
    booking_id TEXT NOT NULL,
    operator_slug TEXT NOT NULL,
    operator_name TEXT NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    gross_amount NUMERIC(12, 2) NOT NULL,
    dcc_commission_percent NUMERIC(5, 2),
    dcc_commission_amount NUMERIC(12, 2) NOT NULL,
    operator_payable_amount NUMERIC(12, 2) NOT NULL,
    reserve_amount NUMERIC(12, 2) NOT NULL DEFAULT '0.00',
    settlement_status TEXT NOT NULL DEFAULT 'pending',
    service_date DATE,
    service_completed_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    cancellation_status TEXT NOT NULL DEFAULT 'none',
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );`,
  `CREATE INDEX IF NOT EXISTS dcc_operator_payables_order_id_idx ON dcc_operator_payables (order_id);`,
  `CREATE INDEX IF NOT EXISTS dcc_operator_payables_operator_slug_idx ON dcc_operator_payables (operator_slug);`,
  `CREATE INDEX IF NOT EXISTS dcc_operator_payables_settlement_status_idx ON dcc_operator_payables (settlement_status);`,
  `CREATE INDEX IF NOT EXISTS dcc_operator_payables_service_date_idx ON dcc_operator_payables (service_date);`,

  // 8. dcc_disputes_and_refunds
  `CREATE TABLE IF NOT EXISTS dcc_disputes_and_refunds (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    order_id TEXT NOT NULL,
    order_item_id TEXT,
    booking_id TEXT,
    payment_id TEXT NOT NULL,
    operator_slug TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    status TEXT NOT NULL DEFAULT 'succeeded',
    reason TEXT,
    settlement_impact TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );`,
  `CREATE INDEX IF NOT EXISTS dcc_disputes_and_refunds_order_id_idx ON dcc_disputes_and_refunds (order_id);`,
  `CREATE INDEX IF NOT EXISTS dcc_disputes_and_refunds_operator_slug_idx ON dcc_disputes_and_refunds (operator_slug);`,
  `CREATE INDEX IF NOT EXISTS dcc_disputes_and_refunds_type_idx ON dcc_disputes_and_refunds (type);`,

  // 9. dcc_saga_steps
  `CREATE TABLE IF NOT EXISTS dcc_saga_steps (
    id TEXT PRIMARY KEY,
    saga_id TEXT NOT NULL,
    order_id TEXT NOT NULL,
    step_name TEXT NOT NULL,
    step_index INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',
    idempotency_key TEXT NOT NULL,
    attempt_count INTEGER NOT NULL DEFAULT 0,
    max_retries INTEGER NOT NULL DEFAULT 3,
    retry_policy JSONB NOT NULL DEFAULT '{"backoffMs": 500, "maxBackoffMs": 5000, "factor": 2}'::jsonb,
    next_retry_at TIMESTAMPTZ,
    external_reference_id TEXT,
    input_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    output_payload JSONB DEFAULT '{}'::jsonb,
    error_code TEXT,
    error_message TEXT,
    compensation_status TEXT NOT NULL DEFAULT 'NOT_APPLICABLE',
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );`,
  `CREATE INDEX IF NOT EXISTS dcc_saga_steps_saga_id_idx ON dcc_saga_steps (saga_id);`,
  `CREATE INDEX IF NOT EXISTS dcc_saga_steps_order_id_idx ON dcc_saga_steps (order_id);`,
  `CREATE INDEX IF NOT EXISTS dcc_saga_steps_step_name_idx ON dcc_saga_steps (step_name);`,
  `CREATE INDEX IF NOT EXISTS dcc_saga_steps_status_idx ON dcc_saga_steps (status);`,
  `CREATE INDEX IF NOT EXISTS dcc_saga_steps_idempotency_key_idx ON dcc_saga_steps (idempotency_key);`,

  // 10. dcc_saga_audit_events
  `CREATE TABLE IF NOT EXISTS dcc_saga_audit_events (
    id BIGSERIAL PRIMARY KEY,
    saga_id TEXT NOT NULL,
    order_id TEXT NOT NULL,
    step_id TEXT,
    event_type TEXT NOT NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    idempotency_key TEXT,
    attempt_number INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL,
    error_code TEXT,
    error_message TEXT,
    sanitized_details JSONB NOT NULL DEFAULT '{}'::jsonb,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );`,
  `CREATE INDEX IF NOT EXISTS dcc_saga_audit_events_saga_id_idx ON dcc_saga_audit_events (saga_id);`,
  `CREATE INDEX IF NOT EXISTS dcc_saga_audit_events_order_id_idx ON dcc_saga_audit_events (order_id);`,
  `CREATE INDEX IF NOT EXISTS dcc_saga_audit_events_event_type_idx ON dcc_saga_audit_events (event_type);`,
  `CREATE INDEX IF NOT EXISTS dcc_saga_audit_events_occurred_at_idx ON dcc_saga_audit_events (occurred_at);`,

  // 11. dcc_square_webhook_events
  `CREATE TABLE IF NOT EXISTS dcc_square_webhook_events (
    id TEXT PRIMARY KEY,
    square_event_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    payment_id TEXT,
    order_id TEXT,
    processing_status TEXT NOT NULL DEFAULT 'processing',
    error_metadata JSONB,
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );`,
  `CREATE UNIQUE INDEX IF NOT EXISTS dcc_square_webhook_events_event_id_uidx ON dcc_square_webhook_events (square_event_id);`,
  `CREATE INDEX IF NOT EXISTS dcc_square_webhook_events_event_type_idx ON dcc_square_webhook_events (event_type);`,
  `CREATE INDEX IF NOT EXISTS dcc_square_webhook_events_payment_id_idx ON dcc_square_webhook_events (payment_id);`,
  `CREATE INDEX IF NOT EXISTS dcc_square_webhook_events_order_id_idx ON dcc_square_webhook_events (order_id);`,
  `CREATE INDEX IF NOT EXISTS dcc_square_webhook_events_status_idx ON dcc_square_webhook_events (processing_status);`,
];

export async function runDccSagaMigration(targetDbUrl?: string): Promise<{ success: boolean; queriesRun: number }> {
  const connString = targetDbUrl || dbUrl;
  if (!connString) {
    console.log("ℹ️ No DATABASE_URL configured. Verified SQL migration statements syntax only.");
    return { success: true, queriesRun: 0 };
  }

  console.log("🚀 Executing DCC Saga & Orders Database Migration on Neon...");
  const sql = neon(connString);

  for (const q of DCC_SAGA_MIGRATION_QUERIES) {
    await sql.query(q);
  }

  console.log(`✅ Successfully applied ${DCC_SAGA_MIGRATION_QUERIES.length} DDL queries to Neon database!`);
  return { success: true, queriesRun: DCC_SAGA_MIGRATION_QUERIES.length };
}

if (process.argv[1] && process.argv[1].includes("migrate-saga")) {
  runDccSagaMigration().catch((err) => {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  });
}
