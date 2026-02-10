#!/usr/bin/env node
import fs from "fs";
import path from "path";

const ROOT = process.cwd();

const NODES_PATH = path.join(ROOT, "data", "nodes.json");
const ALIASES_PATH = path.join(ROOT, "data", "city-aliases.json");
const ATTRACTIONS_PATH = path.join(ROOT, "data", "attractions.json");

function die(msg) {
  console.error(`\n❌ ${msg}\n`);
  process.exit(1);
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (e) {
    die(`Failed to read JSON: ${filePath}\n${e.message}`);
  }
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
}

function slugify(input) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function titleCase(s) {
  return s
    .split(/[\s-]+/g)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function parseArgs(argv) {
  // Usage:
  //   node scripts/add-city.mjs denver colorado
  //   node scripts/add-city.mjs "san-jose" california --name "San Jose Guide" --alias "sj" --alias "san-jose-ca"
  const args = argv.slice(2);
  const out = { slug: null, region: null, name: null, aliases: [] };

  const positional = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i];

    if (a === "--name") {
      out.name = args[++i];
      continue;
    }

    if (a === "--alias") {
      out.aliases.push(args[++i]);
      continue;
    }

    if (a.startsWith("--")) {
      die(`Unknown flag: ${a}`);
    }

    positional.push(a);
  }

  if (positional.length < 2) {
    die(
      `Usage:\n  npm run add-city -- <city-slug-or-name> <region> [--name "City Guide"] [--alias "alt-route"]\n\nExamples:\n  npm run add-city -- denver colorado\n  npm run add-city -- "san jose" california --alias "sj"\n`
    );
  }

  out.slug = slugify(positional[0]);
  out.region = slugify(positional[1]);
  return out;
}

function ensureFilesExist() {
  if (!fs.existsSync(NODES_PATH)) die(`Missing ${NODES_PATH}`);
  if (!fs.existsSync(ALIASES_PATH)) die(`Missing ${ALIASES_PATH}`);
  if (!fs.existsSync(ATTRACTIONS_PATH)) die(`Missing ${ATTRACTIONS_PATH}`);
}

function main() {
  ensureFilesExist();
  const { slug: cityKey, region, name, aliases } = parseArgs(process.argv);

  const nodes = readJson(NODES_PATH);
  const aliasMap = readJson(ALIASES_PATH);
  const attractions = readJson(ATTRACTIONS_PATH);

  if (!Array.isArray(nodes)) die("data/nodes.json must be an array");
  if (typeof aliasMap !== "object" || !aliasMap) die("data/city-aliases.json must be an object");
  if (typeof attractions !== "object" || !attractions) die("data/attractions.json must be an object");

  const nodeSlug = `${cityKey}-guide`;
  const guideName = name ? name.trim() : `${titleCase(cityKey)} Guide`;

  // 1) nodes.json
  const existingNode = nodes.find((n) => n && n.slug === nodeSlug);
  if (existingNode) die(`Node already exists in nodes.json: ${nodeSlug}`);

  nodes.push({
    id: nodeSlug,
    slug: nodeSlug,
    name: guideName,
    type: "destination",
    region,
    status: "active",
    description: `Things to do, tours, and essential local knowledge for ${titleCase(cityKey)}.`,
  });

  // Keep nodes sorted by region then name (stable diffs)
  nodes.sort((a, b) => {
    const ar = (a.region || "").localeCompare(b.region || "");
    if (ar !== 0) return ar;
    return (a.name || "").localeCompare(b.name || "");
  });

  // 2) city-aliases.json
  if (aliasMap[cityKey]) die(`Alias key already exists: "${cityKey}" -> "${aliasMap[cityKey]}"`);

  aliasMap[cityKey] = nodeSlug;

  for (const raw of aliases) {
    const k = slugify(raw);
    if (!k) continue;
    if (aliasMap[k]) die(`Alias key already exists: "${k}" -> "${aliasMap[k]}"`);
    aliasMap[k] = nodeSlug;
  }

  // Sort alias keys for clean diffs
  const sortedAliasMap = Object.fromEntries(
    Object.entries(aliasMap).sort(([a], [b]) => a.localeCompare(b))
  );

  // 3) attractions.json (seed with safe placeholders so pages don’t look empty)
  if (!attractions[cityKey]) {
    attractions[cityKey] = [
      {
        title: `${titleCase(cityKey)} City Highlights Tour`,
        description: `A quick way to see the best of ${titleCase(cityKey)} with a local guide.`,
        query: "city highlights tour",
        badge: "Starter",
      },
      {
        title: "Food & Drink Tour",
        description: `A high-conversion category: local tastings, bars, and signature bites.`,
        query: "food tour",
      },
      {
        title: "Neighborhood Walking Tour",
        description: `Perfect for first-timers: history, architecture, and the best streets.`,
        query: "walking tour",
      },
    ];
  } else {
    die(`Attractions key already exists in attractions.json: "${cityKey}"`);
  }

  // Write all files
  writeJson(NODES_PATH, nodes);
  writeJson(ALIASES_PATH, sortedAliasMap);
  writeJson(ATTRACTIONS_PATH, attractions);

  console.log("\n✅ City added!");
  console.log(`   city route key:  ${cityKey}`);
  console.log(`   node slug:       ${nodeSlug}`);
  console.log(`   region:          ${region}`);
  if (aliases.length) console.log(`   extra aliases:   ${aliases.map(slugify).join(", ")}`);
  console.log("\nNext:");
  console.log(`  npm run build\n`);
}

main();
