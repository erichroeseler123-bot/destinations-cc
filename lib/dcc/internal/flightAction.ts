import { amadeusFlightsAdapter } from "@/lib/dcc/providers/adapters/amadeusFlights";
import { openSkyFlightsAdapter } from "@/lib/dcc/providers/adapters/openSkyFlights";
import type { DccDiagnostics } from "@/lib/dcc/diagnostics";

export type FlightSearchRequest = {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  adults?: number;
  nonStop?: boolean;
  currency?: string;
  max?: number;
  travelClass?: "ECONOMY" | "PREMIUM_ECONOMY" | "BUSINESS" | "FIRST";
  flexibleDays?: number;
  priceMin?: number;
  priceMax?: number;
  airlineCodes?: string[];
};

export type FlightStatusRequest = {
  lamin?: number;
  lomin?: number;
  lamax?: number;
  lomax?: number;
};

export type FlightSearchPayload = {
  query: FlightSearchRequest;
  offers: Awaited<ReturnType<typeof amadeusFlightsAdapter.fetch>>["data"];
  diagnostics: DccDiagnostics;
  filters_applied: {
    travelClass: FlightSearchRequest["travelClass"] | null;
    flexibleDays: number;
    priceMin: number | null;
    priceMax: number | null;
    airlineCodes: string[];
  };
};

export type FlightStatusPayload = {
  query: FlightStatusRequest;
  states: Awaited<ReturnType<typeof openSkyFlightsAdapter.fetch>>["data"];
  diagnostics: DccDiagnostics;
};

function isIsoDate(v: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(v);
}

function addDays(isoDate: string, delta: number): string {
  const [y, m, d] = isoDate.split("-").map((x) => Number(x));
  const dt = new Date(Date.UTC(y, (m || 1) - 1, d || 1));
  dt.setUTCDate(dt.getUTCDate() + delta);
  return dt.toISOString().slice(0, 10);
}

function offerPrice(o: { price_total: number | null }): number {
  return typeof o.price_total === "number" && Number.isFinite(o.price_total)
    ? o.price_total
    : Number.POSITIVE_INFINITY;
}

function offerDepartureIso(
  o: { itineraries: Array<{ segments: Array<{ departure_at: string | null }> }> }
): string {
  return o.itineraries?.[0]?.segments?.[0]?.departure_at || "";
}

function offerCarrierCodes(
  o: { itineraries: Array<{ segments: Array<{ carrier_code: string | null }> }> }
): string[] {
  const set = new Set<string>();
  for (const it of o.itineraries || []) {
    for (const s of it.segments || []) {
      if (s.carrier_code) set.add(s.carrier_code.toUpperCase());
    }
  }
  return Array.from(set);
}

function toDccDiagnostics(
  source: string,
  diagnostics: {
    cache_status: "bypass" | "fresh" | "stale" | "miss";
    stale: boolean;
    last_updated: string | null;
    fallback_reason: string | null;
  }
): DccDiagnostics {
  return {
    source,
    cache_status: diagnostics.cache_status,
    stale: diagnostics.stale,
    last_updated: diagnostics.last_updated,
    stale_after: null,
    fallback_reason: diagnostics.fallback_reason,
  };
}

export async function searchFlights(
  query: FlightSearchRequest
): Promise<FlightSearchPayload> {
  const flex = Math.max(0, Math.min(query.flexibleDays || 0, 3));
  const dates = [query.departureDate];
  if (isIsoDate(query.departureDate) && flex > 0) {
    for (let i = 1; i <= flex; i += 1) {
      dates.push(addDays(query.departureDate, -i));
      dates.push(addDays(query.departureDate, i));
    }
  }

  const byId = new Map<string, Awaited<ReturnType<typeof amadeusFlightsAdapter.fetch>>["data"][number]>();
  let anyOk = false;
  let lastDiag: Awaited<ReturnType<typeof amadeusFlightsAdapter.fetch>>["diagnostics"] = {
    source: "amadeus_flights",
    cache_status: "miss",
    stale: false,
    last_updated: null,
    fallback_reason: "no_requests_made",
  };

  for (const departureDate of dates) {
    const res = await amadeusFlightsAdapter.fetch({
      ...query,
      departureDate,
      includedAirlineCodes: query.airlineCodes,
      maxPrice:
        typeof query.priceMax === "number" && Number.isFinite(query.priceMax)
          ? query.priceMax
          : undefined,
    });
    lastDiag = res.diagnostics;
    if (res.ok) anyOk = true;
    for (const o of res.data) byId.set(o.id, o);
  }

  let offers = Array.from(byId.values());

  if (typeof query.priceMin === "number" && Number.isFinite(query.priceMin)) {
    offers = offers.filter((o) => typeof o.price_total === "number" && o.price_total >= query.priceMin!);
  }
  if (typeof query.priceMax === "number" && Number.isFinite(query.priceMax)) {
    offers = offers.filter((o) => typeof o.price_total === "number" && o.price_total <= query.priceMax!);
  }
  if (Array.isArray(query.airlineCodes) && query.airlineCodes.length > 0) {
    const wanted = new Set(query.airlineCodes.map((x) => x.toUpperCase()));
    offers = offers.filter((o) => offerCarrierCodes(o).some((c) => wanted.has(c)));
  }

  offers.sort((a, b) => {
    const priceDiff = offerPrice(a) - offerPrice(b);
    if (priceDiff !== 0) return priceDiff;
    return offerDepartureIso(a).localeCompare(offerDepartureIso(b));
  });

  if (typeof query.max === "number" && query.max > 0) {
    offers = offers.slice(0, query.max);
  }

  return {
    query,
    offers,
    diagnostics: toDccDiagnostics("amadeus_flights", {
      ...lastDiag,
      fallback_reason:
        anyOk || offers.length > 0 ? null : lastDiag.fallback_reason || "no_results",
    }),
    filters_applied: {
      travelClass: query.travelClass || null,
      flexibleDays: flex,
      priceMin:
        typeof query.priceMin === "number" && Number.isFinite(query.priceMin)
          ? query.priceMin
          : null,
      priceMax:
        typeof query.priceMax === "number" && Number.isFinite(query.priceMax)
          ? query.priceMax
          : null,
      airlineCodes: Array.isArray(query.airlineCodes)
        ? query.airlineCodes.map((x) => x.toUpperCase())
        : [],
    },
  };
}

export async function getFlightStatus(
  query: FlightStatusRequest
): Promise<FlightStatusPayload> {
  const res = await openSkyFlightsAdapter.fetch(query);
  return {
    query,
    states: res.data,
    diagnostics: toDccDiagnostics("opensky_flights", res.diagnostics),
  };
}
