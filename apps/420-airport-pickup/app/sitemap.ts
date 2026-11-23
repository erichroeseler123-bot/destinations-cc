import type { MetadataRoute } from "next";
import {
  AIRPORT420_INDEXABLE_ROUTE_PATHS,
  getAirport420RouteGovernance,
} from "../lib/route-governance";
import { COLORADO_TRANSFERS } from "@/lib/coloradoTransfers";

const SITE_URL = "https://420friendlyairportpickup.com";

function toAbsolute(pathname: string): string {
  return `${SITE_URL}${pathname}`;
}

const AIRPORT420_SITEMAP_BASELINE = new Date("2026-11-17T00:00:00.000Z");

export default function sitemap(): MetadataRoute.Sitemap {
  const governed = AIRPORT420_INDEXABLE_ROUTE_PATHS.map((pathname) => {
    const governance = getAirport420RouteGovernance(pathname);
    return {
      url: toAbsolute(pathname),
      lastModified: AIRPORT420_SITEMAP_BASELINE,
      changeFrequency: governance?.changeFrequency ?? "monthly",
      priority: governance?.priority ?? 0.7,
    };
  });

  const colorado: MetadataRoute.Sitemap = [
    {
      url: toAbsolute("/colorado"),
      lastModified: AIRPORT420_SITEMAP_BASELINE,
      changeFrequency: "weekly",
      priority: 0.95,
    },
    {
      url: toAbsolute("/colorado-springs-airport"),
      lastModified: AIRPORT420_SITEMAP_BASELINE,
      changeFrequency: "weekly",
      priority: 0.95,
    },
    ...COLORADO_TRANSFERS.map((transfer) => ({
      url: toAbsolute(`/colorado/${transfer.slug}`),
      lastModified: AIRPORT420_SITEMAP_BASELINE,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),
  ];

  return [...governed, ...colorado];
}
