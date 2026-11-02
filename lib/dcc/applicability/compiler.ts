import { rfc8785Canonicalize, sha256HexFull } from "../machine/v03/rfc8785AndJws";
import {
  APPLICABILITY_COMPILER_VERSION,
  APPLICABILITY_MODEL_VERSION,
  getStewardVehicleEvidencePatch,
  getVersionedApplicabilityContextModel,
  type CorridorId,
  type SeasonalRegulationSpec,
  type VehicleClassCapacitySpec,
} from "./contextModel";

export interface ActiveSegmentConditionInputs {
  vailPassChainLawActive?: boolean;
  i70TractionLawActive?: boolean;
  pajnLowCeilingIframeWarning?: boolean;
}

export interface TripApplicabilityRequest {
  corridorId: CorridorId;
  travelDate?: string;
  passengerCount: number;
  standardBagCount: number;
  skiOrOversizeBagCount?: number;
  roofBoxConfirmed?: boolean;
  staggeredFlightArrivals?: boolean;
  youngestPassengerAgeYears?: number | null;
  maxSinglePassengerWeightLbs?: number | null;
  activeSegmentConditions?: ActiveSegmentConditionInputs;
}

export interface CompiledSegmentConstraint {
  segmentId: string;
  sequenceOrder: number;
  segmentName: string;
  highwayOrWaterway: string;
  milepostRange: string | null;
  maxElevationFeet: number;
  maxGradePercent: number;
  activeRegulationIds: string[];
  activeConstraintCodes: string[];
  compiledSegmentStatus: "normal_seasonal" | "active_traction_law" | "active_chain_law_enforcement" | "weather_hold_risk";
  compiledDirectives: string[];
  evidenceVersion: string;
}

export interface CompiledRegulationApplication {
  regulationId: string;
  code: string;
  statuteOrAuthority: string;
  title: string;
  triggeredBy: "seasonal_calendar" | "live_condition_override" | "seasonal_and_live_condition" | "always_active";
  compiledConstraintCode: string;
  deterministicDirective: string;
  disqualifiedVehicleClassIds: string[];
  evidenceVersion: string;
  verifiedCitationId: string;
}

export type VehicleApplicabilityDisposition =
  | "recommended"
  | "eligible_alternative"
  | "qualified_with_surcharge_or_transfer"
  | "ineligible";

export interface CompiledVehicleClassEvaluation {
  vehicleClassId: string;
  displayName: string;
  operatorId: string;
  operatorName: string;
  providerType: VehicleClassCapacitySpec["providerType"];
  disposition: VehicleApplicabilityDisposition;
  score: number;
  constraintCodes: string[];
  capacityResolution: {
    requestedPassengers: number;
    maxAllowedPassengers: number;
    requestedStandardBags: number;
    requestedSkiOrOversizeBags: number;
    totalRequestedBags: number;
    requiresThirdRowFolded: boolean;
    fitsPassengerEnvelope: boolean;
    fitsBaggageEnvelope: boolean;
    passesActiveSegmentRegulations: boolean;
    extraBagFeeTotalUsd: number;
  };
  pricingResolution: {
    pricingModel: VehicleClassCapacitySpec["pricingModel"];
    fixedRateOneWayUsd: number | null;
    quoteOnly: boolean;
    estimatedExtraBagFeeUsd: number;
    compiledPricingNote: string;
  };
  compiledReason: string;
  evidenceVersion: string;
}

export interface CompiledApplicableDecisionOutcome {
  spec: "dcc-compiled-applicability-outcome/1.0";
  modelVersion: typeof APPLICABILITY_MODEL_VERSION;
  compilerVersion: typeof APPLICABILITY_COMPILER_VERSION;
  modelHash: string;
  evidenceVersion: string;
  corridorId: CorridorId;
  normalizedInputs: {
    travelDate: string;
    travelMonthUtc: number;
    passengerCount: number;
    standardBagCount: number;
    skiOrOversizeBagCount: number;
    totalBagCount: number;
    roofBoxConfirmed: boolean;
    staggeredFlightArrivals: boolean;
    youngestPassengerAgeYears: number | null;
    maxSinglePassengerWeightLbs: number | null;
    activeSegmentConditions: Required<ActiveSegmentConditionInputs>;
  };
  inputHash: string;
  outcomeHash: string;
  decisionReceiptId: string;
  recommendedVehicleClassId: string | null;
  recommendedOperatorId: string | null;
  recommendedOperatorName: string | null;
  compiledSegmentConstraints: CompiledSegmentConstraint[];
  compiledRegulations: CompiledRegulationApplication[];
  vehicleClassEvaluations: CompiledVehicleClassEvaluation[];
  compiledDecisionSummary: {
    headline: string;
    primaryConstraintCodes: string[];
    activeSegmentDirectives: string[];
    baggageEnvelopeResolution: string;
    pricingDisposition: string;
    epistemicUnknowns: string[];
  };
}

