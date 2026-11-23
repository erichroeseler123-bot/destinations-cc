import type { MetadataRoute } from "next";
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
    sitemap: "https://420friendlyairportpickup.com/sitemap.xml",
  };
}
