export type Coordinate = { lat: number; lng: number };

type SourceState<T> = {
  available: boolean;
  checkedAt: string;
  provider: string;
  attribution: string;
  data: T | null;
  error?: string;
};

const UA = "DestinationCommandCenter/2.0 (+https://destinationcommandcenter.com/developers)";

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function round(value: number, places = 5) {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

async function readJson<T>(
  url: string,
  options: { timeoutMs?: number; revalidate?: number; headers?: Record<string, string> } = {},
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 7000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "User-Agent": UA,
        ...options.headers,
      },
      ...(options.revalidate
        ? { next: { revalidate: options.revalidate } }
        : { cache: "no-store" as const }),
    });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    return (await response.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

async function source<T>(
  provider: string,
  attribution: string,
  reader: () => Promise<T>,
): Promise<SourceState<T>> {
  const checkedAt = new Date().toISOString();
  try {
    return { available: true, checkedAt, provider, attribution, data: await reader() };
  } catch (error) {
    return {
      available: false,
      checkedAt,
      provider,
      attribution,
      data: null,
      error: error instanceof Error ? error.message : "unavailable",
    };
  }
}

function haversineKm(a: Coordinate, b: Coordinate) {
  const r = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * r * Math.asin(Math.sqrt(h));
}

function weatherDescription(code: number | null | undefined) {
  if (code == null) return null;
  const descriptions: Record<number, string> = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Rime fog",
    51: "Light drizzle",
    53: "Drizzle",
    55: "Dense drizzle",
    56: "Light freezing drizzle",
    57: "Freezing drizzle",
    61: "Light rain",
    63: "Rain",
    65: "Heavy rain",
    66: "Light freezing rain",
    67: "Freezing rain",
    71: "Light snow",
    73: "Snow",
    75: "Heavy snow",
    77: "Snow grains",
    80: "Light rain showers",
    81: "Rain showers",
    82: "Heavy rain showers",
    85: "Light snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with hail",
    99: "Severe thunderstorm with hail",
  };
  return descriptions[code] || `Weather code ${code}`;
}

export async function readGlobalWeather({ lat, lng }: Coordinate) {
  return source("open-meteo", "Weather data: Open-Meteo", async () => {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", String(lat));
    url.searchParams.set("longitude", String(lng));
    url.searchParams.set("timezone", "auto");
    url.searchParams.set(
      "current",
      [
        "temperature_2m",
        "relative_humidity_2m",
        "apparent_temperature",
        "is_day",
        "precipitation",
        "rain",
        "showers",
        "snowfall",
        "weather_code",
        "cloud_cover",
        "surface_pressure",
        "wind_speed_10m",
        "wind_direction_10m",
        "wind_gusts_10m",
      ].join(","),
    );
    url.searchParams.set(
      "hourly",
      [
        "temperature_2m",
        "apparent_temperature",
        "precipitation_probability",
        "precipitation",
        "weather_code",
        "visibility",
        "wind_speed_10m",
        "wind_gusts_10m",
        "snow_depth",
      ].join(","),
    );
    url.searchParams.set(
      "daily",
      [
        "sunrise",
        "sunset",
        "uv_index_max",
        "precipitation_sum",
        "precipitation_probability_max",
        "temperature_2m_max",
        "temperature_2m_min",
      ].join(","),
    );
    url.searchParams.set("forecast_days", "3");
    const payload: any = await readJson(url.toString(), { revalidate: 300 });
    const current = payload?.current || {};
    const times: string[] = payload?.hourly?.time || [];
    const currentIndex = Math.max(
      0,
      times.findIndex((time) => time >= (current.time || "")),
    );
    const slice = (values: any[]) => (Array.isArray(values) ? values.slice(currentIndex, currentIndex + 12) : []);
    return {
      timezone: payload?.timezone || null,
      timezoneAbbreviation: payload?.timezone_abbreviation || null,
      utcOffsetSeconds: payload?.utc_offset_seconds ?? null,
      elevationM: payload?.elevation ?? null,
      current: {
        ...current,
        description: weatherDescription(current.weather_code),
      },
      next12Hours: times.slice(currentIndex, currentIndex + 12).map((time, index) => ({
        time,
        temperatureC: slice(payload?.hourly?.temperature_2m || [])[index] ?? null,
        apparentTemperatureC: slice(payload?.hourly?.apparent_temperature || [])[index] ?? null,
        precipitationProbability: slice(payload?.hourly?.precipitation_probability || [])[index] ?? null,
        precipitationMm: slice(payload?.hourly?.precipitation || [])[index] ?? null,
        weatherCode: slice(payload?.hourly?.weather_code || [])[index] ?? null,
        description: weatherDescription(slice(payload?.hourly?.weather_code || [])[index]),
        visibilityM: slice(payload?.hourly?.visibility || [])[index] ?? null,
        windKph: slice(payload?.hourly?.wind_speed_10m || [])[index] ?? null,
        gustKph: slice(payload?.hourly?.wind_gusts_10m || [])[index] ?? null,
        snowDepthM: slice(payload?.hourly?.snow_depth || [])[index] ?? null,
      })),
      next3Days: (payload?.daily?.time || []).map((date: string, index: number) => ({
        date,
        sunrise: payload?.daily?.sunrise?.[index] ?? null,
        sunset: payload?.daily?.sunset?.[index] ?? null,
        uvIndexMax: payload?.daily?.uv_index_max?.[index] ?? null,
        precipitationMm: payload?.daily?.precipitation_sum?.[index] ?? null,
        precipitationProbabilityMax: payload?.daily?.precipitation_probability_max?.[index] ?? null,
        maxTemperatureC: payload?.daily?.temperature_2m_max?.[index] ?? null,
        minTemperatureC: payload?.daily?.temperature_2m_min?.[index] ?? null,
      })),
      units: {
        current: payload?.current_units || {},
        hourly: payload?.hourly_units || {},
        daily: payload?.daily_units || {},
      },
    };
  });
}

