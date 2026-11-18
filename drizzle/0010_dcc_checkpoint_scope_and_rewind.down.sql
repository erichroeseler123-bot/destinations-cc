-- Rollback: 0010_dcc_checkpoint_scope_and_rewind.down.sql
-- SAFETY REQUIREMENT:
--   Rollback MUST NOT silently restore the unsafe advanced C1 cursor
--   (MTc5MzQ4NTEzMTAwMDAwMHw1NTY2ODM5UDE=) and MUST NOT reopen the global
--   modified-since cursor to destination-scoped writes.
--
--   Accordingly, this rollback script intentionally retains:
--     1. dcc_catalog_refresh_checkpoints_global_keys_chk
--     2. dcc_catalog_refresh_checkpoints_dest_schedule_key_chk
--     3. dcc_guard_checkpoint_scope_immutability_trg
--     4. The rewound C0 cursor (MTc5MzQ4MTA1OTAwMDAwMHwxMDA1MzlQOQ==, destination_slug = NULL)
--        and the recorded viator_destination_schedule_refresh:juneau receipt row.
--
--   Only the auxiliary backfill prefix check is relaxed if rolling back application code,
--   while DCC_CATALOG_REFRESH_ENABLED MUST remain paused ('0' / unset).

ALTER TABLE dcc_catalog_refresh_checkpoints
  DROP CONSTRAINT IF EXISTS dcc_catalog_refresh_checkpoints_backfill_key_chk;
