import { NextResponse } from "next/server";
import { getGraphHealth } from "@/lib/dcc/graph/health";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(getGraphHealth(), { status: 200 });
}
