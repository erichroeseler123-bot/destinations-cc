import fs from "fs";
import path from "path";

const slug = process.argv[2];
if (!slug) {
  console.error("Usage: node scripts/update-city.mjs <city-slug>");
  process.exit(1);
}

const file = path.join(process.cwd(), "data/nodes/locations.jsonl");
const lines = fs.readFileSync(file, "utf8").trim().split("\n");
const nodes = lines.map((l) => JSON.parse(l));

const idx = nodes.findIndex((n) => n.slug === slug);
if (idx === -1) {
  console.error("City not found:", slug);
  process.exit(1);
}

const n = nodes[idx];

// minimal demo content (edit later)
n.about = n.about || {};
n.about.known_for = n.about.known_for?.length ? n.about.known_for : [
  "Iconic neighborhoods and skyline viewpoints",
  "World-class museums and performing arts",
  "Food scene spanning every cuisine"
];
n.about.cuisine = n.about.cuisine?.length ? n.about.cuisine : [
  "NYC-style pizza",
  "Bagels & deli culture",
  "Chinatown dim sum"
];

n.arrival = n.arrival || {};
n.arrival.fly = n.arrival.fly?.length ? n.arrival.fly : ["JFK (John F. Kennedy)", "LGA (LaGuardia)", "EWR (Newark)"];
n.arrival.train = n.arrival.train?.length ? n.arrival.train : ["Penn Station (Amtrak / NJ Transit / LIRR)"];
n.arrival.drive = n.arrival.drive?.length ? n.arrival.drive : ["Major approaches via I-95 / I-80 / I-78 corridors"];
n.arrival.cruise = n.arrival.cruise?.length ? n.arrival.cruise : ["Manhattan Cruise Terminal (seasonal)"];

n.weather = n.weather || {};
n.weather.climate_summary = n.weather.climate_summary || "Four seasons: cold winters, warm humid summers. Best shoulder seasons: spring and fall.";

n.updated_at = new Date().toISOString();

nodes[idx] = n;

fs.writeFileSync(file, nodes.map((x) => JSON.stringify(x)).join("\n") + "\n");
console.log("Updated:", slug);
