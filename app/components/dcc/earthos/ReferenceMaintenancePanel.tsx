"use client";

import { useState, useTransition } from "react";
import {
  applyReferenceCorrectionAction,
  runReferenceDetectionAction,
  verifyReferenceTaskAction,
} from "@/app/internal/dashboard/actions";
import type {
  DestinationReferenceHealthSummary,
  ReferenceMaintenanceOperationalSnapshot,
  ReferenceMaintenanceTask,
  SourceReviewAttestation,
} from "@/lib/dcc/earthos/referenceMaintenance";

type SourceReviewDraft = {
  reviewedSourceUrl: string;
  httpStatusCode: number;
  verifiedClaimMatchesSource: boolean;
  reviewerNotes: string;
};

function refreshDashboardView() {
  if (typeof window !== "undefined") {
    window.location.reload();
  }
}

function healthBadgeClasses(status: DestinationReferenceHealthSummary["healthStatus"]) {
  if (status === "failed_check") {
    return "border-rose-400/50 bg-rose-500/20 text-rose-100";
  }
  if (status === "pending_recheck") {
    return "border-amber-300/50 bg-amber-400/20 text-amber-100";
  }
  return "border-emerald-400/40 bg-emerald-500/15 text-emerald-100";
}

function healthBadgeLabel(status: DestinationReferenceHealthSummary["healthStatus"]) {
  if (status === "failed_check") return "FAILED CHECK · OPEN ISSUE";
  if (status === "pending_recheck") return "CORRECTION APPLIED · PENDING RECHECK";
  return "HEALTHY · VERIFIED";
}

function taskStatusClasses(status: ReferenceMaintenanceTask["status"]) {
  if (status === "open") {
    return "border-rose-400/50 bg-rose-500/20 text-rose-100";
  }
  if (status === "remediated_pending_recheck") {
    return "border-amber-300/50 bg-amber-400/20 text-amber-100";
  }
  if (status === "rejected") {
    return "border-zinc-400/40 bg-zinc-500/20 text-zinc-200";
  }
  return "border-emerald-400/40 bg-emerald-500/15 text-emerald-100";
}

