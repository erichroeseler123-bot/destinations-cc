import React from "react";

export function VerifiedBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 bg-[#e6f4ea] text-[#137333] px-2 py-1 rounded-sm text-xs font-semibold mr-2 mb-2 border border-[#bce0c6]">
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
      </svg>
      {label}
    </span>
  );
}

export function generateBadgesFromClaims(claims: any) {
  const badges = [];
  if (claims.hasHotelPickup) badges.push("Hotel Pickup");
  if (claims.hasMinibus) badges.push("Minibus Transport");
  if (claims.hasVerifiedCoveredBoat) badges.push("Covered Boat");
  if (claims.pace) badges.push(`${claims.pace} Pace`);
  if (claims.groupSize) badges.push(claims.groupSize);
  return badges;
}
