"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  evaluateRecommendation,
  RecommendationInputs,
  RecommendationResult,
  TOUR_RECORDS,
  PlanningWindow,
  AvailableTime,
  TransportationNeed,
  GroupStyle,
  ChildrenOrMixedAges,
  HistoricalInterest
} from "../lib/tourRecommendationRules";
import { trackEvent } from "@/lib/analytics";
import { RecommendationAnalyticsTracker } from "../lib/useRecommendationAnalytics";
import visualStyles from "./newOrleansVisual.module.css";

const STEPS = [
  "planningWindow",
  "availableTime",
  "transportation",
  "groupStyle",
  "mixedAges",
  "historicalInterest"
];

const QUESTIONS = {
  planningWindow: {
    title: "What are you trying to plan?",
    options: [
      "Something for today",
      "Something for tomorrow",
      "A first New Orleans experience",
      "A family or mixed-age group",
      "A group that needs help deciding"
    ]
  },
  availableTime: {
    title: "How much time do you have?",
    options: [
      "About 3 hours",
      "About half a day",
      "Most of the day"
    ]
  },
  transportation: {
    title: "How are you getting there?",
    options: [
      "We need pickup or transportation",
      "We can drive ourselves",
      "Not sure"
    ]
  },
  groupStyle: {
    title: "What is your group's preferred style?",
    options: [
      "Relaxed and comfortable",
      "Balanced",
      "Fast and adventurous"
    ]
  },
  mixedAges: {
    title: "Are there children or mixed ages in your group?",
    options: [
      "Yes",
      "No"
    ]
  },
  historicalInterest: {
    title: "How important is historical focus for this activity?",
    options: [
      "Strong interest",
      "Some interest",
      "Not the priority"
    ]
  }
};

