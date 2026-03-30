export type FastPassSlot = {
  id: string;
  departIso: string;
  dateLabel: string;
  departLabel: string;
  arriveRocksLabel: string;
  departRocksLabel: string;
  returnLabel: string;
  seatsLeft: number;
  targetCapacity: number;
  maxSeats: number;
  soldOut: boolean;
  availabilityLabel: "available" | "limited" | "sold_out";
  priceLabel: string;
  pickupLabel: string;
};

const DENVER_TZ = "America/Denver";
const TARGET_CAPACITY = 8;
const MAX_CAPACITY = 12;
const TRIP_HOURS = [8, 9, 10, 11];

function getDenverParts(date: Date) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: DENVER_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  const parts = formatter.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value ?? "2026";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";
  return { year, month, day };
}

function addDays(dateKey: string, days: number) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days, 12, 0, 0));
  const nextYear = date.getUTCFullYear();
  const nextMonth = String(date.getUTCMonth() + 1).padStart(2, "0");
  const nextDay = String(date.getUTCDate()).padStart(2, "0");
  return `${nextYear}-${nextMonth}-${nextDay}`;
}

function getDenverOffset(dateKey: string) {
  const probe = new Date(`${dateKey}T12:00:00Z`);
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: DENVER_TZ,
    timeZoneName: "shortOffset"
  });
  const timeZoneName = formatter
    .formatToParts(probe)
    .find((part) => part.type === "timeZoneName")
    ?.value;

  if (!timeZoneName || !timeZoneName.startsWith("GMT")) {
    return "-07:00";
  }

  const raw = timeZoneName.replace("GMT", "");
  if (/^[+-]\d{1,2}$/.test(raw)) {
    const sign = raw.startsWith("-") ? "-" : "+";
    const hours = raw.replace(/[+-]/, "").padStart(2, "0");
    return `${sign}${hours}:00`;
  }

  return raw;
}

function buildDeparture(dateKey: string, hour: number) {
  const offset = getDenverOffset(dateKey);
  return new Date(`${dateKey}T${String(hour).padStart(2, "0")}:00:00${offset}`);
}

function formatDateLabel(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: DENVER_TZ,
    weekday: "short",
    month: "short",
    day: "numeric"
  }).format(date);
}

function formatTimeLabel(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: DENVER_TZ,
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}

export function getFastPassSlots(now = new Date()): FastPassSlot[] {
  const nowMs = now.getTime();
  const maxMs = nowMs + 72 * 60 * 60 * 1000;
  const { year, month, day } = getDenverParts(now);
  const todayKey = `${year}-${month}-${day}`;
  const slots: FastPassSlot[] = [];

  for (let dayOffset = 0; dayOffset < 5; dayOffset += 1) {
    const dateKey = addDays(todayKey, dayOffset);
    for (const tripHour of TRIP_HOURS) {
      const departure = buildDeparture(dateKey, tripHour);
      const departureMs = departure.getTime();
      if (departureMs < nowMs || departureMs > maxMs) continue;

      const arriveRocks = new Date(departureMs + 30 * 60 * 1000);
      const departRocks = new Date(departureMs + 5 * 60 * 60 * 1000);
      const returnDowntown = new Date(departureMs + 8 * 60 * 60 * 1000);
      slots.push({
        id: `${dateKey}-${tripHour}`,
        departIso: departure.toISOString(),
        dateLabel: formatDateLabel(departure),
        departLabel: formatTimeLabel(departure),
        arriveRocksLabel: formatTimeLabel(arriveRocks),
        departRocksLabel: "Stay until you're ready",
        returnLabel: "Any shuttle after 2:00 PM",
        seatsLeft: MAX_CAPACITY,
        targetCapacity: TARGET_CAPACITY,
        maxSeats: MAX_CAPACITY,
        soldOut: false,
        availabilityLabel: "available",
        priceLabel: "$25 round-trip",
        pickupLabel: "Union Station / Downtown Denver"
      });
    }
  }

  return slots.sort((a, b) => a.departIso.localeCompare(b.departIso));
}

export function getFastPassSlotById(slotId: string, now = new Date()) {
  return getFastPassSlots(now).find((slot) => slot.id === slotId) ?? null;
}
