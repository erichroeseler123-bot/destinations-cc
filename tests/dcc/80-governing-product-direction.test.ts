import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextRequest } from "next/server";

import {
  deriveSupportedPlanningNotes,
  summarizeGuestFeedback,
  summarizeRecentReviews,
  type ThirdPartyReviewInput,
} from "@/lib/dcc/guestFeedback";
import TravelerTakeaways from "@/app/components/dcc/TravelerTakeaways";
import JuneauPortDayPlanner from "@/app/components/dcc/JuneauPortDayPlanner";
import TravelReferenceExperience from "@/app/components/dcc/TravelReferenceExperience";
import {
  evaluateCitationFreshness,
  evaluateNodeClaimDependencies,
  getBaseTravelReferenceNodeById,
} from "@/lib/dcc/travelReference";
import {
  buildJuneauScenarioQueryString,
  DEFAULT_JUNEAU_SCENARIO_INPUT,
  evaluateJuneauPortDayScenario,
  parseJuneauScenarioFromSearchParams,
  resolveJuneauTimezoneForDate,
} from "@/lib/dcc/juneauPortDayEngine";
import { GET as getLocationApi } from "@/app/api/location/[lat]/[lng]/route";
import {
  deleteFactualErrorReportByIdForTests,
  listFactualErrorReports,
  resetFactualErrorRateLimitsForTests,
  submitFactualErrorReport,
} from "@/lib/dcc/earthos/factualErrorReports";
import { POST as postFactualErrorReportRoute } from "@/app/api/public/factual-error-report/route";

const NOW = new Date("2026-10-25T16:00:00.000Z");

test("Proof 1: No page or component renders fake or template-generated guest reviews from product titles, categories, or aggregate ratings", () => {
  // 1a. Legacy summarizeGuestFeedback returns [] even when given suggestive product titles, categories, and high ratings
  const legacyResult = summarizeGuestFeedback({
    title: "Juneau Mendenhall Glacier Helicopter & Whale Watching VIP Small Group",
    description: "Scenic wildlife boat and glacier landing with hotel pickup",
    rating: 4.9,
    reviewCount: 450,
    durationMinutes: 240,
  });
  assert.deepEqual(
    legacyResult,
    [],
    "summarizeGuestFeedback must never synthesize review-like statements from product titles, descriptions, or aggregate ratings",
  );

  // 1b. Independently supported planning advice is explicitly labeled 'Planning Advice' and never presented as guest reviews
  const planningNotes = deriveSupportedPlanningNotes({
    durationMinutes: 300,
    pickupIncluded: true,
    freeCancellation: true,
  });
  assert.ok(planningNotes.length >= 3);
  for (const note of planningNotes) {
    assert.equal(note.label, "Planning Advice");
  }

  const renderedPlanningHtml = renderToStaticMarkup(
    React.createElement(TravelerTakeaways, {
      title: "Juneau Whale Watching",
      durationMinutes: 300,
      pickupIncluded: true,
      freeCancellation: true,
    }),
  );
  assert.match(renderedPlanningHtml, /Planning Advice/);
  assert.match(renderedPlanningHtml, /Recent reviews unavailable/i);
  assert.doesNotMatch(renderedPlanningHtml, /Guests consistently mention/i);
  assert.doesNotMatch(renderedPlanningHtml, /Travelers frequently highlight/i);

  // 1c. Verify app/tours/[id]/page.tsx and ViatorTourGrid.tsx do not contain fabricated rating/review defaults or 'Recommended by DCC' badges
  const tourPageSource = fs.readFileSync(
    path.join(process.cwd(), "app/tours/[id]/page.tsx"),
    "utf8",
  );
  assert.doesNotMatch(
    tourPageSource,
    /rating\s*\?\?\s*4\.8/,
    "Tour detail page must not fabricate a 4.8 rating default",
  );
  assert.doesNotMatch(
    tourPageSource,
    /reviewCount\s*\?\?\s*120/,
    "Tour detail page must not fabricate a 120 reviewCount default",
  );

  const tourGridSource = fs.readFileSync(
    path.join(process.cwd(), "app/components/dcc/ViatorTourGrid.tsx"),
    "utf8",
  );
  assert.doesNotMatch(
    tourGridSource,
    /Recommended by DCC/,
    "ViatorTourGrid must not badge commercial affiliate listings as 'Recommended by DCC'",
  );
});

