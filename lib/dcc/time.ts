export function getLocalTime(timezone: string, includeWeekday = false, now = new Date()) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "numeric",
    minute: "2-digit",
    ...(includeWeekday ? { weekday: "long" } : {}),
  }).format(now);
}

export function getUtcOffset(timezone: string, now = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    timeZoneName: "shortOffset",
    hour: "numeric",
  });
  const offsetPart = formatter.formatToParts(now).find((part) => part.type === "timeZoneName")?.value || "GMT";
  return offsetPart.replace("GMT", "UTC");
}

export function getTimezoneLabel(timezone: string, now = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    timeZoneName: "longGeneric",
    hour: "numeric",
  });
  return formatter.formatToParts(now).find((part) => part.type === "timeZoneName")?.value || timezone;
}
