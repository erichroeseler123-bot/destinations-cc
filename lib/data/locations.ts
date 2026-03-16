import fs from "fs";
import path from "path";

export type CityNode = {
  id: string;
  type: "dcc_city";
  slug: string;
  name: string;
  admin?: { country?: string; region_code?: string };
  geo?: { lat?: number; lon?: number; elevation_m?: number };
  tz?: string;
  metrics?: { population?: number; population_year?: number | null };
  about?: { known_for?: string[]; history_md?: string; cuisine?: string[] };
  arrival?: { fly?: string[]; train?: string[]; drive?: string[]; cruise?: string[] };
  travel?: { hotels?: string[]; tours?: string[]; things_to_do?: string[] };
  weather?: { climate_summary?: string; forecast_provider?: string; updated_at?: string | null };
  source_refs?: Record<string, any>;
  updated_at?: string;
};

export type CityHubNode = {
  id: string;
  slug: string;
  name: string;
  admin?: { country?: string; region_code?: string };
  metrics?: { population?: number; population_year?: number | null };
  modes?: string[];
};

const LOC_PATH = path.join(process.cwd(), "data/nodes/locations.jsonl");
const CITY_ALIASES_PATH = path.join(process.cwd(), "data/city-aliases.json");
const DESTINATIONS_DIR = path.join(process.cwd(), "data/destinations");
const US_TOP_TOURISM_PATH = path.join(process.cwd(), "data/cities/us-top-tourism.json");
const CITY_INDEX_PATH = path.join(process.cwd(), "data/cities/index.json");

function titleCaseSlug(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function readJsonFile<T>(filePath: string): T | null {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

export function getAllCities(): CityNode[] {
  const raw = fs.readFileSync(LOC_PATH, "utf8").trim();
  if (!raw) return [];
  return raw.split("\n").map((l) => JSON.parse(l));
}

export function getAllCityHubs(): CityHubNode[] {
  const aliases = readJsonFile<Record<string, string>>(CITY_ALIASES_PATH) || {};
  const tourismList =
    readJsonFile<Array<{ slug: string; name: string; state?: string; country?: string }>>(US_TOP_TOURISM_PATH) || [];
  const cityIndex =
    readJsonFile<{ cities?: Array<{ slug: string; modes?: string[] }> }>(CITY_INDEX_PATH) || {};
  const locations = getAllCities();

  const locationBySlug = new Map(locations.map((city) => [city.slug, city]));
  const locationByName = new Map(locations.map((city) => [city.name.toLowerCase(), city]));
  const tourismBySlug = new Map(tourismList.map((city) => [city.slug, city]));
  const modesBySlug = new Map((cityIndex.cities || []).map((city) => [city.slug, city.modes || []]));

  return Object.keys(aliases).map((slug) => {
    const destination =
      readJsonFile<{ display_name?: string }>(path.join(DESTINATIONS_DIR, `${slug}.json`)) || {};
    const tourism = tourismBySlug.get(slug);
    const displayName = tourism?.name || destination.display_name || titleCaseSlug(slug);
    const matchedLocation =
      locationBySlug.get(slug) ||
      locationByName.get(displayName.toLowerCase()) ||
      null;

    return {
      id: aliases[slug] || `${slug}-guide`,
      slug,
      name: displayName,
      admin: {
        country: tourism?.country || matchedLocation?.admin?.country,
        region_code: tourism?.state || matchedLocation?.admin?.region_code,
      },
      metrics: matchedLocation?.metrics,
      modes: modesBySlug.get(slug) || [],
    };
  });
}

export function getCityBySlug(slug: string): CityNode | null {
  const cities = getAllCities();
  return cities.find((c) => c.slug === slug) ?? null;
}
