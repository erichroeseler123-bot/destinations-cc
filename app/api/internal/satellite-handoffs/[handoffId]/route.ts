import { NextResponse } from "next/server";
import { z } from "zod";
import { findSatelliteHandoffSummary } from "@/lib/dcc/satelliteHandoffs";

export const runtime = "nodejs";

const ParamsSchema = z.object({
  handoffId: z.string().min(8),
});

export async function GET(
  _request: Request,
  context: { params: Promise<unknown> }
) {
  const parsed = ParamsSchema.safeParse(await context.params);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "invalid_params", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const summary = findSatelliteHandoffSummary(parsed.data.handoffId);
  if (!summary) {
    return NextResponse.json({ ok: false, error: "handoff_not_found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, summary }, { status: 200 });
}
