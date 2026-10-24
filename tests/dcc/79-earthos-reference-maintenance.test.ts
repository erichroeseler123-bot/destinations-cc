import test from "node:test";
import assert from "node:assert/strict";
import { ADMIN_SESSION_COOKIE, buildAdminSessionValue } from "@/lib/adminAccess";
import { verifyEarthOSAuthorization } from "@/lib/dcc/earthos/auth";
import { GET as getWorkflowsRoute } from "@/app/api/internal/workflows/route";
import { POST as launchWorkflowRoute } from "@/app/api/internal/workflows/launch/route";
import {
  launchMissionAction,
  signalMissionAction,
} from "@/app/internal/dashboard/actions";
import {
  launchWorkflowMission,
  signalWorkflowMission,
} from "@/lib/dcc/earthos/workflows/service";
import {
  appendEarthOSAuditEvent,
  listEarthOSAuditEvents,
} from "@/lib/dcc/earthos/auditLog";
import { getDurableGovernanceRecordService } from "@/lib/dcc/earthos/governanceRecords";
import {
  applyReferenceMaintenanceCorrection,
  detectReferenceMaintenanceIssues,
  getReferenceMaintenanceTask,
  recordReferenceMaintenanceTask,
  runReferenceMaintenanceLoop,
} from "@/lib/dcc/earthos/referenceMaintenance";
import {
  getAllTravelReferenceNodes,
  getTravelReferenceNodeById,
} from "@/lib/dcc/travelReference";

test("EarthOS workflow routes and dashboard actions enforce authentication", async () => {
  const prevAdminKey = process.env.ADMIN_ACCESS_KEY;
  const prevInternalSecret = process.env.INTERNAL_API_SECRET;
  process.env.ADMIN_ACCESS_KEY = "test-admin-key-earthos-79";
  process.env.INTERNAL_API_SECRET = "test-internal-secret-earthos-79";

  try {
    // 1. Unauthenticated GET /api/internal/workflows -> 401
    const unauthReq = new Request("https://www.destinationcommandcenter.com/api/internal/workflows");
    const unauthRes = await getWorkflowsRoute(unauthReq);
    assert.equal(unauthRes.status, 401);
    const unauthBody = await unauthRes.json();
    assert.equal(unauthBody.ok, false);
    assert.equal(unauthBody.error, "earthos_unauthorized");

    // 2. Unauthenticated POST /api/internal/workflows/launch -> 401
    const unauthLaunchReq = new Request(
      "https://www.destinationcommandcenter.com/api/internal/workflows/launch",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          entity: "alaska",
          region: "Juneau",
          missionType: "reference-check",
          objective: "Verify Juneau specialist links",
        }),
      },
    );
    const unauthLaunchRes = await launchWorkflowRoute(unauthLaunchReq);
    assert.equal(unauthLaunchRes.status, 401);

    // 3. Unauthenticated server action -> earthos_unauthorized
    const unauthAction = await launchMissionAction({
      entity: "alaska",
      region: "Juneau",
      missionType: "reference-check",
      objective: "Verify Juneau specialist links",
    });
    assert.equal(unauthAction.ok, false);
    if (!unauthAction.ok) {
      assert.equal(unauthAction.error, "earthos_unauthorized");
    }

    // 4. Authenticated with Admin Session Cookie -> 200
    const sessionCookieVal = buildAdminSessionValue();
    assert.ok(sessionCookieVal.length > 10);
    const sessionReq = new Request("https://www.destinationcommandcenter.com/api/internal/workflows", {
      headers: {
        cookie: `${ADMIN_SESSION_COOKIE}=${encodeURIComponent(sessionCookieVal)}`,
      },
    });
    const sessionRes = await getWorkflowsRoute(sessionReq);
    assert.equal(sessionRes.status, 200);
    const sessionData = await sessionRes.json();
    assert.equal(sessionData.ok, true);
    assert.ok(Array.isArray(sessionData.missions));

    // 5. Authenticated server action with explicit token -> ok: true
    const authAction = await launchMissionAction(
      {
        entity: "alaska",
        region: "Juneau",
        missionType: "reference-check",
        objective: "Authenticated Juneau mission launch test",
      },
      sessionCookieVal,
    );
    assert.equal(authAction.ok, true);

    // 6. Authenticated with x-internal-secret header -> authorized
    const secretCheck = await verifyEarthOSAuthorization(
      new Request("https://www.destinationcommandcenter.com/api/internal/workflows", {
        headers: { "x-internal-secret": "test-internal-secret-earthos-79" },
      }),
    );
    assert.equal(secretCheck.authorized, true);
    assert.equal(secretCheck.method, "internal_secret");
  } finally {
    if (prevAdminKey === undefined) delete process.env.ADMIN_ACCESS_KEY;
    else process.env.ADMIN_ACCESS_KEY = prevAdminKey;
    if (prevInternalSecret === undefined) delete process.env.INTERNAL_API_SECRET;
    else process.env.INTERNAL_API_SECRET = prevInternalSecret;
  }
});

