import { NextRequest, NextResponse } from "next/server";
import { getViatorCapabilities } from "@/lib/viator/access";
import { getViatorClient } from "@/lib/viator/client";
import { buildViatorCancelPayload, writeViatorCancellationArtifact } from "@/lib/viator/cancel";

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

  const draft = buildViatorCancelPayload({
    preparationId,
    cancellationReasonCode:
      typeof body.cancellationReasonCode === "string" ? body.cancellationReasonCode.trim() : null,
    rawOverrides,
  });

  if (!draft.bookingReference) {
    return NextResponse.json({ ok: false, error: "booking_reference_missing", draft }, { status: 400 });
  }

  if (!draft.payload.cancellationReasonCode) {
    return NextResponse.json({ ok: false, error: "cancellation_reason_required", draft }, { status: 400 });
  }

  if (!execute) {
    const filePath = writeViatorCancellationArtifact({
      preparationId,
      kind: "cancel",
      payload: { bookingReference: draft.bookingReference, ...draft.payload },
      response: { ok: true, mode: "draft_only" },
    });
    return NextResponse.json({ ok: true, executed: false, draft, filePath }, { status: 200 });
  }

  const capabilities = getViatorCapabilities();
  if (!capabilities.canUseBooking) {
    return NextResponse.json({ ok: false, error: "viator_booking_not_enabled_for_tier", draft }, { status: 501 });
  }

  try {
    const response = await getViatorClient().cancelBooking(draft.bookingReference, draft.payload);
    const filePath = writeViatorCancellationArtifact({
      preparationId,
      kind: "cancel",
      payload: { bookingReference: draft.bookingReference, ...draft.payload },
      response,
    });
    return NextResponse.json(
      { ok: true, executed: true, draft, response, filePath },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "cancel_booking_failed",
        draft,
      },
      { status: 502 }
    );
  }
}
