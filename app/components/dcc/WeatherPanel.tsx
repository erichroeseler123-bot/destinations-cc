"use client";

import { useEffect, useState } from "react";

type WeatherPanelProps = {
  locationLabel: string;
  lat: number;
  lng: number;
};

type WeatherPayload = {
  label: string;
  temperatureF: number;
  condition: string;
  rainChance: number;
  icon: "sun" | "cloud" | "rain" | "storm" | "snow" | "fog";
  advisory: string;
};

function WeatherIcon({ kind }: { kind: WeatherPayload["icon"] }) {
  if (kind === "sun") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#ffb07c]" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1" />
      </svg>
    );
  }
  if (kind === "rain") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#8fd0ff]" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M7 18a4 4 0 1 1 .8-7.9A5 5 0 0 1 17 9a3.5 3.5 0 1 1 0 7H7Z" />
        <path d="M9 19l-1 2M13 19l-1 2M17 19l-1 2" />
      </svg>
    );
  }
  if (kind === "storm") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#8fd0ff]" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M7 18a4 4 0 1 1 .8-7.9A5 5 0 0 1 17 9a3.5 3.5 0 1 1 0 7H7Z" />
        <path d="m12 18-2 4h2l-1 3 4-5h-2l1-2" />
      </svg>
    );
  }
  if (kind === "snow") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#8fd0ff]" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M7 18a4 4 0 1 1 .8-7.9A5 5 0 0 1 17 9a3.5 3.5 0 1 1 0 7H7Z" />
        <path d="M12 19v4M10.5 20.5l3 1.5M13.5 20.5l-3 1.5" />
      </svg>
    );
  }
  if (kind === "fog") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#8fd0ff]" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M5 10a4 4 0 1 1 7.7-1.5A4 4 0 1 1 17 16H7" />
        <path d="M4 18h12M6 21h10" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#8fd0ff]" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M7 18a4 4 0 1 1 .8-7.9A5 5 0 0 1 17 9a3.5 3.5 0 1 1 0 7H7Z" />
    </svg>
  );
}

export default function WeatherPanel({ locationLabel, lat, lng }: WeatherPanelProps) {
  const [weather, setWeather] = useState<WeatherPayload | null>(null);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    fetch(`/api/internal/weather?lat=${encodeURIComponent(String(lat))}&lng=${encodeURIComponent(String(lng))}&label=${encodeURIComponent(locationLabel)}`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (!cancelled && payload) setWeather(payload);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [lat, lng, locationLabel]);

  if (!weather) return null;

  return (
    <aside className="rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(17,11,18,0.96),rgba(10,9,20,0.96))] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.35)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#ffb07c]">Today in {weather.label}</p>
          <div className="mt-3 text-3xl font-black uppercase text-white">{weather.temperatureF}°F</div>
          <div className="mt-1 text-sm text-white/82">{weather.condition}</div>
          <div className="mt-1 text-sm text-white/68">{weather.rainChance}% rain chance</div>
        </div>
        <div className="rounded-full border border-white/10 bg-black/20 p-2">
          <WeatherIcon kind={weather.icon} />
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-white/68">{weather.advisory}</p>
    </aside>
  );
}
