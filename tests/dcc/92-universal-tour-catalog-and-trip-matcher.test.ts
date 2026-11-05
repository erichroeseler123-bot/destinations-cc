import test from "node:test";
import assert from "node:assert/strict";
import {
  EARTHOS_DESTINATION_NODES,
  QUARANTINED_TOUR_IDS,
  getDurableCatalogSummaryReport,
  getDurableTourByIdOrAlias,
  queryDurableTourCatalog,
} from "../../lib/dcc/catalog/durableCatalogStore";
import {
  evaluateCruiseScheduleFit,
  matchToursForTrip,
} from "../../lib/dcc/catalog/matcher";
import { getHotelConciergeConfig } from "../../lib/dcc/catalog/hotelConfigs";
import {
  getFunnelMetricsReport,
  resetOpaqueAttributionLedgerForTests,
} from "../../lib/dcc/commerce/opaqueAttributionLedger";

test("1. Durable Shared Tour Catalog covers all 15 EarthOS destinations, reports sampled vs complete coverage accurately against provider totals, and preserves compatibility aliases", async () => {
  const summary = await getDurableCatalogSummaryReport();
  assert.ok(
    summary.totalImportedRecords >= 900,
    `Expected >= 900 records after multi-page backfill, got ${summary.totalImportedRecords}`,
  );
  assert.equal(summary.totalDestinationsCovered, 15);
  assert.equal(summary.wtaStatus, "paused");
  assert.ok(summary.quarantinedRecordsExcludedCount >= 6);
  assert.ok(
    summary.destinationCoverageBreakdown.sampledDestinationsCount +
      summary.destinationCoverageBreakdown.completeDestinationsCount ===
      15,
  );

  // Completing 5 pages (100 products) does NOT mark a destination complete when provider total > 100
  assert.equal(summary.byDestination["new-orleans"].viatorImportedCount, 100);
  assert.ok((summary.byDestination["new-orleans"].providerTotalAvailableCount ?? 0) >= 700);
  assert.equal(summary.byDestination["new-orleans"].coverageStatus, "sampled");

  assert.equal(summary.byDestination["juneau"].viatorImportedCount, 100);
  assert.equal(summary.byDestination["juneau"].importedCount, 119);
  assert.equal(summary.byDestination["juneau"].coverageStatus, "sampled");

  assert.equal(summary.byDestination["ketchikan"].viatorImportedCount, 100);
  assert.equal(summary.byDestination["ketchikan"].coverageStatus, "sampled");

  assert.equal(summary.byDestination["cozumel"].viatorImportedCount, 100);
  assert.equal(summary.byDestination["cozumel"].coverageStatus, "sampled");

  // Skagway has 65 Viator products total and all 65 are imported -> complete
  assert.equal(summary.byDestination["skagway"].viatorImportedCount, 65);
  assert.equal(summary.byDestination["skagway"].providerTotalAvailableCount, 65);
  assert.equal(summary.byDestination["skagway"].coverageStatus, "complete");

  for (const slug of Object.keys(EARTHOS_DESTINATION_NODES)) {
    assert.ok(summary.byDestination[slug], `Missing destination coverage for ${slug}`);
    assert.ok(summary.byDestination[slug].total >= 35, `Expected >= 35 records for ${slug}`);
    assert.equal(
      summary.byDestination[slug].earthosNodeId,
      EARTHOS_DESTINATION_NODES[slug].earthosDestinationNodeId,
    );
  }

  // Compatibility aliases from lib/viator/mappings.ts resolve to real Viator catalog records
  const byInternalAlias = await getDurableTourByIdOrAlias("honey-island-swamp-pickup");
  assert.ok(byInternalAlias, "Expected honey-island-swamp-pickup alias to resolve");
  assert.equal(byInternalAlias.tourId, "dcc:tour:viator:6953SWAMPTRANS");
  assert.equal(byInternalAlias.destinationSlug, "new-orleans");

  const byViatorCode = await getDurableTourByIdOrAlias("331813P1");
  assert.ok(byViatorCode, "Expected Juneau whale watch 331813P1 code to resolve");
  assert.equal(byViatorCode.destinationSlug, "juneau");
  assert.equal(byViatorCode.capabilityTier, "live_check_referral");
});

