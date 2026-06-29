"use server";

import { launchWorkflowMission, publishWorkflowMission, signalWorkflowMission } from "@/lib/dcc/earthos/workflows/service";
import type { LaunchMissionInput, WorkflowSignalEvent } from "@/lib/dcc/earthos/workflows/types";

type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export async function launchMissionAction(input: LaunchMissionInput): Promise<ActionResult<{ id: string }>> {
  try {
    const mission = await launchWorkflowMission(input);
    return { ok: true, data: { id: mission.id } };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "launch_failed" };
  }
}

export async function signalMissionAction(
  missionId: string,
  event: WorkflowSignalEvent,
  payload?: Record<string, unknown>,
): Promise<ActionResult> {
  try {
    const mission = await signalWorkflowMission(missionId, event, payload);
    if (!mission) return { ok: false, error: "workflow_not_found" };
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "signal_failed" };
  }
}

export async function publishMissionAction(missionId: string): Promise<ActionResult> {
  try {
    const mission = await publishWorkflowMission(missionId);
    if (!mission) return { ok: false, error: "mission_not_publishable" };
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "publish_failed" };
  }
}
