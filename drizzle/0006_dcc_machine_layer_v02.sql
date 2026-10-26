-- ============================================================================
-- DCC Machine Layer v0.2 — Additive Migration (Bitemporal, Universes, Receipts, Immutable Objects)
-- Migration ID: 0006_dcc_machine_layer_v02
-- Reversible via: 0006_dcc_machine_layer_v02.down.sql
-- ============================================================================

-- 1. Add Bitemporal & Provenance Columns to dcc_machine_claim_versions
ALTER TABLE "dcc_machine_claim_versions"
  ADD COLUMN IF NOT EXISTS "known_from" timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS "known_to" timestamptz,
  ADD COLUMN IF NOT EXISTS "provenance_origin" text NOT NULL DEFAULT 'curated_seed_fixture';

CREATE INDEX IF NOT EXISTS "dcc_machine_claim_versions_bitemporal_idx"
  ON "dcc_machine_claim_versions" ("claim_id", "known_from", "known_to", "valid_from", "valid_to");

-- 2. Declared Candidate Universes (Versioned & Content-Addressed)
CREATE TABLE IF NOT EXISTS "dcc_machine_candidate_universes" (
  "id" text PRIMARY KEY,
  "universe_id" text NOT NULL,
  "version" text NOT NULL,
  "domain_pack_version" text NOT NULL,
  "engine_id" text NOT NULL,
  "engine_version" text NOT NULL,
  "geographic_scope" jsonb NOT NULL,
  "temporal_scope" jsonb NOT NULL,
  "inclusion_methodology" text NOT NULL,
  "sources_consulted" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "included_candidate_ids" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "known_exclusions" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "unresolved_coverage_gaps" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "refreshed_at" timestamptz NOT NULL,
  "coverage_status" text NOT NULL,
  "epistemic_disclaimer" text NOT NULL,
  "canonical_hash" text NOT NULL,
  "storage_uri" text NOT NULL,
  "payload" jsonb NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "dcc_machine_candidate_universes_uid_ver_uniq" UNIQUE ("universe_id", "version")
);

CREATE INDEX IF NOT EXISTS "dcc_machine_candidate_universes_engine_idx"
  ON "dcc_machine_candidate_universes" ("engine_id", "engine_version");

-- 3. Extend Evaluations & Traces with Content Identity vs Audit Identity & Bitemporal Window
ALTER TABLE "dcc_machine_evaluations"
  ADD COLUMN IF NOT EXISTS "evaluation_run_id" text,
  ADD COLUMN IF NOT EXISTS "trace_run_id" text,
  ADD COLUMN IF NOT EXISTS "evaluation_fingerprint" text,
  ADD COLUMN IF NOT EXISTS "receipt_id" text,
  ADD COLUMN IF NOT EXISTS "universe_id" text,
  ADD COLUMN IF NOT EXISTS "universe_version" text,
  ADD COLUMN IF NOT EXISTS "valid_at" timestamptz,
  ADD COLUMN IF NOT EXISTS "known_at" timestamptz;

CREATE INDEX IF NOT EXISTS "dcc_machine_evaluations_fingerprint_idx"
  ON "dcc_machine_evaluations" ("evaluation_fingerprint");
CREATE INDEX IF NOT EXISTS "dcc_machine_evaluations_receipt_idx"
  ON "dcc_machine_evaluations" ("receipt_id");

ALTER TABLE "dcc_machine_evaluation_traces"
  ADD COLUMN IF NOT EXISTS "trace_run_id" text,
  ADD COLUMN IF NOT EXISTS "evaluation_run_id" text,
  ADD COLUMN IF NOT EXISTS "evaluation_fingerprint" text,
  ADD COLUMN IF NOT EXISTS "valid_at" timestamptz,
  ADD COLUMN IF NOT EXISTS "known_at" timestamptz;