test("2. Quarantined acceptance fixtures and unsupported operator listings are excluded from public catalog queries", async () => {
  const expectedQuarantined = [
    "dcc:tour:nola:lafitte-custom-bayou-charter-unknowns",
    "dcc:tour:nola:preservation-hall-jazz-session",
    "dcc:tour:nola:steamboat-natchez-jazz-cruise",
    "dcc:tour:nola:cajun-encounters-honey-island-swamp",
    "dcc:tour:gosno:winter-park-express-shuttle",
    "dcc:tour:parr:red-rocks-amphitheatre-shuttle",
  ];

  for (const qId of expectedQuarantined) {
    assert.ok(QUARANTINED_TOUR_IDS.has(qId), `Expected ${qId} in QUARANTINED_TOUR_IDS`);
    const directLookup = await getDurableTourByIdOrAlias(qId);
    assert.equal(directLookup, null, `Expected quarantined record ${qId} to return null`);
  }

  const allCatalog = await queryDurableTourCatalog({ limit: 500 });
  for (const rec of allCatalog.records) {
    assert.equal(
      QUARANTINED_TOUR_IDS.has(rec.tourId),
      false,
      `Quarantined record ${rec.tourId} leaked into queryDurableTourCatalog`,
    );
  }
});

test("3. Authoritative GoSno and Party at Red Rocks published offers replace hardcoded $89/$59 records with flat_rate_per_vehicle pricing, terms, and capacity limits", async () => {
  // GoSno Winter Park Private SUV ($349 flat per vehicle up to 6 guests, $698 round-trip)
  const wpSuv = await getDurableTourByIdOrAlias("dcc:tour:gosno:den-winter-park-suv");
  assert.ok(wpSuv, "Expected authoritative GoSno DEN-WINTER-PARK-SUV record");
  assert.equal(wpSuv.fromPriceCents, 34900);
  assert.equal(wpSuv.priceBasis, "flat_rate_per_vehicle");
  assert.equal(wpSuv.capabilityTier, "attributable_referral");
  assert.equal(wpSuv.constraints.maxPassengers, 6);
  assert.equal(wpSuv.cancellationCutoffHours, 48);
  assert.ok((wpSuv.productOptions || []).length >= 2, "Expected one-way and round-trip options");
  assert.equal((wpSuv.serviceDetails as any)?.seatingLimit, 6);
  assert.equal((wpSuv.serviceDetails as any)?.pricingModel, "flat_rate_per_vehicle");

  // GoSno Winter Park Private Van ($499 flat per vehicle up to 10 guests)
  const wpVan = await getDurableTourByIdOrAlias("dcc:tour:gosno:den-winter-park-van");
  assert.ok(wpVan, "Expected authoritative GoSno DEN-WINTER-PARK-VAN record");
  assert.equal(wpVan.fromPriceCents, 49900);
  assert.equal(wpVan.priceBasis, "flat_rate_per_vehicle");
  assert.equal(wpVan.constraints.maxPassengers, 10);

  // Party at Red Rocks Private Suburban ($399 flat round-trip for 1-6 guests, sharedSeatService: false)
  const parrSuburban = await getDurableTourByIdOrAlias("dcc:tour:parr:rr-parr-private-suburban-6pax");
  assert.ok(parrSuburban, "Expected authoritative PARR Suburban 6pax record");
  assert.equal(parrSuburban.fromPriceCents, 39900);
  assert.equal(parrSuburban.priceBasis, "flat_rate_per_vehicle");
  assert.equal(parrSuburban.capabilityTier, "attributable_referral");
  assert.equal(parrSuburban.constraints.maxPassengers, 6);
  assert.equal((parrSuburban.serviceDetails as any)?.sharedSeatService, false);

  // Party at Red Rocks Private Van ($599 flat round-trip for 1-10 guests, sharedSeatService: false)
  const parrVan = await getDurableTourByIdOrAlias("dcc:tour:parr:rr-parr-private-van-10pax");
  assert.ok(parrVan, "Expected authoritative PARR Van 10pax record");
  assert.equal(parrVan.fromPriceCents, 59900);
  assert.equal(parrVan.priceBasis, "flat_rate_per_vehicle");
  assert.equal(parrVan.constraints.maxPassengers, 10);
  assert.equal((parrVan.serviceDetails as any)?.sharedSeatService, false);

  // Party size capacity enforcement + NO hardcoded available=true, 3 departures, or 08:00
  const denverGroupOf8 = await matchToursForTrip({
    destination: "denver-colorado",
    date: "2026-12-15",
    adults: 8,
    childAges: [],
    approvedTourIds: [
      "dcc:tour:gosno:den-winter-park-suv",
      "dcc:tour:gosno:den-winter-park-van",
      "dcc:tour:parr:rr-parr-private-suburban-6pax",
      "dcc:tour:parr:rr-parr-private-van-10pax",
    ],
    enableShortlistLiveCheck: true,
    isTest: true,
  });

  const ineligibleIds = denverGroupOf8.ineligibleOptions.map((o) => o.tourId);
  assert.ok(ineligibleIds.includes("dcc:tour:gosno:den-winter-park-suv"));
  assert.ok(ineligibleIds.includes("dcc:tour:parr:rr-parr-private-suburban-6pax"));

  const matchedVanIds = denverGroupOf8.options.map((o) => o.tourId);
  assert.ok(matchedVanIds.includes("dcc:tour:gosno:den-winter-park-van"));
  assert.ok(matchedVanIds.includes("dcc:tour:parr:rr-parr-private-van-10pax"));

  for (const opt of denverGroupOf8.options) {
    assert.equal(opt.pricing.priceBasis, "flat_rate_per_vehicle");
    assert.equal(opt.shortlistLiveCheck?.checked, false);
    assert.equal(opt.shortlistLiveCheck?.status, "unknown_unchecked");
    assert.equal(opt.shortlistLiveCheck?.available, null);
    assert.equal(opt.shortlistLiveCheck?.bookableSlotsCount, null);
    assert.equal(opt.shortlistLiveCheck?.earliestStartTime, null);
  }
});

