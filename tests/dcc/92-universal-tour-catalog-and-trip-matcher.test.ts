import test from "node:test";
import assert from "node:assert/strict";
import {
  EARTHOS_DESTINATION_NODES,
  getDurableCatalogSummaryReport,
  getDurableTourByIdOrAlias,
  queryDurableTourCatalog,
} from "../../lib/dcc/catalog/durableCatalogStore";
import { matchToursForTrip } from "../../lib/dcc/catalog/matcher";
import { getHotelConciergeConfig } from "../../lib/dcc/catalog/hotelConfigs";
import {
  getFunnelMetricsReport,
  resetOpaqueAttributionLedgerForTests,
} from "../../lib/dcc/commerce/opaqueAttributionLedger";

test("1. Durable Shared Tour Catalog covers all 15 EarthOS destinations and preserves compatibility aliases", async () => {
  const summary = await getDurableCatalogSummaryReport();
  assert.ok(summary.totalImportedRecords >= 150, `Expected >= 150 records, got ${summary.totalImportedRecords}`);
  assert.equal(summary.totalDestinationsCovered, 15);
  assert.equal(summary.wtaStatus, "paused");

  for (const slug of Object.keys(EARTHOS_DESTINATION_NODES)) {
    assert.ok(summary.byDestination[slug], `Missing destination coverage for ${slug}`);
    assert.ok(summary.byDestination[slug].total >= 10, `Expected >= 10 records for ${slug}`);
    assert.equal(
      summary.byDestination[slug].earthosNodeId,
      EARTHOS_DESTINATION_NODES[slug].earthosDestinationNodeId,
    );
  }

  // Compatibility aliases from lib/viator/mappings.ts resolve to durable catalog records
  const byInternalAlias = await getDurableTourByIdOrAlias("honey-island-swamp-pickup");
  assert.ok(byInternalAlias, "Expected honey-island-swamp-pickup alias to resolve");
  assert.equal(byInternalAlias.destinationSlug, "new-orleans");

  const byViatorCode = await getDurableTourByIdOrAlias("331813P1");
  assert.ok(byViatorCode, "Expected Juneau whale watch 331813P1 code to resolve");
  assert.equal(byViatorCode.destinationSlug, "juneau");
  assert.equal(byViatorCode.capabilityTier, "live_check_referral");
});

test("2. New Orleans acceptance case: distinct channel offers, non-commission discovery listings, and explicit unknowns", async () => {
  const nolaCatalog = await queryDurableTourCatalog({ destinationSlug: "new-orleans" });
  assert.ok(nolaCatalog.records.length >= 15);

  // Underlying tour with distinct channel-specific offers (WTS, WNO, Operator Direct)
  const honeyIsland = await getDurableTourByIdOrAlias("dcc:tour:nola:cajun-encounters-honey-island-swamp");
  assert.ok(honeyIsland);
  assert.ok(honeyIsland.channelOffers.length >= 3);
  const wtsOffer = honeyIsland.channelOffers.find((o) => o.channelId === "welcometotheswamp");
  const directOffer = honeyIsland.channelOffers.find((o) => o.channelId === "operator_direct");
  assert.ok(wtsOffer);
  assert.ok(directOffer);
  assert.equal(wtsOffer.fromPriceCents, 6300);
  assert.equal(directOffer.fromPriceCents, 3600);
  assert.equal(wtsOffer.freeCancellation, true);
  assert.equal(directOffer.freeCancellation, false);

  // Non-commission discovery listing included
  const presHall = await getDurableTourByIdOrAlias("dcc:tour:nola:preservation-hall-jazz-session");
  assert.ok(presHall);
  assert.equal(presHall.capabilityTier, "discovery_only");
  assert.equal(presHall.commissionAuthorized, false);
  assert.equal(presHall.locationPrecision, "exact");
  assert.equal(presHall.meetingPointLat, 29.9585);

  // Explicit unknowns preserved as null (never defaulted to 180m or freeCancellation: true)
  const customCharter = await getDurableTourByIdOrAlias(
    "dcc:tour:nola:lafitte-custom-bayou-charter-unknowns",
  );
  assert.ok(customCharter);
  assert.equal(customCharter.durationMinutes, null);
  assert.equal(customCharter.freeCancellation, null);
  assert.equal(customCharter.hasHotelPickup, null);
  assert.equal(customCharter.meetingPointLat, null);
  assert.equal(customCharter.locationPrecision, "unknown");
});

