import crypto from "node:crypto";
import { calculateCruiseWindow, DOCK_TRANSFERS } from "./cruise-window";
import type { CruiseWindowCalculation, PortSlug } from "./affiliate/types";

export const LFSE_MANDATORY_RETURN_BUFFER_MINUTES = 45;

export interface DccApprovedResearchFact {
  fact_id: string;
  id?: string;
  cluster: string;
  port_slug?: string;
  operator_id?: string;
  operator_name?: string;
  product_id: string;
  product_name?: string;
  lfse_context_id?: string | null;
  constraint_type: string;
  value: string;
  unit: string;
  conditions: string;
  source_url: string;
  source_excerpt?: string;
  source_hash: string;
  current_source_hash?: string | null;
  revision: number;
  status?: string | null;
  verified?: boolean;
  eligibility_status?: string;
  disqualification_reason?: string | null;
  verified_on: string | null;
  verified_by: string | null;
  reviewer_id?: string | null;
  review_due_on: string | null;
  review_deadline_utc?: string | null;
  remaining_ttl_seconds?: number;
  healthy?: number | boolean | null;
  active?: number | boolean | null;
  conflicted?: boolean | null;
  consumers?: string[] | string | null;
}

export interface DirectLfseResearchContextSpec {
  productId: string;
  lfseContextId: string;
  productName: string;
  operatorId: string;
  operatorName: string;
  portSlug: PortSlug;
  activitySlug: string;
  clusterId: string;
  officialSourceUrl: string;
  defaultDockKey: string;
  nonTransferableScopeNote: string;
  isolatedViatorResellerSkus: string[];
}

export const DIRECT_LFSE_RESEARCH_CONTEXTS: Record<
  string,
  DirectLfseResearchContextSpec