test("Proof 2: Juneau Port-Day Decision Engine changes recommendations when port hours, dock/arrival, mobility, weather, or buffer assumptions change", () => {
  const juneauNode = getBaseTravelReferenceNodeById("juneau");

  // Scenario A: Standard 8.5-hour port call (08:00–16:30) at Downtown CT/AS Dock with clear/high ceiling
  const standardCall = evaluateJuneauPortDayScenario(
    {
      ...DEFAULT_JUNEAU_SCENARIO_INPUT,
      shipArrivalTime: "08:00",
      allAboardTime: "16:30",
      arrivalDock: "downtown_walkoff",
      weatherCondition: "clear_high_ceiling",
      mobilityLevel: "active_walking_3mi",
      returnBufferMinutes: 60,
    },
    { node: juneauNode, now: NOW },
  );

  const whaleStandard = standardCall.options.find(
    (o) => o.optionId === "jun-opt-auke-bay-whale-direct",
  )!;
  const comboWhaleMendenhallStandard = standardCall.options.find(
    (o) => o.optionId === "jun-opt-combo-whale-and-mendenhall",
  )!;
  const heliStandard = standardCall.options.find(
    (o) => o.optionId === "jun-opt-heli-icefield-walkabout",
  )!;

  assert.equal(whaleStandard.fitStatus, "fits_comfortably");
  assert.equal(comboWhaleMendenhallStandard.fitStatus, "fits_comfortably");
  assert.equal(heliStandard.fitStatus, "fits_comfortably");

  // Scenario B: Short 5.5-hour port call (07:00–12:30) at AJ Dock with 75-min return buffer
  // Whale + Mendenhall Combo requires more than the available window -> DOES NOT FIT.
  const shortAjCall = evaluateJuneauPortDayScenario(
    {
      ...DEFAULT_JUNEAU_SCENARIO_INPUT,
      shipArrivalTime: "07:00",
      allAboardTime: "12:30",
      arrivalDock: "aj_dock",
      returnBufferMinutes: 75,
      goalMode: "two_activity_combo",
    },
    { node: juneauNode, now: NOW },
  );

  const comboShort = shortAjCall.options.find(
    (o) => o.optionId === "jun-opt-combo-whale-and-mendenhall",
  )!;
  assert.equal(
    comboShort.fitStatus,
    "does_not_fit",
    "Whale + Mendenhall combo must not fit on a short 5.5h AJ Dock call",
  );
  assert.ok(comboShort.timing.netMarginMinutes < 0);

  // Scenario C: Low ceiling / fog / heavy rain keeps time fit distinct (fits_comfortably with 145m margin) while flagging traveler_low_ceiling_assumption and ranking marine whale watching ahead of flightseeing
  const lowCeilingCall = evaluateJuneauPortDayScenario(
    {
      ...DEFAULT_JUNEAU_SCENARIO_INPUT,
      shipArrivalTime: "08:00",
      allAboardTime: "16:30",
      arrivalDock: "downtown_walkoff",
      weatherCondition: "low_ceiling_rain_fog",
      mobilityLevel: "active_walking_3mi",
    },
    { node: juneauNode, now: NOW },
  );
  const heliLowCeiling = lowCeilingCall.options.find(
    (o) => o.optionId === "jun-opt-heli-icefield-walkabout",
  )!;
  const whaleLowCeiling = lowCeilingCall.options.find(
    (o) => o.optionId === "jun-opt-auke-bay-whale-direct",
  )!;
  assert.equal(heliLowCeiling.fitStatus, "fits_comfortably");
  assert.equal(
    heliLowCeiling.statusDimensions.weatherAndDispatch.status,
    "traveler_low_ceiling_assumption",
  );
  assert.equal(whaleLowCeiling.fitStatus, "fits_comfortably");
  assert.ok(
    lowCeilingCall.options.indexOf(whaleLowCeiling) <
      lowCeilingCall.options.indexOf(heliLowCeiling),
    "Marine whale watch must rank ahead of ceiling-dependent flightseeing under low-ceiling assumption",
  );

  // Scenario D: Step-free / wheelchair mobility disqualifies Capital Transit 3.0-mile walk while keeping direct shuttle and ADA whale boat viable
  const stepFreeCall = evaluateJuneauPortDayScenario(
    {
      ...DEFAULT_JUNEAU_SCENARIO_INPUT,
      shipArrivalTime: "08:00",
      allAboardTime: "16:30",
      arrivalDock: "downtown_walkoff",
      mobilityLevel: "step_free_wheelchair",
    },
    { node: juneauNode, now: NOW },
  );
  const busStepFree = stepFreeCall.options.find(
    (o) => o.optionId === "jun-opt-capital-transit-diy",
  )!;
  const shuttleStepFree = stepFreeCall.options.find(
    (o) => o.optionId === "jun-opt-usfs-mendenhall-shuttle",
  )!;
  assert.equal(busStepFree.fitStatus, "does_not_fit");
  assert.equal(
    busStepFree.statusDimensions.accessibility.status,
    "does_not_match_mobility",
  );
  assert.equal(shuttleStepFree.fitStatus, "fits_comfortably");

  // Scenario E: Unspecified mobility keeps time fit distinct while flagging walking_requirement_unconfirmed for Capital Transit's 3-mile walk
  const unspecifiedMobilityCall = evaluateJuneauPortDayScenario(
    {
      ...DEFAULT_JUNEAU_SCENARIO_INPUT,
      shipArrivalTime: "08:00",
      allAboardTime: "16:30",
      mobilityLevel: "unspecified",
    },
    { node: juneauNode, now: NOW },
  );
  const busUnspecified = unspecifiedMobilityCall.options.find(
    (o) => o.optionId === "jun-opt-capital-transit-diy",
  )!;
  assert.equal(busUnspecified.fitStatus, "fits_comfortably");
  assert.equal(
    busUnspecified.statusDimensions.accessibility.status,
    "walking_requirement_unconfirmed",
    "Missing mobility input must explicitly flag walking_requirement_unconfirmed on a 3-mile walk option without conflating it into tight_buffer",
  );

  // Shareable URL roundtrip preserves non-sensitive scenario inputs and re-evaluates
  const qs = buildJuneauScenarioQueryString(shortAjCall.normalizedInput);
  const parsed = parseJuneauScenarioFromSearchParams(new URLSearchParams(qs));
  assert.equal(parsed.shipArrivalTime, "07:00");
  assert.equal(parsed.allAboardTime, "12:30");
  assert.equal(parsed.arrivalDock, "aj_dock");
  assert.equal(parsed.returnBufferMinutes, 75);
});

test("Proof 3: Public, municipal, free, and direct independent options are evaluated alongside guided options with zero commercial weight", () => {
  const juneauNode = getBaseTravelReferenceNodeById("juneau");
  const result = evaluateJuneauPortDayScenario(
    {
      ...DEFAULT_JUNEAU_SCENARIO_INPUT,
      goalMode: "public_or_free_only",
      mobilityLevel: "active_walking_3mi",
    },
    { node: juneauNode, now: NOW },
  );

  const freeWalk = result.options.find(
    (o) => o.optionId === "jun-opt-downtown-seawalk-soboleff-tram",
  );
  const municipalBus = result.options.find(
    (o) => o.optionId === "jun-opt-capital-transit-diy",
  );
  assert.ok(freeWalk, "Expected $0 self-guided downtown seawalk & cultural option");
  assert.ok(municipalBus, "Expected CBJ Capital Transit municipal bus option");
  assert.equal(freeWalk.category, "public_free_or_municipal");
  assert.equal(
    freeWalk.bookingTransparency.indicativePriceRangePerPersonUsd.min,
    0,
  );
  assert.equal(municipalBus.category, "public_free_or_municipal");
  assert.equal(
    municipalBus.bookingTransparency.indicativePriceRangePerPersonUsd.min,
    4,
  );

  for (const opt of result.options) {
    assert.equal(
      opt.rankingAudit.commercialWeight,
      0,
      `Option ${opt.optionId} must have commercialWeight === 0`,
    );
    assert.ok(opt.whatInputChangeWouldAlterResult.length >= 1);
    assert.ok(opt.assumptionsUsed.length >= 1);
    assert.ok(opt.uncertainOrNeedsConfirmation.length >= 1);
    assert.match(
      opt.timing.mathematicalFeasibilityDisclaimer,
      /mathematically feasible itinerary is not a guarantee of operation or timely return/i,
    );
  }
});

