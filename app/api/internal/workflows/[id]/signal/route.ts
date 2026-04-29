import { NextResponse } from "next/server";
import { z } from "zod";
import { signalWorkflowMission } from "@/lib/dcc/earthos/workflows/service";
import type { MissionDetailResponse, WorkflowSignalEvent } from "@/lib/dcc/earthos/workflows/types";

export const dynamic = "force-dynamic";

const signalSchema = z.object({
  event: z.enum(["erich-approval", "mission-cancel"]),
  payload: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  let body: z.infer<typeof signalSchema>;

  try {
    const parsed = signalSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "invalid_signal_payload", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }
    body = parsed.data;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const { id } = await context.params;
  const mission = await signalWorkflowMission(id, body.event as WorkflowSignalEvent, body.payload);

  if (!mission) {
    return NextResponse.json({ ok: false, error: "workflow_not_found" }, { status: 404 });
  }

  const payload: MissionDetailResponse = {
    ok: true,
    mission,
    fetchedAt: new Date().toISOString(),
  };

  return NextResponse.json(payload, { status: 200 });
}
