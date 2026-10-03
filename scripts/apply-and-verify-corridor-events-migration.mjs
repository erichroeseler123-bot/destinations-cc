import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";
import path from "node:path";
import fs from "node:fs";

// Load .env.test.local by default or allow command-line override
let envPath = path.join(process.cwd(), ".env.test.local");
const envArgIdx = process.argv.indexOf("--env");
if (envArgIdx !== -1 && process.argv[envArgIdx + 1]) {
  envPath = path.resolve(process.cwd(), process.argv[envArgIdx + 1]);
} else if (!fs.existsSync(envPath)) {
  envPath = path.join(process.cwd(), ".env.local");
}

if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log(`Loaded environment from: ${envPath}`);
}

const connectionString =
  process.env.DCC_DATABASE_URL || process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!connectionString) {
  console.error("No database connection string found in environment!");
  process.exit(1);
}

const u = new URL(connectionString);
console.log("=== TARGET DATABASE ===");
console.log("Host:", u.host);
console.log("Database:", u.pathname);

const sql = neon(connectionString);

const LIVE_CORRIDORS = [
  { corridor_id: "ask-dcc", corridor_name: "Ask DCC", family: "decision-engine", app_path: "app/ask + app/api/ask-dcc", status: "live", continuity_level: "state-execution", pattern_family: "jfd" },
  { corridor_id: "portfolio-network", corridor_name: "DCC Portfolio Network", family: "decision-engine", app_path: "app/api/network/telemetry + connected portfolio sites", status: "live", continuity_level: "state-execution", pattern_family: "jfd" },
  { corridor_id: "wno-commerce", corridor_name: "Welcome to New Orleans Tours Commerce", family: "marketplace", app_path: "app/new-orleans + app/api/wno/telemetry", status: "live", continuity_level: "checkout-continuity", pattern_family: "swamp" },
  { corridor_id: "lastfrontier-alaska", corridor_name: "Last Frontier Shore Excursions", family: "decision-engine", app_path: "external / lastfrontiershoreexcursions.com", status: "live", continuity_level: "state-execution", pattern_family: "jfd" },
  { corridor_id: "wta", corridor_name: "Juneau Flight Deck", family: "decision-engine", app_path: "apps/juneauflightdeck", status: "live", continuity_level: "state-execution", pattern_family: "jfd" },
  { corridor_id: "sedona-jeep", corridor_name: "Sedona Jeep Tours", family: "decision-engine", app_path: "apps/sedonajeep + app/sedona/jeep-tours", status: "live", continuity_level: "state-execution", pattern_family: "jfd" },
  { corridor_id: "lake-tahoe-activities", corridor_name: "Lake Tahoe Activities", family: "decision-engine", app_path: "app/lake-tahoe/things-to-do", status: "live", continuity_level: "state-execution", pattern_family: "jfd" },
  { corridor_id: "welcometotheswamp", corridor_name: "Welcome to the Swamp", family: "decision-engine", app_path: "apps/welcometotheswamp", status: "live", continuity_level: "state-execution", pattern_family: "swamp" },
  { corridor_id: "partyatredrocks", corridor_name: "Party at Red Rocks", family: "direct-execution", app_path: "external / partyatredrocks", status: "live", continuity_level: "checkout-continuity", pattern_family: "parr" },
  { corridor_id: "lake-tahoe-transport", corridor_name: "Lake Tahoe Transport", family: "direct-execution", app_path: "apps/laketahoe", status: "live", continuity_level: "checkout-continuity", pattern_family: "parr" },
  { corridor_id: "argo-day-transport", corridor_name: "Mighty Argo Shuttle", family: "direct-execution", app_path: "app/mighty-argo-shuttle + external / shuttleya.com/book/argo-shuttle", status: "live", continuity_level: "checkout-continuity", pattern_family: "420" },
  { corridor_id: "airport-420-pickup", corridor_name: "420 Airport Pickup", family: "direct-execution", app_path: "apps/420-airport-pickup", status: "live", continuity_level: "checkout-continuity", pattern_family: "420" },
  { corridor_id: "western-wisconsin", corridor_name: "Western Wisconsin Weekend Trips", family: "decision-engine", app_path: "app/western-wisconsin", status: "live", continuity_level: "state-execution", pattern_family: "jfd" },
  { corridor_id: "denver-to-mountains", corridor_name: "Denver to Mountains", family: "decision-engine", app_path: "app/denver-to-mountains", status: "live", continuity_level: "state-execution", pattern_family: "jfd" },
  { corridor_id: "feastly-dinner-night", corridor_name: "Feastly Dinner Night", family: "marketplace", app_path: "external / feastlyspread.com", status: "live", continuity_level: "checkout-continuity", pattern_family: "feastly" },
];

