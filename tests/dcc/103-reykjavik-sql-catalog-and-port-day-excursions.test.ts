import test from "node:test";
import assert from "node:assert/strict";
import { getCruisePortReference } from "../../lib/dcc/cruisePortDirectory";
import {
  EARTHOS_DESTINATION_NODES,
  queryDurableTourCatalog,
  getDurableCatalogSummaryReport,
} from "../../lib/dcc/catalog/durableCatalogStore";
import {
  MAPPED_CRUISE_PORT_EXCURSION_PROFILES,
  MAPPED_CRUISE_PORT_BATCH_SUMMARY,
  queryPortDayExcursionCatalog,
  verifyLiveExcursionAvailability,
} from "../../lib/dcc/cruisePortExcursionCatalogEngine";
import { JUNEAU_PRODUCT_SUPPLIER_RECONCILIATION } from "../../lib/dcc/machine/v03/operatorDirectCheckout";
import { HREYFILL_REYKJAVIK_SHORE_EXCURSION_QUALIFICATION } from "../../lib/dcc/corridors/internationalCorridorQualifications";

test("1. Reykjavík port record is mapped to Viator destination 905 and Kahului to 671", () => {
  const reykjavikPort = getCruisePortReference("reykjavik");
  assert.ok(reykjavikPort, "Expected reykjavik in cruise-port-directory.json");
  assert.equal(reykjavikPort.viatorDestination?.id, 905);
  assert.equal(reykjavikPort.viatorDestination?.name, "Reykjavik");
  assert.equal(EARTHOS_DESTINATION_NODES.reykjavik.viatorDestinationId, 905);

  const kahuluiPort = getCruisePortReference("kahului");
  assert.ok(kahuluiPort, "Expected kahului in cruise-port-directory.json");
  assert.equal(kahuluiPort.viatorDestination?.id, 671);
  assert.equal(EARTHOS_DESTINATION_NODES.kahului.viatorDestinationId, 671);
});

test("2. Reykjavík catalog reconciles 1,576 / 1,576 Viator products and paginates without loading the full catalog into the app", async () => {
  const summary = await getDurableCatalogSummaryReport();
  assert.equal(summary.byDestination.reykjavik.total, 1576);
  assert.equal(summary.byDestination.reykjavik.viatorImportedCount, 1576);
  assert.equal(summary.byDestination.reykjavik.providerTotalAvailableCount, 1576);
  assert.equal(summary.byDestination.reykjavik.coverageStatus, "complete");

  const page1 = await queryDurableTourCatalog({
    destinationSlug: "reykjavik",
    limit: 12,
    offset: 0,
  });
  assert.equal(page1.records.length, 12);
  assert.equal(page1.rowsLoadedIntoApp, 12);
  assert.equal(page1.fullCatalogLoadedIntoApp, false);
  assert.equal(page1.totalMatched, 1576);
  assert.equal(page1.hasMore, true);
  assert.equal(page1.nextOffset, 12);

  for (const facet of [
    "sightseeing",
    "wildlife",
    "food",
    "culture",
    "adventure",
    "family",
  ] as const) {
    const facetPage = await queryDurableTourCatalog({
      destinationSlug: "reykjavik",
      category: facet,
      limit: 12,
      offset: 0,
    });
    assert.ok(
      facetPage.totalMatched > 0,
      `Expected Reykjavík facet "${facet}" to have matched products, got ${facetPage.totalMatched}`
    );
    assert.equal(facetPage.fullCatalogLoadedIntoApp, false);
    assert.ok(facetPage.rowsLoadedIntoApp <= 12);
  }

  assert.equal(
    HREYFILL_REYKJAVIK_SHORE_EXCURSION_QUALIFICATION.status,
    "pending_operator_reply_and_bokun_link_confirmation"
  );
  assert.equal(
    HREYFILL_REYKJAVIK_SHORE_EXCURSION_QUALIFICATION.candidateTours.length,
    2
  );
});

