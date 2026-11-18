-- Migration: 0009_dcc_tour_catalog_and_refresh_checkpoints.sql
-- Description: Move dcc_tour_catalog, dcc_catalog_sync_runs, and dcc_catalog_refresh_checkpoints DDL out of runtime hot paths into explicit schema migrations.

CREATE TABLE IF NOT EXISTS dcc_tour_catalog (
  tour_id TEXT PRIMARY KEY,
  compatibility_aliases JSONB NOT NULL DEFAULT '[]'::jsonb,
  destination_slug TEXT NOT NULL,
  port_slug TEXT,
  earthos_destination_node_id TEXT NOT NULL,
  time_zone TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  category TEXT NOT NULL,
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  primary_provider TEXT NOT NULL,
  provider_product_code TEXT NOT NULL,
  operator_name TEXT,
  operator_code TEXT,
  capability_tier TEXT NOT NULL,
  commission_authorized BOOLEAN NOT NULL DEFAULT false,
  duration_minutes INTEGER,
  duration_raw_text TEXT,
  from_price_cents INTEGER,
  price_basis TEXT NOT NULL DEFAULT 'per_person',
  currency TEXT NOT NULL DEFAULT 'USD',
  free_cancellation BOOLEAN,
  cancellation_policy_type TEXT,
  cancellation_cutoff_hours INTEGER,
  cancellation_summary TEXT,
  has_hotel_pickup BOOLEAN,
  lowest_price_includes_pickup BOOLEAN,
  pickup_type TEXT,
  pickup_summary TEXT,
  meeting_point_name TEXT,
  meeting_point_address TEXT,
  meeting_point_lat DOUBLE PRECISION,
  meeting_point_lng DOUBLE PRECISION,
  location_precision TEXT NOT NULL DEFAULT 'unknown',
  pickup_locations_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  age_bands_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  constraints_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  channel_offers_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  product_options_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  service_details_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  inclusions_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  exclusions_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  primary_image_url TEXT,
  rating_average DOUBLE PRECISION,
  review_count INTEGER,
  booking_url TEXT NOT NULL,
  provenance_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  quarantined BOOLEAN NOT NULL DEFAULT false,
  quarantine_reason TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  last_verified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE dcc_tour_catalog ADD COLUMN IF NOT EXISTS price_basis TEXT NOT NULL DEFAULT 'per_person';
ALTER TABLE dcc_tour_catalog ADD COLUMN IF NOT EXISTS lowest_price_includes_pickup BOOLEAN;
ALTER TABLE dcc_tour_catalog ADD COLUMN IF NOT EXISTS product_options_json JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE dcc_tour_catalog ADD COLUMN IF NOT EXISTS service_details_json JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE dcc_tour_catalog ADD COLUMN IF NOT EXISTS quarantined BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE dcc_tour_catalog ADD COLUMN IF NOT EXISTS quarantine_reason TEXT;

CREATE INDEX IF NOT EXISTS dcc_tour_catalog_destination_slug_idx ON dcc_tour_catalog (destination_slug);
CREATE INDEX IF NOT EXISTS dcc_tour_catalog_port_slug_idx ON dcc_tour_catalog (port_slug);
CREATE INDEX IF NOT EXISTS dcc_tour_catalog_provider_idx ON dcc_tour_catalog (primary_provider, provider_product_code);
CREATE INDEX IF NOT EXISTS dcc_tour_catalog_capability_tier_idx ON dcc_tour_catalog (capability_tier);
CREATE INDEX IF NOT EXISTS dcc_tour_catalog_earthos_node_idx ON dcc_tour_catalog (earthos_destination_node_id);
CREATE INDEX IF NOT EXISTS dcc_tour_catalog_active_dest_sort_idx ON dcc_tour_catalog (active, quarantined, destination_slug, tour_id);

CREATE TABLE IF NOT EXISTS dcc_catalog_sync_runs (
  run_id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  destination_slug TEXT NOT NULL,
  status TEXT NOT NULL,
  cursor_value TEXT,
  imported_count INTEGER NOT NULL DEFAULT 0,
  updated_count INTEGER NOT NULL DEFAULT 0,
  rejected_count INTEGER NOT NULL DEFAULT 0,
  upstream_request_count INTEGER NOT NULL DEFAULT 0,
  rejection_reasons_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS dcc_catalog_sync_runs_provider_dest_idx ON dcc_catalog_sync_runs (provider, destination_slug);
CREATE INDEX IF NOT EXISTS dcc_catalog_sync_runs_started_at_idx ON dcc_catalog_sync_runs (started_at DESC);

CREATE TABLE IF NOT EXISTS dcc_catalog_refresh_checkpoints (
  stream_key TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  destination_slug TEXT,
  cursor_value TEXT,
  next_start_offset INTEGER,
  provider_total_count INTEGER,
  status TEXT NOT NULL DEFAULT 'idle',
  metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS dcc_catalog_refresh_checkpoints_provider_idx ON dcc_catalog_refresh_checkpoints (provider, destination_slug);
