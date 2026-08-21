import { getEnvOptional } from "@/lib/dcc/config/env";
import type { ProviderAdapter } from "@/lib/dcc/providers/adapters/types";

export type TicketmasterQuery = {
  city?: string;
  countryCode?: string;
  startDateTime?: string;
  endDateTime?: string;
  radius_km?: number;
  lat?: number;
  lon?: number;
  keyword?: string;
  size?: number;
};

export type TicketmasterEvent = {
  id: string;
  name: string;
  start_date: string | null;
  start_time: string | null;
  start_date_time: string | null;
  url: string | null;
  venue_id: string | null;
  venue_name: string | null;
  venue_lat: number | null;
  venue_lng: number | null;
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
      url.searchParams.set("size", String(Math.max(1, Math.min(query.size || 50, 200))));
      url.searchParams.set("sort", "date,asc");
      url.searchParams.set("includeTBA", "no");
      url.searchParams.set("includeTBD", "no");
      if (query.city) url.searchParams.set("city", query.city);
      if (query.countryCode) url.searchParams.set("countryCode", query.countryCode);
      if (query.startDateTime) url.searchParams.set("startDateTime", query.startDateTime);
      if (query.endDateTime) url.searchParams.set("endDateTime", query.endDateTime);
      if (query.keyword) url.searchParams.set("keyword", query.keyword);

      // Ticketmaster marks latlong as deprecated in favor of geoPoint. DCC therefore
      // does not depend on provider-side geospatial filtering here; radius is enforced
      // after normalization using venue coordinates returned by the provider.

      const res = await fetch(url.toString(), {
        headers: { Accept: "application/json" },
        next: { revalidate: 900 },
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
            dates?: { start?: { localDate?: string; localTime?: string; dateTime?: string } };
            images?: Array<{ url?: string; ratio?: string; width?: number }>;
            classifications?: Array<{
              segment?: { name?: string };
              genre?: { name?: string };
              subGenre?: { name?: string };
            }>;
            _embedded?: {
              venues?: Array<{
                id?: string;
                name?: string;
                city?: { name?: string };
                location?: { latitude?: string; longitude?: string };
              }>;
            };
          }>;
        };
      };
      const events = json?._embedded?.events || [];
      const data = events.map((e) => {
        const venue = e._embedded?.venues?.[0];
        const venueLat = venue?.location?.latitude ? Number(venue.location.latitude) : Number.NaN;
        const venueLng = venue?.location?.longitude ? Number(venue.location.longitude) : Number.NaN;
        return {
          id: e.id || "unknown",
          name: e.name || "Unnamed event",
          start_date: e.dates?.start?.localDate || null,
          start_time: e.dates?.start?.localTime || null,
          start_date_time: e.dates?.start?.dateTime || null,
          url: e.url || null,
          venue_id: venue?.id || null,
          venue_name: venue?.name || null,
          venue_lat: Number.isFinite(venueLat) ? venueLat : null,
          venue_lng: Number.isFinite(venueLng) ? venueLng : null,
          city: venue?.city?.name || null,
          image_url:
            e.images?.find((image) => image.ratio === "16_9")?.url ||
            e.images?.find((image) => image.width && image.width >= 640)?.url ||
            e.images?.[0]?.url ||
            null,
          segment_name: e.classifications?.[0]?.segment?.name || null,
          genre_name: e.classifications?.[0]?.genre?.name || null,
          subgenre_name: e.classifications?.[0]?.subGenre?.name || null,
        };
      });

      return {
        ok: true,
        data,
        diagnostics: {
          source: "ticketmaster_discovery",
          cache_status: "fresh",
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
