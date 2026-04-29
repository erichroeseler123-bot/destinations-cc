import "server-only";

import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { getDb, hasDb } from "@/lib/db/client";
import { earthosMissions, earthosMissionSteps } from "@/lib/db/schema";
import type {
  MissionEntity,
  MissionIntelligence,
  MissionStatus,
  RuntimeMission,
  RuntimeMissionStep,
} from "@/lib/dcc/earthos/workflows/types";

type MissionFilters = {
  entity?: string | null;
  status?: string | null;
  region?: string | null;
  search?: string | null;
  limit?: number | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseMissionEntity(value: string): MissionEntity {
  if (value === "gosno" || value === "alaska" || value === "redrocks" || value === "earthos") {
    return value;
  }
  return "earthos";
}

function parseMissionStatus(value: string): MissionStatus {
  if (value === "running" || value === "waiting" || value === "failed" || value === "completed") {
    return value;
  }
  return "running";
}

function normalizeStepRow(
  row: typeof earthosMissionSteps.$inferSelect,
): RuntimeMissionStep {
  return {
    id: row.stepId,
    name: row.name,
    status: parseMissionStatus(row.status),
    startedAt: row.startedAt?.toISOString() || null,
    endedAt: row.endedAt?.toISOString() || null,
    retryCount: row.retryCount,
    output: row.output && isRecord(row.output) ? row.output : null,
    errorMessage: row.errorMessage,
  };
}

function normalizeMissionRow(
  row: typeof earthosMissions.$inferSelect,
  steps: RuntimeMissionStep[],
): RuntimeMission {
  return {
    id: row.missionId,
    entity: parseMissionEntity(row.entity),
    region: row.region,
    mission: row.mission,
    status: parseMissionStatus(row.status),
    currentStep: row.currentStep,
    startedAt: row.startedAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    lastCheckpointAt: row.lastCheckpointAt?.toISOString() || null,
    waitingForEvent: row.waitingForEvent,
    payload: isRecord(row.payload) ? row.payload : {},
    result: row.result && isRecord(row.result) ? row.result : null,
    error:
      row.error && isRecord(row.error) && typeof row.error.message === "string"
        ? {
            message: row.error.message,
            step: typeof row.error.step === "string" ? row.error.step : undefined,
          }
        : null,
    steps,
  };
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

export async function upsertDbMissionSnapshot(
  mission: RuntimeMission,
  intelligence: MissionIntelligence | null,
): Promise<boolean> {
  if (!hasDb()) return false;
  const db = getDb();
  if (!db) return false;

  try {
    await db
      .insert(earthosMissions)
      .values({
        missionId: mission.id,
        entity: mission.entity,
        region: mission.region,
        mission: mission.mission,
        status: mission.status,
        currentStep: mission.currentStep,
        startedAt: new Date(mission.startedAt),
        updatedAt: new Date(mission.updatedAt),
        lastCheckpointAt: mission.lastCheckpointAt ? new Date(mission.lastCheckpointAt) : null,
        waitingForEvent: mission.waitingForEvent,
        payload: mission.payload,
        result: mission.result,
        error: mission.error,
        intelligence,
        workflowSource: "earthos",
      })
      .onConflictDoUpdate({
        target: earthosMissions.missionId,
        set: {
          entity: mission.entity,
          region: mission.region,
          mission: mission.mission,
          status: mission.status,
          currentStep: mission.currentStep,
          startedAt: new Date(mission.startedAt),
          updatedAt: new Date(mission.updatedAt),
          lastCheckpointAt: mission.lastCheckpointAt ? new Date(mission.lastCheckpointAt) : null,
          waitingForEvent: mission.waitingForEvent,
          payload: mission.payload,
          result: mission.result,
          error: mission.error,
          intelligence,
        },
      });

    await db.delete(earthosMissionSteps).where(eq(earthosMissionSteps.missionId, mission.id));

    if (mission.steps.length > 0) {
      await db.insert(earthosMissionSteps).values(
        mission.steps.map((step) => ({
          stepId: step.id,
          missionId: mission.id,
          name: step.name,
          status: step.status,
          startedAt: step.startedAt ? new Date(step.startedAt) : null,
          endedAt: step.endedAt ? new Date(step.endedAt) : null,
          retryCount: step.retryCount,
          output: step.output,
          errorMessage: step.errorMessage,
        })),
      );
    }

    return true;
  } catch {
    return false;
  }
}

export async function getDbRuntimeMission(id: string): Promise<RuntimeMission | null> {
  if (!hasDb()) return null;
  const db = getDb();
  if (!db) return null;

  try {
    const [missionRow] = await db
      .select()
      .from(earthosMissions)
      .where(eq(earthosMissions.missionId, id))
      .limit(1);

    if (!missionRow) return null;

    const stepRows = await db
      .select()
      .from(earthosMissionSteps)
      .where(eq(earthosMissionSteps.missionId, id))
      .orderBy(
        desc(sql`coalesce(${earthosMissionSteps.endedAt}, ${earthosMissionSteps.startedAt}, ${earthosMissionSteps.createdAt})`),
      );

    return normalizeMissionRow(missionRow, stepRows.map(normalizeStepRow));
  } catch {
    return null;
  }
}

export async function listDbRuntimeMissions(filters: MissionFilters = {}): Promise<RuntimeMission[] | null> {
  if (!hasDb()) return null;
  const db = getDb();
  if (!db) return null;

  try {
    const where = [];

    if (filters.entity) {
      const entity = filters.entity.trim().toLowerCase();
      if (entity === "gosno" || entity === "alaska" || entity === "redrocks" || entity === "earthos") {
        where.push(eq(earthosMissions.entity, entity));
      }
    }

    if (filters.status) {
      const status = filters.status.trim().toLowerCase();
      if (status === "running" || status === "waiting" || status === "failed" || status === "completed") {
        where.push(eq(earthosMissions.status, status));
      }
    }

    if (filters.region) {
      where.push(sql`lower(${earthosMissions.region}) like ${`%${filters.region.trim().toLowerCase()}%`}`);
    }

    if (filters.search) {
      const needle = `%${filters.search.trim().toLowerCase()}%`;
      where.push(
        sql`lower(concat_ws(' ', ${earthosMissions.missionId}, ${earthosMissions.mission}, ${earthosMissions.region}, ${earthosMissions.entity}, coalesce(${earthosMissions.currentStep}, ''))) like ${needle}`,
      );
    }

    const query = db
      .select()
      .from(earthosMissions)
      .orderBy(desc(earthosMissions.updatedAt))
      .$dynamic();

    const missionRows =
      where.length > 0 ? await query.where(and(...where)) : await query;

    const limitedRows =
      typeof filters.limit === "number" && Number.isFinite(filters.limit) && filters.limit > 0
        ? missionRows.slice(0, filters.limit)
        : missionRows;

    if (limitedRows.length === 0) return [];

    const missionIds = limitedRows.map((row) => row.missionId);
    const stepRows = await db
      .select()
      .from(earthosMissionSteps)
      .where(inArray(earthosMissionSteps.missionId, missionIds))
      .orderBy(
        desc(sql`coalesce(${earthosMissionSteps.endedAt}, ${earthosMissionSteps.startedAt}, ${earthosMissionSteps.createdAt})`),
      );

    const stepsByMission = new Map<string, RuntimeMissionStep[]>();
    for (const row of stepRows) {
      const normalized = normalizeStepRow(row);
      const existing = stepsByMission.get(row.missionId) || [];
      existing.push(normalized);
      stepsByMission.set(row.missionId, existing);
    }

    return filterMissions(
      limitedRows.map((row) => normalizeMissionRow(row, stepsByMission.get(row.missionId) || [])),
      filters,
    );
  } catch {
    return null;
  }
}
