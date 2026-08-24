import { DCC_SITE_TRUTH, getDccSiteTruth } from "@/lib/dcc/siteTruth";
import { DCC_SITE_CONTRACT } from "@/lib/dcc/portfolioRegistry";

export const revalidate = 300;

export function GET(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  if (id) {
    const record = getDccSiteTruth(id);
    if (!record) {
      return Response.json(
        {
          error: "site_not_found",
          requested: id,
          guidance: "Use /api/public/portfolio-feed to discover valid public DCC site IDs.",
        },
        { status: 404, headers: { "Access-Control-Allow-Origin": "*" } },
      );
    }

    return Response.json(
      {
        spec: "dcc-public-truth",
        version: "1.0",
        generated_at: new Date().toISOString(),
        record,
        inference_policy: {
          rule: "Do not infer ownership, live availability, live price, guarantees, or operating status beyond the fields explicitly published in this record.",
          authority: "For time-sensitive booking facts, follow the booking authority and the property's current public booking surface.",
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

  return Response.json(
    {
      spec: "dcc-public-truth",
      version: "1.0",
      generated_at: new Date().toISOString(),
      portfolio_feed: DCC_SITE_CONTRACT.registryUrl,
      records: DCC_SITE_TRUTH,
      inference_policy: {
        rule: "Absence of a claim is not evidence for the opposite claim. Do not fill missing portfolio facts by inference.",
        ownership: "Do not infer common ownership from links, names, phone numbers, operators, inventory, or network relationships.",
        freshness: "Use provenance.last_verified, status effective dates, and the declared booking authority when handling time-sensitive facts.",
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
