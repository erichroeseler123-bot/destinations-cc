import crypto from "crypto";
import { redis } from "@/lib/redis";

export const SERVICE_AUTH_WINDOW_MS = 5 * 60 * 1000; // 5 minutes max clock skew
export const SERVICE_RATE_LIMIT_MAX = 120; // 120 requests per minute
export const SERVICE_RATE_LIMIT_WINDOW_MS = 60 * 1000;

export const ALLOWED_SERVICE_ROUTES = [
  "/api/internal/cruises",
  "/api/internal/cruises/",
  "/api/internal/cruises/port",
  "/api/internal/cruises/ship",
  "/api/internal/cruises/providers",
  "/api/internal/research",
  "/api/internal/research/approved-facts",
  "/api/v1/context",
] as const;

// In-memory nonce replay store (fallback when Redis is unconfigured or in tests)
interface NonceEntry {
  seenAt: number;
}
const seenNonces = new Map<string, NonceEntry>();

// In-memory sliding window rate limiter
interface RateLimitEntry {
  timestamps: number[];
}
const rateLimitMap = new Map<string, RateLimitEntry>();

// Cleanup stale nonces periodically
function pruneStaleNonces(now: number) {
  for (const [nonce, entry] of seenNonces.entries()) {
    if (now - entry.seenAt > SERVICE_AUTH_WINDOW_MS) {
      seenNonces.delete(nonce);
    }
  }
}

export function clearNonceReplayCacheForTesting() {
  seenNonces.clear();
  rateLimitMap.clear();
}

/**
 * Checks and records a nonce in shared Upstash Redis atomically using SET ... NX EX.
 * In production/staging (NODE_ENV=production, VERCEL_ENV=production|preview, or APP_ENV=staging|production):
 *   - Redis is REQUIRED and requests FAIL CLOSED if Redis is unavailable or unconfigured.
 * In local test/development:
 *   - In-memory fallback is permitted.
 */
export async function checkAndRecordNonce(
  nonce: string,
  now: number = Date.now(),
  options?: { allowMemoryFallback?: boolean }
): Promise<{ ok: boolean; reason?: string }> {
  const isProductionOrStaging =
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL_ENV === "production" ||
    process.env.VERCEL_ENV === "preview" ||
    process.env.APP_ENV === "staging" ||
    process.env.APP_ENV === "production";

  const allowMemory =
    options?.allowMemoryFallback ??
    (!isProductionOrStaging || process.env.ALLOW_IN_MEMORY_NONCE_FALLBACK_FOR_TESTS === "true");

  if (redis) {
    try {
      const key = `dcc:nonce:${nonce}`;
      const ttlSec = Math.ceil(SERVICE_AUTH_WINDOW_MS / 1000);
      const res = await redis.set(key, "1", { nx: true, ex: ttlSec });
      const success = res === "OK" || (res as unknown) === 1 || (res as unknown) === true;
      if (!success) {
        return { ok: false, reason: "Nonce has already been used (Redis NX rejection)." };
      }
      return { ok: true };
    } catch (err: any) {
      if (!allowMemory) {
        return {
          ok: false,
          reason: `Distributed Redis replay store error in production mode: ${err.message || String(err)}`,
        };
      }
    }
  } else if (!allowMemory) {
    return {
      ok: false,
      reason: "Distributed Upstash Redis nonce storage is required in production/staging mode (fail-closed).",
    };
  }

  // Local test / in-memory fallback
  pruneStaleNonces(now);
  if (seenNonces.has(nonce)) {
    return { ok: false, reason: "Nonce has already been used (in-memory test rejection)." };
  }
  seenNonces.set(nonce, { seenAt: now });
  return { ok: true };
}

