import fs from "fs";

const slug = process.argv[2];
if (!slug) {
  console.error("Usage: node scripts/update-city.js <city-slug>");
  process.exit(1);
}

const p = "data/nodes/locations.jsonl";
const raw = fs.readFileSync(p, "utf8").trim();
if (!raw) {
  console.error("Empty locations.jsonl");
  process.exit(1);
}

const lines = raw.split("\n");
let updated = false;

const out = lines.map((line) => {
  const obj = JSON.parse(line);
  if (obj.slug !== slug) return line;

  updated = true;

  obj.about ||= {};
  obj.arrival ||= {};
  obj.travel ||= {};
  obj.weather ||= {};

  obj.about.known_for = (obj.about.known_for?.length ? obj.about.known_for : [
    "Iconic neighborhoods (Manhattan, Brooklyn, Queens)",
    "Museums & landmarks (Met, MoMA, Central Park)",
    "Broadway, live comedy, and nightlife",
  ]);

  obj.about.cuisine = (obj.about.cuisine?.length ? obj.about.cuisine : [
    "Pizza slices, bagels, deli sandwiches",
    "Global food: Chinatown, Little Italy, Jackson Heights",
  ]);

  obj.arrival.fly = (obj.arrival.fly?.length ? obj.arrival.fly : [
    "JFK, LGA, EWR — choose based on where you’re staying",
  ]);

  obj.arrival.train = (obj.arrival.train?.length ? obj.arrival.train : [
    "Amtrak to Penn Station (NYC) and Newark Penn (NJ)",
  ]);

  obj.arrival.drive = (obj.arrival.drive?.length ? obj.arrival.drive : [
    "Parking is expensive — consider transit + rideshare",
  ]);

  obj.weather.climate_summary ||= "Four seasons. Winters can be windy/cold; summers are hot and humid. Spring/Fall are the easiest for walking-heavy itineraries.";

  obj.updated_at = new Date().toISOString();
  return JSON.stringify(obj);
});

if (!updated) {
  console.error("Slug not found:", slug);
  process.exit(1);
}

fs.writeFileSync(p, out.join("\n") + "\n");
console.log("Updated:", slug);
