export type Coordinate = { lat: number; lng: number };

type SourceState<T> = {
  provider: string;
  attribution: string;
  available: boolean;
  checkedAt: string;
  data: T | null;
  error?: string;
};

const UA = "DestinationCommandCenter/2.0 (+https://destinationcommandcenter.com/developers)";

function haversineKm(a: Coordinate, b: Coordinate) {
  const r = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * r * Math.asin(Math.sqrt(h));
}

async function readJson(url: string, revalidate: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7500);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json", "User-Agent": UA },
      next: { revalidate },
    });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function source<T>(provider: string, attribution: string, reader: () => Promise<T>): Promise<SourceState<T>> {
  const checkedAt = new Date().toISOString();
  try {
    return { provider, attribution, available: true, checkedAt, data: await reader() };
  } catch (error) {
    return {
      provider,
      attribution,
      available: false,
      checkedAt,
      data: null,
      error: error instanceof Error ? error.message : "unavailable",
    };
  }
}

export function formatGaugeStatus(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === "string") return value;
  if (typeof value !== "object") return String(value);

  const status = value as Record<string, unknown>;
  const primary = typeof status.primary === "number" && status.primary > -900
    ? `${status.primary} ${typeof status.primaryUnit === "string" ? status.primaryUnit : ""}`.trim()
    : null;
  const categoryRaw = typeof status.floodCategory === "string" ? status.floodCategory : null;
  const ignored = new Set(["not_defined", "fcst_not_current", "obs_not_current", "out_of_service"]);
  const category = categoryRaw && !ignored.has(categoryRaw) ? categoryRaw.replaceAll("_", " ") : null;
  return [primary, category].filter(Boolean).join(" · ") || null;
}

export function normalizeGaugeStatuses<T extends { statusObserved?: unknown; statusForecast?: unknown }>(gauge: T) {
  return {
    ...gauge,
    statusObserved: formatGaugeStatus(gauge.statusObserved),
    statusForecast: formatGaugeStatus(gauge.statusForecast),
  };
}

export async function readGlobalRiverDischarge({ lat, lng }: Coordinate) {
  return source("open-meteo-flood", "Global river discharge: Open-Meteo / GloFAS", async () => {
    const url = new URL("https://flood-api.open-meteo.com/v1/flood");
    url.searchParams.set("latitude", String(lat));
    url.searchParams.set("longitude", String(lng));
    url.searchParams.set("daily", "river_discharge,river_discharge_mean,river_discharge_max,river_discharge_min");
    url.searchParams.set("forecast_days", "7");
    const payload: any = await readJson(url.toString(), 3600);
    return {
      grid: { lat: payload?.latitude ?? null, lng: payload?.longitude ?? null },
      daily: (payload?.daily?.time || []).map((date: string, index: number) => ({
        date,
        riverDischarge: payload?.daily?.river_discharge?.[index] ?? null,
        mean: payload?.daily?.river_discharge_mean?.[index] ?? null,
        max: payload?.daily?.river_discharge_max?.[index] ?? null,
        min: payload?.daily?.river_discharge_min?.[index] ?? null,
      })),
      units: payload?.daily_units || {},
    };
  });
}

export async function readMarine({ lat, lng }: Coordinate) {
  return source("open-meteo-marine", "Marine conditions: Open-Meteo ocean/wave models", async () => {
    const url = new URL("https://marine-api.open-meteo.com/v1/marine");
    url.searchParams.set("latitude", String(lat));
    url.searchParams.set("longitude", String(lng));
    url.searchParams.set("timezone", "auto");
    url.searchParams.set(
      "current",
      "wave_height,wave_direction,wave_period,sea_surface_temperature,ocean_current_velocity,ocean_current_direction,sea_level_height_msl",
    );
    url.searchParams.set(
      "hourly",
      "wave_height,wave_direction,wave_period,sea_surface_temperature,ocean_current_velocity,ocean_current_direction,sea_level_height_msl",
    );
    url.searchParams.set("forecast_hours", "12");
    const payload: any = await readJson(url.toString(), 900);
    const grid = { lat: Number(payload?.latitude), lng: Number(payload?.longitude) };
    const distanceToGridKm = haversineKm({ lat, lng }, grid);
    const current = payload?.current || {};
    const hasActualMarineValue = [
      current?.wave_height,
      current?.sea_surface_temperature,
      current?.ocean_current_velocity,
      current?.sea_level_height_msl,
    ].some((value) => value !== null && value !== undefined);

    if (!Number.isFinite(distanceToGridKm) || distanceToGridKm > 75 || !hasActualMarineValue) {
      throw new Error("no local marine model values for this coordinate");
    }

    return {
      grid,
      distanceToGridKm: Math.round(distanceToGridKm),
      current,
      next12Hours: (payload?.hourly?.time || []).map((time: string, index: number) => ({
        time,
        waveHeightM: payload?.hourly?.wave_height?.[index] ?? null,
        waveDirection: payload?.hourly?.wave_direction?.[index] ?? null,
        wavePeriodS: payload?.hourly?.wave_period?.[index] ?? null,
        seaSurfaceTemperatureC: payload?.hourly?.sea_surface_temperature?.[index] ?? null,
        currentVelocityKph: payload?.hourly?.ocean_current_velocity?.[index] ?? null,
        currentDirection: payload?.hourly?.ocean_current_direction?.[index] ?? null,
        seaLevelHeightMslM: payload?.hourly?.sea_level_height_msl?.[index] ?? null,
      })),
    };
  });
}

export async function readHydroMarine(coordinate: Coordinate) {
  const [river, marine] = await Promise.all([
    readGlobalRiverDischarge(coordinate),
    readMarine(coordinate),
  ]);

  return {
    river: river.data,
    marine: marine.data,
    sources: [river, marine].map((entry) => ({
      provider: entry.provider,
      attribution: entry.attribution,
      available: entry.available,
      checkedAt: entry.checkedAt,
      error: entry.available ? undefined : entry.error,
    })),
  };
}
