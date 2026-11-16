"use client";

import { useCallback, useEffect, useState } from "react";

interface DurableSubmissionView {
  submissionId: string;
  actionType: string;
  organizerId: string | null;
  organizerSlug: string | null;
  franchiseId: string | null;
  hostedSailingId: string | null;
  sailingSlug: string | null;
  physicalSailingId: string | null;
  shipSlug: string | null;
  sailDate: string | null;
  displayName: string;
  partySize: number | null;
  contactEmail: string | null;
  contactPhone: string | null;
  contactConsent: boolean;
  submittedSummaryNote: string | null;
  submittedAt: string;
  attribution: {
    sourcePage: string | null;
    utmSource: string | null;
  };
  completionState: string;
  safeFailureReason: string | null;
  shareCode: string | null;
  followUpState: string;
  ownerNotes: string | null;
  isSyntheticTest: boolean;
  outbox: {
    overallStatus: string;
    attempts: number;
    maxAttempts: number;
  };
}

interface VerificationQueueItemView {
  verificationId: string;
  entityType: string;
  entityId: string;
  fieldPath: string;
  currentVerifiedValue: unknown;
  proposedOrConflictingValue: unknown;
  sourceUrl: string | null;
  secondaryConflictSourceUrl?: string | null;
  conflictSummary: string;
  state: string;
  createdAt: string;
}

type FilterKey =
  | "all"
  | "organizer_interest"
  | "passenger_interest"
  | "completed_joins"
  | "partial_or_failed"
  | "verification_queue"
  | "test";

