import { createHash, randomBytes, randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { and, desc, eq } from "drizzle-orm";
import { hasConfiguredDatabaseUrl } from "@/lib/db/client";
import {
  earthosControlMapFindingHistory,
  earthosControlMapFindings,
} from "@/lib/db/schema";
import { getRequiredEarthosDb } from "@/lib/dcc/earthos/ensureEarthosSchema";
import {
  resolveEarthosEnvironmentScope,
  type EarthosEnvironmentScope,
} from "@/lib/dcc/travelReference";
import { FLAGGED_PRIOR_OUTREACH_OPERATORS } from "@/lib/dcc/operators";

export const OPERATOR_ONBOARDING_OWNER = "dcc-operator-onboarding-queue";

const FORBIDDEN_SECRET_KEYS = [
  "apikey",
  "api_key",
  "secret",
  "api_secret",
  "client_secret",
  "password",
  "bearertoken",
  "bearer_token",
  "access_token",
  "private_key",
];

export const REQUIRED_VERIFICATION_GATES_BEFORE_CUTOVER = [
  "operator_authorization_verified",
  "commercial_and_settlement_terms_signed",
  "credentials_arranged_and_verified",
  "product_mapping_verified",
  "current_prices_and_availability_verified",
  "booking_attribution_and_outcome_reporting_verified",
  "cancellation_and_cruise_return_policies_verified_separately",
] as const;

export type OperatorOnboardingApplicationStatus =
  | "application_received_pending_review"
  | "api_required_keep_viator_channel";

export type OperatorReviewQueueState =
  | "pending_review"
  | "in_technical_review"
  | "archived_no_api"
  | "approved_for_sandbox"
  | "rejected";

export type PersistedOperatorOnboardingRecord = {
  applicationId: string;
  findingId: string;
  environmentScope: EarthosEnvironmentScope;
  applicationStatus: OperatorOnboardingApplicationStatus;
  reviewQueueState: OperatorReviewQueueState;
  salesAuthorized: false;
  commercialTermsSigned: false;
  credentialsCollectedPublicly: false;
  activeBookingChannel: "viator_until_verified" | "viator_if_verified";
  proposedCommissionPercent: 10;
  commercialTermsNote: string;
  credentialArrangementNote: string;
  priorOutreachFlag: string | null;
  requiredVerificationGatesBeforeCutover: readonly string[];
  submitted: {
    companyName: string;
    contactName: string;
    contactEmail: string;
    website: string;
    destinations: string;
    bookingSystem: string;
    apiDocumentationUrl: string;
    authorizedApiAccessAvailable: boolean;
    operatorPermissionConfirmed: boolean;
    notes?: string;
  };
  retrievalTokenHash: string;
  storageBackend: "neon_postgres" | "local_file_nonprod";
  submittedAt: string;
  updatedAt: string;
};

export type PublicOperatorOnboardingRecord = Omit<
  PersistedOperatorOnboardingRecord,
  "retrievalTokenHash"
>;

const LOCAL_FALLBACK_PATH = path.resolve(
  process.cwd(),
  "data",
  "memory",
  "operator-onboarding-applications.json",
);

export function hashRetrievalToken(token: string): string {
  return createHash("sha256")
    .update(`dcc-onb-token:${token.trim()}`)
    .digest("hex");
}

function stripRetrievalTokenHash(
  record: PersistedOperatorOnboardingRecord,
): PublicOperatorOnboardingRecord {
  const { retrievalTokenHash: _unused, ...rest } = record;
  return rest;
}

function readLocalFallbackRecords(): PersistedOperatorOnboardingRecord[] {
  try {
    if (!fs.existsSync(LOCAL_FALLBACK_PATH)) return [];
    const raw = fs.readFileSync(LOCAL_FALLBACK_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as PersistedOperatorOnboardingRecord[]) : [];
  } catch {
    return [];
  }
}

function writeLocalFallbackRecords(records: PersistedOperatorOnboardingRecord[]): void {
  const dir = path.dirname(LOCAL_FALLBACK_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(LOCAL_FALLBACK_PATH, JSON.stringify(records, null, 2), "utf8");
}

function detectPriorOutreachFlag(companyName: string): string | null {
  const lower = companyName.trim().toLowerCase();
  const match = FLAGGED_PRIOR_OUTREACH_OPERATORS.find(
    (op) =>
      lower.includes(op.name.toLowerCase()) ||
      op.name.toLowerCase().includes(lower),
  );
  if (!match) return null;
  return `PRIOR OUTREACH FLAG: ${match.name} previously received a separate email proposing ${match.priorProposal}. Do not auto-send outreach; route to manual commercial review.`;
}

export type ValidationResult =
  | {
      ok: false;
      status: 400;
      errorCode:
        | "public_secret_submission_forbidden"
        | "missing_required_fields"
        | "missing_api_documentation"
        | "invalid_api_documentation_url";
      message: string;
    }
  | {
      ok: true;
      status: 200 | 201;
      applicationStatus: OperatorOnboardingApplicationStatus;
      reviewQueueState: OperatorReviewQueueState;
      salesAuthorized: false;
      commercialTermsSigned: false;
      credentialsCollectedPublicly: false;
      activeBookingChannel: "viator_until_verified" | "viator_if_verified";
      proposedCommissionPercent: 10;
      priorOutreachFlag: string | null;
      commercialTermsNote: string;
      credentialArrangementNote: string;
      requiredVerificationGatesBeforeCutover: readonly string[];
      message?: string;
      submitted: {
        companyName: string;
        contactName: string;
        contactEmail: string;
        website: string;
        destinations: string;
        bookingSystem: string;
        apiDocumentationUrl: string;
        authorizedApiAccessAvailable: boolean;
        operatorPermissionConfirmed: boolean;
        notes?: string;
      };
    };

export function validateOperatorOnboardingApplication(
  body: Record<string, unknown>,
): ValidationResult {
  for (const key of Object.keys(body)) {
    const normalized = key.toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (FORBIDDEN_SECRET_KEYS.includes(normalized) && body[key]) {
      return {
        ok: false,
        status: 400,
        errorCode: "public_secret_submission_forbidden",
        message:
          "Do not submit API keys, tokens, or secrets through public forms or email. Credentials are arranged securely after technical and commercial review.",
      };
    }
  }

  const companyName = String(body.companyName || "").trim();
  const contactName = String(body.contactName || "").trim();
  const contactEmail = String(body.contactEmail || "").trim();
  const website = String(body.website || body.websiteUrl || "").trim();
  const destinations = Array.isArray(body.destinations)
    ? body.destinations.map((d) => String(d).trim()).filter(Boolean).join(", ")
    : String(body.destinations || "").trim();
  const bookingSystem = String(body.bookingSystem || "").trim();
  const apiDocumentationUrl = String(body.apiDocumentationUrl || "").trim();
  const authorizedApiAccessAvailable = Boolean(
    body.authorizedApiAccessAvailable ?? body.authorizedApiAccessConfirmed,
  );
  const operatorPermissionConfirmed = Boolean(
    body.operatorPermissionConfirmed ?? body.authorizedApiAccessConfirmed ?? true,
  );
  const notes = body.notes ? String(body.notes).trim().slice(0, 2000) : undefined;

  if (!companyName || !contactName || !contactEmail || !website || !destinations || !bookingSystem) {
    return {
      ok: false,
      status: 400,
      errorCode: "missing_required_fields",
      message:
        "Missing required fields: companyName, contactName, contactEmail, website, destinations, and bookingSystem are required.",
    };
  }

  const priorOutreachFlag = detectPriorOutreachFlag(companyName);
  const commercialTermsNote =
    "The proposed 10% commission on completed direct bookings is separate from signed commercial and settlement terms. Submitting this application does not authorize direct sales.";
  const credentialArrangementNote =
    "API credentials are arranged through a secure channel after technical review and signed commercial terms. Never send API secrets by email or public forms.";

  if (
    bookingSystem.toLowerCase() === "no_api" ||
    bookingSystem.toLowerCase() === "none" ||
    !authorizedApiAccessAvailable
  ) {
    return {
      ok: true,
      status: 200,
      applicationStatus: "api_required_keep_viator_channel",
      reviewQueueState: "archived_no_api",
      salesAuthorized: false,
      commercialTermsSigned: false,
      credentialsCollectedPublicly: false,
      activeBookingChannel: "viator_if_verified",
      proposedCommissionPercent: 10,
      priorOutreachFlag,
      commercialTermsNote,
      credentialArrangementNote,
      requiredVerificationGatesBeforeCutover: REQUIRED_VERIFICATION_GATES_BEFORE_CUTOVER,
      message:
        "Direct partnerships are API-only. Without an authorized API connection, we cannot switch bookings to a direct connection. Existing verified Viator listings can continue through Viator.",
      submitted: {
        companyName,
        contactName,
        contactEmail,
        website,
        destinations,
        bookingSystem,
        apiDocumentationUrl,
        authorizedApiAccessAvailable,
        operatorPermissionConfirmed,
        ...(notes ? { notes } : {}),
      },
    };
  }

  if (!apiDocumentationUrl) {
    return {
      ok: false,
      status: 400,
      errorCode: "missing_api_documentation",
      message:
        "Please provide the API documentation URL or technical specification reference for your booking system.",
    };
  }

  try {
    const parsedDocUrl = new URL(apiDocumentationUrl);
    if (parsedDocUrl.protocol !== "http:" && parsedDocUrl.protocol !== "https:") {
      return {
        ok: false,
        status: 400,
        errorCode: "invalid_api_documentation_url",
        message: "API documentation URL must use http:// or https://.",
      };
    }
  } catch {
    return {
      ok: false,
      status: 400,
      errorCode: "invalid_api_documentation_url",
      message: "API documentation URL must be a valid URL.",
    };
  }

  return {
    ok: true,
    status: 201,
    applicationStatus: "application_received_pending_review",
    reviewQueueState: "pending_review",
    salesAuthorized: false,
    commercialTermsSigned: false,
    credentialsCollectedPublicly: false,
    activeBookingChannel: "viator_until_verified",
    proposedCommissionPercent: 10,
    priorOutreachFlag,
    commercialTermsNote,
    credentialArrangementNote,
    requiredVerificationGatesBeforeCutover: REQUIRED_VERIFICATION_GATES_BEFORE_CUTOVER,
    submitted: {
      companyName,
      contactName,
      contactEmail,
      website,
      destinations,
      bookingSystem,
      apiDocumentationUrl,
      authorizedApiAccessAvailable,
      operatorPermissionConfirmed,
      ...(notes ? { notes } : {}),
    },
  };
}

function parseRecordFromFindingRow(
  row: typeof earthosControlMapFindings.$inferSelect,
): PersistedOperatorOnboardingRecord | null {
  const meta = row.metadata as Partial<PersistedOperatorOnboardingRecord> | null;
  if (
    !meta ||
    typeof meta.applicationId !== "string" ||
    !meta.submitted ||
    typeof meta.submitted.companyName !== "string" ||
    typeof meta.retrievalTokenHash !== "string"
  ) {
    return null;
  }
  return meta as PersistedOperatorOnboardingRecord;
}

export async function submitOperatorOnboardingApplication(
  body: Record<string, unknown>,
  options: { environmentScope?: EarthosEnvironmentScope } = {},
): Promise<
  | (ValidationResult & { ok: false })
  | {
      ok: false;
      status: 500 | 503;
      errorCode: "persistence_failed" | "durable_storage_unavailable";
      persisted: false;
      message: string;
    }
  | {
      ok: true;
      status: 200 | 201;
      persisted: true;
      storageBackend: "neon_postgres" | "local_file_nonprod";
      applicationId: string;
      findingId: string;
      retrievalToken: string;
      applicationStatus: OperatorOnboardingApplicationStatus;
      reviewQueueState: OperatorReviewQueueState;
      salesAuthorized: false;
      commercialTermsSigned: false;
      credentialsCollectedPublicly: false;
      activeBookingChannel: "viator_until_verified" | "viator_if_verified";
      proposedCommissionPercent: 10;
      priorOutreachFlag: string | null;
      commercialTermsNote: string;
      credentialArrangementNote: string;
      requiredVerificationGatesBeforeCutover: readonly string[];
      message?: string;
      submitted: PersistedOperatorOnboardingRecord["submitted"];
      submittedAt: string;
    }
> {
  const validated = validateOperatorOnboardingApplication(body);
  if (!validated.ok) {
    return validated;
  }

  const scope = options.environmentScope || resolveEarthosEnvironmentScope();
  const nowIso = new Date().toISOString();
  const applicationId = `dcc_onb_${Date.now().toString(36)}_${randomUUID().slice(0, 8)}`;
  const findingId = `control-map:operator-onboarding:${scope}:${applicationId}`;
  const retrievalToken = `onbtok_${randomBytes(24).toString("hex")}`;
  const retrievalTokenHash = hashRetrievalToken(retrievalToken);

  const useDatabase = hasConfiguredDatabaseUrl();
  if (!useDatabase && process.env.VERCEL_ENV === "production") {
    return {
      ok: false,
      status: 503,
      errorCode: "durable_storage_unavailable",
      persisted: false,
      message:
        "Durable database storage is required in production before accepting operator onboarding applications.",
    };
  }

  const storageBackend: "neon_postgres" | "local_file_nonprod" = useDatabase
    ? "neon_postgres"
    : "local_file_nonprod";

  const record: PersistedOperatorOnboardingRecord = {
    applicationId,
    findingId,
    environmentScope: scope,
    applicationStatus: validated.applicationStatus,
    reviewQueueState: validated.reviewQueueState,
    salesAuthorized: false,
    commercialTermsSigned: false,
    credentialsCollectedPublicly: false,
    activeBookingChannel: validated.activeBookingChannel,
    proposedCommissionPercent: 10,
    commercialTermsNote: validated.commercialTermsNote,
    credentialArrangementNote: validated.credentialArrangementNote,
    priorOutreachFlag: validated.priorOutreachFlag,
    requiredVerificationGatesBeforeCutover: validated.requiredVerificationGatesBeforeCutover,
    submitted: validated.submitted,
    retrievalTokenHash,
    storageBackend,
    submittedAt: nowIso,
    updatedAt: nowIso,
  };

  const summaryNote = `Operator onboarding (${record.reviewQueueState}): ${record.submitted.companyName} (${record.submitted.destinations}) via ${record.submitted.bookingSystem}`;

  try {
    if (useDatabase) {
      const db = await getRequiredEarthosDb();
      await db
        .insert(earthosControlMapFindings)
        .values({
          findingId: record.findingId,
          status: record.reviewQueueState === "pending_review" ? "open" : "triaged",
          severity: record.priorOutreachFlag ? "high" : "watch",
          owner: OPERATOR_ONBOARDING_OWNER,
          note: summaryNote,
          metadata: record as unknown as Record<string, unknown>,
          updatedAt: new Date(nowIso),
        })
        .onConflictDoUpdate({
          target: earthosControlMapFindings.findingId,
          set: {
            status: record.reviewQueueState === "pending_review" ? "open" : "triaged",
            severity: record.priorOutreachFlag ? "high" : "watch",
            owner: OPERATOR_ONBOARDING_OWNER,
            note: summaryNote,
            metadata: record as unknown as Record<string, unknown>,
            updatedAt: new Date(nowIso),
          },
        });

      await db.insert(earthosControlMapFindingHistory).values({
        findingId: record.findingId,
        event: "operator_onboarding_submitted",
        status: record.reviewQueueState === "pending_review" ? "open" : "triaged",
        severity: record.priorOutreachFlag ? "high" : "watch",
        owner: OPERATOR_ONBOARDING_OWNER,
        nodeSlug: "operators",
        corridor: "operator-onboarding",
        recordedAt: new Date(nowIso),
        summary: summaryNote,
        approvedAt: null,
        approvedBy: null,
        controlSurface: "/operators/onboarding",
        metadata: stripRetrievalTokenHash(record) as unknown as Record<string, unknown>,
      });

      // Verify durable persistence by reading back the stored row before returning success
      const verifyRows = await db
        .select()
        .from(earthosControlMapFindings)
        .where(
          and(
            eq(earthosControlMapFindings.findingId, record.findingId),
            eq(earthosControlMapFindings.owner, OPERATOR_ONBOARDING_OWNER),
          ),
        )
        .limit(1);

      const verifiedRecord = verifyRows[0] ? parseRecordFromFindingRow(verifyRows[0]) : null;
      if (!verifiedRecord || verifiedRecord.applicationId !== record.applicationId) {
        throw new Error("Post-write database verification failed: persisted record could not be read back.");
      }
    } else {
      const existing = readLocalFallbackRecords();
      writeLocalFallbackRecords([record, ...existing]);
      const verifyBack = readLocalFallbackRecords().find(
        (item) => item.applicationId === record.applicationId,
      );
      if (!verifyBack) {
        throw new Error("Post-write local storage verification failed.");
      }
    }
  } catch (err) {
    return {
      ok: false,
      status: 500,
      errorCode: "persistence_failed",
      persisted: false,
      message:
        err instanceof Error
          ? `Failed to persist operator onboarding application: ${err.message}`
          : "Failed to persist operator onboarding application.",
    };
  }

  return {
    ok: true,
    status: validated.status,
    persisted: true,
    storageBackend,
    applicationId: record.applicationId,
    findingId: record.findingId,
    retrievalToken,
    applicationStatus: record.applicationStatus,
    reviewQueueState: record.reviewQueueState,
    salesAuthorized: false,
    commercialTermsSigned: false,
    credentialsCollectedPublicly: false,
    activeBookingChannel: record.activeBookingChannel,
    proposedCommissionPercent: 10,
    priorOutreachFlag: record.priorOutreachFlag,
    commercialTermsNote: record.commercialTermsNote,
    credentialArrangementNote: record.credentialArrangementNote,
    requiredVerificationGatesBeforeCutover: record.requiredVerificationGatesBeforeCutover,
    ...(validated.message ? { message: validated.message } : {}),
    submitted: record.submitted,
    submittedAt: record.submittedAt,
  };
}

export async function getOperatorOnboardingApplicationById(
  applicationId: string,
  options: {
    retrievalToken?: string | null;
    bypassTokenForAuthorizedReviewer?: boolean;
    environmentScope?: EarthosEnvironmentScope | "all";
  } = {},
): Promise<
  | {
      ok: true;
      application: PublicOperatorOnboardingRecord;
    }
  | {
      ok: false;
      status: 401 | 404;
      errorCode: "onboarding_retrieval_unauthorized" | "application_not_found";
      message: string;
    }
> {
  const trimmedId = (applicationId || "").trim();
  if (!trimmedId) {
    return {
      ok: false,
      status: 404,
      errorCode: "application_not_found",
      message: "Application ID is required.",
    };
  }

  let matched: PersistedOperatorOnboardingRecord | null = null;

  if (hasConfiguredDatabaseUrl()) {
    const db = await getRequiredEarthosDb();
    const candidateFindingIds = [
      `control-map:operator-onboarding:production:${trimmedId}`,
      `control-map:operator-onboarding:nonprod:${trimmedId}`,
    ];
    for (const fid of candidateFindingIds) {
      const rows = await db
        .select()
        .from(earthosControlMapFindings)
        .where(
          and(
            eq(earthosControlMapFindings.findingId, fid),
            eq(earthosControlMapFindings.owner, OPERATOR_ONBOARDING_OWNER),
          ),
        )
        .limit(1);
      if (rows[0]) {
        const parsed = parseRecordFromFindingRow(rows[0]);
        if (parsed) {
          matched = parsed;
          break;
        }
      }
    }
  } else {
    matched =
      readLocalFallbackRecords().find((r) => r.applicationId === trimmedId) || null;
  }

  if (!matched) {
    return {
      ok: false,
      status: 404,
      errorCode: "application_not_found",
      message: `No persisted operator onboarding application found for ID ${trimmedId}.`,
    };
  }

  if (!options.bypassTokenForAuthorizedReviewer) {
    const token = (options.retrievalToken || "").trim();
    if (!token || hashRetrievalToken(token) !== matched.retrievalTokenHash) {
      return {
        ok: false,
        status: 401,
        errorCode: "onboarding_retrieval_unauthorized",
        message:
          "A valid retrievalToken or reviewer authorization is required to inspect this onboarding application.",
      };
    }
  }

  return {
    ok: true,
    application: stripRetrievalTokenHash(matched),
  };
}

export async function listOperatorOnboardingReviewQueue(options: {
  reviewQueueState?: OperatorReviewQueueState;
  environmentScope?: EarthosEnvironmentScope | "all";
  limit?: number;
} = {}): Promise<PublicOperatorOnboardingRecord[]> {
  const targetScope = options.environmentScope || resolveEarthosEnvironmentScope();
  let records: PersistedOperatorOnboardingRecord[] = [];

  if (hasConfiguredDatabaseUrl()) {
    const db = await getRequiredEarthosDb();
    const rows = await db
      .select()
      .from(earthosControlMapFindings)
      .where(eq(earthosControlMapFindings.owner, OPERATOR_ONBOARDING_OWNER))
      .orderBy(desc(earthosControlMapFindings.updatedAt))
      .limit(options.limit || 100);

    records = rows
      .map(parseRecordFromFindingRow)
      .filter((r): r is PersistedOperatorOnboardingRecord => r !== null);
  } else {
    records = readLocalFallbackRecords();
  }

  return records
    .filter((r) => {
      if (targetScope !== "all" && r.environmentScope !== targetScope) {
        return false;
      }
      if (options.reviewQueueState && r.reviewQueueState !== options.reviewQueueState) {
        return false;
      }
      return true;
    })
    .map(stripRetrievalTokenHash);
}

export async function deleteOperatorOnboardingApplicationById(
  applicationId: string,
  options: {
    retrievalToken?: string | null;
    bypassTokenForAuthorizedReviewer?: boolean;
  } = {},
): Promise<{ ok: boolean; status: 200 | 401 | 404; deletedId?: string; message?: string }> {
  const lookup = await getOperatorOnboardingApplicationById(applicationId, options);
  if (!lookup.ok) {
    return {
      ok: false,
      status: lookup.status,
      message: lookup.message,
    };
  }

  const candidateFindingIds = [
    lookup.application.findingId,
    `control-map:operator-onboarding:production:${applicationId}`,
    `control-map:operator-onboarding:nonprod:${applicationId}`,
  ];

  if (hasConfiguredDatabaseUrl()) {
    const db = await getRequiredEarthosDb();
    for (const fid of candidateFindingIds) {
      await db
        .delete(earthosControlMapFindingHistory)
        .where(eq(earthosControlMapFindingHistory.findingId, fid));
      await db
        .delete(earthosControlMapFindings)
        .where(eq(earthosControlMapFindings.findingId, fid));
    }
  } else {
    const remaining = readLocalFallbackRecords().filter(
      (r) => r.applicationId !== applicationId,
    );
    writeLocalFallbackRecords(remaining);
  }

  return {
    ok: true,
    status: 200,
    deletedId: applicationId,
  };
}
