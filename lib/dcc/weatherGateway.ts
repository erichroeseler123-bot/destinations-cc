import { redis } from "@/lib/redis";
import { recordUpstreamFetchCall } from "@/lib/dcc/locationIntelligence";

export type OpenMeteoEndpointKind = "forecast" | "marine" | "air-quality" | "flood";

export type WeatherDataMode =
  | "live_noaa"
  | "live_open_meteo_commercial"
  | "cached_snapshot"
  | "seasonal_climatology";

export type WeatherFreshnessStatus =
  | "fresh"
  | "stale_cached_snapshot"
  | "climatology_fallback";

export interface CentralizedWeatherHourlyPoint {
  startTime: string;
  temperatureF: number | null;
  temperatureC: number | null;
  shortForecast: string;
  precipitationProbability: number | null;
  windMph: number | null;
}

export interface SeasonalClimatologyRange {
  monthIndex: number;
  monthName: string;
  typicalLowF: number;
  typicalHighF: number;
  typicalRainRiskLabel: string;
  climateZoneLabel: string;
}

export interface CentralizedWeatherSummary {
  ok: true;
  label: string;
  coordinates: { lat: number; lng: number };
  isUsNoaaEligible: boolean;
  dataMode: WeatherDataMode;
  /**
   * HARD INVARIANT: Must be `false` whenever serving a stale cached snapshot
   * or seasonal climatology. Never represent climatology or stale data as current conditions.
   */
  isCurrentConditions: boolean;
  freshnessStatus: WeatherFreshnessStatus;
  freshnessLabel: string;
  provider: string;
  attribution: string;
  observedAt: string | null;
  checkedAt: string;
  /** Live or verified-snapshot temperature; strictly `null` for seasonal climatology. */
  temperatureF: number | null;
  temperatureC: number | null;
  apparentTemperatureF: number | null;
  apparentTemperatureC: number | null;
  windMph: number | null;
  windKph: number | null;
  humidityPercent: number | null;
  rainChance: number | null;
  weatherCode: number | null;
  condition: string;
  icon: "sun" | "cloud" | "rain" | "storm" | "snow" | "fog";
  advisory: string;
  climatology: SeasonalClimatologyRange | null;
  nextHours: CentralizedWeatherHourlyPoint[];
  activeAlertsCount: number;
}

const UA = "DestinationCommandCenter/2.0 (+https://destinationcommandcenter.com/developers)";
const FRESH_CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes
const STALE_SNAPSHOT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CachedVerifiedWeatherRecord {
  storedAtMs: number;
  summary: CentralizedWeatherSummary;
}

const memoryWeatherCache = new Map<string, CachedVerifiedWeatherRecord>();
const inFlightWeatherReads = new Map<string, Promise<CentralizedWeatherSummary>>();

export function clearWeatherGatewayMemoryCacheForTests(): void {
  memoryWeatherCache.clear();
  inFlightWeatherReads.clear();
}

const PLACEHOLDER_KEYS = new Set([
  "changeme",
  "your_key",
  "your_api_key",
  "placeholder",
  "none",
  "null",
  "undefined",
  "todo",
]);

export function resolveOpenMeteoCommercialKey(
  env: Record<string, string | undefined> = process.env,
): string | null {
  const raw = env.OPEN_METEO_API_KEY;
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (trimmed.length < 8) return null;
  if (PLACEHOLDER_KEYS.has(trimmed.toLowerCase())) return null;
  return trimmed;
}

export function buildOpenMeteoCommercialUrl(
  kind: OpenMeteoEndpointKind,
  params: Record<string, string>,
  env: Record<string, string | undefined> = process.env,
): string | null {
  const apiKey = resolveOpenMeteoCommercialKey(env);
  if (!apiKey) {
    return null;
  }

  const baseByKind: Record<OpenMeteoEndpointKind, string> = {
    forecast: "https://customer-api.open-meteo.com/v1/forecast",
    marine: "https://customer-marine-api.open-meteo.com/v1/marine",
    "air-quality": "https://customer-air-quality-api.open-meteo.com/v1/air-quality",
    flood: "https://customer-flood-api.open-meteo.com/v1/flood",
  };

  const url = new URL(baseByKind[kind]);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  url.searchParams.set("apikey", apiKey);
  return url.toString();
}

