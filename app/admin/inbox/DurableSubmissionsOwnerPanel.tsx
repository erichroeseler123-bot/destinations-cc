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
  savedBeforeNotificationAt?: string | null;
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
    lastSafeError?: string | null;
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

interface PilotFunnelEntryView {
  organizerSlug: string;
  organizerName: string;
  primarySailingSlug: string;
  sailingTitle: string;
  publicSailingUrl: string;
  organizerClaimUrl: string;
  sailingLinkWithUtm: string;
  claimLinkWithUtm: string;
  funnel: {
    emailSentAndDelivered: {
      status:
        | "not_sent_awaiting_owner_approval"
        | "sent"
        | "delivered"
        | "bounced_or_failed";
      recipientEmail: string;
      sentAt: string | null;
      deliveredAt: string | null;
      deliveryConfirmedByProvider?: boolean;
      resendMessageId: string | null;
      historicalAttempt?: {
        attemptedAt: string;
        fromEmail: string;
        toEmail: string;
        outcome: "bounced_or_failed" | "sent_not_delivery_confirmed";
        bounceDetected: boolean;
        replyReceived: boolean;
        deliveryConfirmedByProvider: false;
        countedAsConversionOrApplication: false;
        summary: string;
      };
      nextDraft?: {
        kind: "new_recipient_intro_hold" | "future_brief_follow_up_hold";
        fromEmail: string;
        toEmail: string;
        sent: boolean;
        doNotSendAnotherIntroEmail: boolean;
        summary: string;
      };
      countedAsConversionOrApplication?: false;
    };
    organizerPageVisit: {
      visited: boolean;
      totalPageViews: number;
      workspaceVisits: number;
      trackedOutreachVisits: number;
      lastVisitedAt: string | null;
      lastOutreachUtmContent: string | null;
    };
    claimOrApplicationStarted: {
      started: boolean;
      claimStartedCount: number;
      lastStartedAt: string | null;
    };
    durableSubmissionReceived: {
      received: boolean;
      genuineCount: number;
      latestSubmissionId: string | null;
      latestSubmittedAt: string | null;
      latestCompletionState: string | null;
    };
    workspaceClaimed: {
      claimed: boolean;
      claimedStatus: "unclaimed" | "pending_verification" | "verified";
      hasWorkspaceKey: boolean;
      claimedAt: string | null;
    };
    sailingBoardOpened: {
      opened: boolean;
      boardProvisioned: boolean;
      boardOpenedCount: number;
      lastBoardOpenedAt: string | null;
    };
    firstTravelerJoined: {
      joined: boolean;
      genuineTravelerPartiesCount: number;
      firstJoinedAt: string | null;
    };
    firstActivityPinned: {
      pinned: boolean;
      pinnedActivitiesCount: number;
      firstPinnedAt: string | null;
    };
    failuresRequiringAttention: {
      attentionRequired: boolean;
      count: number;
      items: Array<{ source: string; summary: string; occurredAt: string }>;
    };
  };
}

interface PilotMonitoringView {
  generatedAt: string;
  outreachSentCount: number;
  outreachBouncedOrFailedCount?: number;
  outreachDeliveredConfirmedCount?: number;
  newWave1DraftsSentCount?: number;
  historicalMessagesCountedAsConversionsOrApplications?: number;
  pilots: PilotFunnelEntryView[];
  syntheticCanaryAuditStatus: {
    canarySubmissionId: string;
    presentAsResolvedAuditRecord: boolean;
    excludedFromAllGenuineLeadAndConversionCounts: boolean;
    realOrganizersCompletedWorkflowCount: number;
    readyForPrivacyDeleteReminder: boolean;
    reminderBannerMessage: string;
  };
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
  const [genuineCount, setGenuineCount] = useState(0);
  const [testCount, setTestCount] = useState(0);
  const [needsAttentionCount, setNeedsAttentionCount] = useState(0);
  const [submissions, setSubmissions] = useState<DurableSubmissionView[]>([]);
  const [verificationQueue, setVerificationQueue] = useState<VerificationQueueItemView[]>([]);
  const [pilotMonitoring, setPilotMonitoring] = useState<PilotMonitoringView | null>(null);
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
        setGenuineCount(body.counts?.genuineCount ?? 0);
        setTestCount(body.counts?.testCount ?? 0);
        setNeedsAttentionCount(body.counts?.needsAttentionCount ?? 0);
        setSubmissions(body.submissions ?? []);
        setVerificationQueue(body.dccVerificationQueue ?? []);
        setPilotMonitoring(body.pilotMonitoring ?? null);
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