> = {
  "coastal-helicopters-icefield-excursion-direct": {
    productId: "coastal-helicopters-icefield-excursion-direct",
    lfseContextId: "juneau/coastal-helicopters-icefield-excursion-direct",
    productName:
      "Coastal Helicopters — Herbert Glacier Icefield Excursion (Direct)",
    operatorId: "coastal-helicopters",
    operatorName: "Coastal Helicopters",
    portSlug: "juneau",
    activitySlug: "helicopter-glacier-tours",
    clusterId: "alaska-juneau",
    officialSourceUrl: "https://coastalhelicopters.com/tours/icefield-excursion/",
    defaultDockKey: "franklin-dock",
    nonTransferableScopeNote:
      "Applies strictly to Coastal Helicopters direct Herbert Glacier Icefield Excursion (FareHarbor item 413056). Never apply to Viator reseller SKU 6251SHOREXICEWALK (channel equivalence not established), TEMSCO, NorthStar Trekking, or Coastal Dog Sled.",
    isolatedViatorResellerSkus: ["6251SHOREXICEWALK"],
  },
  "temsco-mendenhall-glacier-pilot-choice-direct": {
    productId: "temsco-mendenhall-glacier-pilot-choice-direct",
    lfseContextId: "juneau/temsco-mendenhall-glacier-pilot-choice-direct",
    productName:
      "TEMSCO Helicopters — Mendenhall Glacier & Pilot's Choice (Direct)",
    operatorId: "temsco-helicopters",
    operatorName: "TEMSCO Helicopters",
    portSlug: "juneau",
    activitySlug: "helicopter-glacier-tours",
    clusterId: "alaska-juneau",
    officialSourceUrl: "https://temscoair.com/juneau-tours/",
    defaultDockKey: "franklin-dock",
    nonTransferableScopeNote:
      "Applies strictly to TEMSCO Helicopters direct Juneau glacier flights; never inherits Coastal Helicopters or NorthStar Trekking approvals.",
    isolatedViatorResellerSkus: [],
  },
  "northstar-glacier-walkabout-direct": {
    productId: "northstar-glacier-walkabout-direct",
    lfseContextId: "juneau/northstar-glacier-walkabout-direct",
    productName: "NorthStar Trekking — Glacier Walkabout (Direct)",
    operatorId: "northstar-trekking",
    operatorName: "NorthStar Trekking",
    portSlug: "juneau",
    activitySlug: "helicopter-glacier-tours",
    clusterId: "alaska-juneau",
    officialSourceUrl: "https://www.glaciertrekking.com/",
    defaultDockKey: "franklin-dock",
    nonTransferableScopeNote:
      "Applies strictly to NorthStar Trekking direct Glacier Walkabout; never inherits Coastal Helicopters or TEMSCO approvals.",
    isolatedViatorResellerSkus: [],
  },
  "taquan-air-misty-fjords-direct": {
    productId: "taquan-air-misty-fjords-direct",
    lfseContextId: "ketchikan/taquan-air-misty-fjords-direct",
    productName: "Taquan Air — Misty Fjords Flightseeing (Direct)",
    operatorId: "taquan-air",
    operatorName: "Taquan Air",
    portSlug: "ketchikan",
    activitySlug: "misty-fjords-tours",
    clusterId: "alaska-ketchikan",
    officialSourceUrl: "https://taquanair.com/tours/misty-fjords-flightseeing/",
    defaultDockKey: "ketchikan-berths-1-4",
    nonTransferableScopeNote:
      "Applies strictly to Taquan Air direct Misty Fjords Flightseeing; never transfer to Island Wings or Viator reseller SKU 6459PRTKTNMISTY.",
    isolatedViatorResellerSkus: ["6459PRTKTNMISTY"],
  },
  "island-wings-misty-fjords-direct": {
    productId: "island-wings-misty-fjords-direct",
    lfseContextId: "ketchikan/island-wings-misty-fjords-direct",
    productName: "Island Wings Air Service — Misty Fjords Flightseeing (Direct)",
    operatorId: "island-wings",
    operatorName: "Island Wings Air Service",
    portSlug: "ketchikan",
    activitySlug: "misty-fjords-tours",
    clusterId: "alaska-ketchikan",
    officialSourceUrl: "https://www.islandwings.com/mistytours.html",
    defaultDockKey: "ketchikan-berths-1-4",
    nonTransferableScopeNote:
      "Applies strictly to Island Wings Air Service direct Misty Fjords Flightseeing; never transfer to Taquan Air or Viator reseller SKU 6459PRTKTNMISTY.",
    isolatedViatorResellerSkus: ["6459PRTKTNMISTY"],
  },
  "allen-marine-misty-fjords-quest-direct": {
    productId: "allen-marine-misty-fjords-quest-direct",
    lfseContextId: "ketchikan/allen-marine-misty-fjords-quest-direct",
    productName: "Allen Marine Tours — Misty Fjords & Wilderness Quest (Direct)",
    operatorId: "allen-marine",
    operatorName: "Allen Marine Tours",
    portSlug: "ketchikan",
    activitySlug: "misty-fjords-tours",
    clusterId: "alaska-ketchikan",
    officialSourceUrl:
      "https://allenmarinetours.com/ketchikan/misty-fjords-wilderness-quest/",
    defaultDockKey: "ketchikan-berths-1-4",
    nonTransferableScopeNote:
      "Applies strictly to Allen Marine direct Misty Fjords & Wilderness Quest; never transfer to Viator reseller SKU 472133P3.",
    isolatedViatorResellerSkus: ["472133P3"],
  },
  "cape-fox-saxman-totem-park-direct": {
    productId: "cape-fox-saxman-totem-park-direct",
    lfseContextId: "ketchikan/cape-fox-saxman-totem-park-direct",
    productName: "Cape Fox Tours — Saxman Native Village Totem Park (Direct)",
    operatorId: "cape-fox-tours",
    operatorName: "Cape Fox Tours",
    portSlug: "ketchikan",
    activitySlug: "totem-and-cultural-tours",
    clusterId: "alaska-ketchikan",
    officialSourceUrl: "https://www.capefoxtours.com/tours/",
    defaultDockKey: "ketchikan-berths-1-4",
    nonTransferableScopeNote:
      "Applies strictly to single-product Saxman Totem Park direct tour; umbrella bundles (cape-fox-saxman-highlights-lumberjack, cape-fox-saxman-signature-creek-street) and Viator SKU 445368P5 are blocked from sharing approvals.",
    isolatedViatorResellerSkus: ["445368P5"],
  },
};

export const BLOCKED_KETCHIKAN_UMBRELLA_PRODUCTS = [
  "cape-fox-saxman-highlights-lumberjack",
  "cape-fox-saxman-signature-creek-street",
] as const;

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const SHA256_HEX_RE = /^[a-f0-9]{64}$/i;

export interface ValidatedLfseFactEvidence {
  fact_id: string;
  operator_id: string;
  product_id: string;
  lfse_context_id: string;
  port_slug: PortSlug;
  constraint_type: string;
  value: string;
  unit: string;
  conditions: string;
  source_url: string;
  source_excerpt: string;
  source_hash: string;
  revision: number;
  verified_on: string;
  verified_by: string;
  review_due_on: string;
  review_deadline_utc: string;
  remaining_ttl_seconds: number;
}

