type WaterMachineItem = {
  id: string;
  title: string;
  description?: string | null;
  kind: "water";
  provider: string;
  updatedAt?: string | null;
  severity?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

type WaterMachineFeed = {
  available: boolean;
  configured: boolean;
  provider: string;
  kind: "water";
  mode: "public-feed";
  items: WaterMachineItem[];
  error?: string;
};

const USER_AGENT = "DestinationCommandCenter/1.0 (https://destinationcommandcenter.com)";

async function fetchJson(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);
  try {
    const response = await fetch(url, {
      cache: "no-store",
      signal: controller.signal,
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    });
    if (!response.ok) throw new Error(`${response.status} ${url}`);
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

const IMPORTANT = new Set(["action", "minor", "moderate", "major"]);

function floodCategory(row: any) {
  const observed = String(row?.status?.observed?.floodCategory || "").toLowerCase();
  const forecast = String(row?.status?.forecast?.floodCategory || "").toLowerCase();
  if (IMPORTANT.has(forecast)) return { category: forecast, source: "forecast" };
  if (IMPORTANT.has(observed)) return { category: observed, source: "observed" };
  return null;
}

export async function readNwpsWaterFeed(lat: number, lng: number): Promise<WaterMachineFeed> {
  try {
    const deltaLat = 0.55;
    const deltaLng = 0.7;
    const url = new URL("https://api.water.noaa.gov/nwps/v1/gauges");
    url.searchParams.set("bbox.xmin", String(lng - deltaLng));
    url.searchParams.set("bbox.ymin", String(lat - deltaLat));
    url.searchParams.set("bbox.xmax", String(lng + deltaLng));
    url.searchParams.set("bbox.ymax", String(lat + deltaLat));
    url.searchParams.set("srid", "EPSG_4326");

    const data = await fetchJson(url.toString());
    const gauges = Array.isArray(data?.gauges) ? data.gauges : [];
    const items = gauges
      .map((row: any) => {
        const flood = floodCategory(row);
        if (!flood) return null;
        const status = flood.source === "forecast" ? row?.status?.forecast : row?.status?.observed;
        const primary = typeof status?.primary === "number" ? status.primary : null;
        const unit = status?.primaryUnit || null;
        return {
          id: `nwps-${String(row?.lid || row?.name || "gauge")}-${flood.source}`,
          title: `${row?.name || "Nearby river gauge"} • ${flood.category} flood category`,
          description: [
            `${flood.source === "forecast" ? "Forecast" : "Observed"} river status`,
            primary != null ? `${primary}${unit ? ` ${unit}` : ""}` : null,
          ].filter(Boolean).join(" • "),
          kind: "water" as const,
          provider: "NOAA National Water Prediction Service",
          updatedAt: status?.validTime || null,
          severity: flood.category,
          latitude: typeof row?.latitude === "number" ? row.latitude : null,
          longitude: typeof row?.longitude === "number" ? row.longitude : null,
        };
      })
      .filter((item: WaterMachineItem | null): item is WaterMachineItem => Boolean(item))
      .slice(0, 15);

    return {
      available: true,
      configured: true,
      provider: "NOAA National Water Prediction Service",
      kind: "water",
      mode: "public-feed",
      items,
    };
  } catch (error) {
    return {
      available: false,
      configured: true,
      provider: "NOAA National Water Prediction Service",
      kind: "water",
      mode: "public-feed",
      items: [],
      error: error instanceof Error ? error.message : "feed error",
    };
  }
}
