export type RapidApiAirbnbConfig = {
  apiKey: string;
  host: string;
  baseUrl: string;
  revalidateSeconds: number;
};

function read(name: string): string {
  return String(process.env[name] || "").trim();
}

function readNumber(name: string, fallback: number): number {
  const raw = Number(process.env[name]);
  return Number.isFinite(raw) && raw > 0 ? Math.round(raw) : fallback;
}

export function getRapidApiAirbnbConfig(): RapidApiAirbnbConfig {
  const host = read("RAPIDAPI_AIRBNB_HOST") || "airbnb-api5.p.rapidapi.com";
  const baseUrl = read("RAPIDAPI_AIRBNB_BASE_URL") || `https://${host}`;
  return {
    apiKey: read("RAPIDAPI_KEY"),
    host,
    baseUrl,
    revalidateSeconds: readNumber("RAPIDAPI_AIRBNB_REVALIDATE_SECONDS", 60 * 60 * 6),
  };
}

export function hasRapidApiAirbnbConfig(): boolean {
  return Boolean(getRapidApiAirbnbConfig().apiKey);
}