export async function readAirQuality({ lat, lng }: Coordinate) {
  return source(
    "open-meteo-air-quality",
    "Air-quality data: Open-Meteo using Copernicus Atmosphere Monitoring Service (CAMS)",
    async () => {
      const url = new URL("https://air-quality-api.open-meteo.com/v1/air-quality");
      url.searchParams.set("latitude", String(lat));
      url.searchParams.set("longitude", String(lng));
      url.searchParams.set("timezone", "auto");
      url.searchParams.set(
        "current",
        ["us_aqi", "european_aqi", "pm10", "pm2_5", "carbon_monoxide", "nitrogen_dioxide", "sulphur_dioxide", "ozone", "uv_index"].join(","),
      );
      url.searchParams.set("hourly", "us_aqi,pm10,pm2_5,ozone,uv_index");
      url.searchParams.set("forecast_hours", "12");
      const payload: any = await readJson(url.toString(), { revalidate: 900 });
      return {
        timezone: payload?.timezone || null,
        current: payload?.current || null,
        next12Hours: (payload?.hourly?.time || []).map((time: string, index: number) => ({
          time,
          usAqi: payload?.hourly?.us_aqi?.[index] ?? null,
          pm10: payload?.hourly?.pm10?.[index] ?? null,
          pm2_5: payload?.hourly?.pm2_5?.[index] ?? null,
          ozone: payload?.hourly?.ozone?.[index] ?? null,
          uvIndex: payload?.hourly?.uv_index?.[index] ?? null,
        })),
        units: { current: payload?.current_units || {}, hourly: payload?.hourly_units || {} },
      };
    },
  );
}

export async function readNws({ lat, lng }: Coordinate) {
  return source("nws", "U.S. National Weather Service", async () => {
    const pointUrl = `https://api.weather.gov/points/${round(lat, 4)},${round(lng, 4)}`;
    const point: any = await readJson(pointUrl, {
      revalidate: 21600,
      headers: { "User-Agent": UA },
    });
    const props = point?.properties || {};
    const [alerts, forecast, hourly] = await Promise.all([
      readJson<any>(`https://api.weather.gov/alerts/active?point=${round(lat, 4)},${round(lng, 4)}`, { revalidate: 60 }).catch(() => null),
      props.forecast ? readJson<any>(props.forecast, { revalidate: 300 }).catch(() => null) : Promise.resolve(null),
      props.forecastHourly ? readJson<any>(props.forecastHourly, { revalidate: 300 }).catch(() => null) : Promise.resolve(null),
    ]);
    return {
      office: props?.cwa || null,
      radarStation: props?.radarStation || null,
      forecastZone: props?.forecastZone || null,
      countyZone: props?.county || null,
      fireWeatherZone: props?.fireWeatherZone || null,
      alerts: (alerts?.features || []).slice(0, 20).map((feature: any) => ({
        id: feature?.id || null,
        event: feature?.properties?.event || null,
        headline: feature?.properties?.headline || null,
        severity: feature?.properties?.severity || null,
        certainty: feature?.properties?.certainty || null,
        urgency: feature?.properties?.urgency || null,
        onset: feature?.properties?.onset || null,
        expires: feature?.properties?.expires || null,
        areaDesc: feature?.properties?.areaDesc || null,
        instruction: feature?.properties?.instruction || null,
      })),
      forecastPeriods: (forecast?.properties?.periods || []).slice(0, 8).map((period: any) => ({
        name: period?.name || null,
        startTime: period?.startTime || null,
        endTime: period?.endTime || null,
        temperature: period?.temperature ?? null,
        temperatureUnit: period?.temperatureUnit || null,
        precipitationProbability: period?.probabilityOfPrecipitation?.value ?? null,
        windSpeed: period?.windSpeed || null,
        windDirection: period?.windDirection || null,
        shortForecast: period?.shortForecast || null,
        detailedForecast: period?.detailedForecast || null,
      })),
      hourlyPeriods: (hourly?.properties?.periods || []).slice(0, 12).map((period: any) => ({
        startTime: period?.startTime || null,
        temperature: period?.temperature ?? null,
        temperatureUnit: period?.temperatureUnit || null,
        precipitationProbability: period?.probabilityOfPrecipitation?.value ?? null,
        relativeHumidity: period?.relativeHumidity?.value ?? null,
        windSpeed: period?.windSpeed || null,
        windDirection: period?.windDirection || null,
        shortForecast: period?.shortForecast || null,
      })),
    };
  });
}

