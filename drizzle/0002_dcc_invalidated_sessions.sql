-- Migration: 0002_dcc_invalidated_sessions.sql
-- Description: Create dcc_invalidated_sessions table for durable cross-instance session revocation

CREATE TABLE IF NOT EXISTS "dcc_invalidated_sessions" (
	"session_id" text PRIMARY KEY NOT NULL,
	"context_id" text NOT NULL,
	"owner" text NOT NULL,
	"reason" text,
	"invalidated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);

CREATE INDEX IF NOT EXISTS "dcc_invalidated_sessions_context_idx" ON "dcc_invalidated_sessions" ("context_id");
CREATE INDEX IF NOT EXISTS "dcc_invalidated_sessions_expires_at_idx" ON "dcc_invalidated_sessions" ("expires_at");
