import type { MetadataRoute } from "next";
import { GET as getRobotsResponse } from "../../../app/robots.txt/route";

const CANONICAL_SITEMAP = "https://welcometoneworleanstours.com/sitemap.xml";

type RobotsRule = {
  userAgent: string;
  allow?: string[];
  disallow?: string[];
};

function parseRobotsTxt(text: string): MetadataRoute.Robots {
  const blocks = text.trim().split(/\n\s*\n/).map((block) => block.trim()).filter(Boolean);
  const rules: RobotsRule[] = [];

  for (const block of blocks) {
    const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
    const userAgentLine = lines.find((line) => line.toLowerCase().startsWith("user-agent:"));
    if (!userAgentLine) continue;
    const allow = lines.filter((line) => line.toLowerCase().startsWith("allow:")).map((line) => line.slice("allow:".length).trim());
    const disallow = lines.filter((line) => line.toLowerCase().startsWith("disallow:")).map((line) => line.slice("disallow:".length).trim());

    rules.push({
      userAgent: userAgentLine.slice("user-agent:".length).trim(),
      ...(allow.length ? { allow } : {}),
      ...(disallow.length ? { disallow } : {}),
    });
  }

  return { rules, sitemap: CANONICAL_SITEMAP };
}

export default async function robots(): Promise<MetadataRoute.Robots> {
  return parseRobotsTxt(await (await getRobotsResponse()).text());
}
