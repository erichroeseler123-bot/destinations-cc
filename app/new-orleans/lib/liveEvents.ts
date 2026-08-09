import { ticketmasterAdapter, type TicketmasterEvent } from "@/lib/dcc/providers/adapters/ticketmaster";

export type NewOrleansEventWindow = "all" | "tonight" | "weekend";

const NEW_ORLEANS_CENTER = {
  lat: 29.9511,
  lon: -90.0715,
  radiusKm: 40,
};

function localDateKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function eventDateKey(event: TicketmasterEvent) {
  return event.start_date || "";
}

function upcomingWeekendDateKeys(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const weekday = parts.find((part) => part.type === "weekday")?.value || "Sun";
  const weekdayIndex: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  const current = weekdayIndex[weekday] ?? 0;
  const daysUntilFriday = current <= 5 ? 5 - current : 6;
  const friday = new Date(now.getTime() + daysUntilFriday * 86_400_000);
  const saturday = new Date(friday.getTime() + 86_400_000);
  const sunday = new Date(friday.getTime() + 2 * 86_400_000);
  return new Set([localDateKey(friday), localDateKey(saturday), localDateKey(sunday)]);
}

export async function getNewOrleansLiveEvents(window: NewOrleansEventWindow = "all") {
  const result = await ticketmasterAdapter.fetch({
    lat: NEW_ORLEANS_CENTER.lat,
    lon: NEW_ORLEANS_CENTER.lon,
    radius_km: NEW_ORLEANS_CENTER.radiusKm,
    size: 40,
  });

  const now = new Date();
  const today = localDateKey(now);
  const weekend = upcomingWeekendDateKeys(now);

  const events = result.data
    .filter((event) => Boolean(event.id && event.name && event.start_date))
    .filter((event) => {
      if (window === "tonight") return eventDateKey(event) === today;
      if (window === "weekend") return weekend.has(eventDateKey(event));
      return true;
    })
    .sort((a, b) => {
      const aTime = `${a.start_date || "9999-12-31"}T${a.start_time || "23:59:59"}`;
      const bTime = `${b.start_date || "9999-12-31"}T${b.start_time || "23:59:59"}`;
      return aTime.localeCompare(bTime);
    });

  return {
    events,
    diagnostics: result.diagnostics,
    configured: result.ok || result.diagnostics.fallback_reason !== "missing_api_key",
  };
}

export function formatLiveEventDate(event: TicketmasterEvent) {
  if (!event.start_date) return "Upcoming";
  const iso = event.start_time
    ? `${event.start_date}T${event.start_time}`
    : `${event.start_date}T12:00:00`;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return event.start_date;

  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    ...(event.start_time ? { hour: "numeric", minute: "2-digit" } : {}),
  }).format(date);
}

export function eventCategory(event: TicketmasterEvent) {
  return event.genre_name || event.segment_name || "Live Event";
}
