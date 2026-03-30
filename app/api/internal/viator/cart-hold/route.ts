import { NextRequest, NextResponse } from "next/server";
import { getViatorCapabilities } from "@/lib/viator/access";
import { getViatorClient } from "@/lib/viator/client";
import { buildViatorCartHoldDraft, readPreparedViatorBooking, writeViatorHoldResult } from "@/lib/viator/hold";

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

  const prepared = readPreparedViatorBooking(preparationId);
  if (!prepared) {
    return NextResponse.json({ ok: false, error: "prepared_booking_not_found" }, { status: 404 });
  }

  const draft = buildViatorCartHoldDraft({
    prepared,
    contact: {
      firstName: typeof body.firstName === "string" ? body.firstName.trim() : "",
      lastName: typeof body.lastName === "string" ? body.lastName.trim() : "",
      email: typeof body.email === "string" ? body.email.trim() : "",
      phone: typeof body.phone === "string" ? body.phone.trim() : "",
    },
    rawOverrides,
  });

  if (!execute) {
    const filePath = writeViatorHoldResult({
      preparationId,
      draft,
      response: { ok: true, mode: "draft_only" },
      mode: "draft",
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

  if (!prepared.validation.readyForHold) {
    return NextResponse.json(
      { ok: false, error: "prepared_booking_not_ready_for_hold", prepared, draft },
      { status: 400 }
    );
  }

  try {
    const response = await getViatorClient().createCartHold(draft.payload);
    const filePath = writeViatorHoldResult({
      preparationId,
      draft,
      response,
      mode: "executed",
    });
    return NextResponse.json({ ok: true, executed: true, draft, response, filePath }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "cart_hold_failed",
        draft,
      },
      { status: 502 }
    );
  }
}

