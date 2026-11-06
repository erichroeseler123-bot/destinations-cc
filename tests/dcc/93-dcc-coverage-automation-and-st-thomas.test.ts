import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import {
  ALASKA_PRESEASON_LEAD_WINDOW_WEEKS,
  QUEUED_MATERIAL_CHANGES_2026_11_06,
  NEW_ORLEANS_HOTEL_PICKUP_SALES_TEST_STATUS,
  evaluateAlaskaPreseasonTrigger,
  isWeeklyCalendarRecheckDue,
  computeNextDailyMountainRun,
  evaluateDccCoveragePass,
  queueMaterialChangesOnce,
  getLastSuccessfulDccCoverageCheck,
  resetDccCoverageCheckpointMemoryForTests,
} from "@/lib/dcc/coverage/dccCoverageScheduler";
import {
  ST_THOMAS_PUBLIC_ANSWER_SUMMARY,
  evaluateStThomasPortDayScenario,
  evaluateStJohnFerryLegsForSailing,
  parseStThomasScenarioFromSearchParams,
} from "@/lib/dcc/stThomasPortDayEngine";
import {
  FIVE_WINTER_RELEASE_PORT_SLUGS,
  evaluateAllFiveWinterPorts,
} from "@/lib/dcc/winterPorts/fivePortWinterReleaseEngine";
import { buildJanuary24SailingPreview } from "@/lib/dcc/winterPorts/january24SailingPreview";
import StThomasPortDayPlanner from "@/app/components/dcc/StThomasPortDayPlanner";
import WinterPortDayPlanner from "@/app/components/dcc/WinterPortDayPlanner";
import {
  ingestApprovedFactsFromReviewDesk,
  ST_THOMAS_WINTER_CANDIDATE_BASELINE,
  WINTER_FOUR_PORTS_CANDIDATE_BASELINE,
  NEW_ORLEANS_HOTEL_PICKUP_CANDIDATE_BASELINE,
  KETCHIKAN_PRESEASON_CANDIDATE_BASELINE,
} from "@/lib/dcc/research/approvedFactsFeed";
import { PILOT_VERIFIED_TOUR_RECORDS } from "@/lib/dcc/catalog/durableCatalogStore";
import { getHotelConciergeConfig } from "@/lib/dcc/catalog/hotelConfigs";
import { getPortAuthorityConfig } from "@/src/data/port-authority-config";

test("1. DCC Coverage pass report enforces 8:00 a.m. Mountain daily schedule, all 5 winter ports, weekly Alaska calendar recheck, and separate preview vs. production status", () => {
  resetDccCoverageCheckpointMemoryForTests();
  const pass = evaluateDccCoveragePass({
    asOfDate: "2026-11-06",
    evaluatedAtIso: "2026-11-06T11:30:00.000Z",
    lastCalendarCheckedOn: "2026-11-06",
  });

  assert.equal(pass.automationId, "dcc-coverage");
  assert.equal(pass.displayName, "DCC Coverage");
  assert.equal(pass.cronExpression, "CRON_TZ=America/Denver 0 8 * * *");
  assert.equal(pass.timeZone, "America/Denver");
  assert.equal(pass.calendarRecheckIntervalDays, 7);
  assert.deepEqual(pass.fiveWinterPorts, [
    "st-thomas",
    "nassau",
    "cozumel",
    "roatan",
    "grand-cayman",
  ]);
  assert.deepEqual(ALASKA_PRESEASON_LEAD_WINDOW_WEEKS, {
    minWeeks: 8,
    maxWeeks: 12,
  });

  // Separate Preview vs. Production status reporting
  assert.equal(pass.previewStatus.environment, "preview_branch_pr_223");
  assert.equal(pass.previewStatus.draftPrNumber, 223);
  assert.equal(pass.previewStatus.status, "ready_for_human_review");
  assert.equal(pass.productionStatus.environment, "production_main");
  assert.equal(
    pass.productionStatus.status,
    "unmodified_pending_human_approval",
  );
  assert.equal(
    pass.productionStatus.productionPublishingBlockedUntilHumanApproval,
    true,
  );

  assert.equal(
    pass.humanGovernanceBoundary.factApprovalWithHumanReviewer,
    true,
  );
  assert.equal(
    pass.humanGovernanceBoundary.productionPublishingWithHumanReviewer,
    true,
  );
  assert.equal(
    pass.humanGovernanceBoundary.commercialTermsWithHumanReviewer,
    true,
  );
  assert.equal(
    pass.humanGovernanceBoundary.singleExpansionDraftPrInProgress,
    true,
  );
  assert.equal(pass.humanGovernanceBoundary.autoApprovedFactsCount, 0);
});

