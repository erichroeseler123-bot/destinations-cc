import crypto from "node:crypto";
import { rfc8785Canonicalize, sha256HexFull } from "../machine/v03/rfc8785AndJws";
import {
  applyStewardVehicleEvidencePatch,
  compileApplicableDecisionContext,
  resetStewardVehicleEvidencePatchesForTests,
  type CompiledApplicableDecisionOutcome,
  type CorridorId,
  type StewardVehicleEvidencePatch,
  type TripApplicabilityRequest,
} from "../applicability";
import {
  readDurableLedgerState,
  resetDurableLedgerStateForTests,
  runDurableLedgerTransaction,
} from "../storage/durableTransactionalStore";

// 1. Core Types & Status Enums
export type SubmitterTrustLevel =
  | "anonymous_user"
  | "authenticated_traveler"
  | "verified_operator"
  | "internal_auditor";

export type CaseStatus =
  | "quarantined"
  | "under_review"
  | "escalated_legal"
  | "resolved"
  | "dismissed";

export type RiskSeverity =
  | "nonblocking_factual"
  | "pricing_schedule_conflict"
  | "blocking_safety_legal"
  | "identity_corruption";

export type AuditOutcomeCode =
  | "evidence_confirmed"
  | "evidence_contradicted"
  | "evidence_inconclusive"
  | "evidence_stale"
  | "unverifiable";

export type StewardPermission =
  | "workbench:read"
  | "document:scan"
  | "case:assign"
  | "case:safeguard"
  | "case:resolve";

// 2. The Untrusted External Submission
// This is what the operator or user submits. It is quarantined by default.
export interface OperatorDisputeSubmission {
  disputeId: string;
  targetClaimId: string; // The specific fact being disputed (not the whole route)
  submitter: {
    identityId: string;
    trustLevel: SubmitterTrustLevel;
    declaredAffiliation: string | null;
  };
  submittedEvidence: {
    description: string;
    sourceUrls: string[];
    // Documents must be tracked with security states
    uploadedDocuments: {
      documentId: string;
      malwareScanStatus: "pending" | "clean" | "flagged";
      provenance: "operator_supplied";
    }[];
  };
  submittedAt: string; // ISO Timestamp
}

// 3. The Internal Audit Case
// This is the private workbench for the Evidence Steward.
export interface StewardReviewCase {
  caseId: string;
  disputeReferenceId: string;
  affectedMarketId: string; // e.g., "corridor:denver-vail"
  status: CaseStatus;
  severity: RiskSeverity;

  // Safeguards for conflicts of interest (e.g., GoSno ownership)
  assignedStewardId: string;
  requiredRecusalFirms: string[];

  // Emergency circuit breaker triggered by the steward before final resolution
  temporarySafeguardActive: boolean;
  safeguardExpiry: string | null;

  openedAt: string;
  resolvedAt: string | null;
}

// 4. The Audit Decision & Evidence Mutation
// The final ruling that mutates the evidence snapshot.
export interface AuditDecisionRecord {
  decisionId: string;
  caseId: string;
  stewardId: string;
  outcomeCode: AuditOutcomeCode;

  // Private justification never exposed to the public or the operator
  privateInternalRationale: string;

  // The mutation applied to the database (e.g., updating a permit expiration date)
  resultingEvidenceSnapshotId: string | null;
  reEvaluationRequired: boolean; // Triggers the machine to recalculate the corridor

  decisionTimestamp: string;
}

// 5. The Public Ledger (Material Change Timeline)
// Filtered, neutrally-worded projections strictly for public display.
export interface PublicMaterialChangeEntry {
  entryId: string;
  corridorId: string;
  operatorId: string;

  // Highly controlled, neutral vocabulary (e.g., "Operating-authority evidence was updated.")
  publicSummaryTemplateCode: string;
  renderedPublicSummary: string;

  // Proves human oversight without exposing liability
  auditedByRole: "DCC Evidence Steward" | "DCC Compliance Team";
  auditTimestamp: string; // "Verified on Nov 2, 2026"

  resolvedClaimId: string;
}

export type ClaimFactCategory =
  | "operating_authority"
  | "cargo_capacity"
  | "vehicle_equipment"
  | "pricing_schedule"
  | "safety_restriction";

export interface RegisteredClaimFact {
  claimId: string;
  corridorId: CorridorId;
  affectedMarketId: string;
  operatorId: string;
  vehicleClassId: string;
  category: ClaimFactCategory;
  defaultSeverity: RiskSeverity;
  claimStatement: string;
}

export interface StewardProfile {
  stewardId: string;
  displayName: string;
  role: "DCC Evidence Steward" | "DCC Compliance Team";
  affiliatedFirms: string[];
  permissions: readonly StewardPermission[];
  isSystemQueue?: boolean;
}

