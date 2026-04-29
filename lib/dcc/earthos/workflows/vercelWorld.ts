import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { setWorld, resumeHook } from "@workflow/core/runtime";
import { hydrateResourceIO } from "@workflow/core/serialization-format";
import { isLegacySpecVersion, type Hook, type Step, type WorkflowRun, type World } from "@workflow/world";
import { createVercelWorld, type APIConfig } from "@workflow/world-vercel";
import type {
  LaunchMissionInput,
  RuntimeMission,
  RuntimeMissionStep,
  WorkflowSignalEvent,
} from "@/lib/dcc/earthos/workflows/types";

type MissionFilters = {
  entity?: string | null;
  status?: string | null;
  region?: string | null;
  search?: string | null;
  limit?: number | null;
};

type ProjectConfigFile = {
  projectId?: string;
  orgId?: string;
  projectName?: string;
};

type HookWithMetadata = Hook & {
  metadata?: Record<string, unknown>;
};

const PROJECT_ROOT = "/home/ewrewr12/destinations-cc";
const PROJECT_CONFIG_PATH = join(PROJECT_ROOT, ".vercel", "project.json");
const CLI_AUTH_PATHS = [
  "/home/ewrewr12/.local/share/com.vercel.cli/auth.json",
  "/home/erichroeseler123/.local/share/com.vercel.cli/auth.json",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toIsoString(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  return date.toISOString();
}

function normalizeEntity(value: unknown): RuntimeMission["entity"] {
  const raw = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (raw === "gosno" || raw === "alaska" || raw === "redrocks" || raw === "earthos") {
    return raw;
  }
  return "earthos";
}

function mapStepStatus(status: Step["status"]): RuntimeMissionStep["status"] {
  if (status === "completed") return "completed";
  if (status === "failed" || status === "cancelled") return "failed";
  return "running";
}

function mapMissionStatus(run: WorkflowRun, hooks: HookWithMetadata[]): RuntimeMission["status"] {
  if (run.status === "completed") return "completed";
  if (run.status === "failed" || run.status === "cancelled") return "failed";
  if (hooks.length > 0) return "waiting";
  return "running";
}

function sortByNewest<T extends { updatedAt?: Date | string; createdAt?: Date | string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const aTime = new Date(a.updatedAt || a.createdAt || 0).getTime();
    const bTime = new Date(b.updatedAt || b.createdAt || 0).getTime();
    return bTime - aTime;
  });
}