  async function updatePilotEmailState(
    organizerSlug: string,
    recipientEmail: string,
    status: "not_sent_awaiting_owner_approval" | "sent" | "delivered" | "bounced_or_failed",
    deliveryConfirmedByProvider = false,
  ) {
    setBusyId(`pilot:${organizerSlug}`);
    try {
      await fetch("/api/admin/durable-submissions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_pilot_email_state",
          organizerSlug,
          recipientEmail,
          status,
          deliveryConfirmedByProvider,
          newWave1DraftSent: status === "sent" || status === "delivered",
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
    if (activeFilter === "partial_or_failed") {
      return (
        s.completionState === "partially_completed" ||
        s.completionState === "failed" ||
        s.completionState === "needs_review" ||
        s.outbox.overallStatus === "failed_retrying" ||
        s.outbox.overallStatus === "failed_max_retries"
      );
    }
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
            <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-200">
              Genuine Leads: {genuineCount}
            </span>
            <span className="rounded-full bg-fuchsia-500/20 px-2.5 py-0.5 text-xs font-bold text-fuchsia-200">
              Excluded Synthetic Audits: {testCount}
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

      {pilotMonitoring && (
        <div
          data-testid="dcc-wave1-pilot-monitor"
          className="mt-4 rounded-xl border border-teal-500/30 bg-zinc-950/85 p-4"
        >
          {pilotMonitoring.syntheticCanaryAuditStatus.presentAsResolvedAuditRecord && (
            <div
              data-testid="dcc-canary-audit-banner"
              className={`mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border px-3.5 py-2.5 text-xs ${
                pilotMonitoring.syntheticCanaryAuditStatus.readyForPrivacyDeleteReminder
                  ? "border-amber-400/60 bg-amber-500/15 text-amber-100"
                  : "border-zinc-700 bg-zinc-900/90 text-zinc-300"
              }`}
            >
              <div>
                <strong className="text-white">
                  Audit Isolation ({pilotMonitoring.syntheticCanaryAuditStatus.canarySubmissionId}):
                </strong>{" "}
                {pilotMonitoring.syntheticCanaryAuditStatus.reminderBannerMessage}
              </div>
              {pilotMonitoring.syntheticCanaryAuditStatus.readyForPrivacyDeleteReminder && (
                <button
                  type="button"
                  disabled={busyId === pilotMonitoring.syntheticCanaryAuditStatus.canarySubmissionId}
                  onClick={() =>
                    void runOwnerAction(
                      pilotMonitoring.syntheticCanaryAuditStatus.canarySubmissionId,
                      "privacy_delete",
                    )
                  }
                  className="rounded bg-rose-600 px-3 py-1 font-bold text-white hover:bg-rose-500"
                >
                  Privacy Delete {pilotMonitoring.syntheticCanaryAuditStatus.canarySubmissionId}
                </button>
              )}
            </div>
          )}

          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-teal-300">
                Wave 1 Safe Founding Pilots — 9-Step Live Funnel Monitor
              </h3>
              <p className="text-xs text-zinc-400">
                Historical Sent (Unconfirmed Delivery):{" "}
                <strong>{pilotMonitoring.outreachSentCount}</strong> · Historical Bounced/Failed:{" "}
                <strong>{pilotMonitoring.outreachBouncedOrFailedCount ?? 0}</strong> · Provider-Confirmed
                Delivered: <strong>{pilotMonitoring.outreachDeliveredConfirmedCount ?? 0}</strong> · New
                Wave 1 Drafts Sent: <strong>{pilotMonitoring.newWave1DraftsSentCount ?? 0}</strong> ·
                Historical Counted as Conversions/Applications:{" "}
                <strong>
                  {pilotMonitoring.historicalMessagesCountedAsConversionsOrApplications ?? 0}
                </strong>
              </p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {pilotMonitoring.pilots.map((pilot) => {
              const f = pilot.funnel;
              const hist = f.emailSentAndDelivered.historicalAttempt;
              const draft = f.emailSentAndDelivered.nextDraft;
              const emailLabel =
                f.emailSentAndDelivered.status === "delivered" &&
                f.emailSentAndDelivered.deliveryConfirmedByProvider
                  ? "Delivered (Provider-Confirmed)"
                  : f.emailSentAndDelivered.status === "sent"
                    ? `Sent — Not Delivery-Confirmed (${hist?.attemptedAt ?? "sent"} · ${hist?.fromEmail ?? ""} → ${hist?.toEmail ?? f.emailSentAndDelivered.recipientEmail} · No bounce, no reply)`
                    : f.emailSentAndDelivered.status === "bounced_or_failed"
                      ? `Bounced / Failed (${hist?.attemptedAt?.slice(0, 10) ?? "2026-09-04"} · ${hist?.fromEmail ?? ""} → ${hist?.toEmail ?? "travel@stitchinheaven.com"})`
                      : "Hold — Awaiting Erich Approval (0 Sent)";
              const emailTone =
                f.emailSentAndDelivered.status === "bounced_or_failed"
                  ? "text-rose-300"
                  : f.emailSentAndDelivered.status === "delivered"
                    ? "text-emerald-300"
                    : "text-amber-200";

              return (
                <div
                  key={pilot.organizerSlug}
                  data-testid={`dcc-pilot-card-${pilot.organizerSlug}`}
                  className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-3.5 text-xs"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2 border-b border-zinc-800 pb-2.5">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <strong className="text-sm text-white">{pilot.organizerName}</strong>
                        {draft?.doNotSendAnotherIntroEmail && (
                          <span className="rounded-full border border-amber-400/50 bg-amber-500/15 px-2 py-0.5 text-[11px] font-bold text-amber-200">
                            DO NOT SEND NEW INTRO — Brief Follow-Up Draft Held
                          </span>
                        )}
                      </div>
                      <div className="text-zinc-400">{pilot.sailingTitle}</div>
                      <div className="mt-0.5 text-zinc-400">
                        Target Recipient: <code>{f.emailSentAndDelivered.recipientEmail}</code>
                        {draft && (
                          <span>
                            {" "}
                            · Next Draft: <strong>{draft.sent ? "Sent" : "Held Unsent"}</strong>
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <a
                        href={pilot.publicSailingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-teal-200 hover:bg-zinc-700"
                      >
                        Sailing Page ↗
                      </a>
                      <a
                        href={pilot.organizerClaimUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-cyan-200 hover:bg-zinc-700"
                      >
                        Claim Hub ↗
                      </a>
                    </div>
                  </div>

                  <div className="mt-2.5 grid gap-1.5 sm:grid-cols-2">
                    <div className="rounded border border-zinc-800 bg-zinc-950/75 px-2.5 py-1.5 sm:col-span-2">
                      <div className="text-zinc-400">1. Email Sent &amp; Delivered</div>
                      <div className={`font-semibold ${emailTone}`}>{emailLabel}</div>
                      {draft && <div className="mt-0.5 text-[11px] text-zinc-400">{draft.summary}</div>}
                    </div>
                    <div className="rounded border border-zinc-800 bg-zinc-950/75 px-2.5 py-1.5">
                      <div className="text-zinc-400">2. Organizer Page Visit</div>
                      <div className="font-semibold text-zinc-100">
                        Outreach Clicks: {f.organizerPageVisit.trackedOutreachVisits} · Total:{" "}
                        {f.organizerPageVisit.totalPageViews + f.organizerPageVisit.workspaceVisits}
                      </div>
                    </div>
                    <div className="rounded border border-zinc-800 bg-zinc-950/75 px-2.5 py-1.5">
                      <div className="text-zinc-400">3. Claim / Application Started</div>
                      <div className="font-semibold text-zinc-100">
                        {f.claimOrApplicationStarted.started
                          ? `Yes (${f.claimOrApplicationStarted.claimStartedCount})`
                          : "Not yet (0)"}
                      </div>
                    </div>
                    <div className="rounded border border-zinc-800 bg-zinc-950/75 px-2.5 py-1.5">
                      <div className="text-zinc-400">4. Durable Submission Received</div>
                      <div className="font-semibold text-zinc-100">
                        {f.durableSubmissionReceived.received
                          ? `${f.durableSubmissionReceived.genuineCount} (${f.durableSubmissionReceived.latestSubmissionId})`
                          : "0 genuine submissions"}
                      </div>
                    </div>
                    <div className="rounded border border-zinc-800 bg-zinc-950/75 px-2.5 py-1.5">
                      <div className="text-zinc-400">5. Workspace Claimed</div>
                      <div className="font-semibold text-zinc-100">
                        {f.workspaceClaimed.claimed
                          ? "Verified & Claimed"
                          : f.workspaceClaimed.claimedStatus}
                      </div>
                    </div>
                    <div className="rounded border border-zinc-800 bg-zinc-950/75 px-2.5 py-1.5">
                      <div className="text-zinc-400">6. Sailing Board Opened</div>
                      <div className="font-semibold text-zinc-100">
                        {f.sailingBoardOpened.opened
                          ? `Opened (${f.sailingBoardOpened.boardOpenedCount} views)`
                          : "Not opened yet (0)"}
                      </div>
                    </div>
                    <div className="rounded border border-zinc-800 bg-zinc-950/75 px-2.5 py-1.5">
                      <div className="text-zinc-400">7. First Traveler Joined</div>
                      <div className="font-semibold text-zinc-100">
                        {f.firstTravelerJoined.joined
                          ? `${f.firstTravelerJoined.genuineTravelerPartiesCount} parties joined`
                          : "0 parties"}
                      </div>
                    </div>
                    <div className="rounded border border-zinc-800 bg-zinc-950/75 px-2.5 py-1.5">
                      <div className="text-zinc-400">8. First Activity Pinned</div>
                      <div className="font-semibold text-zinc-100">
                        {f.firstActivityPinned.pinned
                          ? `${f.firstActivityPinned.pinnedActivitiesCount} pinned`
                          : "0 pinned"}
                      </div>
                    </div>
                    <div
                      className={`rounded border px-2.5 py-1.5 sm:col-span-2 ${
                        f.failuresRequiringAttention.attentionRequired
                          ? "border-rose-500/50 bg-rose-950/40 text-rose-200"
                          : "border-zinc-800 bg-zinc-950/75 text-emerald-300"
                      }`}
                    >
                      <div className="text-zinc-400">9. Any Failure Requiring Attention</div>
                      <div className="font-semibold">
                        {f.failuresRequiringAttention.attentionRequired
                          ? `${f.failuresRequiringAttention.count} failure(s): ${f.failuresRequiringAttention.items
                              .map((it) => it.summary)
                              .join(" · ")}`
                          : "0 failures — healthy"}
                      </div>
                    </div>
                  </div>

                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5 border-t border-zinc-800 pt-2">
                    <span className="text-zinc-400">Log new draft action:</span>
                    <button
                      type="button"
                      disabled={busyId === `pilot:${pilot.organizerSlug}`}
                      onClick={() =>
                        void updatePilotEmailState(
                          pilot.organizerSlug,
                          f.emailSentAndDelivered.recipientEmail,
                          "sent",
                          false,
                        )
                      }
                      className="rounded border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-zinc-200 hover:bg-zinc-700"
                    >
                      Log New Draft Sent
                    </button>
                    <button
                      type="button"
                      disabled={busyId === `pilot:${pilot.organizerSlug}`}
                      onClick={() =>
                        void updatePilotEmailState(
                          pilot.organizerSlug,
                          f.emailSentAndDelivered.recipientEmail,
                          "delivered",
                          true,
                        )
                      }
                      className="rounded border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-emerald-200 hover:bg-zinc-700"
                    >
                      Confirm Provider Delivery
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
                    {s.savedBeforeNotificationAt && (
                      <span>
                        <strong>Write-Ahead Saved:</strong> {s.savedBeforeNotificationAt}
                      </span>
                    )}
                  </div>

                  {s.submittedSummaryNote && (
                    <p className="mt-1.5 text-xs text-zinc-300">
                      <strong>Submitted Summary:</strong> {s.submittedSummaryNote}
                    </p>
                  )}

                  {s.outbox.lastSafeError && (
                    <p className="mt-1 text-xs text-amber-300">
                      <strong>Outbox Recovery Alert:</strong> {s.outbox.lastSafeError}
                    </p>
                  )}

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