test("3. Port-day shore-excursion engine marks 388640P9 Needs verification in Browse All, excludes it from Fits My Sailing, rejects past departures, and never generates fallback seat counts or prices", async () => {
  assert.equal(MAPPED_CRUISE_PORT_EXCURSION_PROFILES.length, 15);
  assert.equal(Object.keys(MAPPED_CRUISE_PORT_BATCH_SUMMARY).length, 4);

  const reykBrowseAll = await queryPortDayExcursionCatalog({
    portSlug: "reykjavik",
    viewMode: "browse_all",
    category: "all",
    shipArrivalTime: "08:00",
    shipAllAboardTime: "17:30",
    sailingDate: "2027-07-15",
    partySize: 2,
    limit: 12,
    offset: 0,
  });
  assert.ok(reykBrowseAll);
  assert.equal(reykBrowseAll.port.viatorDestinationId, 905);
  assert.equal(reykBrowseAll.providerCounts.viator, 1576);
  assert.equal(reykBrowseAll.pagination.fullCatalogLoadedIntoApp, false);
  assert.equal(reykBrowseAll.tours.length, 12);

  // Verify 388640P9 in Browse All shows Needs verification and fitsSailing: false
  const browse388640P9 = await queryPortDayExcursionCatalog({
    portSlug: "reykjavik",
    viewMode: "browse_all",
    search: "388640P9",
    shipArrivalTime: "08:00",
    shipAllAboardTime: "17:30",
    sailingDate: "2027-07-15",
    partySize: 2,
    limit: 5,
    offset: 0,
  });
  const tour388640P9 = browse388640P9?.tours.find((t) => t.productCode === "388640P9");
  assert.ok(tour388640P9, "Expected 388640P9 in Browse All");
  assert.equal(tour388640P9.timeFit.status, "needs_verification");
  assert.equal(tour388640P9.timeFit.statusLabel, "Needs verification");
  assert.equal(tour388640P9.timeFit.fitsSailing, false);
  assert.equal(tour388640P9.timeFit.hasVerifiedMeetingPoint, false);
  assert.equal(tour388640P9.timeFit.hasVerifiedTransfer, false);
  assert.equal(tour388640P9.seatAvailability.status, "check_availability");
  assert.equal(tour388640P9.seatAvailability.remainingSeats, null);
  assert.equal(tour388640P9.seatAvailability.fromPriceUsd, null);

  // Verify 388640P9 stays out of Fits My Sailing
  const fits388640P9 = await queryPortDayExcursionCatalog({
    portSlug: "reykjavik",
    viewMode: "fits_sailing",
    search: "388640P9",
    shipArrivalTime: "08:00",
    shipAllAboardTime: "17:30",
    sailingDate: "2027-07-15",
    partySize: 2,
    limit: 12,
    offset: 0,
  });
  assert.ok(fits388640P9);
  assert.equal(
    fits388640P9.tours.some((t) => t.productCode === "388640P9"),
    false,
    "388640P9 must stay out of Fits my sailing"
  );

  // Verify Fits My Sailing returns verified fitting tours (including 7090P9)
  const reykFitsSailing = await queryPortDayExcursionCatalog({
    portSlug: "reykjavik",
    viewMode: "fits_sailing",
    shipArrivalTime: "08:00",
    shipAllAboardTime: "17:30",
    sailingDate: "2027-07-15",
    partySize: 2,
    limit: 12,
    offset: 0,
  });
  assert.ok(reykFitsSailing);
  assert.ok(reykFitsSailing.tours.length >= 1, "Expected verified fitting tours in Fits my sailing");
  assert.equal(
    reykFitsSailing.tours.some((t) => t.productCode === "388640P9"),
    false
  );
  const whaleTour = reykFitsSailing.tours.find((t) => t.productCode === "7090P9");
  assert.ok(whaleTour, "Expected 7090P9 whale watching in Reykjavík Fits my sailing");
  assert.equal(whaleTour.timeFit.status, "fits");
  assert.equal(whaleTour.timeFit.fitsSailing, true);
  assert.equal(whaleTour.seatAvailability.status, "check_availability");
  assert.equal(whaleTour.seatAvailability.remainingSeats, null);
  assert.equal(whaleTour.seatAvailability.fromPriceUsd, null);
  assert.equal(whaleTour.handoff.bookingConfirmationStatus, "tracked_handoff_only");
  assert.ok(whaleTour.handoff.dccTrackedHref.includes("product=7090P9"));

  // Past departure rejection test
  const pastSeat = await verifyLiveExcursionAvailability({
    portSlug: "reykjavik",
    tourId: whaleTour.tourId,
    productCode: "7090P9",
    optionCode: "TG1",
    date: "2026-07-15",
    partySize: 2,
    departureTime: "09:00",
  });
  assert.equal(pastSeat.pastDepartureRejected, true);
  assert.equal(pastSeat.status, "check_availability");
  assert.equal(pastSeat.statusLabel, "Check availability");
  assert.equal(pastSeat.available, null);
  assert.equal(pastSeat.remainingSeats, null);
  assert.equal(pastSeat.fromPriceUsd, null);
  assert.equal(pastSeat.options.length, 0);

  // Provider timeout test
  const timeoutSeat = await verifyLiveExcursionAvailability({
    portSlug: "reykjavik",
    tourId: whaleTour.tourId,
    productCode: "7090P9",
    optionCode: "TG1",
    date: "2027-07-15",
    partySize: 4,
    departureTime: "09:00",
    simulateTimeout: true,
  });
  assert.equal(timeoutSeat.providerStatus, "timeout");
  assert.equal(timeoutSeat.status, "check_availability");
  assert.equal(timeoutSeat.statusLabel, "Check availability");
  assert.equal(timeoutSeat.available, null);
  assert.equal(timeoutSeat.remainingSeats, null);
  assert.equal(timeoutSeat.fromPriceUsd, null);
  assert.equal(timeoutSeat.options.length, 0);

  for (const profile of MAPPED_CRUISE_PORT_EXCURSION_PROFILES) {
    const portCatalog = await queryPortDayExcursionCatalog({
      portSlug: profile.portSlug,
      viewMode: "browse_all",
      limit: 4,
      offset: 0,
    });
    assert.ok(
      portCatalog && portCatalog.tours.length > 0,
      `Expected port-day catalog for ${profile.portSlug} (${profile.batchLabel}) to return tours`
    );
  }
});

