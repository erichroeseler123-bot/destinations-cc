import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import { getTravelDateExpiryNewOrleans } from "./timezone";
import crypto from "crypto";

export interface WaitlistSubmission {
  id: string;
  createdAt: string;
  email: string;
  name?: string;
  phone?: string;
  travelDate: string; // YYYY-MM-DD
  adults: number;
  childrenCount: number;
  childrenAges: number[];
  transportation: "hotel_pickup" | "self_drive" | "either";
  boatType: "small_airboat" | "large_airboat" | "any";
  timeWindow: "any" | "morning" | "afternoon";
  specificTourId?: string;
  status: "enrolled" | "unsubscribed" | "expired";
  unsubscribeToken: string;
  expiresAt: string;
}

let cachedDb: NeonQueryFunction<false, false> | null = null;

export function resolveDatabaseUrl(): string {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.DCC_DATABASE_URL ||
    process.env.DATABASE_POSTGRES_URL ||
    ""
  ).trim().replace(/^["']|["']$/g, "");
}

export function getDb(): NeonQueryFunction<false, false> | null {
  const connectionString = resolveDatabaseUrl();
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

/**
 * Ensures table existence and indexes in Neon PostgreSQL.
 */
export async function ensureDbTables(): Promise<void> {
  const sql = getDb();
  if (!sql) return;

  await sql`
    CREATE TABLE IF NOT EXISTS wts_waitlist_submissions (
      id text PRIMARY KEY,
      created_at timestamptz NOT NULL DEFAULT now(),
      email text NOT NULL,
      name text,
      phone text,
      travel_date text NOT NULL,
      adults integer NOT NULL DEFAULT 2,
      children_count integer NOT NULL DEFAULT 0,
      children_ages jsonb NOT NULL DEFAULT '[]'::jsonb,
      transportation text NOT NULL DEFAULT 'either',
      boat_type text NOT NULL DEFAULT 'any',
      time_window text NOT NULL DEFAULT 'any',
      specific_tour_id text,
      status text NOT NULL DEFAULT 'enrolled',
      unsubscribe_token text NOT NULL UNIQUE,
      expires_at timestamptz NOT NULL,
      raw_entry jsonb NOT NULL
    );
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS wts_waitlist_travel_date_idx 
    ON wts_waitlist_submissions(travel_date, status);
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS wts_waitlist_token_idx 
    ON wts_waitlist_submissions(unsubscribe_token);
  `;
}

/**
 * Durably saves an enrollment submission in Neon PostgreSQL.
 * Generates an unsubscribe token and auto-expiry date in New Orleans time.
 */
export async function saveWaitlistSubmission(input: {
  email: string;
  name?: string;
  phone?: string;
  travelDate: string;
  adults: number;
  childrenCount: number;
  childrenAges: number[];
  transportation: "hotel_pickup" | "self_drive" | "either";
  boatType: "small_airboat" | "large_airboat" | "any";
  timeWindow?: "any" | "morning" | "afternoon";
  specificTourId?: string;
}): Promise<WaitlistSubmission> {
  const sql = getDb();
  if (!sql) {
    throw new Error(
      "Durable database connection unavailable. Submissions cannot be accepted without persistent storage."
    );
  }

  await ensureDbTables();

  const id = `WTS-WAIT-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const createdAt = new Date().toISOString();
  const unsubscribeToken = crypto.randomBytes(24).toString("hex");
  const expiresAt = getTravelDateExpiryNewOrleans(input.travelDate).toISOString();

  const submission: WaitlistSubmission = {
    id,
    createdAt,
    email: input.email.trim().toLowerCase(),
    name: input.name ? input.name.trim() : undefined,
    phone: input.phone ? input.phone.trim() : undefined,
    travelDate: input.travelDate,
    adults: Math.max(1, input.adults),
    childrenCount: Math.max(0, input.childrenCount),
    childrenAges: input.childrenAges,
    transportation: input.transportation,
    boatType: input.boatType,
    timeWindow: input.timeWindow || "any",
    specificTourId: input.specificTourId,
    status: "enrolled",
    unsubscribeToken,
    expiresAt,
  };

  await sql`
    INSERT INTO wts_waitlist_submissions (
      id, created_at, email, name, phone,
      travel_date, adults, children_count, children_ages,
      transportation, boat_type, time_window, specific_tour_id,
      status, unsubscribe_token, expires_at, raw_entry
    ) VALUES (
      ${submission.id}, ${new Date(submission.createdAt)}, ${submission.email},
      ${submission.name || null}, ${submission.phone || null},
      ${submission.travelDate}, ${submission.adults}, ${submission.childrenCount},
      ${JSON.stringify(submission.childrenAges)}::jsonb,
      ${submission.transportation}, ${submission.boatType}, ${submission.timeWindow},
      ${submission.specificTourId || null}, ${submission.status},
      ${submission.unsubscribeToken}, ${new Date(submission.expiresAt)},
      ${JSON.stringify(submission)}::jsonb
    );
  `;

  return submission;
}

/**
 * Retrieves a submission by ID, checking for automatic date expiry.
 */
export async function getWaitlistSubmission(id: string): Promise<WaitlistSubmission | null> {
  const sql = getDb();
  if (!sql) return null;

  await ensureDbTables();

  const rows = await sql`
    SELECT id, status, expires_at, raw_entry 
    FROM wts_waitlist_submissions 
    WHERE id = ${id}
    LIMIT 1;
  `;

  if (!rows || rows.length === 0) return null;

  const raw = rows[0].raw_entry as WaitlistSubmission;
  const now = new Date();
  const expiresAt = new Date(rows[0].expires_at);

  if (raw.status === "enrolled" && now > expiresAt) {
    // Automatically transition to expired
    await sql`
      UPDATE wts_waitlist_submissions 
      SET status = 'expired' 
      WHERE id = ${id};
    `;
    raw.status = "expired";
  }

  return raw;
}

/**
 * Unsubscribes a submission using its unique token.
 */
export async function unsubscribeByToken(token: string): Promise<{ success: boolean; submission?: WaitlistSubmission }> {
  const sql = getDb();
  if (!sql) return { success: false };

  await ensureDbTables();

  const rows = await sql`
    SELECT id, raw_entry 
    FROM wts_waitlist_submissions 
    WHERE unsubscribe_token = ${token}
    LIMIT 1;
  `;

  if (!rows || rows.length === 0) return { success: false };

  const entry = rows[0].raw_entry as WaitlistSubmission;
  entry.status = "unsubscribed";

  await sql`
    UPDATE wts_waitlist_submissions 
    SET status = 'unsubscribed', raw_entry = ${JSON.stringify(entry)}::jsonb
    WHERE unsubscribe_token = ${token};
  `;

  return { success: true, submission: entry };
}
