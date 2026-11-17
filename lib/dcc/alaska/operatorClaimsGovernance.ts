/**
 * Phase 1 — Durable Write-Ahead Southeast Alaska Operator Claim &
 * Owner-Approved Direct Integration Governance (`lib/dcc/alaska/operatorClaimsGovernance.ts`).
 */

import crypto from "node:crypto";
import {
  assessOperatorClaimAndIntegrationSubmission,
  type OperatorClaimControlAssessment,
} from "@/lib/dcc/shared/southeastAlaskaDirectoryContract";
import {
  findSoutheastAlaskaOperatorBySlugOrAlias,
} from "@/lib/dcc/shared/southeastAlaskaDirectoryOperatorsAndTours";
import {
  persistDurableTransactionalSubmission,
  resolveRuntimeEnvironmentTag,
} from "@/lib/dcc/storage/transactionalSubmissions";

const SECRET_LIKE_PATTERN =
  /\b(sk_live_[A-Za-z0-9]+|sk_test_[A-Za-z0-9]+|rk_live_[A-Za-z0-9]+|Bearer\s+[A-Za-z0-9._-]{12,}|api[_-]?secret|private[_-]?key)\b/i;

export interface StoredOperatorClaimSubmission {
  claimSubmissionId: string;
  operatorId: string;
  operatorSlug: string;
  operatorName: string;
  contactName: string;
  roleTitle: string;
  email: string;
  phone: string | null;
  requestDirectApiConnection: boolean;
  bookingSystemIdentifier: string | null;
  notes: string | null;
  sourcePage: string;
  isTest: boolean;
  environment: string;
  durablePersisted: boolean;
  durableBackend: string;
  durableFindingId: string;
  assessment: OperatorClaimControlAssessment;
  ownerReviewState:
    | "pending_owner_review"
    | "claim_verified_workspace_enabled"
    | "direct_integration_approved_10pct"
    | "rejected";
  liveAvailabilityActive: boolean;
  directCheckout10PctActive: boolean;
  reviewedBy: string | null;
  reviewedAt: string | null;
  ownerNotes: string | null;
  createdAt: string;
}

const operatorClaimsById = new Map<string, StoredOperatorClaimSubmission>();