test("2. Seasonal priority queue orders all 5 winter ports modeled on St. Thomas, keeps New Orleans sales test moving in parallel, and puts Ketchikan/Skagway/Sitka on weekly calendar checks", () => {
  const pass = evaluateDccCoveragePass({
    asOfDate: "2026-11-06",
    evaluatedAtIso: "2026-11-06T11:30:00.000Z",
    lastCalendarCheckedOn: "2026-11-06",
  });

  const slugsInOrder = pass.orderedQueue.map((item) => item.portSlug);
  assert.deepEqual(slugsInOrder, [
    "st-thomas",
    "nassau",
    "cozumel",
    "roatan",
    "grand-cayman",
    "new-orleans",
    "ketchikan",
    "skagway",
    "sitka",
  ]);

  // All 5 winter ports use St. Thomas as the model and have publicAnswer, tripChecker, freeOption, and unknown markers ready
  for (const winterSlug of FIVE_WINTER_RELEASE_PORT_SLUGS) {
    const item = pass.orderedQueue.find((i) => i.portSlug === winterSlug);
    assert.ok(item, `Missing winter port ${winterSlug}`);
    assert.equal(item.stage, "active_winter_build");
    assert.equal(item.modelPortSlug, "st-thomas");
    assert.deepEqual(item.bookingCriticalPriorities, [
      "pier_or_tender_timing",
      "pickup",
      "exact_departure",
    ]);
    assert.equal(item.deliverables.publicAnswerReady, true);
    assert.equal(item.deliverables.actualTripCheckerReady, true);
    assert.equal(item.deliverables.freeOrSelfGuidedOptionReady, true);
    assert.equal(item.deliverables.unsupportedFactsMarkedUnknown, true);
  }

  const nolaItem = pass.orderedQueue.find((i) => i.portSlug === "new-orleans");
  assert.ok(nolaItem);
  assert.equal(nolaItem.stage, "active_sales_test");

  const ketchikanItem = pass.orderedQueue.find(
    (i) => i.portSlug === "ketchikan",
  );
  assert.ok(ketchikanItem);
  assert.equal(ketchikanItem.stage, "preseason_preparation");
  assert.equal(
    ketchikanItem.preseasonTrigger.firstPublishedCallDate,
    "2027-04-26",
  );
  assert.equal(
    ketchikanItem.preseasonTrigger.fullBuildWindowOpensOn,
    "2027-02-01",
  );
  assert.equal(
    ketchikanItem.preseasonTrigger.fullBuildMustStartBy,
    "2027-03-01",
  );
});

test("3. Alaska preseason 8–12 week rule automatically promotes Ketchikan to active_build_ready when window opens on 2027-02-01", () => {
  const triggerNov2026 = evaluateAlaskaPreseasonTrigger({
    asOfDate: "2026-11-06",
    firstPublishedCallDate: "2027-04-26",
    applicable: true,
  });
  assert.equal(
    triggerNov2026.triggerVerdict,
    "preseason_prep_awaiting_window",
  );
  assert.equal(triggerNov2026.daysUntilFirstPublishedCall, 171);

  const triggerFeb2027 = evaluateAlaskaPreseasonTrigger({
    asOfDate: "2027-02-01",
    firstPublishedCallDate: "2027-04-26",
    applicable: true,
  });
  assert.equal(triggerFeb2027.daysUntilFirstPublishedCall, 84);
  assert.equal(triggerFeb2027.weeksUntilFirstPublishedCall, 12);
  assert.equal(triggerFeb2027.isWithin8To12WeekBuildWindow, true);
  assert.equal(
    triggerFeb2027.triggerVerdict,
    "start_full_alaska_build_now",
  );
});

test("4. Saves last successful check and queues each material change ONCE for human review", async () => {
  resetDccCoverageCheckpointMemoryForTests();

  const firstPass = evaluateDccCoveragePass({
    asOfDate: "2026-11-06",
    evaluatedAtIso: "2026-11-06T15:00:00.000Z",
    lastCalendarCheckedOn: "2026-11-06",
  });
  assert.equal(
    firstPass.newlyQueuedMaterialChangesCount,
    QUEUED_MATERIAL_CHANGES_2026_11_06.length,
  );
  assert.equal(firstPass.deduplicatedExistingMaterialChangesCount, 0);

  const savedCheckpoint = getLastSuccessfulDccCoverageCheck();
  assert.ok(savedCheckpoint);
  assert.equal(savedCheckpoint.lastSuccessfulCheckDate, "2026-11-06");
  assert.equal(
    savedCheckpoint.lastSuccessfulCheckAtIso,
    "2026-11-06T15:00:00.000Z",
  );
  assert.deepEqual(savedCheckpoint.fiveWinterPortsChecked, [
    "st-thomas",
    "nassau",
    "cozumel",
    "roatan",
    "grand-cayman",
  ]);

  // Second run with the same changes must queue 0 new items (each material change queued once)
  const secondPass = evaluateDccCoveragePass({
    asOfDate: "2026-11-06",
    evaluatedAtIso: "2026-11-06T16:00:00.000Z",
    lastCalendarCheckedOn: "2026-11-06",
  });
  assert.equal(secondPass.newlyQueuedMaterialChangesCount, 0);
  assert.equal(
    secondPass.deduplicatedExistingMaterialChangesCount,
    QUEUED_MATERIAL_CHANGES_2026_11_06.length,
  );

  // Direct deduplication helper check with duplicate entries
  const dupResult = queueMaterialChangesOnce(
    [
      ...QUEUED_MATERIAL_CHANGES_2026_11_06,
      ...QUEUED_MATERIAL_CHANGES_2026_11_06,
    ],
    [],
  );
  assert.equal(
    dupResult.newlyQueuedChanges.length,
    QUEUED_MATERIAL_CHANGES_2026_11_06.length,
  );
  assert.equal(
    dupResult.alreadyQueuedChanges.length,
    QUEUED_MATERIAL_CHANGES_2026_11_06.length,
  );

  assert.equal(ST_THOMAS_WINTER_CANDIDATE_BASELINE.length, 4);
  assert.equal(WINTER_FOUR_PORTS_CANDIDATE_BASELINE.length, 4);
  assert.equal(NEW_ORLEANS_HOTEL_PICKUP_CANDIDATE_BASELINE.length, 2);
  assert.equal(KETCHIKAN_PRESEASON_CANDIDATE_BASELINE.length, 1);

  const stThomasFeed = await ingestApprovedFactsFromReviewDesk({
    portSlug: "st-thomas",
    skipLiveFetch: true,
  });
  assert.equal(stThomasFeed.total_evaluated, 4);
  assert.equal(stThomasFeed.verified_count, 0);
});

