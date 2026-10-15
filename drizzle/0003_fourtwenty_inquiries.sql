-- Migration: 0003_fourtwenty_inquiries.sql
-- Description: Create isolated fourtwenty_inquiries and fourtwenty_outbox tables

DO $$ BEGIN
 CREATE TYPE "fourtwenty_outbox_status" AS ENUM('pending', 'claimed', 'dispatched', 'failed', 'dead_letter');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "fourtwenty_inquiries" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "reference_id" text NOT NULL,
    "idempotency_key" text NOT NULL,
    "customer_name" text NOT NULL,
    "customer_phone" text NOT NULL,
    "passenger_count" integer DEFAULT 1 NOT NULL,
    "pickup_location" text DEFAULT 'Denver International Airport (DEN)' NOT NULL,
    "destination_address" text NOT NULL,
    "airline" text NOT NULL,
    "flight_number" text NOT NULL,
    "arrival_timestamp" timestamp with time zone NOT NULL,
    "base_rate_quoted" numeric(10, 2) DEFAULT '99.00' NOT NULL,
    "currency" text DEFAULT 'USD' NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "fourtwenty_inquiries_ref_uidx" ON "fourtwenty_inquiries" ("reference_id");
CREATE UNIQUE INDEX IF NOT EXISTS "fourtwenty_inquiries_idemp_uidx" ON "fourtwenty_inquiries" ("idempotency_key");
CREATE INDEX IF NOT EXISTS "fourtwenty_inquiries_arrival_idx" ON "fourtwenty_inquiries" ("arrival_timestamp");

CREATE TABLE IF NOT EXISTS "fourtwenty_outbox" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "inquiry_id" uuid NOT NULL REFERENCES "fourtwenty_inquiries"("id") ON DELETE CASCADE,
    "reference_id" text NOT NULL,
    "channel" text DEFAULT 'email' NOT NULL,
    "payload" jsonb NOT NULL,
    "status" "fourtwenty_outbox_status" DEFAULT 'pending' NOT NULL,
    "attempts" integer DEFAULT 0 NOT NULL,
    "locked_at" timestamp with time zone,
    "last_error" text,
    "next_retry_at" timestamp with time zone DEFAULT now() NOT NULL,
    "dispatched_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "fourtwenty_outbox_queue_idx" ON "fourtwenty_outbox" ("status", "next_retry_at") WHERE "status" = 'pending';
CREATE INDEX IF NOT EXISTS "fourtwenty_outbox_ref_idx" ON "fourtwenty_outbox" ("reference_id");