export const REGISTERED_CLAIM_FACTS: Record<string, RegisteredClaimFact> = {
  "claim:gosno:vail-private-van:operating-authority": {
    claimId: "claim:gosno:vail-private-van:operating-authority",
    corridorId: "corridor:denver-vail-i70",
    affectedMarketId: "corridor:denver-vail",
    operatorId: "gosno",
    vehicleClassId: "veh:private-transit-van-10",
    category: "operating_authority",
    defaultSeverity: "blocking_safety_legal",
    claimStatement:
      "GoSno up-to-10-passenger private vans maintain active Colorado PUC luxury limousine/charter authority and commercial Code 18 chain equipment on I-70.",
  },
  "claim:gosno:vail-private-van:cargo-capacity": {
    claimId: "claim:gosno:vail-private-van:cargo-capacity",
    corridorId: "corridor:denver-vail-i70",
    affectedMarketId: "corridor:denver-vail",
    operatorId: "gosno",
    vehicleClassId: "veh:private-transit-van-10",
    category: "cargo_capacity",
    defaultSeverity: "nonblocking_factual",
    claimStatement:
      "GoSno private passenger van holds up to 10 passengers, subject to luggage and ski-gear fit (up to 10 standard bags and 10 full-length ski bags inside).",
  },
  "claim:gosno:vail-private-suv:cargo-capacity": {
    claimId: "claim:gosno:vail-private-suv:cargo-capacity",
    corridorId: "corridor:denver-vail-i70",
    affectedMarketId: "corridor:denver-vail",
    operatorId: "gosno",
    vehicleClassId: "veh:awd-full-size-suv",
    category: "cargo_capacity",
    defaultSeverity: "nonblocking_factual",
    claimStatement:
      "Standard 3-row AWD full-size SUV holds up to 4 standard bags behind a raised third row (5–6 passengers) and 0 full-length ski bags inside without a confirmed rooftop box.",
  },
  "claim:epic-mountain-express:vail:baggage-allowance": {
    claimId: "claim:epic-mountain-express:vail:baggage-allowance",
    corridorId: "corridor:denver-vail-i70",
    affectedMarketId: "corridor:denver-vail",
    operatorId: "epic-mountain-express",
    vehicleClassId: "veh:shared-mountain-shuttle",
    category: "pricing_schedule",
    defaultSeverity: "pricing_schedule_conflict",
    claimStatement:
      "Epic Mountain Express shared shuttle includes 2 baggage items per passenger (including ski/snowboard bags) plus $10 per extra item.",
  },
  "claim:coastal-helicopters:juneau:weight-balance-tier": {
    claimId: "claim:coastal-helicopters:juneau:weight-balance-tier",
    corridorId: "corridor:juneau-port-icefield",
    affectedMarketId: "corridor:juneau-mendenhall",
    operatorId: "coastal-helicopters",
    vehicleClassId: "veh:heli-astar-as350",
    category: "safety_restriction",
    defaultSeverity: "blocking_safety_legal",
    claimStatement:
      "FAA Part 135 rotorcraft weight-balance rule requires a comfort-seat surcharge at 260+ lbs and prohibits carry-on bags aboard the helicopter.",
  },
  "claim:airboat-adventures:barataria:min-age-5": {
    claimId: "claim:airboat-adventures:barataria:min-age-5",
    corridorId: "corridor:new-orleans-barataria-swamp",
    affectedMarketId: "corridor:new-orleans-swamp",
    operatorId: "airboat-adventures",
    vehicleClassId: "veh:small-open-airboat",
    category: "safety_restriction",
    defaultSeverity: "blocking_safety_legal",
    claimStatement:
      "High-speed open airboats enforce a minimum passenger age of 5 years old and prohibit expectant mothers or riders with neck/back conditions.",
  },
};

export const REGISTERED_STEWARDS: Record<string, StewardProfile> = {
  "steward:unassigned-quarantine-queue": {
    stewardId: "steward:unassigned-quarantine-queue",
    displayName: "Quarantine Intake Queue",
    role: "DCC Evidence Steward",
    affiliatedFirms: [],
    permissions: [],
    isSystemQueue: true,
  },
  "steward:independent-compliance-01": {
    stewardId: "steward:independent-compliance-01",
    displayName: "Independent Evidence Steward #01",
    role: "DCC Evidence Steward",
    affiliatedFirms: ["independent-audit-board"],
    permissions: [
      "workbench:read",
      "document:scan",
      "case:assign",
      "case:safeguard",
      "case:resolve",
    ],
  },
  "steward:compliance-legal-02": {
    stewardId: "steward:compliance-legal-02",
    displayName: "DCC Compliance & Legal Team #02",
    role: "DCC Compliance Team",
    affiliatedFirms: ["independent-legal-panel"],
    permissions: [
      "workbench:read",
      "document:scan",
      "case:assign",
      "case:safeguard",
      "case:resolve",
    ],
  },
  "steward:document-scanner-bot": {
    stewardId: "steward:document-scanner-bot",
    displayName: "Quarantine Document Malware Scanner",
    role: "DCC Compliance Team",
    affiliatedFirms: [],
    permissions: ["document:scan"],
  },
  "steward:auditor-readonly-01": {
    stewardId: "steward:auditor-readonly-01",
    displayName: "Internal Read-Only Compliance Auditor",
    role: "DCC Compliance Team",
    affiliatedFirms: [],
    permissions: ["workbench:read"],
  },
  "steward:gosno-ops-conflict": {
    stewardId: "steward:gosno-ops-conflict",
    displayName: "GoSno-Affiliated Operations Analyst",
    role: "DCC Evidence Steward",
    affiliatedFirms: ["gosno", "dcc-colorado-fleet"],
    permissions: [
      "workbench:read",
      "case:assign",
      "case:safeguard",
      "case:resolve",
    ],
  },
  "steward:parr-ops-conflict": {
    stewardId: "steward:parr-ops-conflict",
    displayName: "Party at Red Rocks Affiliated Analyst",
    role: "DCC Evidence Steward",
    affiliatedFirms: ["parr", "rrdd"],
    permissions: [
      "workbench:read",
      "case:assign",
      "case:safeguard",
      "case:resolve",
    ],
  },
};

