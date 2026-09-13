import type { MetadataRoute } from "next";
import { buildWtonotSitemapPaths } from "../../../app/sitemap.xml/route";

const CANONICAL_ORIGIN = "https://www.welcometoneworleanstours.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = buildWtonotSitemapPaths();
  return paths.map((path) => ({
    url: `${CANONICAL_ORIGIN}${path === "/" ? "" : path}`,
    lastModified: new Date("2026-09-13T00:00:00.000Z"),
    changeFrequency: "weekly" as const,
    priority: path === "/" ? 1.0 : path.startsWith("/tours/") ? 0.8 : 0.7,
  }));
}
