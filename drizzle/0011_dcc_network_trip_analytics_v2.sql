-- DCC Network Traffic & Trip-Lifecycle Analytics v2 (Complete Additive Nonprod/Prod Schema)
-- Strictly additive: creates only `dcc_analytics_*` tables.
-- Do NOT execute against Production until separately authorized.

CREATE TABLE IF NOT EXISTS "dcc_analytics_runtime_controls" (
  "control_key" text PRIMARY KEY,
  "bool_value" boolean NOT NULL DEFAULT false,
  "str_value" text,
  "updated_by" text,
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "dcc_analytics_ingest_queue" (
  "queue_seq" bigserial PRIMARY KEY,
  "logical_event_id" text NOT NULL UNIQUE,
  "delivery_id" text,
  "environment" text NOT NULL,
  "site_id" text NOT NULL,
  "event_type" text NOT NULL,
  "traffic_class" text NOT NULL,
  "occurred_at" timestamptz NOT NULL,
  "received_at" timestamptz NOT NULL DEFAULT now(),
  "status" text NOT NULL DEFAULT 'queued',
  "claimed_by" text,
  "claim_expires_at" timestamptz,
  "attempts" integer NOT NULL DEFAULT 0,
  "last_error" text,
  "payload_json" jsonb NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_dcc_analytics_queue_claimable"
  ON "dcc_analytics_ingest_queue" ("status", "claim_expires_at", "queue_seq");

CREATE TABLE IF NOT EXISTS "dcc_analytics_events" (
  "logical_event_id" text PRIMARY KEY,
  "delivery_id" text,
  "schema_version" text NOT NULL,
  "event_type" text NOT NULL,
  "layer" text NOT NULL,
  "environment" text NOT NULL,
  "site_id" text NOT NULL,
  "traffic_class" text NOT NULL,
  "classification_reason" text NOT NULL,
  "occurred_at" timestamptz NOT NULL,
  "received_at" timestamptz NOT NULL,
  "processed_at" timestamptz NOT NULL DEFAULT now(),
  "reporting_subject_id" text,
  "key_version" integer NOT NULL DEFAULT 1,
  "session_key" text,
  "canonical_path" text NOT NULL,
  "landing_path" text NOT NULL,
  "referrer_domain" text,
  "utm_source" text,
  "utm_medium" text,
  "utm_campaign" text,
  "content_family" text NOT NULL,
  "handoff_id" text,
  "click_id" text,
  "continuity_tier" text NOT NULL DEFAULT 'none',
  "target_site_id" text,
  "provider" text,
  "product_code" text,
  "physical_sailing_id" text,
  "hosted_departure_id" text,
  "journey_kind" text,
  "draft_key_hash" text,
  "analytics_trip_key" text,
  "participant_role" text,
  "participant_key" text,
  "party_headcount_total" integer,
  "sub_milestone" text,
  "is_template_or_hydration" boolean NOT NULL DEFAULT false,
  "is_noop_save" boolean NOT NULL DEFAULT false,
  "lead_time_bucket" text,
  "confirmation_provenance_json" jsonb,
  "outcome_type" text,
  "gross_amount_usd" numeric(12, 2),
  "commission_amount_usd" numeric(12, 2),
  "props_json" jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS "idx_dcc_analytics_events_env_time"
  ON "dcc_analytics_events" ("environment", "occurred_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_dcc_analytics_events_env_site_time"
  ON "dcc_analytics_events" ("environment", "site_id", "occurred_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_dcc_analytics_events_subj"
  ON "dcc_analytics_events" ("environment", "site_id", "reporting_subject_id", "occurred_at");
CREATE INDEX IF NOT EXISTS "idx_dcc_analytics_events_trip"
  ON "dcc_analytics_events" ("environment", "analytics_trip_key", "occurred_at");
CREATE INDEX IF NOT EXISTS "idx_dcc_analytics_events_handoff"
  ON "dcc_analytics_events" ("environment", "handoff_id");

CREATE TABLE IF NOT EXISTS "dcc_analytics_hourly_rollups" (
  "environment" text NOT NULL,
  "hour_bucket_iso" text NOT NULL,
  "site_id" text NOT NULL,
  "content_family" text NOT NULL,
  "traffic_class" text NOT NULL,
  "pageviews_count" integer NOT NULL DEFAULT 0,
  "guide_engagements_count" integer NOT NULL DEFAULT 0,
  "printable_opens_count" integer NOT NULL DEFAULT 0,
  "cross_site_clicks_count" integer NOT NULL DEFAULT 0,
  "cross_site_arrivals_count" integer NOT NULL DEFAULT 0,
  "verified_ctx_arrivals_count" integer NOT NULL DEFAULT 0,
  "seller_handoffs_count" integer NOT NULL DEFAULT 0,
  "unidentified_outbound_count" integer NOT NULL DEFAULT 0,
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("environment", "hour_bucket_iso", "site_id", "content_family", "traffic_class")
);

CREATE INDEX IF NOT EXISTS "idx_dcc_analytics_hourly_env_hour"
  ON "dcc_analytics_hourly_rollups" ("environment", "hour_bucket_iso");

CREATE TABLE IF NOT EXISTS "dcc_analytics_subject_activity" (
  "environment" text NOT NULL,
  "site_id" text NOT NULL,
  "subject_id" text NOT NULL,
  "first_pageview_at" text NOT NULL,
  "last_pageview_at" text NOT NULL,
  "total_pageviews" integer NOT NULL DEFAULT 1,
  "distinct_session_count" integer NOT NULL DEFAULT 1,
  "distinct_day_count" integer NOT NULL DEFAULT 1,
  "last_session_key" text,
  "last_day_bucket" text NOT NULL,
  "first_landing_path" text NOT NULL,
  "first_utm_source" text,
  "first_utm_campaign" text,
  "first_referrer_domain" text,
  PRIMARY KEY ("environment", "site_id", "subject_id")
);

CREATE TABLE IF NOT EXISTS "dcc_analytics_daily_subjects" (
  "environment" text NOT NULL,
  "day_bucket" text NOT NULL,
  "site_id" text NOT NULL,
  "content_family" text NOT NULL,
  "subject_id" text NOT NULL,
  "session_count" integer NOT NULL DEFAULT 1,
  "pageview_count" integer NOT NULL DEFAULT 1,
  "first_seen_in_day_at" text NOT NULL,
  "last_seen_in_day_at" text NOT NULL,
  "is_returning_subject" integer NOT NULL DEFAULT 0,
  "landing_path" text NOT NULL,
  "utm_source" text,
  "utm_campaign" text,
  "referrer_domain" text,
  PRIMARY KEY ("environment", "day_bucket", "site_id", "content_family", "subject_id")
);

CREATE INDEX IF NOT EXISTS "idx_dcc_analytics_daily_subj_env_day"
  ON "dcc_analytics_daily_subjects" ("environment", "day_bucket");

CREATE TABLE IF NOT EXISTS "dcc_analytics_daily_sessions" (
  "environment" text NOT NULL,
  "day_bucket" text NOT NULL,
  "site_id" text NOT NULL,
  "content_family" text NOT NULL,
  "session_key" text NOT NULL,
  "subject_id" text,
  "first_pageview_at" text NOT NULL,
  "last_pageview_at" text NOT NULL,
  "pageview_count" integer NOT NULL DEFAULT 1,
  "landing_path" text NOT NULL,
  "utm_source" text,
  "utm_campaign" text,
  "referrer_domain" text,
  PRIMARY KEY ("environment", "day_bucket", "site_id", "content_family", "session_key")
);

CREATE INDEX IF NOT EXISTS "idx_dcc_analytics_daily_sess_env_day"
  ON "dcc_analytics_daily_sessions" ("environment", "day_bucket");

CREATE TABLE IF NOT EXISTS "dcc_analytics_trip_links" (
  "environment" text NOT NULL,
  "draft_key_hash" text NOT NULL,
  "analytics_trip_key" text NOT NULL,
  "linked_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("environment", "draft_key_hash")
);

CREATE TABLE IF NOT EXISTS "dcc_analytics_trip_state" (
  "environment" text NOT NULL,
  "trip_unit_key" text NOT NULL,
  "analytics_trip_key" text,
  "draft_key_hash" text,
  "origin_site_id" text NOT NULL,
  "journey_kind" text NOT NULL DEFAULT 'cruise_sailing',
  "content_family" text NOT NULL DEFAULT 'cruise_sailing',
  "physical_sailing_id" text,
  "hosted_departure_id" text,
  "organizer_subject_id" text,
  "organizer_first_session_key" text,
  "entry_selected_at" text,
  "draft_started_at" text,
  "persisted_at" text,
  "first_customized_at" text,
  "customization_count" integer NOT NULL DEFAULT 0,
  "confirmation_staged_at" text,
  "confirmation_reviewed_at" text,
  "confirmation_applied_at" text,
  "confirmation_rejected_at" text,
  "confirmation_amended_at" text,
  "confirmation_cancelled_at" text,
  "latest_confirmation_provenance_json" jsonb,
  "invitation_shared_at" text,
  "invitation_share_count" integer NOT NULL DEFAULT 0,
  "companion_first_opened_at" text,
  "companion_first_contributed_at" text,
  "companion_keys_json" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "merged_companion_map_json" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "latest_party_headcount" integer,
  "later_session_return_at" text,
  "later_day_d1_return_at" text,
  "later_day_d7_return_at" text,
  "seller_handoff_at" text,
  "seller_handoff_count" integer NOT NULL DEFAULT 0,
  "confirmed_outcome_at" text,
  "confirmed_outcome_type" text,
  "confirmed_gross_usd" numeric(12, 2) NOT NULL DEFAULT 0,
  "confirmed_commission_usd" numeric(12, 2) NOT NULL DEFAULT 0,
  "first_touch_utm_source" text,
  "first_touch_referrer_domain" text,
  "updated_at" text NOT NULL,
  PRIMARY KEY ("environment", "trip_unit_key")
);

CREATE INDEX IF NOT EXISTS "idx_dcc_analytics_trip_env_updated"
  ON "dcc_analytics_trip_state" ("environment", "updated_at");
CREATE INDEX IF NOT EXISTS "idx_dcc_analytics_trip_env_persisted"
  ON "dcc_analytics_trip_state" ("environment", "persisted_at");

CREATE TABLE IF NOT EXISTS "dcc_analytics_tombstones" (
  "environment" text NOT NULL,
  "target_type" text NOT NULL,
  "target_key" text NOT NULL,
  "deleted_at" timestamptz NOT NULL DEFAULT now(),
  "reason" text,
  PRIMARY KEY ("environment", "target_type", "target_key")
);

CREATE TABLE IF NOT EXISTS "dcc_analytics_health_counters" (
  "counter_key" text PRIMARY KEY,
  "counter_value" bigint NOT NULL DEFAULT 0,
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "dcc_analytics_watermarks" (
  "scope_key" text PRIMARY KEY,
  "processed_through_iso" text,
  "last_queue_seq" bigint NOT NULL DEFAULT 0,
  "last_worker_success_at" text,
  "last_worker_duration_ms" integer,
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "dcc_analytics_worker_lease" (
  "lease_name" text PRIMARY KEY,
  "worker_id" text NOT NULL,
  "leased_until_ms" bigint NOT NULL,
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "dcc_analytics_report_cache" (
  "cache_key" text PRIMARY KEY,
  "environment" text NOT NULL,
  "window_preset" text NOT NULL,
  "watermark_iso" text,
  "generated_at" text NOT NULL,
  "payload_json" jsonb NOT NULL
);
