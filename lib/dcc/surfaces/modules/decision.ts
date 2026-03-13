import { getDecisionEnginePageByPath } from "@/src/data/decision-engine-pages";
import type { EntitySurfaceIndexEntry, SurfaceDecisionModule } from "@/lib/dcc/surfaces/types";

export function resolveDecisionModule(entity: EntitySurfaceIndexEntry): {
  data: SurfaceDecisionModule;
  warning?: string;
} {
  const page = getDecisionEnginePageByPath(entity.canonicalPath);
  if (!page) {
    return {
      data: { page: null },
      warning: `Decision engine page missing for ${entity.canonicalPath}`,
    };
  }

  return { data: { page } };
}
