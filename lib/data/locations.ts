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

const LOC_PATH = path.join(process.cwd(), "data/nodes/locations.jsonl");

export function getAllCities(): CityNode[] {
  const raw = fs.readFileSync(LOC_PATH, "utf8").trim();
  if (!raw) return [];
  return raw.split("\n").map((l) => JSON.parse(l));
}

export function getCityBySlug(slug: string): CityNode | null {
  const cities = getAllCities();
  return cities.find((c) => c.slug === slug) ?? null;
}
