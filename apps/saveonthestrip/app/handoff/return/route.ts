import { NextRequest, NextResponse } from "next/server";
import { emitDccEvent, getHandoffIdFromSearchParams } from "@/lib/dcc";

export async function GET(request: NextRequest) {
  const handoffId = getHandoffIdFromSearchParams(request.nextUrl.searchParams);
  const dccReturn = request.nextUrl.searchParams.get("dcc_return");

  if (handoffId) {
    await emitDccEvent({
      handoffId,
      satelliteId: "saveonthestrip",
      eventType: "traveler_returned",
      source: "saveonthestrip",
      sourcePath: "/handoff/return",
      status: "returned",
      stage: "return",
      booking: { citySlug: "las-vegas" },
    });
  }

  return NextResponse.redirect(dccReturn || "https://www.destinationcommandcenter.com/vegas");
}
