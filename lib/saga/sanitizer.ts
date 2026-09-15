/**
 * Sanitizer for DCC Saga payloads, error codes, and audit events.
 * Strictly prevents storing API keys, bearer tokens, card data, raw payment payloads,
 * unrestricted stack traces, or unnecessary PII.
 */

const SENSITIVE_KEY_REGEX =
  /(api[-_]?key|bearer|token|secret|password|card[-_]?number|cvv|cvc|exp[-_]?(month|year)|pan|pin|authorization|cookie|session|client[-_]?secret)/i;

const CARD_NUMBER_REGEX = /\b(?:\d[ -]*?){13,19}\b/g;

/**
 * Deeply sanitizes any payload, stripping secrets, card data, and tokens.
 */
export function sanitizeSagaPayload<T>(input: T): T {
  if (input === null || input === undefined) {
    return input;
  }

  if (typeof input === "string") {
    // Redact credit card numbers
    let sanitized = input.replace(CARD_NUMBER_REGEX, "[REDACTED_CARD_NUMBER]");
    // Redact bearer tokens
    sanitized = sanitized.replace(/Bearer\s+[A-Za-z0-9._~+/-]+=*/gi, "Bearer [REDACTED_TOKEN]");
    return sanitized as unknown as T;
  }

  if (typeof input !== "object") {
    return input;
  }

  if (Array.isArray(input)) {
    return input.map((item) => sanitizeSagaPayload(item)) as unknown as T;
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (SENSITIVE_KEY_REGEX.test(key)) {
      result[key] = "[REDACTED]";
    } else {
      result[key] = sanitizeSagaPayload(value);
    }
  }

  return result as T;
}

/**
 * Sanitizes errors: extracts standard code and sanitized message, suppressing raw stack traces and secrets.
 */
export function sanitizeSagaError(err: unknown): { errorCode: string; errorMessage: string } {
  if (!err) {
    return { errorCode: "UNKNOWN_ERROR", errorMessage: "An unknown error occurred" };
  }

  if (typeof err === "string") {
    return {
      errorCode: "ERROR",
      errorMessage: sanitizeSagaPayload(err).slice(0, 300),
    };
  }

  const e = err as {
    code?: string;
    octoError?: string;
    status?: number;
    name?: string;
    message?: string;
  };

  let code = e.octoError || e.code;
  if (!code && e.message) {
    const prefixMatch = e.message.match(/^([A-Z0-9_]{3,}):/);
    if (prefixMatch) {
      code = prefixMatch[1];
    }
  }
  if (!code) {
    code = e.name && e.name !== "Error" ? e.name : "SAGA_ERROR";
  }
  let message = e.message || "An unexpected error occurred during saga execution";

  // Sanitize message content
  message = sanitizeSagaPayload(message);

  // Truncate message to avoid log amplification
  if (message.length > 500) {
    message = message.slice(0, 497) + "...";
  }

  return {
    errorCode: code,
    errorMessage: message,
  };
}
