export type SpecialistCommercialHost =
  | "juneauflightdeck.com"
  | "welcometoneworleanstours.com"
  | "lastfrontiershoreexcursions.com";

export interface SanitizedCommercialAttribution {
  source: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  specialistSite: SpecialistCommercialHost;
  portSlug: string | null;
  shipName: string | null;
  shipSlug: string | null;
  sailDate: string | null;
  portDate: string | null;
  arrivalTime: string | null;
  allAboardTime: string | null;
  berthOrTerminal: string | null;
  partySize: number | null;
  handoffId: string | null;
  contextId: string | null;
  landingPath: string | null;
  strippedPrivateKeys: string[];
}

export const FORBIDDEN_PII_QUERY_KEYS = [
  "name",
  "fullname",
  "full_name",
  "firstname",
  "first_name",
  "lastname",
  "last_name",
  "guestname",
  "guest_name",
  "email",
  "guestemail",
  "guest_email",
  "contactemail",
  "contact_email",
  "phone",
  "guestphone",
  "guest_phone",
  "mobile",
  "cabin",
  "cabinnumber",
  "cabin_number",
  "stateroom",
  "stateroomnumber",
  "stateroom_number",
  "sharecode",
  "share_code",
  "plannertoken",
  "planner_token",
  "participantid",
  "participant_id",
  "guestlist",
  "guest_list",
  "bookingref",
  "booking_ref",
  "reservationnumber",
  "reservation_number",
  "pnr",
  "weight",
  "weights",
  "passengerweight",
  "passenger_weights_lbs",
  "medicalnotes",
  "medical_notes",
] as const;

const FORBIDDEN_KEY_SET = new Set<string>(FORBIDDEN_PII_QUERY_KEYS);

const EMAIL_IN_TEXT_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const PHONE_IN_TEXT_RE = /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}\b/g;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const HHMM_TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function scrubPotentialPiiToken(
  raw: unknown,
  maxLength = 120,
): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const scrubbed = trimmed
    .replace(EMAIL_IN_TEXT_RE, "[redacted-email]")
    .replace(PHONE_IN_TEXT_RE, "[redacted-phone]")
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, maxLength);
  return scrubbed || null;
}

export function slugifyShipIdentifier(raw: string | null | undefined): string | null {
  if (!raw || typeof raw !== "string") return null;
  const slug = raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return slug || null;
}

