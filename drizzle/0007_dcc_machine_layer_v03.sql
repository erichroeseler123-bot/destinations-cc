-- ============================================================================
-- DCC Machine Layer v0.3 — Clean Isolated Schema
-- Migration ID: 0007_dcc_machine_layer_v03
-- Reversible via: 0007_dcc_machine_layer_v03.down.sql
--
-- Core architectural guarantees:
-- 1. Append-only knowledge event ledger (dcc_v03_knowledge_events) enforced by
--    database trigger (UPDATE and DELETE are strictly forbidden).
-- 2. Rebuildable projections (dcc_v03_claim_projections, dcc_v03_identity_projections)
--    derivable 100% from dcc_v03_knowledge_events at any knowledgeCutoff.
-- 3. Persistent external signing key registry and revocation ledger.
-- 4. DCC-native opaque identities, versioned external aliases, and identifier
--    reuse prevention registry.
-- 5. Idempotent ingestion ledger, distributed rate-limit buckets, security
--    audit log, and shadow-mode DecisionAuthorization registry.
-- ============================================================================

-- 1. Append-Only Knowledge & Identity Event Ledger
CREATE TABLE IF NOT EXISTS "dcc_v03_knowledge_events" (
  "event_seq" bigserial PRIMARY KEY,
  "event_id" text NOT NULL UNIQUE,
  "event_type" text NOT NULL,
  "target_type" text NOT NULL,
  "target_id" text NOT NULL,
  "version_id" text,
  "valid_from" timestamptz,
  "valid_to" timestamptz,
  "source_observed_at" timestamptz,
  "source_published_at" timestamptz,
  "retrieved_at" timestamptz,
  "recorded_at" timestamptz,
  "actor_id" text NOT NULL,
  "is_synthetic" boolean NOT NULL DEFAULT false,
  "provenance_class" text NOT NULL DEFAULT 'operational',
  "payload" jsonb NOT NULL,
  "event_hash" text NOT NULL,
  "prev_event_hash" text
);

CREATE INDEX IF NOT EXISTS "dcc_v03_knowledge_events_recorded_idx"
  ON "dcc_v03_knowledge_events" ("recorded_at", "event_seq");
CREATE INDEX IF NOT EXISTS "dcc_v03_knowledge_events_target_idx"
  ON "dcc_v03_knowledge_events" ("target_type", "target_id", "recorded_at");
CREATE INDEX IF NOT EXISTS "dcc_v03_knowledge_events_synthetic_idx"
  ON "dcc_v03_knowledge_events" ("is_synthetic", "recorded_at");

-- Strict database-level append-only trigger for dcc_v03_knowledge_events
CREATE OR REPLACE FUNCTION dcc_v03_prevent_ledger_mutation()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'APPEND_ONLY_LEDGER_VIOLATION: Deleting events from % is strictly forbidden (event_id=%).', TG_TABLE_NAME, OLD.event_id;
  END IF;
  IF TG_OP = 'UPDATE' THEN
    RAISE EXCEPTION 'APPEND_ONLY_LEDGER_VIOLATION: Updating events in % is strictly forbidden (event_id=%). Append a compensating event instead.', TG_TABLE_NAME, OLD.event_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "trg_dcc_v03_knowledge_events_append_only" ON "dcc_v03_knowledge_events";
CREATE TRIGGER "trg_dcc_v03_knowledge_events_append_only"
  BEFORE UPDATE OR DELETE ON "dcc_v03_knowledge_events"
  FOR EACH ROW EXECUTE FUNCTION dcc_v03_prevent_ledger_mutation();

-- 2. Identifier Reuse Prevention Registry (Append-Only)
CREATE TABLE IF NOT EXISTS "dcc_v03_allocated_identifiers" (
  "dcc_id" text PRIMARY KEY,
  "id_kind" text NOT NULL,
  "allocated_at" timestamptz,
  "allocated_by_event_id" text NOT NULL,
  "retired_at" timestamptz
);

CREATE OR REPLACE FUNCTION dcc_v03_prevent_identifier_deletion()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'IDENTIFIER_REUSE_FORBIDDEN: Allocated DCC identifier % cannot be deleted or recycled.', OLD.dcc_id;
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.dcc_id <> NEW.dcc_id THEN
    RAISE EXCEPTION 'IDENTIFIER_REUSE_FORBIDDEN: Allocated DCC identifier % cannot be mutated.', OLD.dcc_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "trg_dcc_v03_allocated_identifiers_no_delete" ON "dcc_v03_allocated_identifiers";
CREATE TRIGGER "trg_dcc_v03_allocated_identifiers_no_delete"
  BEFORE DELETE OR UPDATE ON "dcc_v03_allocated_identifiers"
  FOR EACH ROW EXECUTE FUNCTION dcc_v03_prevent_identifier_deletion();