function parseMonthUtc(travelDate: string): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(travelDate.trim());
  if (!match) return 12;
  const month = Number(match[2]);
  return Number.isFinite(month) && month >= 1 && month <= 12 ? month : 12;
}

export function compileApplicableDecisionContext(
  request: TripApplicabilityRequest,
): CompiledApplicableDecisionOutcome {
  const model = getVersionedApplicabilityContextModel();
  const travelDate =
    typeof request.travelDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(request.travelDate.trim())
      ? request.travelDate.trim()
      : "2026-12-15";
  const travelMonthUtc = parseMonthUtc(travelDate);
  const passengerCount = Math.max(1, Math.round(request.passengerCount || 1));
  const standardBagCount = Math.max(0, Math.round(request.standardBagCount || 0));
  const skiOrOversizeBagCount = Math.max(0, Math.round(request.skiOrOversizeBagCount || 0));
  const totalBagCount = standardBagCount + skiOrOversizeBagCount;
  const roofBoxConfirmed = Boolean(request.roofBoxConfirmed);
  const staggeredFlightArrivals = Boolean(request.staggeredFlightArrivals);
  const youngestPassengerAgeYears =
    typeof request.youngestPassengerAgeYears === "number" &&
    Number.isFinite(request.youngestPassengerAgeYears)
      ? Math.max(0, Math.round(request.youngestPassengerAgeYears))
      : null;
  const maxSinglePassengerWeightLbs =
    typeof request.maxSinglePassengerWeightLbs === "number" &&
    Number.isFinite(request.maxSinglePassengerWeightLbs)
      ? Math.max(0, Math.round(request.maxSinglePassengerWeightLbs))
      : null;

  const activeConditions: Required<ActiveSegmentConditionInputs> = {
    vailPassChainLawActive: Boolean(request.activeSegmentConditions?.vailPassChainLawActive),
    i70TractionLawActive:
      request.activeSegmentConditions?.i70TractionLawActive !== undefined
        ? Boolean(request.activeSegmentConditions.i70TractionLawActive)
        : [1, 2, 3, 4, 5, 9, 10, 11, 12].includes(travelMonthUtc),
    pajnLowCeilingIframeWarning: Boolean(
      request.activeSegmentConditions?.pajnLowCeilingIframeWarning,
    ),
  };

  const normalizedInputs = {
    travelDate,
    travelMonthUtc,
    passengerCount,
    standardBagCount,
    skiOrOversizeBagCount,
    totalBagCount,
    roofBoxConfirmed,
    staggeredFlightArrivals,
    youngestPassengerAgeYears,
    maxSinglePassengerWeightLbs,
    activeSegmentConditions: activeConditions,
  };

  const corridorSegments = model.segments
    .filter((s) => s.corridorId === request.corridorId)
    .slice()
    .sort((a, b) => a.sequenceOrder - b.sequenceOrder);

  const corridorRegulations = model.regulations.filter((r) =>
    r.corridorIds.includes(request.corridorId),
  );

  const compiledRegulations: CompiledRegulationApplication[] = [];
  for (const reg of corridorRegulations) {
    const seasonalMatch = reg.activeMonthsUtc.includes(travelMonthUtc);
    const liveMatch =
      reg.canBeTriggeredByLiveCondition &&
      reg.liveConditionTriggerKey !== null &&
      activeConditions[reg.liveConditionTriggerKey] === true;

    if (seasonalMatch || liveMatch) {
      const triggeredBy: CompiledRegulationApplication["triggeredBy"] =
        seasonalMatch && liveMatch
          ? "seasonal_and_live_condition"
          : liveMatch
            ? "live_condition_override"
            : reg.activeMonthsUtc.length === 12
              ? "always_active"
              : "seasonal_calendar";

      compiledRegulations.push({
        regulationId: reg.regulationId,
        code: reg.code,
        statuteOrAuthority: reg.statuteOrAuthority,
        title: reg.title,
        triggeredBy,
        compiledConstraintCode: reg.compiledConstraintCode,
        deterministicDirective: reg.deterministicDirective,
        disqualifiedVehicleClassIds: [...reg.disqualifiesVehicleClassIdsWhenActive],
        evidenceVersion: reg.evidenceVersion,
        verifiedCitationId: reg.verifiedCitationId,
      });
    }
  }

  const activeRegById = new Map<string, CompiledRegulationApplication>(
    compiledRegulations.map((r) => [r.regulationId, r]),
  );

  const compiledSegmentConstraints: CompiledSegmentConstraint[] = corridorSegments.map((seg) => {
    const segRegs = seg.applicableRegulationIds
      .map((id) => activeRegById.get(id))
      .filter((r): r is CompiledRegulationApplication => Boolean(r));

    const hasChainLawCode16 = segRegs.some(
      (r) => r.regulationId === "reg:co-passenger-chain-law-code-16",
    );
    const hasTractionLawCode15 = segRegs.some(
      (r) => r.regulationId === "reg:co-passenger-traction-law-code-15",
    );

    const compiledSegmentStatus: CompiledSegmentConstraint["compiledSegmentStatus"] =
      hasChainLawCode16
        ? "active_chain_law_enforcement"
        : hasTractionLawCode15
          ? "active_traction_law"
          : activeConditions.pajnLowCeilingIframeWarning
            ? "weather_hold_risk"
            : "normal_seasonal";

    return {
      segmentId: seg.segmentId,
      sequenceOrder: seg.sequenceOrder,
      segmentName: seg.name,
      highwayOrWaterway: seg.highwayOrWaterway,
      milepostRange: seg.milepostRange,
      maxElevationFeet: seg.maxElevationFeet,
      maxGradePercent: seg.maxGradePercent,
      activeRegulationIds: segRegs.map((r) => r.regulationId),
      activeConstraintCodes: segRegs.map((r) => r.compiledConstraintCode),
      compiledSegmentStatus,
      compiledDirectives: segRegs.map((r) => r.deterministicDirective),
      evidenceVersion: seg.evidenceVersion,
    };
  });

  const disqualifiedByRegSet = new Set<string>();
  for (const reg of compiledRegulations) {
    for (const vehId of reg.disqualifiedVehicleClassIds) {
      disqualifiedByRegSet.add(vehId);
    }
  }

  const chainLawCode16Active = activeRegById.has("reg:co-passenger-chain-law-code-16");

  const corridorVehicles = model.vehicleClasses.filter((v) =>
    v.corridorIds.includes(request.corridorId),
  );

  const vehicleClassEvaluations: CompiledVehicleClassEvaluation[] = corridorVehicles.map((veh) => {
    const constraintCodes: string[] = [];
    const stewardPatch = getStewardVehicleEvidencePatch(veh.vehicleClassId);
    let passesActiveSegmentRegulations = !disqualifiedByRegSet.has(veh.vehicleClassId);
    if (!passesActiveSegmentRegulations) {
      for (const reg of compiledRegulations) {
        if (reg.disqualifiedVehicleClassIds.includes(veh.vehicleClassId)) {
          constraintCodes.push(`DISQUALIFIED_BY_ACTIVE_REGULATION:${reg.code}`);
        }
      }
    }

    if (stewardPatch?.operatingAuthorityValid === false) {
      passesActiveSegmentRegulations = false;
      constraintCodes.push("DISQUALIFIED_STEWARD_OPERATING_AUTHORITY_SUSPENDED");
    }

    if (chainLawCode16Active) {
      if (veh.commercialChainEquipped) {
        constraintCodes.push("COMPLIES_WITH_VAIL_PASS_CHAIN_LAW_CODE_16");
      } else if (veh.providerType === "direct_operator" || veh.providerType === "shared_shuttle") {
        passesActiveSegmentRegulations = false;
        constraintCodes.push("DISQUALIFIED_MISSING_COMMERCIAL_CHAIN_EQUIPMENT_CODE_18");
      }
    }

    const fitsPassengerEnvelope = passengerCount <= veh.maxPassengersStandard;
    if (!fitsPassengerEnvelope) {
      constraintCodes.push("DISQUALIFIED_PASSENGER_COUNT_EXCEEDS_LEGAL_SEAT_CAP");
    }

    // Age restriction check (e.g., high-speed open airboat min age 5)
    let passesAgeGate = true;
    if (
      youngestPassengerAgeYears !== null &&
      veh.minPassengerAgeYears > 0 &&
      youngestPassengerAgeYears < veh.minPassengerAgeYears
    ) {
      passesAgeGate = false;
      constraintCodes.push(`DISQUALIFIED_MIN_PASSENGER_AGE_${veh.minPassengerAgeYears}_YEARS`);
    }

    // Weight-tier check for rotorcraft
    let requiresWeightSurchargeTier = false;
    if (
      veh.singlePassengerWeightThresholdLbs &&
      maxSinglePassengerWeightLbs !== null &&
      maxSinglePassengerWeightLbs > veh.singlePassengerWeightThresholdLbs
    ) {
      requiresWeightSurchargeTier = true;
      constraintCodes.push(
        maxSinglePassengerWeightLbs >= 300
          ? "ROTORCRAFT_WEIGHT_TIER_300_PLUS_SECOND_SEAT_REQUIRED"
          : "ROTORCRAFT_WEIGHT_TIER_260_299_HALF_SEAT_SURCHARGE",
      );
    }

    // Deterministic cargo & ski-bag volume envelope calculation
    let requiresThirdRowFolded = false;
    let fitsBaggageEnvelope = true;
    let extraBagFeeTotalUsd = 0;

    if (veh.vehicleClassId === "veh:awd-full-size-suv") {
      // Standard 3-row SUV:
      // - If 5 or 6 passengers: 3rd row MUST stay raised -> max 4 standard bags and 0 ski bags inside (up to 4 ski bags only if roofBoxConfirmed)
      // - If 1 to 4 passengers: 3rd row can be folded -> max 5 standard bags inside (or up to 6 total bags only if roofBoxConfirmed and <= 4 ski bags)
      if (passengerCount >= 5) {
        const allowedSki = roofBoxConfirmed ? veh.maxSkiOrOversizeBagsWithRoofBoxAndFoldedRow : 0;
        const remainingStandardBags =
          totalBagCount - Math.min(skiOrOversizeBagCount, allowedSki);
        if (
          skiOrOversizeBagCount > allowedSki ||
          remainingStandardBags > veh.maxStandardBagsWithFullPassengerLoad
        ) {
          fitsBaggageEnvelope = false;
          constraintCodes.push("DISQUALIFIED_CARGO_VOLUME_EXCEEDS_SUV_THIRD_ROW_UP_ENVELOPE");
        }
      } else {
        // 1 to 4 passengers: check if third row must be folded
        if (
          totalBagCount > veh.maxStandardBagsWithFullPassengerLoad ||
          skiOrOversizeBagCount > 0
        ) {
          requiresThirdRowFolded = true;
          constraintCodes.push("SUV_REQUIRES_THIRD_ROW_FOLDED_FOR_CARGO");
        }
        const maxBagsWithFoldedRow = roofBoxConfirmed
          ? veh.maxStandardBagsWithFoldedThirdRow + 2
          : 5;
        const maxSkiAllowed = roofBoxConfirmed
          ? veh.maxSkiOrOversizeBagsWithRoofBoxAndFoldedRow
          : 2;
        if (totalBagCount > maxBagsWithFoldedRow || skiOrOversizeBagCount > maxSkiAllowed) {
          fitsBaggageEnvelope = false;
          constraintCodes.push("DISQUALIFIED_6_PLUS_BAGS_EXCEED_SINGLE_SUV_CARGO_ENVELOPE");
        }
      }
    } else if (veh.vehicleClassId === "veh:shared-mountain-shuttle") {
      const includedTotal = passengerCount * (veh.includedBagsPerPassenger ?? 2);
      if (totalBagCount > includedTotal) {
        const extraBags = totalBagCount - includedTotal;
        extraBagFeeTotalUsd = extraBags * (veh.extraBagFeeUsd ?? 10);
        constraintCodes.push(`SHARED_SHUTTLE_EXTRA_BAG_SURCHARGE_${extraBags}_ITEMS`);
      }
    } else if (veh.prohibitsCarryOnBags && totalBagCount > 0) {
      constraintCodes.push("CARRY_ON_BAGS_PROHIBITED_STORED_AT_BASE");
    } else {
      const maxTotalAllowed =
        veh.maxStandardBagsWithFullPassengerLoad +
        veh.maxSkiOrOversizeBagsInsideWithFullPassengerLoad;
      if (
        standardBagCount > veh.maxStandardBagsWithFullPassengerLoad &&
        totalBagCount > maxTotalAllowed
      ) {
        fitsBaggageEnvelope = false;
        constraintCodes.push("DISQUALIFIED_CARGO_VOLUME_EXCEEDS_VEHICLE_ENVELOPE");
      }
      if (skiOrOversizeBagCount > veh.maxSkiOrOversizeBagsInsideWithFullPassengerLoad) {
        fitsBaggageEnvelope = false;
        constraintCodes.push("DISQUALIFIED_OVERSIZE_SKI_BAG_COUNT_EXCEEDS_LIMIT");
      }
    }

    const isEligible =
      passesActiveSegmentRegulations &&
      fitsPassengerEnvelope &&
      fitsBaggageEnvelope &&
      passesAgeGate;

    let score = 0;
    let disposition: VehicleApplicabilityDisposition = "ineligible";

    if (isEligible) {
      score = 70;
      if (veh.vehicleClassId === "veh:private-transit-van-10-14") {
        // High-roof transit van is primary recommendation when 7+ pax, 6+ bags, or Vail Pass Chain Law active with large load
        if (passengerCount >= 7 || totalBagCount >= 6 || skiOrOversizeBagCount >= 3) {
          score += 30;
          constraintCodes.push("RECOMMENDED_HIGH_CAPACITY_SINGLE_VEHICLE_FIT");
        } else {
          score += 10;
        }
        if (chainLawCode16Active) {
          score += 15;
        }
        if (staggeredFlightArrivals) {
          score -= 20;
          constraintCodes.push("STAGGERED_ARRIVALS_REDUCE_SINGLE_PRIVATE_VAN_FIT");
        }
      } else if (veh.vehicleClassId === "veh:awd-full-size-suv") {
        if (passengerCount <= 6 && totalBagCount <= 4 && skiOrOversizeBagCount === 0 && !staggeredFlightArrivals) {
          score += 25;
          constraintCodes.push("RECOMMENDED_STANDARD_SUV_ENVELOPE_FIT");
        } else {
          score += 5;
        }
      } else if (veh.vehicleClassId === "veh:shared-mountain-shuttle") {
        if (staggeredFlightArrivals || passengerCount <= 2) {
          score += 28;
          constraintCodes.push("RECOMMENDED_PER_SEAT_STAGGERED_OR_SOLO_FIT");
        } else {
          score += 8;
        }
      } else if (veh.vehicleClassId === "veh:cdot-bustang-coach") {
        if (totalBagCount >= 4 || passengerCount >= 4) {
          score -= 25;
          constraintCodes.push("HIGH_FRICTION_RAIL_TO_COACH_TRANSFER_WITH_LUGGAGE");
        } else {
          score += 5;
        }
      } else if (veh.vehicleClassId === "veh:heli-astar-as350") {
        score += 25;
      } else if (veh.vehicleClassId === "veh:small-open-airboat") {
        score += 25;
      } else if (veh.vehicleClassId === "veh:covered-pontoon-swamp-boat") {
        score += youngestPassengerAgeYears !== null && youngestPassengerAgeYears < 5 ? 30 : 15;
      }

      disposition =
        extraBagFeeTotalUsd > 0 ||
        requiresWeightSurchargeTier ||
        Boolean(veh.requiresManualTransitTransfer && totalBagCount >= 4)
          ? "qualified_with_surcharge_or_transfer"
          : "eligible_alternative";
    }

    const compiledPricingNote = veh.quoteOnly
      ? "Quote-only (quoteOnly: true) — requires live operator date/cargo dispatch quote; DCC refuses to invent a flat rate."
      : veh.fixedRateOneWayUsd !== null
        ? `$${veh.fixedRateOneWayUsd} one-way (${veh.pricingModel.replace(/_/g, " ")})`
        : extraBagFeeTotalUsd > 0
          ? `Per-seat variable fare + $${extraBagFeeTotalUsd} extra baggage fee ($${veh.extraBagFeeUsd}/extra bag)`
          : "Per-seat date-variable fare verified on operator rate table.";

    let compiledReason = "";
    if (!passesActiveSegmentRegulations) {
      compiledReason = `Disqualified on ${request.corridorId}: fails active segment regulation (${constraintCodes.join(", ")}).`;
    } else if (!fitsPassengerEnvelope) {
      compiledReason = `Disqualified: ${passengerCount} passengers exceed the ${veh.maxPassengersStandard}-passenger legal seating cap of ${veh.displayName}.`;
    } else if (!fitsBaggageEnvelope) {
      compiledReason = `Disqualified: ${totalBagCount} total bags (${standardBagCount} standard, ${skiOrOversizeBagCount} ski/oversize) exceed the physical cabin cargo envelope of ${veh.displayName} for ${passengerCount} passengers.`;
    } else if (!passesAgeGate) {
      compiledReason = `Disqualified: youngest passenger (${youngestPassengerAgeYears} yrs) is below the ${veh.minPassengerAgeYears}-year minimum safety requirement.`;
    } else if (veh.vehicleClassId === "veh:private-transit-van-10-14") {
      compiledReason = `Holds all ${passengerCount} passengers and ${totalBagCount} bags (${standardBagCount} standard + ${skiOrOversizeBagCount} ski/oversize) in a single commercial chain-equipped high-roof van (${compiledPricingNote}).`;
    } else if (veh.vehicleClassId === "veh:awd-full-size-suv") {
      compiledReason = `Fits ${passengerCount} passengers and ${totalBagCount} bags${requiresThirdRowFolded ? " with the third row folded" : " with the third row raised"} (${compiledPricingNote}).`;
    } else {
      compiledReason = `Eligible for ${passengerCount} passengers and ${totalBagCount} bags (${compiledPricingNote}).`;
    }

    return {
      vehicleClassId: veh.vehicleClassId,
      displayName: veh.displayName,
      operatorId: veh.operatorId,
      operatorName: veh.operatorName,
      providerType: veh.providerType,
      disposition,
      score,
      constraintCodes,
      capacityResolution: {
        requestedPassengers: passengerCount,
        maxAllowedPassengers: veh.maxPassengersStandard,
        requestedStandardBags: standardBagCount,
        requestedSkiOrOversizeBags: skiOrOversizeBagCount,
        totalRequestedBags: totalBagCount,
        requiresThirdRowFolded,
        fitsPassengerEnvelope,
        fitsBaggageEnvelope,
        passesActiveSegmentRegulations,
        extraBagFeeTotalUsd,
      },
      pricingResolution: {
        pricingModel: veh.pricingModel,
        fixedRateOneWayUsd: veh.fixedRateOneWayUsd,
        quoteOnly: veh.quoteOnly,
        estimatedExtraBagFeeUsd: extraBagFeeTotalUsd,
        compiledPricingNote,
      },
      compiledReason,
      evidenceVersion: veh.evidenceVersion,
    };
  });

  // Sort eligible vehicles by score descending and mark the top-scoring eligible option as "recommended"
  vehicleClassEvaluations.sort((a, b) => {
    if (a.disposition === "ineligible" && b.disposition !== "ineligible") return 1;
    if (a.disposition !== "ineligible" && b.disposition === "ineligible") return -1;
    return b.score - a.score;
  });

  const topCandidate = vehicleClassEvaluations.find((v) => v.disposition !== "ineligible") || null;
  if (topCandidate) {
    topCandidate.disposition = "recommended";
  }

  const primaryConstraintCodes = Array.from(
    new Set([
      ...compiledRegulations.map((r) => r.compiledConstraintCode),
      ...(topCandidate ? topCandidate.constraintCodes : []),
      ...vehicleClassEvaluations
        .filter((v) => v.disposition === "ineligible")
        .flatMap((v) => v.constraintCodes),
    ]),
  );

  const disqualifiedSuv = vehicleClassEvaluations.find(
    (v) => v.vehicleClassId === "veh:awd-full-size-suv" && v.disposition === "ineligible",
  );

  const baggageEnvelopeResolution = disqualifiedSuv
    ? `${passengerCount} passengers with ${totalBagCount} bags (${standardBagCount} standard, ${skiOrOversizeBagCount} ski/oversize) exceed the physical cargo bay of a single 3-row SUV (${disqualifiedSuv.constraintCodes.join(", ")}); compiled to ${topCandidate?.displayName || "high-capacity commercial transit"}.`
    : topCandidate
      ? `${passengerCount} passengers and ${totalBagCount} bags fit within ${topCandidate.displayName} (${topCandidate.capacityResolution.requiresThirdRowFolded ? "third row folded" : "standard seating configuration"}).`
      : `No single vehicle class satisfies ${passengerCount} passengers and ${totalBagCount} bags.`;

  const headline = topCandidate
    ? chainLawCode16Active
      ? `Compiled Outcome: ${topCandidate.displayName} — Active Vail Pass Chain Law (Code 16) + ${passengerCount} Pax / ${totalBagCount} Bags`
      : `Compiled Outcome: ${topCandidate.displayName} for ${passengerCount} Passengers & ${totalBagCount} Bags`
    : `No Eligible Single-Vehicle Class for ${passengerCount} Passengers & ${totalBagCount} Bags`;

  const pricingDisposition = topCandidate
    ? topCandidate.pricingResolution.compiledPricingNote
    : "Multi-vehicle split booking required.";

  const epistemicUnknowns = [
    "Live operator dispatch availability for your exact flight arrival timestamp remains verified at booking.",
    ...(topCandidate?.pricingResolution.quoteOnly
      ? [
          "10–14 passenger private van pricing is quote-only (quoteOnly: true); final rate depends on exact travel date and pickup window.",
        ]
      : []),
    ...(request.corridorId === "corridor:denver-vail-i70"
      ? [
          "CDOT avalanche mitigation and live I-70 safety holds over Vail Pass (MP 180–195) or Eisenhower Tunnel (MP 213.7) can change within 30 minutes of departure.",
        ]
      : []),
  ];

  const inputHash = `sha256:${sha256HexFull(rfc8785Canonicalize(normalizedInputs))}`;
  const outcomePayloadForHash = {
    modelVersion: APPLICABILITY_MODEL_VERSION,
    compilerVersion: APPLICABILITY_COMPILER_VERSION,
    modelHash: model.modelHash,
    corridorId: request.corridorId,
    inputHash,
    recommendedVehicleClassId: topCandidate?.vehicleClassId ?? null,
    recommendedOperatorId: topCandidate?.operatorId ?? null,
    compiledSegmentConstraints,
    compiledRegulations,
    vehicleClassEvaluations,
  };
  const outcomeHashHex = sha256HexFull(rfc8785Canonicalize(outcomePayloadForHash));
  const outcomeHash = `sha256:${outcomeHashHex}`;
  const decisionReceiptId = `rcpt:sha256:${outcomeHashHex}`;

  return {
    spec: "dcc-compiled-applicability-outcome/1.0",
    modelVersion: APPLICABILITY_MODEL_VERSION,
    compilerVersion: APPLICABILITY_COMPILER_VERSION,
    modelHash: model.modelHash,
    evidenceVersion: model.evidenceVersion.startsWith("evsnap:")
      ? model.evidenceVersion
      : compiledSegmentConstraints[0]?.evidenceVersion || model.evidenceVersion,
    corridorId: request.corridorId,
    normalizedInputs,
    inputHash,
    outcomeHash,
    decisionReceiptId,
    recommendedVehicleClassId: topCandidate?.vehicleClassId ?? null,
    recommendedOperatorId: topCandidate?.operatorId ?? null,
    recommendedOperatorName: topCandidate?.operatorName ?? null,
    compiledSegmentConstraints,
    compiledRegulations,
    vehicleClassEvaluations,
    compiledDecisionSummary: {
      headline,
      primaryConstraintCodes,
      activeSegmentDirectives: compiledSegmentConstraints.flatMap(
        (s) => s.compiledDirectives,
      ),
      baggageEnvelopeResolution,
      pricingDisposition,
      epistemicUnknowns,
    },
  };
}
