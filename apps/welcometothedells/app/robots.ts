import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/content";
import { buildParasiteBotRobotsRules } from "../../../lib/dcc/botPolicy";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
      },
      ...buildParasiteBotRobotsRules(),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}

