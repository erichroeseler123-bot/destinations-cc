import { NextRequest, NextResponse } from "next/server";
import { getVerifiedProductForSite } from "@/lib/dcc/internal/dccViatorAdapter";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ siteId: string; internalId: string }> }
) {
  const { siteId, internalId } = await context.params;
  const searchParams = req.nextUrl.searchParams;

  const targetPort = searchParams.get("targetPort") || undefined;
  const requiresHotelPickup = searchParams.get("requiresHotelPickup") === "true";

  const arrivalHour = searchParams.get("arrivalHour");
  const departureHour = searchParams.get("departureHour");
  const cruiseWindow =
    arrivalHour && departureHour
      ? {
          arrivalHour: Number(arrivalHour),
          departureHour: Number(departureHour),
          allAboardBufferMinutes: searchParams.get("bufferMinutes")
            ? Number(searchParams.get("bufferMinutes"))
            : 60,
        }
      : undefined;

  const result = getVerifiedProductForSite({
    siteId,
    internalProductId: internalId,
    targetPort,
    requiresHotelPickup,
    cruiseWindow,
  });

  if (!result.success) {
    return NextResponse.json(
      { error: result.reason || "Product validation failed" },
      { status: 404 }
    );
  }

  return NextResponse.json(result);
}
