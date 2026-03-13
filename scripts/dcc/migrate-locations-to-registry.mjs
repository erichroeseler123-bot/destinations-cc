#!/usr/bin/env node
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const INPUT = path.join(ROOT, "data", "nodes", "locations.jsonl");
const OUT_ROOT = path.join(ROOT, "data", "registry", "place");

function normToken(input) {
  return String(input || "")
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function dccId(cls, scope, serial = 1) {
  return `dcc:${cls}:${normToken(scope)}:${String(serial).padStart(4, "0")}`;
}

function refCode(prefix, scope, serial = 1) {
  const bits = normToken(scope)
    .split("-")
    .filter(Boolean)
    .map((x) => x.toUpperCase())
    .slice(0, 6)
    .join("-");
  return `${prefix}-${bits}-${String(serial).padStart(4, "0")}`;
}

function sourceRefs(node) {
  const refs = [];
  const src = node?.source_refs || {};
  for (const [k, v] of Object.entries(src)) {
    if (v === null || v === undefined || v === "") continue;
    if (k === "geonames_id") refs.push({ system: "geonames", id: String(v) });
    else refs.push({ system: "manual", id: `${k}:${String(v)}` });
  }
  return refs.length ? refs : [{ system: "manual", id: "seed:locations.jsonl" }];
}

function mapNode(n) {
  const country = normToken(n?.admin?.country || "xx");
  const admin1 = normToken(n?.admin?.region_code || "na");
  const slug = normToken(n?.slug || n?.name || n?.id || "unknown");
  const scope = `${country}-${admin1}-${slug}`;
  const id = dccId("place", scope, 1);
  const now = new Date().toISOString();

  const aliases = Array.from(
    new Set([slug].filter(Boolean)),
  );

  return {
    id,
    class: "place",
    subclass: "city",
    slug,
    name: n?.name || slug,
    display_name: n?.name || slug,
    status: "active",
    visibility: "public",
    is_physical: true,
    aliases,
    tags: [country, admin1, "city"].filter(Boolean),
    reference_code: refCode("PLC", scope, 1),
    names: {
      primary: n?.name || slug,
      ascii: n?.name || slug,
      local: [],
      alternate: [],
      historic: [],
    },
    geo: {
      lat: n?.geo?.lat ?? null,
      lon: n?.geo?.lon ?? null,
      elevation_m: n?.geo?.elevation_m ?? null,
      bbox: null,
      geohash: null,
    },
    admin: {
      country_code: (n?.admin?.country || "").toUpperCase() || null,
      country_name: null,
      admin1_code: n?.admin?.region_code || null,
      admin1_name: null,
      admin2_code: null,
      admin2_name: null,
      locality: null,
    },
    hierarchy: {
      parent_ids: [],
      ancestor_ids: [],
      child_ids: [],
    },
    links: {
      canonical_path: `/nodes/${slug}`,
      legacy_paths: [`/${slug}`],
      authority_paths: [`/cities/${slug}`],
      outbound_urls: [],
    },
    source_refs: sourceRefs(n),
    metrics: {
      population: n?.metrics?.population ?? null,
      population_year: n?.metrics?.population_year ?? null,
    },
    travel: {
      airports: [],
      ports: [],
      stations: [],
      roads: [],
      routes: [],
      operators: [],
      products: [],
    },
    content: {
      summary: "",
      long_description_md: "",
      known_for: Array.isArray(n?.about?.known_for) ? n.about.known_for : [],
      faq_refs: [],
      article_refs: [],
      trust_notes: [],
    },
    commerce: {
      bookable: false,
      operator_ids: [],
      product_ids: [],
      affiliate_ids: [],
    },
    edges: [],
    meta: {
      version: 1,
      created_at: n?.updated_at || now,
      updated_at: now,
      provenance: ["locations.jsonl"],
      quality_score: null,
    },
  };
}

function shardPath(node) {
  const country = normToken(node?.admin?.country || "xx");
  const admin1 = normToken(node?.admin?.region_code || "na");
  return path.join(OUT_ROOT, country, `${admin1}.jsonl`);
}

if (!fs.existsSync(INPUT)) {
  console.error(`Input file not found: ${INPUT}`);
  process.exit(1);
}

const raw = fs.readFileSync(INPUT, "utf8").trim();
const lines = raw ? raw.split("\n") : [];
const buckets = new Map();

for (const line of lines) {
  if (!line.trim()) continue;
  const node = JSON.parse(line);
  const out = mapNode(node);
  const file = shardPath(node);
  if (!buckets.has(file)) buckets.set(file, []);
  buckets.get(file).push(JSON.stringify(out));
}

for (const [file, items] of buckets.entries()) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${items.join("\n")}\n`, "utf8");
}

console.log(`Migrated ${lines.length} locations into ${buckets.size} registry shard(s).`);