const MARKET_RECUSAL_FIRMS: Record<string, readonly string[]> = {
  "corridor:denver-vail": ["gosno", "bigsky-gosno"],
  "corridor:denver-vail-i70": ["gosno", "bigsky-gosno"],
  "corridor:denver-breckenridge-i70": ["gosno", "bigsky-gosno"],
  "corridor:denver-red-rocks": ["parr", "rrdd", "rrfp"],
  "corridor:juneau-mendenhall": ["lfse", "jfd"],
  "corridor:juneau-port-icefield": ["lfse", "jfd"],
  "corridor:new-orleans-swamp": ["swamp", "wtonot", "fqo"],
  "corridor:new-orleans-barataria-swamp": ["swamp", "wtonot", "fqo"],
};

export const PUBLIC_SUMMARY_TEMPLATES: Record<
  string,
  { code: string; text: string }
> = {
  "operating_authority:evidence_confirmed": {
    code: "OPERATING_AUTHORITY_CONFIRMED",
    text: "Operating-authority evidence was re-verified against primary regulatory records with no material change.",
  },
  "operating_authority:evidence_contradicted": {
    code: "OPERATING_AUTHORITY_UPDATED",
    text: "Operating-authority evidence was updated and the corridor model was re-evaluated.",
  },
  "operating_authority:evidence_inconclusive": {
    code: "OPERATING_AUTHORITY_INCONCLUSIVE",
    text: "Operating-authority evidence was reviewed and marked inconclusive.",
  },
  "operating_authority:evidence_stale": {
    code: "OPERATING_AUTHORITY_STALE",
    text: "Operating-authority evidence reached its verification window and was flagged for refresh.",
  },
  "operating_authority:unverifiable": {
    code: "OPERATING_AUTHORITY_UNVERIFIABLE",
    text: "Submitted operating-authority documentation could not be verified against primary public registries.",
  },
  "cargo_capacity:evidence_confirmed": {
    code: "CARGO_CAPACITY_CONFIRMED",
    text: "Vehicle cargo-capacity specifications were re-verified with no material change.",
  },
  "cargo_capacity:evidence_contradicted": {
    code: "CARGO_CAPACITY_UPDATED",
    text: "Vehicle cargo-capacity evidence was updated and the corridor model was re-evaluated.",
  },
  "cargo_capacity:evidence_inconclusive": {
    code: "CARGO_CAPACITY_INCONCLUSIVE",
    text: "Vehicle cargo-capacity evidence was reviewed and marked inconclusive.",
  },
  "pricing_schedule:evidence_contradicted": {
    code: "PRICING_SCHEDULE_UPDATED",
    text: "Published fare and schedule evidence was updated.",
  },
  "pricing_schedule:evidence_confirmed": {
    code: "PRICING_SCHEDULE_CONFIRMED",
    text: "Published fare and schedule evidence was re-verified with no material change.",
  },
  "safety_restriction:evidence_confirmed": {
    code: "SAFETY_RESTRICTION_CONFIRMED",
    text: "Passenger safety and eligibility restrictions were re-verified against primary operator rules.",
  },
  "safety_restriction:evidence_contradicted": {
    code: "SAFETY_RESTRICTION_UPDATED",
    text: "Passenger safety and eligibility evidence was updated and the corridor model was re-evaluated.",
  },
  default: {
    code: "EVIDENCE_STEWARD_REVIEW_LOGGED",
    text: "Corridor claim evidence was reviewed by the DCC Evidence Steward.",
  },
};

const FORBIDDEN_MANUAL_OVERRIDE_KEYS = [
  "newRank",
  "new_rank",
  "overrideWinner",
  "override_winner",
  "forceRecommendedOperatorId",
  "force_recommended_operator_id",
  "manualRankingAdjustment",
  "manual_ranking_adjustment",
  "requestedRank",
  "requested_rank",
] as const;

export function resetEvidenceStewardWorkflowForTests(): void {
  resetDurableLedgerStateForTests(false);
  resetStewardVehicleEvidencePatchesForTests();
}

