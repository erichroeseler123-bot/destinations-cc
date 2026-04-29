import { NextResponse } from "next/server";
import { z } from "zod";
import { launchWorkflowMission } from "@/lib/dcc/earthos/workflows/service";
import type { MissionDetailResponse } from "@/lib/dcc/earthos/workflows/types";

export const dynamic = "force-dynamic";

const launchSchema = z.object({
  entity: z.enum(["gosno", "alaska", "redrocks", "earthos"]),
  region: z.string().trim().min(2).max(120),
  missionType: z.string().trim().min(2).max(80),
  objective: z.string().trim().min(5).max(240),
});

export async function POST(request: Request) {
  let body: z.infer<typeof launchSchema>;

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

  const mission = await launchWorkflowMission(body);

  const payload: MissionDetailResponse = {
    ok: true,
    mission,
    fetchedAt: new Date().toISOString(),
  };

  return NextResponse.json(payload, { status: 201 });
}
