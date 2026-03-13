import { getEnvOptional } from "@/lib/dcc/config/env";
import type { ProviderAdapter } from "@/lib/dcc/providers/adapters/types";

export type FoursquareQuery = {
  lat: number;
  lon: number;
  query?: string;
  radius_m?: number;
  limit?: number;
};

export type FoursquarePlace = {
  fsq_id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  categories: string[];
  address: string | null;
};

export const foursquareAdapter: ProviderAdapter<FoursquareQuery, FoursquarePlace[]> = {
  id: "foursquare_places",
  isConfigured: () => Boolean(getEnvOptional("FOURSQUARE_API_KEY")),
  fetch: async (query) => {
    const now = new Date().toISOString();
    const apiKey = getEnvOptional("FOURSQUARE_API_KEY");
    if (!apiKey) {
      return {
        ok: false,
        data: [],
        diagnostics: {
          source: "foursquare_places",
          cache_status: "miss",
          stale: false,
          last_updated: now,
          fallback_reason: "missing_api_key",
        },
      };
    }
    try {
      const url = new URL("https://api.foursquare.com/v3/places/search");
      url.searchParams.set("ll", `${query.lat},${query.lon}`);
      url.searchParams.set("radius", String(Math.max(100, Math.min(query.radius_m || 5000, 100000))));
      url.searchParams.set("limit", String(Math.max(1, Math.min(query.limit || 20, 50))));
      if (query.query) url.searchParams.set("query", query.query);

      const res = await fetch(url.toString(), {
        headers: {
          Accept: "application/json",
          Authorization: apiKey,
        },
        cache: "no-store",
      });

      if (!res.ok) {
        return {
          ok: false,
          data: [],
          diagnostics: {
            source: "foursquare_places",
            cache_status: "miss",
            stale: false,
            last_updated: now,
            fallback_reason: `http_${res.status}`,
          },
        };
      }

      const json = (await res.json()) as {
        results?: Array<{
          fsq_id?: string;
          name?: string;
          geocodes?: { main?: { latitude?: number; longitude?: number } };
          categories?: Array<{ name?: string }>;
          location?: { formatted_address?: string };
        }>;
      };

      const data = (json.results || []).map((r) => ({
        fsq_id: r.fsq_id || "unknown",
        name: r.name || "Unnamed place",
        latitude: typeof r.geocodes?.main?.latitude === "number" ? r.geocodes.main.latitude : null,
        longitude: typeof r.geocodes?.main?.longitude === "number" ? r.geocodes.main.longitude : null,
        categories: (r.categories || []).map((c) => c.name || "").filter(Boolean),
        address: r.location?.formatted_address || null,
      }));

      return {
        ok: true,
        data,
        diagnostics: {
          source: "foursquare_places",
          cache_status: "bypass",
          stale: false,
          last_updated: now,
          fallback_reason: null,
        },
      };
    } catch {
      return {
        ok: false,
        data: [],
        diagnostics: {
          source: "foursquare_places",
          cache_status: "miss",
          stale: false,
          last_updated: now,
          fallback_reason: "fetch_failed",
        },
      };
    }
  },
};