export type LfseFactValidationOutcome =
  | { valid: true; evidence: ValidatedLfseFactEvidence }
  | {
      valid: false;
      reason:
        | "missing_fact_id"
        | "blocked_umbrella_product"
        | "unmapped_product"
        | "withdrawn"
        | "conflicted"
        | "unconfirmed_status"
        | "missing_human_verifier"
        | "invalid_verified_on"
        | "invalid_review_due_on"
        | "expired"
        | "empty_value"
        | "source_unhealthy"
        | "source_changed"
        | "unconfirmed_revision";
    };

export function validateLfseApprovedFactRecord(
  raw: DccApprovedResearchFact,
  options?: { nowMs?: number },
): LfseFactValidationOutcome {
  const nowMs = options?.nowMs ?? Date.now();
  const factId = String(raw.fact_id ?? raw.id ?? "").trim();
  if (!factId) {
    return { valid: false, reason: "missing_fact_id" };
  }

  const productId = String(raw.product_id ?? "").trim();
  if (
    (BLOCKED_KETCHIKAN_UMBRELLA_PRODUCTS as readonly string[]).includes(
      productId,
    )
  ) {
    return { valid: false, reason: "blocked_umbrella_product" };
  }

  const spec = DIRECT_LFSE_RESEARCH_CONTEXTS[productId];
  if (!spec) {
    return { valid: false, reason: "unmapped_product" };
  }

  const active =
    raw.active === undefined || raw.active === null
      ? true
      : raw.active === 1 || raw.active === true;
  if (!active || raw.eligibility_status === "withdrawn") {
    return { valid: false, reason: "withdrawn" };
  }

  const statusStr = String(
    raw.status ?? (raw.verified ? "Confirmed" : ""),
  ).trim();
  if (
    raw.conflicted === true ||
    raw.eligibility_status === "conflicted" ||
    /\bconflict\b/i.test(statusStr)
  ) {
    return { valid: false, reason: "conflicted" };
  }

  if (raw.verified === false || statusStr !== "Confirmed") {
    return { valid: false, reason: "unconfirmed_status" };
  }

  const verifiedBy = String(raw.verified_by ?? "").trim();
  if (
    !verifiedBy ||
    /^(auto|machine|bot|system|cron|unverified|candidate)$/i.test(verifiedBy)
  ) {
    return { valid: false, reason: "missing_human_verifier" };
  }

  const verifiedOn = String(raw.verified_on ?? "").trim();
  if (!ISO_DATE_RE.test(verifiedOn)) {
    return { valid: false, reason: "invalid_verified_on" };
  }
  const verifiedOnMs = Date.parse(`${verifiedOn}T00:00:00.000Z`);
  if (
    !Number.isFinite(verifiedOnMs) ||
    verifiedOnMs > nowMs + 24 * 60 * 60 * 1000
  ) {
    return { valid: false, reason: "invalid_verified_on" };
  }

  const reviewDueOn = String(raw.review_due_on ?? "").trim();
  if (!ISO_DATE_RE.test(reviewDueOn)) {
    return { valid: false, reason: "invalid_review_due_on" };
  }
  const deadlineMs = Date.parse(`${reviewDueOn}T00:00:00.000Z`);
  if (!Number.isFinite(deadlineMs)) {
    return { valid: false, reason: "invalid_review_due_on" };
  }
  if (nowMs >= deadlineMs) {
    return { valid: false, reason: "expired" };
  }

  const value = String(raw.value ?? "").trim();
  if (!value) {
    return { valid: false, reason: "empty_value" };
  }

  const healthy =
    raw.healthy === undefined || raw.healthy === null
      ? true
      : raw.healthy === 1 || raw.healthy === true;
  if (!healthy || raw.eligibility_status === "source_unhealthy") {
    return { valid: false, reason: "source_unhealthy" };
  }

  const sourceHash = String(raw.source_hash ?? "").trim().toLowerCase();
  const currentSourceHash =
    raw.current_source_hash !== undefined && raw.current_source_hash !== null
      ? String(raw.current_source_hash).trim().toLowerCase()
      : sourceHash;
  if (
    !SHA256_HEX_RE.test(sourceHash) ||
    !SHA256_HEX_RE.test(currentSourceHash) ||
    sourceHash !== currentSourceHash ||
    raw.eligibility_status === "source_changed"
  ) {
    return { valid: false, reason: "source_changed" };
  }

  const revision = Number(raw.revision ?? 0);
  if (!Number.isInteger(revision) || revision < 2) {
    return { valid: false, reason: "unconfirmed_revision" };
  }

  const remainingTtlSeconds = Math.max(
    0,
    Math.floor((deadlineMs - nowMs) / 1000),
  );

  return {
    valid: true,
    evidence: {
      fact_id: factId,
      operator_id: spec.operatorId,
      product_id: spec.productId,
      lfse_context_id: spec.lfseContextId,
      port_slug: spec.portSlug,
      constraint_type: String(raw.constraint_type ?? "").trim(),
      value,
      unit: String(raw.unit ?? "").trim(),
      conditions: String(raw.conditions ?? "").trim(),
      source_url: String(raw.source_url ?? "").trim(),
      source_excerpt: String(raw.source_excerpt ?? "").trim(),
      source_hash: sourceHash,
      revision,
      verified_on: verifiedOn,
      verified_by: verifiedBy,
      review_due_on: reviewDueOn,
      review_deadline_utc: new Date(deadlineMs).toISOString(),
      remaining_ttl_seconds: remainingTtlSeconds,
    },
  };
}

