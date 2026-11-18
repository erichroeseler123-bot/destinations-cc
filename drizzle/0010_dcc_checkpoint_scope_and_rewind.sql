-- Migration: 0010_dcc_checkpoint_scope_and_rewind.sql
-- Description:
--   1. Preserve PRIMARY KEY (stream_key) on dcc_catalog_refresh_checkpoints.
--   2. Record the completed Juneau bounded refresh under viator_destination_schedule_refresh:juneau.
--   3. Idempotently rewind global viator_availability_schedules_modified_since to saved pre-Juneau
--      cursor C0 (MTc5MzQ4MTA1OTAwMDAwMHwxMDA1MzlQOQ==) with destination_slug = NULL.
--   4. Add database-enforced CHECK constraints and an immutable-scope BEFORE UPDATE trigger so:
--      - Global modified-since keys strictly require destination_slug IS NULL.
--      - viator_destination_schedule_refresh:<slug> strictly requires a non-null matching destination_slug.
--      - Destination-bounded operations are structurally unable to overwrite a global cursor.

-- Step 1: Record the completed Juneau bounded refresh under its own destination-scoped key (idempotent).
INSERT INTO dcc_catalog_refresh_checkpoints (
  stream_key,
  provider,
  destination_slug,
  cursor_value,
  next_start_offset,
  provider_total_count,
  status,
  metadata_json,
  updated_at
) VALUES (
  'viator_destination_schedule_refresh:juneau',
  'viator_destination_schedule_refresh',
  'juneau',
  'completed:sync:viator:schedule_pricing_refresh:1795018428460',
  NULL,
  104,
  'completed',
  jsonb_build_object(
    'checkpointContractVersion', 'v2',
    'recordedByMigration', '0010_dcc_checkpoint_scope_and_rewind',
    'runId', 'sync:viator:schedule_pricing_refresh:1795018428460',
    'idempotencyIdentifier', 'juneau-only-prod-refresh-20261118-6476cd69',
    'destinationSlug', 'juneau',
    'storageSource', 'postgres',
    'candidatesSelected', 20,
    'updatedCount', 20,
    'retiredCount', 0,
    'rejectedCount', 0,
    'refreshedCodes', jsonb_build_array(
      '110048P1', '110048P2', '306071P3', '390453P1', '466119P2',
      '466119P3', '466119P4', '5508048P5', '5527090P1', '5857P22',
      '5857P23', '5857SHUTTLE', '60598P2', '62390P4', '74349P1',
      '209615P550', '331813P1', '408328P5', '408328P6', '408328P7'
    ),
    'completedAt', '2026-11-18T16:13:55.542Z'
  ),
  '2026-11-18T16:13:55.536Z'::timestamptz
)
ON CONFLICT (stream_key) DO NOTHING;

-- Step 2: Ensure global viator_availability_schedules_modified_since exists and is rewound to C0
-- whenever it carries a non-null destination_slug or has not yet been upgraded to contract v2.
INSERT INTO dcc_catalog_refresh_checkpoints (
  stream_key,
  provider,
  destination_slug,
  cursor_value,
  next_start_offset,
  provider_total_count,
  status,
  metadata_json,
  updated_at
) VALUES (
  'viator_availability_schedules_modified_since',
  'viator_schedule_pricing',
  NULL,
  'MTc5MzQ4MTA1OTAwMDAwMHwxMDA1MzlQOQ==',
  NULL,
  NULL,
  'completed',
  jsonb_build_object(
    'checkpointContractVersion', 'v2',
    'repairedByMigration', '0010_dcc_checkpoint_scope_and_rewind',
    'repairedToBaselineCursor', 'MTc5MzQ4MTA1OTAwMDAwMHwxMDA1MzlQOQ=='
  ),
  now()
)
ON CONFLICT (stream_key) DO NOTHING;

UPDATE dcc_catalog_refresh_checkpoints
SET
  provider = 'viator_schedule_pricing',
  destination_slug = NULL,
  cursor_value = 'MTc5MzQ4MTA1OTAwMDAwMHwxMDA1MzlQOQ==',
  next_start_offset = NULL,
  status = 'completed',
  metadata_json = COALESCE(metadata_json, '{}'::jsonb) || jsonb_build_object(
    'checkpointContractVersion', 'v2',
    'repairedByMigration', '0010_dcc_checkpoint_scope_and_rewind',
    'repairedToBaselineCursor', 'MTc5MzQ4MTA1OTAwMDAwMHwxMDA1MzlQOQ==',
    'previousCursorBeforeRepair', cursor_value,
    'previousDestinationSlugBeforeRepair', destination_slug
  ),
  updated_at = now()
