import { NextResponse } from "next/server";
import { listWorkflowMissions } from "@/lib/dcc/earthos/workflows/service";
import type { MissionListResponse } from "@/lib/dcc/earthos/workflows/types";

export const dynamic = "force-dynamic";

function parseLimit(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.min(parsed, 100);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const payload: MissionListResponse = {
    ok: true,
    missions: await listWorkflowMissions({
      entity: searchParams.get("entity"),
      status: searchParams.get("status"),
      region: searchParams.get("region"),
      search: searchParams.get("search"),
      limit: parseLimit(searchParams.get("limit")),
    }),
    fetchedAt: new Date().toISOString(),
  };

  return NextResponse.json(payload, { status: 200 });
}
