import { getEnvOptional } from "@/lib/dcc/config/env";
import type { ProviderAdapter } from "@/lib/dcc/providers/adapters/types";

export type AmadeusFlightSearchQuery = {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  adults?: number;
  nonStop?: boolean;
  currency?: string;
  max?: number;
  travelClass?: "ECONOMY" | "PREMIUM_ECONOMY" | "BUSINESS" | "FIRST";
  includedAirlineCodes?: string[];
  maxPrice?: number;
};

export type AmadeusFlightOffer = {
  id: string;
  source: string | null;
  instant_ticketing_required: boolean | null;
  one_way: boolean | null;
  number_of_bookable_seats: number | null;
  price_total: number | null;
  currency: string | null;
  itineraries: Array<{
    duration: string | null;
    segments: Array<{
      carrier_code: string | null;
      number: string | null;
      departure_iata: string | null;
      departure_at: string | null;
      arrival_iata: string | null;
      arrival_at: string | null;
    }>;
  }>;
};

type TokenCache = { access_token: string; expires_at: number } | null;
let tokenCache: TokenCache = null;

function isIsoDate(v: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(v);
}

async function getAccessToken(
  baseUrl: string,
  clientId: string,
  clientSecret: string
): Promise<string | null> {
  if (tokenCache && Date.now() < tokenCache.expires_at) {
    return tokenCache.access_token;
  }

  try {
    const body = new URLSearchParams();
    body.set("grant_type", "client_credentials");
    body.set("client_id", clientId);
    body.set("client_secret", clientSecret);

    const res = await fetch(`${baseUrl}/v1/security/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
      cache: "no-store",
    });
    if (!res.ok) return null;

    const json = (await res.json()) as {
      access_token?: string;
      expires_in?: number;
    };
    const token = json.access_token || "";
    if (!token) return null;
    const expiresInSec = Number(json.expires_in || 1200);
    tokenCache = {
      access_token: token,
      expires_at: Date.now() + Math.max(60, expiresInSec - 30) * 1000,
    };
    return token;
  } catch {
    return null;
  }
}

function toOffer(row: Record<string, unknown>): AmadeusFlightOffer {
  const itinerariesRaw = Array.isArray(row.itineraries)
    ? (row.itineraries as Array<Record<string, unknown>>)
    : [];

  return {
    id: String(row.id || "unknown"),
    source: row.source ? String(row.source) : null,
    instant_ticketing_required:
      typeof row.instantTicketingRequired === "boolean"
        ? row.instantTicketingRequired
        : null,
    one_way: typeof row.oneWay === "boolean" ? row.oneWay : null,
    number_of_bookable_seats:
      typeof row.numberOfBookableSeats === "number"
        ? row.numberOfBookableSeats
        : null,
    price_total: (() => {
      const total = (row.price as { total?: unknown } | undefined)?.total;
      const n = Number(total);
      return Number.isFinite(n) ? n : null;
    })(),
    currency: (() => {
      const c = (row.price as { currency?: unknown } | undefined)?.currency;
      return typeof c === "string" ? c : null;
    })(),
    itineraries: itinerariesRaw.map((it) => {
      const segs = Array.isArray(it.segments)
        ? (it.segments as Array<Record<string, unknown>>)
        : [];
      return {
        duration: typeof it.duration === "string" ? it.duration : null,
        segments: segs.map((s) => ({
          carrier_code:
            typeof s.carrierCode === "string" ? s.carrierCode : null,
          number: typeof s.number === "string" ? s.number : null,
          departure_iata: (() => {
            const v = (s.departure as { iataCode?: unknown } | undefined)
              ?.iataCode;
            return typeof v === "string" ? v : null;
          })(),
          departure_at: (() => {
            const v = (s.departure as { at?: unknown } | undefined)?.at;
            return typeof v === "string" ? v : null;
          })(),
          arrival_iata: (() => {
            const v = (s.arrival as { iataCode?: unknown } | undefined)
              ?.iataCode;
            return typeof v === "string" ? v : null;
          })(),
          arrival_at: (() => {
            const v = (s.arrival as { at?: unknown } | undefined)?.at;
            return typeof v === "string" ? v : null;
          })(),
        })),
      };
    }),
  };
}

export const amadeusFlightsAdapter: ProviderAdapter<
  AmadeusFlightSearchQuery,
  AmadeusFlightOffer[]
> = {
  id: "amadeus_flights",
  isConfigured: () =>
    Boolean(getEnvOptional("AMADEUS_CLIENT_ID")) &&
    Boolean(getEnvOptional("AMADEUS_CLIENT_SECRET")),
  fetch: async (query) => {
    const now = new Date().toISOString();
    const clientId = getEnvOptional("AMADEUS_CLIENT_ID");
    const clientSecret = getEnvOptional("AMADEUS_CLIENT_SECRET");
    const baseUrl =
      getEnvOptional("AMADEUS_API_BASE") || "https://test.api.amadeus.com";

    if (!clientId || !clientSecret) {
      return {
        ok: false,
        data: [],
        diagnostics: {
          source: "amadeus_flights",
          cache_status: "miss",
          stale: false,
          last_updated: now,
          fallback_reason: "missing_credentials",
        },
      };
    }

    if (!isIsoDate(query.departureDate)) {
      return {
        ok: false,
        data: [],
        diagnostics: {
          source: "amadeus_flights",
          cache_status: "miss",
          stale: false,
          last_updated: now,
          fallback_reason: "invalid_departure_date",
        },
      };
    }

    if (query.returnDate && !isIsoDate(query.returnDate)) {
      return {
        ok: false,
        data: [],
        diagnostics: {
          source: "amadeus_flights",
          cache_status: "miss",
          stale: false,
          last_updated: now,
          fallback_reason: "invalid_return_date",
        },
      };
    }

    const token = await getAccessToken(baseUrl, clientId, clientSecret);
    if (!token) {
      return {
        ok: false,
        data: [],
        diagnostics: {
          source: "amadeus_flights",
          cache_status: "miss",
          stale: false,
          last_updated: now,
          fallback_reason: "auth_failed",
        },
      };
    }

    try {
      const url = new URL(
        `${baseUrl}/v2/shopping/flight-offers`
      );
      url.searchParams.set("originLocationCode", query.origin.toUpperCase());
      url.searchParams.set(
        "destinationLocationCode",
        query.destination.toUpperCase()
      );
      url.searchParams.set("departureDate", query.departureDate);
      if (query.returnDate) {
        url.searchParams.set("returnDate", query.returnDate);
      }
      url.searchParams.set(
        "adults",
        String(Math.max(1, Math.min(query.adults || 1, 9)))
      );
      url.searchParams.set("nonStop", query.nonStop ? "true" : "false");
      url.searchParams.set("currencyCode", query.currency || "USD");
      if (query.travelClass) {
        url.searchParams.set("travelClass", query.travelClass);
      }
      if (Array.isArray(query.includedAirlineCodes) && query.includedAirlineCodes.length > 0) {
        url.searchParams.set(
          "includedAirlineCodes",
          query.includedAirlineCodes
            .map((x) => String(x || "").trim().toUpperCase())
            .filter(Boolean)
            .join(",")
        );
      }
      if (typeof query.maxPrice === "number" && Number.isFinite(query.maxPrice) && query.maxPrice > 0) {
        url.searchParams.set("maxPrice", String(Math.round(query.maxPrice)));
      }
      url.searchParams.set(
        "max",
        String(Math.max(1, Math.min(query.max || 20, 50)))
      );

      const res = await fetch(url.toString(), {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });
      if (!res.ok) {
        return {
          ok: false,
          data: [],
          diagnostics: {
            source: "amadeus_flights",
            cache_status: "miss",
            stale: false,
            last_updated: now,
            fallback_reason: `http_${res.status}`,
          },
        };
      }
      const json = (await res.json()) as { data?: Array<Record<string, unknown>> };
      const offers = (json.data || []).map(toOffer);
      return {
        ok: offers.length > 0,
        data: offers,
        diagnostics: {
          source: "amadeus_flights",
          cache_status: "bypass",
          stale: false,
          last_updated: now,
          fallback_reason: offers.length > 0 ? null : "no_results",
        },
      };
    } catch {
      return {
        ok: false,
        data: [],
        diagnostics: {
          source: "amadeus_flights",
          cache_status: "miss",
          stale: false,
          last_updated: now,
          fallback_reason: "fetch_failed",
        },
      };
    }
  },
};