function normalizeIsoDate(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!ISO_DATE_RE.test(trimmed)) return null;
  const parsed = new Date(`${trimmed}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10) === trimmed ? trimmed : null;
}

function normalizeClockTime(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  return HHMM_TIME_RE.test(trimmed) ? trimmed : null;
}

function normalizePartySize(raw: unknown): number | null {
  if (raw === undefined || raw === null || raw === "") return null;
  const num = Number(raw);
  if (!Number.isFinite(num)) return null;
  const rounded = Math.round(num);
  if (rounded < 1 || rounded > 200) return null;
  return rounded;
}

function readParam(
  input: URLSearchParams | Record<string, unknown>,
  keys: string[],
): unknown {
  if (input instanceof URLSearchParams) {
    for (const k of keys) {
      const val = input.get(k);
      if (val !== null && val.trim() !== "") return val;
    }
    return null;
  }
  for (const k of keys) {
    const val = input[k];
    if (val !== undefined && val !== null && String(val).trim() !== "") {
      return val;
    }
  }
  return null;
}

export function collectForbiddenPiiKeys(
  input: URLSearchParams | Record<string, unknown>,
): string[] {
  const detected = new Set<string>();
  const rawKeys =
    input instanceof URLSearchParams
      ? Array.from(input.keys())
      : Object.keys(input);

  for (const key of rawKeys) {
    const normalized = key.trim().toLowerCase();
    if (
      FORBIDDEN_KEY_SET.has(normalized) ||
      normalized.includes("email") ||
      normalized.includes("phone") ||
      normalized.includes("cabin") ||
      normalized.includes("stateroom") ||
      normalized.includes("sharecode") ||
      normalized.includes("share_code") ||
      normalized.includes("plannertoken") ||
      normalized.includes("planner_token") ||
      normalized.includes("pnr")
    ) {
      detected.add(key);
    }
  }
  return Array.from(detected).sort();
}

export function stripPrivateParamsFromSearch(rawSearch: string): {
  cleanSearch: string;
  strippedKeys: string[];
} {
  const params = new URLSearchParams(
    rawSearch.startsWith("?") ? rawSearch.slice(1) : rawSearch,
  );
  const strippedKeys = collectForbiddenPiiKeys(params);
  for (const key of strippedKeys) {
    params.delete(key);
  }
  const serialized = params.toString();
  return {
    cleanSearch: serialized ? `?${serialized}` : "",
    strippedKeys,
  };
}

export function extractNonPiiAttribution(
  input: URLSearchParams | Record<string, unknown> | null | undefined,
  options: {
    specialistSite: SpecialistCommercialHost;
    defaultPortSlug?: string | null;
    landingPath?: string | null;
  },
): SanitizedCommercialAttribution {
  const safeInput = input || {};
  const strippedFromInput = collectForbiddenPiiKeys(safeInput);
  const preRecordedStripped =
    !(safeInput instanceof URLSearchParams) &&
    Array.isArray((safeInput as Record<string, unknown>).strippedPrivateKeys)
      ? ((safeInput as Record<string, unknown>).strippedPrivateKeys as unknown[])
          .filter((k): k is string => typeof k === "string" && k.trim().length > 0)
          .map((k) => k.trim().slice(0, 64))
      : [];
  const strippedPrivateKeys = Array.from(
    new Set([...strippedFromInput, ...preRecordedStripped]),
  ).sort();

  const utmSource = scrubPotentialPiiToken(
    readParam(safeInput, ["utm_source", "utmSource"]),
    80,
  );
  const utmMedium = scrubPotentialPiiToken(
    readParam(safeInput, ["utm_medium", "utmMedium"]),
    80,
  );
  const utmCampaign = scrubPotentialPiiToken(
    readParam(safeInput, ["utm_campaign", "utmCampaign", "campaign"]),
    120,
  );
  const utmContent = scrubPotentialPiiToken(
    readParam(safeInput, ["utm_content", "utmContent"]),
    120,
  );
  const rawSource = scrubPotentialPiiToken(
    readParam(safeInput, ["source", "ref_site", "referrerHost"]),
    100,
  );

  const shipName = scrubPotentialPiiToken(
    readParam(safeInput, ["ship", "shipName", "ship_name"]),
    80,
  );
  const explicitShipSlug = scrubPotentialPiiToken(
    readParam(safeInput, ["shipSlug", "ship_slug"]),
    80,
  );
  const shipSlug = slugifyShipIdentifier(explicitShipSlug || shipName);

  const sailDate = normalizeIsoDate(
    readParam(safeInput, ["sailDate", "sail_date", "sailingDate"]),
  );
  const portDate =
    normalizeIsoDate(
      readParam(safeInput, ["portDate", "port_date", "date", "juneauDate"]),
    ) || sailDate;

  const portSlug =
    scrubPotentialPiiToken(
      readParam(safeInput, ["port", "portSlug", "port_slug", "portCity"]),
      48,
    )?.toLowerCase() ||
    options.defaultPortSlug ||
    null;

  const arrivalTime = normalizeClockTime(
    readParam(safeInput, ["arrival", "arrivalTime", "arrival_time"]),
  );
  const allAboardTime = normalizeClockTime(
    readParam(safeInput, ["allAboard", "all_aboard", "allAboardTime"]),
  );
  const berthOrTerminal = scrubPotentialPiiToken(
    readParam(safeInput, ["berth", "berthOrTerminal", "terminal"]),
    64,
  );
  const partySize = normalizePartySize(
    readParam(safeInput, ["partySize", "party_size", "guests"]),
  );
  const handoffId = scrubPotentialPiiToken(
    readParam(safeInput, ["handoffId", "handoff_id"]),
    96,
  );
  const contextId = scrubPotentialPiiToken(
    readParam(safeInput, ["contextId", "ctx", "dcc_ctx"]),
    96,
  );
  const landingPath =
    scrubPotentialPiiToken(
      readParam(safeInput, ["landingPath", "sourcePage", "sourcePath"]),
      160,
    ) ||
    scrubPotentialPiiToken(options.landingPath, 160) ||
    null;

  return {
    source: rawSource || utmSource || "direct",
    utmSource,
    utmMedium,
    utmCampaign,
    utmContent,
    specialistSite: options.specialistSite,
    portSlug,
    shipName,
    shipSlug,
    sailDate,
    portDate,
    arrivalTime,
    allAboardTime,
    berthOrTerminal,
    partySize,
    handoffId,
    contextId,
    landingPath,
    strippedPrivateKeys,
  };
}

export function formatAttributionSummaryLine(
  attr: Partial<SanitizedCommercialAttribution> | null | undefined,
): string | null {
  if (!attr || typeof attr !== "object") return null;
  const segments: string[] = [];
  if (attr.specialistSite) segments.push(`specialist=${attr.specialistSite}`);
  const src = attr.utmSource || attr.source;
  if (src) segments.push(`source=${src}`);
  if (attr.utmMedium) segments.push(`medium=${attr.utmMedium}`);
  if (attr.utmCampaign) segments.push(`campaign=${attr.utmCampaign}`);
  if (attr.portSlug) segments.push(`port=${attr.portSlug}`);
  if (attr.shipName || attr.shipSlug) {
    const sail = attr.sailDate || attr.portDate;
    segments.push(
      `sailing=${attr.shipName || attr.shipSlug}${sail ? `@${sail}` : ""}`,
    );
  } else if (attr.sailDate || attr.portDate) {
    segments.push(`date=${attr.sailDate || attr.portDate}`);
  }
  if (attr.allAboardTime) segments.push(`allAboard=${attr.allAboardTime}`);
  if (attr.handoffId) segments.push(`handoff=${attr.handoffId}`);
  return segments.length > 0 ? segments.join(" | ") : null;
}

export function buildCruisePromenadeCoordinationHref(options: {
  shipName?: string | null;
  shipSlug?: string | null;
  sailDate?: string | null;
  portSlug?: string | null;
  specialistSite: SpecialistCommercialHost;
  campaign?: string | null;
}): {
  href: string;
  isExactSailingRollCall: boolean;
} {
  const resolvedSlug = slugifyShipIdentifier(options.shipSlug || options.shipName);
  const validDate = normalizeIsoDate(options.sailDate);
  const query = new URLSearchParams();
  query.set("utm_source", options.specialistSite.replace(/\.com$/i, ""));
  query.set("utm_medium", "specialist_return");
  query.set(
    "utm_campaign",
    scrubPotentialPiiToken(options.campaign, 80) || "group_coordination_return",
  );
  if (options.portSlug) {
    query.set("port", options.portSlug);
  }

  if (resolvedSlug && validDate) {
    return {
      href: `https://cruisepromenade.com/roll-call/${encodeURIComponent(resolvedSlug)}/${encodeURIComponent(validDate)}?${query.toString()}`,
      isExactSailingRollCall: true,
    };
  }

  return {
    href: `https://cruisepromenade.com/planner?${query.toString()}`,
    isExactSailingRollCall: false,
  };
}

export function isPreviewOrLocalRuntime(request?: Request | null): boolean {
  const vercelEnv = (process.env.VERCEL_ENV || "").trim().toLowerCase();
  if (vercelEnv === "preview" || vercelEnv === "development" || vercelEnv === "test") {
    return true;
  }
  if (!request) return false;

  const candidates = [
    request.headers.get("x-forwarded-host"),
    request.headers.get("host"),
    request.headers.get("origin"),
    request.headers.get("referer"),
    (() => {
      try {
        return new URL(request.url).hostname;
      } catch {
        return null;
      }
    })(),
  ]
    .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
    .map((v) => v.toLowerCase());

  return candidates.some(
    (h) =>
      h.includes(".vercel.app") ||
      h.includes("localhost") ||
      h.includes("127.0.0.1"),
  );
}
