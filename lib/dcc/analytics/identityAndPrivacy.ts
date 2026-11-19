import crypto from "node:crypto";
import type { CanonicalAnalyticsSiteId } from "./contract";

export const ACTIVE_REPORTING_KEY_VERSION = 1 as const;
export const ANALYTICS_RETENTION_DAYS = 90 as const;

function resolveKeyringSecret(purpose: "subject" | "trip" | "participant", version: number): string {
  const envKey = `DCC_ANALYTICS_${purpose.toUpperCase()}_KEY_V${version}`;
  const explicit = process.env[envKey]?.trim();
  if (explicit) return explicit;

  const shared =
    process.env.DCC_ANALYTICS_MASTER_SECRET?.trim() ||
    process.env.TELEMETRY_HASH_SECRET?.trim() ||
    process.env.INTERNAL_API_SECRET?.trim();
  if (shared) {
    return `${shared}:dcc-analytics:${purpose}:v${version}`;
  }

  if (process.env.VERCEL_ENV === "production") {
    throw new Error(`Missing required production analytics secret (${envKey} or DCC_ANALYTICS_MASTER_SECRET)`);
  }

  return `dcc-nonprod-analytics-key:${purpose}:v${version}`;
}

function hmacHex(secret: string, message: string, hexChars: number): string {
  return crypto.createHmac("sha256", secret).update(message, "utf8").digest("hex").slice(0, hexChars);
}

/**
 * Derives a site-scoped, pseudonymous reporting subject identifier (`rsub_v1_<32hex>`).
 * - Preserves 24h / 7d / 28d (up to 90d) cohort continuity within a property without rotating daily cliffs.
 * - Scoped by `siteId` so unrelated network domains cannot covertly cross-track visitors without an explicit handoff.
 * - One-way keyed HMAC: cannot be reversed to raw cookie/storage seed and never grants access.
 */
export function deriveReportingSubjectId(params: {
  siteId: CanonicalAnalyticsSiteId;
  browserSeed?: string | null;
  keyVersion?: number;
}): { reportingSubjectId: string | null; keyVersion: number } {
  const version = params.keyVersion ?? ACTIVE_REPORTING_KEY_VERSION;
  const raw = (params.browserSeed || "").trim();
  if (!raw || raw === "ssr" || raw === "server" || raw === "anon" || raw.length < 6) {
    return { reportingSubjectId: null, keyVersion: version };
  }
  const secret = resolveKeyringSecret("subject", version);
  const digest = hmacHex(secret, `${params.siteId}:${raw}`, 32);
  return {
    reportingSubjectId: `rsub_v${version}_${digest}`,
    keyVersion: version,
  };
}

export function deriveReportingSessionKey(params: {
  siteId: CanonicalAnalyticsSiteId;
  sessionId?: string | null;
  keyVersion?: number;
}): string | null {
  const version = params.keyVersion ?? ACTIVE_REPORTING_KEY_VERSION;
  const raw = (params.sessionId || "").trim();
  if (!raw || raw === "ssr" || raw === "server_session" || raw === "server-session" || raw === "anon") {
    return null;
  }
  const secret = resolveKeyringSecret("subject", version);
  return `asess_v${version}_${hmacHex(secret, `session:${params.siteId}:${raw}`, 24)}`;
}

/**
 * Derives an irreversible analytics-only trip key (`atk_v1_<32hex>`).
 * Never exposes `shareCode`, `organizerToken`, `claimToken`, or `recoveryToken`, and never grants trip access.
 */
export function deriveAnalyticsTripKey(params: {
  rawTripIdentifier?: string | null;
  precomputedAnalyticsTripKey?: string | null;
  keyVersion?: number;
}): string | null {
  if (params.precomputedAnalyticsTripKey && /^atk_v\d+_[a-f0-9]{24,64}$/.test(params.precomputedAnalyticsTripKey)) {
    return params.precomputedAnalyticsTripKey;
  }
  const raw = (params.rawTripIdentifier || "").trim();
  if (!raw) return null;
  // Normalize uppercase/lowercase hex shareCodes so same board hashes identically regardless of casing
  const normalized = /^[a-f0-9]{24}$/i.test(raw) ? raw.toUpperCase() : raw;
  const version = params.keyVersion ?? ACTIVE_REPORTING_KEY_VERSION;
  const secret = resolveKeyringSecret("trip", version);
  return `atk_v${version}_${hmacHex(secret, `trip:${normalized}`, 32)}`;
}

