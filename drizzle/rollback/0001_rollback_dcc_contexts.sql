-- Rollback: 0001_rollback_dcc_contexts.sql
-- Description: Drop dcc_contexts table and enum type

DROP TABLE IF EXISTS "dcc_contexts" CASCADE;
DROP TYPE IF EXISTS "dcc_context_status" CASCADE;