async function runMigrationAndVerify() {
  try {
    console.log("\n1. Applying DDL migration 0004_dcc_corridor_events.sql...");

    await sql.transaction([
      sql`
        CREATE TABLE IF NOT EXISTS "dcc_corridor_catalog" (
          "corridor_id" text PRIMARY KEY NOT NULL,
          "corridor_name" text NOT NULL,
          "family" text NOT NULL,
          "app_path" text NOT NULL,
          "status" text NOT NULL,
          "continuity_level" text NOT NULL,
          "pattern_family" text,
          "created_at" timestamp with time zone DEFAULT now() NOT NULL,
          "updated_at" timestamp with time zone DEFAULT now() NOT NULL
        );
      `,
      sql`CREATE INDEX IF NOT EXISTS "dcc_corridor_catalog_family_idx" ON "dcc_corridor_catalog" ("family");`,
      sql`CREATE INDEX IF NOT EXISTS "dcc_corridor_catalog_status_idx" ON "dcc_corridor_catalog" ("status");`,

      sql`
        CREATE TABLE IF NOT EXISTS "dcc_corridor_events" (
          "event_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
          "occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
          "corridor_id" text NOT NULL REFERENCES "dcc_corridor_catalog"("corridor_id") ON DELETE RESTRICT,
          "family" text NOT NULL,
          "event_name" text NOT NULL,
          "handoff_id" text,
          "session_id" text,
          "user_id" text,
          "source_page" text,
          "landing_path" text,
          "target_path" text,
          "requested_lane" text,
          "resolved_lane" text,
          "topic" text,
          "subtype" text,
          "port" text,
          "handoff_date" date,
          "default_card_slug" text,
          "clicked_product_slug" text,
          "route_target" text,
          "fit_signal" text,
          "urgency" text,
          "confidence_downgraded" boolean DEFAULT false NOT NULL,
          "winning_rule_ids" text[] DEFAULT '{}'::text[] NOT NULL,
          "winning_fields" jsonb DEFAULT '{}'::jsonb NOT NULL,
          "page_variant" text,
          "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL
        );
      `,
      sql`CREATE INDEX IF NOT EXISTS "dcc_corridor_events_corridor_time_idx" ON "dcc_corridor_events" ("corridor_id", "occurred_at");`,
      sql`CREATE INDEX IF NOT EXISTS "dcc_corridor_events_event_time_idx" ON "dcc_corridor_events" ("event_name", "occurred_at");`,
      sql`CREATE INDEX IF NOT EXISTS "dcc_corridor_events_flow_idx" ON "dcc_corridor_events" ("corridor_id", "handoff_id", "session_id");`,
      sql`CREATE INDEX IF NOT EXISTS "dcc_corridor_events_downgraded_idx" ON "dcc_corridor_events" ("corridor_id", "confidence_downgraded");`,
      sql`CREATE INDEX IF NOT EXISTS "dcc_corridor_events_family_idx" ON "dcc_corridor_events" ("family", "occurred_at");`,
    ]);

    console.log("  ✔ DDL applied successfully.");

    console.log("\n2. Seeding corridor catalog entries...");
    for (const c of LIVE_CORRIDORS) {
      await sql`
        INSERT INTO "dcc_corridor_catalog" (
          "corridor_id", "corridor_name", "family", "app_path", "status", "continuity_level", "pattern_family", "created_at", "updated_at"
        ) VALUES (
          ${c.corridor_id}, ${c.corridor_name}, ${c.family}, ${c.app_path}, ${c.status}, ${c.continuity_level}, ${c.pattern_family}, now(), now()
        )
        ON CONFLICT ("corridor_id") DO UPDATE SET
          "corridor_name" = EXCLUDED."corridor_name",
          "family" = EXCLUDED."family",
          "app_path" = EXCLUDED."app_path",
          "status" = EXCLUDED."status",
          "continuity_level" = EXCLUDED."continuity_level",
          "pattern_family" = EXCLUDED."pattern_family",
          "updated_at" = now();
      `;
    }
    console.log(`  ✔ Seeded ${LIVE_CORRIDORS.length} catalog rows.`);

    console.log("\n3. Verifying schema...");
    const catalogCols = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'dcc_corridor_catalog'
      ORDER BY ordinal_position;
    `;
    console.log(`  Columns in 'dcc_corridor_catalog' (${catalogCols.length}):`, catalogCols.map(c => c.column_name).join(", "));

    const eventCols = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'dcc_corridor_events'
      ORDER BY ordinal_position;
    `;
    console.log(`  Columns in 'dcc_corridor_events' (${eventCols.length}):`, eventCols.map(c => c.column_name).join(", "));

    const indexes = await sql`
      SELECT indexname, tablename
      FROM pg_indexes
      WHERE tablename IN ('dcc_corridor_catalog', 'dcc_corridor_events')
      ORDER BY tablename, indexname;
    `;
    console.log(`  Indexes (${indexes.length}):`, indexes.map(i => `${i.tablename}.${i.indexname}`).join(", "));

    console.log("\n4. Testing isolated event insertion and durable persistence...");
    const testSessionId = `wno_test_migration_${Date.now()}`;
    const insertRes = await sql`
      INSERT INTO "dcc_corridor_events" (
        "corridor_id", "family", "event_name", "session_id", "landing_path", "source_page", "metadata"
      ) VALUES (
        'wno-commerce', 'marketplace', 'landing_viewed', ${testSessionId}, '/french-quarter', 'direct', ${JSON.stringify({ test_migration: true })}
      )
      RETURNING "event_id", "occurred_at", "corridor_id", "session_id";
    `;

    console.log("  ✔ Inserted row:", insertRes[0]);

    const selectRes = await sql`
      SELECT "event_id", "corridor_id", "family", "event_name", "session_id", "metadata"
      FROM "dcc_corridor_events"
      WHERE "session_id" = ${testSessionId};
    `;

    console.log("  ✔ Verified persistence from database query:", selectRes[0]);

    // Clean up test event
    await sql`DELETE FROM "dcc_corridor_events" WHERE "session_id" = ${testSessionId};`;
    console.log("  ✔ Cleaned up isolated test event row.");

    console.log("\n==================================================================");
    console.log("✔ CORRIDOR TELEMETRY MIGRATION APPLIED AND VERIFIED SUCCESSFULLY!");
    console.log("==================================================================\n");
  } catch (err) {
    console.error("Migration/Verification failed:", err);
    process.exit(1);
  }
}

runMigrationAndVerify();
