import { getEnvOptional } from "@/lib/dcc/config/env";
import { slugify } from "@/lib/dcc/slug";
import type { ProviderAdapter } from "@/lib/dcc/providers/adapters/types";

export type SeatGeekQuery = {
  performerSlug: string;
  venueCity?: string;
  size?: number;
};

export type SeatGeekEvent = {
  id: string;
  title: string;
  startDateTime: string | null;
  url: string | null;
  venueName: string | null;
  city: string | null;
  lowestPrice: number | null;
  imageUrl: string | null;
  performerSlugs: string[];
};

export type SeatGeekEventDetail = SeatGeekEvent & {
  venueAddress: string | null;
  venueDisplayLocation: string | null;
};

function normalizeSeatGeekEvent(event: {
  id?: number | string;
  short_title?: string;
  title?: string;
  datetime_local?: string;
  url?: string;
  stats?: { lowest_price?: number | null };
  venue?: { name?: string; city?: string; address?: string; display_location?: string };
  performers?: Array<{ image?: string | null; slug?: string | null }>;
}): SeatGeekEventDetail {
  return {
    id: String(event.id || "unknown"),
    title: event.short_title || event.title || "Unnamed event",
    startDateTime: event.datetime_local || null,
    url: event.url || null,
    venueName: event.venue?.name || null,
    city: event.venue?.city || null,
    lowestPrice: typeof event.stats?.lowest_price === "number" ? event.stats.lowest_price : null,
    imageUrl: event.performers?.[0]?.image || null,
    performerSlugs: (event.performers || []).map((performer) => performer.slug || "").filter(Boolean),
    venueAddress: event.venue?.address || null,
    venueDisplayLocation: event.venue?.display_location || null,
  };
}

export function buildSeatGeekGameSlug(event: Pick<SeatGeekEvent, "id" | "title">): string {
  return `${slugify(event.title)}-${event.id}`;
}

export function extractSeatGeekEventId(slug: string): string {
  const match = slug.match(/-(\d+)$/);
  return match?.[1] || "";
}

export const seatGeekAdapter: ProviderAdapter<SeatGeekQuery, SeatGeekEvent[]> = {
  id: "seatgeek_events",
  isConfigured: () => Boolean(getEnvOptional("SEATGEEK_CLIENT_ID")),
  fetch: async (query) => {
    const now = new Date().toISOString();
    const clientId = getEnvOptional("SEATGEEK_CLIENT_ID");
    if (!clientId) {
      return {
        ok: false,
        data: [],
        diagnostics: {
          source: "seatgeek_events",
          cache_status: "miss",
          stale: false,
          last_updated: now,
          fallback_reason: "missing_client_id",
        },
      };
    }

    try {
      const url = new URL("https://api.seatgeek.com/2/events");
      url.searchParams.set("client_id", clientId);
      url.searchParams.set("performers.slug", query.performerSlug);
      url.searchParams.set("per_page", String(Math.max(1, Math.min(query.size || 12, 24))));
      url.searchParams.set("sort", "datetime_utc.asc");
      if (query.venueCity) {
        url.searchParams.set("venue.city", query.venueCity);
      }

      const res = await fetch(url.toString(), {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (!res.ok) {
        return {
          ok: false,
          data: [],
          diagnostics: {
            source: "seatgeek_events",
            cache_status: "miss",
            stale: false,
            last_updated: now,
            fallback_reason: `http_${res.status}`,
          },
        };
      }

      const json = (await res.json()) as {
        events?: Array<{
          id?: number | string;
          short_title?: string;
          title?: string;
          datetime_local?: string;
          url?: string;
          stats?: { lowest_price?: number | null };
          venue?: { name?: string; city?: string; address?: string; display_location?: string };
          performers?: Array<{ image?: string | null; slug?: string | null }>;
        }>;
      };

      const data = (json.events || []).map((event) => normalizeSeatGeekEvent(event));

      return {
        ok: true,
        data,
        diagnostics: {
          source: "seatgeek_events",
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
          source: "seatgeek_events",
          cache_status: "miss",
          stale: false,
          last_updated: now,
          fallback_reason: "fetch_failed",
        },
      };
    }
  },
};

export async function fetchSeatGeekEventById(eventId: string) {
  const now = new Date().toISOString();
  const clientId = getEnvOptional("SEATGEEK_CLIENT_ID");
  if (!clientId) {
    return {
      ok: false,
      data: null,
      diagnostics: {
        source: "seatgeek_events",
        cache_status: "miss",
        stale: false,
        last_updated: now,
        fallback_reason: "missing_client_id",
      },
    };
  }

  try {
    const url = new URL(`https://api.seatgeek.com/2/events/${eventId}`);
    url.searchParams.set("client_id", clientId);

    const res = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!res.ok) {
      return {
        ok: false,
        data: null,
        diagnostics: {
          source: "seatgeek_events",
          cache_status: "miss",
          stale: false,
          last_updated: now,
          fallback_reason: `http_${res.status}`,
        },
      };
    }

    const json = (await res.json()) as {
      id?: number | string;
      short_title?: string;
      title?: string;
      datetime_local?: string;
      url?: string;
      stats?: { lowest_price?: number | null };
      venue?: { name?: string; city?: string; address?: string; display_location?: string };
      performers?: Array<{ image?: string | null; slug?: string | null }>;
    };

    return {
      ok: true,
      data: normalizeSeatGeekEvent(json),
      diagnostics: {
        source: "seatgeek_events",
        cache_status: "bypass",
        stale: false,
        last_updated: now,
        fallback_reason: null,
      },
    };
  } catch {
    return {
      ok: false,
      data: null,
      diagnostics: {
        source: "seatgeek_events",
        cache_status: "miss",
        stale: false,
        last_updated: now,
        fallback_reason: "fetch_failed",
      },
    };
  }
}
