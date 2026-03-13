import type { InternalPlacePayload } from "@/lib/dcc/internal/placePayload";
import { buildInternalPlacePayload } from "@/lib/dcc/internal/placePayload";
import type { PlaceActionGraph } from "@/lib/dcc/graph/placeActionGraph";
import { getPlaceActionGraphBySlug } from "@/lib/dcc/graph/placeActionGraph";
import { getGraphHealth } from "@/lib/dcc/graph/health";

export type PlaceLiveSummary = {
  place_id: string;
  place_slug: string;
  action_counts: {
    tours: number;
    cruises: number;
    transport: number;
    events: number;
  };
  providers: string[];
  trend: string | null;
  latest_event_type: string | null;
  related_places: Array<{
    place_id: string;
    slug: string;
    name: string;
  }>;
  freshness: {
    graph_stale: boolean;
    action_sources_stale: boolean;
  };
  lane_freshness: {
    tours: { stale: boolean; cache_status: string; source: string };
    cruises: { stale: boolean; cache_status: string; source: string };
    events: { stale: boolean; cache_status: string; source: string };
    transport: { stale: boolean; cache_status: string; source: string };
  };
  preview_actions: {
    tours: string[];
    cruises: string[];
    events: string[];
    transport: string[];
  };
};

export function buildPlaceLiveSummaryFromData(input: {
  placePayload: InternalPlacePayload | null;
  placeGraph: PlaceActionGraph | null;
  graphStale: boolean;
}): PlaceLiveSummary | null {
  const { placePayload, placeGraph, graphStale } = input;
  if (!placePayload) return null;

  const counts = placePayload.action_inventory.counts;
  const related = (placeGraph?.related_places || []).map((r) => ({
    place_id: r.place_id,
    slug: r.place_slug || r.place_id,
    name: r.place_name || r.place_slug || r.place_id,
  }));

  const actionSourcesStale = Object.values(placePayload.action_inventory.diagnostics).some((d) => d.stale);
  const laneDiagnostics = placePayload.action_inventory.diagnostics;
  const previewActions = {
    tours: (placeGraph?.actions.tours || []).slice(0, 4).map((a) => a.title),
    cruises: (placeGraph?.actions.cruises || []).slice(0, 4).map((a) => a.title),
    events: (placeGraph?.actions.events || []).slice(0, 4).map((a) => a.title),
    transport: (placeGraph?.actions.transport || []).slice(0, 4).map((a) => a.title),
  };

  return {
    place_id: placePayload.place_id,
    place_slug: placePayload.place_slug,
    action_counts: {
      tours: counts.tours,
      cruises: counts.cruises,
      transport: counts.transport,
      events: counts.events,
    },
    providers: placeGraph?.providers || [],
    trend:
      placeGraph?.observations?.trend ||
      placePayload.context.risk_summary?.trend ||
      null,
    latest_event_type:
      placeGraph?.observations?.latest_event_type ||
      placePayload.context.risk_summary?.latest_event_type ||
      null,
    related_places: related.slice(0, 8),
    freshness: {
      graph_stale: graphStale,
      action_sources_stale: actionSourcesStale,
    },
    lane_freshness: {
      tours: {
        stale: laneDiagnostics.tours.stale,
        cache_status: laneDiagnostics.tours.cache_status,
        source: laneDiagnostics.tours.source,
      },
      cruises: {
        stale: laneDiagnostics.cruises.stale,
        cache_status: laneDiagnostics.cruises.cache_status,
        source: laneDiagnostics.cruises.source,
      },
      events: {
        stale: laneDiagnostics.events.stale,
        cache_status: laneDiagnostics.events.cache_status,
        source: laneDiagnostics.events.source,
      },
      transport: {
        stale: laneDiagnostics.transport.stale,
        cache_status: laneDiagnostics.transport.cache_status,
        source: laneDiagnostics.transport.source,
      },
    },
    preview_actions: previewActions,
  };
}

export async function getPlaceLiveSummary(slug: string): Promise<PlaceLiveSummary | null> {
  const [payload, graph] = await Promise.all([
    buildInternalPlacePayload(slug),
    Promise.resolve(getPlaceActionGraphBySlug(slug)),
  ]);
  const health = getGraphHealth();
  return buildPlaceLiveSummaryFromData({
    placePayload: payload,
    placeGraph: graph,
    graphStale: health.stale,
  });
}
