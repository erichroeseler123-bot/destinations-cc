import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const NODES = path.join(ROOT, "data", "nodes.json");
const ALIASES = path.join(ROOT, "data", "city-aliases.json");
const ATTRACTIONS = path.join(ROOT, "data", "attractions.json");

function die(msg) {
  console.error(`\n❌ ${msg}\n`);
  process.exit(1);
}

function readJson(p) {
  if (!fs.existsSync(p)) die(`Missing file: ${p}`);
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch (e) {
    die(`Invalid JSON in ${p}\n${e.message}`);
  }
}

function main() {
  const nodes = readJson(NODES);
  const aliases = readJson(ALIASES);
  const attractions = readJson(ATTRACTIONS);

  if (!Array.isArray(nodes)) die("data/nodes.json must be an array");
  if (!aliases || typeof aliases !== "object" || Array.isArray(aliases))
    die("data/city-aliases.json must be an object map");
  if (!attractions || typeof attractions !== "object" || Array.isArray(attractions))
    die("data/attractions.json must be an object map");

  // nodes sanity
  const seen = new Set();
  for (const n of nodes) {
    if (!n || typeof n !== "object") die("nodes.json contains a non-object entry");
    if (!n.slug) die("nodes.json entry missing slug");
    if (seen.has(n.slug)) die(`Duplicate node slug: ${n.slug}`);
    seen.add(n.slug);
    if (!n.name) die(`Node ${n.slug} missing name`);
    if (!n.type) die(`Node ${n.slug} missing type`);
  }

  // alias sanity: every alias should point to an existing node slug
  const nodeSlugs = new Set(nodes.map(n => n.slug));
  for (const [k, v] of Object.entries(aliases)) {
    if (!k || typeof k !== "string") die("Alias key must be a string");
    if (!v || typeof v !== "string") die(`Alias "${k}" has invalid target`);
    if (!nodeSlugs.has(v)) die(`Alias "${k}" points to missing node slug "${v}"`);
  }

  // attractions sanity
  for (const [cityKey, arr] of Object.entries(attractions)) {
    if (!Array.isArray(arr)) die(`attractions["${cityKey}"] must be an array`);
    for (const item of arr) {
      if (!item.title || !item.description || !item.query) {
        die(`attractions["${cityKey}"] has an item missing title/description/query`);
      }
    }
  }

  console.log("\n✅ data:check passed");
  console.log(`   nodes:       ${nodes.length}`);
  console.log(`   aliases:     ${Object.keys(aliases).length}`);
  console.log(`   attractions: ${Object.keys(attractions).length}\n`);
}

main();
