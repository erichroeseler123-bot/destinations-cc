#!/usr/bin/env node
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const REGISTRY_ROOT = path.join(ROOT, "data", "registry");
const MEMORY_ROOT = path.join(ROOT, "data", "memory");
const ACTION_ROOT = path.join(ROOT, "data", "action");
const GRAPH_ROOT = path.join(ROOT, "data", "graph");
const BY_PLACE_DIR = path.join(GRAPH_ROOT, "by-place");
const INDEX_PATH = path.join(GRAPH_ROOT, "place-action-index.json");
const ATTRACTIONS_PATH = path.join(ROOT, "data", "attractions.json");

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function safeReadJson(fullPath, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(fullPath, "utf8"));
  } catch {
    return fallback;
  }
}

function slugify(input) {
  return String(input || "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function walkJsonl(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const d of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, d.name);
    if (d.isDirectory()) walkJsonl(full, out);
    else if (d.isFile() && full.endsWith(".jsonl")) out.push(full);
  }
  return out;
}

function readPlaceNodes() {
  const placeRoot = path.join(REGISTRY_ROOT, "place");
  const files = walkJsonl(placeRoot);
  const out = [];
  for (const full of files) {
    const lines = fs.readFileSync(full, "utf8").split("\n");
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const node = JSON.parse(line);
        if (node?.class === "place" && node?.id && node?.slug) out.push(node);
      } catch {}
    }
  }
  return out;
}

function readPortNodes() {
  const portRoot = path.join(REGISTRY_ROOT, "port");
  const files = walkJsonl(portRoot);
  const out = [];
  for (const full of files) {
    const lines = fs.readFileSync(full, "utf8").split("\n");
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const node = JSON.parse(line);
        if (node?.class === "port" && node?.id && node?.slug) out.push(node);
      } catch {}
    }
  }
  return out;
}

function readAllNodesById() {
  return safeReadJson(path.join(ROOT, "data", "index", "by-id.json"), {}) || {};
}

function nodePoint(node) {
  const lat = node?.geo?.lat;
  const lon = node?.geo?.lon;
  if (typeof lat === "number" && typeof lon === "number") return { lat, lon };
  const mapped = node?.map?.geometry;
  if (
    mapped?.type === "Point" &&
    Array.isArray(mapped.coordinates) &&
    mapped.coordinates.length >= 2
  ) {
    const [x, y] = mapped.coordinates;
    if (typeof x === "number" && typeof y === "number") return { lat: y, lon: x };
  }
  return null;
}

function haversineKm(aLat, aLon, bLat, bLon) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const r = 6371;
  const dLat = toRad(bLat - aLat);
  const dLon = toRad(bLon - aLon);
  const s1 = Math.sin(dLat / 2);
  const s2 = Math.sin(dLon / 2);
  const aa = s1 * s1 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * s2 * s2;
  const c = 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa));
  return r * c;
}

