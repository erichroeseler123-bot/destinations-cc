import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

let cachedDb: NeonQueryFunction<false, false> | null = null;

export function getDb(): NeonQueryFunction<false, false> | null {
  const connectionString =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_POSTGRES_URL;

  if (
    !connectionString ||
    connectionString === "[SENSITIVE]" ||
    connectionString.length < 20 ||
    !connectionString.startsWith("postgres")
  ) {
    return null;
  }

  if (!cachedDb) {
    cachedDb = neon(connectionString);
  }
  return cachedDb;
}

export async function ensureDbTables(): Promise<void> {
  const sql = getDb();
  if (!sql) return;

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
}
