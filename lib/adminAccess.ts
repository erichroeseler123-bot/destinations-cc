import { createHash, createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const ADMIN_SESSION_COOKIE = "dcc_admin_session";
const ADMIN_SESSION_VERSION = "v1";
const ADMIN_SESSION_TTL_SECONDS = 60 * 60 * 12;

function adminAccessKey() {
  return (
    process.env.ADMIN_ACCESS_KEY?.trim() ||
    process.env.EARTHOS_ADMIN_KEY?.trim() ||
    process.env.INTERNAL_API_SECRET?.trim() ||
    ""
  );
}

function sha256(input: string) {
  return createHash("sha256").update(input).digest("hex");
}

export function isAdminAccessConfigured() {
  return Boolean(adminAccessKey());
}

export function isValidAdminAccessKey(input: string | null | undefined) {
  const candidate = input?.trim() || "";
  if (!candidate) return false;
  const configuredKeys = [
    process.env.ADMIN_ACCESS_KEY?.trim(),
    process.env.EARTHOS_ADMIN_KEY?.trim(),
    process.env.INTERNAL_API_SECRET?.trim(),
  ].filter((val): val is string => Boolean(val));
  return configuredKeys.includes(candidate);
}

function sessionSigningSecret() {
  const key = adminAccessKey();
  return key ? sha256(key) : "";
}

function signParts(version: string, expiresAt: string, nonce: string) {
  const secret = sessionSigningSecret();
  if (!secret) return "";
  return createHmac("sha256", secret).update(`${version}.${expiresAt}.${nonce}`).digest("hex");
}

export function buildAdminSessionValue() {
  const secret = sessionSigningSecret();
  if (!secret) return "";
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = String(now + ADMIN_SESSION_TTL_SECONDS);
  const nonce = sha256(`${Date.now()}-${Math.random()}`).slice(0, 24);
  const sig = signParts(ADMIN_SESSION_VERSION, expiresAt, nonce);
  return `${ADMIN_SESSION_VERSION}.${expiresAt}.${nonce}.${sig}`;
}

export function adminSessionMaxAgeSeconds() {
  return ADMIN_SESSION_TTL_SECONDS;
}

export function isValidAdminSession(value: string | null | undefined) {
  if (!value) return false;
  const parts = value.split(".");
  if (parts.length !== 4) return false;

  const [version, expiresAtRaw, nonce, signature] = parts;
  if (version !== ADMIN_SESSION_VERSION) return false;

  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt)) return false;
  if (expiresAt <= Math.floor(Date.now() / 1000)) return false;

  const expected = signParts(version, expiresAtRaw, nonce);
  if (!expected || expected.length !== signature.length) return false;

  return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export function getAdminActorLabel(value: string | null | undefined) {
  if (!isValidAdminSession(value)) return "unknown-admin";
  const nonce = String(value).split(".")[2] || "admin";
  return `admin:${nonce.slice(0, 8)}`;
}

function constantTimeEqualsSecret(a: string, b: string): boolean {
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
  fallbackSessionCookie?: string | null,
): Promise<{ authorized: true; actor: string } | { authorized: false }> {
  let sessionCookie =
    readCookieFromHeader(request.headers.get("cookie"), ADMIN_SESSION_COOKIE) ||
    fallbackSessionCookie ||
    null;
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
    { label: "earthos_admin", value: (process.env.EARTHOS_ADMIN_KEY || "").trim() },
    { label: "internal_secret", value: (process.env.INTERNAL_API_SECRET || "").trim() },
    { label: "dcc_internal_secret", value: (process.env.DCC_INTERNAL_API_SECRET || "").trim() },
    { label: "commerce_admin", value: (process.env.DCC_COMMERCE_ADMIN_SECRET || "").trim() },
  ];

  for (const entry of configuredSecrets) {
    if (entry.value && constantTimeEqualsSecret(candidate, entry.value)) {
      return {
        authorized: true,
        actor: entry.label,
      };
    }
  }

  return { authorized: false };
}