test("4. Option-level pickup fulfillment modes (hotel_pickup, pier_pickup, downtown_shuttle_departure, self_drive) and atomic boundOffer tuple through checkout handoff", async () => {
  const airboat6455 = await getDurableTourByIdOrAlias("dcc:tour:viator:6455NOLAAIR");
  assert.ok(airboat6455);
  assert.equal(airboat6455.hasHotelPickup, true);
  assert.equal(airboat6455.lowestPriceIncludesPickup, false);

  const airboat3780 = await getDurableTourByIdOrAlias("dcc:tour:viator:3780AIRBOAT");
  assert.ok(airboat3780);
  assert.equal(airboat3780.hasHotelPickup, true);
  assert.equal(airboat3780.lowestPriceIncludesPickup, false);

  // Case A: requiresHotelPickup = false -> selects lowest-priced self_drive option ($49.40 / $59.00) with pickupFulfillmentType="self_drive"
  const noPickupMatch = await matchToursForTrip({
    destination: "new-orleans",
    date: "2026-11-18",
    adults: 2,
    childAges: [9],
    requiresHotelPickup: false,
    approvedTourIds: ["dcc:tour:viator:6455NOLAAIR", "dcc:tour:viator:3780AIRBOAT"],
    enableShortlistLiveCheck: false,
    isTest: true,
  });

  const opt6455NoPickup = noPickupMatch.options.find(
    (o) => o.tourId === "dcc:tour:viator:6455NOLAAIR",
  );
  assert.ok(opt6455NoPickup);
  assert.equal(opt6455NoPickup.pricing.fromPriceCents, 4940);
  assert.equal(opt6455NoPickup.pricing.totalPartyPriceCents, 4940 * 3);
  assert.equal(opt6455NoPickup.selectedProductOption?.optionCode, "6455NOLAAIRSLARGE945");
  assert.equal(opt6455NoPickup.selectedProductOption?.pickupFulfillmentType, "self_drive");
  assert.equal(opt6455NoPickup.boundOffer.optionCode, "6455NOLAAIRSLARGE945");
  assert.equal(opt6455NoPickup.boundOffer.pickupFulfillmentType, "self_drive");
  assert.equal(opt6455NoPickup.boundOffer.adults, 2);
  assert.deepEqual(opt6455NoPickup.boundOffer.childAges, [9]);
  assert.equal(opt6455NoPickup.boundOffer.totalGuests, 3);
  assert.equal(opt6455NoPickup.boundOffer.unitPriceCents, 4940);
  assert.equal(opt6455NoPickup.boundOffer.totalPartyPriceCents, 14820);
  assert.ok(opt6455NoPickup.bookingPath.handoffUrl.includes("dcc_option_code=6455NOLAAIRSLARGE945"));
  assert.ok(opt6455NoPickup.bookingPath.handoffUrl.includes("dcc_pickup_mode=self_drive"));

  const opt3780NoPickup = noPickupMatch.options.find(
    (o) => o.tourId === "dcc:tour:viator:3780AIRBOAT",
  );
  assert.ok(opt3780NoPickup);
  assert.equal(opt3780NoPickup.pricing.fromPriceCents, 5900);
  assert.equal(opt3780NoPickup.selectedProductOption?.optionCode, "TG15");
  assert.equal(opt3780NoPickup.selectedProductOption?.pickupFulfillmentType, "self_drive");
  assert.equal(opt3780NoPickup.duration.durationMinutes, 90);
  assert.equal(opt3780NoPickup.boundOffer.durationMinutes, 90);

  // Case B: requiresHotelPickup = true ->
  // - 6455NOLAAIR selects hotel_pickup option 840AMLBWT ($81.70, 240m)
  // - 3780AIRBOAT selects downtown_shuttle_departure option TG1 ($90.00, 225m, Gray Line 400 Toulouse St) AND flags downtown_shuttle_departure_not_door_to_door_hotel_pickup
  const hotelCfg = getHotelConciergeConfig("hotel-monteleone-nola");
  const withPickupMatch = await matchToursForTrip({
    destination: "new-orleans",
    date: "2026-11-18",
    adults: 2,
    childAges: [],
    requiresHotelPickup: true,
    hotelName: hotelCfg.propertyName,
    hotelLat: hotelCfg.lat,
    hotelLng: hotelCfg.lng,
    approvedTourIds: ["dcc:tour:viator:6455NOLAAIR", "dcc:tour:viator:3780AIRBOAT"],
    surface: "hotel_concierge",
    propertySlug: hotelCfg.propertySlug,
    enableShortlistLiveCheck: false,
    isTest: true,
  });

  const opt6455WithPickup = withPickupMatch.options.find(
    (o) => o.tourId === "dcc:tour:viator:6455NOLAAIR",
  );
  assert.ok(opt6455WithPickup);
  assert.equal(opt6455WithPickup.selectedProductOption?.optionCode, "840AMLBWT");
  assert.equal(opt6455WithPickup.selectedProductOption?.pickupFulfillmentType, "hotel_pickup");
  assert.ok((opt6455WithPickup.pricing.fromPriceCents ?? 0) >= 8000);
  assert.equal(opt6455WithPickup.duration.durationMinutes, 240);

  const opt3780WithPickup = withPickupMatch.options.find(
    (o) => o.tourId === "dcc:tour:viator:3780AIRBOAT",
  );
  assert.ok(opt3780WithPickup);
  assert.equal(opt3780WithPickup.selectedProductOption?.optionCode, "TG1");
  assert.equal(
    opt3780WithPickup.selectedProductOption?.pickupFulfillmentType,
    "downtown_shuttle_departure",
  );
  assert.equal(opt3780WithPickup.pricing.fromPriceCents, 9000);
  assert.equal(opt3780WithPickup.duration.durationMinutes, 225);
  assert.equal(opt3780WithPickup.suitability, "needs_confirmation");
  assert.ok(
    opt3780WithPickup.missingInformation.includes(
      "downtown_shuttle_departure_not_door_to_door_hotel_pickup",
    ),
  );
});

