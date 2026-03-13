#!/usr/bin/env node
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const INPUT = path.join(ROOT, "data", "ports.generated.json");
const OUT_ROOT = path.join(ROOT, "data", "registry", "port");

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

function mapPort(p) {
  const country = normToken(p?.country || "xx");
  const slug = normToken(p?.slug || p?.name || "unknown-port");
  const area = String(p?.area || "Other").trim();
  const areaSlug = normToken(area);
  const scope = `${country}-${slug}`;
  const id = dccId("port", scope, 1);
  const now = new Date().toISOString();
  const aliases = [slug];

  const tags = new Set(Array.isArray(p?.tags) ? p.tags.map((x) => normToken(x)).filter(Boolean) : []);
  if (areaSlug) tags.add(`area:${areaSlug}`);

  return {
    id,
    class: "port",
    subclass: "cruise_port",
    slug,
    name: p?.name || slug,
    display_name: p?.name || slug,
    status: "active",
    visibility: "public",
    is_physical: true,
    aliases,
    tags: Array.from(tags),
    reference_code: refCode("PRT", scope, 1),
    source_refs: [{ system: "manual", id: `ports.generated:${slug}` }],
    metrics: {
      passenger_volume: p?.passenger_volume ?? null,
    },
    admin: {
      country_code: (p?.country || "").toUpperCase() || null,
      country_name: p?.country || null,
      locality: area || "Other",
    },
    links: {
      canonical_path: `/nodes/${slug}`,
      legacy_paths: [`/ports/${slug}`],
      authority_paths: [`/ports/${slug}`],
      outbound_urls: [],
    },
    hierarchy: {
      parent_ids: [],
      ancestor_ids: [],
      child_ids: [],
    },
    edges: [],
    meta: {
      version: 1,
      created_at: now,
      updated_at: now,
      provenance: ["ports.generated.json"],
      quality_score: null,
    },
  };
}

if (!fs.existsSync(INPUT)) {
  console.error(`Input file not found: ${INPUT}`);
  process.exit(1);
}

const ports = JSON.parse(fs.readFileSync(INPUT, "utf8"));
const buckets = new Map();

for (const p of ports) {
  const out = mapPort(p);
  const country = normToken(p?.country || "xx");
  const file = path.join(OUT_ROOT, `${country}.jsonl`);
  if (!buckets.has(file)) buckets.set(file, []);
  buckets.get(file).push(JSON.stringify(out));
}

for (const [file, items] of buckets.entries()) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${items.join("\n")}\n`, "utf8");
}

console.log(`Migrated ${ports.length} ports into ${buckets.size} registry shard(s).`);
