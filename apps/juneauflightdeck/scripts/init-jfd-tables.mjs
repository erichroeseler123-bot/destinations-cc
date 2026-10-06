import dotenv from "dotenv";
import { neon } from "@neondatabase/serverless";

dotenv.config({ path: "./.env.local" });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("No DATABASE_URL found");
  process.exit(1);
}

const sql = neon(connectionString);

async function init() {
  console.log("Creating/verifying JFD waitlist tables in Postgres...");

  await sql`
    CREATE TABLE IF NOT EXISTS jfd_waitlist_submissions (
      id text PRIMARY KEY,
      created_at timestamptz NOT NULL DEFAULT now(),
      name text NOT NULL,
      email text NOT NULL,
      phone text,
      cruise_line text NOT NULL,
      ship_name text NOT NULL,
      port_city text NOT NULL,
      port_date text NOT NULL,
      juneau_date text,
      skagway_date text,
      tour_type text NOT NULL,
      party_size integer NOT NULL,
      booking_mode text NOT NULL,
      status text NOT NULL DEFAULT 'active_scanning',
      operator_hold_status text NOT NULL DEFAULT 'not_held',
      notes text,
      estimated_value integer,
      last_scanned_at timestamptz,
      raw_entry jsonb NOT NULL
    );
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS jfd_waitlist_port_date_idx ON jfd_waitlist_submissions(port_date, status);
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS jfd_waitlist_notifications (
      delivery_id text PRIMARY KEY,
      entry_id text NOT NULL,
      recipient_email text NOT NULL,
      recipient_phone text,
      tour_name text NOT NULL,
      operator text NOT NULL,
      port text NOT NULL,
      port_date text NOT NULL,
      departure_time text NOT NULL,
      status text NOT NULL,
      payload jsonb NOT NULL,
      dispatched_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE(entry_id, port_date, departure_time)
    );
  `;

  console.log("Tables verified successfully!");

  const tables = await sql`
    SELECT table_name FROM information_schema.tables 
    WHERE table_name IN ('jfd_waitlist_submissions', 'jfd_waitlist_notifications');
  `;
  console.log("Created tables:", tables.map(t => t.table_name));
}

init().catch(err => {
  console.error("Initialization failed:", err);
  process.exit(1);
});
