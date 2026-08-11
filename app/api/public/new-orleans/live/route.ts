import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LAT = 29.9511;
const LNG = -90.0715;
const NWS_HEADERS = {
  Accept: "application/geo+json, application/json",
  "User-Agent": "DestinationCommandCenter/1.0 (https://destinationcommandcenter.com)",
};

async function fetchJson(url: string, init?: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);
  try {
    const response = await fetch(url, {
      ...init,
      cache: "no-store",
      signal: controller.signal,
      headers: { ...(init?.headers || {}) },
    });
    if (!response.ok) throw new Error(`${response.status} ${url}`);
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function readWeather() {
  try {
    const point = await fetchJson(`https://api.weather.gov/points/${LAT},${LNG}`, { headers: NWS_HEADERS });
    const props = point?.properties || {};
    const [hourly, stations, alerts] = await Promise.all([
      props.forecastHourly ? fetchJson(props.forecastHourly, { headers: NWS_HEADERS }).catch(() => null) : null,
      props.observationStations ? fetchJson(props.observationStations, { headers: NWS_HEADERS }).catch(() => null) : null,
      fetchJson(`https://api.weather.gov/alerts/active?point=${LAT},${LNG}`, { headers: NWS_HEADERS }).catch(() => null),
    ]);

    const stationId = stations?.features?.[0]?.properties?.stationIdentifier;
    const observation = stationId
      ? await fetchJson(`https://api.weather.gov/stations/${stationId}/observations/latest`, { headers: NWS_HEADERS }).catch(() => null)
      : null;
    const o = observation?.properties || {};
    const c = o.temperature?.value;
    const tempF = typeof c === "number" ? Math.round((c * 9) / 5 + 32) : null;

    return {
      available: true,
      provider: "National Weather Service",
      observedAt: o.timestamp || null,
      current: {
        temperatureF: tempF,
        description: o.textDescription || null,
        windMph: typeof o.windSpeed?.value === "number" ? Math.round(o.windSpeed.value * 0.621371) : null,
        humidityPercent: typeof o.relativeHumidity?.value === "number" ? Math.round(o.relativeHumidity.value) : null,
      },
      nextHours: (hourly?.properties?.periods || []).slice(0, 6).map((period: any) => ({
        startTime: period.startTime,
        temperature: period.temperature,
        temperatureUnit: period.temperatureUnit,
        shortForecast: period.shortForecast,
        probabilityOfPrecipitation: period.probabilityOfPrecipitation?.value ?? null,
      })),
      alerts: (alerts?.features || []).slice(0, 5).map((feature: any) => ({
        id: feature.id,
        event: feature.properties?.event,
        severity: feature.properties?.severity,
        headline: feature.properties?.headline,
        effective: feature.properties?.effective,
        expires: feature.properties?.expires,
      })),
    };
  } catch {
    return { available: false, provider: "National Weather Service" };
  }
}

async function readTicketmaster() {
  const apiKey = process.env.TICKETMASTER_API_KEY;
  if (!apiKey) return { available: false, configured: false, provider: "Ticketmaster" };
  try {
    const now = new Date();
    const end = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const url = new URL("https://app.ticketmaster.com/discovery/v2/events.json");
    url.searchParams.set("apikey", apiKey);
    url.searchParams.set("latlong", `${LAT},${LNG}`);
    url.searchParams.set("radius", "20");
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
      })),
    };
  } catch {
    return { available: false, configured: true, provider: "Ticketmaster" };
  }
}

function nearNewOrleans(lat: unknown, lng: unknown) {
  const a = Number(lat);
  const b = Number(lng);
  return Number.isFinite(a) && Number.isFinite(b) && a >= 29.75 && a <= 30.2 && b >= -90.35 && b <= -89.85;
}

async function readTraffic() {
  const key = process.env.LA511_API_KEY;
  if (!key) return { available: false, configured: false, provider: "Louisiana 511" };
  try {
    const data = await fetchJson(`https://www.511la.org/api/v2/get/event?key=${encodeURIComponent(key)}&format=json`);
    const events = (Array.isArray(data) ? data : [])
      .filter((event: any) => nearNewOrleans(event.Latitude, event.Longitude))
      .sort((a: any, b: any) => Number(b.LastUpdated || b.Reported || 0) - Number(a.LastUpdated || a.Reported || 0))
      .slice(0, 12)
      .map((event: any) => ({
        id: event.ID,
        roadway: event.RoadwayName,
        description: event.Description,
        type: event.EventType,
        severity: event.Severity,
        fullClosure: Boolean(event.IsFullClosure),
        latitude: event.Latitude,
        longitude: event.Longitude,
        updatedAt: event.LastUpdated ? new Date(Number(event.LastUpdated) * 1000).toISOString() : null,
      }));
    return { available: true, configured: true, provider: "Louisiana 511", events };
  } catch {
    return { available: false, configured: true, provider: "Louisiana 511" };
  }
}

export async function GET() {
  const checkedAt = new Date().toISOString();
  const [weather, ticketmaster, traffic] = await Promise.all([readWeather(), readTicketmaster(), readTraffic()]);

  return NextResponse.json(
    {
      ok: true,
      city: "new-orleans",
      checkedAt,
      policy: {
        dynamicDataStored: false,
        cache: "no-store",
        note: "Dynamic observations are fetched for this request and are not persisted as destination content.",
      },
      weather,
      ticketmaster,
      traffic,
      officialLiveLinks: [
        {
          label: "RTA real-time transit",
          provider: "New Orleans Regional Transit Authority",
          href: "https://www.norta.com/rider-tools",
          kind: "transit",
        },
        {
          label: "Port NOLA cruise schedules",
          provider: "Port of New Orleans",
          href: "https://portnola.com/cruise/cruise-lines-itineraries",
          kind: "cruise",
        },
        {
          label: "Louisiana 511 traffic map & cameras",
          provider: "Louisiana DOTD",
          href: "https://www.511la.org/",
          kind: "traffic",
        },
      ],
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}
