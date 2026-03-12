import { getEnvOptional } from "@/lib/dcc/config/env";
import type { ProviderAdapter } from "@/lib/dcc/providers/adapters/types";

export type TicketmasterQuery = {
  lat: number;
  lon: number;
  radius_km?: number;
  keyword?: string;
  size?: number;
};

export type TicketmasterEvent = {
  id: string;
  name: string;
  start_date: string | null;
  start_time: string | null;
  url: string | null;
  venue_name: string | null;
  city: string | null;
  image_url: string | null;
  segment_name: string | null;
  genre_name: string | null;
  subgenre_name: string | null;
};

export const ticketmasterAdapter: ProviderAdapter<TicketmasterQuery, TicketmasterEvent[]> = {
  id: "ticketmaster_discovery",
  isConfigured: () => Boolean(getEnvOptional("TICKETMASTER_API_KEY")),
  fetch: async (query) => {
    const now = new Date().toISOString();
    const apiKey = getEnvOptional("TICKETMASTER_API_KEY");
    if (!apiKey) {
      return {
        ok: false,
        data: [],
        diagnostics: {
          source: "ticketmaster_discovery",
          cache_status: "miss",
          stale: false,
          last_updated: now,
          fallback_reason: "missing_api_key",
        },
      };
    }

    try {
      const url = new URL("https://app.ticketmaster.com/discovery/v2/events.json");
      url.searchParams.set("apikey", apiKey);
      url.searchParams.set("latlong", `${query.lat},${query.lon}`);
      url.searchParams.set("radius", String(Math.max(1, Math.min(query.radius_km || 100, 300))));
      url.searchParams.set("unit", "km");
      url.searchParams.set("size", String(Math.max(1, Math.min(query.size || 20, 50))));
      if (query.keyword) url.searchParams.set("keyword", query.keyword);

      const res = await fetch(url.toString(), {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (!res.ok) {
        return {
          ok: false,
          data: [],
          diagnostics: {
            source: "ticketmaster_discovery",
            cache_status: "miss",
            stale: false,
            last_updated: now,
            fallback_reason: `http_${res.status}`,
          },
        };
      }

      const json = (await res.json()) as {
        _embedded?: {
          events?: Array<{
            id?: string;
            name?: string;
            url?: string;
            dates?: { start?: { localDate?: string; localTime?: string } };
            images?: Array<{ url?: string; ratio?: string; width?: number }>;
            classifications?: Array<{
              segment?: { name?: string };
              genre?: { name?: string };
              subGenre?: { name?: string };
            }>;
            _embedded?: { venues?: Array<{ name?: string; city?: { name?: string } }> };
          }>;
        };
      };
      const events = json?._embedded?.events || [];
      const data = events.map((e) => ({
        id: e.id || "unknown",
        name: e.name || "Unnamed event",
        start_date: e.dates?.start?.localDate || null,
        start_time: e.dates?.start?.localTime || null,
        url: e.url || null,
        venue_name: e._embedded?.venues?.[0]?.name || null,
        city: e._embedded?.venues?.[0]?.city?.name || null,
        image_url:
          e.images?.find((image) => image.ratio === "16_9")?.url ||
          e.images?.find((image) => image.width && image.width >= 640)?.url ||
          e.images?.[0]?.url ||
          null,
        segment_name: e.classifications?.[0]?.segment?.name || null,
        genre_name: e.classifications?.[0]?.genre?.name || null,
        subgenre_name: e.classifications?.[0]?.subGenre?.name || null,
      }));

      return {
        ok: true,
        data,
        diagnostics: {
          source: "ticketmaster_discovery",
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
          source: "ticketmaster_discovery",
          cache_status: "miss",
          stale: false,
          last_updated: now,
          fallback_reason: "fetch_failed",
        },
      };
    }
  },
};
