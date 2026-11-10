"use client";

import { useCallback, useState } from "react";
import type {
  OperatorInboxItem,
  OperatorInboxViewFilter,
  OperatorTriageStatus,
  UnifiedOperatorInboxResult,
} from "@/lib/dcc/operatorInbox";

const VIEW_TABS: Array<{
  key: OperatorInboxViewFilter;
  label: string;
}> = [
  { key: "genuine", label: "Genuine Inquiries" },
  { key: "failed_notifications", label: "Failed Notifications" },
  { key: "needs_triage", label: "Needs Triage" },
  { key: "test", label: "Test / QA Probes" },
  { key: "all", label: "All Stored" },
];

const SITE_OPTIONS = [
  { value: "all", label: "All Sites & Channels" },
  { value: "destinationcommandcenter", label: "Destination Command Center" },
  { value: "cruisepromenade", label: "Cruise Promenade" },
  { value: "mightyargo", label: "Mighty Argo Shuttle" },
  { value: "somerset", label: "Shuttle to Somerset" },
  { value: "welcometothedells", label: "Welcome to the Dells" },
  { value: "saveonthestrip", label: "Save On The Strip" },
];

const TRIAGE_STATUS_OPTIONS: Array<{
  value: OperatorTriageStatus;
  label: string;
}> = [
  { value: "new", label: "New" },
  { value: "in_review", label: "In Review" },
  { value: "contacted", label: "Contacted" },
  { value: "resolved", label: "Resolved" },
  { value: "archived", label: "Archived" },
];

