-- Migration: 0005_dcc_machine_layer_v01.sql
-- Description: Additive durable schema for DCC Machine Layer v0.1 (Evidence & Claim Graph, Decision IR, Compiler Bundles, Evaluations, Reference Resolver, and Change Log)
-- Reversible via drizzle/0005_dcc_machine_layer_v01.down.sql

DO $$ BEGIN
  CREATE TYPE dcc_machine_epistemic_status AS ENUM (
    'observed',
    'verified',
    'inferred',
    'disputed',
    'stale',
    'superseded',
    'withdrawn',
    'unknown'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE dcc_machine_epistemic_kind AS ENUM (
    'fact',
    'inference',
    'policy',
    'recommendation',
    'user_preference'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS "dcc_machine_entities" (
  "id" text PRIMARY KEY NOT NULL,
  "version" text NOT NULL,
  "entity_type" text NOT NULL,
  "canonical_name" text NOT NULL,
  "jurisdiction" text,
  "geographic_scope" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "status" dcc_machine_epistemic_status DEFAULT 'verified' NOT NULL,
  "valid_from" timestamp with time zone NOT NULL,
  "valid_to" timestamp with time zone,
  "observed_at" timestamp with time zone NOT NULL,
  "retrieved_at" timestamp with time zone NOT NULL,
  "attributes" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "connected_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "content_hash" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "dcc_machine_entities_type_idx" ON "dcc_machine_entities" ("entity_type");
CREATE INDEX IF NOT EXISTS "dcc_machine_entities_status_idx" ON "dcc_machine_entities" ("status");

CREATE TABLE IF NOT EXISTS "dcc_machine_sources" (
  "id" text PRIMARY KEY NOT NULL,
  "version" text NOT NULL,
  "title" text NOT NULL,
  "organization" text NOT NULL,
  "authority_tier" text NOT NULL,
  "canonical_url" text NOT NULL,
  "jurisdiction" text,
  "retrieval_method" text NOT NULL,
  "license_or_reuse_status" text NOT NULL,
  "status" dcc_machine_epistemic_status DEFAULT 'verified' NOT NULL,
  "latest_snapshot_id" text NOT NULL,
  "valid_from" timestamp with time zone NOT NULL,
  "valid_to" timestamp with time zone,
  "observed_at" timestamp with time zone NOT NULL,
  "retrieved_at" timestamp with time zone NOT NULL,
  "content_hash" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "dcc_machine_sources_org_idx" ON "dcc_machine_sources" ("organization");
CREATE INDEX IF NOT EXISTS "dcc_machine_sources_status_idx" ON "dcc_machine_sources" ("status");

CREATE TABLE IF NOT EXISTS "dcc_machine_source_snapshots" (
  "id" text PRIMARY KEY NOT NULL,
  "source_id" text NOT NULL REFERENCES "dcc_machine_sources"("id") ON DELETE RESTRICT,
  "version" text NOT NULL,
  "canonical_url" text NOT NULL,
  "retrieved_at" timestamp with time zone NOT NULL,
  "observed_at" timestamp with time zone NOT NULL,
  "valid_from" timestamp with time zone NOT NULL,
  "valid_to" timestamp with time zone,
  "http_status" integer DEFAULT 200 NOT NULL,
  "content_type" text NOT NULL,
  "retrieval_method" text NOT NULL,
  "license_or_reuse_status" text NOT NULL,
  "artifact_storage_uri" text NOT NULL,
  "content_hash" text NOT NULL,
  "byte_length" integer DEFAULT 0 NOT NULL,
  "status" dcc_machine_epistemic_status DEFAULT 'verified' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "dcc_machine_source_snapshots_source_idx" ON "dcc_machine_source_snapshots" ("source_id");
CREATE INDEX IF NOT EXISTS "dcc_machine_source_snapshots_hash_idx" ON "dcc_machine_source_snapshots" ("content_hash");

CREATE TABLE IF NOT EXISTS "dcc_machine_evidence_fragments" (
  "id" text PRIMARY KEY NOT NULL,
  "source_id" text NOT NULL REFERENCES "dcc_machine_sources"("id") ON DELETE RESTRICT,
  "snapshot_id" text NOT NULL REFERENCES "dcc_machine_source_snapshots"("id") ON DELETE RESTRICT,
  "version" text NOT NULL,
  "locator" text NOT NULL,
  "excerpt_or_structured_field" jsonb NOT NULL,
  "content_hash" text NOT NULL,
  "observed_at" timestamp with time zone NOT NULL,
  "retrieved_at" timestamp with time zone NOT NULL,
  "valid_from" timestamp with time zone NOT NULL,
  "valid_to" timestamp with time zone,
  "status" dcc_machine_epistemic_status DEFAULT 'verified' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "dcc_machine_evidence_fragments_snapshot_idx" ON "dcc_machine_evidence_fragments" ("snapshot_id");

CREATE TABLE IF NOT EXISTS "dcc_machine_claims" (
  "id" text PRIMARY KEY NOT NULL,
  "current_version_id" text NOT NULL,
  "subject_id" text NOT NULL REFERENCES "dcc_machine_entities"("id") ON DELETE RESTRICT,
  "predicate" text NOT NULL,
  "epistemic_kind" dcc_machine_epistemic_kind DEFAULT 'fact' NOT NULL,
  "status" dcc_machine_epistemic_status DEFAULT 'verified' NOT NULL,
  "has_open_conflict" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "dcc_machine_claims_subject_idx" ON "dcc_machine_claims" ("subject_id");
CREATE INDEX IF NOT EXISTS "dcc_machine_claims_predicate_idx" ON "dcc_machine_claims" ("predicate");
CREATE INDEX IF NOT EXISTS "dcc_machine_claims_status_idx" ON "dcc_machine_claims" ("status");

CREATE TABLE IF NOT EXISTS "dcc_machine_claim_versions" (
  "id" text PRIMARY KEY NOT NULL,
  "claim_id" text NOT NULL REFERENCES "dcc_machine_claims"("id") ON DELETE RESTRICT,
  "version_number" integer NOT NULL,
  "epistemic_kind" dcc_machine_epistemic_kind DEFAULT 'fact' NOT NULL,
  "subject" text NOT NULL,
  "predicate" text NOT NULL,
  "typed_value" jsonb NOT NULL,
  "unit_or_currency" text,
  "geographic_scope" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "jurisdiction" text,
  "valid_from" timestamp with time zone NOT NULL,
  "valid_to" timestamp with time zone,
  "observed_at" timestamp with time zone NOT NULL,
  "retrieved_at" timestamp with time zone NOT NULL,
  "status" dcc_machine_epistemic_status DEFAULT 'verified' NOT NULL,
  "source_id" text NOT NULL REFERENCES "dcc_machine_sources"("id") ON DELETE RESTRICT,
  "source_organization" text NOT NULL,
  "canonical_source_url" text NOT NULL,
  "source_snapshot_id" text NOT NULL REFERENCES "dcc_machine_source_snapshots"("id") ON DELETE RESTRICT,
  "evidence_fragment_id" text NOT NULL REFERENCES "dcc_machine_evidence_fragments"("id") ON DELETE RESTRICT,
  "supporting_fragment" jsonb NOT NULL,
  "evidence_hash" text NOT NULL,
  "retrieval_method" text NOT NULL,
  "license_or_reuse_status" text NOT NULL,
  "superseded_by_version_id" text,
  "supersedes_version_id" text,
  "retraction_id" text,
  "withdrawal_info" jsonb,
  "conflicting_claim_version_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "verification_approved_by" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "dcc_machine_claim_versions_claim_idx" ON "dcc_machine_claim_versions" ("claim_id", "version_number");
CREATE INDEX IF NOT EXISTS "dcc_machine_claim_versions_status_idx" ON "dcc_machine_claim_versions" ("status");

CREATE TABLE IF NOT EXISTS "dcc_machine_claim_conflicts" (
  "id" text PRIMARY KEY NOT NULL,
  "claim_id" text NOT NULL,
  "claim_version_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "subject_id" text NOT NULL,
  "predicate" text NOT NULL,
  "conflict_type" text NOT NULL,
  "status" dcc_machine_epistemic_status DEFAULT 'disputed' NOT NULL,
  "summary" text NOT NULL,
  "resolution_policy" text NOT NULL,
  "winning_claim_version_id" text,
  "detected_at" timestamp with time zone NOT NULL,
  "resolved_at" timestamp with time zone,
  "content_hash" text NOT NULL
);

CREATE INDEX IF NOT EXISTS "dcc_machine_claim_conflicts_claim_idx" ON "dcc_machine_claim_conflicts" ("claim_id");

CREATE TABLE IF NOT EXISTS "dcc_machine_rules" (
  "id" text PRIMARY KEY NOT NULL,
  "version" text NOT NULL,
  "engine_id" text NOT NULL,
  "rule_kind" text NOT NULL,
  "title" text NOT NULL,
  "description" text NOT NULL,
  "severity_or_weight" numeric(10, 2) DEFAULT 0 NOT NULL,
  "reason_code" text NOT NULL,
  "claim_version_dependencies" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "ir_expression" jsonb NOT NULL,
  "remediation_hint" text NOT NULL,
  "status" dcc_machine_epistemic_status DEFAULT 'verified' NOT NULL,
  "content_hash" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "dcc_machine_rules_engine_idx" ON "dcc_machine_rules" ("engine_id");

CREATE TABLE IF NOT EXISTS "dcc_machine_rule_sets" (
  "id" text PRIMARY KEY NOT NULL,
  "engine_id" text NOT NULL,
  "version" text NOT NULL,
  "rule_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "claim_version_dependencies" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "content_hash" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "dcc_machine_rule_sets_engine_idx" ON "dcc_machine_rule_sets" ("engine_id");

CREATE TABLE IF NOT EXISTS "dcc_machine_engines" (
  "id" text PRIMARY KEY NOT NULL,
  "title" text NOT NULL,
  "domain_category" text NOT NULL,
  "destination_entity_id" text NOT NULL,
  "active_version" text NOT NULL,
  "previous_active_version" text,
  "status" dcc_machine_epistemic_status DEFAULT 'verified' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "dcc_machine_engine_versions" (
  "id" text PRIMARY KEY NOT NULL,
  "engine_id" text NOT NULL REFERENCES "dcc_machine_engines"("id") ON DELETE RESTRICT,
  "version" text NOT NULL,
  "rule_set_id" text NOT NULL REFERENCES "dcc_machine_rule_sets"("id") ON DELETE RESTRICT,
  "source_revision" text NOT NULL,
  "bundle_hash" text NOT NULL,
  "manifest" jsonb NOT NULL,
  "status" dcc_machine_epistemic_status DEFAULT 'verified' NOT NULL,
  "published_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "dcc_machine_engine_versions_engine_ver_uidx" ON "dcc_machine_engine_versions" ("engine_id", "version");

CREATE TABLE IF NOT EXISTS "dcc_machine_engine_bundles" (
  "id" text PRIMARY KEY NOT NULL,
  "engine_id" text NOT NULL,
  "version" text NOT NULL,
  "bundle_hash" text NOT NULL,
  "storage_uri" text NOT NULL,
  "manifest" jsonb NOT NULL,
  "ir_bundle" jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "dcc_machine_engine_bundles_engine_ver_uidx" ON "dcc_machine_engine_bundles" ("engine_id", "version");

CREATE TABLE IF NOT EXISTS "dcc_machine_evaluations" (
  "id" text PRIMARY KEY NOT NULL,
  "engine_id" text NOT NULL,
  "engine_version" text NOT NULL,
  "bundle_hash" text NOT NULL,
  "normalized_input_hash" text NOT NULL,
  "result_hash" text NOT NULL,
  "trace_id" text NOT NULL,
  "trace_hash" text NOT NULL,
  "decision_state" text NOT NULL,
  "recommended_candidate_id" text,
  "reason_codes" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "reference_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "evaluated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "dcc_machine_evaluations_engine_ver_idx" ON "dcc_machine_evaluations" ("engine_id", "engine_version");
CREATE INDEX IF NOT EXISTS "dcc_machine_evaluations_result_hash_idx" ON "dcc_machine_evaluations" ("result_hash");

CREATE TABLE IF NOT EXISTS "dcc_machine_evaluation_traces" (
  "id" text PRIMARY KEY NOT NULL,
  "evaluation_id" text NOT NULL REFERENCES "dcc_machine_evaluations"("id") ON DELETE CASCADE,
  "engine_id" text NOT NULL,
  "engine_version" text NOT NULL,
  "trace_hash" text NOT NULL,
  "candidate_traces" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "rule_executions" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "resolved_claim_versions" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "conflicts_encountered" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "unknown_fields" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "dcc_machine_evaluation_traces_eval_idx" ON "dcc_machine_evaluation_traces" ("evaluation_id");

CREATE TABLE IF NOT EXISTS "dcc_machine_retractions" (
  "id" text PRIMARY KEY NOT NULL,
  "target_type" text NOT NULL,
  "target_id" text NOT NULL,
  "target_version_id" text NOT NULL,
  "action" text NOT NULL,
  "reason" text NOT NULL,
  "replacement_version_id" text,
  "issued_by" text NOT NULL,
  "occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
  "content_hash" text NOT NULL
);

CREATE INDEX IF NOT EXISTS "dcc_machine_retractions_target_idx" ON "dcc_machine_retractions" ("target_id", "target_version_id");

CREATE TABLE IF NOT EXISTS "dcc_machine_change_events" (
  "cursor" bigserial PRIMARY KEY NOT NULL,
  "event_id" text NOT NULL,
  "event_type" text NOT NULL,
  "object_type" text NOT NULL,
  "object_id" text NOT NULL,
  "version_id" text,
  "reference_uri" text NOT NULL,
  "immutable_reference_uri" text,
  "summary" text NOT NULL,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "dcc_machine_change_events_event_id_uidx" ON "dcc_machine_change_events" ("event_id");
CREATE INDEX IF NOT EXISTS "dcc_machine_change_events_object_idx" ON "dcc_machine_change_events" ("object_type", "object_id");
