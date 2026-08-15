"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

export type LiveContext = {
  generatedAt: string;
  period: "morning" | "afternoon" | "evening";
  rainRisk: "low" | "elevated" | "high";
  heatRisk: "low" | "elevated" | "high";
  outdoorFriendly: boolean;
  liveMusicSignal: boolean;
  weather: {
    temperatureF: number | null;
    maxTemperatureF: number | null;
    precipitationChance: number | null;
    shortForecast: string | null;
    rainRisk: "low" | "elevated" | "high";
    heatRisk: "low" | "elevated" | "high";
    outdoorFriendly: boolean;
  } | null;
  events: { title: string; startDate: string | null; endDate: string | null; url: string }[];
  conciergePick: { slug: string; title: string; reason: string };
  sources: { events: string; weather: string };
};

export async function fetchLiveContext(): Promise<LiveContext | null> {
  try {
    const response = await fetch("/api/live-context", { cache: "no-store" });
    if (!response.ok) return null;
    return (await response.json()) as LiveContext;
  } catch {
    return null;
  }
}

function formatEventTime(value: string | null) {
  if (!value) return "Next 48 hours";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Next 48 hours";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function WeatherCopy({ context }: { context: LiveContext }) {
  if (!context.weather) {
    return <p className="mt-2 text-sm leading-6 text-[var(--nola-text-muted)]">Live weather is temporarily unavailable, so weather is not being used to push a recommendation.</p>;
  }
  const { weather } = context;
  const pieces = [
    weather.shortForecast,
    weather.maxTemperatureF !== null ? `high near ${Math.round(weather.maxTemperatureF)}°F` : null,
    weather.precipitationChance !== null ? `up to ${Math.round(weather.precipitationChance)}% rain chance` : null,
  ].filter(Boolean);
  return <p className="mt-2 text-sm leading-6 text-[var(--nola-text-muted)]">{pieces.join(" · ")}. We’re treating rain risk as {weather.rainRisk} and heat risk as {weather.heatRisk}.</p>;
}

export default function LiveIntelligencePanel() {
  const [context, setContext] = useState<LiveContext | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    fetchLiveContext().then((value) => {
      if (!active) return;
      setContext(value);
      setLoaded(true);
    });
    return () => { active = false; };
  }, []);

  if (!loaded) {
    return (
      <div className="mt-8 grid gap-4 md:grid-cols-3" aria-live="polite">
        <LiveCard label="Tonight / Tomorrow" title="Checking the city calendar…" text="Pulling current public event context." />
        <LiveCard label="Weather" title="Checking current conditions…" text="Pulling the next 48 hours from the National Weather Service." />
        <LiveCard label="Concierge Pick" title="Matching the live context…" text="The pick changes only when the live signals justify it." />
      </div>
    );
  }

  if (!context) {
    return (
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <LiveCard label="Live context" title="The feeds are temporarily unavailable." text="We won’t invent a live event or weather signal. The chooser still works from your answers alone." />
      </div>
    );
  }

  const firstEvent = context.events[0];

  return (
    <div className="mt-8 grid gap-4 md:grid-cols-3" aria-live="polite">
      <div className="border border-[var(--nola-border)] bg-[var(--nola-surface)] p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--nola-gold)]">Tonight / Tomorrow</p>
        <h3 className="mt-2 text-xl font-semibold text-[var(--nola-ivory)]">{firstEvent ? firstEvent.title : "No featured calendar event is driving the recommendation."}</h3>
        <p className="mt-2 text-sm leading-6 text-[var(--nola-text-muted)]">{firstEvent ? `${formatEventTime(firstEvent.startDate)} · pulled from NewOrleans.com’s public calendar.` : "The live layer is staying neutral instead of filling this slot with stale event copy."}</p>
        <a href={context.sources.events} target="_blank" rel="noreferrer" className="mt-4 inline-block text-[10px] font-bold uppercase tracking-widest text-[var(--nola-gold)]">Official event calendar ↗</a>
      </div>

      <div className="border border-[var(--nola-border)] bg-[var(--nola-surface)] p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--nola-gold)]">Weather</p>
        <h3 className="mt-2 text-xl font-semibold text-[var(--nola-ivory)]">{context.outdoorFriendly ? "Outdoor conditions are getting a small boost." : "Weather-sensitive options are being scored more carefully."}</h3>
        <WeatherCopy context={context} />
        <a href={context.sources.weather} target="_blank" rel="noreferrer" className="mt-4 inline-block text-[10px] font-bold uppercase tracking-widest text-[var(--nola-gold)]">National Weather Service ↗</a>
      </div>

      <div className="border border-[var(--nola-gold)] bg-[var(--nola-surface-strong)] p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--nola-gold)]">Concierge Pick</p>
        <h3 className="mt-2 text-xl font-semibold text-[var(--nola-ivory)]">{context.conciergePick.title}</h3>
        <p className="mt-2 text-sm leading-6 text-[var(--nola-text-muted)]">{context.conciergePick.reason}</p>
        <Link href={`/tours/${context.conciergePick.slug}`} className="mt-4 inline-block text-[10px] font-bold uppercase tracking-widest text-[var(--nola-gold)]">See why it fits →</Link>
      </div>
    </div>
  );
}

function LiveCard({ label, title, text }: { label: string; title: string; text: string }) {
  return (
    <div className="border border-[var(--nola-border)] bg-[var(--nola-surface)] p-5">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--nola-gold)]">{label}</p>
      <h3 className="mt-2 text-xl font-semibold text-[var(--nola-ivory)]">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[var(--nola-text-muted)]">{text}</p>
    </div>
  );
}
