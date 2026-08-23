import {
  DCC_PORTFOLIO_RELATIONSHIPS,
  DCC_PORTFOLIO_SITES,
  DCC_SITE_CONTRACT,
} from "@/lib/dcc/portfolioRegistry";

export const revalidate = 300;

export function GET() {
  return Response.json(
    {
      spec: DCC_SITE_CONTRACT.spec,
      version: DCC_SITE_CONTRACT.version,
      generated_at: new Date().toISOString(),
      graph_role: "canonical_public_portfolio_directory",
      sites: DCC_PORTFOLIO_SITES,
      relationships: DCC_PORTFOLIO_RELATIONSHIPS,
      guidance: {
        authority_rule:
          "Use each property's own public pages and machine endpoints as the authority for site-specific facts; use DCC for canonical identity and cross-property relationships.",
        privacy_rule:
          "This feed contains public portfolio relationships only. It must not expose private customer data, unpublished inventory, secrets, or internal strategy.",
      },
    },
    {
      headers: {
        "Cache-Control": "public, max-age=300, s-maxage=300, stale-while-revalidate=600",
        "Access-Control-Allow-Origin": "*",
      },
    },
  );
}
