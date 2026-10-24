"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import type {
  AuthorityType,
  EntryScenarioRule,
  EvidenceCitation,
  IntegrationStatus,
  SpecialistHandoffOption,
  TravelReferenceNode,
} from "@/lib/dcc/travelReference";

const AUTHORITY_BADGE_MAP: Record<
  AuthorityType,
  { label: string; className: string }
> = {
  official_rule: {
    label: "Official Rule / Requirement",
    className: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200",
  },
  observation: {
    label: "Live Sensor Observation",
    className: "border-cyan-500/40 bg-cyan-500/10 text-cyan-200",
  },
  forecast: {
    label: "Model Forecast",
    className: "border-sky-500/40 bg-sky-500/10 text-sky-200",
  },
  dcc_interpretation: {
    label: "DCC Practical Interpretation",
    className: "border-indigo-500/40 bg-indigo-500/10 text-indigo-200",
  },
  editorial_recommendation: {
    label: "DCC Editorial Recommendation",
    className: "border-amber-500/40 bg-amber-500/10 text-amber-200",
  },
  official_resource_link: {
    label: "Official External Resource (Linked)",
    className: "border-zinc-500/40 bg-zinc-800/80 text-zinc-200",
  },
};

const INTEGRATION_BADGE_MAP: Record<
  IntegrationStatus,
  { label: string; className: string }
> = {
  live_integrated: {
    label: "Live API Integrated",
    className: "border-emerald-400/40 bg-emerald-500/15 text-emerald-300",
  },
  curated_verified: {
    label: "Curated & Source-Verified",
    className: "border-cyan-400/40 bg-cyan-500/15 text-cyan-300",
  },
  linked_official_resource: {
    label: "Official External Link (Not Automated)",
    className: "border-amber-400/40 bg-amber-500/15 text-amber-200",
  },
};

export function AuthorityBadge({ type }: { type: AuthorityType }) {
  const meta = AUTHORITY_BADGE_MAP[type] || AUTHORITY_BADGE_MAP.dcc_interpretation;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ${meta.className}`}
    >
      {meta.label}
    </span>
  );
}

export function IntegrationBadge({ status }: { status: IntegrationStatus }) {
  const meta = INTEGRATION_BADGE_MAP[status] || INTEGRATION_BADGE_MAP.linked_official_resource;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ${meta.className}`}
    >
      {meta.label}
    </span>
  );
}

