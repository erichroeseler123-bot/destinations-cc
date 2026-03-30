import { NextRequest, NextResponse } from "next/server";
import { getViatorCapabilities } from "@/lib/viator/access";
import { buildViatorAmendmentQuotePayload, extractQuoteReference, writeViatorAmendmentArtifact } from "@/lib/viator/amendment";
import { getViatorClient } from "@/lib/viator/client";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const preparationId = typeof body.preparationId === "string" ? body.preparationId.trim() : "";
  const rawOverrides =
    body.rawOverrides && typeof body.rawOverrides === "object"
      ? (body.rawOverrides as Record<string, unknown>)
      : undefined;

  if (!preparationId) {
    return NextResponse.json({ ok: false, error: "preparation_id_required" }, { status: 400 });
  }

  const capabilities = getViatorCapabilities();
  if (!capabilities.canUseAmendments) {
    return NextResponse.json({ ok: false, error: "viator_amendments_not_enabled_for_tier" }, { status: 501 });
  }

  const draft = buildViatorAmendmentQuotePayload({
    preparationId,
    amendmentType: typeof body.amendmentType === "string" ? body.amendmentType.trim() : null,
    travelDate: typeof body.travelDate === "string" ? body.travelDate.trim() : null,
    rawOverrides,
  });

  if (!draft.bookingReference) {
    return NextResponse.json({ ok: false, error: "booking_reference_missing", draft }, { status: 400 });
  }

  if (!draft.payload.amendmentType) {
    return NextResponse.json({ ok: false, error: "amendment_type_required", draft }, { status: 400 });
  }

  try {
    const response = await getViatorClient().quoteAmendment(draft.payload);
    const filePath = writeViatorAmendmentArtifact({
      preparationId,
      kind: "quote",
      payload: draft.payload,
      response,
    });
    return NextResponse.json(
      {
        ok: true,
        draft,
        quoteReference: extractQuoteReference(response),
        response,
        filePath,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "amendment_quote_failed",
        draft,
      },
      { status: 502 }
    );
  }
}
