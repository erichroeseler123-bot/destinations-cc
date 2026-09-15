import { NextRequest, NextResponse } from "next/server";
import { DccTravelerService, TRAVELER_SESSION_COOKIE } from "@/lib/travelers";

export async function GET(req: NextRequest) {
  try {
    // 1. Check HTTP-only cookie first
    let sessionToken = req.cookies.get(TRAVELER_SESSION_COOKIE)?.value;

    // 2. Check Authorization header (Bearer token)
    if (!sessionToken) {
      const authHeader = req.headers.get("Authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        sessionToken = authHeader.slice(7).trim();
      }
    }

    if (!sessionToken) {
      return NextResponse.json(
        { error: "UNAUTHORIZED", message: "Traveler authentication required" },
        { status: 401 }
      );
    }

    const verified = DccTravelerService.verifySession(sessionToken);
    if (!verified) {
      return NextResponse.json(
        { error: "INVALID_SESSION", message: "Session expired or invalid" },
        { status: 401 }
      );
    }

    const tripsSummary = await DccTravelerService.getTravelerTrips(verified.travelerId);

    return NextResponse.json({
      success: true,
      ...tripsSummary,
    });
  } catch (err: any) {
    console.error("Error fetching traveler trips:", err);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: err.message || "Failed to load trips" },
      { status: 500 }
    );
  }
}
