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
} from "@/lib/dcc/coverage/dccCoverageScheduler";
import {
  ST_THOMAS_PUBLIC_ANSWER_SUMMARY,
  evaluateStThomasPortDayScenario,
  parseStThomasScenarioFromSearchParams,
} from "@/lib/dcc/stThomasPortDayEngine";
import StThomasPortDayPlanner from "@/app/components/dcc/StThomasPortDayPlanner";
import {
  ingestApprovedFactsFromReviewDesk,
  ST_THOMAS_WINTER_CANDIDATE_BASELINE,
  NEW_ORLEANS_HOTEL_PICKUP_CANDIDATE_BASELINE,
  KETCHIKAN_PRESEASON_CANDIDATE_BASELINE,
} from "@/lib/dcc/research/approvedFactsFeed";
import { getPortAuthorityConfig } from "@/src/data/port-authority-config";

test("1. DCC Coverage pass report enforces 8:00 a.m. Mountain daily schedule, weekly calendar recheck, and human governance boundaries", () => {
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
  assert.deepEqual(ALASKA_PRESEASON_LEAD_WINDOW_WEEKS, {
    minWeeks: 8,
    maxWeeks: 12,
  });
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

test("2. Seasonal priority queue orders St. Thomas first for winter sailings, keeps New Orleans sales test moving, and puts Ketchikan/Skagway/Sitka in preseason prep", () => {
  const pass = evaluateDccCoveragePass({
    asOfDate: "2026-11-06",
    evaluatedAtIso: "2026-11-06T11:30:00.000Z",
    lastCalendarCheckedOn: "2026-11-06",
  });

  assert.equal(pass.activeBuildPort.portSlug, "st-thomas");
  assert.equal(pass.activeBuildPort.stage, "active_winter_build");
  assert.equal(pass.activeBuildPort.priorityRank, 1);
  assert.equal(pass.activeBuildPort.deliverables.publicAnswerReady, true);
  assert.equal(pass.activeBuildPort.deliverables.actualTripCheckerReady, true);
  assert.equal(
    pass.activeBuildPort.deliverables.freeOrSelfGuidedOptionReady,
    true,
  );
  assert.equal(
    pass.activeBuildPort.deliverables.unsupportedFactsMarkedUnknown,
    true,
  );

  const slugsInOrder = pass.orderedQueue.map((item) => item.portSlug);
  assert.deepEqual(slugsInOrder, [
    "st-thomas",
    "new-orleans",
    "ketchikan",
    "skagway",
    "sitka",
  ]);

  const nolaItem = pass.orderedQueue.find((i) => i.portSlug === "new-orleans");
  assert.ok(nolaItem);
  assert.equal(nolaItem.stage, "active_sales_test");

  const ketchikanItem = pass.orderedQueue.find(
    (i) => i.portSlug === "ketchikan",
  );
  assert.ok(ketchikanItem);
  assert.equal(ketchikanItem.stage, "preseason_preparation");
  assert.equal(
    ketchikanItem.coreTravelerQuestion,
    "Which excursions fit my sailing from Ward Cove versus a downtown berth?",
  );
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
  assert.equal(
    ketchikanItem.preseasonTrigger.isWithin8To12WeekBuildWindow,
    false,
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

  const passInWindow = evaluateDccCoveragePass({
    asOfDate: "2027-02-05",
    lastCalendarCheckedOn: "2027-02-05",
  });
  const ketchikanInWindow = passInWindow.orderedQueue.find(
    (i) => i.portSlug === "ketchikan",
  );
  assert.ok(ketchikanInWindow);
  assert.equal(ketchikanInWindow.stage, "active_build_ready");
  assert.equal(
    ketchikanInWindow.preseasonTrigger.isWithin8To12WeekBuildWindow,
    true,
  );
});

test("4. Weekly calendar recheck and daily 8:00 a.m. Mountain Time next-run schedule compute accurately", () => {
  assert.equal(isWeeklyCalendarRecheckDue("2026-11-06", "2026-11-06"), false);
  assert.equal(isWeeklyCalendarRecheckDue("2026-11-12", "2026-11-06"), false);
  assert.equal(isWeeklyCalendarRecheckDue("2026-11-13", "2026-11-06"), true);

  const nextRun = computeNextDailyMountainRun("2026-11-06");
  assert.equal(nextRun.nextRunDate, "2026-11-07");
  assert.equal(nextRun.nextDailyRunMountainIso, "2026-11-07T08:00:00-07:00");
  assert.equal(nextRun.nextDailyRunUtcIso, "2026-11-07T15:00:00.000Z");
});

test("5. Material changes queued from official sources on 2026-11-06 include source, SHA-256, date checked, recommendation impact, and remain unconfirmed for human review", async () => {
  assert.equal(QUEUED_MATERIAL_CHANGES_2026_11_06.length, 5);

  for (const item of QUEUED_MATERIAL_CHANGES_2026_11_06) {
    assert.equal(item.dateChecked, "2026-11-06");
    assert.match(item.sourceUrl, /^https:\/\//);
    assert.match(item.sourceSha256, /^[a-f0-9]{64}$/);
    assert.ok(item.whichRecommendationChanges.length > 25);
    assert.ok(item.humanDecisionRequired.length > 20);
    assert.equal(item.reviewStatus, "needs_confirmation");
    assert.equal(item.verified, false);
    assert.equal(item.verifiedOn, null);
    assert.equal(item.verifiedBy, null);
  }

  assert.equal(ST_THOMAS_WINTER_CANDIDATE_BASELINE.length, 3);
  assert.equal(NEW_ORLEANS_HOTEL_PICKUP_CANDIDATE_BASELINE.length, 1);
  assert.equal(KETCHIKAN_PRESEASON_CANDIDATE_BASELINE.length, 1);

  const stThomasFeed = await ingestApprovedFactsFromReviewDesk({
    portSlug: "st-thomas",
    skipLiveFetch: true,
  });
  assert.equal(stThomasFeed.total_evaluated, 3);
  assert.equal(stThomasFeed.verified_count, 0);
  for (const f of stThomasFeed.all_evaluated_facts) {
    assert.equal(f.verified, false);
    assert.equal(f.eligibility_status, "needs_confirmation");
    assert.equal(f.disqualification_reason, "unconfirmed_candidate");
  }
});

test("6. New Orleans hotel-pickup sales test status tracks Monteleone, Roosevelt, and Omni Riverfront with 75-minute Airboat Adventures pickup finding", () => {
  assert.equal(
    NEW_ORLEANS_HOTEL_PICKUP_SALES_TEST_STATUS.status,
    "active_moving",
  );
  assert.equal(
    NEW_ORLEANS_HOTEL_PICKUP_SALES_TEST_STATUS.officialSourcesCheckedOn,
    "2026-11-06",
  );
  assert.deepEqual(
    NEW_ORLEANS_HOTEL_PICKUP_SALES_TEST_STATUS.relatedDraftPrNumbers,
    [222],
  );

  const monteleone =
    NEW_ORLEANS_HOTEL_PICKUP_SALES_TEST_STATUS.conciergePilotProperties.find(
      (p) => p.propertySlug === "hotel-monteleone-nola",
    );
  assert.ok(monteleone);
  assert.equal(
    monteleone.airboatAdventuresNamedStopStatus,
    "confirmed_named_stop",
  );

  const omni =
    NEW_ORLEANS_HOTEL_PICKUP_SALES_TEST_STATUS.conciergePilotProperties.find(
      (p) => p.propertySlug === "omni-riverfront-nola",
    );
  assert.ok(omni);
  assert.equal(
    omni.airboatAdventuresNamedStopStatus,
    "adjacent_stop_confirmation_needed",
  );
});

test("7. St. Thomas actual-trip checker differentiates Havensight (WICO) vs. Crown Bay transfer math on a 5.5-hour port call", () => {
  // 5.5-hour (330m) port call: 08:00 to 13:30
  // WICO: 20m disembark + 15m check-in + 25m outbound + 180m activity + 25m return + 60m buffer = 325m (+5m margin -> tight_buffer)
  // Crown Bay: 20m disembark + 15m check-in + 35m outbound + 180m activity + 35m return + 60m buffer = 345m (-15m margin -> does_not_fit)
  const wicoShort = evaluateStThomasPortDayScenario({
    travelDate: "2026-11-18",
    arrivalDock: "havensight_wico",
    shipArrivalTime: "08:00",
    allAboardTime: "13:30",
    excursionFocus: "any_excursion_or_beach",
    adults: 2,
    childAges: [8],
  });

  const crownBayShort = evaluateStThomasPortDayScenario({
    travelDate: "2026-11-18",
    arrivalDock: "crown_bay",
    shipArrivalTime: "08:00",
    allAboardTime: "13:30",
    excursionFocus: "any_excursion_or_beach",
    adults: 2,
    childAges: [8],
  });

  const casCayWico = wicoShort.allOptions.find(
    (o) => o.optionId === "stt-opt-viecotours-cas-cay-kayak-snorkel",
  );
  const casCayCrown = crownBayShort.allOptions.find(
    (o) => o.optionId === "stt-opt-viecotours-cas-cay-kayak-snorkel",
  );
  assert.ok(casCayWico);
  assert.ok(casCayCrown);

  assert.equal(casCayWico.timing.totalRequiredMinutes, 325);
  assert.equal(casCayWico.timing.netMarginMinutes, 5);
  assert.equal(casCayWico.fitStatus, "tight_buffer");

  assert.equal(casCayCrown.timing.totalRequiredMinutes, 345);
  assert.equal(casCayCrown.timing.netMarginMinutes, -15);
  assert.equal(casCayCrown.fitStatus, "does_not_fit");

  // St. John via Red Hook ferry is eliminated on both 5.5h calls
  const stJohnWicoShort = wicoShort.allOptions.find(
    (o) => o.optionId === "stt-opt-st-john-trunk-bay-red-hook-ferry",
  );
  assert.ok(stJohnWicoShort);
  assert.equal(stJohnWicoShort.fitStatus, "does_not_fit");
});

test("8. St. Thomas actual-trip checker supports St. John on an 8.5h call, includes free/self-guided options, and marks unsupported facts as unknown", () => {
  const fullDay = evaluateStThomasPortDayScenario({
    travelDate: "2026-11-18",
    arrivalDock: "havensight_wico",
    shipArrivalTime: "08:00",
    allAboardTime: "16:30",
    excursionFocus: "any_excursion_or_beach",
    adults: 2,
    childAges: [9],
    mobilityLevel: "active_stairs_and_paddle",
  });

  const stJohnFull = fullDay.allOptions.find(
    (o) => o.optionId === "stt-opt-st-john-trunk-bay-red-hook-ferry",
  );
  assert.ok(stJohnFull);
  assert.notEqual(stJohnFull.fitStatus, "does_not_fit");
  assert.ok(stJohnFull.timing.netMarginMinutes > 0);

  // Verify free or self-guided options exist and compute party cost accurately
  const freeOrSelfGuided = fullDay.allOptions.filter(
    (o) => o.isFreeOrSelfGuided,
  );
  assert.ok(freeOrSelfGuided.length >= 3);

  const charlotteAmalieWalk = fullDay.allOptions.find(
    (o) => o.optionId === "stt-opt-charlotte-amalie-historic-self-guided",
  );
  assert.ok(charlotteAmalieWalk);
  assert.equal(charlotteAmalieWalk.category, "free_or_self_guided");
  assert.equal(charlotteAmalieWalk.estimatedCostTotalPartyUsd, 0);

  const lindberghBay = fullDay.allOptions.find(
    (o) => o.optionId === "stt-opt-lindbergh-emerald-beach-self-guided",
  );
  assert.ok(lindberghBay);
  assert.equal(lindberghBay.category, "free_or_self_guided");

  const magensBay = fullDay.allOptions.find(
    (o) => o.optionId === "stt-opt-magens-bay-self-guided-safari",
  );
  assert.ok(magensBay);
  assert.equal(magensBay.category, "free_or_self_guided");
  // 2 adults * $7 admission ($14) + 1 child age 9 ($0 admission) + 3 guests * $24 R/T safari taxi ($72) = $86
  assert.equal(magensBay.estimatedCostTotalPartyUsd, 86);

  // Verify unsupported facts are explicitly marked status: "unknown"
  assert.ok(fullDay.unknownFacts.length >= 4);
  for (const uf of fullDay.unknownFacts) {
    assert.equal(uf.status, "unknown");
    assert.ok(uf.summary.length > 15);
  }
});

test("9. St. Thomas URL search-params parser, PortAuthorityConfig, and SSR component render public answer, checker, free options, and unknown facts", () => {
  const parsed = parseStThomasScenarioFromSearchParams({
    dock: "crown_bay",
    arrival: "09:00",
    allAboard: "14:15",
    date: "2026-11-21",
    adults: "3",
    childAges: "6,10",
    mobility: "light_walking",
    focus: "free_or_self_guided_walk",
  });
  assert.equal(parsed.arrivalDock, "crown_bay");
  assert.equal(parsed.shipArrivalTime, "09:00");
  assert.equal(parsed.allAboardTime, "14:15");
  assert.equal(parsed.travelDate, "2026-11-21");
  assert.equal(parsed.adults, 3);
  assert.deepEqual(parsed.childAges, [6, 10]);
  assert.equal(parsed.mobilityLevel, "light_walking");
  assert.equal(parsed.excursionFocus, "free_or_self_guided_walk");

  const stThomasAuthority = getPortAuthorityConfig({
    slug: "st-thomas",
    name: "St. Thomas",
  });
  assert.equal(stThomasAuthority.isFallback, false);
  assert.match(stThomasAuthority.heroTitle, /St\. Thomas/);

  const sitkaAuthority = getPortAuthorityConfig({
    slug: "sitka",
    name: "Sitka",
  });
  assert.equal(sitkaAuthority.isFallback, false);
  assert.match(sitkaAuthority.heroTitle, /Sitka/);

  assert.ok(ST_THOMAS_PUBLIC_ANSWER_SUMMARY.directAnswer.length > 40);

  const html = renderToStaticMarkup(
    React.createElement(StThomasPortDayPlanner),
  );
  assert.match(html, /data-testid="st-thomas-port-day-checker"/);
  assert.match(html, /data-testid="st-thomas-verdict-banner"/);
  assert.match(html, /data-testid="st-thomas-unknown-facts"/);
  assert.match(html, /status: &quot;unknown&quot;/);
  assert.match(html, /Charlotte Amalie Historic District/);
});
