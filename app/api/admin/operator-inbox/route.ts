import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  getAdminActorLabel,
  isValidAdminSession,
} from "@/lib/adminAccess";
import {
  getUnifiedOperatorInbox,
  isValidOperatorTriageStatus,
  saveOperatorInboxTriageOverlay,
  validateCpBaseUrlOverride,
} from "@/lib/dcc/operatorInbox";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
};

function constantTimeEquals(a: string, b: string): boolean {
  if (!a || !b) return false;
  const digestA = createHash("sha256").update(a).digest();
  const digestB = createHash("sha256").update(b).digest();
  return timingSafeEqual(digestA, digestB);
}

function readCookieFromHeader(
  cookieHeader: string | null,
  cookieName: string,
): string | null {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(";");
  for (const part of parts) {
    const idx = part.indexOf("=");
    if (idx <= 0) continue;
    const key = part.slice(0, idx).trim();
    if (key === cookieName) {
      return decodeURIComponent(part.slice(idx + 1).trim());
    }
  }
  return null;
}

async function authorizeAdminInboxCaller(
  request: Request,
): Promise<{ authorized: true; actor: string } | { authorized: false }> {
  // 1. Check ADMIN_SESSION_COOKIE from request header first (works in both Next runtime and unit tests),
  // then Next cookies() store as fallback.
  let sessionCookie = readCookieFromHeader(
    request.headers.get("cookie"),
    ADMIN_SESSION_COOKIE,
  );
  if (!sessionCookie) {
    try {
      const store = await cookies();
      sessionCookie = store.get(ADMIN_SESSION_COOKIE)?.value || null;
    } catch {
      sessionCookie = null;
    }
  }

  if (sessionCookie && isValidAdminSession(sessionCookie)) {
    return {
      authorized: true,
      actor: getAdminActorLabel(sessionCookie),
    };
  }

  // 2. Check header secret with constant-time comparison
  const bearerRaw = request.headers.get("authorization") || "";
  const bearerToken = /^Bearer\s+/i.test(bearerRaw)
    ? bearerRaw.replace(/^Bearer\s+/i, "").trim()
    : "";
  const candidate = (
    request.headers.get("x-dcc-admin-key") ||
    request.headers.get("x-dcc-internal-key") ||
    bearerToken ||
    ""
  ).trim();

  if (!candidate) {
    return { authorized: false };
  }

  const configuredSecrets: Array<{ label: string; value: string }> = [
    { label: "admin_key", value: (process.env.ADMIN_ACCESS_KEY || "").trim() },
    {
      label: "earthos_admin",
      value: (process.env.EARTHOS_ADMIN_KEY || "").trim(),
    },
    {
      label: "internal_secret",
      value: (process.env.INTERNAL_API_SECRET || "").trim(),
    },
    {
      label: "commerce_admin",
      value: (process.env.DCC_COMMERCE_ADMIN_SECRET || "").trim(),
    },
  ].filter((entry) => entry.value.length > 0);

  let matchedLabel: string | null = null;
  for (const secret of configuredSecrets) {
    if (constantTimeEquals(candidate, secret.value)) {
      matchedLabel = secret.label;
    }
  }

  if (matchedLabel) {
    return {
      authorized: true,
      actor: `header:${matchedLabel}`,
    };
  }

  return { authorized: false };
}

export async function GET(request: Request) {
  const auth = await authorizeAdminInboxCaller(request);
  if (!auth.authorized) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401, headers: NO_STORE_HEADERS },
    );
  }

  const url = new URL(request.url);
  const view = url.searchParams.get("view");
  const site = url.searchParams.get("site");
  const status = url.searchParams.get("status");
  const rawCpPreviewUrl =
    url.searchParams.get("cpPreviewUrl") ||
    request.headers.get("x-cp-preview-url");

  const cpUrlCheck = validateCpBaseUrlOverride(rawCpPreviewUrl);
  if (!cpUrlCheck.valid) {
    return NextResponse.json(
      { ok: false, error: cpUrlCheck.error },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  const cpAdminKey = request.headers.get("x-cp-admin-key")?.trim() || null;
  const cpVercelProtectionBypass =
    request.headers.get("x-cp-vercel-bypass")?.trim() || null;

  const inbox = await getUnifiedOperatorInbox({
    view,
    site,
    status,
    cpPreviewUrl: cpUrlCheck.url,
    cpAdminKey,
    cpVercelProtectionBypass,
  });

  return NextResponse.json(inbox, {
    status: 200,
    headers: NO_STORE_HEADERS,
  });
}

export async function POST(request: Request) {
  const auth = await authorizeAdminInboxCaller(request);
  if (!auth.authorized) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401, headers: NO_STORE_HEADERS },
    );
  }

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

  const itemKey = typeof body.itemKey === "string" ? body.itemKey.trim() : "";
  const triageStatus = body.triageStatus;
  const rawNote = body.operatorNote;
  const isTest = Boolean(body.isTest);

  if (!itemKey || itemKey.length > 220) {
    return NextResponse.json(
      { ok: false, error: "Valid itemKey is required." },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  if (!isValidOperatorTriageStatus(triageStatus)) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "triageStatus must be one of: new, in_review, contacted, resolved, archived.",
      },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  if (
    rawNote !== undefined &&
    rawNote !== null &&
    (typeof rawNote !== "string" || rawNote.length > 500)
  ) {
    return NextResponse.json(
      {
        ok: false,
        error: "operatorNote must be a string up to 500 characters.",
      },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  const saved = await saveOperatorInboxTriageOverlay({
    itemKey,
    triageStatus,
    operatorNote: typeof rawNote === "string" ? rawNote : null,
    updatedBy: auth.actor,
    isTest,
  });

  if (!saved.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: saved.error || "Failed to persist operator triage state.",
      },
      { status: 503, headers: NO_STORE_HEADERS },
    );
  }

  return NextResponse.json(
    {
      ok: true,
      backend: saved.backend,
      triage: saved.overlay,
    },
    { status: 200, headers: NO_STORE_HEADERS },
  );
}