function makeWorkflowError(
  message: string,
  code: string,
  statusCode = 422,
): Error & { code: string; statusCode: number } {
  const err = new Error(message) as Error & { code: string; statusCode: number };
  err.code = code;
  err.statusCode = statusCode;
  return err;
}

function safeEqualStrings(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export function resolveStewardAuthSecret(): string {
  return (
    process.env.DCC_STEWARD_AUTH_SECRET?.trim() ||
    process.env.INTERNAL_API_SECRET?.trim() ||
    "dcc-steward-hmac-secret-v1"
  );
}

/**
 * Validates that `stewardId` is a registered, active human/bot steward in `REGISTERED_STEWARDS`
 * (never an unregistered identity or the system quarantine queue) and optionally holds `requiredPermission`.
 */
export function requireRegisteredStewardProfile(
  stewardId: string,
  requiredPermission?: StewardPermission,
): StewardProfile {
  const trimmed = (stewardId || "").trim();
  const profile = REGISTERED_STEWARDS[trimmed];
  if (!profile || profile.isSystemQueue) {
    throw makeWorkflowError(
      `Unregistered or non-assignable steward identity '${trimmed}'. Only registered stewards in REGISTERED_STEWARDS may access or mutate cases.`,
      "UNREGISTERED_STEWARD_IDENTITY",
      403,
    );
  }
  if (
    requiredPermission &&
    !profile.permissions.includes(requiredPermission)
  ) {
    throw makeWorkflowError(
      `Steward '${profile.stewardId}' lacks required permission '${requiredPermission}'.`,
      "STEWARD_PERMISSION_DENIED",
      403,
    );
  }
  return profile;
}

/**
 * Issues a cryptographically signed HMAC credential token bound to a specific registered `stewardId`.
 */
export function issueStewardCredentialToken(
  stewardId: string,
  secret?: string,
): string {
  const profile = requireRegisteredStewardProfile(stewardId);
  const key = secret || resolveStewardAuthSecret();
  const b64Id = Buffer.from(profile.stewardId, "utf8").toString("base64url");
  const mac = crypto
    .createHmac("sha256", key)
    .update(`dcc-steward-token-v1:${profile.stewardId}`, "utf8")
    .digest("hex");
  return `stw.${b64Id}.${mac}`;
}

function extractStewardTokenFromRequest(request: Request): string {
  const headerToken = request.headers.get("x-dcc-steward-token")?.trim();
  if (headerToken) return headerToken;
  const auth = request.headers.get("authorization") || "";
  if (auth.toLowerCase().startsWith("bearer ")) {
    return auth.slice(7).trim();
  }
  return "";
}

/**
 * Authenticates an incoming HTTP Request for a Steward operation:
 * 1. Verifies the `x-dcc-steward-token` (or `Authorization: Bearer`) HMAC signature in constant time.
 * 2. Resolves the registered steward profile and rejects unregistered identities.
 * 3. Verifies the steward holds `requiredPermission`.
 * 4. If the request payload specifies `claimedStewardId`, verifies it matches the authenticated steward.
 */
export function authenticateStewardRequest(
  request: Request,
  requiredPermission: StewardPermission,
  claimedStewardId?: string | null,
): StewardProfile {
  const rawToken = extractStewardTokenFromRequest(request);
  if (!rawToken) {
    throw makeWorkflowError(
      "Steward operation requires a valid x-dcc-steward-token or Bearer credential.",
      "STEWARD_AUTH_REQUIRED",
      401,
    );
  }

  const parts = rawToken.split(".");
  if (parts.length !== 3 || parts[0] !== "stw" || !parts[1] || !parts[2]) {
    throw makeWorkflowError(
      "Malformed or invalid steward credential token.",
      "STEWARD_INVALID_CREDENTIALS",
      401,
    );
  }

  let decodedStewardId = "";
  try {
    decodedStewardId = Buffer.from(parts[1], "base64url").toString("utf8");
  } catch {
    throw makeWorkflowError(
      "Invalid steward credential encoding.",
      "STEWARD_INVALID_CREDENTIALS",
      401,
    );
  }

  const profile = REGISTERED_STEWARDS[decodedStewardId];
  if (!profile || profile.isSystemQueue) {
    throw makeWorkflowError(
      `Unregistered steward identity '${decodedStewardId}'.`,
      "UNREGISTERED_STEWARD_IDENTITY",
      403,
    );
  }

  const expectedToken = issueStewardCredentialToken(profile.stewardId);
  if (!safeEqualStrings(rawToken, expectedToken)) {
    throw makeWorkflowError(
      "Steward credential signature verification failed.",
      "STEWARD_INVALID_CREDENTIALS",
      401,
    );
  }

  if (!profile.permissions.includes(requiredPermission)) {
    throw makeWorkflowError(
      `Steward '${profile.stewardId}' lacks required permission '${requiredPermission}'.`,
      "STEWARD_PERMISSION_DENIED",
      403,
    );
  }

  if (
    claimedStewardId &&
    claimedStewardId.trim() !== "" &&
    claimedStewardId.trim() !== profile.stewardId
  ) {
    throw makeWorkflowError(
      `Authenticated steward '${profile.stewardId}' cannot act as or impersonate '${claimedStewardId.trim()}'.`,
      "STEWARD_IDENTITY_MISMATCH",
      403,
    );
  }

  return profile;
}

function assertNoManualRankingOverrides(payload: Record<string, unknown>): void {
  for (const key of FORBIDDEN_MANUAL_OVERRIDE_KEYS) {
    if (key in payload && payload[key] !== undefined && payload[key] !== null) {
      throw makeWorkflowError(
        `Manual ranking or winner overrides ('${key}') are strictly forbidden. Stewards may only update underlying claim evidence; the deterministic compiler recalculates the market outcome.`,
        "MANUAL_RANK_OVERRIDE_FORBIDDEN",
        422,
      );
    }
  }
}

export function formatPublicAuditTimestamp(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);
  if (Number.isNaN(date.getTime())) {
    return "Verified on Nov 2, 2026";
  }
  const formatted = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
  return `Verified on ${formatted}`;
}

