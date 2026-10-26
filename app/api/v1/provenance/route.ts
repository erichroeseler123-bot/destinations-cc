import { NextResponse } from "next/server";
import { getDeploymentProvenanceV03 } from "@/lib/dcc/machine/v03/discoveryAndMcp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const provenance = getDeploymentProvenanceV03();
  return NextResponse.json(provenance, {
    status: 200,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
