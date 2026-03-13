import { NextResponse } from "next/server";
import { getFlightStatus } from "@/lib/dcc/internal/flightAction";

export const runtime = "nodejs";

function asNumber(raw: string | null): number | undefined {
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const payload = await getFlightStatus({
    lamin: asNumber(searchParams.get("lamin")),
    lomin: asNumber(searchParams.get("lomin")),
    lamax: asNumber(searchParams.get("lamax")),
    lomax: asNumber(searchParams.get("lomax")),
  });

  return NextResponse.json(payload, { status: 200 });
}
