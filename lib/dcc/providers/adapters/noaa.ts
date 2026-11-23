import type { ProviderAdapter } from "@/lib/dcc/providers/adapters/types";

export type NoaaForecastQuery = { lat: number; lon: number; periods?: number };
export type NoaaForecastData = Array<{
  start: string;
  end: string;
  temperature: number | null;
  temperatureUnit: string | null;
  windSpeed: string | null;
  windDirection: string | null;
  shortForecast: string | null;
}>;

const NOAA_POINTS_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours (NWS grid URLs are static per coordinate)
const NOAA_FORECAST_TTL_MS = 15 * 60 * 1000; // 15 minutes
const MAX_NOAA_CACHE_ENTRIES = 500;

const NOAA_POINTS_CACHE = new Map<string, { forecastUrl: string; expiresAt: number }>();
const NOAA_FORECAST_CACHE = new Map<
  string,
  { periods: NoaaForecastData; lastUpdated: string; expiresAt: number }
>();

function setBoundedMap<V extends { expiresAt: number }>(
  map: Map<string, V>,
  key: string,
  value: V,
) {
  if (map.size >= MAX_NOAA_CACHE_ENTRIES && !map.has(key)) {
    const nowMs = Date.now();
    for (const [k, v] of map) {
      if (v.expiresAt <= nowMs) map.delete(k);
      if (map.size < MAX_NOAA_CACHE_ENTRIES) break;
    }
    if (map.size >= MAX_NOAA_CACHE_ENTRIES) {
      const oldest = map.keys().next().value;
      if (oldest) map.delete(oldest);
    }
  }
  map.set(key, value);
}

export function clearNoaaAdapterCacheForTests(): void {
  NOAA_POINTS_CACHE.clear();
  NOAA_FORECAST_CACHE.clear();
}

export const noaaAdapter: ProviderAdapter<NoaaForecastQuery, NoaaForecastData> = {
  id: "noaa_nws",
  isConfigured: () => true,
  fetch: async (query) => {
    const now = new Date().toISOString();
    const nowMs = Date.now();
    const coordKey = `${query.lat.toFixed(4)},${query.lon.toFixed(4)}`;
    const maxPeriods = query.periods || 12;

    try {
      let forecastUrl: string | undefined;
      const cachedPoints = NOAA_POINTS_CACHE.get(coordKey);
      if (cachedPoints && cachedPoints.expiresAt > nowMs) {
        forecastUrl = cachedPoints.forecastUrl;
      } else {
        const points = await fetch(`https://api.weather.gov/points/${coordKey}`, {
          headers: {
            Accept: "application/geo+json",
            "User-Agent": "DestinationCommandCenter/1.2 (support@destinationcommandcenter.com)",
          },
          next: { revalidate: 86400 },
        });
        if (!points.ok) {
          return {
            ok: false,
            data: [],
            diagnostics: {
              source: "noaa_nws",
              cache_status: "miss",
              stale: false,
              last_updated: now,
              fallback_reason: `points_http_${points.status}`,
            },
          };
        }
        const pointsJson = (await points.json()) as {
          properties?: { forecastHourly?: string };
        };
        forecastUrl = pointsJson?.properties?.forecastHourly;
        if (!forecastUrl) {
          return {
            ok: false,
            data: [],
            diagnostics: {
              source: "noaa_nws",
              cache_status: "miss",
              stale: false,
              last_updated: now,
              fallback_reason: "missing_forecast_hourly_url",
            },
          };
        }
        setBoundedMap(NOAA_POINTS_CACHE, coordKey, {
          forecastUrl,
          expiresAt: nowMs + NOAA_POINTS_TTL_MS,
        });
      }

      const cachedForecast = NOAA_FORECAST_CACHE.get(forecastUrl);
      if (cachedForecast && cachedForecast.expiresAt > nowMs) {
        const sliced = cachedForecast.periods.slice(0, maxPeriods);
        return {
          ok: sliced.length > 0,
          data: sliced,
          diagnostics: {
            source: "noaa_nws",
            cache_status: "fresh",
            stale: false,
            last_updated: cachedForecast.lastUpdated,
            fallback_reason: sliced.length > 0 ? null : "no_periods",
          },
        };
      }

      const forecast = await fetch(forecastUrl, {
        headers: {
          Accept: "application/geo+json",
          "User-Agent": "DestinationCommandCenter/1.2 (support@destinationcommandcenter.com)",
        },
        next: { revalidate: 900 },
      });
      if (!forecast.ok) {
        return {
          ok: false,
          data: [],
          diagnostics: {
            source: "noaa_nws",
            cache_status: "miss",
            stale: false,
            last_updated: now,
            fallback_reason: `forecast_http_${forecast.status}`,
          },
        };
      }
      const json = (await forecast.json()) as {
        properties?: {
          periods?: Array<{
            startTime?: string;
            endTime?: string;
            temperature?: number;
            temperatureUnit?: string;
            windSpeed?: string;
            windDirection?: string;
            shortForecast?: string;
          }>;
        };
      };
      const allPeriods: NoaaForecastData = (json?.properties?.periods || [])
        .slice(0, Math.max(maxPeriods, 24))
        .map((p) => ({
          start: p.startTime || "",
          end: p.endTime || "",
          temperature: typeof p.temperature === "number" ? p.temperature : null,
          temperatureUnit: p.temperatureUnit || null,
          windSpeed: p.windSpeed || null,
          windDirection: p.windDirection || null,
          shortForecast: p.shortForecast || null,
        }));
      setBoundedMap(NOAA_FORECAST_CACHE, forecastUrl, {
        periods: allPeriods,
        lastUpdated: now,
        expiresAt: nowMs + NOAA_FORECAST_TTL_MS,
      });
      const periods = allPeriods.slice(0, maxPeriods);
      return {
        ok: periods.length > 0,
        data: periods,
        diagnostics: {
          source: "noaa_nws",
          cache_status: "miss",
          stale: false,
          last_updated: now,
          fallback_reason: periods.length > 0 ? null : "no_periods",
        },
      };
    } catch {
      return {
        ok: false,
        data: [],
        diagnostics: {
          source: "noaa_nws",
          cache_status: "miss",
          stale: false,
          last_updated: now,
          fallback_reason: "fetch_failed",
        },
      };
    }
  },
};
