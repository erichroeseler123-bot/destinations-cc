"use server";

import { revalidatePath } from "next/cache";
import { verifyEarthOSAuthorization } from "@/lib/dcc/earthos/auth";
import {
  applyReferenceMaintenanceCorrection,
  runScheduledReferenceMaintenanceDetection,
  verifyAndCloseReferenceMaintenanceTask,
  type ReferenceMaintenanceTask,
  type SourceReviewAttestation,
} from "@/lib/dcc/earthos/referenceMaintenance";
import { launchWorkflowMission, publishWorkflowMission, signalWorkflowMission } from "@/lib/dcc/earthos/workflows/service";
import type { LaunchMissionInput, WorkflowSignalEvent } from "@/lib/dcc/earthos/workflows/types";

type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function safeRevalidateDashboard(canonicalPath?: string) {
  try {
    revalidatePath("/internal/dashboard");
    if (canonicalPath) {
      revalidatePath(canonicalPath);
    }
  } catch {
    // Ignore outside Next.js request scope (e.g., direct test invocation)
  }
}

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
    safeRevalidateDashboard();
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
    safeRevalidateDashboard();
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
    safeRevalidateDashboard();
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "publish_failed" };
  }
}

export async function runReferenceDetectionAction(
  authToken?: string,
): Promise<
  ActionResult<{
    checkedAt: string;
    actor: string;
    detectedIssueCount: number;
    recordedTaskCount: number;
    existingOpenTaskCount: number;
  }>
> {
  const auth = await verifyEarthOSAuthorization(null, authToken);
  if (!auth.authorized) {
    return { ok: false, error: auth.error || "earthos_unauthorized" };
  }
  try {
    const result = await runScheduledReferenceMaintenanceDetection({
      actor: auth.actor || "earthos-operator",
    });
    safeRevalidateDashboard();
    return {
      ok: true,
      data: {
        checkedAt: result.checkedAt,
        actor: result.actor,
        detectedIssueCount: result.detectedIssueCount,
        recordedTaskCount: result.recordedTasks.length,
        existingOpenTaskCount: result.existingOpenTasks.length,
      },
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "reference_detection_failed",
    };
  }
}

export async function applyReferenceCorrectionAction(
  input: {
    taskId: string;
    approved: boolean;
    sourceReviews?: SourceReviewAttestation[];
  },
  authToken?: string,
): Promise<
  ActionResult<{
    applied: boolean;
    task: ReferenceMaintenanceTask;
    unreviewedStaleCitationIds: string[];
  }>
> {
  const auth = await verifyEarthOSAuthorization(null, authToken);
  if (!auth.authorized) {
    return { ok: false, error: auth.error || "earthos_unauthorized" };
  }
  if (auth.actor === "vercel:cron" || auth.method === "cron_secret") {
    return { ok: false, error: "scheduled_detection_cannot_mutate_or_approve" };
  }
  try {
    const operator = auth.actor || "earthos-operator";
    const applied = await applyReferenceMaintenanceCorrection({
      taskId: input.taskId,
      approved: input.approved === true,
      operator,
      sourceReviews: input.sourceReviews,
    });
    safeRevalidateDashboard(applied.task.canonicalPath);
    return {
      ok: true,
      data: {
        applied: applied.applied,
        task: applied.task,
        unreviewedStaleCitationIds: applied.unreviewedStaleCitationIds,
      },
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "apply_correction_failed",
    };
  }
}

export async function verifyReferenceTaskAction(
  input: {
    taskId: string;
    deployedBaseUrl?: string;
  },
  authToken?: string,
): Promise<ActionResult<{ task: ReferenceMaintenanceTask }>> {
  const auth = await verifyEarthOSAuthorization(null, authToken);
  if (!auth.authorized) {
    return { ok: false, error: auth.error || "earthos_unauthorized" };
  }
  if (auth.actor === "vercel:cron" || auth.method === "cron_secret") {
    return { ok: false, error: "scheduled_detection_cannot_mutate_or_approve" };
  }
  try {
    const verifiedBy = auth.actor || "earthos-operator";
    const closedTask = await verifyAndCloseReferenceMaintenanceTask({
      taskId: input.taskId,
      verifiedBy,
      deployedBaseUrl: input.deployedBaseUrl,
    });
    safeRevalidateDashboard(closedTask.canonicalPath);
    return {
      ok: true,
      data: { task: closedTask },
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "verify_reference_task_failed",
    };
  }
}