WHERE stream_key = 'viator_availability_schedules_modified_since'
  AND (
    destination_slug IS NOT NULL
    OR COALESCE(metadata_json->>'checkpointContractVersion', '') <> 'v2'
  );

UPDATE dcc_catalog_refresh_checkpoints
SET
  destination_slug = NULL,
  metadata_json = COALESCE(metadata_json, '{}'::jsonb) || jsonb_build_object(
    'checkpointContractVersion', 'v2'
  )
WHERE stream_key = 'viator_products_modified_since'
  AND (
    destination_slug IS NOT NULL
    OR COALESCE(metadata_json->>'checkpointContractVersion', '') <> 'v2'
  );

-- Step 3: Enforce global vs. destination-scoped invariants via idempotent CHECK constraints.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.dcc_catalog_refresh_checkpoints'::regclass
      AND conname = 'dcc_catalog_refresh_checkpoints_global_keys_chk'
  ) THEN
    ALTER TABLE dcc_catalog_refresh_checkpoints
      ADD CONSTRAINT dcc_catalog_refresh_checkpoints_global_keys_chk
      CHECK (
        CASE
          WHEN stream_key IN (
            'viator_products_modified_since',
            'viator_availability_schedules_modified_since'
          )
          OR stream_key LIKE '%\_modified\_since' ESCAPE '\'
          OR provider IN ('viator_incremental', 'viator_schedule_pricing')
          THEN destination_slug IS NULL
          ELSE destination_slug IS NOT NULL
               AND btrim(destination_slug) <> ''
               AND destination_slug = lower(btrim(destination_slug))
        END
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.dcc_catalog_refresh_checkpoints'::regclass
      AND conname = 'dcc_catalog_refresh_checkpoints_dest_schedule_key_chk'
  ) THEN
    ALTER TABLE dcc_catalog_refresh_checkpoints
      ADD CONSTRAINT dcc_catalog_refresh_checkpoints_dest_schedule_key_chk
      CHECK (
        (
          stream_key NOT LIKE 'viator_destination_schedule_refresh:%'
          AND provider <> 'viator_destination_schedule_refresh'
        )
        OR (
          provider = 'viator_destination_schedule_refresh'
          AND destination_slug IS NOT NULL
          AND btrim(destination_slug) <> ''
          AND destination_slug = lower(btrim(destination_slug))
          AND stream_key = ('viator_destination_schedule_refresh:' || destination_slug)
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.dcc_catalog_refresh_checkpoints'::regclass
      AND conname = 'dcc_catalog_refresh_checkpoints_backfill_key_chk'
  ) THEN
    ALTER TABLE dcc_catalog_refresh_checkpoints
      ADD CONSTRAINT dcc_catalog_refresh_checkpoints_backfill_key_chk
      CHECK (
        stream_key NOT LIKE 'viator_backfill:%'
        OR (
          destination_slug IS NOT NULL
          AND btrim(destination_slug) <> ''
          AND destination_slug = lower(btrim(destination_slug))
          AND stream_key = ('viator_backfill:' || destination_slug)
        )
      );
  END IF;
END
$$;

-- Step 4: Enforce immutable scope on existing checkpoint keys (prevents UPDATE from converting a
-- global cursor to a destination cursor or mutating a destination cursor across destinations).
CREATE OR REPLACE FUNCTION dcc_guard_checkpoint_scope_immutability()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.destination_slug IS DISTINCT FROM NEW.destination_slug THEN
    RAISE EXCEPTION
      'checkpoint_scope_violation: cannot mutate destination_slug on existing stream_key % (from % to %)',
      OLD.stream_key,
      COALESCE(OLD.destination_slug, 'NULL'),
      COALESCE(NEW.destination_slug, 'NULL')
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgrelid = 'public.dcc_catalog_refresh_checkpoints'::regclass
      AND tgname = 'dcc_guard_checkpoint_scope_immutability_trg'
  ) THEN
    CREATE TRIGGER dcc_guard_checkpoint_scope_immutability_trg
      BEFORE UPDATE ON dcc_catalog_refresh_checkpoints
      FOR EACH ROW
      EXECUTE FUNCTION dcc_guard_checkpoint_scope_immutability();
  END IF;
END
$$;