export interface LfseQualificationInputContext {
  shipArrival?: string | null;
  allAboardTime?: string | null;
  meetingTime?: string | null;
  dockKey?: string | null;
  partyMinAgeMonths?: number | null;
  partyMaxPassengerWeightLbs?: number | null;
  requiresStepFreeWheelchair?: boolean;
  nowMs?: number;
}

export interface LfseConstraintQualification {
  status: "verified" | "unknown" | "warning" | "does_not_fit";
  summary: string;
  evidence: ValidatedLfseFactEvidence | null;
}

export interface LfseDirectContextQualification {
  productId: string;
  lfseContextId: string;
  productName: string;
  operatorId: string;
  operatorName: string;
  portSlug: PortSlug;
  activitySlug: string;
  officialSourceUrl: string;
  nonTransferableScopeNote: string;
  isolatedViatorResellerSkus: string[];
  overallQualificationStatus:
    | "qualified_for_port_day"
    | "needs_confirmation"
    | "does_not_fit";
  fitsPortDayEstablished: boolean;
  mandatoryReturnBufferMinutes: number;
  verifiedFactCount: number;
  verifiedFacts: ValidatedLfseFactEvidence[];
  constraints: {
    duration: LfseConstraintQualification & { durationMinutes: number | null };
    flightDuration: LfseConstraintQualification;
    glacierLandingDuration: LfseConstraintQualification;
    returnBuffer: {
      status: "strong_fit" | "tight_fit" | "does_not_fit" | "unknown";
      mandatoryBufferMinutes: number;
      dockName: string;
      dockTransferMinutesEachWay: number;
      cruiseWindowCalculation: CruiseWindowCalculation | null;
      summary: string;
    };
    pickup: LfseConstraintQualification;
    age: LfseConstraintQualification;
    mobility: LfseConstraintQualification;
  };
  missingOrUnknownConstraints: string[];
  recommendedMaxAgeSeconds: number;
  qualificationSummaryText: string;
}

