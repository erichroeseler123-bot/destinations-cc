import { createHash, timingSafeEqual } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";
import { resolveDatabaseUrl } from "@/lib/db/client";
import {
  classifyOperatorInboxSubmission,
  isLiveResendConfigured,
  isValidOperatorTriageStatus,
  normalizeInquiryNotificationStatus,
  saveOperatorInboxTriageOverlay,
  type OperatorNotificationStatus,
  type OperatorTriageStatus,
} from "@/lib/dcc/operatorInbox";
import {
  getInMemoryTransactionalSubmissions,
  isServerlessRuntimeEnvironment,
  removeInMemoryTransactionalSubmission,
  resolveRuntimeEnvironmentTag,
  setInMemoryTransactionalSubmission,
} from "@/lib/dcc/storage/transactionalSubmissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store",
};

const VALID_INQUIRY_ID_RE = /^[a-zA-Z0-9_-]{4,80}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SYNTHETIC_QA_ID_RE = /^gi_qa_[a-zA-Z0-9_-]+$/i;
const SYNTHETIC_QA_MARKER_RE = /\[QA-SYNTHETIC/i;
const SYNTHETIC_EMAIL_DOMAIN_RE =
  /@(?:example\.(?:com|org|net)|command\.com|test\.com|localhost|cruisepromenade\.com|destinationcommandcenter\.com)$|\.invalid$/i;

const LOCAL_DEV_SUBMISSIONS_PATH = path.join(
  process.cwd(),
  ".cache",
  "dcc-transactional-submissions.json",
);

interface InProcessIdempotencyRecord {
  findingId: string;
  inquiryId: string;
  itemKey: string;
  notificationStatus: OperatorNotificationStatus;
  metadata: Record<string, unknown>;
}

const inProcessCpIdempotencyGuard = new Map<
  string,
  InProcessIdempotencyRecord
>();

// Optional fetch override hook for deterministic unit tests without mocking global fetch
let customResendFetchForTests: typeof fetch | null = null;
export function setCpInquiryResendFetchForTests(
  fn: typeof fetch | null,
): void {
  customResendFetchForTests = fn;
}

export function clearCpGroupInquiryIdempotencyForTests(): void {
  inProcessCpIdempotencyGuard.clear();
}

function constantTimeSecretMatch(candidate: string, expected: string): boolean {
  if (!candidate || !expected) return false;
  const digestCandidate = createHash("sha256").update(candidate).digest();
  const digestExpected = createHash("sha256").update(expected).digest();
  return timingSafeEqual(digestCandidate, digestExpected);
}

function readBearerToken(request: Request): string {
  const auth = request.headers.get("authorization") || "";
  const match = auth.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : "";
}

function authenticateCpServiceRequest(
  request: Request,
): { ok: true } | { ok: false; status: 401 | 503; error: string } {
  const configuredSecret = (process.env.DCC_CP_SERVICE_SECRET || "").trim();
  if (!configuredSecret) {
    return {
      ok: false,
      status: 503,
      error: "Service authentication is not configured.",
    };
  }

  const headerSecret = (
    request.headers.get("x-dcc-cp-service-secret") || ""
  ).trim();
  const bearerSecret = readBearerToken(request);
  const candidate = headerSecret || bearerSecret;

  if (!candidate || !constantTimeSecretMatch(candidate, configuredSecret)) {
    return {
      ok: false,
      status: 401,
      error: "Unauthorized.",
    };
  }

  return { ok: true };
}

function resolveCpFindingsDatabaseUrl(): string | null {
  if (process.env.DCC_ISOLATED_TEST_DB === "1") {
    return null;
  }

  const explicitTarget = (
    process.env.DCC_TARGET_DB ||
    process.env.DCC_EARTHOS_ENV ||
    ""
  )
    .trim()
    .toLowerCase();
  const isNonProd =
    explicitTarget === "nonprod" ||
    explicitTarget === "preview" ||
    explicitTarget === "development" ||
    explicitTarget === "test" ||
    (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production");

  const candidates = isNonProd
    ? [
        process.env.DCC_NONPROD_DATABASE_URL,
        process.env.DCC_DATABASE_URL,
        process.env.DATABASE_URL,
        process.env.POSTGRES_URL,
      ]
    : [
        process.env.DCC_PRODUCTION_DATABASE_URL,
        process.env.DCC_DATABASE_URL,
        process.env.DATABASE_URL,
        process.env.POSTGRES_URL,
        process.env.DCC_NONPROD_DATABASE_URL,
      ];

  for (const candidate of candidates) {
    const trimmed = (candidate || "").trim();
    if (trimmed) return trimmed;
  }

  return resolveDatabaseUrl() || null;
}

function normalizeNamespace(rawNamespace: unknown, isPreview: boolean): string {
  if (typeof rawNamespace === "string" && rawNamespace.trim()) {
    const cleaned = rawNamespace
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "");
    if (cleaned) return cleaned.slice(0, 32);
  }
  if (isPreview) return "preview";
  const runtimeEnv = resolveRuntimeEnvironmentTag()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "");
  return runtimeEnv || "production";
}

