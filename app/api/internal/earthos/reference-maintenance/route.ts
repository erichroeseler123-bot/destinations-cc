import { NextResponse } from "next/server";
import {
  buildEarthOSUnauthorizedResponse,
  verifyEarthOSAuthorization,
} from "@/lib/dcc/earthos/auth";
import {
  applyReferenceMaintenanceCorrection,
  runScheduledReferenceMaintenanceDetection,
  verifyAndCloseReferenceMaintenanceTask,
  type SourceReviewAttestation,
} from "@/lib/dcc/earthos/referenceMaintenance";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await verifyEarthOSAuthorization(request);
  if (!auth.authorized) {
    return buildEarthOSUnauthorizedResponse(auth);
  }

  try {
    const result = await runScheduledReferenceMaintenanceDetection();
    return NextResponse.json({
      ok: true,
      actor: auth.actor,
      ...result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "scheduled_detection_failed",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const auth = await verifyEarthOSAuthorization(request);
  if (!auth.authorized) {
    return buildEarthOSUnauthorizedResponse(auth);
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      action?: "detect" | "apply" | "verify";
      taskId?: string;
      approved?: boolean;
      operator?: string;
      sourceReviews?: SourceReviewAttestation[];
      deployedBaseUrl?: string;
    };

    const action = body.action || "detect";
    const actor = body.operator || auth.actor || "earthos-operator";

    if (action === "detect") {
      const result = await runScheduledReferenceMaintenanceDetection();
      return NextResponse.json({
        ok: true,
        action: "detect",
        actor,
        ...result,
      });
    }

    if (action === "apply") {
      if (!body.taskId) {
        return NextResponse.json(
          { ok: false, error: "taskId is required for action='apply'" },
          { status: 400 },
        );
      }
      const applied = await applyReferenceMaintenanceCorrection({
        taskId: body.taskId,
        approved: body.approved === true,
        operator: actor,
        sourceReviews: body.sourceReviews,
      });
      return NextResponse.json({
        ok: true,
        action: "apply",
        actor,
        ...applied,
      });
    }

    if (action === "verify") {
      if (!body.taskId) {
        return NextResponse.json(
          { ok: false, error: "taskId is required for action='verify'" },
          { status: 400 },
        );
      }
      const closedTask = await verifyAndCloseReferenceMaintenanceTask({
        taskId: body.taskId,
        verifiedBy: actor,
        deployedBaseUrl: body.deployedBaseUrl,
      });
      return NextResponse.json({
        ok: true,
        action: "verify",
        actor,
        task: closedTask,
      });
    }

    return NextResponse.json(
      { ok: false, error: `Unsupported action '${String(action)}'` },
      { status: 400 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "reference_maintenance_action_failed",
      },
      { status: 500 },
    );
  }
}
