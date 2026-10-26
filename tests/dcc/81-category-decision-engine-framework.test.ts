import test from "node:test";
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import { performance } from "node:perf_hooks";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { GET as getDecisionEnginesIndex } from "@/app/api/v1/decision-engines/route";
import { GET as getDecisionEngineDefinition } from "@/app/api/v1/decision-engines/[engineId]/route";
import {
  GET as getEvaluateDecisionEngine,
  POST as postEvaluateDecisionEngine,
} from "@/app/api/v1/decision-engines/[engineId]/evaluate/route";
import CategoryDecisionEngineExperience from "@/app/components/dcc/CategoryDecisionEngineExperience";
import {
  buildDccRootAgentManifest,
  buildDccRootLlmsText,
} from "@/lib/dcc/discoveryStack";
import {
  assertDecisionChangingClaimsHaveSources,
  assertNoWtaBookingDestination,
} from "@/lib/dcc/decisionEngines/evaluator";
import { HAWAII_WHALE_DECISION_ENGINE } from "@/lib/dcc/decisionEngines/hawaiiWhaleWatchingEngine";
import {
  evaluateJuneauHelicopterParityWithPortDay,
  JUNEAU_HELICOPTER_DECISION_ENGINE,
} from "@/lib/dcc/decisionEngines/juneauHelicopterEngine";
import {
  DECISION_ENGINE_REGISTRY,
  listDecisionEngines,
  NEXT_DCC_CATEGORY_ONBOARDING_RANKING,
  PHASE_1_REFERENCE_IMPLEMENTATION_AUDIT,
} from "@/lib/dcc/decisionEngines/registry";
import { evaluateJuneauPortDayScenario } from "@/lib/dcc/juneauPortDayEngine";

test("1. Hard constraints eliminate incompatible options and cannot be overridden by preference points", () => {
  const familyResult = HAWAII_WHALE_DECISION_ENGINE.evaluate({
    island: "maui",
    travelDate: "2027-02-15",
    travelMonth: 2,
    youngestChildAgeYears: 2,
    vesselPreference: "eye_level_rib_raft",
    priorityMode: "closest_eye_level_viewing",
  });

  const viableIds = familyResult.viableOptions.map((o) => o.optionId);
  const eliminatedIds = familyResult.eliminatedOptions.map((o) => o.optionId);

  assert.ok(eliminatedIds.includes("hi-whale-maui-eye-level-rib-raft"));
  assert.ok(eliminatedIds.includes("hi-whale-maui-trilogy-sail-cat"));
  assert.ok(!viableIds.includes("hi-whale-maui-eye-level-rib-raft"));
  assert.ok(viableIds.includes("hi-whale-maui-pacwhale-catamaran"));
});

test("2. Preferences rank only viable options and apply zero commercial weight", () => {
  const comfortResult = HAWAII_WHALE_DECISION_ENGINE.evaluate({
    island: "maui",
    travelDate: "2027-02-15",
    travelMonth: 2,
    vesselPreference: "stabilized_catamaran_or_ship",
    priorityMode: "comfort_and_stability",
  });

  const smallGroupResult = HAWAII_WHALE_DECISION_ENGINE.evaluate({
    island: "maui",
    travelDate: "2027-02-15",
    travelMonth: 2,
    vesselPreference: "sailing_catamaran",
    priorityMode: "small_group_deck_space",
    seasicknessOrRoughWaterConcern: "low",
  });

  assert.equal(
    comfortResult.bestFitOption?.optionId,
    "hi-whale-maui-pacwhale-catamaran",
  );
  assert.equal(
    smallGroupResult.bestFitOption?.optionId,
    "hi-whale-maui-trilogy-sail-cat",
  );

  for (const option of [
    ...comfortResult.viableOptions,
    ...smallGroupResult.viableOptions,
  ]) {
    assert.equal(option.commercialWeightApplied, 0);
  }
  assert.equal(
    comfortResult.commercialNeutrality.commercialWeightAppliedToRanking,
    0,
  );
  assert.equal(
    comfortResult.commercialNeutrality.preselectedCommissionSeller,
    false,
  );
});

