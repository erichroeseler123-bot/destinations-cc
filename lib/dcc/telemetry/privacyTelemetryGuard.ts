/**
 * Privacy-preserving funnel telemetry sanitizer for DCC network telemetry ingest.
 *
 * Enforces zero storage/propagation of:
 * - Passenger/organizer names, email addresses, or phone numbers
 * - Cabin/stateroom/deck numbers
 * - Provider booking references, booking session IDs, signatures, or organizer tokens
 * - Cruise Promenade public share codes (including /p/<shareCode> paths)
 */

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const PHONE_RE = /(?:\+?\d{1,3}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/;
const CABIN_RE = /\b(?:cabin|stateroom|room|berth|deck)\s*#?\s*[A-Z]?\d{2,5}[A-Z]?\b/i;
const BOOKING_SESSION_RE = /\bcpsess_[a-f0-9]{16,64}\b/i;
const SHARE_PATH_RE = /\/(p|organizer)\/[A-Za-z0-9_-]{6,64}/g;

const FORBIDDEN_TELEMETRY_KEY_RE =
  /^(?:share_?code|from_?share_?code|partner_?booking_?ref|booking_?ref|provider_?booking_?ref|booking_?session_?id|organizer_?token|signature|provider_?event_?id|email|phone|full_?name|first_?name|last_?name|passenger_?name|traveler_?name|display_?name|cabin|cabin_?number|stateroom|passport|birth_?date)$/i;

export function sanitizeTelemetryPath(rawPath: unknown): string | undefined {
  if (typeof rawPath !== "string") return undefined;
  const trimmed = rawPath.trim();
  if (!trimmed) return undefined;
  // Strip query strings and fragments so URL params can never leak tokens/refs/emails
  const withoutQuery = trimmed.split("?")[0].split("#")[0];
  const redactedShares = withoutQuery
    .replace(SHARE_PATH_RE, "/$1/[redacted]")
    .replace(BOOKING_SESSION_RE, "[redacted]");
  if (EMAIL_RE.test(redactedShares) || CABIN_RE.test(redactedShares)) {
    return "/[redacted]";
  }
  return redactedShares.slice(0, 180);
}

export function sanitizeTelemetryMetadataObject(
  input: unknown,
): Record<string, string | number | boolean> | undefined {
  if (!input || typeof input !== "object" || Array.isArray(input)) return undefined;
  const out: Record<string, string | number | boolean> = {};

  for (const [rawKey, rawVal] of Object.entries(input as Record<string, unknown>)) {
    const key = rawKey.trim();
    if (!key || key.length > 64) continue;
    if (FORBIDDEN_TELEMETRY_KEY_RE.test(key)) {
      if (/share_?code/i.test(key)) {
        out.hasShareContext = true;
      }
      continue;
    }

    if (typeof rawVal === "boolean") {
      out[key] = rawVal;
      continue;
    }
    if (typeof rawVal === "number" && Number.isFinite(rawVal)) {
      out[key] = rawVal;
      continue;
    }
    if (typeof rawVal === "string") {
      const val = rawVal.trim();
      if (!val) continue;
      if (
        EMAIL_RE.test(val) ||
        PHONE_RE.test(val) ||
        CABIN_RE.test(val) ||
        BOOKING_SESSION_RE.test(val) ||
        /^[a-f0-9]{24}$/i.test(val) // 24-hex Cruise Promenade shareCode pattern
      ) {
        continue;
      }
      out[key] = val.replace(SHARE_PATH_RE, "/$1/[redacted]").slice(0, 140);
    }
  }

  return Object.keys(out).length > 0 ? out : undefined;
}
