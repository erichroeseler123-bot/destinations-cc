import fs from "fs";
import path from "path";
import slugify from "slugify";

const ROOT = process.cwd();
const US_DUMP = path.join(ROOT, "data", "sources", "geonames", "US.txt");
const ADMIN1 = path.join(ROOT, "data", "sources", "geonames", "admin1CodesASCII.txt");
const SEED = path.join(ROOT, "data", "sources", "us_tourist_150.txt");
const OUT = path.join(ROOT, "data", "nodes", "locations.jsonl");

function must(p) {
  if (!fs.existsSync(p)) {
    console.error("Missing:", p);
    process.exit(1);
  }
}
must(US_DUMP); must(ADMIN1); must(SEED); must(OUT);

function safeSlug(s) {
  return slugify(String(s || ""), { lower: true, strict: true, trim: true });
}
function makeId(name, state, country = "US") {
  return `loc_${safeSlug(name)}_${safeSlug(state)}_${safeSlug(country)}`;
}

// Parse US GeoNames rows
function parseRow(line) {
  const c = line.split("\t");
  return {
    geonameid: Number(c[0]),
    name: c[1],
    asciiname: c[2],
    lat: Number(c[4]),
    lon: Number(c[5]),
    fclass: c[6],
    fcode: c[7],
    country: c[8],
    admin1: c[10],
    population: Number(c[14] || 0),
    elevation: c[15] ? Number(c[15]) : null,
    timezone: c[17] || null,
  };
}

const usRows = fs.readFileSync(US_DUMP, "utf8").split("\n").filter(Boolean).map(parseRow)
  .filter(r => r.country === "US" && r.fclass === "P"); // populated places only

// Build lookup: "city|ST" -> best (highest population)
const idx = new Map();
for (const r of usRows) {
  const st = (r.admin1 || "").trim().toUpperCase();
  const key = `${(r.asciiname || r.name).toLowerCase()}|${st}`;
  const prev = idx.get(key);
  if (!prev || (r.population || 0) > (prev.population || 0)) idx.set(key, r);
}

// Load seed lines "City, ST"
const seedLines = fs.readFileSync(SEED, "utf8").split("\n").map(s => s.trim()).filter(Boolean);

// Load existing nodes
const existingLines = fs.readFileSync(OUT, "utf8").split("\n").filter(Boolean);
const existing = existingLines.map(l => JSON.parse(l));

const byId = new Map(existing.map(n => [n.id, n]));
const bySlug = new Set(existing.map(n => n.slug));

const now = new Date().toISOString();

let added = 0, already = 0;
const missing = [];

for (const line of seedLines) {
  const m = line.match(/^(.+?),\s*([A-Z]{2})$/);
  if (!m) continue;
  const city = m[1].trim();
  const st = m[2].trim().toUpperCase();

  const key = `${city.toLowerCase()}|${st}`;
  let r = idx.get(key);

  if (!r) {
    // fallback: sometimes ascii differs (e.g. St. Louis vs Saint Louis)
    const city2 = city.replace(/^St\.\s+/i, "Saint ").toLowerCase();
    r = idx.get(`${city2}|${st}`) || null;
  }

  if (!r) {
    missing.push(line);
    continue;
  }

  // state-suffixed slug to avoid global collisions
  const slug = `${safeSlug(r.asciiname || r.name)}-${st.toLowerCase()}`;
  const id = makeId(r.asciiname || r.name, st, "US");

  if (byId.has(id) || bySlug.has(slug)) {
    already++;
    continue;
  }

  const node = {
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
    source_refs: { geonames_id: r.geonameid, seed: "us_tourist_150.txt" },
    updated_at: now
  };

  existing.push(node);
  byId.set(id, node);
  bySlug.add(slug);
  added++;
}

fs.writeFileSync(OUT, existing.map(x => JSON.stringify(x)).join("\n") + "\n", "utf8");

console.log(`Force-include complete.`);
console.log(`Seed lines: ${seedLines.length}`);
console.log(`Added: ${added}`);
console.log(`Already present (id/slug existed): ${already}`);
console.log(`Total nodes now: ${existing.length}`);
console.log(`Missing from US dump: ${missing.length}`);
if (missing.length) {
  console.log("First missing (up to 30):");
  missing.slice(0, 30).forEach(x => console.log(" -", x));
}
