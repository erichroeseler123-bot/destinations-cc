#!/usr/bin/env node
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const REGISTRY_ROOT = path.join(ROOT, "data", "registry");
const INDEX_ROOT = path.join(ROOT, "data", "index");

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

function addArrayMap(map, key, value) {
  if (!key) return;
  if (!map[key]) map[key] = [];
  if (!map[key].includes(value)) map[key].push(value);
}

function addSlugClass(map, cls, slug, id) {
  if (!map[cls]) map[cls] = {};
  if (!map[cls][slug]) {
    map[cls][slug] = id;
    return;
  }
  if (map[cls][slug] === id) return;
  const prior = map[cls][slug];
  map[cls][slug] = Array.isArray(prior)
    ? Array.from(new Set([...prior, id]))
    : [prior, id];
}

const byId = {};
const bySlug = {};
const bySlugClass = {};
const byAlias = {};
const byClass = {};
const byParent = {};
const byCountry = {};
const byTag = {};
const bySource = {};
const warnings = [];

const files = walkJsonl(REGISTRY_ROOT);
for (const full of files) {
  const rel = path.relative(ROOT, full).replace(/\\/g, "/");
  const lines = fs.readFileSync(full, "utf8").split("\n");

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line.trim()) continue;
    let node;
    try {
      node = JSON.parse(line);
    } catch (err) {
      warnings.push(`JSON parse error ${rel}:${i + 1}: ${String(err)}`);
      continue;
    }

    if (!node?.id || !node?.slug || !node?.class) {
      warnings.push(`Missing id/slug/class ${rel}:${i + 1}`);
      continue;
    }

    if (byId[node.id]) {
      warnings.push(`Duplicate id ${node.id} at ${rel}:${i + 1}`);
    } else {
      byId[node.id] = {
        id: node.id,
        class: node.class,
        slug: node.slug,
        file: rel,
        line: i + 1,
      };
    }

    if (bySlug[node.slug] && bySlug[node.slug] !== node.id) {
      const prior = bySlug[node.slug];
      bySlug[node.slug] = Array.isArray(prior) ? Array.from(new Set([...prior, node.id])) : [prior, node.id];
      warnings.push(`Slug collision ${node.slug} includes ${node.id}`);
    } else if (!bySlug[node.slug]) {
      bySlug[node.slug] = node.id;
    }
    addSlugClass(bySlugClass, node.class, node.slug, node.id);

    addArrayMap(byClass, node.class, node.id);

    for (const alias of node.aliases || []) addArrayMap(byAlias, alias, node.id);
    for (const tag of node.tags || []) addArrayMap(byTag, tag, node.id);

    const c = node?.admin?.country_code;
    if (c) addArrayMap(byCountry, String(c).toUpperCase(), node.id);

    const parents = node?.hierarchy?.parent_ids || [];
    for (const p of parents) addArrayMap(byParent, p, node.id);

    for (const src of node.source_refs || []) {
      const sys = src?.system;
      const sid = src?.id;
      if (!sys || !sid) continue;
      if (!bySource[sys]) bySource[sys] = {};
      addArrayMap(bySource[sys], String(sid), node.id);
    }
  }
}

ensureDir(INDEX_ROOT);
ensureDir(path.join(INDEX_ROOT, "by-source"));

fs.writeFileSync(path.join(INDEX_ROOT, "by-id.json"), JSON.stringify(byId, null, 2));
fs.writeFileSync(path.join(INDEX_ROOT, "by-slug.json"), JSON.stringify(bySlug, null, 2));
fs.writeFileSync(path.join(INDEX_ROOT, "by-slug-class.json"), JSON.stringify(bySlugClass, null, 2));
fs.writeFileSync(path.join(INDEX_ROOT, "by-alias.json"), JSON.stringify(byAlias, null, 2));
fs.writeFileSync(path.join(INDEX_ROOT, "by-class.json"), JSON.stringify(byClass, null, 2));
fs.writeFileSync(path.join(INDEX_ROOT, "by-parent.json"), JSON.stringify(byParent, null, 2));
fs.writeFileSync(path.join(INDEX_ROOT, "by-country.json"), JSON.stringify(byCountry, null, 2));
fs.writeFileSync(path.join(INDEX_ROOT, "by-tag.json"), JSON.stringify(byTag, null, 2));

for (const [sys, data] of Object.entries(bySource)) {
  fs.writeFileSync(path.join(INDEX_ROOT, "by-source", `${sys}.json`), JSON.stringify(data, null, 2));
}

if (warnings.length) {
  fs.writeFileSync(path.join(INDEX_ROOT, "build-warnings.log"), `${warnings.join("\n")}\n`, "utf8");
}

console.log(`Indexed ${Object.keys(byId).length} nodes from ${files.length} shard(s).`);
if (warnings.length) console.log(`Warnings: ${warnings.length} (see data/index/build-warnings.log)`);