export function qualifyLfseDirectContext(
  productId: string,
  facts: DccApprovedResearchFact[],
  context?: LfseQualificationInputContext,
): LfseDirectContextQualification | null {
  const spec = DIRECT_LFSE_RESEARCH_CONTEXTS[productId];
  if (!spec) return null;

  const nowMs = context?.nowMs ?? Date.now();
  const productFacts = facts.filter(
    (row) => String(row.product_id ?? "").trim() === spec.productId,
  );

  const verifiedFacts: ValidatedLfseFactEvidence[] = [];
  let hadInvalidatedFact = false;

  for (const row of productFacts) {
    const outcome = validateLfseApprovedFactRecord(row, { nowMs });
    if (outcome.valid) {
      verifiedFacts.push(outcome.evidence);
    } else if (
      outcome.reason === "expired" ||
      outcome.reason === "withdrawn" ||
      outcome.reason === "conflicted" ||
      outcome.reason === "source_changed" ||
      outcome.reason === "source_unhealthy"
    ) {
      hadInvalidatedFact = true;
    }
  }

  const findVerified = (
    ...types: string[]
  ): ValidatedLfseFactEvidence | null =>
    verifiedFacts.find((f) => types.includes(f.constraint_type)) ?? null;

  // 1. Total Duration
  const durationEv = findVerified("total_duration", "duration");
  const parsedDuration = durationEv
    ? Number.parseInt(durationEv.value, 10)
    : Number.NaN;
  const durationMinutes =
    Number.isFinite(parsedDuration) && parsedDuration > 0
      ? parsedDuration
      : null;

  const durationQualification: LfseConstraintQualification & {
    durationMinutes: number | null;
  } =
    durationEv && durationMinutes !== null
      ? {
          status: "verified",
          durationMinutes,
          evidence: durationEv,
          summary: `Verified ${durationEv.value} ${durationEv.unit} (${durationEv.source_excerpt || "Total Duration"}) — confirmed ${durationEv.verified_on} by ${durationEv.verified_by}, review due ${durationEv.review_due_on} (rev ${durationEv.revision}).`,
        }
      : {
          status: "unknown",
          durationMinutes: null,
          evidence: null,
          summary: "Total excursion duration is unconfirmed (unknown).",
        };

  // 2. Flight & Glacier Landing details
  const flightEv = findVerified("flight_duration");
  const flightDurationQualification: LfseConstraintQualification = flightEv
    ? {
        status: "verified",
        evidence: flightEv,
        summary: `Verified flight time: ${flightEv.value} ${flightEv.unit}${flightEv.conditions ? ` (${flightEv.conditions})` : ""} (rev ${flightEv.revision}, verified ${flightEv.verified_on}).`,
      }
    : {
        status: "unknown",
        evidence: null,
        summary: "Flight duration breakdown is unconfirmed (unknown).",
      };

  const glacierEv = findVerified("glacier_duration_detail");
  const glacierLandingQualification: LfseConstraintQualification = glacierEv
    ? {
        status: "verified",
        evidence: glacierEv,
        summary: `Verified glacier landing: ${glacierEv.value} ${glacierEv.unit} (rev ${glacierEv.revision}, verified ${glacierEv.verified_on}).`,
      }
    : {
        status: "unknown",
        evidence: null,
        summary: "Glacier surface duration is unconfirmed (unknown).",
      };

  // 3. Return Buffer (LFSE 45-minute safety standard + dock transfer buffer)
  const dockKey = context?.dockKey || spec.defaultDockKey;
  const dockInfo = DOCK_TRANSFERS[dockKey] ?? {
    dockName: "Downtown Cruise Berth",
    portSlug: spec.portSlug,
    transferMinutesEachWay: 15,
    transferType: "dockside_walk" as const,
    logisticsNote: "Standard cruise dock transfer.",
  };

  let returnBufferStatus:
    | "strong_fit"
    | "tight_fit"
    | "does_not_fit"
    | "unknown" = "unknown";
  let cruiseWindowCalculation: CruiseWindowCalculation | null = null;
  let returnBufferSummary =
    "Port-day fit is unknown: a verified duration alone does not establish port-day fit. Enter ship arrival, all-aboard time, and tour departure time to evaluate the 45-minute return-to-pier safety rule.";

  if (
    durationMinutes !== null &&
    context?.shipArrival &&
    context?.allAboardTime &&
    context?.meetingTime
  ) {
    cruiseWindowCalculation = calculateCruiseWindow({
      arrivalTimeStr: context.shipArrival,
      allAboardTimeStr: context.allAboardTime,
      meetingTimeStr: context.meetingTime,
      durationMinutes,
      dockKey,
      planningMarginMinutes: LFSE_MANDATORY_RETURN_BUFFER_MINUTES,
    });
    returnBufferStatus = cruiseWindowCalculation.status;
    returnBufferSummary = cruiseWindowCalculation.summary;
  }

  // 4. Pickup & Transport constraint
  const pickupEv = findVerified(
    "transport_inclusion",
    "pickup_meeting",
    "pickup_rules",
  );
  const pickupQualification: LfseConstraintQualification = pickupEv
    ? {
        status: "verified",
        evidence: pickupEv,
        summary: `Verified transport (${pickupEv.value} ${pickupEv.unit}): ${pickupEv.conditions}`,
      }
    : {
        status: "unknown",
        evidence: null,
        summary:
          "Exact pier pickup location and shuttle check-in lead time are unconfirmed (unknown).",
      };

  // 5. Age policy constraint
  const ageEv = findVerified("age_policy", "child_seat_and_fare", "minimum_age");
  let ageQualification: LfseConstraintQualification;
  if (!ageEv) {
    ageQualification = {
      status: "unknown",
      evidence: null,
      summary: "Age policy and FAA child-seat rules are unconfirmed (unknown).",
    };
  } else {
    const thresholdNum = Number.parseInt(ageEv.value, 10);
    const hasUnderThresholdChild =
      typeof context?.partyMinAgeMonths === "number" &&
      Number.isFinite(thresholdNum) &&
      context.partyMinAgeMonths < thresholdNum;
    ageQualification = {
      status: hasUnderThresholdChild ? "warning" : "verified",
      evidence: ageEv,
      summary: `Verified age policy: ${ageEv.value} ${ageEv.unit}${ageEv.conditions ? ` (${ageEv.conditions})` : ""} — ${ageEv.source_excerpt || "All ages"} (rev ${ageEv.revision}, verified ${ageEv.verified_on}).`,
    };
  }

  // 6. Mobility & FAA weight declaration constraint
  const mobilityEv = findVerified(
    "weight_declaration",
    "mobility_requirements",
  );
  let mobilityQualification: LfseConstraintQualification;
  if (!mobilityEv) {
    mobilityQualification = {
      status: "unknown",
      evidence: null,
      summary:
        "Mobility requirements and FAA passenger weight surcharge thresholds are unconfirmed (unknown).",
    };
  } else {
    const weightLimitLbs = Number.parseInt(mobilityEv.value, 10);
    const exceedsWeight =
      typeof context?.partyMaxPassengerWeightLbs === "number" &&
      Number.isFinite(weightLimitLbs) &&
      context.partyMaxPassengerWeightLbs >= weightLimitLbs;
    if (context?.requiresStepFreeWheelchair || exceedsWeight) {
      mobilityQualification = {
        status: "warning",
        evidence: mobilityEv,
        summary: `Verified weight/mobility policy (${mobilityEv.value} ${mobilityEv.unit}): ${mobilityEv.conditions}`,
      };
    } else {
      mobilityQualification = {
        status: "verified",
        evidence: mobilityEv,
        summary: `Verified weight/mobility policy (${mobilityEv.value} ${mobilityEv.unit}): ${mobilityEv.conditions}`,
      };
    }
  }

  const missingOrUnknownConstraints: string[] = [];
  if (durationQualification.status === "unknown") {
    missingOrUnknownConstraints.push("duration");
  }
  if (returnBufferStatus === "unknown") {
    missingOrUnknownConstraints.push("ship_schedule_and_45m_return_buffer");
  }
  if (pickupQualification.status === "unknown") {
    missingOrUnknownConstraints.push("pickup");
  }
  if (ageQualification.status === "unknown") {
    missingOrUnknownConstraints.push("age");
  }
  if (mobilityQualification.status === "unknown") {
    missingOrUnknownConstraints.push("mobility");
  }

  // Critical rule: A verified duration alone NEVER establishes port-day fit.
  const fitsPortDayEstablished =
    durationQualification.status === "verified" &&
    (returnBufferStatus === "strong_fit" || returnBufferStatus === "tight_fit") &&
    pickupQualification.status === "verified" &&
    ageQualification.status === "verified" &&
    mobilityQualification.status === "verified";

  const overallQualificationStatus: LfseDirectContextQualification["overallQualificationStatus"] =
    returnBufferStatus === "does_not_fit"
      ? "does_not_fit"
      : fitsPortDayEstablished
        ? "qualified_for_port_day"
        : "needs_confirmation";

  const defaultMaxAge = 300;
  let recommendedMaxAgeSeconds = defaultMaxAge;
  if (verifiedFacts.length > 0) {
    recommendedMaxAgeSeconds = verifiedFacts.reduce(
      (min, f) => Math.min(min, f.remaining_ttl_seconds),
      defaultMaxAge,
    );
  } else if (hadInvalidatedFact) {
    recommendedMaxAgeSeconds = 0;
  } else {
    recommendedMaxAgeSeconds = 60;
  }

  const qualificationSummaryText =
    overallQualificationStatus === "does_not_fit"
      ? `Does not fit cruise window under the ${LFSE_MANDATORY_RETURN_BUFFER_MINUTES}-minute safety rule: ${returnBufferSummary}`
      : fitsPortDayEstablished
        ? `All core constraints (duration, ${LFSE_MANDATORY_RETURN_BUFFER_MINUTES}-minute return buffer, pickup, age, and mobility) are human-confirmed for this port window.`
        : durationQualification.status === "verified"
          ? `Human-confirmed total duration (${durationQualification.evidence?.value} ${durationQualification.evidence?.unit}, rev ${durationQualification.evidence?.revision}) is verified for ${spec.productName}, but port-day fit is not established until ${missingOrUnknownConstraints.join(", ")} are confirmed.`
          : `Unconfirmed constraints (${missingOrUnknownConstraints.join(", ")}) remain unknown and require human review confirmation.`;

  return {
    productId: spec.productId,
    lfseContextId: spec.lfseContextId,
    productName: spec.productName,
    operatorId: spec.operatorId,
    operatorName: spec.operatorName,
    portSlug: spec.portSlug,
    activitySlug: spec.activitySlug,
    officialSourceUrl: spec.officialSourceUrl,
    nonTransferableScopeNote: spec.nonTransferableScopeNote,
    isolatedViatorResellerSkus: spec.isolatedViatorResellerSkus,
    overallQualificationStatus,
    fitsPortDayEstablished,
    mandatoryReturnBufferMinutes: LFSE_MANDATORY_RETURN_BUFFER_MINUTES,
    verifiedFactCount: verifiedFacts.length,
    verifiedFacts,
    constraints: {
      duration: durationQualification,
      flightDuration: flightDurationQualification,
      glacierLandingDuration: glacierLandingQualification,
      returnBuffer: {
        status: returnBufferStatus,
        mandatoryBufferMinutes: LFSE_MANDATORY_RETURN_BUFFER_MINUTES,
        dockName: dockInfo.dockName,
        dockTransferMinutesEachWay: dockInfo.transferMinutesEachWay,
        cruiseWindowCalculation,
        summary: returnBufferSummary,
      },
      pickup: pickupQualification,
      age: ageQualification,
      mobility: mobilityQualification,
    },
    missingOrUnknownConstraints,
    recommendedMaxAgeSeconds,
    qualificationSummaryText,
  };
}