export function buildCpGroupInquiryFindingId(
  namespace: string,
  inquiryId: string,
): string {
  return `control-map:transactional-submission:${namespace}:cp-group-inquiry:${inquiryId}`;
}

export function buildCpGroupInquiryItemKey(inquiryId: string): string {
  return `cp:group-inquiry:${inquiryId}`;
}

function normalizeTextField(
  val: unknown,
  maxLength = 400,
): string | null {
  if (typeof val !== "string") return null;
  const trimmed = val.trim();
  return trimmed ? trimmed.slice(0, maxLength) : null;
}

function normalizeStringOrListField(
  val: unknown,
  maxLength = 600,
): { list: string[]; text: string | null } {
  if (Array.isArray(val)) {
    const list = val
      .map((item) => (typeof item === "string" ? item.trim() : String(item ?? "").trim()))
      .filter(Boolean)
      .slice(0, 30);
    const joined = list.join(", ").slice(0, maxLength);
    return { list, text: joined || null };
  }
  if (typeof val === "string" && val.trim()) {
    const trimmed = val.trim().slice(0, maxLength);
    const list = trimmed
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    return { list, text: trimmed };
  }
  return { list: [], text: null };
}

function parseMetadataObject(raw: unknown): Record<string, unknown> {
  if (!raw) return {};
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object"
        ? (parsed as Record<string, unknown>)
        : {};
    } catch {
      return {};
    }
  }
  if (typeof raw === "object") {
    return raw as Record<string, unknown>;
  }
  return {};
}

function parseOwnerAlertRecipients(customerEmail: string): string[] {
  const raw = (
    process.env.CP_OWNER_ALERT_TO_EMAIL ||
    process.env.CP_CONCIERGE_ALERT_TO_EMAIL ||
    process.env.EARTHOS_APPROVAL_TO ||
    ""
  ).trim();
  if (!raw) return [];
  const lowerCustomer = customerEmail.trim().toLowerCase();
  return raw
    .split(",")
    .map((entry) => entry.trim())
    .filter(
      (entry) =>
        entry.length > 0 &&
        EMAIL_RE.test(entry) &&
        entry.toLowerCase() !== lowerCustomer &&
        !/destinationcommandcenter\.com$/i.test(entry), // 0 MX guard
    );
}

async function maybeSendOwnerAlertEmailOnFirstIngest(params: {
  inquiryId: string;
  submittedAt: string;
  organizerName: string;
  customerEmail: string;
  customerPhone: string | null;
  ship: string;
  sailDate: string;
  portsText: string | null;
  travelerCount: number;
  desiredActivitiesText: string | null;
  mobilityNeeds: string | null;
  sourcePage: string;
  paymentStructure: string | boolean | null;
  privateTransport: string | boolean | null;
  negotiatedRates: string | boolean | null;
  notes: string | null;
}): Promise<{
  attempted: boolean;
  delivered: boolean;
  destination: string;
  providerMessageId: string | null;
  error: string | null;
}> {
  const resendKey = (
    process.env.DCC_RESEND_API_KEY ||
    process.env.RESEND_API_KEY ||
    ""
  ).trim();
  const ownerRecipients = parseOwnerAlertRecipients(params.customerEmail);
  const fromEmail = (
    process.env.MAIL_FROM_CP ||
    process.env.MAIL_FROM_DCC ||
    process.env.DEPLOY_TEST_EMAIL_FROM ||
    "Cruise Promenade <concierge@cruisepromenade.com>"
  ).trim();

  if (!resendKey || ownerRecipients.length === 0 || !fromEmail) {
    return {
      attempted: false,
      delivered: false,
      destination: ownerRecipients[0] || "concierge@cruisepromenade.com",
      providerMessageId: null,
      error: null,
    };
  }

  const fetchImpl = customResendFetchForTests || fetch;
  try {
    const res = await fetchImpl("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: ownerRecipients,
        reply_to: params.customerEmail,
        subject: `[Cruise Promenade Group Inquiry] ${params.ship} (${params.sailDate}) — ${params.travelerCount} guests`,
        text: [
          `Cruise Promenade Group Inquiry (${params.inquiryId})`,
          `Submitted At: ${params.submittedAt}`,
          `Organizer: ${params.organizerName}`,
          `Email: ${params.customerEmail}`,
          `Phone: ${params.customerPhone || "Not provided"}`,
          `Ship: ${params.ship}`,
          `Sail Date: ${params.sailDate}`,
          `Ports: ${params.portsText || "Not specified"}`,
          `Traveler Count: ${params.travelerCount}`,
          `Desired Activities: ${params.desiredActivitiesText || "Not specified"}`,
          `Mobility Needs: ${params.mobilityNeeds || "None specified"}`,
          `Payment Structure: ${params.paymentStructure ?? "Not specified"}`,
          `Private Transport: ${params.privateTransport ?? "Not specified"}`,
          `Negotiated Rates: ${params.negotiatedRates ?? "Not specified"}`,
          `Source Page: ${params.sourcePage}`,
          params.notes ? `Notes: ${params.notes}` : null,
        ]
          .filter(Boolean)
          .join("\n"),
      }),
      cache: "no-store",
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      return {
        attempted: true,
        delivered: false,
        destination: ownerRecipients.join(", "),
        providerMessageId: null,
        error: `resend_http_${res.status}${errBody ? `:${errBody.slice(0, 140)}` : ""}`,
      };
    }

    const parsed = (await res.json().catch(() => ({}))) as { id?: string };
    return {
      attempted: true,
      delivered: true,
      destination: ownerRecipients.join(", "),
      providerMessageId: typeof parsed.id === "string" ? parsed.id : null,
      error: null,
    };
  } catch (err) {
    return {
      attempted: true,
      delivered: false,
      destination: ownerRecipients.join(", "),
      providerMessageId: null,
      error:
        err instanceof Error
          ? `resend_exception:${err.message.slice(0, 140)}`
          : "resend_network_error",
    };
  }
}

