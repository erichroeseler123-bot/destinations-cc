import { NextRequest, NextResponse } from "next/server";
import { getCachedOrFetchViatorBookingQuestions, summarizeBookingQuestions } from "@/lib/viator/booking-questions";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const productCode = typeof body.productCode === "string" ? body.productCode.trim() : "";
  const forceRefresh = body.forceRefresh === true;

  if (!productCode) {
    return NextResponse.json({ ok: false, error: "product_code_required" }, { status: 400 });
  }

  try {
    const payload = await getCachedOrFetchViatorBookingQuestions(productCode, { forceRefresh });
    return NextResponse.json(
      {
        ok: true,
        productCode,
        count: payload.length,
        questions: summarizeBookingQuestions(payload),
        raw: payload,
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "booking_questions_failed";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}

