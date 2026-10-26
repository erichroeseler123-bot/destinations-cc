import { z } from "zod";
import type {
  RecentReviewSummaryResult,
  ThirdPartyReviewInput,
} from "@/lib/dcc/guestFeedback";

export type DecisionEngineCategoryId =
  | "juneau-helicopter-tours"
  | "hawaii-whale-watching";

export type ClaimClassification =
  | "official_rule"
  | "operator_published_fact"
  | "live_availability_or_observation"
  | "forecast_or_model_output"
  | "recent_third_party_review_evidence"
  | "dcc_interpretation";

export type SourceFreshnessCategory =
  | "regulatory_annual"
  | "seasonal_schedule"
  | "operator_tariff_and_policy"
  | "live_telemetry"
  | "third_party_reviews";

export type SourceStatus =
  | "current"
  | "stale"
  | "unavailable"
  | "withdrawn"
  | "conflicted";

export interface SourceRecord {
  sourceId: string;
  sourceOrganization: string;
  sourceTitle: string;
  sourceUrl: string;
  claimsSupported: string[];
  retrievedAt: string;
  verifiedAt: string;
  expiresAt: string;
  freshnessCategory: SourceFreshnessCategory;
  status: SourceStatus;
  statusNote?: string;
}

export interface EvidenceClaim {
  claimId: string;
  classification: ClaimClassification;
  statement: string;
  fieldsSupported: string[];
  sourceIds: string[];
  isDecisionChanging: boolean;
  verificationNote: string;
}

export interface ReviewEvidence {
  optionId: string;
  productCode: string | null;
  summaryResult: RecentReviewSummaryResult;
  sourceIds: string[];
}

export type BookingChannelSellerType =
  | "direct_operator"
  | "dcc_owned_specialist"
  | "affiliate_marketplace"
  | "public_or_diy";

export interface BookingDestination {
  destinationId: string;
  optionId: string;
  sellerType: BookingChannelSellerType;
  sellerName: string;
  actualOperatorName: string;
  label: string;
  url: string;
  supportedContextParams: string[];
  relationshipDisclosure: string;
  isCommercialPartner: boolean;
  commissionInfluenceOnRanking: 0;
}

export interface QuestionOptionChoice {
  value: string;
  label: string;
  description?: string;
}

export interface QuestionDefinition {
  questionId: string;
  label: string;
  helpText: string;
  inputType: "select" | "date" | "number" | "boolean" | "time";
  requiredForPersonalizedVerdict: boolean;
  decisionImpactExplanation: string;
  drivenByClaimIds: string[];
  options?: QuestionOptionChoice[];
  min?: number;
  max?: number;
  defaultValue: string | number | boolean | null;
}

export type AnswerSchema<TInput> = z.ZodType<TInput>;

export interface ComparisonDimension {
  dimensionId: string;
  label: string;
  description: string;
  unitOrFormat?: string;
}

export interface CandidateOptionReviewConfig {
  productCode: string | null;
  reviews: ThirdPartyReviewInput[];
  checkStatus: "checked_ok" | "unavailable" | "not_checked";
  lastRetrievedAt: string | null;
  sourcesQueried: string[];
}

