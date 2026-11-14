"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type {
  OrganizerOutreachDashboardSnapshot,
  OrganizerOutreachLead,
  OrganizerOutreachStatus,
  OrganizerQualificationStatus,
} from "@/lib/dcc/organizerOutreachStore";

type FilterTab =
  | "all"
  | "phone"
  | "qualified"
  | "held"
  | "contacted"
  | "followup"
  | "boards";

const OUTREACH_STATUS_OPTIONS: Array<{
  value: OrganizerOutreachStatus;
  label: string;
}> = [
  { value: "ready_to_call", label: "Ready to Call (0 Sent)" },
  { value: "needs_qualification_call", label: "Call to Qualify First (0 Sent)" },
  { value: "draft_ready", label: "Draft Ready (0 Sent)" },
  {
    value: "held_pending_schedule_check",
    label: "Held — Confirm Schedule First (0 Sent)",
  },
  { value: "called_spoke", label: "Called — Spoke Live" },
  { value: "called_left_vm", label: "Called — Left Voicemail" },
  { value: "texted", label: "Text Sent" },
  { value: "emailed", label: "Email / Portal Sent" },
  { value: "replied", label: "Replied" },
  { value: "interested", label: "Interested — Follow-Up Active" },
  { value: "board_live", label: "Board Created & Shared" },
  { value: "on_hold", label: "Paused / On Hold" },
  { value: "not_a_fit", label: "Passed / Not a Fit" },
];

const QUALIFICATION_OPTIONS: Array<{
  value: OrganizerQualificationStatus;
  label: string;
}> = [
  { value: "qualified_page_live", label: "Qualified — Sailing Page Live" },
  {
    value: "held_schedule_conflict",
    label: "Held (noindex) — Confirm Schedule First",
  },
  {
    value: "needs_sailing_qualification",
    label: "Needs Ship & Sailing Qualification",
  },
];

function qualificationBadgeClass(status: OrganizerQualificationStatus): string {
  switch (status) {
    case "qualified_page_live":
      return "border-emerald-400/45 bg-emerald-500/15 text-emerald-200";
    case "held_schedule_conflict":
      return "border-amber-400/45 bg-amber-500/15 text-amber-200";
    case "needs_sailing_qualification":
      return "border-orange-400/45 bg-orange-500/15 text-orange-200";
  }
}

function outreachBadgeClass(lead: OrganizerOutreachLead): string {
  if (lead.outreachStatus === "board_live") {
    return "border-emerald-400/50 bg-emerald-500/20 text-emerald-100";
  }
  if (
    lead.outreachStatus === "replied" ||
    lead.outreachStatus === "interested"
  ) {
    return "border-cyan-400/50 bg-cyan-500/20 text-cyan-100";
  }
  if (lead.hasSentOutreach) {
    return "border-sky-400/40 bg-sky-500/15 text-sky-200";
  }
  if (lead.outreachStatus === "not_a_fit" || lead.outreachStatus === "on_hold") {
    return "border-zinc-500/40 bg-zinc-800/60 text-zinc-400";
  }
  return "border-amber-400/40 bg-amber-500/15 text-amber-200";
}

function addDaysYmd(days: number): string {
  const d = new Date(Date.now() + days * 86_400_000);
  return d.toISOString().slice(0, 10);
}

interface LeadDraftEdits {
  outreachStatus: OrganizerOutreachStatus;
  qualificationStatus: OrganizerQualificationStatus;
  hostedCruiseAndSailing: string;
  sailingPageUrl: string;
  phone: string;
  email: string;
  followUpDate: string;
  notes: string;
  boardCreated: boolean;
  boardShareCode: string;
  travelersJoined: string;
}

function buildDraftFromLead(lead: OrganizerOutreachLead): LeadDraftEdits {
  return {
    outreachStatus: lead.outreachStatus,
    qualificationStatus: lead.qualificationStatus,
    hostedCruiseAndSailing: lead.hostedCruiseAndSailing,
    sailingPageUrl: lead.sailingPageUrl || "",
    phone: lead.phone || "",
    email: lead.email || "",
    followUpDate: lead.followUpDate || "",
    notes: lead.notes || "",
    boardCreated: lead.boardCreated,
    boardShareCode: lead.boardShareCode || "",
    travelersJoined: String(lead.travelersJoined ?? 0),
  };
}

