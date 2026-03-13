import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, "data");
const ACTION_DIR = path.join(DATA_DIR, "action");
const OUT_PATH = path.join(ACTION_DIR, "viator.products.cache.json");
const TOURS_PATH = path.join(DATA_DIR, "tours.json");
const VEGAS_TOURS_PATH = path.join(DATA_DIR, "vegas.tours.json");

function slugify(input) {
  return String(input || "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function loadJson(filePath, fallback = []) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function asArray(raw) {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object") {
    if (Array.isArray(raw.tours)) return raw.tours;
    if (Array.isArray(raw.items)) return raw.items;
  }
  return [];
}

function nodeKey(tour) {
  return slugify(
    tour?.dcc?.node ||
      tour?.dcc?.hub ||
      tour?.dcc?.destinationSlug ||
      tour?.dcc?.citySlug ||
      tour?.citySlug ||
      tour?.destinationSlug ||
      tour?.destination ||
      tour?.city
  );
}

const tours = asArray(loadJson(TOURS_PATH, []));
const vegasTours = asArray(loadJson(VEGAS_TOURS_PATH, []));
const merged = [...tours, ...vegasTours];
const places = {};
const now = new Date().toISOString();

for (const tour of merged) {
  const key = nodeKey(tour);
  if (!key) continue;
  if (!places[key]) {
    places[key] = {
      place_slug: key,
      last_updated: now,
      products: [],
    };
  }
  places[key].products.push(tour);
}

fs.mkdirSync(ACTION_DIR, { recursive: true });
fs.writeFileSync(
  OUT_PATH,
  JSON.stringify(
    {
      generated_at: now,
      source: "local_catalog",
      places,
    },
    null,
    2
  ) + "\n"
);

console.log(`Built Viator cache: ${OUT_PATH}`);
console.log(`Places: ${Object.keys(places).length}`);