export function computeRequiredRecusalFirms(
  affectedMarketId: string,
  corridorId: string,
  operatorId: string,
): string[] {
  const firms = new Set<string>();
  for (const f of MARKET_RECUSAL_FIRMS[affectedMarketId] ?? []) {
    firms.add(f);
  }
  for (const f of MARKET_RECUSAL_FIRMS[corridorId] ?? []) {
    firms.add(f);
  }
  if (operatorId.trim()) {
    firms.add(operatorId.trim().toLowerCase());
  }
  return Array.from(firms);
}

/**
 * Step 1: Quarantines an untrusted external dispute submission and opens a private StewardReviewCase.
 * Enforces that the submission targets a specific factual claim (`targetClaimId`), never a rank or route winner.
 */
export function submitOperatorDisputeToQuarantine(
  input: {
    disputeId?: string;
    targetClaimId: string;
    submitter: {
      identityId: string;
      trustLevel: SubmitterTrustLevel;
      declaredAffiliation?: string | null;
    };
    submittedEvidence: {
      description: string;
      sourceUrls: string[];
      uploadedDocuments?: {
        documentId: string;
        malwareScanStatus?: "pending" | "clean" | "flagged";
      }[];
    };
    severityOverride?: RiskSeverity;
    submittedAt?: string;
  } & Record<string, unknown>,
): {
  submission: OperatorDisputeSubmission;
  reviewCase: StewardReviewCase;
} {
  assertNoManualRankingOverrides(input);

  const rawTarget = (input.targetClaimId || "").trim();
  if (
    !rawTarget ||
    !rawTarget.startsWith("claim:") ||
    rawTarget.startsWith("rank:") ||
    rawTarget.startsWith("corridor:") ||
    rawTarget.startsWith("winner:")
  ) {
    throw makeWorkflowError(
      `Dispute must target a specific registered fact claim (e.g. 'claim:gosno:vail-private-van:cargo-capacity'), not a route or ranking ('${rawTarget}').`,
      "DISPUTE_MUST_TARGET_SPECIFIC_CLAIM",
      422,
    );
  }

  const claimFact = REGISTERED_CLAIM_FACTS[rawTarget];
  if (!claimFact) {
    throw makeWorkflowError(
      `Unknown targetClaimId '${rawTarget}'. Disputes can only target registered factual claims in the DCC Evidence Registry.`,
      "DISPUTE_MUST_TARGET_SPECIFIC_CLAIM",
      422,
    );
  }

  const submittedAt = input.submittedAt || new Date().toISOString();
  const disputeId =
    input.disputeId?.trim() ||
    `dsp_${crypto.randomBytes(10).toString("hex")}`;

  const submission: OperatorDisputeSubmission = {
    disputeId,
    targetClaimId: claimFact.claimId,
    submitter: {
      identityId: input.submitter.identityId.trim(),
      trustLevel: input.submitter.trustLevel,
      declaredAffiliation: input.submitter.declaredAffiliation ?? null,
    },
    submittedEvidence: {
      description: input.submittedEvidence.description.trim(),
      sourceUrls: (input.submittedEvidence.sourceUrls ?? []).map((u) =>
        u.trim(),
      ),
      uploadedDocuments: (
        input.submittedEvidence.uploadedDocuments ?? []
      ).map((doc) => ({
        documentId: doc.documentId.trim(),
        malwareScanStatus: doc.malwareScanStatus ?? "pending",
        provenance: "operator_supplied" as const,
      })),
    },
    submittedAt,
  };

  const requiredRecusalFirms = computeRequiredRecusalFirms(
    claimFact.affectedMarketId,
    claimFact.corridorId,
    claimFact.operatorId,
  );

  const reviewCase: StewardReviewCase = {
    caseId: `case_${crypto.randomBytes(10).toString("hex")}`,
    disputeReferenceId: submission.disputeId,
    affectedMarketId: claimFact.affectedMarketId,
    status: "quarantined",
    severity: input.severityOverride ?? claimFact.defaultSeverity,
    assignedStewardId: "steward:unassigned-quarantine-queue",
    requiredRecusalFirms,
    temporarySafeguardActive: false,
    safeguardExpiry: null,
    openedAt: submittedAt,
    resolvedAt: null,
  };

  return runDurableLedgerTransaction((state) => {
    state.stewardDisputesById[submission.disputeId] = submission;
    state.stewardCasesById[reviewCase.caseId] = reviewCase;
    return { submission, reviewCase };
  });
}

