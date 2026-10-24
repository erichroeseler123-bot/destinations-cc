"use server";

import { verifyEarthOSAuthorization } from "@/lib/dcc/earthos/auth";
import { launchWorkflowMission, publishWorkflowMission, signalWorkflowMission } from "@/lib/dcc/earthos/workflows/service";
import type { LaunchMissionInput, WorkflowSignalEvent } from "@/lib/dcc/earthos/workflows/types";

type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export async function launchMissionAction(
  input: LaunchMissionInput,
  authToken?: string,
): Promise<ActionResult<{ id: string }>> {
  const auth = await verifyEarthOSAuthorization(null, authToken);
  if (!auth.authorized) {
    return { ok: false, error: auth.error || "earthos_unauthorized" };
  }
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
  authToken?: string,
): Promise<ActionResult> {
  const auth = await verifyEarthOSAuthorization(null, authToken);
  if (!auth.authorized) {
    return { ok: false, error: auth.error || "earthos_unauthorized" };
  }
  try {
    const mission = await signalWorkflowMission(missionId, event, payload);
    if (!mission) return { ok: false, error: "workflow_not_found" };
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "signal_failed" };
  }
}

export async function publishMissionAction(
  missionId: string,
  authToken?: string,
): Promise<ActionResult> {
  const auth = await verifyEarthOSAuthorization(null, authToken);
  if (!auth.authorized) {
    return { ok: false, error: auth.error || "earthos_unauthorized" };
  }
  try {
    const mission = await publishWorkflowMission(missionId);
    if (!mission) return { ok: false, error: "mission_not_publishable" };
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "publish_failed" };
  }
}