-- 4. Signed Decision Receipts
CREATE TABLE IF NOT EXISTS "dcc_machine_signed_receipts" (
  "receipt_id" text PRIMARY KEY,
  "evaluation_run_id" text NOT NULL,
  "trace_run_id" text NOT NULL,
  "evaluation_fingerprint" text NOT NULL,
  "engine_id" text NOT NULL,
  "engine_version" text NOT NULL,
  "bundle_hash" text NOT NULL,
  "universe_id" text NOT NULL,
  "universe_version" text NOT NULL,
  "universe_hash" text NOT NULL,
  "valid_at" timestamptz NOT NULL,
  "known_at" timestamptz NOT NULL,
  "normalized_input_hash" text NOT NULL,
  "result_hash" text NOT NULL,
  "trace_hash" text NOT NULL,
  "decision_state" text NOT NULL,
  "recommended_candidate_id" text,
  "key_id" text NOT NULL,
  "algorithm" text NOT NULL,
  "signature" text NOT NULL,
  "issued_at" timestamptz NOT NULL,
  "public_key_discovery_uri" text NOT NULL,
  "epistemic_limitation_statement" text NOT NULL,
  "canonical_payload" jsonb NOT NULL,
  "receipt_envelope" jsonb NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "dcc_machine_signed_receipts_engine_idx"
  ON "dcc_machine_signed_receipts" ("engine_id", "engine_version", "issued_at");
CREATE INDEX IF NOT EXISTS "dcc_machine_signed_receipts_fingerprint_idx"
  ON "dcc_machine_signed_receipts" ("evaluation_fingerprint");

-- 5. Durable Content-Addressed Immutable Object Store Table
CREATE TABLE IF NOT EXISTS "dcc_machine_immutable_objects" (
  "object_uri" text PRIMARY KEY,
  "category" text NOT NULL,
  "sha256_hash" text NOT NULL,
  "content_type" text NOT NULL DEFAULT 'application/json',
  "size_bytes" integer NOT NULL,
  "body_text" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "dcc_machine_immutable_objects_hash_idx"
  ON "dcc_machine_immutable_objects" ("sha256_hash");

-- 6. Database-Level Immutability Enforcement Trigger for Published Artifacts
CREATE OR REPLACE FUNCTION dcc_machine_prevent_immutable_mutation()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'IMMUTABLE_ARTIFACT_MUTATION_FORBIDDEN: Deleting published artifact in % is forbidden (id=%).', TG_TABLE_NAME, OLD;
  END IF;
  IF TG_OP = 'UPDATE' THEN
    RAISE EXCEPTION 'IMMUTABLE_ARTIFACT_MUTATION_FORBIDDEN: Overwriting published artifact in % is forbidden.', TG_TABLE_NAME;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "trg_dcc_immutable_objects_no_mutate" ON "dcc_machine_immutable_objects";
CREATE TRIGGER "trg_dcc_immutable_objects_no_mutate"
  BEFORE UPDATE OR DELETE ON "dcc_machine_immutable_objects"
  FOR EACH ROW EXECUTE FUNCTION dcc_machine_prevent_immutable_mutation();

DROP TRIGGER IF EXISTS "trg_dcc_source_snapshots_no_mutate" ON "dcc_machine_source_snapshots";
CREATE TRIGGER "trg_dcc_source_snapshots_no_mutate"
  BEFORE UPDATE OR DELETE ON "dcc_machine_source_snapshots"
  FOR EACH ROW EXECUTE FUNCTION dcc_machine_prevent_immutable_mutation();

DROP TRIGGER IF EXISTS "trg_dcc_evidence_fragments_no_mutate" ON "dcc_machine_evidence_fragments";
CREATE TRIGGER "trg_dcc_evidence_fragments_no_mutate"
  BEFORE UPDATE OR DELETE ON "dcc_machine_evidence_fragments"
  FOR EACH ROW EXECUTE FUNCTION dcc_machine_prevent_immutable_mutation();

DROP TRIGGER IF EXISTS "trg_dcc_candidate_universes_no_mutate" ON "dcc_machine_candidate_universes";
CREATE TRIGGER "trg_dcc_candidate_universes_no_mutate"
  BEFORE UPDATE OR DELETE ON "dcc_machine_candidate_universes"
  FOR EACH ROW EXECUTE FUNCTION dcc_machine_prevent_immutable_mutation();

DROP TRIGGER IF EXISTS "trg_dcc_engine_bundles_no_mutate" ON "dcc_machine_engine_bundles";
CREATE TRIGGER "trg_dcc_engine_bundles_no_mutate"
  BEFORE UPDATE OR DELETE ON "dcc_machine_engine_bundles"
  FOR EACH ROW EXECUTE FUNCTION dcc_machine_prevent_immutable_mutation();

DROP TRIGGER IF EXISTS "trg_dcc_signed_receipts_no_mutate" ON "dcc_machine_signed_receipts";
CREATE TRIGGER "trg_dcc_signed_receipts_no_mutate"
  BEFORE UPDATE OR DELETE ON "dcc_machine_signed_receipts"
  FOR EACH ROW EXECUTE FUNCTION dcc_machine_prevent_immutable_mutation();

DROP TRIGGER IF EXISTS "trg_dcc_engine_versions_no_mutate" ON "dcc_machine_engine_versions";
CREATE TRIGGER "trg_dcc_engine_versions_no_mutate"
  BEFORE UPDATE OR DELETE ON "dcc_machine_engine_versions"
  FOR EACH ROW EXECUTE FUNCTION dcc_machine_prevent_immutable_mutation();

DROP TRIGGER IF EXISTS "trg_dcc_claim_versions_no_delete_or_content_mutate" ON "dcc_machine_claim_versions";
CREATE TRIGGER "trg_dcc_claim_versions_no_delete_or_content_mutate"
  BEFORE DELETE OR UPDATE OF "typed_value", "evidence_hash", "subject", "predicate", "valid_from", "known_from", "source_snapshot_id", "evidence_fragment_id"
  ON "dcc_machine_claim_versions"
  FOR EACH ROW EXECUTE FUNCTION dcc_machine_prevent_immutable_mutation();
