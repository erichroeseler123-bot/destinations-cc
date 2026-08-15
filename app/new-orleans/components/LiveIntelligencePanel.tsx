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

function eventCardCopy(event: LiveContext["events"][number] | undefined, fallback: string) {
  if (!event) return fallback;
  return `${formatEventTime(event.startDate)} · This is current calendar context, so we use it to shape the plan rather than simply list another attraction.`;
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
      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3" aria-live="polite">
        <LiveCard label="Tonight" title="Checking tonight’s city context…" text="Pulling current public event signals." />
        <LiveCard label="Tomorrow" title="Checking tomorrow’s city context…" text="Looking ahead across the next 48 hours." />
        <LiveCard label="Weather" title="Checking current conditions…" text="Pulling the next 48 hours from the National Weather Service." />
        <LiveCard label="River" title="Reading the river-plan signals…" text="Using timing, music, rain and heat to judge whether a river experience fits now." />
        <LiveCard label="Swamp" title="Reading the swamp-plan signals…" text="Using weather and outdoor comfort to judge whether covered boat or airboat formats deserve a boost." />
        <LiveCard label="Concierge Pick" title="Matching the live context…" text="The pick changes only when the live signals justify it." />
      </div>
    );
  }

  if (!context) {
    return (
      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <LiveCard label="Live context" title="The feeds are temporarily unavailable." text="We won’t invent a live event or weather signal. The chooser still works from your answers alone." />
      </div>
    );
  }

  const tonightEvent = context.events[0];
  const tomorrowEvent = context.events[1];
  const riverTitle = context.period === "evening" && context.liveMusicSignal
    ? "Tonight is strong for a music-forward river plan."
    : context.rainRisk === "high"
      ? "Keep the river plan flexible around weather."
      : "River experiences remain a strong flexible option.";
  const riverText = context.period === "evening" && context.liveMusicSignal
    ? "Live-music context plus evening timing gives the jazz cruise an extra boost in the chooser."
    : context.rainRisk === "high"
      ? "Higher rain risk means we favor more protected formats and ask you to verify current departure conditions before committing."
      : "With no severe weather penalty in the live layer, river options can compete on timing, group fit and music preference.";
  const swampTitle = context.rainRisk === "high"
    ? "Covered swamp formats get the edge right now."
    : context.outdoorFriendly
      ? "Outdoor-friendly conditions strengthen swamp options."
      : "Swamp choices are being scored cautiously.";
  const swampText = context.rainRisk === "high"
    ? "The covered boat gets a protection boost while exposed airboats are demoted for rain risk."
    : context.outdoorFriendly
      ? "Clearer outdoor conditions strengthen both swamp boats and airboats; pace and group type decide which one wins."
      : "Weather is not favorable enough to push an exposed swamp option purely on live context.";

  return (
    <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3" aria-live="polite">
      <div className="border border-[var(--nola-border)] bg-[var(--nola-surface)] p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--nola-gold)]">Tonight</p>
        <h3 className="mt-2 text-xl font-semibold text-[var(--nola-ivory)]">{tonightEvent ? tonightEvent.title : "No single event is strong enough to drive tonight’s recommendation."}</h3>
        <p className="mt-2 text-sm leading-6 text-[var(--nola-text-muted)]">{eventCardCopy(tonightEvent, "The live layer is staying neutral instead of inventing a tonight signal.")}</p>
      </div>

      <div className="border border-[var(--nola-border)] bg-[var(--nola-surface)] p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--nola-gold)]">Tomorrow</p>
        <h3 className="mt-2 text-xl font-semibold text-[var(--nola-ivory)]">{tomorrowEvent ? tomorrowEvent.title : "Tomorrow is being shaped more by weather and fit than by one featured event."}</h3>
        <p className="mt-2 text-sm leading-6 text-[var(--nola-text-muted)]">{eventCardCopy(tomorrowEvent, "No second current calendar item is strong enough to feature, so the chooser stays focused on your group and the weather.")}</p>
        <a href={context.sources.events} target="_blank" rel="noreferrer" data-wno-event="live_intelligence_clicked" data-wno-signal="tomorrow_events" className="mt-4 inline-block text-[10px] font-bold uppercase tracking-widest text-[var(--nola-gold)]">Official event calendar ↗</a>
      </div>

      <div className="border border-[var(--nola-border)] bg-[var(--nola-surface)] p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--nola-gold)]">Weather</p>
        <h3 className="mt-2 text-xl font-semibold text-[var(--nola-ivory)]">{context.outdoorFriendly ? "Outdoor conditions are getting a small boost." : "Weather-sensitive options are being scored more carefully."}</h3>
        <WeatherCopy context={context} />
        <a href={context.sources.weather} target="_blank" rel="noreferrer" data-wno-event="live_intelligence_clicked" data-wno-signal="weather" className="mt-4 inline-block text-[10px] font-bold uppercase tracking-widest text-[var(--nola-gold)]">National Weather Service ↗</a>
      </div>

      <LiveCard label="River" title={riverTitle} text={riverText} />
      <LiveCard label="Swamp" title={swampTitle} text={swampText} />

      <div className="border border-[var(--nola-gold)] bg-[var(--nola-surface-strong)] p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--nola-gold)]">Concierge Pick</p>
        <h3 className="mt-2 text-xl font-semibold text-[var(--nola-ivory)]">{context.conciergePick.title}</h3>
        <p className="mt-2 text-sm leading-6 text-[var(--nola-text-muted)]">{context.conciergePick.reason}</p>
        <Link href={`/tours/${context.conciergePick.slug}`} data-wno-event="live_intelligence_clicked" data-wno-signal="concierge_pick" data-wno-product={context.conciergePick.slug} className="mt-4 inline-block text-[10px] font-bold uppercase tracking-widest text-[var(--nola-gold)]">See why it fits →</Link>
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
