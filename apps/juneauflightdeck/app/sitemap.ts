import type { MetadataRoute } from "next";
import { ALASKA_CRUISE_FLEET } from "../lib/alaskaCruiseFleet";

const coreHighIntentRoutes = [
  { path: "", changeFrequency: "daily" as const, priority: 1.0 },
  { path: "/helicopter", changeFrequency: "daily" as const, priority: 0.95 },
  { path: "/juneau-helicopter-tour-sold-out", changeFrequency: "daily" as const, priority: 0.95 },
  { path: "/temsco-vs-coastal-vs-northstar-juneau", changeFrequency: "weekly" as const, priority: 0.9 },
  { path: "/temsco-vs-northstar-juneau", changeFrequency: "weekly" as const, priority: 0.88 },
  { path: "/temsco-vs-coastal-juneau", changeFrequency: "weekly" as const, priority: 0.88 },
  { path: "/helicopter-waitlist", changeFrequency: "daily" as const, priority: 0.9 },
  { path: "/juneau-dogsled-helicopter-tours", changeFrequency: "daily" as const, priority: 0.9 },
  { path: "/best-time-for-glacier-dog-sledding-juneau", changeFrequency: "weekly" as const, priority: 0.85 },
  { path: "/juneau-helicopter-tour-weight-limits-and-seating", changeFrequency: "weekly" as const, priority: 0.85 },
  { path: "/tools", changeFrequency: "daily" as const, priority: 0.9 },
  { path: "/juneau-glacier-flight-weather", changeFrequency: "daily" as const, priority: 0.9 },
  { path: "/juneau/cruise-excursions-vs-independent", changeFrequency: "weekly" as const, priority: 0.85 },
  { path: "/juneau/what-to-do-if-helicopter-tour-canceled", changeFrequency: "weekly" as const, priority: 0.85 },
  { path: "/juneau-whale-watching-tours", changeFrequency: "weekly" as const, priority: 0.8 },
  { path: "/juneau/helicopter", changeFrequency: "weekly" as const, priority: 0.8 },
  { path: "/skagway/helicopter", changeFrequency: "daily" as const, priority: 0.85 },
  { path: "/what-to-do-in-juneau-cruise-port", changeFrequency: "weekly" as const, priority: 0.75 },
  { path: "/about", changeFrequency: "monthly" as const, priority: 0.5 },
  { path: "/faq", changeFrequency: "monthly" as const, priority: 0.6 },
  { path: "/contact", changeFrequency: "monthly" as const, priority: 0.5 },
  { path: "/privacy-policy", changeFrequency: "monthly" as const, priority: 0.3 },
  { path: "/terms", changeFrequency: "monthly" as const, priority: 0.3 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const coreEntries: MetadataRoute.Sitemap = coreHighIntentRoutes.map((r) => ({
    url: `https://juneauflightdeck.com${r.path}`,
    lastModified,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  const shipEntries: MetadataRoute.Sitemap = ALASKA_CRUISE_FLEET.map((ship) => ({
    url: `https://juneauflightdeck.com/helicopter-waitlist/${ship.slug}`,
    lastModified,
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  return [...coreEntries, ...shipEntries];
}
