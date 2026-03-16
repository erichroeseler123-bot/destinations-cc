"use client";

import { useEffect, useState } from "react";
import { getLocalTime, getTimezoneLabel, getUtcOffset } from "@/lib/dcc/time";

type CityTimePanelProps = {
  cityName: string;
  timezone: string;
  showWeekday?: boolean;
};

export default function CityTimePanel({
  cityName,
  timezone,
  showWeekday = false,
}: CityTimePanelProps) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <aside className="rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(8,13,26,0.96),rgba(6,9,18,0.96))] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.35)]">
      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#8fd0ff]">Local time in {cityName}</p>
      <div className="mt-3 text-3xl font-black uppercase text-white">{getLocalTime(timezone, false, now)}</div>
      {showWeekday ? <div className="mt-1 text-sm text-white/68">{getLocalTime(timezone, true, now).split(",")[0]}</div> : null}
      <div className="mt-2 text-sm text-white/82">
        {getTimezoneLabel(timezone, now)} ({getUtcOffset(timezone, now)})
      </div>
    </aside>
  );
}