test("3. Missing facts remain unknown and never silently become allowed or safe", () => {
  const missingDateHawaii = HAWAII_WHALE_DECISION_ENGINE.evaluate({
    island: "maui",
    travelDate: null,
  });
  assert.equal(missingDateHawaii.isExampleScenario, true);
  assert.ok(
    missingDateHawaii.exampleScenarioBanner?.includes("Example Scenario"),
  );
  assert.ok(
    missingDateHawaii.unknownOrStaleFacts.some(
      (f) => f.category === "missing_traveler_input",
    ),
  );

  const unknownDockJuneau = JUNEAU_HELICOPTER_DECISION_ENGINE.evaluate({
    date: "2026-07-15",
    arrivalTime: "07:00",
    allAboardTime: "17:00",
    arrivalDock: "UNKNOWN",
    mobilityLevel: "step_free_wheelchair",
  });

  assert.ok(
    unknownDockJuneau.unknownOrStaleFacts.some((f) =>
      f.summary.includes("Dock unknown; transfer allowance is a conservative"),
    ),
  );
  assert.ok(
    unknownDockJuneau.unknownOrStaleFacts.some(
      (f) => f.category === "operator_confirmation_required",
    ),
  );
});

test("4. Stale, expired, conflicting, or withdrawn evidence immediately removes or qualifies affected claims and recommendations and adjusts Cache-Control", () => {
  // Baseline with all current sources: PacWhale is #1 best_fit
  const baselineResult = HAWAII_WHALE_DECISION_ENGINE.evaluate({
    island: "maui",
    travelDate: "2027-02-15",
  });
  assert.equal(
    baselineResult.bestFitOption?.optionId,
    "hi-whale-maui-pacwhale-catamaran",
  );
  assert.equal(baselineResult.bestFitOption?.fitTier, "best_fit");
  assert.ok(
    baselineResult.bestFitOption?.supportingClaims.some(
      (c) => c.claimId === "claim-hi-pacwhale-catamaran-specs",
    ),
  );

  // Case A: Stale source immediately withdraws affected claims from active supportingClaims,
  // downgrades PacWhale to qualified_fit, and removes it from #1 best_fit
  const staleResult = HAWAII_WHALE_DECISION_ENGINE.evaluate(
    {
      island: "maui",
      travelDate: "2027-02-15",
    },
    {
      sourceStatusOverrides: {
        "src-pacwhale-eco-adventures-2026": "stale",
      },
    },
  );

  assert.equal(staleResult.evidenceHealth.status, "has_stale_or_unavailable");
  assert.ok(staleResult.evidenceHealth.staleCount >= 1);
  assert.equal(staleResult.evidenceHealth.recommendedCacheControl, "no-store");

  const pacwhaleOption = staleResult.viableOptions.find(
    (o) => o.optionId === "hi-whale-maui-pacwhale-catamaran",
  );
  assert.equal(
    pacwhaleOption?.qualificationStatus,
    "qualified_stale_or_unknown",
  );
  assert.equal(pacwhaleOption?.fitTier, "qualified_fit");
  assert.equal(
    pacwhaleOption?.supportingClaims.some(
      (c) => c.claimId === "claim-hi-pacwhale-catamaran-specs",
    ),
    false,
    "Claim backed by stale source must be immediately withdrawn from active supportingClaims",
  );
  assert.notEqual(
    staleResult.bestFitOption?.optionId,
    "hi-whale-maui-pacwhale-catamaran",
    "Stale option must not remain #1 bestFitOption when verified options exist",
  );
  assert.ok(
    staleResult.unknownOrStaleFacts.some((f) => f.category === "stale_source"),
  );

  // Case B: Withdrawn source immediately eliminates the dependent option from viableOptions
  const withdrawnResult = HAWAII_WHALE_DECISION_ENGINE.evaluate(
    {
      island: "maui",
      travelDate: "2027-02-15",
    },
    {
      sourceStatusOverrides: {
        "src-pacwhale-eco-adventures-2026": "withdrawn",
      },
    },
  );
  assert.equal(
    withdrawnResult.evidenceHealth.status,
    "has_withdrawn_or_conflicted",
  );
  assert.equal(withdrawnResult.evidenceHealth.recommendedCacheControl, "no-store");
  assert.equal(
    withdrawnResult.viableOptions.some(
      (o) => o.optionId === "hi-whale-maui-pacwhale-catamaran",
    ),
    false,
    "Option with withdrawn source must be immediately removed from viableOptions",
  );
  assert.ok(
    withdrawnResult.eliminatedOptions.some(
      (e) =>
        e.optionId === "hi-whale-maui-pacwhale-catamaran" &&
        e.failedHardConstraintIds.includes("hc-evidence-withdrawn-or-conflicted"),
    ),
    "Option with withdrawn source must be recorded in eliminatedOptions with hc-evidence-withdrawn-or-conflicted",
  );

  // Case C: Conflicted source also immediately eliminates the dependent option
  const conflictedResult = HAWAII_WHALE_DECISION_ENGINE.evaluate(
    {
      island: "maui",
      travelDate: "2027-02-15",
    },
    {
      sourceStatusOverrides: {
        "src-pacwhale-eco-adventures-2026": "conflicted",
      },
    },
  );
  assert.equal(
    conflictedResult.viableOptions.some(
      (o) => o.optionId === "hi-whale-maui-pacwhale-catamaran",
    ),
    false,
  );

  // Case D: Timestamp expiration (now > all source expiresAt) ensures ZERO options receive best_fit or strong_fit
  const allExpiredResult = HAWAII_WHALE_DECISION_ENGINE.evaluate(
    {
      island: "maui",
      travelDate: "2027-02-15",
    },
    {
      now: new Date("2028-01-15T00:00:00Z"),
    },
  );
  assert.equal(
    allExpiredResult.viableOptions.some(
      (o) => o.fitTier === "best_fit" || o.fitTier === "strong_fit",
    ),
    false,
    "When all sources are expired, zero options may receive an unqualified positive fitTier",
  );
  assert.match(
    allExpiredResult.conciseVerdict,
    /No unqualified positive recommendation can be issued/,
  );
});