/**
 * Determines whether a coordinate falls within U.S. National Weather Service (NOAA)
 * forecast/marine jurisdiction (CONUS, Alaska, Hawaii, Puerto Rico, USVI, Guam/CNMI).
 * Conservatively excludes Canadian/Mexican border cities outside NWS point coverage
 * unless confirmed by api.weather.gov/points.
 */
export function isUsNoaaEligibleCoordinate(lat: number, lng: number): boolean {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;

  // Contiguous U.S. (excluding southern Baja/Mexico & far north of 49th parallel)
  const inConus = lat >= 24.4 && lat <= 49.05 && lng >= -124.85 && lng <= -66.85;
  // Exclude Nassau/Bahamas box east of Florida Straits
  const inBahamas = lat >= 23.5 && lat <= 27.2 && lng >= -79.3 && lng <= -74.0;
  // Exclude Cancun/Cozumel/Yucatan
  const inYucatan = lat < 24.4 && lng >= -90.5 && lng <= -85.5;
  // Exclude Southern Ontario/Toronto/Montreal/Vancouver rough non-US boxes handled safely if NWS 404s
  if (inConus && !inBahamas && !inYucatan) return true;

  // Alaska (Southeast Inside Passage, Southcentral, Interior, Aleutians)
  if (lat >= 51.2 && lat <= 71.5 && lng >= -179.9 && lng <= -130.0) return true;

  // Hawaii
  if (lat >= 18.85 && lat <= 22.35 && lng >= -160.35 && lng <= -154.7) return true;

  // Puerto Rico & U.S. Virgin Islands (San Juan, St. Thomas, St. John, St. Croix)
  if (lat >= 17.62 && lat <= 18.56 && lng >= -67.35 && lng <= -64.5) return true;

  // Guam & CNMI
  if (lat >= 13.15 && lat <= 20.6 && lng >= 144.55 && lng <= 146.15) return true;

  return false;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export function buildSeasonalClimatologyRange(
  lat: number,
  lng: number,
  now: Date = new Date(),
): SeasonalClimatologyRange {
  const monthIndex = now.getUTCMonth(); // 0..11
  const monthName = MONTH_NAMES[monthIndex] || "Seasonal";
  const absLat = Math.abs(lat);
  // Northern hemisphere summer peaks around July (6); Southern around January (0)
  const peakMonth = lat >= 0 ? 6 : 0;
  const monthDist = Math.min(
    Math.abs(monthIndex - peakMonth),
    12 - Math.abs(monthIndex - peakMonth),
  ); // 0 (peak summer) .. 6 (mid-winter)
  const seasonalFactor = Math.cos((monthDist / 6) * Math.PI); // +1 summer .. -1 winter

  // Tropical / Caribbean / Mexican Riviera / South Pacific
  if (absLat < 23.8) {
    const high = Math.round(84 + seasonalFactor * 4);
    const low = Math.round(73 + seasonalFactor * 4);
    const wetSeason = monthDist <= 2;
    return {
      monthIndex,
      monthName,
      typicalLowF: low,
      typicalHighF: high,
      typicalRainRiskLabel: wetSeason
        ? "Passing tropical showers common"
        : "Trade-wind dry-season pattern",
      climateZoneLabel: "Tropical Maritime",
    };
  }

  // Subtropical / Mediterranean / Gulf / Canary Islands (23.8 .. 38)
  if (absLat < 38) {
    const high = Math.round(72 + seasonalFactor * 14);
    const low = Math.round(56 + seasonalFactor * 13);
    return {
      monthIndex,
      monthName,
      typicalLowF: low,
      typicalHighF: high,
      typicalRainRiskLabel:
        monthDist >= 4 ? "Periodic frontal rain possible" : "Generally mild seasonal pattern",
      climateZoneLabel: "Subtropical / Mediterranean",
    };
  }

  // Subpolar / Alaska / Norwegian Fjords / Iceland (>= 54)
  if (absLat >= 54) {
    const high = Math.round(45 + seasonalFactor * 16);
    const low = Math.round(33 + seasonalFactor * 12);
    return {
      monthIndex,
      monthName,
      typicalLowF: low,
      typicalHighF: high,
      typicalRainRiskLabel: "Marine cloud cover and rain/snow layers common",
      climateZoneLabel: "High-Latitude Maritime",
    };
  }

  // Temperate Mid-Latitude (38 .. 54)
  const high = Math.round(60 + seasonalFactor * 18);
  const low = Math.round(45 + seasonalFactor * 15);
  return {
    monthIndex,
    monthName,
    typicalLowF: low,
    typicalHighF: high,
    typicalRainRiskLabel: "Variable mid-latitude seasonal conditions",
    climateZoneLabel: lng >= -20 && lng <= 40 ? "European Maritime / Continental" : "Temperate",
  };
}

function fToC(f: number): number {
  return Math.round((((f - 32) * 5) / 9) * 10) / 10;
}

function cToF(c: number): number {
  return Math.round((c * 9) / 5 + 32);
}

function parseNwsWindMph(raw: string | null | undefined): number | null {
  if (typeof raw !== "string") return null;
  const nums = raw.match(/\d+/g);
  if (!nums || nums.length === 0) return null;
  const values = nums.map(Number).filter(Number.isFinite);
  if (!values.length) return null;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

function iconFromConditionText(condition: string): CentralizedWeatherSummary["icon"] {
  const lower = condition.toLowerCase();
  if (lower.includes("thunder") || lower.includes("storm")) return "storm";
  if (lower.includes("snow") || lower.includes("blizzard") || lower.includes("sleet") || lower.includes("ice")) {
    return "snow";
  }
  if (lower.includes("fog") || lower.includes("mist") || lower.includes("haze")) return "fog";
  if (lower.includes("rain") || lower.includes("shower") || lower.includes("drizzle")) return "rain";
  if (lower.includes("clear") || lower.includes("sunny")) return "sun";
  return "cloud";
}

function advisoryForCondition(condition: string, rainChance: number | null, isLive: boolean): string {
  if (!isLive) {
    return "Historical seasonal guidance only — verify live port or marine conditions closer to departure.";
  }
  const lower = condition.toLowerCase();
  if (lower.includes("thunder") || lower.includes("storm")) return "Weather may disrupt outdoor plans.";
  if (lower.includes("snow") || lower.includes("ice")) return "Cold or wintry conditions may slow outdoor plans.";
  if (typeof rainChance === "number" && rainChance >= 60) return "Plan for wet conditions outdoors.";
  if (typeof rainChance === "number" && rainChance >= 35) return "Outdoor plans may need a rain backup.";
  if (lower.includes("clear") || lower.includes("sunny") || lower.includes("partly")) {
    return "Good conditions for outdoor activities.";
  }
  return "Check conditions before longer outdoor plans.";
}

const WMO_LABELS: Record<number, string> = {
  0: "Clear",
  1: "Mostly Clear",
  2: "Partly Cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Rime Fog",
  51: "Light Drizzle",
  53: "Drizzle",
  55: "Heavy Drizzle",
  61: "Light Rain",
  63: "Rain",
  65: "Heavy Rain",
  66: "Freezing Rain",
  67: "Freezing Rain",
  71: "Light Snow",
  73: "Snow",
  75: "Heavy Snow",
  77: "Snow Grains",
  80: "Rain Showers",
  81: "Showers",
  82: "Heavy Showers",
  85: "Snow Showers",
  86: "Heavy Snow Showers",
  95: "Thunderstorm",
  96: "Thunderstorm",
  99: "Severe Thunderstorm",
};

function gridKey(lat: number, lng: number): string {
  return `dcc:wx:v2:${lat.toFixed(2)}:${lng.toFixed(2)}`;
}

async function readCachedRecord(key: string): Promise<CachedVerifiedWeatherRecord | null> {
  const mem = memoryWeatherCache.get(key);
  if (mem) return mem;
  if (redis) {
    try {
      const raw = await redis.get(key);
      if (raw) {
        const parsed = (typeof raw === "string" ? JSON.parse(raw) : raw) as CachedVerifiedWeatherRecord;
        if (parsed && typeof parsed.storedAtMs === "number" && parsed.summary) {
          memoryWeatherCache.set(key, parsed);
          return parsed;
        }
      }
    } catch {
      // Ignore Redis transient errors and rely on memory/climatology fallback
    }
  }
  return null;
}

async function writeCachedRecord(key: string, record: CachedVerifiedWeatherRecord): Promise<void> {
  memoryWeatherCache.set(key, record);
  if (redis) {
    try {
      await redis.set(key, JSON.stringify(record), {
        ex: Math.ceil(STALE_SNAPSHOT_TTL_MS / 1000),
      });
    } catch {
      // Ignore Redis write failure
    }
  }
}

export function clearWeatherGatewayCacheForTests(): void {
  memoryWeatherCache.clear();
  inFlightWeatherReads.clear();
}

export async function seedVerifiedWeatherSnapshotForTests(
  lat: number,
  lng: number,
  summary: CentralizedWeatherSummary,
  storedAtMs: number = Date.now() - 30 * 60 * 1000,
): Promise<void> {
  await writeCachedRecord(gridKey(lat, lng), { storedAtMs, summary });
}

function asStaleSnapshot(
  cached: CachedVerifiedWeatherRecord,
  label: string,
  checkedAt: string,
): CentralizedWeatherSummary {
  const prev = cached.summary;
  return {
    ...prev,
    label,
    dataMode: "cached_snapshot",
    isCurrentConditions: false,
    freshnessStatus: "stale_cached_snapshot",
    freshnessLabel: `Last verified cached snapshot from ${prev.observedAt || prev.checkedAt} (not live current conditions)`,
    checkedAt,
    advisory:
      "Showing last verified cached weather snapshot — live refresh is temporarily unavailable; do not treat as current conditions.",
  };
}

function asClimatologySummary(params: {
  lat: number;
  lng: number;
  label: string;
  isUsNoaaEligible: boolean;
  checkedAt: string;
  now: Date;
}): CentralizedWeatherSummary {
  const clim = buildSeasonalClimatologyRange(params.lat, params.lng, params.now);
  const condition = `Seasonal Climatology (${clim.monthName} avg ${clim.typicalLowF}–${clim.typicalHighF}°F · Not Current Conditions)`;
  return {
    ok: true,
    label: params.label,
    coordinates: { lat: params.lat, lng: params.lng },
    isUsNoaaEligible: params.isUsNoaaEligible,
    dataMode: "seasonal_climatology",
    isCurrentConditions: false,
    freshnessStatus: "climatology_fallback",
    freshnessLabel: `Seasonal ${clim.monthName} climatology (${clim.climateZoneLabel}) — live commercial weather feed not active for this coordinate`,
    provider: "DCC Seasonal Climatology Baseline",
    attribution:
      "Historical monthly climate baseline (not live weather conditions). Configure OPEN_METEO_API_KEY for commercial international model feeds.",
    observedAt: null,
    checkedAt: params.checkedAt,
    temperatureF: null,
    temperatureC: null,
    apparentTemperatureF: null,
    apparentTemperatureC: null,
    windMph: null,
    windKph: null,
    humidityPercent: null,
    rainChance: null,
    weatherCode: null,
    condition,
    icon: "cloud",
    advisory: advisoryForCondition(condition, null, false),
    climatology: clim,
    nextHours: [],
    activeAlertsCount: 0,
  };
}

async function fetchBoundedJson<T>(
  url: string,
  fetchImpl: typeof fetch,
  timeoutMs = 5500,
  headers?: Record<string, string>,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetchImpl(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/geo+json, application/json",
        "User-Agent": UA,
        ...(headers || {}),
      },
    });
    if (!res.ok) {
      recordUpstreamFetchCall(url, true);
      throw new Error(`HTTP ${res.status} for ${url}`);
    }
    recordUpstreamFetchCall(url, false);
    return (await res.json()) as T;
  } catch (err) {
    if (!(err instanceof Error && err.message.startsWith("HTTP "))) {
      recordUpstreamFetchCall(url, true);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchLiveNoaaSummary(params: {
  lat: number;
  lng: number;
  label: string;
  checkedAt: string;
  fetchImpl: typeof fetch;
}): Promise<CentralizedWeatherSummary> {
  const lat4 = Number(params.lat.toFixed(4));
  const lng4 = Number(params.lng.toFixed(4));
  const pointUrl = `https://api.weather.gov/points/${lat4},${lng4}`;
  const pointJson: any = await fetchBoundedJson(pointUrl, params.fetchImpl);
  const hourlyUrl: string | undefined = pointJson?.properties?.forecastHourly;
  const forecastUrl: string | undefined = pointJson?.properties?.forecast;
  if (!hourlyUrl && !forecastUrl) {
    throw new Error("NWS point metadata missing forecast URLs");
  }

  const [hourlyJson, alertsJson] = await Promise.all([
    fetchBoundedJson<any>(hourlyUrl || forecastUrl!, params.fetchImpl),
    fetchBoundedJson<any>(
      `https://api.weather.gov/alerts/active?point=${lat4},${lng4}`,
      params.fetchImpl,
    ).catch(() => null),
  ]);

  const periods: any[] = Array.isArray(hourlyJson?.properties?.periods)
    ? hourlyJson.properties.periods
    : [];
  const first = periods[0];
  if (!first || typeof first.temperature !== "number") {
    throw new Error("NWS forecast periods empty");
  }

  const unit = String(first.temperatureUnit || "F").toUpperCase();
  const tempF = unit === "C" ? cToF(first.temperature) : Math.round(first.temperature);
  const tempC = unit === "C" ? first.temperature : fToC(tempF);
  const windMph = parseNwsWindMph(first.windSpeed);
  const windKph = windMph != null ? Math.round(windMph * 1.60934) : null;
  const rainChance =
    typeof first.probabilityOfPrecipitation?.value === "number"
      ? Math.round(first.probabilityOfPrecipitation.value)
      : null;
  const humidity =
    typeof first.relativeHumidity?.value === "number"
      ? Math.round(first.relativeHumidity.value)
      : null;
  const condition = String(first.shortForecast || "Observed Forecast").trim();
  const alertsCount = Array.isArray(alertsJson?.features) ? alertsJson.features.length : 0;

  return {
    ok: true,
    label: params.label,
    coordinates: { lat: params.lat, lng: params.lng },
    isUsNoaaEligible: true,
    dataMode: "live_noaa",
    isCurrentConditions: true,
    freshnessStatus: "fresh",
    freshnessLabel: "Live U.S. National Weather Service forecast & active alerts",
    provider: "U.S. National Weather Service (NOAA)",
    attribution: "Public-domain forecast and alerts: U.S. National Weather Service (api.weather.gov)",
    observedAt: String(hourlyJson?.properties?.updated || first.startTime || params.checkedAt),
    checkedAt: params.checkedAt,
    temperatureF: tempF,
    temperatureC: tempC,
    apparentTemperatureF: tempF,
    apparentTemperatureC: tempC,
    windMph,
    windKph,
    humidityPercent: humidity,
    rainChance,
    weatherCode: null,
    condition,
    icon: iconFromConditionText(condition),
    advisory: advisoryForCondition(condition, rainChance, true),
    climatology: null,
    nextHours: periods.slice(0, 8).map((p) => {
      const pUnit = String(p?.temperatureUnit || "F").toUpperCase();
      const pTempF =
        typeof p?.temperature === "number"
          ? pUnit === "C"
            ? cToF(p.temperature)
            : Math.round(p.temperature)
          : null;
      return {
        startTime: String(p?.startTime || ""),
        temperatureF: pTempF,
        temperatureC: pTempF != null ? fToC(pTempF) : null,
        shortForecast: String(p?.shortForecast || condition),
        precipitationProbability:
          typeof p?.probabilityOfPrecipitation?.value === "number"
            ? Math.round(p.probabilityOfPrecipitation.value)
            : null,
        windMph: parseNwsWindMph(p?.windSpeed),
      };
    }),
    activeAlertsCount: alertsCount,
  };
}

async function fetchCommercialOpenMeteoSummary(params: {
  lat: number;
  lng: number;
  timezone?: string | null;
  label: string;
  isUsNoaaEligible: boolean;
  checkedAt: string;
  env: Record<string, string | undefined>;
  fetchImpl: typeof fetch;
}): Promise<CentralizedWeatherSummary> {
  const commercialUrl = buildOpenMeteoCommercialUrl(
    "forecast",
    {
      latitude: String(params.lat),
      longitude: String(params.lng),
      current:
        "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m",
      hourly: "temperature_2m,precipitation_probability,weather_code,wind_speed_10m",
      daily: "precipitation_probability_max",
      forecast_hours: "8",
      forecast_days: "1",
      temperature_unit: "celsius",
      wind_speed_unit: "kmh",
      timezone: params.timezone || "auto",
    },
    params.env,
  );

  if (!commercialUrl) {
    throw new Error("OPEN_METEO_API_KEY_NOT_CONFIGURED");
  }

  const payload: any = await fetchBoundedJson(commercialUrl, params.fetchImpl);
  const current = payload?.current || {};
  if (typeof current.temperature_2m !== "number") {
    throw new Error("Commercial Open-Meteo response missing temperature_2m");
  }

  const tempC = Math.round(current.temperature_2m * 10) / 10;
  const tempF = cToF(tempC);
  const appC =
    typeof current.apparent_temperature === "number"
      ? Math.round(current.apparent_temperature * 10) / 10
      : tempC;
  const appF = cToF(appC);
  const windKph =
    typeof current.wind_speed_10m === "number" ? Math.round(current.wind_speed_10m) : null;
  const windMph = windKph != null ? Math.round(windKph / 1.60934) : null;
  const code = typeof current.weather_code === "number" ? current.weather_code : 0;
  const condition = WMO_LABELS[code] || "Observed Model Conditions";
  const rainChance =
    typeof payload?.daily?.precipitation_probability_max?.[0] === "number"
      ? Math.round(payload.daily.precipitation_probability_max[0])
      : null;

  const times: string[] = Array.isArray(payload?.hourly?.time) ? payload.hourly.time : [];
  const hTemps: number[] = Array.isArray(payload?.hourly?.temperature_2m)
    ? payload.hourly.temperature_2m
    : [];
  const hPrecip: Array<number | null> = Array.isArray(payload?.hourly?.precipitation_probability)
    ? payload.hourly.precipitation_probability
    : [];
  const hCodes: number[] = Array.isArray(payload?.hourly?.weather_code)
    ? payload.hourly.weather_code
    : [];
  const hWind: number[] = Array.isArray(payload?.hourly?.wind_speed_10m)
    ? payload.hourly.wind_speed_10m
    : [];

  return {
    ok: true,
    label: params.label,
    coordinates: { lat: params.lat, lng: params.lng },
    isUsNoaaEligible: params.isUsNoaaEligible,
    dataMode: "live_open_meteo_commercial",
    isCurrentConditions: true,
    freshnessStatus: "fresh",
    freshnessLabel: "Commercial Open-Meteo model forecast (customer-api.open-meteo.com)",
    provider: "Open-Meteo Commercial API",
    attribution: "Weather model data licensed via Open-Meteo Commercial API",
    observedAt: typeof current.time === "string" ? current.time : params.checkedAt,
    checkedAt: params.checkedAt,
    temperatureF: tempF,
    temperatureC: tempC,
    apparentTemperatureF: appF,
    apparentTemperatureC: appC,
    windMph,
    windKph,
    humidityPercent:
      typeof current.relative_humidity_2m === "number"
        ? Math.round(current.relative_humidity_2m)
        : null,
    rainChance,
    weatherCode: code,
    condition,
    icon: iconFromConditionText(condition),
    advisory: advisoryForCondition(condition, rainChance, true),
    climatology: null,
    nextHours: times.slice(0, 8).map((startTime, idx) => {
      const cVal = typeof hTemps[idx] === "number" ? hTemps[idx] : null;
      const kVal = typeof hWind[idx] === "number" ? hWind[idx] : null;
      const hCode = typeof hCodes[idx] === "number" ? hCodes[idx] : code;
      return {
        startTime,
        temperatureC: cVal != null ? Math.round(cVal * 10) / 10 : null,
        temperatureF: cVal != null ? cToF(cVal) : null,
        shortForecast: WMO_LABELS[hCode] || condition,
        precipitationProbability:
          typeof hPrecip[idx] === "number" ? Math.round(hPrecip[idx]!) : null,
        windMph: kVal != null ? Math.round(kVal / 1.60934) : null,
      };
    }),
    activeAlertsCount: 0,
  };
}

export async function resolveCentralizedWeatherSummary(options: {
  lat: number;
  lng: number;
  timezone?: string | null;
  label?: string;
  now?: Date;
  env?: Record<string, string | undefined>;
  fetchImpl?: typeof fetch;
}): Promise<CentralizedWeatherSummary> {
  const now = options.now ?? new Date();
  const nowMs = now.getTime();
  const checkedAt = now.toISOString();
  const label = options.label?.trim() || "Location Weather";
  const env = options.env ?? process.env;
  const fetchImpl = options.fetchImpl ?? fetch;
  const key = gridKey(options.lat, options.lng);
  const eligibleNoaa = isUsNoaaEligibleCoordinate(options.lat, options.lng);

  const cached = await readCachedRecord(key);
  if (cached && nowMs - cached.storedAtMs <= FRESH_CACHE_TTL_MS && cached.summary.isCurrentConditions) {
    return {
      ...cached.summary,
      label,
      checkedAt,
    };
  }

  const existingInFlight = inFlightWeatherReads.get(key);
  if (existingInFlight) {
    const shared = await existingInFlight;
    return { ...shared, label };
  }

  const work = (async (): Promise<CentralizedWeatherSummary> => {
    // 1. Eligible U.S. coordinates route to NOAA / NWS first
    if (eligibleNoaa) {
      try {
        const liveNoaa = await fetchLiveNoaaSummary({
          lat: options.lat,
          lng: options.lng,
          label,
          checkedAt,
          fetchImpl,
        });
        await writeCachedRecord(key, { storedAtMs: nowMs, summary: liveNoaa });
        return liveNoaa;
      } catch {
        // If NWS fails (or border point is just outside NWS polygon), try commercial Open-Meteo ONLY if key is configured
        if (resolveOpenMeteoCommercialKey(env)) {
          try {
            const commercialFallback = await fetchCommercialOpenMeteoSummary({
              lat: options.lat,
              lng: options.lng,
              timezone: options.timezone,
              label,
              isUsNoaaEligible: eligibleNoaa,
              checkedAt,
              env,
              fetchImpl,
            });
            await writeCachedRecord(key, { storedAtMs: nowMs, summary: commercialFallback });
            return commercialFallback;
          } catch {
            // Fall through to verified stale snapshot or climatology
          }
        }
      }
    } else if (resolveOpenMeteoCommercialKey(env)) {
      // 2. International coordinates use customer-api.open-meteo.com ONLY when OPEN_METEO_API_KEY is configured
      try {
        const liveCommercial = await fetchCommercialOpenMeteoSummary({
          lat: options.lat,
          lng: options.lng,
          timezone: options.timezone,
          label,
          isUsNoaaEligible: false,
          checkedAt,
          env,
          fetchImpl,
        });
        await writeCachedRecord(key, { storedAtMs: nowMs, summary: liveCommercial });
        return liveCommercial;
      } catch {
        // Fall through to verified stale snapshot or climatology
      }
    }

    // 3. Serve last verified cached snapshot if within retention window (strictly marked isCurrentConditions: false)
    if (cached && nowMs - cached.storedAtMs <= STALE_SNAPSHOT_TTL_MS) {
      return asStaleSnapshot(cached, label, checkedAt);
    }

    // 4. Serve clearly labeled seasonal climatology (strictly marked isCurrentConditions: false, temperatureF: null)
    return asClimatologySummary({
      lat: options.lat,
      lng: options.lng,
      label,
      isUsNoaaEligible: eligibleNoaa,
      checkedAt,
      now,
    });
  })();

  inFlightWeatherReads.set(key, work);
  try {
    return await work;
  } finally {
    inFlightWeatherReads.delete(key);
  }
}
