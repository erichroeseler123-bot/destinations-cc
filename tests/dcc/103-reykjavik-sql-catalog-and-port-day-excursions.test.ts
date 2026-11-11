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

test("3. Regression case 388640P9 (Glacier Adventure at Sólheimajökull) shows Needs verification in Browse All and stays out of Fits my sailing", async () => {
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
  assert.equal(glacierTour.timeFit.hasVerifiedMeetingPoint, false);
  assert.equal(glacierTour.timeFit.hasVerifiedTransfer, false);
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

test("4. Source-backed tour 7090P9 qualifies for Fits my sailing, rejects past departures, and returns Check availability on timeout or missing data without generated seat counts/prices", async () => {
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

  // Timeout case: must return Check availability with exact product link and null seats/prices
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
  assert.equal(timeoutSeat.status, "check_availability");
  assert.equal(timeoutSeat.statusLabel, "Check availability");
  assert.equal(timeoutSeat.available, null);
  assert.equal(timeoutSeat.remainingSeats, null);
  assert.equal(timeoutSeat.fromPriceUsd, null);
  assert.equal(timeoutSeat.providerStatus, "timeout");
  assert.ok(timeoutSeat.exactProductUrl?.includes("d905-7090P9"));
  assert.ok(timeoutSeat.dccTrackedHref?.includes("product=7090P9"));

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

test("103.6: Batch 3 ports (New Orleans, Miami, Tampa, Seattle) reconcile providerCounts with active SQL inventory and verify one Fits my sailing tour per port while keeping Browse all tours available", async () => {
  const expectedExamples: Array<{
    portSlug: string;
    productCode: string;
    optionCode: string;
    expectedDeparture: string;
  }> = [
    {
      portSlug: "new-orleans",
      productCode: "15200P6",
      optionCode: "TG10",
      expectedDeparture: "08:00",
    },
    {
      portSlug: "miami",
      productCode: "28744P2",
      optionCode: "TG1",
      expectedDeparture: "10:30",
    },
    {
      portSlug: "tampa",
      productCode: "199944P5",
      optionCode: "TG16",
      expectedDeparture: "10:00",
    },
    {
      portSlug: "seattle",
      productCode: "2960HARBOR",
      optionCode: "TG2",
      expectedDeparture: "10:45",
    },
  ];

  for (const item of expectedExamples) {
    const browseRes = await queryPortDayExcursionCatalog({
      portSlug: item.portSlug,
      viewMode: "browse_all",
      limit: 12,
      offset: 0,
      originatingSite: "cruisepromenade.com",
      surface: "cruisepromenade_port_day",
    });
    assert.ok(browseRes, `Expected browse_all catalog for ${item.portSlug}`);
    assert.ok(
      browseRes.pagination.totalMatchedInSql > 0,
      `Expected active SQL rows in browse_all for ${item.portSlug}`
    );
    assert.equal(
      browseRes.providerCounts.total,
      browseRes.providerCounts.viator + browseRes.providerCounts.operator_direct,
      `Expected providerCounts.total to equal viator + operator_direct for ${item.portSlug}`
    );

    if (item.portSlug === "new-orleans") {
      assert.ok(browseRes.providerCounts.reconciliationBreakdown);
      assert.equal(
        browseRes.providerCounts.reconciliationBreakdown.legacyStaticSummaryCount,
        111
      );
      assert.equal(
        browseRes.providerCounts.reconciliationBreakdown.previousCronCheckpointCount,
        351
      );
    }

    if (item.portSlug === "tampa") {
      assert.equal(browseRes.providerCounts.total, 175);
      assert.equal(browseRes.providerCounts.authorizedSourceTotal, 175);
      assert.equal(browseRes.providerCounts.reconciledWithAuthorizedSource, true);
    }

    const fitsRes = await queryPortDayExcursionCatalog({
      portSlug: item.portSlug,
      viewMode: "fits_sailing",
      shipArrivalTime: "07:00",
      shipAllAboardTime: "15:30",
      limit: 12,
      offset: 0,
      originatingSite: "cruisepromenade.com",
      surface: "cruisepromenade_port_day",
    });
    assert.ok(fitsRes, `Expected fits_sailing catalog for ${item.portSlug}`);
    const verifiedCard = fitsRes.tours.find(
      (t) => t.productCode === item.productCode
    );
    assert.ok(
      verifiedCard,
      `Expected verified Fits my sailing tour ${item.productCode} in ${item.portSlug}`
    );
    assert.equal(verifiedCard.timeFit.status, "fits");
    assert.equal(verifiedCard.timeFit.statusLabel, "Fits my sailing");
    assert.equal(verifiedCard.timeFit.selectedOptionCode, item.optionCode);
    assert.equal(verifiedCard.timeFit.selectedDepartureTime, item.expectedDeparture);
    assert.equal(verifiedCard.timeFit.hasVerifiedDeparture, true);
    assert.equal(verifiedCard.timeFit.hasVerifiedCheckIn, true);
    assert.equal(verifiedCard.timeFit.hasVerifiedMeetingPoint, true);
    assert.equal(verifiedCard.timeFit.hasVerifiedTransfer, true);
    assert.equal(verifiedCard.timeFit.hasVerifiedReturnBuffer, true);
    assert.equal(verifiedCard.seatAvailability.status, "check_availability");
    assert.ok(
      verifiedCard.handoff.exactProductUrl.includes("pid=P00306962"),
      `Expected normal exactProductUrl for ${item.productCode} to use approved affiliate account P00306962`
    );
    assert.ok(
      verifiedCard.handoff.dccTrackedHref.includes("originatingSite=cruisepromenade.com"),
      `Expected dccTrackedHref for ${item.productCode} to record cruisepromenade.com as originatingSite`
    );

    const timeoutCheck = await verifyLiveExcursionAvailability({
      portSlug: item.portSlug,
      tourId: verifiedCard.tourId,
      productCode: item.productCode,
      optionCode: item.optionCode,
      date: fitsRes.sailingWindow.sailingDate,
      partySize: 2,
      departureTime: item.expectedDeparture,
      simulateTimeout: true,
      originatingSite: "cruisepromenade.com",
      surface: "cruisepromenade_port_day",
    });
    assert.equal(timeoutCheck.status, "check_availability");
    assert.equal(timeoutCheck.providerStatus, "timeout");
    assert.equal(timeoutCheck.remainingSeats, null);
    assert.equal(timeoutCheck.fromPriceUsd, null);
    assert.ok(
      timeoutCheck.exactProductUrl.includes("pid=P00306962"),
      `Expected timeout exactProductUrl for ${item.productCode} to use approved affiliate account P00306962`
    );
    assert.ok(
      !timeoutCheck.exactProductUrl.includes("P00290915"),
      `Expected timeout exactProductUrl for ${item.productCode} NOT to use legacy P00290915`
    );
  }
});

test("103.7: Shared handoff ledger records Cruise Promenade as originatingSite, attaches matching campaign and click_id with P00306962, and reports redirects, confirmed bookings, and earned commissions separately", async (t) => {
  const { createCommercialHandoff, getSharedHandoffLedgerSummary, resetCommercialMemoryStoreForTests } = await import(
    "@/lib/dcc/commerce"
  );
  const prevDisable = process.env.DCC_DISABLE_NEON_COMMERCE;
  process.env.DCC_DISABLE_NEON_COMMERCE = "1";
  t.after(() => {
    if (prevDisable === undefined) delete process.env.DCC_DISABLE_NEON_COMMERCE;
    else process.env.DCC_DISABLE_NEON_COMMERCE = prevDisable;
  });
  resetCommercialMemoryStoreForTests();

  const handoff = await createCommercialHandoff({
    originatingSite: "cruisepromenade.com",
    targetSite: "www.viator.com",
    provider: "viator",
    providerAccount: "P00306962",
    productCode: "15200P6",
    productTitle: "New Orleans Swamp Tour Boat Adventure with Transportation",
    productDestinationUrl:
      "https://www.viator.com/tours/New-Orleans/Swamp-and-Bayou-Boat-Tour-with-Transportation-from-New-Orleans/d675-15200P6?pid=P00306962&mcid=42383&medium=api&campaign=cp_port_day_new-orleans_15200P6_TG10",
    campaign: "cp_port_day_new-orleans_15200P6_TG10",
    intendedDate: "2027-04-18",
    intendedOption: "TG10",
    partySize: 2,
    callerClientId: "client:cruisepromenade_port_day",
    metadata: {
      portSlug: "new-orleans",
      optionCode: "TG10",
      surface: "cruisepromenade_port_day",
      trackingTag: "cp_port_day_new-orleans_15200P6_TG10",
      originatingPage: "/ports/new-orleans",
    },
  });

  assert.equal(handoff.originatingSite, "cruisepromenade.com");
  assert.equal(handoff.providerAccount, "P00306962");
  assert.ok(handoff.handoffId.startsWith("hndf_"));
  assert.ok(handoff.clickId.startsWith("clk_"));

  const outUrl = new URL(handoff.outboundAffiliateUrl);
  assert.equal(outUrl.searchParams.get("pid"), "P00306962");
  assert.equal(outUrl.searchParams.get("mcid"), "42383");
  assert.equal(outUrl.searchParams.get("click_id"), handoff.clickId);
  assert.equal(
    outUrl.searchParams.get("campaign"),
    `cp_port_day_new-orleans_15200p6_tg10__${handoff.handoffId}`
  );

  const summary = await getSharedHandoffLedgerSummary({
    originatingSite: "cruisepromenade.com",
    portSlug: "new-orleans",
  });
  assert.ok(summary.redirects.total >= 1);
  assert.ok(summary.redirects.forOriginatingSite >= 1);
  assert.equal(summary.approvedViatorAccountForSite.viatorPid, "P00306962");
  assert.ok(
    "redirects" in summary &&
      "providerConfirmedBookings" in summary &&
      "earnedCommissions" in summary,
    "Expected redirects, providerConfirmedBookings, and earnedCommissions to be reported separately"
  );
  assert.equal(summary.providerConfirmedBookings.displayValue, "unknown");
  assert.equal(summary.earnedCommissions.displayValue, "unknown");
});

test("103.8: Sailing-fit pagination counts and paginates only tours that actually fit the sailing window (New Orleans limit=1 on 2027-07-15 07:00-15:30) and shows all-aboard margin alone when departure is missing", async () => {
  const { queryPortDayExcursionCatalog } = await import(
    "@/lib/dcc/cruisePortExcursionCatalogEngine"
  );

  // Exact live test case from user prompt (no departure time passed):
  // port=new-orleans&viewMode=fits_sailing&date=2027-07-15&shipArrival=07:00&allAboard=15:30&partySize=2&limit=1
  const resPage1 = await queryPortDayExcursionCatalog({
    portSlug: "new-orleans",
    viewMode: "fits_sailing",
    sailingDate: "2027-07-15",
    shipArrivalTime: "07:00",
    shipAllAboardTime: "15:30",
    partySize: 2,
    limit: 1,
    offset: 0,
    originatingSite: "cruisepromenade.com",
    surface: "cruisepromenade_port_day",
  });

  assert.ok(resPage1, "Expected response for New Orleans fits_sailing limit=1");
  assert.equal(
    resPage1.tours.length,
    1,
    "First page (limit=1, offset=0) must return the first fitting tour instead of an empty page"
  );
  assert.equal(resPage1.tours[0].timeFit.status, "fits");
  assert.equal(resPage1.tours[0].timeFit.fitsSailing, true);

  // Pagination must count and paginate over the tours that actually fit the sailing window
  assert.ok(resPage1.pagination.totalMatchedInSql >= 1);
  assert.equal(
    resPage1.pagination.totalFittingSailing,
    resPage1.pagination.totalMatchedInSql
  );
  assert.equal(resPage1.pagination.rowsLoadedIntoApp, 1);

  // Request with no departure time and no matching scheduled port call shows all-aboard margin alone
  assert.equal(resPage1.sailingWindow.shipDepartureTime, null);
  assert.equal(resPage1.sailingWindow.allAboardToShipDepartureMinutes, null);
  assert.equal(resPage1.sailingWindow.departureTimeSource, "missing");

  const timeFit = resPage1.tours[0].timeFit;
  assert.equal(timeFit.shipDepartureTime, null);
  assert.equal(timeFit.requiredReturnBufferMinutes, 60);
  assert.ok(typeof timeFit.bufferBeforeAllAboardMinutes === "number");
  assert.ok(timeFit.bufferBeforeAllAboardMinutes >= 60);

  const recon = timeFit.returnBufferReconciliation;
  assert.ok(recon, "Expected returnBufferReconciliation on timeFit");
  assert.equal(recon.requiredAllAboardBufferMinutes, 60);
  assert.equal(recon.allAboardToShipDepartureMinutes, null);
  assert.equal(recon.equivalentShipDepartureBufferMinutes, null);
  assert.equal(recon.bufferBeforeAllAboardMinutes, timeFit.bufferBeforeAllAboardMinutes);
  assert.equal(recon.bufferBeforeShipDepartureMinutes, null);
  assert.ok(
    recon.reconciliationNote.includes("60m before All Aboard (15:30)"),
    "Expected plain timing explanation referencing 60m before All Aboard"
  );
  assert.ok(
    !recon.reconciliationNote.includes("Earlier report"),
    "Must not include internal report commentary"
  );
  assert.ok(
    !recon.reconciliationNote.includes("ship departure"),
    "Must show all-aboard margin alone when departure is missing"
  );
  assert.ok(
    !timeFit.reasonSummary.includes("ship departure"),
    "reasonSummary must show all-aboard margin alone when departure is missing"
  );
});

test("103.9: Scheduled departure from matching ship, sailing, and port call replaces fixed 30m gap (60m and 45m gaps) and ambiguous multi-ship dates omit departure-relative margins", async () => {
  const { queryPortDayExcursionCatalog } = await import(
    "@/lib/dcc/cruisePortExcursionCatalogEngine"
  );

  // 1. Carnival Liberty in New Orleans on 2026-07-19 (07:00 arrival, 14:30 all-aboard, 15:30 departure -> 60m gap)
  const libertyNola = await queryPortDayExcursionCatalog({
    portSlug: "new-orleans",
    viewMode: "fits_sailing",
    sailingId: "carnival-carnival-liberty-20260719",
    limit: 1,
    offset: 0,
  });
  assert.ok(libertyNola);
  assert.equal(libertyNola.sailingWindow.shipSlug, "carnival-liberty");
  assert.equal(libertyNola.sailingWindow.shipName, "Carnival Liberty");
  assert.equal(libertyNola.sailingWindow.sailingDate, "2026-07-19");
  assert.equal(libertyNola.sailingWindow.shipArrivalTime, "07:00");
  assert.equal(libertyNola.sailingWindow.shipAllAboardTime, "14:30");
  assert.equal(libertyNola.sailingWindow.shipDepartureTime, "15:30");
  assert.equal(libertyNola.sailingWindow.allAboardToShipDepartureMinutes, 60);
  assert.equal(libertyNola.sailingWindow.departureTimeSource, "scheduled_port_call");

  assert.equal(libertyNola.tours.length, 1);
  const libertyTour = libertyNola.tours[0];
  assert.equal(libertyTour.timeFit.shipDepartureTime, "15:30");
  const libertyRecon = libertyTour.timeFit.returnBufferReconciliation!;
  assert.equal(libertyRecon.requiredAllAboardBufferMinutes, 60);
  assert.equal(libertyRecon.allAboardToShipDepartureMinutes, 60);
  assert.equal(libertyRecon.equivalentShipDepartureBufferMinutes, 120);
  assert.equal(
    libertyRecon.bufferBeforeShipDepartureMinutes,
    (libertyTour.timeFit.bufferBeforeAllAboardMinutes ?? 0) + 60
  );
  assert.ok(libertyRecon.reconciliationNote.includes("15:30 (60m after All Aboard)"));
  assert.ok(!libertyRecon.reconciliationNote.includes("Earlier report"));

  // 2. Independence of the Seas in Nassau on 2027-01-25 (07:00 arrival, 15:15 all-aboard, 16:00 departure -> 45m gap)
  const indyNassau = await queryPortDayExcursionCatalog({
    portSlug: "nassau",
    viewMode: "browse_all",
    sailingId: "INDY-2027-01-24",
    limit: 1,
    offset: 0,
  });
  assert.ok(indyNassau);
  assert.equal(indyNassau.sailingWindow.shipSlug, "independence-of-the-seas");
  assert.equal(indyNassau.sailingWindow.sailingDate, "2027-01-25");
  assert.equal(indyNassau.sailingWindow.shipAllAboardTime, "15:15");
  assert.equal(indyNassau.sailingWindow.shipDepartureTime, "16:00");
  assert.equal(indyNassau.sailingWindow.allAboardToShipDepartureMinutes, 45);
  assert.equal(indyNassau.sailingWindow.departureTimeSource, "scheduled_port_call");

  // 3. Ambiguous multi-ship date: Miami on 2027-01-24 has both Independence (16:00) and Symphony (16:30)
  const ambiguousMiami = await queryPortDayExcursionCatalog({
    portSlug: "miami",
    viewMode: "browse_all",
    sailingDate: "2027-01-24",
    limit: 1,
    offset: 0,
  });
  assert.ok(ambiguousMiami);
  assert.equal(ambiguousMiami.sailingWindow.departureTimeSource, "ambiguous");
  assert.equal(ambiguousMiami.sailingWindow.shipDepartureTime, null);
  assert.equal(ambiguousMiami.sailingWindow.allAboardToShipDepartureMinutes, null);
  const miamiRecon = ambiguousMiami.tours[0].timeFit.returnBufferReconciliation!;
  assert.equal(miamiRecon.allAboardToShipDepartureMinutes, null);
  assert.equal(miamiRecon.equivalentShipDepartureBufferMinutes, null);
  assert.equal(miamiRecon.bufferBeforeShipDepartureMinutes, null);
});

test("103.10: Blank all-aboard time labels 15:30 as a port estimate and uses Needs verification for sailing fit until traveler or sailing schedule provides the deadline", async () => {
  const { queryPortDayExcursionCatalog } = await import(
    "@/lib/dcc/cruisePortExcursionCatalogEngine"
  );

  // Live blank-time test URL:
  // ?port=new-orleans&date=2027-07-15&shipArrival=07:00&productCode=15200P6
  const blankAllAboardRes = await queryPortDayExcursionCatalog({
    portSlug: "new-orleans",
    viewMode: "browse_all",
    sailingDate: "2027-07-15",
    shipArrivalTime: "07:00",
    search: "15200P6",
    limit: 5,
    offset: 0,
  });
  assert.ok(blankAllAboardRes, "Expected response for blank all-aboard time query");
  assert.equal(blankAllAboardRes.sailingWindow.shipArrivalTime, "07:00");
  assert.equal(blankAllAboardRes.sailingWindow.arrivalTimeSource, "request_param");
  assert.equal(blankAllAboardRes.sailingWindow.shipAllAboardTime, "15:30");
  assert.equal(
    blankAllAboardRes.sailingWindow.shipAllAboardTimeLabel,
    "15:30 (port estimate)"
  );
  assert.equal(blankAllAboardRes.sailingWindow.allAboardTimeSource, "port_estimate");
  assert.equal(blankAllAboardRes.summary.fitsSailingCountOnPage, 0);

  const tour15200P6 = blankAllAboardRes.tours.find((t) => t.productCode === "15200P6");
  assert.ok(tour15200P6, "Expected 15200P6 in New Orleans browse_all results");
  assert.equal(tour15200P6.timeFit.status, "needs_verification");
  assert.equal(tour15200P6.timeFit.statusLabel, "Needs verification");
  assert.equal(tour15200P6.timeFit.fitsSailing, false);
  assert.equal(tour15200P6.timeFit.allAboardTimeSource, "port_estimate");
  assert.equal(tour15200P6.timeFit.shipAllAboardTimeLabel, "15:30 (port estimate)");
  assert.ok(tour15200P6.timeFit.missingFields.includes("allAboard"));
  assert.ok(
    tour15200P6.timeFit.returnBufferReconciliation?.reconciliationNote.includes(
      "port estimate"
    )
  );
  assert.ok(tour15200P6.timeFit.reasonSummary.includes("port estimate"));

  // Fits my sailing view with blank all-aboard must return 0 fitting tours
  const blankFitsRes = await queryPortDayExcursionCatalog({
    portSlug: "new-orleans",
    viewMode: "fits_sailing",
    sailingDate: "2027-07-15",
    shipArrivalTime: "07:00",
    search: "15200P6",
    limit: 5,
    offset: 0,
  });
  assert.ok(blankFitsRes);
  assert.equal(blankFitsRes.tours.length, 0);
  assert.equal(blankFitsRes.pagination.totalFittingSailing, 0);
});

test("103.11: Standard MCP client lifecycle on /api/v1/mcp supports initialize, notifications/initialized, tools/list, dcc_search_port_excursions (1:15 p.m. fits, 1:14 p.m. runs_too_late, blank needs_verification), and dcc_check_tour_availability", async () => {
  const { POST } = await import("@/app/api/v1/mcp/route");

  async function callMcp(payload: Record<string, unknown>) {
    const req = new Request("https://www.destinationcommandcenter.com/api/v1/mcp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const res = await POST(req);
    const json = await res.json();
    return { status: res.status, json };
  }

  // 1. initialize
  const initRes = await callMcp({
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2025-03-26",
      capabilities: {},
      clientInfo: { name: "mcp-test-client", version: "1.0.0" },
    },
  });
  assert.equal(initRes.status, 200);
  assert.equal(initRes.json.result.protocolVersion, "2025-03-26");
  assert.equal(initRes.json.result.serverInfo.name, "dcc-machine-layer-v03");
  assert.ok(initRes.json.result.capabilities.tools);

  // 2. notifications/initialized (standard notification without id -> 202, and with id -> 200)
  const notifNoId = await callMcp({
    jsonrpc: "2.0",
    method: "notifications/initialized",
  });
  assert.equal(notifNoId.status, 202);
  assert.equal(notifNoId.json.result.ok, true);
  assert.equal(notifNoId.json.result.status, "initialized");

  const notifWithId = await callMcp({
    jsonrpc: "2.0",
    id: 2,
    method: "notifications/initialized",
  });
  assert.equal(notifWithId.status, 200);
  assert.equal(notifWithId.json.result.ok, true);
  assert.equal(notifWithId.json.result.status, "initialized");

  // 3. tools/list
  const listRes = await callMcp({
    jsonrpc: "2.0",
    id: 3,
    method: "tools/list",
    params: {},
  });
  assert.equal(listRes.status, 200);
  const toolNames = (listRes.json.result.tools as Array<{ name: string }>).map(
    (t) => t.name
  );
  assert.ok(toolNames.includes("dcc_search_port_excursions"));
  assert.ok(toolNames.includes("dcc_check_tour_availability"));

  // 4a. dcc_search_port_excursions at 1:15 p.m. all aboard -> fits
  const searchFits = await callMcp({
    jsonrpc: "2.0",
    id: 4,
    method: "tools/call",
    params: {
      name: "dcc_search_port_excursions",
      arguments: {
        port: "new-orleans",
        date: "2027-07-15",
        shipArrival: "07:00",
        allAboard: "1:15 p.m.",
        partySize: 2,
        productCode: "15200P6",
      },
    },
  });
  assert.equal(searchFits.status, 200);
  assert.equal(searchFits.json.result.isError, false);
  const fitsTour = searchFits.json.result.structuredContent.tours[0];
  assert.ok(fitsTour);
  assert.equal(fitsTour.productCode, "15200P6");
  assert.equal(fitsTour.timeFit.status, "fits");
  assert.equal(fitsTour.timeFit.selectedOptionCode, "TG10");
  assert.equal(fitsTour.timeFit.selectedDepartureTime, "08:00");
  assert.equal(fitsTour.timeFit.estimatedBackAtPierTime, "12:15");
  assert.equal(fitsTour.timeFit.bufferBeforeAllAboardMinutes, 60);
  assert.equal(fitsTour.timeFit.requiredReturnBufferMinutes, 60);

  // 4b. dcc_search_port_excursions at 1:14 p.m. all aboard -> runs_too_late
  const searchTooLate = await callMcp({
    jsonrpc: "2.0",
    id: 5,
    method: "tools/call",
    params: {
      name: "dcc_search_port_excursions",
      arguments: {
        port: "new-orleans",
        date: "2027-07-15",
        shipArrival: "07:00",
        allAboard: "1:14 p.m.",
        partySize: 2,
        productCode: "15200P6",
      },
    },
  });
  assert.equal(searchTooLate.status, 200);
  assert.equal(searchTooLate.json.result.isError, false);
  const tooLateTour = searchTooLate.json.result.structuredContent.tours[0];
  assert.ok(tooLateTour);
  assert.equal(tooLateTour.productCode, "15200P6");
  assert.equal(tooLateTour.timeFit.status, "runs_too_late");
  assert.equal(tooLateTour.timeFit.selectedOptionCode, "TG10");
  assert.equal(tooLateTour.timeFit.selectedDepartureTime, "08:00");
  assert.equal(tooLateTour.timeFit.estimatedBackAtPierTime, "12:15");
  assert.equal(tooLateTour.timeFit.bufferBeforeAllAboardMinutes, 59);
  assert.equal(tooLateTour.timeFit.requiredReturnBufferMinutes, 60);

  // 4c. dcc_search_port_excursions with blank all aboard -> needs_verification
  const searchBlank = await callMcp({
    jsonrpc: "2.0",
    id: 6,
    method: "tools/call",
    params: {
      name: "dcc_search_port_excursions",
      arguments: {
        port: "new-orleans",
        date: "2027-07-15",
        shipArrival: "07:00",
        partySize: 2,
        productCode: "15200P6",
      },
    },
  });
  assert.equal(searchBlank.status, 200);
  assert.equal(searchBlank.json.result.isError, false);
  const blankTour = searchBlank.json.result.structuredContent.tours[0];
  assert.ok(blankTour);
  assert.equal(blankTour.productCode, "15200P6");
  assert.equal(blankTour.timeFit.status, "needs_verification");
  assert.equal(blankTour.timeFit.shipAllAboardTimeLabel, "15:30 (port estimate)");
  assert.equal(blankTour.timeFit.allAboardTimeSource, "port_estimate");
  assert.ok(blankTour.timeFit.missingFields.includes("allAboard"));

  // 5. dcc_check_tour_availability keeps timing fit separate and preserves unknown seat counts
  const availRes = await callMcp({
    jsonrpc: "2.0",
    id: 7,
    method: "tools/call",
    params: {
      name: "dcc_check_tour_availability",
      arguments: {
        port: "new-orleans",
        productCode: "15200P6",
        optionCode: "TG10",
        date: "2027-07-15",
        departureTime: "08:00",
        partySize: 2,
        simulateTimeout: true,
      },
    },
  });
  assert.equal(availRes.status, 200);
  assert.equal(availRes.json.result.isError, false);
  const availPayload = availRes.json.result.structuredContent;
  assert.equal(availPayload.ok, true);
  assert.equal(availPayload.readOnly, true);
  assert.equal(availPayload.createsCommercialHandoff, false);
  assert.equal(availPayload.timingFitIncluded, false);
  assert.equal(availPayload.seatCountStatus, "unknown");
  assert.equal(availPayload.seatAvailability.remainingSeats, null);
  assert.ok(!("timeFit" in availPayload));
});

test("103.12: checkout requires a configured client, explicit approval, verified fit, and durable storage", async (t) => {
  const { POST } = await import("@/app/api/v1/mcp/route");
  const previousKeys = process.env.DCC_MACHINE_API_KEYS_JSON;
  const previousStorage = process.env.DCC_DISABLE_NEON_COMMERCE;
  const key = "test-configured-dcc-checkout-client";
  process.env.DCC_MACHINE_API_KEYS_JSON = JSON.stringify({ [key]: ["dcc:commerce:handoff"] });
  process.env.DCC_DISABLE_NEON_COMMERCE = "1";
  t.after(() => {
    if (previousKeys === undefined) delete process.env.DCC_MACHINE_API_KEYS_JSON;
    else process.env.DCC_MACHINE_API_KEYS_JSON = previousKeys;
    if (previousStorage === undefined) delete process.env.DCC_DISABLE_NEON_COMMERCE;
    else process.env.DCC_DISABLE_NEON_COMMERCE = previousStorage;
  });

  const args = {
    port: "new-orleans", productCode: "15200P6", optionCode: "TG10",
    date: "2027-07-15", departureTime: "08:00", partySize: 4,
    shipArrival: "07:00", allAboard: "13:15",
    travelerApprovedCheckout: true, idempotencyKey: "qa-four-adults",
  };
  function callMcp(changes: Record<string, unknown> = {}, authenticated = true) {
    return POST(new Request("https://www.destinationcommandcenter.com/api/v1/mcp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authenticated ? { Authorization: `Bearer ${key}` } : {}),
      },
      body: JSON.stringify({
        jsonrpc: "2.0", id: 1, method: "tools/call",
        params: { name: "dcc_prepare_tour_checkout", arguments: { ...args, ...changes } },
      }),
    }));
  }

  assert.equal((await callMcp({}, false)).status, 401);
  const cases = [
    { changes: { travelerApprovedCheckout: "true" }, code: "TRAVELER_APPROVAL_REQUIRED" },
    { changes: { date: "2027-02-30" }, code: "INVALID_CHECKOUT_SELECTION" },
    { changes: { partySize: true }, code: "INVALID_CHECKOUT_SELECTION" },
    { changes: { optionCode: "TG11" }, code: "INVALID_CHECKOUT_SELECTION" },
    { changes: { allAboard: undefined }, code: "SAILING_FIT_NOT_VERIFIED" },
    { changes: { allAboard: "13:14" }, code: "SAILING_FIT_NOT_VERIFIED" },
    { changes: {}, code: "DURABLE_HANDOFF_UNAVAILABLE" },
  ];
  for (const { changes, code } of cases) {
    const response = await callMcp(changes);
    const rpc = await response.json();
    assert.equal(rpc.result.structuredContent.errorCode, code);
    assert.equal(rpc.result.structuredContent.outboundAffiliateUrl, null);
    assert.equal(rpc.result.structuredContent.durableRecordCount, 0);
  }
});

test("103.13: Show HN 5-traveler MCP demo (60m fits, 59m runs_too_late, missing all-aboard needs_verification, separate read-only availability) and Viator reporting import campaignValue matching with QA excluded and confirmed bookings vs paid commissions separated", async (t) => {
  const { POST } = await import("@/app/api/v1/mcp/route");
  const {
    createCommercialHandoff,
    pollViatorModifiedSinceWithCheckpoint,
    getSharedHandoffLedgerSummary,
    resetCommercialMemoryStoreForTests,
  } = await import("@/lib/dcc/commerce");
  const prevDisable = process.env.DCC_DISABLE_NEON_COMMERCE;
  process.env.DCC_DISABLE_NEON_COMMERCE = "1";
  t.after(() => {
    if (prevDisable === undefined) delete process.env.DCC_DISABLE_NEON_COMMERCE;
    else process.env.DCC_DISABLE_NEON_COMMERCE = prevDisable;
  });

  async function callMcp(payload: Record<string, unknown>) {
    const req = new Request("https://www.destinationcommandcenter.com/api/v1/mcp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const res = await POST(req);
    const json = await res.json();
    return { status: res.status, json };
  }

  // Part A: Show HN read-only MCP demo for 5 travelers on New Orleans 15200P6 / TG10 (08:00 departure)
  const baseArgs = {
    port: "new-orleans",
    productCode: "15200P6",
    date: "2027-07-15",
    shipArrival: "07:00",
    partySize: 5,
  };

  // 1) 60 minutes before all-aboard (1:15 p.m. / 13:15) -> fits
  const fits60Res = await callMcp({
    jsonrpc: "2.0",
    id: 101,
    method: "tools/call",
    params: {
      name: "dcc_search_port_excursions",
      arguments: { ...baseArgs, allAboard: "1:15 p.m." },
    },
  });
  assert.equal(fits60Res.status, 200);
  const fits60Tour = fits60Res.json.result.structuredContent.tours[0];
  assert.equal(fits60Tour.productCode, "15200P6");
  assert.equal(fits60Tour.timeFit.status, "fits");
  assert.equal(fits60Tour.timeFit.selectedOptionCode, "TG10");
  assert.equal(fits60Tour.timeFit.selectedDepartureTime, "08:00");
  assert.equal(fits60Tour.timeFit.estimatedBackAtPierTime, "12:15");
  assert.equal(fits60Tour.timeFit.bufferBeforeAllAboardMinutes, 60);
  assert.equal(fits60Tour.timeFit.requiredReturnBufferMinutes, 60);

  // 2) 59 minutes before all-aboard (1:14 p.m. / 13:14) -> runs_too_late
  const late59Res = await callMcp({
    jsonrpc: "2.0",
    id: 102,
    method: "tools/call",
    params: {
      name: "dcc_search_port_excursions",
      arguments: { ...baseArgs, allAboard: "1:14 p.m." },
    },
  });
  assert.equal(late59Res.status, 200);
  const late59Tour = late59Res.json.result.structuredContent.tours[0];
  assert.equal(late59Tour.productCode, "15200P6");
  assert.equal(late59Tour.timeFit.status, "runs_too_late");
  assert.equal(late59Tour.timeFit.selectedOptionCode, "TG10");
  assert.equal(late59Tour.timeFit.selectedDepartureTime, "08:00");
  assert.equal(late59Tour.timeFit.estimatedBackAtPierTime, "12:15");
  assert.equal(late59Tour.timeFit.bufferBeforeAllAboardMinutes, 59);
  assert.equal(late59Tour.timeFit.requiredReturnBufferMinutes, 60);

  // 3) Missing all-aboard time -> needs_verification (15:30 port estimate)
  const missingRes = await callMcp({
    jsonrpc: "2.0",
    id: 103,
    method: "tools/call",
    params: {
      name: "dcc_search_port_excursions",
      arguments: baseArgs,
    },
  });
  assert.equal(missingRes.status, 200);
  const missingTour = missingRes.json.result.structuredContent.tours[0];
  assert.equal(missingTour.productCode, "15200P6");
  assert.equal(missingTour.timeFit.status, "needs_verification");
  assert.equal(missingTour.timeFit.shipAllAboardTimeLabel, "15:30 (port estimate)");
  assert.equal(missingTour.timeFit.allAboardTimeSource, "port_estimate");
  assert.ok(missingTour.timeFit.missingFields.includes("allAboard"));

  // 4) Separate read-only availability check for 5 travelers
  const avail5Res = await callMcp({
    jsonrpc: "2.0",
    id: 104,
    method: "tools/call",
    params: {
      name: "dcc_check_tour_availability",
      arguments: {
        port: "new-orleans",
        productCode: "15200P6",
        optionCode: "TG10",
        date: "2027-07-15",
        departureTime: "08:00",
        partySize: 5,
        simulateTimeout: true,
      },
    },
  });
  assert.equal(avail5Res.status, 200);
  const avail5 = avail5Res.json.result.structuredContent;
  assert.equal(avail5.ok, true);
  assert.equal(avail5.readOnly, true);
  assert.equal(avail5.createsCommercialHandoff, false);
  assert.equal(avail5.timingFitIncluded, false);
  assert.equal(avail5.partySize, 5);
  assert.equal(avail5.seatAvailability.remainingSeats, null);
  assert.ok(!("timeFit" in avail5));

  // Part B: Verify Viator reporting import matches production account P00306962 campaignValue to stored handoff,
  // excludes QA traffic, and reports confirmed bookings and paid commissions separately.
  resetCommercialMemoryStoreForTests();

  const prodHandoff = await createCommercialHandoff({
    idempotencyKey: "prod-nola-15200p6-5p-001",
    callerClientId: "cruisepromenade",
    originatingSite: "cruisepromenade.com",
    provider: "viator",
    providerAccount: "P00306962",
    campaign: "dcc-cruisepromenade-nola",
    viatorProductCode: "15200P6",
    productCode: "15200P6",
    productTitle: "Small-Group Swamp Tour by Boat From New Orleans with Pickup",
    productDestinationUrl:
      "https://www.viator.com/tours/New-Orleans/New-Orleans-Swamp-Tour-and-Wetlands-Adventure/d675-15200P6",
    intendedDate: "2027-07-15",
    intendedOption: "TG10",
    intendedDepartureTime: "08:00",
    partySize: 5,
    quotedPriceAmount: 300,
    quotedPriceCurrency: "USD",
    metadata: {
      portSlug: "new-orleans",
      isQaTraffic: false,
    },
  });

  const qaHandoff = await createCommercialHandoff({
    idempotencyKey: "qa-nola-15200p6-5p-001",
    callerClientId: "qa-runner",
    originatingSite: "cruisepromenade.com",
    provider: "viator",
    providerAccount: "P00306962",
    campaign: "dcc-cruisepromenade-nola",
    viatorProductCode: "15200P6",
    productCode: "15200P6",
    productTitle: "Small-Group Swamp Tour by Boat From New Orleans with Pickup",
    productDestinationUrl:
      "https://www.viator.com/tours/New-Orleans/New-Orleans-Swamp-Tour-and-Wetlands-Adventure/d675-15200P6",
    intendedDate: "2027-07-15",
    intendedOption: "TG10",
    intendedDepartureTime: "08:00",
    partySize: 5,
    quotedPriceAmount: 300,
    quotedPriceCurrency: "USD",
    metadata: {
      portSlug: "new-orleans",
      isQaTraffic: true,
    },
  });

  // Poll 1: Viator returns BOOKING_CONFIRMED with campaignValue for both prod and QA handoffs (estimated commission only, no paid commission yet)
  const pollConfirmed = await pollViatorModifiedSinceWithCheckpoint({
    pollerId: "viator_prod_campaign_value_test",
    providerAccount: "P00306962",
    customFetchPage: async () => ({
      nextCursor: "cursor_after_confirmed",
      bookings: [
        {
          bookingRef: "BR-PROD-15200P6-01",
          eventType: "BOOKING_CONFIRMED",
          lastUpdated: "2027-07-01T12:00:00.000Z",
          campaignValue: prodHandoff.attributionParameterValue,
          productCode: "15200P6",
          tourGradeCode: "TG10",
          travelDate: "2027-07-15",
          partySize: 5,
          bookingValue: 300,
          estimatedCommission: 24,
          currency: "USD",
        },
        {
          bookingRef: "BR-QA-15200P6-01",
          eventType: "BOOKING_CONFIRMED",
          lastUpdated: "2027-07-01T12:01:00.000Z",
          campaignValue: qaHandoff.attributionParameterValue,
          productCode: "15200P6",
          tourGradeCode: "TG10",
          travelDate: "2027-07-15",
          partySize: 5,
          bookingValue: 300,
          estimatedCommission: 24,
          currency: "USD",
        },
      ],
    }),
  });
  assert.equal(pollConfirmed.matchedCount, 2);

  // Verify ledger summary after BOOKING_CONFIRMED: QA excluded, 1 confirmed booking, $24 estimated commission, 0 paid commissions ($0 settled)
  const summaryAfterConfirm = await getSharedHandoffLedgerSummary({
    originatingSite: "cruisepromenade.com",
    portSlug: "new-orleans",
  });
  assert.equal(summaryAfterConfirm.providerConfirmedBookings.confirmedCount, 1);
  assert.equal(summaryAfterConfirm.estimatedCommissions.estimatedCommissionUsd, 24);
  assert.equal(summaryAfterConfirm.payouts.paidCommissionsCount, 0);
  assert.equal(summaryAfterConfirm.payouts.settledPaidUsd, 0);
  assert.equal(summaryAfterConfirm.machineFunnel?.matchedConfirmedBookings, 1);
  assert.equal(summaryAfterConfirm.machineFunnel?.paidCommissionsCount, 0);
  assert.equal(summaryAfterConfirm.machineFunnel?.paidCommissionsUsd, 0);

  // Poll 2: Viator returns COMMISSION_RECONCILED with paidCommission: 24 for the production booking
  const pollSettled = await pollViatorModifiedSinceWithCheckpoint({
    pollerId: "viator_prod_campaign_value_test",
    providerAccount: "P00306962",
    customFetchPage: async () => ({
      nextCursor: "cursor_after_settled",
      bookings: [
        {
          bookingRef: "BR-PROD-15200P6-01",
          eventType: "COMMISSION_RECONCILED",
          lastUpdated: "2027-07-20T12:00:00.000Z",
          campaignValue: prodHandoff.attributionParameterValue,
          productCode: "15200P6",
          tourGradeCode: "TG10",
          travelDate: "2027-07-15",
          partySize: 5,
          bookingValue: 300,
          paidCommission: 24,
          currency: "USD",
        },
      ],
    }),
  });
  assert.equal(pollSettled.matchedCount, 1);

  // Verify ledger summary after COMMISSION_RECONCILED: still 1 confirmed booking (not double-counted!), and 1 paid commission ($24 settled) reported separately
  const summaryAfterSettle = await getSharedHandoffLedgerSummary({
    originatingSite: "cruisepromenade.com",
    portSlug: "new-orleans",
  });
  assert.equal(summaryAfterSettle.providerConfirmedBookings.confirmedCount, 1);
  assert.equal(summaryAfterSettle.payouts.paidCommissionsCount, 1);
  assert.equal(summaryAfterSettle.payouts.settledPaidUsd, 24);
  assert.equal(summaryAfterSettle.machineFunnel?.matchedConfirmedBookings, 1);
  assert.equal(summaryAfterSettle.machineFunnel?.paidCommissionsCount, 1);
  assert.equal(summaryAfterSettle.machineFunnel?.paidCommissionsUsd, 24);
});

test("103.14: Commerce tests fail closed when pointing at the production database", async () => {
  const {
    assertCommerceTestDatabaseSafe,
    CommerceTestProductionDatabaseError,
    createCommercialHandoff,
    resetCommercialMemoryStoreForTests,
  } = await import("../../lib/dcc/commerce");

  assert.equal(process.env.DATABASE_URL, undefined);

  const prevDbUrl = process.env.DATABASE_URL;
  try {
    process.env.DATABASE_URL =
      "postgresql://neondb_owner:redacted@ep-autumn-credit-ad612q46-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require";

    assert.throws(
      () => assertCommerceTestDatabaseSafe(),
      (err: unknown) =>
        err instanceof CommerceTestProductionDatabaseError &&
        err.code === "COMMERCE_TEST_PRODUCTION_DB_FORBIDDEN" &&
        err.databaseName === "neondb" &&
        err.databaseRole === "neondb_owner"
    );

    assert.throws(
      () => resetCommercialMemoryStoreForTests(),
      (err: unknown) =>
        err instanceof CommerceTestProductionDatabaseError &&
        err.code === "COMMERCE_TEST_PRODUCTION_DB_FORBIDDEN"
    );

    await assert.rejects(
      () =>
        createCommercialHandoff({
          originatingSite: "cruisepromenade.com",
          callerClientId: "client:cruisepromenade_port_day",
          provider: "viator",
          providerAccount: "P00306962",
          productCode: "7090P9",
          productDestinationUrl:
            "https://www.viator.com/tours/Reykjavik/Classic-Whale-Watching-from-Reykjavik/d905-7090P9",
        }),
      (err: unknown) =>
        err instanceof CommerceTestProductionDatabaseError &&
        err.code === "COMMERCE_TEST_PRODUCTION_DB_FORBIDDEN"
    );
  } finally {
    if (prevDbUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = prevDbUrl;
    }
  }
});

test("103.15 Two-hour shortlist: 120m vs 119m on 15200P6 / TG10, full return trip with tender + cutoff, Needs verification, and See other tours that fit", async () => {
  // 1. 120 minutes buffer (allAboard = 14:15, return = 12:15) -> Estimated back 2+ hours before all aboard
  const shortlist120 = await queryPortDayExcursionCatalog({
    portSlug: "new-orleans",
    viewMode: "shortlist_2h",
    shipArrivalTime: "07:00",
    shipAllAboardTime: "14:15",
    sailingDate: "2027-01-12",
    partySize: 5,
    search: "15200P6",
  });
  assert.ok(shortlist120);
  assert.equal(shortlist120.viewMode, "shortlist_2h");
  assert.equal(shortlist120.tours.length, 1);
  const card120 = shortlist120.tours[0];
  assert.equal(card120.productCode, "15200P6");
  assert.equal(card120.timeFit.selectedOptionCode, "TG10");
  assert.equal(card120.timeFit.selectedDepartureTime, "08:00");
  assert.equal(card120.timeFit.status, "fits");
  assert.equal(card120.timeFit.returnEstimateTime, "12:15");
  assert.equal(card120.timeFit.shipAllAboardTime, "14:15");
  assert.equal(card120.timeFit.bufferBeforeAllAboardMinutes, 120);
  assert.ok(card120.timeFit.twoHourShortlist);
  assert.equal(card120.timeFit.twoHourShortlist.qualifies, true);
  assert.equal(
    card120.timeFit.twoHourShortlist.statusLabel,
    "Estimated back 2+ hours before all aboard"
  );
  assert.equal(card120.timeFit.twoHourShortlist.returnEstimateTime, "12:15");
  assert.equal(card120.timeFit.twoHourShortlist.deadlineTime, "14:15");
  assert.equal(card120.timeFit.twoHourShortlist.bufferBeforeAllAboardMinutes, 120);

  // 2. 119 minutes buffer (allAboard = 14:14, return = 12:15) -> excluded from shortlist_2h, offered under See other tours that fit (fits_sailing)
  const shortlist119 = await queryPortDayExcursionCatalog({
    portSlug: "new-orleans",
    viewMode: "shortlist_2h",
    shipArrivalTime: "07:00",
    shipAllAboardTime: "14:14",
    sailingDate: "2027-01-12",
    partySize: 5,
    search: "15200P6",
  });
  assert.ok(shortlist119);
  assert.equal(shortlist119.tours.length, 0);
  assert.equal(shortlist119.shortlistSummary?.shortlist2hCountOnPage, 0);
  assert.equal(shortlist119.shortlistSummary?.otherFittingCountOnPage, 1);
  assert.equal(shortlist119.shortlistSummary?.offerSeeOtherToursThatFit, true);
  assert.equal(
    shortlist119.shortlistSummary?.seeOtherToursThatFitLabel,
    "See other tours that fit"
  );

  const otherTours119 = await queryPortDayExcursionCatalog({
    portSlug: "new-orleans",
    viewMode: "fits_sailing",
    shipArrivalTime: "07:00",
    shipAllAboardTime: "14:14",
    sailingDate: "2027-01-12",
    partySize: 5,
    search: "15200P6",
  });
  assert.ok(otherTours119);
  assert.equal(otherTours119.tours.length, 1);
  const card119 = otherTours119.tours[0];
  assert.equal(card119.timeFit.status, "fits");
  assert.equal(card119.timeFit.bufferBeforeAllAboardMinutes, 119);
  assert.equal(card119.timeFit.twoHourShortlist?.qualifies, false);
  assert.equal(
    card119.timeFit.twoHourShortlist?.statusLabel,
    "See other tours that fit"
  );

  // 3. Full return trip with tender (15m) + tender cutoff (15m) -> returnEstimateTime = 12:45
  const tender120 = await queryPortDayExcursionCatalog({
    portSlug: "new-orleans",
    viewMode: "shortlist_2h",
    shipArrivalTime: "07:00",
    shipAllAboardTime: "14:45",
    sailingDate: "2027-01-12",
    partySize: 5,
    dockOrTender: "tender",
    tenderTravelMinutes: 15,
    tenderCutoffMinutes: 15,
    search: "15200P6",
  });
  assert.ok(tender120);
  assert.equal(tender120.tours.length, 1);
  const tenderCard120 = tender120.tours[0];
  assert.equal(tenderCard120.timeFit.returnAtPierTime, "12:15");
  assert.equal(tenderCard120.timeFit.returnEstimateTime, "12:45");
  assert.equal(tenderCard120.timeFit.lastTenderCutoffTime, "14:30");
  assert.equal(tenderCard120.timeFit.fullReturnTripMinutes, 45);
  assert.equal(tenderCard120.timeFit.bufferBeforeAllAboardMinutes, 120);
  assert.equal(tenderCard120.timeFit.twoHourShortlist?.qualifies, true);

  const tender119 = await queryPortDayExcursionCatalog({
    portSlug: "new-orleans",
    viewMode: "shortlist_2h",
    shipArrivalTime: "07:00",
    shipAllAboardTime: "14:44",
    sailingDate: "2027-01-12",
    partySize: 5,
    dockOrTender: "tender",
    tenderTravelMinutes: 15,
    tenderCutoffMinutes: 15,
    search: "15200P6",
  });
  assert.ok(tender119);
  assert.equal(tender119.tours.length, 0);
  assert.equal(tender119.shortlistSummary?.otherFittingCountOnPage, 1);

  // 4. Missing tender cutoff on tender call -> Needs verification
  const tenderMissingCutoff = await queryPortDayExcursionCatalog({
    portSlug: "new-orleans",
    viewMode: "browse_all",
    shipArrivalTime: "07:00",
    shipAllAboardTime: "14:45",
    sailingDate: "2027-01-12",
    partySize: 5,
    dockOrTender: "tender",
    tenderTravelMinutes: 15,
    tenderCutoffMinutes: null,
    search: "15200P6",
  });
  assert.ok(tenderMissingCutoff);
  assert.equal(tenderMissingCutoff.tours.length, 1);
  assert.equal(tenderMissingCutoff.tours[0].timeFit.status, "needs_verification");
  assert.equal(tenderMissingCutoff.tours[0].timeFit.statusLabel, "Needs verification");
  assert.ok(tenderMissingCutoff.tours[0].timeFit.missingFields.includes("tenderCutoff"));
  assert.equal(
    tenderMissingCutoff.tours[0].timeFit.twoHourShortlist?.statusLabel,
    "Needs verification"
  );
});

test("103.16: Catalog-backed checkout approval, all 629 ports connected for discovery, and Jan 8 Symphony of the Seas Cozumel 103974P5 / TG1 proof with MCP + OpenAPI sync", async (t) => {
  const {
    CONNECTED_CRUISE_PORT_COUNT,
    getConnectedCruisePortProfiles,
    resolveCruisePortExcursionProfile,
    queryPortDayExcursionCatalog,
    verifyLiveExcursionAvailability,
    preparePortDayTourCheckout,
  } = await import("@/lib/dcc/cruisePortExcursionCatalogEngine");
  const { getCruisePortDirectory } = await import("@/lib/dcc/cruisePortDirectory");
  const {
    APPROVED_CATALOG_CHECKOUT_TOURS,
    resolveApprovedCatalogCheckoutSpec,
    validateCatalogCheckoutBinding,
    buildViatorCarryoverTruth,
  } = await import("@/lib/dcc/catalog/provenToursCatalog");
  const { POST: mcpPost, GET: mcpGet } = await import("@/app/api/v1/mcp/route");
  const { GET: openApiGet } = await import("@/app/openapi.json/route");

  const previousKeys = process.env.DCC_MACHINE_API_KEYS_JSON;
  const key = "test-catalog-checkout-client-v03";
  process.env.DCC_MACHINE_API_KEYS_JSON = JSON.stringify({
    [key]: ["dcc:commerce:handoff", "dcc:read:public"],
  });
  t.after(() => {
    if (previousKeys === undefined) delete process.env.DCC_MACHINE_API_KEYS_JSON;
    else process.env.DCC_MACHINE_API_KEYS_JSON = previousKeys;
  });

  // ---------------------------------------------------------------------------
  // 1. All 629 ports connected for discovery + approved provider mappings + needs_verification
  // ---------------------------------------------------------------------------
  const directory = getCruisePortDirectory();
  assert.equal(directory.length, 629);
  assert.equal(CONNECTED_CRUISE_PORT_COUNT, 629);

  const connectedProfiles = getConnectedCruisePortProfiles();
  assert.equal(connectedProfiles.length, 629);

  // Every single one of the 629 directory ports resolves a profile
  for (const entry of directory) {
    const profile = resolveCruisePortExcursionProfile(entry.slug);
    assert.ok(profile, `Expected cruise port directory slug '${entry.slug}' to resolve`);
  }

  // Discovery port mapped to an approved provider destination (e.g. port-everglades -> miami, lahaina -> kahului)
  const portEvergladesCatalog = await queryPortDayExcursionCatalog({
    portSlug: "port-everglades",
    viewMode: "browse_all",
    shipArrivalTime: "07:00",
    shipAllAboardTime: "16:30",
    sailingDate: "2027-07-15",
    partySize: 2,
    limit: 5,
  });
  assert.ok(portEvergladesCatalog);
  assert.equal(portEvergladesCatalog.port.portSlug, "port-everglades");
  assert.equal(portEvergladesCatalog.port.destinationSlug, "miami");
  assert.equal(portEvergladesCatalog.port.hasDatedBerthEvidence, false);
  assert.ok(portEvergladesCatalog.tours.length > 0);
  // Because port-everglades lacks a dated berth and routes to Miami inventory without route transfer evidence:
  for (const tour of portEvergladesCatalog.tours) {
    assert.equal(tour.timeFit.status, "needs_verification");
    assert.equal(tour.timeFit.fitsSailing, false);
    assert.ok(tour.timeFit.missingFields.includes("datedBerth"));
    assert.ok(tour.timeFit.missingFields.includes("transfers"));
    // Coordinates identify endpoints even when timing verdict is needs_verification
    assert.ok(tour.timeFit.evidenceReviewPriority?.berthCoordinates);
  }

  // Civitavecchia resolves for discovery (mapped to Rome) and reports missing timing evidence as needs_verification
  const civitavecchiaCatalog = await queryPortDayExcursionCatalog({
    portSlug: "civitavecchia",
    viewMode: "browse_all",
    sailingDate: "2027-07-15",
    partySize: 2,
    limit: 5,
  });
  assert.ok(civitavecchiaCatalog);
  assert.equal(civitavecchiaCatalog.port.portSlug, "civitavecchia");
  assert.equal(civitavecchiaCatalog.port.destinationSlug, "rome");
  assert.equal(civitavecchiaCatalog.port.hasDatedBerthEvidence, false);
  assert.equal(civitavecchiaCatalog.sailingWindow.timingStatus, "needs_verification");
  assert.deepEqual(civitavecchiaCatalog.sailingWindow.missingTimingEvidence, [
    "datedBerth",
    "transfers",
    "allAboard",
  ]);

  // Even on a berth-verified port (Cozumel), missing datedBerth or missing transfers forces needs_verification
  const cozumelMissingBerth = await queryPortDayExcursionCatalog({
    portSlug: "cozumel",
    sailingId: "royal-caribbean-symphony-of-the-seas-2027-01-03",
    sailingDate: "2027-01-08",
    shipArrivalTime: "08:00",
    shipAllAboardTime: "17:00",
    datedBerth: "missing",
    search: "103974P5",
  });
  assert.ok(cozumelMissingBerth);
  assert.equal(cozumelMissingBerth.tours[0].timeFit.status, "needs_verification");
  assert.ok(cozumelMissingBerth.tours[0].timeFit.missingFields.includes("datedBerth"));

  const cozumelMissingTransfers = await queryPortDayExcursionCatalog({
    portSlug: "cozumel",
    sailingId: "royal-caribbean-symphony-of-the-seas-2027-01-03",
    sailingDate: "2027-01-08",
    shipArrivalTime: "08:00",
    shipAllAboardTime: "17:00",
    transfers: "missing",
    search: "103974P5",
  });
  assert.ok(cozumelMissingTransfers);
  assert.equal(cozumelMissingTransfers.tours[0].timeFit.status, "needs_verification");
  assert.ok(cozumelMissingTransfers.tours[0].timeFit.missingFields.includes("transfers"));

  // ---------------------------------------------------------------------------
  // 2. Catalog-backed checkout approval replaces two-product hardcode
  // ---------------------------------------------------------------------------
  assert.deepEqual(Object.keys(APPROVED_CATALOG_CHECKOUT_TOURS), [
    "15200P6",
    "15200P1",
    "103974P5",
  ]);
  delete process.env.DCC_ENABLE_COZUMEL_103974P5_CHECKOUT;
  delete process.env.CP_ENABLE_COZUMEL_103974P5_CHECKOUT;

  const cozumelSpecGated = resolveApprovedCatalogCheckoutSpec({
    portSlug: "cozumel",
    productCode: "103974P5",
    optionCode: "TG1",
    departureTime: "10:00",
  });
  assert.equal(cozumelSpecGated.productApproved, true);
  assert.equal(cozumelSpecGated.selectionApproved, true);
  assert.equal(cozumelSpecGated.preparedCheckoutEnabled, false);
  assert.ok(cozumelSpecGated.checkoutGateReason?.includes("MARINA ASIPONA COZUMEL"));
  assert.equal(cozumelSpecGated.provider, "viator");
  assert.equal(cozumelSpecGated.providerAccount, "P00306962");
  assert.equal(cozumelSpecGated.mcid, "42383");

  const validCozumelBinding = validateCatalogCheckoutBinding({
    provider: "viator",
    providerAccount: "P00306962",
    mcid: "42383",
    portSlug: "cozumel",
    productCode: "103974P5",
    optionCode: "TG1",
    departureTime: "10:00",
    checkoutDestinationUrl:
      "https://www.viator.com/tours/Cozumel/Cozumel-Snorkel-tour-Palancar-reef-Columbia-reef-and-El-Cielo-Sandbar/d632-103974P5?mcid=42383&pid=P00306962&medium=api&api_version=2.0",
  });
  assert.equal(validCozumelBinding.approved, true);

  // ---------------------------------------------------------------------------
  // 3. Prove Cozumel 103974P5 / TG1 on Jan 8, 2027 Symphony of the Seas
  // ---------------------------------------------------------------------------
  // 3a. Default gated state: even with shipAllAboardTime="17:00", Cozumel 103974P5 / TG1 stays needs_verification and prepared checkout is gated
  const jan8GatedDefault = await queryPortDayExcursionCatalog({
    portSlug: "cozumel",
    sailingId: "royal-caribbean-symphony-of-the-seas-2027-01-03",
    sailingDate: "2027-01-08",
    shipArrivalTime: "08:00",
    shipAllAboardTime: "17:00",
    shipDepartureTime: "18:00",
    partySize: 4,
    search: "103974P5",
  });
  assert.ok(jan8GatedDefault);
  const candidateGated = jan8GatedDefault.tours[0];
  assert.equal(candidateGated.productCode, "103974P5");
  assert.equal(candidateGated.timeFit.status, "needs_verification");
  assert.equal(candidateGated.timeFit.checkInCutoffMinutes, 10);
  assert.equal(candidateGated.timeFit.latestCheckInTime, "09:50");
  assert.equal(
    candidateGated.timeFit.meetingPointName,
    "Cozumel Tours office next to the tequila store at Marina ASIPONA Cozumel (Formerly Known as Marina Fonatur, Google Place ChIJhUJKipFXTo8RVdFGMuytpuI)"
  );
  assert.ok(candidateGated.timeFit.missingFields.includes("datedBerth"));
  assert.ok(candidateGated.timeFit.missingFields.includes("meetingPoint"));
  assert.ok(candidateGated.timeFit.missingFields.includes("transfers"));
  assert.equal(candidateGated.seatAvailability.mandatoryDestinationFee?.perPersonUsd, 11);
  assert.equal(candidateGated.seatAvailability.mandatoryDestinationFee?.totalForPartyUsd, 44);
  assert.equal(candidateGated.seatAvailability.mandatoryDestinationFee?.combinedTripTotalUsd, null);
  assert.ok(candidateGated.seatAvailability.exactProductUrl.includes("d632-103974P5"));
  assert.ok(candidateGated.seatAvailability.exactProductUrl.includes("pid=P00306962"));

  const stoppedWhileGated = await preparePortDayTourCheckout({
    portSlug: "cozumel",
    productCode: "103974P5",
    optionCode: "TG1",
    date: "2027-01-08",
    departureTime: "10:00",
    partySize: 4,
    sailingId: "royal-caribbean-symphony-of-the-seas-2027-01-03",
    shipArrivalTime: "08:00",
    shipAllAboardTime: "17:00",
    shipDepartureTime: "18:00",
    travelerApprovedCheckout: true,
    idempotencyKey: `qa-cozumel-gated-default-${Date.now()}`,
    isQaTraffic: true,
  });
  assert.equal(stoppedWhileGated.ok, false);
  assert.equal(stoppedWhileGated.errorCode, "SAILING_FIT_NOT_VERIFIED");
  assert.equal(stoppedWhileGated.outboundAffiliateUrl, null);
  assert.equal(stoppedWhileGated.durableRecordCount, 0);

  // 3b. Enable Cozumel 103974P5 / TG1 prepared checkout flag to test post-confirmation behavior
  process.env.DCC_ENABLE_COZUMEL_103974P5_CHECKOUT = "true";
  t.after(() => {
    delete process.env.DCC_ENABLE_COZUMEL_103974P5_CHECKOUT;
  });

  // When all-aboard cutoff is unconfirmed on the Jan 8 Symphony of the Seas sailing, status is still needs_verification
  const jan8UnconfirmedCutoff = await queryPortDayExcursionCatalog({
    portSlug: "cozumel",
    sailingId: "royal-caribbean-symphony-of-the-seas-2027-01-03",
    sailingDate: "2027-01-08",
    partySize: 4,
    search: "103974P5",
  });
  assert.ok(jan8UnconfirmedCutoff);
  assert.equal(jan8UnconfirmedCutoff.sailingWindow.shipName, "Symphony of the Seas");
  assert.equal(jan8UnconfirmedCutoff.sailingWindow.shipArrivalTime, "08:00");
  assert.equal(jan8UnconfirmedCutoff.sailingWindow.shipDepartureTime, "18:00");
  assert.equal(jan8UnconfirmedCutoff.sailingWindow.allAboardTimeSource, "port_estimate");
  const candidateUnconfirmed = jan8UnconfirmedCutoff.tours[0];
  assert.equal(candidateUnconfirmed.productCode, "103974P5");
  assert.equal(candidateUnconfirmed.timeFit.status, "needs_verification");
  assert.ok(candidateUnconfirmed.timeFit.missingFields.includes("allAboard"));

  // When enabled and all-aboard cutoff is confirmed (17:00), confirm departure, pickup, return route, and fit
  const jan8Confirmed = await queryPortDayExcursionCatalog({
    portSlug: "cozumel",
    sailingId: "royal-caribbean-symphony-of-the-seas-2027-01-03",
    sailingDate: "2027-01-08",
    shipArrivalTime: "08:00",
    shipAllAboardTime: "17:00",
    shipDepartureTime: "18:00",
    partySize: 4,
    search: "103974P5",
  });
  assert.ok(jan8Confirmed);
  const cozumelCandidate = jan8Confirmed.tours[0];
  assert.equal(cozumelCandidate.productCode, "103974P5");
  assert.equal(cozumelCandidate.optionCode, "TG1");
  assert.equal(cozumelCandidate.timeFit.status, "fits");
  assert.equal(cozumelCandidate.timeFit.fitsSailing, true);
  assert.equal(cozumelCandidate.timeFit.selectedOptionCode, "TG1");
  assert.equal(cozumelCandidate.timeFit.selectedDepartureTime, "10:00");
  assert.deepEqual(cozumelCandidate.timeFit.availableDepartureTimes, ["10:00", "12:00", "14:00"]);
  assert.deepEqual(cozumelCandidate.timeFit.fittingDepartureTimes, ["10:00"]);
  assert.deepEqual(cozumelCandidate.timeFit.tooLateDepartureTimes, ["12:00", "14:00"]);
  assert.equal(cozumelCandidate.timeFit.checkInCutoffMinutes, 10);
  assert.equal(cozumelCandidate.timeFit.latestCheckInTime, "09:50");
  assert.equal(cozumelCandidate.timeFit.leavePierByTime, "09:45");
  assert.equal(
    cozumelCandidate.timeFit.meetingPointName,
    "Cozumel Tours office next to the tequila store at Marina ASIPONA Cozumel (Formerly Known as Marina Fonatur, Google Place ChIJhUJKipFXTo8RVdFGMuytpuI)"
  );
  assert.equal(cozumelCandidate.timeFit.pierToMeetingMinutes, 5);
  assert.equal(cozumelCandidate.timeFit.meetingToPierMinutes, 5);
  assert.equal(cozumelCandidate.timeFit.roundTripTransferMinutes, 10);
  assert.equal(cozumelCandidate.timeFit.durationMinutes, 240);
  assert.equal(cozumelCandidate.timeFit.tourEndTime, "14:00");
  assert.equal(cozumelCandidate.timeFit.estimatedBackAtPierTime, "14:05");
  assert.equal(cozumelCandidate.timeFit.bufferBeforeAllAboardMinutes, 175);
  assert.equal(cozumelCandidate.timeFit.bufferBeforeShipDepartureMinutes, 235);

  // 3c. Read-only live availability for the group (partySize=8) returns approved affiliate links and marine fee metadata without creating checkout records
  const liveAvail = await verifyLiveExcursionAvailability({
    portSlug: "cozumel",
    productCode: "103974P5",
    optionCode: "TG1",
    date: "2027-01-08",
    departureTime: "10:00",
    partySize: 8,
  });
  assert.ok(liveAvail.exactProductUrl.includes("d632-103974P5"));
  assert.ok(liveAvail.exactProductUrl.includes("pid=P00306962"));
  assert.ok(liveAvail.exactProductUrl.includes("mcid=42383"));
  assert.equal(liveAvail.mandatoryDestinationFee?.perPersonUsd, 11);
  assert.equal(liveAvail.mandatoryDestinationFee?.totalForPartyUsd, 88);
  assert.equal(liveAvail.mandatoryDestinationFee?.combinedTripTotalUsd, null);

  // 3d. Missing cutoff or mismatched option stops prepared handoff
  const stoppedMissingCutoff = await preparePortDayTourCheckout({
    portSlug: "cozumel",
    productCode: "103974P5",
    optionCode: "TG1",
    date: "2027-01-08",
    departureTime: "10:00",
    partySize: 4,
    sailingId: "royal-caribbean-symphony-of-the-seas-2027-01-03",
    shipArrivalTime: "08:00",
    // shipAllAboardTime omitted -> scheduled call has unconfirmed cutoff -> port_estimate -> stops handoff
    travelerApprovedCheckout: true,
    idempotencyKey: `qa-cozumel-missing-cutoff-${Date.now()}`,
    isQaTraffic: true,
  });
  assert.equal(stoppedMissingCutoff.ok, false);
  assert.equal(stoppedMissingCutoff.errorCode, "SAILING_FIT_NOT_VERIFIED");
  assert.equal(stoppedMissingCutoff.outboundAffiliateUrl, null);
  assert.equal(stoppedMissingCutoff.durableRecordCount, 0);

  const stoppedMismatchedOption = await preparePortDayTourCheckout({
    portSlug: "cozumel",
    productCode: "103974P5",
    optionCode: "TG999",
    date: "2027-01-08",
    departureTime: "10:00",
    partySize: 4,
    sailingId: "royal-caribbean-symphony-of-the-seas-2027-01-03",
    shipArrivalTime: "08:00",
    shipAllAboardTime: "17:00",
    travelerApprovedCheckout: true,
    idempotencyKey: `qa-cozumel-bad-option-${Date.now()}`,
    isQaTraffic: true,
  });
  assert.equal(stoppedMismatchedOption.ok, false);
  assert.equal(stoppedMismatchedOption.errorCode, "INVALID_CHECKOUT_SELECTION");
  assert.equal(stoppedMismatchedOption.outboundAffiliateUrl, null);
  assert.equal(stoppedMismatchedOption.durableRecordCount, 0);

  const stoppedMismatchedDeparture = await preparePortDayTourCheckout({
    portSlug: "cozumel",
    productCode: "103974P5",
    optionCode: "TG1",
    date: "2027-01-08",
    departureTime: "08:00",
    partySize: 4,
    sailingId: "royal-caribbean-symphony-of-the-seas-2027-01-03",
    shipArrivalTime: "08:00",
    shipAllAboardTime: "17:00",
    travelerApprovedCheckout: true,
    idempotencyKey: `qa-cozumel-bad-dep-${Date.now()}`,
    isQaTraffic: true,
  });
  assert.equal(stoppedMismatchedDeparture.ok, false);
  assert.equal(stoppedMismatchedDeparture.errorCode, "INVALID_CHECKOUT_SELECTION");
  assert.equal(stoppedMismatchedDeparture.outboundAffiliateUrl, null);
  assert.equal(stoppedMismatchedDeparture.durableRecordCount, 0);

  // 3e. Prepared checkout handoff + retry with same idempotencyKey creates 1 durable record
  const cozumelIdempotencyKey = `qa-cozumel-103974p5-tg1-20270108-${Date.now()}`;
  const firstCozumelHandoff = await preparePortDayTourCheckout({
    portSlug: "cozumel",
    productCode: "103974P5",
    optionCode: "TG1",
    date: "2027-01-08",
    departureTime: "10:00",
    partySize: 4,
    sailingId: "royal-caribbean-symphony-of-the-seas-2027-01-03",
    shipArrivalTime: "08:00",
    shipAllAboardTime: "17:00",
    shipDepartureTime: "18:00",
    travelerApprovedCheckout: true,
    idempotencyKey: cozumelIdempotencyKey,
    isQaTraffic: true,
    originatingSite: "cruisepromenade.com",
    surface: "cp_symphony_cozumel_2027_01_08",
  });
  assert.equal(firstCozumelHandoff.timeFit?.estimatedBackAtPierTime, "14:05");
  if (firstCozumelHandoff.ok) {
    assert.equal(firstCozumelHandoff.checkoutPrepared, true);
    assert.equal(firstCozumelHandoff.duplicateSubmission, false);
    assert.equal(firstCozumelHandoff.durableRecordCount, 1);
    assert.ok(firstCozumelHandoff.outboundAffiliateUrl?.includes("/d632-103974P5"));
    assert.ok(firstCozumelHandoff.outboundAffiliateUrl?.includes("pid=P00306962"));
    assert.ok(firstCozumelHandoff.outboundAffiliateUrl?.includes("mcid=42383"));
    assert.ok(firstCozumelHandoff.outboundAffiliateUrl?.includes("startDate=2027-01-08"));
    assert.ok(firstCozumelHandoff.outboundAffiliateUrl?.includes("numTravelers=4"));
    assert.deepEqual(
      firstCozumelHandoff.viatorCheckoutFieldCarryover?.preboundByViatorWebLanding,
      ["Exact Viator product 103974P5"]
    );

    const retryCozumelHandoff = await preparePortDayTourCheckout({
      portSlug: "cozumel",
      productCode: "103974P5",
      optionCode: "TG1",
      date: "2027-01-08",
      departureTime: "10:00",
      partySize: 4,
      sailingId: "royal-caribbean-symphony-of-the-seas-2027-01-03",
      shipArrivalTime: "08:00",
      shipAllAboardTime: "17:00",
      shipDepartureTime: "18:00",
      travelerApprovedCheckout: true,
      idempotencyKey: cozumelIdempotencyKey,
      isQaTraffic: true,
      originatingSite: "cruisepromenade.com",
      surface: "cp_symphony_cozumel_2027_01_08",
    });
    assert.equal(retryCozumelHandoff.ok, true);
    assert.equal(retryCozumelHandoff.duplicateSubmission, true);
    assert.equal(retryCozumelHandoff.durableRecordCount, 1);
    assert.equal(retryCozumelHandoff.handoffId, firstCozumelHandoff.handoffId);
    assert.equal(retryCozumelHandoff.clickId, firstCozumelHandoff.clickId);
    assert.equal(retryCozumelHandoff.outboundAffiliateUrl, firstCozumelHandoff.outboundAffiliateUrl);
  }

  const cozumelCarryover = buildViatorCarryoverTruth({
    productCode: "103974P5",
    optionCode: "TG1",
    optionTitle: "Cozumel Snorkel Tour: Palancar, Columbia and Cielo Reefs",
    startTime: "10:00",
    date: "2027-01-08",
    partySize: 4,
    groupTotalUsd: 260,
  });
  assert.equal(cozumelCarryover.carriesOverAutomatically.productCode, "103974P5");
  assert.equal(cozumelCarryover.carriesOverAutomatically.departureTimeOptionPreselectedOnViatorWeb, false);
  assert.equal(cozumelCarryover.requiresTravelerConfirmationOnViator.optionCode, "TG1");
  assert.equal(cozumelCarryover.requiresTravelerConfirmationOnViator.displayTime, "10:00 a.m.");

  // ---------------------------------------------------------------------------
  // 4. Both New Orleans paths (15200P6 / TG10 and 15200P1 / TG9) continue passing
  // ---------------------------------------------------------------------------
  const nola15200P6 = resolveApprovedCatalogCheckoutSpec({
    portSlug: "new-orleans",
    productCode: "15200P6",
    optionCode: "TG10",
    departureTime: "08:00",
  });
  assert.equal(nola15200P6.selectionApproved, true);

  const nola15200P1 = resolveApprovedCatalogCheckoutSpec({
    portSlug: "new-orleans",
    productCode: "15200P1",
    optionCode: "TG9",
    departureTime: "09:40",
  });
  assert.equal(nola15200P1.selectionApproved, true);

  // ---------------------------------------------------------------------------
  // 5. MCP and OpenAPI updated together
  // ---------------------------------------------------------------------------
  const mcpDocRes = await mcpGet(new Request("https://www.destinationcommandcenter.com/api/v1/mcp"));
  const mcpDoc = await mcpDocRes.json();
  const mcpSearchTool = mcpDoc.tools.find((t: any) => t.name === "dcc_search_port_excursions");
  const mcpCheckoutTool = mcpDoc.tools.find((t: any) => t.name === "dcc_prepare_tour_checkout");
  assert.ok(mcpSearchTool.description.includes(String(CONNECTED_CRUISE_PORT_COUNT)));
  assert.ok(mcpSearchTool.inputSchema.properties.datedBerth);
  assert.ok(mcpSearchTool.inputSchema.properties.transfers);
  assert.deepEqual(mcpCheckoutTool.inputSchema.properties.port.enum, ["new-orleans", "cozumel"]);
  assert.deepEqual(mcpCheckoutTool.inputSchema.properties.productCode.enum, [
    "15200P6",
    "15200P1",
    "103974P5",
  ]);
  assert.deepEqual(mcpCheckoutTool.inputSchema.properties.optionCode.enum, [
    "TG10",
    "TG9",
    "TG2",
    "TG6",
    "TG7",
    "TG1",
  ]);
  assert.ok(mcpDoc.runnableExamples.prepareCozumelTourCheckout);

  const openApiRes = await openApiGet();
  const openApiDoc = await openApiRes.json();
  const getExcursionsOp = openApiDoc.paths["/api/v1/cruise/port-day-excursions"].get;
  const postExcursionsOp = openApiDoc.paths["/api/v1/cruise/port-day-excursions"].post;
  assert.ok(getExcursionsOp.summary.includes(String(CONNECTED_CRUISE_PORT_COUNT)));
  assert.ok(getExcursionsOp.parameters.some((p: any) => p.name === "datedBerth"));
  assert.ok(getExcursionsOp.parameters.some((p: any) => p.name === "transfers"));
  assert.ok(
    getExcursionsOp.responses["200"].content["application/json"].examples
      .cozumelSymphonyOfTheSeasJan8NeedsVerificationUntilConfirmed
  );
  assert.ok(postExcursionsOp.description.includes("103974P5 / TG1"));
});




