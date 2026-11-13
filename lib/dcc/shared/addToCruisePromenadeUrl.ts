/**
 * Zero-Dependency Pure URL Builder for Cruise Promenade Shared Plan Handoffs.
 *
 * Constructs `https://cruisepromenade.com/planner/add?...` carrying only sanitized,
 * non-PII planning fields while enforcing `edgeContextAndPii.ts` scrubbing rules
 * so passenger names, emails, phones, weights, cabin numbers, and `dcc_ctx_` tokens
 * can never leak into URLs or browser history.
 */

import { stripEdgePiiQueryParams } from "./edgeContextAndPii";
import {
  mapRawFitToCanonicalStatus,
  type CanonicalFitStatus,
} from "./canonicalFitStatus";

export const CRUISE_PROMENADE_PLANNER_ADD_ORIGIN = "https://cruisepromenade.com";
export const CRUISE_PROMENADE_PLANNER_ADD_PATH = "/planner/add";

export interface AddToCruisePromenadeParams {
  title?: string | null;
  port?: string | null;
  date?: string | null;
  portDate?: string | null;
  ship?: string | null;
  sailDate?: string | null;
  cruiseLine?: string | null;
  durationMinutes?: number | string | null;
  partySize?: number | string | null;
  operator?: string | null;
  fitStatus?: CanonicalFitStatus | string | null;
  sourceSite?: string | null;
  productCode?: string | null;
  handoffId?: string | null;
  journey_id?: string | null;
  journeyId?: string | null;
  stage?: string | null;
  shareCode?: string | null;
  baseOrigin?: string | null;
  [extraKey: string]: unknown;
}

const ALLOWED_NON_PII_OUTPUT_KEYS = [
  "title",
  "port",
  "date",
  "ship",
  "sailDate",
  "cruiseLine",
  "durationMinutes",
  "partySize",
  "operator",
  "fitStatus",
  "sourceSite",
  "productCode",
  "handoffId",
  "journey_id",
  "journeyId",
  "stage",
] as const;

const SAFE_SHARE_CODE_RE = /^[A-Za-z0-9_-]{2,64}$/;
const SAFE_JOURNEY_TOKEN_RE = /^[A-Za-z0-9_-]{4,64}$/;
const SAFE_STAGE_TOKEN_RE = /^[A-Za-z0-9_-]{1,48}$/;
const EMAIL_SUBSTRING_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;