export function deriveDraftKeyHash(
  rawDraftKey?: string | null,
  keyVersion: number = ACTIVE_REPORTING_KEY_VERSION,
): string | null {
  const raw = (rawDraftKey || "").trim();
  if (!raw) return null;
  const secret = resolveKeyringSecret("trip", keyVersion);
  return `drf_v${keyVersion}_${hmacHex(secret, `draft:${raw}`, 32)}`;
}

export function deriveParticipantAnalyticsKey(params: {
  analyticsTripKey: string | null;
  rawParticipantKey?: string | null;
  keyVersion?: number;
}): string | null {
  const raw = (params.rawParticipantKey || "").trim();
  if (!raw || !params.analyticsTripKey) return null;
  const version = params.keyVersion ?? ACTIVE_REPORTING_KEY_VERSION;
  const secret = resolveKeyringSecret("participant", version);
  return `aprt_v${version}_${hmacHex(secret, `${params.analyticsTripKey}:${raw}`, 24)}`;
}

export type LeadTimeBucket =
  | "past_or_today"
  | "1_7d"
  | "8_30d"
  | "31_90d"
  | "91_180d"
  | "181_365d"
  | "365d_plus";

/**
 * Treats exact personal travel dates as sensitive; converts a YYYY-MM-DD hint into a coarse lead-time bucket
 * and discards the exact date.
 */
export function bucketizeTravelDateHint(
  travelDateHint?: string | null,
  referenceIso?: string | null,
): LeadTimeBucket | null {
  if (!travelDateHint || typeof travelDateHint !== "string") return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(travelDateHint.trim());
  if (!match) return null;
  const targetMs = Date.parse(`${match[1]}-${match[2]}-${match[3]}T00:00:00Z`);
  if (!Number.isFinite(targetMs)) return null;
  const refMs = referenceIso ? Date.parse(referenceIso) : Date.now();
  const validRefMs = Number.isFinite(refMs) ? refMs : Date.now();
  const diffDays = Math.floor((targetMs - validRefMs) / (24 * 60 * 60 * 1000));
  if (diffDays <= 0) return "past_or_today";
  if (diffDays <= 7) return "1_7d";
  if (diffDays <= 30) return "8_30d";
  if (diffDays <= 90) return "31_90d";
  if (diffDays <= 180) return "91_180d";
  if (diffDays <= 365) return "181_365d";
  return "365d_plus";
}

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const PHONE_RE =
  /(?:\+\d[\d\s().-]{7,}\d|\(\d{3}\)[\s.-]*\d{3}[\s.-]*\d{4}|(?<![A-Za-z0-9_-])(?:\d{1,2}[\s.-])?\d{3}[\s.-]\d{3}[\s.-]\d{4}(?![A-Za-z0-9_-]))/g;
