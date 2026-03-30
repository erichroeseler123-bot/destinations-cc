import { NextRequest, NextResponse } from "next/server";
import { buildDccReturnUrl, emitDccEvent, getHandoffIdFromSearchParams } from "@/lib/dcc";

export async function GET(request: NextRequest) {
  const handoffId = getHandoffIdFromSearchParams(request.nextUrl.searchParams);
  const dccReturn = request.nextUrl.searchParams.get("dcc_return");

  if (handoffId) {
    await emitDccEvent({
      handoffId,
      satelliteId: "redrocksfastpass",
      eventType: "traveler_returned",
      source: "redrocksfastpass",
      sourcePath: "/handoff/return",
      status: "returned",
      stage: "authority_return",
      booking: {
        citySlug: "denver",
        venueSlug: "red-rocks-amphitheatre",
        productSlug: "red-rocks-fast-pass",
      },
    });
  }

  return NextResponse.redirect(
    dccReturn || buildDccReturnUrl("/red-rocks-shuttle", handoffId || `rrfp_return_${Date.now()}`)
  );
}
