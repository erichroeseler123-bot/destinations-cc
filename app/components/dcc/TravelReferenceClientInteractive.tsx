"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { trackEvent } from "@/lib/analytics";
import type {
  AuthorityType,
  EntryScenarioRule,
  EvidenceCitation,
  IntegrationStatus,
  SpecialistHandoffOption,
  TravelReferenceNode,
} from "@/lib/dcc/travelReferenceCore";

const AUTHORITY_BADGE_MAP: Record<
  AuthorityType,
  { label: string; className: string }
> = {
  official_rule: {
    label: "Official Rule / Requirement",
    className: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200",
  },
  operator_provided: {
    label: "Operator-Provided Specification",
    className: "border-teal-500/40 bg-teal-500/10 text-teal-200",
  },
  observation: {
    label: "Live Sensor Observation",
    className: "border-cyan-500/40 bg-cyan-500/10 text-cyan-200",
  },
  forecast: {
    label: "Model Forecast",
    className: "border-sky-500/40 bg-sky-500/10 text-sky-200",
  },
  review_sentiment: {
    label: "Third-Party Review Sentiment",
    className: "border-purple-500/40 bg-purple-500/10 text-purple-200",
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
            onChange={(e) => {
              const nextId = e.target.value;
              setSelectedId(nextId);
              trackEvent("plan_modified", {
                surface: "ask-dcc",
                corridor: "ask-dcc",
                modified_field: "entry_scenario",
                selected_scenario_id: nextId,
                intent: nextId,
              });
            }}
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
                    <a
                      key={cid}
                      href={`#cite-${cid}`}
                      className="hover:text-cyan-300 underline decoration-white/20"
                    >
                      [{cid}] Issued by {cite.issuingOrganization} • Checked {cite.lastCheckedAt}
                    </a>
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
  nodeId,
  initialContext,
}: {
  config: TravelReferenceNode["specialistHandoffs"];
  nodeId?: string;
  initialContext?: {
    date?: string;
    partySize?: string;
    customChoice?: string;
  };
}) {
  const corridorId = nodeId || "ask-dcc";
  const [travelDate, setTravelDate] = useState<string>(
    initialContext?.date || "",
  );
  const [partySize, setPartySize] = useState<string>(
    initialContext?.partySize || "2",
  );
  const [customChoice, setCustomChoice] = useState<string>(
    initialContext?.customChoice ||
      config.contextControls.customSelectorOptions?.[0]?.value ||
      "",
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    const urlDate = sp.get("date") || sp.get("arrivalDate");
    if (urlDate && /^\d{4}-\d{2}-\d{2}$/.test(urlDate)) {
      setTravelDate(urlDate);
    }
    const urlParty =
      sp.get("party_size") ||
      sp.get("travelers") ||
      sp.get("passengerCount") ||
      sp.get("passengers") ||
      sp.get("qty");
    if (urlParty && /^\d+$/.test(urlParty)) {
      setPartySize(urlParty);
    }
    const customParam = config.contextControls.customSelectorParam;
    if (customParam) {
      const urlCustom = sp.get(customParam);
      if (urlCustom) {
        setCustomChoice(urlCustom);
      }
    }
  }, [config.contextControls.customSelectorParam]);

  function buildHandoffUrl(option: SpecialistHandoffOption): string {
    const isInternal = option.baseUrl.startsWith("/");
    const url = new URL(
      option.baseUrl,
      isInternal ? "https://www.destinationcommandcenter.com" : undefined,
    );

    for (const [k, v] of Object.entries(option.defaultParams)) {
      url.searchParams.set(k, v);
    }

    if (travelDate && option.supportedContextParams.includes("date")) {
      url.searchParams.set("date", travelDate);
    }
    if (partySize && option.supportedContextParams.includes("partySize")) {
      url.searchParams.set("travelers", partySize);
      url.searchParams.set("party_size", partySize);
      url.searchParams.set("passengerCount", partySize);
      url.searchParams.set("passengers", partySize);
      url.searchParams.set("qty", partySize);
    }
    if (customChoice && config.contextControls.customSelectorParam) {
      if (
        option.supportedContextParams.includes("shipOrPort") ||
        option.supportedContextParams.includes("pickupHub") ||
        option.supportedContextParams.includes("direction")
      ) {
        url.searchParams.set(config.contextControls.customSelectorParam, customChoice);
      }
    }

    return isInternal ? `${url.pathname}${url.search}` : url.toString();
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/70 p-5 md:p-6 space-y-6">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <AuthorityBadge type="editorial_recommendation" />
          <span className="inline-flex items-center rounded-full border border-white/15 bg-zinc-800 px-2.5 py-0.5 text-[11px] font-medium text-zinc-300">
            Optional Booking — Complete Guide Works Without Purchase
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
            Pass Your Trip Date & Party Size to Booking Links (Optional)
          </p>
          <span className="text-[11px] text-zinc-400">
            Leave date blank until you know your sailing date
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {config.contextControls.supportsDate && (
            <div>
              <label
                htmlFor="handoff-date-input"
                className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-300 mb-1"
              >
                Planned Visit Date (Optional)
              </label>
              <input
                id="handoff-date-input"
                type="date"
                value={travelDate}
                onChange={(e) => {
                  const nextDate = e.target.value;
                  setTravelDate(nextDate);
                  trackEvent("plan_modified", {
                    surface: corridorId,
                    corridor: corridorId,
                    modified_field: "travel_date",
                    travel_date: nextDate,
                    party_size: partySize,
                    intent: customChoice || "date_selected",
                  });
                }}
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
                onChange={(e) => {
                  const nextParty = e.target.value;
                  setPartySize(nextParty);
                  trackEvent("plan_modified", {
                    surface: corridorId,
                    corridor: corridorId,
                    modified_field: "party_size",
                    party_size: nextParty,
                    travel_date: travelDate,
                    intent: customChoice || `party_${nextParty}`,
                  });
                }}
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
                onChange={(e) => {
                  const nextChoice = e.target.value;
                  setCustomChoice(nextChoice);
                  trackEvent("plan_modified", {
                    surface: corridorId,
                    corridor: corridorId,
                    modified_field: config.contextControls.customSelectorParam || "custom_context",
                    custom_choice: nextChoice,
                    travel_date: travelDate,
                    party_size: partySize,
                    intent: nextChoice,
                  });
                }}
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
          const handleOptionClick = () => {
            trackEvent("operator_cta_clicked", {
              surface: corridorId,
              corridor: corridorId,
              target_path: href,
              product_code: option.id,
              decision_option: option.partnerRole,
              operator_name: option.partnerName,
              travel_date: travelDate,
              party_size: partySize,
              custom_choice: customChoice,
            });
            trackEvent("cta_clicked_primary", {
              surface: corridorId,
              corridor: corridorId,
              target_path: href,
              product_code: option.id,
              decision_option: option.partnerRole,
              operator_name: option.partnerName,
            });
          };
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
                    onClick={handleOptionClick}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-xs md:text-sm font-bold text-zinc-950 hover:bg-cyan-400 transition"
                  >
                    <span>Continue to {option.partnerName}</span>
                    <span aria-hidden="true">↗</span>
                  </a>
                ) : (
                  <Link
                    href={href}
                    onClick={handleOptionClick}
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

function cToF(celsius: number | null | undefined): string {
  if (celsius == null || !Number.isFinite(celsius)) return "—";
  const f = (celsius * 9) / 5 + 32;
  return `${Math.round(f)}°F (${celsius.toFixed(1)}°C)`;
}

function kphToMph(kph: number | null | undefined): string {
  if (kph == null || !Number.isFinite(kph)) return "—";
  const mph = kph * 0.621371;
  return `${Math.round(mph)} mph (${Math.round(kph)} km/h)`;
}

const STALE_THRESHOLD_MS = 60 * 60 * 1000;

export type TelemetrySnapshotInput = {
  core: any | null;
  extended: any | null;
  fetchError: string | null;
};

function mapLocationApiToSnapshot(apiPayload: any): TelemetrySnapshotInput {
  if (!apiPayload || apiPayload.ok === false) {
    return {
      core: null,
      extended: null,
      fetchError: apiPayload?.error || "Live API unavailable",
    };
  }
  const modules = apiPayload.modules || {};
  return {
    core: {
      checkedAt: apiPayload.checkedAt || new Date().toISOString(),
      now: modules.now || { weather: apiPayload.weather || null, airQuality: null },
      conditions: modules.conditions || { next12Hours: [], next3Days: [] },
      hazards: modules.hazards || { alerts: apiPayload.alerts || [] },
      sources: apiPayload.sources || [],
    },
    extended: {
      coastal: modules.coastal || apiPayload.coastal || { coops: [], ndbc: [] },
      aviation: modules.aviation || apiPayload.aviation || [],
      sources: apiPayload.sources || [],
    },
    fetchError: null,
  };
}

export function LiveCoordinateTelemetryCards({
  primaryCoordinate,
  secondaryCoordinate,
  initialPrimaryTelemetry,
  initialSecondaryTelemetry,
  whatRequiresOfficialExternalCheck,
}: {
  primaryCoordinate: TravelReferenceNode["primaryCoordinate"];
  secondaryCoordinate?: TravelReferenceNode["secondaryCoordinates"][number] | null;
  initialPrimaryTelemetry: TelemetrySnapshotInput;
  initialSecondaryTelemetry: TelemetrySnapshotInput | null;
  whatRequiresOfficialExternalCheck: TravelReferenceNode["operationalBoundaries"]["whatRequiresOfficialExternalCheck"];
}) {
  const [primaryTelemetry, setPrimaryTelemetry] = useState<TelemetrySnapshotInput>(
    initialPrimaryTelemetry,
  );
  const [secondaryTelemetry, setSecondaryTelemetry] =
    useState<TelemetrySnapshotInput | null>(initialSecondaryTelemetry);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [lastClientRefreshAt, setLastClientRefreshAt] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function refreshTelemetry() {
      try {
        const primaryUrl = `/api/location/${primaryCoordinate.lat.toFixed(5)}/${primaryCoordinate.lng.toFixed(5)}?scope=full`;
        const secondaryUrl = secondaryCoordinate
          ? `/api/location/${secondaryCoordinate.lat.toFixed(5)}/${secondaryCoordinate.lng.toFixed(5)}?scope=core`
          : null;

        const [primRes, secRes] = await Promise.all([
          fetch(primaryUrl, { cache: "no-store" }),
          secondaryUrl ? fetch(secondaryUrl, { cache: "no-store" }) : Promise.resolve(null),
        ]);

        if (!active) return;

        if (primRes.ok) {
          const primJson = await primRes.json();
          if (active) {
            setPrimaryTelemetry(mapLocationApiToSnapshot(primJson));
            setLastClientRefreshAt(primJson.checkedAt || new Date().toISOString());
            setRefreshError(null);
          }
        } else {
          setRefreshError(`API HTTP ${primRes.status}`);
        }

        if (secRes && secRes.ok) {
          const secJson = await secRes.json();
          if (active) {
            setSecondaryTelemetry(mapLocationApiToSnapshot(secJson));
          }
        }
      } catch (err) {
        if (!active) return;
        setRefreshError(err instanceof Error ? err.message : "Live API refresh failed");
      }
    }

    void refreshTelemetry();
    const timer = setInterval(() => {
      void refreshTelemetry();
    }, 60_000);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [
    primaryCoordinate.lat,
    primaryCoordinate.lng,
    secondaryCoordinate?.lat,
    secondaryCoordinate?.lng,
  ]);

  const primaryCore = primaryTelemetry.core;
  const primaryExt = primaryTelemetry.extended;
  const primaryWeather = primaryCore?.now?.weather || null;
  const primaryAqi = primaryCore?.now?.airQuality || null;
  const primaryAlerts = primaryCore?.hazards?.alerts || [];
  const primaryNext12 = primaryCore?.conditions?.next12Hours || [];
  const primarySnowDepthM =
    primaryNext12.find((h: any) => typeof h?.snowDepthM === "number")?.snowDepthM ??
    null;

  const nwsSourceState = primaryCore?.sources?.find((s: any) => s.provider === "nws");
  const weatherSourceState = primaryCore?.sources?.find(
    (s: any) => s.provider === "open-meteo",
  );
  const coopsStations = primaryExt?.coastal?.coops || [];
  const aviationStations = primaryExt?.aviation || [];

  const checkedTimestamp =
    nwsSourceState?.checkedAt ||
    weatherSourceState?.checkedAt ||
    primaryCore?.checkedAt ||
    lastClientRefreshAt ||
    null;
  const checkedMs = checkedTimestamp ? new Date(checkedTimestamp).getTime() : Number.NaN;
  const isStale =
    Number.isFinite(checkedMs) && Date.now() - checkedMs > STALE_THRESHOLD_MS;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Primary Coordinate Card */}
      <div className="rounded-2xl border border-white/10 bg-zinc-950 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">
                Local Weather & Alerts
              </span>
              {isStale ? (
                <span className="rounded-full border border-amber-400/40 bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-200">
                  Stale Snapshot
                </span>
              ) : refreshError ? (
                <span className="rounded-full border border-amber-400/40 bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-200">
                  Live Refresh Unavailable ({refreshError})
                </span>
              ) : null}
            </div>
            <h3 className="text-base font-bold text-white">
              {primaryCoordinate.label}
            </h3>
          </div>
          <Link
            href={primaryCoordinate.canonicalLocationPath}
            className="text-xs font-mono text-cyan-300 hover:underline"
          >
            {primaryCoordinate.lat.toFixed(5)},{" "}
            {primaryCoordinate.lng.toFixed(5)} →
          </Link>
        </div>

        {weatherSourceState?.available && primaryWeather ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div className="rounded-xl border border-white/5 bg-zinc-900/70 p-3">
              <span className="text-zinc-400 block">Temperature</span>
              <strong className="text-sm text-white mt-0.5 block">
                {cToF(primaryWeather.temperature_2m)}
              </strong>
              <span className="text-[11px] text-zinc-400">
                Feels like {cToF(primaryWeather.apparent_temperature)}
              </span>
            </div>
            <div className="rounded-xl border border-white/5 bg-zinc-900/70 p-3">
              <span className="text-zinc-400 block">Condition & Wind</span>
              <strong className="text-sm text-white mt-0.5 block">
                {primaryWeather.description || "Observed"}
              </strong>
              <span className="text-[11px] text-zinc-400">
                Wind {kphToMph(primaryWeather.wind_speed_10m)}
              </span>
            </div>
            <div className="rounded-xl border border-white/5 bg-zinc-900/70 p-3">
              <span className="text-zinc-400 block">
                Air Quality & Model Snow
              </span>
              <strong className="text-sm text-white mt-0.5 block">
                US AQI: {primaryAqi?.us_aqi ?? "Unavailable"}
              </strong>
              <span className="text-[11px] text-zinc-400">
                Grid Snow:{" "}
                {primarySnowDepthM != null
                  ? `${(primarySnowDepthM * 39.37).toFixed(1)} in (${primarySnowDepthM.toFixed(2)} m)`
                  : "0.0 in"}
              </span>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-rose-500/40 bg-rose-950/30 p-4 text-xs text-rose-200">
            <strong>Weather Feed Unavailable / Unverified:</strong> Upstream
            Open-Meteo weather observation is currently unreachable (
            {weatherSourceState?.error ||
              primaryTelemetry.fetchError ||
              refreshError ||
              "timeout"}
            ). Do not interpret missing telemetry as favorable weather.
          </div>
        )}

        {/* NWS Alerts Status with Explicit Non-All-Clear Language */}
        <div className="rounded-xl border border-white/10 bg-zinc-900/60 p-3.5 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-white">
              U.S. National Weather Service (NWS) Point Alerts
            </span>
            <span className="text-[11px] font-mono text-zinc-400">
              {nwsSourceState?.available
                ? `Checked ${new Date(nwsSourceState.checkedAt).toISOString().slice(0, 16)}Z${isStale ? " (Stale)" : ""}`
                : "Source Unavailable"}
            </span>
          </div>
          {!nwsSourceState?.available ? (
            <p className="text-xs text-amber-300 font-semibold">
              ⚠ NWS Alert Feed Unavailable ({nwsSourceState?.error || refreshError || "timeout"}
              ) — Status Unverified (Not an All-Clear). Check weather.gov
              directly.
            </p>
          ) : primaryAlerts.length > 0 ? (
            <ul className="space-y-2">
              {primaryAlerts.slice(0, 3).map((alert: any, idx: number) => (
                <li
                  key={alert.id || idx}
                  className="rounded-lg border border-amber-500/40 bg-amber-950/40 p-2.5 text-xs text-amber-100"
                >
                  <strong>{alert.event}:</strong> {alert.headline}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-zinc-300">
              0 active NWS weather warnings at check time.{" "}
              <span className="text-zinc-400">
                (Note: 0 weather alerts does not confirm venue opening, road
                traction status, or marine/trail safety.)
              </span>
            </p>
          )}
        </div>

        {/* Extra Marine / Aviation Telemetry when applicable (e.g. Juneau PAJN & Tides) */}
        {(coopsStations.length > 0 || aviationStations.length > 0) && (
          <div className="grid gap-2.5 sm:grid-cols-2 text-xs pt-1">
            {coopsStations[0] && (
              <div className="rounded-lg border border-cyan-500/20 bg-cyan-950/20 p-3">
                <span className="font-bold text-cyan-300 block">
                  NOAA CO-OPS Tide Station ({coopsStations[0].name})
                </span>
                <span className="text-zinc-200 mt-1 block">
                  Latest MLLW Water Level:{" "}
                  {coopsStations[0].observation?.v
                    ? `${coopsStations[0].observation.v} m`
                    : "See station link"}
                </span>
                <a
                  href={coopsStations[0].pageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-cyan-300 underline mt-1 inline-block"
                >
                  NOAA Station {coopsStations[0].id} ↗
                </a>
              </div>
            )}
            {aviationStations[0] && (
              <div className="rounded-lg border border-sky-500/20 bg-sky-950/20 p-3">
                <span className="font-bold text-sky-300 block">
                  NOAA Aviation METAR ({aviationStations[0].airport?.icao})
                </span>
                <span className="text-zinc-200 mt-1 block font-mono text-[11px] break-words">
                  {aviationStations[0].metar?.rawOb ||
                    `Flight Cat: ${aviationStations[0].metar?.fltCat || "Reported"}`}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Secondary / Comparison Coordinate Card + Official External Status Links */}
      <div className="rounded-2xl border border-white/10 bg-zinc-950 p-5 flex flex-col justify-between space-y-4">
        {secondaryCoordinate && secondaryTelemetry?.core ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 block">
                  Nearby Comparison Point ({secondaryCoordinate.elevationFt.toLocaleString()} ft)
                </span>
                <h3 className="text-base font-bold text-white">
                  {secondaryCoordinate.label}
                </h3>
              </div>
              <Link
                href={secondaryCoordinate.canonicalLocationPath}
                className="text-xs font-mono text-indigo-300 hover:underline"
              >
                {secondaryCoordinate.lat.toFixed(5)},{" "}
                {secondaryCoordinate.lng.toFixed(5)} →
              </Link>
            </div>
            <p className="text-xs text-zinc-400">
              {secondaryCoordinate.roleInPlace}
            </p>
            {secondaryTelemetry.core.now?.weather ? (
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl border border-white/5 bg-zinc-900/70 p-3">
                  <span className="text-zinc-400 block">Temperature</span>
                  <strong className="text-sm text-white mt-0.5 block">
                    {cToF(secondaryTelemetry.core.now.weather.temperature_2m)}
                  </strong>
                  <span className="text-[11px] text-zinc-400">
                    {secondaryTelemetry.core.now.weather.description || "Observed"}
                  </span>
                </div>
                <div className="rounded-xl border border-white/5 bg-zinc-900/70 p-3">
                  <span className="text-zinc-400 block">Wind & Active Alerts</span>
                  <strong className="text-sm text-white mt-0.5 block">
                    {kphToMph(secondaryTelemetry.core.now.weather.wind_speed_10m)}
                  </strong>
                  <span className="text-[11px] text-zinc-400">
                    NWS Alerts: {secondaryTelemetry.core.hazards?.alerts?.length ?? 0}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-amber-300">
                Companion coordinate telemetry temporarily unavailable.
              </p>
            )}
          </div>
        ) : null}

        {/* What Requires Official External Verification */}
        <div className="space-y-3 pt-2 border-t border-white/10">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300">
              Official Operational Status (Linked — Not Automated)
            </h4>
            <IntegrationBadge status="linked_official_resource" />
          </div>
          <div className="space-y-2.5">
            {whatRequiresOfficialExternalCheck.map((item) => (
              <div
                key={item.capability}
                className="rounded-xl border border-white/10 bg-zinc-900/70 p-3 text-xs space-y-1.5"
              >
                <div className="font-bold text-white">{item.capability}</div>
                <p className="text-zinc-300 leading-relaxed">
                  {item.whyNotAutomated}
                </p>
                <a
                  href={item.officialSourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-cyan-300 font-semibold hover:underline pt-0.5"
                >
                  <span>Check Official Authority: {item.officialSourceLabel}</span>
                  <span aria-hidden="true">↗</span>
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
