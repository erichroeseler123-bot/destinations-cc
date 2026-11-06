#!/usr/bin/env node
/**
 * Idempotent Viator Partner Platform Bookings/Campaign CSV Importer
 *
 * Usage:
 *   npm run telemetry:import-viator-csv -- <path-to-viator-report.csv> [--placement fp-wno-swamp-tours]
 *
 * Reads a CSV exported from the Viator Partner Platform (Performance / Bookings by Campaign report
 * containing the `campaign` / `campaign_value` column with `clk<24hex>` or legacy `clk_<24hex>`),
 * posts it to the authenticated `/api/v1/commerce/click-attribution` endpoint (`action: "reconcile_csv"`),
 * and prints the deduplicated reconciliation summary alongside the placement funnel report
 * (reporting production confirmed bookings, settled commission, and QA separately).
 *
 * Safe to rerun any number of times without double-counting (`dedupeKey = clickId::viator::bookingRef::eventType`).
 */

import fs from "node:fs";
import path from "node:path";

try {
  if (typeof process.loadEnvFile === "function") {
    process.loadEnvFile(path.join(process.cwd(), ".env.local"));
  }
} catch {
  // Ignore if .env.local is not present
}

const args = process.argv.slice(2);
const placementFlagIdx = args.indexOf("--placement");
const placementId =
  placementFlagIdx >= 0 && args[placementFlagIdx + 1]
    ? args[placementFlagIdx + 1].trim()
    : "fp-wno-swamp-tours";

const originFlagIdx = args.indexOf("--origin");
const origin = (
  originFlagIdx >= 0 && args[originFlagIdx + 1]
    ? args[originFlagIdx + 1].trim()
    : process.env.DCC_API_ORIGIN || "https://www.destinationcommandcenter.com"
).replace(/\/+$/, "");

const positionalArgs = args.filter(
  (arg, idx) =>
    !arg.startsWith("--") &&
    idx !== placementFlagIdx + 1 &&
    idx !== originFlagIdx + 1,
);

const csvFilePath = positionalArgs[0];
if (!csvFilePath) {
  console.error(
    "Usage: npm run telemetry:import-viator-csv -- <path-to-viator-bookings.csv> [--placement fp-wno-swamp-tours]",
  );
  process.exit(1);
}

const resolvedCsvPath = path.resolve(process.cwd(), csvFilePath);
if (!fs.existsSync(resolvedCsvPath)) {
  console.error(`CSV file not found: ${resolvedCsvPath}`);
  process.exit(1);
}

const adminSecret = (
  process.env.DCC_COMMERCE_ADMIN_SECRET ||
  process.env.INTERNAL_API_SECRET ||
  process.env.CRON_SECRET ||
  ""
).trim();

if (!adminSecret) {
  console.error(
    "Missing DCC_COMMERCE_ADMIN_SECRET (or INTERNAL_API_SECRET / CRON_SECRET) in environment or .env.local.",
  );
  process.exit(1);
}

const csvText = fs.readFileSync(resolvedCsvPath, "utf8");

async function main() {
  const reconcileRes = await fetch(
    `${origin}/api/v1/commerce/click-attribution`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${adminSecret}`,
        "x-dcc-admin-secret": adminSecret,
      },
      body: JSON.stringify({
        action: "reconcile_csv",
        provider: "viator",
        csvText,
      }),
    },
  );

  const reconcileJson = await reconcileRes.json().catch(() => ({}));
  if (!reconcileRes.ok || !reconcileJson.ok) {
    console.error(
      `Reconciliation failed (HTTP ${reconcileRes.status}):`,
      JSON.stringify(reconcileJson, null, 2),
    );
    process.exit(1);
  }

  const telemetryRes = await fetch(
    `${origin}/api/v1/concierge/telemetry?placementId=${encodeURIComponent(placementId)}&t=${Date.now()}`,
    {
      headers: {
        authorization: `Bearer ${adminSecret}`,
        "x-dcc-admin-secret": adminSecret,
        "cache-control": "no-cache",
      },
    },
  );
  const telemetryJson = await telemetryRes.json().catch(() => ({}));
  const funnel = telemetryJson?.pilotPlacement?.funnelByTrafficClass || null;

  const output = {
    ok: true,
    importedAt: new Date().toISOString(),
    csvFile: resolvedCsvPath,
    origin,
    placementId,
    reconciliationSummary: {
      totalRows: reconcileJson.summary?.totalRows ?? 0,
      matchedCount: reconcileJson.summary?.matchedCount ?? 0,
      newlyCreditedCount:
        (reconcileJson.summary?.matchedCount ?? 0) -
        (reconcileJson.summary?.deduplicatedCount ?? 0),
      deduplicatedIgnoredCount: reconcileJson.summary?.deduplicatedCount ?? 0,
      unmatchedCount: reconcileJson.summary?.unmatchedCount ?? 0,
    },
    placementReport: funnel
      ? {
          production: {
            outboundClicks: funnel.production.outboundClicks,
            providerConfirmedBookings:
              funnel.production.providerConfirmedBookings,
            estimatedUnsettledCommissionUsd:
              funnel.production.estimatedUnsettledCommissionUsd,
            settledCommissionUsd: funnel.production.settledCommissionUsd,
            duplicateDeliveriesIgnored:
              funnel.production.duplicateDeliveriesIgnored,
          },
          qaIsolated: {
            outboundClicks: funnel.test.outboundClicks,
            providerConfirmedBookings: funnel.test.providerConfirmedBookings,
            estimatedUnsettledCommissionUsd:
              funnel.test.estimatedUnsettledCommissionUsd,
            settledCommissionUsd: funnel.test.settledCommissionUsd,
            duplicateDeliveriesIgnored: funnel.test.duplicateDeliveriesIgnored,
          },
        }
      : null,
  };

  console.log(JSON.stringify(output, null, 2));
}

main().catch((err) => {
  console.error("Failed to import Viator CSV:", err);
  process.exit(1);
});
