// components/TrustBadges.tsx
import React from "react";

type Props = {
  reviews: number;
  rating: number;
};

export default function TrustBadges({ reviews, rating }: Props) {
  const isVerified = rating >= 4.7 && reviews >= 100;
  
  // Change #4 Logic: Proprietary Reliability Score
  const trustScore = Math.round((Number(rating || 0) * 15) + (Math.min(Number(reviews || 0), 500) / 20));

  return (
    <div className="mb-10">
      {/* Status Bar */}
      <div className="flex items-center gap-3 mb-4">
        <span
          className={
            "inline-flex items-center rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.15em] border " +
            (isVerified
              ? "bg-cyan-950/40 text-cyan-400 border-cyan-500/30"
              : "bg-zinc-900 text-zinc-500 border-zinc-800")
          }
        >
          {isVerified ? "● DCC Verified Status" : "○ DCC Listed Status"}
        </span>
        
        <div className="h-px flex-grow bg-zinc-800/50" />
      </div>

      {/* Metric Grid */}
      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col">
          <span className="text-2xl font-black text-white">{trustScore}%</span>
          <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-tighter">Reliability Index</span>
        </div>

        <div className="flex flex-col border-x border-zinc-800 px-4">
          <span className="text-2xl font-black text-white">{Number(rating || 0).toFixed(1)}</span>
          <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-tighter">Avg Rating</span>
        </div>

        <div className="flex flex-col pl-4">
          <span className="text-2xl font-black text-white">{Number(reviews || 0).toLocaleString()}</span>
          <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-tighter">Samples Analyzed</span>
        </div>
      </div>
    </div>
  );
}
