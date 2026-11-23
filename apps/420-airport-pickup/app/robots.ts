import type { MetadataRoute } from "next";

const BLOCKED_PARASITE_CRAWLERS = [
  "Bytespider",
  "AhrefsBot",
  "AhrefsSiteAudit",
  "SemrushBot",
  "SplitSignalBot",
  "SiteAuditBot",
  "MJ12bot",
  "DotBot",
  "BLEXBot",
  "PetalBot",
  "DataForSeoBot",
  "SerpstatBot",
  "SEOkicks",
  "Barkrowler",
  "MegaIndex",
  "Sogou",
  "ZoominfoBot",
  "TurnitinBot",
  "CensysInspect",
] as const;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
      },
      ...BLOCKED_PARASITE_CRAWLERS.map((userAgent) => ({
        userAgent,
        disallow: "/",
      })),
    ],
    sitemap: "https://420friendlyairportpickup.com/sitemap.xml",
  };
}
