import React from "react";
import type { NolaGeoFact } from "../data/nolaGeoFacts";

export interface GeoDirectAnswerCardProps {
  fact?: NolaGeoFact | null;
  customQuestion?: string;
  customAnswer?: string;
  pricingLabel?: string;
  pricingValue?: string;
  durationLabel?: string;
  durationValue?: string;
  meetingPointLabel?: string;
  meetingPointValue?: string;
  safetyBufferLabel?: string;
  safetyBufferValue?: string;
  className?: string;
}

export default function GeoDirectAnswerCard({
  fact,
  customQuestion,
  customAnswer,
  pricingLabel,
  pricingValue,
  durationLabel,
  durationValue,
  meetingPointLabel,
  meetingPointValue,
  safetyBufferLabel,
  safetyBufferValue,
  className = "",
}: GeoDirectAnswerCardProps) {
  const question = customQuestion || fact?.directQuestion || "New Orleans Tour & Excursion Overview";
  const answer =
    customAnswer ||
    fact?.directAnswer ||
    "New Orleans excursions feature central French Quarter and Canal Street pickups, authentic local guides, small-group options, and full weather refund protections.";

  const priceL = pricingLabel || fact?.pricingLabel || "Published Starting Rate";
  const priceV = pricingValue || fact?.pricingValue || "Direct local rates (No third-party booking fees)";

  const durL = durationLabel || fact?.durationLabel || "Duration & Travel Time";
  const durV = durationValue || fact?.durationValue || "Convenient departures fitting morning or afternoon plans";

  const meetL = meetingPointLabel || fact?.meetingPointLabel || "Meeting & Pickup Location";
  const meetV = meetingPointValue || fact?.meetingPointValue || "French Quarter & Canal St hotels or Jackson Square hub";

  const buffL = safetyBufferLabel || fact?.safetyBufferLabel || "Weather & Cancellation Policy";
  const buffV = safetyBufferValue || fact?.safetyBufferValue || "100% Weather Refund & Flexible Advance Cancellation";

  return (
    <div
      data-geo-answer-card
      className={`my-8 rounded-2xl border border-[#e2d5c0] bg-[#fffdf9] p-6 sm:p-8 shadow-[0_10px_30px_rgba(43,33,24,0.06)] transition-all ${className}`}
    >
      {/* DIRECT ANSWER HEADER (Google AI Overview Snippet Extraction Target) */}
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#b48535] mb-2.5">
          <span className="flex h-2 w-2 rounded-full bg-[#b48535] animate-pulse" />
          <span>⚡ Direct New Orleans Answer &bull; Local Intel</span>
        </div>
        <h3 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight leading-snug mb-3 text-[#171a1f]">
          {question}
        </h3>
        <p className="text-base sm:text-lg leading-relaxed text-[#3a332a] font-normal">
          {answer}
        </p>
      </div>

      {/* 4-POINT FAST FACTS MATRIX */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-5 border-t border-[#eee5d6]">
        {/* Fact 1: Price */}
        <div className="rounded-xl border border-[#eee5d6] bg-[#fcfaf5] p-3.5 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#796e60] mb-1">
            {priceL}
          </span>
          <strong className="text-sm font-bold text-[#2d5a27] leading-snug">
            {priceV}
          </strong>
        </div>

        {/* Fact 2: Duration */}
        <div className="rounded-xl border border-[#eee5d6] bg-[#fcfaf5] p-3.5 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#796e60] mb-1">
            {durL}
          </span>
          <strong className="text-sm font-bold text-[#b48535] leading-snug">
            {durV}
          </strong>
        </div>

        {/* Fact 3: Meeting Point */}
        <div className="rounded-xl border border-[#eee5d6] bg-[#fcfaf5] p-3.5 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#796e60] mb-1">
            {meetL}
          </span>
          <strong className="text-xs sm:text-sm font-bold text-[#171a1f] leading-snug">
            {meetV}
          </strong>
        </div>

        {/* Fact 4: Weather / Guarantee */}
        <div className="rounded-xl border border-[#eee5d6] bg-[#fcfaf5] p-3.5 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#796e60] mb-1">
            {buffL}
          </span>
          <strong className="text-xs sm:text-sm font-bold text-[#78350f] leading-snug">
            {buffV}
          </strong>
        </div>
      </div>
    </div>
  );
}