test("5. Every decision-changing claim has a verified source record", () => {
  for (const engine of listDecisionEngines()) {
    assert.ok(engine.evidenceClaims.length > 0);
    for (const claim of engine.evidenceClaims) {
      if (claim.isDecisionChanging) {
        assert.ok(claim.sourceIds.length > 0);
        for (const sourceId of claim.sourceIds) {
          const source = engine.sourceRecords.find(
            (s) => s.sourceId === sourceId,
          );
          assert.ok(source, `Missing source ${sourceId}`);
          assert.match(source.sourceUrl, /^https:\/\//);
        }
      }
    }
  }

  assert.throws(
    () =>
      assertDecisionChangingClaimsHaveSources(
        "hawaii-whale-watching",
        [
          {
            claimId: "broken-claim",
            classification: "official_rule",
            statement: "Unverified rule",
            fieldsSupported: ["durationMinutes"],
            sourceIds: [],
            isDecisionChanging: true,
            verificationNote: "Test",
          },
        ],
        new Map(),
      ),
    /has no sourceIds/,
  );
});

test("6. Eliminations include understandable reasons and actionable recovery guidance", () => {
  const result = HAWAII_WHALE_DECISION_ENGINE.evaluate({
    island: "maui",
    travelDate: "2027-02-15",
    hasPregnantOrSpinalCondition: true,
    budgetMaxPerPersonUsd: 90,
  });

  const ribEliminated = result.eliminatedOptions.find(
    (e) => e.optionId === "hi-whale-maui-eye-level-rib-raft",
  );
  assert.ok(ribEliminated);
  assert.ok(
    ribEliminated.eliminationReasons
      .join(" ")
      .includes(
        "strictly prohibits pregnant passengers and travelers with neck, back, or spinal conditions",
      ),
  );
  assert.ok(ribEliminated.whatInputChangeWouldAlterResult.length > 0);

  const trilogyEliminated = result.eliminatedOptions.find(
    (e) => e.optionId === "hi-whale-maui-trilogy-sail-cat",
  );
  assert.ok(trilogyEliminated);
  assert.ok(
    trilogyEliminated.eliminationReasons
      .join(" ")
      .includes("starts at $99 per person, exceeding your $90 budget ceiling"),
  );
});

test("7. Recent-review summaries use actual dated evidence within the 180-day window", () => {
  const result = HAWAII_WHALE_DECISION_ENGINE.evaluate(
    {
      island: "maui",
      travelDate: "2027-02-15",
    },
    {
      now: new Date("2026-04-20T12:00:00Z"),
    },
  );

  const pacwhale = result.viableOptions.find(
    (o) => o.optionId === "hi-whale-maui-pacwhale-catamaran",
  );
  assert.ok(pacwhale?.reviewEvidence);
  assert.equal(
    pacwhale.reviewEvidence.summaryResult.state,
    "thematic_summary",
  );
  assert.equal(pacwhale.reviewEvidence.summaryResult.eligibleRecentCount, 3);
  assert.equal(
    pacwhale.reviewEvidence.summaryResult.coveredDateRange?.earliest,
    "2026-02-11",
  );
  assert.equal(
    pacwhale.reviewEvidence.summaryResult.coveredDateRange?.latest,
    "2026-03-18",
  );
  assert.ok(pacwhale.reviewEvidence.summaryResult.positives.length > 0);
});

test("8. No recent reviews produces no fabricated summary", () => {
  const result = HAWAII_WHALE_DECISION_ENGINE.evaluate(
    {
      island: "maui",
      travelDate: "2027-02-15",
    },
    {
      now: new Date("2026-04-20T12:00:00Z"),
      reviewConfigOverrides: {
        "hi-whale-maui-pacwhale-catamaran": {
          productCode: "HI-MAUI-PACWHALE-CAT",
          reviews: [],
          checkStatus: "checked_ok",
          lastRetrievedAt: "2026-04-20T00:00:00Z",
          sourcesQueried: ["pacwhale_verified_guest_reviews"],
        },
      },
    },
  );

  const pacwhale = result.viableOptions.find(
    (o) => o.optionId === "hi-whale-maui-pacwhale-catamaran",
  );
  assert.equal(
    pacwhale?.reviewEvidence?.summaryResult.state,
    "no_recent_reviews",
  );
  assert.deepEqual(pacwhale?.reviewEvidence?.summaryResult.positives, []);
  assert.deepEqual(pacwhale?.reviewEvidence?.summaryResult.negatives, []);
});

test("9. Juneau behavior remains functionally equivalent to juneauPortDayEngine", () => {
  const categoryInput = {
    date: "2026-07-15",
    travelMonth: 7,
    arrivalTime: "08:00",
    allAboardTime: "16:30",
    arrivalDock: "AJ" as const,
    returnBufferMinutes: 60,
    weatherCondition: "low_ceiling_under_800ft" as const,
    mobilityLevel: "standard" as const,
    passengerWeightAbove250Lbs: true,
    youngestChildAgeYears: null,
    partySize: 2,
    budgetMaxPerPersonUsd: null,
    formatPreference: "two_activity_combo" as const,
    goalMode: "weather_resilient_port_day" as const,
  };

  const categoryResult =
    JUNEAU_HELICOPTER_DECISION_ENGINE.evaluate(categoryInput);
  const directParity = evaluateJuneauHelicopterParityWithPortDay(categoryInput);
  const directLegacy = evaluateJuneauPortDayScenario({
    shipArrivalTime: "08:00",
    allAboardTime: "16:30",
    arrivalDock: "aj_dock",
    goalMode: "two_activity_combo",
    travelMonth: 7,
    travelDate: "2026-07-15",
    partySize: 2,
    mobilityLevel: "active_walking_3mi",
    returnBufferMinutes: 60,
    weatherCondition: "low_ceiling_rain_fog",
    budgetMaxPerPersonUsd: null,
  });

  assert.deepEqual(directParity, directLegacy);
  assert.deepEqual(
    categoryResult.categorySpecificMeta?.juneauPortDayParity,
    directLegacy,
  );
  assert.equal(
    categoryResult.bestFitOption?.optionId,
    "jnu-backup-auke-bay-whale",
  );
  assert.ok(
    categoryResult.decisionChangingWarnings.some((w) =>
      w.includes("250–260 lbs"),
    ),
  );
});

test("10. Hawaii inputs produce deterministic results across all 7 representative scenarios", () => {
  // Scenario 1: Hotel guest prioritizing comfort & requiring hotel shuttle on O'ahu
  const s1HotelComfort = HAWAII_WHALE_DECISION_ENGINE.evaluate({
    island: "oahu",
    departureArea: "honolulu_kewalo",
    travelDate: "2027-02-10",
    travelMonth: 2,
    startingPoint: "hotel_resort",
    needsHotelOrPierTransfer: true,
    seasicknessOrRoughWaterConcern: "high_concern",
    priorityMode: "comfort_and_stability",
  });
  assert.equal(
    s1HotelComfort.bestFitOption?.optionId,
    "hi-whale-oahu-star-of-honolulu-stabilized",
  );

  // Scenario 2: Cruise passenger with strict return time (205m window, 60m return buffer on Maui)
  const s2CruiseTight = HAWAII_WHALE_DECISION_ENGINE.evaluate({
    island: "maui",
    travelDate: "2027-02-14",
    travelMonth: 2,
    startingPoint: "cruise_ship_pier",
    availableWindowMinutes: 205,
    cruiseReturnBufferMinutes: 60,
  });
  assert.ok(
    s2CruiseTight.eliminatedOptions.some(
      (e) =>
        e.optionId === "hi-whale-maui-pacwhale-catamaran" &&
        e.failedHardConstraintIds.includes("hc-hi-time-window-and-cruise-buffer"),
    ),
  );
  assert.ok(
    s2CruiseTight.viableOptions.some(
      (v) => v.optionId === "hi-whale-noaa-shore-lookout-free",
    ),
  );

  // Scenario 3: Family with young children (age 2 on Maui)
  const s3YoungChildren = HAWAII_WHALE_DECISION_ENGINE.evaluate({
    island: "maui",
    travelDate: "2027-02-18",
    travelMonth: 2,
    groupSize: 4,
    youngestChildAgeYears: 2,
  });
  assert.equal(
    s3YoungChildren.bestFitOption?.optionId,
    "hi-whale-maui-pacwhale-catamaran",
  );
  const s3ElimIds = s3YoungChildren.eliminatedOptions.map((e) => e.optionId);
  assert.ok(s3ElimIds.includes("hi-whale-maui-trilogy-sail-cat"));
  assert.ok(s3ElimIds.includes("hi-whale-maui-eye-level-rib-raft"));

  // Scenario 4: Traveler with mobility restrictions (step_free_wheelchair on Maui)
  const s4Wheelchair = HAWAII_WHALE_DECISION_ENGINE.evaluate({
    island: "maui",
    travelDate: "2027-02-20",
    travelMonth: 2,
    mobilityLevel: "step_free_wheelchair",
  });
  assert.equal(
    s4Wheelchair.bestFitOption?.optionId,
    "hi-whale-maui-pacwhale-catamaran",
  );
  const s4ElimIds = s4Wheelchair.eliminatedOptions.map((e) => e.optionId);
  assert.ok(s4ElimIds.includes("hi-whale-maui-trilogy-sail-cat"));
  assert.ok(s4ElimIds.includes("hi-whale-maui-eye-level-rib-raft"));

  // Scenario 5: Traveler concerned about rough water & afternoon trades
  const s5RoughWater = HAWAII_WHALE_DECISION_ENGINE.evaluate({
    island: "maui",
    travelDate: "2027-02-22",
    travelMonth: 2,
    seasicknessOrRoughWaterConcern: "high_concern",
    departureTimeOfDay: "afternoon_trades",
  });
  assert.ok(
    s5RoughWater.eliminatedOptions.some(
      (e) =>
        e.optionId === "hi-whale-maui-eye-level-rib-raft" &&
        e.failedHardConstraintIds.includes(
          "hc-hi-rough-water-seasickness-exclusion",
        ),
    ),
  );
  assert.ok(
    s5RoughWater.decisionChangingWarnings.some((w) =>
      w.includes("trade winds typically strengthen after 11:30 AM"),
    ),
  );

  // Scenario 6: Date with insufficient verified schedule information (2028-02-15)
  const s6UnverifiedDate = HAWAII_WHALE_DECISION_ENGINE.evaluate({
    island: "maui",
    travelDate: "2028-02-15",
    travelMonth: 2,
  });
  assert.ok(
    s6UnverifiedDate.unknownOrStaleFacts.some(
      (f) => f.category === "unverified_schedule_or_availability",
    ),
  );
  assert.equal(
    s6UnverifiedDate.bestFitOption?.qualificationStatus,
    "qualified_stale_or_unknown",
  );

  // Scenario 7: Situation where no tour can be responsibly recommended (August off-season)
  const s7OffSeason = HAWAII_WHALE_DECISION_ENGINE.evaluate({
    island: "maui",
    travelDate: "2026-08-15",
    travelMonth: 8,
  });
  assert.equal(s7OffSeason.viableOptions.length, 0);
  assert.equal(s7OffSeason.bestFitOption, null);
  assert.ok(
    s7OffSeason.noTourResponsiblyRecommendedReason?.includes(
      "No commercial tour can be responsibly recommended for these exact constraints",
    ),
  );

  // Determinism check
  const repeat1 = HAWAII_WHALE_DECISION_ENGINE.evaluate(
    { island: "maui", travelDate: "2027-02-10" },
    { now: new Date("2026-04-20T00:00:00Z") },
  );
  const repeat2 = HAWAII_WHALE_DECISION_ENGINE.evaluate(
    { island: "maui", travelDate: "2027-02-10" },
    { now: new Date("2026-04-20T00:00:00Z") },
  );
  assert.deepEqual(repeat1, repeat2);
});

test("11. API routes validate inputs strictly and return proper status codes", async () => {
  const indexRes = await getDecisionEnginesIndex();
  assert.equal(indexRes.status, 200);
  const indexJson = await indexRes.json();
  assert.equal(indexJson.ok, true);
  const engineIds = indexJson.engines.map((e: { engineId: string }) => e.engineId);
  assert.ok(engineIds.includes("juneau-helicopter-tours"));
  assert.ok(engineIds.includes("hawaii-whale-watching"));
  assert.ok(PHASE_1_REFERENCE_IMPLEMENTATION_AUDIT.auditedFiles.length > 5);
  assert.ok(NEXT_DCC_CATEGORY_ONBOARDING_RANKING.length >= 4);

  const notFoundRes = await getDecisionEngineDefinition(
    new Request(
      "https://destinationcommandcenter.com/api/v1/decision-engines/unknown",
    ),
    { params: Promise.resolve({ engineId: "unknown" }) },
  );
  assert.equal(notFoundRes.status, 404);

  const badPostRes = await postEvaluateDecisionEngine(
    new Request(
      "https://destinationcommandcenter.com/api/v1/decision-engines/hawaii-whale-watching/evaluate",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          island: "atlantis_invalid_island",
          travelMonth: 99,
        }),
      },
    ),
    { params: Promise.resolve({ engineId: "hawaii-whale-watching" }) },
  );
  assert.equal(badPostRes.status, 400);
  const badPostJson = await badPostRes.json();
  assert.equal(badPostJson.ok, false);
  assert.equal(badPostJson.error, "invalid_decision_engine_input");
  assert.ok(badPostJson.issues.length > 0);

  const validGetRes = await getEvaluateDecisionEngine(
    new Request(
      "https://destinationcommandcenter.com/api/v1/decision-engines/hawaii-whale-watching/evaluate?island=oahu&travelDate=2027-02-15&needsHotelOrPierTransfer=true",
    ),
    { params: Promise.resolve({ engineId: "hawaii-whale-watching" }) },
  );
  assert.equal(validGetRes.status, 200);
  const validGetJson = await validGetRes.json();
  assert.equal(
    validGetJson.result.bestFitOption.optionId,
    "hi-whale-oahu-star-of-honolulu-stabilized",
  );
});

