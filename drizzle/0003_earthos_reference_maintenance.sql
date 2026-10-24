-- Repeatable Migration: 0003_earthos_reference_maintenance.sql
-- Idempotent DDL for EarthOS missions, control-map findings, audit history, and governance tables.

DO $$ BEGIN
  CREATE TYPE earthos_mission_entity AS ENUM ('gosno', 'alaska', 'redrocks', 'earthos');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE earthos_mission_status AS ENUM ('running', 'waiting', 'failed', 'completed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS earthos_schema_migrations (
  migration_id text PRIMARY KEY,
  checksum text NOT NULL,
  first_applied_at timestamptz NOT NULL DEFAULT now(),
  last_applied_at timestamptz NOT NULL DEFAULT now(),
  execution_count integer NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS earthos_missions (
  mission_id text PRIMARY KEY,
  entity earthos_mission_entity NOT NULL,
  region text NOT NULL,
  mission text NOT NULL,
  status earthos_mission_status NOT NULL,
  current_step text,
  started_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  last_checkpoint_at timestamptz,
  waiting_for_event text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  result jsonb,
  error jsonb,
  intelligence jsonb,
  workflow_source text NOT NULL DEFAULT 'earthos',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS earthos_missions_entity_idx ON earthos_missions (entity);
CREATE INDEX IF NOT EXISTS earthos_missions_status_idx ON earthos_missions (status);
CREATE INDEX IF NOT EXISTS earthos_missions_updated_at_idx ON earthos_missions (updated_at);
CREATE INDEX IF NOT EXISTS earthos_missions_waiting_event_idx ON earthos_missions (waiting_for_event);
CREATE INDEX IF NOT EXISTS earthos_missions_entity_region_idx ON earthos_missions (entity, region);

CREATE TABLE IF NOT EXISTS earthos_mission_steps (
  step_id text PRIMARY KEY,
  mission_id text NOT NULL REFERENCES earthos_missions(mission_id) ON DELETE CASCADE,
  name text NOT NULL,
  status earthos_mission_status NOT NULL,
  started_at timestamptz,
  ended_at timestamptz,
  retry_count integer NOT NULL DEFAULT 0,
  output jsonb,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS earthos_mission_steps_mission_id_idx ON earthos_mission_steps (mission_id);
CREATE INDEX IF NOT EXISTS earthos_mission_steps_mission_status_idx ON earthos_mission_steps (mission_id, status);

CREATE TABLE IF NOT EXISTS earthos_control_map_findings (
  finding_id text PRIMARY KEY,
  status text NOT NULL,
  severity text NOT NULL,
  owner text NOT NULL,
  note text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS earthos_control_map_findings_status_idx ON earthos_control_map_findings (status);
CREATE INDEX IF NOT EXISTS earthos_control_map_findings_severity_idx ON earthos_control_map_findings (severity);
CREATE INDEX IF NOT EXISTS earthos_control_map_findings_updated_at_idx ON earthos_control_map_findings (updated_at);
CREATE INDEX IF NOT EXISTS earthos_control_map_findings_owner_status_idx ON earthos_control_map_findings (owner, status);

CREATE TABLE IF NOT EXISTS earthos_control_map_finding_history (
  event_sequence bigserial PRIMARY KEY,
  finding_id text NOT NULL REFERENCES earthos_control_map_findings(finding_id) ON DELETE CASCADE,
  event text NOT NULL,
  status text NOT NULL,
  severity text NOT NULL,
  owner text NOT NULL,
  node_slug text NOT NULL,
  corridor text NOT NULL,
  recorded_at timestamptz NOT NULL,
  summary text NOT NULL,
  approved_at timestamptz,
  approved_by text,
  control_surface text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS earthos_control_map_finding_history_finding_recorded_idx
  ON earthos_control_map_finding_history (finding_id, recorded_at);
CREATE INDEX IF NOT EXISTS earthos_control_map_finding_history_event_idx
  ON earthos_control_map_finding_history (event);
CREATE INDEX IF NOT EXISTS earthos_control_map_finding_history_recorded_at_idx
  ON earthos_control_map_finding_history (recorded_at);
CREATE INDEX IF NOT EXISTS earthos_control_map_finding_history_corridor_idx
  ON earthos_control_map_finding_history (corridor);

CREATE TABLE IF NOT EXISTS governance_drift_events (
  id text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  source_surface text NOT NULL,
  affected_surface text NOT NULL,
  corridor_id text NOT NULL,
  event_type text NOT NULL,
  severity text NOT NULL,
  status text NOT NULL,
  finding_id text,
  summary text NOT NULL,
  evidence_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  expected_role text,
  observed_role text,
  continuity_state text,
  machine_interpretation_risk text NOT NULL,
  resolved_at timestamptz,
  resolved_by text
);

CREATE INDEX IF NOT EXISTS governance_drift_events_created_at_idx ON governance_drift_events (created_at);
CREATE INDEX IF NOT EXISTS governance_drift_events_corridor_idx ON governance_drift_events (corridor_id);
CREATE INDEX IF NOT EXISTS governance_drift_events_status_idx ON governance_drift_events (status);
CREATE INDEX IF NOT EXISTS governance_drift_events_severity_idx ON governance_drift_events (severity);
CREATE INDEX IF NOT EXISTS governance_drift_events_finding_idx ON governance_drift_events (finding_id);

CREATE TABLE IF NOT EXISTS governance_reconciliation_packets (
  id text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  packet_type text NOT NULL,
  status text NOT NULL,
  proposed_changes_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  affected_routes_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  affected_surfaces_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  reason text NOT NULL,
  approval_required boolean NOT NULL DEFAULT true,
  approved_at timestamptz,
  approved_by text,
  applied_at timestamptz,
  result_json jsonb
);

CREATE INDEX IF NOT EXISTS governance_reconciliation_packets_created_at_idx
  ON governance_reconciliation_packets (created_at);
CREATE INDEX IF NOT EXISTS governance_reconciliation_packets_type_idx
  ON governance_reconciliation_packets (packet_type);
CREATE INDEX IF NOT EXISTS governance_reconciliation_packets_status_idx
  ON governance_reconciliation_packets (status);
CREATE INDEX IF NOT EXISTS governance_reconciliation_packets_approval_required_idx
  ON governance_reconciliation_packets (approval_required);

CREATE TABLE IF NOT EXISTS governance_findings_history (
  id bigserial PRIMARY KEY,
  finding_id text NOT NULL,
  drift_event_id text REFERENCES governance_drift_events(id) ON DELETE SET NULL,
  packet_id text REFERENCES governance_reconciliation_packets(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  status text NOT NULL,
  summary text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  recorded_by text
);

CREATE INDEX IF NOT EXISTS governance_findings_history_finding_recorded_idx
  ON governance_findings_history (finding_id, recorded_at);
CREATE INDEX IF NOT EXISTS governance_findings_history_drift_event_idx
  ON governance_findings_history (drift_event_id);
CREATE INDEX IF NOT EXISTS governance_findings_history_packet_idx
  ON governance_findings_history (packet_id);
CREATE INDEX IF NOT EXISTS governance_findings_history_event_type_idx
  ON governance_findings_history (event_type);
