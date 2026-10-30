-- ============================================================================
-- DCC OCTO Booking Idempotency Unique Constraint & Commercial Settlement Tables
-- Migration ID: 0008_octo_bookings_idempotency_unique_idx
-- Reversible via: 0008_octo_bookings_idempotency_unique_idx.down.sql
--
-- Core architectural guarantees:
-- 1. Ensures octo_bookings, octo_settlement_ledger, octo_audit_logs,
--    dcc_order_payments, dcc_orders, dcc_order_items, dcc_operator_payables,
--    dcc_disputes_and_refunds, and dcc_square_webhook_events exist in Postgres.
-- 2. Drops any legacy non-unique octo_bookings_idempotency_key_idx index and
--    enforces the database-level unique constraint index
--    octo_bookings_idempotency_key_uidx ON octo_bookings (idempotency_key)
--    so concurrent cross-worker HOLD_IN_PROGRESS lock inserts fail with
--    Postgres SQLSTATE 23505 (unique_violation).
-- ============================================================================

CREATE TABLE IF NOT EXISTS "octo_bookings" (
  "id" text PRIMARY KEY,
  "booking_uuid" text NOT NULL,
  "idempotency_key" text,
  "idempotency_hash" text,
  "supplier_connection_id" text NOT NULL,
  "reseller_id" text,
  "product_id" text NOT NULL,
  "option_id" text NOT NULL,
  "availability_id" text NOT NULL,
  "status" text NOT NULL DEFAULT 'ON_HOLD',
  "expiration_minutes" integer NOT NULL DEFAULT 15,
  "utc_hold_expires" timestamptz,
  "total_price" numeric(12, 2) NOT NULL,
  "currency" text NOT NULL DEFAULT 'USD',
  "unit_items" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "contact" jsonb,
  "supplier_reference" text,
  "reseller_reference" text,
  "checkout_url" text,
  "voucher" jsonb,
  "cancellation_reason" text,
  "confirmed_at" timestamptz,
  "cancelled_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

-- If a legacy non-unique index existed on octo_bookings(idempotency_key), replace it with the unique constraint index
DROP INDEX IF EXISTS "octo_bookings_idempotency_key_idx";

-- Deduplicate any pre-existing duplicate non-null idempotency_key rows (retaining the earliest created row) before enforcing uniqueness
DELETE FROM "octo_bookings" a
USING "octo_bookings" b
WHERE a."idempotency_key" IS NOT NULL
  AND a."idempotency_key" = b."idempotency_key"
  AND a."ctid" > b."ctid";

CREATE UNIQUE INDEX IF NOT EXISTS "octo_bookings_booking_uuid_uidx"
  ON "octo_bookings" ("booking_uuid");

CREATE UNIQUE INDEX IF NOT EXISTS "octo_bookings_idempotency_key_uidx"
  ON "octo_bookings" ("idempotency_key");

CREATE INDEX IF NOT EXISTS "octo_bookings_status_idx"
  ON "octo_bookings" ("status");

CREATE INDEX IF NOT EXISTS "octo_bookings_product_id_idx"
  ON "octo_bookings" ("product_id");

CREATE INDEX IF NOT EXISTS "octo_bookings_supplier_conn_idx"
  ON "octo_bookings" ("supplier_connection_id");

CREATE TABLE IF NOT EXISTS "octo_settlement_ledger" (
  "id" text PRIMARY KEY,
  "booking_id" text NOT NULL REFERENCES "octo_bookings"("id") ON DELETE CASCADE,
  "dcc_reference" text NOT NULL,
  "supplier_reference" text,
  "operator_slug" text NOT NULL,
  "operator_name" text NOT NULL,
  "currency" text NOT NULL DEFAULT 'USD',
  "gross_amount" numeric(12, 2) NOT NULL,
  "dcc_share_percent" numeric(5, 2) DEFAULT '0.00',
  "dcc_share_amount" numeric(12, 2) NOT NULL,
  "operator_share_amount" numeric(12, 2) NOT NULL,
  "payment_status" text NOT NULL DEFAULT 'unpaid',
  "settlement_status" text NOT NULL DEFAULT 'pending',
  "cancellation_status" text NOT NULL DEFAULT 'none',
  "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "octo_settlement_ledger_booking_id_idx"
  ON "octo_settlement_ledger" ("booking_id");

CREATE INDEX IF NOT EXISTS "octo_settlement_ledger_operator_slug_idx"
  ON "octo_settlement_ledger" ("operator_slug");

CREATE INDEX IF NOT EXISTS "octo_settlement_ledger_settlement_status_idx"
  ON "octo_settlement_ledger" ("settlement_status");

CREATE TABLE IF NOT EXISTS "octo_audit_logs" (
  "id" bigserial PRIMARY KEY,
  "occurred_at" timestamptz NOT NULL DEFAULT now(),
  "action" text NOT NULL,
  "entity_type" text NOT NULL,
  "entity_id" text NOT NULL,
  "status" text NOT NULL,
  "payload" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "error_message" text
);

CREATE INDEX IF NOT EXISTS "octo_audit_logs_entity_idx"
  ON "octo_audit_logs" ("entity_type", "entity_id");

CREATE INDEX IF NOT EXISTS "octo_audit_logs_occurred_at_idx"
  ON "octo_audit_logs" ("occurred_at");

CREATE TABLE IF NOT EXISTS "dcc_order_payments" (
  "id" text PRIMARY KEY,
  "order_id" text NOT NULL,
  "traveler_id" text,
  "amount" numeric(12, 2) NOT NULL,
  "currency" text NOT NULL DEFAULT 'USD',
  "provider" text NOT NULL,
  "status" text NOT NULL,
  "payment_method" text,
  "receipt_url" text,
  "customer_email" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "dcc_order_payments_order_id_idx"
  ON "dcc_order_payments" ("order_id");

CREATE INDEX IF NOT EXISTS "dcc_order_payments_traveler_id_idx"
  ON "dcc_order_payments" ("traveler_id");

CREATE INDEX IF NOT EXISTS "dcc_order_payments_status_idx"
  ON "dcc_order_payments" ("status");

CREATE TABLE IF NOT EXISTS "dcc_orders" (
  "id" text PRIMARY KEY,
  "traveler_id" text,
  "reseller_id" text,
  "status" text NOT NULL DEFAULT 'PENDING_HOLD',
  "currency" text NOT NULL DEFAULT 'USD',
  "total_price" numeric(12, 2) NOT NULL,
  "payment_id" text,
  "payment_status" text NOT NULL DEFAULT 'unpaid',
  "idempotency_key" text,
  "idempotency_hash" text,
  "utc_hold_expires" timestamptz,
  "customer_full_name" text,
  "customer_email" text,
  "customer_phone" text,
  "customer_country" text,
  "customer_notes" text,
  "saga_id" text,
  "saga_status" text NOT NULL DEFAULT 'NOT_STARTED',
  "last_error_code" text,
  "last_error_message" text,
  "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "dcc_orders_traveler_id_idx"
  ON "dcc_orders" ("traveler_id");

CREATE INDEX IF NOT EXISTS "dcc_orders_status_idx"
  ON "dcc_orders" ("status");

CREATE INDEX IF NOT EXISTS "dcc_orders_idempotency_key_idx"
  ON "dcc_orders" ("idempotency_key");

CREATE INDEX IF NOT EXISTS "dcc_orders_saga_id_idx"
  ON "dcc_orders" ("saga_id");

CREATE INDEX IF NOT EXISTS "dcc_orders_created_at_idx"
  ON "dcc_orders" ("created_at");

CREATE TABLE IF NOT EXISTS "dcc_order_items" (
  "id" text PRIMARY KEY,
  "order_id" text NOT NULL,
  "booking_id" text,
  "booking_uuid" text,
  "product_id" text NOT NULL,
  "option_id" text NOT NULL,
  "availability_id" text NOT NULL,
  "supplier_connection_id" text,
  "operator_slug" text NOT NULL,
  "operator_name" text NOT NULL,
  "price" numeric(12, 2) NOT NULL,
  "currency" text NOT NULL DEFAULT 'USD',
  "unit_items" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "status" text NOT NULL DEFAULT 'ON_HOLD',
  "event_date" date,
  "event_time" text,
  "service_completed" boolean NOT NULL DEFAULT false,
  "service_completed_at" timestamptz,
  "voucher" jsonb,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "dcc_order_items_order_id_idx"
  ON "dcc_order_items" ("order_id");

CREATE INDEX IF NOT EXISTS "dcc_order_items_booking_id_idx"
  ON "dcc_order_items" ("booking_id");

CREATE INDEX IF NOT EXISTS "dcc_order_items_operator_slug_idx"
  ON "dcc_order_items" ("operator_slug");

CREATE INDEX IF NOT EXISTS "dcc_order_items_status_idx"
  ON "dcc_order_items" ("status");

CREATE TABLE IF NOT EXISTS "dcc_operator_payables" (
  "id" text PRIMARY KEY,
  "order_id" text NOT NULL,
  "order_item_id" text NOT NULL,
  "booking_id" text NOT NULL,
  "operator_slug" text NOT NULL,
  "operator_name" text NOT NULL,
  "currency" text NOT NULL DEFAULT 'USD',
  "gross_amount" numeric(12, 2) NOT NULL,
  "dcc_commission_percent" numeric(5, 2),
  "dcc_commission_amount" numeric(12, 2) NOT NULL,
  "operator_payable_amount" numeric(12, 2) NOT NULL,
  "reserve_amount" numeric(12, 2) NOT NULL DEFAULT '0.00',
  "settlement_status" text NOT NULL DEFAULT 'pending',
  "service_date" date,
  "service_completed_at" timestamptz,
  "paid_at" timestamptz,
  "cancellation_status" text NOT NULL DEFAULT 'none',
  "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "dcc_operator_payables_order_id_idx"
  ON "dcc_operator_payables" ("order_id");

CREATE INDEX IF NOT EXISTS "dcc_operator_payables_operator_slug_idx"
  ON "dcc_operator_payables" ("operator_slug");

CREATE INDEX IF NOT EXISTS "dcc_operator_payables_settlement_status_idx"
  ON "dcc_operator_payables" ("settlement_status");

CREATE INDEX IF NOT EXISTS "dcc_operator_payables_service_date_idx"
  ON "dcc_operator_payables" ("service_date");

CREATE TABLE IF NOT EXISTS "dcc_disputes_and_refunds" (
  "id" text PRIMARY KEY,
  "type" text NOT NULL,
  "order_id" text NOT NULL,
  "order_item_id" text,
  "booking_id" text,
  "payment_id" text NOT NULL,
  "operator_slug" text NOT NULL,
  "amount" numeric(12, 2) NOT NULL,
  "currency" text NOT NULL DEFAULT 'USD',
  "status" text NOT NULL DEFAULT 'succeeded',
  "reason" text,
  "settlement_impact" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "dcc_disputes_and_refunds_order_id_idx"
  ON "dcc_disputes_and_refunds" ("order_id");

CREATE INDEX IF NOT EXISTS "dcc_disputes_and_refunds_operator_slug_idx"
  ON "dcc_disputes_and_refunds" ("operator_slug");

CREATE INDEX IF NOT EXISTS "dcc_disputes_and_refunds_type_idx"
  ON "dcc_disputes_and_refunds" ("type");

CREATE TABLE IF NOT EXISTS "dcc_square_webhook_events" (
  "id" text PRIMARY KEY,
  "square_event_id" text NOT NULL,
  "event_type" text NOT NULL,
  "payment_id" text,
  "order_id" text,
  "processing_status" text NOT NULL DEFAULT 'processing',
  "error_metadata" jsonb,
  "received_at" timestamptz NOT NULL DEFAULT now(),
  "processed_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "dcc_square_webhook_events_event_id_uidx"
  ON "dcc_square_webhook_events" ("square_event_id");

CREATE INDEX IF NOT EXISTS "dcc_square_webhook_events_event_type_idx"
  ON "dcc_square_webhook_events" ("event_type");

CREATE INDEX IF NOT EXISTS "dcc_square_webhook_events_payment_id_idx"
  ON "dcc_square_webhook_events" ("payment_id");

CREATE INDEX IF NOT EXISTS "dcc_square_webhook_events_order_id_idx"
  ON "dcc_square_webhook_events" ("order_id");

CREATE INDEX IF NOT EXISTS "dcc_square_webhook_events_status_idx"
  ON "dcc_square_webhook_events" ("processing_status");