function isSyntheticTestOrEmail(input: {
  inquiryId: string;
  isTest: boolean;
  email: string;
  organizerName: string;
  combinedText: string;
}): boolean {
  if (input.isTest) return true;
  if (SYNTHETIC_QA_ID_RE.test(input.inquiryId)) return true;
  if (SYNTHETIC_EMAIL_DOMAIN_RE.test(input.email)) return true;
  if (SYNTHETIC_QA_MARKER_RE.test(input.combinedText)) return true;
  const cls = classifyOperatorInboxSubmission({
    isTest: input.isTest,
    email: input.email,
    name: input.organizerName,
    notes: input.combinedText,
    sourceId: input.inquiryId,
  });
  return cls.classification === "test";
}

function isExplicitSyntheticQaProbe(
  inquiryId: string,
  meta: Record<string, unknown> | null,
  requestProof?: string | null,
): boolean {
  if (SYNTHETIC_QA_ID_RE.test(inquiryId) || /^gi_verify_qa_/i.test(inquiryId)) {
    return true;
  }
  if (!meta) return false;
  if (meta.isTest === true || meta.markAsTest === true) {
    return true;
  }
  if (
    typeof meta.qaCleanupToken === "string" &&
    meta.qaCleanupToken.trim().length >= 8 &&
    typeof requestProof === "string" &&
    constantTimeSecretMatch(requestProof.trim(), meta.qaCleanupToken.trim())
  ) {
    return true;
  }
  const combined = [
    meta.organizerName,
    meta.name,
    meta.notes,
    meta.message,
    meta.mobilityNeeds,
    meta.desiredActivities,
    meta.ship,
    meta.email,
  ]
    .map((v) => (Array.isArray(v) ? v.join(" ") : typeof v === "string" ? v : ""))
    .join(" \n ");
  return (
    SYNTHETIC_QA_MARKER_RE.test(combined) ||
    (typeof meta.email === "string" && SYNTHETIC_EMAIL_DOMAIN_RE.test(meta.email))
  );
}