test("Proof 4: An expired or conflicting evidence record causes dependent claims and recommendations to be qualified or withdrawn without breaking unrelated page content", async () => {
  const degradedJuneau = structuredClone(getBaseTravelReferenceNodeById("juneau"));
  // Expire ONLY jun-usfs-mendenhall (set verifiedAt & lastCheckedAt to 2024-01-01, beyond its expireAfterHours)
  const usfsCit = degradedJuneau.evidenceRegistry.find(
    (c) => c.id === "jun-usfs-mendenhall",
  )!;
  usfsCit.verifiedAt = "2024-01-01T00:00:00Z";
  usfsCit.retrievedAt = "2024-01-01T00:00:00Z";
  usfsCit.lastCheckedAt = "2024-01-01";

  const freshness = evaluateCitationFreshness(usfsCit, NOW);
  assert.equal(freshness.evidenceStatus, "expired");
  assert.equal(freshness.qualifiesOrWithdrawsConclusions, true);

  const depReport = evaluateNodeClaimDependencies(degradedJuneau, NOW);
  assert.equal(depReport.hasWithdrawnOrConflictedClaims, true);
  assert.ok(
    depReport.expiredOrConflictedCitationIds.includes("jun-usfs-mendenhall"),
  );

  // Dependent transport mode (capital-transit-and-shuttles) is qualified/withdrawn
  assert.ok(
    depReport.transportModeQualificationById["capital-transit-and-shuttles"],
  );
  // Unrelated transport modes (jnu-airport, juneau-cruise-docks, amhs-ferry) remain unqualified (undefined)
  assert.equal(
    depReport.transportModeQualificationById["jnu-airport"],
    undefined,
    "Unrelated supported transport modes must remain intact when Mendenhall citation expires",
  );
  assert.equal(
    depReport.transportModeQualificationById["juneau-cruise-docks"],
    undefined,
  );

  // Decision engine withdraws/qualifies Mendenhall-dependent options while keeping Auke Bay Whale Watching ('jun-cbj-harbors', 'jun-noaa-tides') 'fits_comfortably'
  const engineEval = evaluateJuneauPortDayScenario(
    {
      ...DEFAULT_JUNEAU_SCENARIO_INPUT,
      shipArrivalTime: "08:00",
      allAboardTime: "16:30",
      mobilityLevel: "active_walking_3mi",
    },
    { node: degradedJuneau, now: NOW },
  );

  const mendenhallShuttleOpt = engineEval.options.find(
    (o) => o.optionId === "jun-opt-usfs-mendenhall-shuttle",
  )!;
  const whaleOpt = engineEval.options.find(
    (o) => o.optionId === "jun-opt-auke-bay-whale-direct",
  )!;

  assert.equal(
    mendenhallShuttleOpt.fitStatus,
    "withdrawn_or_qualified_evidence",
    "Mendenhall shuttle option depending on expired jun-usfs-mendenhall must be withdrawn_or_qualified_evidence",
  );
  assert.ok(mendenhallShuttleOpt.evidenceQualificationNote);
  assert.equal(
    whaleOpt.fitStatus,
    "fits_comfortably",
    "Unrelated Auke Bay whale watching option supported by current evidence must remain 'fits_comfortably'",
  );
  assert.equal(whaleOpt.evidenceQualificationNote, null);
});

test("Proof 5: A failed provider fetch produces an explicit verification-limitation state, never an all-clear or zero-hazard claim", async () => {
  const juneauNode = getBaseTravelReferenceNodeById("juneau");

  // 5a. Decision engine with provider_telemetry_unavailable
  const degradedWeatherEval = evaluateJuneauPortDayScenario(
    {
      ...DEFAULT_JUNEAU_SCENARIO_INPUT,
      weatherCondition: "provider_telemetry_unavailable",
    },
    { node: juneauNode, now: NOW },
  );
  assert.equal(
    degradedWeatherEval.weatherAndTelemetryAdvisory.status,
    "telemetry_unavailable_limitation",
  );
  assert.match(
    degradedWeatherEval.weatherAndTelemetryAdvisory.explanation,
    /verification limitation/i,
  );
  assert.match(
    degradedWeatherEval.weatherAndTelemetryAdvisory.explanation,
    /NEVER converted into zero hazards, confirmed flight availability, or an all-clear/i,
  );
  const heliDegraded = degradedWeatherEval.options.find(
    (o) => o.optionId === "jun-opt-heli-icefield-walkabout",
  )!;
  assert.equal(
    heliDegraded.fitStatus,
    "fits_comfortably",
    "Unavailable weather feed must not become tight_buffer when 145 minutes of spare time remain",
  );
  assert.equal(
    heliDegraded.statusDimensions.weatherAndDispatch.status,
    "weather_feed_unavailable",
    "Flightseeing must explicitly record weather_feed_unavailable in its weatherAndDispatch status dimension",
  );
  assert.ok(
    heliDegraded.plainLanguageStatuses.includes(
      "Weather feed unavailable; check official forecast and operator dispatch directly.",
    ),
  );

  // 5b. Render JuneauPortDayPlanner with provider_telemetry_unavailable and verify alert banner
  const plannerHtml = renderToStaticMarkup(
    React.createElement(JuneauPortDayPlanner, {
      node: juneauNode,
      initialSearchParams: { weather: "provider_telemetry_unavailable" },
    }),
  );
  assert.match(plannerHtml, /Verification Limitation \(Not an All-Clear\)/);
  assert.match(plannerHtml, /NEVER converted into zero hazards/);
});