test("3. Shared Trip-Matching Service produces consistent facts across Hotel Concierge, DCC, WNO, WTS, and Cruise Promenade", async () => {
  resetOpaqueAttributionLedgerForTests();
  const hotelCfg = getHotelConciergeConfig("hotel-monteleone-nola");

  const hotelMatch = await matchToursForTrip({
    destination: "new-orleans",
    date: "2026-11-18",
    adults: 2,
    childAges: [5, 10],
    requiresHotelPickup: true,
    hotelName: hotelCfg.propertyName,
    hotelLat: hotelCfg.lat,
    hotelLng: hotelCfg.lng,
    approvedTourIds: hotelCfg.approvedTourIds,
    surface: "hotel_concierge",
    propertySlug: hotelCfg.propertySlug,
    enableShortlistLiveCheck: false,
    isTest: true,
  });

  const dccMatch = await matchToursForTrip({
    destination: "new-orleans",
    date: "2026-11-18",
    adults: 2,
    childAges: [5, 10],
    requiresHotelPickup: true,
    hotelName: hotelCfg.propertyName,
    hotelLat: hotelCfg.lat,
    hotelLng: hotelCfg.lng,
    approvedTourIds: hotelCfg.approvedTourIds,
    surface: "dcc",
    propertySlug: hotelCfg.propertySlug,
    enableShortlistLiveCheck: false,
    isTest: true,
  });

  assert.equal(hotelMatch.destination.earthosDestinationNodeId, "earthos:node:us-la-new-orleans");
  assert.equal(hotelMatch.destination.timeZone, "America/Chicago");
  assert.equal(hotelMatch.options.length, dccMatch.options.length);

  // Same underlying tour produces identical duration, pickup distance, and party composition facts
  const hotelSwamp = hotelMatch.options.find(
    (o) => o.tourId === "dcc:tour:nola:cajun-encounters-honey-island-swamp",
  );
  const dccSwamp = dccMatch.options.find(
    (o) => o.tourId === "dcc:tour:nola:cajun-encounters-honey-island-swamp",
  );
  assert.ok(hotelSwamp);
  assert.ok(dccSwamp);
  assert.equal(hotelSwamp.duration.durationMinutes, dccSwamp.duration.durationMinutes);
  assert.equal(
    hotelSwamp.pickupAndLocation.distanceFromGuestKm,
    dccSwamp.pickupAndLocation.distanceFromGuestKm,
  );
  assert.deepEqual(hotelSwamp.partyCompositionApplied, dccSwamp.partyCompositionApplied);
  assert.ok(hotelSwamp.bookingPath.clickId?.startsWith("clk_"));

  // Child age 5 is below minAgeYears (6) on the Lafitte custom skiff charter -> marked ineligible!
  const ineligibleSkiff = hotelMatch.ineligibleOptions.find(
    (o) => o.tourId === "dcc:tour:nola:lafitte-custom-bayou-charter-unknowns",
  );
  assert.ok(ineligibleSkiff, "Expected custom skiff charter (minAge 6) to be ineligible for child age 5");
  assert.equal(ineligibleSkiff.suitability, "ineligible");
});

test("4. Cruise port window and explicit unknown duration handling + QA ledger exclusion", async () => {
  // Tight 2.5-hour cruise window (08:00 arrival, 10:30 all-aboard = 150m window)
  const tightPortMatch = await matchToursForTrip({
    destination: "new-orleans",
    date: "2026-11-18",
    adults: 2,
    childAges: [8],
    shipArrival: "08:00",
    allAboardTime: "10:30",
    surface: "cruisepromenade",
    enableShortlistLiveCheck: false,
    isTest: true,
  });

  // Custom charter has durationMinutes: null -> flagged as needs_confirmation with missing: unknown_duration_minutes
  const unknownDurOption = tightPortMatch.options.find(
    (o) => o.tourId === "dcc:tour:nola:lafitte-custom-bayou-charter-unknowns",
  );
  assert.ok(unknownDurOption);
  assert.equal(unknownDurOption.suitability, "needs_confirmation");
  assert.ok(unknownDurOption.missingInformation.includes("unknown_duration_minutes"));

  // Cajun Encounters is 135m + 120m buffer = 255m > 150m window -> marked ineligible!
  const tooLongSwamp = tightPortMatch.ineligibleOptions.find(
    (o) => o.tourId === "dcc:tour:nola:cajun-encounters-honey-island-swamp",
  );
  assert.ok(tooLongSwamp);
  assert.equal(tooLongSwamp.suitability, "ineligible");

  // Verify production funnel metrics report excludes all test clicks (isTest: true)
  const prodReport = getFunnelMetricsReport();
  assert.equal(prodReport.production.confirmedPaidBookings, 0);
  assert.equal(prodReport.production.grossConfirmedRevenueUsd, 0);
  assert.ok(prodReport.test.followedHandoffs > 0);
});