function formatUtcTimestamp(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.toISOString().slice(0, 10)} · ${d.toISOString().slice(11, 16)} UTC`;
}

function notificationBadgeClasses(status: OperatorInboxItem["notificationStatus"]): string {
  switch (status) {
    case "delivered":
      return "border-emerald-400/35 bg-emerald-500/15 text-emerald-200";
    case "failed":
      return "border-rose-400/45 bg-rose-500/20 text-rose-100";
    case "not_configured":
      return "border-amber-400/45 bg-amber-500/20 text-amber-100";
    case "unknown":
    default:
      return "border-zinc-500/35 bg-zinc-800/60 text-zinc-300";
  }
}

function notificationBadgeLabel(status: OperatorInboxItem["notificationStatus"]): string {
  switch (status) {
    case "delivered":
      return "Alert Delivered";
    case "failed":
      return "Alert Failed";
    case "not_configured":
      return "Alert Unconfigured";
    case "unknown":
    default:
      return "Receipt Unrecorded";
  }
}

function triageBadgeClasses(status: OperatorTriageStatus): string {
  switch (status) {
    case "new":
      return "border-amber-400/40 bg-amber-500/15 text-amber-200";
    case "in_review":
      return "border-cyan-400/40 bg-cyan-500/15 text-cyan-200";
    case "contacted":
      return "border-sky-400/40 bg-sky-500/15 text-sky-200";
    case "resolved":
      return "border-emerald-400/40 bg-emerald-500/15 text-emerald-200";
    case "archived":
      return "border-zinc-500/40 bg-zinc-800/60 text-zinc-300";
  }
}

type DraftRowState = {
  triageStatus: OperatorTriageStatus;
  operatorNote: string;
  saving: boolean;
  savedMessage: string | null;
  errorMessage: string | null;
};

export default function OperatorInboxClient({
  initialData,
  initialCpPreviewUrl,
}: {
  initialData: UnifiedOperatorInboxResult;
  initialCpPreviewUrl?: string | null;
}) {
  const [data, setData] = useState<UnifiedOperatorInboxResult>(initialData);
  const [activeView, setActiveView] = useState<OperatorInboxViewFilter>(
    initialData.appliedFilters.view,
  );
  const [siteFilter, setSiteFilter] = useState<string>(
    initialData.appliedFilters.site || "all",
  );
  const [statusFilter, setStatusFilter] = useState<string>(
    initialData.appliedFilters.status || "all",
  );
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, DraftRowState>>({});

  const fetchInbox = useCallback(
    async (
      nextView: OperatorInboxViewFilter,
      nextSite: string,
      nextStatus: string,
    ) => {
      setLoading(true);
      setFetchError(null);
      try {
        const params = new URLSearchParams();
        params.set("view", nextView);
        if (nextSite && nextSite !== "all") {
          params.set("site", nextSite);
        }
        if (nextStatus && nextStatus !== "all") {
          params.set("status", nextStatus);
        }
        if (initialCpPreviewUrl) {
          params.set("cpPreviewUrl", initialCpPreviewUrl);
        }
        const res = await fetch(
          `/api/admin/operator-inbox?${params.toString()}`,
          {
            method: "GET",
            credentials: "same-origin",
            cache: "no-store",
          },
        );
        const json = (await res.json()) as UnifiedOperatorInboxResult & {
          error?: string;
        };
        if (!res.ok || !json.ok) {
          throw new Error(json.error || `HTTP ${res.status}`);
        }
        setData(json);
      } catch (err) {
        setFetchError(
          err instanceof Error
            ? err.message
            : "Failed to refresh operator inbox.",
        );
      } finally {
        setLoading(false);
      }
    },
    [initialCpPreviewUrl],
  );

  const handleViewChange = (nextView: OperatorInboxViewFilter) => {
    setActiveView(nextView);
    void fetchInbox(nextView, siteFilter, statusFilter);
  };

  const handleSiteChange = (nextSite: string) => {
    setSiteFilter(nextSite);
    void fetchInbox(activeView, nextSite, statusFilter);
  };

  const handleStatusChange = (nextStatus: string) => {
    setStatusFilter(nextStatus);
    void fetchInbox(activeView, siteFilter, nextStatus);
  };

  const getDraft = (item: OperatorInboxItem): DraftRowState => {
    const existing = drafts[item.itemKey];
    if (existing) return existing;
    return {
      triageStatus: item.triageStatus,
      operatorNote: item.operatorNote || "",
      saving: false,
      savedMessage: null,
      errorMessage: null,
    };
  };

  const updateDraftField = (
    item: OperatorInboxItem,
    patch: Partial<DraftRowState>,
  ) => {
    setDrafts((prev) => {
      const current = prev[item.itemKey] || {
        triageStatus: item.triageStatus,
        operatorNote: item.operatorNote || "",
        saving: false,
        savedMessage: null,
        errorMessage: null,
      };
      return {
        ...prev,
        [item.itemKey]: {
          ...current,
          ...patch,
        },
      };
    });
  };

  const handleSaveTriage = async (item: OperatorInboxItem) => {
    const draft = getDraft(item);
    updateDraftField(item, {
      saving: true,
      savedMessage: null,
      errorMessage: null,
    });

    try {
      const res = await fetch("/api/admin/operator-inbox", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          itemKey: item.itemKey,
          triageStatus: draft.triageStatus,
          operatorNote: draft.operatorNote,
          isTest: item.classification === "test",
        }),
      });
      const payload = (await res.json()) as {
        ok?: boolean;
        error?: string;
        triage?: {
          triageStatus: OperatorTriageStatus;
          operatorNote: string | null;
          updatedAt: string;
          updatedBy: string;
        };
      };

      if (!res.ok || !payload.ok || !payload.triage) {
        throw new Error(payload.error || `Save failed (HTTP ${res.status})`);
      }

      updateDraftField(item, {
        saving: false,
        triageStatus: payload.triage.triageStatus,
        operatorNote: payload.triage.operatorNote || "",
        savedMessage: "Saved",
        errorMessage: null,
      });

      // Refresh inbox to update KPI badges & persisted row state cleanly
      await fetchInbox(activeView, siteFilter, statusFilter);
    } catch (err) {
      updateDraftField(item, {
        saving: false,
        savedMessage: null,
        errorMessage:
          err instanceof Error ? err.message : "Failed to save triage status.",
      });
    }
  };

  const handleCopy = async (tokenKey: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedToken(tokenKey);
      setTimeout(() => {
        setCopiedToken((prev) => (prev === tokenKey ? null : prev));
      }, 1800);
    } catch {
      // ignore clipboard permission blocks in headless contexts
    }
  };

  const { kpis, channelHealth, items } = data;
  const cpStatus = channelHealth.cpConnectorStatus;

  return (
    <div className="space-y-6">
      {/* KPI Summary Cards */}
      <section
        aria-label="Operator Inbox KPI Summary"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5"
      >
        <div
          data-testid="kpi-genuine-inquiries"
          className="rounded-2xl border border-emerald-400/25 bg-zinc-900/80 p-4"
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
            Genuine Actionable Inquiries
          </p>
          <p className="mt-2 text-3xl font-black text-white">
            {kpis.genuineActionableCount}
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            {kpis.genuineTotalCount} total genuine leads stored
          </p>
        </div>

        <div
          data-testid="kpi-needs-triage"
          className="rounded-2xl border border-amber-400/25 bg-zinc-900/80 p-4"
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-300">
            Needs Triage
          </p>
          <p className="mt-2 text-3xl font-black text-white">
            {kpis.needsTriageCount}
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            Genuine inquiries in &ldquo;new&rdquo; state
          </p>
        </div>

        <div
          data-testid="kpi-failed-notifications"
          className="rounded-2xl border border-rose-400/30 bg-zinc-900/80 p-4"
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-rose-300">
            Failed / Undelivered Notifications
          </p>
          <p className="mt-2 text-3xl font-black text-white">
            {kpis.failedNotificationsCount}
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            {kpis.genuineFailedNotificationsCount} genuine inquiries affected
          </p>
        </div>

        <div
          data-testid="kpi-test-probes"
          className="rounded-2xl border border-white/10 bg-zinc-900/80 p-4"
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
            Filtered Test / QA Probes (Preserved)
          </p>
          <p className="mt-2 text-3xl font-black text-white">
            {kpis.testProbesPreservedCount}
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            100% preserved ({kpis.totalStoredCount} total records)
          </p>
        </div>

        <div
          data-testid="kpi-connected-sources"
          className="rounded-2xl border border-cyan-400/25 bg-zinc-900/80 p-4 sm:col-span-2 xl:col-span-1"
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-cyan-300">
            Connected Sources Status
          </p>
          <p className="mt-2 text-3xl font-black text-white">
            {kpis.connectedSourcesCount} / {kpis.expectedSourcesCount}
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            DCC Postgres {channelHealth.postgresConnected ? "Live" : "Local"} •
            CP {cpStatus.connected ? "Connected" : "Needs Key"}
          </p>
        </div>
      </section>

      {/* Channel Health Banner */}
      <section
        aria-label="Channel Health Strip"
        data-testid="channel-health-strip"
        className="rounded-2xl border border-white/10 bg-zinc-900/70 p-4 text-xs text-zinc-200"
      >
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="font-bold uppercase tracking-wider text-zinc-400">
            Channel Health:
          </span>

          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-1 font-semibold ${
              channelHealth.postgresConnected
                ? "border-emerald-400/35 bg-emerald-500/15 text-emerald-200"
                : "border-amber-400/35 bg-amber-500/15 text-amber-200"
            }`}
          >
            Neon Postgres:{" "}
            {channelHealth.postgresConnected ? "Connected" : "Fallback Mode"}
          </span>

          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-1 font-semibold ${
              channelHealth.resendConfigured
                ? "border-emerald-400/35 bg-emerald-500/15 text-emerald-200"
                : "border-rose-400/40 bg-rose-500/15 text-rose-200"
            }`}
          >
            Resend Outbound:{" "}
            {channelHealth.resendConfigured ? "Configured" : "Not Configured"}
          </span>

          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-1 font-semibold ${
              cpStatus.connected
                ? "border-emerald-400/35 bg-emerald-500/15 text-emerald-200"
                : "border-amber-400/40 bg-amber-500/15 text-amber-200"
            }`}
          >
            Cruise Promenade:{" "}
            {cpStatus.connected
              ? `Connected (${cpStatus.mode}, ${cpStatus.fetchedCount ?? 0} inquiries)`
              : `Disconnected (${cpStatus.reason || "unconfigured"})`}
          </span>

          {channelHealth.argoLegacyFileEntriesCount > 0 ? (
            <span className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-zinc-300">
              Legacy Argo JSONL: {channelHealth.argoLegacyFileEntriesCount} merged
            </span>
          ) : null}
        </div>

        <div className="mt-3 flex flex-col gap-1.5 border-t border-white/10 pt-2.5 text-xs text-amber-200/90">
          <p>
            <strong>MX Routing Advisory:</strong> {channelHealth.dccMxWarning}
          </p>
          {!cpStatus.connected && cpStatus.setupHint ? (
            <p className="break-words text-zinc-300">
              <strong>Cruise Promenade Connector Setup:</strong>{" "}
              {cpStatus.setupHint}
            </p>
          ) : null}
          {cpStatus.earlyAccessFeedbackSummary ? (
            <p className="text-zinc-300">
              <strong>Cruise Promenade Early-Access Feedback:</strong>{" "}
              {cpStatus.earlyAccessFeedbackSummary.genuineCount} genuine /{" "}
              {cpStatus.earlyAccessFeedbackSummary.testCount} test (
              {cpStatus.earlyAccessFeedbackSummary.totalCount} total)
            </p>
          ) : null}
        </div>
      </section>

      {/* Filter Tabs + Site / Status Selectors */}
      <section className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-zinc-900/60 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div
          role="tablist"
          aria-label="Inbox View Filters"
          className="flex flex-wrap gap-2"
        >
          {VIEW_TABS.map((tab) => {
            const isSelected = activeView === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={isSelected}
                data-testid={`inbox-tab-${tab.key}`}
                onClick={() => handleViewChange(tab.key)}
                className={`min-h-10 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                  isSelected
                    ? "bg-[#f5c66c] text-zinc-950 shadow-sm"
                    : "border border-white/15 bg-black/40 text-zinc-200 hover:bg-white/10"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            aria-label="Filter by source site"
            data-testid="inbox-site-filter"
            value={siteFilter}
            onChange={(e) => handleSiteChange(e.target.value)}
            className="min-h-10 rounded-xl border border-white/15 bg-black/50 px-3 py-2 text-xs text-white"
          >
            {SITE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by triage status"
            data-testid="inbox-status-filter"
            value={statusFilter}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="min-h-10 rounded-xl border border-white/15 bg-black/50 px-3 py-2 text-xs text-white"
          >
            <option value="all">All Triage Statuses</option>
            {TRIAGE_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => void fetchInbox(activeView, siteFilter, statusFilter)}
            disabled={loading}
            className="min-h-10 rounded-xl border border-white/20 bg-white/5 px-3.5 py-2 text-xs font-semibold text-white hover:bg-white/10 disabled:opacity-50"
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </section>

      {fetchError ? (
        <div
          role="alert"
          className="rounded-xl border border-rose-400/40 bg-rose-950/50 px-4 py-3 text-sm text-rose-200"
        >
          {fetchError}
        </div>
      ) : null}

      {/* Inquiry Rows / Cards */}
      <section aria-label="Operator Inquiries List" className="space-y-4">
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <span>
            Showing <strong className="text-white">{items.length}</strong>{" "}
            {items.length === 1 ? "inquiry" : "inquiries"} in current view
          </span>
          <span>Zero records deleted • Non-destructive triage overlays</span>
        </div>

        {items.length === 0 ? (
          <div
            data-testid="inbox-empty-state"
            className="rounded-2xl border border-white/10 bg-zinc-900/50 p-8 text-center text-sm text-zinc-300"
          >
            No inquiries match the selected view and filters. Switch to{" "}
            <strong>Test / QA Probes</strong> or <strong>All Stored</strong> to
            inspect preserved QA submissions.
          </div>
        ) : (
          items.map((item) => {
            const draft = getDraft(item);
            return (
              <article
                key={item.itemKey}
                data-testid="operator-inbox-item"
                data-item-key={item.itemKey}
                className="rounded-2xl border border-white/10 bg-zinc-900/75 p-4 sm:p-5"
              >
                {/* Top Meta Row */}
                <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-lg border border-white/15 bg-white/10 px-2.5 py-0.5 text-xs font-bold text-white">
                        {item.sourceSiteLabel}
                      </span>
                      <span className="rounded-lg border border-cyan-400/25 bg-cyan-500/10 px-2.5 py-0.5 text-xs font-medium text-cyan-200">
                        {item.channelLabel}
                      </span>
                      <span
                        className={`rounded-lg border px-2.5 py-0.5 text-xs font-semibold ${
                          item.classification === "genuine"
                            ? "border-emerald-400/35 bg-emerald-500/15 text-emerald-200"
                            : "border-zinc-500/40 bg-zinc-800/80 text-zinc-300"
                        }`}
                      >
                        {item.classification === "genuine"
                          ? "Genuine Lead"
                          : `Test / QA (${item.classificationReason})`}
                      </span>
                      <span
                        className={`rounded-lg border px-2.5 py-0.5 text-xs font-semibold uppercase ${triageBadgeClasses(
                          item.triageStatus,
                        )}`}
                      >
                        {item.triageStatus.replace("_", " ")}
                      </span>
                    </div>

                    <h2 className="break-words text-base font-bold text-white sm:text-lg">
                      {item.tripDetails.headline}
                    </h2>
                  </div>

                  <div className="shrink-0 text-xs text-zinc-400 sm:text-right">
                    <div>{formatUtcTimestamp(item.submittedAt)}</div>
                    <div className="mt-0.5 font-mono text-[11px] text-zinc-500">
                      {item.sourceId} • {item.environment}
                    </div>
                  </div>
                </div>

                {/* Middle Grid: Contact + Trip Details + Notification Delivery */}
                <div className="mt-4 grid grid-cols-1 gap-4 border-t border-white/10 pt-4 lg:grid-cols-3">
                  {/* Contact */}
                  <div className="min-w-0 space-y-1.5 text-sm">
                    <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                      Contact
                    </p>
                    <p className="break-words font-semibold text-white">
                      {item.contact.name || "Name not provided"}
                      {item.contact.company ? (
                        <span className="font-normal text-zinc-400">
                          {" "}
                          ({item.contact.company})
                        </span>
                      ) : null}
                    </p>
                    {item.contact.email ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <a
                          href={`mailto:${item.contact.email}`}
                          className="break-all text-xs font-medium text-[#f5c66c] underline hover:text-white"
                        >
                          {item.contact.email}
                        </a>
                        <button
                          type="button"
                          onClick={() =>
                            void handleCopy(
                              `email:${item.itemKey}`,
                              item.contact.email!,
                            )
                          }
                          className="rounded border border-white/15 bg-black/40 px-2 py-0.5 text-[11px] text-zinc-300 hover:bg-white/10"
                        >
                          {copiedToken === `email:${item.itemKey}`
                            ? "Copied"
                            : "Copy email"}
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs text-zinc-500">No email provided</p>
                    )}

                    {item.contact.phone ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <a
                          href={`tel:${item.contact.phone}`}
                          className="text-xs text-zinc-200 underline hover:text-white"
                        >
                          {item.contact.phone}
                        </a>
                        <button
                          type="button"
                          onClick={() =>
                            void handleCopy(
                              `phone:${item.itemKey}`,
                              item.contact.phone!,
                            )
                          }
                          className="rounded border border-white/15 bg-black/40 px-2 py-0.5 text-[11px] text-zinc-300 hover:bg-white/10"
                        >
                          {copiedToken === `phone:${item.itemKey}`
                            ? "Copied"
                            : "Copy phone"}
                        </button>
                      </div>
                    ) : null}
                  </div>

                  {/* Trip / Party Details */}
                  <div className="min-w-0 space-y-1 text-xs text-zinc-300">
                    <p className="font-semibold uppercase tracking-wider text-zinc-400">
                      Trip / Submission Details
                    </p>
                    {item.tripDetails.datesOrMonth ? (
                      <p>
                        <strong className="text-zinc-200">Dates / Window:</strong>{" "}
                        {item.tripDetails.datesOrMonth}
                      </p>
                    ) : null}
                    {item.tripDetails.partySize !== null &&
                    item.tripDetails.partySize !== "" ? (
                      <p>
                        <strong className="text-zinc-200">Party / Group:</strong>{" "}
                        {item.tripDetails.partySize}
                      </p>
                    ) : null}
                    {item.tripDetails.routeOrLocation ? (
                      <p className="break-words">
                        <strong className="text-zinc-200">
                          Location / Context:
                        </strong>{" "}
                        {item.tripDetails.routeOrLocation}
                      </p>
                    ) : null}
                    {item.tripDetails.messageOrNotes ? (
                      <p className="mt-1.5 whitespace-pre-wrap break-words rounded-lg bg-black/35 p-2.5 text-zinc-200">
                        {item.tripDetails.messageOrNotes}
                      </p>
                    ) : null}
                  </div>

                  {/* Notification Delivery Audit */}
                  <div className="min-w-0 space-y-1.5 text-xs">
                    <p className="font-semibold uppercase tracking-wider text-zinc-400">
                      Outbound Alert Delivery
                    </p>
                    <div>
                      <span
                        data-testid="notification-status-badge"
                        className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-bold ${notificationBadgeClasses(
                          item.notificationStatus,
                        )}`}
                      >
                        {notificationBadgeLabel(item.notificationStatus)}
                      </span>
                    </div>
                    <p className="break-all text-zinc-300">
                      <strong className="text-zinc-200">Target Inbox:</strong>{" "}
                      {item.intendedDestination}
                    </p>
                    {item.failureReason ? (
                      <p className="break-words rounded-lg border border-amber-400/25 bg-amber-950/30 p-2 text-amber-200">
                        {item.failureReason}
                      </p>
                    ) : null}
                  </div>
                </div>

                {/* Operator Triage Controls */}
                <div className="mt-4 flex flex-col gap-2.5 border-t border-white/10 pt-3.5 sm:flex-row sm:items-center">
                  <label className="sr-only" htmlFor={`status-${item.itemKey}`}>
                    Triage status for {item.sourceId}
                  </label>
                  <select
                    id={`status-${item.itemKey}`}
                    data-testid="triage-status-select"
                    value={draft.triageStatus}
                    onChange={(e) =>
                      updateDraftField(item, {
                        triageStatus: e.target.value as OperatorTriageStatus,
                        savedMessage: null,
                      })
                    }
                    className="min-h-10 rounded-xl border border-white/20 bg-black/50 px-3 py-2 text-xs font-semibold text-white sm:w-44"
                  >
                    {TRIAGE_STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>

                  <label className="sr-only" htmlFor={`note-${item.itemKey}`}>
                    Operator note for {item.sourceId}
                  </label>
                  <input
                    id={`note-${item.itemKey}`}
                    type="text"
                    maxLength={500}
                    data-testid="triage-note-input"
                    value={draft.operatorNote}
                    onChange={(e) =>
                      updateDraftField(item, {
                        operatorNote: e.target.value,
                        savedMessage: null,
                      })
                    }
                    placeholder="Add operator triage note (max 500 chars)…"
                    className="min-h-10 min-w-0 flex-1 rounded-xl border border-white/20 bg-black/50 px-3 py-2 text-xs text-white placeholder:text-zinc-500"
                  />

                  <button
                    type="button"
                    data-testid="triage-save-button"
                    disabled={draft.saving}
                    onClick={() => void handleSaveTriage(item)}
                    className="min-h-10 shrink-0 rounded-xl bg-white px-4 py-2 text-xs font-bold text-zinc-950 hover:bg-zinc-200 disabled:opacity-50"
                  >
                    {draft.saving ? "Saving…" : "Save Triage"}
                  </button>

                  {draft.savedMessage ? (
                    <span
                      data-testid="triage-saved-indicator"
                      className="text-xs font-semibold text-emerald-300"
                    >
                      {draft.savedMessage}
                    </span>
                  ) : null}

                  {draft.errorMessage ? (
                    <span className="text-xs font-semibold text-rose-300">
                      {draft.errorMessage}
                    </span>
                  ) : null}

                  {item.triageUpdatedAt ? (
                    <span className="text-[11px] text-zinc-500 sm:ml-auto">
                      Triaged {formatUtcTimestamp(item.triageUpdatedAt)}
                    </span>
                  ) : null}
                </div>
              </article>
            );
          })
        )}
      </section>
    </div>
  );
}