test("Proof 6: Recent-review summaries enforce a 180-day window by publication date, exclude undated reviews, deduplicate, require >=3 reviews and >=2 per theme, and distinguish 'No recent reviews found' from 'Recent reviews unavailable'", () => {
  const sampleReviews: ThirdPartyReviewInput[] = [
    {
      reviewId: "rev-1",
      productCode: "PROD-A",
      provider: "Viator",
      publishedDate: "2026-09-20", // within 180d of 2026-10-25
      syncedAt: "2026-10-10",
      text: "Great guide and comfortable boat, saw humpback whales right on time.",
      rating: 5,
      providerVerified: true,
    },
    {
      reviewId: "rev-1-dup",
      productCode: "PROD-A",
      provider: "Viator",
      publishedDate: "2026-09-20",
      text: "Great guide and comfortable boat, saw humpback whales right on time.", // duplicate text
      rating: 5,
      providerVerified: true,
    },
    {
      reviewId: "rev-2",
      productCode: "PROD-A",
      provider: "Viator",
      publishedDate: "2026-08-15", // within 180d
      text: "Knowledgeable captain and smooth return transfer back to the cruise dock on time.",
      rating: 5,
      providerVerified: true,
    },
    {
      reviewId: "rev-3",
      productCode: "PROD-A",
      provider: "Viator",
      publishedDate: "2026-07-02", // within 180d
      text: "Friendly crew and punctual dock pickup, though visibility was foggy in the rain.",
      rating: 4,
      providerVerified: false, // unverified booking
    },
    {
      reviewId: "rev-old-2025",
      productCode: "PROD-A",
      provider: "Viator",
      publishedDate: "2025-08-10", // OLDER than 180 days, even though syncedAt is today!
      syncedAt: "2026-10-25",
      text: "Long wait in line and crowded bus.",
      rating: 2,
      providerVerified: true,
    },
    {
      reviewId: "rev-undated",
      productCode: "PROD-A",
      provider: "Viator",
      publishedDate: null, // UNDATED -> must be excluded
      syncedAt: "2026-10-25",
      text: "Amazing trip!",
      rating: 5,
    },
    {
      reviewId: "rev-wrong-product",
      productCode: "PROD-OTHER", // Wrong product -> must be excluded
      provider: "Viator",
      publishedDate: "2026-09-25",
      text: "Great guide and punctual pickup.",
      rating: 5,
    },
  ];

  // 6a. Full thematic summary with 3 distinct eligible recent reviews
  const summary = summarizeRecentReviews({
    productCode: "PROD-A",
    reviews: sampleReviews,
    checkStatus: "checked_ok",
    lastRetrievedAt: "2026-10-25T12:00:00Z",
    referenceDate: NOW,
  });

  assert.equal(summary.state, "thematic_summary");
  assert.equal(summary.windowDays, 180);
  assert.equal(summary.eligibleRecentCount, 3);
  assert.equal(summary.excludedOutsideWindowCount, 1);
  assert.equal(summary.excludedUndatedCount, 1);
  assert.equal(summary.deduplicatedCount, 1);
  assert.equal(summary.excludedWrongProductCount, 1);
  assert.match(
    summary.providerVerificationSummary,
    /2 of 3 analyzed reviews carry provider-verified status/,
    "Must not claim all reviews are verified when any analyzed review lacks provider verification",
  );
  assert.ok(summary.positives.length >= 2);
  for (const theme of summary.positives) {
    assert.ok(theme.supportingReviewIds.length >= 2);
    assert.ok(theme.supportingExcerpts.length >= 2);
  }

  // 6b. Sparse state when only 2 recent reviews exist (< 3 threshold)
  const sparseSummary = summarizeRecentReviews({
    productCode: "PROD-A",
    reviews: sampleReviews.slice(0, 3), // rev-1, rev-1-dup, rev-2 -> 2 unique reviews
    checkStatus: "checked_ok",
    referenceDate: NOW,
  });
  assert.equal(sparseSummary.state, "limited_recent_data");
  assert.equal(sparseSummary.eligibleRecentCount, 2);
  assert.equal(sparseSummary.positives.length, 0);

  // 6c. Distinguish 'No recent reviews found' (adequate check succeeded, 0 recent reviews)
  const noRecentSummary = summarizeRecentReviews({
    productCode: "PROD-A",
    reviews: [sampleReviews[4]], // only the 2025 review
    checkStatus: "checked_ok",
    referenceDate: NOW,
  });
  assert.equal(noRecentSummary.state, "no_recent_reviews");
  assert.match(noRecentSummary.statusHeadline, /No recent reviews found/i);

  // 6d. Distinguish 'Recent reviews unavailable' (provider check failed or not integrated)
  const unavailableSummary = summarizeRecentReviews({
    productCode: "PROD-A",
    reviews: null,
    checkStatus: "unavailable",
    referenceDate: NOW,
  });
  assert.equal(unavailableSummary.state, "unavailable");
  assert.match(unavailableSummary.statusHeadline, /Recent reviews unavailable/i);
});

test("Proof 7: Visible claims on the Juneau proof page map to visible source entries with dates, distinct timestamps, conflict explanations, and verification status", async () => {
  const juneauNode = getBaseTravelReferenceNodeById("juneau");
  const element = await TravelReferenceExperience({ node: juneauNode });
  const html = renderToStaticMarkup(element);

  // Contains interactive Port-Day Decision Engine and Sources & Verification section
  assert.match(html, /id="port-day-decision-engine"/);
  assert.match(html, /id="sources-and-verification"/);
  assert.match(html, /Sources &amp; Verification/);
  assert.match(html, /id="editorial-methodology-and-disclosures"/);
  assert.match(html, /Report a Factual Error or Outdated Rule/);
  assert.match(html, /data-dcc-factual-error-form="true"/);

  // Every Juneau citation is rendered with id="cite-{id}", publisher, source URL, status, and distinct timestamps
  for (const cite of juneauNode.evidenceRegistry) {
    assert.ok(
      html.includes(`id="cite-${cite.id}"`),
      `Expected #cite-${cite.id} anchor in rendered Juneau HTML`,
    );
    assert.ok(
      html.includes(`href="#cite-${cite.id}"`),
      `Expected inline citation link href="#cite-${cite.id}" on Juneau page`,
    );
    const escapedOrg = cite.issuingOrganization.replaceAll("&", "&amp;");
    assert.ok(
      html.includes(escapedOrg),
      `Expected publisher ${escapedOrg} for ${cite.id}`,
    );
    const escapedUrl = cite.sourceUrl.replaceAll("&", "&amp;");
    assert.ok(
      html.includes(escapedUrl),
      `Expected sourceUrl ${escapedUrl} for ${cite.id}`,
    );
  }

  // Conflicting source explanation (jun-cbj-harbors dock distance vs cruise brochure 'downtown' label) is visible
  assert.match(
    html,
    /Source Discrepancy &amp; Applicability Analysis/,
    "Expected source conflict / discrepancy explanation in Sources & Verification",
  );
  assert.match(html, /1\.2 miles south of Marine Park/);
});

test("Proof 8: Human page output and machine/API output (/api/location/58.30190/-134.41970) agree for the same Juneau scenario and enforce no-store on expired claims", async () => {
  const juneauNode = getBaseTravelReferenceNodeById("juneau");
  const scenarioParams = {
    date: "2026-07-15",
    arrive: "07:00",
    allAboard: "12:30",
    dock: "aj_dock",
    buffer: "75",
    goal: "two_activity_combo",
  };

  // Human page evaluation
  const humanEval = evaluateJuneauPortDayScenario(
    parseJuneauScenarioFromSearchParams(scenarioParams),
    { node: juneauNode },
  );

  // Machine API evaluation for the exact same scenario query
  const apiUrl = new URL(
    "https://www.destinationcommandcenter.com/api/location/58.30190/-134.41970",
  );
  apiUrl.searchParams.set("scope", "core");
  for (const [k, v] of Object.entries(scenarioParams)) {
    apiUrl.searchParams.set(k, v);
  }

  const req = new NextRequest(apiUrl.toString());
  const res = await getLocationApi(req, {
    params: Promise.resolve({ lat: "58.30190", lng: "-134.41970" }),
  });
  assert.equal(res.status, 200);
  const apiData = await res.json();

  assert.equal(apiData.travelReference.available, true);
  assert.equal(apiData.travelReference.id, "juneau");
  assert.ok(apiData.travelReference.claimFreshness);
  assert.ok(apiData.travelReference.decisionEngine);
  assert.equal(apiData.policy.commercialWeightZeroInDecisionEngine, true);

  // Verify option-by-option fitStatus and netMarginMinutes agreement between human page and API
  const apiOptions = apiData.travelReference.decisionEngine.options;
  assert.equal(apiOptions.length, humanEval.options.length);
  for (let i = 0; i < humanEval.options.length; i++) {
    assert.equal(apiOptions[i].optionId, humanEval.options[i].optionId);
    assert.equal(apiOptions[i].fitStatus, humanEval.options[i].fitStatus);
    assert.equal(
      apiOptions[i].timing.netMarginMinutes,
      humanEval.options[i].timing.netMarginMinutes,
    );
  }
});

