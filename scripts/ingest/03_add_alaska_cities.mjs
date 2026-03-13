import fs from "fs";
import path from "path";
import slugify from "slugify";

const ROOT = process.cwd();
const US_DUMP = path.join(ROOT, "data", "sources", "geonames", "US.txt");
const OUT = path.join(ROOT, "data", "nodes", "locations.jsonl");

if (!fs.existsSync(US_DUMP)) {
  console.error("Missing:", US_DUMP);
  console.error("Download GeoNames US.zip first.");
  process.exit(1);
}
if (!fs.existsSync(OUT)) {
  console.error("Missing:", OUT);
  process.exit(1);
}

function safeSlug(s) {
  return slugify(String(s || ""), { lower: true, strict: true, trim: true });
}
function makeId(name, st, country = "US") {
  return `loc_${safeSlug(name)}_${safeSlug(st)}_${safeSlug(country)}`;
}

function parseRow(line) {
  const c = line.split("\t");
  return {
    geonameid: Number(c[0]),
    name: c[1],
    asciiname: c[2],
    lat: Number(c[4]),
    lon: Number(c[5]),
    fclass: c[6],
    country: c[8],
    admin1: c[10],
    population: Number(c[14] || 0),
    elevation: c[15] ? Number(c[15]) : null,
    timezone: c[17] || null,
  };
}

const target = [
  "Juneau, AK",
  "Ketchikan, AK",
  "Skagway, AK",
  "Sitka, AK",
  "Anchorage, AK",
  "Fairbanks, AK",
].map(s => s.trim());

const existingLines = fs.readFileSync(OUT, "utf8").trim().split("\n").filter(Boolean);
const existing = existingLines.map((l) => JSON.parse(l));
const bySlug = new Set(existing.map((n) => n.slug));
const byId = new Set(existing.map((n) => n.id));

const rows = fs.readFileSync(US_DUMP, "utf8").split("\n").filter(Boolean).map(parseRow)
  .filter(r => r.country === "US" && r.fclass === "P" && r.admin1 === "AK");

function findCity(cityName) {
  const want = cityName.toLowerCase();
  // choose best match by population
  const matches = rows.filter(r => (r.asciiname || r.name).toLowerCase() === want);
  if (!matches.length) return null;
  matches.sort((a,b)=> (b.population||0)-(a.population||0));
  return matches[0];
}

const now = new Date().toISOString();
let added = 0;
const missing = [];

for (const line of target) {
  const m = line.match(/^(.+?),\s*([A-Z]{2})$/);
  if (!m) continue;
  const city = m[1].trim();
  const st = m[2].trim();

  const r = findCity(city);
  if (!r) {
    missing.push(line);
    continue;
  }

  const slug = `${safeSlug(r.asciiname || r.name)}-${st.toLowerCase()}`;
  const id = makeId(r.asciiname || r.name, st, "US");

  if (bySlug.has(slug) || byId.has(id)) continue;

  existing.push({
    id,
    type: "dcc_city",
    slug,
    name: r.asciiname || r.name,
    admin: { country: "US", region_code: st },
    geo: { lat: r.lat, lon: r.lon, elevation_m: r.elevation },
    tz: r.timezone,
    metrics: { population: r.population || null, population_year: null },
    about: { known_for: [], history_md: "", cuisine: [] },
    arrival: { fly: [], train: [], drive: [], cruise: [] },
    travel: { hotels: [], tours: [], things_to_do: [] },
    weather: { climate_summary: "", forecast_provider: "open-meteo", updated_at: null },
    source_refs: { geonames_id: r.geonameid, seed: "alaska_seed_v1" },
    updated_at: now,
  });

  bySlug.add(slug);
  byId.add(id);
  added++;
}

fs.writeFileSync(OUT, existing.map(x => JSON.stringify(x)).join("\n") + "\n", "utf8");

console.log("Alaska add complete.");
console.log("Added:", added);
console.log("Total nodes now:", existing.length);
console.log("Missing:", missing.length);
if (missing.length) missing.forEach(x => console.log(" -", x));
