import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/ports/",
          "/decision/",
          "/tours",
          "/about",
          "/agent.json",
          "/llms.txt",
        ],
        disallow: [
          "/api/",
          "/*?*",
        ],
      },
    ],
    sitemap: "https://www.lastfrontiershoreexcursions.com/sitemap.xml",
  };
}
