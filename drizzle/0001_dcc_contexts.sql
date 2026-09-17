-- Migration: 0001_dcc_contexts.sql
-- Description: Create dcc_contexts table for DCC Opaque Context Protocol v1

DO $$ BEGIN
 CREATE TYPE "dcc_context_status" AS ENUM('issued', 'redeemed', 'expired', 'revoked');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "dcc_contexts" (
	"context_id" text PRIMARY KEY NOT NULL,
	"context_hash" text NOT NULL,
	"idempotency_key" text,
	"version" text DEFAULT '1.0' NOT NULL,
	"status" "dcc_context_status" DEFAULT 'issued' NOT NULL,
	"source_site" text NOT NULL,
	"destination" text NOT NULL,
	"target_owner" text NOT NULL,
	"target_intent" text,
	"timezone" text NOT NULL,
	"schedule_date" text NOT NULL,
	"arrival" text,
	"departure" text,
	"travelers" integer DEFAULT 1 NOT NULL,
	"ship_or_venue" text,
	"buffer_minutes" integer DEFAULT 0 NOT NULL,
	"latest_safe_return_date" text,
	"latest_safe_return_time" text,
	"midnight_crossed" boolean DEFAULT false NOT NULL,
	"attribution" jsonb,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"redeemed_at" timestamp with time zone,
	"redeemed_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "dcc_contexts_hash_uidx" ON "dcc_contexts" ("context_hash");
CREATE UNIQUE INDEX IF NOT EXISTS "dcc_contexts_idempotency_uidx" ON "dcc_contexts" ("idempotency_key");
CREATE INDEX IF NOT EXISTS "dcc_contexts_status_idx" ON "dcc_contexts" ("status");
CREATE INDEX IF NOT EXISTS "dcc_contexts_expires_at_idx" ON "dcc_contexts" ("expires_at");
CREATE INDEX IF NOT EXISTS "dcc_contexts_target_owner_idx" ON "dcc_contexts" ("target_owner");