function sanitizeTextValue(raw: unknown, maxLen = 160): string | null {
  if (raw === null || raw === undefined) return null;
  const text = String(raw)
    .replace(EMAIL_SUBSTRING_RE, "")
    .replace(/\bdcc_ctx_[a-z0-9_-]+/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return null;
  return text.slice(0, maxLen);
}

function sanitizeJourneyToken(raw: unknown): string | null {
  const cleaned = sanitizeTextValue(raw, 64);
  if (!cleaned || cleaned.startsWith("dcc_ctx_")) return null;
  return SAFE_JOURNEY_TOKEN_RE.test(cleaned) ? cleaned : null;
}

function sanitizeStageToken(raw: unknown): string | null {
  const cleaned = sanitizeTextValue(raw, 48);
  if (!cleaned || cleaned.startsWith("dcc_ctx_")) return null;
  return SAFE_STAGE_TOKEN_RE.test(cleaned) ? cleaned : null;
}

function sanitizePositiveInt(raw: unknown, maxVal = 10000): string | null {
  if (raw === null || raw === undefined || raw === "") return null;
  const parsed = typeof raw === "number" ? raw : Number(String(raw).trim());
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  const rounded = Math.round(parsed);
  if (rounded <= 0 || rounded > maxVal) return null;
  return String(rounded);
}

/**
 * Builds a sanitized `https://cruisepromenade.com/planner/add?...` URL.
 *
 * 1. Stages all incoming keys on a `URL` and runs `stripEdgePiiQueryParams` so
 *    any accidental PII or `dcc_ctx_` token keys are stripped immediately.
 * 2. Emits only explicit non-PII itinerary fields (`title`, `port`, `date`, `ship`,
 *    `sailDate`, `cruiseLine`, `durationMinutes`, `partySize`, `operator`,
 *    `fitStatus`, `sourceSite`, `productCode`, `handoffId`, `journey_id`, `journeyId`,
 *    `stage`, and a validated alphanumeric `shareCode` when explicitly supplied).
 */
export function buildAddToCruisePromenadeUrl(
  params: AddToCruisePromenadeParams,
): string {
  const origin = (params.baseOrigin?.trim() || CRUISE_PROMENADE_PLANNER_ADD_ORIGIN).replace(
    /\/+$/,
    "",
  );
  const stagingUrl = new URL(CRUISE_PROMENADE_PLANNER_ADD_PATH, origin);

  // Stage any raw caller-supplied entries and apply edge PII scrubbing rules first.
  for (const [key, value] of Object.entries(params)) {
    if (key === "baseOrigin" || value === null || value === undefined) continue;
    if (typeof value === "string" || typeof value === "number") {
      stagingUrl.searchParams.set(key, String(value));
    }
  }
  stripEdgePiiQueryParams(stagingUrl);

  const sanitizedJourneySnake = sanitizeJourneyToken(
    stagingUrl.searchParams.get("journey_id"),
  );
  const sanitizedJourneyCamel = sanitizeJourneyToken(
    stagingUrl.searchParams.get("journeyId"),
  );

  const normalizedEntries: Record<string, string | null> = {
    title: sanitizeTextValue(stagingUrl.searchParams.get("title"), 160),
    port: sanitizeTextValue(stagingUrl.searchParams.get("port"), 80)?.toLowerCase() ?? null,
    date: sanitizeTextValue(
      stagingUrl.searchParams.get("date") ?? stagingUrl.searchParams.get("portDate"),
      32,
    ),
    ship: sanitizeTextValue(stagingUrl.searchParams.get("ship"), 100),
    sailDate: sanitizeTextValue(stagingUrl.searchParams.get("sailDate"), 32),
    cruiseLine: sanitizeTextValue(stagingUrl.searchParams.get("cruiseLine"), 80),
    durationMinutes: sanitizePositiveInt(
      stagingUrl.searchParams.get("durationMinutes"),
      2880,
    ),
    partySize: sanitizePositiveInt(stagingUrl.searchParams.get("partySize"), 200),
    operator: sanitizeTextValue(stagingUrl.searchParams.get("operator"), 120),
    fitStatus: stagingUrl.searchParams.get("fitStatus")?.trim()
      ? mapRawFitToCanonicalStatus(stagingUrl.searchParams.get("fitStatus"))
      : null,
    sourceSite:
      sanitizeTextValue(stagingUrl.searchParams.get("sourceSite"), 100)?.toLowerCase() ??
      null,
    productCode: sanitizeTextValue(stagingUrl.searchParams.get("productCode"), 64),
    handoffId: sanitizeTextValue(stagingUrl.searchParams.get("handoffId"), 80),
    journey_id: sanitizedJourneySnake ?? sanitizedJourneyCamel,
    journeyId: sanitizedJourneyCamel,
    stage: sanitizeStageToken(stagingUrl.searchParams.get("stage")),
  };

  const cleanUrl = new URL(CRUISE_PROMENADE_PLANNER_ADD_PATH, origin);
  for (const key of ALLOWED_NON_PII_OUTPUT_KEYS) {
    const val = normalizedEntries[key];
    if (val) {
      cleanUrl.searchParams.set(key, val);
    }
  }

  // `shareCode` is stripped on third-party outbound redirects by `stripEdgePiiQueryParams`,
  // so re-attach it ONLY on `cruisepromenade.com/planner/add` when it is a clean opaque code.
  if (typeof params.shareCode === "string") {
    const trimmedShareCode = params.shareCode.trim();
    if (
      SAFE_SHARE_CODE_RE.test(trimmedShareCode) &&
      !trimmedShareCode.startsWith("dcc_ctx_")
    ) {
      cleanUrl.searchParams.set("shareCode", trimmedShareCode);
    }
  }

  return cleanUrl.toString();
}
