import { ensureCatalogSchema, syncPilotVerifiedRecordsToPostgres } from "@/lib/dcc/catalog/durableCatalogStore";
import { ensureCorridorTables, ensureCorridorCatalogRows } from "@/lib/dcc/telemetry/corridorEvents";

async function main() {
  await ensureCatalogSchema();
  const pilotCount = await syncPilotVerifiedRecordsToPostgres();
  await ensureCorridorTables();
  await ensureCorridorCatalogRows();
  console.log(
    JSON.stringify(
      {
        ok: true,
        migrated: [
          "0004_dcc_corridor_events",
          "0009_dcc_tour_catalog_and_refresh_checkpoints",
        ],
        pilotVerifiedRecordsSynced: pilotCount,
        appliedAt: new Date().toISOString(),
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error("Catalog & corridor migration failed:", err);
  process.exit(1);
});
