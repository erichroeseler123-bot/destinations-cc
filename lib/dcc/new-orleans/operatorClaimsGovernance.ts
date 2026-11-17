/**
 * Durable Write-Ahead New Orleans Operator Claim & Owner-Approved Direct
 * Integration Governance (`lib/dcc/new-orleans/operatorClaimsGovernance.ts`).
 *
 * Safeguards:
 *   - Saves durably via `persistDurableTransactionalSubmission` (`welcometoneworleanstours-inquiry`)
 *   - Verifies business control (`official_company_domain_email`, phone, or manual owner review)
 *   - Rejects raw secret API keys (`sk_live_...`, `Bearer ...`, etc.)
 *   - Keeps `liveAvailabilityActive: false` and `directCheckout10PctActive: false` on submission
 *   - Sends ZERO automatic outreach, invoices, or operator notifications
 */

import crypto from "node:crypto";
import {
  assessOperatorClaimAndIntegrationSubmission,
  type OperatorClaimControlAssessment,
} from "@/lib/dcc/shared/regionalDirectoryCoreContract";
import {
  findNewOrleansOperatorBySlugOrAlias,
  findNewOrleansPlaceBySlug,
} from "@/lib/dcc/shared/newOrleansDirectoryData";
import {
  persistDurableTransactionalSubmission,
  resolveRuntimeEnvironmentTag,
} from "@/lib/dcc/storage/transactionalSubmissions";

const SECRET_LIKE_PATTERN =
  /\b(sk_live_[A-Za-z0-9]+|sk_test_[A-Za-z0-9]+|rk_live_[A-Za-z0-9]+|Bearer\s+[A-Za-z0-9._-]{12,}|api[_-]?secret|private[_-]?key)\b/i;

export interface StoredNewOrleansOperatorClaimSubmission {
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
  automaticNotificationsSent: false;
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

const nolaOperatorClaimsById = new Map<
  string,
  StoredNewOrleansOperatorClaimSubmission
>();

export function listStoredNewOrleansOperatorClaims(options?: {
  includeTest?: boolean;
}): StoredNewOrleansOperatorClaimSubmission[] {
  const includeTest = options?.includeTest ?? true;
  return Array.from(nolaOperatorClaimsById.values())
    .filter((row) => (includeTest ? true : !row.isTest))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function clearStoredNewOrleansOperatorClaimsForTests(): void {
  nolaOperatorClaimsById.clear();
}

export async function submitNewOrleansOperatorClaim(input: {
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
  | { ok: true; record: StoredNewOrleansOperatorClaimSubmission }
  | { ok: false; status: number; error: string }
> {
  const normalizedLookup = input.operatorSlugOrId
    .trim()
    .toLowerCase()
    .replace(/^operator:/i, "");

  // Reject attempts to claim historic sites/museums as transportation operators
  const placeMatch = findNewOrleansPlaceBySlug(normalizedLookup);
  if (placeMatch?.place.placeType === "historic_site_or_museum") {
    return {
      ok: false,
      status: 400,
      error: `"${placeMatch.place.name}" is modeled as an independent historic site / museum entity rather than a transportation tour operator.`,
    };
  }

  const found = findNewOrleansOperatorBySlugOrAlias(normalizedLookup);
  if (!found) {
    return {
      ok: false,
      status: 404,
      error: `Operator "${input.operatorSlugOrId}" is not registered in the New Orleans canonical directory graph.`,
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
  const claimSubmissionId = `nolaclaim_${createdAt.slice(0, 10).replace(/-/g, "")}_${crypto
    .randomBytes(5)
    .toString("hex")}`;
  const environment = resolveRuntimeEnvironmentTag();
  const isTest = Boolean(
    input.isTest ||
      environment !== "production" ||
      /\[test\]/i.test(input.contactName) ||
      /\[test\]/i.test(input.notes || ""),
  );

  // Durable write-ahead persistence; ZERO automatic emails, outreach, or invoices sent
  const durable = await persistDurableTransactionalSubmission({
    submissionId: claimSubmissionId,
    channel: "welcometoneworleanstours-inquiry",
    status: "operator_claim_pending_verification",
    severity: input.requestDirectApiConnection ? "high" : "watch",
    summaryNote: `[New Orleans Operator Claim] ${found.operator.name} (${assessment.verificationMethod}) — Direct API requested: ${Boolean(input.requestDirectApiConnection)}`,
    environment,
    isTest,
    createdAt,
    payload: {
      actionType: "new_orleans_operator_profile_claim",
      claimSubmissionId,
      operatorId: found.operator.operatorId,
      operatorSlug: found.operator.slug,
      operatorName: found.operator.name,
      company: found.operator.name,
      name: input.contactName,
      contactName: input.contactName,
      roleTitle: input.roleTitle,
      email: input.email,
      phone: input.phone || null,
      headline: `[New Orleans Operator Claim] ${found.operator.name} (${assessment.verificationMethod})`,
      routeOrLocation: found.operator.operatorId,
      requestDirectApiConnection: Boolean(input.requestDirectApiConnection),
      bookingSystemIdentifier: input.bookingSystemIdentifier || null,
      notes: input.notes || null,
      sourcePage: input.sourcePage || `/operators/${found.operator.slug}`,
      sourcePath: input.sourcePage || `/operators/${found.operator.slug}`,
      notificationStatus: "durable_storage_only",
      notificationChannel: "durable_storage_only",
      emailSent: false,
      assessment,
      liveAvailabilityActive: false,
      directCheckout10PctActive: false,
      automaticNotificationsSent: false,
    },
  });

  const record: StoredNewOrleansOperatorClaimSubmission = {
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
    automaticNotificationsSent: false,
    assessment,
    ownerReviewState: "pending_owner_review",
    liveAvailabilityActive: false,
    directCheckout10PctActive: false,
    reviewedBy: null,
    reviewedAt: null,
    ownerNotes: null,
    createdAt,
  };

  nolaOperatorClaimsById.set(claimSubmissionId, record);
  return { ok: true, record };
}

export function reviewNewOrleansOperatorClaimByOwner(params: {
  claimSubmissionId: string;
  ownerActor: string;
  decision:
    | "verify_claim_only"
    | "approve_direct_integration_and_10pct_terms"
    | "reject";
  commercialTermsSigned10Pct?: boolean;
  ownerNotes?: string | null;
}):
  | { ok: true; record: StoredNewOrleansOperatorClaimSubmission }
  | { ok: false; status: number; error: string } {
  const existing = nolaOperatorClaimsById.get(params.claimSubmissionId);
  if (!existing) {
    return {
      ok: false,
      status: 404,
      error: `New Orleans claim submission "${params.claimSubmissionId}" not found.`,
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
        "Direct checkout and live integration cannot be activated without explicit confirmation that 10% supplier-MoR commercial terms are signed.",
    };
  }

  const reviewedAt = new Date().toISOString();
  const updated: StoredNewOrleansOperatorClaimSubmission = {
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

  nolaOperatorClaimsById.set(params.claimSubmissionId, updated);
  return { ok: true, record: updated };
}
