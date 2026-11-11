import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  getAdminActorLabel,
  isValidAdminSession,
} from "@/lib/adminAccess";
import { buildOwnerControlCenterSnapshot } from "@/lib/dcc/ownerControlCenter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE_NOINDEX_HEADERS = {
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

export async function authorizeControlCenterCaller(
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
    request.headers.get("x-admin-access-key") ||
    request.headers.get("x-dcc-internal-secret") ||
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
      label: "dcc_internal_secret",
      value: (process.env.DCC_INTERNAL_API_SECRET || "").trim(),
    },
    {
      label: "commerce_admin",
      value: (process.env.DCC_COMMERCE_ADMIN_SECRET || "").trim(),
    },
  ];

  for (const entry of configuredSecrets) {
    if (entry.value && constantTimeEquals(candidate, entry.value)) {
      return {
        authorized: true,
        actor: entry.label,
      };
    }
  }

  return { authorized: false };
}

export async function GET(request: Request) {
  const auth = await authorizeControlCenterCaller(request);
  if (!auth.authorized) {
    return NextResponse.json(
      {
        ok: false,
        error: "UNAUTHORIZED",
        message: "Valid admin session or internal secret required.",
      },
      { status: 401, headers: NO_STORE_NOINDEX_HEADERS },
    );
  }

  const snapshot = await buildOwnerControlCenterSnapshot();
  return NextResponse.json(
    {
      ...snapshot,
      actor: auth.actor,
    },
    { status: 200, headers: NO_STORE_NOINDEX_HEADERS },
  );
}