async function lookupExistingCpFinding(
  findingId: string,
  inquiryId: string,
): Promise<{
  exists: boolean;
  findingId: string;
  metadata: Record<string, unknown>;
  notificationStatus: OperatorNotificationStatus;
} | null> {
  const dbUrl = resolveCpFindingsDatabaseUrl();
  const resendConfigured = isLiveResendConfigured();

  if (dbUrl) {
    const sql = neon(dbUrl);
    const pattern = `%:cp-group-inquiry:${inquiryId}`;
    const rows = (await sql`
      SELECT finding_id, metadata
      FROM earthos_control_map_findings
      WHERE finding_id = ${findingId}
         OR (owner = 'dcc:cp-group-inquiry' AND finding_id LIKE ${pattern})
      ORDER BY updated_at DESC
      LIMIT 1
    `) as Array<{ finding_id: string; metadata: unknown }>;
    if (Array.isArray(rows) && rows.length > 0) {
      const meta = parseMetadataObject(rows[0].metadata);
      const norm = normalizeInquiryNotificationStatus(
        "cp-group-inquiry",
        meta,
        resendConfigured,
      );
      return {
        exists: true,
        findingId: rows[0].finding_id,
        metadata: meta,
        notificationStatus: norm.notificationStatus,
      };
    }
    return null;
  }

  const inMemGuard = inProcessCpIdempotencyGuard.get(inquiryId);
  if (inMemGuard) {
    return {
      exists: true,
      findingId: inMemGuard.findingId,
      metadata: inMemGuard.metadata,
      notificationStatus: inMemGuard.notificationStatus,
    };
  }

  const inMemSub = getInMemoryTransactionalSubmissions().get(
    `cp-group-inquiry:${inquiryId}`,
  );
  if (inMemSub) {
    const norm = normalizeInquiryNotificationStatus(
      "cp-group-inquiry",
      inMemSub,
      resendConfigured,
    );
    return {
      exists: true,
      findingId:
        typeof inMemSub.findingId === "string" ? inMemSub.findingId : findingId,
      metadata: inMemSub,
      notificationStatus: norm.notificationStatus,
    };
  }

  if (
    !isServerlessRuntimeEnvironment() &&
    process.env.DCC_ISOLATED_TEST_DB !== "1"
  ) {
    try {
      if (fs.existsSync(LOCAL_DEV_SUBMISSIONS_PATH)) {
        const disk = JSON.parse(
          fs.readFileSync(LOCAL_DEV_SUBMISSIONS_PATH, "utf8"),
        ) as Record<string, Record<string, unknown>>;
        const found = disk[`cp-group-inquiry:${inquiryId}`];
        if (found) {
          const norm = normalizeInquiryNotificationStatus(
            "cp-group-inquiry",
            found,
            resendConfigured,
          );
          return {
            exists: true,
            findingId:
              typeof found.findingId === "string" ? found.findingId : findingId,
            metadata: found,
            notificationStatus: norm.notificationStatus,
          };
        }
      }
    } catch {
      // ignore local cache read failure
    }
  }

  return null;
}

