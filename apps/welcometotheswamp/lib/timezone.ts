/**
 * Timezone utilities for Welcome to the Swamp.
 * All tour departures, booking cutoffs, pickup schedules, and waitlist
 * expiries are anchored to New Orleans local time (America/Chicago).
 */

export const NEW_ORLEANS_TIMEZONE = "America/Chicago";

/**
 * Returns the current date (YYYY-MM-DD) in New Orleans.
 */
export function getTodayNewOrleansDate(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: NEW_ORLEANS_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/**
 * Returns tomorrow's date (YYYY-MM-DD) in New Orleans.
 */
export function getTomorrowNewOrleansDate(): string {
  const now = new Date();
  // Advance by 24 hours and re-format in America/Chicago
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: NEW_ORLEANS_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(tomorrow);
}

/**
 * Returns the current time (HH:MM:SS) in New Orleans.
 */
export function getCurrentNewOrleansTime(): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: NEW_ORLEANS_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date());
}

/**
 * Formats an ISO or time string into a human-readable 12-hour format in New Orleans time.
 * e.g., "11:45 AM"
 */
export function formatTimeNewOrleans(timeString: string): string {
  // If timeString is just "11:45" or "11:45:00"
  if (/^\d{2}:\d{2}(:\d{2})?$/.test(timeString)) {
    const [hours, minutes] = timeString.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const hour12 = hours % 12 === 0 ? 12 : hours % 12;
    return `${hour12}:${minutes.toString().padStart(2, "0")} ${period}`;
  }

  // If timeString is a full ISO date
  const date = new Date(timeString);
  if (!isNaN(date.getTime())) {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: NEW_ORLEANS_TIMEZONE,
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  }

  return timeString;
}

/**
 * Computes the expiration timestamp for a tour travel date in New Orleans time.
 * An alert expires at the end of the travel day: 23:59:59 CDT/CST.
 */
export function getTravelDateExpiryNewOrleans(travelDate: string): Date {
  // Construct end-of-day in America/Chicago
  // We use ISO string offset resolution
  const endOfDayStr = `${travelDate}T23:59:59`;
  // Test whether travelDate is valid YYYY-MM-DD
  const base = new Date(`${travelDate}T12:00:00Z`);
  if (isNaN(base.getTime())) {
    return new Date(Date.now() + 24 * 60 * 60 * 1000);
  }
  
  // Format to find offset for this date in Chicago
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: NEW_ORLEANS_TIMEZONE,
    timeZoneName: "shortOffset",
  }).formatToParts(base);
  const offsetPart = parts.find((p) => p.type === "timeZoneName")?.value || "GMT-5";
  const offsetMatch = offsetPart.match(/GMT([+-]\d+)(?::(\d+))?/);
  let offsetIso = "-05:00";
  if (offsetMatch) {
    const sign = offsetMatch[1].startsWith("-") ? "-" : "+";
    const hours = Math.abs(parseInt(offsetMatch[1], 10)).toString().padStart(2, "0");
    const mins = (offsetMatch[2] || "00").padStart(2, "0");
    offsetIso = `${sign}${hours}:${mins}`;
  }

  return new Date(`${endOfDayStr}${offsetIso}`);
}
