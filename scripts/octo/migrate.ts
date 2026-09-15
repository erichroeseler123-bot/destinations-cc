import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

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

if (!dbUrl) {
  console.error("❌ No database URL configured in environment.");
  process.exit(1);
}

const sql = neon(dbUrl);

async function runMigration() {
  console.log("🚀 Starting OCTO Database Migration on Neon...");

  const queries = [
    // 1. octo_participants
    `CREATE TABLE IF NOT EXISTS octo_participants (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      website TEXT NOT NULL,
      contact_email TEXT NOT NULL,
      contact_name TEXT,
      destinations JSONB NOT NULL DEFAULT '[]'::jsonb,
      endpoint TEXT,
      certification_evidence TEXT,
      consent_status TEXT NOT NULL DEFAULT 'not_requested',
      credential_status TEXT NOT NULL DEFAULT 'none',
      products_available_count INTEGER NOT NULL DEFAULT 0,
      booking_payment_model TEXT NOT NULL DEFAULT 'supplier_hosted',
      outreach_status TEXT NOT NULL DEFAULT 'identified',
      agreed_commission_percent NUMERIC(5, 2) NOT NULL DEFAULT 5.00,
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );`,
    `CREATE INDEX IF NOT EXISTS octo_participants_role_idx ON octo_participants (role);`,
    `CREATE INDEX IF NOT EXISTS octo_participants_outreach_status_idx ON octo_participants (outreach_status);`,

    // 2. octo_supplier_connections
    `CREATE TABLE IF NOT EXISTS octo_supplier_connections (
      id TEXT PRIMARY KEY,
      operator_slug TEXT NOT NULL,
      operator_name TEXT NOT NULL,
      endpoint TEXT NOT NULL,
      encrypted_api_key TEXT,
      encrypted_bearer_token TEXT,
      capabilities JSONB NOT NULL DEFAULT '["octo/core"]'::jsonb,
      consent_agreement_version TEXT NOT NULL DEFAULT '1.0',
      consented_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      payment_model TEXT NOT NULL DEFAULT 'supplier_hosted',
      commission_percent NUMERIC(5, 2) NOT NULL DEFAULT 5.00,
      health_status TEXT NOT NULL DEFAULT 'untested',
      last_sync_at TIMESTAMPTZ,
      last_error_message TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );`,
    `CREATE INDEX IF NOT EXISTS octo_supplier_connections_operator_slug_idx ON octo_supplier_connections (operator_slug);`,
    `CREATE INDEX IF NOT EXISTS octo_supplier_connections_health_status_idx ON octo_supplier_connections (health_status);`,

    // 3. octo_normalized_products
    `CREATE TABLE IF NOT EXISTS octo_normalized_products (
      id TEXT PRIMARY KEY,
      supplier_connection_id TEXT NOT NULL REFERENCES octo_supplier_connections (id) ON DELETE CASCADE,
      supplier_product_reference TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      destination_slug TEXT NOT NULL,
      destination_name TEXT,
      country TEXT,
      location_name TEXT,
      latitude NUMERIC(9, 6),
      longitude NUMERIC(9, 6),
      default_currency TEXT NOT NULL DEFAULT 'USD',
      duration_minutes INTEGER,
      meeting_point TEXT,
      cancellation_policy TEXT,
      capabilities JSONB NOT NULL DEFAULT '["octo/core"]'::jsonb,
      options JSONB NOT NULL DEFAULT '[]'::jsonb,
      pricing_from NUMERIC(10, 2),
      image_url TEXT,
      source_freshness TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );`,
    `CREATE INDEX IF NOT EXISTS octo_normalized_products_destination_slug_idx ON octo_normalized_products (destination_slug);`,
    `CREATE INDEX IF NOT EXISTS octo_normalized_products_supplier_conn_idx ON octo_normalized_products (supplier_connection_id);`,

    // 4. octo_bookings
    `CREATE TABLE IF NOT EXISTS octo_bookings (
      id TEXT PRIMARY KEY,
      booking_uuid TEXT NOT NULL UNIQUE,
      supplier_connection_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      option_id TEXT NOT NULL,
      availability_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'ON_HOLD',
      expiration_minutes INTEGER NOT NULL DEFAULT 15,
      utc_hold_expires TIMESTAMPTZ,
      total_price NUMERIC(12, 2) NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      unit_items JSONB NOT NULL DEFAULT '[]'::jsonb,
      contact JSONB,
      supplier_reference TEXT,
      reseller_reference TEXT,
      checkout_url TEXT,
      voucher JSONB,
      cancellation_reason TEXT,
      confirmed_at TIMESTAMPTZ,
      cancelled_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );`,
    `CREATE UNIQUE INDEX IF NOT EXISTS octo_bookings_booking_uuid_uidx ON octo_bookings (booking_uuid);`,
    `CREATE INDEX IF NOT EXISTS octo_bookings_status_idx ON octo_bookings (status);`,
    `CREATE INDEX IF NOT EXISTS octo_bookings_product_id_idx ON octo_bookings (product_id);`,
    `CREATE INDEX IF NOT EXISTS octo_bookings_supplier_conn_idx ON octo_bookings (supplier_connection_id);`,

    // 5. octo_settlement_ledger
    `CREATE TABLE IF NOT EXISTS octo_settlement_ledger (
      id TEXT PRIMARY KEY,
      booking_id TEXT NOT NULL REFERENCES octo_bookings (id) ON DELETE CASCADE,
      dcc_reference TEXT NOT NULL,
      supplier_reference TEXT,
      operator_slug TEXT NOT NULL,
      operator_name TEXT NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      gross_amount NUMERIC(12, 2) NOT NULL,
      dcc_share_percent NUMERIC(5, 2) NOT NULL DEFAULT 5.00,
      dcc_share_amount NUMERIC(12, 2) NOT NULL,
      operator_share_amount NUMERIC(12, 2) NOT NULL,
      payment_status TEXT NOT NULL DEFAULT 'unpaid',
      settlement_status TEXT NOT NULL DEFAULT 'pending',
      cancellation_status TEXT NOT NULL DEFAULT 'none',
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );`,
    `CREATE INDEX IF NOT EXISTS octo_settlement_ledger_booking_id_idx ON octo_settlement_ledger (booking_id);`,
    `CREATE INDEX IF NOT EXISTS octo_settlement_ledger_operator_slug_idx ON octo_settlement_ledger (operator_slug);`,
    `CREATE INDEX IF NOT EXISTS octo_settlement_ledger_settlement_status_idx ON octo_settlement_ledger (settlement_status);`,

    // 6. octo_audit_logs
    `CREATE TABLE IF NOT EXISTS octo_audit_logs (
      id BIGSERIAL PRIMARY KEY,
      occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      status TEXT NOT NULL,
      payload JSONB NOT NULL DEFAULT '{}'::jsonb,
      error_message TEXT
    );`,
    `CREATE INDEX IF NOT EXISTS octo_audit_logs_entity_idx ON octo_audit_logs (entity_type, entity_id);`,
    `CREATE INDEX IF NOT EXISTS octo_audit_logs_occurred_at_idx ON octo_audit_logs (occurred_at);`,

    // 7. Migrations / column additions for existing tables (idempotent)
    `ALTER TABLE octo_supplier_connections ADD COLUMN IF NOT EXISTS is_sandbox BOOLEAN NOT NULL DEFAULT FALSE;`,
    `ALTER TABLE octo_supplier_connections ADD COLUMN IF NOT EXISTS onboarding_stage TEXT NOT NULL DEFAULT 'discovered';`,
    `ALTER TABLE octo_supplier_connections ADD COLUMN IF NOT EXISTS operator_legal_name TEXT;`,
    `ALTER TABLE octo_supplier_connections ADD COLUMN IF NOT EXISTS business_address TEXT;`,
    `ALTER TABLE octo_supplier_connections ADD COLUMN IF NOT EXISTS signatory_name TEXT;`,
    `ALTER TABLE octo_supplier_connections ADD COLUMN IF NOT EXISTS signatory_email TEXT;`,
    `ALTER TABLE octo_supplier_connections ADD COLUMN IF NOT EXISTS consent_terms_text TEXT;`,
    `ALTER TABLE octo_supplier_connections ADD COLUMN IF NOT EXISTS settlement_terms TEXT;`,
    `ALTER TABLE octo_supplier_connections ADD COLUMN IF NOT EXISTS last_health_check_at TIMESTAMPTZ;`,
    `ALTER TABLE octo_supplier_connections ADD COLUMN IF NOT EXISTS last_health_check_status TEXT;`,
    `ALTER TABLE octo_supplier_connections ADD COLUMN IF NOT EXISTS catalog_sync_status TEXT;`,
    `ALTER TABLE octo_supplier_connections ADD COLUMN IF NOT EXISTS catalog_synced_at TIMESTAMPTZ;`,
    `ALTER TABLE octo_supplier_connections ADD COLUMN IF NOT EXISTS availability_test_status TEXT;`,
    `ALTER TABLE octo_supplier_connections ADD COLUMN IF NOT EXISTS availability_tested_at TIMESTAMPTZ;`,
    `ALTER TABLE octo_supplier_connections ADD COLUMN IF NOT EXISTS booking_test_status TEXT;`,
    `ALTER TABLE octo_supplier_connections ADD COLUMN IF NOT EXISTS booking_tested_at TIMESTAMPTZ;`,
    `CREATE INDEX IF NOT EXISTS octo_supplier_connections_onboarding_stage_idx ON octo_supplier_connections (onboarding_stage);`,

    `ALTER TABLE octo_bookings ADD COLUMN IF NOT EXISTS idempotency_key TEXT;`,
    `ALTER TABLE octo_bookings ADD COLUMN IF NOT EXISTS idempotency_hash TEXT;`,
    `ALTER TABLE octo_bookings ADD COLUMN IF NOT EXISTS reseller_id TEXT;`,
    `CREATE INDEX IF NOT EXISTS octo_bookings_idempotency_key_idx ON octo_bookings (idempotency_key);`,

    `ALTER TABLE octo_supplier_connections ADD COLUMN IF NOT EXISTS connection_status TEXT NOT NULL DEFAULT 'discovery_only';`,
    `ALTER TABLE octo_supplier_connections ADD COLUMN IF NOT EXISTS reservation_platform TEXT NOT NULL DEFAULT 'direct_octo';`,
    `ALTER TABLE octo_supplier_connections ADD COLUMN IF NOT EXISTS octo_base_url TEXT;`,
    `ALTER TABLE octo_supplier_connections ADD COLUMN IF NOT EXISTS api_credential_ref TEXT;`,
    `ALTER TABLE octo_supplier_connections ADD COLUMN IF NOT EXISTS authorized_product_ids JSONB NOT NULL DEFAULT '[]'::jsonb;`,
    `ALTER TABLE octo_supplier_connections ADD COLUMN IF NOT EXISTS sandbox_verified_at TIMESTAMPTZ;`,
    `ALTER TABLE octo_supplier_connections ADD COLUMN IF NOT EXISTS production_verified_at TIMESTAMPTZ;`,
    `ALTER TABLE octo_supplier_connections ADD COLUMN IF NOT EXISTS cancellation_rules JSONB;`,
    `ALTER TABLE octo_supplier_connections ADD COLUMN IF NOT EXISTS provenance TEXT;`,
    `ALTER TABLE octo_supplier_connections ADD COLUMN IF NOT EXISTS last_verification_time TIMESTAMPTZ;`,
    `CREATE INDEX IF NOT EXISTS octo_supplier_connections_connection_status_idx ON octo_supplier_connections (connection_status);`,
  ];

  for (const q of queries) {
    await sql.query(q);
  }

  console.log("✅ All OCTO tables created or verified successfully in Neon!");
}

runMigration().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
