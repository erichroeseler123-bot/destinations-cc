import { HAWAII_WHALE_DECISION_ENGINE } from "@/lib/dcc/decisionEngines/hawaiiWhaleWatchingEngine";
import { JUNEAU_HELICOPTER_DECISION_ENGINE } from "@/lib/dcc/decisionEngines/juneauHelicopterEngine";
import type {
  DecisionEngineCategoryId,
  DecisionEngineDefinition,
  DecisionEvaluateOptions,
  DecisionResult,
} from "@/lib/dcc/decisionEngines/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const DECISION_ENGINE_REGISTRY: Record<DecisionEngineCategoryId, DecisionEngineDefinition<any>> = {
  "juneau-helicopter-tours": JUNEAU_HELICOPTER_DECISION_ENGINE,
  "hawaii-whale-watching": HAWAII_WHALE_DECISION_ENGINE,
};

export function listDecisionEngines(): Array<DecisionEngineDefinition<unknown>> {
  return Object.values(DECISION_ENGINE_REGISTRY);
}

export function getDecisionEngineById(
  engineId: string,
): DecisionEngineDefinition<unknown> | null {
  if (Object.prototype.hasOwnProperty.call(DECISION_ENGINE_REGISTRY, engineId)) {
    return DECISION_ENGINE_REGISTRY[engineId as DecisionEngineCategoryId];
  }
  return null;
}

export function evaluateRegisteredDecisionEngine(
  engineId: string,
  rawInput: unknown,
  options?: DecisionEvaluateOptions,
): DecisionResult<unknown> {
  const engine = getDecisionEngineById(engineId);
  if (!engine) {
    throw new Error(
      `Unknown DCC decision engine category "${engineId}". Registered categories: ${Object.keys(DECISION_ENGINE_REGISTRY).join(", ")}.`,
    );
  }
  return engine.evaluate(rawInput, options);
}

export function serializeDecisionEngineSummary(
  engine: DecisionEngineDefinition<unknown>,
) {
  return {
    engineId: engine.engineId,
    version: engine.version,
    slug: engine.slug,
    canonicalPath: engine.canonicalPath,
    canonicalUrl: engine.canonicalUrl,
    title: engine.title,
    destinationName: engine.destinationName,
    categoryName: engine.categoryName,
    heroQuestion: engine.heroQuestion,
    summaryDescription: engine.summaryDescription,
    questionCount: engine.questions.length,
    candidateOptionCount: engine.candidateOptions.length,
    hardConstraintRuleCount: engine.hardConstraintRules.length,
    preferenceRuleCount: engine.preferenceRules.length,
    evidenceClaimCount: engine.evidenceClaims.length,
    sourceRecordCount: engine.sourceRecords.length,
    endpoints: {
      definitionUrl: `/api/v1/decision-engines/${engine.engineId}`,
      evaluateUrl: `/api/v1/decision-engines/${engine.engineId}/evaluate`,
      machineEngineUrl: `/api/v1/engines/${engine.engineId}`,
      machineBundleUrl: `/api/v1/bundles/${engine.engineId}/${engine.version}`,
      machineEvaluateUrl: `/api/v1/evaluate`,
      stableReferenceUri: `/r/${engine.engineId}`,
      immutableReferenceUri: `/r/${engine.engineId}/v/${engine.version}`,
      humanPageUrl: engine.canonicalPath,
    },
  };
}

export function serializeDecisionEngineFullDefinition(
  engine: DecisionEngineDefinition<unknown>,
) {
  const defaultEvaluation = engine.evaluate(engine.defaultExampleInput);
  return {
    ...serializeDecisionEngineSummary(engine),
    referenceGuide: engine.referenceGuide,
    questions: engine.questions,
    defaultExampleInput: engine.defaultExampleInput,
    comparisonDimensions: engine.comparisonDimensions,
    candidateOptions: engine.candidateOptions,
    hardConstraintRules: engine.hardConstraintRules.map((rule) => ({
      ruleId: rule.ruleId,
      label: rule.label,
      description: rule.description,
      sourceIds: rule.sourceIds,
    })),
    preferenceRules: engine.preferenceRules.map((rule) => ({
      ruleId: rule.ruleId,
      label: rule.label,
      maxPoints: rule.maxPoints,
    })),
    evidenceClaims: engine.evidenceClaims,
    sourceRecords: engine.sourceRecords,
    defaultExampleEvaluation: defaultEvaluation,
  };
}

