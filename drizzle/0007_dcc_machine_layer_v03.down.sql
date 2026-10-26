-- ============================================================================
-- DCC Machine Layer v0.3 — Reversible Down Migration
-- Reverts 0007_dcc_machine_layer_v03.sql cleanly
-- ============================================================================

DROP TRIGGER IF EXISTS "trg_dcc_v03_test_object_blobs_immutable" ON "dcc_v03_test_object_blobs";
DROP FUNCTION IF EXISTS dcc_v03_prevent_blob_mutation();
DROP TABLE IF EXISTS "dcc_v03_test_object_blobs";

DROP TABLE IF EXISTS "dcc_v03_security_audit_events";
DROP TABLE IF EXISTS "dcc_v03_rate_limit_buckets";
DROP TABLE IF EXISTS "dcc_v03_ingestion_idempotency";
DROP TABLE IF EXISTS "dcc_v03_decision_authorizations";
DROP TABLE IF EXISTS "dcc_v03_signed_receipts";
DROP TABLE IF EXISTS "dcc_v03_engine_bundles";
DROP TABLE IF EXISTS "dcc_v03_candidate_universes";
DROP TABLE IF EXISTS "dcc_v03_signing_keys";
DROP TABLE IF EXISTS "dcc_v03_identity_projections";
DROP TABLE IF EXISTS "dcc_v03_claim_projections";

DROP TRIGGER IF EXISTS "trg_dcc_v03_allocated_identifiers_no_delete" ON "dcc_v03_allocated_identifiers";
DROP FUNCTION IF EXISTS dcc_v03_prevent_identifier_deletion();
DROP TABLE IF EXISTS "dcc_v03_allocated_identifiers";

DROP TRIGGER IF EXISTS "trg_dcc_v03_knowledge_events_append_only" ON "dcc_v03_knowledge_events";
DROP FUNCTION IF EXISTS dcc_v03_prevent_ledger_mutation();
DROP TABLE IF EXISTS "dcc_v03_knowledge_events";
