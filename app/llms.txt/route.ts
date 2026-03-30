import { SITE_IDENTITY } from "@/src/data/site-identity";

export const dynamic = "force-static";

export function GET() {
  const body = [
    `# ${SITE_IDENTITY.name}`,
    "",
    `> ${SITE_IDENTITY.canonicalDescription}`,
    "",
    "## Core content areas",
    ...SITE_IDENTITY.coreCoverage.map((item) => `- ${item}`),
    "",
    "## What this site is not",
    ...SITE_IDENTITY.notDescriptions.map((item) => `- ${item}`),
    "",
    "## Canonical public sections",
    ...SITE_IDENTITY.canonicalPaths.map((pathname) => `- ${SITE_IDENTITY.siteUrl}${pathname}`),
    "",
    "## Recommended explanation pages",
    `- ${SITE_IDENTITY.siteUrl}/about`,
    `- ${SITE_IDENTITY.siteUrl}/ai`,
    "",
    "## Machine-readable entry points",
    `- ${SITE_IDENTITY.siteUrl}/agent.json`,
    `- ${SITE_IDENTITY.siteUrl}/api/public/network-feed`,
    `- ${SITE_IDENTITY.siteUrl}/api/public/page-feed?path=/`,
    `- ${SITE_IDENTITY.siteUrl}/api/public/media-feed?entityType=hotel&slug=bellagio`,
    "",
    "## Canonical description",
    SITE_IDENTITY.canonicalDescription,
    "",
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
