"use client";

import { useEffect, useState } from "react";
import type {
  HostedCruisesAdminBridgeSnapshot,
  HostedCruisesBridgeResponse,
} from "@/lib/dcc/hostedCruisesAdminBridge";

type PostClaimMode =
  | "open_private_link"
  | "organizer_approval"
  | "invitation_code"
  | "verified_member";

const POST_CLAIM_MODE_OPTIONS: Array<{
  value: PostClaimMode;
  label: string;
  helper: string;
}> = [
  {
    value: "open_private_link",
    label: "Open Private-Link Join",
    helper:
      "Guests who booked with the host can join immediately with a display name and party size.",
  },
  {
    value: "organizer_approval",
    label: "Organizer Approval Queue",
    helper:
      "New guest requests wait in the approval queue below until you or the verified host approves them.",
  },
  {
    value: "invitation_code",
    label: "Invitation Code Required",
    helper:
      "Guests must enter the shared organizer invitation code before opening the private board.",
  },
  {
    value: "verified_member",
    label: "Verified Member Access Code",
    helper:
      "Guests enter the host's verified-member pass code and are counted under Verified Organizer Members.",
  },
];

export default function HostedCruisesAdminClient({
  initialBridge,
  cpTargetOverride,
  rcTargetOverride,
}: {
  initialBridge: HostedCruisesBridgeResponse;
  cpTargetOverride?: string | null;
  rcTargetOverride?: string | null;
}) {
  const [bridge, setBridge] =
    useState<HostedCruisesBridgeResponse>(initialBridge);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [banner, setBanner] = useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);
  const [issuedWorkspaceCredential, setIssuedWorkspaceCredential] = useState<{
    organizerSlug: string;
    workspaceAccessKey: string;
    workspaceUrl: string;
    handoffUrl?: string;
    handoffExpiresAt?: string;
  } | null>(null);

  const snapshot: HostedCruisesAdminBridgeSnapshot | null = bridge.snapshot;
  const activationCohort = bridge.activationCohort ?? [];
  const sailings = snapshot?.sailings ?? [];
  const organizers = snapshot?.organizers ?? [];

  const [selectedCohortSlug, setSelectedCohortSlug] = useState<string>(
    activationCohort[0]?.organizerSlug ?? "arnos-bear-cruises",
  );
  const [cohortStateDrafts, setCohortStateDrafts] = useState<
    Record<string, string>
  >({});
  const [cohortNotesDrafts, setCohortNotesDrafts] = useState<
    Record<string, string>
  >({});

  const activeCohortItem =
    activationCohort.find((item) => item.organizerSlug === selectedCohortSlug) ??
    activationCohort[0] ??
    null;

  const [orgFilterQuery, setOrgFilterQuery] = useState<string>("");
  const [selectedOrganizerSlug, setSelectedOrganizerSlug] = useState<string>(
    organizers[0]?.organizerSlug ?? "arnos-bear-cruises",
  );
  const [selectedSailingKey, setSelectedSailingKey] = useState<string>(
    sailings[0] ? `${sailings[0].organizerSlug}::${sailings[0].sailingSlug}` : "",
  );

  useEffect(() => {
    if (!selectedOrganizerSlug && organizers[0]?.organizerSlug) {
      setSelectedOrganizerSlug(organizers[0].organizerSlug);
    }
  }, [organizers, selectedOrganizerSlug]);

  const filteredOrganizers = organizers.filter((o) => {
    const q = orgFilterQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      o.organizerName.toLowerCase().includes(q) ||
      o.organizerSlug.toLowerCase().includes(q) ||
      o.officialDomain.toLowerCase().includes(q)
    );
  });

  const activeOrganizer =
    organizers.find((o) => o.organizerSlug === selectedOrganizerSlug) ??
    filteredOrganizers[0] ??
    organizers[0] ??
    null;

  const organizerSailings = activeOrganizer
    ? sailings.filter((s) => s.organizerSlug === activeOrganizer.organizerSlug)
    : sailings;

  useEffect(() => {
    const matching = organizerSailings.find(
      (s) => `${s.organizerSlug}::${s.sailingSlug}` === selectedSailingKey,
    );
    if (!matching && organizerSailings[0]) {
      setSelectedSailingKey(
        `${organizerSailings[0].organizerSlug}::${organizerSailings[0].sailingSlug}`,
      );
    }
  }, [activeOrganizer?.organizerSlug, organizerSailings, selectedSailingKey]);

  const activeSailing =
    sailings.find(
      (s) => `${s.organizerSlug}::${s.sailingSlug}` === selectedSailingKey,
    ) ??
    organizerSailings[0] ??
    sailings[0] ??
    null;

  // Claim review local controls
  const [claimModeDrafts, setClaimModeDrafts] = useState<
    Record<string, PostClaimMode>
  >({});
  const [claimNotes, setClaimNotes] = useState<Record<string, string>>({});

  // Organizer profile editor state
  const [orgWebsiteUrl, setOrgWebsiteUrl] = useState(
    activeOrganizer?.officialWebsiteUrl ?? "",
  );
  const [orgSummary, setOrgSummary] = useState(
    activeOrganizer?.publicSummary ?? "",
  );

  useEffect(() => {
    if (activeOrganizer) {
      setOrgWebsiteUrl(activeOrganizer.officialWebsiteUrl);
      setOrgSummary(activeOrganizer.publicSummary);
    }
  }, [activeOrganizer?.organizerSlug, activeOrganizer?.officialWebsiteUrl, activeOrganizer?.publicSummary]);

  // Per-sailing editor states
  const [sailingPageUrl, setSailingPageUrl] = useState(
    activeSailing?.officialSailingPageUrl ?? "",
  );
  const [reservationFormUrl, setReservationFormUrl] = useState(
    activeSailing?.officialReservationFormUrl ?? "",
  );
  const [cabinNote, setCabinNote] = useState(
    activeSailing?.cabinAvailabilityNote ?? "",
  );
  const [welcomeNote, setWelcomeNote] = useState(
    activeSailing?.welcomeNote ?? "",
  );
  const [selectedMode, setSelectedMode] = useState<PostClaimMode>(
    activeSailing &&
      activeSailing.membershipMode !== "independent_sailing_community"
      ? activeSailing.membershipMode
      : "open_private_link",
  );
  const [accessCodeDraft, setAccessCodeDraft] = useState("");
  const [suspendReasonDraft, setSuspendReasonDraft] = useState(
    activeSailing?.suspendedReason ?? "",
  );

  useEffect(() => {
    if (!activeSailing) return;
    setSailingPageUrl(activeSailing.officialSailingPageUrl);
    setReservationFormUrl(activeSailing.officialReservationFormUrl);
    setCabinNote(activeSailing.cabinAvailabilityNote);
    setWelcomeNote(activeSailing.welcomeNote ?? "");
    setSelectedMode(
      activeSailing.membershipMode !== "independent_sailing_community"
        ? activeSailing.membershipMode
        : "open_private_link",
    );
    setAccessCodeDraft("");
    setSuspendReasonDraft(activeSailing.suspendedReason ?? "");
  }, [
    activeSailing?.sailingSlug,
    activeSailing?.officialSailingPageUrl,
    activeSailing?.officialReservationFormUrl,
    activeSailing?.cabinAvailabilityNote,
    activeSailing?.welcomeNote,
    activeSailing?.membershipMode,
    activeSailing?.suspendedReason,
  ]);

  async function refreshSnapshot() {
    setBusyKey("refresh");
    setBanner(null);
    try {
      const qs = new URLSearchParams({ probeResend: "1" });
      if (cpTargetOverride) qs.set("cpTarget", cpTargetOverride);
      if (rcTargetOverride) qs.set("rcTarget", rcTargetOverride);
      const res = await fetch(`/api/admin/hosted-cruises?${qs.toString()}`, {
        cache: "no-store",
      });
      const data = (await res.json()) as HostedCruisesBridgeResponse;
      setBridge(data);
      if (data.ok) {
        setBanner({
          tone: "success",
          text: "Refreshed live Cruise Promenade & RollCallUSA status.",
        });
      } else {
        setBanner({
          tone: "error",
          text: data.error || "Unable to refresh hosted-cruise status.",
        });
      }
    } catch {
      setBanner({
        tone: "error",
        text: "Network error while refreshing hosted-cruise status.",
      });
    } finally {
      setBusyKey(null);
    }
  }

  async function runAction(
    key: string,
    payload: Record<string, unknown>,
    successMessage: string,
  ) {
    setBusyKey(key);
    setBanner(null);
    try {
      const res = await fetch("/api/admin/hosted-cruises", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          ...(cpTargetOverride ? { cpTarget: cpTargetOverride } : {}),
          ...(rcTargetOverride ? { rcTarget: rcTargetOverride } : {}),
        }),
      });
      const data = (await res.json()) as HostedCruisesBridgeResponse;
      if (!res.ok || !data.ok) {
        setBanner({
          tone: "error",
          text: data.error || "Could not save change.",
        });
        return;
      }
      if (data.snapshot) {
        setBridge((prev) => ({
          ...prev,
          ok: true,
          error: undefined,
          snapshot: data.snapshot,
          ...(data.activationCohort ? { activationCohort: data.activationCohort } : {}),
        }));
      } else if (data.activationCohort) {
        setBridge((prev) => ({
          ...prev,
          activationCohort: data.activationCohort,
        }));
      }
      if (
        data.actionResult &&
        typeof data.actionResult.workspaceAccessKey === "string" &&
        data.actionResult.workspaceAccessKey
      ) {
        const orgSlug =
          typeof data.actionResult.organizerSlug === "string"
            ? data.actionResult.organizerSlug
            : activeOrganizer?.organizerSlug || "";
        const handoffPath =
          typeof data.actionResult.handoffPath === "string" &&
          data.actionResult.handoffPath
            ? data.actionResult.handoffPath
            : undefined;
        const handoffExpiresAt =
          typeof data.actionResult.handoffExpiresAt === "string"
            ? data.actionResult.handoffExpiresAt
            : undefined;
        setIssuedWorkspaceCredential({
          organizerSlug: orgSlug,
          workspaceAccessKey: data.actionResult.workspaceAccessKey,
          workspaceUrl: `${bridge.cpBaseUrl}/organizer/hosted/${orgSlug}`,
          handoffUrl: handoffPath ? `${bridge.cpBaseUrl}${handoffPath}` : undefined,
          handoffExpiresAt,
        });
      }
      setBanner({ tone: "success", text: successMessage });
    } catch {
      setBanner({
        tone: "error",
        text: "Network error while saving change.",
      });
    } finally {
      setBusyKey(null);
    }
  }

  const pendingClaims = (snapshot?.claims ?? []).filter(
    (c) => c.status === "pending_verification",
  );
  const reviewedClaims = (snapshot?.claims ?? []).filter(
    (c) => c.status !== "pending_verification",
  );
  const opsFailures = snapshot?.opsFailures ?? [];
  const rcHealth = snapshot?.health.rollCallOps;

  return (
    <div className="space-y-8">
      {/* Status Banner */}
      {banner && (
        <div
          data-testid="dcc-hosted-admin-status-banner"
          className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${
            banner.tone === "success"
              ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-100"
              : "border-rose-400/45 bg-rose-500/15 text-rose-100"
          }`}
        >
          {banner.text}
        </div>
      )}

      {issuedWorkspaceCredential && (
        <div
          data-testid="dcc-issued-workspace-credential-box"
          className="rounded-2xl border border-emerald-400/50 bg-emerald-500/15 p-4 space-y-2 text-xs text-emerald-50"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <strong className="text-sm font-black text-emerald-200">
              One-Time $0 Organizer Workspace Key Issued ({issuedWorkspaceCredential.organizerSlug})
            </strong>
            <button
              type="button"
              onClick={() => setIssuedWorkspaceCredential(null)}
              className="rounded-lg border border-white/25 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-white/10"
            >
              Dismiss
            </button>
          </div>
          {issuedWorkspaceCredential.handoffUrl && (
            <div className="space-y-1">
              <p className="font-bold text-teal-200">
                Single-Use One-Time Welcome Link (burns immediately on first use
                {issuedWorkspaceCredential.handoffExpiresAt
                  ? `, expires ${new Date(issuedWorkspaceCredential.handoffExpiresAt).toLocaleString()}`
                  : ""}
                ):
              </p>
              <div className="rounded-lg border border-teal-400/35 bg-black/60 px-3 py-2 font-mono text-xs text-teal-100 break-all">
                {issuedWorkspaceCredential.handoffUrl}
              </div>
            </div>
          )}
          <p className="text-zinc-200">
            Organizer Passkey (shown once — share only after completing identity verification):
          </p>
          <div className="rounded-lg border border-white/20 bg-black/60 px-3 py-2 font-mono text-xs text-emerald-200 break-all">
            {issuedWorkspaceCredential.workspaceAccessKey}
          </div>
          <div>
            Workspace URL:{" "}
            <a
              href={issuedWorkspaceCredential.workspaceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-bold text-teal-200"
            >
              {issuedWorkspaceCredential.workspaceUrl}
            </a>
          </div>
        </div>
      )}

      {!bridge.ok && (
        <section
          data-testid="dcc-hosted-admin-connection-warning"
          className="rounded-2xl border border-rose-400/45 bg-rose-500/10 p-5 space-y-3"
        >
          <h2 className="text-lg font-black text-rose-200">
            Cruise Promenade Connection Needs Attention
          </h2>
          <p className="text-sm text-rose-100">
            {bridge.error ||
              "Could not connect to Cruise Promenade hosted-cruises service."}
          </p>
          <p className="text-xs text-zinc-300">
            Connected target: <code>{bridge.cpBaseUrl}</code>
          </p>
          <button
            type="button"
            onClick={refreshSnapshot}
            disabled={busyKey !== null}
            className="rounded-xl bg-white px-4 py-2 text-xs font-black text-zinc-950 hover:bg-zinc-200"
          >
            {busyKey === "refresh" ? "Checking…" : "Retry Connection"}
          </button>
        </section>
      )}

      {/* 1. System Health & Operational Failures */}
      <section
        data-testid="dcc-hosted-admin-health-panel"
        aria-labelledby="health-heading"
        className="rounded-2xl border border-white/15 bg-white/[0.03] p-5 space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 id="health-heading" className="text-lg font-black text-white">
              1. System Health &amp; Operational Alerts
            </h2>
            <p className="text-xs text-zinc-400">
              Connected to <code>{bridge.cpBaseUrl}</code>
              {snapshot?.generatedAt
                ? ` · Updated ${new Date(snapshot.generatedAt).toLocaleTimeString()}`
                : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {opsFailures.length > 0 && (
              <button
                type="button"
                data-testid="dcc-hosted-clear-failures-btn"
                disabled={busyKey !== null}
                onClick={() =>
                  runAction(
                    "clear-failures",
                    { action: "clear_ops_failures" },
                    "Cleared resolved operational alerts.",
                  )
                }
                className="rounded-xl border border-amber-400/40 bg-amber-500/15 px-3.5 py-2 text-xs font-bold text-amber-100 hover:bg-amber-500/25"
              >
                Clear Resolved Alerts ({opsFailures.length})
              </button>
            )}
            <button
              type="button"
              data-testid="dcc-hosted-refresh-btn"
              disabled={busyKey !== null}
              onClick={refreshSnapshot}
              className="rounded-xl border border-teal-400/40 bg-teal-500/15 px-3.5 py-2 text-xs font-bold text-teal-100 hover:bg-teal-500/25"
            >
              {busyKey === "refresh" ? "Refreshing…" : "Refresh Live Status"}
            </button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-black/40 p-3.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              DCC ↔ Cruise Promenade Link
            </div>
            <div className="mt-1 flex items-center gap-2">
              <span
                className={`inline-block h-2.5 w-2.5 rounded-full ${
                  bridge.ok ? "bg-emerald-400" : "bg-rose-400"
                }`}
              />
              <span className="text-sm font-black text-white">
                {bridge.ok ? "Connected & Ready" : "Connection Issue"}
              </span>
            </div>
            <div className="mt-1 text-xs text-zinc-400">
              Service secret:{" "}
              {snapshot?.health.dccServiceSecretConfigured ||
              bridge.dccServiceSecretPresent
                ? "Configured"
                : "Missing"}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/40 p-3.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              Cruise Promenade ↔ RollCallUSA Bridge
            </div>
            <div className="mt-1 flex items-center gap-2">
              <span
                className={`inline-block h-2.5 w-2.5 rounded-full ${
                  rcHealth?.reachable && rcHealth?.bridgeSigningConfigured
                    ? "bg-emerald-400"
                    : "bg-amber-400"
                }`}
              />
              <span className="text-sm font-black text-white">
                {rcHealth?.reachable && rcHealth?.bridgeSigningConfigured
                  ? "Connected & Signed"
                  : "Needs Attention"}
              </span>
            </div>
            <div className="mt-1 text-xs text-zinc-400">
              Database: {rcHealth?.databaseReady ? "Ready" : "Unavailable"} ·
              HMAC:{" "}
              {snapshot?.health.rollCallBridgeSecretConfigured
                ? "Ready"
                : "Missing"}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/40 p-3.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              Closed-App Email Alerts (Resend)
            </div>
            <div className="mt-1 flex items-center gap-2">
              <span
                className={`inline-block h-2.5 w-2.5 rounded-full ${
                  rcHealth?.liveEmailDeliveryReady
                    ? "bg-emerald-400"
                    : "bg-amber-400"
                }`}
              />
              <span className="text-sm font-black text-white">
                {rcHealth?.liveEmailDeliveryReady
                  ? `Live Ready${rcHealth.emailFromDomain ? ` (${rcHealth.emailFromDomain})` : ""}`
                  : "Disabled or Unconfigured"}
              </span>
            </div>
            <div className="mt-1 text-xs text-zinc-400">
              {rcHealth?.resendConnectivityOk === false
                ? "Resend API check reported an error"
                : "Zero message content ever sent in alert emails"}
            </div>
          </div>
        </div>

        {/* Operational Failures Feed */}
        <div
          data-testid="dcc-hosted-ops-failures-box"
          className="rounded-xl border border-white/10 bg-black/35 p-3.5"
        >
          <div className="text-xs font-bold uppercase tracking-wider text-zinc-300">
            Recent Operational Failures ({opsFailures.length})
          </div>
          {opsFailures.length === 0 ? (
            <p className="mt-1 text-xs text-emerald-200">
              ✓ No unresolved operational failures recorded across enrollment,
              RollCall sync, or room moderation.
            </p>
          ) : (
            <ul className="mt-2 space-y-2 text-xs">
              {opsFailures.slice(0, 12).map((item) => (
                <li
                  key={item.id}
                  className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2"
                >
                  <div>
                    <span
                      className={`mr-2 rounded px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase ${
                        item.severity === "error"
                          ? "bg-rose-500/25 text-rose-200"
                          : "bg-amber-500/25 text-amber-200"
                      }`}
                    >
                      {item.severity}
                    </span>
                    <strong className="text-white">{item.summary}</strong>
                    {item.sailingSlug ? (
                      <span className="ml-2 text-zinc-400">
                        ({item.sailingSlug})
                      </span>
                    ) : null}
                  </div>
                  <span className="font-mono text-[11px] text-zinc-400">
                    {new Date(item.createdAt).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Stale or Changed Source Review Queue Alert */}
        {bridge.sourceStalenessMonitor && (
          <div
            data-testid="dcc-stale-source-alerts-box"
            className={`rounded-xl border p-3.5 ${
              bridge.sourceStalenessMonitor.counts.overdueCheckCount > 0 ||
              bridge.sourceStalenessMonitor.counts.materialChangedCount > 0
                ? "border-amber-400/45 bg-amber-500/10"
                : "border-white/10 bg-black/35"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs font-bold uppercase tracking-wider text-amber-200">
                Stale / Changed Source Review Queue (
                {bridge.sourceStalenessMonitor.counts.totalAlerts})
              </div>
              <div className="text-[11px] text-zinc-300">
                Overdue: {bridge.sourceStalenessMonitor.counts.overdueCheckCount} ·
                Changed: {bridge.sourceStalenessMonitor.counts.materialChangedCount} ·
                WAF/Probe Manual Queue:{" "}
                {bridge.sourceStalenessMonitor.counts.probeBlockedCount}
              </div>
            </div>
            {bridge.sourceStalenessMonitor.alerts.length === 0 ? (
              <p className="mt-1 text-xs text-emerald-200">
                ✓ All hosted sailings, organizers, and release-watch sources are
                within their verification freshness window.
              </p>
            ) : (
              <ul className="mt-2 space-y-2 text-xs">
                {bridge.sourceStalenessMonitor.alerts.slice(0, 10).map((alert) => (
                  <li
                    key={alert.alertId}
                    className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2"
                  >
                    <div>
                      <span className="mr-2 rounded bg-amber-500/25 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase text-amber-200">
                        {alert.reasons.join(", ")}
                      </span>
                      <strong className="text-white">{alert.title}</strong>
                      <span className="ml-2 text-zinc-400">
                        (checked {alert.checkedAt.slice(0, 10)})
                      </span>
                      <p className="mt-0.5 text-[11px] text-zinc-300">
                        {alert.summary}
                      </p>
                    </div>
                    <a
                      href={alert.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-[11px] underline text-teal-200"
                    >
                      Verify Source ↗
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>

      {/* 2. Pending Organizer Claims */}
      <section
        data-testid="dcc-hosted-claims-panel"
        aria-labelledby="claims-heading"
        className="rounded-2xl border border-purple-400/35 bg-purple-500/[0.06] p-5 space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 id="claims-heading" className="text-lg font-black text-white">
              2. Organizer Claim Requests ({pendingClaims.length} Pending)
            </h2>
            <p className="text-xs text-zinc-300">
              Until you approve an organizer claim, travelers join an{" "}
              <strong>Independent Cruise Promenade Sailing Community</strong>—never
              an official or verified organizer roster.
            </p>
          </div>
        </div>

        {pendingClaims.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-black/35 px-4 py-3 text-xs text-zinc-300">
            No pending organizer claims waiting for review right now.
          </div>
        ) : (
          <div className="grid gap-4">
            {pendingClaims.map((claim) => {
              const modeDraft =
                claimModeDrafts[claim.claimId] ?? "open_private_link";
              const noteDraft = claimNotes[claim.claimId] ?? "";
              return (
                <article
                  key={claim.claimId}
                  data-testid={`dcc-claim-card-${claim.claimId}`}
                  className="rounded-xl border border-purple-400/40 bg-black/50 p-4 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="text-sm font-black text-white">
                        {claim.claimantName}
                      </span>{" "}
                      <span className="text-xs text-zinc-300">
                        ({claim.claimantRole}) · {claim.claimantEmailRedacted}
                      </span>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        claim.domainMatchesOfficial
                          ? "bg-emerald-500/20 text-emerald-200 border border-emerald-400/40"
                          : "bg-amber-500/20 text-amber-200 border border-amber-400/40"
                      }`}
                    >
                      {claim.domainMatchesOfficial
                        ? `✓ Official Domain Match (${claim.claimantEmailDomain})`
                        : `⚠ Different Email Domain (${claim.claimantEmailDomain}) — Verify Manually`}
                    </span>
                  </div>

                  <div className="text-xs text-zinc-300 space-y-1">
                    <div>
                      <strong>Scope:</strong> {claim.organizerSlug} ·{" "}
                      {claim.sailingSlug || "All organizer sailings"}
                    </div>
                    {claim.verificationNote && (
                      <div>
                        <strong>Organizer Note:</strong> {claim.verificationNote}
                      </div>
                    )}
                    {claim.welcomeNoteDraft && (
                      <div>
                        <strong>Proposed Welcome Note:</strong>{" "}
                        {claim.welcomeNoteDraft}
                      </div>
                    )}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block space-y-1 text-xs">
                      <span className="font-bold text-zinc-200">
                        Membership Mode After Approval
                      </span>
                      <select
                        data-testid={`dcc-claim-mode-select-${claim.claimId}`}
                        value={modeDraft}
                        onChange={(e) =>
                          setClaimModeDrafts((prev) => ({
                            ...prev,
                            [claim.claimId]: e.target.value as PostClaimMode,
                          }))
                        }
                        className="w-full rounded-lg border border-white/20 bg-zinc-900 px-3 py-2 text-xs text-white"
                      >
                        {POST_CLAIM_MODE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block space-y-1 text-xs">
                      <span className="font-bold text-zinc-200">
                        Owner Review Note (optional)
                      </span>
                      <input
                        type="text"
                        value={noteDraft}
                        onChange={(e) =>
                          setClaimNotes((prev) => ({
                            ...prev,
                            [claim.claimId]: e.target.value,
                          }))
                        }
                        placeholder="e.g. Confirmed by phone with organizer"
                        className="w-full rounded-lg border border-white/20 bg-zinc-900 px-3 py-2 text-xs text-white"
                      />
                    </label>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      data-testid={`dcc-claim-approve-btn-${claim.claimId}`}
                      disabled={busyKey !== null}
                      onClick={() =>
                        runAction(
                          `approve-${claim.claimId}`,
                          {
                            action: "review_claim",
                            claimId: claim.claimId,
                            decision: "verified",
                            initialMembershipMode: modeDraft,
                            reviewDecisionNote: noteDraft || undefined,
                          },
                          `Approved claim for ${claim.claimantName}. Page is now marked Verified Organizer.`,
                        )
                      }
                      className="rounded-xl bg-emerald-400 px-4 py-2 text-xs font-black text-zinc-950 hover:bg-emerald-300"
                    >
                      Approve Claim
                    </button>
                    <button
                      type="button"
                      data-testid={`dcc-claim-reject-btn-${claim.claimId}`}
                      disabled={busyKey !== null}
                      onClick={() =>
                        runAction(
                          `reject-${claim.claimId}`,
                          {
                            action: "review_claim",
                            claimId: claim.claimId,
                            decision: "rejected",
                            reviewDecisionNote: noteDraft || undefined,
                          },
                          `Rejected claim ${claim.claimId}. Sailing stays an Independent Community.`,
                        )
                      }
                      className="rounded-xl border border-rose-400/45 bg-rose-500/15 px-4 py-2 text-xs font-bold text-rose-100 hover:bg-rose-500/25"
                    >
                      Reject Claim
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {reviewedClaims.length > 0 && (
          <details className="rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-xs text-zinc-300">
            <summary className="cursor-pointer font-bold text-zinc-200">
              Reviewed Claim History ({reviewedClaims.length})
            </summary>
            <ul className="mt-2 space-y-1.5">
              {reviewedClaims.map((c) => (
                <li
                  key={c.claimId}
                  className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-1.5"
                >
                  <span>
                    <strong>{c.claimantName}</strong> ({c.claimantEmailRedacted})
                    · {c.sailingSlug || "Profile"} —{" "}
                    <strong
                      className={
                        c.status === "verified"
                          ? "text-emerald-300"
                          : "text-rose-300"
                      }
                    >
                      {c.status.toUpperCase()}
                    </strong>
                  </span>
                  {c.status === "verified" && (
                    <button
                      type="button"
                      disabled={busyKey !== null}
                      onClick={() =>
                        runAction(
                          `revoke-${c.claimId}`,
                          {
                            action: "review_claim",
                            claimId: c.claimId,
                            decision: "rejected",
                            reviewDecisionNote: "Reverted to unclaimed by owner",
                          },
                          "Reverted organizer claim back to Unclaimed Independent Community.",
                        )
                      }
                      className="rounded border border-white/20 px-2 py-0.5 text-[11px] text-zinc-200 hover:bg-white/10"
                    >
                      Revert to Unclaimed
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </details>
        )}
      </section>

      {/* 3. Organizer Profile Controls */}
      {activeOrganizer && (
        <section
          data-testid="dcc-hosted-organizer-editor"
          aria-labelledby="organizer-profile-heading"
          className="rounded-2xl border border-white/15 bg-white/[0.03] p-5 space-y-4"
        >
          <div className="grid gap-3 rounded-xl border border-white/10 bg-black/40 p-3.5 sm:grid-cols-2">
            <label className="block space-y-1 text-xs">
              <span className="font-bold text-zinc-200">
                Search Hosted Organizers ({organizers.length} total)
              </span>
              <input
                type="search"
                data-testid="dcc-org-search-input"
                value={orgFilterQuery}
                onChange={(e) => setOrgFilterQuery(e.target.value)}
                placeholder="Filter by organizer name or domain…"
                className="w-full rounded-lg border border-white/20 bg-zinc-900 px-3 py-2 text-xs text-white"
              />
            </label>
            <label className="block space-y-1 text-xs">
              <span className="font-bold text-zinc-200">
                Select Organizer ({filteredOrganizers.length} shown)
              </span>
              <select
                data-testid="dcc-org-selector"
                value={activeOrganizer.organizerSlug}
                onChange={(e) => setSelectedOrganizerSlug(e.target.value)}
                className="w-full rounded-lg border border-white/20 bg-zinc-900 px-3 py-2 text-xs text-white"
              >
                {filteredOrganizers.map((o) => (
                  <option key={o.organizerSlug} value={o.organizerSlug}>
                    {o.organizerName} ({o.claimedStatus === "verified" ? "Claimed" : "Independent"})
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2
                id="organizer-profile-heading"
                className="text-lg font-black text-white"
              >
                3. Organizer Profile: {activeOrganizer.organizerName}
              </h2>
              <p className="text-xs text-zinc-400">
                Official domains allowed:{" "}
                <code>{activeOrganizer.officialDomain}</code>
                {activeOrganizer.reservationPortalDomain
                  ? `, ${activeOrganizer.reservationPortalDomain}`
                  : ""}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {activeOrganizer.claimedStatus === "verified" && (
                <>
                  <button
                    type="button"
                    data-testid="dcc-toggle-organizer-suspend-btn"
                    disabled={busyKey !== null}
                    onClick={() =>
                      runAction(
                        "toggle-org-suspend",
                        {
                          action: "set_organizer_suspension",
                          organizerSlug: activeOrganizer.organizerSlug,
                          suspended: !activeOrganizer.suspended,
                          reason: activeOrganizer.suspended
                            ? undefined
                            : "Temporarily paused by DCC owner for review.",
                        },
                        activeOrganizer.suspended
                          ? `Restored workspace editing for ${activeOrganizer.organizerName}.`
                          : `Paused workspace editing for ${activeOrganizer.organizerName}.`,
                      )
                    }
                    className={`rounded-xl border px-3.5 py-1.5 text-xs font-bold ${
                      activeOrganizer.suspended
                        ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-100 hover:bg-emerald-500/25"
                        : "border-amber-400/40 bg-amber-500/15 text-amber-100 hover:bg-amber-500/25"
                    }`}
                  >
                    {activeOrganizer.suspended
                      ? "Restore Organizer Access"
                      : "Pause Organizer Access"}
                  </button>
                  <button
                    type="button"
                    data-testid="dcc-rotate-workspace-key-btn"
                    disabled={busyKey !== null}
                    onClick={() =>
                      runAction(
                        "rotate-ws-key",
                        {
                          action: "rotate_workspace_key",
                          organizerSlug: activeOrganizer.organizerSlug,
                        },
                        `Rotated $0 Organizer Workspace key for ${activeOrganizer.organizerName}.`,
                      )
                    }
                    className="rounded-xl border border-purple-400/40 bg-purple-500/15 px-3.5 py-1.5 text-xs font-bold text-purple-100 hover:bg-purple-500/25"
                  >
                    {activeOrganizer.hasWorkspaceKey
                      ? "Rotate $0 Workspace Key"
                      : "Issue $0 Workspace Key"}
                  </button>
                </>
              )}
              <a
                href={`${bridge.cpBaseUrl}/organizer/hosted/${activeOrganizer.organizerSlug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-bold text-zinc-100 hover:bg-white/20"
              >
                $0 Workspace ↗
              </a>
              <a
                href={`${bridge.cpBaseUrl}/hosted-cruises/${activeOrganizer.organizerSlug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-teal-400/40 bg-teal-500/15 px-3.5 py-1.5 text-xs font-bold text-teal-100 hover:bg-teal-500/25"
              >
                Open Organizer Page ↗
              </a>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block space-y-1 text-xs">
              <span className="font-bold text-zinc-200">
                Official Organizer Website URL
              </span>
              <input
                type="url"
                data-testid="dcc-org-website-input"
                value={orgWebsiteUrl}
                onChange={(e) => setOrgWebsiteUrl(e.target.value)}
                className="w-full rounded-lg border border-white/20 bg-zinc-900 px-3 py-2 text-xs text-white"
              />
            </label>

            <label className="block space-y-1 text-xs">
              <span className="font-bold text-zinc-200">
                Organizer Description (shown on profile hero)
              </span>
              <textarea
                rows={2}
                data-testid="dcc-org-summary-input"
                value={orgSummary}
                onChange={(e) => setOrgSummary(e.target.value)}
                className="w-full rounded-lg border border-white/20 bg-zinc-900 px-3 py-2 text-xs text-white"
              />
            </label>
          </div>

          <div>
            <button
              type="button"
              data-testid="dcc-org-save-btn"
              disabled={busyKey !== null}
              onClick={() =>
                runAction(
                  "save-org",
                  {
                    action: "update_details",
                    organizerSlug: activeOrganizer.organizerSlug,
                    officialWebsiteUrl: orgWebsiteUrl,
                    publicSummary: orgSummary,
                  },
                  `Updated ${activeOrganizer.organizerName} profile copy and official link.`,
                )
              }
              className="rounded-xl bg-teal-400 px-4 py-2 text-xs font-black text-zinc-950 hover:bg-teal-300"
            >
              Save Organizer Profile
            </button>
          </div>
        </section>
      )}

      {/* 4. Per-Sailing Controls (Membership Mode, Links, Join Queue, Suspend) */}
      {activeSailing && (
        <section
          data-testid="dcc-hosted-sailing-controls"
          aria-labelledby="sailing-controls-heading"
          className="rounded-2xl border border-cyan-400/35 bg-white/[0.03] p-5 space-y-6"
        >
          <div className="space-y-3">
            <h2
              id="sailing-controls-heading"
              className="text-lg font-black text-white"
            >
              4. Sailing Membership, Official Links &amp; Access Controls
            </h2>

            {/* Sailing Selector Tabs (Scoped to Active Organizer) */}
            <div className="flex flex-wrap gap-2">
              {organizerSailings.map((s) => {
                const key = `${s.organizerSlug}::${s.sailingSlug}`;
                const isSelected =
                  key ===
                  `${activeSailing.organizerSlug}::${activeSailing.sailingSlug}`;
                return (
                  <button
                    key={key}
                    type="button"
                    data-testid={`dcc-select-sailing-${s.sailingSlug}`}
                    onClick={() => setSelectedSailingKey(key)}
                    className={`rounded-xl border px-3.5 py-2 text-left text-xs transition ${
                      isSelected
                        ? "border-cyan-300 bg-cyan-400/20 font-black text-white"
                        : "border-white/15 bg-black/40 font-semibold text-zinc-300 hover:bg-white/10"
                    }`}
                  >
                    <div>{s.shipName}</div>
                    <div className="text-[11px] text-cyan-200">
                      {s.dateRangeLabel} ·{" "}
                      {s.suspended
                        ? "PAUSED"
                        : s.claimedStatus === "verified"
                          ? "Claimed"
                          : "Unclaimed"}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sailing Header & Quick Links */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/40 p-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-black text-white">
                  {activeSailing.sailingTitle}
                </h3>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                    activeSailing.claimedStatus === "verified"
                      ? "bg-purple-500/25 text-purple-200"
                      : "bg-zinc-700/70 text-zinc-200"
                  }`}
                >
                  {activeSailing.membershipDescriptor.publicBadgeLabel}
                </span>
                {activeSailing.suspended && (
                  <span className="rounded-full bg-rose-500/30 px-2.5 py-0.5 text-[11px] font-black text-rose-200">
                    ACCESS PAUSED
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-zinc-300">
                {activeSailing.cruiseLine} · {activeSailing.dateRangeLabel} ·{" "}
                {activeSailing.regionLabel}
              </p>
            </div>

            <div className="flex flex-wrap gap-2 text-xs">
              <a
                href={`${bridge.cpBaseUrl}${activeSailing.hostedSailingPath}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-cyan-400/40 bg-cyan-500/15 px-3 py-1.5 font-bold text-cyan-100 hover:bg-cyan-500/25"
              >
                View Sailing Page ↗
              </a>
              {activeSailing.boardPath && (
                <a
                  href={`${bridge.cpBaseUrl}${activeSailing.boardPath}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 font-bold text-white hover:bg-white/20"
                >
                  Open Group Board ↗
                </a>
              )}
            </div>
          </div>

          {/* Honest Membership & Zero Cabin-Booking Conflation Ledger */}
          <div
            data-testid="dcc-honest-membership-ledger"
            className="rounded-xl border border-emerald-400/30 bg-emerald-500/[0.05] p-4 space-y-2.5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-300">
                Honest Membership Counts (Self-Reported Clicks ≠ Cabin Bookings)
              </span>
              <span className="rounded-full border border-emerald-400/40 bg-black/50 px-2.5 py-0.5 font-mono text-[11px] font-bold text-emerald-200">
                Verified Cabin Bookings:{" "}
                {activeSailing.membershipLedger.verifiedCabinBookingsCount}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-5">
              <div className="rounded-lg border border-white/10 bg-black/40 p-2.5">
                <div className="text-[10px] text-zinc-400">
                  Independent Community
                </div>
                <div className="mt-0.5 font-mono text-base font-black text-white">
                  {
                    activeSailing.membershipLedger
                      .selfReportedIndependentParties
                  }
                </div>
              </div>
              <div className="rounded-lg border border-white/10 bg-black/40 p-2.5">
                <div className="text-[10px] text-zinc-400">
                  Open Private Link
                </div>
                <div className="mt-0.5 font-mono text-base font-black text-white">
                  {activeSailing.membershipLedger.selfReportedOpenLinkParties}
                </div>
              </div>
              <div className="rounded-lg border border-white/10 bg-black/40 p-2.5">
                <div className="text-[10px] text-zinc-400">
                  Organizer Approved
                </div>
                <div className="mt-0.5 font-mono text-base font-black text-white">
                  {activeSailing.membershipLedger.organizerApprovedParties}
                </div>
              </div>
              <div className="rounded-lg border border-white/10 bg-black/40 p-2.5">
                <div className="text-[10px] text-zinc-400">Invitation Code</div>
                <div className="mt-0.5 font-mono text-base font-black text-white">
                  {activeSailing.membershipLedger.invitationCodeParties}
                </div>
              </div>
              <div className="rounded-lg border border-white/10 bg-black/40 p-2.5">
                <div className="text-[10px] text-zinc-400">
                  Verified Members
                </div>
                <div className="mt-0.5 font-mono text-base font-black text-purple-200">
                  {
                    activeSailing.membershipLedger
                      .verifiedOrganizerMemberParties
                  }
                </div>
              </div>
            </div>
            <p className="text-[11px] text-zinc-300">
              {activeSailing.membershipDescriptor.nonBookingTruthNote}
            </p>
          </div>

          {/* Membership Mode Selector */}
          <div className="rounded-xl border border-white/15 bg-black/40 p-4 space-y-3">
            <h4 className="text-sm font-black text-white">
              Choose Group Membership Mode
            </h4>
            {activeSailing.claimedStatus !== "verified" ? (
              <p className="rounded-lg border border-amber-400/35 bg-amber-500/10 px-3.5 py-2.5 text-xs text-amber-100">
                This sailing is currently <strong>Unclaimed</strong>. All
                sign-ups automatically enter an{" "}
                <strong>Independent Cruise Promenade Sailing Community</strong>.
                Approve an organizer claim above to enable the four official
                organizer membership modes.
              </p>
            ) : (
              <div className="space-y-3">
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {POST_CLAIM_MODE_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex cursor-pointer items-start gap-2.5 rounded-xl border p-3 text-xs ${
                        selectedMode === opt.value
                          ? "border-cyan-300 bg-cyan-400/15 text-white"
                          : "border-white/10 bg-white/[0.02] text-zinc-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="sailingMembershipMode"
                        value={opt.value}
                        checked={selectedMode === opt.value}
                        onChange={() => setSelectedMode(opt.value)}
                        className="mt-0.5"
                      />
                      <div>
                        <div className="font-bold text-white">{opt.label}</div>
                        <div className="mt-0.5 text-[11px] text-zinc-300">
                          {opt.helper}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>

                {(selectedMode === "invitation_code" ||
                  selectedMode === "verified_member") && (
                  <label className="block max-w-md space-y-1 text-xs">
                    <span className="font-bold text-cyan-200">
                      {selectedMode === "verified_member"
                        ? `Set Verified Member Code ${activeSailing.hasMemberVerificationCode ? "(already set — enter a new code to rotate)" : "(required)"}`
                        : `Set Organizer Invitation Code ${activeSailing.hasInvitationCode ? "(already set — enter a new code to rotate)" : "(required)"}`}
                    </span>
                    <input
                      type="text"
                      data-testid="dcc-membership-code-input"
                      value={accessCodeDraft}
                      onChange={(e) => setAccessCodeDraft(e.target.value)}
                      placeholder="e.g. ARNO-EDGE-2028"
                      className="w-full rounded-lg border border-white/20 bg-zinc-900 px-3 py-2 text-xs text-white"
                    />
                  </label>
                )}

                <button
                  type="button"
                  data-testid="dcc-save-membership-mode-btn"
                  disabled={busyKey !== null}
                  onClick={() =>
                    runAction(
                      "save-mode",
                      {
                        action: "set_membership_mode",
                        organizerSlug: activeSailing.organizerSlug,
                        sailingSlug: activeSailing.sailingSlug,
                        membershipMode: selectedMode,
                        ...(accessCodeDraft.trim()
                          ? { accessCode: accessCodeDraft.trim() }
                          : {}),
                      },
                      `Updated membership mode for ${activeSailing.shipName}.`,
                    )
                  }
                  className="rounded-xl bg-cyan-300 px-4 py-2 text-xs font-black text-zinc-950 hover:bg-cyan-200"
                >
                  Save Membership Mode
                </button>
              </div>
            )}
          </div>

          {/* Pending Guest Join Requests Queue */}
          {activeSailing.joinRequests.length > 0 && (
            <div
              data-testid="dcc-join-requests-queue"
              className="rounded-xl border border-amber-400/35 bg-amber-500/[0.07] p-4 space-y-3"
            >
              <h4 className="text-sm font-black text-amber-100">
                Guest Join Requests ({activeSailing.joinRequests.length})
              </h4>
              <div className="space-y-2">
                {activeSailing.joinRequests.map((req) => (
                  <div
                    key={req.requestId}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs"
                  >
                    <div>
                      <strong className="text-white">{req.displayName}</strong>{" "}
                      · Party of {req.partySize}
                      {req.groupLabel ? ` · ${req.groupLabel}` : ""} · Status:{" "}
                      <span className="font-bold uppercase text-cyan-200">
                        {req.status}
                      </span>
                    </div>
                    {req.status === "pending" && (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={busyKey !== null}
                          onClick={() =>
                            runAction(
                              `jreq-approve-${req.requestId}`,
                              {
                                action: "review_join_request",
                                organizerSlug: activeSailing.organizerSlug,
                                sailingSlug: activeSailing.sailingSlug,
                                requestId: req.requestId,
                                decision: "approved",
                              },
                              `Approved ${req.displayName} into the group planner and RollCall.`,
                            )
                          }
                          className="rounded-lg bg-emerald-400 px-3 py-1 font-black text-zinc-950"
                        >
                          Approve Guest
                        </button>
                        <button
                          type="button"
                          disabled={busyKey !== null}
                          onClick={() =>
                            runAction(
                              `jreq-reject-${req.requestId}`,
                              {
                                action: "review_join_request",
                                organizerSlug: activeSailing.organizerSlug,
                                sailingSlug: activeSailing.sailingSlug,
                                requestId: req.requestId,
                                decision: "rejected",
                              },
                              `Declined join request from ${req.displayName}.`,
                            )
                          }
                          className="rounded-lg border border-rose-400/40 bg-rose-500/15 px-3 py-1 font-bold text-rose-100"
                        >
                          Decline
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Edit Official Cabin Links & Copy */}
          <div className="rounded-xl border border-white/15 bg-black/40 p-4 space-y-3">
            <h4 className="text-sm font-black text-white">
              Edit Official Cabin Links &amp; Sailing Notes
            </h4>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="block space-y-1 text-xs">
                <span className="font-bold text-zinc-200">
                  Official Organizer Sailing Page URL
                </span>
                <input
                  type="url"
                  data-testid="dcc-sailing-official-url-input"
                  value={sailingPageUrl}
                  onChange={(e) => setSailingPageUrl(e.target.value)}
                  className="w-full rounded-lg border border-white/20 bg-zinc-900 px-3 py-2 text-xs text-white"
                />
              </label>

              <label className="block space-y-1 text-xs">
                <span className="font-bold text-zinc-200">
                  Official Cabin Reservation Form URL
                </span>
                <input
                  type="url"
                  data-testid="dcc-sailing-reservation-url-input"
                  value={reservationFormUrl}
                  onChange={(e) => setReservationFormUrl(e.target.value)}
                  className="w-full rounded-lg border border-white/20 bg-zinc-900 px-3 py-2 text-xs text-white"
                />
              </label>

              <label className="block space-y-1 text-xs">
                <span className="font-bold text-zinc-200">
                  Cabin Booking Guidance Note
                </span>
                <textarea
                  rows={2}
                  data-testid="dcc-sailing-cabin-note-input"
                  value={cabinNote}
                  onChange={(e) => setCabinNote(e.target.value)}
                  className="w-full rounded-lg border border-white/20 bg-zinc-900 px-3 py-2 text-xs text-white"
                />
              </label>

              <label className="block space-y-1 text-xs">
                <span className="font-bold text-zinc-200">
                  Host Welcome Note (displayed on sailing hero &amp; board)
                </span>
                <textarea
                  rows={2}
                  data-testid="dcc-sailing-welcome-note-input"
                  value={welcomeNote}
                  onChange={(e) => setWelcomeNote(e.target.value)}
                  placeholder="Optional welcome message from the organizer"
                  className="w-full rounded-lg border border-white/20 bg-zinc-900 px-3 py-2 text-xs text-white"
                />
              </label>
            </div>

            <button
              type="button"
              data-testid="dcc-save-sailing-details-btn"
              disabled={busyKey !== null}
              onClick={() =>
                runAction(
                  "save-sailing-details",
                  {
                    action: "update_details",
                    organizerSlug: activeSailing.organizerSlug,
                    sailingSlug: activeSailing.sailingSlug,
                    officialSailingPageUrl: sailingPageUrl,
                    officialReservationFormUrl: reservationFormUrl,
                    cabinAvailabilityNote: cabinNote,
                    welcomeNote,
                  },
                  `Saved official links and copy for ${activeSailing.shipName}.`,
                )
              }
              className="rounded-xl bg-white px-4 py-2 text-xs font-black text-zinc-950 hover:bg-zinc-200"
            >
              Save Official Links &amp; Notes
            </button>
          </div>

          {/* Suspend / Restore Access */}
          <div className="rounded-xl border border-rose-400/30 bg-rose-500/[0.06] p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-black text-white">
                  Pause or Restore Sailing Community Access
                </h4>
                <p className="text-xs text-zinc-300">
                  Pausing immediately blocks new Cruise Promenade planner joins
                  and suspends the linked RollCallUSA chat room while keeping
                  official organizer cabin-booking links working.
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-black ${
                  activeSailing.suspended
                    ? "bg-rose-500/30 text-rose-100"
                    : "bg-emerald-500/20 text-emerald-200"
                }`}
              >
                {activeSailing.suspended ? "Currently Paused" : "Access Active"}
              </span>
            </div>

            {!activeSailing.suspended && (
              <label className="block max-w-lg space-y-1 text-xs">
                <span className="font-bold text-zinc-200">
                  Pause Reason (shown politely to visitors if paused)
                </span>
                <input
                  type="text"
                  data-testid="dcc-suspend-reason-input"
                  value={suspendReasonDraft}
                  onChange={(e) => setSuspendReasonDraft(e.target.value)}
                  placeholder="e.g. Temporarily paused at organizer request"
                  className="w-full rounded-lg border border-white/20 bg-zinc-900 px-3 py-2 text-xs text-white"
                />
              </label>
            )}

            <div>
              {activeSailing.suspended ? (
                <button
                  type="button"
                  data-testid="dcc-restore-sailing-btn"
                  disabled={busyKey !== null}
                  onClick={() =>
                    runAction(
                      "restore-sailing",
                      {
                        action: "set_suspension",
                        organizerSlug: activeSailing.organizerSlug,
                        sailingSlug: activeSailing.sailingSlug,
                        suspended: false,
                      },
                      `Restored planner enrollment and RollCallUSA room for ${activeSailing.shipName}.`,
                    )
                  }
                  className="rounded-xl bg-emerald-400 px-4 py-2 text-xs font-black text-zinc-950 hover:bg-emerald-300"
                >
                  Restore Access
                </button>
              ) : (
                <button
                  type="button"
                  data-testid="dcc-suspend-sailing-btn"
                  disabled={busyKey !== null}
                  onClick={() =>
                    runAction(
                      "suspend-sailing",
                      {
                        action: "set_suspension",
                        organizerSlug: activeSailing.organizerSlug,
                        sailingSlug: activeSailing.sailingSlug,
                        suspended: true,
                        reason:
                          suspendReasonDraft.trim() ||
                          "Temporarily paused by site administrator",
                      },
                      `Paused planner enrollment and RollCallUSA room for ${activeSailing.shipName}.`,
                    )
                  }
                  className="rounded-xl border border-rose-400/50 bg-rose-500/20 px-4 py-2 text-xs font-black text-rose-100 hover:bg-rose-500/30"
                >
                  Pause Sailing Community &amp; RollCall
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      {/* 5. Entity-Scoped Reviews, Public Q&A & Private Safety Reports Moderation */}
      <section
        data-testid="dcc-hosted-moderation-panel"
        aria-labelledby="moderation-heading"
        className="rounded-2xl border border-amber-400/35 bg-amber-500/[0.04] p-5 space-y-5"
      >
        <div>
          <h2 id="moderation-heading" className="text-lg font-black text-white">
            5. Traveler Reviews, Public Q&amp;A &amp; Safety Reports Moderation
          </h2>
          <p className="text-xs text-zinc-300">
            Entity-scoped reviews and traveler questions stay out of public search
            indexes until approved here. Claimed organizers can post official
            responses but can never suppress or rewrite independent reviews.
          </p>
        </div>

        {/* Pending Reviews */}
        <div className="space-y-2.5">
          <h3 className="text-sm font-black text-amber-100">
            Pending Reviews ({snapshot?.moderationQueue?.pendingReviews.length ?? 0} pending ·{" "}
            {snapshot?.moderationQueue?.approvedReviewsCount ?? 0} published)
          </h3>
          {(snapshot?.moderationQueue?.pendingReviews.length ?? 0) === 0 ? (
            <p className="rounded-xl border border-white/10 bg-black/35 px-4 py-2.5 text-xs text-zinc-300">
              No pending reviews waiting for moderation.
            </p>
          ) : (
            <div className="space-y-3">
              {snapshot?.moderationQueue?.pendingReviews.map((rev) => (
                <article
                  key={rev.reviewId}
                  data-testid={`dcc-pending-review-${rev.reviewId}`}
                  className="rounded-xl border border-white/15 bg-black/50 p-4 space-y-2 text-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="rounded bg-cyan-500/20 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-cyan-200">
                        {rev.primarySubjectType}
                      </span>{" "}
                      <strong className="text-white">{rev.headline}</strong> ·{" "}
                      <span className="font-bold text-amber-300">
                        {"★".repeat(rev.overallRating)} ({rev.overallRating}/5)
                      </span>
                    </div>
                    <span className="text-zinc-400">
                      {rev.authorDisplayName} ({rev.authorEmailRedacted}) ·{" "}
                      {rev.verificationBadge === "verified_sailing_member"
                        ? "Verified Sailing Member"
                        : "Verified Email"}
                    </span>
                  </div>
                  <p className="text-zinc-200">{rev.writtenExperience}</p>
                  <div className="text-[11px] text-zinc-400">
                    Entity ID: <code>{rev.primarySubjectId}</code>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      disabled={busyKey !== null}
                      onClick={() =>
                        runAction(
                          `approve-rev-${rev.reviewId}`,
                          {
                            action: "moderate_review",
                            reviewId: rev.reviewId,
                            decision: "approved",
                          },
                          `Approved review "${rev.headline}".`,
                        )
                      }
                      className="rounded-lg bg-emerald-400 px-3 py-1.5 font-black text-zinc-950 hover:bg-emerald-300"
                    >
                      Approve &amp; Publish
                    </button>
                    <button
                      type="button"
                      disabled={busyKey !== null}
                      onClick={() =>
                        runAction(
                          `reject-rev-${rev.reviewId}`,
                          {
                            action: "moderate_review",
                            reviewId: rev.reviewId,
                            decision: "rejected",
                          },
                          `Rejected review "${rev.headline}".`,
                        )
                      }
                      className="rounded-lg border border-rose-400/40 bg-rose-500/15 px-3 py-1.5 font-bold text-rose-100 hover:bg-rose-500/25"
                    >
                      Reject
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        {/* Pending Public Q&A */}
        <div className="space-y-2.5">
          <h3 className="text-sm font-black text-cyan-100">
            Pending Traveler Questions ({snapshot?.moderationQueue?.pendingQuestions.length ?? 0})
          </h3>
          {(snapshot?.moderationQueue?.pendingQuestions.length ?? 0) === 0 ? (
            <p className="rounded-xl border border-white/10 bg-black/35 px-4 py-2.5 text-xs text-zinc-300">
              No pending traveler questions waiting for moderation.
            </p>
          ) : (
            <div className="space-y-2.5">
              {snapshot?.moderationQueue?.pendingQuestions.map((q) => (
                <article
                  key={q.questionId}
                  data-testid={`dcc-pending-question-${q.questionId}`}
                  className="rounded-xl border border-white/15 bg-black/50 p-3.5 space-y-2 text-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <strong className="text-white">{q.questionText}</strong>
                    <span className="text-zinc-400">
                      {q.authorDisplayName} ({q.authorEmailRedacted}) · {q.organizerSlug}
                      {q.sailingSlug ? ` / ${q.sailingSlug}` : ""}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={busyKey !== null}
                      onClick={() =>
                        runAction(
                          `approve-q-${q.questionId}`,
                          {
                            action: "moderate_question",
                            questionId: q.questionId,
                            decision: "approved",
                          },
                          "Published traveler question.",
                        )
                      }
                      className="rounded-lg bg-emerald-400 px-3 py-1 font-black text-zinc-950"
                    >
                      Approve Question
                    </button>
                    <button
                      type="button"
                      disabled={busyKey !== null}
                      onClick={() =>
                        runAction(
                          `reject-q-${q.questionId}`,
                          {
                            action: "moderate_question",
                            questionId: q.questionId,
                            decision: "rejected",
                          },
                          "Rejected traveler question.",
                        )
                      }
                      className="rounded-lg border border-rose-400/40 bg-rose-500/15 px-3 py-1 font-bold text-rose-100"
                    >
                      Reject
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        {/* Private Safety Reports (Never Public) */}
        <div className="space-y-2.5">
          <h3 className="text-sm font-black text-rose-200">
            Private Safety Reports ({snapshot?.moderationQueue?.safetyReports.filter((r) => r.status === "open").length ?? 0} Open)
          </h3>
          {(snapshot?.moderationQueue?.safetyReports.length ?? 0) === 0 ? (
            <p className="rounded-xl border border-white/10 bg-black/35 px-4 py-2.5 text-xs text-zinc-300">
              No private safety reports submitted.
            </p>
          ) : (
            <div className="space-y-2">
              {snapshot?.moderationQueue?.safetyReports.map((rep) => (
                <article
                  key={rep.reportId}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-rose-400/30 bg-black/50 p-3.5 text-xs"
                >
                  <div>
                    <span className="mr-2 rounded bg-rose-500/25 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-rose-200">
                      {rep.category}
                    </span>
                    <strong className="text-white">{rep.summary}</strong>
                    <div className="mt-0.5 text-[11px] text-zinc-400">
                      {rep.organizerSlug}
                      {rep.sailingSlug ? ` / ${rep.sailingSlug}` : ""} · Reporter:{" "}
                      {rep.reporterEmailRedacted} · Status: {rep.status.toUpperCase()}
                    </div>
                  </div>
                  {rep.status === "open" && (
                    <button
                      type="button"
                      disabled={busyKey !== null}
                      onClick={() =>
                        runAction(
                          `resolve-safety-${rep.reportId}`,
                          {
                            action: "resolve_safety_report",
                            reportId: rep.reportId,
                          },
                          "Marked private safety report as reviewed.",
                        )
                      }
                      className="rounded-lg border border-white/20 bg-white/10 px-3 py-1 font-bold text-white hover:bg-white/20"
                    >
                      Mark Reviewed
                    </button>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 6. Organizer Analytics & Append-Only Audit Log + One-Click Rollback */}
      <section
        data-testid="dcc-hosted-audit-and-analytics-panel"
        aria-labelledby="audit-analytics-heading"
        className="rounded-2xl border border-cyan-400/30 bg-cyan-500/[0.04] p-5 space-y-5"
      >
        <div>
          <h2 id="audit-analytics-heading" className="text-lg font-black text-white">
            6. $0 Workspace Analytics, Audit Trail &amp; One-Click Rollback
          </h2>
          <p className="text-xs text-zinc-300">
            Every provider workspace edit and DCC admin change writes an immutable audit
            entry. Clicking <strong>Rollback</strong> restores the prior snapshot and
            appends a rollback record without deleting history.
          </p>
        </div>

        {activeOrganizer?.analytics && (
          <div className="grid gap-3 sm:grid-cols-5">
            {[
              { label: "Page Views", value: activeOrganizer.analytics.pageViews },
              {
                label: "Official Booking Clicks",
                value: activeOrganizer.analytics.officialBookingClicks,
              },
              {
                label: "Questions / Official Answers",
                value: `${activeOrganizer.analytics.questionsAsked} / ${activeOrganizer.analytics.officialAnswersPosted}`,
              },
              {
                label: "Community Joins",
                value: activeOrganizer.analytics.communityJoins,
              },
              {
                label: "Reviews / Host Replies",
                value: `${activeOrganizer.analytics.reviewsSubmitted} / ${activeOrganizer.analytics.officialReviewResponses}`,
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-white/10 bg-black/45 p-3"
              >
                <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  {stat.label}
                </div>
                <div className="mt-1 text-base font-black text-white">{stat.value}</div>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-2.5">
          <h3 className="text-sm font-black text-cyan-100">
            Recent Append-Only Audit Entries ({snapshot?.auditLog?.length ?? 0})
          </h3>
          {(snapshot?.auditLog?.length ?? 0) === 0 ? (
            <p className="rounded-xl border border-white/10 bg-black/35 px-4 py-2.5 text-xs text-zinc-300">
              No workspace or admin mutations recorded yet in this environment.
            </p>
          ) : (
            <div className="space-y-2">
              {snapshot?.auditLog?.slice(0, 20).map((entry) => (
                <article
                  key={entry.auditId}
                  data-testid={`dcc-audit-entry-${entry.auditId}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/15 bg-black/50 p-3.5 text-xs"
                >
                  <div className="space-y-1">
                    <div>
                      <span
                        className={`mr-2 rounded px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${
                          entry.actorType === "verified_organizer"
                            ? "bg-purple-500/25 text-purple-200"
                            : "bg-teal-500/25 text-teal-200"
                        }`}
                      >
                        {entry.actorType === "verified_organizer"
                          ? "Organizer Workspace"
                          : "DCC Owner"}
                      </span>
                      <strong className="text-white">{entry.summary}</strong>
                    </div>
                    <div className="text-[11px] text-zinc-400">
                      <code>{entry.auditId}</code> · {entry.organizerSlug}
                      {entry.sailingSlug ? ` / ${entry.sailingSlug}` : " (Profile)"} · Fields:{" "}
                      <code>{entry.changedFields.join(", ") || "state"}</code> ·{" "}
                      {new Date(entry.occurredAt).toLocaleString()}
                    </div>
                  </div>

                  {entry.canRollback && (
                    <button
                      type="button"
                      data-testid={`dcc-rollback-btn-${entry.auditId}`}
                      disabled={busyKey !== null}
                      onClick={() =>
                        runAction(
                          `rollback-${entry.auditId}`,
                          {
                            action: "rollback_audit_entry",
                            auditId: entry.auditId,
                          },
                          `Rolled back ${entry.auditId} to its previous state.`,
                        )
                      }
                      className="rounded-lg border border-amber-400/50 bg-amber-500/20 px-3 py-1.5 font-bold text-amber-100 hover:bg-amber-500/30"
                    >
                      One-Click Rollback
                    </button>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Priority 10 Organizer Activation Cohort */}
      <section
        data-testid="dcc-activation-cohort-section"
        className="space-y-4 rounded-2xl border border-emerald-400/25 bg-emerald-950/20 p-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">
              First-Cohort Outreach Readiness · Zero Automated Sending
            </div>
            <h2 className="mt-1 text-lg font-black text-white">
              Priority 10 Organizer Activation Packages ({activationCohort.length})
            </h2>
            <p className="mt-1 text-xs text-zinc-300">
              Prepared outreach materials, verified official contacts, $0 claim links, and manual tracking states. No emails, calls, or forms are ever sent automatically.
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {activationCohort.map((item) => (
              <button
                key={item.organizerSlug}
                type="button"
                data-testid={`dcc-cohort-tab-${item.organizerSlug}`}
                onClick={() => setSelectedCohortSlug(item.organizerSlug)}
                className={`rounded-lg border px-2.5 py-1.5 text-xs font-bold transition ${
                  activeCohortItem?.organizerSlug === item.organizerSlug
                    ? "border-emerald-300 bg-emerald-500/30 text-white"
                    : "border-white/15 bg-black/40 text-zinc-300 hover:bg-white/10"
                }`}
              >
                #{item.cohortRank} {item.organizerName} ({item.trackingState})
              </button>
            ))}
          </div>
        </div>

        {activeCohortItem && (
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-3 rounded-xl border border-white/15 bg-black/45 p-4 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-black text-white">
                    {activeCohortItem.organizerName}
                  </h3>
                  <div className="text-[11px] text-zinc-400">
                    {activeCohortItem.categoryLabel} · Status:{" "}
                    <code className="text-emerald-300">{activeCohortItem.trackingState}</code>
                  </div>
                </div>
                <a
                  href={activeCohortItem.publicProfileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border border-emerald-400/40 bg-emerald-500/20 px-3 py-1.5 font-bold text-emerald-100 hover:bg-emerald-500/30"
                >
                  Open Public Profile ↗
                </a>
              </div>

              <div className="space-y-1.5 rounded-lg border border-white/10 bg-black/40 p-3">
                <div className="font-bold text-emerald-200">Verified Official Contact</div>
                <div className="text-zinc-200">
                  <strong>Contact:</strong>{" "}
                  {activeCohortItem.officialContact.contactPersonName || "Official Reservations & Group Desk"}{" "}
                  ({activeCohortItem.officialContact.contactPersonRole})
                </div>
                <div className="text-zinc-200">
                  <strong>Email:</strong>{" "}
                  <code>{activeCohortItem.officialContact.officialEmail || "Web contact form only"}</code>{" "}
                  · <strong>Phone:</strong>{" "}
                  <code>{activeCohortItem.officialContact.officialPhone || "Not published"}</code>
                </div>
                <div className="text-zinc-400">
                  Source:{" "}
                  <a
                    href={activeCohortItem.officialContact.contactSourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="underline text-cyan-200"
                  >
                    {activeCohortItem.officialContact.contactSourceUrl}
                  </a>
                </div>
              </div>

              <div className="space-y-1.5 rounded-lg border border-white/10 bg-black/40 p-3">
                <div className="font-bold text-emerald-200">
                  Free Claim URL & Verified Sailings ({activeCohortItem.verifiedSailingUrls.length})
                </div>
                <div className="text-zinc-200">
                  <strong>Free Claim URL:</strong>{" "}
                  <code>{activeCohortItem.freeClaimUrl}</code>
                </div>
                <p className="text-zinc-300">{activeCohortItem.freeClaimInstructions}</p>
                <ul className="list-disc space-y-1 pl-4 text-zinc-300">
                  {activeCohortItem.verifiedSailingUrls.map((s) => (
                    <li key={s.hostedSailingId}>
                      <a
                        href={s.cruisePromenadeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="underline text-cyan-200"
                      >
                        {s.sailDate} · {s.sailingTitle}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-1.5 rounded-lg border border-white/10 bg-black/40 p-3">
                <div className="font-bold text-emerald-200">Value Proposition ($0 Organizer Hub)</div>
                <p className="text-zinc-300">{activeCohortItem.valueExplanation}</p>
                <div className="mt-2 font-bold text-amber-200">Missing Info to Request on Claim</div>
                <ul className="list-disc space-y-1 pl-4 text-zinc-300">
                  {activeCohortItem.missingInfoToRequestOnClaim.map((m, idx) => (
                    <li key={idx}>{m}</li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2 rounded-lg border border-emerald-400/25 bg-emerald-950/30 p-3">
                <div className="font-bold text-emerald-200">Manual Outreach Tracking State</div>
                <div className="flex flex-wrap gap-2">
                  <select
                    aria-label="Outreach tracking state"
                    value={
                      cohortStateDrafts[activeCohortItem.organizerSlug] ??
                      activeCohortItem.trackingState
                    }
                    onChange={(e) =>
                      setCohortStateDrafts((prev) => ({
                        ...prev,
                        [activeCohortItem.organizerSlug]: e.target.value,
                      }))
                    }
                    className="rounded-lg border border-white/20 bg-zinc-900 px-3 py-1.5 text-xs text-white"
                  >
                    {[
                      "not_contacted",
                      "contacted",
                      "replied",
                      "claim_submitted",
                      "verified",
                      "workspace_activated",
                      "page_shared",
                    ].map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Optional owner outreach note..."
                    value={
                      cohortNotesDrafts[activeCohortItem.organizerSlug] ??
                      activeCohortItem.ownerNotes ??
                      ""
                    }
                    onChange={(e) =>
                      setCohortNotesDrafts((prev) => ({
                        ...prev,
                        [activeCohortItem.organizerSlug]: e.target.value,
                      }))
                    }
                    className="min-w-[200px] flex-1 rounded-lg border border-white/20 bg-zinc-900 px-3 py-1.5 text-xs text-white"
                  />
                  <button
                    type="button"
                    disabled={busyKey !== null}
                    onClick={() =>
                      runAction(
                        `cohort-${activeCohortItem.organizerSlug}`,
                        {
                          action: "update_activation_tracking_state",
                          organizerSlug: activeCohortItem.organizerSlug,
                          trackingState:
                            cohortStateDrafts[activeCohortItem.organizerSlug] ??
                            activeCohortItem.trackingState,
                          ownerNotes:
                            cohortNotesDrafts[activeCohortItem.organizerSlug] ??
                            activeCohortItem.ownerNotes ??
                            "",
                        },
                        `Updated ${activeCohortItem.organizerName} tracking state.`,
                      )
                    }
                    className="rounded-lg bg-emerald-500 px-3 py-1.5 font-bold text-black hover:bg-emerald-400"
                  >
                    Save State
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-3 rounded-xl border border-white/15 bg-black/45 p-4 text-xs">
              <div>
                <div className="font-bold text-emerald-200">Concise Telephone Script</div>
                <pre className="mt-1.5 whitespace-pre-wrap rounded-lg border border-white/10 bg-black/60 p-3 font-sans text-xs leading-relaxed text-zinc-200">
                  {activeCohortItem.telephoneScript}
                </pre>
              </div>
              <div>
                <div className="font-bold text-emerald-200">
                  Personalized Email Draft — Subject:{" "}
                  <span className="text-white">{activeCohortItem.emailDraft.subject}</span>
                </div>
                <pre className="mt-1.5 whitespace-pre-wrap rounded-lg border border-white/10 bg-black/60 p-3 font-sans text-xs leading-relaxed text-zinc-200">
                  {activeCohortItem.emailDraft.body}
                </pre>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