export async function POST(request: Request) {
  const auth = authenticateCpServiceRequest(request);
  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, error: auth.error },
      { status: auth.status, headers: NO_STORE_HEADERS },
    );
  }

  const body = (await request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON payload." },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  const rawId =
    typeof body.id === "string" && body.id.trim()
      ? body.id.trim()
      : typeof body.inquiryId === "string" && body.inquiryId.trim()
        ? body.inquiryId.trim()
        : "";
  if (!VALID_INQUIRY_ID_RE.test(rawId)) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Invalid or missing inquiry id (expected 4–80 alphanumeric, underscore, or hyphen characters).",
      },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }
  const inquiryId = rawId;
  const itemKey = buildCpGroupInquiryItemKey(inquiryId);

  const organizerName =
    normalizeTextField(body.organizerName, 140) ||
    normalizeTextField(body.contactName, 140) ||
    normalizeTextField(body.name, 140);
  if (!organizerName) {
    return NextResponse.json(
      { ok: false, error: "Missing required field: organizerName." },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  const emailRaw =
    normalizeTextField(body.email, 180) ||
    normalizeTextField(body.contactEmail, 180);
  const email = emailRaw ? emailRaw.toLowerCase() : "";
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json(
      { ok: false, error: "Missing or invalid required field: email." },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  const phone =
    normalizeTextField(body.phone, 50) ||
    normalizeTextField(body.contactPhone, 50);

  const ship =
    normalizeTextField(body.ship, 160) ||
    normalizeTextField(body.shipName, 160);
  if (!ship) {
    return NextResponse.json(
      { ok: false, error: "Missing required field: ship." },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  const sailDate = normalizeTextField(body.sailDate, 80);
  if (!sailDate) {
    return NextResponse.json(
      { ok: false, error: "Missing required field: sailDate." },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  const rawTravelerCount = body.travelerCount ?? body.groupSize ?? body.partySize;
  const parsedTravelerCount =
    typeof rawTravelerCount === "number"
      ? rawTravelerCount
      : typeof rawTravelerCount === "string" && rawTravelerCount.trim() !== ""
        ? Number(rawTravelerCount.trim())
        : NaN;
  if (!Number.isFinite(parsedTravelerCount) || parsedTravelerCount < 1) {
    return NextResponse.json(
      {
        ok: false,
        error: "Missing or invalid required field: travelerCount.",
      },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }
  const travelerCount = Math.min(2000, Math.round(parsedTravelerCount));

  const rawTimestamp = body.submittedAt ?? body.createdAt;
  let submittedAt = new Date().toISOString();
  if (typeof rawTimestamp === "string" && rawTimestamp.trim()) {
    const parsedTs = Date.parse(rawTimestamp.trim());
    if (!Number.isFinite(parsedTs)) {
      return NextResponse.json(
        { ok: false, error: "Invalid submittedAt timestamp." },
        { status: 400, headers: NO_STORE_HEADERS },
      );
    }
    submittedAt = new Date(parsedTs).toISOString();
  }

  const portsParsed = normalizeStringOrListField(body.ports ?? body.port, 500);
  const activitiesParsed = normalizeStringOrListField(
    body.desiredActivities ?? body.activity,
    600,
  );
  const mobilityNeeds = normalizeTextField(body.mobilityNeeds, 500);
  const sourcePage =
    normalizeTextField(body.sourcePage ?? body.sourcePath, 240) ||
    "/group-cruises";
  const notes = normalizeTextField(body.notes ?? body.message, 1200);

  const paymentStructure =
    typeof body.paymentStructure === "boolean"
      ? body.paymentStructure
      : normalizeTextField(body.paymentStructure, 120);
  const privateTransport =
    typeof body.privateTransport === "boolean"
      ? body.privateTransport
      : normalizeTextField(body.privateTransport, 120);
  const negotiatedRates =
    typeof body.negotiatedRates === "boolean"
      ? body.negotiatedRates
      : normalizeTextField(body.negotiatedRates, 120);

  const explicitIsTest = body.isTest === true || body.isTest === "true";
  const isPreviewNamespace =
    String(body.namespace || body.environment || "")
      .trim()
      .toLowerCase() === "preview";
  const namespace = normalizeNamespace(
    body.namespace ?? body.environment,
    isPreviewNamespace,
  );
  const findingId = buildCpGroupInquiryFindingId(namespace, inquiryId);

  // 1. Strict idempotency check BEFORE any email dispatch or duplicate insert
  try {
    const existing = await lookupExistingCpFinding(findingId, inquiryId);
    if (existing?.exists) {
      return NextResponse.json(
        {
          ok: true,
          inquiryId,
          itemKey,
          deduplicated: true,
          durableStored: true,
          notificationStatus: existing.notificationStatus,
        },
        { status: 200, headers: NO_STORE_HEADERS },
      );
    }
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "Durable inquiry lookup is temporarily unavailable.",
      },
      { status: 503, headers: NO_STORE_HEADERS },
    );
  }

  // 2. Determine synthetic/test suppression and initial CP notification status
  const rawCpStatus =
    typeof body.cpNotificationStatus === "string"
      ? body.cpNotificationStatus.trim().toLowerCase()
      : "";
  const combinedInspectionText = [
    organizerName,
    notes,
    mobilityNeeds,
    activitiesParsed.text,
    ship,
    portsParsed.text,
  ]
    .filter(Boolean)
    .join(" \n ");

  const suppressOwnerEmail = isSyntheticTestOrEmail({
    inquiryId,
    isTest: explicitIsTest || isPreviewNamespace,
    email,
    organizerName,
    combinedText: combinedInspectionText,
  });

  // Check durable storage availability prior to computing final notificationStatus
  const dbUrl = resolveCpFindingsDatabaseUrl();
  const canPersistLocally = !isServerlessRuntimeEnvironment();
  const durableStoreAvailable = Boolean(dbUrl || canPersistLocally);

  if (!durableStoreAvailable) {
    // Neither DB nor local non-serverless store is available
    const fallbackStatus: OperatorNotificationStatus =
      rawCpStatus === "delivered"
        ? "delivered"
        : rawCpStatus === "failed"
          ? "failed"
          : "not_configured";
    return NextResponse.json(
      {
        ok: false,
        inquiryId,
        itemKey,
        durableStored: false,
        notificationStatus: fallbackStatus,
        error: "Durable operator inbox storage is not configured.",
      },
      { status: 503, headers: NO_STORE_HEADERS },
    );
  }

  // 3. First-time receipt owner email evaluation (never send to customer email!)
  let notificationStatus: OperatorNotificationStatus;
  let notificationChannel = "durable_storage_only";
  let intendedDestination = "concierge@cruisepromenade.com";
  let emailError: string | null = null;
  let emailProviderId: string | null = null;

  if (rawCpStatus === "delivered") {
    notificationStatus = "delivered";
    notificationChannel = "cp_upstream_email";
  } else if (!suppressOwnerEmail) {
    const emailAttempt = await maybeSendOwnerAlertEmailOnFirstIngest({
      inquiryId,
      submittedAt,
      organizerName,
      customerEmail: email,
      customerPhone: phone,
      ship,
      sailDate,
      portsText: portsParsed.text,
      travelerCount,
      desiredActivitiesText: activitiesParsed.text,
      mobilityNeeds,
      sourcePage,
      paymentStructure,
      privateTransport,
      negotiatedRates,
      notes,
    });
    intendedDestination = emailAttempt.destination;
    if (emailAttempt.delivered) {
      notificationStatus = "delivered";
      notificationChannel = "dcc_resend_email";
      emailProviderId = emailAttempt.providerMessageId;
    } else if (emailAttempt.attempted) {
      notificationStatus = "failed";
      notificationChannel = "dcc_resend_email";
      emailError = emailAttempt.error || "Owner alert email delivery failed.";
    } else if (rawCpStatus === "failed") {
      notificationStatus = "failed";
      notificationChannel = "cp_upstream_email";
      emailError =
        normalizeTextField(body.cpNotificationError, 200) ||
        "Cruise Promenade upstream owner email delivery failed.";
    } else if (rawCpStatus === "not_configured") {
      notificationStatus = "not_configured";
      notificationChannel = "none";
      emailError =
        "Outbound owner email provider is not configured on Cruise Promenade or DCC; inquiry preserved in durable owner inbox.";
    } else {
      notificationStatus = "durable_storage_only";
      notificationChannel = "durable_storage_only";
    }
  } else {
    // Test / synthetic probe: email intentionally suppressed; durably stored in owner inbox
    notificationStatus =
      rawCpStatus === "not_configured"
        ? "not_configured"
        : "durable_storage_only";
    notificationChannel = "durable_storage_only";
  }

  const sailingLabel = `${ship} (${sailDate})`;
  const summaryNote = `CP Group Inquiry ${inquiryId}: ${sailingLabel} · ${travelerCount} guests`;

  const qaCleanupToken = normalizeTextField(body.qaCleanupToken, 120);

  const normalizedMetadata: Record<string, unknown> = {
    id: inquiryId,
    inquiryId,
    submissionId: inquiryId,
    findingId,
    channel: "cp-group-inquiry",
    sourceSystem: "cruisepromenade",
    status: "captured",
    namespace,
    environment: namespace,
    submittedAt,
    createdAt: submittedAt,
    organizerName,
    contactName: organizerName,
    name: organizerName,
    email,
    contactEmail: email,
    phone,
    contactPhone: phone,
    ship,
    shipName: ship,
    sailDate,
    sailing: sailingLabel,
    ports: portsParsed.list.length > 0 ? portsParsed.list : portsParsed.text,
    port: portsParsed.text,
    travelerCount,
    groupSize: travelerCount,
    partySize: travelerCount,
    desiredActivities:
      activitiesParsed.list.length > 0
        ? activitiesParsed.list
        : activitiesParsed.text,
    activity: activitiesParsed.text,
    mobilityNeeds,
    sourcePage,
    paymentStructure,
    privateTransport,
    negotiatedRates,
    notes,
    isTest: explicitIsTest,
    ...(body.markAsTest === true ? { markAsTest: true } : {}),
    ...(qaCleanupToken ? { qaCleanupToken } : {}),
    trafficClass: explicitIsTest ? "test" : "production",
    cpNotificationStatus: rawCpStatus || null,
    notificationStatus,
    notificationChannel,
    intendedDestination,
    notificationDelivered: notificationStatus === "delivered",
    emailSent: notificationStatus === "delivered",
    emailProviderId,
    emailError,
  };

  // 4. Atomic persistence into earthos_control_map_findings (ON CONFLICT DO NOTHING)
  if (dbUrl) {
    try {
      const sql = neon(dbUrl);
      const metadataJson = JSON.stringify(normalizedMetadata);
      const inserted = (await sql`
        INSERT INTO earthos_control_map_findings (
          finding_id,
          status,
          severity,
          owner,
          note,
          metadata,
          created_at,
          updated_at
        )
        VALUES (
          ${findingId},
          ${"captured"},
          ${"watch"},
          ${"dcc:cp-group-inquiry"},
          ${summaryNote},
          ${metadataJson}::jsonb,
          ${submittedAt}::timestamptz,
          ${submittedAt}::timestamptz
        )
        ON CONFLICT (finding_id) DO NOTHING
        RETURNING finding_id
      `) as Array<{ finding_id: string }>;

      if (!Array.isArray(inserted) || inserted.length === 0) {
        // Concurrent duplicate raced in; fetch existing truthful status without inserting twice
        const existingRace = await lookupExistingCpFinding(
          findingId,
          inquiryId,
        );
        return NextResponse.json(
          {
            ok: true,
            inquiryId,
            itemKey,
            deduplicated: true,
            durableStored: true,
            notificationStatus:
              existingRace?.notificationStatus || notificationStatus,
          },
          { status: 200, headers: NO_STORE_HEADERS },
        );
      }

      setInMemoryTransactionalSubmission(
        "cp-group-inquiry",
        inquiryId,
        normalizedMetadata,
      );
      inProcessCpIdempotencyGuard.set(inquiryId, {
        findingId,
        inquiryId,
        itemKey,
        notificationStatus,
        metadata: normalizedMetadata,
      });

      return NextResponse.json(
        {
          ok: true,
          inquiryId,
          itemKey,
          deduplicated: false,
          durableStored: true,
          notificationStatus,
        },
        { status: 200, headers: NO_STORE_HEADERS },
      );
    } catch {
      if (isServerlessRuntimeEnvironment()) {
        return NextResponse.json(
          {
            ok: false,
            inquiryId,
            itemKey,
            durableStored: false,
            error: "Failed to persist inquiry in durable database.",
          },
          { status: 503, headers: NO_STORE_HEADERS },
        );
      }
    }
  }

  // Non-serverless local dev / isolated unit test fallback
  inProcessCpIdempotencyGuard.set(inquiryId, {
    findingId,
    inquiryId,
    itemKey,
    notificationStatus,
    metadata: normalizedMetadata,
  });
  setInMemoryTransactionalSubmission(
    "cp-group-inquiry",
    inquiryId,
    normalizedMetadata,
  );

  if (process.env.DCC_ISOLATED_TEST_DB !== "1") {
    try {
      const dir = path.dirname(LOCAL_DEV_SUBMISSIONS_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      let existing: Record<string, Record<string, unknown>> = {};
      if (fs.existsSync(LOCAL_DEV_SUBMISSIONS_PATH)) {
        existing = JSON.parse(
          fs.readFileSync(LOCAL_DEV_SUBMISSIONS_PATH, "utf8"),
        ) as Record<string, Record<string, unknown>>;
      }
      existing[`cp-group-inquiry:${inquiryId}`] = normalizedMetadata;
      fs.writeFileSync(
        LOCAL_DEV_SUBMISSIONS_PATH,
        JSON.stringify(existing, null, 2),
        "utf8",
      );
    } catch {
      // in-memory fallback remains active for local tests
    }
  }

  return NextResponse.json(
    {
      ok: true,
      inquiryId,
      itemKey,
      deduplicated: false,
      durableStored: true,
      notificationStatus,
    },
    { status: 200, headers: NO_STORE_HEADERS },
  );
}

/**
 * Authenticated synthetic QA triage/cleanup handler (`PATCH` & `DELETE`).
 * Strictly refuses (`403`) to modify or delete any non-synthetic organic customer inquiry!
 */
async function handleSyntheticQaMutation(
  request: Request,
  defaultAction: "triage" | "delete",
) {
  const auth = authenticateCpServiceRequest(request);
  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, error: auth.error },
      { status: auth.status, headers: NO_STORE_HEADERS },
    );
  }

  const url = new URL(request.url);
  const body = (await request.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;

  const rawId =
    (typeof body?.id === "string" && body.id.trim()) ||
    (typeof body?.inquiryId === "string" && body.inquiryId.trim()) ||
    (url.searchParams.get("id") || url.searchParams.get("inquiryId") || "").trim();

  if (!VALID_INQUIRY_ID_RE.test(rawId)) {
    return NextResponse.json(
      { ok: false, error: "Valid inquiry id is required." },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  const inquiryId = rawId;
  const itemKey = buildCpGroupInquiryItemKey(inquiryId);
  const defaultFindingId = buildCpGroupInquiryFindingId("production", inquiryId);

  const existing = await lookupExistingCpFinding(defaultFindingId, inquiryId);
  if (!existing?.exists) {
    return NextResponse.json(
      { ok: false, error: "Inquiry record not found." },
      { status: 404, headers: NO_STORE_HEADERS },
    );
  }

  const requestProof =
    typeof body?.qaCleanupToken === "string"
      ? body.qaCleanupToken
      : url.searchParams.get("qaCleanupToken");

  // Strictly enforce synthetic-only boundary: NEVER allow modifying or deleting organic customer rows
  if (!isExplicitSyntheticQaProbe(inquiryId, existing.metadata, requestProof)) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Forbidden: only synthetic QA probe inquiries (gi_qa_* or [QA-SYNTHETIC]) may be mutated or cleaned up via internal endpoint.",
      },
      { status: 403, headers: NO_STORE_HEADERS },
    );
  }

  const requestedAction =
    body?.action === "delete" || defaultAction === "delete"
      ? "delete"
      : "triage";

  const dbUrl = resolveCpFindingsDatabaseUrl();

  if (requestedAction === "delete") {
    if (dbUrl) {
      const sql = neon(dbUrl);
      const pattern = `%:cp-group-inquiry:${inquiryId}`;
      await sql`
        DELETE FROM earthos_control_map_findings
        WHERE (finding_id = ${existing.findingId} OR (owner = 'dcc:cp-group-inquiry' AND finding_id LIKE ${pattern}))
      `;
    }

    inProcessCpIdempotencyGuard.delete(inquiryId);
    removeInMemoryTransactionalSubmission("cp-group-inquiry", inquiryId);

    if (
      !isServerlessRuntimeEnvironment() &&
      process.env.DCC_ISOLATED_TEST_DB !== "1"
    ) {
      try {
        if (fs.existsSync(LOCAL_DEV_SUBMISSIONS_PATH)) {
          const disk = JSON.parse(
            fs.readFileSync(LOCAL_DEV_SUBMISSIONS_PATH, "utf8"),
          ) as Record<string, Record<string, unknown>>;
          delete disk[`cp-group-inquiry:${inquiryId}`];
          fs.writeFileSync(
            LOCAL_DEV_SUBMISSIONS_PATH,
            JSON.stringify(disk, null, 2),
            "utf8",
          );
        }
      } catch {
        // ignore
      }
    }

    return NextResponse.json(
      {
        ok: true,
        action: "deleted",
        inquiryId,
        itemKey,
      },
      { status: 200, headers: NO_STORE_HEADERS },
    );
  }

  // Otherwise mark synthetic inquiry as isTest: true and apply archived triage overlay
  const markAsTest = body?.isTest !== undefined ? Boolean(body.isTest) : true;
  const requestedStatusRaw =
    typeof body?.status === "string"
      ? body.status.trim()
      : typeof body?.triageStatus === "string"
        ? body.triageStatus.trim()
        : "archived";
  const triageStatus: OperatorTriageStatus = isValidOperatorTriageStatus(
    requestedStatusRaw,
  )
    ? requestedStatusRaw
    : "archived";
  const operatorNote =
    typeof body?.operatorNote === "string" && body.operatorNote.trim()
      ? body.operatorNote.trim().slice(0, 500)
      : "Synthetic QA probe verified and archived.";

  const updatedMetadata: Record<string, unknown> = {
    ...existing.metadata,
    isTest: markAsTest,
    trafficClass: markAsTest ? "test" : "production",
    updatedAt: new Date().toISOString(),
  };

  if (dbUrl) {
    const sql = neon(dbUrl);
    const metadataJson = JSON.stringify(updatedMetadata);
    await sql`
      UPDATE earthos_control_map_findings
      SET metadata = ${metadataJson}::jsonb,
          updated_at = NOW()
      WHERE finding_id = ${existing.findingId}
         AND owner = 'dcc:cp-group-inquiry'
    `;
  }

  setInMemoryTransactionalSubmission(
    "cp-group-inquiry",
    inquiryId,
    updatedMetadata,
  );
  inProcessCpIdempotencyGuard.set(inquiryId, {
    findingId: existing.findingId,
    inquiryId,
    itemKey,
    notificationStatus: existing.notificationStatus,
    metadata: updatedMetadata,
  });

  if (
    !isServerlessRuntimeEnvironment() &&
    process.env.DCC_ISOLATED_TEST_DB !== "1"
  ) {
    try {
      if (fs.existsSync(LOCAL_DEV_SUBMISSIONS_PATH)) {
        const disk = JSON.parse(
          fs.readFileSync(LOCAL_DEV_SUBMISSIONS_PATH, "utf8"),
        ) as Record<string, Record<string, unknown>>;
        disk[`cp-group-inquiry:${inquiryId}`] = updatedMetadata;
        fs.writeFileSync(
          LOCAL_DEV_SUBMISSIONS_PATH,
          JSON.stringify(disk, null, 2),
          "utf8",
        );
      }
    } catch {
      // ignore
    }
  }

  const triageSaved = await saveOperatorInboxTriageOverlay({
    itemKey,
    triageStatus,
    operatorNote,
    updatedBy: "service:cp-qa-cleanup",
    isTest: markAsTest,
  });

  return NextResponse.json(
    {
      ok: true,
      action: "triaged_synthetic_qa",
      inquiryId,
      itemKey,
      isTest: markAsTest,
      triageStatus,
      triagePersisted: triageSaved.ok,
    },
    { status: 200, headers: NO_STORE_HEADERS },
  );
}

export async function PATCH(request: Request) {
  return handleSyntheticQaMutation(request, "triage");
}

export async function DELETE(request: Request) {
  return handleSyntheticQaMutation(request, "delete");
}
