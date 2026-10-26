-- Rollback Migration: 0005_dcc_machine_layer_v01.down.sql
-- Description: Cleanly reverses 0005_dcc_machine_layer_v01.sql without touching any pre-existing DCC tables.

DROP TABLE IF EXISTS "dcc_machine_change_events" CASCADE;
DROP TABLE IF EXISTS "dcc_machine_retractions" CASCADE;
DROP TABLE IF EXISTS "dcc_machine_evaluation_traces" CASCADE;
DROP TABLE IF EXISTS "dcc_machine_evaluations" CASCADE;
DROP TABLE IF EXISTS "dcc_machine_engine_bundles" CASCADE;
DROP TABLE IF EXISTS "dcc_machine_engine_versions" CASCADE;
DROP TABLE IF EXISTS "dcc_machine_engines" CASCADE;
DROP TABLE IF EXISTS "dcc_machine_rule_sets" CASCADE;
DROP TABLE IF EXISTS "dcc_machine_rules" CASCADE;
DROP TABLE IF EXISTS "dcc_machine_claim_conflicts" CASCADE;
DROP TABLE IF EXISTS "dcc_machine_claim_versions" CASCADE;
DROP TABLE IF EXISTS "dcc_machine_claims" CASCADE;
DROP TABLE IF EXISTS "dcc_machine_evidence_fragments" CASCADE;
DROP TABLE IF EXISTS "dcc_machine_source_snapshots" CASCADE;
DROP TABLE IF EXISTS "dcc_machine_sources" CASCADE;
DROP TABLE IF EXISTS "dcc_machine_entities" CASCADE;

DROP TYPE IF EXISTS dcc_machine_epistemic_kind;
DROP TYPE IF EXISTS dcc_machine_epistemic_status;
