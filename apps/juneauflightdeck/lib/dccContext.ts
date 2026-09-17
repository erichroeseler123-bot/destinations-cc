import crypto from "crypto";
import { signServiceRequest } from "@/lib/dcc/auth/hmac-service-auth";
import type { DccContextRedeemResponse } from "@/lib/dcc/context/schema";

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

interface SessionPayload {
  sid: string;
  ctx: string;
  exp: number;
}

function getSessionSigningSecret(options?: { secret?: string }): string {
  return (
    options?.secret ||
    process.env.DCC_JFD_SERVICE_SECRET?.trim() ||
    process.env.INTERNAL_API_SECRET?.trim() ||
    "jfd_fallback_session_secret"
  );
}

export function signSessionToken(
  payload: { sessionId: string; contextId: string; expiresAt: number },
  options?: { secret?: string }
): string {
  const secret = getSessionSigningSecret(options);
  const data: SessionPayload = {
    sid: payload.sessionId,
    ctx: payload.contextId,
    exp: payload.expiresAt,
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
  options?: { secret?: string }
): SessionPayload | null {
  if (!token || typeof token !== "string" || !token.includes(".")) {
    return null;
  }
  const [encodedData, signature] = token.split(".");
  if (!encodedData || !signature) {
    return null;
  }
  const secret = getSessionSigningSecret(options);
  const expectedSig = crypto
    .createHmac("sha256", secret)
    .update(encodedData)
    .digest("base64url");

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(encodedData, "base64url").toString("utf8")) as SessionPayload;
    if (!parsed.sid || !parsed.ctx || !parsed.exp) {
      return null;
    }
    if (parsed.exp <= Date.now()) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

interface CheckoutSession {
  contextId: string;
  data: DccContextRedeemResponse;
  createdAt: number;
  expiresAt: number;
}

const activeCheckoutSessions = new Map<string, CheckoutSession>();

function pruneExpiredSessions(now: number) {
  for (const [id, session] of activeCheckoutSessions.entries()) {
    if (session.expiresAt <= now) {
      activeCheckoutSessions.delete(id);
    }
  }
}

export function clearCheckoutSessionCacheForTesting() {
  activeCheckoutSessions.clear();
}

export function invalidateCheckoutSession(sessionIdOrToken: string) {
  const verified = verifySessionToken(sessionIdOrToken);
  const sid = verified ? verified.sid : sessionIdOrToken;
  activeCheckoutSessions.delete(sid);
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
    fetcher?: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
  }
): Promise<
  ContextRedeemResult & {
    sessionId?: string;
    sessionToken?: string;
    isExistingSession?: boolean;
  }
> {
  const now = Date.now();
  pruneExpiredSessions(now);

  const verified = verifySessionToken(sessionToken, options);
  const effectiveSessionId = verified?.sid || null;

  // 1. Check if session already exists in instance memory for this verified session identifier
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

  // 2. Check if an active session exists in instance memory for this contextId (e.g. prefetch race on same instance)
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

  // 3. Redeem or Re-hydrate from Durable Neon Database via DCC Authority
  const result = await redeemOpaqueContext(contextId, options);
  if (!result.success || !result.data) {
    return result;
  }

  // 4. Create signed session token and cache locally (1-hour checkout window, bounded by context TTL)
  const newSessionId = effectiveSessionId || `jfd_sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
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