test("EarthOS missions never conceal rejected or missing approvals as completed or DISPATCH SUCCESSFUL", async () => {
  // 1. Launch a mission and signal with explicit rejection (approved: false)
  const missionRejected = await launchWorkflowMission({
    entity: "alaska",
    region: "Juneau",
    missionType: "dispatch-approval",
    objective: "Test rejection handling on Juneau dispatch",
  });

  const rejectedDetail = await signalWorkflowMission(missionRejected.id, "erich-approval", {
    approved: false,
  });
  assert.ok(rejectedDetail);
  assert.equal(rejectedDetail.status, "failed");
  assert.equal(rejectedDetail.result?.dispatchStatus, "rejected");
  assert.notEqual(rejectedDetail.intelligence?.headline, "DISPATCH SUCCESSFUL");
  assert.equal(rejectedDetail.intelligence?.headline, "MISSION TERMINATED");

  // 2. Launch a mission and signal with empty/ambiguous payload ({}) -> must fail closed, never complete
  const missionAmbiguous = await launchWorkflowMission({
    entity: "gosno",
    region: "I-70 Corridor",
    missionType: "dispatch-approval",
    objective: "Test ambiguous approval payload handling",
  });

  const ambiguousDetail = await signalWorkflowMission(missionAmbiguous.id, "erich-approval", {});
  assert.ok(ambiguousDetail);
  assert.equal(ambiguousDetail.status, "failed");
  assert.equal(ambiguousDetail.result?.dispatchStatus, "rejected");
  assert.equal(ambiguousDetail.intelligence?.headline, "MISSION TERMINATED");
  assert.ok(
    !ambiguousDetail.steps.some((step) => step.name === "dispatch-ops"),
    "Ambiguous signal must never execute dispatch-ops",
  );

  // 3. Launch a mission and signal with explicit approval (approved: true) -> completes cleanly
  const missionApproved = await launchWorkflowMission({
    entity: "redrocks",
    region: "Morrison",
    missionType: "dispatch-approval",
    objective: "Test explicit approval handling",
  });

  const approvedDetail = await signalWorkflowMission(missionApproved.id, "erich-approval", {
    approved: true,
  });
  assert.ok(approvedDetail);
  assert.equal(approvedDetail.status, "completed");
  assert.equal(approvedDetail.result?.dispatchStatus, "approved_and_executed");
  assert.equal(approvedDetail.intelligence?.headline, "DISPATCH SUCCESSFUL");
  assert.ok(
    approvedDetail.steps.every((step) => step.status === "completed"),
    "All prerequisite and dispatch steps must be completed when mission completes",
  );
});

