-- Rollback: 0009_dcc_tour_catalog_and_refresh_checkpoints.down.sql
-- Non-destructive index rollback only; preserves durable tour catalog data.

DROP INDEX IF EXISTS dcc_catalog_sync_runs_started_at_idx;
DROP INDEX IF EXISTS dcc_tour_catalog_active_dest_sort_idx;
