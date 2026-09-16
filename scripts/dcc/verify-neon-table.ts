import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

// Load environment variables
const envFiles = [".env.local", ".env.test.local", ".env.production.local"];
for (const file of envFiles) {
  const fullPath = path.resolve(process.cwd(), file);
  if (fs.existsSync(fullPath)) {
    dotenv.config({ path: fullPath });
  }
}

const dbUrl =
  process.env.DCC_DATABASE_URL ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  "";

async function verifyNeon() {
  if (!dbUrl) {
    throw new Error("No database connection string found");
  }

  console.log("Connecting directly to Neon database...");
  const sql = neon(dbUrl);

  // 1. Table existence check
  const tables = await sql.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'dcc_square_webhook_events'"
  );
  console.log("1. Table exists:", tables.length === 1, tables);
  if (tables.length !== 1) {
    throw new Error("dcc_square_webhook_events does not exist in Neon");
  }

  // 2. Columns verification
  const cols = await sql.query(
    "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'dcc_square_webhook_events' ORDER BY ordinal_position"
  );
  console.log("2. Columns in dcc_square_webhook_events:");
  cols.forEach((c: any) => console.log(`   - ${c.column_name}: ${c.data_type} (nullable: ${c.is_nullable})`));

  // Required columns check
  const columnNames = cols.map((c: any) => c.column_name);
  const required = [
    "id",
    "square_event_id",
    "event_type",
    "payment_id",
    "order_id",
    "processing_status",
    "error_metadata",
    "received_at",
    "processed_at",
    "created_at",
    "updated_at",
  ];
  for (const req of required) {
    if (!columnNames.includes(req)) {
      throw new Error(`Missing required column: ${req}`);
    }
  }

  // 3. Indexes & Unique Constraints
  const idxs = await sql.query(
    "SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'dcc_square_webhook_events'"
  );
  console.log("3. Indexes on dcc_square_webhook_events:");
  idxs.forEach((i: any) => console.log(`   - ${i.indexname}: ${i.indexdef}`));

  const hasUniqueIndex = idxs.some(
    (i: any) =>
      i.indexname === "dcc_square_webhook_events_event_id_uidx" &&
      i.indexdef.toLowerCase().includes("unique") &&
      i.indexdef.includes("square_event_id")
  );
  console.log("   Unique constraint on square_event_id confirmed:", hasUniqueIndex);
  if (!hasUniqueIndex) {
    throw new Error("Missing unique constraint on square_event_id");
  }

  // 4. Atomic Duplicate Insertion Test
  const testEventId = `sq_verify_atomic_${Date.now()}`;
  console.log(`4. Testing atomic insertion and conflict rejection with ${testEventId}...`);

  // First insert -> must succeed
  await sql.query(
    "INSERT INTO dcc_square_webhook_events (id, square_event_id, event_type, processing_status, received_at) VALUES ($1, $2, $3, $4, NOW())",
    [`id1_${testEventId}`, testEventId, "payment.updated", "processing"]
  );
  console.log("   First insert: SUCCESS");

  // Second insert with exact same square_event_id -> must fail with 23505 unique_violation
  let rejected = false;
  let errorCode = "";
  try {
    await sql.query(
      "INSERT INTO dcc_square_webhook_events (id, square_event_id, event_type, processing_status, received_at) VALUES ($1, $2, $3, $4, NOW())",
      [`id2_${testEventId}`, testEventId, "payment.updated", "processing"]
    );
  } catch (err: any) {
    rejected = true;
    errorCode = err.code || "";
    console.log(`   Second insert: CONFLICT REJECTED (code: ${errorCode}, error: ${err.message})`);
  }

  if (!rejected) {
    throw new Error("Duplicate insert did NOT conflict! Unique constraint failed.");
  }

  // Cleanup test row
  await sql.query("DELETE FROM dcc_square_webhook_events WHERE square_event_id = $1", [testEventId]);
  console.log("   Cleanup: Test row removed");

  console.log("\n✅ DIRECT NEON VERIFICATION COMPLETE: ALL 4 CHECKS PASSED!");
}

verifyNeon().catch((err) => {
  console.error("❌ Verification failed:", err);
  process.exit(1);
});