export function qualifyLfsePortDirectContexts(
  portSlug: string,
  facts: DccApprovedResearchFact[],
  context?: LfseQualificationInputContext & { activitySlug?: string },
): LfseDirectContextQualification[] {
  const cleanPort = portSlug.trim().toLowerCase();
  const specs = Object.values(DIRECT_LFSE_RESEARCH_CONTEXTS).filter(
    (s) =>
      s.portSlug === cleanPort &&
      (!context?.activitySlug || s.activitySlug === context.activitySlug),
  );
  return specs
    .map((s) => qualifyLfseDirectContext(s.productId, facts, context))
    .filter((q): q is LfseDirectContextQualification => q !== null);
}

export function computeLfseResearchCacheControl(
  qualifications: LfseDirectContextQualification[],
  defaultMaxAgeSeconds = 300,
): { maxAgeSeconds: number; cacheControlHeader: string } {
  const verified = qualifications.filter((q) => q.verifiedFactCount > 0);
  const anyZero = qualifications.some((q) => q.recommendedMaxAgeSeconds === 0);

  if (anyZero) {
    return {
      maxAgeSeconds: 0,
      cacheControlHeader: "private, no-store, max-age=0, must-revalidate",
    };
  }
  if (verified.length === 0) {
    const fallback = Math.min(defaultMaxAgeSeconds, 60);
    return {
      maxAgeSeconds: fallback,
      cacheControlHeader: `private, max-age=${fallback}, s-maxage=${fallback}, must-revalidate`,
    };
  }
  const minTtl = verified.reduce(
    (min, q) => Math.min(min, q.recommendedMaxAgeSeconds),
    defaultMaxAgeSeconds,
  );
  const capped = Math.max(0, Math.min(defaultMaxAgeSeconds, minTtl));
  if (capped <= 0) {
    return {
      maxAgeSeconds: 0,
      cacheControlHeader: "private, no-store, max-age=0, must-revalidate",
    };
  }
  return {
    maxAgeSeconds: capped,
    cacheControlHeader: `private, max-age=${capped}, s-maxage=${capped}, must-revalidate`,
  };
}