test("5. Cruise schedule fit preserves unknown transfer times, labels planning estimates explicitly, and only claims recommended when transfer, duration, and departure times are verified", async () => {
  resetOpaqueAttributionLedgerForTests();

  // Without live date-specific departure time verification -> must return needs_confirmation (NEVER recommended)
  const unverifiedCruiseMatch = await matchToursForTrip({
    destination: "new-orleans",
    date: "2026-11-18",
    adults: 2,
    childAges: [8],
    shipArrival: "08:00",
    allAboardTime: "16:30",
    surface: "cruisepromenade",
    enableShortlistLiveCheck: false,
    isTest: true,
  });

  assert.ok(unverifiedCruiseMatch.options.length > 0);
  for (const opt of unverifiedCruiseMatch.options) {
    assert.equal(
      opt.suitability,
      "needs_confirmation",
      `Expected ${opt.tourId} without date-verified departure times to be needs_confirmation`,
    );
    assert.equal(opt.cruiseScheduleFit?.fitStatus, "needs_confirmation");
  }

  // 1. Unknown transfer time (transferBeforeMinutes: null, transferTimeSource: "planning_estimate") -> MUST return needs_confirmation, NEVER recommended!
  const planningEstimateResult = evaluateCruiseScheduleFit({
    shipArrival: "08:00",
    shipDeparture: "17:00",
    allAboardTime: "16:30",
    durationMinutes: 120,
    transferBeforeMinutes: null,
    transferAfterMinutes: null,
    transferTimeSource: "planning_estimate",
    planningEstimateTransferMinutes: 50,
    verifiedDepartureTimes: ["10:00"],
  });
  assert.equal(planningEstimateResult.fitStatus, "needs_confirmation");
  assert.equal(planningEstimateResult.transferBeforeMinutes, null);
  assert.equal(planningEstimateResult.planningEstimateTransferMinutes, 50);
  assert.ok(planningEstimateResult.reason.toLowerCase().includes("planning estimate only"));

  // 2. Verified pier pickup / meeting point transfer + verified departure time 10:00 -> recommended!
  const fitsResult = evaluateCruiseScheduleFit({
    shipArrival: "08:00",
    shipDeparture: "17:00",
    allAboardTime: "16:30",
    durationMinutes: 120,
    transferBeforeMinutes: 20,
    transferAfterMinutes: 20,
    transferTimeSource: "verified_pier_pickup",
    verifiedDepartureTimes: ["10:00", "14:30"],
  });
  assert.equal(fitsResult.fitStatus, "recommended");
  assert.deepEqual(fitsResult.fittingDepartureTimes, ["10:00"]);

  // 3. Only late departure time 14:30 (returns 14:30 + 120m + 20m = 16:50 > 15:00 deadline) -> ineligible!
  const missesResult = evaluateCruiseScheduleFit({
    shipArrival: "08:00",
    shipDeparture: "17:00",
    allAboardTime: "16:30",
    durationMinutes: 120,
    transferBeforeMinutes: 20,
    transferAfterMinutes: 20,
    transferTimeSource: "verified_pier_pickup",
    verifiedDepartureTimes: ["14:30"],
  });
  assert.equal(missesResult.fitStatus, "ineligible");
  assert.deepEqual(missesResult.fittingDepartureTimes, []);

  // Verify production funnel metrics report excludes all test clicks (isTest: true)
  const prodReport = getFunnelMetricsReport();
  assert.equal(prodReport.production.followedHandoffs, 0);
  assert.equal(prodReport.production.confirmedPaidBookings, 0);
  assert.equal(prodReport.production.grossConfirmedRevenueUsd, 0);
  assert.ok(prodReport.test.followedHandoffs > 0);
});
