import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  getAdminActorLabel,
  isValidAdminSession,
} from "@/lib/adminAccess";
import {
  fetchHostedCruisesAdminSnapshotFromCp,
  sendHostedCruisesAdminActionToCp,
} from "@/lib/dcc/hostedCruisesAdminBridge";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
  "X-Robots-Tag": "noindex, nofollow",
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

async function authorizeAdminHostedCruisesCaller(
  request: Request,
): Promise<{ authorized: true; actor: string } | { authorized: false }> {
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

  const configuredSecrets = [
    { label: "admin_key", value: (process.env.ADMIN_ACCESS_KEY || "").trim() },
    { label: "earthos_admin", value: (process.env.EARTHOS_ADMIN_KEY || "").trim() },
    { label: "internal_secret", value: (process.env.INTERNAL_API_SECRET || "").trim() },
    { label: "commerce_admin", value: (process.env.DCC_COMMERCE_ADMIN_SECRET || "").trim() },
  ].filter((entry) => entry.value.length > 0);

  for (const secret of configuredSecrets) {
    if (constantTimeEquals(candidate, secret.value)) {
      return {
        authorized: true,
        actor: `header:${secret.label}`,
      };
    }
  }

  return { authorized: false };
}

export async function GET(request: Request) {
  const auth = await authorizeAdminHostedCruisesCaller(request);
  if (!auth.authorized) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401, headers: NO_STORE_HEADERS },
    );
  }

  const url = new URL(request.url);
  const probeResend = url.searchParams.get("probeResend") !== "0";
  const cpBaseUrlOverride = url.searchParams.get("cpTarget");
  const rollcallBaseUrlOverride = url.searchParams.get("rcTarget");

  const result = await fetchHostedCruisesAdminSnapshotFromCp({
    probeResend,
    cpBaseUrlOverride,
    rollcallBaseUrlOverride,
  });

  return NextResponse.json(result, {
    status: result.ok ? 200 : 502,
    headers: NO_STORE_HEADERS,
  });
}

export async function POST(request: Request) {
  const auth = await authorizeAdminHostedCruisesCaller(request);
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

  const cpBaseUrlOverride =
    typeof body.cpTarget === "string" ? body.cpTarget : null;
  const rollcallBaseUrlOverride =
    typeof body.rcTarget === "string" ? body.rcTarget : null;

  const result = await sendHostedCruisesAdminActionToCp(body, {
    cpBaseUrlOverride,
    rollcallBaseUrlOverride,
  });

  return NextResponse.json(result, {
    status: result.ok ? 200 : 400,
    headers: NO_STORE_HEADERS,
  });
}