export interface CandidateOption {
  optionId: string;
  title: string;
  shortLabel: string;
  optionKind:
    | "guided_commercial"
    | "private_charter"
    | "public_or_diy"
    | "owned_specialist_comparison";
  actualOperators: string[];
  islandsOrRegions: string[];
  departureAreas: string[];
  operatingMonths: number[];
  scheduleVerifiedThroughDate?: string;
  vesselOrVehicleType: string;
  groupCapacityRange: {
    min: number;
    max: number;
    label: string;
  };
  rideComfortLevel:
    | "high_stability"
    | "moderate_open_water"
    | "high_motion_raft_or_aircraft"
    | "shore_stationary";
  viewingSpaceDescription: string;
  durationMinutes: {
    activity: number;
    checkInLead: number;
    typicalTransferEachWay: number;
    totalDockOrHotelRange: { min: number; max: number };
    label: string;
  };
  minimumAgeYears: number | null;
  minimumAgeNote: string;
  prohibitsPregnantOrSpinalConditions?: boolean;
  accessibilityProfile: {
    stepFreeWheelchairSupported: boolean;
    limitedMobilitySupported: boolean;
    walkingAndBoardingRequirement: string;
    confirmationStatus:
      | "confirmed_accessible"
      | "operator_confirmation_required"
      | "not_accessible";
    note: string;
  };
  transportationAvailability: {
    hotelPickupAvailable: boolean;
    cruisePortShuttleAvailable: boolean;
    selfDriveParkingNote: string;
  };
  cancellationTerms: string;
  whaleSightingOrReRidePolicy: string;
  indicativePriceUsd: {
    min: number;
    max: number;
    basisLabel: string;
  };
  comparisonValues: Record<string, string>;
  tradeoffs: {
    strengths: string[];
    limitations: string[];
  };
  claimIds: string[];
  sourceIds: string[];
  bookingDestinations: BookingDestination[];
  reviewEvidenceConfig?: CandidateOptionReviewConfig;
}

export interface UnknownOrStaleFact {
  factId: string;
  optionId: string | null;
  category:
    | "missing_traveler_input"
    | "unverified_schedule_or_availability"
    | "stale_source"
    | "unavailable_source"
    | "conflicted_source"
    | "operator_confirmation_required";
  summary: string;
  impactOnDecision: string;
  sourceIds: string[];
}

export interface TimingCalculationResult {
  availableWindowMinutes: number | null;
  requiredTotalMinutes: number;
  checkInLeadMinutes: number;
  transferMinutesRoundTrip: number;
  activityMinutes: number;
  returnBufferMinutes: number;
  netSlackMinutes: number | null;
  summary: string;
}

export interface HardConstraintEvalContext {
  now: Date;
  evaluatedSourcesById: Map<string, SourceRecord>;
  computeTimingForOption: (option: CandidateOption) => TimingCalculationResult;
}

export interface HardConstraintCheckResult {
  passed: boolean;
  eliminationReason?: string;
  whatInputChangeWouldAlterResult?: string;
  unknownOrStaleWarning?: UnknownOrStaleFact;
  decisionChangingWarning?: string;
}

export interface HardConstraintRule<TInput> {
  ruleId: string;
  label: string;
  description: string;
  sourceIds: string[];
  evaluate: (
    option: CandidateOption,
    input: TInput,
    context: HardConstraintEvalContext,
  ) => HardConstraintCheckResult;
}

export interface PreferenceRule<TInput> {
  ruleId: string;
  label: string;
  maxPoints: number;
  evaluate: (
    option: CandidateOption,
    input: TInput,
    context: HardConstraintEvalContext,
  ) => {
    points: number;
    reason: string | null;
  };
}

export interface EliminatedOption {
  optionId: string;
  title: string;
  shortLabel: string;
  optionKind: CandidateOption["optionKind"];
  failedHardConstraintIds: string[];
  eliminationReasons: string[];
  whatInputChangeWouldAlterResult: string[];
  supportingSourceIds: string[];
}

export interface EvaluatedViableOption {
  optionId: string;
  title: string;
  shortLabel: string;
  optionKind: CandidateOption["optionKind"];
  actualOperators: string[];
  islandsOrRegions: string[];
  departureAreas: string[];
  vesselOrVehicleType: string;
  indicativePriceUsd: CandidateOption["indicativePriceUsd"];
  fitTier:
    | "best_fit"
    | "strong_fit"
    | "qualified_fit"
    | "noncommercial_alternative";
  qualificationStatus: "verified_fit" | "qualified_stale_or_unknown";
  preferenceScore: number;
  preferenceBreakdown: Array<{
    ruleId: string;
    label: string;
    points: number;
    reason: string;
  }>;
  commercialWeightApplied: 0;
  whyItFits: string[];
  tradeoffs: {
    strengths: string[];
    limitations: string[];
  };
  timingCalculation: TimingCalculationResult;
  comparisonValues: Record<string, string>;
  unknownOrStaleFacts: UnknownOrStaleFact[];
  decisionChangingWarnings: string[];
  supportingClaims: EvidenceClaim[];
  supportingSources: SourceRecord[];
  reviewEvidence: ReviewEvidence | null;
  bookingDestinations: BookingDestination[];
}

