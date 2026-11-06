#!/usr/bin/env node
/**
 * 25-Tour Viator Option-Level Logistics & Location Resolution Dry Run
 *
 * 1. Selects 25 Viator catalog tours, prioritizing tours guests already click
 *    in telemetry/attribution ledgers followed by top catalog Viator tours.
 * 2. Evaluates baseline pickup & meeting normalization before live enrichment.
 * 3. Fetches live option-level logistics (`GET /products/{code}`) and resolves
 *    all `LOC-...` references (`POST /locations/bulk`).
 * 4. Re-evaluates normalization, keeping missing facts explicitly `unknown`
 *    and queuing ONLY deduplicated exceptions that need human judgment to the Review Desk.
 */

import fs from "node:fs";
import path from "node:path";

const PRIORITY_CLICKED_CODES = [
  "15200P6",
  "6953SWAMPTRANS",
  "254526P1",
  "7452P2",
  "5199KSML",
  "5199P27",
  "5553274P1",
  "6455NOLAAIR",
  "3780AIRBOAT",
  "331813P1",
];

async function main() {
  const catalogMod = await import("../lib/dcc/catalog/durableCatalogStore.ts");
  const normalizerMod = await import("../lib/dcc/catalog/pickupNormalizer.ts");
  const viatorMod = await import("../lib/viator/client.ts");
  const ledgerMod = await import("../lib/dcc/commerce/opaqueAttributionLedger.ts");

  const { readLocalCatalogSnapshot } = catalogMod.default || catalogMod;
  const {
    normalizeCatalogBatchPickupAndMeeting,
    deduplicatePickupExceptionsForReviewDesk,
    extractViatorLocationRefsFromProductDetail,
    enrichTourRecordFromViatorProductDetailAndLocations,
    queueCatalogPickupExceptionsToReviewDesk,
  } = normalizerMod.default || normalizerMod;
  const { getViatorClient } = viatorMod.default || viatorMod;
  const { listOpaqueAttributionRecords } = ledgerMod.default || ledgerMod;

  const allCatalog = readLocalCatalogSnapshot().records;
  const viatorTours = allCatalog.filter(
    (r) =>
      r.primaryProvider === "viator" &&
      r.active &&
      typeof r.providerProductCode === "string" &&
      !r.providerProductCode.startsWith("TEST_"),
  );

  // Discover clicked Viator product codes from the attribution ledger
  let ledgerClickedCodes = [];
  try {
    const ledgerRecords = await listOpaqueAttributionRecords({
      includeTest: true,
      limit: 500,
    });
    const counts = new Map();
    for (const rec of ledgerRecords) {
      if (rec.provider === "viator" && rec.productCode) {
        const code = String(rec.productCode).trim().toUpperCase();
        counts.set(code, (counts.get(code) || 0) + (rec.clickCount || 1));
      }
    }
    ledgerClickedCodes = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([code]) => code);
  } catch {
    // Fallback to priority list if ledger unavailable
  }

  const orderedPriorityCodes = Array.from(
    new Set([...ledgerClickedCodes, ...PRIORITY_CLICKED_CODES]),
  );

  const selected25 = [];
  const seenCodes = new Set();

  for (const code of orderedPriorityCodes) {
    if (selected25.length >= 25) break;
    const match = viatorTours.find(
      (t) => t.providerProductCode.toUpperCase() === code.toUpperCase(),
    );
    if (match && !seenCodes.has(match.providerProductCode)) {
      selected25.push({ record: match, selectionReason: "guest_clicked_or_pilot_priority" });
      seenCodes.add(match.providerProductCode);
    }
  }

  // Fill remaining slots up to 25 with top-reviewed Viator tours that currently have pickup/meeting unknowns across key destinations
  const candidateRemaining = viatorTours
    .filter((t) => !seenCodes.has(t.providerProductCode))
    .sort((a, b) => {
      const aUnknown =
        a.pickupType === "UNKNOWN" ||
        !a.meetingPointName ||
        a.locationPrecision === "unknown"
          ? 1
          : 0;
      const bUnknown =
        b.pickupType === "UNKNOWN" ||
        !b.meetingPointName ||
        b.locationPrecision === "unknown"
          ? 1
          : 0;
      if (aUnknown !== bUnknown) return bUnknown - aUnknown;
      return (b.reviewCount || 0) - (a.reviewCount || 0);
    });

  for (const tour of candidateRemaining) {
    if (selected25.length >= 25) break;
    selected25.push({ record: tour, selectionReason: "catalog_unknown_logistics_priority" });
    seenCodes.add(tour.providerProductCode);
  }

  const baselineRecords = selected25.map((s) => s.record);
  const beforeBatch = normalizeCatalogBatchPickupAndMeeting(baselineRecords);
  const beforeDeduplicated = deduplicatePickupExceptionsForReviewDesk(
    beforeBatch.exceptions,
  );

  const client = getViatorClient();
  const detailsByCode = new Map();
  const allLocationRefs = new Set();
  const fetchStatuses = [];

  for (const { record, selectionReason } of selected25) {
    const code = record.providerProductCode;
    try {
      const detail = await client.getProductDetail(code);
      detailsByCode.set(code, detail);
      const refs = extractViatorLocationRefsFromProductDetail(detail);
      for (const ref of refs) allLocationRefs.add(ref);
      const optionsCount = Array.isArray(detail?.productOptions)
        ? detail.productOptions.length
        : 0;
      fetchStatuses.push({
        productCode: code,
        destinationSlug: record.destinationSlug,
        selectionReason,
        status: "fetched",
        optionsCount,
        locationRefsCount: refs.length,
      });
    } catch (err) {
      fetchStatuses.push({
        productCode: code,
        destinationSlug: record.destinationSlug,
        selectionReason,
        status: "error",
        error: err instanceof Error ? err.message : String(err),
        optionsCount: 0,
        locationRefsCount: 0,
      });
    }
  }

  // Batch resolve location references via Viator /locations/bulk (up to 450 per call)
  const locationsByRef = new Map();
  const allRefsArray = Array.from(allLocationRefs);
  let tripAdvisorRefsCount = 0;
  let googleRefsCount = 0;
  let resolvedCoordinateRefsCount = 0;

  for (let i = 0; i < allRefsArray.length; i += 450) {
    const slice = allRefsArray.slice(i, i + 450);
    if (slice.length === 0) continue;
    try {
      const bulkRes = await client.getLocationsBulk(slice);
      const locations = Array.isArray(bulkRes?.locations) ? bulkRes.locations : [];
      for (const loc of locations) {
        const ref = typeof loc?.reference === "string" ? loc.reference.trim() : "";
        if (!ref) continue;
        locationsByRef.set(ref, loc);
        const provider = String(loc?.provider || "").toUpperCase();
        if (provider === "GOOGLE") googleRefsCount++;
        else tripAdvisorRefsCount++;
        if (
          typeof loc?.center?.latitude === "number" &&
          typeof loc?.center?.longitude === "number"
        ) {
          resolvedCoordinateRefsCount++;
        }
      }
    } catch (err) {
      console.warn(
        `[viator-logistics-dry-run] /locations/bulk warning:`,
        err instanceof Error ? err.message : String(err),
      );
    }
  }

  const enrichedRecords = baselineRecords.map((rec) => {
    const detail = detailsByCode.get(rec.providerProductCode);
    if (!detail) return rec;
    return enrichTourRecordFromViatorProductDetailAndLocations(
      rec,
      detail,
      locationsByRef,
    );
  });

  const afterBatch = normalizeCatalogBatchPickupAndMeeting(enrichedRecords);
  const afterDeduplicated = deduplicatePickupExceptionsForReviewDesk(
    afterBatch.exceptions,
  );

  // Queue ONLY deduplicated exceptions that still require human judgment to Review Desk
  const queuedResult = await queueCatalogPickupExceptionsToReviewDesk(
    afterDeduplicated,
    { maxRowsToQueue: 100 },
  );

  const countTourAndOptionMetrics = (normBatch) => {
    const recs = normBatch.normalizedRecords;
    const pickupModeUnknownCount = recs.filter(
      (r) => r.pickupType === "UNKNOWN" || r.pickupFulfillmentType === "unknown",
    ).length;
    const pickupModeKnownCount = recs.length - pickupModeUnknownCount;
    const meetingPointUnknownCount = recs.filter(
      (r) => !r.meetingPointName && !r.hasHotelPickup,
    ).length;
    const meetingPointKnownCount = recs.length - meetingPointUnknownCount;
    const exactCoordinatesKnownCount = recs.filter(
      (r) => r.locationPrecision === "exact",
    ).length;
    const exactCoordinatesUnknownCount = recs.length - exactCoordinatesKnownCount;

    let totalOptionsEvaluated = 0;
    let optionPickupKnownCount = 0;
    let optionPickupUnknownCount = 0;
    for (const r of recs) {
      for (const opt of r.productOptions || []) {
        totalOptionsEvaluated++;
        if (opt.pickupFulfillmentType && opt.pickupFulfillmentType !== "unknown") {
          optionPickupKnownCount++;
        } else {
          optionPickupUnknownCount++;
        }
      }
    }

    return {
      pickupModeKnownCount,
      pickupModeUnknownCount,
      meetingPointKnownCount,
      meetingPointUnknownCount,
      exactCoordinatesKnownCount,
      exactCoordinatesUnknownCount,
      totalOptionsEvaluated,
      optionPickupKnownCount,
      optionPickupUnknownCount,
      fullyVerifiedToursCount: normBatch.summary.fullyVerifiedPickupAndMeetingCount,
      toursWithRemainingUnknownsCount:
        normBatch.summary.recordsWithUnknownPickupOrMeetingCount,
      rawExceptionsCount: normBatch.summary.totalExceptionsCount,
      byExceptionCode: normBatch.summary.byExceptionCode,
    };
  };

  // Seed un-enriched option stubs on baseline records where catalog snapshot had empty productOptions so before/after option counts are apples-to-apples
  const baselineWithRawOptionStubs = baselineRecords.map((rec) => {
    if (Array.isArray(rec.productOptions) && rec.productOptions.length > 0) {
      return rec;
    }
    const detail = detailsByCode.get(rec.providerProductCode);
    const rawDetailOptions = Array.isArray(detail?.productOptions)
      ? detail.productOptions
      : [];
    return {
      ...rec,
      productOptions: rawDetailOptions.map((dOpt) => ({
        optionCode: String(dOpt?.productOptionCode || "DEFAULT"),
        title: String(dOpt?.title || rec.title),
        description:
          typeof dOpt?.description === "string" ? dOpt.description : null,
        includesPickup: null,
        pickupFulfillmentType: "unknown",
        meetingPointName: null,
        meetingPointLat: null,
        meetingPointLng: null,
        durationMinutes: rec.durationMinutes,
        fromPriceCents: rec.fromPriceCents,
        priceBasis: rec.priceBasis || "per_person",
        scheduledStartTimes: [],
      })),
    };
  });

  const beforeApplesBatch = normalizeCatalogBatchPickupAndMeeting(
    baselineWithRawOptionStubs,
  );
  const beforeApplesDeduped = deduplicatePickupExceptionsForReviewDesk(
    beforeApplesBatch.exceptions,
  );

  const beforeMetrics = countTourAndOptionMetrics(beforeApplesBatch);
  const afterMetrics = countTourAndOptionMetrics(afterBatch);

  const pickupModeUnknownsResolved = Math.max(
    0,
    beforeMetrics.pickupModeUnknownCount - afterMetrics.pickupModeUnknownCount,
  );
  const meetingPointUnknownsResolved = Math.max(
    0,
    beforeMetrics.meetingPointUnknownCount - afterMetrics.meetingPointUnknownCount,
  );
  const exactCoordinatesUnknownsResolved = Math.max(
    0,
    beforeMetrics.exactCoordinatesUnknownCount -
      afterMetrics.exactCoordinatesUnknownCount,
  );
  const optionPickupUnknownsResolved = Math.max(
    0,
    beforeMetrics.optionPickupUnknownCount - afterMetrics.optionPickupUnknownCount,
  );
  const rawExceptionsResolved = Math.max(
    0,
    beforeApplesBatch.summary.totalExceptionsCount -
      afterBatch.summary.totalExceptionsCount,
  );
  const deduplicatedExceptionsResolved = Math.max(
    0,
    beforeApplesDeduped.length - afterDeduplicated.length,
  );

  const perTourComparison = baselineWithRawOptionStubs.map((beforeRec, idx) => {
    const beforeNorm = beforeApplesBatch.normalizedRecords[idx];
    const afterNorm = afterBatch.normalizedRecords[idx];
    const sel = selected25[idx];
    const detail = detailsByCode.get(beforeRec.providerProductCode);
    return {
      productCode: beforeRec.providerProductCode,
      destinationSlug: beforeRec.destinationSlug,
      title: beforeRec.title,
      selectionReason: sel.selectionReason,
      liveOptionsEvaluated: Array.isArray(detail?.productOptions)
        ? detail.productOptions.length
        : (beforeRec.productOptions || []).length,
      before: {
        pickupType: beforeNorm.pickupType,
        pickupFulfillmentType: beforeNorm.pickupFulfillmentType,
        meetingPointName: beforeNorm.meetingPointName,
        locationPrecision: beforeNorm.locationPrecision,
      },
      after: {
        pickupType: afterNorm.pickupType,
        pickupFulfillmentType: afterNorm.pickupFulfillmentType,
        meetingPointName: afterNorm.meetingPointName,
        meetingPointAddress: afterNorm.meetingPointAddress,
        locationPrecision: afterNorm.locationPrecision,
      },
      resolvedPickupMode:
        beforeNorm.pickupType === "UNKNOWN" && afterNorm.pickupType !== "UNKNOWN",
      resolvedMeetingPoint:
        !beforeNorm.meetingPointName && Boolean(afterNorm.meetingPointName),
      resolvedExactCoordinates:
        beforeNorm.locationPrecision !== "exact" &&
        afterNorm.locationPrecision === "exact",
    };
  });

  const report = {
    generatedAt: new Date().toISOString(),
    dryRunScope: {
      toursEvaluated: selected25.length,
      guestClickedOrPilotPriorityCount: selected25.filter(
        (s) => s.selectionReason === "guest_clicked_or_pilot_priority",
      ).length,
      catalogUnknownLogisticsPriorityCount: selected25.filter(
        (s) => s.selectionReason === "catalog_unknown_logistics_priority",
      ).length,
      totalOptionsEvaluated: afterMetrics.totalOptionsEvaluated,
    },
    providerLocationResolution: {
      uniqueLocationRefsExtracted: allRefsArray.length,
      locationsReturnedByBulkApi: locationsByRef.size,
      tripAdvisorResolvedCount: tripAdvisorRefsCount,
      googlePlaceIdProxyCount: googleRefsCount,
      locationsWithExactCoordinatesCount: resolvedCoordinateRefsCount,
    },
    beforeEnrichment: {
      ...beforeMetrics,
      deduplicatedExceptionsCount: beforeApplesDeduped.length,
    },
    afterEnrichment: {
      ...afterMetrics,
      deduplicatedExceptionsCount: afterDeduplicated.length,
    },
    resolutionImpact: {
      pickupModeUnknownsResolved,
      meetingPointUnknownsResolved,
      exactCoordinatesUnknownsResolved,
      optionPickupUnknownsResolved,
      totalUnknownFieldsResolved:
        pickupModeUnknownsResolved +
        meetingPointUnknownsResolved +
        exactCoordinatesUnknownsResolved +
        optionPickupUnknownsResolved,
      rawExceptionsResolved,
      deduplicatedExceptionsResolved,
      reviewDeskSuppressionFromOptionDeduplication:
        afterBatch.summary.totalExceptionsCount - afterDeduplicated.length,
      reviewDeskDeduplicatedQueuedCount: queuedResult.queuedCount,
    },
    deduplicatedReviewDeskCases: afterDeduplicated.map((exc) => ({
      factId: exc.factId,
      productCode: exc.providerProductCode,
      destinationSlug: exc.destinationSlug,
      optionCode: exc.optionCode,
      exceptionCode: exc.exceptionCode,
      observedStateSummary: exc.observedStateSummary,
      humanDecisionRequired: exc.humanDecisionRequired,
    })),
    perTourComparison,
  };

  const outPath = path.join(
    process.cwd(),
    "data",
    "catalog",
    "viator-25-tour-logistics-dry-run.report.json",
  );
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2) + "\n", "utf8");

  console.log(
    JSON.stringify(
      {
        ok: true,
        reportPath: outPath,
        dryRunScope: report.dryRunScope,
        providerLocationResolution: report.providerLocationResolution,
        beforeEnrichment: report.beforeEnrichment,
        afterEnrichment: report.afterEnrichment,
        resolutionImpact: report.resolutionImpact,
        sampleResolvedTours: perTourComparison
          .filter((t) => t.resolvedPickupMode || t.resolvedMeetingPoint)
          .slice(0, 10),
        deduplicatedReviewDeskCasesCount: report.deduplicatedReviewDeskCases.length,
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