export function EntryDependencyExplorer({
  whyCoordinatesCannotAnswerEntry,
  scenarios,
  evidenceMap,
}: {
  whyCoordinatesCannotAnswerEntry: string;
  scenarios: EntryScenarioRule[];
  evidenceMap: Record<string, EvidenceCitation>;
}) {
  const [selectedId, setSelectedId] = useState<string>("all");

  const visibleScenarios = useMemo(() => {
    if (selectedId === "all") return scenarios;
    return scenarios.filter((s) => s.id === selectedId);
  }, [scenarios, selectedId]);

  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/70 p-5 md:p-6 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-4">
        <div className="space-y-2 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <AuthorityBadge type="official_rule" />
            <IntegrationBadge status="linked_official_resource" />
          </div>
          <h3 className="text-lg md:text-xl font-bold text-white">
            Entry, Document & Regulatory Dependencies
          </h3>
          <p className="text-sm text-zinc-300 leading-relaxed">
            {whyCoordinatesCannotAnswerEntry}
          </p>
        </div>

        <div className="w-full sm:w-auto">
          <label
            htmlFor="entry-scenario-select"
            className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5"
          >
            Filter by Traveler Scenario
          </label>
          <select
            id="entry-scenario-select"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full sm:w-80 rounded-xl border border-white/15 bg-zinc-950 px-3 py-2 text-xs md:text-sm text-white focus:border-cyan-400 focus:outline-none"
          >
            <option value="all">Show All Traveler Entry & Rule Scenarios ({scenarios.length})</option>
            {scenarios.map((scenario) => (
              <option key={scenario.id} value={scenario.id}>
                {scenario.scenarioLabel}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4">
        {visibleScenarios.map((scenario) => (
          <article
            key={scenario.id}
            className="rounded-xl border border-white/10 bg-zinc-950/80 p-4 md:p-5 space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-base font-bold text-white">{scenario.scenarioLabel}</h4>
              <span className="text-[11px] font-mono text-zinc-400">
                6-Factor Dependency Model
              </span>
            </div>

            <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-xs">
              <div className="rounded-lg border border-white/5 bg-zinc-900/60 p-3">
                <dt className="font-bold uppercase tracking-wider text-zinc-400">
                  1. Nationality
                </dt>
                <dd className="mt-1 text-zinc-200">{scenario.dependencies.nationality}</dd>
              </div>
              <div className="rounded-lg border border-white/5 bg-zinc-900/60 p-3">
                <dt className="font-bold uppercase tracking-wider text-zinc-400">
                  2. Passport & Documents
                </dt>
                <dd className="mt-1 text-zinc-200">{scenario.dependencies.passportAndDocuments}</dd>
              </div>
              <div className="rounded-lg border border-white/5 bg-zinc-900/60 p-3">
                <dt className="font-bold uppercase tracking-wider text-zinc-400">
                  3. Residence Context
                </dt>
                <dd className="mt-1 text-zinc-200">{scenario.dependencies.residenceContext}</dd>
              </div>
              <div className="rounded-lg border border-white/5 bg-zinc-900/60 p-3">
                <dt className="font-bold uppercase tracking-wider text-zinc-400">
                  4. Transit & Routing
                </dt>
                <dd className="mt-1 text-zinc-200">{scenario.dependencies.routingAndTransit}</dd>
              </div>
              <div className="rounded-lg border border-white/5 bg-zinc-900/60 p-3">
                <dt className="font-bold uppercase tracking-wider text-zinc-400">
                  5. Trip Purpose
                </dt>
                <dd className="mt-1 text-zinc-200">{scenario.dependencies.tripPurpose}</dd>
              </div>
              <div className="rounded-lg border border-white/5 bg-zinc-900/60 p-3">
                <dt className="font-bold uppercase tracking-wider text-zinc-400">
                  6. Dates & Validity Window
                </dt>
                <dd className="mt-1 text-zinc-200">{scenario.dependencies.dateAndValidityRule}</dd>
              </div>
            </dl>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-3.5 space-y-1.5">
                <div className="flex items-center gap-2">
                  <AuthorityBadge type="official_rule" />
                </div>
                <p className="text-xs md:text-sm text-zinc-200 leading-relaxed">
                  {scenario.officialRequirementSummary}
                </p>
              </div>

              <div className="rounded-xl border border-indigo-500/20 bg-indigo-950/20 p-3.5 space-y-1.5">
                <div className="flex items-center gap-2">
                  <AuthorityBadge type="dcc_interpretation" />
                </div>
                <p className="text-xs md:text-sm text-zinc-200 leading-relaxed">
                  {scenario.dccPracticalExplanation}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/10">
              <div className="flex flex-wrap gap-2">
                {scenario.officialLinks.map((link) => (
                  <a
                    key={link.url}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-200 hover:bg-cyan-500/20 transition"
                  >
                    <span>Official Authority: {link.label}</span>
                    <span aria-hidden="true">↗</span>
                  </a>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 text-[11px] text-zinc-400">
                {scenario.citationIds.map((cid) => {
                  const cite = evidenceMap[cid];
                  if (!cite) return null;
                  return (
                    <span key={cid}>
                      Issued by {cite.issuingOrganization} • Checked {cite.lastCheckedAt}
                    </span>
                  );
                })}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export function SpecialistHandoffInteractive({
  config,
}: {
  config: TravelReferenceNode["specialistHandoffs"];
}) {
  const [travelDate, setTravelDate] = useState<string>("");
  const [partySize, setPartySize] = useState<string>("2");
  const [customChoice, setCustomChoice] = useState<string>(
    config.contextControls.customSelectorOptions?.[0]?.value || "",
  );

  function buildHandoffUrl(option: SpecialistHandoffOption): string {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(option.queryDefaults)) {
      params.set(k, v);
    }
    if (config.contextControls.supportsDate && travelDate) {
      params.set("date", travelDate);
    }
    if (config.contextControls.supportsPartySize && partySize) {
      params.set("party_size", partySize);
      params.set("travelers", partySize);
      params.set("passengerCount", partySize);
    }
    if (config.contextControls.customSelectorParam && customChoice) {
      params.set(config.contextControls.customSelectorParam, customChoice);
    }
    const qs = params.toString();
    if (!qs) return option.baseUrl;
    return `${option.baseUrl}${option.baseUrl.includes("?") ? "&" : "?"}${qs}`;
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/70 p-5 md:p-6 space-y-6">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <AuthorityBadge type="editorial_recommendation" />
          <span className="inline-flex items-center rounded-full border border-white/15 bg-zinc-800 px-2.5 py-0.5 text-[11px] font-medium text-zinc-300">
            Optional Downstream Continuity — Reference Complete Without Purchase
          </span>
        </div>
        <h2 className="text-2xl font-black text-white">{config.sectionTitle}</h2>
        <p className="text-sm text-zinc-300 max-w-3xl leading-relaxed">
          {config.leadSummary}
        </p>
      </div>

      {/* Traveler Context Continuity Bar */}
      <div className="rounded-xl border border-cyan-500/25 bg-cyan-950/20 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-bold uppercase tracking-wider text-cyan-300">
            Carry Known Trip Context Into Specialist Handoffs (Optional)
          </p>
          <span className="text-[11px] text-zinc-400">
            Only forwards verified parameters (date, party size, hub/mode)
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {config.contextControls.supportsDate && (
            <div>
              <label
                htmlFor="handoff-date-input"
                className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-300 mb-1"
              >
                Planned Visit Date
              </label>
              <input
                id="handoff-date-input"
                type="date"
                value={travelDate}
                onChange={(e) => setTravelDate(e.target.value)}
                className="w-full rounded-lg border border-white/15 bg-zinc-950 px-3 py-2 text-xs md:text-sm text-white focus:border-cyan-400 focus:outline-none"
              />
            </div>
          )}

          {config.contextControls.supportsPartySize && (
            <div>
              <label
                htmlFor="handoff-party-select"
                className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-300 mb-1"
              >
                Travelers / Party Size
              </label>
              <select
                id="handoff-party-select"
                value={partySize}
                onChange={(e) => setPartySize(e.target.value)}
                className="w-full rounded-lg border border-white/15 bg-zinc-950 px-3 py-2 text-xs md:text-sm text-white focus:border-cyan-400 focus:outline-none"
              >
                {[1, 2, 3, 4, 5, 6, 8, 10, 12].map((num) => (
                  <option key={num} value={String(num)}>
                    {num} {num === 1 ? "Traveler" : "Travelers"}
                  </option>
                ))}
              </select>
            </div>
          )}

          {config.contextControls.customSelectorOptions && (
            <div>
              <label
                htmlFor="handoff-custom-select"
                className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-300 mb-1"
              >
                {config.contextControls.customSelectorLabel || "Transfer Context"}
              </label>
              <select
                id="handoff-custom-select"
                value={customChoice}
                onChange={(e) => setCustomChoice(e.target.value)}
                className="w-full rounded-lg border border-white/15 bg-zinc-950 px-3 py-2 text-xs md:text-sm text-white focus:border-cyan-400 focus:outline-none"
              >
                {config.contextControls.customSelectorOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {config.options.map((option) => {
          const href = buildHandoffUrl(option);
          const isExternal = href.startsWith("http");
          return (
            <article
              key={option.id}
              className="rounded-xl border border-white/10 bg-zinc-950/80 p-5 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">
                    {option.partnerRole.replaceAll("_", " ")}
                  </span>
                  <span className="rounded-md border border-white/10 bg-zinc-900 px-2 py-0.5 text-[10px] font-mono text-zinc-400">
                    {option.integrationMode === "pilot_endpoint_plus_handoff"
                      ? "Registered DCC Feed + Context Handoff"
                      : "Context-Preserving Link Handoff"}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white">{option.partnerName}</h3>
                <p className="text-xs md:text-sm text-zinc-300 leading-relaxed">
                  {option.description}
                </p>
                <p className="text-xs text-zinc-400">
                  <strong className="text-zinc-200">When it helps:</strong> {option.whenItHelps}
                </p>
              </div>

              <div className="space-y-3 pt-3 border-t border-white/10">
                <p className="text-[11px] text-zinc-400 italic">
                  {option.noPurchaseRequiredNote}
                </p>
                {isExternal ? (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-xs md:text-sm font-bold text-zinc-950 hover:bg-cyan-400 transition"
                  >
                    <span>Continue to {option.partnerName}</span>
                    <span aria-hidden="true">↗</span>
                  </a>
                ) : (
                  <Link
                    href={href}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-500/40 bg-cyan-500/15 px-4 py-2.5 text-xs md:text-sm font-bold text-cyan-200 hover:bg-cyan-500/25 transition"
                  >
                    <span>Open {option.partnerName}</span>
                    <span aria-hidden="true">→</span>
                  </Link>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
