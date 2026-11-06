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
  buildCheckoutPreselectionMetadata,
  buildFareHarborDatePreselectedUrl,
  detectOptionTitleTimeSemantics,
  evaluateCruiseScheduleFit,
  matchToursForTrip,
  validateTravelDateNotPast,
} from "../../lib/dcc/catalog/matcher";
import { getHotelConciergeConfig } from "../../lib/dcc/catalog/hotelConfigs";
import {
  getWidgetPlacementReport,
  recordObservedWidgetOrigin,
} from "../../lib/dcc/catalog/widgetPlacements";
import {
  getFunnelMetricsReport,
  issueOpaqueClickAttribution,
  reconcilePartnerWebhookByClickId,
  recordOutboundClickFollow,
  resetOpaqueAttributionLedgerForTests,
} from "../../lib/dcc/commerce/opaqueAttributionLedger";
import {
  evaluateWinterSailingPlan,
  runWinterAttributionReplayAndNolaStatusTrace,
} from "../../lib/dcc/winterExcursionPlanner";

test("1. Durable Shared Tour Catalog covers all 15 EarthOS destinations, completes all 5 Alaska destinations (100% of connected provider catalog), and labels coverage against connected provider totals", async () => {
  const summary = await getDurableCatalogSummaryReport();
  assert.ok(
    summary.totalImportedRecords >= 1450,
    `Expected >= 1450 records after Alaska completion and multi-destination backfill, got ${summary.totalImportedRecords}`,
  );
  assert.equal(summary.totalDestinationsCovered, 15);
  assert.equal(summary.wtaStatus, "paused");
  assert.ok(summary.quarantinedRecordsExcludedCount >= 6);
  assert.equal(summary.destinationCoverageBreakdown.coverageBasis, "connected_provider_catalog_total");
  assert.equal(summary.destinationCoverageBreakdown.alaskaCompleteDestinationsCount, 5);
  assert.ok(
    summary.destinationCoverageBreakdown.sampledDestinationsCount +
      summary.destinationCoverageBreakdown.completeDestinationsCount ===
      15,
  );

  // All 5 Alaska destinations (Juneau, Skagway, Ketchikan, Seward, Denali) are 100% complete against connected provider totals
  const alaskaSlugs = ["juneau", "skagway", "ketchikan", "seward", "denali"] as const;
  for (const slug of alaskaSlugs) {
    assert.equal(
      summary.byDestination[slug].coverageStatus,
      "complete",
      `Expected Alaska destination ${slug} to have coverageStatus="complete"`,
    );
    assert.equal(
      summary.byDestination[slug].connectedProviderCatalogCoverageStatus,
      "complete_provider_catalog",
      `Expected Alaska destination ${slug} to have complete_provider_catalog status`,
    );
    assert.equal(
      summary.byDestination[slug].viatorImportedCount,
      summary.byDestination[slug].providerTotalAvailableCount,
      `Expected ${slug} viatorImportedCount === providerTotalAvailableCount`,
    );
    assert.ok(
      summary.byDestination[slug].connectedProviderCatalogCoverageLabel.includes("100%"),
      `Expected ${slug} coverage label to state 100% of connected provider catalog`,
    );
  }
  assert.equal(summary.byDestination["juneau"].viatorImportedCount, 104);
  assert.equal(summary.byDestination["juneau"].importedCount, 123);
  assert.equal(summary.byDestination["skagway"].viatorImportedCount, 65);
  assert.equal(summary.byDestination["ketchikan"].viatorImportedCount, 147);
  assert.equal(summary.byDestination["seward"].viatorImportedCount, 57);
  assert.equal(summary.byDestination["denali"].viatorImportedCount, 47);

  // Larger non-Alaska destinations remain explicitly labeled sampled until 100% of provider total is reached
  assert.ok(summary.byDestination["new-orleans"].viatorImportedCount >= 150);
  assert.ok((summary.byDestination["new-orleans"].providerTotalAvailableCount ?? 0) >= 700);
  assert.equal(
    summary.byDestination["new-orleans"].connectedProviderCatalogCoverageStatus,
    "sampled_provider_catalog",
  );

  assert.ok(summary.byDestination["cozumel"].viatorImportedCount >= 150);
  assert.equal(
    summary.byDestination["cozumel"].connectedProviderCatalogCoverageStatus,
    "sampled_provider_catalog",
  );

  for (const slug of Object.keys(EARTHOS_DESTINATION_NODES)) {
    assert.ok(summary.byDestination[slug], `Missing destination coverage for ${slug}`);
    assert.ok(summary.byDestination[slug].total >= 45, `Expected >= 45 records for ${slug}`);
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

test("4. Option-level pickup fulfillment modes, cheaper option tradeoffs, option title time semantics, and Checkout Selection Summary", async () => {
  // Past date validation rejects 2026-06-15 when clock is 2026-11-05
  const pastCheck = validateTravelDateNotPast("2026-06-15", "America/Chicago");
  assert.equal(pastCheck.valid, false);
  assert.equal(pastCheck.errorCode, "INVALID_PAST_DATE");
  assert.ok(pastCheck.message?.includes("2026-06-15"));

  const futureCheck = validateTravelDateNotPast("2026-11-18", "America/Chicago");
  assert.equal(futureCheck.valid, true);

  // Option title time semantics: pickup/check-in time vs unverified title time vs verified provider timedEntries
  const pickupSemantics = detectOptionTitleTimeSemantics("8:40 AM Pickup - Large Airboat with Transportation", []);
  assert.equal(pickupSemantics.semantics, "pickup_or_checkin_unverified_as_departure");
  assert.equal(pickupSemantics.extractedTitleTime, "08:40");

  const unverifiedTitleTime = detectOptionTitleTimeSemantics("9:45 AM Large Airboat (No Pickup)", []);
  assert.equal(unverifiedTitleTime.semantics, "pickup_or_checkin_unverified_as_departure");
  assert.equal(unverifiedTitleTime.extractedTitleTime, "09:45");

  const verifiedTimedEntry = detectOptionTitleTimeSemantics("9:45 AM Large Airboat", ["09:45"]);
  assert.equal(verifiedTimedEntry.semantics, "verified_provider_departure_time");

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

  // Checkout Selection Summary for Viator explicitly discloses that Viator initializes to today's date
  assert.equal(
    opt6455NoPickup.bookingPath.checkoutPreselection.preselectionSupport,
    "affiliate_landing_manual_selection_required",
  );
  assert.ok(
    opt6455NoPickup.bookingPath.checkoutPreselection.providerDefaultDateBehavior.includes("Viator"),
  );
  assert.ok(
    opt6455NoPickup.bookingPath.checkoutPreselection.travelerActionSummary.includes("2026-11-18"),
  );
  assert.ok(opt6455NoPickup.bookingPath.trackedClickUrl?.includes("/api/v1/ads/click"));

  // Case B: requiresHotelPickup = true -> selects higher-priced pickup option AND preserves cheaper self_drive option in alternativeOptionTradeoffs
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
  assert.ok(
    opt6455WithPickup.alternativeOptionTradeoffs.length > 0,
    "Expected cheaper self_drive alternative option tradeoff to be preserved",
  );
  assert.equal(
    opt6455WithPickup.alternativeOptionTradeoffs[0].optionCode,
    "6455NOLAAIRSLARGE945",
  );
  assert.ok(
    opt6455WithPickup.alternativeOptionTradeoffs[0].tradeoffSummary.includes("Saves $"),
  );

  // FareHarbor calendar date preselection URL builder
  const fhUrl = buildFareHarborDatePreselectedUrl(
    "https://fareharbor.com/embeds/book/alaskatales/items/61209/?asn=fhdn&asn-ref=destinationcommandcenter",
    "2026-11-18",
  );
  assert.ok(fhUrl.includes("/calendar/2026/11/"));
  assert.ok(fhUrl.includes("date=2026-11-18"));
  const fhMeta = buildCheckoutPreselectionMetadata({
    provider: "fareharbor",
    boundOffer: {
      ...opt6455NoPickup.boundOffer,
      provider: "fareharbor",
      date: "2026-11-18",
      departureTime: "09:30",
    },
  });
  assert.equal(fhMeta.preselectionSupport, "partial_provider_preselection");
  assert.ok(fhMeta.preselectedFields.includes("calendarMonth"));
});

test("5. Cruise schedule fit requires transferEvidenceSource + applicableBerthOrMeetingPoint, and widget placements + commercial reporting are strictly separated", async () => {
  resetOpaqueAttributionLedgerForTests();

  // Without live date-specific departure time verification -> must return needs_confirmation (NEVER recommended)
  const unverifiedCruiseMatch = await matchToursForTrip({
    destination: "juneau",
    date: "2026-11-18",
    adults: 2,
    childAges: [],
    shipArrival: "08:00",
    allAboardTime: "16:30",
    surface: "cruisepromenade",
    enableShortlistLiveCheck: false,
    isTest: true,
  });

  assert.ok(unverifiedCruiseMatch.options.length > 0);
  assert.ok(unverifiedCruiseMatch.metrics.supportedVerifiedTransferCount > 0);
  for (const opt of unverifiedCruiseMatch.options) {
    assert.equal(
      opt.suitability,
      "needs_confirmation",
      `Expected ${opt.tourId} without date-verified departure times to be needs_confirmation`,
    );
    assert.equal(opt.cruiseScheduleFit?.fitStatus, "needs_confirmation");
  }

  // Verified transfer requires explicit transferEvidenceSource (never generic regex or fallback minutes)
  const missingEvidenceResult = evaluateCruiseScheduleFit({
    shipArrival: "08:00",
    shipDeparture: "17:00",
    allAboardTime: "16:30",
    durationMinutes: 120,
    transferBeforeMinutes: 20,
    transferAfterMinutes: 20,
    transferTimeSource: "verified_pier_pickup",
    transferEvidenceSource: null,
    applicableBerthOrMeetingPoint: null,
    verifiedDepartureTimes: ["10:00"],
  });
  assert.equal(missingEvidenceResult.fitStatus, "needs_confirmation");

  const supportedEvidenceResult = evaluateCruiseScheduleFit({
    shipArrival: "08:00",
    shipDeparture: "17:00",
    allAboardTime: "16:30",
    durationMinutes: 120,
    transferBeforeMinutes: 15,
    transferAfterMinutes: 15,
    transferTimeSource: "verified_pier_pickup",
    transferEvidenceSource: "Operator dock-pickup specification (AJ Dock / Cruise Ship Terminal shuttle)",
    applicableBerthOrMeetingPoint: "Juneau Cruise Ship Terminal / AJ Dock",
    verifiedDepartureTimes: ["10:00", "14:30"],
  });
  assert.equal(supportedEvidenceResult.fitStatus, "recommended");
  assert.deepEqual(supportedEvidenceResult.fittingDepartureTimes, ["10:00"]);

  // Widget placement separation: Referer / parentOrigin alone NEVER establishes an approved external partner placement
  recordObservedWidgetOrigin({
    referer: "https://unverified-travel-blog.example.com/alaska-guide",
    propertySlug: "juneau",
    surface: "external_embed",
  });
  const placementReport = getWidgetPlacementReport();
  assert.ok(placementReport.firstPartyInstallationsCount >= 10);
  assert.equal(placementReport.observedExternalEmbedsCount, 1);
  assert.equal(
    placementReport.approvedExternalPartnerPlacementsCount,
    0,
    "Referer or parentOrigin alone must NEVER increment approvedExternalPartnerPlacementsCount",
  );
  assert.equal(
    placementReport.observedExternalEmbeds[0].verificationStatus,
    "unverified_observed_origin_only",
  );

  // Commercial reporting separation:
  // 1) Recommendation record issued during matching vs actual outbound click follow
  // 2) Demo / automated verification traffic flagged as test traffic
  const demoClick = issueOpaqueClickAttribution({
    decisionReceiptId: "rcpt:demo:1",
    recommendedOperatorId: "viator:6455NOLAAIR",
    recommendedOperatorName: "Airboat Adventures",
    evidenceVersion: "dcc-shared-tour-catalog-v1",
    originatingSite: "destinationcommandcenter.com",
    originatingPage: "/demo/concierge-widget",
    provider: "viator",
    productCode: "6455NOLAAIR",
    productDestinationUrl: "https://www.viator.com/tours/New-Orleans/x/d675-6455NOLAAIR",
    recordStage: "recommendation",
  });
  assert.equal(demoClick.isTest, true);
  assert.equal(demoClick.trafficClass, "test");

  // Production customer journey: recommendation -> actual outbound click -> BOOKING_CONFIRMED (unsettled estimate) -> COMMISSION_RECONCILED (settled once) -> refund reversal
  const prodRec = issueOpaqueClickAttribution({
    decisionReceiptId: "rcpt:prod:juneau:1",
    recommendedOperatorId: "viator:331813P1",
    recommendedOperatorName: "Alaska Whale Watching",
    evidenceVersion: "dcc-shared-tour-catalog-v1",
    originatingSite: "cruisepromenade.com",
    originatingPage: "/ports/juneau-alaska",
    provider: "viator",
    productCode: "331813P1",
    productDestinationUrl: "https://www.viator.com/tours/Juneau/x/d941-331813P1",
    recordStage: "recommendation",
    isTest: false,
  });
  assert.equal(prodRec.isTest, false);
  assert.equal(prodRec.recordStage, "recommendation");

  let metrics = getFunnelMetricsReport();
  assert.equal(metrics.production.recommendationsIssued, 1);
  assert.equal(metrics.production.recommendationOnlyRecords, 1);
  assert.equal(metrics.production.actualOutboundClicks, 0);

  // Follow outbound click
  recordOutboundClickFollow(prodRec.clickId);
  metrics = getFunnelMetricsReport();
  assert.equal(metrics.production.actualOutboundClicks, 1);
  assert.equal(metrics.production.recommendationOnlyRecords, 0);

  // BOOKING_CONFIRMED with estimatedCommissionUsd = 24.00 must NOT count toward settledReconciledCommissionUsd!
  reconcilePartnerWebhookByClickId({
    clickId: prodRec.clickId,
    provider: "viator",
    providerBookingRef: "BR-99001122",
    eventType: "BOOKING_CONFIRMED",
    grossRevenueUsd: 300,
    estimatedCommissionUsd: 24,
    paidCommissionUsd: null,
    currency: "USD",
  });
  metrics = getFunnelMetricsReport();
  assert.equal(metrics.production.confirmedPaidBookings, 1);
  assert.equal(metrics.production.estimatedUnsettledCommissionUsd, 24);
  assert.equal(
    metrics.production.settledReconciledCommissionUsd,
    0,
    "BOOKING_CONFIRMED estimated commission must NEVER be included in settledReconciledCommissionUsd",
  );

  // COMMISSION_RECONCILED with paidCommissionUsd = 24.00 recorded twice (idempotency check) -> counted ONCE
  reconcilePartnerWebhookByClickId({
    clickId: prodRec.clickId,
    provider: "viator",
    providerBookingRef: "BR-99001122",
    eventType: "COMMISSION_RECONCILED",
    grossRevenueUsd: 300,
    estimatedCommissionUsd: 24,
    paidCommissionUsd: 24,
    currency: "USD",
  });
  reconcilePartnerWebhookByClickId({
    clickId: prodRec.clickId,
    provider: "viator",
    providerBookingRef: "BR-99001122",
    eventType: "COMMISSION_RECONCILED",
    grossRevenueUsd: 300,
    estimatedCommissionUsd: 24,
    paidCommissionUsd: 24,
    currency: "USD",
  });
  metrics = getFunnelMetricsReport();
  assert.equal(metrics.production.settledReconciledCommissionUsd, 24);
  assert.equal(metrics.production.estimatedUnsettledCommissionUsd, 0);
  assert.equal(metrics.production.duplicateDeliveriesIgnored, 1);

  // BOOKING_REFUNDED reverses the settled commission and confirmed booking count
  reconcilePartnerWebhookByClickId({
    clickId: prodRec.clickId,
    provider: "viator",
    providerBookingRef: "BR-99001122",
    eventType: "BOOKING_REFUNDED",
    grossRevenueUsd: 300,
    estimatedCommissionUsd: 0,
    paidCommissionUsd: 0,
    currency: "USD",
  });
  metrics = getFunnelMetricsReport();
  assert.equal(metrics.production.confirmedPaidBookings, 0);
  assert.equal(metrics.production.cancelledOrRefundedBookings, 1);
  assert.equal(metrics.production.settledReconciledCommissionUsd, 0);
  assert.equal(metrics.production.reversedCommissionUsd, 24);
});

test("6. Five-Port Winter Excursion Planner (INDY-2027-01-24), Tender/Transfer Math, Needs Confirmation when All-Aboard Missing, and 4-Stage Attribution Replay", async () => {
  resetOpaqueAttributionLedgerForTests();

  const planRes = await evaluateWinterSailingPlan({
    planCode: "INDY-2027-01-24",
    adults: 2,
    surface: "cruisepromenade",
    enableShortlistLiveCheck: true,
    isTest: true,
  });

  assert.equal(planRes.ok, true);
  assert.equal(planRes.plan.planCode, "INDY-2027-01-24");
  assert.equal(planRes.plan.sailingId, "ID07MIA-1982128855");
  assert.equal(planRes.shipName, "Independence of the Seas");
  assert.equal(planRes.sailDate, "2027-01-24");
  assert.deepEqual(planRes.savedPortsSummary.savedPortSlugs, ["nassau", "st-thomas"]);
  assert.equal(planRes.savedPortsSummary.savedToursCount, 2);

  const nassauSaved = planRes.savedPortsSummary.savedSelections.find(
    (s) => s.portSlug === "nassau",
  );
  assert.ok(nassauSaved);
  assert.equal(nassauSaved.providerProductCode, "254526P1");
  assert.equal(nassauSaved.optionCode, "TG4");
  assert.equal(nassauSaved.verifiedDepartureTime, "10:00");
  assert.equal(nassauSaved.totalPartyPriceCents, 33800);
  assert.equal(nassauSaved.totalPartyPriceFormatted, "$338.00");
  assert.equal(nassauSaved.debarkOrTenderClearanceMinutes, 30);
  assert.equal(nassauSaved.transferBeforeMinutes, 15);
  assert.equal(nassauSaved.suitability, "recommended");
  assert.equal(nassauSaved.checkoutProvider, "viator");
  assert.ok(nassauSaved.trackedViatorCheckoutUrl.includes("/api/v1/ads/click?clickId="));

  const stThomasSaved = planRes.savedPortsSummary.savedSelections.find(
    (s) => s.portSlug === "st-thomas",
  );
  assert.ok(stThomasSaved);
  assert.equal(stThomasSaved.providerProductCode, "7452P2");
  assert.equal(stThomasSaved.optionCode, "DEFAULT");
  assert.equal(stThomasSaved.verifiedDepartureTime, "13:00");
  assert.equal(stThomasSaved.totalPartyPriceCents, 23800);
  assert.equal(stThomasSaved.totalPartyPriceFormatted, "$238.00");
  assert.equal(stThomasSaved.debarkOrTenderClearanceMinutes, 30);
  assert.equal(stThomasSaved.transferBeforeMinutes, 20);
  assert.equal(stThomasSaved.suitability, "recommended");
  assert.equal(stThomasSaved.checkoutProvider, "viator");

  assert.equal(planRes.savedPortsSummary.combinedPartyTotalCents, 57600);
  assert.equal(planRes.savedPortsSummary.combinedPartyTotalFormatted, "$576.00");

  // Verify Grand Cayman tender port enforces 45m tender clearance
  const grandCaymanSlot = planRes.fivePortsBySlug["grand-cayman"];
  assert.equal(grandCaymanSlot.portSpec.isTenderPort, true);
  assert.equal(grandCaymanSlot.portSpec.defaultClearanceMinutes, 45);
  assert.equal(grandCaymanSlot.selectedOption?.providerProductCode, "10309P3");
  assert.equal(
    grandCaymanSlot.selectedOption?.cruiseScheduleFit?.debarkClearanceMinutes,
    45,
  );
  assert.equal(grandCaymanSlot.selectedOption?.suitability, "recommended");

  // Verify missing allAboardTime forces "needs_confirmation" ("Needs confirmation")
  const missingAllAboardPlan = await evaluateWinterSailingPlan({
    planCode: "INDY-2027-01-24",
    adults: 2,
    surface: "cruisepromenade",
    enableShortlistLiveCheck: false,
    missingAllAboardPorts: ["nassau", "grand-cayman"],
    isTest: true,
  });

  const nassauMissingSlot = missingAllAboardPlan.fivePortsBySlug.nassau;
  assert.equal(nassauMissingSlot.allAboardStatus, "missing_needs_confirmation");
  assert.equal(nassauMissingSlot.selectedOption?.suitability, "needs_confirmation");
  assert.ok(
    nassauMissingSlot.selectedOption?.missingInformation.includes(
      "ship_all_aboard_time_missing",
    ),
  );

  // Verify 4-stage attribution replay trace and New Orleans pending approvals
  resetOpaqueAttributionLedgerForTests();
  const replayTrace = runWinterAttributionReplayAndNolaStatusTrace();
  assert.equal(replayTrace.ok, true);
  assert.equal(replayTrace.placementId, "fp-cp-winter-excursion-planner");
  assert.equal(replayTrace.firstDelivery.matched, true);
  assert.equal(replayTrace.firstDelivery.duplicateDelivery, false);
  assert.equal(replayTrace.secondDeliveryReplay.matched, true);
  assert.equal(replayTrace.secondDeliveryReplay.duplicateDelivery, true);
  assert.equal(replayTrace.secondDeliveryReplay.replayIgnored, true);
  assert.equal(replayTrace.commissionSettlementDelivery.paidCommissionUsd, 27.04);

  // Production stays 0 while test bucket tracks planOpens, outboundClicks, confirmedPaidBookings, and paidCommissionsCount separately
  assert.equal(replayTrace.funnelSnapshotAfterReplay.production.planOpens, 0);
  assert.equal(replayTrace.funnelSnapshotAfterReplay.production.actualOutboundClicks, 0);
  assert.equal(replayTrace.funnelSnapshotAfterReplay.production.confirmedPaidBookings, 0);
  assert.equal(replayTrace.funnelSnapshotAfterReplay.production.paidCommissionsCount, 0);

  assert.equal(replayTrace.funnelSnapshotAfterReplay.test.planOpens, 1);
  assert.equal(replayTrace.funnelSnapshotAfterReplay.test.actualOutboundClicks, 1);
  assert.equal(replayTrace.funnelSnapshotAfterReplay.test.confirmedPaidBookings, 1);
  assert.equal(replayTrace.funnelSnapshotAfterReplay.test.paidCommissionsCount, 1);
  assert.equal(
    replayTrace.funnelSnapshotAfterReplay.test.settledReconciledCommissionUsd,
    27.04,
  );
  assert.equal(replayTrace.funnelSnapshotAfterReplay.test.duplicateDeliveriesIgnored, 1);

  assert.equal(
    replayTrace.newOrleansParallelStatus.monteleoneApprovalStatus,
    "unverified_demo_preset_pending_hotel_approval",
  );
  assert.equal(replayTrace.newOrleansParallelStatus.monteleoneIsDemoPreset, true);
  assert.equal(
    replayTrace.newOrleansParallelStatus.specificApprovalsStillNeeded.length,
    3,
  );
});


