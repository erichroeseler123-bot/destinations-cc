import crypto from "node:crypto";
import type {
  V03CandidateDispositionState,
  V03CandidateUniverse,
} from "./candidateUniverse";
import {
  rfc8785Canonicalize,
  sha256HexFull,
  signV03DecisionReceiptJws,
  verifyV03DecisionReceiptJws,
  type V03SignedDecisionReceipt,
} from "./rfc8785AndJws";
import {
  AppendOnlyKnowledgeLedger,
  ClientSuppliedKnownAtForbiddenError,
  type V03ProjectedClaimState,
} from "./temporalLedger";

/**
 * DCC Machine Layer v0.3 — Deterministic Evaluator, Server-Controlled Cutoff,
 * Historical Receipt Replay, and Isolated Administrative Simulation
 */

export class UnauthorizedAdminSimulationError extends Error {
  public readonly code = "UNAUTHORIZED_ADMIN_SIMULATION";
  public readonly statusCode = 403;
  constructor(message: string) {
    super(message);
    this.name = "UnauthorizedAdminSimulationError";
  }
}

export class SyntheticReceiptHistoricalReplayForbiddenError extends Error {
  public readonly code = "SYNTHETIC_RECEIPT_HISTORICAL_REPLAY_FORBIDDEN";
  public readonly statusCode = 400;
  constructor(receiptId: string) {
    super(
      `SYNTHETIC_RECEIPT_HISTORICAL_REPLAY_FORBIDDEN: Receipt "${receiptId}" was produced in administrative simulation mode (isSynthetic=true) and may never be replayed or cited as genuine historical knowledge.`,
    );
    this.name = "SyntheticReceiptHistoricalReplayForbiddenError";
  }
}

export interface V03DecisionRule {
  ruleId: string;
  ruleVersionId: string;
  ruleKind: "hard_gate" | "qualification_modifier" | "ranking_weight" | "required_evidence_gate";
  title: string;
  reasonCode: string;
  requiredClaimId: string;
  predicateType:
    | "claim_must_be_eligible_and_boolean_true"
    | "input_lte_claim_number"
    | "input_gte_claim_number"
    | "input_equals_candidate_attr"
    | "qualification_penalty_if_input_matches";
  inputField?: string;
  candidateAttrKey?: string;
  expectedValue?: string | number | boolean;
  scoreDelta: number;
  ruleHash: string;
}

export interface V03CompiledEngineBundle {
  objectType: "DecisionIrBundle";
  spec: "dcc-decision-ir/0.3";
  engineId: string;
  engineVersion: string;
  compilerVersion: string;
  universeId: string;
  universeVersion: string;
  universeHash: string;
  knowledgeCutoff: string;
  isSynthetic: boolean;
  rules: V03DecisionRule[];
  pinnedSchemaHashes: Record<string, string>;
  bundleHash: string;
}

export function compileV03EngineBundle(params: {
  engineId: string;
  engineVersion: string;
  compilerVersion?: string;
  universe: V03CandidateUniverse;
  rules: Array<Omit<V03DecisionRule, "ruleHash">>;
  pinnedSchemaHashes: Record<string, string>;
}): V03CompiledEngineBundle {
  const compilerVersion = params.compilerVersion ?? "dcc-ir-compiler/0.3.0";
  const compiledRules: V03DecisionRule[] = params.rules.map((r) => {
    const ruleHash = sha256HexFull(rfc8785Canonicalize(r));
    return { ...r, ruleHash };
  });

  const core = {
    objectType: "DecisionIrBundle" as const,
    spec: "dcc-decision-ir/0.3" as const,
    engineId: params.engineId,
    engineVersion: params.engineVersion,
    compilerVersion,
    universeId: params.universe.universeId,
    universeVersion: params.universe.version,
    universeHash: params.universe.universeHash,
    knowledgeCutoff: params.universe.knowledgeCutoff,
    isSynthetic: params.universe.isSynthetic,
    rules: compiledRules,
    pinnedSchemaHashes: params.pinnedSchemaHashes,
  };

  return {
    ...core,
    bundleHash: sha256HexFull(rfc8785Canonicalize(core)),
  };
}

export interface V03CandidateEvaluationDetail {
  candidateDccEntityId: string;
  legacyCandidateCode: string;
  displayName: string;
  operatorDccEntityId: string;
  disposition: V03CandidateDispositionState;
  totalScore: number | null;
  reasonCodes: string[];
  evaluatedClaimVersions: Array<{
    claimId: string;
    claimVersionId: string;
    assertionType: string;
    epistemicState: string;
    lifecycleState: string;
    freshnessState: string;
    typedValue: string | number | boolean | null;
    originatingEventHash: string;
    latestMutatingEventHash: string;
  }>;
  evidenceRefIds: string[];
}

