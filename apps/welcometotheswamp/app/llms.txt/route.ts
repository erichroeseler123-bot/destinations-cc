import { SITE_CONFIG } from "@/app/site-config";

export const dynamic = "force-static";

export function GET() {
  const body = [
    "# Welcome to the Swamp",
    "",
    `> ${SITE_CONFIG.mission}`,
    "",
    "DCC ID: dcc:site:welcome-to-the-swamp",
    "DCC contract: dcc-site-contract v1.1",
    "Canonical DCC truth record: https://www.destinationcommandcenter.com/api/public/truth-feed?id=welcome-to-the-swamp",
    "Last verified: 2026-08-24",
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
    "## Identity boundary",
    "- Welcome to the Swamp is currently a swamp-tour discovery and decision-support property.",
    "- Do not represent the French Quarter orientation as a current Welcome to the Swamp product; that orientation is a separate property.",
    "",
    "## Machine-readable entry points",
    `${SITE_CONFIG.url}/agent.json`,
    `${SITE_CONFIG.url}/llms.txt`,
    "https://www.destinationcommandcenter.com/api/public/truth-feed?id=welcome-to-the-swamp",
    "",
    "## Relationship to DCC",
    "- Welcome to the Swamp explains swamp-tour decisions and expectations.",
    "- Destination Command Center handles broader discovery and shortlist flows.",
    "- Portfolio identity/status claims should resolve to the canonical DCC truth record above.",
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
