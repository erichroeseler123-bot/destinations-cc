import { NextResponse } from "next/server";
import { getViatorCapabilities } from "@/lib/viator/access";
import { getViatorClient } from "@/lib/viator/client";
import { extractCancelReasons, writeViatorCancellationArtifact } from "@/lib/viator/cancel";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  const preparationId = typeof body.preparationId === "string" ? body.preparationId.trim() : "shared";
  const capabilities = getViatorCapabilities();
  if (!capabilities.canUseBooking) {
    return NextResponse.json({ ok: false, error: "viator_booking_not_enabled_for_tier" }, { status: 501 });
  }

  try {
    const response = await getViatorClient().getCancelReasons();
    const reasons = extractCancelReasons(response);
    const filePath = writeViatorCancellationArtifact({
      preparationId,
      kind: "reasons",
      payload: {},
      response,
    });
    return NextResponse.json({ ok: true, reasons, response, filePath }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "cancel_reasons_failed" },
      { status: 502 }
    );
  }
}
