import nodes from "@/data/nodes.json";
import type { DccNode } from "@/lib/dcc/schema";
import { getNodeBySlug as getCanonicalNodeBySlug } from "@/lib/dcc/registry";
import { getDelta, getLatestPlaceEvent, getPlaceEvents } from "@/lib/dcc/memory/resolve";
import { getViatorActionForPlace, type ControlledViatorActionResult } from "@/lib/dcc/internal/viatorAction";
import type { DccDiagnostics } from "@/lib/dcc/diagnostics";
import { buildPlaceActionInventory, type PlaceActionInventory } from "@/lib/dcc/internal/actionInventory";

type LegacyNode = {
  id: string;
  slug: string;
  name: string;
  type: string;
  region: string;
  status: string;
  description: string;
  hub?: string;
  citySlug?: string;
};

export type InternalPlacePayload = {
  place_id: string;
  place_slug: string;
  context: {
    place_name: string;
    status: string;
    risk_summary: {
      risk_level: string;
      level: string;
      trend: string;
      latest_event_type: string | null;
      latest_event_severity: string | null;
      sample_count: number;
    };
    recent_observations: Array<{
      timestamp: string;
      event_type: string;
      severity: string;
      title: string;
      confidence: string;
      source: string[];
      signals: string[];
    }>;
  };
  diagnostics: {
    memory: DccDiagnostics;
    viator: DccDiagnostics;
  };
  action_inventory: PlaceActionInventory;
  action: {
    viator: ControlledViatorActionResult;
  };
};

function renderRegion(node: DccNode): string {
  const a = node.admin;
  return a?.admin1_name || a?.admin1_code || a?.country_name || a?.country_code || "Global";
}

function renderType(node: DccNode): string {
  return node.subclass ? `${node.class}/${node.subclass}` : node.class;
}

function toLegacyNodeShape(node: DccNode): LegacyNode {
  return {
    id: node.id,
    slug: node.slug,
    name: node.display_name || node.name,
    type: renderType(node),
    region: renderRegion(node),
    status: node.status,
    description:
      node.content?.summary ||
      node.content?.long_description_md ||
      `${node.display_name || node.name} travel guide`,
    hub: node.slug,
    citySlug: node.slug,
  };
}

function getNodeBySlug(slug: string): LegacyNode | null {
  const canonical = getCanonicalNodeBySlug(slug);
  if (canonical) return toLegacyNodeShape(canonical);
  const legacy = (nodes as LegacyNode[]).find((n) => n.slug === slug);
  return legacy || null;
}

export async function buildInternalPlacePayload(slug: string): Promise<InternalPlacePayload | null> {
  const node = getNodeBySlug(slug);
  if (!node || node.status !== "active") return null;

  const canonicalPlaceId = typeof node.id === "string" && node.id.startsWith("dcc:") ? node.id : `legacy:${node.slug}`;
  const latest = canonicalPlaceId.startsWith("dcc:") ? getLatestPlaceEvent(canonicalPlaceId) : null;
  const delta = canonicalPlaceId.startsWith("dcc:") ? getDelta(canonicalPlaceId) : null;
  const events = canonicalPlaceId.startsWith("dcc:") ? getPlaceEvents(canonicalPlaceId, 6) : [];
  const viator = await getViatorActionForPlace({
    slug: node.slug,
    name: node.name,
    hub: node.hub,
    citySlug: node.citySlug,
  });
  const actionInventory = await buildPlaceActionInventory({
    slug: node.slug,
    name: node.name,
    hub: node.hub,
    citySlug: node.citySlug,
  });

  return {
    place_id: canonicalPlaceId,
    place_slug: node.slug,
    context: {
      place_name: node.name,
      status: node.status,
      risk_summary: {
        risk_level: latest?.severity || "unknown",
        level: latest?.severity || "unknown",
        trend: delta?.classification || "insufficient_data",
        latest_event_type: latest?.event_type || null,
        latest_event_severity: latest?.severity || null,
        sample_count: delta?.sample_count || 0,
      },
      recent_observations: events.map((event) => ({
        timestamp: event.timestamp,
        event_type: event.event_type,
        severity: event.severity,
        title: event.title,
        confidence: event.confidence,
        source: event.source,
        signals: event.signals,
      })),
    },
    diagnostics: {
      memory: {
        source: "memory",
        cache_status: "bypass",
        stale: false,
        last_updated: latest?.timestamp || null,
        stale_after: null,
        fallback_reason: latest ? null : "no_recent_observations",
      },
      viator: {
        source: viator.source,
        cache_status: viator.cache_status,
        stale: viator.stale,
        last_updated: viator.last_updated,
        stale_after: viator.stale_after,
        fallback_reason: viator.fallback_reason,
      },
    },
    action_inventory: actionInventory,
    action: {
      viator,
    },
  };
}
