const fs = require('fs');
const dotenv = require('dotenv');
const env = dotenv.parse(fs.readFileSync('apps/juneauflightdeck/.env.local'));
const { neon } = require('@neondatabase/serverless');

const sql = neon(env.DATABASE_URL);
async function run() {
  await sql`
    CREATE TABLE IF NOT EXISTS jfd_telemetry_events (
      id text PRIMARY KEY,
      created_at timestamptz NOT NULL DEFAULT now(),
      site text NOT NULL DEFAULT 'juneau-flight-deck',
      event_name text NOT NULL,
      session_id text NOT NULL,
      source_page text,
      landing_path text,
      target_path text,
      provider text,
      tour_slug text,
      tour_name text,
      is_test boolean NOT NULL DEFAULT false,
      payload jsonb NOT NULL
    );
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS jfd_telemetry_created_idx ON jfd_telemetry_events(created_at DESC);
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS jfd_telemetry_event_idx ON jfd_telemetry_events(event_name, is_test);
  `;
  console.log('Successfully created jfd_telemetry_events table and indexes!');
}
run().catch(console.error);
