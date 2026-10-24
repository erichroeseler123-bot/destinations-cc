import { createHash, createHmac, timingSafeEqual } from "crypto";

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
