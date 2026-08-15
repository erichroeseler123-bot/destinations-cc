"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { trackEvent } from "@/lib/analytics";
import {
  evaluateRecommendation,
  LiveRecommendationContext,
  RecommendationInputs,
  RecommendationResult,
  TOUR_RECORDS,
} from "../lib/tourRecommendationRules";
import visualStyles from "./newOrleansVisual.module.css";
import { buildAttributedTourHref, FAREHARBOR_SOURCES, isApprovedProductSlug } from "../lib/fareHarborAttribution";
import { getWnoFunnelContext, sendWnoTelemetry } from "./WnoFunnelTracker";

const STEPS: (keyof RecommendationInputs)[] = [
  "planningWindow",
  "availableTime",
  "transportation",
  "groupStyle",
  "mixedAges",
  "historicalInterest",
];

const QUESTIONS: Record<keyof RecommendationInputs, { title: string; options: string[] }> = {
  planningWindow: {
    title: "What are you trying to plan?",
    options: [
      "Something for today",
      "Something for tomorrow",
      "A first New Orleans experience",
      "A family or mixed-age group",
      "A group that needs help deciding",
    ],
  },
  availableTime: {
    title: "How much time do you have?",
    options: ["About 3 hours", "About half a day", "Most of the day"],
  },
  transportation: {
    title: "How are you getting there?",
    options: ["We need pickup or transportation", "We can drive ourselves", "Not sure"],
  },
  groupStyle: {
    title: "What kind of pace sounds right?",
    options: ["Relaxed and comfortable", "Balanced", "Fast and adventurous"],
  },
  mixedAges: {
    title: "Are there children or mixed ages in your group?",
    options: ["Yes", "No"],
  },
  historicalInterest: {
    title: "How important is history for this activity?",
    options: ["Strong interest", "Some interest", "Not the priority"],
  },
};

const CHOOSER_COMPLETED_AT = "wno_chooser_completed_at";
const CHOOSER_RECOMMENDATION = "wno_chooser_recommendation";

