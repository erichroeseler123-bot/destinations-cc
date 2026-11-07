"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  resolveColoradoSeasonalSpotlight,
  type ColoradoTripIntentType,
} from "@/lib/dcc/msyTaxiAndColoradoSeasonal";

export default function ColoradoSeasonalSpotlightCard({
  initialDateOrMonth,
  initialDestinationOrVenue,
  initialPartySize = 4,
  initialSkiBags = 0,
  initialTripIntent = "unspecified",
}: {
  initialDateOrMonth?: string | number | null;
  initialDestinationOrVenue?: string | null;
  initialPartySize?: number;
  initialSkiBags?: number;
  initialTripIntent?: ColoradoTripIntentType | string;
}) {
  const [dateOrMonth, setDateOrMonth] = useState<string>(
    typeof initialDateOrMonth === "string" && initialDateOrMonth.trim().length > 0
      ? initialDateOrMonth.trim()
      : typeof initialDateOrMonth === "number"
        ? `2026-${String(initialDateOrMonth).padStart(2, "0")}-15`
        : "2026-12-19",
  );
  const [destinationOrVenue, setDestinationOrVenue] = useState<string>(
    initialDestinationOrVenue || "Vail / Breckenridge (I-70 Mountain Transfer)",
  );
  const [partySize, setPartySize] = useState<number>(initialPartySize);
  const [skiBags, setSkiBags] = useState<number>(initialSkiBags);
  const [tripIntent, setTripIntent] = useState<string>(initialTripIntent);

  const spotlight = useMemo(
    () =>
      resolveColoradoSeasonalSpotlight({
        dateOrMonth,
        destinationOrVenue,
        partySize,
        skiBags,
        tripIntent,
      }),
    [dateOrMonth, destinationOrVenue, partySize, skiBags, tripIntent],
  );

  return (
    <section
      data-testid="dcc-colorado-seasonal-spotlight"
      data-active-season={spotlight.activeSeasonSpotlight}
      data-resolved-offer-partner={spotlight.selectedOffer.partnerId}
      className="rounded-3xl border border-cyan-400/35 bg-gradient-to-br from-slate-900 via-zinc-950 to-slate-950 p-6 md:p-8 space-y-6 text-white shadow-2xl"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 pb-4">
        <div className="space-y-1 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-cyan-400/40 bg-cyan-500/15 px-3 py-0.5 text-[11px] font-black uppercase tracking-wider text-cyan-200">
              {spotlight.seasonWindowLabel}
            </span>
            <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-200">
              Both Winter &amp; Summer/Red Rocks Guides Available Year-Round
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-white pt-1">
            {spotlight.featuredHeadline}
          </h2>
          <p className="text-xs md:text-sm text-zinc-300 leading-relaxed">
            {spotlight.featuredSummary}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <button
            type="button"
            onClick={() => {
              setDateOrMonth("2026-12-19");
              setDestinationOrVenue("Vail / Breckenridge");
              setTripIntent("ski_transfer");
            }}
            data-testid="spotlight-preset-winter"
            className={`rounded-xl border px-3 py-1.5 font-bold transition ${
              spotlight.activeSeasonSpotlight === "winter_nov_apr"
                ? "border-cyan-400 bg-cyan-500/20 text-cyan-100"
                : "border-white/15 bg-white/5 text-zinc-300 hover:bg-white/10"
            }`}
          >
            Nov–Apr Winter Spotlight
          </button>
          <button
            type="button"
            onClick={() => {
              setDateOrMonth("2026-07-18");
              setDestinationOrVenue("Red Rocks Amphitheatre (Morrison)");
              setTripIntent("red_rocks_event");
            }}
            data-testid="spotlight-preset-summer"
            className={`rounded-xl border px-3 py-1.5 font-bold transition ${
              spotlight.activeSeasonSpotlight === "summer_may_oct"
                ? "border-amber-400 bg-amber-500/20 text-amber-100"
                : "border-white/15 bg-white/5 text-zinc-300 hover:bg-white/10"
            }`}
          >
            May–Oct Summer &amp; Red Rocks Spotlight
          </button>
        </div>
      </div>

      {/* Traveler Trip Selector: Season chooses what is featured; Traveler's actual trip chooses the offer */}
      <div className="grid gap-3 rounded-2xl border border-white/10 bg-black/40 p-4 sm:grid-cols-2 lg:grid-cols-4 text-xs">
        <label className="block">
          <span className="font-bold text-zinc-200">1. Travel Date (Sets Season Spotlight)</span>
          <input
            type="date"
            value={dateOrMonth}
            onChange={(e) => setDateOrMonth(e.target.value)}
            data-testid="colorado-spotlight-date-input"
            className="mt-1 w-full rounded-lg border border-white/20 bg-zinc-900 px-3 py-2 text-white"
          />
        </label>
        <label className="block">
          <span className="font-bold text-zinc-200">2. Your Actual Trip / Destination</span>
          <select
            value={destinationOrVenue}
            onChange={(e) => {
              const val = e.target.value;
              setDestinationOrVenue(val);
              if (val.toLowerCase().includes("red rocks")) {
                setTripIntent("red_rocks_event");
              } else {
                setTripIntent("ski_transfer");
              }
            }}
            data-testid="colorado-spotlight-destination-select"
            className="mt-1 w-full rounded-lg border border-white/20 bg-zinc-900 px-3 py-2 text-white"
          >
            <option value="Vail / Breckenridge (I-70 Mountain Transfer)">
              DEN → Vail / Breckenridge Mountain Transfer (GoSno)
            </option>
            <option value="Breckenridge Ski Resort">
              DEN → Breckenridge Transfer &amp; Ski Gear Fit (GoSno)
            </option>
            <option value="Red Rocks Amphitheatre (Morrison)">
              Red Rocks Amphitheatre Show &amp; Tailgate (Party at Red Rocks)
            </option>
          </select>
        </label>
        <label className="block">
          <span className="font-bold text-zinc-200">3. Party Size</span>
          <input
            type="number"
            min={1}
            max={20}
            value={partySize}
            onChange={(e) => setPartySize(Math.max(1, Number(e.target.value) || 1))}
            data-testid="colorado-spotlight-party-input"
            className="mt-1 w-full rounded-lg border border-white/20 bg-zinc-900 px-3 py-2 text-white"
          />
        </label>
        <label className="block">
          <span className="font-bold text-zinc-200">4. Ski / Snowboard Bags</span>
          <input
            type="number"
            min={0}
            max={16}
            value={skiBags}
            onChange={(e) => setSkiBags(Math.max(0, Number(e.target.value) || 0))}
            data-testid="colorado-spotlight-skibags-input"
            className="mt-1 w-full rounded-lg border border-white/20 bg-zinc-900 px-3 py-2 text-white"
          />
        </label>
      </div>

      {/* Primary Featured Guides for Active Season */}
      <div className="space-y-3">
        <h3 className="text-sm font-black uppercase tracking-wider text-cyan-300">
          Featured for Current Season ({spotlight.seasonWindowLabel})
        </h3>
        <div className="grid gap-3 md:grid-cols-3">
          {spotlight.featuredGuides.map((guide) => (
            <Link
              key={guide.id}
              href={guide.href}
              className="rounded-2xl border border-cyan-400/30 bg-cyan-500/10 p-4 hover:bg-cyan-500/20 transition flex flex-col justify-between"
            >
              <div>
                <span className="inline-block rounded border border-cyan-300/40 bg-black/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cyan-200">
                  {guide.badge}
                </span>
                <h4 className="mt-2 text-base font-black text-white">{guide.title}</h4>
                <p className="mt-1.5 text-xs text-zinc-200 leading-relaxed">
                  {guide.summary}
                </p>
              </div>
              <span className="mt-3 text-xs font-bold text-cyan-300">
                Open Guide →
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Traveler-Matched Offer Card (GoSno vs Party at Red Rocks) */}
      <div
        data-testid="colorado-spotlight-matched-offer"
        className="rounded-2xl border border-emerald-400/35 bg-emerald-950/30 p-5 space-y-3"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] font-black uppercase tracking-wider text-emerald-300">
            Matched to Your Actual Trip · {spotlight.selectedOffer.partnerName}
          </span>
          <span className="text-[11px] text-zinc-300">
            {spotlight.selectedOfferReason}
          </span>
        </div>
        <h3 className="text-lg font-black text-white">
          {spotlight.selectedOffer.offerHeadline}
        </h3>
        <p className="text-xs md:text-sm text-zinc-200 leading-relaxed">
          {spotlight.selectedOffer.offerSummary}
        </p>
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <a
            href={spotlight.selectedOffer.primaryCtaHref}
            data-testid="colorado-spotlight-primary-offer-cta"
            className="rounded-xl bg-emerald-400 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-slate-950 hover:bg-emerald-300 transition"
          >
            {spotlight.selectedOffer.primaryCtaLabel}
          </a>
          <a
            href={spotlight.selectedOffer.secondaryCtaHref}
            data-testid="colorado-spotlight-secondary-offer-cta"
            className="rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-bold text-white hover:bg-white/15 transition"
          >
            {spotlight.selectedOffer.secondaryCtaLabel}
          </a>
        </div>
      </div>

      {/* Year-Round Secondary Guides Always Easy to Find */}
      <div className="space-y-3 border-t border-white/10 pt-4">
        <h3 className="text-xs font-black uppercase tracking-wider text-zinc-300">
          {spotlight.yearRoundSecondaryGuidesLabel}
        </h3>
        <div className="grid gap-3 md:grid-cols-3">
          {spotlight.yearRoundSecondaryGuides.map((guide) => (
            <Link
              key={guide.id}
              href={guide.href}
              className="rounded-2xl border border-white/15 bg-black/35 p-3.5 hover:border-cyan-400/40 transition flex flex-col justify-between"
            >
              <div>
                <span className="inline-block rounded border border-white/20 bg-white/5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-300">
                  {guide.badge}
                </span>
                <h4 className="mt-1.5 text-sm font-bold text-white">{guide.title}</h4>
                <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
                  {guide.summary}
                </p>
              </div>
              <span className="mt-2.5 text-xs font-semibold text-cyan-300">
                Open Year-Round Guide →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