export interface V03EvaluationResult {
  ok: true;
  spec: "dcc-evaluation-response/0.3";
  executionClass: "current_evaluation" | "historical_replay" | "administrative_simulation";
  isSynthetic: boolean;
  syntheticWatermark: string | null;
  evaluationRunId: string;
  traceRunId: string;
  evaluationFingerprint: string;
  receiptId: string;
  engineId: string;
  engineVersion: string;
  compilerVersion: string;
  bundleHash: string;
  candidateUniverseId: string;
  candidateUniverseVersion: string;
  candidateUniverseHash: string;
  validAt: string;
  knowledgeCutoff: string;
  normalizedInputHash: string;
  decisionState:
    | "recommended"
    | "qualified_recommendation"
    | "no_viable_candidates"
    | "indeterminate_insufficient_evidence";
  recommendedCandidateDccId: string | null;
  recommendedCandidateLegacyCode: string | null;
  candidateDispositions: V03CandidateEvaluationDetail[];
  resultHash: string;
  traceHash: string;
  epistemicLimitationStatement: string;
  gateFailureCode?: string | null;
  cacheStatus?: "computed" | "reused";
  callerClientId?: string;
  clientId?: string;
  traceparent?: string;
  assuranceIsolation?: {
    commercialParametersConsumed: false;
    strippedCommercialKeys: string[];
    strippedUntrustedIdentityKeys: string[];
    requiresCommercialHandoff: false;
    outboundAffiliateLinksInjected: false;
  };
  receipt: V03SignedDecisionReceipt;
}

/**
 * Core deterministic evaluation engine used by:
 * 1. `evaluateCurrentV03` (ordinary evaluation — server establishes `knowledgeCutoff`, rejects client `knownAt`)
 * 2. `replayHistoricalReceiptV03` (receipt replay — uses pinned `knowledgeCutoff` & pinned hashes from receipt)
 * 3. `simulateAdministrativeV03` (admin simulation — authenticated, isolated, watermarked `isSynthetic: true`)
 */