-- 3. Rebuildable Claim Projections (Derivable 100% from dcc_v03_knowledge_events)
CREATE TABLE IF NOT EXISTS "dcc_v03_claim_projections" (
  "claim_version_id" text PRIMARY KEY,
  "claim_id" text NOT NULL,
  "subject_dcc_id" text NOT NULL,
  "predicate" text NOT NULL,
  "assertion_type" text NOT NULL,
  "epistemic_state" text NOT NULL,
  "lifecycle_state" text NOT NULL,
  "typed_value" jsonb,
  "unit_or_currency" text,
  "valid_from" timestamptz NOT NULL,
  "valid_to" timestamptz,
  "source_observed_at" timestamptz,
  "source_published_at" timestamptz,
  "retrieved_at" timestamptz,
  "recorded_at" timestamptz,
  "freshness_ttl_seconds" integer NOT NULL DEFAULT 86400,
  "source_authority" jsonb NOT NULL,
  "evidence_refs" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "superseded_by_version_id" text,
  "supersedes_version_id" text,
  "withdrawal_event_id" text,
  "dispute_event_ids" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "is_synthetic" boolean NOT NULL DEFAULT false,
  "projected_at_cutoff" timestamptz NOT NULL,
  "source_event_id" text NOT NULL
);

CREATE INDEX IF NOT EXISTS "dcc_v03_claim_projections_claim_idx"
  ON "dcc_v03_claim_projections" ("claim_id", "recorded_at");
CREATE INDEX IF NOT EXISTS "dcc_v03_claim_projections_subject_idx"
  ON "dcc_v03_claim_projections" ("subject_dcc_id", "predicate");

-- 4. Rebuildable Identity & External Alias Projections
CREATE TABLE IF NOT EXISTS "dcc_v03_identity_projections" (
  "dcc_entity_id" text PRIMARY KEY,
  "entity_type" text NOT NULL,
  "display_name" text NOT NULL,
  "lifecycle_status" text NOT NULL,
  "merged_into_dcc_entity_id" text,
  "split_into_dcc_entity_ids" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "active_external_aliases" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "historical_external_aliases" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "attributes" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "is_synthetic" boolean NOT NULL DEFAULT false,
  "recorded_at" timestamptz NOT NULL,
  "projected_at_cutoff" timestamptz NOT NULL
);

-- 5. Persistent JWS / EdDSA Signing Key Registry & Revocation Ledger
CREATE TABLE IF NOT EXISTS "dcc_v03_signing_keys" (
  "kid" text PRIMARY KEY,
  "alg" text NOT NULL DEFAULT 'EdDSA',
  "kty" text NOT NULL DEFAULT 'OKP',
  "crv" text NOT NULL DEFAULT 'Ed25519',
  "x" text NOT NULL,
  "jwk_thumbprint_sha256" text NOT NULL,
  "public_jwk" jsonb NOT NULL,
  "status" text NOT NULL,
  "issuer" text NOT NULL,
  "created_at" timestamptz NOT NULL,
  "retired_at" timestamptz,
  "revoked_at" timestamptz,
  "revocation_reason" text
);

-- 6. Declared Candidate Universes (v0.3)
CREATE TABLE IF NOT EXISTS "dcc_v03_candidate_universes" (
  "universe_hash" text PRIMARY KEY,
  "universe_id" text NOT NULL,
  "version" text NOT NULL,
  "engine_id" text NOT NULL,
  "engine_version" text NOT NULL,
  "effective_from" timestamptz NOT NULL,
  "effective_to" timestamptz,
  "knowledge_cutoff" timestamptz NOT NULL,
  "refresh_deadline" timestamptz NOT NULL,
  "generator_version" text NOT NULL,
  "is_synthetic" boolean NOT NULL DEFAULT false,
  "payload" jsonb NOT NULL,
  "recorded_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "dcc_v03_candidate_universes_uid_ver_uniq" UNIQUE ("universe_id", "version")
);

-- 7. Compiled Decision IR Bundles (v0.3)
CREATE TABLE IF NOT EXISTS "dcc_v03_engine_bundles" (
  "bundle_hash" text PRIMARY KEY,
  "engine_id" text NOT NULL,
  "engine_version" text NOT NULL,
  "compiler_version" text NOT NULL,
  "universe_hash" text NOT NULL,
  "knowledge_cutoff" timestamptz NOT NULL,
  "is_synthetic" boolean NOT NULL DEFAULT false,
  "bundle_payload" jsonb NOT NULL,
  "recorded_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "dcc_v03_engine_bundles_eng_ver_uniq" UNIQUE ("engine_id", "engine_version")
);