export default function OrganizerOutreachClient({
  initialSnapshot,
}: {
  initialSnapshot: OrganizerOutreachDashboardSnapshot;
}) {
  const [snapshot, setSnapshot] =
    useState<OrganizerOutreachDashboardSnapshot>(initialSnapshot);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [expandedPitchIds, setExpandedPitchIds] = useState<
    Record<string, boolean>
  >({
    bond_and_beyond: true,
  });
  const [editsByLeadId, setEditsByLeadId] = useState<
    Record<string, LeadDraftEdits>
  >({});
  const [savingLeadId, setSavingLeadId] = useState<string | null>(null);
  const [feedbackByLeadId, setFeedbackByLeadId] = useState<
    Record<string, { ok: boolean; msg: string }>
  >({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [creatingLead, setCreatingLead] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [newLead, setNewLead] = useState({
    leadName: "",
    contactName: "",
    phone: "",
    phoneInvitesText: false,
    email: "",
    officialUrl: "",
    hostedCruiseAndSailing: "",
    qualificationStatus:
      "needs_sailing_qualification" as OrganizerQualificationStatus,
    sailingPageUrl: "",
    utmSource: "",
    valueToPitchSummary: "",
    followUpDate: "",
    notes: "",
  });

  const todayYmd = useMemo(() => new Date().toISOString().slice(0, 10), []);

  function getLeadEdit(lead: OrganizerOutreachLead): LeadDraftEdits {
    return editsByLeadId[lead.leadId] || buildDraftFromLead(lead);
  }

  function patchLeadEdit(
    lead: OrganizerOutreachLead,
    patch: Partial<LeadDraftEdits>,
  ) {
    const current = getLeadEdit(lead);
    setEditsByLeadId((prev) => ({
      ...prev,
      [lead.leadId]: { ...current, ...patch },
    }));
  }

  async function copyText(key: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => {
        setCopiedKey((curr) => (curr === key ? null : curr));
      }, 2000);
    } catch {
      // ignore clipboard block
    }
  }

  async function submitLeadUpdate(
    lead: OrganizerOutreachLead,
    overridePayload?: Record<string, unknown>,
  ) {
    setSavingLeadId(lead.leadId);
    setFeedbackByLeadId((prev) => {
      const next = { ...prev };
      delete next[lead.leadId];
      return next;
    });

    const draft = getLeadEdit(lead);
    const payload = overridePayload || {
      action: "update",
      leadId: lead.leadId,
      outreachStatus: draft.outreachStatus,
      qualificationStatus: draft.qualificationStatus,
      hostedCruiseAndSailing: draft.hostedCruiseAndSailing,
      sailingPageUrl:
        draft.qualificationStatus === "qualified_page_live" &&
        draft.sailingPageUrl.trim()
          ? draft.sailingPageUrl.trim()
          : null,
      phone: draft.phone.trim() || null,
      email: draft.email.trim() || null,
      followUpDate: draft.followUpDate.trim() || null,
      notes: draft.notes,
      boardCreated: draft.boardCreated,
      boardShareCode: draft.boardShareCode.trim() || null,
      travelersJoined: Math.max(0, Number(draft.travelersJoined) || 0),
    };

    try {
      const res = await fetch("/api/admin/outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        backend?: string;
        error?: string;
        lead?: OrganizerOutreachLead;
        dashboard?: OrganizerOutreachDashboardSnapshot;
      };
      if (!res.ok || !json.ok || !json.dashboard) {
        setFeedbackByLeadId((prev) => ({
          ...prev,
          [lead.leadId]: {
            ok: false,
            msg: json.error || `Save failed (HTTP ${res.status})`,
          },
        }));
        return;
      }

      setSnapshot(json.dashboard);
      const refreshed = json.dashboard.leads.find(
        (l) => l.leadId === lead.leadId,
      );
      if (refreshed) {
        setEditsByLeadId((prev) => ({
          ...prev,
          [lead.leadId]: buildDraftFromLead(refreshed),
        }));
      }
      setFeedbackByLeadId((prev) => ({
        ...prev,
        [lead.leadId]: {
          ok: true,
          msg: `Saved durably (${json.backend || "postgres"})`,
        },
      }));
    } catch (err) {
      setFeedbackByLeadId((prev) => ({
        ...prev,
        [lead.leadId]: {
          ok: false,
          msg: err instanceof Error ? err.message : "Network error while saving.",
        },
      }));
    } finally {
      setSavingLeadId(null);
    }
  }

  async function handleQuickTouch(
    lead: OrganizerOutreachLead,
    channel: "call" | "text" | "email",
    statusOverride?: OrganizerOutreachStatus,
  ) {
    await submitLeadUpdate(lead, {
      action: "update",
      leadId: lead.leadId,
      logTouchChannel: channel,
      ...(statusOverride ? { outreachStatus: statusOverride } : {}),
    });
  }

  async function handleCreateLead(e: React.FormEvent) {
    e.preventDefault();
    setCreatingLead(true);
    setCreateError(null);
    try {
      const res = await fetch("/api/admin/outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          ...newLead,
          phone: newLead.phone.trim() || null,
          email: newLead.email.trim() || null,
          officialUrl: newLead.officialUrl.trim() || null,
          sailingPageUrl:
            newLead.qualificationStatus === "qualified_page_live" &&
            newLead.sailingPageUrl.trim()
              ? newLead.sailingPageUrl.trim()
              : null,
          followUpDate: newLead.followUpDate.trim() || null,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        dashboard?: OrganizerOutreachDashboardSnapshot;
      };
      if (!res.ok || !json.ok || !json.dashboard) {
        setCreateError(json.error || `Failed to create lead (HTTP ${res.status})`);
        return;
      }
      setSnapshot(json.dashboard);
      setShowAddForm(false);
      setNewLead({
        leadName: "",
        contactName: "",
        phone: "",
        phoneInvitesText: false,
        email: "",
        officialUrl: "",
        hostedCruiseAndSailing: "",
        qualificationStatus: "needs_sailing_qualification",
        sailingPageUrl: "",
        utmSource: "",
        valueToPitchSummary: "",
        followUpDate: "",
        notes: "",
      });
    } catch (err) {
      setCreateError(
        err instanceof Error ? err.message : "Network error creating lead.",
      );
    } finally {
      setCreatingLead(false);
    }
  }

  const phoneLeads = useMemo(
    () => snapshot.leads.filter((l) => Boolean(l.phone)),
    [snapshot.leads],
  );

  const filteredLeads = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return snapshot.leads.filter((lead) => {
      if (activeTab === "phone" && !lead.phone) return false;
      if (
        activeTab === "qualified" &&
        lead.qualificationStatus !== "qualified_page_live"
      ) {
        return false;
      }
      if (
        activeTab === "held" &&
        lead.qualificationStatus === "qualified_page_live"
      ) {
        return false;
      }
      if (activeTab === "contacted" && !lead.hasSentOutreach) return false;
      if (
        activeTab === "followup" &&
        !(lead.followUpDate && lead.followUpDate <= todayYmd)
      ) {
        return false;
      }
      if (activeTab === "boards" && !lead.boardCreated) return false;

      if (!q) return true;
      const haystack = [
        lead.leadName,
        lead.contactName,
        lead.phone,
        lead.email,
        lead.hostedCruiseAndSailing,
        lead.shipName,
        lead.utmSource,
        lead.notes,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [snapshot.leads, activeTab, searchQuery, todayYmd]);

  const { kpis } = snapshot;

  return (
    <div className="space-y-6">
      {/* KPI Bar */}
      <section
        aria-label="Outreach KPI Summary"
        data-testid="outreach-kpi-bar"
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
      >
        <div className="rounded-2xl border border-amber-400/35 bg-amber-500/[0.08] p-3.5">
          <div className="text-[11px] font-bold uppercase tracking-wider text-amber-200">
            Outreach Sent
          </div>
          <div
            data-testid="kpi-outreach-sent"
            className="mt-1 font-mono text-2xl font-black text-white"
          >
            {kpis.outreachSentLeadsCount}
            <span className="text-sm font-semibold text-zinc-400">
              /{kpis.totalLeadsCount}
            </span>
          </div>
          <div className="mt-0.5 text-[11px] text-zinc-300">
            {kpis.totalOutreachTouchesCount} logged touch
            {kpis.totalOutreachTouchesCount === 1 ? "" : "es"} ·{" "}
            {kpis.repliedCount} replied
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-400/35 bg-emerald-500/[0.08] p-3.5">
          <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-200">
            Phone Leads Now
          </div>
          <div
            data-testid="kpi-phone-leads"
            className="mt-1 font-mono text-2xl font-black text-white"
          >
            {kpis.phoneLeadsCount}
          </div>
          <div className="mt-0.5 text-[11px] text-zinc-300">
            Direct dial / text ready
          </div>
        </div>

        <div className="rounded-2xl border border-cyan-400/30 bg-cyan-500/[0.07] p-3.5">
          <div className="text-[11px] font-bold uppercase tracking-wider text-cyan-200">
            Qualified &amp; Live
          </div>
          <div
            data-testid="kpi-qualified-live"
            className="mt-1 font-mono text-2xl font-black text-white"
          >
            {kpis.qualifiedReadyCount}
          </div>
          <div className="mt-0.5 text-[11px] text-zinc-300">
            {kpis.heldOrNeedsQualificationCount} held / qualify first
          </div>
        </div>

        <div className="rounded-2xl border border-white/15 bg-white/[0.04] p-3.5">
          <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-300">
            Follow-Ups Due
          </div>
          <div
            data-testid="kpi-followups-due"
            className={`mt-1 font-mono text-2xl font-black ${
              kpis.followUpsDueCount > 0 ? "text-amber-300" : "text-white"
            }`}
          >
            {kpis.followUpsDueCount}
          </div>
          <div className="mt-0.5 text-[11px] text-zinc-400">
            Due today or overdue
          </div>
        </div>

        <div className="rounded-2xl border border-white/15 bg-white/[0.04] p-3.5">
          <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-300">
            Boards Created
          </div>
          <div
            data-testid="kpi-boards-created"
            className="mt-1 font-mono text-2xl font-black text-white"
          >
            {kpis.boardsCreatedCount}
          </div>
          <div className="mt-0.5 text-[11px] text-zinc-400">
            Linked + live UTM match
          </div>
        </div>

        <div className="rounded-2xl border border-white/15 bg-white/[0.04] p-3.5">
          <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-300">
            Travelers Joined
          </div>
          <div
            data-testid="kpi-travelers-joined"
            className="mt-1 font-mono text-2xl font-black text-white"
          >
            {kpis.travelersJoinedCount}
          </div>
          <div className="mt-0.5 text-[11px] text-zinc-400">
            Group pax (not inventory)
          </div>
        </div>
      </section>

      {/* Immediate Phone Call Queue + Core Pitch */}
      <section
        aria-labelledby="immediate-phone-queue-heading"
        data-testid="immediate-phone-queue"
        className="rounded-2xl border border-emerald-400/40 bg-gradient-to-br from-emerald-500/[0.11] via-zinc-900/90 to-zinc-950 p-4 sm:p-6 space-y-4"
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-black uppercase tracking-widest text-emerald-300">
              Phone Leads Available Right Now ({phoneLeads.length})
            </p>
            <h2
              id="immediate-phone-queue-heading"
              className="text-xl font-black text-white sm:text-2xl"
            >
              #1 Immediate Call: Bond &amp; Beyond Networking Cruise — (904) 295-1212
            </h2>
            <p className="text-xs text-zinc-300">
              Zero automated messages are ever sent from this screen. Tap to call,
              text, or copy the pitch, then click <strong>Log Call / Text</strong> to
              record it durably in Postgres.
            </p>
          </div>
          <button
            type="button"
            onClick={() => copyText("core_pitch", snapshot.corePitchVerbatim)}
            className="min-h-10 shrink-0 rounded-xl border border-emerald-300/45 bg-emerald-500/20 px-3.5 py-2 text-xs font-bold text-emerald-100 hover:bg-emerald-500/30"
          >
            {copiedKey === "core_pitch"
              ? "Copied Core Pitch ✓"
              : "Copy Core Pitch"}
          </button>
        </div>

        <blockquote className="rounded-xl border border-white/15 bg-black/50 p-3.5 text-xs leading-relaxed text-zinc-100 sm:text-sm">
          &ldquo;{snapshot.corePitchVerbatim}&rdquo;
        </blockquote>

        <div className="grid gap-3 lg:grid-cols-3">
          {phoneLeads.map((lead, idx) => (
            <div
              key={lead.leadId}
              data-testid={`phone-queue-card-${lead.leadId}`}
              className="flex min-w-0 flex-col justify-between rounded-xl border border-white/15 bg-black/55 p-4 space-y-3"
            >
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="rounded bg-emerald-500/20 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-200">
                    CALL #{idx + 1}
                  </span>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${qualificationBadgeClass(
                      lead.qualificationStatus,
                    )}`}
                  >
                    {lead.qualificationStatus === "qualified_page_live"
                      ? "Page Live"
                      : lead.qualificationStatus === "held_schedule_conflict"
                        ? "Confirm Day Order First"
                        : "Qualify Ship & Date First"}
                  </span>
                </div>

                <h3 className="text-sm font-black text-white">
                  {lead.leadName}
                </h3>
                <div className="font-mono text-base font-black text-emerald-300">
                  {lead.phone}
                  {lead.phoneInvitesText ? (
                    <span className="ml-2 rounded bg-cyan-500/20 px-1.5 py-0.5 font-sans text-[10px] font-bold text-cyan-200">
                      Texts Invited
                    </span>
                  ) : null}
                </div>
                <p className="text-xs text-zinc-300">
                  {lead.hostedCruiseAndSailing}
                </p>
                <p className="text-[11px] leading-relaxed text-zinc-400">
                  {lead.valueToPitchSummary}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {lead.phoneDial ? (
                  <a
                    href={`tel:${lead.phoneDial}`}
                    className="min-h-9 inline-flex items-center rounded-lg bg-emerald-400 px-3 py-1.5 text-xs font-black text-zinc-950 hover:bg-emerald-300"
                  >
                    Call {lead.phone}
                  </a>
                ) : null}
                {lead.phoneDial && lead.phoneInvitesText ? (
                  <a
                    href={`sms:${lead.phoneDial}?body=${encodeURIComponent(
                      lead.phoneOrTextScript,
                    )}`}
                    className="min-h-9 inline-flex items-center rounded-lg border border-cyan-400/50 bg-cyan-500/20 px-3 py-1.5 text-xs font-bold text-cyan-100 hover:bg-cyan-500/30"
                  >
                    Text
                  </a>
                ) : null}
                <button
                  type="button"
                  onClick={() =>
                    copyText(`qscript_${lead.leadId}`, lead.phoneOrTextScript)
                  }
                  className="min-h-9 rounded-lg border border-white/20 bg-white/10 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-white/15"
                >
                  {copiedKey === `qscript_${lead.leadId}`
                    ? "Copied ✓"
                    : "Copy Script"}
                </button>
                <button
                  type="button"
                  disabled={savingLeadId === lead.leadId}
                  onClick={() => handleQuickTouch(lead, "call")}
                  className="min-h-9 rounded-lg border border-amber-400/40 bg-amber-500/15 px-2.5 py-1.5 text-xs font-bold text-amber-100 hover:bg-amber-500/25 disabled:opacity-50"
                >
                  Log Call
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Filter Tabs, Search & Add Lead */}
      <section className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                ["all", `All Leads (${snapshot.leads.length})`],
                ["phone", `Phone Leads (${kpis.phoneLeadsCount})`],
                ["qualified", `Qualified & Live (${kpis.qualifiedReadyCount})`],
                [
                  "held",
                  `Hold / Qualify First (${kpis.heldOrNeedsQualificationCount})`,
                ],
                [
                  "contacted",
                  `Contacted (${kpis.outreachSentLeadsCount})`,
                ],
                ["followup", `Follow-Up Due (${kpis.followUpsDueCount})`],
                ["boards", `Boards Live (${kpis.boardsCreatedCount})`],
              ] as const
            ).map(([tabKey, label]) => (
              <button
                key={tabKey}
                type="button"
                onClick={() => setActiveTab(tabKey)}
                className={`min-h-9 rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
                  activeTab === tabKey
                    ? "border-cyan-400 bg-cyan-500/20 text-white"
                    : "border-white/15 bg-white/[0.03] text-zinc-300 hover:bg-white/[0.08]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter ship, organizer, phone..."
              className="min-h-10 w-full rounded-xl border border-white/15 bg-black/50 px-3 py-1.5 text-xs text-white placeholder:text-zinc-500 sm:w-56"
            />
            <button
              type="button"
              data-testid="toggle-add-lead-btn"
              onClick={() => setShowAddForm((prev) => !prev)}
              className="min-h-10 w-full rounded-xl border border-emerald-400/45 bg-emerald-500/20 px-3.5 py-1.5 text-xs font-black text-emerald-100 hover:bg-emerald-500/30 sm:w-auto"
            >
              {showAddForm ? "Close New Lead Form" : "+ Add Organizer Lead"}
            </button>
          </div>
        </div>

        {/* Add New Organizer Lead Drawer */}
        {showAddForm ? (
          <form
            onSubmit={handleCreateLead}
            data-testid="add-organizer-lead-form"
            className="rounded-2xl border border-emerald-400/35 bg-zinc-900/90 p-4 sm:p-5 space-y-4"
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-base font-black text-white">
                Add Hosted-Cruise Organizer Prospect
              </h3>
              <span className="font-mono text-[11px] text-zinc-400">
                Persists to Neon Postgres
              </span>
            </div>

            {createError ? (
              <div className="rounded-xl border border-red-400/40 bg-red-500/15 px-3 py-2 text-xs text-red-200">
                {createError}
              </div>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <label className="space-y-1 text-xs">
                <span className="font-semibold text-zinc-300">
                  Organizer / Event Name *
                </span>
                <input
                  required
                  value={newLead.leadName}
                  onChange={(e) =>
                    setNewLead((p) => ({ ...p, leadName: e.target.value }))
                  }
                  placeholder="e.g. Podfest at Sea"
                  className="min-h-10 w-full rounded-lg border border-white/15 bg-black/50 px-3 py-1.5 text-xs text-white"
                />
              </label>

              <label className="space-y-1 text-xs">
                <span className="font-semibold text-zinc-300">
                  Contact Person / Agency
                </span>
                <input
                  value={newLead.contactName}
                  onChange={(e) =>
                    setNewLead((p) => ({ ...p, contactName: e.target.value }))
                  }
                  placeholder="Coordinator or travel desk"
                  className="min-h-10 w-full rounded-lg border border-white/15 bg-black/50 px-3 py-1.5 text-xs text-white"
                />
              </label>

              <label className="space-y-1 text-xs">
                <span className="font-semibold text-zinc-300">
                  Phone Number
                </span>
                <input
                  value={newLead.phone}
                  onChange={(e) =>
                    setNewLead((p) => ({ ...p, phone: e.target.value }))
                  }
                  placeholder="(555) 234-5678"
                  className="min-h-10 w-full rounded-lg border border-white/15 bg-black/50 px-3 py-1.5 text-xs text-white"
                />
              </label>

              <label className="space-y-1 text-xs">
                <span className="font-semibold text-zinc-300">Email</span>
                <input
                  type="email"
                  value={newLead.email}
                  onChange={(e) =>
                    setNewLead((p) => ({ ...p, email: e.target.value }))
                  }
                  placeholder="events@domain.com"
                  className="min-h-10 w-full rounded-lg border border-white/15 bg-black/50 px-3 py-1.5 text-xs text-white"
                />
              </label>

              <label className="space-y-1 text-xs">
                <span className="font-semibold text-zinc-300">
                  Official Event / Contact URL
                </span>
                <input
                  type="url"
                  value={newLead.officialUrl}
                  onChange={(e) =>
                    setNewLead((p) => ({ ...p, officialUrl: e.target.value }))
                  }
                  placeholder="https://..."
                  className="min-h-10 w-full rounded-lg border border-white/15 bg-black/50 px-3 py-1.5 text-xs text-white"
                />
              </label>

              <label className="space-y-1 text-xs">
                <span className="font-semibold text-zinc-300">
                  Hosted Cruise &amp; Sailing *
                </span>
                <input
                  required
                  value={newLead.hostedCruiseAndSailing}
                  onChange={(e) =>
                    setNewLead((p) => ({
                      ...p,
                      hostedCruiseAndSailing: e.target.value,
                    }))
                  }
                  placeholder="Ship · Sail Date (or TBD)"
                  className="min-h-10 w-full rounded-lg border border-white/15 bg-black/50 px-3 py-1.5 text-xs text-white"
                />
              </label>

              <label className="space-y-1 text-xs">
                <span className="font-semibold text-zinc-300">
                  Qualification Status
                </span>
                <select
                  value={newLead.qualificationStatus}
                  onChange={(e) =>
                    setNewLead((p) => ({
                      ...p,
                      qualificationStatus: e.target
                        .value as OrganizerQualificationStatus,
                    }))
                  }
                  className="min-h-10 w-full rounded-lg border border-white/15 bg-zinc-950 px-3 py-1.5 text-xs text-white"
                >
                  {QUALIFICATION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1 text-xs">
                <span className="font-semibold text-zinc-300">
                  Live CP Sailing URL (only if Qualified)
                </span>
                <input
                  type="url"
                  disabled={
                    newLead.qualificationStatus !== "qualified_page_live"
                  }
                  value={newLead.sailingPageUrl}
                  onChange={(e) =>
                    setNewLead((p) => ({
                      ...p,
                      sailingPageUrl: e.target.value,
                    }))
                  }
                  placeholder="https://cruisepromenade.com/sailings/..."
                  className="min-h-10 w-full rounded-lg border border-white/15 bg-black/50 px-3 py-1.5 text-xs text-white disabled:opacity-40"
                />
              </label>

              <label className="space-y-1 text-xs">
                <span className="font-semibold text-zinc-300">
                  Follow-Up Date
                </span>
                <input
                  type="date"
                  value={newLead.followUpDate}
                  onChange={(e) =>
                    setNewLead((p) => ({ ...p, followUpDate: e.target.value }))
                  }
                  className="min-h-10 w-full rounded-lg border border-white/15 bg-black/50 px-3 py-1.5 text-xs text-white"
                />
              </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1 text-xs">
                <span className="font-semibold text-zinc-300">
                  What Value to Pitch
                </span>
                <textarea
                  rows={2}
                  value={newLead.valueToPitchSummary}
                  onChange={(e) =>
                    setNewLead((p) => ({
                      ...p,
                      valueToPitchSummary: e.target.value,
                    }))
                  }
                  placeholder="Defaults to the free non-interfering shared planner pitch..."
                  className="w-full rounded-lg border border-white/15 bg-black/50 p-2.5 text-xs text-white"
                />
              </label>

              <label className="space-y-1 text-xs">
                <span className="font-semibold text-zinc-300">Notes</span>
                <textarea
                  rows={2}
                  value={newLead.notes}
                  onChange={(e) =>
                    setNewLead((p) => ({ ...p, notes: e.target.value }))
                  }
                  placeholder="Group size, port days, advisor notes..."
                  className="w-full rounded-lg border border-white/15 bg-black/50 p-2.5 text-xs text-white"
                />
              </label>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="inline-flex items-center gap-2 text-xs text-zinc-300">
                <input
                  type="checkbox"
                  checked={newLead.phoneInvitesText}
                  onChange={(e) =>
                    setNewLead((p) => ({
                      ...p,
                      phoneInvitesText: e.target.checked,
                    }))
                  }
                />
                Official site invites SMS / text at this phone number
              </label>

              <button
                type="submit"
                disabled={creatingLead}
                className="min-h-10 rounded-xl bg-emerald-400 px-4 py-2 text-xs font-black text-zinc-950 hover:bg-emerald-300 disabled:opacity-50"
              >
                {creatingLead ? "Saving..." : "Save Organizer Lead"}
              </button>
            </div>
          </form>
        ) : null}
      </section>

      {/* Actionable Organizer Leads List (All 9 Required Fields) */}
      <section aria-label="Organizer Leads Feed" className="space-y-4">
        {filteredLeads.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center text-sm text-zinc-400">
            No organizer leads match the current filter.
          </div>
        ) : null}

        {filteredLeads.map((lead) => {
          const draft = getLeadEdit(lead);
          const isPitchExpanded = Boolean(expandedPitchIds[lead.leadId]);
          const isFollowUpOverdue = Boolean(
            draft.followUpDate && draft.followUpDate < todayYmd,
          );
          const isFollowUpToday = Boolean(
            draft.followUpDate && draft.followUpDate === todayYmd,
          );
          const feedback = feedbackByLeadId[lead.leadId];

          const mailtoHref = lead.email
            ? `mailto:${lead.email}?subject=${encodeURIComponent(
                lead.emailSubject,
              )}&body=${encodeURIComponent(lead.emailBody)}`
            : null;

          return (
            <article
              key={lead.leadId}
              data-testid={`organizer-lead-card-${lead.leadId}`}
              className="min-w-0 overflow-hidden rounded-2xl border border-white/15 bg-white/[0.03] p-4 sm:p-6 space-y-4"
            >
              {/* Header: 1. Name & Phone + 3. Qualification Status + 5. Call/Email Status */}
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded bg-white/10 px-2 py-0.5 font-mono text-[11px] font-bold text-zinc-200">
                      #{lead.priorityRank}
                    </span>
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${qualificationBadgeClass(
                        lead.qualificationStatus,
                      )}`}
                    >
                      {lead.qualificationLabel}
                    </span>
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${outreachBadgeClass(
                        lead,
                      )}`}
                    >
                      {lead.outreachStatusLabel}
                    </span>
                    {isFollowUpOverdue ? (
                      <span className="rounded-full border border-red-400/50 bg-red-500/20 px-2.5 py-0.5 text-[11px] font-bold text-red-200">
                        Follow-Up Overdue ({draft.followUpDate})
                      </span>
                    ) : isFollowUpToday ? (
                      <span className="rounded-full border border-amber-400/50 bg-amber-500/20 px-2.5 py-0.5 text-[11px] font-bold text-amber-200">
                        Follow-Up Today
                      </span>
                    ) : null}
                  </div>

                  <h3 className="text-lg font-black text-white sm:text-xl break-words">
                    {lead.leadName}
                  </h3>
                  <p className="text-xs text-zinc-300 break-words">
                    {lead.contactName ? (
                      <span className="font-semibold text-zinc-100">
                        {lead.contactName} ·{" "}
                      </span>
                    ) : null}
                    {lead.cohortDescription}
                  </p>
                </div>

                {/* Quick Contact Action Strip */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {lead.phone && lead.phoneDial ? (
                    <>
                      <a
                        href={`tel:${lead.phoneDial}`}
                        className="min-h-9 inline-flex items-center rounded-xl bg-emerald-400 px-3 py-1.5 text-xs font-black text-zinc-950 hover:bg-emerald-300"
                      >
                        Call {lead.phone}
                      </a>
                      {lead.phoneInvitesText ? (
                        <a
                          href={`sms:${lead.phoneDial}?body=${encodeURIComponent(
                            lead.phoneOrTextScript,
                          )}`}
                          className="min-h-9 inline-flex items-center rounded-xl border border-cyan-400/50 bg-cyan-500/20 px-3 py-1.5 text-xs font-bold text-cyan-100 hover:bg-cyan-500/30"
                        >
                          Text
                        </a>
                      ) : null}
                    </>
                  ) : (
                    <span className="rounded-lg border border-white/10 bg-black/40 px-2.5 py-1.5 text-[11px] text-zinc-400">
                      No direct phone — use email/portal
                    </span>
                  )}

                  {mailtoHref ? (
                    <a
                      href={mailtoHref}
                      className="min-h-9 inline-flex items-center rounded-xl border border-sky-400/45 bg-sky-500/15 px-3 py-1.5 text-xs font-bold text-sky-100 hover:bg-sky-500/25"
                    >
                      Compose Email
                    </a>
                  ) : null}

                  {lead.officialUrl ? (
                    <a
                      href={lead.officialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-h-9 inline-flex items-center rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-white/10"
                    >
                      Official Site ↗
                    </a>
                  ) : null}
                </div>
              </div>

              {/* Core Details Grid: Contact, Hosted Cruise & Sailing, Qualification, What Value to Pitch */}
              <div className="grid gap-3 lg:grid-cols-3">
                {/* Col 1: Name, Phone, Email & Channel */}
                <div className="min-w-0 rounded-xl border border-white/10 bg-black/40 p-3.5 space-y-2">
                  <div className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                    1. Name, Phone &amp; Verified Channels
                  </div>
                  <div className="space-y-1 text-xs break-all">
                    <div>
                      <span className="text-zinc-400">Phone: </span>
                      {lead.phone ? (
                        <span className="font-mono font-bold text-emerald-300">
                          {lead.phone}
                          {lead.phoneInvitesText ? " (SMS invited)" : ""}
                        </span>
                      ) : (
                        <span className="text-zinc-500">
                          None published in pipeline
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-zinc-400">Email: </span>
                      {lead.email ? (
                        <button
                          type="button"
                          onClick={() =>
                            copyText(`email_${lead.leadId}`, lead.email!)
                          }
                          className="font-mono text-sky-300 underline decoration-dotted hover:text-sky-200"
                        >
                          {lead.email}
                          {copiedKey === `email_${lead.leadId}` ? " ✓" : ""}
                        </button>
                      ) : (
                        <span className="text-zinc-500">
                          Portal / FB group only
                        </span>
                      )}
                    </div>
                    {lead.altEmails.length > 0 ? (
                      <div className="text-[11px] text-zinc-400">
                        Alt: {lead.altEmails.join(", ")}
                      </div>
                    ) : null}
                    <div className="text-[11px] text-zinc-400">
                      UTM tag: <code>utm_source={lead.utmSource}</code>
                    </div>
                  </div>
                </div>

                {/* Col 2: Hosted Cruise & Sailing + Qualification Status */}
                <div className="min-w-0 rounded-xl border border-white/10 bg-black/40 p-3.5 space-y-2">
                  <div className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                    2. Hosted Cruise, Sailing &amp; Qualification
                  </div>
                  <p className="text-xs font-bold text-white break-words">
                    {lead.hostedCruiseAndSailing}
                  </p>
                  <p className="text-[11px] leading-relaxed text-zinc-300 break-words">
                    {lead.portWindowsSummary}
                  </p>
                  <p className="text-[11px] leading-relaxed text-zinc-400 break-words">
                    {lead.qualificationDetail}
                  </p>

                  {lead.qualificationStatus === "qualified_page_live" &&
                  lead.sailingPageUrl ? (
                    <div className="flex flex-wrap gap-2 pt-1">
                      <a
                        href={lead.sailingPageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg border border-emerald-400/40 bg-emerald-500/15 px-2.5 py-1 text-[11px] font-bold text-emerald-200 hover:bg-emerald-500/25"
                      >
                        Open Live Sailing Page ↗
                      </a>
                      <button
                        type="button"
                        onClick={() =>
                          copyText(`url_${lead.leadId}`, lead.sailingPageUrl!)
                        }
                        className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-zinc-200 hover:bg-white/10"
                      >
                        {copiedKey === `url_${lead.leadId}`
                          ? "Copied Link ✓"
                          : "Copy UTM Link"}
                      </button>
                    </div>
                  ) : (
                    <div
                      data-testid={`hold-guardrail-${lead.leadId}`}
                      className="rounded-lg border border-amber-400/35 bg-amber-500/10 px-2.5 py-1.5 text-[11px] font-semibold text-amber-200"
                    >
                      Sailing page held — confirm schedule/ship before pitching a
                      dedicated URL.
                    </div>
                  )}
                </div>

                {/* Col 3: What Value to Pitch */}
                <div className="min-w-0 rounded-xl border border-white/10 bg-black/40 p-3.5 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                      4. What Value to Pitch
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedPitchIds((prev) => ({
                          ...prev,
                          [lead.leadId]: !isPitchExpanded,
                        }))
                      }
                      className="text-[11px] font-bold text-cyan-300 hover:text-cyan-200"
                    >
                      {isPitchExpanded ? "Hide Scripts ▲" : "Scripts & Email ▼"}
                    </button>
                  </div>
                  <p className="text-xs leading-relaxed text-zinc-200 break-words">
                    {lead.valueToPitchSummary}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() =>
                        copyText(
                          `pitch_${lead.leadId}`,
                          lead.phoneOrTextScript,
                        )
                      }
                      className="rounded-lg border border-cyan-400/40 bg-cyan-500/15 px-2.5 py-1 text-[11px] font-bold text-cyan-100 hover:bg-cyan-500/25"
                    >
                      {copiedKey === `pitch_${lead.leadId}`
                        ? "Copied Script ✓"
                        : "Copy Call/Text Script"}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        copyText(`ebody_${lead.leadId}`, lead.emailBody)
                      }
                      className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-zinc-200 hover:bg-white/10"
                    >
                      {copiedKey === `ebody_${lead.leadId}`
                        ? "Copied Email ✓"
                        : "Copy Email Body"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Expandable Full Call/Text Script & Email Draft */}
              {isPitchExpanded ? (
                <div className="grid min-w-0 gap-3 rounded-xl border border-cyan-400/25 bg-zinc-950/90 p-3.5 lg:grid-cols-2">
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-cyan-200">
                        Phone / SMS Script
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          copyText(
                            `full_script_${lead.leadId}`,
                            lead.phoneOrTextScript,
                          )
                        }
                        className="shrink-0 text-[11px] font-semibold text-emerald-300 hover:underline"
                      >
                        {copiedKey === `full_script_${lead.leadId}`
                          ? "Copied ✓"
                          : "Copy"}
                      </button>
                    </div>
                    <pre className="max-w-full whitespace-pre-wrap break-all rounded-lg border border-white/10 bg-black/60 p-3 font-sans text-xs leading-relaxed text-zinc-200">
                      {lead.phoneOrTextScript}
                    </pre>
                  </div>

                  <div className="min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="min-w-0 break-words text-[11px] font-bold text-sky-200">
                        Email Draft — Subject: {lead.emailSubject}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          copyText(
                            `full_email_${lead.leadId}`,
                            `Subject: ${lead.emailSubject}\n\n${lead.emailBody}`,
                          )
                        }
                        className="shrink-0 text-[11px] font-semibold text-emerald-300 hover:underline"
                      >
                        {copiedKey === `full_email_${lead.leadId}`
                          ? "Copied ✓"
                          : "Copy Subject + Body"}
                      </button>
                    </div>
                    <pre className="max-h-52 max-w-full overflow-y-auto whitespace-pre-wrap break-all rounded-lg border border-white/10 bg-black/60 p-3 font-sans text-xs leading-relaxed text-zinc-200">
                      {lead.emailBody}
                    </pre>
                  </div>
                </div>
              ) : null}

              {/* Editable CRM Controls: 5. Call/Email Status, 6. Follow-Up Date, 8. Board Created, 9. Travelers Joined, 7. Notes */}
              <div className="min-w-0 rounded-xl border border-white/10 bg-black/50 p-3.5 space-y-3">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  {/* 5. Call/Email Status */}
                  <label className="min-w-0 space-y-1 text-xs">
                    <span className="font-bold text-zinc-300">
                      5. Call / Email Status
                    </span>
                    <select
                      aria-label={`Call or email status for ${lead.leadName}`}
                      value={draft.outreachStatus}
                      onChange={(e) =>
                        patchLeadEdit(lead, {
                          outreachStatus: e.target
                            .value as OrganizerOutreachStatus,
                        })
                      }
                      className="min-h-10 w-full rounded-lg border border-white/15 bg-zinc-950 px-2.5 py-1.5 text-xs text-white"
                    >
                      {OUTREACH_STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <div className="text-[10px] text-zinc-400">
                      Touches logged: <code>{lead.outreachCount}</code>
                      {lead.lastContactedAt
                        ? ` · Last: ${lead.lastContactedAt.slice(0, 10)}`
                        : " · 0 sent"}
                    </div>
                  </label>

                  {/* 3b. Qualification Status Override */}
                  <label className="min-w-0 space-y-1 text-xs">
                    <span className="font-bold text-zinc-300">
                      3. Qualification Status
                    </span>
                    <select
                      aria-label={`Qualification status for ${lead.leadName}`}
                      value={draft.qualificationStatus}
                      onChange={(e) =>
                        patchLeadEdit(lead, {
                          qualificationStatus: e.target
                            .value as OrganizerQualificationStatus,
                        })
                      }
                      className="min-h-10 w-full rounded-lg border border-white/15 bg-zinc-950 px-2.5 py-1.5 text-xs text-white"
                    >
                      {QUALIFICATION_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    {draft.qualificationStatus === "qualified_page_live" ? (
                      <input
                        type="url"
                        value={draft.sailingPageUrl}
                        onChange={(e) =>
                          patchLeadEdit(lead, {
                            sailingPageUrl: e.target.value,
                          })
                        }
                        placeholder="https://cruisepromenade.com/sailings/..."
                        className="min-h-8 w-full rounded border border-white/15 bg-zinc-950 px-2 py-1 text-[11px] text-zinc-200"
                      />
                    ) : null}
                  </label>

                  {/* 6. Follow-Up Date */}
                  <div className="min-w-0 space-y-1 text-xs">
                    <span className="font-bold text-zinc-300 block">
                      6. Follow-Up Date
                    </span>
                    <input
                      type="date"
                      aria-label={`Follow-up date for ${lead.leadName}`}
                      value={draft.followUpDate}
                      onChange={(e) =>
                        patchLeadEdit(lead, { followUpDate: e.target.value })
                      }
                      className="min-h-10 w-full rounded-lg border border-white/15 bg-zinc-950 px-2.5 py-1.5 text-xs text-white"
                    />
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      <button
                        type="button"
                        onClick={() =>
                          patchLeadEdit(lead, { followUpDate: todayYmd })
                        }
                        className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-zinc-300 hover:bg-white/20"
                      >
                        Today
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          patchLeadEdit(lead, { followUpDate: addDaysYmd(3) })
                        }
                        className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-zinc-300 hover:bg-white/20"
                      >
                        +3d
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          patchLeadEdit(lead, { followUpDate: addDaysYmd(7) })
                        }
                        className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-zinc-300 hover:bg-white/20"
                      >
                        +7d
                      </button>
                      {draft.followUpDate ? (
                        <button
                          type="button"
                          onClick={() =>
                            patchLeadEdit(lead, { followUpDate: "" })
                          }
                          className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-zinc-400 hover:bg-white/20"
                        >
                          Clear
                        </button>
                      ) : null}
                    </div>
                  </div>

                  {/* 8. Board Created */}
                  <div className="min-w-0 space-y-1 text-xs">
                    <span className="font-bold text-zinc-300 block">
                      8. Board Created
                    </span>
                    <input
                      type="text"
                      aria-label={`Board share code for ${lead.leadName}`}
                      value={draft.boardShareCode}
                      onChange={(e) =>
                        patchLeadEdit(lead, {
                          boardShareCode: e.target.value,
                          boardCreated:
                            Boolean(e.target.value.trim()) || draft.boardCreated,
                        })
                      }
                      placeholder="Share code or /p/... URL"
                      className="min-h-10 w-full rounded-lg border border-white/15 bg-zinc-950 px-2.5 py-1.5 text-xs text-white"
                    />
                    <div className="flex items-center justify-between gap-2 text-[10px] text-zinc-400">
                      <label className="inline-flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={draft.boardCreated}
                          onChange={(e) =>
                            patchLeadEdit(lead, {
                              boardCreated: e.target.checked,
                            })
                          }
                        />
                        Board live
                      </label>
                      {lead.boardUrl ? (
                        <a
                          href={lead.boardUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-emerald-300 hover:underline"
                        >
                          Open Board ↗
                        </a>
                      ) : (
                        <span>
                          UTM: {lead.telemetry.sailingViewsCount}v /{" "}
                          {lead.telemetry.boardsCreatedCount}b
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 9. Travelers Joined */}
                  <label className="min-w-0 space-y-1 text-xs">
                    <span className="font-bold text-zinc-300">
                      9. Travelers Joined
                    </span>
                    <input
                      type="number"
                      min={0}
                      aria-label={`Travelers joined for ${lead.leadName}`}
                      value={draft.travelersJoined}
                      onChange={(e) =>
                        patchLeadEdit(lead, {
                          travelersJoined: e.target.value,
                        })
                      }
                      className="min-h-10 w-full rounded-lg border border-white/15 bg-zinc-950 px-2.5 py-1.5 font-mono text-xs text-white"
                    />
                    <div className="text-[10px] text-zinc-400">
                      Group participation (not supplier seats)
                    </div>
                  </label>
                </div>

                {/* 7. Notes + Save & Quick Log Buttons */}
                <div className="space-y-2">
                  <label className="block space-y-1 text-xs">
                    <span className="font-bold text-zinc-300">7. Notes</span>
                    <textarea
                      rows={2}
                      aria-label={`Notes for ${lead.leadName}`}
                      value={draft.notes}
                      onChange={(e) =>
                        patchLeadEdit(lead, { notes: e.target.value })
                      }
                      placeholder="Call outcome, schedule confirmation details, organizer feedback..."
                      className="w-full rounded-lg border border-white/15 bg-zinc-950 p-2.5 text-xs text-white placeholder:text-zinc-500"
                    />
                  </label>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        disabled={savingLeadId === lead.leadId}
                        onClick={() => handleQuickTouch(lead, "call")}
                        className="min-h-9 rounded-lg border border-emerald-400/35 bg-emerald-500/15 px-2.5 py-1 text-xs font-bold text-emerald-100 hover:bg-emerald-500/25 disabled:opacity-50"
                      >
                        + Log Call
                      </button>
                      <button
                        type="button"
                        disabled={savingLeadId === lead.leadId}
                        onClick={() =>
                          handleQuickTouch(lead, "call", "called_left_vm")
                        }
                        className="min-h-9 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-xs font-semibold text-zinc-200 hover:bg-white/10 disabled:opacity-50"
                      >
                        + Left VM
                      </button>
                      <button
                        type="button"
                        disabled={savingLeadId === lead.leadId}
                        onClick={() => handleQuickTouch(lead, "text")}
                        className="min-h-9 rounded-lg border border-cyan-400/35 bg-cyan-500/15 px-2.5 py-1 text-xs font-bold text-cyan-100 hover:bg-cyan-500/25 disabled:opacity-50"
                      >
                        + Log Text
                      </button>
                      <button
                        type="button"
                        disabled={savingLeadId === lead.leadId}
                        onClick={() => handleQuickTouch(lead, "email")}
                        className="min-h-9 rounded-lg border border-sky-400/35 bg-sky-500/15 px-2.5 py-1 text-xs font-bold text-sky-100 hover:bg-sky-500/25 disabled:opacity-50"
                      >
                        + Log Email Sent
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {feedback ? (
                        <span
                          className={`text-xs font-semibold ${
                            feedback.ok ? "text-emerald-300" : "text-red-300"
                          }`}
                        >
                          {feedback.msg}
                        </span>
                      ) : null}
                      <button
                        type="button"
                        data-testid={`save-lead-${lead.leadId}`}
                        disabled={savingLeadId === lead.leadId}
                        onClick={() => submitLeadUpdate(lead)}
                        className="min-h-9 rounded-xl bg-white px-4 py-1.5 text-xs font-black text-zinc-950 hover:bg-zinc-200 disabled:opacity-50"
                      >
                        {savingLeadId === lead.leadId
                          ? "Saving..."
                          : "Save Changes"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      {/* Connected Surfaces Reference Footer */}
      <footer className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-xs text-zinc-400 flex flex-wrap items-center justify-between gap-3">
        <div>
          Storage: <code>{snapshot.storageBackend}</code> (
          <code>{snapshot.environmentScope}</code>) · Connected surfaces:{" "}
          <Link
            href="/admin/inbox?view=genuine"
            className="text-amber-300 hover:underline"
          >
            DCC Genuine Inquiries
          </Link>{" "}
          ·{" "}
          <Link href="/admin/portfolio" className="text-cyan-300 hover:underline">
            DCC Portfolio Dashboard
          </Link>{" "}
          ·{" "}
          <a
            href="https://cruisepromenade.com/planner"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-300 hover:underline"
          >
            Cruise Promenade Planner ↗
          </a>
        </div>
      </footer>
    </div>
  );
}
