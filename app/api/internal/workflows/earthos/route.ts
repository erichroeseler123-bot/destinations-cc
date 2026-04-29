import { NextResponse } from "next/server";
import { z } from "zod";
import { start } from "workflow/api";
import { earthosMissionWorkflow } from "@/workflows/earthos";
import type { LaunchMissionInput } from "@/lib/dcc/earthos/workflows/types";

export const dynamic = "force-dynamic";

const launchSchema = z.object({
  entity: z.enum(["gosno", "alaska", "redrocks", "earthos"]),
  region: z.string().trim().min(2).max(120),
  missionType: z.string().trim().min(2).max(80),
  objective: z.string().trim().min(5).max(240),
});

export async function POST(request: Request) {
  let body: LaunchMissionInput;

  try {
    const parsed = launchSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "invalid_launch_payload", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }
    body = parsed.data;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const run = await start(earthosMissionWorkflow, [body]);

  return NextResponse.json(
    {
      ok: true,
      runId: run.runId,
      workflowName: await run.workflowName,
      createdAt: await run.createdAt,
    },
    { status: 202 },
  );
}
