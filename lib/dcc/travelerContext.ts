export const DCC_TRAVELER_CONTEXT_VERSION = 1 as const;
export const DCC_TRAVELER_CONTEXT_PARAM = "dcc_ctx";
export const DCC_TRAVELER_CONTEXT_SESSION_KEY = "dcc_traveler_context_v1";

export type DccTravelerType = "cruise" | "hotel" | "local" | "road-trip" | "airport" | "unknown";
export type DccMobility = "standard" | "limited" | "wheelchair" | "unknown";
export type DccPace = "relaxed" | "balanced" | "adventurous";
export type DccTransportationNeed = "needed" | "self" | "unsure";
export type DccHistoricalInterest = "strong" | "some" | "low";

export type DccTravelerContextV1 = {
  version: 1;
  destination: string;
  travelerType?: DccTravelerType;
  availableWindow?: {
    start?: string;
    end?: string;
    durationMinutes?: number;
  };
  group?: {
    adults?: number;
    children?: number;
    total?: number;
    mixedAges?: boolean;
  };
  mobility?: DccMobility;
  preferences?: {
    pace?: DccPace;
    interests?: string[];
    transportationNeed?: DccTransportationNeed;
    historicalInterest?: DccHistoricalInterest;
    outdoorPreference?: "prefer" | "neutral" | "avoid";
    weatherTolerance?: "low" | "normal" | "high";
  };
  source?: {
    property?: string;
    surface?: string;
    path?: string;
    handoffId?: string;
  };
  liveContext?: {
    period?: "morning" | "afternoon" | "evening";
    rainRisk?: "low" | "elevated" | "high";
    heatRisk?: "low" | "elevated" | "high";
    liveMusicSignal?: boolean;
    outdoorFriendly?: boolean;
  };
  destinationExtensions?: Record<string, unknown>;
};

export type DccRecommendationOutcomeV1 = {
  version: 1;
  destination: string;
  primaryProduct: string | null;
  secondaryProduct: string | null;
  bundleId: string | null;
  bundleProducts: string[];
  noFit: boolean;
  primaryReasons: string[];
  primaryCautions: string[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function cleanString(value: unknown, max = 160) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, max) : undefined;
}

function cleanNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : undefined;
}

function cleanBoolean(value: unknown) {
  return typeof value === "boolean" ? value : undefined;
}

function cleanStringArray(value: unknown, maxItems = 12) {
  if (!Array.isArray(value)) return undefined;
  const items = value.map((item) => cleanString(item, 80)).filter((item): item is string => Boolean(item)).slice(0, maxItems);
  return items.length ? items : undefined;
}

export function sanitizeDccTravelerContext(value: unknown): DccTravelerContextV1 | null {
  if (!isRecord(value)) return null;
  const destination = cleanString(value.destination, 80);
  if (!destination) return null;

  const availableWindow = isRecord(value.availableWindow) ? value.availableWindow : undefined;
  const group = isRecord(value.group) ? value.group : undefined;
  const preferences = isRecord(value.preferences) ? value.preferences : undefined;
  const source = isRecord(value.source) ? value.source : undefined;
  const liveContext = isRecord(value.liveContext) ? value.liveContext : undefined;

  return {
    version: 1,
    destination,
    travelerType: cleanString(value.travelerType, 32) as DccTravelerType | undefined,
    availableWindow: availableWindow ? {
      start: cleanString(availableWindow.start, 40),
      end: cleanString(availableWindow.end, 40),
      durationMinutes: cleanNumber(availableWindow.durationMinutes),
    } : undefined,
    group: group ? {
      adults: cleanNumber(group.adults),
      children: cleanNumber(group.children),
      total: cleanNumber(group.total),
      mixedAges: cleanBoolean(group.mixedAges),
    } : undefined,
    mobility: cleanString(value.mobility, 32) as DccMobility | undefined,
    preferences: preferences ? {
      pace: cleanString(preferences.pace, 32) as DccPace | undefined,
      interests: cleanStringArray(preferences.interests),
      transportationNeed: cleanString(preferences.transportationNeed, 32) as DccTransportationNeed | undefined,
      historicalInterest: cleanString(preferences.historicalInterest, 32) as DccHistoricalInterest | undefined,
      outdoorPreference: cleanString(preferences.outdoorPreference, 32) as "prefer" | "neutral" | "avoid" | undefined,
      weatherTolerance: cleanString(preferences.weatherTolerance, 32) as "low" | "normal" | "high" | undefined,
    } : undefined,
    source: source ? {
      property: cleanString(source.property, 80),
      surface: cleanString(source.surface, 80),
      path: cleanString(source.path, 160),
      handoffId: cleanString(source.handoffId, 96),
    } : undefined,
    liveContext: liveContext ? {
      period: cleanString(liveContext.period, 20) as "morning" | "afternoon" | "evening" | undefined,
      rainRisk: cleanString(liveContext.rainRisk, 20) as "low" | "elevated" | "high" | undefined,
      heatRisk: cleanString(liveContext.heatRisk, 20) as "low" | "elevated" | "high" | undefined,
      liveMusicSignal: cleanBoolean(liveContext.liveMusicSignal),
      outdoorFriendly: cleanBoolean(liveContext.outdoorFriendly),
    } : undefined,
    destinationExtensions: isRecord(value.destinationExtensions) ? value.destinationExtensions : undefined,
  };
}

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return decodeURIComponent(
    Array.from(atob(padded))
      .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`)
      .join(""),
  );
}

export function readDccTravelerContextFromUrl(search = typeof window !== "undefined" ? window.location.search : "") {
  if (!search) return null;
  const raw = new URLSearchParams(search).get(DCC_TRAVELER_CONTEXT_PARAM);
  if (!raw) return null;
  try {
    return sanitizeDccTravelerContext(JSON.parse(decodeBase64Url(raw)));
  } catch {
    return null;
  }
}

export function getStoredDccTravelerContext() {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(DCC_TRAVELER_CONTEXT_SESSION_KEY);
    return raw ? sanitizeDccTravelerContext(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function storeDccTravelerContext(context: DccTravelerContextV1 | null) {
  if (typeof window === "undefined" || !context) return;
  try {
    sessionStorage.setItem(DCC_TRAVELER_CONTEXT_SESSION_KEY, JSON.stringify(context));
  } catch {
    // Context continuity must never block the traveler experience.
  }
}

export function captureDccTravelerContext(search?: string) {
  const inbound = readDccTravelerContextFromUrl(search);
  if (inbound) storeDccTravelerContext(inbound);
  return inbound || getStoredDccTravelerContext();
}

export function buildDccTravelerContextParam(context: DccTravelerContextV1) {
  const json = JSON.stringify(context);
  const bytes = encodeURIComponent(json).replace(/%([0-9A-F]{2})/g, (_, hex: string) => String.fromCharCode(Number.parseInt(hex, 16)));
  return btoa(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