async function executeDeterministicEvaluationCore(params: {
  executionClass: "current_evaluation" | "historical_replay" | "administrative_simulation";
  isSynthetic: boolean;
  syntheticWatermark: string | null;
  bundle: V03CompiledEngineBundle;
  universe: V03CandidateUniverse;
  ledger: AppendOnlyKnowledgeLedger;
  inputs: Record<string, unknown>;
  validAtIso: string;
  knowledgeCutoffIso: string;
  issuedAtIso?: string;
  pinnedClaimEventHashesFromReceipt?: Record<string, string>;
}): Promise<V03EvaluationResult> {
  const evaluationRunId = `evalrun:${crypto.randomUUID()}`;
  const traceRunId = `tracerun:${crypto.randomUUID()}`;

  const normalizedInputsCanonical = rfc8785Canonicalize(params.inputs);
  const normalizedInputHash = sha256HexFull(normalizedInputsCanonical);

  const projection = params.ledger.rebuildProjectionAtCutoff({
    validAtIso: params.validAtIso,
    knowledgeCutoffIso: params.knowledgeCutoffIso,
    includeSynthetic: params.isSynthetic || params.universe.isSynthetic,
    pinnedClaimEventHashes: params.pinnedClaimEventHashesFromReceipt,
  });

  const pinnedRuleVersionHashes: Record<string, string> = {};
  for (const r of params.bundle.rules) {
    pinnedRuleVersionHashes[r.ruleVersionId] = r.ruleHash;
  }

  const pinnedClaimEventHashes: Record<string, string> = {};
  const pinnedEvidenceHashes: Record<string, string> = {};

  const candidateDispositions: V03CandidateEvaluationDetail[] = [];

  for (const cand of params.universe.includedCandidates) {
    let ineligible = false;
    let indeterminate = false;
    let qualified = false;
    let score = 100;
    const reasonCodes: string[] = [];
    const evaluatedClaims: V03CandidateEvaluationDetail["evaluatedClaimVersions"] = [];
    const evidenceRefIds = new Set<string>();

    if (
      typeof params.inputs.__storageGateIndeterminateReason === "string" &&
      params.inputs.__storageGateIndeterminateReason.length > 0
    ) {
      indeterminate = true;
      reasonCodes.push(params.inputs.__storageGateIndeterminateReason);
    }

    // 1. Check all candidate requiredClaimIds in the projection
    for (const reqClaimId of cand.requiredClaimIds) {
      const claimState = projection.effectiveClaimByClaimId.get(reqClaimId);
      if (!claimState) {
        indeterminate = true;
        reasonCodes.push(`MISSING_REQUIRED_CLAIM_AT_CUTOFF:${reqClaimId}`);
        continue;
      }

      pinnedClaimEventHashes[claimState.claimVersionId] = claimState.latestMutatingEventHash;
      for (const evRef of claimState.evidenceRefs) {
        pinnedEvidenceHashes[evRef.evidenceRefId] = evRef.evidenceHash;
        evidenceRefIds.add(evRef.evidenceRefId);
      }

      evaluatedClaims.push({
        claimId: claimState.claimId,
        claimVersionId: claimState.claimVersionId,
        assertionType: claimState.assertionType,
        epistemicState: claimState.epistemicState,
        lifecycleState: claimState.lifecycleState,
        freshnessState: claimState.freshnessStateAtEval,
        typedValue: claimState.typedValue,
        originatingEventHash: claimState.originatingEventHash,
        latestMutatingEventHash: claimState.latestMutatingEventHash,
      });

      if (!claimState.canSupportPositiveEligibility) {
        indeterminate = true;
        reasonCodes.push(
          `UNSUPPORTED_PROPOSITION_INDETERMINATE:${reqClaimId}:${claimState.ineligibilityOrIndeterminateReason}`,
        );
      }
    }

    // 2. Execute rules against candidate & projected claims
    for (const rule of params.bundle.rules) {
      if (rule.requiredClaimId === "NONE_STATIC_CANDIDATE_ATTR") {
        if (rule.predicateType === "input_equals_candidate_attr") {
          const inputVal = rule.inputField ? params.inputs[rule.inputField] : undefined;
          const candVal = rule.candidateAttrKey
            ? cand.staticAttributes[rule.candidateAttrKey]
            : undefined;
          if (inputVal !== undefined && candVal !== undefined && inputVal === candVal) {
            score += rule.scoreDelta;
            reasonCodes.push(`${rule.reasonCode}_MATCH`);
          }
        } else if (rule.predicateType === "qualification_penalty_if_input_matches") {
          const inputVal = rule.inputField ? params.inputs[rule.inputField] : undefined;
          if (inputVal === rule.expectedValue) {
            qualified = true;
            score += rule.scoreDelta;
            reasonCodes.push(rule.reasonCode);
          }
        }
        continue;
      }

      const claimState = projection.effectiveClaimByClaimId.get(rule.requiredClaimId);
      if (!claimState) {
        if (rule.ruleKind === "hard_gate" || rule.ruleKind === "required_evidence_gate") {
          indeterminate = true;
          reasonCodes.push(`${rule.reasonCode}:CLAIM_NOT_KNOWN_AT_CUTOFF`);
        }
        continue;
      }

      pinnedClaimEventHashes[claimState.claimVersionId] = claimState.latestMutatingEventHash;
      for (const evRef of claimState.evidenceRefs) {
        pinnedEvidenceHashes[evRef.evidenceRefId] = evRef.evidenceHash;
        evidenceRefIds.add(evRef.evidenceRefId);
      }

      if (!evaluatedClaims.some((c) => c.claimVersionId === claimState.claimVersionId)) {
        evaluatedClaims.push({
          claimId: claimState.claimId,
          claimVersionId: claimState.claimVersionId,
          assertionType: claimState.assertionType,
          epistemicState: claimState.epistemicState,
          lifecycleState: claimState.lifecycleState,
          freshnessState: claimState.freshnessStateAtEval,
          typedValue: claimState.typedValue,
          originatingEventHash: claimState.originatingEventHash,
          latestMutatingEventHash: claimState.latestMutatingEventHash,
        });
      }

      if (!claimState.canSupportPositiveEligibility) {
        indeterminate = true;
        reasonCodes.push(
          `${rule.reasonCode}:${claimState.ineligibilityOrIndeterminateReason ?? "CLAIM_NOT_ELIGIBLE"}`,
        );
        continue;
      }

      if (rule.predicateType === "claim_must_be_eligible_and_boolean_true") {
        if (claimState.typedValue !== true) {
          if (rule.ruleKind === "required_evidence_gate") {
            indeterminate = true;
            reasonCodes.push(rule.reasonCode);
          } else {
            ineligible = true;
            reasonCodes.push(rule.reasonCode);
          }
        } else {
          score += rule.scoreDelta;
        }
      } else if (rule.predicateType === "input_lte_claim_number") {
        const inputVal = rule.inputField ? params.inputs[rule.inputField] : undefined;
        if (inputVal === undefined || inputVal === null) {
          indeterminate = true;
          reasonCodes.push(`INPUT_UNKNOWN:${rule.inputField ?? "unknown"}`);
        } else if (
          typeof inputVal === "number" &&
          typeof claimState.typedValue === "number"
        ) {
          if (inputVal > claimState.typedValue) {
            const candSurchargeThreshold =
              typeof cand.staticAttributes.weightSurchargeThresholdLbs === "number"
                ? cand.staticAttributes.weightSurchargeThresholdLbs
                : claimState.typedValue;
            const candHardMax =
              typeof cand.staticAttributes.hardMaxWeightLbs === "number"
                ? cand.staticAttributes.hardMaxWeightLbs
                : null;
            if (cand.staticAttributes.weightPolicyType === "surcharge_only") {
              if (candHardMax !== null && inputVal > candHardMax) {
                ineligible = true;
                reasonCodes.push("PASSENGER_WEIGHT_EXCEEDS_HARD_LIMIT");
              } else if (inputVal >= candSurchargeThreshold) {
                qualified = true;
                score -= 10;
                reasonCodes.push(`${rule.reasonCode}_QUALIFIED_SURCHARGE_REQUIRED`);
              } else {
                score += rule.scoreDelta;
              }
            } else if (cand.staticAttributes.supportsWeightOverride === true && inputVal <= 300) {
              qualified = true;
              score -= 10;
              reasonCodes.push(`${rule.reasonCode}_QUALIFIED_SURCHARGE_REQUIRED`);
            } else {
              ineligible = true;
              reasonCodes.push(rule.reasonCode);
            }
          } else {
            score += rule.scoreDelta;
          }
        }
      } else if (rule.predicateType === "input_gte_claim_number") {
        const inputVal = rule.inputField ? params.inputs[rule.inputField] : undefined;
        if (inputVal === undefined || inputVal === null) {
          indeterminate = true;
          reasonCodes.push(`INPUT_UNKNOWN:${rule.inputField ?? "unknown"}`);
        } else if (
          typeof inputVal === "number" &&
          typeof claimState.typedValue === "number"
        ) {
          if (inputVal < claimState.typedValue) {
            ineligible = true;
            reasonCodes.push(rule.reasonCode);
          } else {
            score += rule.scoreDelta;
          }
        }
      } else if (rule.predicateType === "input_equals_candidate_attr") {
        const inputVal = rule.inputField ? params.inputs[rule.inputField] : undefined;
        const candVal = rule.candidateAttrKey
          ? cand.staticAttributes[rule.candidateAttrKey]
          : undefined;
        if (inputVal !== undefined && candVal !== undefined && inputVal === candVal) {
          score += rule.scoreDelta;
          reasonCodes.push(`${rule.reasonCode}_MATCH`);
        }
      } else if (rule.predicateType === "qualification_penalty_if_input_matches") {
        const inputVal = rule.inputField ? params.inputs[rule.inputField] : undefined;
        if (inputVal === rule.expectedValue) {
          qualified = true;
          score += rule.scoreDelta;
          reasonCodes.push(rule.reasonCode);
        }
      }
    }

    // Check budget constraint against candidate static price if supplied
    const maxBudget = params.inputs.maxBudgetPerPersonUsd;
    const candPrice = cand.staticAttributes.basePriceUsd;
    if (typeof maxBudget === "number" && typeof candPrice === "number") {
      if (candPrice > maxBudget) {
        ineligible = true;
        reasonCodes.push("BUDGET_EXCEEDED");
      }
    }

    // Total vehicle price budget constraint (e.g. GoSno private vehicle flat rate)
    const maxVehiclePriceUsd = params.inputs.maxTotalVehiclePriceUsd;
    const candVehiclePriceUsd = cand.staticAttributes.flatVehicleRateUsd;
    if (typeof maxVehiclePriceUsd === "number" && typeof candVehiclePriceUsd === "number") {
      if (candVehiclePriceUsd > maxVehiclePriceUsd) {
        ineligible = true;
        reasonCodes.push("VEHICLE_FLAT_RATE_BUDGET_EXCEEDED");
      }
    }

    // GoSno / Private Transportation service-mode hard gate: reject shared shuttle requests
    const requestedServiceType =
      params.inputs.serviceType ?? params.inputs.requestedServiceMode;
    if (
      cand.staticAttributes.serviceMode === "private_only" &&
      (requestedServiceType === "shared_shuttle" ||
        requestedServiceType === "shared" ||
        params.inputs.allowSharedShuttleOnly === true)
    ) {
      ineligible = true;
      reasonCodes.push("GOSNO_PRIVATE_ONLY_NO_SHARED_SHUTTLES");
    }

    // Candidate-specific vehicle passenger capacity hard gate (e.g. 6 for SUV, 10 for Van)
    const paxCount =
      typeof params.inputs.passengerCount === "number"
        ? params.inputs.passengerCount
        : typeof params.inputs.groupSize === "number"
          ? params.inputs.groupSize
          : undefined;
    const candMaxPassengers = cand.staticAttributes.maxPassengers;
    if (typeof paxCount === "number" && typeof candMaxPassengers === "number") {
      if (paxCount <= 0) {
        ineligible = true;
        reasonCodes.push("INVALID_PASSENGER_COUNT");
      } else if (paxCount > candMaxPassengers) {
        ineligible = true;
        reasonCodes.push(`PASSENGER_COUNT_EXCEEDS_VEHICLE_CAPACITY_${candMaxPassengers}`);
      }
    }

    // GoSno equipment & luggage fit guard:
    // Do NOT infer that 6 passengers and 6 snowboards/ski bags fit in a 6-passenger SUV
    // solely from the passenger limit ("Private SUV: up to 6 passengers, subject to luggage and equipment fit").
    const isPrivateSuv =
      cand.staticAttributes.vehicleType === "private_suv" ||
      cand.staticAttributes.vehicleClass === "Private SUV";
    if (isPrivateSuv && typeof paxCount === "number") {
      const skiOrSnowboardCount =
        Number(params.inputs.skiOrSnowboardCount ?? 0) +
        Number(params.inputs.snowboardCount ?? 0) +
        Number(params.inputs.skiBagsCount ?? 0) +
        Number(params.inputs.snowboardBagsCount ?? 0);
      const checkedLuggageCount =
        Number(params.inputs.checkedLuggageCount ?? 0) +
        Number(params.inputs.luggageCount ?? 0);
      if (
        (paxCount >= 5 && skiOrSnowboardCount >= 5) ||
        paxCount + skiOrSnowboardCount >= 11 ||
        (paxCount === 6 && (skiOrSnowboardCount > 0 || checkedLuggageCount > 4))
      ) {
        indeterminate = true;
        reasonCodes.push(
          "SUV_EQUIPMENT_FIT_UNESTABLISHED_FOR_GROUP_AND_SKI_GEAR_REQUIRES_VAN_OR_CONFIRMATION",
        );
      }
    }

    // Route corridor / Rezdy feed / seating layout confirmation qualifications
    const inputCorridor =
      typeof params.inputs.corridorRouteId === "string"
        ? params.inputs.corridorRouteId
        : typeof params.inputs.corridorId === "string"
          ? params.inputs.corridorId
          : undefined;
    const candCorridor =
      typeof cand.staticAttributes.corridorRouteId === "string"
        ? cand.staticAttributes.corridorRouteId
        : typeof cand.staticAttributes.corridorId === "string"
          ? cand.staticAttributes.corridorId
          : undefined;
    if (typeof inputCorridor === "string" && typeof candCorridor === "string") {
      const normInput = inputCorridor.replace(/^den-/, "denver-to-");
      const normCand = candCorridor.replace(/^den-/, "denver-to-");
      if (normInput !== normCand) {
        ineligible = true;
        reasonCodes.push("CORRIDOR_ROUTE_MISMATCH");
      }
    }
    if (cand.staticAttributes.requiresOperatorConfirmation === true) {
      qualified = true;
      score -= 6;
      const confirmReason =
        typeof cand.staticAttributes.operatorConfirmationReasonCode === "string"
          ? cand.staticAttributes.operatorConfirmationReasonCode
          : "OPERATOR_CONFIRMATION_REQUIRED_QUALIFIED";
      if (!reasonCodes.includes(confirmReason)) {
        reasonCodes.push(confirmReason);
      }
    }

    // Candidate-specific minimum age gate (absolute passenger restriction when supplied)
    const youngestAge = params.inputs.youngestPassengerAgeYears;
    const minAge = cand.staticAttributes.minAgeYears;
    if (typeof youngestAge === "number" && typeof minAge === "number") {
      if (youngestAge < minAge) {
        ineligible = true;
        reasonCodes.push("MINIMUM_AGE_NOT_MET");
      }
    }

    // Candidate-specific lap child restriction (Coastal prohibits lap children; TEMSCO allows < 24 months)
    if (
      params.inputs.hasLapChildUnder2 === true &&
      cand.staticAttributes.prohibitsLapChildren === true
    ) {
      ineligible = true;
      reasonCodes.push("LAP_CHILDREN_PROHIBITED_FULL_FARE_SEAT_REQUIRED");
    }

    // Candidate-specific prohibited items (absolute passenger restrictions)
    if (
      params.inputs.carryingDrone === true &&
      cand.staticAttributes.prohibitsDrones === true
    ) {
      ineligible = true;
      reasonCodes.push("PROHIBITED_ITEM_DRONE");
    }
    if (
      params.inputs.carryingSelfieStickOrExtension === true &&
      cand.staticAttributes.prohibitsSelfieSticks === true
    ) {
      ineligible = true;
      reasonCodes.push("PROHIBITED_ITEM_SELFIE_STICK_OR_EXTENSION");
    }
    if (
      params.inputs.carryingBagsOrPursesOnFlight === true &&
      cand.staticAttributes.prohibitsBagsOnAircraft === true
    ) {
      ineligible = true;
      reasonCodes.push("PROHIBITED_ITEM_BAGS_ON_AIRCRAFT_LOCKER_REQUIRED");
    }

    // Candidate-specific service animal policy (Coastal & TEMSCO prohibit service animals due to emergency exit doors)
    if (
      (params.inputs.travelingWithServiceAnimal === true ||
        params.inputs.hasServiceAnimal === true) &&
      cand.staticAttributes.prohibitsServiceAnimals === true
    ) {
      ineligible = true;
      reasonCodes.push("SERVICE_ANIMAL_PROHIBITED_EMERGENCY_EXIT_DOORS");
    }

    // Candidate-specific unassisted mobility gates (absolute passenger restrictions)
    if (
      params.inputs.requiresAssistedAircraftBoarding === true &&
      cand.staticAttributes.requiresUnassistedAircraftBoarding === true
    ) {
      ineligible = true;
      reasonCodes.push("UNASSISTED_AIRCRAFT_BOARDING_REQUIRED");
    }
    if (
      params.inputs.canWalkUnassistedOneHourUnevenTerrain === false &&
      cand.staticAttributes.requiresOneHourUnassistedGlacierWalk === true
    ) {
      ineligible = true;
      reasonCodes.push("UNASSISTED_ONE_HOUR_GLACIER_WALK_REQUIRED");
    }

    // Candidate-specific cruise port transfer window gate (when supplied)
    const portWindowMin = params.inputs.cruisePortWindowMinutes;
    const minPortMin = cand.staticAttributes.minPortWindowMinutes;
    const comfortPortMin = cand.staticAttributes.comfortablePortWindowMinutes;
    if (typeof portWindowMin === "number" && typeof minPortMin === "number") {
      if (portWindowMin < minPortMin) {
        ineligible = true;
        reasonCodes.push("INSUFFICIENT_CRUISE_PORT_WINDOW");
      } else if (typeof comfortPortMin === "number" && portWindowMin < comfortPortMin) {
        qualified = true;
        score -= 8;
        reasonCodes.push("TIGHT_PORT_TRANSFER_BUFFER_QUALIFIED");
      }
    }

    // Candidate-specific operator weight surcharge threshold (distinguished from absolute passenger restriction)
    const paxWeight = params.inputs.maxSinglePassengerWeightLbs;
    const candWeightSurchargeLbs = cand.staticAttributes.weightSurchargeThresholdLbs;
    const candSecondTierSurchargeLbs = cand.staticAttributes.secondTierWeightSurchargeLbs;
    const candHardWeightMaxLbs = cand.staticAttributes.hardMaxWeightLbs;
    if (typeof paxWeight === "number" && typeof candWeightSurchargeLbs === "number") {
      if (typeof candHardWeightMaxLbs === "number" && paxWeight > candHardWeightMaxLbs) {
        ineligible = true;
        reasonCodes.push("PASSENGER_WEIGHT_EXCEEDS_HARD_LIMIT");
      } else if (paxWeight >= candWeightSurchargeLbs) {
        qualified = true;
        score -= 10;
        if (!reasonCodes.some((r) => r.includes("QUALIFIED_SURCHARGE_REQUIRED"))) {
          reasonCodes.push("OPERATOR_WEIGHT_SURCHARGE_THRESHOLD_EXCEEDED_QUALIFIED");
        }
        if (
          typeof candSecondTierSurchargeLbs === "number" &&
          paxWeight >= candSecondTierSurchargeLbs
        ) {
          score -= 5;
          reasonCodes.push("COASTAL_300LB_TWO_SEAT_SURCHARGE_QUALIFIED");
        }
      }
    }

    // Flight minimum consolidation qualification (Coastal requires 4 total flight passengers)
    const minFlightPax = cand.staticAttributes.minimumFlightPassengersRequired;
    if (typeof paxCount === "number" && typeof minFlightPax === "number" && paxCount < minFlightPax) {
      qualified = true;
      score -= 4;
      reasonCodes.push("FLIGHT_MINIMUM_4_PAX_CONSOLIDATION_REQUIRED_QUALIFIED");
    }

    // Explicit live-departure / day-of-weather confirmation check when requested by caller
    if (params.inputs.requireLiveDepartureConfirmation === true) {
      const liveInvClaimId = cand.staticAttributes.liveInventoryClaimId;
      const weatherClaimId = cand.staticAttributes.dayOfWeatherClaimId;
      for (const cid of [liveInvClaimId, weatherClaimId]) {
        if (typeof cid === "string") {
          const st = projection.effectiveClaimByClaimId.get(cid);
          if (!st || !st.canSupportPositiveEligibility) {
            indeterminate = true;
            reasonCodes.push(`LIVE_CONFIRMATION_UNKNOWN:${cid}`);
          }
        }
      }
    }

    let disposition: V03CandidateDispositionState;
    if (ineligible) {
      disposition = "ineligible";
    } else if (indeterminate) {
      disposition = "indeterminate";
    } else if (qualified) {
      disposition = "qualified";
    } else {
      disposition = "eligible";
    }

    if (reasonCodes.length === 0) {
      reasonCodes.push("ALL_CONSTRAINTS_AND_EVIDENCE_SATISFIED");
    }

    candidateDispositions.push({
      candidateDccEntityId: cand.candidateDccEntityId,
      legacyCandidateCode: cand.legacyCandidateCode,
      displayName: cand.displayName,
      operatorDccEntityId: cand.operatorDccEntityId,
      disposition,
      totalScore: disposition === "ineligible" || disposition === "indeterminate" ? null : score,
      reasonCodes,
      evaluatedClaimVersions: evaluatedClaims,
      evidenceRefIds: Array.from(evidenceRefIds).sort(),
    });
  }

  // Sort eligible/qualified candidates by score descending, then deterministic ID
  const viable = candidateDispositions
    .filter((d) => d.disposition === "eligible" || d.disposition === "qualified")
    .sort((a, b) => {
      if (a.disposition !== b.disposition) {
        return a.disposition === "eligible" ? -1 : 1;
      }
      const sa = a.totalScore ?? 0;
      const sb = b.totalScore ?? 0;
      if (sb !== sa) return sb - sa;
      return a.candidateDccEntityId.localeCompare(b.candidateDccEntityId);
    });

  const hasIndeterminate = candidateDispositions.some((d) => d.disposition === "indeterminate");
  const topCandidate = viable[0] ?? null;

  let decisionState: V03EvaluationResult["decisionState"];
  if (topCandidate) {
    decisionState =
      topCandidate.disposition === "eligible" ? "recommended" : "qualified_recommendation";
  } else if (hasIndeterminate) {
    decisionState = "indeterminate_insufficient_evidence";
  } else {
    decisionState = "no_viable_candidates";
  }

  const resultCore = rfc8785Canonicalize({
    decisionState,
    recommendedCandidateDccId: topCandidate?.candidateDccEntityId ?? null,
    dispositions: candidateDispositions.map((d) => ({
      candidateDccEntityId: d.candidateDccEntityId,
      disposition: d.disposition,
      totalScore: d.totalScore,
      reasonCodes: d.reasonCodes,
    })),
  });
  const resultHash = sha256HexFull(resultCore);

  const traceCore = rfc8785Canonicalize({
    engineId: params.bundle.engineId,
    engineVersion: params.bundle.engineVersion,
    bundleHash: params.bundle.bundleHash,
    universeHash: params.universe.universeHash,
    validAt: params.validAtIso,
    knowledgeCutoff: params.knowledgeCutoffIso,
    normalizedInputHash,
    candidateDispositions,
  });
  const traceHash = sha256HexFull(traceCore);

  const evaluationFingerprint = sha256HexFull(
    rfc8785Canonicalize({
      executionClass: params.executionClass,
      isSynthetic: params.isSynthetic,
      engineId: params.bundle.engineId,
      engineVersion: params.bundle.engineVersion,
      bundleHash: params.bundle.bundleHash,
      universeHash: params.universe.universeHash,
      validAt: params.validAtIso,
      knowledgeCutoff: params.knowledgeCutoffIso,
      normalizedInputHash,
      resultHash,
    }),
  );

  const epistemicLimitationStatement = params.isSynthetic
    ? "SYNTHETIC_FIXTURE_OR_ADMIN_SIMULATION: This evaluation used synthetic fixtures or administrative simulation parameters and does NOT represent genuine historical knowledge or live operational availability."
    : `BOUNDED_CANDIDATE_UNIVERSE_DISCLOSURE: Evaluation is strictly bounded to CandidateUniverse ${params.universe.universeId}@${params.universe.version} (hash=${params.universe.universeHash}, knowledgeCutoff=${params.knowledgeCutoffIso}). DCC does not claim universal market exhaustiveness beyond the declared candidate universe.`;

  const receipt = await signV03DecisionReceiptJws({
    executionClass: params.executionClass,
    isSynthetic: params.isSynthetic,
    syntheticWatermark: params.syntheticWatermark,
    issuedAt: params.issuedAtIso ?? new Date().toISOString(),
    evaluationRunId,
    traceRunId,
    evaluationFingerprint,
    engineId: params.bundle.engineId,
    engineVersion: params.bundle.engineVersion,
    compilerVersion: params.bundle.compilerVersion,
    decisionIrBundleHash: params.bundle.bundleHash,
    candidateUniverseId: params.universe.universeId,
    candidateUniverseVersion: params.universe.version,
    candidateUniverseHash: params.universe.universeHash,
    pinnedRuleVersionHashes,
    pinnedClaimEventHashes,
    pinnedEvidenceHashes,
    pinnedSchemaHashes: params.bundle.pinnedSchemaHashes,
    normalizedInputHash,
    validAt: params.validAtIso,
    knowledgeCutoff: params.knowledgeCutoffIso,
    decisionState,
    recommendedCandidateDccId: topCandidate?.candidateDccEntityId ?? null,
    recommendedCandidateLegacyCode: topCandidate?.legacyCandidateCode ?? null,
    candidateDispositionSummary: candidateDispositions.map((d) => ({
      candidateDccId: d.candidateDccEntityId,
      legacyCode: d.legacyCandidateCode,
      disposition: d.disposition,
      totalScore: d.totalScore,
      reasonCodes: d.reasonCodes,
    })),
    resultHash,
    traceHash,
    epistemicLimitationStatement,
  });

  return {
    ok: true,
    spec: "dcc-evaluation-response/0.3",
    executionClass: params.executionClass,
    isSynthetic: params.isSynthetic,
    syntheticWatermark: params.syntheticWatermark,
    evaluationRunId,
    traceRunId,
    evaluationFingerprint,
    receiptId: receipt.receiptId,
    engineId: params.bundle.engineId,
    engineVersion: params.bundle.engineVersion,
    compilerVersion: params.bundle.compilerVersion,
    bundleHash: params.bundle.bundleHash,
    candidateUniverseId: params.universe.universeId,
    candidateUniverseVersion: params.universe.version,
    candidateUniverseHash: params.universe.universeHash,
    validAt: params.validAtIso,
    knowledgeCutoff: params.knowledgeCutoffIso,
    normalizedInputHash,
    decisionState,
    recommendedCandidateDccId: topCandidate?.candidateDccEntityId ?? null,
    recommendedCandidateLegacyCode: topCandidate?.legacyCandidateCode ?? null,
    candidateDispositions,
    resultHash,
    traceHash,
    epistemicLimitationStatement,
    gateFailureCode:
      typeof params.inputs.__storageGateIndeterminateReason === "string"
        ? params.inputs.__storageGateIndeterminateReason
        : null,
    receipt,
  };
}