export function isServiceRouteAllowed(pathname: string): boolean {
  return ALLOWED_SERVICE_ROUTES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function hashBody(body?: string | Buffer | null): string {
  if (!body) {
    return crypto.createHash("sha256").update("").digest("hex");
  }
  return crypto.createHash("sha256").update(body).digest("hex");
}

export function buildCanonicalRequest(params: {
  method: string;
  pathname: string;
  searchParams?: URLSearchParams | string;
  timestamp: string | number;
  nonce: string;
  bodyHash: string;
}): string {
  let normalizedQuery = "";
  if (params.searchParams) {
    const sp =
      typeof params.searchParams === "string"
        ? new URLSearchParams(params.searchParams)
        : params.searchParams;
    const sortedEntries = Array.from(sp.entries()).sort(([a], [b]) =>
      a.localeCompare(b),
    );
    normalizedQuery = new URLSearchParams(sortedEntries).toString();
  }

  return [
    params.method.toUpperCase(),
    params.pathname,
    normalizedQuery,
    String(params.timestamp),
    params.nonce,
    params.bodyHash,
  ].join("\n");
}

export function signServiceRequest(params: {
  keyId: string;
  secret: string;
  method: string;
  pathname: string;
  searchParams?: URLSearchParams | string;
  timestamp?: string | number;
  nonce?: string;
  body?: string | Buffer | null;
}): {
  headers: Record<string, string>;
  signature: string;
  timestamp: string;
  nonce: string;
  keyId: string;
  bodyHash: string;
} {
  const timestamp = String(params.timestamp ?? Date.now());
  const nonce = params.nonce ?? crypto.randomBytes(16).toString("hex");
  const bodyHash = hashBody(params.body);

  const canonical = buildCanonicalRequest({
    method: params.method,
    pathname: params.pathname,
    searchParams: params.searchParams,
    timestamp,
    nonce,
    bodyHash,
  });

  const signature = crypto
    .createHmac("sha256", params.secret)
    .update(canonical)
    .digest("hex");

  return {
    headers: {
      "x-dcc-key-id": params.keyId,
      "x-dcc-timestamp": timestamp,
      "x-dcc-nonce": nonce,
      "x-dcc-content-sha256": bodyHash,
      "x-dcc-signature": signature,
    },
    signature,
    timestamp,
    nonce,
    keyId: params.keyId,
    bodyHash,
  };
}

export const REVIEW_DESK_PRODUCER_KEY_ID = "review_desk_service_key";

export function isResearchProducerKey(keyId: string): boolean {
  const configuredProducerKeyId =
    process.env.DCC_REVIEW_DESK_SERVICE_KEY_ID?.trim() ||
    REVIEW_DESK_PRODUCER_KEY_ID;
  return keyId.trim() === configuredProducerKeyId;
}

export function resolveServiceSecret(keyId: string): string | null {
  // 1. Dedicated review-desk producer key (strictly isolated; never falls back to consumer secrets)
  if (isResearchProducerKey(keyId)) {
    return (
      process.env.DCC_SERVICE_SECRET_REVIEW_DESK_SERVICE_KEY?.trim() ||
      process.env.DCC_REVIEW_DESK_SECRET?.trim() ||
      null
    );
  }

  // 2. Check configured feeder and owner consumer service keys
  const cpKeyId = process.env.DCC_CP_SERVICE_KEY_ID?.trim() || "cp_service_key";
  const cpSecret = process.env.DCC_CP_SERVICE_SECRET?.trim();
  if (keyId === cpKeyId && cpSecret) {
    return cpSecret;
  }

  const lfseKeyId = process.env.DCC_LFSE_SERVICE_KEY_ID?.trim() || "lfse_service_key";
  const lfseSecret = process.env.DCC_LFSE_SERVICE_SECRET?.trim() || cpSecret;
  if (keyId === lfseKeyId && lfseSecret) {
    return lfseSecret;
  }

  const bhoKeyId = process.env.DCC_BHO_SERVICE_KEY_ID?.trim() || "bho_service_key";
  const bhoSecret = process.env.DCC_BHO_SERVICE_SECRET?.trim() || cpSecret;
  if (keyId === bhoKeyId && bhoSecret) {
    return bhoSecret;
  }

  const jfdKeyId = process.env.DCC_JFD_SERVICE_KEY_ID?.trim() || "jfd_service_key";
  const jfdSecret = process.env.DCC_JFD_SERVICE_SECRET?.trim();
  if (keyId === jfdKeyId && jfdSecret) {
    return jfdSecret;
  }

  // Check dynamic owner environment variables, e.g. DCC_SERVICE_SECRET_WTA_SERVICE_KEY
  const sanitized = keyId.replace(/[^a-zA-Z0-9]/g, "_").toUpperCase();
  const dynamicEnv = process.env[`DCC_SERVICE_SECRET_${sanitized}`]?.trim();
  if (dynamicEnv) {
    return dynamicEnv;
  }

  const defaultKeyId = process.env.INTERNAL_API_KEY_ID?.trim() || "dcc_internal_service";
  const defaultSecret = process.env.INTERNAL_API_SECRET?.trim();
  if (keyId === defaultKeyId && defaultSecret) {
    return defaultSecret;
  }

  // If secret is set and matches key or fallback
  if (
    defaultSecret &&
    (keyId === "default" ||
      keyId === cpKeyId ||
      keyId === lfseKeyId ||
      keyId === bhoKeyId ||
      keyId === jfdKeyId)
  ) {
    return defaultSecret;
  }

  return null;
}

export type VerifyResult =
  | { authorized: true; keyId: string }
  | { authorized: false; statusCode: 401 | 403 | 429; error: string; code: string };

export function verifyServiceRequestHeaders(params: {
  headers: Headers | Record<string, string | undefined>;
  method: string;
  pathname: string;
  searchParams?: URLSearchParams | string;
  body?: string | Buffer | null;
  now?: number;
  recordNonce?: boolean;
  verifyBodyContent?: boolean;
}): VerifyResult {
  const now = params.now ?? Date.now();
  pruneStaleNonces(now);

  const getHeader = (name: string): string => {
    if (params.headers instanceof Headers) {
      return params.headers.get(name) || "";
    }
    const val = params.headers[name] || params.headers[name.toLowerCase()];
    return typeof val === "string" ? val : "";
  };

  // 1. Check route scope
  if (!isServiceRouteAllowed(params.pathname)) {
    return {
      authorized: false,
      statusCode: 403,
      error: `Service credentials are not permitted to access route: ${params.pathname}`,
      code: "FORBIDDEN_ROUTE_SCOPE",
    };
  }

  // 2. Extract required headers
  const keyId = (
    getHeader("x-dcc-key-id") ||
    getHeader("x-service-key-id") ||
    getHeader("x-key-id")
  ).trim();
  const timestampRaw = (
    getHeader("x-dcc-timestamp") ||
    getHeader("x-timestamp") ||
    getHeader("x-signature-timestamp")
  ).trim();
  const explicitNonce = (
    getHeader("x-dcc-nonce") ||
    getHeader("x-nonce") ||
    getHeader("x-dcc-delivery-id") ||
    getHeader("x-delivery-id")
  ).trim();
  const signatureRaw = (
    getHeader("x-dcc-signature") ||
    getHeader("x-signature") ||
    getHeader("x-hub-signature-256")
  )
    .trim()
    .replace(/^sha256=/i, "")
    .replace(/^v1=/i, "");
  const signature = signatureRaw.toLowerCase();
  const contentSha256 = (
    getHeader("x-dcc-content-sha256") ||
    getHeader("x-dcc-body-sha256") ||
    getHeader("x-content-sha256")
  )
    .trim()
    .replace(/^sha256=/i, "")
    .toLowerCase();

  const expectedBodyHash = hashBody(params.body);
  const nonce =
    explicitNonce ||
    (isResearchProducerKey(keyId) && timestampRaw
      ? `producer:${timestampRaw}:${contentSha256 || expectedBodyHash}`
      : "");

  if (!keyId || !timestampRaw || !nonce || !signature) {
    return {
      authorized: false,
      statusCode: 401,
      error: "Missing required service signature headers (x-dcc-key-id, x-dcc-timestamp, x-dcc-nonce, x-dcc-signature).",
      code: "MISSING_SERVICE_SIGNATURE",
    };
  }

  // 3. Validate timestamp (supports Unix epoch ms, Unix epoch seconds, or ISO-8601)
  let requestTimestampMs = NaN;
  if (/^\d+$/.test(timestampRaw)) {
    const num = Number(timestampRaw);
    requestTimestampMs = num < 1e11 ? num * 1000 : num;
  } else {
    requestTimestampMs = Date.parse(timestampRaw);
  }
  if (!Number.isFinite(requestTimestampMs)) {
    return {
      authorized: false,
      statusCode: 401,
      error: "Invalid timestamp format.",
      code: "INVALID_TIMESTAMP",
    };
  }

  const timeDiff = Math.abs(now - requestTimestampMs);
  if (timeDiff > SERVICE_AUTH_WINDOW_MS) {
    return {
      authorized: false,
      statusCode: 401,
      error: `Request timestamp expired. Skew is ${Math.round(timeDiff / 1000)}s (max ${SERVICE_AUTH_WINDOW_MS / 1000}s).`,
      code: "TIMESTAMP_EXPIRED",
    };
  }

  // 4. Validate nonce replay
  if (seenNonces.has(nonce)) {
    return {
      authorized: false,
      statusCode: 401,
      error: "Nonce has already been used. Replay attacks are prohibited.",
      code: "NONCE_REPLAY_REJECTED",
    };
  }

  // 5. Rate limiting
  const rateLimitKey = `rate:${keyId}`;
  let rateEntry = rateLimitMap.get(rateLimitKey);
  if (!rateEntry) {
    rateEntry = { timestamps: [] };
    rateLimitMap.set(rateLimitKey, rateEntry);
  }
  rateEntry.timestamps = rateEntry.timestamps.filter((ts) => now - ts < SERVICE_RATE_LIMIT_WINDOW_MS);
  if (rateEntry.timestamps.length >= SERVICE_RATE_LIMIT_MAX) {
    return {
      authorized: false,
      statusCode: 429,
      error: "Service rate limit exceeded. Please throttle requests.",
      code: "RATE_LIMIT_EXCEEDED",
    };
  }
  rateEntry.timestamps.push(now);

  // 6. Resolve secret
  const secret = resolveServiceSecret(keyId);
  if (!secret) {
    return {
      authorized: false,
      statusCode: 401,
      error: "Unknown or inactive service key identifier.",
      code: "UNKNOWN_KEY_ID",
    };
  }

  // 7. Verify body hash if provided or calculated
  const shouldVerifyBodyContent = params.verifyBodyContent ?? true;
  if (shouldVerifyBodyContent && contentSha256 && contentSha256 !== expectedBodyHash) {
    return {
      authorized: false,
      statusCode: 401,
      error: "Request body hash mismatch.",
      code: "BODY_HASH_MISMATCH",
    };
  }

  // 8. Build canonical string and verify HMAC signature in constant time
  const effectiveBodyHash = contentSha256 || expectedBodyHash;
  const primaryCanonical = buildCanonicalRequest({
    method: params.method,
    pathname: params.pathname,
    searchParams: params.searchParams,
    timestamp: timestampRaw,
    nonce: explicitNonce,
    bodyHash: effectiveBodyHash,
  });

  const rawBodyString =
    typeof params.body === "string"
      ? params.body
      : Buffer.isBuffer(params.body)
        ? params.body.toString("utf8")
        : "";

  const canonicalCandidates: string[] = [primaryCanonical];
  if (isResearchProducerKey(keyId)) {
    canonicalCandidates.push(
      [
        params.method.toUpperCase(),
        params.pathname,
        timestampRaw,
        explicitNonce,
        effectiveBodyHash,
      ].join("\n"),
      [
        params.method.toUpperCase(),
        params.pathname,
        "",
        timestampRaw,
        explicitNonce,
        rawBodyString,
      ].join("\n"),
      [
        params.method.toUpperCase(),
        params.pathname,
        timestampRaw,
        rawBodyString,
      ].join("\n"),
      `${timestampRaw}.${rawBodyString}`,
      `${timestampRaw}\n${explicitNonce}\n${effectiveBodyHash}`,
      `${timestampRaw}\n${rawBodyString}`,
    );
  }

  const matchesCandidate = (candidate: string): boolean => {
    const expectedHex = crypto
      .createHmac("sha256", secret)
      .update(candidate)
      .digest("hex")
      .toLowerCase();
    const sigHexBuf = Buffer.from(signature, "hex");
    const expHexBuf = Buffer.from(expectedHex, "hex");
    if (
      sigHexBuf.length > 0 &&
      sigHexBuf.length === expHexBuf.length &&
      crypto.timingSafeEqual(sigHexBuf, expHexBuf)
    ) {
      return true;
    }
    if (isResearchProducerKey(keyId)) {
      const expectedB64 = crypto
        .createHmac("sha256", secret)
        .update(candidate)
        .digest("base64");
      const sigB64Buf = Buffer.from(signatureRaw, "utf8");
      const expB64Buf = Buffer.from(expectedB64, "utf8");
      if (
        sigB64Buf.length > 0 &&
        sigB64Buf.length === expB64Buf.length &&
        crypto.timingSafeEqual(sigB64Buf, expB64Buf)
      ) {
        return true;
      }
    }
    return false;
  };

  const isSignatureValid = canonicalCandidates.some(matchesCandidate);
  if (!isSignatureValid) {
    return {
      authorized: false,
      statusCode: 401,
      error: "Invalid HMAC signature.",
      code: "INVALID_SIGNATURE",
    };
  }

  // Record nonce to prevent replay
  if (params.recordNonce ?? true) {
    seenNonces.set(nonce, { seenAt: now });
  }

  return { authorized: true, keyId };
}
