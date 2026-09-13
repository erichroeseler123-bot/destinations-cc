import type { MetadataRoute } from "next";
import { PORTS } from "@/lib/ports";
import { PORT_ACTIVITIES } from "@/lib/portActivities";
import { DECISION_PAGES } from "@/lib/decisionPages";

const SITE = "https://www.lastfrontiershoreexcursions.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE}`, changeFrequency: "daily", priority: 1.0 },
    { url: `${SITE}/about`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE}/tours`, changeFrequency: "weekly", priority: 0.9 },
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

  return [...staticRoutes, ...portRoutes, ...activityRoutes, ...decisionRoutes];
}