/**
 * 1. Ordinary Current Evaluation:
 * - Client supplies `inputs` and `validAt`.
 * - Rejects any client-supplied `knownAt` or `knowledgeCutoff` (`ClientSuppliedKnownAtForbiddenError`).
 * - Server establishes `knowledgeCutoff` from its authoritative clock.
 */
export async function evaluateCurrentV03(params: {
  rawClientRequestBody: Record<string, unknown>;
  bundle: V03CompiledEngineBundle;
  universe: V03CandidateUniverse;
  ledger: AppendOnlyKnowledgeLedger;
  serverClockNow?: () => string;
}): Promise<V03EvaluationResult> {
  if ("knownAt" in params.rawClientRequestBody && params.rawClientRequestBody.knownAt !== undefined) {
    throw new ClientSuppliedKnownAtForbiddenError("knownAt");
  }
  if (
    "knowledgeCutoff" in params.rawClientRequestBody &&
    params.rawClientRequestBody.knowledgeCutoff !== undefined
  ) {
    throw new ClientSuppliedKnownAtForbiddenError("knowledgeCutoff");
  }

  const validAtIso =
    typeof params.rawClientRequestBody.validAt === "string"
      ? params.rawClientRequestBody.validAt
      : new Date().toISOString();
  const serverKnowledgeCutoffIso = params.serverClockNow
    ? params.serverClockNow()
    : new Date().toISOString();

  const inputs = (params.rawClientRequestBody.inputs ?? {}) as Record<string, unknown>;

  return executeDeterministicEvaluationCore({
    executionClass: "current_evaluation",
    isSynthetic: params.universe.isSynthetic,
    syntheticWatermark: params.universe.isSynthetic
      ? "SYNTHETIC_TEST_FIXTURE_UNIVERSE"
      : null,
    bundle: params.bundle,
    universe: params.universe,
    ledger: params.ledger,
    inputs,
    validAtIso,
    knowledgeCutoffIso: serverKnowledgeCutoffIso,
    issuedAtIso: serverKnowledgeCutoffIso,
  });
}

