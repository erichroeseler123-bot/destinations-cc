"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { TourRecord } from "../lib/tourRecommendationRules";
import { getGovernedExperienceGraphRecord } from "../data/experienceGraphGovernance";
import type { Fact, TimeRange } from "../data/experienceGraphV2";

interface Props {
  tourRecord?: TourRecord;
}

function timeRangeLabel(fact: Fact<TimeRange>) {
  const value = fact.value;
  if (!value) return null;
  if (value.min && value.max) return value.min === value.max ? `${value.min} minutes` : `${value.min}–${value.max} minutes`;
  if (value.typical) return `About ${value.typical} minutes`;
  if (value.min) return `At least ${value.min} minutes`;
  if (value.max) return `Up to ${value.max} minutes`;
  return null;
}

function booleanLabel(value: boolean | null, yes: string, no: string) {
  if (value === true) return yes;
  if (value === false) return no;
  return null;
}

function humanize(value: string | null) {
  return value ? value.replaceAll("_", " ") : null;
}

function sourceLabel(source: string, reviewedAt: string | null) {
  const label = source === "operator"
    ? "Operator verified"
    : source === "fareharbor"
      ? "FareHarbor verified"
      : source === "editorial"
        ? "WNO editorial assessment"
        : source === "existing_wno_record"
          ? "Existing WNO record"
          : "Unverified";
  return reviewedAt ? `${label} · reviewed ${reviewedAt}` : label;
}

export default function TourLogisticsSummary({ tourRecord }: Props) {
  const pathname = usePathname();
  const slug = pathname.split("/").filter(Boolean).pop() || "";
  const graph = getGovernedExperienceGraphRecord(slug);

  if (!graph) {
    return (
      <div className="bg-[#1a1a1a] p-8 border border-[#2a2a2a]">
        <h2 className="text-xl font-[var(--font-accent)] font-bold text-[#fdfbf7] mb-4 border-b border-[#2a2a2a] pb-4">Logistics & Format</h2>
        <p className="text-sm text-[#cccccc] leading-relaxed">Logistics details are currently being verified. Confirm duration, transportation, accessibility, eligibility and other operating details in the operator checkout.</p>
      </div>
    );
  }

  const activityTime = timeRangeLabel(graph.activityMinutes);
  const pickupTime = timeRangeLabel(graph.doorToDoorWithPickupMinutes);
  const selfDriveTime = timeRangeLabel(graph.doorToDoorSelfDriveMinutes);
  const transportation = [
    booleanLabel(graph.pickupFrenchQuarter.value, "French Quarter pickup available", "No French Quarter pickup"),
    booleanLabel(graph.selfDriveAvailable.value, "Self-drive option available", "No self-drive option"),
  ].filter(Boolean).join(" · ") || null;

  const facts = [
    { label: "Experience duration", value: activityTime, fact: graph.activityMinutes },
    { label: "Door-to-door with pickup", value: pickupTime, fact: graph.doorToDoorWithPickupMinutes },
    { label: "Door-to-door self-drive", value: selfDriveTime, fact: graph.doorToDoorSelfDriveMinutes },
    { label: "Transportation", value: transportation, fact: graph.pickupFrenchQuarter.value !== null ? graph.pickupFrenchQuarter : graph.selfDriveAvailable },
    { label: "Physical intensity", value: humanize(graph.physicalIntensity.value), fact: graph.physicalIntensity },
    { label: "Weather exposure", value: humanize(graph.rainExposure.value), fact: graph.rainExposure },
    { label: "Heat exposure", value: humanize(graph.heatExposure.value), fact: graph.heatExposure },
    { label: "Noise level", value: humanize(graph.noiseLevel.value), fact: graph.noiseLevel },
    { label: "Minimum age", value: graph.minimumAge.value === null ? null : graph.minimumAge.value === 0 ? "All ages" : `${graph.minimumAge.value}+`, fact: graph.minimumAge },
    { label: "Stairs required", value: booleanLabel(graph.stairsRequired.value, "Yes", "No"), fact: graph.stairsRequired },
    { label: "Bathroom access", value: humanize(graph.bathroomAccess.value), fact: graph.bathroomAccess },
    { label: "Shade", value: humanize(graph.shadeCoverage.value), fact: graph.shadeCoverage },
  ];

  const fallbackDuration = tourRecord?.verifiedDurationLabel;

  return (
    <div className="bg-[#1a1a1a] p-8 border border-[#2a2a2a]">
      <div className="flex flex-col gap-2 border-b border-[#2a2a2a] pb-4 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="text-xl font-[var(--font-accent)] font-bold text-[#fdfbf7]">Verified logistics & format</h2>
        <span className={`text-[10px] font-bold uppercase tracking-widest ${graph.verificationStatus === "NEEDS_VERIFICATION" ? "text-[#b9a06b]" : "text-[#d4af37]"}`}>
          {graph.verificationStatus === "NEEDS_VERIFICATION" ? "Verification in progress" : "Governed Experience Graph"}
        </span>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
        {facts.map(({ label, value, fact }) => (
          <div key={label}>
            <h3 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]">{label}</h3>
            <p className="text-sm leading-relaxed text-[#cccccc]">{value || (label === "Experience duration" && fallbackDuration) || "Not yet verified"}</p>
            <p className="mt-1 text-[10px] leading-4 text-[#777]">{value ? sourceLabel(fact.source, fact.reviewedAt) : "Unknown is intentionally not guessed."}</p>
          </div>
        ))}
      </div>

      {graph.constraints.length > 0 && (
        <div className="mt-7 border-t border-[#2a2a2a] pt-5">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#d4af37]">Verified eligibility constraints</h3>
          <div className="mt-3 space-y-2">
            {graph.constraints.map((constraint) => (
              <p key={constraint.key} className="text-sm leading-6 text-[#cccccc]"><strong className="text-[#fdfbf7]">{constraint.label}:</strong> {constraint.reason}</p>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 border-t border-[#2a2a2a] pt-4">
        <p className="text-[11px] italic leading-relaxed text-[#aaaaaa]">Current operator checkout remains controlling for live availability, selected variants, prices, schedules, policies and any operational changes.</p>
      </div>
    </div>
  );
}