test("4. Juneau product 466119P3 reconciles Dolphin Jet Boat Tours supplier and keeps Juneau Tours & Whale Watch direct referral credit pending confirmation", async () => {
  const rec466119P3 = JUNEAU_PRODUCT_SUPPLIER_RECONCILIATION["466119P3"];
  assert.ok(rec466119P3);
  assert.equal(rec466119P3.verifiedViatorSupplierName, "Dolphin Jet Boat Tours");
  assert.equal(
    rec466119P3.juneauToursOperatorConfirmationStatus,
    "pending_operator_confirmation"
  );
  assert.equal(
    rec466119P3.directReferralCreditStatus,
    "pending_until_match_confirmed"
  );

  const juneauCatalog = await queryPortDayExcursionCatalog({
    portSlug: "juneau",
    search: "466119P3",
    limit: 5,
    offset: 0,
  });
  assert.ok(juneauCatalog);
  const prod466119P3 = juneauCatalog.tours.find((t) => t.productCode === "466119P3");
  assert.ok(prod466119P3, "Expected 466119P3 in Juneau port-day catalog");
  assert.ok(prod466119P3.operatorName.includes("Dolphin Jet Boat Tours"));
  assert.equal(
    prod466119P3.handoff.referralCreditStatus,
    "pending_operator_match_confirmation"
  );
});