export function ReferenceMaintenancePanel({
  snapshot,
}: {
  snapshot: ReferenceMaintenanceOperationalSnapshot;
}) {
  const [isPending, startTransition] = useTransition();
  const [statusBanner, setStatusBanner] = useState<{
    tone: "success" | "error" | "info";
    text: string;
  } | null>(null);
  const [inspectedNodeId, setInspectedNodeId] = useState<string | null>(null);
  const [inspectedTaskId, setInspectedTaskId] = useState<string | null>(
    snapshot.tasks.find((t) => t.status === "open" || t.status === "remediated_pending_recheck")
      ?.taskId || null,
  );
  const [reviewDrafts, setReviewDrafts] = useState<Record<string, SourceReviewDraft>>({});

  const openTasks = snapshot.tasks.filter((t) => t.status === "open");
  const pendingRecheckTasks = snapshot.tasks.filter(
    (t) => t.status === "remediated_pending_recheck",
  );
  const activeTasks = [...openTasks, ...pendingRecheckTasks];
  const historicalTasks = snapshot.tasks.filter(
    (t) => t.status === "closed" || t.status === "rejected",
  );

  const overallFailed =
    openTasks.length > 0 || snapshot.latestScan?.status === "issues_detected";
  const overallPendingRecheck = !overallFailed && pendingRecheckTasks.length > 0;

  function getOrInitDraft(
    key: string,
    defaultSourceUrl: string,
    existingReview?: SourceReviewAttestation,
  ): SourceReviewDraft {
    if (reviewDrafts[key]) return reviewDrafts[key];
    return {
      reviewedSourceUrl: existingReview?.reviewedSourceUrl || defaultSourceUrl,
      httpStatusCode: existingReview?.httpStatusCode || 200,
      verifiedClaimMatchesSource: existingReview?.verifiedClaimMatchesSource ?? false,
      reviewerNotes: existingReview?.reviewerNotes || "",
    };
  }

  function updateDraft(key: string, patch: Partial<SourceReviewDraft>, defaultSourceUrl: string) {
    setReviewDrafts((prev) => {
      const current = prev[key] || {
        reviewedSourceUrl: defaultSourceUrl,
        httpStatusCode: 200,
        verifiedClaimMatchesSource: false,
        reviewerNotes: "",
      };
      return {
        ...prev,
        [key]: { ...current, ...patch },
      };
    });
  }

  function handleRunDetection() {
    setStatusBanner({ tone: "info", text: "Running live HTTP reference detection pass across all 5 destinations..." });
    startTransition(async () => {
      const res = await runReferenceDetectionAction();
      if (!res.ok) {
        setStatusBanner({ tone: "error", text: `Detection pass failed: ${res.error}` });
        return;
      }
      setStatusBanner({
        tone: res.data.detectedIssueCount > 0 ? "error" : "success",
        text:
          res.data.detectedIssueCount > 0
            ? `Detection pass found ${res.data.detectedIssueCount} issue(s) (${res.data.recordedTaskCount} new task(s), ${res.data.existingOpenTaskCount} existing open task(s)).`
            : `Detection pass completed at ${new Date(res.data.checkedAt).toLocaleTimeString()} by ${res.data.actor}: 0 issues detected across all 5 destinations.`,
      });
      refreshDashboardView();
    });
  }

  function handleApplyCorrection(task: ReferenceMaintenanceTask, approved: boolean) {
    const dest = snapshot.destinations.find((d) => d.nodeId === task.nodeId);
    const sourceReviews: SourceReviewAttestation[] = [];

    if (approved) {
      for (const issue of task.issues) {
        if (issue.kind === "stale_evidence_source") {
          const cit = dest?.evidenceCitations.find((c) => c.id === issue.targetId);
          const expectedUrl = cit?.sourceUrl || issue.recommendedValue;
          const draftKey = `${task.taskId}:${issue.targetId}`;
          const draft = getOrInitDraft(
            draftKey,
            expectedUrl,
            task.sourceReviews?.find((r) => r.citationId === issue.targetId),
          );
          if (draft.verifiedClaimMatchesSource && draft.reviewerNotes.trim().length > 0) {
            sourceReviews.push({
              citationId: issue.targetId,
              reviewedSourceUrl: draft.reviewedSourceUrl.trim(),
              httpStatusCode: Number(draft.httpStatusCode) || 200,
              verifiedClaimMatchesSource: draft.verifiedClaimMatchesSource,
              reviewerNotes: draft.reviewerNotes.trim(),
              reviewedBy: "earthos-operator",
              reviewedAt: new Date().toISOString(),
            });
          }
        }
      }
    }

    setStatusBanner({
      tone: "info",
      text: approved
        ? `Applying approved correction for ${task.taskId}...`
        : `Recording operator rejection for ${task.taskId}...`,
    });

    startTransition(async () => {
      const res = await applyReferenceCorrectionAction({
        taskId: task.taskId,
        approved,
        sourceReviews,
      });
      if (!res.ok) {
        setStatusBanner({ tone: "error", text: `Correction action failed: ${res.error}` });
        return;
      }
      if (!approved) {
        setStatusBanner({
          tone: "info",
          text: `Task ${task.taskId} marked as rejected; no override was applied.`,
        });
      } else if (res.data.unreviewedStaleCitationIds.length > 0) {
        setStatusBanner({
          tone: "error",
          text: `Specialist link overrides applied for ${task.taskId}, but stale citation(s) [${res.data.unreviewedStaleCitationIds.join(", ")}] still require source review before closure.`,
        });
      } else {
        setStatusBanner({
          tone: "success",
          text: `Approved correction applied for ${task.taskId}. Ready to recheck deployed page (${task.canonicalPath}) and close task.`,
        });
      }
      refreshDashboardView();
    });
  }

  function handleVerifyAndClose(task: ReferenceMaintenanceTask) {
    setStatusBanner({
      tone: "info",
      text: `Fetching deployed page ${task.canonicalPath} and verifying corrected HTML & live specialist handoffs...`,
    });
    startTransition(async () => {
      const res = await verifyReferenceTaskAction({ taskId: task.taskId });
      if (!res.ok) {
        setStatusBanner({
          tone: "error",
          text: `Verification failed for ${task.taskId}: ${res.error}`,
        });
        return;
      }
      setStatusBanner({
        tone: "success",
        text: `Verified deployed HTML at ${res.data.task.verificationEvidence?.deployedPageUrl} (HTTP ${res.data.task.verificationEvidence?.deployedPageStatusCode}) and closed task ${task.taskId}.`,
      });
      refreshDashboardView();
    });
  }

  return (
    <section
      className="mt-8 rounded-[1.8rem] border border-white/12 bg-[linear-gradient(180deg,rgba(24,22,19,0.95),rgba(10,10,12,0.98))] p-6 shadow-[0_22px_70px_rgba(0,0,0,0.4)]"
      data-earthos-reference-maintenance="panel"
    >
      {/* Header & Top-Level Health vs Failure Distinction */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[11px] font-black uppercase tracking-[0.26em] text-[#f5c66c]">
              DCC · EarthOS Reference Maintenance Loop
            </span>
            <span className="rounded-full border border-white/15 bg-white/5 px-3 py-0.5 text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-300">
              Scope: {snapshot.environmentScope}
            </span>
            <span
              className="rounded-full border border-cyan-300/25 bg-cyan-500/10 px-3 py-0.5 font-mono text-[11px] font-bold text-cyan-200"
              data-database-name={snapshot.databaseIdentity.databaseName}
              data-database-role={snapshot.databaseIdentity.databaseRole}
              data-database-isolated={String(snapshot.databaseIdentity.isIsolatedFromProduction)}
              data-credential-isolated={String(snapshot.databaseIdentity.credentialLevelIsolation)}
              data-shared-cluster-endpoint={String(snapshot.databaseIdentity.sharedClusterEndpoint)}
            >
              DB: {snapshot.databaseIdentity.databaseName} ({snapshot.databaseIdentity.databaseRole})
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white md:text-3xl">
            Traveler Evidence &amp; Specialist Handoff Governance
          </h2>
          <p className="max-w-3xl text-sm text-zinc-300">
            DCC publishes traveler information and official evidence; EarthOS detects broken specialist links or stale citations, coordinates operator-approved corrections with mandatory source review, and verifies deployed HTML before closure.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={isPending}
            onClick={handleRunDetection}
            className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/15 px-5 py-2.5 text-xs font-black uppercase tracking-[0.16em] text-cyan-100 transition hover:bg-cyan-300/25 disabled:opacity-50"
          >
            {isPending ? "Running..." : "Run Live Detection Pass"}
          </button>
        </div>
      </div>

      {/* Prominent Status Banner: Clearly Distinguishing Failed Check vs Healthy Result */}
      <div
        className={`mt-6 rounded-2xl border p-5 ${
          overallFailed
            ? "border-rose-400/50 bg-rose-500/15 text-rose-50"
            : overallPendingRecheck
              ? "border-amber-300/50 bg-amber-400/15 text-amber-50"
              : "border-emerald-400/40 bg-emerald-500/12 text-emerald-50"
        }`}
        data-reference-health-state={
          overallFailed ? "failed_check" : overallPendingRecheck ? "pending_recheck" : "healthy"
        }
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-black uppercase tracking-[0.22em]">
              {overallFailed
                ? "FAILED CHECK — ACTION REQUIRED"
                : overallPendingRecheck
                  ? "CORRECTION APPLIED — DEPLOYED RECHECK REQUIRED"
                  : "HEALTHY RESULT — ALL 5 DESTINATIONS VERIFIED"}
            </div>
            <div className="text-sm font-medium opacity-90">
              {overallFailed
                ? `${openTasks.length} open maintenance task(s) across [${[...new Set(openTasks.map((t) => t.canonicalPath))].join(", ") || "detected scan"}]. Scheduled detection never auto-approves its own changes.`
                : overallPendingRecheck
                  ? `${pendingRecheckTasks.length} task(s) have approved overrides applied and await deployed HTML verification before closure.`
                  : "All 5 published destination experiences and their specialist handoffs passed real HTTP and citation freshness checks."}
            </div>
          </div>

          <div className="flex flex-wrap gap-3 text-xs">
            <div className="rounded-xl border border-white/15 bg-black/30 px-3.5 py-2">
              <div className="text-[10px] uppercase tracking-[0.16em] text-zinc-400">Latest Check</div>
              <div className="mt-0.5 font-bold text-white">
                {snapshot.latestScan
                  ? `${new Date(snapshot.latestScan.checkedAt).toLocaleString()} (${snapshot.latestScan.actor})`
                  : "No durable scan recorded yet"}
              </div>
            </div>
            <div className="rounded-xl border border-white/15 bg-black/30 px-3.5 py-2">
              <div className="text-[10px] uppercase tracking-[0.16em] text-zinc-400">
                Daily Cron Schedule
              </div>
              <div className="mt-0.5 font-bold text-white">
                {snapshot.cronSchedule} UTC · Enabled
              </div>
            </div>
            <div className="rounded-xl border border-white/15 bg-black/30 px-3.5 py-2">
              <div className="text-[10px] uppercase tracking-[0.16em] text-zinc-400">
                Invocations (Cron / Manual)
              </div>
              <div className="mt-0.5 font-bold text-white">
                {snapshot.scheduledCronInvocationCount} scheduled · {snapshot.manualInvocationCount} manual
              </div>
            </div>
          </div>
        </div>
      </div>

      {statusBanner ? (
        <div
          className={`mt-4 rounded-xl border px-4 py-3 text-sm font-semibold ${
            statusBanner.tone === "error"
              ? "border-rose-400/40 bg-rose-500/20 text-rose-100"
              : statusBanner.tone === "success"
                ? "border-emerald-400/40 bg-emerald-500/20 text-emerald-100"
                : "border-cyan-300/40 bg-cyan-500/20 text-cyan-100"
          }`}
        >
          {statusBanner.text}
        </div>
      ) : null}

      {/* Destination Reference Coverage & Evidence Inspection Cards */}
      <div className="mt-6">
        <div className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">
          Published Destination Reference Nodes ({snapshot.destinations.length})
        </div>
        <div className="mt-3 grid gap-4 md:grid-cols-5">
          {snapshot.destinations.map((dest) => {
            const isInspected = inspectedNodeId === dest.nodeId;
            return (
              <article
                key={dest.nodeId}
                className="flex flex-col justify-between rounded-2xl border border-white/10 bg-black/30 p-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <a
                      href={dest.canonicalPath}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-bold text-[#f5c66c] hover:underline"
                    >
                      {dest.canonicalPath}
                    </a>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] ${healthBadgeClasses(
                        dest.healthStatus,
                      )}`}
                    >
                      {dest.healthStatus === "failed_check"
                        ? "FAILED"
                        : dest.healthStatus === "pending_recheck"
                          ? "RECHECK"
                          : "HEALTHY"}
                    </span>
                  </div>
                  <h3 className="mt-2 text-sm font-bold text-white">{dest.title}</h3>
                  <div className="mt-2 space-y-1 text-xs text-zinc-400">
                    <div>Reviewed: {dest.lastReviewedAt}</div>
                    <div>
                      {dest.evidenceCount} citations · {dest.specialistHandoffCount} handoffs
                    </div>
                    <div>
                      {dest.openTaskCount} open · {dest.pendingRecheckCount} pending ·{" "}
                      {dest.closedTaskCount} closed
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setInspectedNodeId(isInspected ? null : dest.nodeId)}
                  className="mt-3 w-full cursor-pointer rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-200 hover:bg-white/10"
                >
                  {isInspected ? "Hide Evidence" : "Inspect Evidence"}
                </button>
              </article>
            );
          })}
        </div>

        {/* Expanded Destination Evidence & Specialist Handoffs Drawer */}
        {inspectedNodeId ? (
          (() => {
            const dest = snapshot.destinations.find((d) => d.nodeId === inspectedNodeId);
            if (!dest) return null;
            return (
              <div className="mt-4 rounded-2xl border border-white/15 bg-black/40 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#f5c66c]">
                      Destination Evidence &amp; Handoff Inspector
                    </span>
                    <h4 className="mt-1 text-lg font-bold text-white">
                      {dest.title} ({dest.canonicalPath}) — {healthBadgeLabel(dest.healthStatus)}
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setInspectedNodeId(null)}
                    className="cursor-pointer rounded-lg border border-white/15 px-3 py-1 text-xs text-zinc-300 hover:bg-white/10"
                  >
                    Close Inspector
                  </button>
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                    <div className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">
                      Official Evidence Citations ({dest.evidenceCitations.length})
                    </div>
                    <div className="mt-3 space-y-3">
                      {dest.evidenceCitations.map((cit) => (
                        <div
                          key={cit.id}
                          className="rounded-xl border border-white/10 bg-zinc-900/60 p-3 text-xs"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-bold text-white">{cit.sourceTitle}</span>
                            <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] font-mono text-zinc-300">
                              Checked: {cit.lastCheckedAt}
                            </span>
                          </div>
                          <div className="mt-1 text-zinc-400">
                            {cit.issuingOrganization} · ID: <code>{cit.id}</code>
                          </div>
                          <a
                            href={cit.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1 block truncate font-mono text-[11px] text-cyan-300 hover:underline"
                          >
                            {cit.sourceUrl}
                          </a>
                          {cit.verificationNote ? (
                            <div className="mt-1.5 rounded bg-black/40 p-2 text-[11px] text-zinc-300">
                              Note: {cit.verificationNote}
                            </div>
                          ) : null}
                          {cit.upstreamContentSha256 ? (
                            <div className="mt-1 font-mono text-[10px] text-emerald-300">
                              Upstream SHA-256: {cit.upstreamContentSha256.slice(0, 16)}… · Matched terms:{" "}
                              {(cit.matchedClaimTerms || []).join(", ")}
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                    <div className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">
                      Verified Specialist Handoffs ({dest.specialistHandoffs.length})
                    </div>
                    <div className="mt-3 space-y-3">
                      {dest.specialistHandoffs.map((h) => (
                        <div
                          key={h.id}
                          className="rounded-xl border border-white/10 bg-zinc-900/60 p-3 text-xs"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-white">{h.partnerName}</span>
                            <code className="text-[10px] text-zinc-400">{h.id}</code>
                          </div>
                          <a
                            href={h.baseUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1 block truncate font-mono text-[11px] text-cyan-300 hover:underline"
                          >
                            {h.baseUrl}
                          </a>
                          {h.expectedProductMarkers && h.expectedProductMarkers.length > 0 ? (
                            <div className="mt-1 text-[10px] text-zinc-400">
                              Verified product markers: {h.expectedProductMarkers.join(", ")}
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()
        ) : null}
      </div>

      {/* Active Operator Remediation Queue (Open & Pending Recheck Tasks) */}
      <div className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">
            Active Reference Maintenance Queue ({activeTasks.length})
          </div>
        </div>

        {activeTasks.length === 0 ? (
          <div className="mt-3 rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-5 text-sm text-emerald-100">
            No open or pending-recheck reference maintenance issues. All destination reference nodes are verified healthy.
          </div>
        ) : (
          <div className="mt-3 space-y-4">
            {activeTasks.map((task) => {
              const dest = snapshot.destinations.find((d) => d.nodeId === task.nodeId);
              const isExpanded = inspectedTaskId === task.taskId;
              return (
                <article
                  key={task.taskId}
                  className="rounded-2xl border border-rose-400/30 bg-black/40 p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.16em] ${taskStatusClasses(
                            task.status,
                          )}`}
                        >
                          {task.status}
                        </span>
                        <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-300">
                          Severity: {task.severity}
                        </span>
                        <a
                          href={task.canonicalPath}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-bold text-[#f5c66c] hover:underline"
                        >
                          {dest?.title || task.nodeId} ({task.canonicalPath})
                        </a>
                      </div>
                      <h4 className="mt-2 font-mono text-base font-bold text-white">
                        {task.taskId}
                      </h4>
                      <div className="mt-1 text-xs text-zinc-400">
                        Opened: {new Date(task.createdAt).toLocaleString()} · Mission:{" "}
                        <code>{task.missionId}</code> · Packet: <code>{task.packetId}</code>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setInspectedTaskId(isExpanded ? null : task.taskId)}
                        className="cursor-pointer rounded-xl border border-white/20 bg-white/5 px-3.5 py-2 text-xs font-bold uppercase tracking-[0.14em] text-white hover:bg-white/10"
                      >
                        {isExpanded ? "Collapse Review Controls" : "Inspect & Remediate"}
                      </button>
                      {task.status === "remediated_pending_recheck" ? (
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleVerifyAndClose(task)}
                          className="cursor-pointer rounded-xl border border-emerald-400/40 bg-emerald-500/20 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100 hover:bg-emerald-500/30 disabled:opacity-50"
                        >
                          Recheck Deployed Page &amp; Close
                        </button>
                      ) : null}
                    </div>
                  </div>

                  {/* Issue Breakdown & Mandatory Source Review Attestation Inputs */}
                  <div className="mt-4 space-y-3">
                    {task.issues.map((issue) => {
                      const cit = dest?.evidenceCitations.find((c) => c.id === issue.targetId);
                      const expectedUrl = cit?.sourceUrl || issue.recommendedValue;
                      const draftKey = `${task.taskId}:${issue.targetId}`;
                      const existingReview = task.sourceReviews?.find(
                        (r) => r.citationId === issue.targetId,
                      );
                      const draft = getOrInitDraft(draftKey, expectedUrl, existingReview);

                      return (
                        <div
                          key={issue.issueId}
                          className="rounded-xl border border-white/10 bg-zinc-900/70 p-4 text-xs"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-bold text-white">
                              [{issue.kind}] {issue.targetLabel} (<code>{issue.targetId}</code>)
                            </span>
                            <span className="rounded bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold uppercase text-rose-200">
                              {issue.severity}
                            </span>
                          </div>
                          <div className="mt-1.5 text-zinc-300">{issue.reason}</div>
                          <div className="mt-2 grid gap-2 font-mono text-[11px] md:grid-cols-2">
                            <div className="rounded bg-black/40 p-2 text-rose-200">
                              Observed: {issue.observedValue}
                            </div>
                            <div className="rounded bg-black/40 p-2 text-emerald-200">
                              Recommended: {issue.recommendedValue}
                            </div>
                          </div>

                          {issue.kind === "stale_evidence_source" && isExpanded ? (
                            <div className="mt-3 rounded-xl border border-amber-300/30 bg-amber-400/10 p-3.5">
                              <div className="text-[11px] font-black uppercase tracking-[0.18em] text-amber-200">
                                Mandatory Source Review Attestation (Date Change Alone Is Rejected)
                              </div>
                              <div className="mt-2 grid gap-3 md:grid-cols-2">
                                <label className="block">
                                  <span className="text-[11px] text-zinc-300">
                                    Reviewed Upstream Source URL
                                  </span>
                                  <input
                                    type="url"
                                    value={draft.reviewedSourceUrl}
                                    onChange={(e) =>
                                      updateDraft(
                                        draftKey,
                                        { reviewedSourceUrl: e.target.value },
                                        expectedUrl,
                                      )
                                    }
                                    className="mt-1 w-full rounded-lg border border-white/20 bg-black/50 px-2.5 py-1.5 font-mono text-xs text-white"
                                  />
                                </label>
                                <label className="block">
                                  <span className="text-[11px] text-zinc-300">
                                    Upstream HTTP Status Code
                                  </span>
                                  <input
                                    type="number"
                                    value={draft.httpStatusCode}
                                    onChange={(e) =>
                                      updateDraft(
                                        draftKey,
                                        { httpStatusCode: Number(e.target.value) },
                                        expectedUrl,
                                      )
                                    }
                                    className="mt-1 w-full rounded-lg border border-white/20 bg-black/50 px-2.5 py-1.5 font-mono text-xs text-white"
                                  />
                                </label>
                              </div>
                              <label className="mt-2 block">
                                <span className="text-[11px] text-zinc-300">
                                  Substantive Source Review Notes (min 10 chars)
                                </span>
                                <input
                                  type="text"
                                  placeholder="Describe what was verified at the official source authority..."
                                  value={draft.reviewerNotes}
                                  onChange={(e) =>
                                    updateDraft(
                                      draftKey,
                                      { reviewerNotes: e.target.value },
                                      expectedUrl,
                                    )
                                  }
                                  className="mt-1 w-full rounded-lg border border-white/20 bg-black/50 px-2.5 py-1.5 text-xs text-white"
                                />
                              </label>
                              <label className="mt-2 flex items-center gap-2 text-xs text-amber-100">
                                <input
                                  type="checkbox"
                                  checked={draft.verifiedClaimMatchesSource}
                                  onChange={(e) =>
                                    updateDraft(
                                      draftKey,
                                      { verifiedClaimMatchesSource: e.target.checked },
                                      expectedUrl,
                                    )
                                  }
                                />
                                <span>
                                  I inspected the official source and verified the published DCC claim matches the upstream authority.
                                </span>
                              </label>
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>

                  {isExpanded ? (
                    <div className="mt-4 flex flex-wrap items-center justify-end gap-3 border-t border-white/10 pt-4">
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleApplyCorrection(task, false)}
                        className="cursor-pointer rounded-xl border border-rose-400/30 bg-rose-500/15 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-rose-100 hover:bg-rose-500/25 disabled:opacity-50"
                      >
                        Reject Correction
                      </button>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleApplyCorrection(task, true)}
                        className="cursor-pointer rounded-xl border border-amber-300/40 bg-amber-400/20 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-amber-100 hover:bg-amber-400/30 disabled:opacity-50"
                      >
                        Approve &amp; Apply Correction
                      </button>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleVerifyAndClose(task)}
                        className="cursor-pointer rounded-xl border border-emerald-400/40 bg-emerald-500/20 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100 hover:bg-emerald-500/30 disabled:opacity-50"
                      >
                        Recheck Deployed Page &amp; Close Task
                      </button>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Verification History & Detection Audit Trail */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
          <div className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">
            Task Verification &amp; Closure History ({historicalTasks.length})
          </div>
          {historicalTasks.length === 0 ? (
            <div className="mt-3 text-xs text-zinc-500">
              No closed or rejected maintenance tasks in current scope ({snapshot.environmentScope}) yet.
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              {historicalTasks.slice(0, 8).map((task) => (
                <div
                  key={task.taskId}
                  className="rounded-xl border border-white/10 bg-zinc-900/60 p-3.5 text-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono font-bold text-white">{task.taskId}</span>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-black uppercase ${taskStatusClasses(
                        task.status,
                      )}`}
                    >
                      {task.status}
                    </span>
                  </div>
                  <div className="mt-1 text-zinc-300">
                    Destination: <code>{task.canonicalPath}</code> · Issues: {task.issues.length}
                  </div>
                  {task.verificationEvidence ? (
                    <div className="mt-2 space-y-1 rounded-lg border border-emerald-400/20 bg-emerald-500/10 p-2.5 text-[11px] text-emerald-100">
                      <div>
                        Verified at {new Date(task.verificationEvidence.verifiedAt).toLocaleString()} by{" "}
                        <code>{task.verificationEvidence.verifiedBy}</code>
                      </div>
                      <div className="truncate font-mono">
                        Deployed Page: {task.verificationEvidence.deployedPageUrl} (HTTP{" "}
                        {task.verificationEvidence.deployedPageStatusCode})
                      </div>
                      <div>
                        Assertions passed:{" "}
                        {
                          task.verificationEvidence.contentAssertions.filter(
                            (a) =>
                              a.oldValueAbsentFromDeployedHtml &&
                              a.correctedValuePresentInDeployedHtml &&
                              a.sourceReviewVerified,
                          ).length
                        }
                        /{task.verificationEvidence.contentAssertions.length} · Specialist probes:{" "}
                        {task.verificationEvidence.probeResults
                          .map((p) => `${new URL(p.url).hostname}:${p.statusCode}`)
                          .join(", ")}
                      </div>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
          <div className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">
            Durable Detection Pass History ({snapshot.recentScanHistory.length})
          </div>
          {snapshot.recentScanHistory.length === 0 ? (
            <div className="mt-3 text-xs text-zinc-500">
              No detection passes recorded in {snapshot.environmentScope} scope yet. Click &ldquo;Run Live Detection Pass&rdquo; above.
            </div>
          ) : (
            <div className="mt-3 space-y-2.5">
              {snapshot.recentScanHistory.slice(0, 8).map((scan) => (
                <div
                  key={scan.eventSequence}
                  className="rounded-xl border border-white/10 bg-zinc-900/60 p-3 text-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold text-white">
                      #{scan.eventSequence} ·{" "}
                      {scan.invocationType === "scheduled_cron"
                        ? "Scheduled Cron"
                        : "Authenticated Pass"}{" "}
                      (<code>{scan.actor}</code>)
                    </span>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-black uppercase ${
                        scan.status === "issues_detected"
                          ? "border-rose-400/40 bg-rose-500/20 text-rose-100"
                          : "border-emerald-400/40 bg-emerald-500/15 text-emerald-100"
                      }`}
                    >
                      {scan.status === "issues_detected"
                        ? `${scan.detectedIssueCount} ISSUES`
                        : "HEALTHY (0 ISSUES)"}
                    </span>
                  </div>
                  <div className="mt-1 text-zinc-400">
                    {new Date(scan.checkedAt).toLocaleString()} — {scan.summary}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Traveler Factual-Error Reports Queue */}
      <div
        className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-5"
        data-earthos-factual-error-reports="queue"
        data-open-factual-error-count={String(snapshot.openFactualErrorReportCount ?? 0)}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs font-black uppercase tracking-[0.2em] text-zinc-300">
            Traveler Factual-Error Reports ({snapshot.factualErrorReports?.length || 0})
          </div>
          <span className="rounded-full border border-amber-300/30 bg-amber-400/15 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.14em] text-amber-100">
            Open: {snapshot.openFactualErrorReportCount ?? 0}
          </span>
        </div>
        {!snapshot.factualErrorReports || snapshot.factualErrorReports.length === 0 ? (
          <div className="mt-3 text-xs text-zinc-500">
            No traveler factual-error reports submitted in {snapshot.environmentScope} scope.
          </div>
        ) : (
          <div className="mt-3 space-y-2.5">
            {snapshot.factualErrorReports.slice(0, 12).map((rep) => (
              <div
                key={rep.reportId}
                className="rounded-xl border border-white/10 bg-zinc-900/60 p-3.5 text-xs"
                data-factual-error-report-id={rep.reportId}
                data-factual-error-status={rep.status}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono font-bold text-white">
                    {rep.reportId} · <code>{rep.pagePath}</code>
                    {rep.citationId ? ` · [${rep.citationId}]` : ""}
                  </span>
                  <span className="rounded-full border border-amber-300/40 bg-amber-400/20 px-2 py-0.5 text-[10px] font-black uppercase text-amber-100">
                    {rep.status} · {rep.notificationStatus}
                  </span>
                </div>
                <div className="mt-1.5 font-semibold text-zinc-100">
                  Disputed Claim: &ldquo;{rep.disputedClaim}&rdquo;
                </div>
                <div className="mt-1 text-zinc-300">{rep.explanation}</div>
                {rep.sourceUrl ? (
                  <div className="mt-1 text-[11px] text-cyan-300">
                    Source URL: <code>{rep.sourceUrl}</code>
                  </div>
                ) : null}
                <div className="mt-1 text-[11px] text-zinc-500">
                  Submitted {new Date(rep.submittedAt).toLocaleString()}
                  {rep.contactInfo ? ` · Contact: ${rep.contactInfo}` : ""}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