test("12. Machine-readable API results match the server-rendered UI decision output", async () => {
  const apiRes = await postEvaluateDecisionEngine(
    new Request(
      "https://destinationcommandcenter.com/api/v1/decision-engines/hawaii-whale-watching/evaluate",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(HAWAII_WHALE_DECISION_ENGINE.defaultExampleInput),
      },
    ),
    { params: Promise.resolve({ engineId: "hawaii-whale-watching" }) },
  );
  const apiPayload = await apiRes.json();
  const apiResult = apiPayload.result;

  const html = renderToStaticMarkup(
    React.createElement(CategoryDecisionEngineExperience, {
      engineId: "hawaii-whale-watching",
      initialResult: apiResult,
    }),
  );

  assert.ok(html.includes(apiResult.conciseVerdict));
  assert.ok(html.includes(apiResult.bestFitOption.title));
  for (const viable of apiResult.viableOptions) {
    assert.ok(html.includes(`viable-option-card-${viable.optionId}`) || html.includes(`noncommercial-option-${viable.optionId}`));
  }
  for (const eliminated of apiResult.eliminatedOptions) {
    assert.ok(html.includes(`eliminated-option-${eliminated.optionId}`));
  }

  const agentManifest = buildDccRootAgentManifest() as {
    decision_engines?: Array<{ engineId: string }>;
  };
  const agentEngineIds =
    agentManifest.decision_engines?.map((e) => e.engineId) ?? [];
  assert.ok(agentEngineIds.includes("juneau-helicopter-tours"));
  assert.ok(agentEngineIds.includes("hawaii-whale-watching"));

  const llmsText = buildDccRootLlmsText();
  assert.ok(llmsText.includes("/api/v1/decision-engines/hawaii-whale-watching"));
  assert.ok(llmsText.includes("/hawaii/whale-watching"));
});

