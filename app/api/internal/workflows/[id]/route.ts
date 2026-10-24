import { NextResponse } from "next/server";
import {
  buildEarthOSUnauthorizedResponse,
  verifyEarthOSAuthorization,
} from "@/lib/dcc/earthos/auth";
import { getWorkflowMission } from "@/lib/dcc/earthos/workflows/service";
import type { MissionDetailResponse } from "@/lib/dcc/earthos/workflows/types";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await verifyEarthOSAuthorization(request);
  if (!auth.authorized) {
    return buildEarthOSUnauthorizedResponse(auth);
  }

  const { id } = await context.params;
  const mission = await getWorkflowMission(id);

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
