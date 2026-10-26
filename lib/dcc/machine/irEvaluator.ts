import crypto from "node:crypto";
import { hashCanonicalJson } from "./cryptoAndStorage";
import {
  COMPACT_EVALUATION_JSON_SCHEMA,
  EXPANDED_EVALUATION_JSON_SCHEMA,
  SIGNED_RECEIPT_JSON_SCHEMA,
  validateAgainstJsonSchema,
  type CandidateDisposition,
  type CandidateEvaluationSummary,
  type CandidateUniverseDispositionRecord,
  type CompactEvaluationResponse,
  type DecisionIrBundle,
  type DecisionIrCandidate,
  type DecisionIrExpression,
  type DecisionIrOperand,
  type DecisionIrRule,
  type ExpandedEvaluationResponse,
  type MachineClaimConflict,
  type MachineClaimVersion,
  type MachineEntity,
  type MachineEvaluationTrace,
  type MachineEvidenceFragment,
  type MachineRetraction,
  type MachineSource,
  type MachineSourceSnapshot,
  type RuleExecutionRecord,
} from "./schemas";
import {
  enforceBundleComplexityLimits,
  enforceExecutionTimeBudget,
} from "./securityLimits";
import { signDecisionReceipt } from "./signing";

/**
 * DCC Machine Layer v0.1 & v0.2 — Universal High-Speed Deterministic Decision IR Evaluator
 *
 * Strictly deterministic and external-call-free on the hot path.
 * Never performs web searches, scraping, LLM calls, live extraction, or third-party API calls.
 */

export const UNKNOWN_SENTINEL = Symbol.for("dcc.machine.unknown");
export type EpistemicBool = true | false | "unknown";

const SENSITIVE_INPUT_KEY_PATTERN =
  /^(password|secret|token|api_?key|authorization|credit_?card|ssn|email|phone|traveler_?email|traveler_?phone)$/i;

export type RuntimeEpistemicOverrides = {
  claimVersions?: Map<string, MachineClaimVersion>;
  conflicts?: Map<string, MachineClaimConflict>;
  retractions?: Map<string, MachineRetraction>;
  entities?: Map<string, MachineEntity>;
  sources?: Map<string, MachineSource>;
  sourceSnapshots?: Map<string, MachineSourceSnapshot>;
  evidenceFragments?: Map<string, MachineEvidenceFragment>;
  nowIso?: string;
  validAt?: string;
  knownAt?: string;
  maxExecutionTimeMs?: number;
};

const safeEvaluationCache = new Map<
  string,
  CompactEvaluationResponse | ExpandedEvaluationResponse
>();
const MAX_CACHE_ENTRIES = 2000;

export function clearSafeEvaluationCache(): void {
  safeEvaluationCache.clear();
}

function parseHhmmToMinutes(value: unknown): number | "unknown" {
  if (typeof value !== "string") return "unknown";
  const m = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!m) return "unknown";
  const hours = Number(m[1]);
  const mins = Number(m[2]);
  if (hours < 0 || hours > 23 || mins < 0 || mins > 59) return "unknown";
  return hours * 60 + mins;
}

export function normalizeAndValidateIrInputs(
  bundle: DecisionIrBundle,
  rawInput: Record<string, unknown> = {},
): {
  normalizedInput: Record<string, unknown>;
  unknownFields: string[];
  validationIssues: string[];
  containedSensitiveFields: boolean;
} {
  const normalizedInput: Record<string, unknown> = {};
  const unknownFields: string[] = [];
  const validationIssues: string[] = [];
  let containedSensitiveFields = false;

  const declaredFields = new Map(bundle.inputSchema.map((f) => [f.field, f]));

  for (const key of Object.keys(rawInput)) {
    if (SENSITIVE_INPUT_KEY_PATTERN.test(key)) {
      containedSensitiveFields = true;
      continue; // Never copy sensitive/private fields into normalized inputs, caches, or logs
    }
    if (!declaredFields.has(key)) {
      validationIssues.push(`Unknown input field '${key}' is not declared in engine '${bundle.engineId}'.`);
    }
  }

  for (const fieldSpec of bundle.inputSchema) {
    const rawVal = rawInput[fieldSpec.field];
    if (rawVal === "unknown" || rawVal === null || rawVal === "") {
      // Explicitly unknown or null input: never coerce to false or 0!
      normalizedInput[fieldSpec.field] = "unknown";
      unknownFields.push(fieldSpec.field);
      continue;
    }
    if (rawVal === undefined) {
      if (
        fieldSpec.defaultWhenOmitted !== undefined &&
        fieldSpec.defaultWhenOmitted !== "unknown"
      ) {
        normalizedInput[fieldSpec.field] = fieldSpec.defaultWhenOmitted;
      } else if (fieldSpec.required) {
        normalizedInput[fieldSpec.field] = "unknown";
        unknownFields.push(fieldSpec.field);
      } else {
        normalizedInput[fieldSpec.field] = "unknown";
      }
      continue;
    }

    switch (fieldSpec.type) {
      case "string": {
        if (typeof rawVal !== "string") {
          validationIssues.push(`Field '${fieldSpec.field}' must be a string.`);
        } else {
          normalizedInput[fieldSpec.field] = rawVal.trim();
        }
        break;
      }
      case "enum": {
        if (typeof rawVal !== "string" || !fieldSpec.enumValues?.includes(rawVal)) {
          validationIssues.push(
            `Field '${fieldSpec.field}' must be one of [${(fieldSpec.enumValues ?? []).join(", ")}].`,
          );
        } else {
          normalizedInput[fieldSpec.field] = rawVal;
        }
        break;
      }
      case "number": {
        const num = typeof rawVal === "number" ? rawVal : Number(rawVal);
        if (typeof rawVal === "boolean" || Number.isNaN(num) || !Number.isFinite(num)) {
          validationIssues.push(`Field '${fieldSpec.field}' must be a finite number.`);
        } else {
          if (fieldSpec.min !== undefined && num < fieldSpec.min) {
            validationIssues.push(`Field '${fieldSpec.field}' (${num}) is below minimum ${fieldSpec.min}.`);
          }
          if (fieldSpec.max !== undefined && num > fieldSpec.max) {
            validationIssues.push(`Field '${fieldSpec.field}' (${num}) exceeds maximum ${fieldSpec.max}.`);
          }
          normalizedInput[fieldSpec.field] = num;
        }
        break;
      }
      case "boolean": {
        if (typeof rawVal === "boolean") {
          normalizedInput[fieldSpec.field] = rawVal;
        } else if (rawVal === "true") {
          normalizedInput[fieldSpec.field] = true;
        } else if (rawVal === "false") {
          normalizedInput[fieldSpec.field] = false;
        } else {
          validationIssues.push(`Field '${fieldSpec.field}' must be a boolean or 'unknown'.`);
        }
        break;
      }
      case "date": {
        if (typeof rawVal !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(rawVal)) {
          validationIssues.push(`Field '${fieldSpec.field}' must be an ISO date YYYY-MM-DD.`);
        } else {
          normalizedInput[fieldSpec.field] = rawVal;
        }
        break;
      }
      case "time_hhmm": {
        if (typeof rawVal !== "string" || parseHhmmToMinutes(rawVal) === "unknown") {
          validationIssues.push(`Field '${fieldSpec.field}' must be 24h time HH:MM.`);
        } else {
          normalizedInput[fieldSpec.field] = rawVal;
        }
        break;
      }
    }
  }

  return {
    normalizedInput,
    unknownFields,
    validationIssues,
    containedSensitiveFields,
  };
}

