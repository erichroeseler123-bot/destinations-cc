/**
 * Canonical 5-State Network Fit Vocabulary & Pure Deterministic Mappers.
 *
 * Zero Node `fs` and zero database imports so standalone sub-apps, edge proxies,
 * and serverless API routes can share identical fit semantics without inflating bundles.
 *
 * Governance invariant:
 * - Fit evaluation is ALWAYS commission-neutral (`commissionNeutral: true`).
 *   Commercial payout rates, affiliate IDs, and Merchant-of-Record margins never
 *   alter `status` or candidate ranking.
 */

export type CanonicalFitStatus =
  | "fits"
  | "does_not_fit"
  | "needs_verification"
  | "unavailable"
  | "unknown";

export type InformationBasis =
  | "official_operating_fact"
  | "modeled_schedule_math"
  | "unverified";

export type CanonicalFreshnessState = "current" | "stale" | "unknown";

export interface CanonicalFitEvaluation {
  status: CanonicalFitStatus;
  label: string;
  informationBasis: InformationBasis;
  commissionNeutral: true;
  factAppliesAt: string | null;
  learnedByDccAt: string | null;
  freshnessState: CanonicalFreshnessState;
  assumptions: string[];
  sources: string[];
  rawEngineStatus?: string;
}

export interface MapRawFitOptions {
  qualified?: boolean;
  isQualified?: boolean;
  isStale?: boolean;
  freshnessState?: CanonicalFreshnessState;
  pastDepartureRejected?: boolean;
  seatAvailable?: boolean | null;
}

const FITS_RAW_STATUSES = new Set<string>([
  "fits",
  "fits_comfortably",
  "tight_buffer",
  "tight_fit",
  "strong_fit",
  "best_fit",
  "eligible",
  "recommended",
  "still_fits",
]);

const DOES_NOT_FIT_RAW_STATUSES = new Set<string>([
  "runs_too_late",
  "runs_too_early",
  "does_not_fit",
  "does_not_fit_port_window",
  "ineligible",
  "no_longer_fits",
]);

const NEEDS_VERIFICATION_RAW_STATUSES = new Set<string>([
  "needs_verification",
  "qualified",
  "qualified_needs_confirmation",
  "needs_confirmation",
  "needs_reverification",
  "qualified_stale_or_unknown",
  "tighter_margin_caution",
  "check_availability",
]);

const UNAVAILABLE_RAW_STATUSES = new Set<string>([
  "sold_out",
  "unavailable",
  "withdrawn",
  "past_departure_rejected",
]);

const UNKNOWN_RAW_STATUSES = new Set<string>([
  "missing_operator_info",
  "unknown",
  "indeterminate",
  "unverified",
]);

export const CANONICAL_FIT_DEFAULT_LABELS: Record<CanonicalFitStatus, string> = {
  fits: "Fits window",
  does_not_fit: "Does not fit window",
  needs_verification: "Needs verification",
  unavailable: "Unavailable",
  unknown: "Fit unknown",
};

function normalizeRawStatusToken(raw?: string | null): string {
  if (!raw || typeof raw !== "string") return "";
  return raw
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

/**
 * Deterministically maps any engine, port-day catalog, or machine-layer status
 * into the canonical 5-state fit enum.
 */
export function mapRawFitToCanonicalStatus(
  rawStatus?: string | null,
  options?: MapRawFitOptions,
): CanonicalFitStatus {
  if (options?.pastDepartureRejected === true || options?.seatAvailable === false) {
    return "unavailable";
  }

  const token = normalizeRawStatusToken(rawStatus);
  if (!token) {
    return "unknown";
  }

  if (UNAVAILABLE_RAW_STATUSES.has(token)) {
    return "unavailable";
  }

  if (DOES_NOT_FIT_RAW_STATUSES.has(token)) {
    return "does_not_fit";
  }

  if (NEEDS_VERIFICATION_RAW_STATUSES.has(token)) {
    return "needs_verification";
  }

  if (FITS_RAW_STATUSES.has(token)) {
    const isQualified = Boolean(options?.qualified || options?.isQualified);
    const isStale =
      Boolean(options?.isStale) || options?.freshnessState === "stale";
    if (isQualified || isStale) {
      return "needs_verification";
    }
    return "fits";
  }

  if (UNKNOWN_RAW_STATUSES.has(token)) {
    return "unknown";
  }

  return "unknown";
}

export interface BuildCanonicalFitEvaluationInput {
  rawStatus?: string | null;
  label?: string | null;
  informationBasis?: InformationBasis;
  factAppliesAt?: string | null;
  learnedByDccAt?: string | null;
  freshnessState?: CanonicalFreshnessState;
  qualified?: boolean;
  isQualified?: boolean;
  isStale?: boolean;
  pastDepartureRejected?: boolean;
  seatAvailable?: boolean | null;
  assumptions?: readonly string[];
  sources?: readonly string[];
}

function cleanStringList(items?: readonly string[]): string[] {
  if (!items || items.length === 0) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of items) {
    if (typeof raw !== "string") continue;
    const trimmed = raw.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    out.push(trimmed);
  }
  return out;
}

/**
 * Builds a complete, commission-neutral `CanonicalFitEvaluation` envelope.
 */
export function buildCanonicalFitEvaluation(
  input: BuildCanonicalFitEvaluationInput,
): CanonicalFitEvaluation {
  const freshnessState: CanonicalFreshnessState = input.isStale
    ? "stale"
    : input.freshnessState || "unknown";

  const status = mapRawFitToCanonicalStatus(input.rawStatus, {
    qualified: input.qualified,
    isQualified: input.isQualified,
    isStale: input.isStale,
    freshnessState,
    pastDepartureRejected: input.pastDepartureRejected,
    seatAvailable: input.seatAvailable,
  });

  const informationBasis: InformationBasis =
    input.informationBasis ||
    (status === "unknown" ? "unverified" : "modeled_schedule_math");

  const resolvedLabel =
    typeof input.label === "string" && input.label.trim().length > 0
      ? input.label.trim()
      : CANONICAL_FIT_DEFAULT_LABELS[status];

  const normalizedRaw =
    typeof input.rawStatus === "string" && input.rawStatus.trim().length > 0
      ? input.rawStatus.trim()
      : undefined;

  return {
    status,
    label: resolvedLabel,
    informationBasis,
    commissionNeutral: true,
    factAppliesAt:
      typeof input.factAppliesAt === "string" && input.factAppliesAt.trim().length > 0
        ? input.factAppliesAt.trim()
        : null,
    learnedByDccAt:
      typeof input.learnedByDccAt === "string" && input.learnedByDccAt.trim().length > 0
        ? input.learnedByDccAt.trim()
        : null,
    freshnessState,
    assumptions: cleanStringList(input.assumptions),
    sources: cleanStringList(input.sources),
    ...(normalizedRaw ? { rawEngineStatus: normalizedRaw } : {}),
  };
}
