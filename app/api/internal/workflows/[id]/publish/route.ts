import { NextResponse } from "next/server";
import { publishWorkflowMission } from "@/lib/dcc/earthos/workflows/service";
import type { MissionDetailResponse } from "@/lib/dcc/earthos/workflows/types";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const mission = await publishWorkflowMission(id);

  if (!mission) {
    return NextResponse.json({ ok: false, error: "mission_not_publishable" }, { status: 400 });
  }

  const payload: MissionDetailResponse = {
    ok: true,
    mission,
    fetchedAt: new Date().toISOString(),
  };

  return NextResponse.json(payload, { status: 200 });
}