/**
 * Updates the malware scan state of an uploaded document inside a quarantined submission.
 */
export function updateSubmittedDocumentMalwareStatus(params: {
  disputeId: string;
  documentId: string;
  malwareScanStatus: "pending" | "clean" | "flagged";
  actorStewardId?: string;
}): OperatorDisputeSubmission {
  if (params.actorStewardId) {
    requireRegisteredStewardProfile(params.actorStewardId, "document:scan");
  }
  return runDurableLedgerTransaction((state) => {
    const sub = state.stewardDisputesById[params.disputeId];
    if (!sub) {
      throw makeWorkflowError(
        `Dispute '${params.disputeId}' not found.`,
        "DISPUTE_NOT_FOUND",
        404,
      );
    }
    const doc = sub.submittedEvidence.uploadedDocuments.find(
      (d) => d.documentId === params.documentId,
    );
    if (!doc) {
      throw makeWorkflowError(
        `Document '${params.documentId}' not found in dispute '${params.disputeId}'.`,
        "DOCUMENT_NOT_FOUND",
        404,
      );
    }
    doc.malwareScanStatus = params.malwareScanStatus;
    return sub;
  });
}

function assertStewardHasNoRecusalConflict(
  reviewCase: StewardReviewCase,
  stewardId: string,
  requiredPermission: StewardPermission,
  extraStewardAffiliations?: string[],
): StewardProfile {
  const profile = requireRegisteredStewardProfile(
    stewardId,
    requiredPermission,
  );

  const allAffiliations = new Set(
    [...profile.affiliatedFirms, ...(extraStewardAffiliations ?? [])].map((f) =>
      f.trim().toLowerCase(),
    ),
  );

  const conflictingFirms = reviewCase.requiredRecusalFirms.filter((reqFirm) =>
    allAffiliations.has(reqFirm.trim().toLowerCase()),
  );

  if (conflictingFirms.length > 0) {
    throw makeWorkflowError(
      `Steward '${stewardId}' has a commercial conflict of interest (${conflictingFirms.join(", ")}) on market '${reviewCase.affectedMarketId}' and must recuse. Required recusal firms: [${reviewCase.requiredRecusalFirms.join(", ")}].`,
      "STEWARD_RECUSAL_CONFLICT_OF_INTEREST",
      403,
    );
  }

  return profile;
}

function assertSubmissionDocumentsSafeForReview(
  submission: OperatorDisputeSubmission,
  requireAllClean: boolean,
): void {
  for (const doc of submission.submittedEvidence.uploadedDocuments) {
    if (doc.malwareScanStatus === "flagged") {
      throw makeWorkflowError(
        `Uploaded document '${doc.documentId}' (provenance: ${doc.provenance}) is flagged for malware and cannot be opened or used in evidence evaluation.`,
        "MALWARE_FLAGGED_DOCUMENT_BLOCKED",
        422,
      );
    }
    if (requireAllClean && doc.malwareScanStatus === "pending") {
      throw makeWorkflowError(
        `Uploaded document '${doc.documentId}' (provenance: ${doc.provenance}) is still pending malware scanning. All uploaded documents must pass malware scanning ('clean') before case promotion or evidence confirmation.`,
        "PENDING_MALWARE_SCAN_BLOCKS_RESOLUTION",
        422,
      );
    }
  }
}

/**
 * Step 2: Assigns an independent Evidence Steward to the case and moves it from 'quarantined' to 'under_review'
 * (or 'escalated_legal'), enforcing registered steward identity, permissions, conflict-of-interest recusal rules,
 * and document malware checks.
 */
export function assignStewardToReviewCase(params: {
  caseId: string;
  stewardId: string;
  stewardAffiliatedFirms?: string[];
  nextStatus?: "under_review" | "escalated_legal";
}): StewardReviewCase {
  return runDurableLedgerTransaction((state) => {
    const reviewCase = state.stewardCasesById[params.caseId];
    if (!reviewCase) {
      throw makeWorkflowError(
        `Review case '${params.caseId}' not found.`,
        "CASE_NOT_FOUND",
        404,
      );
    }

    assertStewardHasNoRecusalConflict(
      reviewCase,
      params.stewardId,
      "case:assign",
      params.stewardAffiliatedFirms,
    );

    const submission = state.stewardDisputesById[reviewCase.disputeReferenceId];
    if (submission) {
      assertSubmissionDocumentsSafeForReview(submission, true);
    }

    reviewCase.assignedStewardId = params.stewardId;
    reviewCase.status = params.nextStatus ?? "under_review";
    return reviewCase;
  });
}

