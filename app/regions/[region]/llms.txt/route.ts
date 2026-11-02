import { NextRequest, NextResponse } from "next/server";
import { resolveLlmsTxtByRegionOrNodeSlug } from "@/lib/dcc/llmsManifest";

export const revalidate = 3600;

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ region: string }> },
) {
  const { region } = await context.params;
  const body = resolveLlmsTxtByRegionOrNodeSlug(region);
  if (!body) {
    return new NextResponse("Not Found", { status: 404 });
  }
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=3600",
    },
  });
}
