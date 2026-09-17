import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";
import path from "node:path";
import fs from "node:fs";

// Load .env.test.local or .env.local
const testEnv = path.join(process.cwd(), ".env.test.local");
if (fs.existsSync(testEnv)) {
  dotenv.config({ path: testEnv });
} else {
  dotenv.config({ path: path.join(process.cwd(), ".env.local") });
}

const connectionString = process.env.DCC_DATABASE_URL || process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!connectionString) {
  console.error("No connection string found in environment!");
  process.exit(1);
}

const u = new URL(connectionString);
console.log("=== STAGING DATABASE TARGET ===");
console.log("Host:", u.host);
console.log("Database:", u.pathname);

const sql = neon(connectionString);

async function runMigrationAndVerify() {
  try {
    // 1. Read migration file
    const migrationSqlPath = path.join(process.cwd(), "drizzle", "0001_dcc_contexts.sql");
    const migrationSql = fs.readFileSync(migrationSqlPath, "utf8");
    console.log("\nApplying migration from:", migrationSqlPath);

    // Neon executes raw statements
    // We can run the DDL statements
    await sql.transaction([
      sql`
        DO $$ BEGIN
          CREATE TYPE "dcc_context_status" AS ENUM('issued', 'redeemed', 'expired', 'revoked');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `,
      sql`
        CREATE TABLE IF NOT EXISTS "dcc_contexts" (
          "context_id" text PRIMARY KEY NOT NULL,
          "context_hash" text NOT NULL,
          "idempotency_key" text,
          "version" text DEFAULT '1.0' NOT NULL,
          "status" "dcc_context_status" DEFAULT 'issued' NOT NULL,
          "source_site" text NOT NULL,
          "destination" text NOT NULL,
          "target_owner" text NOT NULL,
          "target_intent" text,
          "timezone" text NOT NULL,
          "schedule_date" text NOT NULL,
          "arrival" text,
          "departure" text,
          "travelers" integer DEFAULT 1 NOT NULL,
          "ship_or_venue" text,
          "buffer_minutes" integer DEFAULT 0 NOT NULL,
          "latest_safe_return_date" text,
          "latest_safe_return_time" text,
          "midnight_crossed" boolean DEFAULT false NOT NULL,
          "attribution" jsonb,
          "issued_at" timestamp with time zone DEFAULT now() NOT NULL,
          "expires_at" timestamp with time zone NOT NULL,
          "redeemed_at" timestamp with time zone,
          "redeemed_by" text,
          "created_at" timestamp with time zone DEFAULT now() NOT NULL,
          "updated_at" timestamp with time zone DEFAULT now() NOT NULL
        );
      `,
      sql`CREATE UNIQUE INDEX IF NOT EXISTS "dcc_contexts_hash_uidx" ON "dcc_contexts" ("context_hash");`,
      sql`CREATE UNIQUE INDEX IF NOT EXISTS "dcc_contexts_idempotency_uidx" ON "dcc_contexts" ("idempotency_key");`,
      sql`CREATE INDEX IF NOT EXISTS "dcc_contexts_status_idx" ON "dcc_contexts" ("status");`,
      sql`CREATE INDEX IF NOT EXISTS "dcc_contexts_expires_at_idx" ON "dcc_contexts" ("expires_at");`,
      sql`CREATE INDEX IF NOT EXISTS "dcc_contexts_target_owner_idx" ON "dcc_contexts" ("target_owner");`
    ]);

    console.log("Migration executed successfully.\n");

    // 2. Verification
    console.log("=== VERIFICATION OF STAGING SCHEMA ===");

    // Columns
    const cols = await sql`
      SELECT column_name, data_type, udt_name, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'dcc_contexts'
      ORDER BY ordinal_position;
    `;
    console.log(`\nColumns in 'dcc_contexts' (${cols.length} total):`);
    for (const c of cols) {
      console.log(`  - ${c.column_name}: type=${c.data_type} (udt=${c.udt_name}), nullable=${c.is_nullable}, default=${c.column_default}`);
    }

    // Enum values
    const enumVals = await sql`
      SELECT e.enumlabel
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      WHERE t.typname = 'dcc_context_status'
      ORDER BY e.enumsortorder;
    `;
    console.log(`\nEnum 'dcc_context_status' values:`, enumVals.map(e => e.enumlabel));

    // Indexes
    const indexes = await sql`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'dcc_contexts'
      ORDER BY indexname;
    `;
    console.log(`\nIndexes on 'dcc_contexts' (${indexes.length} total):`);
    for (const idx of indexes) {
      console.log(`  - ${idx.indexname}: ${idx.indexdef}`);
    }

  } catch (err) {
    console.error("Migration/Verification failed:", err);
    process.exit(1);
  }
}

runMigrationAndVerify();
