import type {
  LaunchMissionInput,
  MissionDetail,
  MissionIntelligence,
  MissionPublication,
  MissionListItem,
  MissionRiskLevel,
  MissionStatus,
  MissionStep,
  RuntimeMission,
  RuntimeMissionStep,
  WorkflowSignalEvent,
} from "@/lib/dcc/earthos/workflows/types";
import {
  APPROVAL_SLA_MS,
  appendRuntimeMission,
  findRuntimeMission,
  findMissionPublicationBySlug,
  readMissionPublications,
  readRuntimeMissions,
  STALE_AFTER_MS,
  upsertMissionPublication,
  updateRuntimeMission,
} from "@/lib/dcc/earthos/workflows/store";
import {
  getLiveRuntimeMission,
  launchLiveRuntimeMission,
  listLiveRuntimeMissions,
  signalLiveRuntimeMission,
} from "@/lib/dcc/earthos/workflows/vercelWorld";
import {
  findDbMissionPublicationByMissionId,
  findDbMissionPublicationBySlug,
  listDbMissionPublications,
  upsertDbMissionPublication,
} from "@/lib/dcc/earthos/workflows/publicationsDb";
import {
  getDbRuntimeMission,
  listDbRuntimeMissions,
  upsertDbMissionSnapshot,
} from "@/lib/dcc/earthos/workflows/missionsDb";
import type { DccMissionApprovalEmailProps } from "@/lib/mailer/templates/dccMissionApproval";

type MissionFilters = {
  entity?: string | null;
  status?: string | null;
  region?: string | null;
  search?: string | null;
  limit?: number | null;
};

function toDurationMs(startedAt: string, endedAt?: string | null): number | null {
  const start = new Date(startedAt).getTime();
  if (!Number.isFinite(start)) return null;
  const end = endedAt ? new Date(endedAt).getTime() : Date.now();
  if (!Number.isFinite(end)) return null;
  return Math.max(0, end - start);
}

function isStaleMission(mission: RuntimeMission, now: Date): boolean {
  if (mission.status !== "running" || !mission.lastCheckpointAt) return false;
  return now.getTime() - new Date(mission.lastCheckpointAt).getTime() > STALE_AFTER_MS;
}

function isOverdueApproval(mission: RuntimeMission, now: Date): boolean {
  if (mission.status !== "waiting" || !mission.updatedAt) return false;
  return now.getTime() - new Date(mission.updatedAt).getTime() > APPROVAL_SLA_MS;
}

function buildProgressPercent(steps: RuntimeMissionStep[]): number | null {
  if (steps.length === 0) return null;
  const completed = steps.filter((step) => step.status === "completed").length;
  return Math.round((completed / steps.length) * 100);
}

function toOutputPreview(output: Record<string, unknown> | null): string | null {
  if (!output) return null;
  const serialized = JSON.stringify(output);
  if (serialized.length <= 180) return serialized;
  return `${serialized.slice(0, 177)}...`;
}

