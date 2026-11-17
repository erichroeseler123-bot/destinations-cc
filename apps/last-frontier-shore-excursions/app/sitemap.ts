import type { MetadataRoute } from "next";
import { PORT_ACTIVITIES } from "@/lib/portActivities";
import { DECISION_PAGES } from "@/lib/decisionPages";
import { getAllAlaskaShips } from "@/lib/alaska-ships";
import { getSoutheastAlaskaDirectorySnapshot } from "../../../lib/dcc/shared/southeastAlaskaDirectoryOperatorsAndTours";

const SITE = "https://www.lastfrontiershoreexcursions.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const snapshot = getSoutheastAlaskaDirectorySnapshot();
  const indexableOperatorIds = new Set(
    snapshot.operators
      .filter((o) => o.gate.indexable)
      .map((o) => o.operator.operatorId),
  );

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE}`, changeFrequency: "daily", priority: 1.0 },
    {
      url: `${SITE}/southeast-alaska`,
      lastModified: "2026-11-17",
      changeFrequency: "weekly",
      priority: 0.95,
    },
    {
      url: `${SITE}/ports`,
      lastModified: "2026-11-17",
      changeFrequency: "weekly",
      priority: 0.92,
    },
    {
      url: `${SITE}/operators`,
      lastModified: "2026-11-17",
      changeFrequency: "weekly",
      priority: 0.92,
    },
    { url: `${SITE}/about`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE}/tours`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE}/cruise-ships`, changeFrequency: "daily", priority: 0.95 },
  ];

  // Strictly gate.indexable places ONLY (excludes all 6 held smaller communities!)
  const portRoutes: MetadataRoute.Sitemap = snapshot.places
    .filter((entry) => entry.gate.indexable && entry.place.publicPortSlug)
    .map(({ place }) => ({
      url: `${SITE}/ports/${place.publicPortSlug}`,
      lastModified: place.lastModifiedAt,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    }));

  // Strictly gate.indexable /ports/[portSlug]/[categorySlug] pages ONLY (>=2 operators, >=3 products, substantive comparison)
  const portCategoryRoutes: MetadataRoute.Sitemap = snapshot.portCategories
    .filter((entry) => entry.gate.indexable)
    .map((entry) => ({
      url: `${SITE}/ports/${entry.portSlug}/${entry.category.categorySlug}`,
      lastModified: entry.comparison?.lastModifiedAt || "2026-11-17",
      changeFrequency: "weekly" as const,
      priority: 0.88,
    }));

  // Strictly gate.indexable /operators/[operatorSlug] pages ONLY (excludes all 5 OperatorResearchQueue records!)
  const operatorRoutes: MetadataRoute.Sitemap = snapshot.operators
    .filter((entry) => entry.gate.indexable)
    .map(({ operator }) => ({
      url: `${SITE}/operators/${operator.slug}`,
      lastModified: operator.lastModifiedAt,
      changeFrequency: "weekly" as const,
      priority: 0.88,
    }));

  // Strictly verified, non-held tours operated by gate-passing operators ONLY (excludes aleutian-ballad!)
  const tourRoutes: MetadataRoute.Sitemap = snapshot.tours
    .filter(
      (tour) =>
        !tour.isCommerciallyHeld &&
        Boolean(tour.verifiedAt) &&
        indexableOperatorIds.has(tour.operatorId),
    )
    .map((tour) => ({
      url: `${SITE}/tours/${tour.operatorSlug}/${tour.tourSlug}`,
      lastModified: tour.lastModifiedAt,
      changeFrequency: "weekly" as const,
      priority: 0.84,
    }));

  // Preserve all existing legacy /[port]/[activity], /decision/*, and /cruise-ships/* routes
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
    })),
  );

  // Deduplicate by URL just in case
  const allEntries = [
    ...staticRoutes,
    ...portRoutes,
    ...portCategoryRoutes,
    ...operatorRoutes,
    ...tourRoutes,
    ...activityRoutes,
    ...decisionRoutes,
    ...shipHubRoutes,
    ...shipPortRoutes,
  ];
  const seen = new Set<string>();
  return allEntries.filter((entry) => {
    if (seen.has(entry.url)) return false;
    seen.add(entry.url);
    return true;
  });
}
