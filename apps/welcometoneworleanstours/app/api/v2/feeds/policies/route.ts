import { getWnoPoliciesFeed } from "@/app/new-orleans/data/wnoFeedsData";
import { validatePolicyFeed } from "@/lib/dcc/contracts/stage2MachineFeedContract";

export const dynamic = "force-static";

export function GET() {
  const policies = getWnoPoliciesFeed();
  const validation = validatePolicyFeed(policies);

  if (!validation.valid) {
    return Response.json(
      { error: "Policy feed validation failed", details: validation.errors },
      { status: 500 }
    );
  }

  return Response.json(
    {
      feed_version: "2.0",
      generated_at: new Date().toISOString(),
      source_site_id: "dcc:site:welcome-to-new-orleans-tours",
      policies,
    },
    {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
        "Access-Control-Allow-Origin": "*",
      },
    }
  );
}
