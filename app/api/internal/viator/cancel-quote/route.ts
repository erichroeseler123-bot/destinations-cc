import { NextRequest, NextResponse } from "next/server";
import { getViatorCapabilities } from "@/lib/viator/access";
import { getViatorClient } from "@/lib/viator/client";
import { resolveViatorBookingReference, writeViatorCancellationArtifact } from "@/lib/viator/cancel";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const preparationId = typeof body.preparationId === "string" ? body.preparationId.trim() : "";
  if (!preparationId) {
    return NextResponse.json({ ok: false, error: "preparation_id_required" }, { status: 400 });
  }

  const capabilities = getViatorCapabilities();
  if (!capabilities.canUseBooking) {
    return NextResponse.json({ ok: false, error: "viator_booking_not_enabled_for_tier" }, { status: 501 });
  }

  const refs = resolveViatorBookingReference(preparationId);
  if (!refs.bookingReference) {
    return NextResponse.json({ ok: false, error: "booking_reference_missing" }, { status: 400 });
  }

  try {
    const response = await getViatorClient().getCancelQuote(refs.bookingReference);
    const filePath = writeViatorCancellationArtifact({
      preparationId,
      kind: "quote",
      payload: { bookingReference: refs.bookingReference },
      response,
    });
    return NextResponse.json({ ok: true, bookingReference: refs.bookingReference, response, filePath }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "cancel_quote_failed",
        bookingReference: refs.bookingReference,
      },
      { status: 502 }
    );
  }
}