-- 8. Standardized JWS Signed Decision Receipts (Full SHA-256 IDs)
CREATE TABLE IF NOT EXISTS "dcc_v03_signed_receipts" (
  "receipt_id" text PRIMARY KEY,
  "evaluation_run_id" text NOT NULL,
  "trace_run_id" text NOT NULL,
  "evaluation_fingerprint" text NOT NULL,
  "execution_class" text NOT NULL,
  "is_synthetic" boolean NOT NULL DEFAULT false,
  "engine_id" text NOT NULL,
  "engine_version" text NOT NULL,
  "compiler_version" text NOT NULL,
  "bundle_hash" text NOT NULL,
  "universe_id" text NOT NULL,
  "universe_version" text NOT NULL,
  "universe_hash" text NOT NULL,
  "valid_at" timestamptz NOT NULL,
  "knowledge_cutoff" timestamptz NOT NULL,
  "issued_at" timestamptz NOT NULL,
  "kid" text NOT NULL,
  "alg" text NOT NULL DEFAULT 'EdDSA',
  "rfc8785_payload_sha256" text NOT NULL,
  "jws_compact" text NOT NULL,
  "receipt_payload" jsonb NOT NULL,
  "trace_payload" jsonb NOT NULL
);

CREATE INDEX IF NOT EXISTS "dcc_v03_signed_receipts_fp_idx"
  ON "dcc_v03_signed_receipts" ("evaluation_fingerprint");

-- 9. Shadow-Mode DecisionAuthorizations
CREATE TABLE IF NOT EXISTS "dcc_v03_decision_authorizations" (
  "authorization_id" text PRIMARY KEY,
  "receipt_id" text NOT NULL,
  "execution_mode" text NOT NULL DEFAULT 'shadow_only_no_side_effects',
  "permitted_action" text NOT NULL,
  "candidate_dcc_entity_id" text NOT NULL,
  "target_adapter" text NOT NULL,
  "max_price_minor_units" integer NOT NULL,
  "currency" text NOT NULL,
  "idempotency_key" text NOT NULL UNIQUE,
  "revocation_status" text NOT NULL DEFAULT 'active',
  "issued_at" timestamptz NOT NULL,
  "expires_at" timestamptz NOT NULL,
  "authorization_jws" text NOT NULL,
  "authorization_payload" jsonb NOT NULL
);

-- 10. Idempotent Ingestion & Duplicate-Delivery Ledger
CREATE TABLE IF NOT EXISTS "dcc_v03_ingestion_idempotency" (
  "idempotency_key" text PRIMARY KEY,
  "canonical_url" text NOT NULL,
  "content_sha256" text NOT NULL,
  "snapshot_id" text NOT NULL,
  "first_ingested_at" timestamptz NOT NULL DEFAULT now(),
  "last_seen_at" timestamptz NOT NULL DEFAULT now(),
  "delivery_count" integer NOT NULL DEFAULT 1,
  "response_envelope" jsonb NOT NULL
);

-- 11. Distributed Rate-Limit Buckets & Security Audit Events
CREATE TABLE IF NOT EXISTS "dcc_v03_rate_limit_buckets" (
  "bucket_key" text PRIMARY KEY,
  "window_start_ms" bigint NOT NULL,
  "request_count" integer NOT NULL DEFAULT 1,
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "dcc_v03_security_audit_events" (
  "audit_seq" bigserial PRIMARY KEY,
  "audit_id" text NOT NULL UNIQUE,
  "event_category" text NOT NULL,
  "severity" text NOT NULL,
  "actor_or_ip" text NOT NULL,
  "endpoint_or_target" text NOT NULL,
  "reason_code" text NOT NULL,
  "details" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "occurred_at" timestamptz NOT NULL DEFAULT now()
);

-- 12. Test-Only Content-Addressed Object Table (Explicitly Non-R2 Test Backend)
CREATE TABLE IF NOT EXISTS "dcc_v03_test_object_blobs" (
  "object_key" text PRIMARY KEY,
  "sha256_hex" text NOT NULL,
  "content_type" text NOT NULL,
  "byte_length" integer NOT NULL,
  "is_private_capture" boolean NOT NULL DEFAULT true,
  "retention_until" timestamptz,
  "body_base64" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION dcc_v03_prevent_blob_mutation()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'IMMUTABLE_OBJECT_VIOLATION: Mutating or deleting content-addressed blob in % is forbidden.', TG_TABLE_NAME;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "trg_dcc_v03_test_object_blobs_immutable" ON "dcc_v03_test_object_blobs";
CREATE TRIGGER "trg_dcc_v03_test_object_blobs_immutable"
  BEFORE UPDATE OR DELETE ON "dcc_v03_test_object_blobs"
  FOR EACH ROW EXECUTE FUNCTION dcc_v03_prevent_blob_mutation();
