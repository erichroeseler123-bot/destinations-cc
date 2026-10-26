-- ============================================================================
-- DCC Machine Layer v0.2 — Reversible Down Migration
-- Reverts 0006_dcc_machine_layer_v02.sql cleanly
-- ============================================================================

DROP TRIGGER IF EXISTS "trg_dcc_claim_versions_no_delete_or_content_mutate" ON "dcc_machine_claim_versions";
DROP TRIGGER IF EXISTS "trg_dcc_engine_versions_no_mutate" ON "dcc_machine_engine_versions";
DROP TRIGGER IF EXISTS "trg_dcc_signed_receipts_no_mutate" ON "dcc_machine_signed_receipts";
DROP TRIGGER IF EXISTS "trg_dcc_engine_bundles_no_mutate" ON "dcc_machine_engine_bundles";
DROP TRIGGER IF EXISTS "trg_dcc_candidate_universes_no_mutate" ON "dcc_machine_candidate_universes";
DROP TRIGGER IF EXISTS "trg_dcc_evidence_fragments_no_mutate" ON "dcc_machine_evidence_fragments";
DROP TRIGGER IF EXISTS "trg_dcc_source_snapshots_no_mutate" ON "dcc_machine_source_snapshots";
DROP TRIGGER IF EXISTS "trg_dcc_immutable_objects_no_mutate" ON "dcc_machine_immutable_objects";

DROP FUNCTION IF EXISTS dcc_machine_prevent_immutable_mutation();

DROP TABLE IF EXISTS "dcc_machine_immutable_objects";
DROP TABLE IF EXISTS "dcc_machine_signed_receipts";
DROP TABLE IF EXISTS "dcc_machine_candidate_universes";

ALTER TABLE "dcc_machine_evaluation_traces"
  DROP COLUMN IF EXISTS "known_at",
  DROP COLUMN IF EXISTS "valid_at",
  DROP COLUMN IF EXISTS "evaluation_fingerprint",
  DROP COLUMN IF EXISTS "evaluation_run_id",
  DROP COLUMN IF EXISTS "trace_run_id";

DROP INDEX IF EXISTS "dcc_machine_evaluations_receipt_idx";
DROP INDEX IF EXISTS "dcc_machine_evaluations_fingerprint_idx";

ALTER TABLE "dcc_machine_evaluations"
  DROP COLUMN IF EXISTS "known_at",
  DROP COLUMN IF EXISTS "valid_at",
  DROP COLUMN IF EXISTS "universe_version",
  DROP COLUMN IF EXISTS "universe_id",
  DROP COLUMN IF EXISTS "receipt_id",
  DROP COLUMN IF EXISTS "evaluation_fingerprint",
  DROP COLUMN IF EXISTS "trace_run_id",
  DROP COLUMN IF EXISTS "evaluation_run_id";

DROP INDEX IF EXISTS "dcc_machine_claim_versions_bitemporal_idx";

ALTER TABLE "dcc_machine_claim_versions"
  DROP COLUMN IF EXISTS "provenance_origin",
  DROP COLUMN IF EXISTS "known_to",
  DROP COLUMN IF EXISTS "known_from";