function signDccServiceGetRequest(params: {
  keyId: string;
  secret: string;
  pathname: string;
  searchParams: URLSearchParams;
}): Record<string, string> {
  const timestamp = String(Date.now());
  const nonce = crypto.randomBytes(16).toString("hex");
  const bodyHash = crypto.createHash("sha256").update("").digest("hex");
  const sortedEntries = Array.from(params.searchParams.entries()).sort(
    ([a], [b]) => a.localeCompare(b),
  );
  const normalizedQuery = new URLSearchParams(sortedEntries).toString();
  const canonical = [
    "GET",
    params.pathname,
    normalizedQuery,
    timestamp,
    nonce,
    bodyHash,
  ].join("\n");
  const signature = crypto
    .createHmac("sha256", params.secret)
    .update(canonical)
    .digest("hex");

  return {
    "x-dcc-key-id": params.keyId,
    "x-dcc-timestamp": timestamp,
    "x-dcc-nonce": nonce,
    "x-dcc-content-sha256": bodyHash,
    "x-dcc-signature": signature,
  };
}

export interface LfseApprovedFactsLoadResult {
  facts: DccApprovedResearchFact[];
  source: "dcc_hmac_api" | "unconfigured";
  livePortalReadbackStatus: string;
  livePortalVerified: boolean;
  lastSyncedAt: string | null;
  accessBlocker: string | null;
  recommendedMaxAgeSeconds: number;
}