const CABIN_RE = /\b(?:cabin|stateroom|room|berth|deck)\s*(?:number|no\.?|#)?\s*[A-Z]?\d{2,5}[A-Z]?\b/gi;
const CONF_REF_RE =
  /\b(?:conf(?:irmation)?|booking|reservation|voucher|pnr)\s*(?:id|no\.?|#|ref|code|number)?\s*[:#-]?\s*[A-Za-z0-9_-]{3,}\b/gi;
const DCC_CTX_RE = /\bdcc_ctx_[A-Za-z0-9_-]{6,128}\b/gi;
const CP_SESS_RE = /\bcpsess_[A-Za-z0-9_-]{8,128}\b/gi;
const HEX_24_OR_LONGER_SECRET_RE = /\b[A-Fa-f0-9]{24,64}\b/g;
const SIGNED_JWT_LIKE_RE = /\bv1\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g;
const ISO_DATE_VALUE_RE = /^\d{4}-\d{2}-\d{2}$/;

const PRIVATE_ROUTE_PATTERNS: ReadonlyArray<[RegExp, string]> = [
  [/^\/p\/[^/]+(\/.*)?$/i, "/p/[redacted]$1"],
  [/^\/organizer\/hosted\/([^/]+)(\/.*)?$/i, "/organizer/hosted/$1$2"],
  [/^\/organizer\/[^/]+(\/.*)?$/i, "/organizer/[redacted]$1"],
  [/^\/claim\/[^/]+(\/.*)?$/i, "/claim/[redacted]$1"],
  [/^\/recover\/[^/]+(\/.*)?$/i, "/recover/[redacted]$1"],
  [/^\/booking\/[^/]+(\/.*)?$/i, "/booking/[token]$1"],
  [/^\/pay-balance\/[^/]+(\/.*)?$/i, "/pay-balance/[token]$1"],
  [/^\/pay\/[^/]+(\/.*)?$/i, "/pay/[token]$1"],
  [/^\/quote\/[^/]+(\/.*)?$/i, "/quote/[token]$1"],
  [/^\/manage\/[^/]+(\/.*)?$/i, "/manage/[token]$1"],
  [/^\/operator-offer\/[^/]+(\/.*)?$/i, "/operator-offer/[token]$1"],
  [/^\/go\/getyourguide\/[^/]+(\/.*)?$/i, "/go/getyourguide/[redacted]$1"],
  [/^\/sailing-watch\/(verify|manage)\/[^/]+$/i, "/sailing-watch/$1/[token]"],
];

const FORBIDDEN_PROP_KEY_RE =
  /(?:share_?code|^share$|from_?share|access_?code|organizer_?token|claim_?token|recover_?token|^token$|secret|signature|password|ctx|dcc_?ctx|booking_?session|confirmation|booking_?ref|partner_?booking_?ref|reservation|voucher|pnr|email|phone|name|cabin|stateroom|berth|passport|birth|dob|weight|medical|accessibility|note|body|raw_?mime|snippet|address)/i;

/**
 * Produces a strictly redacted, query-free, fragment-free canonical path.
 * Never retains `?share=`, `?ctx=`, `#token=`, `#claim=`, `/p/<shareCode>`, or `/organizer/<shareCode>`.
 */
export function sanitizeAnalyticsPath(rawPathOrUrl?: string | null): string {
  if (!rawPathOrUrl || typeof rawPathOrUrl !== "string") return "/";
  let working = rawPathOrUrl.trim();
  if (!working) return "/";

  if (/^https?:\/\//i.test(working)) {
    try {
      const parsed = new URL(working);
      working = parsed.pathname || "/";
    } catch {
      working = "/";
    }
  }

  // Strip query string and hash fragment unconditionally from canonical path
  let pathOnly = working.split("?")[0]!.split("#")[0]!.trim() || "/";
  if (!pathOnly.startsWith("/")) {
    pathOnly = `/${pathOnly}`;
  }

  for (const [pattern, replacement] of PRIVATE_ROUTE_PATTERNS) {
    if (pattern.test(pathOnly)) {
      pathOnly = pathOnly.replace(pattern, replacement);
      break;
    }
  }

  pathOnly = pathOnly
    .replace(DCC_CTX_RE, "[redacted]")
    .replace(CP_SESS_RE, "[redacted]")
    .replace(HEX_24_OR_LONGER_SECRET_RE, "[redacted]")
    .replace(SIGNED_JWT_LIKE_RE, "[redacted]");

  EMAIL_RE.lastIndex = 0;
  PHONE_RE.lastIndex = 0;
  CABIN_RE.lastIndex = 0;
  if (EMAIL_RE.test(pathOnly) || PHONE_RE.test(pathOnly) || CABIN_RE.test(pathOnly)) {
    EMAIL_RE.lastIndex = 0;
    PHONE_RE.lastIndex = 0;
    CABIN_RE.lastIndex = 0;
    return "/[redacted]";
  }

  return pathOnly.slice(0, 200);
}

/**
 * Extracts only the hostname of an external referrer, stripping all paths, tokens, and query parameters.
 */
export function sanitizeReferrerDomain(
  rawReferrer?: string | null,
  currentSiteDomain?: string | null,
): string | null {
  if (!rawReferrer || typeof rawReferrer !== "string") return null;
  const trimmed = rawReferrer.trim();
  if (!trimmed) return null;
  try {
    const parsed = /^https?:\/\//i.test(trimmed) ? new URL(trimmed) : new URL(`https://${trimmed}`);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
    if (!host || host === "localhost" || host === "127.0.0.1") return null;
    if (currentSiteDomain && host === currentSiteDomain.toLowerCase().replace(/^www\./, "")) {
      return null;
    }
    return host.slice(0, 120);
  } catch {
    return null;
  }
}

export function sanitizeCampaignToken(raw?: string | null, maxLen = 80): string | null {
  if (!raw || typeof raw !== "string") return null;
  const cleaned = raw.trim();
  if (!cleaned) return null;
  EMAIL_RE.lastIndex = 0;
  PHONE_RE.lastIndex = 0;
  CABIN_RE.lastIndex = 0;
  CONF_REF_RE.lastIndex = 0;
  DCC_CTX_RE.lastIndex = 0;
  CP_SESS_RE.lastIndex = 0;
  HEX_24_OR_LONGER_SECRET_RE.lastIndex = 0;
  if (
    EMAIL_RE.test(cleaned) ||
    PHONE_RE.test(cleaned) ||
    CABIN_RE.test(cleaned) ||
    CONF_REF_RE.test(cleaned) ||
    DCC_CTX_RE.test(cleaned) ||
    CP_SESS_RE.test(cleaned) ||
    HEX_24_OR_LONGER_SECRET_RE.test(cleaned)
  ) {
    return null;
  }
  return cleaned.replace(/[^A-Za-z0-9:._/-]/g, "_").slice(0, maxLen);
}

export function sanitizeAnalyticsProps(
  rawProps?: Record<string, unknown> | null,
): Record<string, string | number | boolean> {
  if (!rawProps || typeof rawProps !== "object" || Array.isArray(rawProps)) return {};
  const safe: Record<string, string | number | boolean> = {};
  let keyCount = 0;

  for (const [rawKey, rawVal] of Object.entries(rawProps)) {
    if (keyCount >= 20) break;
    const key = rawKey.trim();
    if (!key || key.length > 48) continue;
    if (FORBIDDEN_PROP_KEY_RE.test(key)) continue;

    if (typeof rawVal === "boolean") {
      safe[key] = rawVal;
      keyCount += 1;
      continue;
    }
    if (typeof rawVal === "number" && Number.isFinite(rawVal)) {
      safe[key] = rawVal;
      keyCount += 1;
      continue;
    }
    if (typeof rawVal === "string") {
      const trimmed = rawVal.trim();
      if (!trimmed) continue;
      // Do not store raw YYYY-MM-DD personal travel dates in generic props
      if (ISO_DATE_VALUE_RE.test(trimmed)) continue;

      EMAIL_RE.lastIndex = 0;
      PHONE_RE.lastIndex = 0;
      CABIN_RE.lastIndex = 0;
      CONF_REF_RE.lastIndex = 0;
      DCC_CTX_RE.lastIndex = 0;
      CP_SESS_RE.lastIndex = 0;
      HEX_24_OR_LONGER_SECRET_RE.lastIndex = 0;
      SIGNED_JWT_LIKE_RE.lastIndex = 0;

      if (
        EMAIL_RE.test(trimmed) ||
        PHONE_RE.test(trimmed) ||
        CABIN_RE.test(trimmed) ||
        CONF_REF_RE.test(trimmed) ||
        DCC_CTX_RE.test(trimmed) ||
        CP_SESS_RE.test(trimmed) ||
        HEX_24_OR_LONGER_SECRET_RE.test(trimmed) ||
        SIGNED_JWT_LIKE_RE.test(trimmed)
      ) {
        continue;
      }

      if (trimmed.startsWith("/") || /^https?:\/\//i.test(trimmed)) {
        safe[key] = sanitizeAnalyticsPath(trimmed);
      } else {
        safe[key] = trimmed.replace(/[\r\n\t<>]+/g, " ").slice(0, 140);
      }
      keyCount += 1;
    }
  }

  return safe;
}