function computeDerivedInputsForCandidate(
  bundle: DecisionIrBundle,
  normalizedInput: Record<string, unknown>,
  candidate: DecisionIrCandidate,
): Record<string, unknown> {
  const derived: Record<string, unknown> = {};

  for (const spec of bundle.derivedInputs) {
    switch (spec.formula) {
      case "month_from_date_or_month_field": {
        const monthField = String(spec.params.monthField || "travelMonth");
        const dateField = String(spec.params.dateField || "travelDate");
        const explicitMonth = normalizedInput[monthField];
        if (typeof explicitMonth === "number" && explicitMonth >= 1 && explicitMonth <= 12) {
          derived[spec.field] = explicitMonth;
          break;
        }
        const dateStr = normalizedInput[dateField];
        if (typeof dateStr === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
          const parsedMonth = Number(dateStr.slice(5, 7));
          derived[spec.field] =
            parsedMonth >= 1 && parsedMonth <= 12 ? parsedMonth : "unknown";
        } else {
          derived[spec.field] = "unknown";
        }
        break;
      }
      case "hhmm_window_minutes": {
        const explicitAvailableField = spec.params.explicitMinutesField
          ? String(spec.params.explicitMinutesField)
          : null;
        if (
          explicitAvailableField &&
          typeof normalizedInput[explicitAvailableField] === "number"
        ) {
          derived[spec.field] = normalizedInput[explicitAvailableField];
          break;
        }
        const startField = String(spec.params.startField || "arrivalTime");
        const endField = String(spec.params.endField || "allAboardTime");
        const startMins = parseHhmmToMinutes(normalizedInput[startField]);
        const endMins = parseHhmmToMinutes(normalizedInput[endField]);
        if (startMins === "unknown" || endMins === "unknown") {
          derived[spec.field] = "unknown";
        } else {
          derived[spec.field] = Math.max(0, endMins - startMins);
        }
        break;
      }
      case "candidate_total_door_to_door_minutes": {
        const activity = Number(candidate.attributes.activityMinutes ?? 0);
        const checkIn = Number(candidate.attributes.checkInLeadMinutes ?? 0);
        const transferEachWay = Number(candidate.attributes.transferEachWayMinutes ?? 0);
        const returnBuffer = Number(candidate.attributes.returnBufferMinutes ?? 0);
        const dockKeyField = spec.params.dockField ? String(spec.params.dockField) : null;
        let dockExtra = 0;
        if (dockKeyField) {
          const dockVal = normalizedInput[dockKeyField];
          const dockExtraMap = candidate.attributes.dockExtraMinutes as
            | Record<string, number>
            | undefined;
          if (typeof dockVal === "string" && dockExtraMap && typeof dockExtraMap[dockVal] === "number") {
            dockExtra = dockExtraMap[dockVal];
          }
        }
        derived[spec.field] = activity + checkIn + transferEachWay * 2 + returnBuffer + dockExtra;
        break;
      }
      case "candidate_port_timing_slack_minutes": {
        const availableField = String(spec.params.availableField || "availableWindowMinutes");
        const requiredField = String(spec.params.requiredField || "totalDoorToDoorMinutes");
        const avail = derived[availableField] ?? normalizedInput[availableField];
        const req = derived[requiredField] ?? candidate.attributes[requiredField];
        if (typeof avail === "number" && typeof req === "number") {
          derived[spec.field] = avail - req;
        } else {
          derived[spec.field] = "unknown";
        }
        break;
      }
      case "date_exceeds_schedule_horizon": {
        const dateField = String(spec.params.dateField || "travelDate");
        const horizonIso = String(spec.params.horizonIso || "2027-05-31");
        const dateVal = normalizedInput[dateField];
        if (typeof dateVal !== "string" || dateVal === "unknown") {
          derived[spec.field] = "unknown";
        } else {
          derived[spec.field] = dateVal > horizonIso;
        }
        break;
      }
    }
  }

  return derived;
}

function resolveOperandValue(
  operand: DecisionIrOperand,
  normalizedInput: Record<string, unknown>,
  derivedInput: Record<string, unknown>,
  candidate: DecisionIrCandidate,
  claimLookup: (claimVersionId: string) => MachineClaimVersion | undefined,
): unknown {
  switch (operand.ref) {
    case "literal":
      return operand.value;
    case "input": {
      const val = normalizedInput[operand.field];
      return val === undefined || val === null || val === "unknown"
        ? UNKNOWN_SENTINEL
        : val;
    }
    case "derived": {
      const val = derivedInput[operand.field];
      return val === undefined || val === null || val === "unknown"
        ? UNKNOWN_SENTINEL
        : val;
    }
    case "candidate": {
      const val = candidate.attributes[operand.field];
      return val === undefined || val === null || val === "unknown"
        ? UNKNOWN_SENTINEL
        : val;
    }
    case "claim": {
      const claimVer = claimLookup(operand.claimVersionId);
      if (!claimVer || claimVer.status === "withdrawn" || claimVer.status === "unknown") {
        return UNKNOWN_SENTINEL;
      }
      const rawVal = claimVer.typedValue.value;
      if (!operand.path) {
        return rawVal;
      }
      if (typeof rawVal === "object" && rawVal !== null) {
        const parts = operand.path.split(".");
        let cursor: unknown = rawVal;
        for (const p of parts) {
          if (cursor && typeof cursor === "object" && p in (cursor as Record<string, unknown>)) {
            cursor = (cursor as Record<string, unknown>)[p];
          } else {
            return UNKNOWN_SENTINEL;
          }
        }
        return cursor;
      }
      return UNKNOWN_SENTINEL;
    }
  }
}

