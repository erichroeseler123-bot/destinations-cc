import { NextRequest, NextResponse } from "next/server";
import { getViatorCapabilities } from "@/lib/viator/access";
import { getViatorClient } from "@/lib/viator/client";
import { writeViatorSupplierArtifact } from "@/lib/viator/supplier-events";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const capabilities = getViatorCapabilities();
  if (!capabilities.canUseBooking) {
    return NextResponse.json({ ok: false, error: "viator_booking_not_enabled_for_tier" }, { status: 501 });
  }

  const acknowledgements = Array.isArray(body.acknowledgements)
    ? body.acknowledgements.filter((row) => row && typeof row === "object")
    : [];

  if (acknowledgements.length === 0) {
    return NextResponse.json({ ok: false, error: "acknowledgements_required" }, { status: 400 });
  }

  try {
    const response = await getViatorClient().acknowledgeBookingsModifiedSince({
      acknowledgements,
    });
    const filePath = writeViatorSupplierArtifact({
      kind: "ack",
      cursor: null,
      payload: { acknowledgements },
      response,
    });
    return NextResponse.json({ ok: true, response, filePath }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "supplier_ack_failed",
      },
      { status: 502 }
    );
  }
}
