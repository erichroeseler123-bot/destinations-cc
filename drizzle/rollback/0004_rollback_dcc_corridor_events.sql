-- Rollback Migration: 0004_rollback_dcc_corridor_events.sql
-- Description: Drop dcc_corridor_events and dcc_corridor_catalog tables

DROP TABLE IF EXISTS "dcc_corridor_events" CASCADE;
DROP TABLE IF EXISTS "dcc_corridor_catalog" CASCADE;