export function evaluateIrExpression(
  expr: DecisionIrExpression,
  normalizedInput: Record<string, unknown>,
  derivedInput: Record<string, unknown>,
  candidate: DecisionIrCandidate,
  claimLookup: (claimVersionId: string) => MachineClaimVersion | undefined,
): EpistemicBool {
  const resolve = (op: DecisionIrOperand) =>
    resolveOperandValue(op, normalizedInput, derivedInput, candidate, claimLookup);

  switch (expr.op) {
    case "all": {
      let sawUnknown = false;
      for (const child of expr.args) {
        const r = evaluateIrExpression(child, normalizedInput, derivedInput, candidate, claimLookup);
        if (r === false) return false;
        if (r === "unknown") sawUnknown = true;
      }
      return sawUnknown ? "unknown" : true;
    }
    case "any": {
      let sawUnknown = false;
      for (const child of expr.args) {
        const r = evaluateIrExpression(child, normalizedInput, derivedInput, candidate, claimLookup);
        if (r === true) return true;
        if (r === "unknown") sawUnknown = true;
      }
      return sawUnknown ? "unknown" : false;
    }
    case "not": {
      const inner = evaluateIrExpression(
        expr.arg,
        normalizedInput,
        derivedInput,
        candidate,
        claimLookup,
      );
      if (inner === "unknown") return "unknown";
      return !inner;
    }
    case "is_known": {
      const val = resolve(expr.target);
      return val !== UNKNOWN_SENTINEL;
    }
    case "is_unknown": {
      const val = resolve(expr.target);
      return val === UNKNOWN_SENTINEL;
    }
    case "eq": {
      const l = resolve(expr.left);
      const r = resolve(expr.right);
      if (l === UNKNOWN_SENTINEL || r === UNKNOWN_SENTINEL) return "unknown";
      return l === r;
    }
    case "neq": {
      const l = resolve(expr.left);
      const r = resolve(expr.right);
      if (l === UNKNOWN_SENTINEL || r === UNKNOWN_SENTINEL) return "unknown";
      return l !== r;
    }
    case "in": {
      const item = resolve(expr.item);
      const set = resolve(expr.set);
      if (item === UNKNOWN_SENTINEL || set === UNKNOWN_SENTINEL) return "unknown";
      if (!Array.isArray(set)) return false;
      return set.includes(item as never);
    }
    case "not_in": {
      const item = resolve(expr.item);
      const set = resolve(expr.set);
      if (item === UNKNOWN_SENTINEL || set === UNKNOWN_SENTINEL) return "unknown";
      if (!Array.isArray(set)) return true;
      return !set.includes(item as never);
    }
    case "contains": {
      const coll = resolve(expr.collection);
      const item = resolve(expr.item);
      if (coll === UNKNOWN_SENTINEL || item === UNKNOWN_SENTINEL) return "unknown";
      if (!Array.isArray(coll)) return false;
      return coll.includes(item as never);
    }
    case "intersects": {
      const l = resolve(expr.left);
      const r = resolve(expr.right);
      if (l === UNKNOWN_SENTINEL || r === UNKNOWN_SENTINEL) return "unknown";
      if (!Array.isArray(l) || !Array.isArray(r)) return false;
      return l.some((item) => r.includes(item));
    }
    case "gt": {
      const l = resolve(expr.left);
      const r = resolve(expr.right);
      if (l === UNKNOWN_SENTINEL || r === UNKNOWN_SENTINEL) return "unknown";
      if (typeof l !== "number" || typeof r !== "number") return "unknown";
      return l > r;
    }
    case "gte": {
      const l = resolve(expr.left);
      const r = resolve(expr.right);
      if (l === UNKNOWN_SENTINEL || r === UNKNOWN_SENTINEL) return "unknown";
      if (typeof l !== "number" || typeof r !== "number") return "unknown";
      return l >= r;
    }
    case "lt": {
      const l = resolve(expr.left);
      const r = resolve(expr.right);
      if (l === UNKNOWN_SENTINEL || r === UNKNOWN_SENTINEL) return "unknown";
      if (typeof l !== "number" || typeof r !== "number") return "unknown";
      return l < r;
    }
    case "lte": {
      const l = resolve(expr.left);
      const r = resolve(expr.right);
      if (l === UNKNOWN_SENTINEL || r === UNKNOWN_SENTINEL) return "unknown";
      if (typeof l !== "number" || typeof r !== "number") return "unknown";
      return l <= r;
    }
    case "between": {
      const v = resolve(expr.value);
      const min = resolve(expr.min);
      const max = resolve(expr.max);
      if (v === UNKNOWN_SENTINEL || min === UNKNOWN_SENTINEL || max === UNKNOWN_SENTINEL) {
        return "unknown";
      }
      if (typeof v !== "number" || typeof min !== "number" || typeof max !== "number") {
        return "unknown";
      }
      return expr.inclusive === false ? v > min && v < max : v >= min && v <= max;
    }
    case "time_window_fits": {
      const avail = resolve(expr.availableMinutes);
      const req = resolve(expr.requiredMinutes);
      if (avail === UNKNOWN_SENTINEL || req === UNKNOWN_SENTINEL) return "unknown";
      if (typeof avail !== "number" || typeof req !== "number") return "unknown";
      return avail >= req;
    }
    case "month_in": {
      const m = resolve(expr.month);
      const allowed = resolve(expr.allowedMonths);
      if (m === UNKNOWN_SENTINEL || allowed === UNKNOWN_SENTINEL) return "unknown";
      if (typeof m !== "number" || !Array.isArray(allowed)) return "unknown";
      return allowed.includes(m);
    }
    case "date_within_range": {
      const d = resolve(expr.dateIso);
      const start = resolve(expr.startIso);
      const end = resolve(expr.endIso);
      if (d === UNKNOWN_SENTINEL || start === UNKNOWN_SENTINEL || end === UNKNOWN_SENTINEL) {
        return "unknown";
      }
      if (typeof d !== "string" || typeof start !== "string" || typeof end !== "string") {
        return "unknown";
      }
      return d >= start && d <= end;
    }
    case "geo_scope_matches": {
      const reqGeo = resolve(expr.requestedGeo);
      const candGeo = resolve(expr.candidateGeo);
      if (reqGeo === UNKNOWN_SENTINEL || candGeo === UNKNOWN_SENTINEL) return "unknown";
      if (reqGeo === "any") return true;
      return reqGeo === candGeo;
    }
    case "capacity_fits": {
      const reqSize = resolve(expr.requestedGroupSize);
      const maxCap = resolve(expr.maxCapacity);
      if (reqSize === UNKNOWN_SENTINEL || maxCap === UNKNOWN_SENTINEL) return "unknown";
      if (typeof reqSize !== "number" || typeof maxCap !== "number") return "unknown";
      return reqSize <= maxCap;
    }
  }
}

function projectClaimVersionAtKnownTime(
  cv: MachineClaimVersion,
  knownAt: string,
): MachineClaimVersion {
  let projected = cv;
  if (
    projected.status === "superseded" &&
    projected.known_to &&
    knownAt < projected.known_to
  ) {
    projected = {
      ...projected,
      status: "verified",
      supersededByVersionId: null,
      retractionId: null,
    };
  }
  if (
    projected.status === "withdrawn" &&
    projected.withdrawalInfo?.withdrawnAt &&
    knownAt < projected.withdrawalInfo.withdrawnAt
  ) {
    projected = {
      ...projected,
      status: "verified",
      retractionId: null,
      withdrawalInfo: null,
    };
  }
  return projected;
}

function mapStatusToDisposition(
  status: CandidateEvaluationSummary["status"],
  hasUnknownHardRuleOutcome: boolean,
): CandidateDisposition {
  switch (status) {
    case "recommended":
    case "contingency_fallback":
      return "eligible";
    case "viable_qualified_unknown_or_stale":
      return hasUnknownHardRuleOutcome ? "indeterminate" : "qualified";
    case "conflict_blocked":
      return "indeterminate";
    case "excluded":
      return "ineligible";
  }
}

