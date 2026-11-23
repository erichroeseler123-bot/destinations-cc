import type { MetadataRoute } from "next";
import { buildParasiteBotRobotsRules } from "../../../lib/dcc/botPolicy";

export default function robots(): MetadataRoute.Robots {
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production") {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/viator/reviews/", "/api/protected/", "/api/internal/"],
      },
      ...buildParasiteBotRobotsRules(),
    ],
    sitemap: "https://juneauflightdeck.com/sitemap.xml",
    host: "https://juneauflightdeck.com",
  };
}