/**
 * Emergency Circuit Breaker: Allows the assigned steward to activate a temporary safeguard
 * before final resolution on blocking safety/legal or identity corruption cases.
 */
export function activateTemporaryStewardSafeguard(params: {
  caseId: string;
  stewardId: string;
  safeguardExpiry: string;
  suspendOperatingAuthority?: boolean;
  reEvaluationTripRequest?: TripApplicabilityRequest;
}): {
  reviewCase: StewardReviewCase;
  reEvaluatedOutcome: CompiledApplicableDecisionOutcome | null;
} {
  const { reviewCase, claimFact } = runDurableLedgerTransaction((state) => {
    const existingCase = state.stewardCasesById[params.caseId];
    if (!existingCase) {
      throw makeWorkflowError(
        `Review case '${params.caseId}' not found.`,
        "CASE_NOT_FOUND",
        404,
      );
    }

    assertStewardHasNoRecusalConflict(
      existingCase,
      params.stewardId,
      "case:safeguard",
    );

    existingCase.temporarySafeguardActive = true;
    existingCase.safeguardExpiry = params.safeguardExpiry;

    const submission =
      state.stewardDisputesById[existingCase.disputeReferenceId];
    const resolvedFact = submission
      ? REGISTERED_CLAIM_FACTS[submission.targetClaimId]
      : undefined;

    return { reviewCase: existingCase, claimFact: resolvedFact };
  });

  let reEvaluatedOutcome: CompiledApplicableDecisionOutcome | null = null;
  if (claimFact && params.suspendOperatingAuthority) {
    const tempSnapshotId = `evsnap:safeguard:${reviewCase.caseId}`;
    applyStewardVehicleEvidencePatch(
      {
        vehicleClassId: claimFact.vehicleClassId,
        evidenceVersion: tempSnapshotId,
        operatingAuthorityValid: false,
      },
      tempSnapshotId,
    );
    reEvaluatedOutcome = compileApplicableDecisionContext(
      params.reEvaluationTripRequest ?? {
        corridorId: claimFact.corridorId,
        travelDate: "2026-12-15",
        passengerCount: 7,
        standardBagCount: 6,
        skiOrOversizeBagCount: 2,
        activeSegmentConditions: {
          i70TractionLawActive: true,
          vailPassChainLawActive: true,
        },
      },
    );
  }

  return { reviewCase, reEvaluatedOutcome };
}

/**
 * Step 3: Records the Steward's Audit Decision, mutates the underlying evidence snapshot (if applicable),
 * triggers deterministic market re-evaluation (`compileApplicableDecisionContext`), and appends a
 * strictly sanitized, neutrally worded `PublicMaterialChangeEntry` to the public timeline.
 */
