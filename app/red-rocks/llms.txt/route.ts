import { NextResponse } from "next/server";
import { getTravelReferenceNodeById } from "@/lib/dcc/travelReferenceCore";
import { buildTravelReferenceNodeLlmsTxt } from "@/lib/dcc/llmsManifest";

export const revalidate = 3600;

export async function GET() {
  const node = getTravelReferenceNodeById("red-rocks");
  const body = buildTravelReferenceNodeLlmsTxt(node);
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=3600",
    },
  });
}