test("EarthOS maintenance loop detects broken Juneau specialist links and stale sources, records a persistent task, remediates, rechecks, and closes with evidence", async () => {
  const now = new Date("2026-10-24T12:00:00.000Z");

  // Verify live production reference nodes currently have 0 broken links or stale sources
  const liveIssues = await detectReferenceMaintenanceIssues({
    nodes: getAllTravelReferenceNodes(),
    now,
  });
  assert.equal(
    liveIssues.length,
    0,
    `Expected 0 issues on live TravelReferenceNodes, found: ${JSON.stringify(liveIssues)}`,
  );

  // Create a corrupted Juneau snapshot reproducing the exact broken Juneau links caught during PR #218
  // plus a stale source timestamp from 2025
  const juneauSnapshot = structuredClone(getTravelReferenceNodeById("juneau"));
  juneauSnapshot.specialistHandoffs.options[0].baseUrl =
    "https://juneauflightdeck.com/best-excursions-in-juneau";
  juneauSnapshot.specialistHandoffs.options[1].baseUrl =
    "https://welcometoalaskatours.com/juneau-shore-excursions";
  juneauSnapshot.evidenceRegistry[0].lastCheckedAt = "2025-01-15";

  // First verify that if an operator rejects the maintenance task, it is NOT applied or closed
  const initialIssues = await detectReferenceMaintenanceIssues({
    nodes: [juneauSnapshot],
    now,
  });
  assert.equal(initialIssues.length, 3);

  const rejectedTask = await recordReferenceMaintenanceTask("juneau", initialIssues);
  assert.equal(rejectedTask.status, "open");
  const rejectedResult = await applyReferenceMaintenanceCorrection({
    taskId: rejectedTask.taskId,
    targetNode: juneauSnapshot,
    approved: false,
    operator: "qa-operator",
  });
  assert.equal(rejectedResult.applied, false);
  assert.equal(rejectedResult.task.status, "rejected");
  assert.equal(
    rejectedResult.remediatedNode.specialistHandoffs.options[0].baseUrl,
    "https://juneauflightdeck.com/best-excursions-in-juneau",
  );

  // Now run the full maintenance loop with operator approval:
  // detect -> record persistent task -> correct -> recheck public page/reference -> close with evidence
  const loopResult = await runReferenceMaintenanceLoop({
    targetNode: juneauSnapshot,
    operator: "earthos-maintainer",
    now,
  });

  assert.equal(loopResult.detectedIssues.length, 3);
  assert.equal(loopResult.task.status, "closed");
  assert.equal(loopResult.task.closedBy, "earthos-maintainer");
  assert.ok(loopResult.task.closedAt);

  // Verify the remediated node has the canonical working Juneau URLs and refreshed timestamp
  assert.equal(
    loopResult.remediatedNode.specialistHandoffs.options[0].baseUrl,
    "https://juneauflightdeck.com/helicopter",
  );
  assert.equal(
    loopResult.remediatedNode.specialistHandoffs.options[1].baseUrl,
    "https://welcometoalaskatours.com/ports/juneau",
  );
  assert.equal(loopResult.remediatedNode.evidenceRegistry[0].lastCheckedAt, "2026-10-24");

  // Verify the persistent task record & verification evidence
  const storedTask = getReferenceMaintenanceTask(loopResult.task.taskId);
  assert.ok(storedTask);
  assert.equal(storedTask.status, "closed");
  assert.ok(storedTask.verificationEvidence);
  assert.equal(storedTask.verificationEvidence.recheckPassed, true);
  assert.equal(storedTask.verificationEvidence.remainingIssueCount, 0);
  assert.equal(storedTask.verificationEvidence.publicCanonicalPath, "/juneau");
  assert.equal(storedTask.verificationEvidence.publicRouteRegistered, true);
  assert.equal(storedTask.verificationEvidence.beforeSnapshot.length, 3);
  assert.equal(storedTask.verificationEvidence.afterSnapshot.length, 3);
  assert.ok(storedTask.verificationEvidence.probeResults.every((p) => p.ok && p.statusCode === 200));

  // Verify durable governance drift event was resolved with evidence
  const governance = getDurableGovernanceRecordService();
  const driftEvents = await governance.listRecentDriftEvents(20);
  assert.ok(driftEvents);
  const matchingDrift = driftEvents.find((e) => e.id === storedTask.driftEventId);
  assert.ok(matchingDrift);
  assert.equal(matchingDrift.status, "resolved");
  assert.equal(matchingDrift.resolvedBy, "earthos-maintainer");

  // Verify durable audit log captured detection, application, and closure
  const auditEvents = listEarthOSAuditEvents({ corridorId: "juneau", limit: 20 });
  assert.ok(auditEvents.some((e) => e.eventType === "reference_drift_detected"));
  assert.ok(auditEvents.some((e) => e.eventType === "reference_remediation_applied"));
  assert.ok(auditEvents.some((e) => e.eventType === "reference_maintenance_task_closed"));
});