export function listStoredOperatorClaims(options?: {
  includeTest?: boolean;
}): StoredOperatorClaimSubmission[] {
  const includeTest = options?.includeTest ?? true;
  return Array.from(operatorClaimsById.values())
    .filter((row) => (includeTest ? true : !row.isTest))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function clearStoredOperatorClaimsForTests(): void {
  operatorClaimsById.clear();
}

export async function submitSoutheastAlaskaOperatorClaim(input: {
  operatorSlugOrId: string;
  contactName: string;
  roleTitle: string;
  email: string;
  phone?: string | null;
  requestDirectApiConnection?: boolean;
  bookingSystemIdentifier?: string | null;
  notes?: string | null;
  sourcePage?: string | null;
  isTest?: boolean;
}): Promise<
  | { ok: true; record: StoredOperatorClaimSubmission }
  | { ok: false; status: number; error: string }
> {
  const normalizedLookup = input.operatorSlugOrId
    .trim()
    .replace(/^operator:/i, "");
  const found = findSoutheastAlaskaOperatorBySlugOrAlias(normalizedLookup);
  if (!found) {
    return {
      ok: false,
      status: 404,
      error: `Operator "${input.operatorSlugOrId}" is not registered in the Southeast Alaska canonical graph.`,
    };
  }

  const combinedFreeText = `${input.bookingSystemIdentifier || ""} ${input.notes || ""}`;
  if (SECRET_LIKE_PATTERN.test(combinedFreeText)) {
    return {
      ok: false,
      status: 400,
      error:
        "Do not submit raw secret API keys in public claim forms. Provide only your company shortname or account handle; credentials are exchanged securely after owner verification.",
    };
  }

  const assessment = assessOperatorClaimAndIntegrationSubmission({
    operator: found.operator,
    claimantEmail: input.email,
    claimantPhone: input.phone || null,
    requestedDirectIntegration: Boolean(input.requestDirectApiConnection),
  });

  const createdAt = new Date().toISOString();
  const claimSubmissionId = `akclaim_${createdAt.slice(0, 10).replace(/-/g, "")}_${crypto
    .randomBytes(5)
    .toString("hex")}`;
  const environment = resolveRuntimeEnvironmentTag();
  const isTest = Boolean(
    input.isTest ||
      environment !== "production" ||
      /\[test\]/i.test(input.contactName) ||
      /\[test\]/i.test(input.notes || ""),
  );

  // Write-ahead durable persistence BEFORE any optional email notification
  const durable = await persistDurableTransactionalSubmission({
    submissionId: claimSubmissionId,
    channel: "lastfrontiershoreexcursions-inquiry",
    status: "operator_claim_pending_verification",
    severity: input.requestDirectApiConnection ? "high" : "watch",
    summaryNote: `[SE Alaska Operator Claim] ${found.operator.name} (${assessment.verificationMethod}) — Direct API requested: ${Boolean(input.requestDirectApiConnection)}`,
    environment,
    isTest,
    createdAt,
    payload: {
      actionType: "operator_profile_claim",
      claimSubmissionId,
      operatorId: found.operator.operatorId,
      operatorSlug: found.operator.slug,
      operatorName: found.operator.name,
      contactName: input.contactName,
      roleTitle: input.roleTitle,
      email: input.email,
      phone: input.phone || null,
      requestDirectApiConnection: Boolean(input.requestDirectApiConnection),
      bookingSystemIdentifier: input.bookingSystemIdentifier || null,
      notes: input.notes || null,
      sourcePage: input.sourcePage || `/operators/${found.operator.slug}`,
      assessment,
      liveAvailabilityActive: false,
      directCheckout10PctActive: false,
    },
  });

  const record: StoredOperatorClaimSubmission = {
    claimSubmissionId,
    operatorId: found.operator.operatorId,
    operatorSlug: found.operator.slug,
    operatorName: found.operator.name,
    contactName: input.contactName,
    roleTitle: input.roleTitle,
    email: input.email,
    phone: input.phone || null,
    requestDirectApiConnection: Boolean(input.requestDirectApiConnection),
    bookingSystemIdentifier: input.bookingSystemIdentifier || null,
    notes: input.notes || null,
    sourcePage: input.sourcePage || `/operators/${found.operator.slug}`,
    isTest,
    environment,
    durablePersisted: durable.persisted,
    durableBackend: durable.backend,
    durableFindingId: durable.findingId,
    assessment,
    ownerReviewState: "pending_owner_review",
    // NEVER self-activate live availability or direct 10% checkout on submission!
    liveAvailabilityActive: false,
    directCheckout10PctActive: false,
    reviewedBy: null,
    reviewedAt: null,
    ownerNotes: null,
    createdAt,
  };

  operatorClaimsById.set(claimSubmissionId, record);
  return { ok: true, record };
}

export function reviewSoutheastAlaskaOperatorClaimByOwner(params: {
  claimSubmissionId: string;
  ownerActor: string;
  decision:
    | "verify_claim_only"
    | "approve_direct_integration_and_10pct_terms"
    | "reject";
  commercialTermsSigned10Pct?: boolean;
  ownerNotes?: string | null;
}):
  | { ok: true; record: StoredOperatorClaimSubmission }
  | { ok: false; status: number; error: string } {
  const existing = operatorClaimsById.get(params.claimSubmissionId);
  if (!existing) {
    return {
      ok: false,
      status: 404,
      error: `Claim submission "${params.claimSubmissionId}" not found.`,
    };
  }

  if (
    params.decision === "approve_direct_integration_and_10pct_terms" &&
    params.commercialTermsSigned10Pct !== true
  ) {
    return {
      ok: false,
      status: 400,
      error:
        "Direct checkout and live integration cannot be activated without explicit confirmation that 10% supplier-hosted commercial terms are signed.",
    };
  }

  const reviewedAt = new Date().toISOString();
  const updated: StoredOperatorClaimSubmission = {
    ...existing,
    ownerReviewState:
      params.decision === "reject"
        ? "rejected"
        : params.decision === "approve_direct_integration_and_10pct_terms"
          ? "direct_integration_approved_10pct"
          : "claim_verified_workspace_enabled",
    liveAvailabilityActive:
      params.decision === "approve_direct_integration_and_10pct_terms",
    directCheckout10PctActive:
      params.decision === "approve_direct_integration_and_10pct_terms" &&
      params.commercialTermsSigned10Pct === true,
    reviewedBy: params.ownerActor,
    reviewedAt,
    ownerNotes: params.ownerNotes || null,
  };

  operatorClaimsById.set(params.claimSubmissionId, updated);
  return { ok: true, record: updated };
}
