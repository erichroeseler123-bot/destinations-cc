import { NextRequest, NextResponse } from "next/server";
import { getViatorCapabilities } from "@/lib/viator/access";
import { getViatorClient } from "@/lib/viator/client";
import { buildViatorCartBookPayload, writeViatorBookingArtifact } from "@/lib/viator/book";
import { getViatorStatusRetryDelayMs } from "@/lib/viator/status";

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
    return NextResponse.json(
      { ok: false, error: "viator_booking_not_enabled_for_tier" },
      { status: 501 }
    );
  }

  const draft = buildViatorCartBookPayload({
    preparationId,
    paymentToken: typeof body.paymentToken === "string" ? body.paymentToken.trim() : null,
  });

  const payload = {
    bookingRef: draft.bookingRef,
    partnerBookingRef: draft.partnerBookingRef,
    cartRef: draft.cartRef,
    partnerCartRef: draft.partnerCartRef,
  };

  if (!payload.bookingRef && !payload.partnerBookingRef) {
    return NextResponse.json(
      { ok: false, error: "booking_references_missing", payload },
      { status: 400 }
    );
  }

  try {
    const response = await getViatorClient().getBookingStatus(payload);
    const filePath = writeViatorBookingArtifact({
      preparationId,
      payload,
      response,
      kind: "status",
    });
    return NextResponse.json(
      { ok: true, payload, response, filePath, retryAfterMs: getViatorStatusRetryDelayMs() },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "booking_status_failed",
        payload,
        retryAfterMs: getViatorStatusRetryDelayMs(),
      },
      { status: 502 }
    );
  }
}
