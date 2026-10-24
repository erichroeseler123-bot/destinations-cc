import { runRepeatableEarthosMigration } from "@/lib/dcc/earthos/ensureEarthosSchema";

async function main() {
  const result = await runRepeatableEarthosMigration();
  console.log(
    JSON.stringify(
      {
        ok: true,
        migrationId: result.migrationId,
        checksum: result.checksum,
        executionCount: result.executionCount,
        lastAppliedAt: result.lastAppliedAt,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error("EarthOS migration failed:", error);
  process.exit(1);
});