test("5. St. Thomas keeps 5199KSML and 5199P27 strictly separate and matches each tour's exact duration, pickup, price, and checkout URL", () => {
  const rec5199ksml = PILOT_VERIFIED_TOUR_RECORDS.find(
    (r) => r.tourId === "dcc:tour:viator:5199KSML",
  );
  const rec5199p27 = PILOT_VERIFIED_TOUR_RECORDS.find(
    (r) => r.tourId === "dcc:tour:viator:5199P27",
  );
  assert.ok(rec5199ksml);
  assert.ok(rec5199p27);

  assert.equal(rec5199ksml.providerProductCode, "5199KSML");
  assert.equal(rec5199ksml.durationMinutes, 150);
  assert.equal(rec5199ksml.fromPriceCents, 8900);
  assert.equal(rec5199ksml.pickupFulfillmentType, "self_drive");
  assert.equal(rec5199ksml.hasHotelPickup, false);
  assert.match(rec5199ksml.bookingUrl, /d965-5199KSML/);

  assert.equal(rec5199p27.providerProductCode, "5199P27");
  assert.equal(rec5199p27.durationMinutes, 180);
  assert.equal(rec5199p27.fromPriceCents, 9900);
  assert.equal(rec5199p27.pickupFulfillmentType, "self_drive");
  assert.equal(rec5199p27.hasHotelPickup, false);
  assert.match(rec5199p27.bookingUrl, /d965-5199P27/);

  const evalStt = evaluateStThomasPortDayScenario({
    travelDate: "2027-01-28",
    arrivalDock: "havensight_wico",
    shipArrivalTime: "08:00",
    allAboardTime: "16:30",
  });

  const optKsml = evalStt.allOptions.find((o) => o.productCode === "5199KSML");
  const optP27 = evalStt.allOptions.find((o) => o.productCode === "5199P27");
  assert.ok(optKsml);
  assert.ok(optP27);
  assert.notEqual(optKsml.optionId, optP27.optionId);

  assert.equal(optKsml.timing.activityDurationMinutes, 150);
  assert.equal(optKsml.pickupMode, "self_drive");
  assert.equal(optKsml.listingPriceUsd, 89);
  assert.match(optKsml.checkoutUrl ?? "", /d965-5199KSML/);

  assert.equal(optP27.timing.activityDurationMinutes, 180);
  assert.equal(optP27.pickupMode, "self_drive");
  assert.equal(optP27.listingPriceUsd, 99);
  assert.match(optP27.checkoutUrl ?? "", /d965-5199P27/);
});

test("6. St. Thomas stays main destination, offers St. John as a day-trip choice when both ferry legs fit, and shows 'Needs confirmation' where post-October 31 return leg is unresolved", () => {
  // 8.5h winter call on 2027-01-28 (post-October 31): both legs fit, return leg is unresolved -> "Needs confirmation"
  const jan28Eval = evaluateStThomasPortDayScenario({
    travelDate: "2027-01-28",
    arrivalDock: "havensight_wico",
    shipArrivalTime: "08:00",
    allAboardTime: "16:30",
  });

  assert.equal(jan28Eval.mainDestination, "st-thomas");
  assert.equal(jan28Eval.stJohnDayTripChoice.mainDestination, "st-thomas");
  assert.equal(jan28Eval.stJohnDayTripChoice.dayTripDestination, "st-john");
  assert.equal(jan28Eval.stJohnDayTripChoice.bothFerryLegsFit, true);
  assert.equal(jan28Eval.stJohnDayTripChoice.offeredForSailing, true);
  assert.equal(
    jan28Eval.stJohnDayTripChoice.ferryLegs.temporaryVipaNoticeWindow
      .temporaryVipaNoticeEndedOn,
    "2026-10-31",
  );
  assert.equal(
    jan28Eval.stJohnDayTripChoice.ferryLegs.temporaryVipaNoticeWindow
      .isPastTemporaryNoticeEndDate,
    true,
  );
  assert.equal(
    jan28Eval.stJohnDayTripChoice.ferryLegs.returnLeg.returnLegStatus,
    "unresolved_needs_confirmation",
  );
  assert.equal(jan28Eval.stJohnDayTripChoice.fitBadgeLabel, "Needs confirmation");

  // Short 5.5h call: both ferry legs do NOT fit -> St. John day-trip NOT offered
  const shortCallFerry = evaluateStJohnFerryLegsForSailing({
    travelDate: "2027-01-28",
    shipArrivalTime: "08:00",
    allAboardTime: "13:30",
    arrivalDock: "havensight_wico",
  });
  assert.equal(shortCallFerry.bothFerryLegsFit, false);
  assert.equal(shortCallFerry.offerAsDayTripChoice, false);
});

