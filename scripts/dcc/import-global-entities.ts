import fs from "node:fs";
import path from "node:path";
import slugify from "slugify";
import { DccEntityRegistrySchema, type DccEntity } from "@/lib/dcc/entities/types";

const ROOT = process.cwd();
const GEONAMES_US_PATH = path.join(ROOT, "data", "sources", "geonames", "US.txt");
const OUT_PATH = path.join(ROOT, "data", "entities", "entities.v1.json");

const POPULATION_MIN = Number(process.env.DCC_ENTITY_IMPORT_POP_MIN || 5000);
const LIMIT = Number(process.env.DCC_ENTITY_IMPORT_LIMIT || 1000);

const ADMIN_SEAT_CODES = new Set(["PPLA", "PPLA2", "PPLA3", "PPLA4", "PPLC"]);
const CITY_CODES = new Set(["PPLA", "PPLA2", "PPLA3", "PPLA4", "PPLC", "PPL"]);

const PRIORITY_HUBS: DccEntity[] = [
  {
    entityKey: "port:barcelona",
    type: "port",
    slug: "barcelona",
    name: "Port of Barcelona",
    aliases: ["Barcelona Cruise Port"],
    lat: 41.3548,
    lng: 2.15899,
    countryCode: "ES",
    regionCode: "CT",
    tier: 2,
    status: "active",
  },
  {
    entityKey: "port:southampton",
    type: "port",
    slug: "southampton",
    name: "Port of Southampton",
    aliases: ["Southampton Cruise Port"],
    lat: 50.8998,
    lng: -1.4044,
    countryCode: "GB",
    regionCode: "ENG",
    tier: 2,
    status: "active",
  },
  {
    entityKey: "city:singapore",
    type: "city",
    slug: "singapore",
    name: "Singapore",
    aliases: ["Singapore City"],
    lat: 1.3521,
    lng: 103.8198,
    countryCode: "SG",
    population: 5638700,
    tier: 1,
    status: "indexed",
  },
  {
    entityKey: "city:dubai",
    type: "city",
    slug: "dubai",
    name: "Dubai",
    aliases: ["Dubai, AE"],
    lat: 25.2048,
    lng: 55.2708,
    countryCode: "AE",
    population: 3565000,
    tier: 1,
    status: "indexed",
  },
];

function cityCanonicalPath(slug: string): string {
  return `/cities/${slug}`;
}

function parseUSGeonames(): DccEntity[] {
  if (!fs.existsSync(GEONAMES_US_PATH)) {
    throw new Error(`GeoNames US dataset not found at ${GEONAMES_US_PATH}`);
  }

  const lines = fs.readFileSync(GEONAMES_US_PATH, "utf8").split(/\r?\n/);
  const rows: DccEntity[] = [];

  for (const line of lines) {
    if (!line.trim()) continue;
    const cols = line.split("\t");
    if (cols.length < 15) continue;

    const name = cols[1]?.trim();
    const aliases = cols[3]?.trim();
    const lat = Number(cols[4]);
    const lng = Number(cols[5]);
    const featureClass = cols[6]?.trim();
    const featureCode = cols[7]?.trim();
    const countryCode = cols[8]?.trim();
    const admin1Code = cols[10]?.trim();
    const population = Number(cols[14] || 0);

    if (!name || Number.isNaN(lat) || Number.isNaN(lng)) continue;
    if (countryCode !== "US") continue;
    if (featureClass !== "P" || !CITY_CODES.has(featureCode)) continue;

    const isAdminSeat = ADMIN_SEAT_CODES.has(featureCode);
    if (!isAdminSeat && population < POPULATION_MIN) continue;

    const slug = slugify(name, { lower: true, strict: true }) || "unknown-city";
    const entityKey = `city:${slug}`;

    rows.push({
      entityKey,
      type: "city",
      slug,
      name,
      aliases: aliases ? aliases.split(",").map((item) => item.trim()).filter(Boolean).slice(0, 6) : [],
      lat,
      lng,
      countryCode: "US",
      regionCode: admin1Code || undefined,
      population: Number.isFinite(population) && population > 0 ? population : undefined,
      tier: 1,
      status: "indexed",
      canonicalPath: cityCanonicalPath(slug),
    });

    if (rows.length >= LIMIT) break;
  }

  return rows;
}

function dedupe(entities: DccEntity[]): DccEntity[] {
  const byKey = new Map<string, DccEntity>();
  for (const entity of entities) {
    byKey.set(entity.entityKey, entity);
  }
  return Array.from(byKey.values());
}

function main() {
  const usCities = parseUSGeonames();
  const combined = dedupe([...usCities, ...PRIORITY_HUBS]);

  const output = {
    version: 1,
    updated_at: new Date().toISOString().slice(0, 10),
    entities: combined,
  };

  DccEntityRegistrySchema.parse(output);
  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(output, null, 2));

  console.log(`Imported ${combined.length} entities to ${OUT_PATH}`);
}

main();
