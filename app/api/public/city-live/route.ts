import { NextRequest, NextResponse } from "next/server";
import { getOfficialLiveSources, getProviderSlotStatus } from "@/lib/dcc/liveCity/officialSources";
import { readMachineFeeds } from "@/lib/dcc/liveCity/machineFeeds";
import { readNoaaWaterLevel } from "@/lib/dcc/liveCity/coastalFeeds";
import { readNwpsWaterFeed } from "@/lib/dcc/liveCity/waterFeed";
import { deriveCityNow } from "@/lib/dcc/liveCity/cityNow";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const USER_AGENT = "DestinationCommandCenter/1.0 (https://destinationcommandcenter.com)";

type ProviderSlotStatus = {
  available?: boolean;
  sourceCount?: number;
  realtime?: boolean;
  apiConfigured?: boolean;
  mode?: string;
  machineReadable?: boolean;
  liveItemCount?: number;
};

async function fetchJson(url: string, init?: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);
  try {
    const response = await fetch(url, {
      ...init,
      cache: "no-store",
      signal: controller.signal,
      headers: { "User-Agent": USER_AGENT, ...(init?.headers || {}) },
    });
    if (!response.ok) throw new Error(`${response.status} ${url}`);
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

function validCoordinate(value: string | null, min: number, max: number) {
  if (value == null || value.trim() === "") return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= min && number <= max ? number : null;
}

function weatherCodeLabel(code: unknown) {
  const n = Number(code);
  if (n === 0) return "Clear";
  if (n === 1) return "Mostly clear";
  if (n === 2) return "Partly cloudy";
  if (n === 3) return "Overcast";
  if (n === 45 || n === 48) return "Fog";
  if ([51, 53, 55, 56, 57].includes(n)) return "Drizzle";
  if ([61, 63, 65, 66, 67].includes(n)) return "Rain";
  if ([71, 73, 75, 77].includes(n)) return "Snow";
  if ([80, 81, 82].includes(n)) return "Rain showers";
  if ([85, 86].includes(n)) return "Snow showers";
  if ([95, 96, 99].includes(n)) return "Thunderstorms";
  return "Current conditions";
}

async function readGlobalWeather(lat: number, lng: number, timezone?: string | null) {
  try {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", String(lat));
    url.searchParams.set("longitude", String(lng));
    url.searchParams.set("current", "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,cloud_cover,wind_speed_10m");
    url.searchParams.set("hourly", "temperature_2m,precipitation_probability,weather_code");
    url.searchParams.set("forecast_hours", "8");
    url.searchParams.set("temperature_unit", "fahrenheit");
    url.searchParams.set("wind_speed_unit", "mph");
    url.searchParams.set("timezone", timezone || "auto");

    const data = await fetchJson(url.toString());
    const current = data?.current || {};
    const times: string[] = Array.isArray(data?.hourly?.time) ? data.hourly.time : [];
    const temps: number[] = Array.isArray(data?.hourly?.temperature_2m) ? data.hourly.temperature_2m : [];
    const precip: Array<number | null> = Array.isArray(data?.hourly?.precipitation_probability) ? data.hourly.precipitation_probability : [];
    const codes: number[] = Array.isArray(data?.hourly?.weather_code) ? data.hourly.weather_code : [];

    return {
      available: true,
      provider: "Open-Meteo",
      attribution: "Weather data by Open-Meteo",
      observedAt: current.time || null,
      current: {
        temperatureF: typeof current.temperature_2m === "number" ? Math.round(current.temperature_2m) : null,
        apparentTemperatureF: typeof current.apparent_temperature === "number" ? Math.round(current.apparent_temperature) : null,
        description: weatherCodeLabel(current.weather_code),
        windMph: typeof current.wind_speed_10m === "number" ? Math.round(current.wind_speed_10m) : null,
        humidityPercent: typeof current.relative_humidity_2m === "number" ? Math.round(current.relative_humidity_2m) : null,
        precipitationIn: typeof current.precipitation === "number" ? current.precipitation : null,
        isDay: current.is_day === 1,
      },
      nextHours: times.slice(0, 8).map((time, index) => ({
        startTime: time,
        temperature: temps[index] ?? null,
        temperatureUnit: "F",
        shortForecast: weatherCodeLabel(codes[index]),
        probabilityOfPrecipitation: precip[index] ?? null,
      })),
    };
  } catch {
    return { available: false, provider: "Open-Meteo", attribution: "Weather data by Open-Meteo" };
  }
}

async function readTicketmaster(lat: number, lng: number) {
  const apiKey = process.env.TICKETMASTER_API_KEY;
  if (!apiKey) return { available: false, configured: false, provider: "Ticketmaster" };
  try {
    const now = new Date();
    const end = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const url = new URL("https://app.ticketmaster.com/discovery/v2/events.json");
    url.searchParams.set("apikey", apiKey);
    url.searchParams.set("latlong", `${lat},${lng}`);
    url.searchParams.set("radius", "25");
    url.searchParams.set("unit", "miles");
    url.searchParams.set("startDateTime", now.toISOString().replace(/\.\d{3}Z$/, "Z"));
    url.searchParams.set("endDateTime", end.toISOString().replace(/\.\d{3}Z$/, "Z"));
    url.searchParams.set("size", "20");
    url.searchParams.set("sort", "date,asc");
    const data = await fetchJson(url.toString());
    return {
      available: true,
      configured: true,
      provider: "Ticketmaster",
      events: (data?._embedded?.events || []).map((event: any) => ({
        id: event.id,
        name: event.name,
        url: event.url,
        start: event.dates?.start?.dateTime || event.dates?.start?.localDate || null,
        status: event.dates?.status?.code || null,
        venue: event._embedded?.venues?.[0]?.name || null,
        category: event.classifications?.[0]?.segment?.name || null,
        latitude: Number(event._embedded?.venues?.[0]?.location?.latitude) || null,
        longitude: Number(event._embedded?.venues?.[0]?.location?.longitude) || null,
      })),
    };
  } catch {
    return { available: false, configured: true, provider: "Ticketmaster" };
  }
}

function displayCityName(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const lat = validCoordinate(searchParams.get("lat"), -90, 90);
  const lng = validCoordinate(searchParams.get("lng"), -180, 180);
  const city = (searchParams.get("city") || "city").slice(0, 120);
  const timezone = (searchParams.get("timezone") || "auto").slice(0, 100);

  if (lat == null || lng == null) {
    return NextResponse.json({ ok: false, error: "Valid lat and lng are required." }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }

  const checkedAt = new Date().toISOString();
  const [weather, ticketmaster, baseMachineFeeds, coastalFeed, nwpsFeed] = await Promise.all([
    readGlobalWeather(lat, lng, timezone),
    readTicketmaster(lat, lng),
    readMachineFeeds(city, lat, lng),
    readNoaaWaterLevel(city),
    readNwpsWaterFeed(lat, lng),
  ]);
  const machineFeeds = [
    ...baseMachineFeeds,
    ...(coastalFeed ? [coastalFeed] : []),
    nwpsFeed,
  ];
  const officialLiveLinks = getOfficialLiveSources(city);
  const providerSlots: Record<string, ProviderSlotStatus> = getProviderSlotStatus(city);

  for (const feed of machineFeeds) {
    const slotName = feed.kind;
    const existing = providerSlots[slotName] || {};
    providerSlots[slotName] = {
      ...existing,
      available: feed.available || existing.available,
      machineReadable: true,
      liveItemCount: feed.items.length,
      mode: feed.available ? feed.mode : existing.mode,
    };
  }

  const cityNow = deriveCityNow({
    cityName: displayCityName(city),
    weather,
    ticketmaster,
    machineFeeds,
  });

  return NextResponse.json(
    {
      ok: true,
      city,
      coordinates: { lat, lng },
      checkedAt,
      policy: {
        dynamicDataStored: false,
        cache: "no-store",
        note: "Dynamic observations are fetched for this request and are not persisted as destination content.",
      },
      cityNow,
      weather,
      ticketmaster,
      machineFeeds,
      providerSlots,
      officialLiveLinks,
    },
    { status: 200, headers: { "Cache-Control": "no-store, max-age=0", "X-Robots-Tag": "noindex" } }
  );
}