test("7. New Orleans sales test records Airboat Adventures 75-min pickup window separately from Jean Lafitte, leaves Omni Riverfront unconfirmed, and keeps Monteleone pending operator terms and hotel approval", () => {
  const offers =
    NEW_ORLEANS_HOTEL_PICKUP_SALES_TEST_STATUS.separateOperatorPickupOffers;
  assert.equal(offers.strictlySeparated, true);
  assert.equal(offers.airboatAdventures.pickupWindowMinutesPrior, 75);
  assert.equal(offers.airboatAdventures.roundTripShuttleFeePerPersonUsd, 30);
  assert.equal(
    offers.airboatAdventures.officialSourceUrl,
    "https://airboatadventures.com/pickup-locations/",
  );
  assert.equal(offers.jeanLafitteSwampTours.pickupWindowMinutesPrior, 45);
  assert.deepEqual(offers.jeanLafitteSwampTours.tourIds, [
    "dcc:tour:fh:jeanlafitteswamptour:763318",
  ]);

  const monteleone = getHotelConciergeConfig("hotel-monteleone-nola");
  assert.ok(monteleone);
  assert.equal(
    monteleone.placementApprovalStatus,
    "pending_operator_terms_and_hotel_approval",
  );
  assert.equal(monteleone.operatorTermsApproved, false);
  assert.equal(monteleone.hotelPlacementApproved, false);
  assert.equal(
    Object.keys(monteleone.operatorPickupProfiles ?? {}).length,
    2,
  );

  const omni = getHotelConciergeConfig("omni-riverfront-nola");
  assert.ok(omni);
  assert.equal(omni.placementApprovalStatus, "unconfirmed_pickup_stop");
  for (const profile of Object.values(omni.operatorPickupProfiles ?? {})) {
    assert.equal(profile.pickupStatusForProperty, "unconfirmed");
  }
});

test("8. All five winter release ports evaluate deterministically and January 24 sailing preview returns Nassau + St. Thomas options", () => {
  const allFive = evaluateAllFiveWinterPorts();
  for (const slug of FIVE_WINTER_RELEASE_PORT_SLUGS) {
    const res = allFive[slug];
    assert.ok(res);
    assert.equal(res.portSlug, slug);
    assert.ok(res.recommendedOptions.length >= 3);
    assert.ok(res.allOptions.some((o) => o.isFreeOrSelfGuided));
    assert.ok(res.unknownFacts.length >= 1);
    assert.equal(res.commercialNeutrality.commercialWeightAppliedToRanking, 0);
  }

  // Cozumel disqualifies 12h Chichen Itza mainland tour (5885P231) on 9h cruise call
  const chichenOpt = allFive.cozumel.allOptions.find(
    (o) => o.productCode === "5885P231",
  );
  assert.ok(chichenOpt);
  assert.equal(chichenOpt.fitStatus, "does_not_fit");

  // January 24 sailing preview
  const jan24 = buildJanuary24SailingPreview();
  assert.equal(jan24.sailingDepartureDate, "2027-01-24");
  assert.equal(jan24.shareablePreviewPath, "/cruises/preview/january-24-sailing");
  assert.equal(jan24.calls.nassau.callDate, "2027-01-25");
  assert.equal(jan24.calls.stThomas.callDate, "2027-01-28");
  assert.equal(jan24.calls.stThomas.mainDestination, "st-thomas");
  assert.equal(
    jan24.calls.stThomas.separateViEcoToursListings.listing5199KSML
      .durationMinutes,
    150,
  );
  assert.equal(
    jan24.calls.stThomas.separateViEcoToursListings.listing5199KSML.priceUsd,
    89,
  );
  assert.equal(
    jan24.calls.stThomas.separateViEcoToursListings.listing5199P27
      .durationMinutes,
    180,
  );
  assert.equal(
    jan24.calls.stThomas.separateViEcoToursListings.listing5199P27.priceUsd,
    99,
  );
});

test("9. SSR components and PortAuthorityConfig render St. Thomas and the 4 expansion winter ports cleanly", () => {
  const parsed = parseStThomasScenarioFromSearchParams({
    dock: "crown_bay",
    arrival: "09:00",
    allAboard: "14:15",
    date: "2027-01-28",
    adults: "3",
    childAges: "6,10",
    mobility: "light_walking",
    focus: "free_or_self_guided_walk",
  });
  assert.equal(parsed.arrivalDock, "crown_bay");
  assert.equal(parsed.travelDate, "2027-01-28");

  for (const slug of FIVE_WINTER_RELEASE_PORT_SLUGS) {
    const auth = getPortAuthorityConfig({ slug, name: slug });
    assert.equal(auth.isFallback, false, `Expected non-fallback config for ${slug}`);
  }

  assert.ok(ST_THOMAS_PUBLIC_ANSWER_SUMMARY.directAnswer.length > 40);

  const sttHtml = renderToStaticMarkup(
    React.createElement(StThomasPortDayPlanner),
  );
  assert.match(sttHtml, /data-testid="st-thomas-port-day-checker"/);
  assert.match(sttHtml, /data-testid="st-john-ferry-leg-status-banner"/);
  assert.match(sttHtml, /5199KSML/);
  assert.match(sttHtml, /5199P27/);
  assert.match(sttHtml, /Needs confirmation/);

  const nassauHtml = renderToStaticMarkup(
    React.createElement(WinterPortDayPlanner, { portSlug: "nassau" }),
  );
  assert.match(nassauHtml, /data-testid="nassau-port-day-checker"/);
  assert.match(nassauHtml, /70706P11/);
});

