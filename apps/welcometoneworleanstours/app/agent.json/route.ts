import { getWnoAgentDirectory } from "@/app/new-orleans/data/wnoFeedsData";
import { validateAgentDirectory } from "@/lib/dcc/contracts/stage2MachineFeedContract";

// spec: dcc-site-contract v1.1
// Canonical DCC truth record: https://www.destinationcommandcenter.com/api/public/truth-feed?id=wno-tours
const TRUTH_RECORD_URL = "https://www.destinationcommandcenter.com/api/public/truth-feed?id=wno-tours";

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
