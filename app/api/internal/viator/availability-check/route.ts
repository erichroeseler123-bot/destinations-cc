import { NextRequest, NextResponse } from "next/server";
import { getViatorClient } from "@/lib/viator/client";
import { getViatorServerConfig } from "@/lib/viator/config";

export const runtime = "nodejs";

function asPositiveInt(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

function isIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export async function POST(request: NextRequest) {
  const config = getViatorServerConfig();
  if (!config.apiKey) {
    return NextResponse.json({ ok: false, error: "viator_not_configured" }, { status: 503 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const productCode = typeof body.productCode === "string" ? body.productCode.trim() : "";
  const travelDate = typeof body.travelDate === "string" ? body.travelDate.trim() : "";
  const currency = typeof body.currency === "string" ? body.currency.trim().toUpperCase() : "USD";
  const adults = asPositiveInt(body.adults, 1);
  const children = Math.max(0, asPositiveInt(body.children, 0));

  if (!productCode) {
    return NextResponse.json({ ok: false, error: "product_code_required" }, { status: 400 });
  }

  if (!travelDate || !isIsoDate(travelDate)) {
    return NextResponse.json({ ok: false, error: "travel_date_required" }, { status: 400 });
  }

  try {
    const payload = await getViatorClient().checkAvailability({
      productCode,
      travelDate,
      currency,
      paxMix: [
        { ageBand: "ADULT", numberOfTravelers: adults },
        ...(children > 0 ? [{ ageBand: "CHILD", numberOfTravelers: children }] : []),
      ],
    });

    return NextResponse.json({ ok: true, payload }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "availability_check_failed";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}

