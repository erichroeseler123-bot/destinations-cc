import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const NEW_ORLEANS_EVENTS_URL = "https://www.neworleans.com/events/";
const NWS_POINT_URL = "https://api.weather.gov/points/29.9511,-90.0715";
const USER_AGENT = "welcometoneworleanstours.com live concierge (https://www.welcometoneworleanstours.com/contact)";

type Risk = "low" | "elevated" | "high";
type DayPeriod = "morning" | "afternoon" | "evening";

type EventNote = {
  title: string;
  startDate: string | null;
  endDate: string | null;
  url: string;
};

type WeatherNote = {
  temperatureF: number | null;
  maxTemperatureF: number | null;
  precipitationChance: number | null;
  shortForecast: string | null;
  rainRisk: Risk;
  heatRisk: Risk;
  outdoorFriendly: boolean;
};

function localPeriod(date: Date): DayPeriod {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Chicago",
      hour: "2-digit",
      hourCycle: "h23",
    }).format(date),
  );
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

function walkJsonLd(value: unknown, out: Record<string, unknown>[]) {
  if (!value) return;
  if (Array.isArray(value)) {
    value.forEach((item) => walkJsonLd(item, out));
    return;
  }
  if (typeof value !== "object") return;
  const record = value as Record<string, unknown>;
  const type = record["@type"];
  if (type === "Event" || (Array.isArray(type) && type.includes("Event"))) out.push(record);
  Object.values(record).forEach((item) => walkJsonLd(item, out));
}

function parseEventDate(value: unknown): Date | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

async function getEvents(now: Date): Promise<EventNote[]> {
  try {
    const response = await fetch(NEW_ORLEANS_EVENTS_URL, {
      headers: { "User-Agent": USER_AGENT, Accept: "text/html" },
      next: { revalidate: 900 },
    });
    if (!response.ok) return [];
    const html = await response.text();
    const blocks = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
    const records: Record<string, unknown>[] = [];
    for (const block of blocks) {
      try {
        walkJsonLd(JSON.parse(block[1]), records);
      } catch {
        // Ignore malformed third-party structured data and keep the live layer fail-soft.
      }
    }

    const start = now.getTime();
    const end = start + 48 * 60 * 60 * 1000;
    const seen = new Set<string>();

    return records
      .map((record) => {
        const startDate = parseEventDate(record.startDate);
        const endDate = parseEventDate(record.endDate) || startDate;
        const title = typeof record.name === "string" ? record.name.trim() : "";
        const url = typeof record.url === "string" ? record.url : NEW_ORLEANS_EVENTS_URL;
        return { title, startDate, endDate, url };
      })
      .filter((event) => {
        if (!event.title || !event.startDate || !event.endDate) return false;
        const overlaps = event.startDate.getTime() <= end && event.endDate.getTime() >= start;
        if (!overlaps || seen.has(event.title)) return false;
        seen.add(event.title);
        return true;
      })
      .sort((a, b) => a.startDate!.getTime() - b.startDate!.getTime())
      .slice(0, 4)
      .map((event) => ({
        title: event.title,
        startDate: event.startDate?.toISOString() || null,
        endDate: event.endDate?.toISOString() || null,
        url: event.url,
      }));
  } catch {
    return [];
  }
}

async function getWeather(now: Date): Promise<WeatherNote | null> {
  try {
    const pointResponse = await fetch(NWS_POINT_URL, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/geo+json" },
      next: { revalidate: 1800 },
    });
    if (!pointResponse.ok) return null;
    const point = await pointResponse.json();
    const hourlyUrl = point?.properties?.forecastHourly;
    if (typeof hourlyUrl !== "string") return null;

    const forecastResponse = await fetch(hourlyUrl, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/geo+json" },
      next: { revalidate: 900 },
    });
    if (!forecastResponse.ok) return null;
    const forecast = await forecastResponse.json();
    const periods = Array.isArray(forecast?.properties?.periods) ? forecast.properties.periods : [];
    const end = now.getTime() + 48 * 60 * 60 * 1000;
    const next48 = periods.filter((period: any) => {
      const startTime = new Date(period?.startTime || "").getTime();
      return Number.isFinite(startTime) && startTime >= now.getTime() - 60 * 60 * 1000 && startTime <= end;
    });
    if (!next48.length) return null;

    const temperatures = next48.map((period: any) => Number(period.temperature)).filter(Number.isFinite);
    const precip = next48
      .map((period: any) => Number(period?.probabilityOfPrecipitation?.value))
      .filter(Number.isFinite);
    const maxTemperatureF = temperatures.length ? Math.max(...temperatures) : null;
    const precipitationChance = precip.length ? Math.max(...precip) : null;
    const rainRisk: Risk = precipitationChance !== null && precipitationChance >= 60 ? "high" : precipitationChance !== null && precipitationChance >= 30 ? "elevated" : "low";
    const heatRisk: Risk = maxTemperatureF !== null && maxTemperatureF >= 95 ? "high" : maxTemperatureF !== null && maxTemperatureF >= 88 ? "elevated" : "low";

    return {
      temperatureF: Number.isFinite(Number(next48[0]?.temperature)) ? Number(next48[0].temperature) : null,
      maxTemperatureF,
      precipitationChance,
      shortForecast: typeof next48[0]?.shortForecast === "string" ? next48[0].shortForecast : null,
      rainRisk,
      heatRisk,
      outdoorFriendly: rainRisk === "low" && heatRisk !== "high",
    };
  } catch {
    return null;
  }
}

function conciergePick(period: DayPeriod, liveMusicSignal: boolean, weather: WeatherNote | null) {
  if (period === "evening" && liveMusicSignal) {
    return { slug: "evening-jazz-cruise", title: "Evening Jazz Cruise", reason: "Live-music context makes a jazz-forward evening especially timely." };
  }
  if (weather?.rainRisk === "high") {
    return { slug: "covered-tour-boat", title: "Covered Tour Boat", reason: "Higher rain risk favors a more protected format over fully exposed outdoor options." };
  }
  if (weather?.heatRisk === "high") {
    return { slug: "city-tour-of-new-orleans", title: "City Tour Of New Orleans", reason: "High heat makes a riding-focused city overview more comfortable than a long exposed walk." };
  }
  if (period === "evening") {
    return { slug: "ghosts-spirits-walking-tour", title: "Ghosts & Spirits Walking Tour", reason: "The current time of day makes an evening-focused experience a natural fit." };
  }
  return { slug: "daytime-jazz-cruise", title: "Daytime Jazz Cruise", reason: "A flexible daytime option that pairs New Orleans music with Mississippi River views." };
}

export async function GET() {
  const now = new Date();
  const [events, weather] = await Promise.all([getEvents(now), getWeather(now)]);
  const liveMusicSignal = events.some((event) => /(jazz|music|concert|band|tipitina|festival|nola)/i.test(event.title));
  const period = localPeriod(now);

  return NextResponse.json(
    {
      generatedAt: now.toISOString(),
      period,
      rainRisk: weather?.rainRisk || "low",
      heatRisk: weather?.heatRisk || "low",
      outdoorFriendly: weather?.outdoorFriendly ?? false,
      liveMusicSignal,
      weather,
      events,
      conciergePick: conciergePick(period, liveMusicSignal, weather),
      sources: {
        events: NEW_ORLEANS_EVENTS_URL,
        weather: "https://www.weather.gov/documentation/services-web-api",
      },
    },
    { headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800" } },
  );
}
