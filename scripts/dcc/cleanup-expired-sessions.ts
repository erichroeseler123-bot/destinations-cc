import { cleanupExpiredDccSessions } from "@/lib/dcc/context/service";
import { getDb } from "@/lib/db/client";

async function main() {
  console.log("==================================================================");
  console.log("DCC CRON: Purging expired session invalidations from Neon DB");
  console.log("==================================================================");

  const db = getDb();
  if (!db) {
    console.error("❌ Database connection not configured. Skipping cleanup.");
    process.exit(1);
  }

  const startTime = Date.now();
  const result = await cleanupExpiredDccSessions();

  if (result.success) {
    console.log(`✔ Successfully purged ${result.deletedCount} expired invalidation records in ${Date.now() - startTime}ms.`);
  } else {
    console.error("❌ Failed to purge expired invalidation records.");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Unexpected error in cleanup-expired-sessions script:", err);
  process.exit(1);
});
