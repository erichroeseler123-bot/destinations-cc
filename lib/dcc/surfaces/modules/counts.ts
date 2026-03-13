import { listPlaceGraphSummaries } from "@/lib/dcc/graph/placeActionGraph";
import type { EntitySurfaceIndexEntry, SurfaceCountsModule } from "@/lib/dcc/surfaces/types";

const graphSummaryBySlug = new Map(
  listPlaceGraphSummaries(5000).map((row) => [row.place_slug, row])
);

export function resolveCountsModule(entity: EntitySurfaceIndexEntry): {
  data: SurfaceCountsModule;
  warning?: string;
} {
  const slugKey = entity.placeGraphSlug || entity.slug;
  const match = graphSummaryBySlug.get(slugKey) || null;

  if (!match) {
    return {
      data: {
        placeGraph: null,
        totals: { tours: null, cruises: null, transport: null, events: null },
      },
      warning: `No place-action summary mapped for ${entity.key} (lookup: ${slugKey})`,
    };
  }

  return {
    data: {
      placeGraph: match,
      totals: {
        tours: match.action_counts.tours,
        cruises: match.action_counts.cruises,
        transport: match.action_counts.transport,
        events: match.action_counts.events,
      },
    },
  };
}
