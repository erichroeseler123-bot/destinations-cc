import type { MetadataRoute } from "next";
import { PORTS } from "@/lib/ports";

const SITE = "https://lastfrontiershoreexcursions.com";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE}/`, changeFrequency: "weekly", priority: 1 },
    ...PORTS.map((port) => ({
      url: `${SITE}/ports/${port.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),
  ];
}