export async function readEarthquakes({ lat, lng }: Coordinate) {
  return source("usgs-earthquakes", "U.S. Geological Survey Earthquake Hazards Program", async () => {
    const start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const url = new URL("https://earthquake.usgs.gov/fdsnws/event/1/query");
    url.searchParams.set("format", "geojson");
    url.searchParams.set("latitude", String(lat));
    url.searchParams.set("longitude", String(lng));
    url.searchParams.set("maxradiuskm", "500");
    url.searchParams.set("starttime", start);
    url.searchParams.set("orderby", "time");
    url.searchParams.set("limit", "50");
    const payload: any = await readJson(url.toString(), { revalidate: 300 });
    return (payload?.features || []).map((feature: any) => {
      const coordinates = feature?.geometry?.coordinates || [];
      return {
        id: feature?.id || null,
        magnitude: feature?.properties?.mag ?? null,
        place: feature?.properties?.place || null,
        time: feature?.properties?.time ? new Date(feature.properties.time).toISOString() : null,
        updated: feature?.properties?.updated ? new Date(feature.properties.updated).toISOString() : null,
        url: feature?.properties?.url || null,
        tsunami: feature?.properties?.tsunami ?? null,
        feltReports: feature?.properties?.felt ?? null,
        coordinates: { lat: coordinates?.[1] ?? null, lng: coordinates?.[0] ?? null, depthKm: coordinates?.[2] ?? null },
        distanceKm:
          Number.isFinite(coordinates?.[0]) && Number.isFinite(coordinates?.[1])
            ? Math.round(haversineKm({ lat, lng }, { lat: coordinates[1], lng: coordinates[0] }))
            : null,
      };
    });
  });
}

function eventPoint(event: any): Coordinate | null {
  const geometries = Array.isArray(event?.geometry) ? event.geometry : [];
  for (let index = geometries.length - 1; index >= 0; index -= 1) {
    const geometry = geometries[index];
    const coordinates = geometry?.coordinates;
    if (Array.isArray(coordinates) && coordinates.length >= 2 && Number.isFinite(coordinates[0]) && Number.isFinite(coordinates[1])) {
      return { lng: coordinates[0], lat: coordinates[1] };
    }
  }
  return null;
}

