type CoastalMachineItem = {
  id: string;
  title: string;
  description?: string | null;
  kind: "water";
  provider: string;
  updatedAt?: string | null;
  severity?: string | null;
};

type CoastalMachineFeed = {
  available: boolean;
  configured: boolean;
  provider: string;
  kind: "water";
  mode: "public-feed";
  items: CoastalMachineItem[];
  error?: string;
};

const NOAA_STATIONS: Record<string, { id: string; name: string }> = {
  boston: { id: "8443970", name: "Boston" },
  honolulu: { id: "1612340", name: "Honolulu" },
  juneau: { id: "9452210", name: "Juneau" },
  "los-angeles": { id: "9410660", name: "Los Angeles" },
  "new-orleans": { id: "8761927", name: "New Canal Station" },
  "new-york-city": { id: "8518750", name: "The Battery" },
  "san-diego": { id: "9410170", name: "San Diego" },
  "san-francisco": { id: "9414290", name: "San Francisco" },
  seattle: { id: "9447130", name: "Seattle" },
};

async function fetchJson(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);
  try {
    const response = await fetch(url, {
      cache: "no-store",
      signal: controller.signal,
      headers: {
        "User-Agent": "DestinationCommandCenter/1.0 (https://destinationcommandcenter.com)",
        Accept: "application/json",
      },
    });
    if (!response.ok) throw new Error(`${response.status} ${url}`);
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

export async function readNoaaWaterLevel(citySlug: string): Promise<CoastalMachineFeed | null> {
  const station = NOAA_STATIONS[citySlug];
  if (!station) return null;

  try {
    const url = new URL("https://api.tidesandcurrents.noaa.gov/api/prod/datagetter");
    url.searchParams.set("date", "today");
    url.searchParams.set("station", station.id);
    url.searchParams.set("product", "water_level");
    url.searchParams.set("datum", "MLLW");
    url.searchParams.set("time_zone", "gmt");
    url.searchParams.set("units", "english");
    url.searchParams.set("application", "DestinationCommandCenter");
    url.searchParams.set("format", "json");

    const data = await fetchJson(url.toString());
    const rows = Array.isArray(data?.data) ? data.data : [];
    const latest = rows.length ? rows[rows.length - 1] : null;
    const value = latest?.v != null ? Number(latest.v) : null;

    return {
      available: true,
      configured: true,
      provider: "NOAA CO-OPS",
      kind: "water",
      mode: "public-feed",
      items: latest
        ? [
            {
              id: `noaa-water-${station.id}-${latest.t || "latest"}`,
              title: `${station.name} water level${Number.isFinite(value) ? ` • ${value.toFixed(2)} ft` : ""}`,
              description: `NOAA station ${station.id} • relative to MLLW`,
              kind: "water",
              provider: "NOAA CO-OPS",
              severity: null,
              updatedAt: latest.t ? `${String(latest.t).replace(" ", "T")}:00Z` : null,
            },
          ]
        : [],
    };
  } catch (error) {
    return {
      available: false,
      configured: true,
      provider: "NOAA CO-OPS",
      kind: "water",
      mode: "public-feed",
      items: [],
      error: error instanceof Error ? error.message : "feed error",
    };
  }
}