test("10. INDY-2027-01-24 drives recommendations, saves, totals, and checkout strictly from verified port calls, blocks off-itinerary additions, withholds checkout when all-aboard or last-tender is missing, and resolves Jean Lafitte 763318 pickup addresses", async () => {
  const {
    evaluateWinterSailingPlan,
    runWinterAttributionReplayAndNolaStatusTrace,
  } = await import("../../lib/dcc/winterExcursionPlanner");

  const indyDefault = await evaluateWinterSailingPlan({
    planCode: "INDY-2027-01-24",
    adults: 2,
    surface: "dcc",
    enableShortlistLiveCheck: false,
  });
  assert.deepEqual(indyDefault.sailingPortCallSlugs, [
    "nassau",
    "san-juan",
    "st-thomas",
  ]);
  // Nassau 254526P1 ($338) is confirmed bookable; St. Thomas 7452P2 ($238) is saved as Needs confirmation (recommendation withheld)
  assert.equal(indyDefault.savedPortsSummary.combinedPartyTotalCents, 33800);
  assert.equal(indyDefault.offItineraryBlocked, false);

  const sanJuanCall = indyDefault.sailingPortCalls.find(
    (p) => p.portSlug === "san-juan",
  );
  assert.ok(sanJuanCall);
  assert.equal(sanJuanCall.matchedToursCount, 0);
  assert.ok(sanJuanCall.noMatchedToursReason);

  // St. Thomas 7452P2 meets at Marriott's Frenchman's Cove Dock with 30m check-in + independent travel both ways from actual cruise berth -> Needs confirmation
  const sttSaved = indyDefault.savedPortsSummary.savedSelections.find(
    (s) => s.portSlug === "st-thomas",
  );
  const sttCall = indyDefault.sailingPortCalls.find(
    (p) => p.portSlug === "st-thomas",
  );
  assert.ok(sttSaved);
  assert.ok(sttCall);
  assert.equal(sttSaved.providerProductCode, "7452P2");
  assert.equal(sttSaved.suitability, "needs_confirmation");
  assert.equal(sttCall.cruiseFitRecommendationWithheld, true);
  assert.equal(sttCall.checkoutEligible, false);
  assert.equal(sttSaved.trackedViatorCheckoutUrl, null);
  assert.match(sttSaved.pickupBadgeLabel, /Frenchman/i);

  // Off-itinerary injection attempt (Cozumel 5553274P1 on INDY-2027-01-24)
  const indyBlocked = await evaluateWinterSailingPlan({
    planCode: "INDY-2027-01-24",
    adults: 2,
    surface: "dcc",
    enableShortlistLiveCheck: false,
    savedPortOverrides: {
      cozumel: "dcc:tour:viator:5553274P1",
      nassau: "dcc:tour:viator:5553274P1",
    },
  });
  assert.equal(indyBlocked.offItineraryBlocked, true);
  assert.equal(indyBlocked.rejectedOffItineraryRequests.length, 2);
  assert.equal(indyBlocked.savedPortsSummary.combinedPartyTotalCents, 33800);
  assert.deepEqual(
    indyBlocked.savedPortsSummary.savedSelections.map((s) => s.portSlug),
    ["nassau", "st-thomas"],
  );

  // Missing all-aboard withholds cruise-fit booking recommendation
  const indyMissingAllAboard = await evaluateWinterSailingPlan({
    planCode: "INDY-2027-01-24",
    adults: 2,
    surface: "dcc",
    enableShortlistLiveCheck: false,
    missingAllAboardPorts: ["nassau"],
  });
  const nassauMissing = indyMissingAllAboard.sailingPortCalls.find(
    (p) => p.portSlug === "nassau",
  );
  assert.ok(nassauMissing);
  assert.equal(nassauMissing.allAboardStatus, "missing_needs_confirmation");
  assert.equal(nassauMissing.cruiseFitRecommendationWithheld, true);
  assert.equal(nassauMissing.checkoutEligible, false);
  const nassauSavedMissing =
    indyMissingAllAboard.savedPortsSummary.savedSelections.find(
      (s) => s.portSlug === "nassau",
    );
  assert.ok(nassauSavedMissing);
  assert.equal(nassauSavedMissing.suitability, "needs_confirmation");
  assert.equal(nassauSavedMissing.trackedViatorCheckoutUrl, null);

  // Missing last-tender on Grand Cayman (WESTERN-2027-01-24) withholds checkout
  const westernMissingTender = await evaluateWinterSailingPlan({
    planCode: "WESTERN-2027-01-24",
    adults: 2,
    surface: "dcc",
    enableShortlistLiveCheck: false,
    missingLastTenderPorts: ["grand-cayman"],
  });
  const gcMissing = westernMissingTender.sailingPortCalls.find(
    (p) => p.portSlug === "grand-cayman",
  );
  assert.ok(gcMissing);
  assert.equal(gcMissing.lastTenderStatus, "missing_needs_confirmation");
  assert.equal(gcMissing.cruiseFitRecommendationWithheld, true);
  assert.equal(gcMissing.checkoutEligible, false);
  const gcSavedMissing =
    westernMissingTender.savedPortsSummary.savedSelections.find(
      (s) => s.portSlug === "grand-cayman",
    );
  assert.ok(gcSavedMissing);
  assert.equal(gcSavedMissing.suitability, "needs_confirmation");
  assert.equal(gcSavedMissing.trackedViatorCheckoutUrl, null);

  // Eligible Nassau 254526P1 checkout URL carries date, adults, optionCode, departureTime, and placementId
  const nassauEligible = indyDefault.savedPortsSummary.savedSelections.find(
    (s) => s.portSlug === "nassau",
  );
  assert.ok(nassauEligible?.trackedViatorCheckoutUrl);
  const decodedNassauTarget = decodeURIComponent(
    nassauEligible.trackedViatorCheckoutUrl,
  );
  assert.match(decodedNassauTarget, /date=2027-01-25/);
  assert.match(decodedNassauTarget, /adults=2/);
  assert.match(decodedNassauTarget, /optionCode=TG4/);
  assert.match(decodedNassauTarget, /departureTime=10%3A00/);
  assert.match(decodedNassauTarget, /placementId=fp-cp-winter-excursion-planner/);

  // Jean Lafitte 763318 pickup address resolution, already-approved first-party placement, & multi-guest isolation
  const replayRes = runWinterAttributionReplayAndNolaStatusTrace();
  assert.equal(replayRes.secondDeliveryReplay.replayIgnored, true);
  assert.equal(replayRes.trackingCampaignTag, replayRes.clickId);
  assert.match(replayRes.clickId, /^clk_qa_[0-9a-f]{20}$/);
  assert.equal(
    replayRes.multiGuestCheckoutIntentIsolation.separateReferralIdsIssued,
    true,
  );
  assert.equal(
    replayRes.multiGuestCheckoutIntentIsolation.separateLedgerRecordsCreated,
    true,
  );
  assert.equal(
    replayRes.multiGuestCheckoutIntentIsolation.qaReplayAttemptAgainstGuest1.matched,
    false,
  );
  assert.equal(
    replayRes.multiGuestCheckoutIntentIsolation.qaReplayAttemptAgainstGuest2.matched,
    false,
  );
  assert.equal(
    replayRes.multiGuestCheckoutIntentIsolation.qaReplayAttemptAgainstGuest1.guest1RecordUnchanged,
    true,
  );
  assert.equal(
    replayRes.multiGuestCheckoutIntentIsolation.qaReplayAttemptAgainstGuest2.guest2RecordUnchanged,
    true,
  );
  const res763318 =
    replayRes.newOrleansParallelStatus.jeanLafitte763318PickupAddressResolution;
  assert.match(res763318.hotelMonteleoneShuttleOptionAddress, /214 Royal St/);
  assert.match(
    res763318.selfDriveBaratariaDockOptionAddress,
    /6601 Leo Kerner Lafitte Pkwy/,
  );
  assert.match(res763318.why810ToulouseAppearedInNotes, /810 Toulouse St/);
  assert.equal(
    replayRes.newOrleansParallelStatus.alreadyApprovedFirstPartyPlacement
      .placementId,
    "fp-wno-swamp-tours",
  );
  assert.equal(
    replayRes.newOrleansParallelStatus.alreadyApprovedFirstPartyPlacement
      .title,
    "New Orleans Swamp Tour Boat Adventure with Transportation",
  );
});

