import { getRootPathsByPublishState, getRootRouteGovernance } from "@/src/data/route-governance";

export const VISIBLE_SURFACE_PATHS = getRootPathsByPublishState(
  "indexable",
  "promoted",
).filter((pathname) => getRootRouteGovernance(pathname)?.networkRole !== "utility");

export const PRIMARY_CORRIDOR_PATH = "/red-rocks-transportation";

export const FEEDER_HUB_PATH = "/red-rocks-transportation";

export const FEEDER_RULES = {
  "/red-rocks-shuttle": {
    question: "Should I solve Red Rocks with a shuttle instead of improvising parking or rideshare?",
    hubPath: FEEDER_HUB_PATH,
  },
  "/red-rocks-parking": {
    question: "Is parking actually worth the friction, or should I move into the transport lane?",
    hubPath: FEEDER_HUB_PATH,
  },
} as const;

const VISIBLE_SURFACE_SET = new Set<string>(VISIBLE_SURFACE_PATHS);

export function isVisibleSurfacePath(pathname: string): boolean {
  return VISIBLE_SURFACE_SET.has(pathname);
}
