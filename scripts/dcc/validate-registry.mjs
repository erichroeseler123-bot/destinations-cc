#!/usr/bin/env node
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const REGISTRY_ROOT = path.join(ROOT, "data", "registry");
const INDEX_ROOT = path.join(ROOT, "data", "index");

const VALID_CLASS = new Set([
  "world",
  "continent",
  "country",
  "region",
  "place",
  "district",
  "neighborhood",
  "port",
  "transport_hub",
  "venue",
  "attraction",
  "lodging",
  "pickup_zone",
  "route",
  "operator",
  "product",
  "service_area",
  "article",
  "faq",
  "signal",
  "collection",
  "virtual",
]);

const VALID_STATUS = new Set([
  "active",
  "draft",
  "planned",
  "seasonal",
  "temporary",
  "archived",
  "deprecated",
]);

const VALID_VISIBILITY = new Set(["public", "internal", "private"]);
const DCC_ID_RE = /^dcc:[a-z_]+:[a-z0-9-]+:[0-9]{4,}$/;

function walkJsonl(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, name.name);
    if (name.isDirectory()) walkJsonl(full, out);
    else if (name.isFile() && full.endsWith(".jsonl")) out.push(full);
  }
  return out;
}

function readNodes() {
  const files = walkJsonl(REGISTRY_ROOT);
  const nodes = [];
  for (const full of files) {
    const rel = path.relative(ROOT, full).replace(/\\/g, "/");
    const lines = fs.readFileSync(full, "utf8").split("\n");
    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];
      if (!line.trim()) continue;
      try {
        const node = JSON.parse(line);
        nodes.push({ node, file: rel, line: i + 1 });
      } catch (err) {
        nodes.push({ parseError: String(err), file: rel, line: i + 1 });
      }
    }
  }
  return nodes;
}

function fail(errors) {
  console.error(`Registry validation failed with ${errors.length} error(s):`);
  for (const e of errors.slice(0, 200)) console.error(`- ${e}`);
  if (errors.length > 200) console.error(`... and ${errors.length - 200} more`);
  process.exit(1);
}

function validate() {
  const rows = readNodes();
  const errors = [];
  const idSeen = new Map();
  const slugSeenByClass = new Map();
  const globalSlugOwner = new Map();
  const idSet = new Set();

  for (const row of rows) {
    if (row.parseError) {
      errors.push(`${row.file}:${row.line} parse error ${row.parseError}`);
      continue;
    }
    const { node, file, line } = row;
    const loc = `${file}:${line}`;

    const required = ["id", "class", "slug", "name", "status", "visibility", "is_physical", "aliases", "tags", "source_refs", "edges", "meta"];
    for (const key of required) {
      if (!(key in node)) errors.push(`${loc} missing required field ${key}`);
    }

    if (!DCC_ID_RE.test(String(node.id || ""))) errors.push(`${loc} invalid id format ${node.id}`);
    if (!VALID_CLASS.has(node.class)) errors.push(`${loc} invalid class ${node.class}`);
    if (!VALID_STATUS.has(node.status)) errors.push(`${loc} invalid status ${node.status}`);
    if (!VALID_VISIBILITY.has(node.visibility)) errors.push(`${loc} invalid visibility ${node.visibility}`);
    if (!Array.isArray(node.aliases)) errors.push(`${loc} aliases must be array`);
    if (!Array.isArray(node.tags)) errors.push(`${loc} tags must be array`);
    if (!Array.isArray(node.source_refs) || node.source_refs.length === 0) errors.push(`${loc} source_refs must be non-empty array`);
    if (!Array.isArray(node.edges)) errors.push(`${loc} edges must be array`);
    if (!node.meta?.provenance || !Array.isArray(node.meta.provenance) || node.meta.provenance.length === 0) {
      errors.push(`${loc} meta.provenance must be non-empty array`);
    }

    if (idSeen.has(node.id)) errors.push(`${loc} duplicate id ${node.id} also at ${idSeen.get(node.id)}`);
    else idSeen.set(node.id, loc);
    idSet.add(node.id);

    const classSlugKey = `${node.class}:${node.slug}`;
    if (slugSeenByClass.has(classSlugKey)) {
      errors.push(`${loc} duplicate class+slug ${classSlugKey} also at ${slugSeenByClass.get(classSlugKey)}`);
    } else {
      slugSeenByClass.set(classSlugKey, loc);
    }

    if (!globalSlugOwner.has(node.slug)) {
      globalSlugOwner.set(node.slug, node.id);
    } else if (globalSlugOwner.get(node.slug) !== node.id) {
      // Allowed cross-class now, but still track with warning-style error in strict mode disabled.
      // No hard error here by design for class-aware slug policy.
    }

    if (node.is_physical) {
      const lat = node?.geo?.lat;
      const lon = node?.geo?.lon;
      if (lat !== null && lat !== undefined && (lat < -90 || lat > 90)) {
        errors.push(`${loc} invalid latitude ${lat}`);
      }
      if (lon !== null && lon !== undefined && (lon < -180 || lon > 180)) {
        errors.push(`${loc} invalid longitude ${lon}`);
      }
    }
  }

  // Validate aliases against canonical slug owners:
  for (const row of rows) {
    if (row.parseError) continue;
    const { node, file, line } = row;
    const loc = `${file}:${line}`;
    for (const alias of node.aliases || []) {
      if (alias === node.slug) continue;
      const ownerId = globalSlugOwner.get(alias);
      if (ownerId && ownerId !== node.id) {
        errors.push(`${loc} alias '${alias}' collides with canonical slug of node ${ownerId}`);
      }
    }
  }

  // Validate edge targets:
  for (const row of rows) {
    if (row.parseError) continue;
    const { node, file, line } = row;
    const loc = `${file}:${line}`;
    for (const [i, edge] of (node.edges || []).entries()) {
      if (!DCC_ID_RE.test(String(edge?.to || ""))) {
        errors.push(`${loc} edge[${i}] invalid DCC id target ${edge?.to}`);
      } else if (!idSet.has(edge.to)) {
        errors.push(`${loc} edge[${i}] target does not exist ${edge.to}`);
      }
    }
  }

  // Basic index presence check:
  const expectedIndexes = [
    "by-id.json",
    "by-slug.json",
    "by-slug-class.json",
    "by-alias.json",
    "by-class.json",
    "by-parent.json",
    "by-country.json",
  ];
  for (const idx of expectedIndexes) {
    const p = path.join(INDEX_ROOT, idx);
    if (!fs.existsSync(p)) errors.push(`Missing index file data/index/${idx}`);
  }

  if (errors.length > 0) fail(errors);
  console.log(`Registry validation passed (${idSet.size} nodes).`);
}

validate();