function readNodeByPointer(pointer) {
  if (!pointer?.file || !pointer?.line) return null;
  const full = path.join(ROOT, pointer.file);
  if (!fs.existsSync(full)) return null;
  const lines = fs.readFileSync(full, "utf8").split("\n");
  const raw = lines[pointer.line - 1];
  if (!raw || !raw.trim()) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function classifyIntentText(text) {
  const t = String(text || "");
  const isEvent = /(show|concert|festival|event|ticket|theater|theatre|performance)/i.test(t);
  const isTransport = /(transport|shuttle|transfer|ferry|bus|train|airport|pickup|dropoff)/i.test(t);
  return { isEvent, isTransport };
}

function mapTourProduct(placeName, p) {
  const title = p.name || p.title || "Experience";
  const url = p.booking_url || p.url || p.viatorUrl || null;
  return {
    id: `viator:${String(p.product_code || p.id || slugify(title))}`,
    title,
    provider: "viator",
    price_from: typeof p.price_from === "number" ? p.price_from : null,
    url,
  };
}

function citySlugFromPortName(portName) {
  return slugify(String(portName || "").split(",")[0] || "");
}

function mapCruiseSailing(s) {
  return {
    id: `cruise:${s.sailing_id}`,
    title: `${s.line} • ${s.ship}`,
    provider: String(s.external_provider || s.line_slug || "cruise"),
    departure_date: s.departure_date || null,
    url: s.external_booking_url || null,
  };
}

function latestEventMap() {
  const rows = safeReadJson(path.join(MEMORY_ROOT, "events", "index.json"), []) || [];
  const byPlace = new Map();
  for (const r of rows) {
    const key = r.place_id;
    if (!key || !r.timestamp) continue;
    const prior = byPlace.get(key);
    if (!prior || Date.parse(r.timestamp) > Date.parse(prior.timestamp)) {
      byPlace.set(key, r);
    }
  }
  return byPlace;
}

function deltaMap() {
  const rows = safeReadJson(path.join(MEMORY_ROOT, "deltas", "index.json"), []) || [];
  const byPlace = new Map();
  for (const r of rows) {
    if (r.place_id) byPlace.set(r.place_id, r);
  }
  return byPlace;
}

function relatedPlacesFor(node, byIdIdx) {
  const out = new Map();
  const add = (id, reason) => {
    if (!id || id === node.id || out.has(`${id}:${reason}`)) return;
    const ptr = byIdIdx[id];
    const related = ptr ? readNodeByPointer(ptr) : null;
    out.set(`${id}:${reason}`, {
      place_id: id,
      place_slug: related?.slug || null,
      place_name: related?.display_name || related?.name || null,
      reason,
    });
  };
  for (const id of node?.travel?.ports || []) add(id, "related_port");
  for (const id of node?.travel?.airports || []) add(id, "related_airport");
  for (const id of node?.travel?.routes || []) add(id, "related_route");
  for (const edge of node.edges || []) {
    if (["near", "served_by", "gateway_to", "related_to", "contains", "contained_in"].includes(edge.type)) {
      add(edge.to, edge.type);
    }
  }
  return Array.from(out.values());
}

function geoRelatedPlacesFor(node, placeGeoRows, portGeoRows) {
  const center = nodePoint(node);
  if (!center) return [];
  const out = [];

  const nearestPlaces = placeGeoRows
    .filter((x) => x.id !== node.id)
    .map((x) => ({
      id: x.id,
      slug: x.slug,
      name: x.name,
      reason: "near_place_geo",
      d: haversineKm(center.lat, center.lon, x.lat, x.lon),
    }))
    .filter((x) => x.d <= 150)
    .sort((a, b) => a.d - b.d || a.slug.localeCompare(b.slug))
    .slice(0, 3);

  const nearestPorts = portGeoRows
    .map((x) => ({
      id: x.id,
      slug: x.slug,
      name: x.name,
      reason: "near_port_geo",
      d: haversineKm(center.lat, center.lon, x.lat, x.lon),
    }))
    .filter((x) => x.d <= 300)
    .sort((a, b) => a.d - b.d || a.slug.localeCompare(b.slug))
    .slice(0, 3);

  for (const x of [...nearestPlaces, ...nearestPorts]) {
    out.push({
      place_id: x.id,
      place_slug: x.slug,
      place_name: x.name,
      reason: x.reason,
      distance_km: Number(x.d.toFixed(1)),
    });
  }
  return out;
}

function build() {
  ensureDir(GRAPH_ROOT);
  ensureDir(BY_PLACE_DIR);

  const places = readPlaceNodes();
  const ports = readPortNodes();
  const byIdIdx = readAllNodesById();
  const viatorCache = safeReadJson(path.join(ACTION_ROOT, "viator.products.cache.json"), {
    places: {},
  });
  const cruiseCache = safeReadJson(path.join(ACTION_ROOT, "cruise.sailings.cache.json"), {
    sailings: [],
  });
  const intentsByPlace = safeReadJson(ATTRACTIONS_PATH, {}) || {};
  const latestEventByPlace = latestEventMap();
  const deltaByPlace = deltaMap();

  const byPlaceId = {};
  const summaries = [];
  let placesWithActions = 0;
  let totalActionEdges = 0;
  const providerSet = new Set();
  const placeGeoRows = places
    .map((p) => {
      const pt = nodePoint(p);
      if (!pt) return null;
      return {
        id: p.id,
        slug: p.slug,
        name: p.display_name || p.name,
        lat: pt.lat,
        lon: pt.lon,
      };
    })
    .filter(Boolean);
  const portGeoRows = ports
    .map((p) => {
      const pt = nodePoint(p);
      if (!pt) return null;
      return {
        id: p.id,
        slug: p.slug,
        name: p.display_name || p.name,
        lat: pt.lat,
        lon: pt.lon,
      };
    })
    .filter(Boolean);

  for (const place of places) {
    const slug = place.slug;
    const matchKeys = new Set([
      slugify(place.slug),
      slugify(place.name),
      slugify(String(place.name || "").split(",")[0] || ""),
      ...((place.aliases || []).map((a) => slugify(a))),
    ]);
    const locality = String(place.slug || "").split("-").slice(0, -1).join("-");
    if (locality) matchKeys.add(slugify(locality));

    const viatorProducts = Object.entries(viatorCache?.places || {})
      .filter(([k]) => matchKeys.has(slugify(k)))
      .flatMap(([, v]) => (Array.isArray(v?.products) ? v.products : []));
    const tours = viatorProducts.map((p) => mapTourProduct(place.name, p));

    const cruises = (cruiseCache.sailings || [])
      .filter(
        (s) =>
          Array.isArray(s.ports) &&
          s.ports.some((p) => matchKeys.has(citySlugFromPortName(p.port_name)))
      )
      .map(mapCruiseSailing);

    const intents = Object.entries(intentsByPlace || {})
      .filter(([k]) => matchKeys.has(slugify(k)))
      .flatMap(([, v]) => (Array.isArray(v) ? v : []));
    const events = [];
    const transport = [];
    for (const it of intents) {
      const text = `${it.title || ""} ${it.query || ""} ${it.description || ""}`;
      const { isEvent, isTransport } = classifyIntentText(text);
      if (isEvent) {
        events.push({
          id: `intent:event:${slugify(it.query || it.title || "item")}`,
          title: it.title || it.query || "Event listing",
          provider: "intent_catalog",
          url: `/tours?city=${encodeURIComponent(slug)}&q=${encodeURIComponent(it.query || it.title || "")}`,
        });
      }
      if (isTransport) {
        transport.push({
          id: `intent:transport:${slugify(it.query || it.title || "item")}`,
          title: it.title || it.query || "Transport service",
          provider: "intent_catalog",
          url: `/tours?city=${encodeURIComponent(slug)}&q=${encodeURIComponent(it.query || it.title || "")}`,
        });
      }
    }

    const providers = new Set();
    for (const x of tours) providers.add(x.provider);
    for (const x of cruises) providers.add(x.provider);
    for (const x of events) providers.add(x.provider);
    for (const x of transport) providers.add(x.provider);

    const latest = latestEventByPlace.get(place.id) || null;
    const delta = deltaByPlace.get(place.id) || null;

    const relatedPlaces = (() => {
      const explicit = relatedPlacesFor(place, byIdIdx);
      const geo = geoRelatedPlacesFor(place, placeGeoRows, portGeoRows);
      const dedup = new Map();
      for (const row of [...explicit, ...geo]) {
        const key = `${row.place_id}:${row.reason}`;
        if (!dedup.has(key)) dedup.set(key, row);
      }
      return Array.from(dedup.values()).slice(0, 8);
    })();

    const graph = {
      place_id: place.id,
      place_slug: slug,
      place_name: place.display_name || place.name,
      actions: {
        tours,
        cruises,
        transport,
        events,
      },
      providers: Array.from(providers),
      observations: {
        latest_event_type: latest?.event_type || null,
        latest_event_severity: latest?.severity || null,
        trend: delta?.classification || "insufficient_data",
      },
      related_places: relatedPlaces,
      counts: {
        tours: tours.length,
        cruises: cruises.length,
        transport: transport.length,
        events: events.length,
      },
      edges: [
        ...tours.map((t) => ({
          type: "available_in",
          from: place.id,
          to: t.id,
          meta: { vertical: "tours", provider: t.provider },
        })),
        ...cruises.map((c) => ({
          type: "available_in",
          from: place.id,
          to: c.id,
          meta: { vertical: "cruises", provider: c.provider },
        })),
        ...transport.map((t) => ({
          type: "available_in",
          from: place.id,
          to: t.id,
          meta: { vertical: "transport", provider: t.provider },
        })),
        ...events.map((e) => ({
          type: "available_in",
          from: place.id,
          to: e.id,
          meta: { vertical: "events", provider: e.provider },
        })),
        ...(latest?.event_type
          ? [
              {
                type: "affected_by",
                from: place.id,
                to: `memory:${latest.event_type}`,
                meta: { severity: latest.severity || null },
              },
            ]
          : []),
        ...relatedPlaces.map((r) => ({
          type: "related_to",
          from: place.id,
          to: r.place_id,
          meta: { reason: r.reason },
        })),
      ],
    };

    const hasActions =
      graph.counts.tours > 0 ||
      graph.counts.cruises > 0 ||
      graph.counts.transport > 0 ||
      graph.counts.events > 0;
    if (hasActions) placesWithActions += 1;
    totalActionEdges += graph.edges.filter((e) => e.type === "available_in").length;
    for (const p of graph.providers) {
      if (p) providerSet.add(p);
    }

    const relPath = `data/graph/by-place/${slug}.json`;
    const fullPath = path.join(ROOT, relPath);
    fs.writeFileSync(fullPath, JSON.stringify(graph, null, 2));
    byPlaceId[place.id] = relPath;

    summaries.push({
      place_id: graph.place_id,
      place_slug: graph.place_slug,
      title: graph.place_name,
      trend: graph.observations.trend,
      latest_event: graph.observations.latest_event_type,
      action_counts: graph.counts,
      top_providers: graph.providers.slice(0, 5),
    });
  }

  const index = {
    generated_at: new Date().toISOString(),
    version: 1,
    by_place_id: byPlaceId,
    summaries: summaries.sort((a, b) => {
      const scoreA =
        a.action_counts.tours + a.action_counts.cruises + a.action_counts.transport + a.action_counts.events;
      const scoreB =
        b.action_counts.tours + b.action_counts.cruises + b.action_counts.transport + b.action_counts.events;
      return scoreB - scoreA || a.title.localeCompare(b.title);
    }),
  };
  fs.writeFileSync(INDEX_PATH, JSON.stringify(index, null, 2));
  console.log("Graph Build Summary");
  console.log("-------------------");
  console.log(`Places: ${places.length}`);
  console.log(`Places with actions: ${placesWithActions}`);
  console.log(`Total action edges: ${totalActionEdges}`);
  console.log(`Providers represented: ${providerSet.size}`);
}

build();
