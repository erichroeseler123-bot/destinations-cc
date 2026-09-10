import { getWnoOperatingWindowsFeed } from "@/app/new-orleans/data/wnoFeedsData";

export const dynamic = "force-static";

export function GET() {
  const schedules = getWnoOperatingWindowsFeed();

  return Response.json(
    {
      feed_version: "2.0",
      generated_at: new Date().toISOString(),
      source_site_id: "dcc:site:welcome-to-new-orleans-tours",
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
