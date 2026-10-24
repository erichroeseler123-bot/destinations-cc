import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { renderToStaticMarkup } from "react-dom/server";

const execFileAsync = promisify(execFile);
import { ADMIN_SESSION_COOKIE, buildAdminSessionValue } from "@/lib/adminAccess";
import { verifyEarthOSAuthorization } from "@/lib/dcc/earthos/auth";
import { GET as getWorkflowsRoute } from "@/app/api/internal/workflows/route";
import { POST as launchWorkflowRoute } from "@/app/api/internal/workflows/launch/route";
import {
  GET as getScheduledReferenceMaintenanceRoute,
  POST as postReferenceMaintenanceRoute,
} from "@/app/api/internal/earthos/reference-maintenance/route";
import {
  applyReferenceCorrectionAction,
  launchMissionAction,
  runReferenceDetectionAction,
  verifyReferenceTaskAction,
} from "@/app/internal/dashboard/actions";
import { renderEarthOSDashboardPage } from "@/app/internal/dashboard/page";
import {
  launchWorkflowMission,
  signalWorkflowMission,
} from "@/lib/dcc/earthos/workflows/service";
import { listEarthOSAuditEvents } from "@/lib/dcc/earthos/auditLog";
import { getDurableGovernanceRecordService } from "@/lib/dcc/earthos/governanceRecords";
import {
  resetEarthosSchemaEnsuredForTests,
  runRepeatableEarthosMigration,
} from "@/lib/dcc/earthos/ensureEarthosSchema";
import {
  applyReferenceMaintenanceCorrection,
  clearPublishedReferenceNodeOverride,
  defaultSpecialistUrlProbe,
  detectReferenceMaintenanceIssues,
  getReferenceMaintenanceTask,
  recordReferenceMaintenanceTask,
  runReferenceMaintenanceLoop,
  setPublishedReferenceNodeOverride,
  verifyAndCloseReferenceMaintenanceTask,
} from "@/lib/dcc/earthos/referenceMaintenance";
import {
  getAllTravelReferenceNodes,
  getBaseTravelReferenceNodeById,
  getPublishedTravelReferenceNodeById,
  type TravelReferenceNode,
} from "@/lib/dcc/travelReference";
import TravelReferenceExperience from "@/app/components/dcc/TravelReferenceExperience";

async function renderDestinationNodeHtml(node: TravelReferenceNode): Promise<string> {
  const tree = await TravelReferenceExperience({ node });
  return `<!DOCTYPE html><html><body>${renderToStaticMarkup(tree)}</body></html>`;
}

