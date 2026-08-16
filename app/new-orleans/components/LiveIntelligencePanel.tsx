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

function eventText(event: LiveContext["events"][number] | undefined, fallback: string) {
  if (!event) return fallback;
  return `${formatEventTime(event.startDate)} · Current city-calendar signal.`;
}

function weatherText(context: LiveContext) {
  if (!context.weather) return "Live weather is temporarily unavailable. We won’t guess.";
  const pieces = [
    context.weather.shortForecast,
    context.weather.maxTemperatureF !== null ? `High near ${Math.round(context.weather.maxTemperatureF)}°F` : null,
    context.weather.precipitationChance !== null ? `${Math.round(context.weather.precipitationChance)}% rain chance` : null,
  ].filter(Boolean);
  return pieces.join(" · ");
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
      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4" aria-live="polite">
        <LiveCard label="Tonight" title="Checking tonight…" text="Pulling current event signals." />
        <LiveCard label="Tomorrow" title="Checking tomorrow…" text="Looking across the next 48 hours." />
        <LiveCard label="Weather" title="Checking conditions…" text="Using National Weather Service data." />
        <LiveCard label="Concierge Pick" title="Matching the live context…" text="The pick changes only when the signals justify it." emphasis />
      </div>
    );
  }

  if (!context) {
    return (
      <div className="mt-8 grid gap-4">
        <LiveCard label="Live context" title="The live feeds are temporarily unavailable." text="The chooser still works from your answers alone." />
      </div>
    );
  }

  const tonightEvent = context.events[0];
  const tomorrowEvent = context.events[1];

  return (
    <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4" aria-live="polite">
      <div className="border border-[var(--nola-border)] bg-[var(--nola-surface)] p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--nola-gold)]">Tonight</p>
        <h3 className="mt-2 text-lg font-semibold text-[var(--nola-ivory)]">{tonightEvent ? tonightEvent.title : "No single event is driving tonight."}</h3>
        <p className="mt-2 text-sm leading-5 text-[var(--nola-text-muted)]">{eventText(tonightEvent, "We’re staying neutral instead of inventing a signal.")}</p>
      </div>

      <div className="border border-[var(--nola-border)] bg-[var(--nola-surface)] p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--nola-gold)]">Tomorrow</p>
        <h3 className="mt-2 text-lg font-semibold text-[var(--nola-ivory)]">{tomorrowEvent ? tomorrowEvent.title : "Weather and group fit matter more tomorrow."}</h3>
        <p className="mt-2 text-sm leading-5 text-[var(--nola-text-muted)]">{eventText(tomorrowEvent, "No second event is strong enough to feature.")}</p>
        <a href={context.sources.events} target="_blank" rel="noreferrer" data-wno-event="live_intelligence_clicked" data-wno-signal="tomorrow_events" className="mt-3 inline-block text-[10px] font-bold uppercase tracking-widest text-[var(--nola-gold)]">Event calendar ↗</a>
      </div>

      <div className="border border-[var(--nola-border)] bg-[var(--nola-surface)] p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--nola-gold)]">Weather</p>
        <h3 className="mt-2 text-lg font-semibold text-[var(--nola-ivory)]">{context.outdoorFriendly ? "Good window for outdoor plans." : "Weather-sensitive plans need flexibility."}</h3>
        <p className="mt-2 text-sm leading-5 text-[var(--nola-text-muted)]">{weatherText(context)}</p>
        <a href={context.sources.weather} target="_blank" rel="noreferrer" data-wno-event="live_intelligence_clicked" data-wno-signal="weather" className="mt-3 inline-block text-[10px] font-bold uppercase tracking-widest text-[var(--nola-gold)]">NWS forecast ↗</a>
      </div>

      <div className="border border-[var(--nola-gold)] bg-[var(--nola-surface-strong)] p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--nola-gold)]">Concierge Pick</p>
        <h3 className="mt-2 text-lg font-semibold text-[var(--nola-ivory)]">{context.conciergePick.title}</h3>
        <p className="mt-2 text-sm leading-5 text-[var(--nola-text-muted)]">{context.conciergePick.reason}</p>
        <Link href={`/tours/${context.conciergePick.slug}`} data-wno-event="live_intelligence_clicked" data-wno-signal="concierge_pick" data-wno-product={context.conciergePick.slug} className="mt-3 inline-block text-[10px] font-bold uppercase tracking-widest text-[var(--nola-gold)]">See availability →</Link>
      </div>
    </div>
  );
}

function LiveCard({ label, title, text, emphasis = false }: { label: string; title: string; text: string; emphasis?: boolean }) {
  return (
    <div className={`${emphasis ? "border-[var(--nola-gold)] bg-[var(--nola-surface-strong)]" : "border-[var(--nola-border)] bg-[var(--nola-surface)]"} border p-5`}>
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--nola-gold)]">{label}</p>
      <h3 className="mt-2 text-lg font-semibold text-[var(--nola-ivory)]">{title}</h3>
      <p className="mt-2 text-sm leading-5 text-[var(--nola-text-muted)]">{text}</p>
    </div>
  );
}