function toPlainRecord(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

function pickMissionName(input: Record<string, unknown>, run: WorkflowRun): string {
  const candidates = [input.mission, input.objective, input.title, input.name, run.workflowName];
  const match = candidates.find((value) => typeof value === "string" && value.trim().length > 0);
  return typeof match === "string" ? match : run.workflowName;
}

function pickRegion(input: Record<string, unknown>): string {
  const candidates = [input.region, input.city, input.port, input.venue];
  const match = candidates.find((value) => typeof value === "string" && value.trim().length > 0);
  return typeof match === "string" ? match : "global";
}

function inferWaitingEvent(steps: RuntimeMissionStep[], hooks: HookWithMetadata[]): string | null {
  const hook = sortByNewest(hooks)[0];
  if (hook?.metadata) {
    const candidates = [
      hook.metadata.eventName,
      hook.metadata.waitingForEvent,
      hook.metadata.signal,
      hook.metadata.name,
      hook.metadata.type,
    ];
    const match = candidates.find((value) => typeof value === "string" && value.trim().length > 0);
    if (typeof match === "string") return match;
  }

  const waitingStep = steps.find((step) => step.status === "running" && step.name.toLowerCase().includes("approval"));
  if (waitingStep) return waitingStep.name;
  return hooks.length > 0 ? "external-signal" : null;
}

function inferCurrentStep(steps: RuntimeMissionStep[]): string | null {
  const runningStep = steps.find((step) => step.status === "running");
  if (runningStep) return runningStep.name;

  const latestStep = sortByNewest(
    steps.map((step) => ({
      ...step,
      updatedAt: step.endedAt || step.startedAt || undefined,
      createdAt: step.startedAt || undefined,
    })),
  )[0];

  return latestStep?.name || null;
}

function inferLastCheckpointAt(steps: RuntimeMissionStep[], run: WorkflowRun): string | null {
  const completed = sortByNewest(
    steps
      .filter((step) => step.status === "completed" && step.endedAt)
      .map((step) => ({ ...step, updatedAt: step.endedAt || undefined, createdAt: step.startedAt || undefined })),
  )[0];

  return completed?.endedAt || toIsoString(run.updatedAt);
}

function normalizeStep(step: Step): RuntimeMissionStep {
  return {
    id: step.stepId,
    name: step.stepName,
    status: mapStepStatus(step.status),
    startedAt: toIsoString(step.startedAt),
    endedAt: toIsoString(step.completedAt),
    retryCount: Math.max(0, (step.attempt || 1) - 1),
    output: isRecord(step.output) ? step.output : null,
    errorMessage: step.error?.message || null,
  };
}

function normalizeRun(run: WorkflowRun, steps: Step[], hooks: HookWithMetadata[]): RuntimeMission {
  const hydratedRun = hydrateResourceIO(run, {});
  const hydratedSteps = steps.map((step) => hydrateResourceIO(step, {}));
  const hydratedHooks = hooks.map((hook) => hydrateResourceIO(hook, {} as Record<string, never>)) as HookWithMetadata[];
  const input = toPlainRecord(hydratedRun.input);
  const result = isRecord(hydratedRun.output) ? hydratedRun.output : null;
  const normalizedSteps = sortByNewest(hydratedSteps).map(normalizeStep);
  const status = mapMissionStatus(hydratedRun, hydratedHooks);

  return {
    id: hydratedRun.runId,
    entity: normalizeEntity(input.entity || input.domain || input.business),
    region: pickRegion(input),
    mission: pickMissionName(input, hydratedRun),
    status,
    currentStep: inferCurrentStep(normalizedSteps),
    startedAt: toIsoString(hydratedRun.startedAt) || toIsoString(hydratedRun.createdAt) || new Date().toISOString(),
    updatedAt: toIsoString(hydratedRun.updatedAt) || new Date().toISOString(),
    lastCheckpointAt: inferLastCheckpointAt(normalizedSteps, hydratedRun),
    waitingForEvent: status === "waiting" ? inferWaitingEvent(normalizedSteps, hydratedHooks) : null,
    payload: input,
    result,
    error: hydratedRun.error
      ? {
          message: hydratedRun.error.message,
          step: inferCurrentStep(normalizedSteps) || undefined,
        }
      : null,
    steps: normalizedSteps,
  };
}

async function tryReadJson<T>(filePath: string): Promise<T | null> {
  try {
    const raw = await readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function loadAuthToken(): Promise<string | undefined> {
  if (process.env.VERCEL_TOKEN) return process.env.VERCEL_TOKEN;
  if (process.env.WORKFLOW_VERCEL_TOKEN) return process.env.WORKFLOW_VERCEL_TOKEN;

  for (const filePath of CLI_AUTH_PATHS) {
    const data = await tryReadJson<{ token?: string }>(filePath);
    if (data?.token) return data.token;
  }

  return undefined;
}

async function buildApiConfig(): Promise<APIConfig | null> {
  const token = await loadAuthToken();
  const projectFile = await tryReadJson<ProjectConfigFile>(PROJECT_CONFIG_PATH);
  const projectId = process.env.VERCEL_PROJECT_ID || process.env.WORKFLOW_VERCEL_PROJECT_ID || projectFile?.projectId;
  const teamId = process.env.VERCEL_TEAM_ID || process.env.WORKFLOW_VERCEL_TEAM_ID || projectFile?.orgId;
  const projectName = process.env.VERCEL_PROJECT_NAME || process.env.WORKFLOW_VERCEL_PROJECT_NAME || projectFile?.projectName;
  const environment =
    process.env.WORKFLOW_VERCEL_ENV ||
    process.env.VERCEL_ENV ||
    process.env.VERCEL_TARGET_ENV ||
    "production";

  if (!token || !projectId || !teamId) {
    return null;
  }

  return {
    token,
    projectConfig: {
      projectId,
      projectName,
      teamId,
      environment,
    },
  };
}

async function getWorld(): Promise<World | null> {
  const config = await buildApiConfig();
  if (!config) return null;
  return createVercelWorld(config);
}

function matchesFilter(value: string, candidate: string | null | undefined): boolean {
  return value.trim().toLowerCase() === (candidate || "").trim().toLowerCase();
}

function filterMissions(missions: RuntimeMission[], filters: MissionFilters): RuntimeMission[] {
  let next = missions;

  if (filters.entity) {
    next = next.filter((mission) => matchesFilter(filters.entity!, mission.entity));
  }

  if (filters.status) {
    next = next.filter((mission) => matchesFilter(filters.status!, mission.status));
  }

  if (filters.region) {
    next = next.filter((mission) => mission.region.toLowerCase().includes(filters.region!.toLowerCase()));
  }

  if (filters.search) {
    const needle = filters.search.toLowerCase();
    next = next.filter((mission) =>
      [mission.id, mission.mission, mission.region, mission.entity, mission.currentStep || ""]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }

  if (typeof filters.limit === "number" && Number.isFinite(filters.limit) && filters.limit > 0) {
    next = next.slice(0, filters.limit);
  }

  return next;
}

export async function listLiveRuntimeMissions(filters: MissionFilters = {}): Promise<RuntimeMission[] | null> {
  const world = await getWorld();
  if (!world) return null;

  try {
    const runsResponse = await world.runs.list({
      pagination: {
        limit: Math.min(filters.limit || 50, 100),
        sortOrder: "desc",
      },
      resolveData: "all",
    });

    const missions = await Promise.all(
      runsResponse.data.map(async (run) => {
        const [stepsResponse, hooksResponse] = await Promise.all([
          world.steps.list({
            runId: run.runId,
            pagination: {
              limit: 100,
              sortOrder: "desc",
            },
            resolveData: "all",
          }),
          world.hooks.list({
            runId: run.runId,
            pagination: {
              limit: 20,
              sortOrder: "desc",
            },
            resolveData: "all",
          }),
        ]);

        return normalizeRun(run, stepsResponse.data, hooksResponse.data as HookWithMetadata[]);
      }),
    );

    return filterMissions(missions, filters);
  } catch {
    return null;
  }
}

export async function getLiveRuntimeMission(id: string): Promise<RuntimeMission | null> {
  const world = await getWorld();
  if (!world) return null;

  try {
    const [run, stepsResponse, hooksResponse] = await Promise.all([
      world.runs.get(id, { resolveData: "all" }),
      world.steps.list({
        runId: id,
        pagination: {
          limit: 100,
          sortOrder: "desc",
        },
        resolveData: "all",
      }),
      world.hooks.list({
        runId: id,
        pagination: {
          limit: 20,
          sortOrder: "desc",
        },
        resolveData: "all",
      }),
    ]);

    return normalizeRun(run, stepsResponse.data, hooksResponse.data as HookWithMetadata[]);
  } catch {
    return null;
  }
}

export async function signalLiveRuntimeMission(
  id: string,
  event: WorkflowSignalEvent,
  payload?: Record<string, unknown>,
): Promise<RuntimeMission | null> {
  const world = await getWorld();
  if (!world) return null;

  try {
    if (event === "mission-cancel") {
      const run = await world.runs.get(id, { resolveData: "all" });

      await world.events.create(
        id,
        {
          eventType: "run_cancelled",
          correlationId: `earthos_cancel_${Date.now()}`,
        },
        {
          v1Compat: isLegacySpecVersion(run.specVersion),
          resolveData: "all",
        },
      );

      return getLiveRuntimeMission(id);
    }

    const hooksResponse = await world.hooks.list({
      runId: id,
      pagination: {
        limit: 20,
        sortOrder: "desc",
      },
      resolveData: "all",
    });

    const hook = sortByNewest(hooksResponse.data as HookWithMetadata[])[0];
    if (!hook) return null;

    setWorld(world);
    await resumeHook(hook.token, payload || {});

    return getLiveRuntimeMission(id);
  } catch {
    return null;
  }
}

export async function launchLiveRuntimeMission(input: LaunchMissionInput): Promise<RuntimeMission | null> {
  const world = await getWorld();
  if (!world) return null;

  try {
    const deploymentId = world.resolveLatestDeploymentId
      ? await world.resolveLatestDeploymentId()
      : process.env.VERCEL_DEPLOYMENT_ID;

    if (!deploymentId) {
      return null;
    }

    const result = await world.events.create(null, {
      eventType: "run_created",
      correlationId: `earthos_launch_${Date.now()}`,
      eventData: {
        deploymentId,
        workflowName: "earthos",
        input: {
          entity: input.entity,
          region: input.region,
          missionType: input.missionType,
          objective: input.objective,
          launchSource: "dashboard",
        },
        executionContext: {
          initiatedBy: "dashboard",
        },
      },
    });

    if (!result.run) return null;

    const mission = await getLiveRuntimeMission(result.run.runId);
    if (mission) return mission;

    return normalizeRun(result.run, [], []);
  } catch {
    return null;
  }
}
