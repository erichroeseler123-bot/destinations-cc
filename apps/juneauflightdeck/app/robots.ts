import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: "https://juneauflightdeck.com/sitemap.xml",
    host: "https://juneauflightdeck.com",
  };
}
