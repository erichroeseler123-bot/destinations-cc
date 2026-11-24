-- ============================================================================
-- DCC OCTO Stored Operator Agreements & Stable Operator Identity
-- Migration ID: 0012_octo_operator_agreements
-- Reversible via: 0012_octo_operator_agreements.down.sql
-- ============================================================================

CREATE TABLE IF NOT EXISTS "octo_participants" (
  "id" text PRIMARY KEY,
  "operator_id" text,
  "name" text NOT NULL,
  "role" text NOT NULL,
  "website" text NOT NULL,
  "contact_email" text NOT NULL,
  "contact_name" text,
  "destinations" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "endpoint" text,
  "certification_evidence" text,
  "inventory_evidence" text,
  "consent_status" text NOT NULL DEFAULT 'not_requested',
  "credential_status" text NOT NULL DEFAULT 'none',
  "products_available_count" integer,
  "booking_payment_model" text NOT NULL DEFAULT 'supplier_hosted',
  "outreach_status" text NOT NULL DEFAULT 'identified',
  "agreed_commission_percent" numeric(5, 2),
  "notes" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE "octo_participants" ADD COLUMN IF NOT EXISTS "operator_id" text;
ALTER TABLE "octo_participants" ADD COLUMN IF NOT EXISTS "inventory_evidence" text;
ALTER TABLE "octo_participants" ALTER COLUMN "products_available_count" DROP NOT NULL;

CREATE INDEX IF NOT EXISTS "octo_participants_operator_id_idx"
  ON "octo_participants" ("operator_id");
CREATE INDEX IF NOT EXISTS "octo_participants_role_idx"
  ON "octo_participants" ("role");
CREATE INDEX IF NOT EXISTS "octo_participants_outreach_status_idx"
  ON "octo_participants" ("outreach_status");

CREATE TABLE IF NOT EXISTS "octo_operator_agreements" (
  "id" text PRIMARY KEY,
  "operator_id" text NOT NULL,
  "agreement_reference" text NOT NULL,
  "status" text NOT NULL DEFAULT 'active',
  "agreed_commission_percent" numeric(5, 2),
  "payment_model" text NOT NULL DEFAULT 'supplier_hosted',
  "signatory_name" text NOT NULL,
  "signatory_email" text NOT NULL,
  "signed_at" timestamptz NOT NULL,
  "effective_at" timestamptz,
  "expires_at" timestamptz,
  "revoked_at" timestamptz,
  "document_evidence" text,
  "notes" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "octo_operator_agreements_operator_id_idx"
  ON "octo_operator_agreements" ("operator_id");
CREATE UNIQUE INDEX IF NOT EXISTS "octo_operator_agreements_ref_uidx"
  ON "octo_operator_agreements" ("agreement_reference");
CREATE INDEX IF NOT EXISTS "octo_operator_agreements_status_idx"
  ON "octo_operator_agreements" ("status");

CREATE TABLE IF NOT EXISTS "octo_supplier_connections" (
  "id" text PRIMARY KEY,
  "operator_id" text,
  "agreement_id" text,
  "operator_slug" text NOT NULL,
  "operator_name" text NOT NULL,
  "endpoint" text NOT NULL,
  "encrypted_api_key" text,
  "encrypted_bearer_token" text,
  "capabilities" jsonb NOT NULL DEFAULT '["octo/core"]'::jsonb,
  "is_sandbox" boolean NOT NULL DEFAULT false,
  "connection_status" text NOT NULL DEFAULT 'discovery_only',
  "reservation_platform" text NOT NULL DEFAULT 'direct_octo',
  "octo_base_url" text,
  "api_credential_ref" text,
  "authorized_product_ids" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "onboarding_stage" text NOT NULL DEFAULT 'discovered',
  "operator_legal_name" text,
  "business_address" text,
  "signatory_name" text,
  "signatory_email" text,
  "consent_agreement_version" text NOT NULL DEFAULT '1.0',
  "consent_terms_text" text,
  "consented_at" timestamptz,
  "sandbox_verified_at" timestamptz,
  "production_verified_at" timestamptz,
  "payment_model" text NOT NULL DEFAULT 'supplier_hosted',
  "settlement_terms" text,
  "commission_percent" numeric(5, 2),
  "cancellation_rules" jsonb,
  "health_status" text NOT NULL DEFAULT 'untested',
  "last_health_check_at" timestamptz,
  "last_health_check_status" text,
  "provenance" text,
  "last_verification_time" timestamptz,
  "catalog_sync_status" text,
  "catalog_synced_at" timestamptz,
  "availability_test_status" text,
  "availability_tested_at" timestamptz,
  "booking_test_status" text,
  "booking_tested_at" timestamptz,
  "last_sync_at" timestamptz,
  "last_error_message" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE "octo_supplier_connections" ADD COLUMN IF NOT EXISTS "operator_id" text;
ALTER TABLE "octo_supplier_connections" ADD COLUMN IF NOT EXISTS "agreement_id" text;

CREATE INDEX IF NOT EXISTS "octo_supplier_connections_operator_id_idx"
  ON "octo_supplier_connections" ("operator_id");
