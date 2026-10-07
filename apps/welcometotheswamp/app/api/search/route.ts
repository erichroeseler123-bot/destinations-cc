import { NextResponse } from "next/server";
import { searchNextAirboatDepartures } from "../../../lib/searchEngine";
import { getTodayNewOrleansDate } from "../../../lib/timezone";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const travelDate = typeof body.travelDate === "string" && body.travelDate.trim()
      ? body.travelDate.trim()
      : getTodayNewOrleansDate();

    const adults = Math.max(1, parseInt(String(body.adults || 2), 10));
    
    // Parse children ages
    let childrenAges: number[] = [];
    if (Array.isArray(body.childrenAges)) {
      childrenAges = body.childrenAges
        .map((a: unknown) => parseInt(String(a), 10))
        .filter((a: number) => !isNaN(a) && a >= 0 && a <= 17);
    } else if (body.childrenCount) {
      const count = Math.max(0, parseInt(String(body.childrenCount), 10));
      // Default to age 8 if not individually specified
      childrenAges = Array(count).fill(8);
    }

    const transportation =
      body.transportation === "hotel_pickup" || body.transportation === "self_drive"
        ? body.transportation
        : "either";

    const boatType =
      body.boatType === "small_airboat" || body.boatType === "large_airboat"
        ? body.boatType
        : "any";

    const preferredTimeWindow =
      body.preferredTimeWindow === "morning" || body.preferredTimeWindow === "afternoon"
        ? body.preferredTimeWindow
        : "any";

    const results = await searchNextAirboatDepartures({
      travelDate,
      adults,
      childrenAges,
      transportation,
      boatType,
      preferredTimeWindow,
    });

    return NextResponse.json({
      ok: true,
      data: results,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error: err?.message || "Search failed.",
      },
      { status: 500 }
    );
  }
}
