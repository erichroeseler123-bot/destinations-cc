import { NextRequest, NextResponse } from "next/server";
import { checkDccLiveAvailability } from "@/lib/dcc/internal/dccViatorAdapter";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { siteId, internalProductId, bookingDate, adultCount } = body;

    if (!siteId || !internalProductId || !bookingDate) {
      return NextResponse.json(
        { error: "Missing required fields: siteId, internalProductId, bookingDate" },
        { status: 400 }
      );
    }

    const availability = await checkDccLiveAvailability({
      siteId,
      internalProductId,
      bookingDate,
      adultCount: Number(adultCount) || 2,
    });

    if (!availability.success) {
      const status =
        availability.availabilityStatus === "invalid_mapping"
          ? 404
          : availability.availabilityStatus === "auth_error" ||
              availability.availabilityStatus === "unconfigured"
            ? 503
            : 502;
      return NextResponse.json(availability, { status });
    }

    return NextResponse.json(availability);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Internal availability error: ${message}` },
      { status: 500 }
    );
  }
}
