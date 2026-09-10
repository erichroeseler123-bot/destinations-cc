import { getWnoAgentDirectory } from "@/app/new-orleans/data/wnoFeedsData";
import { validateAgentDirectory } from "@/lib/dcc/contracts/stage2MachineFeedContract";

export const dynamic = "force-static";

export function GET() {
  const directory = getWnoAgentDirectory();
  const validation = validateAgentDirectory(directory);

  if (!validation.valid) {
    return Response.json(
      { error: "Agent directory validation failed", details: validation.errors },
      { status: 500 }
    );
  }

  return Response.json(directory, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
