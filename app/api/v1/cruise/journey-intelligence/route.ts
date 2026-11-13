import { NextRequest, NextResponse } from "next/server";
import {
  buildCruiseJourneyIntelligence,
  buildJourneyCorsHeaders,
} from "@/lib/dcc/cruiseJourneyIntelligence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin");
  return new NextResponse(null, {
    status: 204,
    headers: {
      ...buildJourneyCorsHeaders(origin),
      "Cache-Control": "public, max-age=300",
    },
  });
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get("origin");
  const corsHeaders = buildJourneyCorsHeaders(origin);
  const { searchParams } = new URL(request.url);

  const payload = await buildCruiseJourneyIntelligence({
    stage: searchParams.get("stage"),
    region: searchParams.get("region"),
    month: searchParams.get("month"),
    port: searchParams.get("port") || searchParams.get("portSlug"),
    homeport: searchParams.get("homeport"),
    ship: searchParams.get("ship"),
    sailDate: searchParams.get("sailDate") || searchParams.get("sailing_date"),
    partySize: searchParams.get("partySize") || searchParams.get("party_size"),
    shipArrival: searchParams.get("shipArrival") || searchParams.get("arrival"),
    allAboard: searchParams.get("allAboard") || searchParams.get("all_aboard"),
  });

  return NextResponse.json(payload, {
    status: 200,
    headers: {
      ...corsHeaders,
      "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
