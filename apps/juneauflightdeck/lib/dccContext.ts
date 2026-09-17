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

/**
 * Safely resolves or initializes an owner checkout session.
 * Idempotent: Survives page refreshes, back button navigation, crawlers, and prefetch races.
 */
export async function getOrCreateCheckoutSession(
  contextId: string,
  sessionId?: string | null,
  options?: {
    baseUrl?: string;
    keyId?: string;
    secret?: string;
    fetcher?: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
  }
): Promise<ContextRedeemResult & { sessionId?: string; isExistingSession?: boolean }> {
  const now = Date.now();
  pruneExpiredSessions(now);

  // 1. Check if session already exists for this session identifier
  if (sessionId && activeCheckoutSessions.has(sessionId)) {
    const session = activeCheckoutSessions.get(sessionId)!;
    if (session.contextId === contextId && session.expiresAt > now) {
      return {
        success: true,
        data: session.data,
        statusCode: 200,
        sessionId,
        isExistingSession: true,
      };
    }
  }

  // 2. Check if an active session exists for this contextId (e.g. page refresh)
  for (const [id, session] of activeCheckoutSessions.entries()) {
    if (session.contextId === contextId && session.expiresAt > now) {
      return {
        success: true,
        data: session.data,
        statusCode: 200,
        sessionId: id,
        isExistingSession: true,
      };
    }
  }

  // 3. Redeem fresh token from DCC Authority
  const result = await redeemOpaqueContext(contextId, options);
  if (!result.success || !result.data) {
    return result;
  }

  // 4. Cache in active checkout session store (1-hour checkout window)
  const newSessionId = sessionId || `jfd_sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  activeCheckoutSessions.set(newSessionId, {
    contextId,
    data: result.data,
    createdAt: now,
    expiresAt: now + 60 * 60 * 1000,
  });

  return {
    ...result,
    sessionId: newSessionId,
    isExistingSession: false,
  };
}
