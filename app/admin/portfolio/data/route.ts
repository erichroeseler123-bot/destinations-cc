import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, isValidAdminSession } from "@/lib/adminAccess";
import { getHandoffAnalyticsSnapshot } from "@/lib/dcc/handoffAnalytics";
import { listRecentProductionCorridorEvents } from "@/lib/dcc/telemetry/corridorEvents";
import { listWorkflowMissions } from "@/lib/dcc/earthos/workflows/service";

export const dynamic = "force-dynamic";

function metadataOf(event: any) {
  return event?.metadata && typeof event.metadata === "object" ? event.metadata as Record<string, any> : {};
}

function siteOf(event: any) {
  const metadata = metadataOf(event);
  if (event?.corridorId === "wno-commerce") return "wno";
  return String(metadata.site || "dcc");
}

function originalName(event: any) {
  return String(metadataOf(event).original_event_name || event?.eventName || "event");
}

function eventTime(event: any) {
  const raw = event?.occurredAt || event?.occurred_at || event?.createdAt || event?.created_at || null;
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export async function GET(request: NextRequest) {
  const session = request.cookies.get(ADMIN_SESSION_COOKIE)?.value || null;
  if (!isValidAdminSession(session)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const [events, missions] = await Promise.all([
    listRecentProductionCorridorEvents(10000),
    listWorkflowMissions(),
  ]);
  const snapshot = getHandoffAnalyticsSnapshot(500);

  const relevant = events.filter((event: any) => event.corridorId === "portfolio-network" || event.corridorId === "wno-commerce");
  const changes = relevant
    .map((event: any) => ({
      occurredAt: eventTime(event),
      site: siteOf(event),
      eventName: originalName(event),
    }))
    .filter((event: any) => Boolean(event.occurredAt))
    .sort((a: any, b: any) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
    .slice(0, 500);

  const wno = events.filter((event: any) => event.corridorId === "wno-commerce");
  const wnoFareHarborOpens = wno.filter((event: any) => event.eventName === "booking_opened").length;
  const portfolio = events.filter((event: any) => event.corridorId === "portfolio-network");
  const cruise = portfolio.filter((event: any) => siteOf(event) === "cruise-promenade");
  const cruisePlannerSaves = cruise.filter((event: any) => originalName(event) === "planner_saved").length;
  const cruisePlannerShares = cruise.filter((event: any) => originalName(event) === "planner_shared").length;
  const missionWaiting = missions.filter((mission: any) => mission.status === "waiting").length;
  const missionFailed = missions.filter((mission: any) => mission.status === "failed").length;

  return NextResponse.json({
    ok: true,
    events: changes,
    snapshot: {
      trackedHandoffs: snapshot.totalHandoffs,
      completedHandoffs: snapshot.completed,
      grossRevenue: snapshot.grossRevenue,
      attention: snapshot.urgentAlerts.length + missionWaiting + missionFailed,
      wnoFareHarborOpens,
      cruisePlannerSaves,
      cruisePlannerShares,
    },
  });
}