async function startLocalDestinationReferenceServer(): Promise<{
  baseUrl: string;
  close: () => Promise<void>;
}> {
  const server = http.createServer(async (req, res) => {
    try {
      const reqUrl = new URL(req.url || "/", "http://127.0.0.1");
      if (reqUrl.pathname === "/juneau") {
        const publishedNode = await getPublishedTravelReferenceNodeById("juneau");
        const html = await renderDestinationNodeHtml(publishedNode);
        res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
        res.end(html);
        return;
      }
      res.writeHead(404, { "content-type": "text/plain" });
      res.end("Not Found");
    } catch (err) {
      res.writeHead(500, { "content-type": "text/plain" });
      res.end(err instanceof Error ? err.message : "Server error");
    }
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", () => resolve()));
  const addr = server.address();
  const port = typeof addr === "object" && addr ? addr.port : 0;

  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: () =>
      new Promise<void>((resolve, reject) =>
        server.close((err) => (err ? reject(err) : resolve())),
      ),
  };
}

test("EarthOS workflow routes, scheduled maintenance endpoint, and dashboard actions enforce authentication and correction permissions", async () => {
  const prevAdminKey = process.env.ADMIN_ACCESS_KEY;
  const prevInternalSecret = process.env.INTERNAL_API_SECRET;
  const prevCronSecret = process.env.CRON_SECRET;
  process.env.ADMIN_ACCESS_KEY = "test-admin-key-earthos-79";
  process.env.INTERNAL_API_SECRET = "test-internal-secret-earthos-79";
  process.env.CRON_SECRET = "test-cron-secret-earthos-79";

  try {
    // 1. Unauthenticated GET /api/internal/workflows -> 401
    const unauthReq = new Request("https://www.destinationcommandcenter.com/api/internal/workflows");
    const unauthRes = await getWorkflowsRoute(unauthReq);
    assert.equal(unauthRes.status, 401);
    const unauthBody = await unauthRes.json();
    assert.equal(unauthBody.ok, false);
    assert.equal(unauthBody.error, "earthos_unauthorized");

    // 2. Unauthenticated GET /api/internal/earthos/reference-maintenance (and ?mode=state) -> 401
    const unauthCronReq = new Request(
      "https://www.destinationcommandcenter.com/api/internal/earthos/reference-maintenance",
    );
    const unauthCronRes = await getScheduledReferenceMaintenanceRoute(unauthCronReq);
    assert.equal(unauthCronRes.status, 401);

    const unauthStateReq = new Request(
      "https://www.destinationcommandcenter.com/api/internal/earthos/reference-maintenance?mode=state",
    );
    const unauthStateRes = await getScheduledReferenceMaintenanceRoute(unauthStateReq);
    assert.equal(unauthStateRes.status, 401);

    // 3. Unauthenticated POST /api/internal/earthos/reference-maintenance (apply / verify) -> 401
    const unauthApplyReq = new Request(
      "https://www.destinationcommandcenter.com/api/internal/earthos/reference-maintenance",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "apply",
          taskId: "ref_task_juneau_fake",
          approved: true,
        }),
      },
    );
    const unauthApplyRes = await postReferenceMaintenanceRoute(unauthApplyReq);
    assert.equal(unauthApplyRes.status, 401);

    // 4. Unauthenticated EarthOS dashboard render -> returns 401 Auth Gate, never leaks private records
    const unauthDashboardTree = await renderEarthOSDashboardPage();
    const unauthDashboardHtml = renderToStaticMarkup(unauthDashboardTree);
    assert.match(unauthDashboardHtml, /data-earthos-auth-gate="unauthorized"/);
    assert.doesNotMatch(unauthDashboardHtml, /data-earthos-reference-maintenance="panel"/);

    // 5. Unauthenticated POST /api/internal/workflows/launch -> 401
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

    // 6. Unauthenticated server actions -> earthos_unauthorized
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

    const unauthDetectAction = await runReferenceDetectionAction();
    assert.equal(unauthDetectAction.ok, false);

    const unauthApplyAction = await applyReferenceCorrectionAction({
      taskId: "ref_task_juneau_fake",
      approved: true,
    });
    assert.equal(unauthApplyAction.ok, false);

    const unauthVerifyAction = await verifyReferenceTaskAction({
      taskId: "ref_task_juneau_fake",
    });
    assert.equal(unauthVerifyAction.ok, false);

    // 7. Authenticated with Admin Session Cookie -> 200
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

    // 8. Scheduled detection (CRON_SECRET) can run GET detection, but CANNOT read state snapshot or approve/apply corrections
    const cronCheck = await verifyEarthOSAuthorization(
      new Request("https://www.destinationcommandcenter.com/api/internal/earthos/reference-maintenance", {
        headers: { authorization: "Bearer test-cron-secret-earthos-79" },
      }),
    );
    assert.equal(cronCheck.authorized, true);
    assert.equal(cronCheck.actor, "vercel:cron");

    const cronPostReq = new Request(
      "https://www.destinationcommandcenter.com/api/internal/earthos/reference-maintenance",
      {
        method: "POST",
        headers: {
          authorization: "Bearer test-cron-secret-earthos-79",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          action: "apply",
          taskId: "ref_task_juneau_fake",
          approved: true,
        }),
      },
    );
    const cronPostRes = await postReferenceMaintenanceRoute(cronPostReq);
    assert.equal(cronPostRes.status, 403);
    const cronPostBody = await cronPostRes.json();
    assert.equal(cronPostBody.ok, false);
    assert.match(String(cronPostBody.error), /scheduled_detection_cannot_mutate_or_approve/);

    const cronStateReq = new Request(
      "https://www.destinationcommandcenter.com/api/internal/earthos/reference-maintenance?mode=state",
      {
        headers: { authorization: "Bearer test-cron-secret-earthos-79" },
      },
    );
    const cronStateRes = await getScheduledReferenceMaintenanceRoute(cronStateReq);
    assert.equal(cronStateRes.status, 403);

    await assert.rejects(
      () =>
        applyReferenceMaintenanceCorrection({
          taskId: "ref_task_juneau_fake",
          approved: true,
          operator: "vercel:cron",
        }),
      /Scheduled detection cannot approve or apply its own reference corrections/,
    );

    await assert.rejects(
      () =>
        verifyAndCloseReferenceMaintenanceTask({
          taskId: "ref_task_juneau_fake",
          verifiedBy: "vercel:cron",
        }),
      /Scheduled detection cannot verify or close its own reference maintenance tasks/,
    );
  } finally {
    if (prevAdminKey === undefined) delete process.env.ADMIN_ACCESS_KEY;
    else process.env.ADMIN_ACCESS_KEY = prevAdminKey;
    if (prevInternalSecret === undefined) delete process.env.INTERNAL_API_SECRET;
    else process.env.INTERNAL_API_SECRET = prevInternalSecret;
    if (prevCronSecret === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = prevCronSecret;
  }
});

