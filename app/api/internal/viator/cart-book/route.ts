import { NextRequest, NextResponse } from "next/server";
import { getViatorCapabilities } from "@/lib/viator/access";
import { getViatorClient } from "@/lib/viator/client";
import { buildViatorCartBookPayload, writeViatorBookingArtifact } from "@/lib/viator/book";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const preparationId = typeof body.preparationId === "string" ? body.preparationId.trim() : "";
  const execute = body.execute === true;
  const rawOverrides =
    body.rawOverrides && typeof body.rawOverrides === "object"
      ? (body.rawOverrides as Record<string, unknown>)
      : undefined;

  if (!preparationId) {
    return NextResponse.json({ ok: false, error: "preparation_id_required" }, { status: 400 });
  }

  const draft = buildViatorCartBookPayload({
    preparationId,
    paymentToken: typeof body.paymentToken === "string" ? body.paymentToken.trim() : null,
    rawOverrides,
  });

  if (!draft.bookingRef || !draft.partnerBookingRef || !draft.cartRef || !draft.partnerCartRef) {
    return NextResponse.json(
      { ok: false, error: "hold_references_missing", draft },
      { status: 400 }
    );
  }

  if (!draft.paymentToken) {
    return NextResponse.json(
      { ok: false, error: "payment_token_missing", draft },
      { status: 400 }
    );
  }

  if (!execute) {
    const filePath = writeViatorBookingArtifact({
      preparationId,
      payload: draft.payload,
      response: { ok: true, mode: "draft_only" },
      kind: "book",
    });
    return NextResponse.json({ ok: true, executed: false, draft, filePath }, { status: 200 });
  }

  const capabilities = getViatorCapabilities();
  if (!capabilities.canUseBooking) {
    return NextResponse.json(
      { ok: false, error: "viator_booking_not_enabled_for_tier", draft },
      { status: 501 }
    );
  }

  try {
    const response = await getViatorClient().createCartBooking(draft.payload);
    const filePath = writeViatorBookingArtifact({
      preparationId,
      payload: draft.payload,
      response,
      kind: "book",
    });
    return NextResponse.json({ ok: true, executed: true, draft, response, filePath }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "cart_book_failed",
        draft,
      },
      { status: 502 }
    );
  }
}
