import type { MetadataRoute } from "next";
import {
  AIRPORT420_INDEXABLE_ROUTE_PATHS,
  getAirport420RouteGovernance,
} from "../lib/route-governance";

const SITE_URL = "https://420friendlyairportpickup.com";

function toAbsolute(pathname: string): string {
  return `${SITE_URL}${pathname}`;
}

export default function sitemap(): MetadataRoute.Sitemap {
  return AIRPORT420_INDEXABLE_ROUTE_PATHS.map((pathname) => {
    const governance = getAirport420RouteGovernance(pathname);
    return {
      url: toAbsolute(pathname),
      lastModified: new Date(),
      changeFrequency: governance?.changeFrequency ?? "monthly",
      priority: governance?.priority ?? 0.7,
    };
  });
}
