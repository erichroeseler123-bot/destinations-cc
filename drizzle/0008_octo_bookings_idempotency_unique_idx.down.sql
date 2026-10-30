-- ============================================================================
-- Rollback for 0008_octo_bookings_idempotency_unique_idx
-- ============================================================================

DROP INDEX IF EXISTS "octo_bookings_idempotency_key_uidx";
CREATE INDEX IF NOT EXISTS "octo_bookings_idempotency_key_idx"
  ON "octo_bookings" ("idempotency_key");
