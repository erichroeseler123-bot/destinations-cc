import fs from "node:fs";
import path from "node:path";

const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envText = fs.readFileSync(envPath, "utf8");
  for (const line of envText.split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}

async function main() {
  const { runUniversalCatalogIngestion } = await import("../lib/dcc/catalog/ingest");
  const { getDurableCatalogSummaryReport } = await import("../lib/dcc/catalog/durableCatalogStore");

  const destArg = process.argv.find((a) => a.startsWith("--destinations="));
  const destinations = destArg
    ? destArg
        .slice("--destinations=".length)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : undefined;

  console.log(
    `[sync-universal-catalog] Starting multi-destination ingestion (${destinations ? destinations.join(", ") : "all 15 EarthOS destinations"})...`,
  );
  const t0 = Date.now();
  const res = await runUniversalCatalogIngestion({
    destinations,
    perDestinationLimit: 10,
    enrichDetailLimitPerDestination: 3,
  });
  const elapsedMs = Date.now() - t0;

  const summary = await getDurableCatalogSummaryReport();
  console.log(
    JSON.stringify(
      {
        elapsedMs,
        upsertedCount: res.upsertedCount,
        persistedToPostgres: res.persistedToPostgres,
        storageSource: summary.storageSource,
        totalImportedRecords: summary.totalImportedRecords,
        totalDestinationsCovered: summary.totalDestinationsCovered,
        totalRejectedRecords: summary.totalRejectedRecords,
        totalUpstreamRequestsDuringSync: summary.totalUpstreamRequestsDuringSync,
        byCapabilityTier: summary.byCapabilityTier,
        byProvider: summary.byProvider,
        byDestinationSummary: Object.fromEntries(
          Object.entries(summary.byDestination).map(([k, v]) => [
            k,
            {
              total: v.total,
              earthosNodeId: v.earthosNodeId,
              timeZone: v.timeZone,
              byCapabilityTier: v.byCapabilityTier,
              explicitUnknownCounts: v.explicitUnknownCounts,
            },
          ]),
        ),
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error("[sync-universal-catalog] Error:", err);
  process.exit(1);
});
