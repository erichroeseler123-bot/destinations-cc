import { NextRequest, NextResponse } from "next/server";
import { getAirbnbPropertyDetails } from "@/lib/rapidapi/airbnb";
import { hasRapidApiAirbnbConfig } from "@/lib/rapidapi/config";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const url = String(req.nextUrl.searchParams.get("url") || "").trim();
  if (!url) {
    return NextResponse.json(
      {
        ok: false,
        error: "missing_url",
        hint: "Pass ?url=https://www.airbnb.com/rooms/<listing-id>.",
      },
      { status: 400 }
    );
  }

  if (!hasRapidApiAirbnbConfig()) {
    return NextResponse.json(
      { ok: false, configured: false, source: "rapidapi_airbnb", error: "missing_rapidapi_key" },
      { status: 503 }
    );
  }

  try {
    const payload = await getAirbnbPropertyDetails(url);
    if (!payload.detail) {
      return NextResponse.json(
        {
          ok: false,
          configured: true,
          source: payload.source,
          error: "airbnb_detail_not_found",
          hint: "The upstream Airbnb source did not return a usable property detail payload for that URL.",
        },
        { status: 404 }
      );
    }
    return NextResponse.json(
      {
        ok: true,
        configured: true,
        source: payload.source,
        detail: payload.detail,
        note: "Supplemental lodging source only. Do not treat as canonical pricing or availability.",
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        configured: true,
        source: "rapidapi_airbnb",
        error: error instanceof Error ? error.message : "rapidapi_airbnb_failed",
      },
      { status: 502 }
    );
  }
}
