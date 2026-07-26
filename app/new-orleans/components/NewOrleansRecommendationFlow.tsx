"use client";

import React, { useState, useEffect, useRef } from "react";
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
import Link from "next/link";
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
  const [flowStarted, setFlowStarted] = useState(false);
  const resultShownTrackedRef = useRef(false);

  const currentStepId = STEPS[stepIndex] as keyof RecommendationInputs;
  const currentQuestion = QUESTIONS[currentStepId];

  useEffect(() => {
    if (result && !resultShownTrackedRef.current) {
      trackEvent("recommendation_result_shown", {
        surface: "new_orleans_homepage",
        planning_window: answers.planningWindow,
        available_time: answers.availableTime,
        transportation_need: answers.transportation,
        group_style: answers.groupStyle,
        mixed_ages: answers.mixedAges,
        historical_interest: answers.historicalInterest,
        recommended_tour_slug: result.primary?.slug,
      });
      resultShownTrackedRef.current = true;
    }
  }, [result, answers]);

  const handleSelect = (option: string) => {
    if (!flowStarted) {
      trackEvent("recommendation_flow_started", { surface: "new_orleans_homepage" });
      setFlowStarted(true);
    }

    trackEvent("recommendation_answer_selected", {
      surface: "new_orleans_homepage",
      question: currentStepId,
      answer: option
    });

    const newAnswers = { ...answers, [currentStepId]: option };
    setAnswers(newAnswers);

    if (stepIndex < STEPS.length - 1) {
      setStepIndex(stepIndex + 1);
    } else {
      const evaluation = evaluateRecommendation(newAnswers as RecommendationInputs);
      setResult(evaluation);
      resultShownTrackedRef.current = false;
    }
  };

  const handleRestart = () => {
    setStepIndex(0);
    setAnswers({});
    setResult(null);
    setFlowStarted(false);
    resultShownTrackedRef.current = false;
  };

  const handlePrimaryClick = (slug: string, operator: string) => {
    trackEvent("primary_recommendation_selected", {
      surface: "new_orleans_homepage",
      recommended_tour_slug: slug,
      operator
    });
  };

  const handleSecondaryClick = (slug: string, operator: string) => {
    trackEvent("secondary_recommendation_selected", {
      surface: "new_orleans_homepage",
      recommended_tour_slug: slug,
      operator
    });
  };

  const handleHelpRequested = () => {
    trackEvent("recommendation_help_requested", { surface: "new_orleans_homepage" });
  };

  if (result) {
    return (
      <section className="bg-[#151515] text-[#fdfbf7] py-16 px-6 max-w-4xl mx-auto border border-[#2a2a2a] my-12 shadow-xl">
        <div className="text-center mb-12">
          <span className="text-[#d4af37] text-3xl mb-4 block">⚜️</span>
          <h2 className={`text-3xl md:text-4xl font-bold uppercase tracking-widest ${visualStyles.accentFont}`}>
            Your Recommendation
          </h2>
          <button onClick={handleRestart} className="mt-4 text-xs font-bold text-[#aaaaaa] uppercase tracking-widest hover:text-[#d4af37] transition-colors border-b border-[#aaaaaa] hover:border-[#d4af37] pb-1">
            Start Over
          </button>
        </div>

        {result.isNoFit || !result.primary ? (
          <div className="bg-[#1a1a1a] p-8 md:p-12 border border-[#2a2a2a] text-center">
            <h3 className="text-2xl font-bold text-[#fdfbf7] mb-6">No Strong Fit</h3>
            <p className="text-[#cccccc] text-lg leading-relaxed mb-8">
              None of our four current bookable experiences is a strong match for what you selected.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                onClick={handleHelpRequested}
                className="bg-[#d4af37] text-[#151515] font-bold py-4 px-8 uppercase tracking-widest text-sm hover:bg-[#fdfbf7] transition-colors shadow-md"
              >
                Call or text for help
              </Link>
              <button
                onClick={handleRestart}
                className="bg-[#101010] border border-[#2a2a2a] text-[#fdfbf7] font-bold py-4 px-8 uppercase tracking-widest text-sm hover:border-[#d4af37] hover:text-[#d4af37] transition-colors"
              >
                Adjust answers
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Primary Recommendation */}
            <div className="bg-[#1a1a1a] p-8 md:p-12 border border-[#d4af37] shadow-[0_0_20px_rgba(212,175,55,0.1)] relative">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#d4af37] text-[#151515] px-6 py-2 font-bold uppercase tracking-widest text-xs shadow-md">
                Best fit for your group
              </div>
              <div className="mt-6 text-center mb-8">
                <h3 className={`text-3xl font-bold text-[#fdfbf7] mb-2 ${visualStyles.accentFont}`}>
                  {TOUR_RECORDS[result.primary.slug].experienceType}
                </h3>
                <p className="text-sm font-bold text-[#d4af37] uppercase tracking-widest">
                  Operated by {TOUR_RECORDS[result.primary.slug].operator}
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-bold text-[#aaaaaa] uppercase tracking-widest mb-3 border-b border-[#2a2a2a] pb-2">Why it fits</h4>
                  <ul className="space-y-2">
                    {result.primary.reasons.map((reason, idx) => (
                      <li key={idx} className="flex items-start text-sm text-[#cccccc] leading-relaxed gap-3">
                        <span className="text-[#d4af37] mt-1">✓</span>
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="grid sm:grid-cols-2 gap-6 bg-[#151515] p-6 border border-[#2a2a2a]">
                  <div>
                    <h4 className="text-[10px] font-bold text-[#aaaaaa] uppercase tracking-widest mb-1">Experience Duration</h4>
                    <p className="text-sm text-[#fdfbf7]">{TOUR_RECORDS[result.primary.slug].verifiedDurationLabel}</p>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold text-[#aaaaaa] uppercase tracking-widest mb-1">Complete Time</h4>
                    <p className="text-sm text-[#fdfbf7]">{TOUR_RECORDS[result.primary.slug].verifiedTimeCommitmentLabel}</p>
                  </div>
                  <div className="sm:col-span-2 border-t border-[#2a2a2a] pt-4">
                    <h4 className="text-[10px] font-bold text-[#aaaaaa] uppercase tracking-widest mb-1">Transportation Status</h4>
                    <p className="text-sm text-[#fdfbf7]">{TOUR_RECORDS[result.primary.slug].transportationAvailable}</p>
                  </div>
                </div>

                {result.primary.cautionReasons.length > 0 && (
                  <div className="bg-[#101010] p-6 border-l-2 border-[#d4af37]">
                    <h4 className="text-[10px] font-bold text-[#d4af37] uppercase tracking-widest mb-2">Verify Before Booking</h4>
                    <ul className="space-y-1">
                      {result.primary.cautionReasons.map((caution, idx) => (
                         <li key={idx} className="text-sm text-[#aaaaaa] leading-relaxed">• {caution}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center pt-8 border-t border-[#2a2a2a]">
                <Link
                  href={`/new-orleans/tours/${result.primary.slug}`}
                  onClick={() => handlePrimaryClick(result.primary!.slug, TOUR_RECORDS[result.primary!.slug].operator)}
                  className="bg-[#d4af37] text-[#151515] font-bold py-4 px-8 uppercase tracking-widest text-sm text-center hover:bg-[#fdfbf7] transition-colors shadow-md w-full sm:w-auto"
                >
                  View Tour Details
                </Link>
                {/* Fallback FareHarbor link can go here, but view details is primary path */}
              </div>
            </div>

            {/* Secondary Recommendation */}
            {result.secondary && (
              <div className="bg-[#1a1a1a] p-8 border border-[#2a2a2a]">
                <h3 className="text-sm font-bold text-[#aaaaaa] uppercase tracking-widest mb-6 border-b border-[#2a2a2a] pb-4 text-center">
                  Also worth considering
                </h3>
                <div className="text-center mb-6">
                  <h4 className={`text-2xl font-bold text-[#fdfbf7] mb-1 ${visualStyles.accentFont}`}>
                    {TOUR_RECORDS[result.secondary.slug].experienceType}
                  </h4>
                  <p className="text-[10px] font-bold text-[#aaaaaa] uppercase tracking-widest">
                    Operated by {TOUR_RECORDS[result.secondary.slug].operator}
                  </p>
                </div>

                <div className="mb-6">
                  {result.secondary.reasons.map((reason, idx) => (
                    <p key={idx} className="text-sm text-[#cccccc] leading-relaxed text-center italic">
                      &quot;{reason}&quot;
                    </p>
                  ))}
                </div>

                <div className="flex justify-center">
                  <Link
                    href={`/new-orleans/tours/${result.secondary.slug}`}
                    onClick={() => handleSecondaryClick(result.secondary!.slug, TOUR_RECORDS[result.secondary!.slug].operator)}
                    className="border border-[#d4af37] text-[#d4af37] font-bold py-3 px-6 uppercase tracking-widest text-xs text-center hover:bg-[#d4af37] hover:text-[#151515] transition-colors w-full sm:w-auto"
                  >
                    Compare Option
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Human Help Escalation */}
        <div className="mt-16 text-center border-t border-[#2a2a2a] pt-12">
          <h3 className="text-xl font-bold text-[#fdfbf7] mb-4">Still not sure?</h3>
          <p className="text-sm text-[#cccccc] max-w-md mx-auto mb-6 leading-relaxed">
            Tell us your group size, where you are staying, and when you are free. We’ll help you narrow it down.
          </p>
          <Link
            href="/contact"
            onClick={handleHelpRequested}
            className="inline-block border-b border-[#d4af37] text-[#d4af37] font-bold uppercase tracking-widest text-xs pb-1 hover:text-[#fdfbf7] hover:border-[#fdfbf7] transition-all"
          >
            Get Planning Help
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-[#101010] py-20 px-6 border-y border-[#2a2a2a]">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-[#d4af37] text-2xl mb-4 block">⚜️</span>
          <h2 className={`text-3xl md:text-4xl font-bold text-[#fdfbf7] ${visualStyles.accentFont}`}>
            {currentQuestion.title}
          </h2>
          <div className="mt-6 flex justify-center items-center gap-2">
            {STEPS.map((_, idx) => (
              <div
                key={idx}
                className={`h-1 rounded-full transition-all duration-300 ${idx === stepIndex ? 'w-8 bg-[#d4af37]' : idx < stepIndex ? 'w-4 bg-[#aaaaaa]' : 'w-4 bg-[#2a2a2a]'}`}
              />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {currentQuestion.options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => handleSelect(option)}
              className="w-full text-left bg-[#1a1a1a] border border-[#2a2a2a] p-6 hover:border-[#d4af37] hover:bg-[#151515] transition-all group flex items-center justify-between"
            >
              <span className="text-lg text-[#cccccc] group-hover:text-[#fdfbf7] font-light">
                {option}
              </span>
              <span className="text-[#d4af37] opacity-0 group-hover:opacity-100 transition-opacity">
                →
              </span>
            </button>
          ))}
        </div>

        {stepIndex > 0 && (
          <div className="mt-8 text-center">
            <button
              onClick={() => setStepIndex(stepIndex - 1)}
              className="text-xs font-bold text-[#aaaaaa] uppercase tracking-widest hover:text-[#d4af37] transition-colors"
            >
              ← Back
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