function normalizeMissionStep(step: RuntimeMissionStep): MissionStep {
  return {
    id: step.id,
    name: step.name,
    status: step.status,
    startedAt: step.startedAt,
    endedAt: step.endedAt,
    retryCount: step.retryCount,
    outputPreview: toOutputPreview(step.output),
    errorMessage: step.errorMessage,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function readNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function readRiskLevel(value: unknown): MissionRiskLevel | null {
  return value === "High" || value === "Watch" || value === "Normal" ? value : null;
}

function buildHeadline(
  mission: RuntimeMission,
  riskLevel: MissionRiskLevel,
  recommendedAction: string,
): string {
  if (mission.status === "failed") return "MISSION TERMINATED";
  if (mission.status === "completed") return "DISPATCH SUCCESSFUL";
  if (riskLevel === "High" && mission.entity === "alaska") return "PORT COMPRESSION DETECTED";
  if (riskLevel === "High" && mission.entity === "gosno") return "CONDITION PRESSURE DETECTED";
  if (riskLevel === "Watch" && mission.entity === "gosno") return "POWDER DEMAND HIGH";
  if (riskLevel === "Watch") return "ELEVATED ATTENTION";
  if (recommendedAction.toLowerCase().includes("monitor")) return "NOMINAL - MONITOR ONLY";
  return "MISSION ACTIVE";
}

function normalizeMissionIntelligence(mission: RuntimeMission): MissionIntelligence | null {
  const result = mission.result;
  const payload = mission.payload;
  const synthesis = isRecord(result?.synthesis) ? result.synthesis : null;
  const dccContext = isRecord(result?.dccContext) ? result.dccContext : null;

  const briefing =
    (synthesis && typeof synthesis.briefing === "string" ? synthesis.briefing : null) ||
    (isRecord(result) && typeof result.briefing === "string" ? result.briefing : null) ||
    (mission.status === "failed" ? mission.error?.message || null : null) ||
    null;

  const recommendedAction =
    (synthesis && typeof synthesis.recommendedAction === "string"
      ? synthesis.recommendedAction
      : null) ||
    (isRecord(result) && typeof result.recommendedAction === "string"
      ? result.recommendedAction
      : null) ||
    (mission.status === "completed"
      ? "Dispatch complete"
      : mission.status === "failed"
        ? "Mission terminated"
        : null) ||
    null;

  const riskLevel =
    (synthesis ? readRiskLevel(synthesis.riskLevel) : null) ||
    (isRecord(result) ? readRiskLevel(result.riskLevel) : null) ||
    (mission.status === "failed"
      ? "High"
      : mission.status === "completed"
        ? "Normal"
        : null);

  const alertCount =
    (dccContext && readNumber(dccContext.alertCount)) ||
    (isRecord(payload) && readNumber(payload.alertCount)) ||
    0;

  const graphHealth =
    (dccContext && isRecord(dccContext.networkStatus) && readNumber(dccContext.networkStatus.placesTracked)) ||
    (dccContext && readNumber(dccContext.graphHealth)) ||
    (isRecord(payload) && readNumber(payload.graphHealth)) ||
    null;

  if (!briefing && !recommendedAction && !riskLevel && mission.status === "running") {
    return null;
  }

  const resolvedRiskLevel = riskLevel || "Normal";
  const resolvedAction = recommendedAction || "Monitor";
  const resolvedBriefing =
    briefing || "EarthOS has not produced a synthesized briefing for this mission yet.";

  return {
    headline: buildHeadline(mission, resolvedRiskLevel, resolvedAction),
    briefing: resolvedBriefing,
    riskLevel: resolvedRiskLevel,
    recommendedAction: resolvedAction,
    dccSignals: {
      alertCount,
      graphHealth,
    },
  };
}

function normalizeMissionListItem(mission: RuntimeMission, now: Date): MissionListItem {
  return {
    id: mission.id,
    entity: mission.entity,
    region: mission.region,
    mission: mission.mission,
    status: mission.status,
    currentStep: mission.currentStep,
    progressPercent: buildProgressPercent(mission.steps),
    startedAt: mission.startedAt,
    updatedAt: mission.updatedAt,
    lastCheckpointAt: mission.lastCheckpointAt,
    waitingForEvent: mission.waitingForEvent,
    durationMs: toDurationMs(mission.startedAt, mission.status === "completed" ? mission.updatedAt : null),
    errorMessage: mission.error?.message || null,
    isStale: isStaleMission(mission, now),
    isOverdueApproval: isOverdueApproval(mission, now),
    intelligence: normalizeMissionIntelligence(mission),
  };
}

function normalizeMissionDetail(mission: RuntimeMission, now: Date): MissionDetail {
  return {
    id: mission.id,
    entity: mission.entity,
    region: mission.region,
    mission: mission.mission,
    status: mission.status,
    currentStep: mission.currentStep,
    startedAt: mission.startedAt,
    updatedAt: mission.updatedAt,
    lastCheckpointAt: mission.lastCheckpointAt,
    waitingForEvent: mission.waitingForEvent,
    payload: mission.payload,
    result: mission.result,
    error: mission.error,
    durationMs: toDurationMs(mission.startedAt, mission.status === "completed" ? mission.updatedAt : null),
    isStale: isStaleMission(mission, now),
    isOverdueApproval: isOverdueApproval(mission, now),
    intelligence: normalizeMissionIntelligence(mission),
    publication: null,
    steps: mission.steps.map(normalizeMissionStep),
  };
}

async function persistMissionSnapshot(mission: RuntimeMission): Promise<void> {
  await upsertDbMissionSnapshot(mission, normalizeMissionIntelligence(mission));
}

async function findMissionPublicationByMissionId(id: string): Promise<MissionPublication | null> {
  return (await findDbMissionPublicationByMissionId(id)) || findMissionPublicationBySlugFromStoreId(id);
}

function findMissionPublicationBySlugFromStoreId(id: string): MissionPublication | null {
  return readMissionPublications().find((publication) => publication.missionId === id) || null;
}

function slugifyHeadline(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
}

function matchesFilter(value: string, candidate: string | null | undefined): boolean {
  return value.trim().toLowerCase() === (candidate || "").trim().toLowerCase();
}

function sortMissions(missions: RuntimeMission[]): RuntimeMission[] {
  const weight: Record<MissionStatus, number> = {
    waiting: 0,
    failed: 1,
    running: 2,
    completed: 3,
  };

  return [...missions].sort((a, b) => {
    if (weight[a.status] !== weight[b.status]) {
      return weight[a.status] - weight[b.status];
    }
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

function hasApprovalEmailAttempt(mission: RuntimeMission): boolean {
  return mission.steps.some((step) => {
    const eventType = isRecord(step.output) ? step.output.eventType : null;
    return eventType === "approval_email_sent" || eventType === "email_dispatch_failed";
  });
}

function getApprovalEmailAttemptSteps(mission: RuntimeMission): RuntimeMissionStep[] {
  return mission.steps.filter((step) => {
    const eventType = isRecord(step.output) ? step.output.eventType : null;
    return eventType === "approval_email_sent" || eventType === "email_dispatch_failed";
  });
}

function mergeApprovalEmailAttemptSteps(mission: RuntimeMission, existingSnapshot: RuntimeMission): RuntimeMission {
  const currentStepIds = new Set(mission.steps.map((step) => step.id));
  const missingSteps = getApprovalEmailAttemptSteps(existingSnapshot).filter((step) => !currentStepIds.has(step.id));
  if (missingSteps.length === 0) return mission;
  return {
    ...mission,
    steps: [...mission.steps, ...missingSteps],
  };
}

function buildMissionActionUrl(missionId: string, action: "approve" | "reject"): string {
  const baseUrl = process.env.DCC_PUBLIC_BASE_URL || "https://www.destinationcommandcenter.com";
  const url = new URL(`/dashboard/missions/${encodeURIComponent(missionId)}`, baseUrl);
  url.searchParams.set("action", action);
  return url.toString();
}

function appendMailerTimelineEvent(
  mission: RuntimeMission,
  event: {
    eventType: "approval_email_sent" | "email_dispatch_failed";
    occurredAt: string;
    messageId?: string;
    error?: string;
    toCount: number;
    ccCount: number;
    bccCount: number;
    recipientsHash: string;
  },
): RuntimeMission {
  return {
    ...mission,
    updatedAt: event.occurredAt,
    steps: [
      ...mission.steps,
      {
        id: `step_${event.eventType}_${mission.id}_${Date.now()}`,
        name: event.eventType,
        status: event.eventType === "approval_email_sent" ? "completed" : "failed",
        startedAt: event.occurredAt,
        endedAt: event.occurredAt,
        retryCount: 0,
        output: {
          eventType: event.eventType,
          messageId: event.messageId,
          error: event.error,
          toCount: event.toCount,
          ccCount: event.ccCount,
          bccCount: event.bccCount,
          recipientsHash: event.recipientsHash,
        },
        errorMessage: event.error || null,
      },
    ],
  };
}

async function ensureApprovalEmailDispatched(mission: RuntimeMission): Promise<RuntimeMission> {
  if (mission.status !== "waiting") return mission;
  if (!mission.waitingForEvent?.toLowerCase().includes("approval")) return mission;
  if (hasApprovalEmailAttempt(mission)) return mission;

  const existingSnapshot = await getDbRuntimeMission(mission.id);
  if (existingSnapshot && hasApprovalEmailAttempt(existingSnapshot)) {
    return mergeApprovalEmailAttemptSteps(mission, existingSnapshot);
  }

  const now = new Date().toISOString();
  const intelligence = normalizeMissionIntelligence(mission);
  const payload = isRecord(mission.payload) ? mission.payload : {};
  const result = isRecord(mission.result) ? mission.result : {};
  const dccContext = isRecord(result.dccContext) ? result.dccContext : {};
  const synthesis = isRecord(result.synthesis) ? result.synthesis : {};
  const templateContext: DccMissionApprovalEmailProps = {
    missionId: mission.id,
    priorityLevel: intelligence?.riskLevel || readString(synthesis.riskLevel) || "Watch",
    decisionCorridor:
      readString(payload.decision_corridor) ||
      readString(payload.corridorId) ||
      `${mission.entity}:${mission.region}`,
    decisionAction:
      intelligence?.recommendedAction ||
      readString(synthesis.recommendedAction) ||
      readString(payload.decision_action) ||
      mission.waitingForEvent ||
      "Operator approval required",
    approveUrl: buildMissionActionUrl(mission.id, "approve"),
    rejectUrl: buildMissionActionUrl(mission.id, "reject"),
    dccHandoffId: readString(payload.dcc_handoff_id) || readString(dccContext.dcc_handoff_id),
    timestamp: now,
  };

  const [{ sendMissionNotification }, { DccMissionApprovalEmail }] = await Promise.all([
    import("@/lib/mailer/send"),
    import("@/lib/mailer/templates/dccMissionApproval"),
  ]);

  const resultEnvelope = await sendMissionNotification({
    missionId: mission.id,
    brandId: "DCC",
    template: DccMissionApprovalEmail,
    context: templateContext,
    subject: `[DCC] Mission Approval Required: ${mission.entity.toUpperCase()} ${mission.region}`,
  });

  const nextMission = appendMailerTimelineEvent(mission, {
    eventType: resultEnvelope.success ? "approval_email_sent" : "email_dispatch_failed",
    occurredAt: now,
    messageId: resultEnvelope.messageId,
    error: resultEnvelope.error,
    toCount: resultEnvelope.toCount,
    ccCount: resultEnvelope.ccCount,
    bccCount: resultEnvelope.bccCount,
    recipientsHash: resultEnvelope.recipientsHash,
  });

  if (!existingSnapshot) {
    updateRuntimeMission(mission.id, () => nextMission);
  }

  return nextMission;
}

export async function listWorkflowMissions(filters: MissionFilters = {}): Promise<MissionListItem[]> {
  const now = new Date();
  const liveMissions = await listLiveRuntimeMissions(filters);
  const dbMissions = liveMissions ? null : await listDbRuntimeMissions(filters);
  let missions = sortMissions(liveMissions || dbMissions || readRuntimeMissions());

  if (liveMissions && liveMissions.length > 0) {
    missions = await Promise.all(missions.map((mission) => ensureApprovalEmailDispatched(mission)));
    await Promise.all(missions.map((mission) => persistMissionSnapshot(mission)));
  }

  if (filters.entity) {
    missions = missions.filter((mission) => matchesFilter(filters.entity!, mission.entity));
  }

  if (filters.status) {
    missions = missions.filter((mission) => matchesFilter(filters.status!, mission.status));
  }

  if (filters.region) {
    missions = missions.filter((mission) => mission.region.toLowerCase().includes(filters.region!.toLowerCase()));
  }

  if (filters.search) {
    const needle = filters.search.toLowerCase();
    missions = missions.filter((mission) =>
      [mission.id, mission.mission, mission.region, mission.entity, mission.currentStep || ""]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }

  if (typeof filters.limit === "number" && Number.isFinite(filters.limit) && filters.limit > 0) {
    missions = missions.slice(0, filters.limit);
  }

  return missions.map((mission) => normalizeMissionListItem(mission, now));
}

export async function getWorkflowMission(id: string): Promise<MissionDetail | null> {
  const liveMission = await getLiveRuntimeMission(id);
  if (liveMission) {
    await persistMissionSnapshot(liveMission);
  }

  const mission = liveMission || (await getDbRuntimeMission(id)) || findRuntimeMission(id);
  if (!mission) return null;
  const notifiedMission = await ensureApprovalEmailDispatched(mission);
  await persistMissionSnapshot(notifiedMission);
  const detail = normalizeMissionDetail(notifiedMission, new Date());
  detail.publication = await findMissionPublicationByMissionId(mission.id);
  return detail;
}

export async function signalWorkflowMission(
  id: string,
  event: WorkflowSignalEvent,
  payload?: Record<string, unknown>,
): Promise<MissionDetail | null> {
  const liveMission = await signalLiveRuntimeMission(id, event, payload);
  if (liveMission) {
    await persistMissionSnapshot(liveMission);
    const detail = normalizeMissionDetail(liveMission, new Date());
    detail.publication = await findMissionPublicationByMissionId(liveMission.id);
    return detail;
  }

  const updated = updateRuntimeMission(id, (mission) => {
    const now = new Date().toISOString();

    if (event === "mission-cancel") {
      const updatedSteps = mission.steps.map((step) => {
        if (step.status === "running" || step.status === "waiting") {
          return {
            ...step,
            status: "failed" as const,
            endedAt: now,
            errorMessage: "Mission cancelled by operator.",
          };
        }
        return step;
      });

      return {
        ...mission,
        status: "failed" as const,
        currentStep: mission.currentStep,
        updatedAt: now,
        waitingForEvent: null,
        error: {
          message: "Mission cancelled by operator.",
          step: mission.currentStep || undefined,
        },
        steps: updatedSteps,
      };
    }

    const approved = payload?.approved === true;
    const rejected = payload?.approved === false;
    const approvalIndex = mission.steps.findIndex((step) => step.name === "erich-approval");
    const updatedSteps = [...mission.steps];

    if (approvalIndex >= 0) {
      updatedSteps[approvalIndex] = {
        ...updatedSteps[approvalIndex],
        status: approved ? "completed" : "failed",
        endedAt: now,
        errorMessage: rejected ? "Dispatch rejected by operator." : null,
        output: {
          ...(updatedSteps[approvalIndex].output || {}),
          approved,
        },
      };
    }

    if (rejected) {
      return {
        ...mission,
        status: "failed" as const,
        currentStep: "erich-approval",
        updatedAt: now,
        waitingForEvent: null,
        error: {
          message: "Dispatch rejected by operator.",
          step: "erich-approval",
        },
        steps: updatedSteps,
      };
    }

    updatedSteps.push({
      id: `dispatch_${id}`,
      name: "dispatch-ops",
      status: "completed",
      startedAt: now,
      endedAt: now,
      retryCount: 0,
      output: {
        dispatchedAt: now,
        approvalSource: "operator",
      },
      errorMessage: null,
    });

    return {
      ...mission,
      status: "completed" as const,
      currentStep: "dispatch-ops",
      updatedAt: now,
      lastCheckpointAt: now,
      waitingForEvent: null,
      result: {
        ...(mission.result || {}),
        dispatchStatus: "approved_and_executed",
      },
      error: null,
      steps: updatedSteps,
    };
  });

  if (!updated) return null;
  await persistMissionSnapshot(updated);
  const detail = normalizeMissionDetail(updated, new Date());
  detail.publication = await findMissionPublicationByMissionId(updated.id);
  return detail;
}

export async function launchWorkflowMission(input: LaunchMissionInput): Promise<MissionDetail> {
  const liveMission = await launchLiveRuntimeMission(input);
  if (liveMission) {
    const notifiedMission = await ensureApprovalEmailDispatched(liveMission);
    await persistMissionSnapshot(notifiedMission);
    const detail = normalizeMissionDetail(notifiedMission, new Date());
    detail.publication = await findMissionPublicationByMissionId(notifiedMission.id);
    return detail;
  }

  const mission = appendRuntimeMission(input);
  await persistMissionSnapshot(mission);
  const detail = normalizeMissionDetail(mission, new Date());
  detail.publication = await findMissionPublicationByMissionId(mission.id);
  return detail;
}

export async function publishWorkflowMission(id: string): Promise<MissionDetail | null> {
  const mission = await getWorkflowMission(id);
  if (!mission || mission.status !== "completed" || !mission.intelligence) {
    return null;
  }

  const slugBase = slugifyHeadline(`${mission.region} ${mission.intelligence.headline}`);
  const slugSuffix = mission.id.slice(-6).replace(/[^a-z0-9]+/gi, "").toLowerCase() || "update";
  const publication: MissionPublication = {
    missionId: mission.id,
    slug: `${slugBase || "live-update"}-${slugSuffix}`,
    path: `/live-ops/${slugBase || "live-update"}-${slugSuffix}`,
    entity: mission.entity,
    region: mission.region,
    headline: mission.intelligence.headline,
    briefing: mission.intelligence.briefing,
    riskLevel: mission.intelligence.riskLevel,
    recommendedAction: mission.intelligence.recommendedAction,
    publishedAt: new Date().toISOString(),
    networkTarget: "live-ops",
  };

  upsertMissionPublication(publication);
  await upsertDbMissionPublication(publication);
  return getWorkflowMission(id);
}

export async function getPublishedWorkflowMissionBySlug(slug: string): Promise<MissionPublication | null> {
  return (await findDbMissionPublicationBySlug(slug)) || findMissionPublicationBySlug(slug);
}

export async function listPublishedWorkflowMissions(): Promise<MissionPublication[]> {
  const dbPublications = await listDbMissionPublications();
  if (dbPublications.length > 0) return dbPublications;

  return [...readMissionPublications()].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
}
