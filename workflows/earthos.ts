import { createHook } from "workflow";
import { getCommandViewData } from "@/lib/dcc/command/service";
import { listRecentSatelliteEvents, type DccSatelliteId } from "@/lib/dcc/satelliteHandoffs";
import type { LaunchMissionInput, MissionEntity } from "@/lib/dcc/earthos/workflows/types";

type DccContext = {
  alertCount: number;
  topAlert: string;
  relevantAlerts: Array<{
    id: string;
    title: string;
    impact: string;
    severity: string;
  }>;
  relevantEvents: Array<{
    id: string;
    title: string;
    detail: string;
    severity: string;
  }>;
  networkStatus: {
    placesTracked: number;
    activeRoutes: number;
    liveAlerts: number;
    recentEvents: number;
    portsMonitored: number;
  };
};

type EarthOSSynthesis = {
  briefing: string;
  recommendedAction:
    | "Monitor only"
    | "Assess Road Viability"
    | "Notify Drivers"
    | "Reallocate Shuttles"
    | "Immediate Satellite Dispatch";
  riskLevel: "Normal" | "Watch" | "High";
};

type ApprovalPayload = {
  approved: boolean;
  comment?: string;
};

function satelliteForEntity(entity: MissionEntity): DccSatelliteId | null {
  if (entity === "gosno") return "gosno";
  if (entity === "alaska") return "welcome-to-alaska";
  if (entity === "redrocks") return "partyatredrocks";
  return null;
}

function buildNeedles(input: LaunchMissionInput): string[] {
  const regionTokens = input.region
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2);

  return Array.from(new Set([input.entity.toLowerCase(), ...regionTokens]));
}

function includesNeedle(value: string, needles: string[]): boolean {
  const haystack = value.toLowerCase();
  return needles.some((needle) => haystack.includes(needle));
}

async function scanDccSignals(input: LaunchMissionInput): Promise<DccContext> {
  "use step";

  const view = await getCommandViewData();
  const needles = buildNeedles(input);
  const relevantAlerts = view.alerts.filter(
    (alert) => includesNeedle(alert.title, needles) || includesNeedle(alert.impact, needles),
  );
  const relevantEvents = view.liveStream.filter(
    (event) => includesNeedle(event.title, needles) || includesNeedle(event.detail, needles),
  );

  return {
    alertCount: relevantAlerts.length,
    topAlert: relevantAlerts[0]?.impact || relevantAlerts[0]?.title || "No immediate corridor pressure detected.",
    relevantAlerts: relevantAlerts.slice(0, 3),
    relevantEvents: relevantEvents.slice(0, 3),
    networkStatus: view.networkStatus,
  };
}

async function synthesizeBriefing(
  input: LaunchMissionInput,
  dccContext: DccContext,
): Promise<EarthOSSynthesis> {
  "use step";

  const hasCritical = dccContext.relevantAlerts.some(
    (alert) => alert.severity === "critical" || alert.severity === "busy",
  );
  const isCompressed =
    dccContext.relevantAlerts.some(
      (alert) =>
        alert.title.toLowerCase().includes("compression") ||
        alert.impact.toLowerCase().includes("compression"),
    ) ||
    dccContext.relevantEvents.some(
      (event) =>
        event.title.toLowerCase().includes("compression") ||
        event.detail.toLowerCase().includes("compression"),
    );
  const hasMountainPressure =
    input.entity === "gosno" &&
    [
      ...dccContext.relevantAlerts.map((alert) => `${alert.title} ${alert.impact}`),
      ...dccContext.relevantEvents.map((event) => `${event.title} ${event.detail}`),
    ].some((value) => /traction|snow|closure|powder|demand/i.test(value));
  const graphHealth =
    dccContext.networkStatus.activeRoutes > 0
      ? Math.round(
          ((dccContext.networkStatus.activeRoutes - dccContext.networkStatus.liveAlerts) /
            dccContext.networkStatus.activeRoutes) *
            100,
        )
      : 100;

  const riskLevel =
    hasCritical || isCompressed || graphHealth < 85
      ? "High"
      : hasMountainPressure
        ? "Watch"
      : dccContext.alertCount > 2
        ? "Watch"
        : dccContext.alertCount > 0
          ? "Watch"
          : "Normal";

  const recommendedAction =
    riskLevel === "High" && input.entity === "alaska"
      ? "Immediate Satellite Dispatch"
      : input.entity === "gosno" && hasMountainPressure
        ? "Assess Road Viability"
      : riskLevel === "High"
        ? "Reallocate Shuttles"
        : dccContext.alertCount > 2
          ? "Notify Drivers"
          : "Monitor only";

  const headlineContext =
    input.entity === "alaska" && riskLevel === "High"
      ? "Port compression risk is active."
      : input.entity === "alaska" && riskLevel === "Watch"
        ? "Port pressure is building."
        : input.entity === "gosno" && hasMountainPressure
          ? "Powder demand is rising and mountain access needs a road-viability check."
        : "Network conditions are within expected range.";

  return {
    briefing: `EarthOS analysis for ${input.entity} in ${input.region}: ${headlineContext} ${input.objective} DCC surfaced ${dccContext.alertCount} relevant alerts. Top pressure: ${dccContext.topAlert} Network snapshot: ${dccContext.networkStatus.activeRoutes} active routes, ${dccContext.networkStatus.liveAlerts} live alerts, ${dccContext.networkStatus.recentEvents} recent events.`,
    recommendedAction,
    riskLevel,
  };
}

async function executeSatelliteDispatch(input: LaunchMissionInput, synthesis: EarthOSSynthesis) {
  "use step";

  const satelliteId = satelliteForEntity(input.entity);
  const recentSatelliteEvents = satelliteId ? listRecentSatelliteEvents(satelliteId, 3) : [];

  return {
    status: "Dispatch log generated",
    targetSatellite: satelliteId || input.entity,
    handoffContext: synthesis.briefing,
    recentSatelliteEvents: recentSatelliteEvents.map((event) => ({
      eventId: event.eventId,
      eventType: event.eventType,
      occurredAt: event.occurredAt || event.receivedAt,
    })),
  };
}

export async function earthosMissionWorkflow(input: LaunchMissionInput) {
  "use workflow";

  const dccContext = await scanDccSignals(input);
  const synthesis = await synthesizeBriefing(input, dccContext);

  let approval: ApprovalPayload | null = null;

  if (synthesis.recommendedAction !== "Monitor only") {
    const approvalHook = createHook<ApprovalPayload>({
      metadata: {
        eventName: "erich-approval",
        entity: input.entity,
        region: input.region,
        objective: input.objective,
        missionType: input.missionType,
      },
    });

    approval = await approvalHook;

    if (!approval.approved) {
      return {
        status: "Mission Rejected",
        dccContext,
        synthesis,
        approval,
      };
    }
  }

  const dispatch = await executeSatelliteDispatch(input, synthesis);

  return {
    status: "Mission Success",
    dccContext,
    synthesis,
    approval,
    dispatch,
  };
}
