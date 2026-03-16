#!/usr/bin/env node
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const CITY_INDEX_PATH = path.join(ROOT, "data", "cities", "index.json");
const CITY_PACK_ROOT = path.join(ROOT, "data", "cities");
const PLACE_REGISTRY_ROOT = path.join(ROOT, "data", "registry", "place");
const OUT_ROOT = path.join(ROOT, "data", "registry", "venue");

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
    .map((bit) => bit.toUpperCase())
    .slice(0, 6)
    .join("-");
  return `${prefix}-${bits}-${String(serial).padStart(4, "0")}`;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function readRegistryJsonl(dir) {
  const nodes = [];
  if (!fs.existsSync(dir)) return nodes;
  const stack = [dir];
  while (stack.length > 0) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(full);
        continue;
      }
      if (!entry.isFile() || !full.endsWith(".jsonl")) continue;
      const lines = fs.readFileSync(full, "utf8").split("\n");
      for (const line of lines) {
        if (!line.trim()) continue;
        nodes.push(JSON.parse(line));
      }
    }
  }
  return nodes;
}

function buildCityMetadata() {
  const cityIndex = readJson(CITY_INDEX_PATH);
  const bySlug = new Map();
  for (const city of cityIndex.cities || []) {
    const state = String(city.state || "").toUpperCase();
    const country = "US";
    const cityScopeSlug = `${normToken(city.slug)}-${normToken(state)}`;
    bySlug.set(city.slug, {
      slug: city.slug,
      name: city.name,
      country_code: country,
      admin1_code: state,
      city_scope_slug: cityScopeSlug,
    });
  }
  return bySlug;
}

function buildCityPlaceIndex() {
  const cityPlaces = new Map();
  for (const node of readRegistryJsonl(PLACE_REGISTRY_ROOT)) {
    if (node?.class !== "place" || node?.subclass !== "city") continue;
    cityPlaces.set(node.slug, node);
  }
  return cityPlaces;
}

function deriveAliases(citySlug, venue) {
  const aliases = new Set();
  aliases.add(normToken(venue.slug));
  aliases.add(normToken(venue.name));
  aliases.add(normToken(`${venue.name}-${citySlug}`));
  aliases.add(normToken(`${venue.slug}-${citySlug}`));
  return Array.from(aliases).filter(Boolean).sort();
}

function deriveTags(citySlug, venue) {
  const tags = new Set();
  tags.add(`city:${normToken(citySlug)}`);
  tags.add(`venue-type:${normToken(venue.venue_type)}`);
  tags.add(`category:${normToken(venue.category)}`);
  tags.add(`impact:${normToken(venue.impact_potential)}`);
  for (const districtSlug of venue.district_slugs || []) {
    tags.add(`district:${normToken(districtSlug)}`);
  }
  return Array.from(tags).filter(Boolean).sort();
}

function mapVenue(cityMeta, cityNode, packAsOf, venue) {
  const scope = `${cityMeta.country_code}-${cityMeta.admin1_code}-${cityMeta.slug}-${venue.slug}`;
  const id = dccId("venue", scope, 1);
  const now = new Date().toISOString();
  const parentIds = cityNode ? [cityNode.id] : [];
  const canonicalNodePath = `/nodes/${venue.slug}`;
  const featurePath = `/venues/${venue.slug}`;

  return {
    id,
    class: "venue",
    subclass: normToken(venue.venue_type) || null,
    slug: normToken(venue.slug),
    name: venue.name,
    display_name: venue.name,
    status: "active",
    visibility: "public",
    is_physical: true,
    aliases: deriveAliases(cityMeta.slug, venue),
    tags: deriveTags(cityMeta.slug, venue),
    reference_code: refCode("VEN", scope, 1),
    geo: {
      lat: typeof venue.lat === "number" ? venue.lat : null,
      lon: typeof venue.lng === "number" ? venue.lng : null,
      elevation_m: null,
      bbox: null,
      geohash: null,
    },
    admin: {
      country_code: cityMeta.country_code,
      country_name: "United States",
      admin1_code: cityMeta.admin1_code,
      admin1_name: null,
      admin2_code: null,
      admin2_name: null,
      locality: cityMeta.name,
    },
    hierarchy: {
      parent_ids: parentIds,
      ancestor_ids: parentIds,
      child_ids: [],
    },
    links: {
      canonical_path: canonicalNodePath,
      legacy_paths: [featurePath],
      authority_paths: [featurePath],
      outbound_urls: [],
    },
    source_refs: [
      {
        system: "internal",
        id: `live-city:${cityMeta.slug}:venue:${venue.slug}`,
        label: `data/cities/${cityMeta.slug}/venues.json`,
        updated_at: packAsOf || null,
      },
    ],
    edges: parentIds.map((parentId) => ({
      type: "child_of",
      to: parentId,
      weight: 1,
      meta: { relationship: "city_parent" },
    })),
    meta: {
      version: 1,
      created_at: now,
      updated_at: now,
      provenance: [`data/cities/${cityMeta.slug}/venues.json`],
      quality_score: null,
    },
  };
}

function migrate() {
  const cityMetadata = buildCityMetadata();
  const cityPlaces = buildCityPlaceIndex();
  const buckets = new Map();
  const countsByCity = {};
  const countsBySubclass = {};
  let total = 0;

  fs.rmSync(OUT_ROOT, { recursive: true, force: true });

  for (const [citySlug, cityMeta] of cityMetadata.entries()) {
    const file = path.join(CITY_PACK_ROOT, citySlug, "venues.json");
    if (!fs.existsSync(file)) continue;
    const pack = readJson(file);
    const cityNode =
      cityPlaces.get(cityMeta.city_scope_slug) ||
      cityPlaces.get(normToken(cityMeta.slug)) ||
      null;

    countsByCity[citySlug] = 0;

    for (const venue of pack.venues || []) {
      const node = mapVenue(cityMeta, cityNode, pack.as_of, venue);
      const shardFile = path.join(
        OUT_ROOT,
        normToken(cityMeta.country_code),
        `${normToken(cityMeta.admin1_code)}.jsonl`,
      );
      if (!buckets.has(shardFile)) buckets.set(shardFile, []);
      buckets.get(shardFile).push(JSON.stringify(node));
      countsByCity[citySlug] += 1;
      countsBySubclass[node.subclass] = (countsBySubclass[node.subclass] || 0) + 1;
      total += 1;
    }
  }

  for (const [file, items] of buckets.entries()) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, `${items.join("\n")}\n`, "utf8");
  }

  console.log(
    JSON.stringify(
      {
        total_venues_migrated: total,
        shard_count: buckets.size,
        counts_by_city: countsByCity,
        counts_by_subclass: countsBySubclass,
      },
      null,
      2,
    ),
  );
}

migrate();
