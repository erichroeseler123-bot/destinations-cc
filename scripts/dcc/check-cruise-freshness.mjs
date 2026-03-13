import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const CACHE_PATH = path.join(ROOT, "data", "action", "cruise.sailings.cache.json");
const MAX_AGE_HOURS = Number(process.env.CRUISE_CACHE_MAX_AGE_HOURS || 72);

function fail(message) {
  console.error(`CRUISE_FRESHNESS_FAIL: ${message}`);
  process.exit(1);
}

if (!fs.existsSync(CACHE_PATH)) {
  fail(`cache file missing at ${CACHE_PATH}`);
}

let raw;
try {
  raw = JSON.parse(fs.readFileSync(CACHE_PATH, "utf8"));
} catch (error) {
  fail(`cannot parse cache json: ${error instanceof Error ? error.message : String(error)}`);
}

const generatedAt = raw?.generated_at;
const sailingsCount = Array.isArray(raw?.sailings) ? raw.sailings.length : 0;
const ts = Date.parse(generatedAt || "");
if (Number.isNaN(ts)) {
  fail("generated_at is missing or invalid");
}

const ageHours = (Date.now() - ts) / (1000 * 60 * 60);
if (ageHours > MAX_AGE_HOURS) {
  fail(
    `stale cache age=${ageHours.toFixed(2)}h exceeds max=${MAX_AGE_HOURS}h (generated_at=${generatedAt})`
  );
}

console.log(
  `CRUISE_FRESHNESS_OK age=${ageHours.toFixed(2)}h max=${MAX_AGE_HOURS}h sailings=${sailingsCount} generated_at=${generatedAt}`
);
