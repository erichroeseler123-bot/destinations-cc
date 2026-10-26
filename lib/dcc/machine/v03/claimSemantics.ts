/**
 * DCC Machine Layer v0.3 — Orthogonal Claim Semantics & Source Authority Model
 *
 * Strictly separates:
 * 1. `assertionType`: What kind of proposition is being expressed
 * 2. `epistemicState`: How the proposition is supported (NEVER bare "verified" as objective truth)
 * 3. `lifecycleState`: Operational lifecycle in the append-only ledger
 * 4. `freshnessState`: Computed dynamically at evaluation time (`current`, `stale`, `expired`)
 * 5. `sourceAuthority`: Competence domain, authority tier, and independent corroboration
 */

export const V03_ASSERTION_TYPES = [
  "observation",
  "source_assertion",
  "policy",
  "inference",
  "recommendation",
  "preference",
] as const;
export type V03AssertionType = (typeof V03_ASSERTION_TYPES)[number];

export const V03_EPISTEMIC_STATES = [
  "source_asserted",
  "corroborated",
  "verified_against_identified_evidence",
  "disputed",
  "unknown",
] as const;
export type V03EpistemicState = (typeof V03_EPISTEMIC_STATES)[number];

export const V03_LIFECYCLE_STATES = [
  "quarantined",
  "active",
  "superseded",
  "withdrawn",
] as const;
export type V03LifecycleState = (typeof V03_LIFECYCLE_STATES)[number];

export const V03_FRESHNESS_STATES = ["current", "stale", "expired"] as const;
export type V03FreshnessState = (typeof V03_FRESHNESS_STATES)[number];

export const V03_AUTHORITY_TIERS = [
  "primary_regulator",
  "official_infrastructure",
  "direct_operator",
  "authorized_reseller",
  "independent_observer",
  "unverified_third_party",
] as const;
export type V03AuthorityTier = (typeof V03_AUTHORITY_TIERS)[number];

export type V03CompetenceDomain =
  | "aviation_regulation"
  | "marine_wildlife_regulation"
  | "land_management_permit"
  | "weather_camera_portal_reachability"
  | "site_specific_vfr_weather_telemetry"
  | "port_berth_and_transfer_timing"
  | "operator_safety_and_weight_policy"
  | "operator_vessel_and_boarding_policy"
  | "operator_pricing_and_schedule"
  | "live_seat_inventory_availability"
  | "ground_shuttle_operations";

export interface V03SourceAuthority {
  sourceDccId: string;
  organizationName: string;
  authorityTier: V03AuthorityTier;
  competentDomains: V03CompetenceDomain[];
  claimedDomain: V03CompetenceDomain;
  independentlyCorroboratedBySourceDccIds: string[];
  licenseOrReusePolicy: string;
}

export interface V03TemporalClaimBounds {
  validFrom: string;
  validTo: string | null;
  sourceObservedAt: string | null;
  sourcePublishedAt: string | null;
  retrievedAt: string;
  recordedAt: string;
  freshnessTtlSeconds: number;
}

/**
 * Computes `freshnessState` ("current" | "stale" | "expired") at `referenceTimeIso` (`validAt` / `knowledgeCutoff`):
 * - `expired`: `validTo` is present and `validAt > validTo`, OR `validAt < validFrom`.
 * - `stale`: `knowledgeCutoff - retrievedAt > freshnessTtlSeconds * 1000`.
 * - `current`: within validity window and within freshness TTL.
 */
export function computeV03FreshnessState(params: {
  validFrom: string;
  validTo: string | null;
  retrievedAt: string;
  freshnessTtlSeconds: number;
  validAtIso: string;
  knowledgeCutoffIso: string;
}): V03FreshnessState {
  const validFromMs = Date.parse(params.validFrom);
  const validToMs = params.validTo ? Date.parse(params.validTo) : null;
  const retrievedAtMs = Date.parse(params.retrievedAt);
  const validAtMs = Date.parse(params.validAtIso);
  const cutoffMs = Date.parse(params.knowledgeCutoffIso);

  if (validAtMs < validFromMs) {
    return "expired";
  }
  if (validToMs !== null && validAtMs > validToMs) {
    return "expired";
  }
  const ageSeconds = (cutoffMs - retrievedAtMs) / 1000;
  if (ageSeconds > params.freshnessTtlSeconds) {
    return "stale";
  }
  return "current";
}

/**
 * Checks whether a claim is epistemically, temporally, and authoritatively eligible
 * to support a positive recommendation at `(validAt, knowledgeCutoff)`.
 */
export function evaluateClaimSupportEligibility(params: {
  assertionType: V03AssertionType;
  epistemicState: V03EpistemicState;
  lifecycleState: V03LifecycleState;
  sourceAuthority: V03SourceAuthority;
  validFrom: string;
  validTo: string | null;
  retrievedAt: string;
  freshnessTtlSeconds: number;
  validAtIso: string;
  knowledgeCutoffIso: string;
}): {
  canSupportEligibility: boolean;
  freshnessState: V03FreshnessState;
  sourceCompetentForDomain: boolean;
  disqualificationOrIndeterminateReason: string | null;
} {
  const freshnessState = computeV03FreshnessState({
    validFrom: params.validFrom,
    validTo: params.validTo,
    retrievedAt: params.retrievedAt,
    freshnessTtlSeconds: params.freshnessTtlSeconds,
    validAtIso: params.validAtIso,
    knowledgeCutoffIso: params.knowledgeCutoffIso,
  });

  const sourceCompetentForDomain = params.sourceAuthority.competentDomains.includes(
    params.sourceAuthority.claimedDomain,
  );

  if (params.lifecycleState !== "active") {
    return {
      canSupportEligibility: false,
      freshnessState,
      sourceCompetentForDomain,
      disqualificationOrIndeterminateReason: `CLAIM_LIFECYCLE_${params.lifecycleState.toUpperCase()}`,
    };
  }

  if (params.epistemicState === "unknown") {
    return {
      canSupportEligibility: false,
      freshnessState,
      sourceCompetentForDomain,
      disqualificationOrIndeterminateReason: "CLAIM_EPISTEMIC_UNKNOWN",
    };
  }

  if (params.epistemicState === "disputed") {
    return {
      canSupportEligibility: false,
      freshnessState,
      sourceCompetentForDomain,
      disqualificationOrIndeterminateReason: "CLAIM_EPISTEMIC_DISPUTED",
    };
  }

  if (!sourceCompetentForDomain) {
    return {
      canSupportEligibility: false,
      freshnessState,
      sourceCompetentForDomain: false,
      disqualificationOrIndeterminateReason: `SOURCE_AUTHORITY_INCOMPETENT_FOR_DOMAIN:${params.sourceAuthority.claimedDomain}`,
    };
  }

  if (freshnessState !== "current") {
    return {
      canSupportEligibility: false,
      freshnessState,
      sourceCompetentForDomain,
      disqualificationOrIndeterminateReason: `CLAIM_FRESHNESS_${freshnessState.toUpperCase()}`,
    };
  }

  return {
    canSupportEligibility: true,
    freshnessState: "current",
    sourceCompetentForDomain: true,
    disqualificationOrIndeterminateReason: null,
  };
}
