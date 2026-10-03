-- Migration: 0004_dcc_corridor_events.sql
-- Description: Create dcc_corridor_catalog and dcc_corridor_events tables with indexes

CREATE TABLE IF NOT EXISTS "dcc_corridor_catalog" (
    "corridor_id" text PRIMARY KEY NOT NULL,
    "corridor_name" text NOT NULL,
    "family" text NOT NULL,
    "app_path" text NOT NULL,
    "status" text NOT NULL,
    "continuity_level" text NOT NULL,
    "pattern_family" text,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "dcc_corridor_catalog_family_idx" ON "dcc_corridor_catalog" ("family");
CREATE INDEX IF NOT EXISTS "dcc_corridor_catalog_status_idx" ON "dcc_corridor_catalog" ("status");

CREATE TABLE IF NOT EXISTS "dcc_corridor_events" (
    "event_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
    "corridor_id" text NOT NULL REFERENCES "dcc_corridor_catalog"("corridor_id") ON DELETE RESTRICT,
    "family" text NOT NULL,
    "event_name" text NOT NULL,
    "handoff_id" text,
    "session_id" text,
    "user_id" text,
    "source_page" text,
    "landing_path" text,
    "target_path" text,
    "requested_lane" text,
    "resolved_lane" text,
    "topic" text,
    "subtype" text,
    "port" text,
    "handoff_date" date,
    "default_card_slug" text,
    "clicked_product_slug" text,
    "route_target" text,
    "fit_signal" text,
    "urgency" text,
    "confidence_downgraded" boolean DEFAULT false NOT NULL,
    "winning_rule_ids" text[] DEFAULT '{}'::text[] NOT NULL,
    "winning_fields" jsonb DEFAULT '{}'::jsonb NOT NULL,
    "page_variant" text,
    "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL
);

CREATE INDEX IF NOT EXISTS "dcc_corridor_events_corridor_time_idx" ON "dcc_corridor_events" ("corridor_id", "occurred_at");
CREATE INDEX IF NOT EXISTS "dcc_corridor_events_event_time_idx" ON "dcc_corridor_events" ("event_name", "occurred_at");
CREATE INDEX IF NOT EXISTS "dcc_corridor_events_flow_idx" ON "dcc_corridor_events" ("corridor_id", "handoff_id", "session_id");
CREATE INDEX IF NOT EXISTS "dcc_corridor_events_downgraded_idx" ON "dcc_corridor_events" ("corridor_id", "confidence_downgraded");
CREATE INDEX IF NOT EXISTS "dcc_corridor_events_family_idx" ON "dcc_corridor_events" ("family", "occurred_at");
