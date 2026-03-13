import { getGraphContextForPath } from "@/lib/dcc/graph/context";
import type { EntitySurfaceIndexEntry, SurfaceGraphModule } from "@/lib/dcc/surfaces/types";

export function resolveGraphModule(entity: EntitySurfaceIndexEntry): {
  data: SurfaceGraphModule;
  warning?: string;
} {
  const context = getGraphContextForPath(entity.canonicalPath);
  if (!context) {
    return {
      data: { context: null },
      warning: `Graph context unavailable for ${entity.canonicalPath}`,
    };
  }

  return { data: { context } };
}
