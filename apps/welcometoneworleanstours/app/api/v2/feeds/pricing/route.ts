import { getWnoPricingFeed } from "@/app/new-orleans/data/wnoFeedsData";
import { validatePricingFeed } from "@/lib/dcc/contracts/stage2MachineFeedContract";

export const dynamic = "force-static";

export function GET() {
  const items = getWnoPricingFeed();
  const validation = validatePricingFeed(items, "dcc:site:wno-tours");

  if (!validation.valid) {
    return Response.json(
      { error: "Pricing feed validation failed", details: validation.errors },
      { status: 500 }
    );
  }

  return Response.json(
    {
      feed_version: "2.0",
      generated_at: new Date().toISOString(),
      pricing_tier: "retail_published",
      source_site_id: "dcc:site:wno-tours",
      items,
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
