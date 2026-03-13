import { getDecisionEnginePageByPath } from "@/src/data/decision-engine-pages";

type GraphLink = { label: string; href: string };

export type GraphContextPayload = {
  nearbyNodes: GraphLink[];
  relatedExperiences: GraphLink[];
  routesFromHere: GraphLink[];
  topThingsNearby: GraphLink[];
  parentHub?: GraphLink;
  siblings: GraphLink[];
};

const OVERRIDES: Record<string, Partial<GraphContextPayload>> = {
  "/cities/denver": {
    parentHub: { label: "Colorado region hub", href: "/regions/colorado" },
    siblings: [
      { label: "Red Rocks venue", href: "/venues/red-rocks-amphitheatre" },
      { label: "Denver ↔ Red Rocks route", href: "/routes/denver-red-rocks" },
    ],
  },
  "/ports/juneau": {
    parentHub: { label: "Alaska destination hub", href: "/alaska" },
    siblings: [
      { label: "Mendenhall Glacier", href: "/attractions/mendenhall-glacier" },
      { label: "Shore excursions lane", href: "/cruises/shore-excursions" },
    ],
  },
  "/venues/red-rocks-amphitheatre": {
    parentHub: { label: "Denver city authority", href: "/cities/denver" },
    siblings: [
      { label: "Denver ↔ Red Rocks route", href: "/routes/denver-red-rocks" },
      { label: "Colorado region hub", href: "/regions/colorado" },
    ],
  },
  "/attractions/mendenhall-glacier": {
    parentHub: { label: "Juneau port authority", href: "/ports/juneau" },
    siblings: [
      { label: "Alaska destination hub", href: "/alaska" },
      { label: "Shore excursions lane", href: "/cruises/shore-excursions" },
    ],
  },
  "/routes/denver-red-rocks": {
    parentHub: { label: "Denver city authority", href: "/cities/denver" },
    siblings: [
      { label: "Red Rocks venue", href: "/venues/red-rocks-amphitheatre" },
      { label: "Colorado region hub", href: "/regions/colorado" },
    ],
  },
};

function uniqueLinks(items: GraphLink[]): GraphLink[] {
  const seen = new Set<string>();
  const out: GraphLink[] = [];
  for (const item of items) {
    if (!item.href.startsWith("/")) continue;
    const key = `${item.href}:${item.label}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

function takeUseful(items: GraphLink[], max: number): GraphLink[] {
  return uniqueLinks(items).filter((item) => item.label.trim().length >= 3).slice(0, max);
}

export function getGraphContextForPath(canonicalPath: string): GraphContextPayload | null {
  const page = getDecisionEnginePageByPath(canonicalPath);
  if (!page) return null;

  const nearbyNodes = takeUseful(page.nearbyThings, 6);
  const relatedExperiences = takeUseful(
    page.relatedExperiences.map((item) => ({ label: item.label, href: item.href })),
    6
  );
  const routesFromHere = takeUseful(
    page.whatToDo
      .filter((item) => item.href)
      .map((item) => ({ label: item.title, href: item.href as string })),
    4
  );
  const topThingsNearby = takeUseful(page.nearbyThings.concat(page.relatedExperiences), 6);

  const override = OVERRIDES[canonicalPath] || {};

  return {
    nearbyNodes,
    relatedExperiences,
    routesFromHere,
    topThingsNearby,
    parentHub: override.parentHub,
    siblings: override.siblings || [],
  };
}
