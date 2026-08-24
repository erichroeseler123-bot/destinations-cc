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
      truth_feed: DCC_SITE_CONTRACT.truthFeedUrl,
      sites: DCC_PORTFOLIO_SITES,
      relationships: DCC_PORTFOLIO_RELATIONSHIPS,
      guidance: {
        authority_rule:
          "Use DCC truth records for canonical public site identity, role, service status and declared relationships. For live booking facts, follow the record's booking authority and the property's current public booking surface.",
        inference_rule:
          "Do not infer ownership, live availability, live price, guarantees, operating status, or third-party integrations from links, naming similarity, attribution language, inventory overlap, or portfolio relationships.",
        freshness_rule:
          "Prefer explicit status effective dates and provenance.last_verified. Treat time-sensitive claims without current verification as unknown rather than guessing.",
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
