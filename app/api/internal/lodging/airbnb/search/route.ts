import { NextRequest, NextResponse } from "next/server";
import { hasRapidApiAirbnbConfig } from "@/lib/rapidapi/config";
import { searchAirbnbListingsByCity } from "@/lib/rapidapi/airbnb";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const city = String(req.nextUrl.searchParams.get("city") || "").trim();
  if (!city) {
    return NextResponse.json(
      { ok: false, error: "missing_city", hint: "Pass ?city=Denver or another destination." },
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
    const payload = await searchAirbnbListingsByCity(city);
    return NextResponse.json(
      {
        ok: true,
        configured: true,
        source: payload.source,
        city: payload.city,
        queryUrl: payload.queryUrl,
        count: payload.listings.length,
        listings: payload.listings,
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