test("11. Each checkout intent gets its own referral ID (separate IDs for QA), two guests choosing the same offer get separate ledger records, and a QA test replay cannot change either production record", async () => {
  const { GET: adsClickGet } = await import("../../app/api/v1/ads/click/route");
  const {
    getFunnelMetricsReport,
    getOpaqueClickAttributionById,
    reconcilePartnerWebhookByClickId,
    resetOpaqueAttributionLedgerForTests,
  } = await import("../../lib/dcc/commerce/opaqueAttributionLedger");
  const { evaluateWinterSailingPlan } = await import(
    "../../lib/dcc/winterExcursionPlanner"
  );

  resetOpaqueAttributionLedgerForTests();

  // QA evaluation uses clk_qa_<20hex> referral IDs
  const qaIndyPlan = await evaluateWinterSailingPlan({
    planCode: "INDY-2027-01-24",
    adults: 2,
    surface: "cruisepromenade",
    enableShortlistLiveCheck: false,
    isTest: true,
  });

  const qaNassauSaved = qaIndyPlan.savedPortsSummary.savedSelections.find(
    (s) => s.portSlug === "nassau",
  );
  assert.ok(qaNassauSaved?.clickId);
  assert.match(qaNassauSaved.clickId, /^clk_qa_[0-9a-f]{20}$/);
  assert.ok(qaNassauSaved.trackedViatorCheckoutUrl);

  // Follow the QA signed checkout handoff via GET /api/v1/ads/click
  const validClickReq = new Request(
    `https://destinationcommandcenter.com${qaNassauSaved.trackedViatorCheckoutUrl}&isTest=true`,
  );
  const validClickRes = await adsClickGet(validClickReq);
  assert.equal(validClickRes.status, 302);
  const redirectLocation = validClickRes.headers.get("location") || "";
  const redirectUrl = new URL(redirectLocation);
  assert.equal(redirectUrl.hostname, "www.viator.com");
  assert.equal(
    redirectUrl.searchParams.get("campaign"),
    qaNassauSaved.clickId,
    "Viator campaign parameter must equal the exact server-issued QA referral ID",
  );
  assert.equal(redirectUrl.searchParams.get("click_id"), qaNassauSaved.clickId);

  // Two production guests choosing the EXACT SAME offer (Nassau 254526P1 Option TG4) get separate clk_<24hex> referral IDs and separate ledger records
  const guest1ClickRes = await adsClickGet(
    new Request(
      "https://destinationcommandcenter.com/api/v1/ads/click?sailing=INDY-2027-01-24&offer=254526P1&option=TG4&placementId=fp-cp-winter-excursion-planner&property=nassau&date=2027-01-25&adults=2&departureTime=10:00",
    ),
  );
  const guest2ClickRes = await adsClickGet(
    new Request(
      "https://destinationcommandcenter.com/api/v1/ads/click?sailing=INDY-2027-01-24&offer=254526P1&option=TG4&placementId=fp-cp-winter-excursion-planner&property=nassau&date=2027-01-25&adults=2&departureTime=10:00",
    ),
  );
  assert.equal(guest1ClickRes.status, 302);
  assert.equal(guest2ClickRes.status, 302);

  const guest1RefId = guest1ClickRes.headers.get("x-dcc-referral-id") || "";
  const guest2RefId = guest2ClickRes.headers.get("x-dcc-referral-id") || "";
  assert.match(guest1RefId, /^clk_[0-9a-f]{24}$/);
  assert.match(guest2RefId, /^clk_[0-9a-f]{24}$/);
  assert.notEqual(
    guest1RefId,
    guest2RefId,
    "Two production guests choosing the same offer must receive distinct referral IDs",
  );

  // Confirm Guest 1's booking in production
  const guest1Confirm = reconcilePartnerWebhookByClickId({
    campaignValue: guest1RefId,
    provider: "viator",
    providerBookingRef: "BR-PROD-GUEST1-254526P1",
    eventType: "BOOKING_CONFIRMED",
    grossRevenueUsd: 338.0,
    estimatedCommissionUsd: 27.04,
    paidCommissionUsd: null,
    currency: "USD",
    isTest: false,
  });
  assert.equal(guest1Confirm.matched, true);

  // Verify Guest 1 has 1 confirmed booking while Guest 2's separate ledger record remains untouched (0 confirmed bookings)
  const guest1BeforeReplay = getOpaqueClickAttributionById(guest1RefId);
  const guest2BeforeReplay = getOpaqueClickAttributionById(guest2RefId);
  assert.ok(guest1BeforeReplay);
  assert.ok(guest2BeforeReplay);
  assert.equal(guest1BeforeReplay.isTest, false);
  assert.equal(guest2BeforeReplay.isTest, false);
  assert.equal(guest1BeforeReplay.reconciledOutcomes.length, 1);
  assert.equal(guest2BeforeReplay.reconciledOutcomes.length, 0);

  // Attempt a QA test replay against Guest 1's and Guest 2's production referral IDs -> must be rejected and cannot mutate either production record
  const qaReplayAgainstGuest1 = reconcilePartnerWebhookByClickId({
    campaignValue: guest1RefId,
    provider: "viator",
    providerBookingRef: "TEST-REPLAY-ATTEMPT-GUEST1",
    eventType: "BOOKING_FULFILLED",
    grossRevenueUsd: 999.0,
    estimatedCommissionUsd: 99.9,
    paidCommissionUsd: 99.9,
    currency: "USD",
    isTest: true,
  });
  assert.equal(qaReplayAgainstGuest1.matched, false);
  assert.match(
    qaReplayAgainstGuest1.reason,
    /^QA_TEST_REPLAY_ISOLATED_FROM_PRODUCTION_RECORD:/,
  );

  const qaReplayAgainstGuest2 = reconcilePartnerWebhookByClickId({
    campaignValue: guest2RefId,
    provider: "viator",
    providerBookingRef: "TEST-REPLAY-ATTEMPT-GUEST2",
    eventType: "BOOKING_CONFIRMED",
    grossRevenueUsd: 338.0,
    estimatedCommissionUsd: 27.04,
    paidCommissionUsd: null,
    currency: "USD",
    isTest: true,
  });
  assert.equal(qaReplayAgainstGuest2.matched, false);
  assert.match(
    qaReplayAgainstGuest2.reason,
    /^QA_TEST_REPLAY_ISOLATED_FROM_PRODUCTION_RECORD:/,
  );

  // Prove neither Guest 1's nor Guest 2's ledger record changed
  const guest1AfterReplay = getOpaqueClickAttributionById(guest1RefId);
  const guest2AfterReplay = getOpaqueClickAttributionById(guest2RefId);
  assert.equal(guest1AfterReplay?.reconciledOutcomes.length, 1);
  assert.equal(guest1AfterReplay?.reconciliationState, "reconciled_webhook");
  assert.equal(guest2AfterReplay?.reconciledOutcomes.length, 0);
  assert.equal(guest2AfterReplay?.reconciliationState, "pending_partner_event");

  // Reject unapproved external host
  const evilHostReq = new Request(
    `https://destinationcommandcenter.com/api/v1/ads/click?clickId=${qaNassauSaved.clickId}&target=${encodeURIComponent("https://evil.example.com/phish")}`,
  );
  const evilHostRes = await adsClickGet(evilHostReq);
  assert.equal(evilHostRes.status, 403);
  const evilHostJson = await evilHostRes.json();
  assert.equal(evilHostJson.error, "UNAPPROVED_CHECKOUT_DESTINATION");

  // Reject unapproved Viator product not in catalog
  const unapprovedProductReq = new Request(
    `https://destinationcommandcenter.com/api/v1/ads/click?clickId=clk_111122223333444455556666&target=${encodeURIComponent("https://www.viator.com/tours/Fake/Unapproved/d1-999999P9")}`,
  );
  const unapprovedProductRes = await adsClickGet(unapprovedProductReq);
  assert.equal(unapprovedProductRes.status, 403);
  const unapprovedProductJson = await unapprovedProductRes.json();
  assert.equal(unapprovedProductJson.error, "UNAPPROVED_CHECKOUT_DESTINATION");

  // Reject off-itinerary offer on INDY-2027-01-24 (Cozumel 5553274P1)
  const offItineraryReq = new Request(
    `https://destinationcommandcenter.com/api/v1/ads/click?clickId=clk_111122223333444455556666&sailing=INDY-2027-01-24&offer=5553274P1&option=DEFAULT`,
  );
  const offItineraryRes = await adsClickGet(offItineraryReq);
  assert.equal(offItineraryRes.status, 403);
  const offItineraryJson = await offItineraryRes.json();
  assert.equal(offItineraryJson.error, "UNAPPROVED_CHECKOUT_DESTINATION");
  assert.equal(offItineraryJson.reason, "OFFER_NOT_ON_SAILING_ITINERARY");

  // Resolve WNO live Viator offer 15200P6 directly from approved offer without target param, minting a fresh QA referral ID
  const wnoClickReq = new Request(
    `https://www.welcometoneworleanstours.com/api/v1/ads/click?offer=15200P6&option=TG10&placementId=fp-wno-swamp-tours&property=hotel-monteleone-nola&date=2026-11-18&adults=2&departureTime=08:00&isTest=true`,
  );
  const wnoClickRes = await adsClickGet(wnoClickReq);
  assert.equal(wnoClickRes.status, 302);
  const wnoRefId = wnoClickRes.headers.get("x-dcc-referral-id") || "";
  assert.match(wnoRefId, /^clk_qa_[0-9a-f]{20}$/);
  const wnoRedirectUrl = new URL(wnoClickRes.headers.get("location") || "");
  assert.equal(wnoRedirectUrl.searchParams.get("campaign"), wnoRefId);
  assert.match(wnoRedirectUrl.pathname, /15200P6$/);

  // Reconcile labeled provider report sample via campaignValue = wnoRefId
  const confirmOut = reconcilePartnerWebhookByClickId({
    campaignValue: wnoRefId,
    provider: "viator",
    providerBookingRef: "TEST-VIATOR-WNO-15200P6-01",
    eventType: "BOOKING_CONFIRMED",
    grossRevenueUsd: 120.0,
    estimatedCommissionUsd: 9.6,
    paidCommissionUsd: null,
    currency: "USD",
    isTest: true,
  });
  assert.equal(confirmOut.matched, true);
  assert.equal(confirmOut.outcome.duplicateDelivery, false);

  const dupOut = reconcilePartnerWebhookByClickId({
    campaignValue: wnoRefId,
    provider: "viator",
    providerBookingRef: "TEST-VIATOR-WNO-15200P6-01",
    eventType: "BOOKING_CONFIRMED",
    grossRevenueUsd: 120.0,
    estimatedCommissionUsd: 9.6,
    paidCommissionUsd: null,
    currency: "USD",
    isTest: true,
  });
  assert.equal(dupOut.matched, true);
  assert.equal(dupOut.outcome.duplicateDelivery, true);

  let wnoFunnel = getFunnelMetricsReport({ placementId: "fp-wno-swamp-tours" });
  assert.equal(wnoFunnel.test.confirmedPaidBookings, 1);
  assert.equal(wnoFunnel.test.paidCommissionsCount, 0);
  assert.equal(wnoFunnel.test.estimatedUnsettledCommissionUsd, 9.6);
  assert.equal(wnoFunnel.test.settledReconciledCommissionUsd, 0);

  const settleOut = reconcilePartnerWebhookByClickId({
    campaignValue: wnoRefId,
    provider: "viator",
    providerBookingRef: "TEST-VIATOR-WNO-15200P6-01",
    eventType: "BOOKING_FULFILLED",
    grossRevenueUsd: 120.0,
    estimatedCommissionUsd: 9.6,
    paidCommissionUsd: 9.6,
    currency: "USD",
    isTest: true,
  });
  assert.equal(settleOut.matched, true);

  wnoFunnel = getFunnelMetricsReport({ placementId: "fp-wno-swamp-tours" });
  assert.equal(wnoFunnel.test.confirmedPaidBookings, 1);
  assert.equal(wnoFunnel.test.paidCommissionsCount, 1);
  assert.equal(wnoFunnel.test.settledReconciledCommissionUsd, 9.6);
  assert.equal(wnoFunnel.test.duplicateDeliveriesIgnored, 1);
  assert.equal(wnoFunnel.production.confirmedPaidBookings, 0);
});


