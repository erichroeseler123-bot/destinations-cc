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

export const noaaAdapter: ProviderAdapter<NoaaForecastQuery, NoaaForecastData> = {
  id: "noaa_nws",
  isConfigured: () => true,
  fetch: async (query) => {
    const now = new Date().toISOString();
    try {
      const points = await fetch(
        `https://api.weather.gov/points/${query.lat.toFixed(4)},${query.lon.toFixed(4)}`,
        {
          headers: {
            Accept: "application/geo+json",
            "User-Agent": "DestinationCommandCenter/1.2 (support@destinationcommandcenter.com)",
          },
          cache: "no-store",
        }
      );
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
      const forecastUrl = pointsJson?.properties?.forecastHourly;
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
      const forecast = await fetch(forecastUrl, {
        headers: {
          Accept: "application/geo+json",
          "User-Agent": "DestinationCommandCenter/1.2 (support@destinationcommandcenter.com)",
        },
        cache: "no-store",
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
      const periods = (json?.properties?.periods || []).slice(0, query.periods || 12).map((p) => ({
        start: p.startTime || "",
        end: p.endTime || "",
        temperature: typeof p.temperature === "number" ? p.temperature : null,
        temperatureUnit: p.temperatureUnit || null,
        windSpeed: p.windSpeed || null,
        windDirection: p.windDirection || null,
        shortForecast: p.shortForecast || null,
      }));
      return {
        ok: periods.length > 0,
        data: periods,
        diagnostics: {
          source: "noaa_nws",
          cache_status: "bypass",
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
