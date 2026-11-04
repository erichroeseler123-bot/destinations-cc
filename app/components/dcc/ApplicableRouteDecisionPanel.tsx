"use client";

import { useState } from "react";
import type { CompiledApplicableDecisionOutcome } from "@/lib/dcc/applicability";

export interface InitialOpaqueAttribution {
  clickId: string;
  outboundPartnerUrl: string;
  recommendedOperatorId: string;
  recommendedOperatorName: string | null;
}

interface ApplicableRouteDecisionPanelProps {
  initialOutcome: CompiledApplicableDecisionOutcome;
  initialOpaqueAttribution: InitialOpaqueAttribution;
  basePartnerDestinationUrl: string;
}

export default function ApplicableRouteDecisionPanel({
  initialOutcome,
  initialOpaqueAttribution,
  basePartnerDestinationUrl,
}: ApplicableRouteDecisionPanelProps) {
  const [outcome, setOutcome] =
    useState<CompiledApplicableDecisionOutcome>(initialOutcome);
  const [opaqueAttribution, setOpaqueAttribution] =
    useState<InitialOpaqueAttribution>(initialOpaqueAttribution);
  const [destination, setDestination] = useState<string>(
    initialOutcome.corridorId === "corridor:denver-breckenridge-i70"
      ? "Breckenridge"
      : "Vail",
  );
  const [direction, setDirection] = useState<"OUTBOUND" | "RETURN">(
    initialOutcome.gosnoPricingSnapshot?.matchedDirection ?? "OUTBOUND",
  );
  const [simulateFeedState, setSimulateFeedState] = useState<
    "live" | "unavailable_feed" | "invalid_data" | "expired_snapshot"
  >("live");
  const [travelDate, setTravelDate] = useState<string>(
    initialOutcome.normalizedInputs.travelDate,
  );
  const [passengerCount, setPassengerCount] = useState<number>(
    initialOutcome.normalizedInputs.passengerCount,
  );
  const [standardBagCount, setStandardBagCount] = useState<number>(
    initialOutcome.normalizedInputs.standardBagCount,
  );
  const [skiOrOversizeBagCount, setSkiOrOversizeBagCount] = useState<number>(
    initialOutcome.normalizedInputs.skiOrOversizeBagCount,
  );
  const [vailPassChainLawActive, setVailPassChainLawActive] = useState<boolean>(
    Boolean(
      initialOutcome.normalizedInputs.activeSegmentConditions
        .vailPassChainLawActive,
    ),
  );
  const [i70TractionLawActive, setI70TractionLawActive] = useState<boolean>(
    Boolean(
      initialOutcome.normalizedInputs.activeSegmentConditions
        .i70TractionLawActive,
    ),
  );
  const [isCompiling, setIsCompiling] = useState<boolean>(false);

  async function recompileOnServer(nextParams: {
    destination?: string;
    direction?: "OUTBOUND" | "RETURN";
    simulateFeedState?:
      | "live"
      | "unavailable_feed"
      | "invalid_data"
      | "expired_snapshot";
    travelDate?: string;
    passengerCount: number;
    standardBagCount: number;
    skiOrOversizeBagCount: number;
    vailPassChainLawActive: boolean;
    i70TractionLawActive: boolean;
  }) {
    setIsCompiling(true);
    try {
      const nextDestination = nextParams.destination ?? destination;
      const nextDirection = nextParams.direction ?? direction;
      const nextFeedState = nextParams.simulateFeedState ?? simulateFeedState;
      const nextTravelDate = nextParams.travelDate ?? travelDate;
      const airport = nextDestination === "Big Sky" ? "BZN" : "DEN";
      const reqOrigin =
        nextDirection === "RETURN" ? nextDestination : airport;
      const reqDest =
        nextDirection === "RETURN" ? airport : nextDestination;

      const res = await fetch("/api/v1/applicability/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          corridorId: outcome.corridorId,
          direction: nextDirection,
          origin: reqOrigin,
          destination: reqDest,
          travelDate: nextTravelDate,
          passengerCount: nextParams.passengerCount,
          standardBagCount: nextParams.standardBagCount,
          skiOrOversizeBagCount: nextParams.skiOrOversizeBagCount,
          partnerDestinationUrl: basePartnerDestinationUrl,
          partnerNetwork: "direct",
          simulateFeedState: nextFeedState,
          activeSegmentConditions: {
            vailPassChainLawActive: nextParams.vailPassChainLawActive,
            i70TractionLawActive: nextParams.i70TractionLawActive,
          },
        }),
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.ok && data.outcome && data.opaqueAttribution) {
        setOutcome(data.outcome);
        setOpaqueAttribution(data.opaqueAttribution);
      }
    } finally {
      setIsCompiling(false);
    }
  }

  const gosnoSnap = outcome.gosnoPricingSnapshot;

  return (
    <section
      aria-label="Deterministic Context & Applicability Compiler"
      className="rounded-3xl border border-cyan-400/25 bg-slate-950/90 p-6 md:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.45)]"
      data-testid="applicable-route-decision-panel"
      data-model-version={outcome.modelVersion}
      data-compiler-version={outcome.compilerVersion}
      data-evidence-version={outcome.evidenceVersion}
      data-opaque-click-id={opaqueAttribution.clickId}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-300 font-semibold">
            Context &amp; Applicability Engine · Server-Compiled Decision
          </p>
          <h2 className="mt-1 text-xl md:text-2xl font-black text-white">
            Segment, Cargo &amp; Seasonal Regulation Outcome
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-slate-300">
          <span className="rounded-full border border-white/15 bg-white/[0.04] px-2.5 py-1">
            {outcome.modelVersion}
          </span>
          <span className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2.5 py-1 text-cyan-200">
            click_id: {opaqueAttribution.clickId}
          </span>
        </div>
      </div>

      {/* GoSno Route-Feed Snapshot Provenance & Freshness Banner */}
      {gosnoSnap && (
        <div
          data-testid="gosno-route-feed-snapshot-banner"
          data-freshness-status={gosnoSnap.freshnessStatus}
          data-matched-route-id={gosnoSnap.matchedRouteId || ""}
          className={`mt-4 rounded-2xl border p-3.5 text-xs ${
            gosnoSnap.freshnessStatus === "expired"
              ? "border-rose-400/40 bg-rose-950/30 text-rose-100"
              : gosnoSnap.freshnessStatus === "retained_after_failed_refresh"
                ? "border-amber-400/40 bg-amber-950/30 text-amber-100"
                : "border-emerald-400/30 bg-emerald-950/20 text-emerald-100"
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-bold uppercase tracking-wider">
              GoSno Route-Feed Snapshot ({gosnoSnap.freshnessStatus}) · Route:{" "}
              <code className="font-mono text-white">
                {gosnoSnap.matchedRouteId}
              </code>
            </span>
            <span className="font-mono text-[11px] opacity-90">
              {gosnoSnap.snapshotId} · {gosnoSnap.ageLabel}
            </span>
          </div>
          <p className="mt-1 leading-relaxed" data-testid="gosno-snapshot-status-text">
            {gosnoSnap.statusBanner}
          </p>
          <div className="mt-2 flex flex-wrap gap-3 font-mono text-[11px]">
            <span data-testid="gosno-matched-suv-fare">
              SUV ({gosnoSnap.suvOffer?.offerId ?? "unmatched"}):{" "}
              <strong>
                {gosnoSnap.suvOffer?.priceDisplay ??
                  gosnoSnap.priceFallbackMessage}
              </strong>
            </span>
            <span data-testid="gosno-matched-van-fare">
              Van ({gosnoSnap.vanOffer?.offerId ?? "unmatched"}):{" "}
              <strong>
                {gosnoSnap.vanOffer?.priceDisplay ??
                  gosnoSnap.priceFallbackMessage}
              </strong>
              {gosnoSnap.vanOffer?.quoteOnly ? " (quote required)" : ""}
            </span>
          </div>
        </div>
      )}

      {/* Trip Constraint Inputs sent to Deterministic Backend Compiler */}
      <div className="mt-5 grid gap-4 md:grid-cols-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
        <label className="block text-xs text-slate-300">
          <span className="font-semibold uppercase tracking-wider text-slate-400">
            Destination
          </span>
          <select
            data-testid="applicability-destination-select"
            value={destination}
            onChange={(e) => {
              const nextDest = e.target.value;
              setDestination(nextDest);
              void recompileOnServer({
                destination: nextDest,
                direction,
                simulateFeedState,
                travelDate,
                passengerCount,
                standardBagCount,
                skiOrOversizeBagCount,
                vailPassChainLawActive,
                i70TractionLawActive,
              });
            }}
            className="mt-1.5 w-full rounded-lg border border-white/15 bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white"
          >
            {[
              "Vail",
              "Breckenridge",
              "Winter Park",
              "Steamboat Springs",
              "Copper Mountain",
              "Keystone",
              "Beaver Creek",
              "Aspen",
              "Snowmass",
              "Crested Butte",
              "Big Sky",
            ].map((destName) => (
              <option key={destName} value={destName}>
                {destName}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-xs text-slate-300">
          <span className="font-semibold uppercase tracking-wider text-slate-400">
            Direction
          </span>
          <select
            data-testid="applicability-direction-select"
            value={direction}
            onChange={(e) => {
              const nextDir = e.target.value as "OUTBOUND" | "RETURN";
              setDirection(nextDir);
              void recompileOnServer({
                destination,
                direction: nextDir,
                simulateFeedState,
                travelDate,
                passengerCount,
                standardBagCount,
                skiOrOversizeBagCount,
                vailPassChainLawActive,
                i70TractionLawActive,
              });
            }}
            className="mt-1.5 w-full rounded-lg border border-white/15 bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white"
          >
            <option value="OUTBOUND">Airport → Resort (Outbound)</option>
            <option value="RETURN">Resort → Airport (Return)</option>
          </select>
        </label>

        <label className="block text-xs text-slate-300">
          <span className="font-semibold uppercase tracking-wider text-slate-400">
            Passengers
          </span>
          <input
            type="number"
            min={1}
            max={50}
            value={passengerCount}
            onChange={(e) => {
              const next = Math.max(1, Math.min(50, Number(e.target.value) || 1));
              setPassengerCount(next);
              void recompileOnServer({
                destination,
                direction,
                simulateFeedState,
                travelDate,
                passengerCount: next,
                standardBagCount,
                skiOrOversizeBagCount,
                vailPassChainLawActive,
                i70TractionLawActive,
              });
            }}
            className="mt-1.5 w-full rounded-lg border border-white/15 bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white"
          />
        </label>

        <label className="block text-xs text-slate-300">
          <span className="font-semibold uppercase tracking-wider text-slate-400">
            Feed Snapshot State
          </span>
          <select
            data-testid="applicability-feed-state-select"
            value={simulateFeedState}
            onChange={(e) => {
              const nextState = e.target.value as
                | "live"
                | "unavailable_feed"
                | "invalid_data"
                | "expired_snapshot";
              setSimulateFeedState(nextState);
              void recompileOnServer({
                destination,
                direction,
                simulateFeedState: nextState,
                travelDate,
                passengerCount,
                standardBagCount,
                skiOrOversizeBagCount,
                vailPassChainLawActive,
                i70TractionLawActive,
              });
            }}
            className="mt-1.5 w-full rounded-lg border border-white/15 bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white"
          >
            <option value="live">Live Valid Snapshot</option>
            <option value="unavailable_feed">Unavailable Feed (Retain Last Valid)</option>
            <option value="invalid_data">Invalid Feed Data (Retain Last Valid)</option>
            <option value="expired_snapshot">Expired Snapshot (Fallback)</option>
          </select>
        </label>

        <label className="block text-xs text-slate-300">
          <span className="font-semibold uppercase tracking-wider text-slate-400">
            Standard Bags
          </span>
          <input
            type="number"
            min={0}
            max={50}
            value={standardBagCount}
            onChange={(e) => {
              const next = Math.max(0, Math.min(50, Number(e.target.value) || 0));
              setStandardBagCount(next);
              void recompileOnServer({
                destination,
                direction,
                simulateFeedState,
                travelDate,
                passengerCount,
                standardBagCount: next,
                skiOrOversizeBagCount,
                vailPassChainLawActive,
                i70TractionLawActive,
              });
            }}
            className="mt-1.5 w-full rounded-lg border border-white/15 bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white"
          />
        </label>

        <label className="block text-xs text-slate-300">
          <span className="font-semibold uppercase tracking-wider text-slate-400">
            Ski / Snowboard Bags
          </span>
          <input
            type="number"
            min={0}
            max={50}
            value={skiOrOversizeBagCount}
            onChange={(e) => {
              const next = Math.max(0, Math.min(50, Number(e.target.value) || 0));
              setSkiOrOversizeBagCount(next);
              void recompileOnServer({
                destination,
                direction,
                simulateFeedState,
                travelDate,
                passengerCount,
                standardBagCount,
                skiOrOversizeBagCount: next,
                vailPassChainLawActive,
                i70TractionLawActive,
              });
            }}
            className="mt-1.5 w-full rounded-lg border border-white/15 bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white"
          />
        </label>

        <label className="flex items-center gap-2.5 text-xs text-slate-200 pt-4">
          <input
            type="checkbox"
            checked={i70TractionLawActive}
            onChange={(e) => {
              const next = e.target.checked;
              setI70TractionLawActive(next);
              void recompileOnServer({
                destination,
                direction,
                simulateFeedState,
                travelDate,
                passengerCount,
                standardBagCount,
                skiOrOversizeBagCount,
                vailPassChainLawActive,
                i70TractionLawActive: next,
              });
            }}
            className="h-4 w-4 rounded border-white/20 bg-slate-900 text-cyan-400"
          />
          <span>I-70 Traction Law (Code 15)</span>
        </label>

        <label className="flex items-center gap-2.5 text-xs text-amber-200 pt-4">
          <input
            type="checkbox"
            checked={vailPassChainLawActive}
            onChange={(e) => {
              const next = e.target.checked;
              setVailPassChainLawActive(next);
              void recompileOnServer({
                destination,
                direction,
                simulateFeedState,
                travelDate,
                passengerCount,
                standardBagCount,
                skiOrOversizeBagCount,
                vailPassChainLawActive: next,
                i70TractionLawActive,
              });
            }}
            className="h-4 w-4 rounded border-amber-400/40 bg-slate-900 text-amber-400"
          />
          <span className="font-semibold">Vail Pass Chain Law (Code 16/18)</span>
        </label>
      </div>

      {/* Strictly Rendered Server-Compiled Outcome Summary */}
      <div className="mt-5 rounded-2xl border border-cyan-400/20 bg-cyan-950/20 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">
            Compiled Decision Outcome {isCompiling ? "(Recompiling...)" : ""}
          </span>
          <span className="text-xs font-mono text-slate-400">
            Total Bags: {outcome.normalizedInputs.totalBagCount}
          </span>
        </div>
        <p
          className="mt-2 text-sm md:text-base leading-relaxed text-slate-100 font-medium"
          data-testid="compiled-decision-summary"
        >
          {outcome.compiledDecisionSummary.headline}
        </p>
        <p className="mt-2 text-xs leading-relaxed text-slate-300">
          {outcome.compiledDecisionSummary.baggageEnvelopeResolution}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-cyan-200">
          {outcome.compiledDecisionSummary.pricingDisposition}
        </p>
      </div>

      {/* GoSno Multi-Vehicle Private Group Inquiry Option when passengerCount > 10 */}
      {outcome.privateGroupInquiryOption && (
        <div
          className="mt-5 rounded-2xl border border-amber-400/35 bg-amber-500/10 p-5 space-y-3"
          data-testid="gosno-private-group-inquiry-card"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
              Private Group Transfer (&gt;10 Passengers · Exceeds Single-Vehicle Cap)
            </span>
            <span className="rounded-full border border-amber-400/30 bg-amber-400/15 px-2.5 py-0.5 text-[11px] font-bold uppercase text-amber-200">
              {outcome.privateGroupInquiryOption.nextStep}
            </span>
          </div>
          <p className="text-sm text-slate-100">
            For <strong>{outcome.privateGroupInquiryOption.passengers} passengers</strong> ({outcome.privateGroupInquiryOption.origin} → {outcome.privateGroupInquiryOption.destination} on {outcome.privateGroupInquiryOption.outboundDate}, {outcome.privateGroupInquiryOption.luggageSummary}), DCC suggests{" "}
            <strong data-testid="gosno-panel-group-suggestion">
              {outcome.privateGroupInquiryOption.vehicleSuggestion.summaryLabel}
            </strong>{" "}
            ({outcome.privateGroupInquiryOption.vehicleSuggestion.shortLabel}).{" "}
            <strong>{outcome.privateGroupInquiryOption.confirmationPolicy}</strong>
          </p>
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <span
              className="text-xs text-amber-200/90"
              data-testid="gosno-group-estimate-display"
            >
              {outcome.privateGroupInquiryOption.referenceCombinedOneWayUsd !==
              null
                ? `Reference combined one-way rate: $${outcome.privateGroupInquiryOption.referenceCombinedOneWayUsd}`
                : `${outcome.privateGroupInquiryOption.priceDisplay} (quote required — no numeric estimate)`}
            </span>
            <a
              href={outcome.privateGroupInquiryOption.inquiryUrl}
              data-testid="gosno-private-group-inquiry-link"
              target="_blank"
              rel="sponsored noopener noreferrer"
              className="inline-flex items-center justify-center rounded-xl bg-amber-400 px-4 py-2 text-xs font-black uppercase tracking-wider text-slate-950 transition hover:bg-amber-300"
            >
              Request GoSno Group Quote ({outcome.privateGroupInquiryOption.vehicleSuggestion.shortLabel}) →
            </a>
          </div>
        </div>
      )}

      {/* Strictly Rendered Geographic Segment Constraints */}
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {outcome.compiledSegmentConstraints.map((seg) => (
          <div
            key={seg.segmentId}
            className={`rounded-2xl border p-4 ${
              seg.compiledSegmentStatus === "active_chain_law_enforcement"
                ? "border-amber-400/35 bg-amber-500/10"
                : seg.compiledSegmentStatus === "active_traction_law"
                  ? "border-cyan-400/25 bg-white/[0.03]"
                  : "border-white/10 bg-white/[0.02]"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-white">{seg.segmentName}</h3>
              <span className="rounded-full border border-white/15 px-2 py-0.5 text-[10px] font-mono uppercase text-slate-300">
                {seg.compiledSegmentStatus}
              </span>
            </div>
            <ul className="mt-2 space-y-1 text-xs leading-relaxed text-slate-200">
              {seg.compiledDirectives.map((directive, idx) => (
                <li key={idx}>• {directive}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Strictly Rendered Vehicle Class Evaluations */}
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {outcome.vehicleClassEvaluations.map((veh) => (
          <div
            key={veh.vehicleClassId}
            data-testid={`vehicle-eval-${veh.vehicleClassId}`}
            className={`rounded-2xl border p-4 ${
              veh.vehicleClassId === outcome.recommendedVehicleClassId
                ? "border-emerald-400/40 bg-emerald-500/10"
                : veh.disposition === "ineligible"
                  ? "border-rose-400/25 bg-rose-950/20 opacity-85"
                  : "border-white/10 bg-white/[0.02]"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-bold text-white">
                {veh.displayName}
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase ${
                  veh.disposition === "recommended"
                    ? "bg-emerald-400/20 text-emerald-200"
                    : veh.disposition === "ineligible"
                      ? "bg-rose-500/20 text-rose-200"
                      : "bg-amber-400/20 text-amber-200"
                }`}
              >
                {veh.disposition}
              </span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-200">
              {veh.compiledReason}
            </p>
            <p
              className="mt-1 text-[11px] text-slate-400"
              data-testid={`vehicle-pricing-note-${veh.vehicleClassId}`}
            >
              {veh.pricingResolution.compiledPricingNote}
            </p>
            {veh.pricingResolution.matchedOfferId && (
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-2 text-[11px]">
                <span className="font-mono text-slate-300">
                  Offer:{" "}
                  <strong className="text-white">
                    {veh.pricingResolution.matchedOfferId}
                  </strong>{" "}
                  ·{" "}
                  <strong className="text-cyan-200">
                    {veh.pricingResolution.priceDisplay}
                  </strong>
                </span>
                {veh.pricingResolution.quoteOnly &&
                  veh.pricingResolution.quoteUrl && (
                    <a
                      href={veh.pricingResolution.quoteUrl}
                      target="_blank"
                      rel="sponsored noopener noreferrer"
                      data-testid={`vehicle-quote-link-${veh.vehicleClassId}`}
                      className="font-semibold text-amber-300 underline hover:text-amber-200"
                    >
                      Request Quote / Confirm Availability →
                    </a>
                  )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Outbound Partner Link with Opaque click_id (Never Exposing Receipt ID) */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-5">
        <div className="text-xs text-slate-400 space-y-1">
          <p>
            Recommended Operator:{" "}
            <strong className="text-slate-200">
              {opaqueAttribution.recommendedOperatorName ??
                opaqueAttribution.recommendedOperatorId}
            </strong>
          </p>
          <p className="font-mono text-[11px] text-slate-400">
            Outbound attribution uses opaque{" "}
            <code className="text-cyan-300">
              click_id={opaqueAttribution.clickId}
            </code>{" "}
            (decision receipt kept internal to DCC ledger).
          </p>
        </div>

        <a
          href={opaqueAttribution.outboundPartnerUrl}
          data-testid="opaque-partner-booking-link"
          data-click-id={opaqueAttribution.clickId}
          rel="sponsored noopener noreferrer"
          className="inline-flex items-center justify-center rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-slate-950 transition hover:bg-cyan-300"
        >
          Book Compiled Vehicle Class →
        </a>
      </div>
    </section>
  );
}