test("13. No DCC Alaska or Hawaii link points to Welcome to Alaska Tours", () => {
  for (const engine of Object.values(DECISION_ENGINE_REGISTRY)) {
    const serialized = JSON.stringify(engine);
    assert.ok(!serialized.toLowerCase().includes("welcometoalaskatours"));
    assert.ok(!serialized.toLowerCase().includes("welcome to alaska tours"));

    const evalResult = engine.evaluate(engine.defaultExampleInput);
    const evalSerialized = JSON.stringify(evalResult);
    assert.ok(!evalSerialized.toLowerCase().includes("welcometoalaskatours"));
    assert.ok(
      !evalSerialized.toLowerCase().includes("welcome to alaska tours"),
    );
  }

  assert.throws(
    () =>
      assertNoWtaBookingDestination("juneau-helicopter-tours", [
        {
          destinationId: "bad-wta",
          optionId: "test",
          sellerType: "dcc_owned_specialist",
          sellerName: "Welcome to Alaska Tours",
          actualOperatorName: "Test",
          label: "Bad link",
          url: "https://welcometoalaskatours.com/juneau",
          supportedContextParams: [],
          relationshipDisclosure: "Test",
          isCommercialPartner: true,
          commissionInfluenceOnRanking: 0,
        },
      ]),
    /disallowed Welcome to Alaska Tours/,
  );
});

