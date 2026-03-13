import fs from "fs";
import path from "path";
import slugify from "slugify";

const ROOT = process.cwd();
const GEONAMES_DIR = path.join(ROOT, "data", "sources", "geonames");
const INPUT = path.join(GEONAMES_DIR, "cities15000.txt");
const OUT = path.join(ROOT, "data", "nodes", "locations.jsonl");

if (!fs.existsSync(INPUT)) {
  console.error("Missing:", INPUT);
  console.error("Run the GeoNames download step first.");
  process.exit(1);
}

function safeSlug(s) {
  return slugify(s, { lower: true, strict: true, trim: true });
}

function makeId(name, admin1, country) {
  return `loc_${safeSlug(name)}_${safeSlug(admin1 || "na")}_${safeSlug(country || "xx")}`;
}

// GeoNames cities15000 columns (tab separated):
// geonameid, name, asciiname, alternatenames, lat, lon, feature class, feature code,
// country code, cc2, admin1, admin2, admin3, admin4, population, elevation, dem,
// timezone, modification date

const lines = fs.readFileSync(INPUT, "utf8").split("\n").filter(Boolean);

// Parse to objects
const rows = lines.map(line => {
  const c = line.split("\t");
  return {
    geonameid: Number(c[0]),
    name: c[1],
    asciiname: c[2],
    lat: Number(c[4]),
    lon: Number(c[5]),
    country: c[8],
    admin1: c[10], // region/state code
    population: Number(c[14] || 0),
    elevation: c[15] ? Number(c[15]) : null,
    timezone: c[17] || null,
    moddate: c[18] || null,
  };
});

// Sort by population descending (gives you globally important cities first)
rows.sort((a, b) => (b.population || 0) - (a.population || 0));

// Take 500
const chosen = rows.slice(0, 500);

// Make unique slugs (collisions happen: e.g., "Springfield")
const slugCounts = new Map();

function uniqueSlug(base) {
  const n = (slugCounts.get(base) || 0) + 1;
  slugCounts.set(base, n);
  return n === 1 ? base : `${base}-${n}`;
}

const now = new Date().toISOString();

const outLines = chosen.map(r => {
  const baseSlug = safeSlug(r.asciiname || r.name);
  const slug = uniqueSlug(baseSlug);

  const node = {
    id: makeId(r.asciiname || r.name, r.admin1, r.country),
    type: "dcc_city",
    slug,
    name: r.asciiname || r.name,
    admin: {
      country: r.country,
      region_code: r.admin1 || null
    },
    geo: {
      lat: r.lat,
      lon: r.lon,
      elevation_m: r.elevation
    },
    tz: r.timezone,
    metrics: {
      population: r.population || null,
      population_year: null
    },
    about: {
      known_for: [],
      history_md: "",
      cuisine: []
    },
    arrival: {
      fly: [],
      train: [],
      drive: [],
      cruise: []
    },
    travel: {
      hotels: [],
      tours: [],
      things_to_do: []
    },
    weather: {
      climate_summary: "",
      forecast_provider: "open-meteo",
      updated_at: null
    },
    source_refs: {
      geonames_id: r.geonameid
    },
    updated_at: now
  };

  return JSON.stringify(node);
});

fs.writeFileSync(OUT, outLines.join("\n") + "\n", "utf8");
console.log(`Wrote ${outLines.length} city nodes -> ${path.relative(ROOT, OUT)}`);