export function evaluateDecisionIrBundle(params: {
  bundle: DecisionIrBundle;
  input: Record<string, unknown>;
  mode?: "compact" | "expanded";
  pinnedVersionRequested?: boolean;
  validAt?: string;
  knownAt?: string;
  overrides?: RuntimeEpistemicOverrides;
  bypassCache?: boolean;
}): CompactEvaluationResponse | ExpandedEvaluationResponse {
  const startTimePerfMs = performance.now();
  const mode = params.mode ?? "compact";
  const pinnedVersionRequested = params.pinnedVersionRequested ?? false;
  const bundle = params.bundle;
  const overrides = params.overrides;

  enforceBundleComplexityLimits({
    candidateCount: bundle.candidates.length,
    ruleCount: bundle.rules.length,
  });

  const evaluationRunId = `evalrun:${crypto.randomUUID()}`;
  const traceRunId = `tracerun:${crypto.randomUUID()}`;

  const {
    normalizedInput,
    unknownFields,
    validationIssues,
    containedSensitiveFields,
  } = normalizeAndValidateIrInputs(bundle, params.input);

  if (validationIssues.length > 0) {
    throw new Error(`Invalid input for engine '${bundle.engineId}': ${validationIssues.join(" ")}`);
  }

  const evaluatedAt =
    overrides?.nowIso ??
    params.knownAt ??
    overrides?.knownAt ??
    "2026-04-20T00:00:00.000Z";
  const validAt =
    params.validAt ??
    overrides?.validAt ??
    overrides?.nowIso ??
    "2026-04-20T00:00:00.000Z";
  const knownAt =
    params.knownAt ??
    overrides?.knownAt ??
    overrides?.nowIso ??
    "2026-04-20T00:00:00.000Z";
  const bitemporalExplicit = Boolean(
    params.validAt || params.knownAt || overrides?.validAt || overrides?.knownAt,
  );

  const normalizedInputHash = hashCanonicalJson(normalizedInput);

  // Index all known claim versions by parent claimId for bitemporal (validAt x knownAt) lookup
  const versionsByClaimId = new Map<string, MachineClaimVersion[]>();
  const registerVersionForClaim = (cv: MachineClaimVersion) => {
    const list = versionsByClaimId.get(cv.claimId) ?? [];
    const existingIdx = list.findIndex((existing) => existing.versionId === cv.versionId);
    if (existingIdx >= 0) {
      list[existingIdx] = cv;
    } else {
      list.push(cv);
    }
    list.sort((a, b) => a.versionNumber - b.versionNumber);
    versionsByClaimId.set(cv.claimId, list);
  };
  for (const cv of Object.values(bundle.embeddedClaims)) {
    registerVersionForClaim(cv);
  }
  if (overrides?.claimVersions) {
    for (const cv of overrides.claimVersions.values()) {
      registerVersionForClaim(cv);
    }
  }

  const claimLookup = (claimVersionId: string): MachineClaimVersion | undefined => {
    const rawCv =
      overrides?.claimVersions?.get(claimVersionId) ??
      bundle.embeddedClaims[claimVersionId];
    if (!rawCv) return undefined;

    const projectedRaw = projectClaimVersionAtKnownTime(rawCv, knownAt);

    if (!bitemporalExplicit) {
      return projectedRaw;
    }

    const allVersions = versionsByClaimId.get(rawCv.claimId) ?? [rawCv];
    // Filter to versions that DCC actually possessed at or before knownAt
    const knownVersions = allVersions
      .filter((v) => (v.known_from ?? v.retrieved_at) <= knownAt)
      .map((v) => projectClaimVersionAtKnownTime(v, knownAt));

    if (knownVersions.length === 0) {
      return undefined;
    }

    // Find versions that were active in DCC's knowledge at knownAt AND valid in the world at validAt
    const activeAndValidVersions = knownVersions.filter((v) => {
      const activeAtKnown = !v.known_to || knownAt < v.known_to;
      const validInWorld =
        v.valid_from <= validAt && (!v.valid_to || validAt <= v.valid_to);
      return activeAtKnown && validInWorld && v.status !== "superseded";
    });

    if (activeAndValidVersions.length > 0) {
      return activeAndValidVersions[activeAndValidVersions.length - 1];
    }

    // If rawCv was superseded by a non-retroactive future-dated version (v2.valid_from > validAt),
    // and validAt still falls within rawCv's world validity window, use rawCv as verified for validAt
    const rawValidInWorld =
      rawCv.valid_from <= validAt && (!rawCv.valid_to || validAt <= rawCv.valid_to);
    if (
      rawValidInWorld &&
      rawCv.status === "superseded" &&
      knownVersions.some((v) => v.versionNumber > rawCv.versionNumber && v.valid_from > validAt)
    ) {
      return {
        ...rawCv,
        status: "verified",
        supersededByVersionId: null,
        retractionId: null,
      };
    }

    return projectedRaw;
  };

  const activeConflictsMap = new Map<string, MachineClaimConflict>();
  for (const [cId, conf] of Object.entries(bundle.embeddedConflicts)) {
    if (!bitemporalExplicit || conf.detected_at <= knownAt) {
      activeConflictsMap.set(cId, conf);
    }
  }
  if (overrides?.conflicts) {
    for (const [cId, conf] of overrides.conflicts.entries()) {
      if (!bitemporalExplicit || conf.detected_at <= knownAt) {
        activeConflictsMap.set(cId, conf);
      }
    }
  }

  const candidateUniverseId =
    bundle.candidateUniverseId ??
    bundle.manifest.candidateUniverseId ??
    `univ:${bundle.engineId}`;
  const candidateUniverseVersion =
    bundle.candidateUniverseVersion ??
    bundle.manifest.candidateUniverseVersion ??
    bundle.version;
  const candidateUniverseHash =
    bundle.candidateUniverseHash ??
    bundle.manifest.candidateUniverseHash ??
    hashCanonicalJson({
      universeId: candidateUniverseId,
      version: candidateUniverseVersion,
      includedCandidateIds: bundle.candidates.map((c) => c.candidateId),
    });

  const epistemicStateSignature = hashCanonicalJson({
    validAt,
    knownAt,
    claims: Object.keys(bundle.embeddedClaims)
      .sort()
      .map((id) => {
        const cv = claimLookup(id);
        return [
          id,
          cv?.versionId ?? "missing",
          cv?.evidenceHash ?? "missing",
          cv?.status ?? "missing",
          cv?.supersededByVersionId ?? null,
          cv?.retractionId ?? null,
        ];
      }),
    conflicts: Array.from(activeConflictsMap.values())
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((c) => [c.id, c.status, c.resolutionPolicy]),
  });

  const evaluationFingerprint = hashCanonicalJson({
    engineId: bundle.engineId,
    engineVersion: bundle.version,
    bundleHash: bundle.bundleHash,
    candidateUniverseHash,
    normalizedInputHash,
    validAt,
    knownAt,
    epistemicStateSignature,
  });

  // Safe cache key: engine_version + evaluationFingerprint + mode
  const cacheKey = `${bundle.engineId}@${bundle.version}#${evaluationFingerprint}:${mode}`;
  if (!params.bypassCache && !containedSensitiveFields) {
    const cached = safeEvaluationCache.get(cacheKey);
    if (cached) {
      const elapsedCachedMs = performance.now() - startTimePerfMs;
      enforceExecutionTimeBudget(elapsedCachedMs, overrides?.maxExecutionTimeMs);
      if (cached.mode === "expanded") {
        return {
          ...cached,
          evaluationRunId,
          traceRunId,
          cacheHit: true,
          trace: {
            ...cached.trace,
            evaluationRunId,
            traceRunId,
          },
        };
      }
      return {
        ...cached,
        evaluationRunId,
        traceRunId,
        cacheHit: true,
      };
    }
  }

  const hardRules = bundle.rules.filter((r) => r.ruleKind === "hard_exclusion");
  const unknownGuardRules = bundle.rules.filter((r) => r.ruleKind === "unknown_or_stale_guard");
  const preferenceRules = bundle.rules.filter((r) => r.ruleKind === "preference_ranking");

  const commercialSummaries: CandidateEvaluationSummary[] = [];
  const contingencySummaries: CandidateEvaluationSummary[] = [];
  const candidateDispositions: CandidateUniverseDispositionRecord[] = [];
  const candidateTraces: MachineEvaluationTrace["candidateTraces"] = [];

  const allReferencedIds = new Set<string>([
    bundle.id,
    bundle.destinationEntityId,
    bundle.manifest.ruleSetId,
    candidateUniverseId,
  ]);
  const allImmutableUris = new Set<string>([
    bundle.immutableReferenceUri,
    `/r/${bundle.manifest.ruleSetId}/v/${bundle.version}`,
    `/r/${candidateUniverseId}/v/${candidateUniverseVersion}`,
  ]);
  const allResolvedClaimVersionIds = new Set<string>();
  const conflictsEncountered = new Set<string>();
  const withdrawnClaimsEncountered = new Set<string>();
  const staleClaimsEncountered = new Set<string>();

  let representativeDerivedInput: Record<string, unknown> = {};

  for (const candidate of bundle.candidates) {
    const derivedInput = computeDerivedInputsForCandidate(bundle, normalizedInput, candidate);
    if (Object.keys(representativeDerivedInput).length === 0) {
      representativeDerivedInput = derivedInput;
    }

    const ruleExecutions: RuleExecutionRecord[] = [];
    const failedHardRuleIds: string[] = [];
    const matchedPreferenceRuleIds: string[] = [];
    const reasonCodes = new Set<string>();
    const qualificationWarnings: string[] = [];
    const remediationHints: string[] = [];
    const supportingClaimVersionIds = new Set<string>();
    const candidateRefUris = new Set<string>([`/r/${candidate.entityId}/v/1.0.0`]);

    allReferencedIds.add(candidate.entityId);
    allReferencedIds.add(candidate.operatorEntityId);

    let hasWithdrawnDependency = false;
    let hasBlockingConflict = false;
    let hasStaleOrSupersededDependency = false;
    let candidateSawUnknownHardRule = false;

    const inspectClaimDependencies = (cvIds: string[]) => {
      for (const requestedCvId of cvIds) {
        const cv = claimLookup(requestedCvId);
        if (!cv) {
          supportingClaimVersionIds.add(requestedCvId);
          allResolvedClaimVersionIds.add(requestedCvId);
          hasWithdrawnDependency = true;
          withdrawnClaimsEncountered.add(requestedCvId);
          continue;
        }
        const resolvedCvId = cv.versionId;
        supportingClaimVersionIds.add(resolvedCvId);
        allResolvedClaimVersionIds.add(resolvedCvId);

        allReferencedIds.add(cv.claimId);
        allReferencedIds.add(cv.versionId);
        allReferencedIds.add(cv.sourceId);
        allReferencedIds.add(cv.sourceSnapshotId);
        allReferencedIds.add(cv.evidenceFragmentId);
        allImmutableUris.add(cv.immutableReferenceUri);
        candidateRefUris.add(cv.immutableReferenceUri);

        const isExpiredByTime = Boolean(
          validAt &&
            ((cv.valid_to && validAt > cv.valid_to) ||
              (bitemporalExplicit && cv.valid_from && validAt < cv.valid_from)),
        );

        if (cv.status === "withdrawn") {
          hasWithdrawnDependency = true;
          withdrawnClaimsEncountered.add(resolvedCvId);
          reasonCodes.add("EVIDENCE_WITHDRAWN");
          remediationHints.push(
            `Supporting claim ${cv.claimId} (${cv.versionId}) has been withdrawn and cannot support a positive recommendation.`,
          );
        } else if (cv.status === "stale" || cv.status === "superseded" || isExpiredByTime) {
          hasStaleOrSupersededDependency = true;
          staleClaimsEncountered.add(resolvedCvId);
          reasonCodes.add("EVIDENCE_STALE_OR_SUPERSEDED");
          qualificationWarnings.push(
            `Claim ${cv.claimId} (${cv.versionId}) is ${
              isExpiredByTime ? `outside validity window (${cv.valid_from}..${cv.valid_to})` : `marked ${cv.status}`
            }${
              cv.supersededByVersionId ? ` (superseded by ${cv.supersededByVersionId})` : ""
            }.`,
          );
        } else if (cv.status === "disputed") {
          hasBlockingConflict = true;
          reasonCodes.add("CONFLICTING_EVIDENCE_DETECTED");
        }

        for (const conflict of activeConflictsMap.values()) {
          if (
            conflict.status === "disputed" &&
            (conflict.claimId === cv.claimId ||
              conflict.claimVersionIds.includes(resolvedCvId) ||
              conflict.claimVersionIds.includes(requestedCvId))
          ) {
            conflictsEncountered.add(conflict.id);
            allReferencedIds.add(conflict.id);
            allImmutableUris.add(conflict.immutableReferenceUri);
            if (conflict.resolutionPolicy === "block_positive_recommendation") {
              hasBlockingConflict = true;
              reasonCodes.add("CONFLICTING_EVIDENCE_DETECTED");
              remediationHints.push(`Unresolved evidence conflict (${conflict.id}): ${conflict.summary}`);
            } else {
              qualificationWarnings.push(`Evidence dispute (${conflict.id}): ${conflict.summary}`);
              reasonCodes.add("EVIDENCE_DISPUTED_QUALIFIED");
            }
          }
        }
      }
    };

    // Inspect candidate's own claim dependencies first
    inspectClaimDependencies(candidate.claimVersionIds);

    if (candidate.candidateClass === "noncommercial_or_contingency") {
      const totalMins =
        typeof derivedInput.totalDoorToDoorMinutes === "number"
          ? derivedInput.totalDoorToDoorMinutes
          : typeof candidate.attributes.activityMinutes === "number"
            ? candidate.attributes.activityMinutes
            : null;
      const evidenceDeps = Array.from(supportingClaimVersionIds).sort();
      const summary: CandidateEvaluationSummary = {
        candidateId: candidate.candidateId,
        entityId: candidate.entityId,
        title: candidate.title,
        candidateClass: candidate.candidateClass,
        disposition: "eligible",
        status: "contingency_fallback",
        preferenceScore: 0,
        commercialWeightApplied: 0,
        totalDoorToDoorMinutes: totalMins,
        priceFromUsd:
          typeof candidate.attributes.priceFromUsd === "number"
            ? candidate.attributes.priceFromUsd
            : 0,
        reasonCodes: ["CONTINGENCY_OR_NONCOMMERCIAL_ALTERNATIVE"],
        failedHardRuleIds: [],
        matchedPreferenceRuleIds: [],
        qualificationWarnings,
        remediationHints: [],
        supportingClaimVersionIds: evidenceDeps,
        evidenceDependencies: evidenceDeps,
        referenceUris: Array.from(candidateRefUris).sort(),
        bookingHandoffs: candidate.bookingHandoffs,
      };
      contingencySummaries.push(summary);
      candidateDispositions.push({
        candidateId: candidate.candidateId,
        candidateClass: candidate.candidateClass,
        disposition: "eligible",
        status: "contingency_fallback",
        reasonCodes: summary.reasonCodes,
        evidenceDependencies: evidenceDeps,
      });
      candidateTraces.push({
        candidateId: candidate.candidateId,
        disposition: "eligible",
        status: "contingency_fallback",
        preferenceScore: 0,
        ruleExecutions: [],
      });
      continue;
    }

    // Evaluate hard exclusion rules
    for (const rule of hardRules) {
      allReferencedIds.add(rule.id);
      allImmutableUris.add(rule.immutableReferenceUri);
      candidateRefUris.add(rule.immutableReferenceUri);
      inspectClaimDependencies(rule.claimVersionDependencies);

      const exprOutcome = evaluateIrExpression(
        rule.when,
        normalizedInput,
        derivedInput,
        candidate,
        claimLookup,
      );

      let executionOutcome: RuleExecutionRecord["outcome"] = "passed";
      if (exprOutcome === true) {
        executionOutcome = "triggered";
        failedHardRuleIds.push(rule.id);
        reasonCodes.add(rule.reasonCode);
        remediationHints.push(rule.remediationHint);
      } else if (exprOutcome === "unknown") {
        executionOutcome = "unknown";
        candidateSawUnknownHardRule = true;
        if (rule.onUnknownResult === "exclude_as_unverified") {
          failedHardRuleIds.push(rule.id);
          reasonCodes.add(`${rule.reasonCode}_UNKNOWN_EXCLUDED`);
          remediationHints.push(rule.remediationHint);
        } else if (rule.onUnknownResult === "keep_and_qualify_unknown") {
          reasonCodes.add(`UNKNOWN_INPUT_FOR_${rule.reasonCode}`);
          qualificationWarnings.push(
            `Rule '${rule.title}' could not be conclusively verified because required input is unknown; confirm before booking.`,
          );
        }
      }

      const resolvedRuleCvIds = rule.claimVersionDependencies.map(
        (id) => claimLookup(id)?.versionId ?? id,
      );
      ruleExecutions.push({
        ruleId: rule.id,
        ruleVersion: rule.version,
        ruleKind: rule.ruleKind,
        reasonCode: rule.reasonCode,
        outcome: executionOutcome,
        scoreDelta: 0,
        claimVersionIds: resolvedRuleCvIds,
        immutableRuleReferenceUri: rule.immutableReferenceUri,
        immutableClaimReferenceUris: rule.claimVersionDependencies.map(
          (id) => claimLookup(id)?.immutableReferenceUri ?? `/r/${id}`,
        ),
        ...(executionOutcome === "triggered" || executionOutcome === "unknown"
          ? { remediationHint: rule.remediationHint }
          : {}),
      });
    }

    // Evaluate unknown/stale guard rules
    for (const rule of unknownGuardRules) {
      allReferencedIds.add(rule.id);
      allImmutableUris.add(rule.immutableReferenceUri);
      candidateRefUris.add(rule.immutableReferenceUri);
      inspectClaimDependencies(rule.claimVersionDependencies);

      const exprOutcome = evaluateIrExpression(
        rule.when,
        normalizedInput,
        derivedInput,
        candidate,
        claimLookup,
      );

      if (exprOutcome === true) {
        reasonCodes.add(rule.reasonCode);
        qualificationWarnings.push(rule.remediationHint);
      }

      const resolvedRuleCvIds = rule.claimVersionDependencies.map(
        (id) => claimLookup(id)?.versionId ?? id,
      );
      ruleExecutions.push({
        ruleId: rule.id,
        ruleVersion: rule.version,
        ruleKind: rule.ruleKind,
        reasonCode: rule.reasonCode,
        outcome: exprOutcome === true ? "triggered" : exprOutcome === "unknown" ? "unknown" : "not_triggered",
        scoreDelta: 0,
        claimVersionIds: resolvedRuleCvIds,
        immutableRuleReferenceUri: rule.immutableReferenceUri,
        immutableClaimReferenceUris: rule.claimVersionDependencies.map(
          (id) => claimLookup(id)?.immutableReferenceUri ?? `/r/${id}`,
        ),
      });
    }

    // Evaluate preference ranking rules only if not excluded by hard rules or withdrawn evidence
    let preferenceScore = 0;
    const isExcluded = failedHardRuleIds.length > 0 || hasWithdrawnDependency;

    if (!isExcluded) {
      for (const rule of preferenceRules) {
        allReferencedIds.add(rule.id);
        allImmutableUris.add(rule.immutableReferenceUri);
        candidateRefUris.add(rule.immutableReferenceUri);
        inspectClaimDependencies(rule.claimVersionDependencies);

        const exprOutcome = evaluateIrExpression(
          rule.when,
          normalizedInput,
          derivedInput,
          candidate,
          claimLookup,
        );

        let delta = 0;
        if (exprOutcome === true) {
          delta = rule.severityOrWeight;
          preferenceScore += delta;
          matchedPreferenceRuleIds.push(rule.id);
          reasonCodes.add(rule.reasonCode);
        }

        const resolvedRuleCvIds = rule.claimVersionDependencies.map(
          (id) => claimLookup(id)?.versionId ?? id,
        );
        ruleExecutions.push({
          ruleId: rule.id,
          ruleVersion: rule.version,
          ruleKind: rule.ruleKind,
          reasonCode: rule.reasonCode,
          outcome:
            exprOutcome === true
              ? "triggered"
              : exprOutcome === "unknown"
                ? "unknown"
                : "not_triggered",
          scoreDelta: delta,
          claimVersionIds: resolvedRuleCvIds,
          immutableRuleReferenceUri: rule.immutableReferenceUri,
          immutableClaimReferenceUris: rule.claimVersionDependencies.map(
            (id) => claimLookup(id)?.immutableReferenceUri ?? `/r/${id}`,
          ),
        });
      }
    }

    let candidateStatus: CandidateEvaluationSummary["status"];
    if (hasWithdrawnDependency || failedHardRuleIds.length > 0) {
      candidateStatus = "excluded";
      if (hasWithdrawnDependency && !failedHardRuleIds.includes("SYSTEM_EVIDENCE_WITHDRAWN")) {
        failedHardRuleIds.push("SYSTEM_EVIDENCE_WITHDRAWN");
      }
    } else if (hasBlockingConflict) {
      candidateStatus = "conflict_blocked";
    } else if (
      hasStaleOrSupersededDependency ||
      qualificationWarnings.length > 0 ||
      unknownFields.length > 0
    ) {
      candidateStatus = "viable_qualified_unknown_or_stale";
    } else {
      candidateStatus = "recommended";
    }

    const disposition = mapStatusToDisposition(
      candidateStatus,
      candidateSawUnknownHardRule,
    );

    const totalDoorToDoorMinutes =
      typeof derivedInput.totalDoorToDoorMinutes === "number"
        ? derivedInput.totalDoorToDoorMinutes
        : typeof candidate.attributes.activityMinutes === "number"
          ? candidate.attributes.activityMinutes
          : null;

    const priceFromUsd =
      typeof candidate.attributes.priceFromUsd === "number"
        ? candidate.attributes.priceFromUsd
        : null;

    const evidenceDeps = Array.from(supportingClaimVersionIds).sort();
    const sortedReasonCodes = Array.from(reasonCodes).sort();

    const summary: CandidateEvaluationSummary = {
      candidateId: candidate.candidateId,
      entityId: candidate.entityId,
      title: candidate.title,
      candidateClass: candidate.candidateClass,
      disposition,
      status: candidateStatus,
      preferenceScore,
      commercialWeightApplied: 0,
      totalDoorToDoorMinutes,
      priceFromUsd,
      reasonCodes: sortedReasonCodes,
      failedHardRuleIds,
      matchedPreferenceRuleIds,
      qualificationWarnings,
      remediationHints,
      supportingClaimVersionIds: evidenceDeps,
      evidenceDependencies: evidenceDeps,
      referenceUris: Array.from(candidateRefUris).sort(),
      bookingHandoffs: candidate.bookingHandoffs,
    };

    commercialSummaries.push(summary);
    candidateDispositions.push({
      candidateId: candidate.candidateId,
      candidateClass: candidate.candidateClass,
      disposition,
      status: candidateStatus,
      reasonCodes: sortedReasonCodes,
      evidenceDependencies: evidenceDeps,
    });
    candidateTraces.push({
      candidateId: candidate.candidateId,
      disposition,
      status: candidateStatus,
      preferenceScore,
      ruleExecutions,
    });
  }

  // Partition commercial candidates into viable vs excluded/conflict-blocked
  const viableCandidates = commercialSummaries.filter(
    (c) => c.status === "recommended" || c.status === "viable_qualified_unknown_or_stale",
  );
  const excludedCandidates = commercialSummaries.filter(
    (c) => c.status === "excluded" || c.status === "conflict_blocked",
  );

  // Deterministic tie-breaking sort on viableCandidates
  viableCandidates.sort((a, b) => {
    for (const tb of bundle.tieBreakers) {
      let av: number | string = 0;
      let bv: number | string = 0;
      if (tb.field === "preferenceScore") {
        av = a.preferenceScore;
        bv = b.preferenceScore;
      } else if (tb.field === "totalDoorToDoorMinutes") {
        av = a.totalDoorToDoorMinutes ?? Number.MAX_SAFE_INTEGER;
        bv = b.totalDoorToDoorMinutes ?? Number.MAX_SAFE_INTEGER;
      } else if (tb.field === "priceFromUsd") {
        av = a.priceFromUsd ?? Number.MAX_SAFE_INTEGER;
        bv = b.priceFromUsd ?? Number.MAX_SAFE_INTEGER;
      } else {
        av = a.candidateId;
        bv = b.candidateId;
      }
      if (av !== bv) {
        const cmp = av < bv ? -1 : 1;
        return tb.direction === "desc" ? -cmp : cmp;
      }
    }
    return a.candidateId.localeCompare(b.candidateId);
  });

  const bestCandidate = viableCandidates[0] ?? null;

  const hasUnknownHardRule =
    unknownFields.length > 0 &&
    candidateTraces.some((ct) =>
      ct.ruleExecutions.some((re) => re.ruleKind === "hard_exclusion" && re.outcome === "unknown"),
    );

  let decisionState: CompactEvaluationResponse["decisionState"];
  if (
    viableCandidates.length === 0 &&
    commercialSummaries.some((c) => c.status === "conflict_blocked")
  ) {
    decisionState = "conflict_blocked";
  } else if (viableCandidates.length === 0) {
    decisionState = "no_viable_candidates";
  } else if (hasUnknownHardRule) {
    decisionState = "unknown_insufficient_inputs";
  } else if (
    bestCandidate.status === "viable_qualified_unknown_or_stale" ||
    unknownFields.length > 0 ||
    staleClaimsEncountered.size > 0 ||
    conflictsEncountered.size > 0
  ) {
    decisionState = "qualified_with_warnings";
  } else {
    decisionState = "recommended";
  }

  const topReasonCodes = new Set<string>();
  if (bestCandidate) {
    for (const rc of bestCandidate.reasonCodes) topReasonCodes.add(rc);
  } else {
    topReasonCodes.add("NO_VIABLE_COMMERCIAL_CANDIDATES");
    for (const ex of excludedCandidates) {
      for (const rc of ex.reasonCodes) topReasonCodes.add(rc);
    }
  }
  if (unknownFields.length > 0) {
    topReasonCodes.add("PARTIAL_OR_UNKNOWN_INPUTS_QUALIFIED");
  }
  if (conflictsEncountered.size > 0) {
    topReasonCodes.add("CONFLICTING_EVIDENCE_DETECTED");
  }
  if (withdrawnClaimsEncountered.size > 0) {
    topReasonCodes.add("EVIDENCE_WITHDRAWN");
  }

  // Deterministic result hash & trace hash
  const resultHashPayload = {
    engineId: bundle.engineId,
    engineVersion: bundle.version,
    bundleHash: bundle.bundleHash,
    candidateUniverseHash,
    normalizedInputHash,
    validAt,
    knownAt,
    decisionState,
    recommendedCandidateId: bestCandidate?.candidateId ?? null,
    viableCandidateIds: viableCandidates.map((c) => ({
      id: c.candidateId,
      disposition: c.disposition,
      status: c.status,
      score: c.preferenceScore,
    })),
    excludedCandidateIds: excludedCandidates.map((c) => ({
      id: c.candidateId,
      disposition: c.disposition,
      status: c.status,
      failedRules: c.failedHardRuleIds,
    })),
    unknownFields,
    conflictIds: Array.from(conflictsEncountered).sort(),
    withdrawnClaimVersionIds: Array.from(withdrawnClaimsEncountered).sort(),
    reasonCodes: Array.from(topReasonCodes).sort(),
  };
  const resultHash = hashCanonicalJson(resultHashPayload);

  const traceCorePayload = {
    engineId: bundle.engineId,
    engineVersion: bundle.version,
    bundleHash: bundle.bundleHash,
    candidateUniverseHash,
    validAt,
    knownAt,
    normalizedInput,
    derivedInput: representativeDerivedInput,
    unknownFields,
    conflictsEncountered: Array.from(conflictsEncountered).sort(),
    withdrawnClaimsEncountered: Array.from(withdrawnClaimsEncountered).sort(),
    staleClaimsEncountered: Array.from(staleClaimsEncountered).sort(),
    candidateTraces,
    resolvedClaimVersionIds: Array.from(allResolvedClaimVersionIds).sort(),
  };
  const traceHash = hashCanonicalJson(traceCorePayload);

  const evaluationId = `eval:${bundle.engineId}:${bundle.version}:${resultHash.slice(0, 16)}`;
  const traceId = `trace:${bundle.engineId}:${bundle.version}:${traceHash.slice(0, 16)}`;

  const epistemicScopeDisclaimer = `Evaluates only declared CandidateUniverse '${candidateUniverseId}@${candidateUniverseVersion}' (hash ${candidateUniverseHash.slice(0, 16)}). Does not claim that no other options exist in the world outside this declared universe.`;

  const signedReceipt = signDecisionReceipt({
    evaluationFingerprint,
    engineId: bundle.engineId,
    engineVersion: bundle.version,
    bundleHash: bundle.bundleHash,
    candidateUniverseId,
    candidateUniverseVersion,
    candidateUniverseHash,
    normalizedInputHash,
    validAt,
    knownAt,
    decisionState,
    recommendedCandidateId: bestCandidate?.candidateId ?? null,
    candidateDispositionSummary: candidateDispositions.map((cd) => ({
      candidateId: cd.candidateId,
      disposition: cd.disposition,
      reasonCodes: cd.reasonCodes,
      evidenceDependencies: cd.evidenceDependencies,
    })),
    resolvedClaimVersionIds: Array.from(allResolvedClaimVersionIds).sort(),
    resultHash,
    traceHash,
    issuedAt: evaluatedAt,
  });

  const receiptSchemaCheck = validateAgainstJsonSchema(
    signedReceipt,
    SIGNED_RECEIPT_JSON_SCHEMA,
  );
  if (!receiptSchemaCheck.valid) {
    throw new Error(
      `SignedDecisionReceipt schema error: ${receiptSchemaCheck.errors.join("; ")}`,
    );
  }

  allReferencedIds.add(evaluationId);
  allReferencedIds.add(traceId);
  allReferencedIds.add(signedReceipt.receiptId);
  allImmutableUris.add(`/r/${evaluationId}/v/1.0.0`);
  allImmutableUris.add(`/r/${traceId}/v/1.0.0`);
  allImmutableUris.add(signedReceipt.immutableReferenceUri);

  const compactResponse: CompactEvaluationResponse = {
    ok: true,
    mode: "compact",
    evaluationId,
    evaluationRunId,
    evaluationFingerprint,
    traceId,
    traceRunId,
    receiptId: signedReceipt.receiptId,
    engineId: bundle.engineId,
    engineVersion: bundle.version,
    pinnedVersionRequested,
    bundleHash: bundle.bundleHash,
    candidateUniverseId,
    candidateUniverseVersion,
    candidateUniverseHash,
    normalizedInputHash,
    resultHash,
    traceHash,
    validAt,
    knownAt,
    cacheHit: false,
    decisionState,
    epistemicScopeDisclaimer,
    recommendedCandidateId: bestCandidate?.candidateId ?? null,
    recommendedCandidate: bestCandidate,
    viableCandidates,
    excludedCandidates,
    contingencyCandidates: contingencySummaries,
    candidateDispositions,
    unknownFields,
    conflictIds: Array.from(conflictsEncountered).sort(),
    withdrawnClaimVersionIds: Array.from(withdrawnClaimsEncountered).sort(),
    reasonCodes: Array.from(topReasonCodes).sort(),
    referenceIds: Array.from(allReferencedIds).sort(),
    immutableReferenceUris: Array.from(allImmutableUris).sort(),
    receipt: signedReceipt,
    evaluatedAt,
  };

  if (mode === "compact") {
    const schemaCheck = validateAgainstJsonSchema(compactResponse, COMPACT_EVALUATION_JSON_SCHEMA);
    if (!schemaCheck.valid) {
      throw new Error(`Compact evaluation schema error: ${schemaCheck.errors.join("; ")}`);
    }
    const elapsedMs = performance.now() - startTimePerfMs;
    enforceExecutionTimeBudget(elapsedMs, overrides?.maxExecutionTimeMs);

    if (!containedSensitiveFields) {
      if (safeEvaluationCache.size >= MAX_CACHE_ENTRIES) {
        const firstKey = safeEvaluationCache.keys().next().value;
        if (firstKey) safeEvaluationCache.delete(firstKey);
      }
      safeEvaluationCache.set(cacheKey, compactResponse);
    }
    return compactResponse;
  }

  // Expanded mode: assemble complete provenanceGraph
  const trace: MachineEvaluationTrace = {
    objectType: "EvaluationTrace",
    id: traceId,
    traceRunId,
    evaluationId,
    evaluationRunId,
    evaluationFingerprint,
    engineId: bundle.engineId,
    engineVersion: bundle.version,
    bundleHash: bundle.bundleHash,
    candidateUniverseId,
    candidateUniverseVersion,
    candidateUniverseHash,
    validAt,
    knownAt,
    normalizedInput,
    derivedInput: representativeDerivedInput,
    unknownFields,
    conflictsEncountered: Array.from(conflictsEncountered).sort(),
    withdrawnClaimsEncountered: Array.from(withdrawnClaimsEncountered).sort(),
    staleClaimsEncountered: Array.from(staleClaimsEncountered).sort(),
    candidateTraces,
    resolvedClaimVersionIds: Array.from(allResolvedClaimVersionIds).sort(),
    traceHash,
    stableReferenceUri: `/r/${traceId}`,
    immutableReferenceUri: `/r/${traceId}/v/1.0.0`,
  };

  const rulesRecord: Record<string, DecisionIrRule> = {};
  for (const r of bundle.rules) {
    rulesRecord[r.id] = r;
  }

  const claimVersionsRecord: Record<string, MachineClaimVersion> = {};
  const evidenceFragmentsRecord: Record<string, MachineEvidenceFragment> = {};
  const sourceSnapshotsRecord: Record<string, MachineSourceSnapshot> = {};
  const sourcesRecord: Record<string, MachineSource> = {};
  const entitiesRecord: Record<string, MachineEntity> = {};
  const conflictsRecord: Record<string, MachineClaimConflict> = {};
  const retractionsRecord: Record<string, MachineRetraction> = {};

  if (overrides?.entities) {
    for (const [eId, ent] of overrides.entities.entries()) {
      if (allReferencedIds.has(eId)) {
        entitiesRecord[eId] = ent;
      }
    }
  }

  for (const cvId of allResolvedClaimVersionIds) {
    const cv = claimLookup(cvId);
    if (!cv) continue;
    claimVersionsRecord[cv.versionId] = cv;
    const frag = overrides?.evidenceFragments?.get(cv.evidenceFragmentId);
    if (frag) evidenceFragmentsRecord[frag.id] = frag;
    const snap = overrides?.sourceSnapshots?.get(cv.sourceSnapshotId);
    if (snap) sourceSnapshotsRecord[snap.id] = snap;
    const src = overrides?.sources?.get(cv.sourceId);
    if (src) sourcesRecord[src.id] = src;
    if (cv.retractionId && overrides?.retractions?.has(cv.retractionId)) {
      retractionsRecord[cv.retractionId] = overrides.retractions.get(cv.retractionId)!;
    }
  }

  for (const confId of conflictsEncountered) {
    const conf = activeConflictsMap.get(confId);
    if (conf) conflictsRecord[confId] = conf;
  }

  const expandedResponse: ExpandedEvaluationResponse = {
    ...compactResponse,
    mode: "expanded",
    trace,
    provenanceGraph: {
      entities: entitiesRecord,
      rules: rulesRecord,
      claimVersions: claimVersionsRecord,
      evidenceFragments: evidenceFragmentsRecord,
      sourceSnapshots: sourceSnapshotsRecord,
      sources: sourcesRecord,
      conflicts: conflictsRecord,
      retractions: retractionsRecord,
    },
  };

  const expandedSchemaCheck = validateAgainstJsonSchema(
    expandedResponse,
    EXPANDED_EVALUATION_JSON_SCHEMA,
  );
  if (!expandedSchemaCheck.valid) {
    throw new Error(`Expanded evaluation schema error: ${expandedSchemaCheck.errors.join("; ")}`);
  }

  const elapsedMs = performance.now() - startTimePerfMs;
  enforceExecutionTimeBudget(elapsedMs, overrides?.maxExecutionTimeMs);

  if (!containedSensitiveFields) {
    if (safeEvaluationCache.size >= MAX_CACHE_ENTRIES) {
      const firstKey = safeEvaluationCache.keys().next().value;
      if (firstKey) safeEvaluationCache.delete(firstKey);
    }
    safeEvaluationCache.set(cacheKey, expandedResponse);
  }

  return expandedResponse;
}

export function evaluateDecisionIrBundleBatch(params: {
  items: Array<{
    requestId?: string;
    bundle: DecisionIrBundle;
    input: Record<string, unknown>;
    mode?: "compact" | "expanded";
    pinnedVersionRequested?: boolean;
    validAt?: string;
    knownAt?: string;
  }>;
  overrides?: RuntimeEpistemicOverrides;
}): {
  ok: true;
  batchSize: number;
  results: Array<{
    requestId: string;
    evaluation: CompactEvaluationResponse | ExpandedEvaluationResponse;
  }>;
} {
  const results = params.items.map((item, idx) => ({
    requestId: item.requestId ?? `batch_item_${idx}`,
    evaluation: evaluateDecisionIrBundle({
      bundle: item.bundle,
      input: item.input,
      mode: item.mode ?? "compact",
      pinnedVersionRequested: item.pinnedVersionRequested ?? false,
      validAt: item.validAt,
      knownAt: item.knownAt,
      overrides: params.overrides,
    }),
  }));

  return {
    ok: true,
    batchSize: results.length,
    results,
  };
}
