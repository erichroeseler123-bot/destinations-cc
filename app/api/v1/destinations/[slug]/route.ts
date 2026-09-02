import { NextResponse } from "next/server";
import { buildDestinationReadModel } from "@/src/lib/dcc/public-read";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const payload = buildDestinationReadModel(slug);
  if (!payload) return NextResponse.json({ error: "destination_not_found" }, { status: 404 });
  return NextResponse.json(payload, { headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=3600" } });
}
