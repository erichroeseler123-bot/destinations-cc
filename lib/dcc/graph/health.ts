import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const GRAPH_INDEX_PATH = path.join(ROOT, "data", "graph", "place-action-index.json");

function safeReadJson<T>(fullPath: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(fullPath, "utf8")) as T;
  } catch {
    return null;
  }
}

export type GraphHealth = {
  exists: boolean;
  places: number;
  edges: number;
  last_build: string | null;
  graph_age_hours: number | null;
  stale: boolean;
  stale_after_hours: number;
};

export function getGraphHealth(maxAgeHours = Number(process.env.DCC_GRAPH_MAX_AGE_HOURS || 24)): GraphHealth {
  const index = safeReadJson<{
    generated_at?: string;
    by_place_id?: Record<string, string>;
    summaries?: Array<{
      action_counts?: { tours?: number; cruises?: number; transport?: number; events?: number };
    }>;
  }>(GRAPH_INDEX_PATH);

  if (!index) {
    return {
      exists: false,
      places: 0,
      edges: 0,
      last_build: null,
      graph_age_hours: null,
      stale: true,
      stale_after_hours: maxAgeHours,
    };
  }

  const places = Object.keys(index.by_place_id || {}).length;
  const edges = (index.summaries || []).reduce((acc, s) => {
    const c = s.action_counts || {};
    return acc + (c.tours || 0) + (c.cruises || 0) + (c.transport || 0) + (c.events || 0);
  }, 0);

  const lastBuild = index.generated_at || null;
  const lastBuildTs = lastBuild ? Date.parse(lastBuild) : NaN;
  const graphAgeHours = Number.isNaN(lastBuildTs) ? null : (Date.now() - lastBuildTs) / (1000 * 60 * 60);
  const stale = graphAgeHours === null ? true : graphAgeHours > maxAgeHours;

  return {
    exists: true,
    places,
    edges,
    last_build: lastBuild,
    graph_age_hours: graphAgeHours,
    stale,
    stale_after_hours: maxAgeHours,
  };
}
