const DELLS_LAT = 43.6275;
const DELLS_LON = -89.7709;
const USGS_SITE = "USGS-05404000";

const USER_AGENT = "WelcomeToTheDells/1.0 (https://welcometothedells.com)";

type JsonRecord = Record<string, any>;

function numberOrNull(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function round(value: number | null, digits = 0) {
  if (value === null) return null;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

async function fetchJson(url: string) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/geo+json, application/json",
      "User-Agent": USER_AGENT,
    },
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }

  return (await response.json()) as JsonRecord;
}

async function loadWeather() {
  const point = await fetchJson(`https://api.weather.gov/points/${DELLS_LAT},${DELLS_LON}`);
  const hourlyUrl = point?.properties?.forecastHourly;
  if (!hourlyUrl) throw new Error("NWS hourly forecast URL unavailable");

  const hourly = await fetchJson(hourlyUrl);
  const period = hourly?.properties?.periods?.[0];
  if (!period) throw new Error("NWS hourly forecast unavailable");

  return {
    source: "National Weather Service",
    sourceUrl: "https://api.weather.gov",
    observedAt: period.startTime ?? null,
    temperatureF: numberOrNull(period.temperature),
    temperatureUnit: period.temperatureUnit ?? "F",
    shortForecast: period.shortForecast ?? null,
    precipitationProbabilityPct: numberOrNull(period.probabilityOfPrecipitation?.value),
    windSpeed: period.windSpeed ?? null,
    windDirection: period.windDirection ?? null,
    isDaytime: Boolean(period.isDaytime),
  };
}

async function loadRiver() {
  const url = new URL("https://api.waterdata.usgs.gov/ogcapi/v0/collections/latest-continuous/items");
  url.searchParams.set("f", "json");
  url.searchParams.set("monitoring_location_id", USGS_SITE);
  url.searchParams.set("limit", "25");

  const payload = await fetchJson(url.toString());
  const features = Array.isArray(payload?.features) ? payload.features : [];

  const findParameter = (code: string) =>
    features.find((feature: JsonRecord) => feature?.properties?.parameter_code === code)?.properties;

  const discharge = findParameter("00060");
  const gageHeight = findParameter("00065");
  const newest = [discharge?.time, gageHeight?.time].filter(Boolean).sort().at(-1) ?? null;

  return {
    source: "U.S. Geological Survey",
    sourceUrl: "https://api.waterdata.usgs.gov",
    stationId: "05404000",
    stationName: "Wisconsin River near Wisconsin Dells, WI",
    observedAt: newest,
    dischargeCfs: round(numberOrNull(discharge?.value)),
    gageHeightFt: round(numberOrNull(gageHeight?.value), 2),
    provisional:
      [discharge?.approval_status, gageHeight?.approval_status]
        .flat()
        .filter(Boolean)
        .some((status) => String(status).toLowerCase().includes("provisional")),
  };
}

function buildGuidance(weather: Awaited<ReturnType<typeof loadWeather>> | null) {
  if (!weather) {
    return {
      headline: "Check conditions before locking the day in.",
      detail: "Live weather is temporarily unavailable, so keep an indoor backup and confirm operator schedules directly.",
      href: "/things-to-do",
      cta: "Browse things to do",
    };
  }

  const rain = weather.precipitationProbabilityPct ?? 0;
  const forecast = String(weather.shortForecast ?? "").toLowerCase();
  const stormy = rain >= 50 || forecast.includes("thunder") || forecast.includes("storm") || forecast.includes("rain");
  const hot = (weather.temperatureF ?? 0) >= 82;

  if (stormy) {
    return {
      headline: "Keep an indoor backup close.",
      detail: "Current NWS guidance points to meaningful rain or storm risk. Avoid building the whole day around weather-sensitive stops.",
      href: "/rainy-day",
      cta: "Open the rainy-day plan",
    };
  }

  if (hot) {
    return {
      headline: "Front-load the outdoor part of the day.",
      detail: "It is warm enough that river time or an outdoor anchor earlier in the day can make the rest of the plan easier.",
      href: "/boat-tours",
      cta: "Compare river experiences",
    };
  }

  return {
    headline: "Conditions look workable for a flexible Dells day.",
    detail: "Use one outdoor anchor, keep a weather backup, and confirm operator availability before you drive across town.",
    href: "/things-to-do",
    cta: "Build the day",
  };
}

export async function GET() {
  const [weatherResult, riverResult] = await Promise.allSettled([loadWeather(), loadRiver()]);

  const weather = weatherResult.status === "fulfilled" ? weatherResult.value : null;
  const river = riverResult.status === "fulfilled" ? riverResult.value : null;

  return Response.json(
    {
      generatedAt: new Date().toISOString(),
      location: {
        name: "Wisconsin Dells, Wisconsin",
        latitude: DELLS_LAT,
        longitude: DELLS_LON,
      },
      weather,
      river,
      guidance: buildGuidance(weather),
      caveat:
        "Live public observations are planning context only. They do not confirm that any attraction, tour, waterpark, river operator, road, or venue is open or operating.",
      freshnessSeconds: 300,
      sources: [
        {
          name: "National Weather Service API",
          url: "https://api.weather.gov",
          keyRequired: false,
        },
        {
          name: "USGS Water Data API",
          url: "https://api.waterdata.usgs.gov",
          keyRequired: false,
          monitoringLocation: USGS_SITE,
        },
      ],
    },
    {
      headers: {
        "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600",
      },
    },
  );
}