test("Proof 9: Production execution path contains zero sample reviews and shows 'Recent reviews unavailable' when third-party cache is absent; negation ('the guide was not helpful') and mixed sentiment are classified accurately", async () => {
  const juneauNode = getBaseTravelReferenceNodeById("juneau");
  const prodEval = evaluateJuneauPortDayScenario(
    DEFAULT_JUNEAU_SCENARIO_INPUT,
    { node: juneauNode, now: NOW },
  );

  assert.equal(prodEval.options.length, 7);
  for (const opt of prodEval.options) {
    assert.equal(
      opt.recentReviewSummary.state,
      "unavailable",
      `Production option ${opt.optionId} must report state === 'unavailable' when no synced review cache exists`,
    );
    assert.equal(
      opt.recentReviewSummary.statusHeadline,
      "Recent reviews unavailable",
    );
    assert.equal(opt.recentReviewSummary.eligibleRecentCount, 0);
    assert.equal(opt.recentReviewSummary.positives.length, 0);
    assert.equal(opt.recentReviewSummary.negatives.length, 0);
  }

  const pageTree = await TravelReferenceExperience({ node: juneauNode });
  const pageHtml = renderToStaticMarkup(pageTree);
  assert.match(pageHtml, /Recent reviews unavailable/);
  assert.doesNotMatch(pageHtml, /No recent reviews found/);
  assert.doesNotMatch(pageHtml, /rev-mta-|rev-whale-|rev-heli-|rev-combo-/);

  // Negation & mixed-sentiment verification (fixtures restricted to test file)
  const negationAndMixedReviews: ThirdPartyReviewInput[] = [
    {
      reviewId: "neg-1",
      productCode: "PROD-NEG",
      provider: "Viator",
      publishedDate: "2026-09-10",
      text: "The guide was not helpful and the shuttle was never on time.",
      rating: 4, // Even with a 4-star rating, negated positive words must be negative, NEVER positive!
      providerVerified: true,
    },
    {
      reviewId: "neg-2",
      productCode: "PROD-NEG",
      provider: "Viator",
      publishedDate: "2026-09-12",
      text: "Our driver wasn't friendly and pickup was not punctual at the dock.",
      rating: 2,
      providerVerified: true,
    },
    {
      reviewId: "mixed-3",
      productCode: "PROD-NEG",
      provider: "Viator",
      publishedDate: "2026-09-18",
      text: "The boat was not crowded and we had plenty of time at the glacier, though the guide was not knowledgeable.",
      rating: 3,
      providerVerified: true,
    },
  ];

  const negSummary = summarizeRecentReviews({
    productCode: "PROD-NEG",
    reviews: negationAndMixedReviews,
    checkStatus: "checked_ok",
    referenceDate: NOW,
  });

  assert.equal(negSummary.state, "thematic_summary");
  // 'guide_and_crew' must NOT appear in positives; it must appear in negatives!
  const positiveGuideTheme = negSummary.positives.find(
    (p) => p.themeId === "guide_and_crew",
  );
  assert.equal(
    positiveGuideTheme,
    undefined,
    "'the guide was not helpful' must NEVER be classified as a positive guide theme",
  );
  const negativeGuideTheme = negSummary.negatives.find(
    (n) => n.themeId === "guide_and_crew",
  );
  assert.ok(
    negativeGuideTheme,
    "Expected negated guide phrases ('not helpful', 'wasn't friendly', 'not knowledgeable') to produce a negative guide theme",
  );
  assert.ok(negativeGuideTheme.supportingReviewIds.includes("neg-1"));
});