export interface DecisionEvaluateOptions {
  now?: Date;
  sourceStatusOverrides?: Record<string, SourceStatus>;
  reviewConfigOverrides?: Record<string, CandidateOptionReviewConfig>;
  soldOutOptionIds?: string[];
}

export interface DecisionResult<TInput = Record<string, unknown>> {
  engineId: DecisionEngineCategoryId;
  engineVersion: string;
  evaluatedAt: string;
  isExampleScenario: boolean;
  exampleScenarioBanner: string | null;
  normalizedAnswers: TInput;
  conciseVerdict: string;
  noTourResponsiblyRecommendedReason: string | null;
  bestFitOption: EvaluatedViableOption | null;
  viableOptions: EvaluatedViableOption[];
  alternatives: EvaluatedViableOption[];
  eliminatedOptions: EliminatedOption[];
  tradeoffs: Array<{
    optionId: string;
    shortLabel: string;
    strengths: string[];
    limitations: string[];
  }>;
  unknownOrStaleFacts: UnknownOrStaleFact[];
  decisionChangingWarnings: string[];
  evidenceHealth: {
    status:
      | "all_current"
      | "has_stale_or_unavailable"
      | "has_withdrawn_or_conflicted";
    recommendedCacheControl: string;
    currentCount: number;
    staleCount: number;
    unavailableOrWithdrawnCount: number;
  };
  sourceReferences: SourceRecord[];
  bookingDestinations: BookingDestination[];
  commercialNeutrality: {
    commercialWeightAppliedToRanking: 0;
    preselectedCommissionSeller: false;
    disclosure: string;
  };
  categorySpecificMeta?: Record<string, unknown>;
}

export interface CategoryReferenceGuide {
  importantDecisionFactors: Array<{
    title: string;
    detail: string;
    sourceIds: string[];
  }>;
  experienceAndVesselTypes: Array<{
    typeName: string;
    capacityAndStability: string;
    bestFor: string;
    limitations: string;
    sourceIds: string[];
  }>;
  departureLocations: Array<{
    islandOrRegion: string;
    harborOrArea: string;
    logisticsNote: string;
    sourceIds: string[];
  }>;
  commonTradeoffs: Array<{
    tradeoff: string;
    explanation: string;
  }>;
  operationalDependencies: Array<{
    dependency: string;
    impact: string;
    sourceIds: string[];
  }>;
  methodologySteps: string[];
}

export interface DecisionEngineDefinition<TInput = Record<string, unknown>> {
  engineId: DecisionEngineCategoryId;
  version: string;
  slug: string;
  canonicalPath: string;
  canonicalUrl: string;
  title: string;
  destinationName: string;
  categoryName: string;
  heroQuestion: string;
  summaryDescription: string;
  referenceGuide: CategoryReferenceGuide;
  questions: QuestionDefinition[];
  answerSchema: AnswerSchema<TInput>;
  defaultExampleInput: TInput;
  comparisonDimensions: ComparisonDimension[];
  candidateOptions: CandidateOption[];
  hardConstraintRules: HardConstraintRule<TInput>[];
  preferenceRules: PreferenceRule<TInput>[];
  evidenceClaims: EvidenceClaim[];
  sourceRecords: SourceRecord[];
  computeTimingForOption: (
    option: CandidateOption,
    input: TInput,
  ) => TimingCalculationResult;
  isExampleScenarioDetector: (
    rawInput: unknown,
    normalizedInput: TInput,
  ) => {
    isExample: boolean;
    banner: string | null;
    missingInputFacts: UnknownOrStaleFact[];
  };
  customizeBookingDestinations?: (
    option: CandidateOption,
    input: TInput,
    isExample: boolean,
  ) => BookingDestination[];
  evaluate: (
    rawInput: unknown,
    options?: DecisionEvaluateOptions,
  ) => DecisionResult<TInput>;
}
