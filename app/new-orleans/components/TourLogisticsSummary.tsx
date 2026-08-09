"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { TourRecord } from "../lib/tourRecommendationRules";
import { OFFICIAL_TOUR_FACTS } from "../data/officialTourFacts";

interface Props {
  tourRecord?: TourRecord;
}

export default function TourLogisticsSummary({ tourRecord }: Props) {
  const pathname = usePathname();
  const slug = pathname.split("/").filter(Boolean).pop() || "";
  const official = OFFICIAL_TOUR_FACTS[slug];

  if (!tourRecord && !official) {
    return (
      <div className="bg-[#1a1a1a] p-8 border border-[#2a2a2a]">
        <h2 className="text-xl font-[var(--font-accent)] font-bold text-[#fdfbf7] mb-4 border-b border-[#2a2a2a] pb-4">
          Logistics & Format
        </h2>
        <div className="text-sm text-[#cccccc] leading-relaxed">
          <p className="mb-4">Logistics details are currently being verified for this experience.</p>
          <p>Please review duration, transportation, accessibility, and other logistics directly in the operator checkout.</p>
        </div>
      </div>
    );
  }

  const duration = official?.duration || tourRecord?.verifiedDurationLabel || "Confirm timing during booking.";
  const completeTime = official?.completeTime || tourRecord?.verifiedTimeCommitmentLabel || "Complete time commitment varies. Confirm during checkout.";
  const transportation = official?.transportation || tourRecord?.transportationAvailable || "Confirm in checkout";
  const pace = official?.pace || tourRecord?.pace || "Verify with operator";
  const weatherExposure = official?.weatherExposure || tourRecord?.weatherExposure || "Varies by selected option";
  const noiseLevel = official?.noiseLevel || tourRecord?.noiseLevel || "Verify with operator";

  return (
    <div className="bg-[#1a1a1a] p-8 border border-[#2a2a2a]">
      <h2 className="text-xl font-[var(--font-accent)] font-bold text-[#fdfbf7] mb-4 border-b border-[#2a2a2a] pb-4">
        Logistics & Format
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <h3 className="text-[10px] font-bold text-[#fdfbf7] uppercase tracking-widest mb-2">Experience Duration</h3>
          <p className="text-[#cccccc] text-sm leading-relaxed">{duration}</p>
        </div>
        <div>
          <h3 className="text-[10px] font-bold text-[#fdfbf7] uppercase tracking-widest mb-2">Complete Time Commitment</h3>
          <p className="text-[#cccccc] text-sm leading-relaxed">{completeTime}</p>
        </div>
        <div>
          <h3 className="text-[10px] font-bold text-[#fdfbf7] uppercase tracking-widest mb-2">Transportation</h3>
          <p className="text-[#cccccc] text-sm leading-relaxed">{transportation}</p>
        </div>
        <div>
          <h3 className="text-[10px] font-bold text-[#fdfbf7] uppercase tracking-widest mb-2">Pace</h3>
          <p className="text-[#cccccc] text-sm leading-relaxed">{pace}</p>
        </div>
        <div>
          <h3 className="text-[10px] font-bold text-[#fdfbf7] uppercase tracking-widest mb-2">Weather Exposure</h3>
          <p className="text-[#cccccc] text-sm leading-relaxed">{weatherExposure}</p>
        </div>
        <div>
          <h3 className="text-[10px] font-bold text-[#fdfbf7] uppercase tracking-widest mb-2">Noise Level</h3>
          <p className="text-[#cccccc] text-sm leading-relaxed">{noiseLevel}</p>
        </div>
      </div>
      <div className="mt-6 pt-4 border-t border-[#2a2a2a]">
        <p className="text-[#aaaaaa] text-[11px] leading-relaxed italic">
          {official ? `${official.sourceLabel}. ` : ""}Live operator checkout remains controlling for current availability, policies, and schedule changes.
        </p>
      </div>
    </div>
  );
}
