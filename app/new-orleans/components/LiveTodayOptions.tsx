"use client";

import { useEffect, useMemo, useState } from "react";
import ProductCard from "./ProductCard";
import { STOREFRONT_PRODUCTS } from "../tours/pageConfig";
import { FAREHARBOR_SOURCES } from "../lib/fareHarborAttribution";
import { getGovernedExperienceGraphRecord } from "../data/experienceGraphGovernance";
import { HELD_COMBO_SLUG } from "../data/truthPolicy";

type LiveContext = {
  generatedAt?: string;
  period?: "morning" | "afternoon" | "evening";
  rainRisk?: "low" | "elevated" | "high";
  heatRisk?: "low" | "elevated" | "high";
  outdoorFriendly?: boolean;
  liveMusicSignal?: boolean;
  weather?: {
    temperatureF?: number | null;
    precipitationChance?: number | null;
    shortForecast?: string | null;
  } | null;
};

type Candidate = {
  slug: string;
  note: string;
  weatherSensitive?: boolean;
};

const MORNING: Candidate[] = [
  { slug: "city-tour-of-new-orleans", note: "A practical first-day overview while you still have most of the day ahead." },
  { slug: "daytime-jazz-cruise", note: "Worth checking if a daytime sailing still fits your schedule." },
  { slug: "covered-tour-boat", note: "A lower-exposure swamp format to check when you still have enough travel time." },
  { slug: "ragin-cajun-airboat-options", note: "Best checked early in the day because travel and eligibility both matter.", weatherSensitive: true },
];

const AFTERNOON: Candidate[] = [
  { slug: "daytime-jazz-cruise", note: "Check the current sailing schedule before building dinner around it." },
  { slug: "city-tour-of-new-orleans", note: "A city-based option to check when a long out-of-town excursion no longer makes sense." },
  { slug: "evening-jazz-cruise", note: "A natural bridge from afternoon planning into tonight." },
  { slug: "craft-cocktail-walking-tour", note: "An evening-friendly option when you want to stay in the visitor core.", weatherSensitive: true },
  { slug: "ghosts-spirits-walking-tour", note: "Best treated as a tonight option rather than an afternoon activity.", weatherSensitive: true },
];

const EVENING: Candidate[] = [
  { slug: "evening-jazz-cruise", note: "One of the clearest scheduled evening experiences to check now." },
  { slug: "craft-cocktail-walking-tour", note: "An adult-oriented evening option that stays centered in town.", weatherSensitive: true },
  { slug: "ghosts-spirits-walking-tour", note: "Built for after-dark timing; check the next departure and walking conditions.", weatherSensitive: true },
];

function candidateSet(period?: LiveContext["period"]) {
  if (period === "evening") return EVENING;
  if (period === "afternoon") return AFTERNOON;
  return MORNING;
}

export default function LiveTodayOptions() {
  const [context, setContext] = useState<LiveContext | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/live-context", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((value) => {
        if (!active) return;
        setContext(value);
        setLoaded(true);
      })
      .catch(() => {
        if (!active) return;
        setLoaded(true);
      });
    return () => { active = false; };
  }, []);

  const candidates = useMemo(() => {
    const base = candidateSet(context?.period);
    const rainRisk = context?.rainRisk;
    const heatRisk = context?.heatRisk;

    return [...base]
      .filter((candidate) => candidate.slug !== HELD_COMBO_SLUG)
      .map((candidate) => {
        const graph = getGovernedExperienceGraphRecord(candidate.slug);
        const exposed = graph?.rainExposure.value === "exposed" || graph?.heatExposure.value === "exposed";
        let score = 0;
        if (context?.period === "evening" && ["evening-jazz-cruise", "craft-cocktail-walking-tour", "ghosts-spirits-walking-tour"].includes(candidate.slug)) score += 6;
        if (context?.period === "morning" && ["city-tour-of-new-orleans", "covered-tour-boat", "ragin-cajun-airboat-options"].includes(candidate.slug)) score += 4;
        if (rainRisk === "high" && exposed) score -= 8;
        if (rainRisk === "high" && graph?.rainExposure.value === "covered") score += 4;
        if (heatRisk === "high" && graph?.heatExposure.value === "exposed") score -= 5;
        if (heatRisk === "high" && graph?.heatExposure.value === "climate_controlled") score += 4;
        if (context?.liveMusicSignal && candidate.slug === "evening-jazz-cruise") score += 3;
        return { ...candidate, score, graph };
      })
      .sort((a, b) => b.score - a.score)
      .filter((candidate) => {
        if (context?.rainRisk === "high" && candidate.graph?.rainExposure.value === "exposed") return false;
        if (context?.period === "evening" && ["covered-tour-boat", "ragin-cajun-airboat-options", "city-tour-of-new-orleans", "daytime-jazz-cruise"].includes(candidate.slug)) return false;
        return true;
      });
  }, [context]);

  const periodLabel = context?.period === "evening" ? "Tonight" : context?.period === "afternoon" ? "This afternoon" : "This morning";
  const weatherText = context?.weather?.shortForecast || null;

  return (
    <section id="options" className="bg-[radial-gradient(circle_at_50%_0%,rgba(132,82,18,.12),transparent_34%),#080708] px-6 py-14 md:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#d4af37]">{loaded ? `${periodLabel} in New Orleans` : "Current New Orleans context"}</p>
          <h2 className="mt-3 font-serif text-3xl md:text-4xl">Still reasonable to check now</h2>
          <p className="mt-4 leading-7 text-white/70">
            This shortlist changes with New Orleans local time and weather. It is a viability screen, not a claim that a specific departure still has seats. The participating operator remains the source of truth for today's actual times, cutoff, pricing and availability.
          </p>
        </div>

        {context && (
          <div className="mb-8 grid gap-3 sm:grid-cols-3">
            <div className="border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#d4af37]">Local daypart</p>
              <p className="mt-2 text-sm text-white/80">{periodLabel}</p>
            </div>
            <div className="border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#d4af37]">Weather</p>
              <p className="mt-2 text-sm text-white/80">{weatherText || "Live weather signal loaded"}</p>
            </div>
            <div className="border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#d4af37]">Planning signal</p>
              <p className="mt-2 text-sm text-white/80">Rain: {context.rainRisk || "unknown"} · Heat: {context.heatRisk || "unknown"}</p>
            </div>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {candidates.map((candidate) => {
            const product = STOREFRONT_PRODUCTS.find((item) => item.slug === candidate.slug);
            if (!product || product.slug === HELD_COMBO_SLUG) return null;
            return (
              <div key={candidate.slug} className="flex flex-col">
                <ProductCard
                  attributionSource={FAREHARBOR_SOURCES.home}
                  product={{ ...product, operatorAttribution: undefined, isBookable: true, ctaLabel: "Check Today's Times" } as any}
                />
                <p className="border-x border-b border-white/10 bg-[#100e11] px-5 py-4 text-xs leading-5 text-white/55">{candidate.note}</p>
              </div>
            );
          })}
        </div>

        {candidates.length === 0 && (
          <div className="border border-dashed border-[#d4af37]/30 bg-[#111014] p-7 text-[#aaa]">Current conditions make the normal same-day shortlist too uncertain. Use Help Me Choose or check tonight's live page instead of assuming an outdoor departure is still practical.</div>
        )}
      </div>
    </section>
  );
}