test("Proof 10: Seven-option factual audit, non-double-counted duration decomposition, America/Juneau DST/overnight/unknown-dock/seasonal/missing-schedule handling, and commercial neutrality", () => {
  const juneauNode = getBaseTravelReferenceNodeById("juneau");
  const evalStandard = evaluateJuneauPortDayScenario(
    {
      ...DEFAULT_JUNEAU_SCENARIO_INPUT,
      travelDate: "2026-07-15",
      mobilityLevel: "active_walking_3mi",
    },
    { node: juneauNode, now: NOW },
  );

  // 10a. All 7 options have 8 audited input fields and verified non-double-counted durations
  const expectedFields = [
    "price",
    "activity_duration",
    "transfers",
    "meeting_point",
    "check_in_deadline",
    "operating_season",
    "accessibility",
    "booking_and_cancellation",
  ];
  assert.equal(evalStandard.options.length, 7);
  for (const opt of evalStandard.options) {
    assert.equal(
      opt.timing.durationAudit.doubleCountingStatus,
      "verified_not_double_counted",
    );
    const da = opt.timing.durationAudit;
    assert.equal(
      da.advertisedDockToDockMinutes,
      da.checkInLeadMinutes +
        da.outboundTransferMinutes +
        da.onSiteOrOnWaterActivityMinutes +
        da.interActivityTransferMinutes +
        da.returnTransferMinutes,
      `Duration decomposition for ${opt.optionId} must sum without double-counting transfers or check-in`,
    );
    assert.deepEqual(
      opt.inputAudit.map((f) => f.field),
      expectedFields,
      `Option ${opt.optionId} must audit all 8 consequential decision inputs`,
    );
    assert.equal(
      opt.operationalGuaranteeSeparation.confirmedOperationGuaranteed,
      false,
    );
    assert.equal(
      opt.operationalGuaranteeSeparation.ticketAvailabilityGuaranteed,
      false,
    );
    assert.equal(
      opt.operationalGuaranteeSeparation.guaranteedShipReturn,
      false,
    );
  }

  // 10b. America/Juneau timezone rules: AKDT (UTC-08:00), AKST (UTC-09:00), and DST transition dates
  const summerTz = resolveJuneauTimezoneForDate("2026-07-15", 7);
  assert.equal(summerTz.tzAbbreviation, "AKDT");
  assert.equal(summerTz.utcOffsetString, "-08:00");
  assert.equal(summerTz.isDaylightSavingTime, true);

  const winterTz = resolveJuneauTimezoneForDate("2026-12-15", 12);
  assert.equal(winterTz.tzAbbreviation, "AKST");
  assert.equal(winterTz.utcOffsetString, "-09:00");
  assert.equal(winterTz.isDaylightSavingTime, false);

  const springDst = resolveJuneauTimezoneForDate("2026-03-08", 3);
  assert.equal(springDst.isDstTransitionDate, true);
  assert.equal(springDst.dstTransitionAdjustmentMinutes, -60);

  const fallDst = resolveJuneauTimezoneForDate("2026-11-01", 11);
  assert.equal(fallDst.isDstTransitionDate, true);
  assert.equal(fallDst.dstTransitionAdjustmentMinutes, 60);

  // 10c. Off-season closure on 2026-11-15 (November): seasonal summer tours do not fit while year-round municipal bus & downtown walk still fit
  const novemberEval = evaluateJuneauPortDayScenario(
    {
      ...DEFAULT_JUNEAU_SCENARIO_INPUT,
      travelDate: "2026-11-15",
      shipArrivalTime: "08:00",
      allAboardTime: "16:30",
      mobilityLevel: "active_walking_3mi",
    },
    { node: juneauNode, now: NOW },
  );
  assert.equal(novemberEval.timezoneResolution.tzAbbreviation, "AKST");
  const mtaNov = novemberEval.options.find(
    (o) => o.optionId === "jun-opt-usfs-mendenhall-shuttle",
  )!;
  const busNov = novemberEval.options.find(
    (o) => o.optionId === "jun-opt-capital-transit-diy",
  )!;
  assert.equal(mtaNov.fitStatus, "does_not_fit");
  assert.equal(busNov.fitStatus, "fits_comfortably");

  // 10d. Overnight port call (arriving 14:00, all-aboard 10:00 next day)
  const overnightEval = evaluateJuneauPortDayScenario(
    {
      ...DEFAULT_JUNEAU_SCENARIO_INPUT,
      travelDate: "2026-07-15",
      shipArrivalTime: "14:00",
      allAboardTime: "10:00",
      overnightPortCall: true,
    },
    { node: juneauNode, now: NOW },
  );
  assert.equal(overnightEval.options[0].timing.totalPortWindowMinutes, 1200);

  // 10e. Unknown dock ('unknown_dock') applies conservative 50m/40m dock allowance and never assumes downtown walk-off
  const unknownDockEval = evaluateJuneauPortDayScenario(
    {
      ...DEFAULT_JUNEAU_SCENARIO_INPUT,
      travelDate: "2026-07-15",
      shipArrivalTime: "08:00",
      allAboardTime: "13:30",
      arrivalDock: "unknown_dock",
    },
    { node: juneauNode, now: NOW },
  );
  const whaleUnknownDock = unknownDockEval.options.find(
    (o) => o.optionId === "jun-opt-auke-bay-whale-direct",
  )!;
  assert.equal(whaleUnknownDock.timing.disembarkationAndDockMinutes, 50);
  assert.equal(whaleUnknownDock.timing.returnDockQueueMinutes, 40);

  // 10f. Invalid time ("25:99") and missing schedule handling
  const invalidTimeEval = evaluateJuneauPortDayScenario(
    {
      ...DEFAULT_JUNEAU_SCENARIO_INPUT,
      shipArrivalTime: "25:99",
    },
    {
      node: juneauNode,
      now: NOW,
      missingScheduleOptionIds: ["jun-opt-auke-bay-whale-direct"],
    },
  );
  assert.ok(invalidTimeEval.inputValidationErrors.length >= 1);
  const whaleMissingSched = invalidTimeEval.options.find(
    (o) => o.optionId === "jun-opt-auke-bay-whale-direct",
  )!;
  assert.equal(whaleMissingSched.fitStatus, "withdrawn_or_qualified_evidence");
});

test("Proof 11: Factual-error reporting path validates inputs, blocks honeypot/content spam, persists durably, survives notification failures, and surfaces in the internal review queue", async () => {
  resetFactualErrorRateLimitsForTests();

  // 11a. Honeypot spam is rejected
  const honeypotRes = await submitFactualErrorReport({
    pagePath: "/juneau",
    disputedClaim: "Mendenhall shuttle price",
    explanation: "The shuttle price changed this week.",
    websiteUrl: "https://spam-bot.example.com",
    clientIp: "198.51.100.10",
  });
  assert.equal(honeypotRes.ok, false);
  if (!honeypotRes.ok) {
    assert.equal(honeypotRes.error, "spam_detected_honeypot");
  }

  // Clean up any leftover test reports from earlier runs
  const existingReports = await listFactualErrorReports({
    pagePath: "/juneau",
    limit: 50,
  });
  for (const r of existingReports) {
    if (
      r.disputedClaim.startsWith("Route 3 weekend frequency check") ||
      r.disputedClaim.startsWith("Steep Creek boardwalk maintenance window")
    ) {
      await deleteFactualErrorReportByIdForTests(r.reportId);
    }
  }

  // 11b. Valid submission via API route persists durably and survives simulated notification failure
  const uniqueClaim = `Route 3 weekend frequency check (${Date.now()})`;
  const postReq = new Request(
    "https://www.destinationcommandcenter.com/api/public/factual-error-report",
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": "198.51.100.25",
      },
      body: JSON.stringify({
        pagePath: "/juneau",
        nodeId: "juneau",
        citationId: "jun-capital-transit",
        disputedClaim: uniqueClaim,
        explanation:
          "Sunday Route 3 departures from the Downtown Transit Center had a seasonal holiday detour.",
        sourceUrl: "https://juneaucapitaltransit.org/fares/",
        contactInfo: "traveler-verify@example.com",
        sendNotification: false,
      }),
    },
  );

  const postRes = await postFactualErrorReportRoute(postReq);
  assert.equal(postRes.status, 201);
  const postData = await postRes.json();
  assert.equal(postData.ok, true);
  assert.ok(postData.reportId.startsWith("fer_"));

  // 11c. Verify notification failure resilience: even when notification throws, report is durably persisted
  const resilientRes = await submitFactualErrorReport({
    pagePath: "/juneau",
    nodeId: "juneau",
    citationId: "jun-usfs-mendenhall",
    disputedClaim: `Steep Creek boardwalk maintenance window (${Date.now()})`,
    explanation:
      "Observed temporary ranger rope along the lower Steep Creek viewing platform.",
    clientIp: "198.51.100.26",
    forceNotificationFailureForTest: true,
  });
  assert.equal(resilientRes.ok, true);
  if (resilientRes.ok) {
    assert.equal(resilientRes.report.notificationStatus, "failed_non_blocking");
  }

  // 11d. Verify persisted reports appear in listFactualErrorReports (used by internal review workflow)
  const listed = await listFactualErrorReports({ pagePath: "/juneau", limit: 25 });
  assert.ok(
    listed.some((r) => r.reportId === postData.reportId && r.disputedClaim === uniqueClaim),
    "Submitted factual-error report must be retrievable in the internal review queue",
  );

  // Clean up test-created reports so the review queue stays clean
  await deleteFactualErrorReportByIdForTests(postData.reportId);
  if (resilientRes.ok) {
    await deleteFactualErrorReportByIdForTests(resilientRes.report.reportId);
  }
});

