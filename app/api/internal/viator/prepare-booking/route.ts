import { NextRequest, NextResponse } from "next/server";
import { getCachedOrFetchViatorBookingQuestions } from "@/lib/viator/booking-questions";
import { getViatorClient } from "@/lib/viator/client";
import { normalizeViatorCurrency, getViatorServerConfig } from "@/lib/viator/config";
import { buildViatorPrebookState } from "@/lib/viator/prebook";
import { writePreparedViatorBooking } from "@/lib/viator/prepare-booking";

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
  const currency = normalizeViatorCurrency(typeof body.currency === "string" ? body.currency : "USD");
  const adults = asPositiveInt(body.adults, 1);
  const children = Math.max(0, asPositiveInt(body.children, 0));
  const selectedOptionId =
    typeof body.selectedOptionId === "string" && body.selectedOptionId.trim().length > 0
      ? body.selectedOptionId.trim()
      : null;
  const answers = body.answers && typeof body.answers === "object" ? (body.answers as Record<string, unknown>) : {};

  if (!productCode) {
    return NextResponse.json({ ok: false, error: "product_code_required" }, { status: 400 });
  }
  if (!travelDate || !isIsoDate(travelDate)) {
    return NextResponse.json({ ok: false, error: "travel_date_required" }, { status: 400 });
  }

  const paxMix = [
    { ageBand: "ADULT", numberOfTravelers: adults },
    ...(children > 0 ? [{ ageBand: "CHILD", numberOfTravelers: children }] : []),
  ];

  try {
    const [availabilityPayload, bookingQuestionsRaw] = await Promise.all([
      getViatorClient().checkAvailability({
        productCode,
        travelDate,
        currency,
        paxMix,
      }),
      getCachedOrFetchViatorBookingQuestions(productCode),
    ]);

    const prebook = buildViatorPrebookState({
      productCode,
      travelDate,
      currency,
      paxMix,
      bookingQuestionsRaw,
      answers,
      availabilityPayload,
    });

    const { prepared, filePath } = writePreparedViatorBooking(prebook, selectedOptionId);
    return NextResponse.json({ ok: true, prepared, filePath }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "prepare_booking_failed";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}

