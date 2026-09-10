import { getWnoOperatingWindowsFeed } from "@/app/new-orleans/data/wnoFeedsData";
import { validateOperatingWindowsFeed } from "@/lib/dcc/contracts/stage2MachineFeedContract";

export const dynamic = "force-static";

export function GET() {
  const schedules = getWnoOperatingWindowsFeed();
  const validation = validateOperatingWindowsFeed(schedules);

  if (!validation.valid) {
    return Response.json(
      { error: "Operating windows feed validation failed", details: validation.errors },
      { status: 500 }
    );
  }

  return Response.json(
    {
      feed_version: "2.0",
      generated_at: new Date().toISOString(),
      source_site_id: "dcc:site:wno-tours",
      operating_schedules: schedules,
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
