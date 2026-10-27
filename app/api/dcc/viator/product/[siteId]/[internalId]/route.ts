import { NextRequest, NextResponse } from "next/server";
import { getVerifiedProductForSite } from "@/lib/dcc/internal/dccViatorAdapter";
import { isValidDestination, resolveAuthoritativeBuffer } from "@/lib/dcc/context/registry";

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
  const additionalPrefRaw = searchParams.get("additionalPreferenceBufferMinutes");
  const additionalPref =
    additionalPrefRaw && Number.isFinite(Number(additionalPrefRaw))
      ? Math.max(0, Math.round(Number(additionalPrefRaw)))
      : 0;
  const portKey = targetPort?.trim().toLowerCase() || "juneau";
  const authoritativeBufferMinutes = isValidDestination(portKey)
    ? resolveAuthoritativeBuffer(portKey, additionalPref)
    : 60 + additionalPref;

  const cruiseWindow =
    arrivalHour && departureHour
      ? {
          arrivalHour: Number(arrivalHour),
          departureHour: Number(departureHour),
          allAboardBufferMinutes: authoritativeBufferMinutes,
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