export function recordStewardAuditDecision(
  input: {
    caseId: string;
    stewardId: string;
    stewardAffiliatedFirms?: string[];
    outcomeCode: AuditOutcomeCode;
    privateInternalRationale: string;
    evidenceMutation?: Omit<
      StewardVehicleEvidencePatch,
      "vehicleClassId" | "evidenceVersion"
    > | null;
    reEvaluationTripRequest?: TripApplicabilityRequest;
    decisionTimestamp?: string;
  } & Record<string, unknown>,
): {
  decision: AuditDecisionRecord;
  reviewCase: StewardReviewCase;
  publicTimelineEntry: PublicMaterialChangeEntry;
  reEvaluatedMarketOutcome: CompiledApplicableDecisionOutcome | null;
} {
  assertNoManualRankingOverrides(input);

  const txResult = runDurableLedgerTransaction((state) => {
    const reviewCase = state.stewardCasesById[input.caseId];
    if (!reviewCase) {
      throw makeWorkflowError(
        `Review case '${input.caseId}' not found.`,
        "CASE_NOT_FOUND",
        404,
      );
    }

    const stewardProfile = assertStewardHasNoRecusalConflict(
      reviewCase,
      input.stewardId,
      "case:resolve",
      input.stewardAffiliatedFirms,
    );

    const submission = state.stewardDisputesById[reviewCase.disputeReferenceId];
    if (!submission) {
      throw makeWorkflowError(
        `Dispute submission '${reviewCase.disputeReferenceId}' not found for case '${reviewCase.caseId}'.`,
        "DISPUTE_NOT_FOUND",
        404,
      );
    }

    if (
      input.outcomeCode === "evidence_confirmed" ||
      input.outcomeCode === "evidence_contradicted"
    ) {
      assertSubmissionDocumentsSafeForReview(submission, true);
    } else {
      assertSubmissionDocumentsSafeForReview(submission, false);
    }

    const claimFact = REGISTERED_CLAIM_FACTS[submission.targetClaimId];
    const decisionTimestamp =
      input.decisionTimestamp || new Date().toISOString();

    const mutatesEvidence =
      Boolean(input.evidenceMutation) ||
      input.outcomeCode === "evidence_contradicted";

    let resultingEvidenceSnapshotId: string | null = null;

    if (mutatesEvidence && claimFact) {
      const snapshotSeed = rfc8785Canonicalize({
        caseId: reviewCase.caseId,
        targetClaimId: claimFact.claimId,
        outcomeCode: input.outcomeCode,
        mutation: input.evidenceMutation ?? {},
        decisionTimestamp,
      });
      resultingEvidenceSnapshotId = `evsnap:sha256:${sha256HexFull(snapshotSeed).slice(0, 32)}`;

      state.stewardVehiclePatchesByClassId[claimFact.vehicleClassId] = {
        vehicleClassId: claimFact.vehicleClassId,
        evidenceVersion: resultingEvidenceSnapshotId,
        ...(input.evidenceMutation ?? {}),
      };
      state.stewardLatestSnapshotId = resultingEvidenceSnapshotId;
    }

    const reEvaluationRequired = mutatesEvidence;

    const decision: AuditDecisionRecord = {
      decisionId: `dec_${crypto.randomBytes(10).toString("hex")}`,
      caseId: reviewCase.caseId,
      stewardId: stewardProfile.stewardId,
      outcomeCode: input.outcomeCode,
      privateInternalRationale: input.privateInternalRationale.trim(),
      resultingEvidenceSnapshotId,
      reEvaluationRequired,
      decisionTimestamp,
    };

    reviewCase.assignedStewardId = stewardProfile.stewardId;
    reviewCase.status =
      input.outcomeCode === "unverifiable" ? "dismissed" : "resolved";
    reviewCase.temporarySafeguardActive = false;
    reviewCase.safeguardExpiry = null;
    reviewCase.resolvedAt = decisionTimestamp;

    const templateKey = `${claimFact?.category ?? "default"}:${input.outcomeCode}`;
    const template =
      PUBLIC_SUMMARY_TEMPLATES[templateKey] ?? PUBLIC_SUMMARY_TEMPLATES.default;

    const publicTimelineEntry: PublicMaterialChangeEntry = {
      entryId: `pmc_${crypto.randomBytes(10).toString("hex")}`,
      corridorId: claimFact?.corridorId ?? reviewCase.affectedMarketId,
      operatorId: claimFact?.operatorId ?? "unknown-operator",
      publicSummaryTemplateCode: template.code,
      renderedPublicSummary: template.text,
      auditedByRole: stewardProfile.role,
      auditTimestamp: formatPublicAuditTimestamp(decisionTimestamp),
      resolvedClaimId: submission.targetClaimId,
    };

    state.stewardDecisionsById[decision.decisionId] = decision;
    state.stewardPublicTimeline.unshift(publicTimelineEntry);

    return {
      decision,
      reviewCase,
      publicTimelineEntry,
      claimFact,
      reEvaluationRequired,
    };
  });

  let reEvaluatedMarketOutcome: CompiledApplicableDecisionOutcome | null = null;
  if (txResult.reEvaluationRequired && txResult.claimFact) {
    reEvaluatedMarketOutcome = compileApplicableDecisionContext(
      input.reEvaluationTripRequest ?? {
        corridorId: txResult.claimFact.corridorId,
        travelDate: "2026-12-15",
        passengerCount: 7,
        standardBagCount: 6,
        skiOrOversizeBagCount: 2,
        activeSegmentConditions: {
          i70TractionLawActive: true,
          vailPassChainLawActive: true,
        },
      },
    );
  }

  return {
    decision: txResult.decision,
    reviewCase: txResult.reviewCase,
    publicTimelineEntry: txResult.publicTimelineEntry,
    reEvaluatedMarketOutcome,
  };
}

/**
 * Returns ONLY the sanitized PublicMaterialChangeEntry[] timeline for public consumption.
 * Never exposes `privateInternalRationale`, `OperatorDisputeSubmission`, or steward identities.
 */
export function getPublicMaterialChangeTimeline(
  corridorId?: string,
): PublicMaterialChangeEntry[] {
  const state = readDurableLedgerState();
  const entries = corridorId
    ? state.stewardPublicTimeline.filter(
        (e) =>
          e.corridorId === corridorId ||
          e.corridorId.startsWith(corridorId),
      )
    : [...state.stewardPublicTimeline];

  // Return defensive clones containing strictly the 8 public contract fields
  return entries.map((e) => ({
    entryId: e.entryId,
    corridorId: e.corridorId,
    operatorId: e.operatorId,
    publicSummaryTemplateCode: e.publicSummaryTemplateCode,
    renderedPublicSummary: e.renderedPublicSummary,
    auditedByRole: e.auditedByRole,
    auditTimestamp: e.auditTimestamp,
    resolvedClaimId: e.resolvedClaimId,
  }));
}

export function getInternalStewardWorkbenchState(): {
  disputes: OperatorDisputeSubmission[];
  cases: StewardReviewCase[];
  decisions: AuditDecisionRecord[];
} {
  const state = readDurableLedgerState();
  return {
    disputes: Object.values(state.stewardDisputesById),
    cases: Object.values(state.stewardCasesById),
    decisions: Object.values(state.stewardDecisionsById),
  };
}
