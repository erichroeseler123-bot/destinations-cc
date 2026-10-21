export const JUNEAU_TIME_ZONE = "America/Juneau";

export function juneauDate(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: JUNEAU_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

export function juneauClock(now = new Date()): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone: JUNEAU_TIME_ZONE, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(now);
}

export interface DepartureTour {
  id: string;
  title: string;
  supplierName: string | null;
  directOperatorHref?: string;
}

export interface NextDeparture {
  id: string;
  title: string;
  operator: string;
  startsAt: string;
  timeLabel: string;
  bookingUrl: string;
}

export interface DepartureResponse {
  date: string;
  checkedAt: string;
  checkedOperators: number;
  failedCalendars: number;
  departures: NextDeparture[];
}

// Calendar listings are schedules, not confirmation of seats, eligibility, or flight clearance.
export function parseCalendarDepartures(
  raw: unknown,
  tour: DepartureTour,
  date: string,
  readyAfter: string,
  travelers: number,
  now = new Date(),
): NextDeparture[] {
  if (!raw || typeof raw !== "object" || !Array.isArray((raw as { availabilities?: unknown }).availabilities)) throw new Error("Invalid calendar response");
  const base = new URL(tour.directOperatorHref!);
  return (raw as { availabilities: Record<string, unknown>[] }).availabilities.flatMap((slot) => {
    if (!slot || typeof slot !== "object") return [];
    const item = slot.item as Record<string, unknown> | undefined;
    const expectedItem = base.pathname.match(/\/items\/(\d+)\//)?.[1];
    if (!item || String(item.pk) !== expectedItem) return [];
    if (slot.is_bookable !== true || slot.is_sold_out === true || slot.is_waitlist === true || slot.is_unlisted === true || slot.is_bookable_only_by_phone === true || slot.is_past_cutoff_with_bookings === true || slot.is_past_cutoff_without_bookings === true || slot.booking_restriction) return [];
    if (typeof item.minimum_initial_party_size === "number" && travelers < item.minimum_initial_party_size) return [];
    if (typeof item.maximum_initial_party_size === "number" && travelers > item.maximum_initial_party_size) return [];
    // utc_start_at is authoritative. Never interpret a timezone-free local start as server time.
    const stamp = typeof slot.utc_start_at === "string" ? slot.utc_start_at : typeof slot.start_at === "string" && /(?:Z|[+-]\d{2}:?\d{2})$/.test(slot.start_at) ? slot.start_at : "";
    const start = new Date(stamp);
    if (!Number.isFinite(start.getTime()) || start <= now || juneauDate(start) !== date || juneauClock(start) < readyAfter) return [];
    if (typeof slot.pk !== "number" || !Number.isSafeInteger(slot.pk)) return [];
    const booking = new URL(base);
    booking.searchParams.set("availability", String(slot.pk));
    booking.searchParams.set("date", date);
    return [{
      id: `${tour.id}-${slot.pk}`,
      title: typeof item.name === "string" ? item.name : tour.title,
      operator: tour.supplierName || "Local helicopter operator",
      startsAt: start.toISOString(),
      timeLabel: new Intl.DateTimeFormat("en-US", { timeZone: JUNEAU_TIME_ZONE, hour: "numeric", minute: "2-digit", timeZoneName: "short" }).format(start),
      bookingUrl: booking.toString(),
    }];
  });
}

export function sortDepartures(departures: NextDeparture[]): NextDeparture[] {
  return [...new Map(departures.map(d => [d.id, d])).values()].sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
}
