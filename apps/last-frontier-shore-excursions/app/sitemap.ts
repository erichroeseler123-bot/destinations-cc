import type { MetadataRoute } from "next";
import { PORTS } from "@/lib/ports";
import { PORT_ACTIVITIES } from "@/lib/portActivities";
import { DECISION_PAGES } from "@/lib/decisionPages";
import { getAllAlaskaShips } from "@/lib/alaska-ships";

const SITE = "https://www.lastfrontiershoreexcursions.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE}`, changeFrequency: "daily", priority: 1.0 },
    { url: `${SITE}/about`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE}/tours`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE}/cruise-ships`, changeFrequency: "daily", priority: 0.95 },
  ];

  const portRoutes: MetadataRoute.Sitemap = PORTS.map((port) => ({
    url: `${SITE}/ports/${port.slug}`,
    changeFrequency: "weekly",
    priority: 0.9,
  }));

  const activityRoutes: MetadataRoute.Sitemap = PORT_ACTIVITIES.map((act) => ({
    url: `${SITE}/${act.portSlug}/${act.slug}`,
    changeFrequency: "weekly",
    priority: 0.85,
  }));

  const decisionRoutes: MetadataRoute.Sitemap = DECISION_PAGES.map((d) => ({
    url: `${SITE}/decision/${d.slug}`,
    changeFrequency: "weekly",
    priority: 0.85,
  }));

  const ships = getAllAlaskaShips();

  const shipHubRoutes: MetadataRoute.Sitemap = ships.map((ship) => ({
    url: `${SITE}/cruise-ships/${ship.slug}`,
    changeFrequency: "weekly",
    priority: 0.9,
  }));

  const shipPortRoutes: MetadataRoute.Sitemap = ships.flatMap((ship) =>
    Object.keys(ship.ports).map((portSlug) => ({
      url: `${SITE}/cruise-ships/${ship.slug}/${portSlug}-shore-excursions`,
      changeFrequency: "weekly",
      priority: 0.85,
    }))
  );

  return [
    ...staticRoutes,
    ...portRoutes,
    ...activityRoutes,
    ...decisionRoutes,
    ...shipHubRoutes,
    ...shipPortRoutes,
  ];
}
