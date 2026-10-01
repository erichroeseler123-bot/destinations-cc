CREATE TABLE IF NOT EXISTS jfd_helicopter_watches (id uuid PRIMARY KEY, request_key text NOT NULL UNIQUE, request jsonb NOT NULL, products jsonb NOT NULL, status text NOT NULL DEFAULT 'active', last_options jsonb NOT NULL DEFAULT '[]', revision integer NOT NULL DEFAULT 0, next_check_at timestamptz NOT NULL, lease_until timestamptz, lease_token uuid, last_checked_at timestamptz, last_error text, created_at timestamptz NOT NULL DEFAULT now());

CREATE INDEX IF NOT EXISTS jfd_watch_due_idx ON jfd_helicopter_watches(status, next_check_at);

CREATE TABLE IF NOT EXISTS jfd_helicopter_outbox (id uuid PRIMARY KEY, watch_id uuid NOT NULL REFERENCES jfd_helicopter_watches(id), revision integer NOT NULL, payload jsonb NOT NULL, status text NOT NULL DEFAULT 'pending', attempts integer NOT NULL DEFAULT 0, next_attempt_at timestamptz NOT NULL DEFAULT now(), lease_until timestamptz, lease_token uuid, provider_id text, last_error text, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(watch_id, revision));

CREATE TABLE IF NOT EXISTS jfd_helicopter_catalog (port text PRIMARY KEY, products jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now());

CREATE TABLE IF NOT EXISTS jfd_helicopter_rate_limits (key text PRIMARY KEY, count integer NOT NULL DEFAULT 0, expires_at timestamptz NOT NULL);
