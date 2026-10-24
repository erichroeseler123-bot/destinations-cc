import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { ADMIN_SESSION_COOKIE, buildAdminSessionValue } from "@/lib/adminAccess";
import { verifyEarthOSAuthorization } from "@/lib/dcc/earthos/auth";
import { GET as getWorkflowsRoute } from "@/app/api/internal/workflows/route";
import { POST as launchWorkflowRoute } from "@/app/api/internal/workflows/launch/route";
import {
  launchMissionAction,
} from "@/app/internal/dashboard/actions";
import {
  launchWorkflowMission,
  signalWorkflowMission,
} from "@/lib/dcc/earthos/workflows/service";
import {
  listEarthOSAuditEvents,
} from "@/lib/dcc/earthos/auditLog";
import { getDurableGovernanceRecordService } from "@/lib/dcc/earthos/governanceRecords";
import {
  applyReferenceMaintenanceCorrection,
  clearReferenceMaintenanceStore,
  detectReferenceMaintenanceIssues,
  getReferenceMaintenanceTask,
  recordReferenceMaintenanceTask,
  runReferenceMaintenanceLoop,
  verifyAndCloseReferenceMaintenanceTask,
} from "@/lib/dcc/earthos/referenceMaintenance";
import {
  getAllTravelReferenceNodes,
  getBaseTravelReferenceNodeById,
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

test("EarthOS maintenance loop enforces source review for stale citations and verifies corrected content (not merely HTTP 200)", async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "dcc-earthos-inproc-"));
  const prevAuditPath = process.env.DCC_EARTHOS_AUDIT_LOG_PATH;
  process.env.DCC_EARTHOS_AUDIT_LOG_PATH = path.join(tmpDir, "audit-log.jsonl");
  clearReferenceMaintenanceStore();
  const now = new Date("2026-10-24T12:00:00.000Z");

  try {
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

    const juneauSnapshot = structuredClone(getBaseTravelReferenceNodeById("juneau"));
    juneauSnapshot.specialistHandoffs.options[0].baseUrl =
      "https://juneauflightdeck.com/best-excursions-in-juneau";
    juneauSnapshot.specialistHandoffs.options[1].baseUrl =
      "https://welcometoalaskatours.com/juneau-shore-excursions";
    juneauSnapshot.evidenceRegistry[0].lastCheckedAt = "2025-01-15";

    const initialIssues = await detectReferenceMaintenanceIssues({
      nodes: [juneauSnapshot],
      now,
    });
    assert.equal(initialIssues.length, 3);

    // 1. Operator rejection keeps task unapplied
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

    // 2. Refreshing a timestamp without a valid SourceReviewAttestation MUST NOT update lastCheckedAt
    // and MUST fail closure
    const targetCitation = juneauSnapshot.evidenceRegistry[0];
    const unreviewedTask = await recordReferenceMaintenanceTask("juneau", initialIssues);
    const unreviewedApply = await applyReferenceMaintenanceCorrection({
      taskId: unreviewedTask.taskId,
      targetNode: juneauSnapshot,
      approved: true,
      operator: "qa-operator",
      // No sourceReviews supplied!
    });
    assert.deepEqual(unreviewedApply.unreviewedStaleCitationIds, [targetCitation.id]);
    assert.equal(
      unreviewedApply.remediatedNode.evidenceRegistry[0].lastCheckedAt,
      "2025-01-15",
      "Stale citation timestamp must never be refreshed without an explicit SourceReviewAttestation",
    );

    await assert.rejects(
      () =>
        verifyAndCloseReferenceMaintenanceTask({
          taskId: unreviewedTask.taskId,
          remediatedNode: unreviewedApply.remediatedNode,
          verifiedBy: "qa-operator",
          now,
        }),
      /cannot be closed without source review/i,
      "Closure must fail when a stale source has not undergone source review",
    );

    // 3. Closure must verify corrected destination content—not merely HTTP 200
    await assert.rejects(
      () =>
        verifyAndCloseReferenceMaintenanceTask({
          taskId: unreviewedTask.taskId,
          remediatedNode: juneauSnapshot, // still has broken URLs!
          verifiedBy: "qa-operator",
          now,
          // Even if a naive HTTP check returned 200 OK for every URL:
          probeUrl: async () => ({ ok: true, statusCode: 200 }),
        }),
      /Content verification failed/i,
      "Closure must fail when broken URLs remain in destination content even if probeUrl returns HTTP 200",
    );

    // 4. Full maintenance loop with valid SourceReviewAttestation succeeds and updates published node
    const loopResult = await runReferenceMaintenanceLoop({
      targetNode: juneauSnapshot,
      operator: "earthos-maintainer",
      now,
      sourceReviews: [
        {
          citationId: targetCitation.id,
          reviewedSourceUrl: targetCitation.sourceUrl,
          httpStatusCode: 200,
          verifiedClaimMatchesSource: true,
          reviewerNotes:
            "Verified IRCC eTA air-vs-cruise rules and CBJ port guidance at upstream source.",
          reviewedBy: "earthos-maintainer",
          reviewedAt: "2026-10-24T12:00:00.000Z",
        },
      ],
    });

    assert.equal(loopResult.detectedIssues.length, 3);
    assert.equal(loopResult.task.status, "closed");
    assert.equal(
      loopResult.remediatedNode.specialistHandoffs.options[0].baseUrl,
      "https://juneauflightdeck.com/helicopter",
    );
    assert.equal(
      loopResult.remediatedNode.specialistHandoffs.options[1].baseUrl,
      "https://welcometoalaskatours.com/ports/juneau",
    );
    assert.equal(loopResult.remediatedNode.evidenceRegistry[0].lastCheckedAt, "2026-10-24");

    const storedTask = getReferenceMaintenanceTask(loopResult.task.taskId);
    assert.ok(storedTask);
    assert.equal(storedTask.status, "closed");
    assert.ok(storedTask.verificationEvidence);
    assert.equal(storedTask.verificationEvidence.contentAssertions.length, 3);
    assert.ok(
      storedTask.verificationEvidence.contentAssertions.every(
        (a) =>
          a.oldValueAbsentFromPublishedNode &&
          a.correctedValuePresentInPublishedNode &&
          a.sourceReviewVerified,
      ),
    );

    const governance = getDurableGovernanceRecordService();
    const driftEvents = await governance.listRecentDriftEvents(20);
    assert.ok(driftEvents);
    const matchingDrift = driftEvents.find((e) => e.id === storedTask.driftEventId);
    assert.ok(matchingDrift);
    assert.equal(matchingDrift.status, "resolved");

    const auditEvents = listEarthOSAuditEvents({ corridorId: "juneau", limit: 20 });
    assert.ok(auditEvents.some((e) => e.eventType === "reference_drift_detected"));
    assert.ok(auditEvents.some((e) => e.eventType === "reference_remediation_applied"));
    assert.ok(auditEvents.some((e) => e.eventType === "reference_maintenance_task_closed"));
  } finally {
    clearReferenceMaintenanceStore();
    if (prevAuditPath === undefined) delete process.env.DCC_EARTHOS_AUDIT_LOG_PATH;
    else process.env.DCC_EARTHOS_AUDIT_LOG_PATH = prevAuditPath;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("Real cross-process execution: persistent task retrieval across separate Node processes and propagation of approved corrections to published Juneau destination reference", () => {
  const tmpStateDir = fs.mkdtempSync(path.join(os.tmpdir(), "dcc-earthos-crossproc-"));
  const tmpAuditFile = path.join(tmpStateDir, "earthos-audit-log.jsonl");
  const childEnv = {
    ...process.env,
    DCC_EARTHOS_STATE_DIR: tmpStateDir,
    DCC_EARTHOS_AUDIT_LOG_PATH: tmpAuditFile,
  };
  const repoRoot = process.cwd();

  function runSeparateNodeStep(stepName: string, code: string): string {
    const scriptFile = path.join(tmpStateDir, `${stepName}.ts`);
    fs.writeFileSync(scriptFile, code, "utf8");
    return execFileSync(process.execPath, ["--import", "tsx", scriptFile], {
      cwd: repoRoot,
      env: childEnv,
      encoding: "utf8",
    });
  }

  try {
    // PROCESS 1: Inject degraded Juneau state on disk, detect 3 issues, record persistent task, and exit.
    const proc1Out = runSeparateNodeStep(
      "step1-detect-and-record",
      `
      import {
        setPublishedReferenceNodeOverride,
        detectReferenceMaintenanceIssues,
        recordReferenceMaintenanceTask,
      } from "@/lib/dcc/earthos/referenceMaintenance";
      import { getTravelReferenceNodeById } from "@/lib/dcc/travelReference";

      async function main() {
        const baseNode = getTravelReferenceNodeById("juneau");
        const firstCit = baseNode.evidenceRegistry[0];
        setPublishedReferenceNodeOverride({
          nodeId: "juneau",
          updatedAt: "2026-10-24T10:00:00.000Z",
          appliedTaskId: null,
          appliedBy: "regression-seed",
          specialistHandoffBaseUrls: {
            "handoff-juneau-flight-deck": "https://juneauflightdeck.com/best-excursions-in-juneau",
            "handoff-welcome-to-alaska": "https://welcometoalaskatours.com/juneau-shore-excursions",
          },
          evidenceReviews: {
            [firstCit.id]: {
              lastCheckedAt: "2025-01-15",
              reviewedBy: "seed",
              reviewedSourceUrl: firstCit.sourceUrl,
            },
          },
        });

        const degradedNode = getTravelReferenceNodeById("juneau");
        const issues = await detectReferenceMaintenanceIssues({
          nodes: [degradedNode],
          now: new Date("2026-10-24T12:00:00.000Z"),
        });
        const task = await recordReferenceMaintenanceTask("juneau", issues);
        console.log(JSON.stringify({
          taskId: task.taskId,
          citationId: firstCit.id,
          citationSourceUrl: firstCit.sourceUrl,
          issueCount: issues.length,
          degradedUrls: degradedNode.specialistHandoffs.options.map((o) => o.baseUrl),
        }));
      }
      main().catch((err) => { console.error(err); process.exit(1); });
      `,
    );

    const proc1Data = JSON.parse(proc1Out.trim().split("\n").pop()!) as {
      taskId: string;
      citationId: string;
      citationSourceUrl: string;
      issueCount: number;
      degradedUrls: string[];
    };

    assert.equal(proc1Data.issueCount, 3);
    assert.ok(proc1Data.taskId.startsWith("ref_task_juneau_"));
    assert.ok(
      proc1Data.degradedUrls.includes("https://juneauflightdeck.com/best-excursions-in-juneau"),
    );

    // PROCESS 2: Separate Node execution retrieves task from disk, applies approved correction + source review attestation, and exits.
    const proc2Out = runSeparateNodeStep(
      "step2-retrieve-and-apply",
      `
      import {
        getReferenceMaintenanceTask,
        applyReferenceMaintenanceCorrection,
      } from "@/lib/dcc/earthos/referenceMaintenance";

      async function main() {
        const task = getReferenceMaintenanceTask(${JSON.stringify(proc1Data.taskId)});
        if (!task) {
          throw new Error("Task was not persisted across processes!");
        }

        const applied = await applyReferenceMaintenanceCorrection({
          taskId: task.taskId,
          approved: true,
          operator: "cross-proc-operator",
          sourceReviews: [
            {
              citationId: ${JSON.stringify(proc1Data.citationId)},
              reviewedSourceUrl: ${JSON.stringify(proc1Data.citationSourceUrl)},
              httpStatusCode: 200,
              verifiedClaimMatchesSource: true,
              reviewerNotes: "Cross-process verification of official Juneau evidence citation at upstream authority.",
              reviewedBy: "cross-proc-operator",
              reviewedAt: "2026-10-24T12:05:00.000Z",
            },
          ],
        });

        console.log(JSON.stringify({
          retrievedStatusBefore: "open",
          statusAfterApply: applied.task.status,
          unreviewedCount: applied.unreviewedStaleCitationIds.length,
        }));
      }
      main().catch((err) => { console.error(err); process.exit(1); });
      `,
    );

    const proc2Data = JSON.parse(proc2Out.trim().split("\n").pop()!) as {
      retrievedStatusBefore: string;
      statusAfterApply: string;
      unreviewedCount: number;
    };
    assert.equal(proc2Data.statusAfterApply, "remediated_pending_recheck");
    assert.equal(proc2Data.unreviewedCount, 0);

    // PROCESS 3: Third separate Node execution reads live published Juneau destination reference
    // (getTravelReferenceNodeById("juneau")), confirms corrected URLs & reviewed citation reached the published reference,
    // and closes the task with content-level verification evidence.
    const proc3Out = runSeparateNodeStep(
      "step3-verify-and-close",
      `
      import {
        verifyAndCloseReferenceMaintenanceTask,
        getReferenceMaintenanceTask,
      } from "@/lib/dcc/earthos/referenceMaintenance";
      import { getTravelReferenceNodeById } from "@/lib/dcc/travelReference";
      import { getDurableGovernanceRecordService } from "@/lib/dcc/earthos/governanceRecords";

      async function main() {
        const publishedJuneau = getTravelReferenceNodeById("juneau");
        const closedTask = await verifyAndCloseReferenceMaintenanceTask({
          taskId: ${JSON.stringify(proc1Data.taskId)},
          verifiedBy: "cross-proc-verifier",
          now: new Date("2026-10-24T12:10:00.000Z"),
        });

        const reloadedTask = getReferenceMaintenanceTask(${JSON.stringify(proc1Data.taskId)});
        const gov = getDurableGovernanceRecordService();
        const driftEvents = await gov.listRecentDriftEvents(10);
        const resolvedDrift = driftEvents?.find((d) => d.id === closedTask.driftEventId);
        const targetCit = publishedJuneau.evidenceRegistry.find((c) => c.id === ${JSON.stringify(proc1Data.citationId)});

        console.log(JSON.stringify({
          publishedUrls: publishedJuneau.specialistHandoffs.options.map((o) => o.baseUrl),
          publishedCheckedAt: targetCit?.lastCheckedAt,
          publishedNote: targetCit?.verificationNote,
          closedStatus: reloadedTask?.status,
          contentAssertions: reloadedTask?.verificationEvidence?.contentAssertions,
          driftStatus: resolvedDrift?.status,
        }));
      }
      main().catch((err) => { console.error(err); process.exit(1); });
      `,
    );

    const proc3Data = JSON.parse(proc3Out.trim().split("\n").pop()!) as {
      publishedUrls: string[];
      publishedCheckedAt: string;
      publishedNote: string;
      closedStatus: string;
      contentAssertions: Array<{
        targetId: string;
        oldValueAbsentFromPublishedNode: boolean;
        correctedValuePresentInPublishedNode: boolean;
        sourceReviewVerified: boolean;
      }>;
      driftStatus: string;
    };

    assert.equal(proc3Data.closedStatus, "closed");
    assert.equal(proc3Data.driftStatus, "resolved");
    assert.ok(proc3Data.publishedUrls.includes("https://juneauflightdeck.com/helicopter"));
    assert.ok(proc3Data.publishedUrls.includes("https://welcometoalaskatours.com/ports/juneau"));
    assert.ok(
      !proc3Data.publishedUrls.includes("https://juneauflightdeck.com/best-excursions-in-juneau"),
    );
    assert.ok(
      !proc3Data.publishedUrls.includes("https://welcometoalaskatours.com/juneau-shore-excursions"),
    );
    assert.equal(proc3Data.publishedCheckedAt, "2026-10-24");
    assert.match(proc3Data.publishedNote, /Cross-process verification of official Juneau evidence citation/);
    assert.equal(proc3Data.contentAssertions.length, 3);
    assert.ok(
      proc3Data.contentAssertions.every(
        (a) =>
          a.oldValueAbsentFromPublishedNode &&
          a.correctedValuePresentInPublishedNode &&
          a.sourceReviewVerified,
      ),
    );
  } finally {
    fs.rmSync(tmpStateDir, { recursive: true, force: true });
  }
});