/**
 * 2. Historical Receipt Replay:
 * - Begins from a signed receipt (`V03SignedDecisionReceipt` or JWS).
 * - Verifies the JWS signature and key revocation status.
 * - Rejects synthetic admin-simulation receipts from being replayed as historical truth.
 * - Uses the receipt's original `knowledgeCutoff`, `validAt`, and pinned bundle/universe hashes.
 * - Never resolves current aliases; replays against the immutable event ledger as of `knowledgeCutoff`.
 */
export async function replayHistoricalReceiptV03(params: {
  receipt: V03SignedDecisionReceipt;
  originalInputs: Record<string, unknown>;
  bundlesByHash: Map<string, V03CompiledEngineBundle>;
  universesByHash: Map<string, V03CandidateUniverse>;
  ledger: AppendOnlyKnowledgeLedger;
  allowSyntheticFixtureReplayForTest?: boolean;
}): Promise<{
  replayResult: V03EvaluationResult;
  matchesOriginalHashes: boolean;
  jwsVerified: boolean;
}> {
  if (
    params.receipt.executionClass === "administrative_simulation" &&
    !params.allowSyntheticFixtureReplayForTest
  ) {
    throw new SyntheticReceiptHistoricalReplayForbiddenError(params.receipt.receiptId);
  }

  const verification = await verifyV03DecisionReceiptJws({
    jwsCompact: params.receipt.jwsCompact,
  });
  if (!verification.valid || !verification.payload) {
    throw new Error(`Cannot replay invalid receipt: ${verification.reason}`);
  }

  const p = verification.payload;
  const pinnedBundle = params.bundlesByHash.get(p.decisionIrBundleHash);
  if (!pinnedBundle) {
    throw new Error(`Pinned DecisionIrBundle hash "${p.decisionIrBundleHash}" not found.`);
  }
  const pinnedUniverse = params.universesByHash.get(p.candidateUniverseHash);
  if (!pinnedUniverse) {
    throw new Error(`Pinned CandidateUniverse hash "${p.candidateUniverseHash}" not found.`);
  }

  const replayResult = await executeDeterministicEvaluationCore({
    executionClass: p.executionClass,
    isSynthetic: p.isSynthetic,
    syntheticWatermark: p.syntheticWatermark,
    bundle: pinnedBundle,
    universe: pinnedUniverse,
    ledger: params.ledger,
    inputs: params.originalInputs,
    validAtIso: p.validAt,
    knowledgeCutoffIso: p.knowledgeCutoff,
    pinnedClaimEventHashesFromReceipt: p.pinnedClaimEventHashes,
  });

  const matchesOriginalHashes =
    replayResult.resultHash === p.resultHash &&
    replayResult.traceHash === p.traceHash &&
    replayResult.evaluationFingerprint === p.evaluationFingerprint &&
    replayResult.receiptId === p.receiptId;

  return {
    replayResult,
    matchesOriginalHashes,
    jwsVerified: true,
  };
}

