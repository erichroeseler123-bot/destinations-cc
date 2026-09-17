-- Rollback: 0002_rollback_dcc_invalidated_sessions.sql
-- Description: Drop dcc_invalidated_sessions table and associated indexes

DROP TABLE IF EXISTS "dcc_invalidated_sessions" CASCADE;
