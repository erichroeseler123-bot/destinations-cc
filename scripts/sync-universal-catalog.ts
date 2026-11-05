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
  const limitArg = process.argv.find((a) => a.startsWith("--limit="));
  const enrichArg = process.argv.find((a) => a.startsWith("--enrich="));
  const pagesArg = process.argv.find((a) => a.startsWith("--pages="));
  const resumeArg = process.argv.includes("--resume");

  const destinations = destArg
    ? destArg
        .slice("--destinations=".length)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : undefined;
  const perDestinationLimit = limitArg ? Number.parseInt(limitArg.slice("--limit=".length), 10) : 10;
  const enrichDetailLimitPerDestination = enrichArg ? Number.parseInt(enrichArg.slice("--enrich=".length), 10) : 3;
  const maxPagesPerDestination = pagesArg ? Number.parseInt(pagesArg.slice("--pages=".length), 10) : 1;

  console.log(
    `[sync-universal-catalog] Starting multi-destination ingestion (${destinations ? destinations.join(", ") : "all EarthOS destinations"})...`,
  );
  const t0 = Date.now();
  const res = await runUniversalCatalogIngestion({
    destinations,
    perDestinationLimit,
    enrichDetailLimitPerDestination,
    maxPagesPerDestination,
    resumeFromCheckpoint: resumeArg,
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
        quarantinedRecordsExcludedCount: summary.quarantinedRecordsExcludedCount,
        quarantinedTourIds: summary.quarantinedTourIds,
        destinationCoverageBreakdown: summary.destinationCoverageBreakdown,
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
              coverageStatus: v.coverageStatus,
              providerTotalAvailableCount: v.providerTotalAvailableCount,
              importedCount: v.importedCount,
              nextCursor: v.nextCursor,
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