/**
 * 3. Administrative Simulation:
 * - Requires explicit admin authorization (`dcc:admin:simulate`).
 * - Explicitly watermarked `isSynthetic: true` and `executionClass: "administrative_simulation"`.
 * - Receipt ID uses prefix `rcpt:sim:sha256:` so it can never be mistaken for a historical receipt.
 */
export async function simulateAdministrativeV03(params: {
  adminToken: string | undefined;
  expectedAdminSecret?: string;
  bundle: V03CompiledEngineBundle;
  universe: V03CandidateUniverse;
  ledger: AppendOnlyKnowledgeLedger;
  inputs: Record<string, unknown>;
  validAtIso: string;
  simulatedKnowledgeCutoffIso: string;
}): Promise<V03EvaluationResult> {
  const expected =
    params.expectedAdminSecret ??
    process.env.DCC_ADMIN_SIMULATION_TOKEN ??
    "dcc-v03-admin-simulation-secret";
  if (!params.adminToken || params.adminToken !== expected) {
    throw new UnauthorizedAdminSimulationError(
      "UNAUTHORIZED_ADMIN_SIMULATION: Administrative simulation requires a valid admin token with scope dcc:admin:simulate.",
    );
  }

  return executeDeterministicEvaluationCore({
    executionClass: "administrative_simulation",
    isSynthetic: true,
    syntheticWatermark: "SYNTHETIC_ADMIN_SIMULATION_NOT_HISTORICAL_KNOWLEDGE",
    bundle: params.bundle,
    universe: params.universe,
    ledger: params.ledger,
    inputs: params.inputs,
    validAtIso: params.validAtIso,
    knowledgeCutoffIso: params.simulatedKnowledgeCutoffIso,
  });
}