export default function NewOrleansRecommendationFlow() {
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Partial<RecommendationInputs>>({});
  const [result, setResult] = useState<RecommendationResult | null>(null);
  const [liveContext, setLiveContext] = useState<LiveRecommendationContext>({});

  useEffect(() => {
    let active = true;
    fetch("/api/live-context", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((value) => {
        if (!active || !value) return;
        setLiveContext({
          period: value.period,
          rainRisk: value.rainRisk,
          heatRisk: value.heatRisk,
          liveMusicSignal: Boolean(value.liveMusicSignal),
          outdoorFriendly: Boolean(value.outdoorFriendly),
        });
      })
      .catch(() => {
        // Fail soft: the chooser remains usable from traveler answers alone.
      });
    return () => { active = false; };
  }, []);

  const currentStepId = STEPS[stepIndex];
  const currentQuestion = QUESTIONS[currentStepId];

  const emitChooserEvent = (eventName: string, extra: Record<string, unknown> = {}) => {
    const context = getWnoFunnelContext();
    const payload = {
      surface: "wno_help_me_choose",
      page: typeof window !== "undefined" ? window.location.pathname : undefined,
      entry_source: context?.source,
      entry_path: context?.landingPath,
      ...extra,
    };
    trackEvent(eventName, payload);
    sendWnoTelemetry({ eventName, sourcePage: typeof window !== "undefined" ? window.location.pathname : undefined, ...extra });
  };

  const handleSelect = (answer: string) => {
    const nextAnswers = { ...answers, [currentStepId]: answer } as Partial<RecommendationInputs>;
    if (stepIndex === 0) {
      emitChooserEvent("chooser_started", { first_answer: answer });
    }
    emitChooserEvent("chooser_answered", {
      question: currentStepId,
      answer,
      step_number: stepIndex + 1,
    });
    setAnswers(nextAnswers);

    if (stepIndex < STEPS.length - 1) {
      setStepIndex(stepIndex + 1);
      return;
    }

    const completedInputs = nextAnswers as RecommendationInputs;
    const nextResult = evaluateRecommendation(completedInputs, liveContext);
    setResult(nextResult);
    const primarySlug = nextResult.primary?.slug || null;
    const secondarySlug = nextResult.secondary?.slug || null;
    try {
      sessionStorage.setItem(CHOOSER_COMPLETED_AT, String(Date.now()));
      if (primarySlug) sessionStorage.setItem(CHOOSER_RECOMMENDATION, primarySlug);
      else sessionStorage.removeItem(CHOOSER_RECOMMENDATION);
    } catch {
      // Analytics state must never block the recommendation.
    }
    emitChooserEvent("chooser_completed", {
      ...completedInputs,
      live_period: liveContext.period,
      live_rain_risk: liveContext.rainRisk,
      live_music_signal: Boolean(liveContext.liveMusicSignal),
      live_outdoor_friendly: Boolean(liveContext.outdoorFriendly),
      primary_recommendation: primarySlug,
      secondary_recommendation: secondarySlug,
      no_fit: nextResult.isNoFit,
    });
  };

  const restart = () => {
    emitChooserEvent("chooser_restarted");
    setAnswers({});
    setStepIndex(0);
    setResult(null);
  };

  const back = () => {
    if (stepIndex === 0) return;
    emitChooserEvent("chooser_back_clicked", { from_step: stepIndex + 1, to_step: stepIndex });
    setStepIndex(stepIndex - 1);
    setResult(null);
  };

  const getTourHref = (slug: string) =>
    isApprovedProductSlug(slug)
      ? buildAttributedTourHref(slug, FAREHARBOR_SOURCES.recommendation, slug)
      : `/tours/${slug}`;

  const handleRecommendationClick = (slug: string, rank: "primary" | "secondary") => {
    emitChooserEvent("chooser_recommendation_clicked", {
      product_slug: slug,
      recommendation_rank: rank,
    });
  };

  if (result) {
    return (
      <div className={`${visualStyles.surfacePanel} mt-8 p-6 md:p-10`}>
        <div className="text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--nola-gold)]">Your concierge recommendation</p>
          <h3 className={`mt-3 text-3xl uppercase tracking-wide text-[var(--nola-ivory)] md:text-4xl ${visualStyles.accentFont}`}>Our pick for your group</h3>
          <button onClick={restart} className="mt-4 text-xs font-bold uppercase tracking-widest text-[var(--nola-text-muted)] hover:text-[var(--nola-gold)]">Start over</button>
        </div>

        {result.isNoFit || !result.primary ? (
          <div className="mx-auto mt-10 max-w-2xl border border-[var(--nola-border)] bg-[var(--nola-bg-charcoal)] p-8 text-center">
            <h4 className="text-2xl font-bold text-[var(--nola-ivory)]">Let’s narrow it another way.</h4>
            <p className="mt-4 text-sm leading-6 text-[var(--nola-text-muted)]">None of the 21 curated experiences is a strong enough fit for that exact combination. Change an answer or let the Concierge Desk help with your timing and group.</p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <button onClick={restart} className="border border-[var(--nola-gold)] px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--nola-gold)]">Adjust answers</button>
              <Link href="/contact" data-wno-event="chooser_concierge_fallback_clicked" className="bg-[var(--nola-gold)] px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--nola-bg-black)]">Ask the Concierge Desk</Link>
            </div>
          </div>
        ) : (
          <div className="mx-auto mt-10 max-w-3xl space-y-6">
            <RecommendationCard slug={result.primary.slug} reasons={result.primary.reasons} cautions={result.primary.cautionReasons} primary href={getTourHref(result.primary.slug)} onClick={() => handleRecommendationClick(result.primary!.slug, "primary")} />
            {result.secondary && (
              <RecommendationCard slug={result.secondary.slug} reasons={result.secondary.reasons} cautions={[]} href={getTourHref(result.secondary.slug)} onClick={() => handleRecommendationClick(result.secondary!.slug, "secondary")} />
            )}
          </div>
        )}

        <div className="mt-10 text-center">
          <p className="text-sm text-[var(--nola-text-muted)]">Still not sure? Tell us when you’re free, who is with you, and what kind of New Orleans you want.</p>
          <Link href="/contact" data-wno-event="chooser_planning_help_clicked" className="mt-3 inline-block text-xs font-bold uppercase tracking-widest text-[var(--nola-gold)]">Get planning help →</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`${visualStyles.surfacePanel} mt-8 p-6 md:p-10`}>
      <div className="mx-auto max-w-xl">
        <div className="mb-8 flex justify-center gap-2" aria-hidden="true">
          {STEPS.map((_, index) => (
            <span key={index} className={`h-[3px] ${index === stepIndex ? "w-8 bg-[var(--nola-gold)]" : index < stepIndex ? "w-4 bg-[var(--nola-gold-muted)]" : "w-4 bg-[var(--nola-border)]"}`} />
          ))}
        </div>
        <p className="text-center text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--nola-gold)]">Question {stepIndex + 1} of {STEPS.length}</p>
        <h3 className={`mt-3 text-center text-2xl text-[var(--nola-ivory)] md:text-3xl ${visualStyles.accentFont}`}>{currentQuestion.title}</h3>
        <div className="mt-8 space-y-3">
          {currentQuestion.options.map((option) => (
            <button
              key={option}
              onClick={() => handleSelect(option)}
              className="w-full border border-[var(--nola-border)] bg-[var(--nola-bg-charcoal)] px-5 py-4 text-left text-sm text-[var(--nola-ivory)] transition hover:border-[var(--nola-gold)] hover:text-[var(--nola-gold)]"
            >
              {option}
            </button>
          ))}
        </div>
        {stepIndex > 0 && <button onClick={back} className="mt-6 text-xs font-bold uppercase tracking-widest text-[var(--nola-text-muted)] hover:text-[var(--nola-gold)]">← Back</button>}
      </div>
    </div>
  );
}

function RecommendationCard({ slug, reasons, cautions, primary = false, href, onClick }: { slug: string; reasons: string[]; cautions: string[]; primary?: boolean; href: string; onClick: () => void }) {
  const tour = TOUR_RECORDS[slug];
  if (!tour) return null;

  return (
    <div className={`relative border p-6 md:p-8 ${primary ? "border-[var(--nola-gold)] bg-[var(--nola-surface-strong)]" : "border-[var(--nola-border)] bg-[var(--nola-bg-charcoal)]"}`}>
      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--nola-gold)]">{primary ? "Best fit" : "Also worth considering"}</p>
      <h4 className={`mt-3 text-3xl text-[var(--nola-ivory)] ${visualStyles.accentFont}`}>{tour.experienceType}</h4>
      <div className="mt-5">
        <p className="text-xs font-bold uppercase tracking-widest text-[var(--nola-text-muted)]">Why we picked it</p>
        <ul className="mt-3 space-y-2">
          {reasons.map((reason) => <li key={reason} className="flex gap-3 text-sm leading-6 text-[var(--nola-text-muted)]"><span className="text-[var(--nola-gold)]">✓</span><span>{reason}</span></li>)}
        </ul>
      </div>
      <div className="mt-5 grid gap-3 border-t border-[var(--nola-border)] pt-5 text-sm sm:grid-cols-2">
        <div><span className="block text-[10px] font-bold uppercase tracking-widest text-[var(--nola-text-muted)]">Time</span><span className="mt-1 block text-[var(--nola-ivory)]">{tour.verifiedDurationLabel}</span></div>
        <div><span className="block text-[10px] font-bold uppercase tracking-widest text-[var(--nola-text-muted)]">Getting there</span><span className="mt-1 block text-[var(--nola-ivory)]">{tour.transportationAvailable}</span></div>
      </div>
      {cautions.length > 0 && <div className="mt-5 border-l-2 border-[var(--nola-gold)] pl-4"><p className="text-[10px] font-bold uppercase tracking-widest text-[var(--nola-gold)]">Good to know</p>{cautions.map((caution) => <p key={caution} className="mt-1 text-sm text-[var(--nola-text-muted)]">{caution}</p>)}</div>}
      <Link href={href} onClick={onClick} data-wno-event="chooser_see_availability_clicked" data-wno-product={slug} className={`mt-6 inline-block px-6 py-3 text-xs font-bold uppercase tracking-widest ${primary ? "bg-[var(--nola-gold)] text-[var(--nola-bg-black)]" : "border border-[var(--nola-gold)] text-[var(--nola-gold)]"}`}>See Availability →</Link>
    </div>
  );
}
