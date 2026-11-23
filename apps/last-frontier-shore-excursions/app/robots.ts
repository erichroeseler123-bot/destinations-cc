import type { MetadataRoute } from "next";
import { buildParasiteBotRobotsRules } from "../../../lib/dcc/botPolicy";

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
          "/southeast-alaska/fishing-lodges",
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
      ...buildParasiteBotRobotsRules(),
    ],
    sitemap: "https://www.lastfrontiershoreexcursions.com/sitemap.xml",
  };
}
