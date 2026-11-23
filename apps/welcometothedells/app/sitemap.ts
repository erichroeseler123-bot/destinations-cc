import type { MetadataRoute } from "next";
import {
  getWelcomeToTheDellsRouteGovernance,
  WELCOME_TO_THE_DELLS_INDEXABLE_ROUTE_PATHS,
} from "@/lib/route-governance";
import { SITE_URL } from "@/lib/content";

function toAbsolute(pathname: string): string {
  return `${SITE_URL}${pathname}`;
}

const DELLS_SITEMAP_BASELINE = new Date("2026-11-17T00:00:00.000Z");

export default function sitemap(): MetadataRoute.Sitemap {
  return WELCOME_TO_THE_DELLS_INDEXABLE_ROUTE_PATHS.map((pathname) => {
    const governance = getWelcomeToTheDellsRouteGovernance(pathname);
    return {
      url: toAbsolute(pathname),
      lastModified: DELLS_SITEMAP_BASELINE,
      changeFrequency: governance?.changeFrequency ?? "monthly",
      priority: governance?.priority ?? 0.7,
    };
  });
}

