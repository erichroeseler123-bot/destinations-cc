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

test("103.7: Shared handoff ledger records Cruise Promenade as originatingSite, attaches matching campaign and click_id with P00306962, and reports redirects, confirmed bookings, and earned commissions separately", async () => {
  const { createCommercialHandoff, getSharedHandoffLedgerSummary } = await import(
    "@/lib/dcc/commerce"
  );

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
  assert.equal(availPayload.timingFitIncluded, false);
  assert.equal(availPayload.seatCountStatus, "unknown");
  assert.equal(availPayload.seatAvailability.remainingSeats, null);
  assert.ok(!("timeFit" in availPayload));
});




