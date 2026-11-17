import { NextResponse } from "next/server";
import {
  GET as dccClaimsGet,
  PATCH as dccClaimsPatch,
} from "@/app/api/v1/new-orleans/claims/route";
import { submitNewOrleansOperatorClaim } from "@/lib/dcc/new-orleans/operatorClaimsGovernance";
import { isPreviewOrLocalRuntime } from "@/lib/dcc/commercialAttribution";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
  "X-Robots-Tag": "noindex, nofollow",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export { dccClaimsGet as GET, dccClaimsPatch as PATCH };

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

  const previewRuntime = isPreviewOrLocalRuntime(request);
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
    isTest: Boolean(body.isTest || previewRuntime),
  });

  if ("error" in result) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: result.status, headers: NO_STORE_HEADERS },
    );
  }

  let durablePersisted = result.record.durablePersisted;
  let durableBackend = result.record.durableBackend;

  // Standalone WNO Vercel container fallback when DATABASE_URL lives only on DCC:
  // forward to DCC specialist-inquiries durable ingest with notificationStatus=skipped_disabled
  // so zero automatic emails/notifications are sent while guaranteeing Postgres durability.
  if (!durablePersisted) {
    const dccBase = (
      process.env.DCC_SPECIALIST_INQUIRY_INGEST_URL ||
      process.env.DCC_API_BASE_URL ||
      process.env.NEXT_PUBLIC_DCC_API_URL ||
      "https://www.destinationcommandcenter.com"
    )
      .trim()
      .replace(/\/+$/, "");

    const upstreamHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      "x-specialist-origin-host":
        request.headers.get("host") || "welcometoneworleanstours.vercel.app",
    };
    const internalAuthSecret = (
      process.env.DCC_INTERNAL_API_SECRET ||
      process.env.INTERNAL_API_SECRET ||
      process.env.ADMIN_ACCESS_KEY ||
      ""
    ).trim();
    if (internalAuthSecret) {
      upstreamHeaders["x-admin-access-key"] = internalAuthSecret;
      upstreamHeaders["x-internal-secret"] = internalAuthSecret;
      upstreamHeaders.Authorization = `Bearer ${internalAuthSecret}`;
    }

    try {
      const upstreamRes = await fetch(
        `${dccBase}/api/internal/specialist-inquiries`,
        {
          method: "POST",
          headers: upstreamHeaders,
          body: JSON.stringify({
            channel: "welcometoneworleanstours-inquiry",
            submissionId: result.record.claimSubmissionId,
            name: contactName,
            email,
            phone,
            headline: `[New Orleans Operator Claim] ${result.record.operatorName} (${result.record.assessment.verificationMethod})`,
            partySize: 1,
            routeOrLocation: result.record.operatorId,
            notes: `Role: ${roleTitle} · Direct API requested: ${result.record.requestDirectApiConnection} · Handle: ${result.record.bookingSystemIdentifier || "none"} · Live/Checkout active: false`,
            sourcePath: result.record.sourcePage,
            environment: previewRuntime ? "preview" : result.record.environment,
            namespace: previewRuntime ? "preview" : "production",
            isTest: result.record.isTest,
            notificationStatus: "skipped_disabled",
          }),
          cache: "no-store",
        },
      );
      const upstreamJson = (await upstreamRes.json().catch(() => null)) as {
        ok?: boolean;
        persisted?: boolean;
        backend?: string;
      } | null;
      if (upstreamRes.ok && upstreamJson?.ok && upstreamJson.persisted) {
        durablePersisted = true;
        durableBackend = upstreamJson.backend || "dcc_remote_postgres";
      }
    } catch {
      // Preserve local result if upstream is unreachable in offline test
    }
  }

  return NextResponse.json(
    {
      ok: true,
      claimSubmissionId: result.record.claimSubmissionId,
      durablePersisted,
      durableBackend,
      verificationMethod: result.record.assessment.verificationMethod,
      verificationSummary: result.record.assessment.summary,
      liveAvailabilityActive: false,
      directCheckout10PctActive: false,
      automaticNotificationsSent: false,
      message:
        "Free operator profile claim durably saved. Business control verification and any requested API connection require owner review before activation.",
    },
    { status: 201, headers: NO_STORE_HEADERS },
  );
}
