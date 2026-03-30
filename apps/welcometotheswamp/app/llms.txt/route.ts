import { SITE_CONFIG } from "@/app/site-config";

export const dynamic = "force-static";

export function GET() {
  const body = [
    "# Welcome to the Swamp",
    "",
    `> ${SITE_CONFIG.mission}`,
    "",
    "## Canonical public sections",
    `${SITE_CONFIG.url}/`,
    `${SITE_CONFIG.url}/start-here`,
    `${SITE_CONFIG.url}/choose-the-right-tour`,
    `${SITE_CONFIG.url}/plan-your-day`,
    `${SITE_CONFIG.url}/what-its-like`,
    `${SITE_CONFIG.url}/from-new-orleans`,
    `${SITE_CONFIG.url}/plan`,
    "",
    "## Machine-readable entry points",
    `${SITE_CONFIG.url}/agent.json`,
    `${SITE_CONFIG.url}/llms.txt`,
    "",
    "## Relationship to DCC",
    "- Welcome to the Swamp explains swamp-tour decisions and expectations.",
    "- Destination Command Center handles broader discovery and shortlist flows.",
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
