import { NextRequest, NextResponse } from "next/server";
import { getViatorCapabilities } from "@/lib/viator/access";
import { getViatorClient } from "@/lib/viator/client";
import { writeViatorAmendmentArtifact } from "@/lib/viator/amendment";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const preparationId = typeof body.preparationId === "string" ? body.preparationId.trim() : "";
  const quoteReference = typeof body.quoteReference === "string" ? body.quoteReference.trim() : "";
  const execute = body.execute === true;
  const rawOverrides =
    body.rawOverrides && typeof body.rawOverrides === "object"
      ? (body.rawOverrides as Record<string, unknown>)
      : undefined;

  if (!preparationId) {
    return NextResponse.json({ ok: false, error: "preparation_id_required" }, { status: 400 });
  }

  if (!quoteReference) {
    return NextResponse.json({ ok: false, error: "quote_reference_required" }, { status: 400 });
  }

  if (!execute) {
    const filePath = writeViatorAmendmentArtifact({
      preparationId,
      kind: "amend",
      payload: { quoteReference, ...(rawOverrides || {}) },
      response: { ok: true, mode: "draft_only" },
    });
    return NextResponse.json({ ok: true, executed: false, quoteReference, filePath }, { status: 200 });
  }

  const capabilities = getViatorCapabilities();
  if (!capabilities.canUseAmendments) {
    return NextResponse.json({ ok: false, error: "viator_amendments_not_enabled_for_tier" }, { status: 501 });
  }

  try {
    const response = await getViatorClient().amendBooking(quoteReference, rawOverrides);
    const filePath = writeViatorAmendmentArtifact({
      preparationId,
      kind: "amend",
      payload: { quoteReference, ...(rawOverrides || {}) },
      response,
    });
    return NextResponse.json({ ok: true, executed: true, quoteReference, response, filePath }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "amendment_execute_failed",
        quoteReference,
      },
      { status: 502 }
    );
  }
}
