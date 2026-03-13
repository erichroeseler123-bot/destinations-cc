import fs from "fs";
import path from "path";
import { getNodeById, getNodeBySlugInClass, getNodesByAlias } from "@/lib/dcc/registry";

const ROOT = process.cwd();
const GRAPH_ROOT = path.join(ROOT, "data", "graph");
const BY_PLACE_DIR = path.join(GRAPH_ROOT, "by-place");
const INDEX_PATH = path.join(GRAPH_ROOT, "place-action-index.json");

export type PlaceActionGraphEdgeType =
  | "available_in"
  | "departs_from"
  | "operated_by"
  | "bookable_via"
  | "affected_by"
  | "related_to";

export type PlaceActionGraphActionItem = {
  id: string;
  title: string;
  provider: string;
  price_from?: number | null;
  departure_date?: string | null;
  url?: string | null;
};

export type PlaceActionGraph = {
  place_id: string;
  place_slug: string;
  place_name: string;
  actions: {
    tours: PlaceActionGraphActionItem[];
    cruises: PlaceActionGraphActionItem[];
    transport: PlaceActionGraphActionItem[];
    events: PlaceActionGraphActionItem[];
  };
  providers: string[];
  observations: {
    latest_event_type: string | null;
    latest_event_severity: string | null;
    trend: string;
  };
  related_places: Array<{
    place_id: string;
    place_slug?: string | null;
    place_name?: string | null;
    reason: string;
  }>;
  counts: {
    tours: number;
    cruises: number;
    transport: number;
    events: number;
  };
  edges: Array<{
    type: PlaceActionGraphEdgeType;
    from: string;
    to: string;
    meta?: Record<string, unknown>;
  }>;
};

export type PlaceDiscoveryCard = {
  place_id: string;
  place_slug: string;
  title: string;
  trend: string;
  latest_event: string | null;
  action_counts: {
    tours: number;
    cruises: number;
    transport: number;
    events: number;
  };
  top_providers: string[];
};

type PlaceActionGraphIndex = {
  generated_at: string;
  version: number;
  by_place_id: Record<string, string>;
  summaries: PlaceDiscoveryCard[];
};

function safeReadJson<T>(fullPath: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(fullPath, "utf8")) as T;
  } catch {
    return null;
  }
}

function loadGraphIndex(): PlaceActionGraphIndex | null {
  return safeReadJson<PlaceActionGraphIndex>(INDEX_PATH);
}

function normalizeCard(graph: PlaceActionGraph): PlaceDiscoveryCard {
  return {
    place_id: graph.place_id,
    place_slug: graph.place_slug,
    title: graph.place_name,
    trend: graph.observations.trend,
    latest_event: graph.observations.latest_event_type,
    action_counts: {
      tours: graph.counts.tours,
      cruises: graph.counts.cruises,
      transport: graph.counts.transport,
      events: graph.counts.events,
    },
    top_providers: graph.providers.slice(0, 5),
  };
}

export function getPlaceActionGraph(placeId: string): PlaceActionGraph | null {
  const index = loadGraphIndex();
  if (!index) return null;
  const rel = index.by_place_id[placeId];
  if (!rel) return null;
  const fullPath = path.join(ROOT, rel);
  return safeReadJson<PlaceActionGraph>(fullPath);
}

export function getPlaceActionGraphBySlug(slug: string): PlaceActionGraph | null {
  const placeNode =
    getNodeBySlugInClass(slug, "place") ||
    getNodesByAlias(slug).find((n) => n.class === "place") ||
    null;
  if (!placeNode) return null;
  return getPlaceActionGraph(placeNode.id);
}

export function listPlaceGraphSummaries(limit = 200): PlaceDiscoveryCard[] {
  const index = loadGraphIndex();
  if (index?.summaries?.length) return index.summaries.slice(0, limit);

  const out: PlaceDiscoveryCard[] = [];
  if (!fs.existsSync(BY_PLACE_DIR)) return out;
  for (const name of fs.readdirSync(BY_PLACE_DIR)) {
    if (!name.endsWith(".json")) continue;
    const graph = safeReadJson<PlaceActionGraph>(path.join(BY_PLACE_DIR, name));
    if (!graph) continue;
    out.push(normalizeCard(graph));
    if (out.length >= limit) break;
  }
  return out;
}

export function buildPlaceRelatedNodes(placeId: string): Array<{
  place_id: string;
  place_slug?: string | null;
  place_name?: string | null;
  reason: string;
}> {
  const node = getNodeById(placeId);
  if (!node) return [];
  const out = new Map<string, { place_id: string; place_slug?: string | null; place_name?: string | null; reason: string }>();

  const add = (id: string, reason: string) => {
    if (!id || id === placeId || out.has(`${id}:${reason}`)) return;
    const n = getNodeById(id);
    out.set(`${id}:${reason}`, {
      place_id: id,
      place_slug: n?.slug || null,
      place_name: n?.display_name || n?.name || null,
      reason,
    });
  };

  for (const id of node.travel?.ports || []) add(id, "related_port");
  for (const id of node.travel?.airports || []) add(id, "related_airport");
  for (const id of node.travel?.routes || []) add(id, "related_route");
  for (const edge of node.edges || []) {
    if (["near", "served_by", "gateway_to", "related_to", "contains", "contained_in"].includes(edge.type)) {
      add(edge.to, edge.type);
    }
  }
  return Array.from(out.values());
}

export function buildPlaceDiscoveryCard(placeId: string): PlaceDiscoveryCard | null {
  const graph = getPlaceActionGraph(placeId);
  if (!graph) return null;
  return normalizeCard(graph);
}
