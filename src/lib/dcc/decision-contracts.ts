export type EvidenceRef = {
  id: string;
  source: string;
  observedAt?: string | null;
  confidence?: number | null;
};

export type StructuredIntent = {
  destinationId: string;
  portId?: string | null;
  partySize?: number | null;
  windowStart?: string | null;
  windowEnd?: string | null;
  interests: string[];
  constraints: string[];
  preferences: string[];
  rawText?: string | null;
};

export type ReturnRiskStatus = "LOW" | "TIGHT" | "NOT_RECOMMENDED";

export type ReturnRiskAssessment = {
  status: ReturnRiskStatus;
  shipDeparture: string;
  requiredBufferMinutes: number;
  estimatedReturnTravelMinutes: number;
  uncertaintyMinutes: number;
  activityDurationMinutes: number;
  returnBufferMinutes: number;
  explanation: string[];
  evidence: EvidenceRef[];
  rulesVersion: string;
};

export type MatchGate = {
  id: string;
  label: string;
  passed: boolean;
  evidence?: EvidenceRef[];
};

export type MatchScoreComponent = {
  id: string;
  label: string;
  pointsAwarded: number;
  pointsAvailable: number;
  explanation: string;
  evidence?: EvidenceRef[];
};

export type MatchResult = {
  subjectId: string;
  eligible: boolean;
  fitScore: number | null;
  hardGates: MatchGate[];
  components: MatchScoreComponent[];
  returnRisk?: ReturnRiskAssessment | null;
  commercialInfluencePoints: 0;
  rulesVersion: string;
};

export type RecommendationExplanation = {
  title: "WHY THIS";
  summary: string;
  reasons: string[];
  caveats: string[];
  evidence: EvidenceRef[];
  generatedFromDecision: true;
};

export type VerificationState = "verified" | "reported" | "unknown" | "not_applicable";

export type LocalImpactField<T = string | number | boolean> = {
  state: VerificationState;
  value?: T | null;
  source?: string | null;
  verifiedAt?: string | null;
};

export type LocalImpactProfile = {
  subjectId: string;
  locallyOwned: LocalImpactField<boolean>;
  locallyLicensed: LocalImpactField<boolean>;
  independentOperator: LocalImpactField<boolean>;
  directServiceProvider: LocalImpactField<boolean>;
  localEmployees: LocalImpactField<number>;
  communityContribution: LocalImpactField<string>;
  updatedAt: string;
};

export function calculateReturnRisk(input: {
  shipDeparture: string;
  planEnd: string;
  requiredBufferMinutes: number;
  estimatedReturnTravelMinutes: number;
  uncertaintyMinutes: number;
  activityDurationMinutes: number;
  evidence?: EvidenceRef[];
  rulesVersion?: string;
}): ReturnRiskAssessment {
  const shipDepartureMs = Date.parse(input.shipDeparture);
  const planEndMs = Date.parse(input.planEnd);
  if (!Number.isFinite(shipDepartureMs) || !Number.isFinite(planEndMs)) {
    throw new Error("return_risk_invalid_datetime");
  }

  const rawMinutes = Math.floor((shipDepartureMs - planEndMs) / 60000);
  const returnBufferMinutes =
    rawMinutes -
    input.requiredBufferMinutes -
    input.estimatedReturnTravelMinutes -
    input.uncertaintyMinutes;

  const status: ReturnRiskStatus =
    returnBufferMinutes < 0 ? "NOT_RECOMMENDED" : returnBufferMinutes < 60 ? "TIGHT" : "LOW";

  return {
    status,
    shipDeparture: input.shipDeparture,
    requiredBufferMinutes: input.requiredBufferMinutes,
    estimatedReturnTravelMinutes: input.estimatedReturnTravelMinutes,
    uncertaintyMinutes: input.uncertaintyMinutes,
    activityDurationMinutes: input.activityDurationMinutes,
    returnBufferMinutes,
    explanation: [
      `Return buffer after safeguards: ${returnBufferMinutes} minutes.`,
      `Required boarding buffer: ${input.requiredBufferMinutes} minutes.`,
      `Estimated return travel: ${input.estimatedReturnTravelMinutes} minutes.`,
      `Uncertainty allowance: ${input.uncertaintyMinutes} minutes.`,
    ],
    evidence: input.evidence || [],
    rulesVersion: input.rulesVersion || "return-risk-v1",
  };
}

export function calculateDeterministicMatch(input: {
  subjectId: string;
  hardGates: MatchGate[];
  components: MatchScoreComponent[];
  returnRisk?: ReturnRiskAssessment | null;
  rulesVersion?: string;
}): MatchResult {
  const eligible = input.hardGates.every((gate) => gate.passed) && input.returnRisk?.status !== "NOT_RECOMMENDED";
  const available = input.components.reduce((sum, item) => sum + Math.max(0, item.pointsAvailable), 0);
  const awarded = input.components.reduce(
    (sum, item) => sum + Math.max(0, Math.min(item.pointsAwarded, item.pointsAvailable)),
    0,
  );
  const fitScore = eligible && available > 0 ? Math.round((awarded / available) * 100) : null;

  return {
    subjectId: input.subjectId,
    eligible,
    fitScore,
    hardGates: input.hardGates,
    components: input.components,
    returnRisk: input.returnRisk || null,
    commercialInfluencePoints: 0,
    rulesVersion: input.rulesVersion || "match-v1",
  };
}

export function explainMatch(result: MatchResult): RecommendationExplanation {
  const passedReasons = result.components
    .filter((component) => component.pointsAwarded > 0)
    .map((component) => component.explanation);
  const failedGates = result.hardGates.filter((gate) => !gate.passed).map((gate) => `${gate.label} did not pass.`);
  const riskCaveats = result.returnRisk?.status === "TIGHT" ? ["Return-to-ship window is tight."] : [];

  return {
    title: "WHY THIS",
    summary: result.eligible
      ? `${result.fitScore ?? 0}% deterministic fit based on declared rules and live evidence.`
      : "Not currently eligible under the declared rules.",
    reasons: passedReasons,
    caveats: [...failedGates, ...riskCaveats],
    evidence: [
      ...result.hardGates.flatMap((gate) => gate.evidence || []),
      ...result.components.flatMap((component) => component.evidence || []),
      ...(result.returnRisk?.evidence || []),
    ],
    generatedFromDecision: true,
  };
}
