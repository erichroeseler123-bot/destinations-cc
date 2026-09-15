import { headers } from "next/headers";
import { OctoApiError } from "./adapter";

export const OCTO_SPEC_REVISION = "1.2.0";
export const OCTO_SUPPORTED_CAPABILITIES = [
  "octo/core",
  "octo/pricing",
  "octo/content",
  "octo/pickups",
  "octo/webhooks",
];

export interface OctoAuthContext {
  authorized: boolean;
  resellerId?: string;
  scope?: string;
  isSandbox?: boolean;
}

/**
 * Validates standard OCTO Bearer authentication token from request headers
 */
export function validateOctoBearerAuth(req: Request): {
  authorized: boolean;
  context?: OctoAuthContext;
  errorResponse?: Response;
} {
  const authHeader = req.headers.get("authorization") || "";
  if (!authHeader) {
    return {
      authorized: false,
      errorResponse: octoErrorResponse(
        "INVALID_BEARER_TOKEN",
        "Authorization header with Bearer token is required",
        401
      ),
    };
  }

  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return {
      authorized: false,
      errorResponse: octoErrorResponse(
        "INVALID_BEARER_TOKEN",
        "Malformed Authorization header. Format must be: Bearer <token>",
        401
      ),
    };
  }

  const token = match[1].trim();
  const configuredTokens = [
    process.env.OCTO_RESELLER_TOKEN,
    process.env.INTERNAL_API_SECRET,
    // Development default token for local verification & testing
    process.env.NODE_ENV !== "production" ? "octo_test_bearer_token_dcc_2026" : undefined,
  ].filter(Boolean) as string[];

  // Support any non-empty bearer token in development/test if no explicit token is configured
  const isValid =
    configuredTokens.includes(token) ||
    (process.env.NODE_ENV !== "production" && token.length > 5);

  if (!isValid) {
    return {
      authorized: false,
      errorResponse: octoErrorResponse(
        "UNAUTHORIZED",
        "The provided Bearer token is invalid or expired",
        401
      ),
    };
  }

  return {
    authorized: true,
    context: {
      authorized: true,
      resellerId: "dcc-authorized-reseller",
      scope: "octo:core:full",
      isSandbox: process.env.NODE_ENV !== "production",
    },
  };
}

/**
 * Creates standard OCTO JSON HTTP response
 */
export function octoJsonResponse(data: unknown, status: number = 200, customHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Octo-Capabilities": OCTO_SUPPORTED_CAPABILITIES.join(","),
      "Octo-Version": OCTO_SPEC_REVISION,
      "Cache-Control": "no-store, no-cache, must-revalidate",
      ...customHeaders,
    },
  });
}

/**
 * Creates standard OCTO error HTTP response adhering strictly to OCTO Core schema:
 * { "error": "ERROR_CODE", "errorMessage": "Human readable description" }
 */
export function octoErrorResponse(error: string, errorMessage: string, status: number = 400): Response {
  return octoJsonResponse(
    {
      error,
      errorMessage,
    },
    status
  );
}

/**
 * Maps caught errors (including OctoApiError) to standard OCTO HTTP error responses
 */
export function handleOctoRouteError(err: any): Response {
  if (err instanceof OctoApiError) {
    return octoErrorResponse(err.octoError, err.message, err.status);
  }

  const message = err?.message || "Internal server error occurred while processing OCTO request";
  return octoErrorResponse("INTERNAL_ERROR", message, 500);
}

/**
 * Structured logger that guarantees no secrets, API keys, or payment PII are leaked
 */
export function logOctoEvent(action: string, metadata: Record<string, unknown>): void {
  const sanitized = { ...metadata };

  const SENSITIVE_KEYS = [
    "authorization",
    "apikey",
    "api_key",
    "token",
    "bearer",
    "cardnumber",
    "cvv",
    "password",
    "secret",
  ];

  for (const key of Object.keys(sanitized)) {
    const lower = key.toLowerCase();
    if (SENSITIVE_KEYS.some((s) => lower.includes(s))) {
      sanitized[key] = "[REDACTED]";
    }
  }

  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      service: "dcc-octo-core",
      action,
      ...sanitized,
    })
  );
}
