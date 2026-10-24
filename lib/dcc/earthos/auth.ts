import { NextResponse } from "next/server";
import { cookies, headers as nextHeaders } from "next/headers";
import {
  ADMIN_SESSION_COOKIE,
  getAdminActorLabel,
  isValidAdminAccessKey,
  isValidAdminSession,
} from "@/lib/adminAccess";
import { verifyServiceRequestHeaders } from "@/lib/dcc/auth/hmac-service-auth";

export type EarthOSAuthResult = {
  authorized: boolean;
  actor: string | null;
  method:
    | "admin_session"
    | "admin_access_key"
    | "internal_secret"
    | "earthos_api_key"
    | "cron_secret"
    | "hmac_service"
    | null;
  statusCode: 200 | 401 | 403 | 429;
  error?: string;
};

function readBearerToken(authHeader: string | null | undefined): string {
  if (!authHeader) return "";
  if (!authHeader.toLowerCase().startsWith("bearer ")) return "";
  return authHeader.slice(7).trim();
}

function parseCookieHeader(cookieHeader: string | null | undefined, cookieName: string): string | null {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(";");
  for (const part of parts) {
    const [rawKey, ...rest] = part.trim().split("=");
    if (rawKey === cookieName) {
      return decodeURIComponent(rest.join("=").trim());
    }
  }
  return null;
}

function matchesConfiguredSecret(candidate: string | null | undefined, expectedEnvValue: string | undefined): boolean {
  const expected = expectedEnvValue?.trim() || "";
  const actual = candidate?.trim() || "";
  return Boolean(expected) && actual.length > 0 && actual === expected;
}

