import React from "react";
import { TourRecord } from "../lib/tourRecommendationRules";

interface Props {
  tourRecord?: TourRecord;
}

export default function TourLogisticsSummary({ tourRecord }: Props) {
  if (!tourRecord) {
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

  return (
    <div className="bg-[#1a1a1a] p-8 border border-[#2a2a2a]">
      <h2 className="text-xl font-[var(--font-accent)] font-bold text-[#fdfbf7] mb-4 border-b border-[#2a2a2a] pb-4">
        Logistics & Format
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <h3 className="text-[10px] font-bold text-[#fdfbf7] uppercase tracking-widest mb-2">Experience Duration</h3>
          <p className="text-[#cccccc] text-sm leading-relaxed">
            {tourRecord.verifiedDurationLabel || "Confirm timing during booking."}
          </p>
        </div>
        <div>
          <h3 className="text-[10px] font-bold text-[#fdfbf7] uppercase tracking-widest mb-2">Complete Time Commitment</h3>
          <p className="text-[#cccccc] text-sm leading-relaxed">
            {tourRecord.verifiedTimeCommitmentLabel || "Complete time commitment varies. Confirm during checkout."}
          </p>
        </div>
        <div>
          <h3 className="text-[10px] font-bold text-[#fdfbf7] uppercase tracking-widest mb-2">Transportation</h3>
          <p className="text-[#cccccc] text-sm leading-relaxed">
            {tourRecord.transportationAvailable || "Confirm in checkout"}
          </p>
        </div>
        <div>
          <h3 className="text-[10px] font-bold text-[#fdfbf7] uppercase tracking-widest mb-2">Pace</h3>
          <p className="text-[#cccccc] text-sm leading-relaxed">
            {tourRecord.pace || "Verify with operator"}
          </p>
        </div>
        <div>
          <h3 className="text-[10px] font-bold text-[#fdfbf7] uppercase tracking-widest mb-2">Weather Exposure</h3>
          <p className="text-[#cccccc] text-sm leading-relaxed">
            {tourRecord.weatherExposure || "Varies by selected option"}
          </p>
        </div>
        <div>
          <h3 className="text-[10px] font-bold text-[#fdfbf7] uppercase tracking-widest mb-2">Noise Level</h3>
          <p className="text-[#cccccc] text-sm leading-relaxed">
            {tourRecord.noiseLevel || "Verify with operator"}
          </p>
        </div>
      </div>
      <div className="mt-6 pt-4 border-t border-[#2a2a2a]">
        <p className="text-[#aaaaaa] text-[11px] leading-relaxed italic">
          Operator note: Final logistics, availability, and policies are subject to operator confirmation. Please verify directly during checkout.
        </p>
      </div>
    </div>
  );
}