test("Proof 12: Focused correction pass — Example Scenario initial state, separated status dimensions, plain-language results, accurate accessibility wording, and multi-operator planning ranges", async () => {
  const juneauNode = getBaseTravelReferenceNodeById("juneau");

  // 12a. Initial scenario has travelDate === null, isExampleScenario === true, and prompts the traveler for their trip date
  assert.equal(DEFAULT_JUNEAU_SCENARIO_INPUT.travelDate, null);
  const initialEval = evaluateJuneauPortDayScenario(DEFAULT_JUNEAU_SCENARIO_INPUT, {
    node: juneauNode,
    now: NOW,
  });
  assert.equal(initialEval.dateProvidedByTraveler, false);
  assert.equal(initialEval.isExampleScenario, true);
  assert.match(initialEval.exampleScenarioNotice || "", /Example Scenario/i);
  assert.match(initialEval.conciseBottomLine, /^Example Scenario/);

  // When a traveler supplies their trip date, isExampleScenario becomes false
  const datedEval = evaluateJuneauPortDayScenario(
    {
      ...DEFAULT_JUNEAU_SCENARIO_INPUT,
      travelDate: "2026-07-15",
    },
    { node: juneauNode, now: NOW },
  );
  assert.equal(datedEval.dateProvidedByTraveler, true);
  assert.equal(datedEval.isExampleScenario, false);
  assert.equal(datedEval.exampleScenarioNotice, null);
  assert.doesNotMatch(datedEval.conciseBottomLine, /^Example Scenario/);

  // 12b. Unknown dock with substantial time remaining does NOT become tight_buffer, and emits plain-language status bullets
  const unknownDockLongWindow = evaluateJuneauPortDayScenario(
    {
      ...DEFAULT_JUNEAU_SCENARIO_INPUT,
      travelDate: "2026-07-15",
      shipArrivalTime: "08:00",
      allAboardTime: "16:30",
      arrivalDock: "unknown_dock",
    },
    { node: juneauNode, now: NOW },
  );
  const whaleUnknownLong = unknownDockLongWindow.options.find(
    (o) => o.optionId === "jun-opt-auke-bay-whale-direct",
  )!;
  assert.equal(
    whaleUnknownLong.fitStatus,
    "fits_comfortably",
    "Unknown dock must not become tight_buffer when >45 minutes of margin remain",
  );
  assert.ok(whaleUnknownLong.plainLanguageStatuses.includes("Fits your time budget."));
  assert.ok(
    whaleUnknownLong.plainLanguageStatuses.includes(
      "Departure schedule still needs confirmation.",
    ),
  );
  assert.ok(
    whaleUnknownLong.plainLanguageStatuses.includes(
      "Dock unknown; transfer allowance is an estimate.",
    ),
  );

  // 12c. Single-activity options that fit the available time remain visible as alternatives when goalMode === "two_activity_combo"
  const twoActivityLongEval = evaluateJuneauPortDayScenario(
    {
      ...DEFAULT_JUNEAU_SCENARIO_INPUT,
      travelDate: "2026-07-15",
      shipArrivalTime: "08:00",
      allAboardTime: "16:30",
      goalMode: "two_activity_combo",
    },
    { node: juneauNode, now: NOW },
  );
  const singleWhaleUnderCombo = twoActivityLongEval.options.find(
    (o) => o.optionId === "jun-opt-auke-bay-whale-direct",
  )!;
  assert.equal(
    singleWhaleUnderCombo.fitStatus,
    "fits_comfortably",
    "Single-activity option that fits the time budget must remain visible rather than marked does_not_fit under two_activity_combo",
  );
  assert.equal(
    singleWhaleUnderCombo.statusDimensions.preferenceMatch.status,
    "single_activity_alternative",
  );
  assert.ok(
    singleWhaleUnderCombo.plainLanguageStatuses.includes(
      "Single-activity alternative (fits your time window if you skip a two-activity combo).",
    ),
  );

  // 12d. Accessibility language never says an option "requires 'step free wheelchair'"
  const fullHtml = renderToStaticMarkup(
    React.createElement(JuneauPortDayPlanner, { node: juneauNode }),
  );
  assert.doesNotMatch(
    fullHtml,
    /requires\s+(?:at\s+least\s+)?['"]?step[_\s-]free[_\s-]wheelchair/i,
    "Page must never state that an option requires the traveler to use a wheelchair",
  );
  for (const opt of initialEval.options) {
    assert.ok(opt.accessibilityDetails.walkingAndTerrain.length > 10);
    assert.ok(opt.accessibilityDetails.boardingAndTransfer.length > 10);
    assert.ok(opt.accessibilityDetails.wheelchairAndMobilitySupport.length > 10);
    assert.ok(opt.accessibilityDetails.confirmationNote.length > 10);
  }

  // 12e. Multi-operator helicopter claims use operator_estimate / dcc_estimate planning ranges and preserve transfer/return uncertainty
  const heliOpt = initialEval.options.find(
    (o) => o.optionId === "jun-opt-heli-icefield-walkabout",
  )!;
  for (const key of [
    "price",
    "activity_duration",
    "check_in_deadline",
    "booking_and_cancellation",
  ] as const) {
    const field = heliOpt.inputAudit.find((f) => f.field === key)!;
    assert.ok(field, `Expected inputAudit entry for ${key}`);
    assert.notEqual(
      field.basisType,
      "sourced_fact",
      "Multi-operator helicopter ranges across TEMSCO, Coastal, and NorthStar must not be labeled as a single verified sourced_fact",
    );
  }
  const heliDurationField = heliOpt.inputAudit.find(
    (f) => f.field === "activity_duration",
  )!;
  const heliCheckInField = heliOpt.inputAudit.find(
    (f) => f.field === "check_in_deadline",
  )!;
  assert.match(heliDurationField.valueSummary, /180–255 min/);
  assert.match(heliCheckInField.valueSummary, /30–45 min/);
  assert.match(heliOpt.timing.durationAudit.decompositionNote, /^Planning estimate modeled on TEMSCO/);
  assert.doesNotMatch(heliOpt.timing.durationAudit.decompositionNote, /^Verified decomposition:/);
  assert.ok(heliOpt.timing.estimatedBackAtDockRangeText.includes("–"));
});

test("Proof 13: Alaska ownership correction routes flightseeing to Juneau Flight Deck and shore excursions to Last Frontier Shore Excursions with zero WTA commercial links", async () => {
  const { buildDccRootAgentManifest, buildDccRootLlmsText, buildDccRootSitemapIndex } = await import(
    "@/lib/dcc/discoveryStack"
  );
  const { getPublishedTravelReferenceNodeById } = await import("@/lib/dcc/travelReference");
  const { resolveJuneauHelicopterGoRedirect } = await import("@/lib/dcc/routing/middleware");

  const juneauNode = await getPublishedTravelReferenceNodeById("juneau");
  const juneauTree = await TravelReferenceExperience({ node: juneauNode });
  const juneauHtml = renderToStaticMarkup(juneauTree);

  // 13a. Zero Welcome to Alaska Tours references in Juneau HTML (including JSON-LD), reference node, discovery stack, or location API
  for (const surface of [
    { name: "Juneau HTML & JSON-LD", text: juneauHtml },
    { name: "Juneau TravelReferenceNode", text: JSON.stringify(juneauNode) },
    { name: "agent.json", text: JSON.stringify(buildDccRootAgentManifest()) },
    { name: "llms.txt", text: buildDccRootLlmsText() },
    { name: "sitemap.xml", text: buildDccRootSitemapIndex() },
  ]) {
    assert.doesNotMatch(
      surface.text,
      /welcometoalaskatours|welcome-to-alaska|Welcome to Alaska Tours/i,
      `${surface.name} must not contain any Welcome to Alaska Tours commercial handoff or network reference`,
    );
  }

  const locReq = new NextRequest("https://www.destinationcommandcenter.com/api/location/58.30190/-134.41970?scope=core");
  const locRes = await getLocationApi(locReq, {
    params: Promise.resolve({ lat: "58.30190", lng: "-134.41970" }),
  });
  const locText = await locRes.text();
  assert.doesNotMatch(locText, /welcometoalaskatours|Welcome to Alaska Tours/i);
  assert.match(locText, /juneauflightdeck\.com\/helicopter/);
  assert.match(locText, /www\.lastfrontiershoreexcursions\.com\/ports\/juneau/);

  // 13b. Specialist handoffs and decision-engine channels use working owned specialist deep links and only supported parameters
  const evalWithDate = evaluateJuneauPortDayScenario(
    {
      ...DEFAULT_JUNEAU_SCENARIO_INPUT,
      travelDate: "2026-07-15",
      dateProvidedByTraveler: true,
      shipArrivalTime: "08:00",
      allAboardTime: "16:30",
      dockCode: "AS",
      weatherOutlook: "mixed_ceiling",
      mobilityLevel: "standard_walking",
      budgetBand: "any",
      goalMode: "two_activity_combo",
      partySize: 2,
    },
    { node: juneauNode, now: NOW },
  );

  const allChannels = evalWithDate.options.flatMap((o) => o.bookingTransparency.channels);
  assert.ok(
    !allChannels.some(
      (ch) => /welcometoalaskatours/i.test(ch.url) || /Welcome to Alaska/i.test(ch.operatorOrProviderName),
    ),
    "No option booking channel may route to Welcome to Alaska Tours",
  );

  // Flightseeing specialist channel uses https://juneauflightdeck.com/helicopter?date=2026-07-15
  const heliSpecialist = evalWithDate.options
    .find((o) => o.optionId === "jun-opt-heli-icefield-walkabout")!
    .bookingTransparency.channels.find((ch) => ch.channelType === "specialist_comparison")!;
  assert.equal(heliSpecialist.url, "https://juneauflightdeck.com/helicopter?date=2026-07-15");
  assert.match(heliSpecialist.relationshipDisclosure, /DCC owned specialist site \(Juneau Flight Deck\)/);

  // Shore-excursion specialist channels use working Last Frontier Shore Excursions deep links without invented query parameters
  const whaleSpecialist = evalWithDate.options
    .find((o) => o.optionId === "jun-opt-auke-bay-whale-direct")!
    .bookingTransparency.channels.find((ch) => ch.channelType === "specialist_comparison")!;
  assert.equal(whaleSpecialist.url, "https://www.lastfrontiershoreexcursions.com/juneau/whale-watching");
  assert.match(whaleSpecialist.relationshipDisclosure, /DCC owned specialist site \(Last Frontier Shore Excursions\)/);

  const mendenhallSpecialist = evalWithDate.options
    .find((o) => o.optionId === "jun-opt-usfs-mendenhall-shuttle")!
    .bookingTransparency.channels.find((ch) => ch.channelType === "specialist_comparison")!;
  assert.equal(
    mendenhallSpecialist.url,
    "https://www.lastfrontiershoreexcursions.com/juneau/mendenhall-glacier-tours",
  );

  const comboSpecialist = evalWithDate.options
    .find((o) => o.optionId === "jun-opt-combo-whale-and-mendenhall")!
    .bookingTransparency.channels.find((ch) => ch.channelType === "specialist_comparison")!;
  assert.equal(
    comboSpecialist.url,
    "https://www.lastfrontiershoreexcursions.com/decision/whale-watching-vs-glacier-tour",
  );

  const heliComboSpecialists = evalWithDate.options
    .find((o) => o.optionId === "jun-opt-combo-heli-and-mendenhall")!
    .bookingTransparency.channels.filter((ch) => ch.channelType === "specialist_comparison");
  assert.equal(heliComboSpecialists.length, 2);
  assert.equal(heliComboSpecialists[0].url, "https://juneauflightdeck.com/helicopter?date=2026-07-15");
  assert.equal(
    heliComboSpecialists[1].url,
    "https://www.lastfrontiershoreexcursions.com/juneau/mendenhall-glacier-tours",
  );

  // 13c. /go/juneau/helicopter-tours resolves to https://juneauflightdeck.com/helicopter (with ?date when valid)
  const { resolveGoRedirect } = await import("@/lib/dcc/routing/middleware");
  const goRedirect = resolveGoRedirect({
    pathname: "/go/juneau/helicopter-tours",
    searchParams: new URLSearchParams("date=2026-07-15&port=juneau"),
  });
  assert.equal(goRedirect?.destinationUrl, "https://juneauflightdeck.com/helicopter?date=2026-07-15");

  // 13d. Direct operators and public-agency evidence links remain intact and ranking remains commercially independent
  assert.ok(evalWithDate.options.every((o) => o.rankingAudit.commercialWeight === 0));
  assert.match(
    evalWithDate.coverageDisclosures.commercialIndependenceStatement,
    /Commercial or affiliate relationships never influence ranking/,
  );
  assert.ok(allChannels.every((ch) => ch.commissionInfluenceOnRanking === 0));
  assert.ok(allChannels.some((ch) => ch.channelType === "direct_operator" && /temscoair\.com/.test(ch.url)));
  assert.ok(allChannels.some((ch) => ch.channelType === "direct_operator" && /coastalhelicopters\.com/.test(ch.url)));
  assert.ok(allChannels.some((ch) => ch.channelType === "direct_operator" && /northstartrekking\.com/.test(ch.url)));
  assert.ok(allChannels.some((ch) => ch.channelType === "direct_operator" && /allenmarine\.com/.test(ch.url)));
  assert.ok(allChannels.some((ch) => ch.channelType === "public_free" && /fs\.usda\.gov/.test(ch.url)));
  assert.ok(allChannels.some((ch) => ch.channelType === "public_free" && /juneaucapitaltransit\.org/.test(ch.url)));
});