export default function NewOrleansRecommendationFlow() {
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Partial<RecommendationInputs>>({});
  const [result, setResult] = useState<RecommendationResult | null>(null);
  
  // Ref for tracking transitioning states between questions
  const [isTransitioning, setIsTransitioning] = useState(false);

  const [tracker] = useState(() => new RecommendationAnalyticsTracker());

  const currentStepId = STEPS[stepIndex] as keyof RecommendationInputs;
  const currentQuestion = QUESTIONS[currentStepId];

  useEffect(() => {
    tracker.trackResultShown(result, answers, "new_orleans_homepage");
  }, [result, answers, tracker]);

  const handleSelect = (answer: string) => {
    tracker.trackFlowStarted("new_orleans_homepage");
    tracker.trackAnswerSelected(answer);

    const newAnswers = { ...answers, [currentStepId]: answer };
    setAnswers(newAnswers);

    // Apply quick transition for moving to the next step
    setIsTransitioning(true);
    setTimeout(() => {
      if (stepIndex < STEPS.length - 1) {
        setStepIndex(stepIndex + 1);
      } else {
        const rec = evaluateRecommendation(newAnswers as RecommendationInputs);
        setResult(rec);
      }
      setIsTransitioning(false);
    }, 200); // 200ms transition delay
  };

  const handleBack = () => {
    if (stepIndex > 0) {
      setIsTransitioning(true);
      setTimeout(() => {
        setStepIndex(stepIndex - 1);
        setResult(null);
        tracker.resetResultTracking();
        setIsTransitioning(false);
      }, 200);
    }
  };

  const handleRestart = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setStepIndex(0);
      setAnswers({});
      setResult(null);
      tracker.resetFlowTracking();
      setIsTransitioning(false);
    }, 200);
  };

  const handleHelpRequested = () => {
    tracker.trackHelpRequested();
  };

  const handlePrimaryClick = () => {
    tracker.trackPrimarySelected();
  };

  const handleSecondaryClick = () => {
    tracker.trackSecondarySelected();
  };

  return (
    <div className={visualStyles.heroContainer}>
      <div className={visualStyles.heroBackground} />
      <div className={visualStyles.heroOverlay} />
      <div className={visualStyles.heroContent}>
        
        {result ? (
          <section className={`${visualStyles.surfacePanel} ${visualStyles.surfacePanelResult} p-6 md:p-12 my-8 ${isTransitioning ? 'opacity-0' : 'opacity-100 transition-opacity duration-200'}`}>
            <div className="text-center mb-12">
              <span className="text-[var(--nola-gold)] text-3xl mb-4 block">⚜️</span>
              <h2 className={`text-3xl md:text-4xl font-bold uppercase tracking-widest ${visualStyles.accentFont} text-[var(--nola-ivory)]`}>
                Your Recommendation
              </h2>
              <button 
                onClick={handleRestart} 
                className="mt-4 text-xs font-bold text-[var(--nola-text-muted)] uppercase tracking-widest hover:text-[var(--nola-gold)] transition-colors border-b border-[var(--nola-text-muted)] hover:border-[var(--nola-gold)] pb-1"
              >
                Start Over
              </button>
            </div>

            {result.isNoFit || !result.primary ? (
              <div className="bg-[var(--nola-bg-charcoal)] p-8 md:p-12 border border-[var(--nola-border)] text-center shadow-inner">
                <h3 className="text-2xl font-bold text-[var(--nola-ivory)] mb-6">No Strong Fit</h3>
                <p className="text-[var(--nola-text-muted)] text-lg leading-relaxed mb-8 max-w-lg mx-auto">
                  None of our four current bookable experiences is a strong match for what you selected.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href="/contact"
                    onClick={handleHelpRequested}
                    className="bg-[var(--nola-gold)] text-[var(--nola-bg-black)] font-bold py-4 px-8 uppercase tracking-widest text-sm hover:bg-[var(--nola-ivory)] transition-colors shadow-md"
                  >
                    Call or text for help
                  </Link>
                  <button
                    onClick={handleRestart}
                    className="bg-transparent border border-[var(--nola-border)] text-[var(--nola-ivory)] font-bold py-4 px-8 uppercase tracking-widest text-sm hover:border-[var(--nola-gold)] hover:text-[var(--nola-gold)] transition-colors"
                  >
                    Adjust answers
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-12">
                {/* Primary Recommendation */}
                <div className="bg-[var(--nola-surface-strong)] p-8 md:p-12 border border-[var(--nola-gold)] shadow-[0_0_30px_rgba(212,175,55,0.15)] relative">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[var(--nola-gold)] text-[var(--nola-bg-black)] px-6 py-2 font-bold uppercase tracking-widest text-xs shadow-md whitespace-nowrap">
                    Best fit for your group
                  </div>
                  <div className="mt-6 text-center mb-8">
                    <h3 className={`text-3xl font-bold text-[var(--nola-ivory)] mb-2 ${visualStyles.accentFont}`}>
                      {TOUR_RECORDS[result.primary.slug].experienceType}
                    </h3>
                    <p className="text-sm font-bold text-[var(--nola-gold)] uppercase tracking-widest">
                      Operated by {TOUR_RECORDS[result.primary.slug].operator}
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h4 className="text-xs font-bold text-[var(--nola-text-muted)] uppercase tracking-widest mb-3 border-b border-[var(--nola-border)] pb-2">Why it fits</h4>
                      <ul className="space-y-2">
                        {result.primary.reasons.map((reason, idx) => (
                          <li key={idx} className="flex items-start text-sm text-[var(--nola-text-muted)] leading-relaxed gap-3">
                            <span className="text-[var(--nola-gold)] mt-0.5">✓</span>
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-6 bg-[var(--nola-bg-charcoal)] p-6 border border-[var(--nola-border)]">
                      <div>
                        <h4 className="text-[10px] font-bold text-[var(--nola-text-muted)] uppercase tracking-widest mb-1">Experience Duration</h4>
                        <p className="text-sm text-[var(--nola-ivory)]">{TOUR_RECORDS[result.primary.slug].verifiedDurationLabel}</p>
                      </div>
                      <div>
                        <h4 className="text-[10px] font-bold text-[var(--nola-text-muted)] uppercase tracking-widest mb-1">Complete Time</h4>
                        <p className="text-sm text-[var(--nola-ivory)]">{TOUR_RECORDS[result.primary.slug].verifiedTimeCommitmentLabel}</p>
                      </div>
                      <div className="sm:col-span-2 border-t border-[var(--nola-border)] pt-4">
                        <h4 className="text-[10px] font-bold text-[var(--nola-text-muted)] uppercase tracking-widest mb-1">Transportation Status</h4>
                        <p className="text-sm text-[var(--nola-ivory)]">{TOUR_RECORDS[result.primary.slug].transportationAvailable}</p>
                      </div>
                    </div>

                    {result.primary.cautionReasons.length > 0 && (
                      <div className="bg-[var(--nola-bg-black)] p-6 border-l-2 border-[var(--nola-gold)]">
                        <h4 className="text-[10px] font-bold text-[var(--nola-gold)] uppercase tracking-widest mb-2">Verify Before Booking</h4>
                        <ul className="space-y-1">
                          {result.primary.cautionReasons.map((caution, idx) => (
                             <li key={idx} className="text-sm text-[var(--nola-text-muted)] leading-relaxed flex gap-2">
                               <span>•</span>
                               <span>{caution}</span>
                             </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center pt-8 border-t border-[var(--nola-border)]">
                    <Link
                      href={`/new-orleans/tours/${result.primary.slug}`}
                      onClick={handlePrimaryClick}
                      className="bg-[var(--nola-gold)] text-[var(--nola-bg-black)] font-bold py-4 px-8 uppercase tracking-widest text-sm text-center hover:bg-[var(--nola-ivory)] transition-colors shadow-md w-full sm:w-auto"
                    >
                      View Tour Details
                    </Link>
                  </div>
                </div>

                {/* Secondary Recommendation */}
                {result.secondary && (
                  <div className="bg-[var(--nola-bg-charcoal)] p-8 border border-[var(--nola-border)]">
                    <h3 className="text-sm font-bold text-[var(--nola-text-muted)] uppercase tracking-widest mb-6 border-b border-[var(--nola-border)] pb-4 text-center">
                      Also worth considering
                    </h3>
                    <div className="text-center mb-6">
                      <h4 className={`text-2xl font-bold text-[var(--nola-ivory)] mb-1 ${visualStyles.accentFont}`}>
                        {TOUR_RECORDS[result.secondary.slug].experienceType}
                      </h4>
                      <p className="text-[10px] font-bold text-[var(--nola-text-muted)] uppercase tracking-widest">
                        Operated by {TOUR_RECORDS[result.secondary.slug].operator}
                      </p>
                    </div>

                    <div className="mb-6">
                      {result.secondary.reasons.map((reason, idx) => (
                        <p key={idx} className="text-sm text-[var(--nola-text-muted)] leading-relaxed text-center italic">
                          &quot;{reason}&quot;
                        </p>
                      ))}
                    </div>

                    <div className="flex justify-center">
                      <Link
                        href={`/new-orleans/tours/${result.secondary.slug}`}
                        onClick={handleSecondaryClick}
                        className="border border-[var(--nola-gold)] text-[var(--nola-gold)] font-bold py-3 px-6 uppercase tracking-widest text-xs text-center hover:bg-[var(--nola-gold)] hover:text-[var(--nola-bg-black)] transition-colors w-full sm:w-auto"
                      >
                        Compare Option
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Human Help Escalation */}
            <div className="mt-16 text-center border-t border-[var(--nola-border)] pt-12">
              <h3 className="text-xl font-bold text-[var(--nola-ivory)] mb-4">Still not sure?</h3>
              <p className="text-sm text-[var(--nola-text-muted)] max-w-md mx-auto mb-6 leading-relaxed">
                Tell us your group size, where you are staying, and when you are free. We’ll help you narrow it down.
              </p>
              <Link
                href="/contact"
                onClick={handleHelpRequested}
                className="inline-block border-b border-[var(--nola-gold)] text-[var(--nola-gold)] font-bold uppercase tracking-widest text-xs pb-1 hover:text-[var(--nola-ivory)] hover:border-[var(--nola-ivory)] transition-all"
              >
                Get Planning Help
              </Link>
            </div>
          </section>
        ) : (
          <section className={`${visualStyles.surfacePanel} p-6 md:p-10 my-8 sm:my-16 ${visualStyles.fadeStep}`}>
            <div className={`max-w-xl mx-auto ${isTransitioning ? 'opacity-0' : 'opacity-100 transition-opacity duration-200'}`}>
              <div className="text-center mb-10">
                <div className="flex justify-center items-center gap-2 mb-6">
                  {STEPS.map((_, idx) => (
                    <div
                      key={idx}
                      className={`h-[3px] transition-all duration-300 ${idx === stepIndex ? 'w-8 bg-[var(--nola-gold)]' : idx < stepIndex ? 'w-3 bg-[var(--nola-gold-muted)] opacity-50' : 'w-3 bg-[var(--nola-text-muted)] opacity-20'}`}
                      aria-hidden="true"
                    />
                  ))}
                </div>
                <h2 className={`${visualStyles.stepTitle} ${visualStyles.accentFont}`}>
                  {currentQuestion.title}
                </h2>
              </div>

              <div className="space-y-3">
                {currentQuestion.options.map((option, idx) => {
                  const isSelected = answers[currentStepId] === option;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelect(option)}
                      aria-pressed={isSelected}
                      className={`${visualStyles.choiceButton} ${isSelected ? visualStyles.selected : ''}`}
                    >
                      <span className="text-base sm:text-lg tracking-wide font-light">
                        {option}
                      </span>
                      <span className={visualStyles.choiceIcon} aria-hidden="true">
                        {isSelected ? '✓' : '→'}
                      </span>
                    </button>
                  );
                })}
              </div>

              {stepIndex > 0 && (
                <div className="mt-8 text-center">
                  <button
                    onClick={handleBack}
                    className="text-xs font-bold text-[var(--nola-text-muted)] uppercase tracking-widest hover:text-[var(--nola-gold)] transition-colors p-2"
                  >
                    ← Back
                  </button>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