export const PHASE_1_REFERENCE_IMPLEMENTATION_AUDIT = {
  auditedFiles: [
    "lib/dcc/juneauPortDayEngine.ts",
    "lib/dcc/travelReference.ts",
    "app/components/dcc/TravelReferenceExperience.tsx",
    "app/components/dcc/JuneauPortDayPlanner.tsx",
    "app/juneau/helicopter-tours/page.tsx",
    "lib/dcc/guestFeedback.ts",
    "lib/dcc/discoveryStack.ts",
    "app/api/v1/juneau-port-day/route.ts",
    "app/api/v1/travel-reference/route.ts",
  ],
  architecturalClassification: {
    genericDecisionEngineBehavior: [
      "Strict Zod runtime input validation and example-scenario detection when traveler date is omitted.",
      "Hard-constraint evaluation first to separate viable options from eliminated options with exact reasons and actionable recovery hints.",
      "Preference-only scoring of viable options with zero commercial weight (commercialWeightAppliedToRanking: 0).",
      "Separation of time fit, operating schedule confirmation, evidence confidence, accessibility, and preference match.",
      "Source freshness evaluation (current, stale, unavailable, withdrawn, conflicted) and qualification of stale/unknown facts.",
      "Dated third-party review summarization via summarizeRecentReviews (<=180 days, >=3 reviews, >=2 per theme, no fabricated summaries).",
    ],
    juneauSpecificRules: [
      "JUNEAU_DOCK_TRANSFER_TABLE mapping CT, FKL, AS, AJ, ACT, TENDER_FKL, and UNKNOWN berths to JNU Airport and Auke Bay transfer windows.",
      "Tongass National Forest special-use permit distinction among TEMSCO, Coastal, and NorthStar.",
      "Capital Transit Route 3/4 1.5-mile walk disclosure vs. USFS Mendenhall Express shuttles.",
    ],
    helicopterSpecificQuestionsAndComparisons: [
      "FAA VFR ceiling scenario assumptions (<800 ft overcast vs. 1,200 ft marginal vs. >2,500 ft clear).",
      "FAA clothed body-weight balance surcharge threshold (>250–260 lbs).",
      "Upper-snowpack glacier dog sled camp seasonality (May–August) vs. lower-ice landings (May–September).",
      "Flight minutes vs. glacier surface time (20-minute guided walk vs. NorthStar 2-hour crampon trek).",
    ],
    presentationCode: [
      "app/components/dcc/JuneauPortDayPlanner.tsx (interactive Juneau port-day planner component).",
      "app/components/dcc/TravelReferenceExperience.tsx (reference corridor shell).",
      "app/components/dcc/CategoryDecisionEngineExperience.tsx (shared category decision engine UI for crawlable pre-question reference + interactive evaluation).",
    ],
    evidenceAndCitationInfrastructure: [
      "SourceRecord and EvidenceClaim registries with 6-class claim taxonomy (official_rule, operator_published_fact, live_availability_or_observation, forecast_or_model_output, recent_third_party_review_evidence, dcc_interpretation).",
      "Runtime invariant assertDecisionChangingClaimsHaveSources ensuring every decision-changing claim resolves to a valid SourceRecord.",
      "Cache-Control header derivation from source health (no-store on withdrawn/conflicted, short revalidation on stale/unavailable).",
    ],
    commerceLinkInfrastructure: [
      "BookingDestination records separating actualOperatorName from sellerName and sellerType (direct_operator, dcc_owned_specialist, affiliate_marketplace, public_or_diy).",
      "Context-parameter propagation limited strictly to supportedContextParams.",
      "Hard runtime invariant assertNoWtaBookingDestination blocking any Welcome to Alaska Tours domain or label across all DCC surfaces.",
    ],
  },
} as const;

export const NEXT_DCC_CATEGORY_ONBOARDING_RANKING = [
  {
    rank: 1,
    engineId: "juneau-whale-watching",
    canonicalPath: "/juneau/whale-watching",
    rationale:
      "Reuses CBJ dock transfer math (`JUNEAU_DOCK_TRANSFER_TABLE` to Auke Bay / Statter Harbor) and NOAA 100-yard humpback regulations while comparing enclosed heated catamarans (Allen Marine, Gastineau Guiding) against small-group 6-to-20 passenger sentinel vessels (Harv & Marv, Jayleen's) and combo Mendenhall transfers.",
  },
  {
    rank: 2,
    engineId: "alaska-dog-sledding-excursions",
    canonicalPath: "/alaska/dog-sledding",
    rationale:
      "High-stakes traveler decision between upper-glacier helicopter snowpack camps ($679–$749, high ceiling cancellation risk, May–August only) and wheeled dry-land summer musher camps ($179–$239, weather-resilient, May–September) across Juneau, Skagway, and Seward.",
  },
  {
    rank: 3,
    engineId: "denver-to-mountain-transportation",
    canonicalPath: "/denver/mountain-transportation",
    rationale:
      "Constraint-heavy corridor comparing Bustang / Pegasus CDOT public coaches, Epic Mountain Express shared shuttles, Winter Park Express Amtrak ski train, private SUVs, and I-70 traction-law rental cars by arrival terminal (DEN vs. Union Station), luggage/ski bags, and storm conditions.",
  },
  {
    rank: 4,
    engineId: "new-orleans-swamp-tours",
    canonicalPath: "/new-orleans/swamp-tours",
    rationale:
      "Clear physical and regulatory tradeoffs between high-speed loud airboats (minimum age 5+, pregnancy/back restrictions, ear protection, private marsh tracts) and covered flat-bottom pontoon boats (all ages, wheelchair accessible, Jean Lafitte National Historical Park & Honey Island Swamp) plus hotel pickup vs. self-drive.",
  },
] as const;
