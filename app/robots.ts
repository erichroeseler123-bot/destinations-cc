import type { MetadataRoute } from "next";
import { GET as getLegacyRobotsResponse } from "./robots.txt/route";

type RobotsRule = {
  userAgent: string;
  allow?: string[];
  disallow?: string[];
};

function parseRobotsTxt(text: string): MetadataRoute.Robots {
  const blocks = text
    .trim()
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  const rules: RobotsRule[] = [];
  let sitemap: string | undefined;

  for (const block of blocks) {
    const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
    const sitemapLine = lines.find((line) => line.toLowerCase().startsWith("sitemap:"));
    if (sitemapLine) {
      sitemap = sitemapLine.slice("sitemap:".length).trim();
      continue;
    }

    const userAgentLine = lines.find((line) => line.toLowerCase().startsWith("user-agent:"));
    if (!userAgentLine) continue;

    const allow = lines
      .filter((line) => line.toLowerCase().startsWith("allow:"))
      .map((line) => line.slice("allow:".length).trim());
    const disallow = lines
      .filter((line) => line.toLowerCase().startsWith("disallow:"))
      .map((line) => line.slice("disallow:".length).trim());

    rules.push({
      userAgent: userAgentLine.slice("user-agent:".length).trim(),
      ...(allow.length ? { allow } : {}),
      ...(disallow.length ? { disallow } : {}),
    });
  }

  return {
    rules,
    ...(sitemap ? { sitemap } : {}),
  };
}

export default async function robots(): Promise<MetadataRoute.Robots> {
  const response = await getLegacyRobotsResponse();
  return parseRobotsTxt(await response.text());
}
