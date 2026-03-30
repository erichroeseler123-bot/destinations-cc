import { NextRequest, NextResponse } from "next/server";
import { getViatorClient } from "@/lib/viator/client";
import {
  extractViatorPaymentSession,
  readViatorHoldArtifact,
  writeViatorPaymentArtifact,
} from "@/lib/viator/payment";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const preparationId =
    typeof body.preparationId === "string" && body.preparationId.trim().length > 0
      ? body.preparationId.trim()
      : "";

  if (!preparationId) {
    return NextResponse.json({ ok: false, error: "preparation_id_required" }, { status: 400 });
  }

  const artifact = readViatorHoldArtifact(preparationId);
  if (!artifact) {
    return NextResponse.json({ ok: false, error: "hold_artifact_not_found" }, { status: 404 });
  }

  const session = extractViatorPaymentSession(preparationId, artifact);
  if (!session.paymentDataSubmissionUrl) {
    return NextResponse.json({ ok: false, error: "payment_data_submission_url_missing", session }, { status: 400 });
  }

  const owner = body.owner && typeof body.owner === "object" ? (body.owner as Record<string, unknown>) : {};
  const payload = {
    cardNumber: typeof body.cardNumber === "string" ? body.cardNumber.trim() : "",
    cvv: typeof body.cvv === "string" ? body.cvv.trim() : "",
    expMonth: typeof body.expMonth === "string" ? body.expMonth.trim() : "",
    expYear: typeof body.expYear === "string" ? body.expYear.trim() : "",
    name: typeof body.name === "string" ? body.name.trim() : "",
    owner: {
      country: typeof owner.country === "string" ? owner.country.trim() : "",
      postalCode: typeof owner.postalCode === "string" ? owner.postalCode.trim() : "",
    },
  };

  try {
    const response = await getViatorClient().submitPaymentAccount(session.paymentDataSubmissionUrl, payload);
    const filePath = writeViatorPaymentArtifact({ preparationId, session, response });
    return NextResponse.json({ ok: true, session, response, filePath }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "payment_account_submission_failed",
        session,
      },
      { status: 502 }
    );
  }
}
