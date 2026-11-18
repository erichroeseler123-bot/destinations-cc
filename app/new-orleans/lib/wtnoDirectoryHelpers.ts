import { NEW_ORLEANS_CATEGORIES, NEW_ORLEANS_PLACES } from "@/lib/dcc/shared/newOrleansDirectoryData";
import type { NewOrleansPlaceType } from "@/lib/dcc/shared/newOrleansDirectoryExtensionContract";

export const OBSOLETE_WTNO_TOUR_PATH_MAP: Readonly<Record<string, string>> = {
  "/tours/oak-alley-plantation-tour": "/tours/oak-alley-plantation-tour-grey-line",
  "/tours/city-tour-three-hour": "/tours/city-tour-of-new-orleans",
};

/**
 * Normalizes obsolete DCC product public paths to canonical WTNO 200-OK tour routes,
 * preserving any query string or hash fragment.
 */
export function normalizeWtnoTourPath(path: string): string {
  const trimmed = path.trim();
  if (!trimmed) return trimmed;

  const qIdx = trimmed.indexOf("?");
  const hIdx = trimmed.indexOf("#");
  const splitIdx =
    qIdx === -1 ? hIdx : hIdx === -1 ? qIdx : Math.min(qIdx, hIdx);

  const rawPathname = splitIdx === -1 ? trimmed : trimmed.slice(0, splitIdx);
  const suffix = splitIdx === -1 ? "" : trimmed.slice(splitIdx);
  const normalizedPathname =
    rawPathname.length > 1 ? rawPathname.replace(/\/+$/, "") : rawPathname;

  const replacement = OBSOLETE_WTNO_TOUR_PATH_MAP[normalizedPathname];
  return replacement ? `${replacement}${suffix}` : trimmed;
}

const SHORT_HUMAN_PLACE_LABELS: Readonly<Record<string, string>> = {
  "french-quarter": "French Quarter",
  "mississippi-riverfront": "Mississippi Riverfront & Wharves",
  "garden-district": "Garden District",
  "warehouse-district": "Warehouse / Arts District",
  marigny: "Faubourg Marigny",
  treme: "Tremé & Congo Square",
  "honey-island": "Honey Island & Slidell",
  "jean-lafitte": "Jean Lafitte & Barataria",
  manchac: "Manchac Swamp & LaPlace",
  "river-road": "Great River Road",
  "whitney-plantation": "Whitney Plantation Museum",
  "oak-alley-plantation": "Oak Alley Plantation",
  "laura-plantation": "Laura Plantation",
  "erato-street-cruise-terminal": "Erato St Cruise Terminal",
  "julia-street-cruise-terminal": "Julia St Cruise Terminal",
  "msy-airport-corridor": "MSY Airport Corridor",
};

/**
 * Resolves a canonical place slug or `place:*` ID to a human-readable place name
 * so raw URL slugs like `/areas/jean-lafitte` never appear in traveler prose.
 */
export function resolveHumanPlaceName(slugOrPlaceId: string, short = true): string {
  const cleanSlug = slugOrPlaceId
    .trim()
    .toLowerCase()
    .replace(/^\/areas\//, "")
    .replace(/^place:/, "");

  if (short && SHORT_HUMAN_PLACE_LABELS[cleanSlug]) {
    return SHORT_HUMAN_PLACE_LABELS[cleanSlug];
  }

  const match = NEW_ORLEANS_PLACES.find(
    (p) =>
      p.publicPlaceSlug?.toLowerCase() === cleanSlug ||
      p.placeId.toLowerCase() === `place:${cleanSlug}`,
  );
  if (match) return match.name;

  return cleanSlug
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function resolveHumanCategoryName(categorySlug: string): string {
  const match = NEW_ORLEANS_CATEGORIES.find((c) => c.categorySlug === categorySlug);
  return match ? match.shortLabel || match.name : categorySlug;
}

export type WnoPlaceFilterCategory =
  | "all"
  | "swamp-basins"
  | "walkable-neighborhoods"
  | "river-road-history"
  | "cruise-and-airport";

export function classifyWnoPlaceFilterGroup(
  placeType: NewOrleansPlaceType,
): Exclude<WnoPlaceFilterCategory, "all"> {
  switch (placeType) {
    case "bayou_or_wetland_corridor":
      return "swamp-basins";
    case "river_road_heritage_corridor":
    case "historic_site_or_museum":
      return "river-road-history";
    case "cruise_turnaround_terminal":
    case "airport_transfer_corridor":
      return "cruise-and-airport";
    case "urban_neighborhood":
    case "riverfront_wharf_or_dock":
    default:
      return "walkable-neighborhoods";
  }
}

const STOP_WORDS = new Set(["the", "of", "and", "in", "at", "a", "an", "for", "to"]);

/**
 * Computes 1–2 uppercase neutral monogram initials for an operator without
 * mimicking or implying an official company trademark/logo.
 */
export function computeOperatorMonogramInitials(operatorName: string): string {
  const tokens = operatorName
    .replace(/['’]/g, "")
    .split(/[^A-Za-z0-9]+/)
    .map((t) => t.trim())
    .filter(Boolean);

  const meaningful = tokens.filter((t) => !STOP_WORDS.has(t.toLowerCase()));
  const source = meaningful.length > 0 ? meaningful : tokens;
  if (source.length === 0) return "NO";
  if (source.length === 1) return source[0].slice(0, 2).toUpperCase();
  return `${source[0][0]}${source[1][0]}`.toUpperCase();
}

/**
 * Recognizes Welcome to New Orleans Tours across production domains,
 * Vercel preview deployment URLs (`welcometoneworleanstours-*.vercel.app`),
 * and explicit site overrides while keeping DCC (`destinationcommandcenter.com`) distinct.
 */
export function isWtnoHost(host: string | null | undefined, forceWto = false): boolean {
  if (forceWto) return true;
  const h = (host || "").trim().toLowerCase().split(":")[0];
  if (!h) return false;
  return (
    h === "welcometoneworleanstours.com" ||
    h === "www.welcometoneworleanstours.com" ||
    h.includes("welcometoneworleans")
  );
}

