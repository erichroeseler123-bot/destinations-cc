import { NextResponse } from "next/server";
import { submitOperatorOnboardingApplication } from "@/lib/dcc/operatorOnboardingStore";
import { persistDurableTransactionalSubmission } from "@/lib/dcc/storage/transactionalSubmissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate",
};

const FORBIDDEN_SECRET_FIELD_RE =
  /^(?:api[_-]?key|secret|api[_-]?secret|client[_-]?secret|password|bearer[_-]?token|access[_-]?token|private[_-]?key)$/i;

const SYNTHETIC_TEST_EMAIL_RE =
  /@(?:example\.(?:com|org|net)|command\.com|test\.com|localhost)$|\.invalid$/i;

const TEST_PROBE_TEXT_RE =
  /\[TEST\]|\[PREVIEW[-_\s]?TEST\]|\[PROD-VERIFICATION-TEST\]|\bplaywright\b|\be2e\s+concierge\s+audit\s+test\b|\bsmoke[-_]?test\b|(?:^|[\s:_-])qa-[a-z0-9_-]*/i;

function slugifyDestination(raw: string): string {
  const cleaned = raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return cleaned || "unspecified-port";
}

function isValidHttpUrl(raw: string): boolean {
  try {
    const parsed = new URL(raw);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function detectDirectOperatorApplicationIsTest(input: {
  operatorName: string;
  destinationPort: string;
  contactName: string;
  contactEmail: string;
  notes?: string;
}): boolean {
  if (SYNTHETIC_TEST_EMAIL_RE.test(input.contactEmail.trim())) {
    return true;
  }
  const combined = [
    input.operatorName,
    input.destinationPort,
    input.contactName,
    input.notes || "",
  ].join(" ");
  return TEST_PROBE_TEXT_RE.test(combined);
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body." },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  for (const [key, val] of Object.entries(body)) {
    if (FORBIDDEN_SECRET_FIELD_RE.test(key.trim()) && val) {
      return NextResponse.json(
        {
          ok: false,
          errorCode: "public_secret_submission_forbidden",
          error:
            "Do not submit API keys, tokens, or secrets through public forms. Credentials are arranged securely after review.",
        },
        { status: 400, headers: NO_STORE_HEADERS },
      );
    }
  }

  const operatorName = String(
    body.operatorName || body.companyName || "",
  ).trim();
  const destinationPort = String(
    body.destinationPort || body.destinations || body.destinationSlug || "",
  ).trim();
  const bookingSystem = String(body.bookingSystem || "").trim();
  const contactName = String(body.contactName || "").trim();
  const contactEmail = String(
    body.contactEmail || body.businessEmail || "",
  ).trim();
  const notes = body.notes ? String(body.notes).trim().slice(0, 2000) : "";
  const rawCheckoutUrl = String(
    body.existingCheckoutLink || body.websiteUrl || body.website || "",
  ).trim();
  const rawTourOption = String(body.exactTourOption || "").trim();

  if (
    !operatorName ||
    !destinationPort ||
    !bookingSystem ||
    !contactName ||
    !contactEmail
  ) {
    return NextResponse.json(
      {
        ok: false,
        errorCode: "missing_required_fields",
        error:
          "Operator Name, Destination / Port, Booking System, Contact Name, and Contact Email are required.",
      },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
    return NextResponse.json(
      {
        ok: false,
        errorCode: "invalid_contact_email",
        error: "Please enter a valid business email address.",
      },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  const existingCheckoutLink = isValidHttpUrl(rawCheckoutUrl)
    ? rawCheckoutUrl
    : "https://www.destinationcommandcenter.com/partners/direct-operators#checkout-link-pending";
  const exactTourOption =
    rawTourOption || `${destinationPort} Direct Operator Inventory (${bookingSystem})`;
  const destinationSlug = slugifyDestination(destinationPort);

  const isTest = detectDirectOperatorApplicationIsTest({
    operatorName,
    destinationPort,
    contactName,
    contactEmail,
    notes,
  });

  const onboardingResult = await submitOperatorOnboardingApplication({
    onboardingPath: "send_guests_to_checkout",
    operatorName,
    contactName,
    businessEmail: contactEmail,
    contactEmail,
    bookingSystem,
    destinationSlug,
    exactTourOption,
    existingCheckoutLink,
    notes: notes || undefined,
  });

  if (!onboardingResult.ok) {
    return NextResponse.json(
      {
        ok: false,
        errorCode: onboardingResult.errorCode,
        error: onboardingResult.message,
      },
      { status: onboardingResult.status, headers: NO_STORE_HEADERS },
    );
  }

  // Also persist into the unified operator inbox (`earthos_control_map_findings`) with explicit `isTest` detection
  const inboxSubmission = await persistDurableTransactionalSubmission({
    submissionId: onboardingResult.applicationId,
    channel: "request-invite",
    status: "pending_review",
    severity: onboardingResult.priorOutreachFlag ? "high" : "watch",
    isTest,
    summaryNote: `${isTest ? "[TEST] " : ""}Direct Operator 10% Application: ${operatorName} (${destinationPort} · ${bookingSystem})`,
    payload: {
      name: contactName,
      email: contactEmail,
      company: operatorName,
      destinationPort,
      destinationSlug,
      bookingSystem,
      checkoutLinkProvided: isValidHttpUrl(rawCheckoutUrl)
        ? rawCheckoutUrl
        : null,
      notes: notes || null,
      applicationId: onboardingResult.applicationId,
      onboardingFindingId: onboardingResult.findingId,
      status: "pending_review",
      reviewQueueState: onboardingResult.reviewQueueState,
      liveAuthorized: false,
      salesAuthorized: false,
      proposedDirectCommissionPercent: 10,
      proposedMachineCommissionPercent: 5,
      sourcePath: "/partners/direct-operators",
      is_test: isTest,
    },
  });

  return NextResponse.json(
    {
      ok: true,
      status: "pending_review" as const,
      reviewQueueState: onboardingResult.reviewQueueState,
      liveAuthorized: false as const,
      salesAuthorized: false as const,
      commercialTermsSigned: false as const,
      applicationId: onboardingResult.applicationId,
      findingId: onboardingResult.findingId,
      inboxFindingId: inboxSubmission.findingId,
      inboxPersisted: inboxSubmission.persisted,
      isTest,
      proposedRates: {
        dccSourcedDirectPercent: 10,
        machineDistributedPercent: 5,
        setupFeeUsd: 0,
        weatherOrSearchFeePercent: 0,
      },
      priorOutreachFlag: onboardingResult.priorOutreachFlag,
      requiredVerificationGatesBeforeCutover:
        onboardingResult.requiredVerificationGatesBeforeCutover,
      submittedAt: onboardingResult.submittedAt,
    },
    { status: 201, headers: NO_STORE_HEADERS },
  );
}