export default function DurableSubmissionsOwnerPanel({
  cpPreviewUrl,
}: {
  cpPreviewUrl: string | null;
}) {
  const [loading, setLoading] = useState(true);
  const [cpBaseUrl, setCpBaseUrl] = useState("https://cruisepromenade.com");
  const [needsAttentionCount, setNeedsAttentionCount] = useState(0);
  const [submissions, setSubmissions] = useState<DurableSubmissionView[]>([]);
  const [verificationQueue, setVerificationQueue] = useState<VerificationQueueItemView[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadSnapshot = useCallback(async () => {
    setLoading(true);
    try {
      const qs = cpPreviewUrl ? `?cpPreviewUrl=${encodeURIComponent(cpPreviewUrl)}` : "";
      const res = await fetch(`/api/admin/durable-submissions${qs}`, { cache: "no-store" });
      if (res.ok) {
        const body = await res.json();
        setCpBaseUrl(body.cpBaseUrl || "https://cruisepromenade.com");
        setNeedsAttentionCount(body.counts?.needsAttentionCount ?? 0);
        setSubmissions(body.submissions ?? []);
        setVerificationQueue(body.dccVerificationQueue ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [cpPreviewUrl]);

  useEffect(() => {
    void loadSnapshot();
  }, [loadSnapshot]);

  async function runOwnerAction(
    submissionId: string,
    action: "mark_contacted" | "add_note" | "resolve" | "retry_outbox" | "privacy_delete",
  ) {
    setBusyId(submissionId);
    try {
      await fetch("/api/admin/durable-submissions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId,
          action,
          ownerNotes: noteDrafts[submissionId] ?? undefined,
          cpPreviewUrl,
        }),
      });
      await loadSnapshot();
    } finally {
      setBusyId(null);
    }
  }

  const filteredSubmissions = submissions.filter((s) => {
    if (activeFilter === "test") return s.isSyntheticTest;
    if (s.isSyntheticTest && activeFilter !== "all") return false;
    if (activeFilter === "organizer_interest") {
      return (
        s.actionType === "organizer_claim_request" ||
        s.actionType === "organizer_pilot_application"
      );
    }
    if (activeFilter === "passenger_interest") {
      return (
        s.actionType === "passenger_join" ||
        s.actionType === "im_on_this_sailing" ||
        s.actionType === "private_plan_creation"
      );
    }
    if (activeFilter === "completed_joins") {
      return s.completionState === "completed";
    }
    if (activeFilter === "partial_or_failed") {
      return (
        s.completionState === "partially_completed" ||
        s.completionState === "failed" ||
        s.completionState === "needs_review"
      );
    }
    return true;
  });

  const csvHref = `/api/admin/durable-submissions?format=csv${
    cpPreviewUrl ? `&cpPreviewUrl=${encodeURIComponent(cpPreviewUrl)}` : ""
  }`;

  return (
    <section
      data-testid="dcc-durable-submissions-owner-panel"
      className="mb-8 rounded-2xl border border-teal-500/35 bg-zinc-900/90 p-5 shadow-lg"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-teal-500/20 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-teal-200">
              Founding Pilot &amp; Durable Interest Recovery
            </span>
            <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-bold text-amber-200">
              Needs Attention: {needsAttentionCount}
            </span>
          </div>
          <h2 className="mt-1.5 text-xl font-bold text-white">
            Write-Ahead Submissions, Recoverable Failures &amp; Fact Verification Queue
          </h2>
          <p className="text-xs text-zinc-400">
            Target Cruise Promenade: <code>{cpBaseUrl}</code> · Formula-safe CSV export enabled ·
            Zero unconsented contact storage
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void loadSnapshot()}
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-100 hover:bg-zinc-700"
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
          <a
            href={csvHref}
            className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-teal-500"
          >
            Export Safe CSV
          </a>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {(
          [
            ["all", `All (${submissions.length})`],
            ["organizer_interest", "New Organizer Interest"],
            ["passenger_interest", "New Passenger Interest"],
            ["completed_joins", "Completed Joins"],
            ["partial_or_failed", "Partial / Failed / Recoverable"],
            ["verification_queue", `DCC Verification Queue (${verificationQueue.length})`],
            ["test", "Test / Fictional Sandbox"],
          ] as Array<[FilterKey, string]>
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveFilter(key)}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              activeFilter === key
                ? "bg-teal-500 text-zinc-950"
                : "border border-zinc-700 bg-zinc-800/70 text-zinc-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {activeFilter === "verification_queue" ? (
        <div className="mt-4 grid gap-3">
          {verificationQueue.length === 0 ? (
            <p className="text-sm text-zinc-400">No items in DCC fact verification queue.</p>
          ) : (
            verificationQueue.map((vq) => (
              <div
                key={vq.verificationId}
                className="rounded-xl border border-amber-500/35 bg-zinc-950/80 p-4 text-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <strong className="text-amber-200">
                    {vq.entityId} · Field: <code>{vq.fieldPath}</code>
                  </strong>
                  <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-bold text-amber-200">
                    {vq.state}
                  </span>
                </div>
                <p className="mt-1.5 text-zinc-200">{vq.conflictSummary}</p>
                <div className="mt-2 grid gap-1 text-xs text-zinc-400">
                  <div>
                    <strong>Canonical / Primary Value:</strong>{" "}
                    {JSON.stringify(vq.currentVerifiedValue)}
                  </div>
                  <div>
                    <strong>Conflicting / Proposed Value:</strong>{" "}
                    {JSON.stringify(vq.proposedOrConflictingValue)}
                  </div>
                  {vq.sourceUrl && (
                    <div>
                      <strong>Primary Source:</strong>{" "}
                      <a
                        href={vq.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-teal-300 underline"
                      >
                        {vq.sourceUrl}
                      </a>
                    </div>
                  )}
                  {vq.secondaryConflictSourceUrl && (
                    <div>
                      <strong>Conflicting FAQ / Secondary Source:</strong>{" "}
                      <a
                        href={vq.secondaryConflictSourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-amber-300 underline"
                      >
                        {vq.secondaryConflictSourceUrl}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="mt-4 grid gap-3">
          {filteredSubmissions.length === 0 ? (
            <p className="text-sm text-zinc-400">
              No durable submissions match the selected filter yet.
            </p>
          ) : (
            filteredSubmissions.map((s) => {
              const openSailingUrl =
                s.organizerSlug && s.sailingSlug
                  ? `${cpBaseUrl}/hosted-cruises/${s.organizerSlug}/${s.sailingSlug}`
                  : s.shipSlug && s.sailDate
                    ? `${cpBaseUrl}/sailings/${s.shipSlug}/${s.sailDate}`
                    : null;
              const openOrganizerUrl = s.organizerSlug
                ? `${cpBaseUrl}/hosted-cruises/${s.organizerSlug}`
                : null;
              const openPlanUrl = s.shareCode ? `${cpBaseUrl}/p/${s.shareCode}` : null;

              return (
                <article
                  key={s.submissionId}
                  className="rounded-xl border border-zinc-800 bg-zinc-950/85 p-4 text-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <strong className="text-white">{s.displayName}</strong>
                      <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-teal-300">
                        {s.submissionId}
                      </code>
                      <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-200">
                        {s.actionType}
                      </span>
                      <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-xs font-semibold text-cyan-200">
                        {s.completionState}
                      </span>
                      <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs text-amber-200">
                        Follow-up: {s.followUpState}
                      </span>
                      {s.isSyntheticTest && (
                        <span className="rounded-full bg-fuchsia-500/25 px-2 py-0.5 text-xs font-bold text-fuchsia-200">
                          FICTIONAL TEST
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-zinc-400">
                      Outbox: {s.outbox.overallStatus} ({s.outbox.attempts}/{s.outbox.maxAttempts})
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-300">
                    <span>
                      <strong>Contact Consent:</strong>{" "}
                      {s.contactConsent
                        ? `Granted (${s.contactEmail || s.contactPhone || "supplied"})`
                        : "Not granted (no contact stored)"}
                    </span>
                    {s.partySize && (
                      <span>
                        <strong>Party Size:</strong> {s.partySize}
                      </span>
                    )}
                    {(s.hostedSailingId || s.physicalSailingId) && (
                      <span>
                        <strong>Sailing ID:</strong> {s.hostedSailingId || s.physicalSailingId}
                      </span>
                    )}
                    {s.attribution.utmSource && (
                      <span>
                        <strong>UTM:</strong> {s.attribution.utmSource}
                      </span>
                    )}
                  </div>

                  {s.safeFailureReason && (
                    <p className="mt-1.5 text-xs text-rose-300">
                      <strong>Downstream Failure / Review Reason:</strong> {s.safeFailureReason}
                    </p>
                  )}

                  {s.ownerNotes && (
                    <p className="mt-1 text-xs text-emerald-300">
                      <strong>Owner Note:</strong> {s.ownerNotes}
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {openSailingUrl && (
                      <a
                        href={openSailingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs text-teal-200 hover:bg-zinc-700"
                      >
                        Open Sailing ↗
                      </a>
                    )}
                    {openOrganizerUrl && (
                      <a
                        href={openOrganizerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs text-teal-200 hover:bg-zinc-700"
                      >
                        Open Organizer ↗
                      </a>
                    )}
                    {openPlanUrl && (
                      <a
                        href={openPlanUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs text-emerald-200 hover:bg-zinc-700"
                      >
                        Open / Recover Plan ↗
                      </a>
                    )}
                    <button
                      type="button"
                      disabled={busyId === s.submissionId}
                      onClick={() => void runOwnerAction(s.submissionId, "mark_contacted")}
                      className="rounded bg-sky-600/80 px-2.5 py-1 text-xs font-semibold text-white hover:bg-sky-500"
                    >
                      Mark Contacted
                    </button>
                    <button
                      type="button"
                      disabled={busyId === s.submissionId}
                      onClick={() => void runOwnerAction(s.submissionId, "retry_outbox")}
                      className="rounded bg-amber-600/80 px-2.5 py-1 text-xs font-semibold text-white hover:bg-amber-500"
                    >
                      Retry Safe Operation
                    </button>
                    <button
                      type="button"
                      disabled={busyId === s.submissionId}
                      onClick={() => void runOwnerAction(s.submissionId, "resolve")}
                      className="rounded bg-emerald-600/80 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-500"
                    >
                      Resolve
                    </button>
                    <button
                      type="button"
                      disabled={busyId === s.submissionId}
                      onClick={() => void runOwnerAction(s.submissionId, "privacy_delete")}
                      className="rounded bg-rose-700/80 px-2.5 py-1 text-xs font-semibold text-white hover:bg-rose-600"
                    >
                      Privacy Delete
                    </button>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <input
                      value={noteDrafts[s.submissionId] ?? s.ownerNotes ?? ""}
                      onChange={(e) =>
                        setNoteDrafts((prev) => ({ ...prev, [s.submissionId]: e.target.value }))
                      }
                      placeholder="Add owner follow-up note…"
                      className="min-w-[220px] flex-1 rounded border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs text-white"
                    />
                    <button
                      type="button"
                      disabled={busyId === s.submissionId}
                      onClick={() => void runOwnerAction(s.submissionId, "add_note")}
                      className="rounded border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs font-semibold text-zinc-200 hover:bg-zinc-700"
                    >
                      Save Note
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </div>
      )}
    </section>
  );
}
