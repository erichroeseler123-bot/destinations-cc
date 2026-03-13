#!/usr/bin/env node
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const REGISTRY_ROOT = path.join(ROOT, "data", "registry");
const MAP_ROOT = path.join(ROOT, "data", "map");
const BY_CLASS_DIR = path.join(MAP_ROOT, "by-class");

function walkJsonl(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, name.name);
    if (name.isDirectory()) walkJsonl(full, out);
    else if (name.isFile() && full.endsWith(".jsonl")) out.push(full);
  }
  return out;
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function pointGeometry(node) {
  const mapped = node?.map?.geometry;
  if (mapped?.type === "Point" && Array.isArray(mapped.coordinates) && mapped.coordinates.length === 2) {
    return {
      type: "Point",
      coordinates: [Number(mapped.coordinates[0]), Number(mapped.coordinates[1])],
    };
  }

  const lat = node?.geo?.lat;
  const lon = node?.geo?.lon;
  if (typeof lat === "number" && typeof lon === "number") {
    return { type: "Point", coordinates: [lon, lat] };
  }

  return null;
}

function toFeature(node) {
  const geometry = pointGeometry(node);
  if (!geometry) return null;

  return {
    type: "Feature",
    id: node.id,
    geometry,
    properties: {
      id: node.id,
      class: node.class,
      subclass: node.subclass || null,
      slug: node.slug,
      name: node.name,
      display_name: node.display_name || null,
      reference_code: node.reference_code || null,
      country_code: node?.admin?.country_code || null,
      admin1_code: node?.admin?.admin1_code || null,
      tags: Array.isArray(node.tags) ? node.tags : [],
      canonical_path: node?.links?.canonical_path || null,
    },
    bbox: node?.map?.bbox || node?.geo?.bbox || null,
  };
}

const files = walkJsonl(REGISTRY_ROOT);
const allFeatures = [];
const byClass = {};

for (const full of files) {
  const lines = fs.readFileSync(full, "utf8").split("\n");
  for (const line of lines) {
    if (!line.trim()) continue;
    let node;
    try {
      node = JSON.parse(line);
    } catch {
      continue;
    }
    const feature = toFeature(node);
    if (!feature) continue;
    allFeatures.push(feature);
    if (!byClass[node.class]) byClass[node.class] = [];
    byClass[node.class].push(feature);
  }
}

ensureDir(MAP_ROOT);
fs.rmSync(BY_CLASS_DIR, { recursive: true, force: true });
ensureDir(BY_CLASS_DIR);

const master = {
  type: "FeatureCollection",
  features: allFeatures,
};

fs.writeFileSync(
  path.join(MAP_ROOT, "master-map.geojson"),
  `${JSON.stringify(master, null, 2)}\n`,
  "utf8",
);

for (const [cls, features] of Object.entries(byClass)) {
  const fc = { type: "FeatureCollection", features };
  fs.writeFileSync(
    path.join(BY_CLASS_DIR, `${cls}.geojson`),
    `${JSON.stringify(fc, null, 2)}\n`,
    "utf8",
  );
}

console.log(
  `Built master map: ${allFeatures.length} point feature(s), ${Object.keys(byClass).length} class layer(s).`,
);
