import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const rolloutName = process.argv[2] || "us-top-tourism";

const COORDINATES = {
  "new-york": { lat: 40.7128, lng: -74.006 },
  "las-vegas": { lat: 36.1147, lng: -115.1728 },
  orlando: { lat: 28.5383, lng: -81.3792 },
  miami: { lat: 25.7617, lng: -80.1918 },
  "los-angeles": { lat: 34.0522, lng: -118.2437 },
  "san-francisco": { lat: 37.7749, lng: -122.4194 },
  "san-diego": { lat: 32.7157, lng: -117.1611 },
  honolulu: { lat: 21.3099, lng: -157.8581 },
  chicago: { lat: 41.8781, lng: -87.6298 },
  "washington-dc": { lat: 38.9072, lng: -77.0369 },
  boston: { lat: 42.3601, lng: -71.0589 },
  seattle: { lat: 47.6062, lng: -122.3321 },
  austin: { lat: 30.2672, lng: -97.7431 },
  nashville: { lat: 36.1627, lng: -86.7816 },
  "new-orleans": { lat: 29.9511, lng: -90.0715 },
  charleston: { lat: 32.7765, lng: -79.9311 },
  savannah: { lat: 32.0809, lng: -81.0912 },
  denver: { lat: 39.7392, lng: -104.9903 },
  phoenix: { lat: 33.4484, lng: -112.074 },
  scottsdale: { lat: 33.4942, lng: -111.9261 },
  "san-antonio": { lat: 29.4241, lng: -98.4936 },
  tampa: { lat: 27.9506, lng: -82.4572 },
  "key-west": { lat: 24.5551, lng: -81.78 },
  portland: { lat: 45.5152, lng: -122.6784 },
  "salt-lake-city": { lat: 40.7608, lng: -111.891 },
};

const TIMEZONES = {
  "new-york": "America/New_York",
  "las-vegas": "America/Los_Angeles",
  orlando: "America/New_York",
  miami: "America/New_York",
  "los-angeles": "America/Los_Angeles",
  "san-francisco": "America/Los_Angeles",
  "san-diego": "America/Los_Angeles",
  honolulu: "Pacific/Honolulu",
  chicago: "America/Chicago",
  "washington-dc": "America/New_York",
  boston: "America/New_York",
  seattle: "America/Los_Angeles",
  austin: "America/Chicago",
  nashville: "America/Chicago",
  "new-orleans": "America/Chicago",
  charleston: "America/New_York",
  savannah: "America/New_York",
  denver: "America/Denver",
  phoenix: "America/Phoenix",
  scottsdale: "America/Phoenix",
  "san-antonio": "America/Chicago",
  tampa: "America/New_York",
  "key-west": "America/New_York",
  portland: "America/Los_Angeles",
  "salt-lake-city": "America/Denver",
};

function readJson(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

const rollout = readJson(path.join(ROOT, "data", "cities", `${rolloutName}.json`));
if (!Array.isArray(rollout)) {
  console.error(`Rollout manifest not found or invalid: ${rolloutName}`);
  process.exit(1);
}

let updated = 0;
for (const entry of rollout) {
  const filePath = path.join(ROOT, "data", "cities", `${entry.slug}.json`);
  const manifest = readJson(filePath);
  if (!manifest) continue;
  let changed = false;
  if (!manifest.coordinates && COORDINATES[entry.slug]) {
    manifest.coordinates = COORDINATES[entry.slug];
    changed = true;
  }
  if (manifest.lat == null && COORDINATES[entry.slug]) {
    manifest.lat = COORDINATES[entry.slug].lat;
    changed = true;
  }
  if (manifest.lng == null && COORDINATES[entry.slug]) {
    manifest.lng = COORDINATES[entry.slug].lng;
    changed = true;
  }
  if (!manifest.timezone && TIMEZONES[entry.slug]) {
    manifest.timezone = TIMEZONES[entry.slug];
    changed = true;
  }
  if (!changed) continue;
  writeJson(filePath, manifest);
  updated += 1;
}

console.log(`Updated city manifests with coordinates/timezone: ${updated}`);
