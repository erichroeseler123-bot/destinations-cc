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

test("2. Reykjavík (1,576) and Kahului (653) and Batch 2 Alaska ports reconcile 100% of authorized inventory and paginate in SQL without loading the full catalog", async () => {
  const summary = await getDurableCatalogSummaryReport();
  assert.equal(summary.byDestination.reykjavik.total, 1576);
  assert.equal(summary.byDestination.reykjavik.viatorImportedCount, 1576);
  assert.equal(summary.byDestination.reykjavik.providerTotalAvailableCount, 1576);
  assert.equal(summary.byDestination.reykjavik.coverageStatus, "complete");

  assert.equal(summary.byDestination.kahului.total, 653);
  assert.equal(summary.byDestination.kahului.viatorImportedCount, 652);
  assert.equal(summary.byDestination.kahului.providerTotalAvailableCount, 652);
  assert.equal(summary.byDestination.kahului.coverageStatus, "complete");

  assert.equal(summary.byDestination.juneau.coverageStatus, "complete");
  assert.equal(summary.byDestination.skagway.coverageStatus, "complete");
  assert.equal(summary.byDestination.ketchikan.coverageStatus, "complete");
  assert.equal(summary.byDestination.seward.coverageStatus, "complete");

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

test("3. Regression case 388640P9 (Glacier Adventure at Sólheimajökull) shows Needs verification with Sólheimajökull Glacier Parking Lot, never Fits my sailing or Reykjavík cruise terminal", async () => {
  const glacierLookup = await queryPortDayExcursionCatalog({
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
  assert.ok(glacierLookup);
  const glacierTour = glacierLookup.tours.find((t) => t.productCode === "388640P9");
  assert.ok(glacierTour, "Expected 388640P9 in Reykjavík Browse All catalog");
  assert.equal(glacierTour.timeFit.status, "needs_verification");
  assert.equal(glacierTour.timeFit.statusLabel, "Needs verification");
  assert.equal(glacierTour.timeFit.fitsSailing, false);
  assert.ok(
    glacierTour.timeFit.meetingPointName?.includes("Sólheimajökull Glacier Parking Lot"),
    `Expected Sólheimajökull Glacier Parking Lot meeting point, got: ${glacierTour.timeFit.meetingPointName}`
  );
  assert.ok(
    !glacierTour.timeFit.meetingPointName?.startsWith("Skarfabakki Cruise Terminal"),
    "Must not substitute Reykjavík cruise terminal as verified meeting point for 388640P9"
  );
  assert.ok(glacierTour.timeFit.missingFields.includes("checkIn"));
  assert.ok(glacierTour.timeFit.missingFields.includes("transfers"));
  assert.ok(glacierTour.timeFit.missingFields.includes("returnBuffer"));

  const glacierInFitsView = await queryPortDayExcursionCatalog({
    portSlug: "reykjavik",
    viewMode: "fits_sailing",
    search: "388640P9",
    shipArrivalTime: "08:00",
    shipAllAboardTime: "17:30",
    sailingDate: "2027-07-15",
    partySize: 2,
    limit: 10,
    offset: 0,
  });
  assert.ok(glacierInFitsView);
  assert.equal(
    glacierInFitsView.tours.some((t) => t.productCode === "388640P9"),
    false,
    "388640P9 must never appear under Fits my sailing"
  );
});

test("4. Source-backed tour 7090P9 qualifies for Fits my sailing, and availability check removes simulated seats/prices while returning Check availability with exact product link on timeout or missing data", async () => {
  assert.equal(MAPPED_CRUISE_PORT_EXCURSION_PROFILES.length, 15);
  assert.equal(Object.keys(MAPPED_CRUISE_PORT_BATCH_SUMMARY).length, 4);

  const reykWhaleLookup = await queryPortDayExcursionCatalog({
    portSlug: "reykjavik",
    viewMode: "fits_sailing",
    category: "wildlife",
    search: "7090P9",
    shipArrivalTime: "08:00",
    shipAllAboardTime: "17:30",
    sailingDate: "2027-07-15",
    partySize: 2,
    limit: 5,
    offset: 0,
  });
  const whaleTour = reykWhaleLookup?.tours.find((t) => t.productCode === "7090P9");
  assert.ok(whaleTour, "Expected 7090P9 whale watching in Reykjavík Fits my sailing view");
  assert.equal(whaleTour.timeFit.status, "fits");
  assert.equal(whaleTour.timeFit.statusLabel, "Fits my sailing");
  assert.equal(whaleTour.timeFit.fitsSailing, true);
  assert.equal(whaleTour.timeFit.hasVerifiedDeparture, true);
  assert.equal(whaleTour.timeFit.hasVerifiedCheckIn, true);
  assert.equal(whaleTour.timeFit.hasVerifiedMeetingPoint, true);
  assert.equal(whaleTour.timeFit.hasVerifiedTransfer, true);
  assert.equal(whaleTour.timeFit.hasVerifiedReturnBuffer, true);
  assert.equal(whaleTour.seatAvailability.status, "check_availability");
  assert.equal(whaleTour.seatAvailability.statusLabel, "Check availability");
  assert.equal(whaleTour.seatAvailability.remainingSeats, null);
  assert.equal(whaleTour.handoff.bookingConfirmationStatus, "tracked_handoff_only");
  assert.ok(whaleTour.handoff.dccTrackedHref.includes("product=7090P9"));

  // Timeout case: must return Check availability with exact product link and null seats/prices
  const timeoutSeat = await verifyLiveExcursionAvailability({
    portSlug: "reykjavik",
    tourId: whaleTour.tourId,
    productCode: "7090P9",
    optionCode: "TG1",
    date: "2027-07-15",
    partySize: 2,
    departureTime: "09:00",
    simulateTimeout: true,
  });
  assert.equal(timeoutSeat.status, "check_availability");
  assert.equal(timeoutSeat.statusLabel, "Check availability");
  assert.equal(timeoutSeat.available, null);
  assert.equal(timeoutSeat.remainingSeats, null);
  assert.equal(timeoutSeat.fromPriceUsd, null);
  assert.equal(timeoutSeat.providerStatus, "timeout");
  assert.ok(timeoutSeat.exactProductUrl.includes("d905-7090P9"));
  assert.ok(timeoutSeat.dccTrackedHref.includes("product=7090P9"));

  // Missing departure/option case: must return Check availability with exact product link
  const missingDataSeat = await verifyLiveExcursionAvailability({
    portSlug: "reykjavik",
    tourId: "viator:388640P9",
    productCode: "388640P9",
    optionCode: null,
    date: "",
    partySize: 2,
    departureTime: null,
  });
  assert.equal(missingDataSeat.status, "check_availability");
  assert.equal(missingDataSeat.statusLabel, "Check availability");
  assert.equal(missingDataSeat.available, null);
  assert.equal(missingDataSeat.remainingSeats, null);
  assert.equal(missingDataSeat.fromPriceUsd, null);
  assert.ok(missingDataSeat.exactProductUrl.includes("d905-388640P9"));

  // Live Viator API check for 7090P9 TG1 09:00 on 2027-07-15 for 2 guests (if VIATOR_API_KEY configured)
  const liveSeat = await verifyLiveExcursionAvailability({
    portSlug: "reykjavik",
    tourId: whaleTour.tourId,
    productCode: "7090P9",
    optionCode: "TG1",
    date: "2027-07-15",
    partySize: 2,
    departureTime: "09:00",
  });
  if (process.env.VIATOR_API_KEY) {
    assert.equal(liveSeat.status, "live_verified");
    assert.equal(liveSeat.statusLabel, "Live verified");
    assert.equal(liveSeat.available, true);
    assert.equal(liveSeat.remainingSeats, null, "Must not fabricate simulated seat counts");
    assert.ok(typeof liveSeat.fromPriceUsd === "number" && liveSeat.fromPriceUsd > 0);
  } else {
    assert.equal(liveSeat.status, "check_availability");
    assert.equal(liveSeat.remainingSeats, null);
  }

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

test("5. Juneau product 466119P3 reconciles Dolphin Jet Boat Tours supplier and keeps Juneau Tours & Whale Watch direct referral credit pending confirmation", async () => {
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
