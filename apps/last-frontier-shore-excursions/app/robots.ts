import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production") {
    return {
      rules: [
        {
          userAgent: "*",
          disallow: "/",
        },
      ],
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/southeast-alaska",
          "/ports/",
          "/operators/",
          "/guides/",
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