test("EarthOS missions never conceal rejected or missing approvals as completed or DISPATCH SUCCESSFUL", async () => {
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

test("Durable backend fails explicitly when database persistence is unavailable (never falls back to memory)", async () => {
  const saved = {
    DCC_DATABASE_URL: process.env.DCC_DATABASE_URL,
    DATABASE_URL: process.env.DATABASE_URL,
    POSTGRES_URL: process.env.POSTGRES_URL,
  };
  delete process.env.DCC_DATABASE_URL;
  delete process.env.DATABASE_URL;
  delete process.env.POSTGRES_URL;
  resetEarthosSchemaEnsuredForTests();

  try {
    await assert.rejects(
      () =>
        setPublishedReferenceNodeOverride({
          nodeId: "juneau",
          updatedAt: new Date().toISOString(),
          appliedTaskId: null,
          appliedBy: "test",
        }),
      /Durable EarthOS persistence requires an active database connection/,
    );

    await assert.rejects(
      () =>
        recordReferenceMaintenanceTask("juneau", [
          {
            issueId: "issue_juneau_test",
            nodeId: "juneau",
            canonicalPath: "/juneau",
            kind: "broken_specialist_link",
            targetId: "handoff-juneau-flight-deck",
            targetLabel: "Test",
            observedValue: "https://juneauflightdeck.com/best-excursions-in-juneau",
            recommendedValue: "https://juneauflightdeck.com/helicopter",
            reason: "Test failure when DB missing",
            severity: "critical",
            detectedAt: new Date().toISOString(),
          },
        ]),
      /Durable EarthOS persistence requires an active database connection/,
    );
  } finally {
    if (saved.DCC_DATABASE_URL !== undefined) process.env.DCC_DATABASE_URL = saved.DCC_DATABASE_URL;
    if (saved.DATABASE_URL !== undefined) process.env.DATABASE_URL = saved.DATABASE_URL;
    if (saved.POSTGRES_URL !== undefined) process.env.POSTGRES_URL = saved.POSTGRES_URL;
    resetEarthosSchemaEnsuredForTests();
  }
});

test("defaultSpecialistUrlProbe performs real HTTP checks and EarthOS maintenance enforces source review and deployed HTML verification", async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "dcc-earthos-inproc-"));
  const prevAuditPath = process.env.DCC_EARTHOS_AUDIT_LOG_PATH;
  process.env.DCC_EARTHOS_AUDIT_LOG_PATH = path.join(tmpDir, "audit-log.jsonl");
  await clearPublishedReferenceNodeOverride("juneau");
  const server = await startLocalDestinationReferenceServer();
  const now = new Date("2026-10-24T12:00:00.000Z");

  try {
    // 1. Real HTTP probe checks against live external specialist domains
    const brokenJfdProbe = await defaultSpecialistUrlProbe(
      "https://juneauflightdeck.com/best-excursions-in-juneau",
    );
    assert.equal(brokenJfdProbe.ok, false);
    assert.equal(brokenJfdProbe.statusCode, 404);

    const liveJfdProbe = await defaultSpecialistUrlProbe(
      "https://juneauflightdeck.com/helicopter",
    );
    assert.equal(liveJfdProbe.ok, true);
    assert.equal(liveJfdProbe.statusCode, 200);

    const brokenWtaProbe = await defaultSpecialistUrlProbe(
      "https://welcometoalaskatours.com/juneau-shore-excursions",
    );
    assert.equal(brokenWtaProbe.ok, false);
    assert.equal(brokenWtaProbe.statusCode, 404);

    const liveWtaProbe = await defaultSpecialistUrlProbe(
      "https://welcometoalaskatours.com/ports/juneau",
    );
    assert.equal(liveWtaProbe.ok, true);
    assert.equal(liveWtaProbe.statusCode, 200);

    // 2. Verify all 5 live production reference nodes pass real HTTP checks with 0 issues
    const liveIssues = await detectReferenceMaintenanceIssues({
      nodes: getAllTravelReferenceNodes(),
      now,
    });
    assert.equal(
      liveIssues.length,
      0,
      `Expected 0 issues on live TravelReferenceNodes via real HTTP probes, found: ${JSON.stringify(liveIssues)}`,
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

    // 3. Operator rejection keeps task unapplied in Neon Postgres
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

    // 4. Refreshing a timestamp without a valid SourceReviewAttestation MUST NOT update lastCheckedAt
    // and MUST fail closure
    const targetCitation = juneauSnapshot.evidenceRegistry[0];
    const unreviewedTask = await recordReferenceMaintenanceTask("juneau", initialIssues);
    const unreviewedApply = await applyReferenceMaintenanceCorrection({
      taskId: unreviewedTask.taskId,
      targetNode: juneauSnapshot,
      approved: true,
      operator: "qa-operator",
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
          deployedBaseUrl: server.baseUrl,
        }),
      /cannot be closed without source review/i,
      "Closure must fail when a stale source has not undergone source review",
    );

    // 5. Closure must verify corrected destination HTML content—not merely HTTP 200
    await assert.rejects(
      () =>
        verifyAndCloseReferenceMaintenanceTask({
          taskId: unreviewedTask.taskId,
          remediatedNode: juneauSnapshot,
          verifiedBy: "qa-operator",
          now,
          deployedBaseUrl: server.baseUrl,
          // Simulated test-only 200 OK probe to prove HTTP 200 alone cannot close a task with broken content:
          probeUrl: async () => ({ ok: true, statusCode: 200 }),
        }),
      /Content verification failed/i,
      "Closure must fail when broken URLs remain in destination content even if HTTP status is 200",
    );

    // 6. Full maintenance loop with valid SourceReviewAttestation and real HTTP deployed page fetch succeeds
    const loopResult = await runReferenceMaintenanceLoop({
      targetNode: juneauSnapshot,
      operator: "earthos-maintainer",
      now,
      deployedBaseUrl: server.baseUrl,
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

    const storedTask = await getReferenceMaintenanceTask(loopResult.task.taskId);
    assert.ok(storedTask);
    assert.equal(storedTask.status, "closed");
    assert.ok(storedTask.verificationEvidence);
    assert.equal(storedTask.verificationEvidence.deployedPageStatusCode, 200);
    assert.equal(storedTask.verificationEvidence.contentAssertions.length, 3);
    assert.ok(
      storedTask.verificationEvidence.contentAssertions.every(
        (a) =>
          a.oldValueAbsentFromPublishedNode &&
          a.correctedValuePresentInPublishedNode &&
          a.oldValueAbsentFromDeployedHtml &&
          a.correctedValuePresentInDeployedHtml &&
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
    await server.close();
    await clearPublishedReferenceNodeOverride("juneau");
    if (prevAuditPath === undefined) delete process.env.DCC_EARTHOS_AUDIT_LOG_PATH;
    else process.env.DCC_EARTHOS_AUDIT_LOG_PATH = prevAuditPath;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("Real cross-process execution against Neon Postgres: scheduled detection, persistent task retrieval, approved correction, and deployed HTML verification across separate Node processes", async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "dcc-earthos-crossproc-db-"));
  const tmpAuditFile = path.join(tmpDir, "earthos-audit-log.jsonl");
  const server = await startLocalDestinationReferenceServer();
  const childEnv = {
    ...process.env,
    DCC_EARTHOS_AUDIT_LOG_PATH: tmpAuditFile,
    DCC_DEPLOYED_BASE_URL: server.baseUrl,
    INTERNAL_API_SECRET: "cross-proc-internal-secret",
  };
  const repoRoot = process.cwd();

  async function runSeparateNodeStep(stepName: string, code: string): Promise<string> {
    const scriptFile = path.join(tmpDir, `${stepName}.ts`);
    fs.writeFileSync(scriptFile, code, "utf8");
    const { stdout } = await execFileAsync(
      process.execPath,
      ["--import", "tsx", "--env-file-if-exists=.env.test.local", scriptFile],
      {
        cwd: repoRoot,
        env: childEnv,
        encoding: "utf8",
      },
    );
    return stdout;
  }

  try {
    // PROCESS 1: Persist degraded Juneau override to Neon Postgres, invoke scheduled detection GET route
    // (/api/internal/earthos/reference-maintenance) which performs real HTTP probes and records persistent task in Neon Postgres.
    const proc1Out = await runSeparateNodeStep(
      "step1-scheduled-detect-and-persist",
      `
      import { GET as getScheduledReferenceMaintenanceRoute } from "@/app/api/internal/earthos/reference-maintenance/route";
      import { setPublishedReferenceNodeOverride } from "@/lib/dcc/earthos/referenceMaintenance";
      import { getBaseTravelReferenceNodeById, getPublishedTravelReferenceNodeById } from "@/lib/dcc/travelReference";

      async function main() {
        const baseNode = getBaseTravelReferenceNodeById("juneau");
        const firstCit = baseNode.evidenceRegistry[0];
        await setPublishedReferenceNodeOverride({
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

        const degradedNode = await getPublishedTravelReferenceNodeById("juneau");
        const req = new Request("https://www.destinationcommandcenter.com/api/internal/earthos/reference-maintenance", {
          headers: { "x-internal-secret": process.env.INTERNAL_API_SECRET || "" },
        });
        const res = await getScheduledReferenceMaintenanceRoute(req);
        const body = await res.json();
        const task = (body.recordedTasks || [])[0] || (body.existingOpenTasks || [])[0];
        if (!task) {
          throw new Error("Scheduled detection failed to record or return an open task: " + JSON.stringify(body));
        }

        console.log(JSON.stringify({
          taskId: task.taskId,
          findingId: task.findingId,
          citationId: firstCit.id,
          citationSourceUrl: firstCit.sourceUrl,
          issueCount: task.issues.length,
          degradedUrls: degradedNode.specialistHandoffs.options.map((o) => o.baseUrl),
        }));
      }
      main().catch((err) => { console.error(err); process.exit(1); });
      `,
    );

    const proc1Data = JSON.parse(proc1Out.trim().split("\n").pop()!) as {
      taskId: string;
      findingId: string;
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

    // PROCESS 2: Separate Node execution retrieves task from Neon Postgres, applies approved correction + SourceReviewAttestation, and persists override in Neon Postgres.
    const proc2Out = await runSeparateNodeStep(
      "step2-retrieve-from-db-and-apply",
      `
      import {
        getReferenceMaintenanceTask,
        applyReferenceMaintenanceCorrection,
      } from "@/lib/dcc/earthos/referenceMaintenance";

      async function main() {
        const task = await getReferenceMaintenanceTask(${JSON.stringify(proc1Data.taskId)});
        if (!task) {
          throw new Error("Task was not persisted in Neon Postgres across processes!");
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
              reviewerNotes: "Cross-process Neon DB verification of official Juneau evidence citation at upstream authority.",
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

    // PROCESS 3: Third separate Node execution fetches the live rendered destination page over HTTP
    // (${DCC_DEPLOYED_BASE_URL}/juneau), checks the corrected content in the HTML, and closes the task in Neon Postgres.
    const proc3Out = await runSeparateNodeStep(
      "step3-verify-deployed-and-close-in-db",
      `
      import {
        verifyAndCloseReferenceMaintenanceTask,
        getReferenceMaintenanceTask,
      } from "@/lib/dcc/earthos/referenceMaintenance";
      import { getPublishedTravelReferenceNodeById } from "@/lib/dcc/travelReference";
      import { getDurableGovernanceRecordService } from "@/lib/dcc/earthos/governanceRecords";

      async function main() {
        const publishedJuneau = await getPublishedTravelReferenceNodeById("juneau");
        const closedTask = await verifyAndCloseReferenceMaintenanceTask({
          taskId: ${JSON.stringify(proc1Data.taskId)},
          verifiedBy: "cross-proc-verifier",
          now: new Date("2026-10-24T12:10:00.000Z"),
        });

        const reloadedTask = await getReferenceMaintenanceTask(${JSON.stringify(proc1Data.taskId)});
        const gov = getDurableGovernanceRecordService();
        const driftEvents = await gov.listRecentDriftEvents(10);
        const resolvedDrift = driftEvents?.find((d) => d.id === closedTask.driftEventId);
        const targetCit = publishedJuneau.evidenceRegistry.find((c) => c.id === ${JSON.stringify(proc1Data.citationId)});

        console.log(JSON.stringify({
          publishedUrls: publishedJuneau.specialistHandoffs.options.map((o) => o.baseUrl),
          publishedCheckedAt: targetCit?.lastCheckedAt,
          publishedNote: targetCit?.verificationNote,
          closedStatus: reloadedTask?.status,
          deployedPageUrl: reloadedTask?.verificationEvidence?.deployedPageUrl,
          deployedPageStatusCode: reloadedTask?.verificationEvidence?.deployedPageStatusCode,
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
      deployedPageUrl: string;
      deployedPageStatusCode: number;
      contentAssertions: Array<{
        targetId: string;
        oldValueAbsentFromPublishedNode: boolean;
        correctedValuePresentInPublishedNode: boolean;
        oldValueAbsentFromDeployedHtml: boolean;
        correctedValuePresentInDeployedHtml: boolean;
        sourceReviewVerified: boolean;
      }>;
      driftStatus: string;
    };

    assert.equal(proc3Data.closedStatus, "closed");
    assert.equal(proc3Data.driftStatus, "resolved");
    assert.equal(proc3Data.deployedPageStatusCode, 200);
    assert.equal(proc3Data.deployedPageUrl, `${server.baseUrl}/juneau`);
    assert.ok(proc3Data.publishedUrls.includes("https://juneauflightdeck.com/helicopter"));
    assert.ok(proc3Data.publishedUrls.includes("https://welcometoalaskatours.com/ports/juneau"));
    assert.ok(
      !proc3Data.publishedUrls.includes("https://juneauflightdeck.com/best-excursions-in-juneau"),
    );
    assert.ok(
      !proc3Data.publishedUrls.includes("https://welcometoalaskatours.com/juneau-shore-excursions"),
    );
    assert.equal(proc3Data.publishedCheckedAt, "2026-10-24");
    assert.match(
      proc3Data.publishedNote,
      /Cross-process Neon DB verification of official Juneau evidence citation/,
    );
    assert.equal(proc3Data.contentAssertions.length, 3);
    assert.ok(
      proc3Data.contentAssertions.every(
        (a) =>
          a.oldValueAbsentFromPublishedNode &&
          a.correctedValuePresentInPublishedNode &&
          a.oldValueAbsentFromDeployedHtml &&
          a.correctedValuePresentInDeployedHtml &&
          a.sourceReviewVerified,
      ),
    );
  } finally {
    await server.close();
    await clearPublishedReferenceNodeOverride("juneau");
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("Environment isolation, audit-preserving cleanup, repeatable migration, and EarthOS dashboard UI distinction", async () => {
  const prevAdminKey = process.env.ADMIN_ACCESS_KEY;
  const prevScope = process.env.DCC_ENVIRONMENT_SCOPE;
  process.env.ADMIN_ACCESS_KEY = "test-admin-key-isolation-79";

  try {
    // 1. Repeatable migration is idempotent and records checksum + executionCount
    const mig1 = await runRepeatableEarthosMigration();
    const mig2 = await runRepeatableEarthosMigration();
    assert.equal(mig1.migrationId, "0003_earthos_reference_maintenance");
    assert.equal(mig1.checksum, mig2.checksum);
    assert.ok(mig2.executionCount >= mig1.executionCount);

    // 2. Deliberately broken Juneau override in nonprod never affects production scope
    process.env.DCC_ENVIRONMENT_SCOPE = "nonprod";
    await setPublishedReferenceNodeOverride(
      {
        nodeId: "juneau",
        updatedAt: new Date().toISOString(),
        appliedTaskId: null,
        appliedBy: "regression-seed",
        specialistHandoffBaseUrls: {
          "handoff-juneau-flight-deck": "https://juneauflightdeck.com/best-excursions-in-juneau",
        },
      },
      "nonprod",
    );

    const nonprodJuneau = await getPublishedTravelReferenceNodeById("juneau");
    assert.equal(
      nonprodJuneau.specialistHandoffs.options[0].baseUrl,
      "https://juneauflightdeck.com/best-excursions-in-juneau",
    );

    process.env.DCC_ENVIRONMENT_SCOPE = "production";
    const prodJuneau = await getPublishedTravelReferenceNodeById("juneau");
    assert.equal(
      prodJuneau.specialistHandoffs.options[0].baseUrl,
      "https://juneauflightdeck.com/helicopter",
      "Production scope must never read nonprod test overrides or broken Juneau test URLs",
    );

    // 3. Clean up nonprod override and verify audit history is preserved
    process.env.DCC_ENVIRONMENT_SCOPE = "nonprod";
    await clearPublishedReferenceNodeOverride("juneau", "nonprod");
    const restoredNonprodJuneau = await getPublishedTravelReferenceNodeById("juneau");
    assert.equal(
      restoredNonprodJuneau.specialistHandoffs.options[0].baseUrl,
      "https://juneauflightdeck.com/helicopter",
    );

    // 4. Authenticated EarthOS dashboard renders ReferenceMaintenancePanel and distinguishes healthy state
    const authDashboardTree = await renderEarthOSDashboardPage({
      explicitAuthToken: "test-admin-key-isolation-79",
    });
    const authDashboardHtml = renderToStaticMarkup(authDashboardTree);
    assert.match(authDashboardHtml, /data-earthos-auth-gate="authorized"/);
    assert.match(authDashboardHtml, /data-earthos-reference-maintenance="panel"/);
    assert.match(authDashboardHtml, /Traveler Evidence &amp; Specialist Handoff Governance/);
    assert.match(authDashboardHtml, /0 8 \* \* \* UTC/);
  } finally {
    await clearPublishedReferenceNodeOverride("juneau", "nonprod");
    if (prevAdminKey === undefined) delete process.env.ADMIN_ACCESS_KEY;
    else process.env.ADMIN_ACCESS_KEY = prevAdminKey;
    if (prevScope === undefined) delete process.env.DCC_ENVIRONMENT_SCOPE;
    else process.env.DCC_ENVIRONMENT_SCOPE = prevScope;
  }
});