export async function loadLfseApprovedPortFacts(
  portSlug: string,
  options?: { revalidateSeconds?: number },
): Promise<LfseApprovedFactsLoadResult> {
  if (typeof window !== "undefined") {
    throw new Error(
      "loadLfseApprovedPortFacts must only be called on the server.",
    );
  }

  const keyId =
    process.env.DCC_LFSE_SERVICE_KEY_ID?.trim() ||
    process.env.DCC_CP_SERVICE_KEY_ID?.trim() ||
    "lfse_service_key";
  const secret =
    process.env.DCC_LFSE_SERVICE_SECRET?.trim() ||
    process.env.DCC_CP_SERVICE_SECRET?.trim() ||
    process.env.INTERNAL_API_SECRET?.trim() ||
    "";
  const baseUrl = (
    process.env.DCC_API_BASE_URL?.trim() ||
    "https://destinationcommandcenter.com"
  ).replace(/\/+$/, "");

  if (!secret) {
    return {
      facts: [],
      source: "unconfigured",
      livePortalReadbackStatus: "unconfigured_service_secret",
      livePortalVerified: false,
      lastSyncedAt: null,
      accessBlocker: null,
      recommendedMaxAgeSeconds: 60,
    };
  }

  const pathname = "/api/internal/research/approved-facts";
  const searchParams = new URLSearchParams();
  if (portSlug) {
    searchParams.set("port", portSlug.trim().toLowerCase());
  }

  const headers = signDccServiceGetRequest({
    keyId,
    secret,
    pathname,
    searchParams,
  });

  const targetUrl = `${baseUrl}${pathname}?${searchParams.toString()}`;
  try {
    const fetchInit: RequestInit & { next?: { revalidate?: number } } = {
      method: "GET",
      headers: {
        ...headers,
        Accept: "application/json",
      },
    };
    if (typeof options?.revalidateSeconds === "number") {
      fetchInit.next = { revalidate: options.revalidateSeconds };
    } else {
      fetchInit.cache = "no-store";
    }

    const res = await fetch(targetUrl, fetchInit);
    if (!res.ok) {
      return {
        facts: [],
        source: "dcc_hmac_api",
        livePortalReadbackStatus: `upstream_http_${res.status}`,
        livePortalVerified: false,
        lastSyncedAt: null,
        accessBlocker: null,
        recommendedMaxAgeSeconds: 0,
      };
    }

    const data = (await res.json()) as {
      verified_facts?: DccApprovedResearchFact[];
      all_facts?: DccApprovedResearchFact[];
      live_portal_readback_status?: string;
      live_portal_verified?: boolean;
      last_synced_at?: string | null;
      access_blocker?: string | null;
      recommended_max_age_seconds?: number;
    };

    const incomingFacts = Array.isArray(data.all_facts)
      ? data.all_facts
      : Array.isArray(data.verified_facts)
        ? data.verified_facts
        : [];

    return {
      facts: incomingFacts,
      source: "dcc_hmac_api",
      livePortalReadbackStatus:
        data.live_portal_readback_status ?? "durable_synced_store",
      livePortalVerified: Boolean(data.live_portal_verified),
      lastSyncedAt: data.last_synced_at ?? null,
      accessBlocker: data.access_blocker ?? null,
      recommendedMaxAgeSeconds: data.recommended_max_age_seconds ?? 300,
    };
  } catch {
    return {
      facts: [],
      source: "dcc_hmac_api",
      livePortalReadbackStatus: "network_error",
      livePortalVerified: false,
      lastSyncedAt: null,
      accessBlocker: null,
      recommendedMaxAgeSeconds: 0,
    };
  }
}
