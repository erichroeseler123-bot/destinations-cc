#!/usr/bin/env node
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const GRAPH_DIR = path.join(ROOT, "data", "graph", "by-place");
const MAP_MASTER_PATH = path.join(ROOT, "data", "map", "master-map.geojson");
const OUT_DIR = path.join(ROOT, "data", "map", "reference-points", "by-place");
const OUT_INDEX = path.join(ROOT, "data", "map", "reference-points", "index.json");

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function safeReadJson(p) {
  try {
    return readJson(p);
  } catch {
    return null;
  }
}

function buildFeatureLookup(master) {
  const byId = new Map();
  const bySlug = new Map();
  for (const f of master.features || []) {
    if (!f?.properties) continue;
    const id = f.properties.id;
    const slug = f.properties.slug;
    if (id) byId.set(id, f);
    if (slug) bySlug.set(slug, f);
  }
  return { byId, bySlug };
}

if (!fs.existsSync(MAP_MASTER_PATH)) {
  console.error("Missing master map geojson. Run `npm run dcc:map` first.");
  process.exit(1);
}

if (!fs.existsSync(GRAPH_DIR)) {
  console.error("Missing graph by-place directory. Run `npm run dcc:graph:place` first.");
  process.exit(1);
}

const master = readJson(MAP_MASTER_PATH);
const lookup = buildFeatureLookup(master);

fs.rmSync(path.dirname(OUT_DIR), { recursive: true, force: true });
ensureDir(OUT_DIR);

const files = fs.readdirSync(GRAPH_DIR).filter((n) => n.endsWith(".json"));
const summaries = [];
let totalReferences = 0;

for (const name of files) {
  const graph = safeReadJson(path.join(GRAPH_DIR, name));
  if (!graph) continue;

  const centerFeature =
    lookup.byId.get(graph.place_id) ||
    lookup.bySlug.get(graph.place_slug) ||
    null;

  if (!centerFeature?.geometry || centerFeature.geometry.type !== "Point") continue;
  const [centerLon, centerLat] = centerFeature.geometry.coordinates;

  const refs = [];
  for (const rel of graph.related_places || []) {
    const relFeature =
      lookup.byId.get(rel.place_id) ||
      (rel.place_slug ? lookup.bySlug.get(rel.place_slug) : null) ||
      null;
    if (!relFeature?.geometry || relFeature.geometry.type !== "Point") continue;
    const [lon, lat] = relFeature.geometry.coordinates;
    refs.push({
      id: rel.place_id,
      slug: rel.place_slug || rel.place_id,
      name: rel.place_name || rel.place_slug || rel.place_id,
      reason: rel.reason || "related",
      class: relFeature.properties?.class || null,
      coordinates: [lon, lat],
    });
  }

  const laneCounts = graph.counts || { tours: 0, cruises: 0, events: 0, transport: 0 };
  const payload = {
    place_id: graph.place_id,
    place_slug: graph.place_slug,
    place_name: graph.place_name,
    center: {
      coordinates: [centerLon, centerLat],
      country_code: centerFeature.properties?.country_code || null,
      admin1_code: centerFeature.properties?.admin1_code || null,
    },
    lane_counts: laneCounts,
    providers: graph.providers || [],
    observations: graph.observations || null,
    reference_points: refs,
    generated_at: new Date().toISOString(),
  };

  fs.writeFileSync(
    path.join(OUT_DIR, `${graph.place_slug}.json`),
    `${JSON.stringify(payload, null, 2)}\n`,
    "utf8"
  );

  totalReferences += refs.length;
  summaries.push({
    place_id: graph.place_id,
    place_slug: graph.place_slug,
    place_name: graph.place_name,
    reference_points: refs.length,
    lane_counts: laneCounts,
  });
}

fs.writeFileSync(
  OUT_INDEX,
  `${JSON.stringify(
    {
      generated_at: new Date().toISOString(),
      places: summaries.length,
      total_reference_points: totalReferences,
      summaries,
    },
    null,
    2
  )}\n`,
  "utf8"
);

console.log(
  `Built reference-points map layer: ${summaries.length} places, ${totalReferences} reference point links.`
);