test("14. No checkout, payment, cart, reservation, or Welcome to Alaska Tours files were changed", () => {
  const changedFilesRaw = execSync("git status --porcelain", {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  const changedPaths = changedFilesRaw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.slice(3).trim());

  const forbiddenPatterns = [
    /checkout/i,
    /payment/i,
    /stripe/i,
    /cart/i,
    /reservation/i,
    /booking-confirmation/i,
    /wta-renderer/i,
    /lib\/wta\//i,
  ];

  for (const filePath of changedPaths) {
    for (const pattern of forbiddenPatterns) {
      assert.doesNotMatch(filePath, pattern);
    }
  }
});

test("15. Load test: evaluation route survives >= 250 concurrent evaluation requests with 0 errors", async () => {
  const totalRequests = 260;
  const scenarioPayloads = [
    {
      engineId: "hawaii-whale-watching",
      body: {
        island: "maui",
        travelDate: "2027-02-15",
        travelMonth: 2,
        priorityMode: "comfort_and_stability",
      },
    },
    {
      engineId: "hawaii-whale-watching",
      body: {
        island: "oahu",
        travelDate: "2027-02-10",
        startingPoint: "hotel_resort",
        needsHotelOrPierTransfer: true,
        seasicknessOrRoughWaterConcern: "high_concern",
      },
    },
    {
      engineId: "hawaii-whale-watching",
      body: {
        island: "maui",
        travelDate: "2027-02-18",
        youngestChildAgeYears: 2,
        groupSize: 4,
      },
    },
    {
      engineId: "hawaii-whale-watching",
      body: {
        island: "big_island",
        travelDate: "2027-01-25",
        mobilityLevel: "limited_mobility_no_ladders",
      },
    },
    {
      engineId: "juneau-helicopter-tours",
      body: {
        date: "2026-07-15",
        arrivalTime: "08:00",
        allAboardTime: "16:30",
        arrivalDock: "CT",
        weatherCondition: "marginal_ceiling_1200ft",
      },
    },
  ];

  const latenciesMs: number[] = [];
  let failures = 0;

  const batchStart = performance.now();
  await Promise.all(
    Array.from({ length: totalRequests }, async (_, idx) => {
      const scenario = scenarioPayloads[idx % scenarioPayloads.length];
      const reqStart = performance.now();
      try {
        const response = await postEvaluateDecisionEngine(
          new Request(
            `https://destinationcommandcenter.com/api/v1/decision-engines/${scenario.engineId}/evaluate`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(scenario.body),
            },
          ),
          { params: Promise.resolve({ engineId: scenario.engineId }) },
        );
        if (response.status !== 200) {
          failures += 1;
        } else {
          const payload = await response.json();
          if (!payload.ok || !payload.result) {
            failures += 1;
          }
        }
      } catch {
        failures += 1;
      } finally {
        latenciesMs.push(performance.now() - reqStart);
      }
    }),
  );
  const totalWallMs = performance.now() - batchStart;

  const sorted = [...latenciesMs].sort((a, b) => a - b);
  const p50 = sorted[Math.floor(sorted.length * 0.5)] ?? 0;
  const p95 = sorted[Math.floor(sorted.length * 0.95)] ?? 0;
  const p99 = sorted[Math.floor(sorted.length * 0.99)] ?? 0;
  const throughputRps = (totalRequests / totalWallMs) * 1000;

  console.info(
    `[DCC Load Test] Concurrent Requests: ${totalRequests} | Failures: ${failures} | Wall Time: ${totalWallMs.toFixed(2)}ms | Throughput: ${throughputRps.toFixed(1)} req/s | p50: ${p50.toFixed(2)}ms | p95: ${p95.toFixed(2)}ms | p99: ${p99.toFixed(2)}ms`,
  );

  assert.ok(totalRequests >= 250);
  assert.equal(failures, 0);
  assert.equal(latenciesMs.length, totalRequests);
});
