import { NextRequest, NextResponse } from "next/server";
import { extractViatorPaymentSession, readViatorHoldArtifact } from "@/lib/viator/payment";

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
  return NextResponse.json({ ok: true, session }, { status: 200 });
}

