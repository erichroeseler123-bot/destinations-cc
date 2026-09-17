import crypto from "crypto";
import { signServiceRequest } from "@/lib/dcc/auth/hmac-service-auth";
import type { DccContextRedeemResponse } from "@/lib/dcc/context/schema";
import { invalidateDccSession, isDccSessionInvalidated } from "@/lib/dcc/context/service";

export interface ContextRedeemResult {
  success: boolean;
  data?: DccContextRedeemResponse;
  errorCode?: string;
  message?: string;
  statusCode?: number;
}

export async function redeemOpaqueContext(
  contextId: string,
  options?: {
    baseUrl?: string;
    keyId?: string;
    secret?: string;
    fetcher?: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
  }
): Promise<ContextRedeemResult> {
  if (!contextId || !contextId.startsWith("dcc_ctx_")) {
    return {
      success: false,
      errorCode: "INVALID_CONTEXT_ID",
      message: "Context ID must follow the dcc_ctx_<32hex> format.",
      statusCode: 400,
    };
  }

  const baseUrl = (
    options?.baseUrl ||
    process.env.DCC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_DCC_API_URL ||
    "https://api.destinationcommandcenter.com"
  ).replace(/\/+$/, "");

  const keyId =
    options?.keyId ||
    process.env.DCC_JFD_SERVICE_KEY_ID?.trim() ||
    process.env.INTERNAL_API_KEY_ID?.trim() ||
    "jfd_service_key";

  const secret =
    options?.secret ||
    process.env.DCC_JFD_SERVICE_SECRET?.trim() ||
    process.env.INTERNAL_API_SECRET?.trim() ||
    "";

  const pathname = `/api/v1/context/${encodeURIComponent(contextId)}/redeem`;
  const body = JSON.stringify({ owner: "juneauflightdeck" });

  const signed = signServiceRequest({
    keyId,
    secret,
    method: "POST",
    pathname,
    body,
  });

  const fetchImpl = options?.fetcher || fetch;

  try {
    const response = await fetchImpl(`${baseUrl}${pathname}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...signed.headers,
      },
      body,
      cache: "no-store",
    });

    const json = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        success: false,
        errorCode: json.errorCode || "REDEMPTION_FAILED",
        message: json.message || `Redemption failed with status ${response.status}`,
        statusCode: response.status,
      };
    }

    return {
      success: true,
      data: json.data as DccContextRedeemResponse,
      statusCode: 200,
    };
  } catch (error: any) {
    return {
      success: false,
      errorCode: "NETWORK_ERROR",
      message: error.message || "Failed to contact DCC Context Authority.",
      statusCode: 502,
    };
  }
}

export const JFD_CHECKOUT_COOKIE_NAME = "jfd_checkout_session";
export const JFD_SESSION_AUDIENCE = "juneauflightdeck";
export const JFD_SESSION_KEY_VERSION = "v1";

export const JFD_CHECKOUT_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 3600, // 1 hour checkout window
  path: "/",
};

export const JFD_CHECKOUT_COOKIE_DELETE_OPTIONS = {
  ...JFD_CHECKOUT_COOKIE_OPTIONS,
  maxAge: 0,
};

export interface SessionPayload {
  v: 1;
  kid: string;
  sid: string;
  ctx: string;
  aud: string;
  exp: number;
  iat: number;
}

function getSessionSigningSecretMap(options?: {
  sessionSecrets?: Record<string, string>;
  sessionSecret?: string;
}): Record<string, string> {
  const envSecret =
    process.env.JFD_SESSION_SECRET?.trim() ||
    process.env.SESSION_SECRET?.trim();
  const defaultSecret =
    options?.sessionSecret ||
    envSecret ||
    "jfd_dev_session_secret_not_for_production";

  return (
    options?.sessionSecrets || {
      [JFD_SESSION_KEY_VERSION]: defaultSecret,
    }
  );
}

export function signSessionToken(
  payload: {
    sessionId: string;
    contextId: string;
    expiresAt: number;
    audience?: string;
    keyVersion?: string;
  },
  options?: {
    sessionSecrets?: Record<string, string>;
    sessionSecret?: string;
  }
): string {
  const kid = payload.keyVersion || JFD_SESSION_KEY_VERSION;
  const secrets = getSessionSigningSecretMap(options);
  const secret = secrets[kid];
  if (!secret) {
    throw new Error(`Unknown session signing key version '${kid}'`);
  }

  const data: SessionPayload = {
    v: 1,
    kid,
    sid: payload.sessionId,
    ctx: payload.contextId,
    aud: payload.audience || JFD_SESSION_AUDIENCE,
    exp: payload.expiresAt,
    iat: Date.now(),
  };

  const encodedData = Buffer.from(JSON.stringify(data)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", secret)
    .update(encodedData)
    .digest("base64url");
  return `${encodedData}.${signature}`;
}

export function verifySessionToken(
  token: string | null | undefined,
  expectedAudience: string = JFD_SESSION_AUDIENCE,
  options?: {
    sessionSecrets?: Record<string, string>;
    sessionSecret?: string;
  }
): SessionPayload | null {
  if (!token || typeof token !== "string" || !token.includes(".")) {
    return null;
  }
  const [encodedData, signature] = token.split(".");
  if (!encodedData || !signature) {
    return null;
  }

  let parsed: SessionPayload;
  try {
    parsed = JSON.parse(
      Buffer.from(encodedData, "base64url").toString("utf8")
    ) as SessionPayload;
    if (
      !parsed.sid ||
      !parsed.ctx ||
      !parsed.exp ||
      !parsed.kid ||
      parsed.v !== 1
    ) {
      return null;
    }
  } catch {
    return null;
  }

  // 1. Audience validation
  if (parsed.aud !== expectedAudience) {
    return null;
  }

  // 2. Expiration check
  if (parsed.exp <= Date.now()) {
    return null;
  }

  // 3. Signature verification with key rotation support
  const secrets = getSessionSigningSecretMap(options);
  const secret = secrets[parsed.kid];
  if (!secret) {
    return null; // Unknown key version
  }

  const expectedSig = crypto
    .createHmac("sha256", secret)
    .update(encodedData)
    .digest("base64url");

  if (
    signature.length !== expectedSig.length ||
    !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))
  ) {
    return null;
  }

  return parsed;
}

interface CheckoutSession {
  contextId: string;
  data: DccContextRedeemResponse;
  createdAt: number;
  expiresAt: number;
}

const activeCheckoutSessions = new Map<string, CheckoutSession>();
const invalidatedSessionIds = new Map<string, number>();

function pruneExpiredSessions(now: number) {
  for (const [id, session] of activeCheckoutSessions.entries()) {
    if (session.expiresAt <= now) {
      activeCheckoutSessions.delete(id);
    }
  }
  for (const [id, exp] of invalidatedSessionIds.entries()) {
    if (exp <= now) {
      invalidatedSessionIds.delete(id);
    }
  }
}

export function clearCheckoutSessionCacheForTesting() {
  activeCheckoutSessions.clear();
}

export function clearInvalidatedSessionsForTesting() {
  invalidatedSessionIds.clear();
}

export async function isSessionInvalidated(
  sessionId: string,
  options?: { dbOverride?: any; now?: number }
): Promise<
  | { success: true; isInvalidated: boolean }
  | { success: false; errorCode: "DATABASE_UNAVAILABLE"; message: string }
> {
  // 1. Fast in-memory check
  if (invalidatedSessionIds.has(sessionId)) {
    return { success: true, isInvalidated: true };
  }
  // 2. Durable Neon database check (cross-instance safety) - FAIL CLOSED
  return await isDccSessionInvalidated(sessionId, options);
}

export async function invalidateCheckoutSession(
  sessionIdOrToken: string,
  options?: {
    sessionSecrets?: Record<string, string>;
    sessionSecret?: string;
    contextId?: string;
    owner?: string;
    reason?: string;
    dbOverride?: any;
  }
): Promise<void> {
  const verified = verifySessionToken(sessionIdOrToken, JFD_SESSION_AUDIENCE, options);
  const sid = verified ? verified.sid : sessionIdOrToken;
  const ctx = verified ? verified.ctx : (options?.contextId || "");
  const exp = verified ? verified.exp : Date.now() + 3600 * 1000;
  const owner = options?.owner || "juneauflightdeck";

  // Wipe local memory cache
  activeCheckoutSessions.delete(sid);
  invalidatedSessionIds.set(sid, exp);

  // Durable invalidation in Neon PostgreSQL
  await invalidateDccSession(sid, ctx, owner, options?.reason, {
    dbOverride: options?.dbOverride,
    expiresAt: new Date(exp),
  });
}

/**
 * Safely resolves or initializes an owner checkout session.
 * Durable across serverless instances: Uses HMAC-signed session tokens + Neon PostgreSQL authority.
 * Idempotent: Survives page refreshes, back button navigation, crawlers, and prefetch races.
 */
export async function getOrCreateCheckoutSession(
  contextId: string,
  sessionToken?: string | null,
  options?: {
    baseUrl?: string;
    keyId?: string;
    secret?: string;
    sessionSecret?: string;
    sessionSecrets?: Record<string, string>;
    fetcher?: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
    dbOverride?: any;
    now?: number;
  }
): Promise<
  ContextRedeemResult & {
    sessionId?: string;
    sessionToken?: string;
    isExistingSession?: boolean;
  }
> {
  const now = options?.now || Date.now();
  pruneExpiredSessions(now);

  const verified = verifySessionToken(sessionToken, JFD_SESSION_AUDIENCE, options);
  const effectiveSessionId = verified?.sid || null;

  // 1. Check if session was explicitly invalidated by server (in-memory or durable in Neon) - FAIL CLOSED
  if (effectiveSessionId) {
    const invalidationCheck = await isSessionInvalidated(effectiveSessionId, options);
    if (!invalidationCheck.success) {
      // FAIL CLOSED: If DB is unreachable, we cannot verify session validity. Reject rather than treat as valid!
      return {
        success: false,
        errorCode: "DATABASE_UNAVAILABLE",
        message: "Unable to verify session validity with durable authority.",
        statusCode: 503,
      };
    }
    if (invalidationCheck.isInvalidated) {
      return {
        success: false,
        errorCode: "INVALID_SESSION",
        message: "Checkout session has been invalidated or completed.",
        statusCode: 410,
      };
    }
  }

  // 2. Check if session already exists in instance memory for this verified session identifier
  if (effectiveSessionId && activeCheckoutSessions.has(effectiveSessionId)) {
    const session = activeCheckoutSessions.get(effectiveSessionId)!;
    if (session.contextId === contextId && session.expiresAt > now) {
      return {
        success: true,
        data: session.data,
        statusCode: 200,
        sessionId: effectiveSessionId,
        sessionToken: sessionToken!,
        isExistingSession: true,
      };
    }
  }

  // 3. Check if an active session exists in instance memory for this contextId (e.g. prefetch race on same instance)
  for (const [id, session] of activeCheckoutSessions.entries()) {
    if (session.contextId === contextId && session.expiresAt > now) {
      const token = signSessionToken(
        { sessionId: id, contextId, expiresAt: session.expiresAt },
        options
      );
      return {
        success: true,
        data: session.data,
        statusCode: 200,
        sessionId: id,
        sessionToken: token,
        isExistingSession: true,
      };
    }
  }

  // 4. Redeem or Re-hydrate from Durable Neon Database via DCC Authority
  const result = await redeemOpaqueContext(contextId, options);
  if (!result.success || !result.data) {
    return result;
  }

  // 5. Create signed session token and cache locally (1-hour checkout window, bounded by context TTL)
  const newSessionId =
    effectiveSessionId ||
    `jfd_sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  const expiresAt = now + 60 * 60 * 1000;
  activeCheckoutSessions.set(newSessionId, {
    contextId,
    data: result.data,
    createdAt: now,
    expiresAt,
  });

  const token = signSessionToken(
    { sessionId: newSessionId, contextId, expiresAt },
    options
  );

  return {
    ...result,
    sessionId: newSessionId,
    sessionToken: token,
    isExistingSession: false,
  };
}