export async function readNaturalEvents({ lat, lng }: Coordinate) {
  return source("nasa-eonet", "NASA Earth Observatory Natural Event Tracker (EONET)", async () => {
    const latDelta = 3;
    const lngDelta = Math.min(8, 3 / Math.max(0.25, Math.cos((lat * Math.PI) / 180)));
    const minLng = clamp(lng - lngDelta, -180, 180);
    const maxLng = clamp(lng + lngDelta, -180, 180);
    const minLat = clamp(lat - latDelta, -90, 90);
    const maxLat = clamp(lat + latDelta, -90, 90);
    const url = new URL("https://eonet.gsfc.nasa.gov/api/v3/events");
    url.searchParams.set("status", "open");
    url.searchParams.set("days", "30");
    url.searchParams.set("limit", "50");
    url.searchParams.set("bbox", `${minLng},${maxLat},${maxLng},${minLat}`);
    const payload: any = await readJson(url.toString(), { revalidate: 900 });
    return (payload?.events || [])
      .map((event: any) => {
        const point = eventPoint(event);
        return {
          id: event?.id || null,
          title: event?.title || null,
          description: event?.description || null,
          closed: event?.closed || null,
          categories: (event?.categories || []).map((category: any) => category?.title || category?.id).filter(Boolean),
          coordinates: point,
          distanceKm: point ? Math.round(haversineKm({ lat, lng }, point)) : null,
          sourceUrls: (event?.sources || []).map((item: any) => item?.url).filter(Boolean).slice(0, 5),
        };
      })
      .sort((a: any, b: any) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
  });
}

export async function readWaterGauges({ lat, lng }: Coordinate) {
  return source("noaa-nwps", "NOAA National Water Prediction Service", async () => {
    const deltaLat = 0.65;
    const deltaLng = Math.min(2, 0.65 / Math.max(0.25, Math.cos((lat * Math.PI) / 180)));
    const url = new URL("https://api.water.noaa.gov/nwps/v1/gauges");
    url.searchParams.set("bbox.xmin", String(clamp(lng - deltaLng, -180, 180)));
    url.searchParams.set("bbox.ymin", String(clamp(lat - deltaLat, -90, 90)));
    url.searchParams.set("bbox.xmax", String(clamp(lng + deltaLng, -180, 180)));
    url.searchParams.set("bbox.ymax", String(clamp(lat + deltaLat, -90, 90)));
    url.searchParams.set("srid", "EPSG_4326");
    const payload: any = await readJson(url.toString(), { revalidate: 300 });
    const rawGauges: any[] = payload?.gauges || payload?.data || payload || [];
    const gauges = Array.isArray(rawGauges) ? rawGauges : [];
    return gauges
      .map((gauge: any) => {
        const gaugeLat = Number(gauge?.latitude ?? gauge?.lat ?? gauge?.geometry?.coordinates?.[1]);
        const gaugeLng = Number(gauge?.longitude ?? gauge?.lon ?? gauge?.lng ?? gauge?.geometry?.coordinates?.[0]);
        const identifier = gauge?.identifier || gauge?.lid || gauge?.id || null;
        return {
          identifier,
          name: gauge?.name || gauge?.locationName || gauge?.description || null,
          state: gauge?.state?.abbreviation || gauge?.state || null,
          statusObserved: gauge?.status?.observed || gauge?.statusObserved || null,
          statusForecast: gauge?.status?.forecast || gauge?.statusForecast || null,
          floodCategory: gauge?.flood?.category || gauge?.floodCategory || null,
          coordinates: Number.isFinite(gaugeLat) && Number.isFinite(gaugeLng) ? { lat: gaugeLat, lng: gaugeLng } : null,
          distanceKm:
            Number.isFinite(gaugeLat) && Number.isFinite(gaugeLng)
              ? Math.round(haversineKm({ lat, lng }, { lat: gaugeLat, lng: gaugeLng }))
              : null,
          pageUrl: identifier ? `https://water.noaa.gov/gauges/${String(identifier).toLowerCase()}` : null,
          apiUrl: identifier ? `https://api.water.noaa.gov/nwps/v1/gauges/${String(identifier).toLowerCase()}` : null,
        };
      })
      .sort((a: any, b: any) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity))
      .slice(0, 12);
  });
}

export async function readLocationIntelligence(coordinate: Coordinate) {
  const [weather, airQuality, nws, earthquakes, naturalEvents, water] = await Promise.all([
    readGlobalWeather(coordinate),
    readAirQuality(coordinate),
    readNws(coordinate),
    readEarthquakes(coordinate),
    readNaturalEvents(coordinate),
    readWaterGauges(coordinate),
  ]);

  const sources = [weather, airQuality, nws, earthquakes, naturalEvents, water].map((entry) => ({
    provider: entry.provider,
    attribution: entry.attribution,
    available: entry.available,
    checkedAt: entry.checkedAt,
    error: entry.available ? undefined : entry.error,
  }));

  return {
    checkedAt: new Date().toISOString(),
    identity: {
      coordinate,
      timezone: weather.data?.timezone || airQuality.data?.timezone || null,
      elevationM: weather.data?.elevationM ?? null,
    },
    now: {
      weather: weather.data?.current || null,
      airQuality: airQuality.data?.current || null,
    },
    conditions: {
      next12Hours: weather.data?.next12Hours || [],
      next3Days: weather.data?.next3Days || [],
      airQualityNext12Hours: airQuality.data?.next12Hours || [],
    },
    hazards: {
      alerts: nws.data?.alerts || [],
      earthquakes: earthquakes.data || [],
      naturalEvents: naturalEvents.data || [],
    },
    water: {
      nearbyGauges: water.data || [],
    },
    official: {
      nws: nws.data || null,
    },
    sources,
  };
}
