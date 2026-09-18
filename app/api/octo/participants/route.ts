import { NextRequest, NextResponse } from "next/server";
import { OctoRegistryService } from "@/lib/octo/registry";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const role = searchParams.get("role") || undefined;

  const participants = await OctoRegistryService.getParticipants(role);

  return NextResponse.json({
    spec: "octo-participant-registry",
    version: "1.0",
    totalParticipants: participants.length,
    agreedPlatformShare: "5.0%",
    governanceModel: "Direct operator authority; neutral open connectivity; zero mandatory gatekeeping",
    participants,
  }, {
    headers: {
      "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
