import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  authorizeControlCenterCaller,
} from "@/lib/adminAccess";
import {
  listStoredNewOrleansOperatorClaims,
  reviewNewOrleansOperatorClaimByOwner,
  submitNewOrleansOperatorClaim,
} from "@/lib/dcc/new-orleans/operatorClaimsGovernance";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
  "X-Robots-Tag": "noindex, nofollow",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function readAdminCookie(): Promise<string | null> {
  try {
    const store = await cookies();
    return store.get(ADMIN_SESSION_COOKIE)?.value || null;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const auth = await authorizeControlCenterCaller(
    request,
    await readAdminCookie(),
  );
  if (!auth.authorized) {
    return NextResponse.json(
      { ok: false, error: "UNAUTHORIZED" },
      { status: 401, headers: NO_STORE_HEADERS },
    );
  }
  const { searchParams } = new URL(request.url);
  const includeTest = searchParams.get("includeTest") !== "0";
  const claims = listStoredNewOrleansOperatorClaims({ includeTest });
  return NextResponse.json(
    {
      ok: true,
      count: claims.length,
      claims,
    },
    { status: 200, headers: NO_STORE_HEADERS },
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON payload." },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  if (typeof body.website === "string" && body.website.trim().length > 0) {
    return NextResponse.json(
      { ok: false, error: "Invalid submission." },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  const operatorLookup = String(
    body.operatorSlug || body.operatorId || "",
  ).trim();
  const contactName = String(body.contactName || body.name || "").trim();
  const roleTitle = String(body.roleTitle || "Representative").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const phone =
    typeof body.phone === "string" && body.phone.trim()
      ? body.phone.trim()
      : null;

  if (!operatorLookup) {
    return NextResponse.json(
      { ok: false, error: "operatorSlug or operatorId is required." },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }
  if (contactName.length < 2) {
    return NextResponse.json(
      { ok: false, error: "Contact name must be at least 2 characters." },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json(
      { ok: false, error: "A valid business email address is required." },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  const result = await submitNewOrleansOperatorClaim({
    operatorSlugOrId: operatorLookup,
    contactName,
    roleTitle,
    email,
    phone,
    requestDirectApiConnection: Boolean(body.requestDirectApiConnection),
    bookingSystemIdentifier:
      typeof body.bookingSystemIdentifier === "string"
        ? body.bookingSystemIdentifier.trim()
        : null,
    notes: typeof body.notes === "string" ? body.notes.trim() : null,
    sourcePage:
      typeof body.sourcePage === "string" ? body.sourcePage.trim() : null,
    isTest: Boolean(body.isTest),
  });

  if ("error" in result) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: result.status, headers: NO_STORE_HEADERS },
    );
  }

  return NextResponse.json(
    {
      ok: true,
      claimSubmissionId: result.record.claimSubmissionId,
      durablePersisted: result.record.durablePersisted,
      durableBackend: result.record.durableBackend,
      verificationMethod: result.record.assessment.verificationMethod,
      verificationSummary: result.record.assessment.summary,
      liveAvailabilityActive: result.record.liveAvailabilityActive,
      directCheckout10PctActive: result.record.directCheckout10PctActive,
      automaticNotificationsSent: result.record.automaticNotificationsSent,
      message:
        "Free operator profile claim durably saved. Business control verification and any requested API connection require owner review before activation. No automatic outreach or operator messages were sent.",
    },
    { status: 201, headers: NO_STORE_HEADERS },
  );
}

export async function PATCH(request: Request) {
  const auth = await authorizeControlCenterCaller(
    request,
    await readAdminCookie(),
  );
  if (!auth.authorized) {
    return NextResponse.json(
      { ok: false, error: "UNAUTHORIZED" },
      { status: 401, headers: NO_STORE_HEADERS },
    );
  }

  const body = (await request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  if (!body) {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON payload." },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  const claimSubmissionId = String(body.claimSubmissionId || "").trim();
  const decisionRaw = String(body.decision || "").trim();
  if (
    decisionRaw !== "verify_claim_only" &&
    decisionRaw !== "approve_direct_integration_and_10pct_terms" &&
    decisionRaw !== "reject"
  ) {
    return NextResponse.json(
      { ok: false, error: "Invalid owner decision." },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  const updated = reviewNewOrleansOperatorClaimByOwner({
    claimSubmissionId,
    ownerActor: "owner:erich",
    decision: decisionRaw,
    commercialTermsSigned10Pct: body.commercialTermsSigned10Pct === true,
    ownerNotes:
      typeof body.ownerNotes === "string" ? body.ownerNotes.trim() : null,
  });

  if ("error" in updated) {
    return NextResponse.json(
      { ok: false, error: updated.error },
      { status: updated.status, headers: NO_STORE_HEADERS },
    );
  }

  return NextResponse.json(
    { ok: true, claim: updated.record },
    { status: 200, headers: NO_STORE_HEADERS },
  );
}
