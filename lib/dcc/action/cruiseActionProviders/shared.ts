import type { CruiseSailing, PortCall } from "@/lib/dcc/cruise/schema";
import { matchCruiseShip } from "@/lib/dcc/cruise/shipRegistry";
import { slugify } from "@/lib/dcc/slug";

type RawLike = Record<string, unknown>;

function asString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function asNumber(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function asBool(v: unknown): boolean | undefined {
  return typeof v === "boolean" ? v : undefined;
}

function normalizePort(raw: RawLike): PortCall {
  return {
    port_name: asString(raw.port_name || raw.portName || raw.name) || "Unknown Port",
    port_code: asString(raw.port_code || raw.portCode) || undefined,
    arrival: asString(raw.arrival) || "TBD",
    departure: asString(raw.departure) || "TBD",
    duration_hours: asNumber(raw.duration_hours || raw.durationHours) || undefined,
    is_overnight: asBool(raw.is_overnight || raw.isOvernight),
    is_private_island: asBool(raw.is_private_island || raw.isPrivateIsland),
  };
}

export function normalizeCruiseRow(raw: RawLike, providerId: string): CruiseSailing | null {
  const rawLine = asString(raw.line) || providerId;
  const ship = asString(raw.ship);
  const shipSlug = asString(raw.ship_slug || raw.shipSlug);
  const departure_date = asString(raw.departure_date || raw.departureDate);
  const duration_days = asNumber(raw.duration_days || raw.durationDays);
  const shipMatch = matchCruiseShip(ship, shipSlug);
  const line = shipMatch?.lineName || rawLine;

  if (!ship || !departure_date || duration_days === null) return null;

  const portsRaw = Array.isArray(raw.ports) ? (raw.ports as RawLike[]) : [];
  const ports = portsRaw.map(normalizePort).filter(Boolean);
  const embark_port = ports[0] || normalizePort((raw.embark_port || raw.embarkPort || {}) as RawLike);
  const disembark_port =
    ports[ports.length - 1] || normalizePort((raw.disembark_port || raw.disembarkPort || {}) as RawLike);
  const itinerary_type =
    asString(raw.itinerary_type || raw.itineraryType) === "oneway"
      ? "oneway"
      : asString(raw.itinerary_type || raw.itineraryType) === "cruise-only"
        ? "cruise-only"
        : asString(raw.itinerary_type || raw.itineraryType) === "fly-cruise"
          ? "fly-cruise"
          : "roundtrip";

  const seaDays = asNumber(raw.sea_days || raw.seaDays);
  const startingPriceAmount = asNumber(
    (raw.starting_price as RawLike | undefined)?.amount || raw.startingPrice || raw.price
  );
  const startingPriceCurrency = asString(
    (raw.starting_price as RawLike | undefined)?.currency || raw.currency
  ) || "USD";
  const source = `${providerId}:live`;

  return {
    sailing_id:
      asString(raw.sailing_id || raw.sailingId) ||
      `${providerId.toUpperCase()}-${slugify(ship)}-${departure_date}`,
    line,
    line_slug: shipMatch?.lineSlug || asString(raw.line_slug || raw.lineSlug) || slugify(line),
    ship: shipMatch?.cruiseShip || ship,
    ship_slug: shipMatch?.cruiseShipSlug || shipSlug || slugify(ship),
    ship_image_url: asString(raw.ship_image_url || raw.shipImageUrl) || undefined,
    departure_date,
    duration_days: Math.max(1, Math.round(duration_days)),
    itinerary_type,
    embark_port,
    disembark_port,
    ports: ports.length > 0 ? ports : [embark_port, disembark_port],
    sea_days:
      seaDays !== null
        ? Math.max(0, Math.round(seaDays))
        : Math.max(0, Math.round(duration_days) - Math.max(1, ports.length - 1)),
    starting_price:
      startingPriceAmount !== null
        ? {
            amount: startingPriceAmount,
            currency: startingPriceCurrency,
            cabin_type: "unknown",
          }
        : undefined,
    availability_status: (() => {
      const s = asString(raw.availability_status || raw.availabilityStatus).toLowerCase();
      if (s === "good" || s === "limited" || s === "sold-out" || s === "waitlist") return s;
      return undefined;
    })(),
    amenities: {
      dining: Array.isArray((raw.amenities as RawLike | undefined)?.dining)
        ? (((raw.amenities as RawLike).dining as unknown[]) || []).filter((x): x is string => typeof x === "string")
        : [],
      entertainment: Array.isArray((raw.amenities as RawLike | undefined)?.entertainment)
        ? (((raw.amenities as RawLike).entertainment as unknown[]) || []).filter((x): x is string => typeof x === "string")
        : [],
      activities: Array.isArray((raw.amenities as RawLike | undefined)?.activities)
        ? (((raw.amenities as RawLike).activities as unknown[]) || []).filter((x): x is string => typeof x === "string")
        : [],
      wellness: Array.isArray((raw.amenities as RawLike | undefined)?.wellness)
        ? (((raw.amenities as RawLike).wellness as unknown[]) || []).filter((x): x is string => typeof x === "string")
        : [],
      other: Array.isArray((raw.amenities as RawLike | undefined)?.other)
        ? (((raw.amenities as RawLike).other as unknown[]) || []).filter((x): x is string => typeof x === "string")
        : [],
    },
    source,
    external_booking_url: asString(raw.external_booking_url || raw.externalBookingUrl || raw.booking_url || raw.bookingUrl) || undefined,
    external_provider: "other",
  };
}

export async function fetchProviderJson(
  url: string,
  apiKey: string | undefined,
  timeoutMs: number
): Promise<unknown> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const headers: Record<string, string> = { accept: "application/json" };
    if (apiKey) headers["x-api-key"] = apiKey;
    const res = await fetch(url, { headers, signal: ctl.signal, cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

export function extractRows(raw: unknown): RawLike[] {
  if (Array.isArray(raw)) return raw.filter((x): x is RawLike => !!x && typeof x === "object");
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.sailings)) return obj.sailings.filter((x): x is RawLike => !!x && typeof x === "object");
    if (Array.isArray(obj.data)) return obj.data.filter((x): x is RawLike => !!x && typeof x === "object");
  }
  return [];
}