export async function verifyEarthOSAuthorization(
  request?: Request | null,
  explicitToken?: string | null,
): Promise<EarthOSAuthResult> {
  // 1. Check explicit token if provided (e.g., server action or programmatic caller with key/session)
  if (explicitToken) {
    if (isValidAdminSession(explicitToken)) {
      return {
        authorized: true,
        actor: getAdminActorLabel(explicitToken),
        method: "admin_session",
        statusCode: 200,
      };
    }
    if (isValidAdminAccessKey(explicitToken)) {
      return {
        authorized: true,
        actor: "admin:access-key",
        method: "admin_access_key",
        statusCode: 200,
      };
    }
    if (matchesConfiguredSecret(explicitToken, process.env.INTERNAL_API_SECRET)) {
      return {
        authorized: true,
        actor: "internal:secret",
        method: "internal_secret",
        statusCode: 200,
      };
    }
    if (
      matchesConfiguredSecret(explicitToken, process.env.EARTHOS_API_KEY) ||
      matchesConfiguredSecret(explicitToken, process.env.EARTHOS_ADMIN_KEY)
    ) {
      return {
        authorized: true,
        actor: "earthos:api-key",
        method: "earthos_api_key",
        statusCode: 200,
      };
    }
  }

  // 2. Check Request object headers & cookies if provided
  if (request) {
    const reqHeaders = request.headers;
    if (reqHeaders.get("x-dcc-signature") || reqHeaders.get("x-dcc-key-id")) {
      const url = new URL(request.url);
      const hmacResult = verifyServiceRequestHeaders({
        headers: reqHeaders,
        method: request.method,
        pathname: url.pathname,
        searchParams: url.searchParams,
      });
      if (!hmacResult.authorized) {
        return {
          authorized: false,
          actor: null,
          method: null,
          statusCode: hmacResult.statusCode || 401,
          error: hmacResult.error || "earthos_unauthorized",
        };
      }
      return {
        authorized: true,
        actor: `service:${reqHeaders.get("x-dcc-key-id") || "hmac"}`,
        method: "hmac_service",
        statusCode: 200,
      };
    }

    const internalSecretHeader = reqHeaders.get("x-internal-secret");
    const adminKeyHeader = reqHeaders.get("x-admin-access-key") || reqHeaders.get("x-earthos-admin-key");
    const earthosKeyHeader = reqHeaders.get("x-earthos-api-key");
    const bearer = readBearerToken(reqHeaders.get("authorization"));

    if (
      matchesConfiguredSecret(internalSecretHeader, process.env.INTERNAL_API_SECRET) ||
      matchesConfiguredSecret(bearer, process.env.INTERNAL_API_SECRET)
    ) {
      return {
        authorized: true,
        actor: "internal:secret",
        method: "internal_secret",
        statusCode: 200,
      };
    }

    if (matchesConfiguredSecret(bearer, process.env.CRON_SECRET)) {
      const method = (request.method || "GET").toUpperCase();
      let pathname = "";
      try {
        pathname = new URL(request.url).pathname;
      } catch {
        pathname = "";
      }
      if (method !== "GET" || (pathname && pathname !== "/api/internal/earthos/reference-maintenance")) {
        return {
          authorized: false,
          actor: "vercel:cron",
          method: "cron_secret",
          statusCode: 403,
          error: "scheduled_detection_cannot_mutate_or_approve",
        };
      }
      return {
        authorized: true,
        actor: "vercel:cron",
        method: "cron_secret",
        statusCode: 200,
      };
    }

    if (
      matchesConfiguredSecret(earthosKeyHeader, process.env.EARTHOS_API_KEY) ||
      matchesConfiguredSecret(bearer, process.env.EARTHOS_API_KEY) ||
      matchesConfiguredSecret(adminKeyHeader, process.env.EARTHOS_ADMIN_KEY) ||
      matchesConfiguredSecret(bearer, process.env.EARTHOS_ADMIN_KEY)
    ) {
      return {
        authorized: true,
        actor: "earthos:api-key",
        method: "earthos_api_key",
        statusCode: 200,
      };
    }

    if (isValidAdminAccessKey(adminKeyHeader) || isValidAdminAccessKey(bearer)) {
      return {
        authorized: true,
        actor: "admin:access-key",
        method: "admin_access_key",
        statusCode: 200,
      };
    }

    const cookieSession = parseCookieHeader(reqHeaders.get("cookie"), ADMIN_SESSION_COOKIE);
    if (isValidAdminSession(cookieSession)) {
      return {
        authorized: true,
        actor: getAdminActorLabel(cookieSession),
        method: "admin_session",
        statusCode: 200,
      };
    }
  }

  // 3. Fallback to Next.js request-scoped cookies() and headers() (for Server Actions)
  try {
    const cookieStore = await cookies();
    const sessionValue = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
    if (isValidAdminSession(sessionValue)) {
      return {
        authorized: true,
        actor: getAdminActorLabel(sessionValue),
        method: "admin_session",
        statusCode: 200,
      };
    }
  } catch {
    // Outside Next.js request scope
  }

  try {
    const hdrs = await nextHeaders();
    const internalSecretHeader = hdrs.get("x-internal-secret");
    const adminKeyHeader = hdrs.get("x-admin-access-key") || hdrs.get("x-earthos-admin-key");
    const earthosKeyHeader = hdrs.get("x-earthos-api-key");
    const bearer = readBearerToken(hdrs.get("authorization"));

    if (
      matchesConfiguredSecret(internalSecretHeader, process.env.INTERNAL_API_SECRET) ||
      matchesConfiguredSecret(bearer, process.env.INTERNAL_API_SECRET)
    ) {
      return {
        authorized: true,
        actor: "internal:secret",
        method: "internal_secret",
        statusCode: 200,
      };
    }

    if (
      matchesConfiguredSecret(earthosKeyHeader, process.env.EARTHOS_API_KEY) ||
      matchesConfiguredSecret(bearer, process.env.EARTHOS_API_KEY) ||
      matchesConfiguredSecret(adminKeyHeader, process.env.EARTHOS_ADMIN_KEY) ||
      matchesConfiguredSecret(bearer, process.env.EARTHOS_ADMIN_KEY)
    ) {
      return {
        authorized: true,
        actor: "earthos:api-key",
        method: "earthos_api_key",
        statusCode: 200,
      };
    }

    if (isValidAdminAccessKey(adminKeyHeader) || isValidAdminAccessKey(bearer)) {
      return {
        authorized: true,
        actor: "admin:access-key",
        method: "admin_access_key",
        statusCode: 200,
      };
    }
  } catch {
    // Outside Next.js request scope
  }

  return {
    authorized: false,
    actor: null,
    method: null,
    statusCode: 401,
    error: "earthos_unauthorized",
  };
}

export function buildEarthOSUnauthorizedResponse(result?: Partial<EarthOSAuthResult>) {
  return NextResponse.json(
    {
      ok: false,
      error: result?.error || "earthos_unauthorized",
    },
    { status: result?.statusCode || 401 },
  );
}
