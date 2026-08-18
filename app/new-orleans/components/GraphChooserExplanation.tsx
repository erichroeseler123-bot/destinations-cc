"use client";

import { useEffect, useMemo, useState } from "react";
import { getExperienceGraphRecord } from "../data/experienceGraphV2";
import { TOUR_RECORDS } from "../lib/tourRecommendationRules";

const CHOOSER_RECOMMENDATION = "wno_chooser_recommendation";

type CapturedAnswers = {
  availableTime?: string;
  transportation?: string;
  groupStyle?: string;
  mixedAges?: string;
  historicalInterest?: string;
  planningWindow?: string;
};

const ANSWER_MAP: Record<string, keyof CapturedAnswers> = {
  "Something for today": "planningWindow",
  "Something for tomorrow": "planningWindow",
  "A first New Orleans experience": "planningWindow",
  "A family or mixed-age group": "planningWindow",
  "A group that needs help deciding": "planningWindow",
  "About 3 hours": "availableTime",
  "About half a day": "availableTime",
  "Most of the day": "availableTime",
  "We need pickup or transportation": "transportation",
  "We can drive ourselves": "transportation",
  "Not sure": "transportation",
  "Relaxed and comfortable": "groupStyle",
  "Balanced": "groupStyle",
  "Fast and adventurous": "groupStyle",
  "Yes": "mixedAges",
  "No": "mixedAges",
  "Strong interest": "historicalInterest",
  "Some interest": "historicalInterest",
  "Not the priority": "historicalInterest",
};

function maxMinutes(answer?: string) {
  if (answer === "About 3 hours") return 210;
  if (answer === "About half a day") return 360;
  if (answer === "Most of the day") return 600;
  return null;
}

function buildContextReasons(slug: string, answers: CapturedAnswers) {
  const graph = getExperienceGraphRecord(slug);
  if (!graph) return [];
  const reasons: string[] = [];
  const timeLimit = maxMinutes(answers.availableTime);
  const total = graph.doorToDoorWithPickupMinutes.value?.typical ?? graph.activityMinutes.value?.typical ?? null;

  if (timeLimit && total && total <= timeLimit) reasons.push(`It fits the ${answers.availableTime?.toLowerCase()} window you selected.`);
  if (answers.transportation === "We need pickup or transportation" && graph.pickupFrenchQuarter.value === true) reasons.push("You said you need transportation, and this option has a verified French Quarter pickup path.");
  if (answers.transportation === "We can drive ourselves" && graph.selfDriveAvailable.value === true) reasons.push("You said you can drive, and this experience has a verified self-drive option.");
  if (answers.groupStyle === "Relaxed and comfortable" && graph.thrillIntensity.value === "calm") reasons.push("Its calmer format matches the relaxed pace you selected.");
  if (answers.groupStyle === "Fast and adventurous" && graph.thrillIntensity.value === "high") reasons.push("Its higher-thrill format matches the adventurous pace you selected.");
  if (answers.historicalInterest === "Strong interest" && ["slavery_centered", "architecture_landscape", "general"].includes(graph.historyFocus.value || "")) reasons.push("You marked history as important, and history is a meaningful part of this experience.");
  if (answers.mixedAges === "Yes" && graph.minimumAge.value === 0) reasons.push("The verified age policy supports mixed-age groups.");
  if (answers.planningWindow === "A first New Orleans experience" && slug === "city-tour-of-new-orleans") reasons.push("A broad city overview is a strong first-visit orientation before you spend time on narrower experiences.");

  return reasons;
}

function buildRuledOut(slug: string, answers: CapturedAnswers) {
  const graph = getExperienceGraphRecord(slug);
  const alternativeSlug = graph?.alternativeSlug;
  if (!graph || !alternativeSlug) return null;
  const alternative = TOUR_RECORDS[alternativeSlug];
  if (!alternative) return null;

  let reason: string | null = null;
  if (slug === "covered-tour-boat" && answers.groupStyle === "Relaxed and comfortable") {
    reason = "the airboat is louder, more exposed and more thrill-oriented than the pace you selected.";
  } else if (slug === "ragin-cajun-airboat-options" && answers.groupStyle === "Fast and adventurous") {
    reason = "the covered boat is the calmer choice, so it is a weaker match for the adventurous pace you selected.";
  } else if (slug === "whitney-plantation-tour" && answers.historicalInterest === "Strong interest") {
    reason = "we prioritized Whitney for the stronger slavery-centered historical focus represented in the graph.";
  } else if (slug === "daytime-jazz-cruise" && answers.planningWindow === "Something for today") {
    reason = "the daytime option preserves your evening for something else instead of making the cruise the nighttime anchor.";
  } else if (slug === "evening-jazz-cruise") {
    reason = "the evening option makes the river and live jazz the centerpiece of the night rather than using daytime hours.";
  } else if (slug === "city-tour-of-new-orleans" && answers.planningWindow === "A first New Orleans experience") {
    reason = "the swamp is a narrower Louisiana outing; the city overview better matches the first-visit context you selected.";
  }

  return reason ? { title: alternative.experienceType, reason } : null;
}

export default function GraphChooserExplanation() {
  const [slug, setSlug] = useState<string | null>(null);
  const [answers, setAnswers] = useState<CapturedAnswers>({});

  useEffect(() => {
    const planner = document.getElementById("guided-planner");
    if (!planner) return;

    const onClick = (event: Event) => {
      const target = event.target as HTMLElement | null;
      const button = target?.closest("button");
      if (!button) return;
      const text = button.textContent?.trim() || "";
      const key = ANSWER_MAP[text];
      if (key) setAnswers((current) => ({ ...current, [key]: text }));
      if (text === "Start over") setAnswers({});
    };

    planner.addEventListener("click", onClick);
    const readRecommendation = () => {
      try {
        setSlug(sessionStorage.getItem(CHOOSER_RECOMMENDATION));
      } catch {
        setSlug(null);
      }
    };
    readRecommendation();
    const timer = window.setInterval(readRecommendation, 350);
    return () => {
      planner.removeEventListener("click", onClick);
      window.clearInterval(timer);
    };
  }, []);

  const graph = slug ? getExperienceGraphRecord(slug) : null;
  const reasons = useMemo(() => (slug ? buildContextReasons(slug, answers) : []), [slug, answers]);
  const ruledOut = useMemo(() => (slug ? buildRuledOut(slug, answers) : null), [slug, answers]);

  if (!slug || !graph) return null;
  const fallbackReasons = graph.bestFor.slice(0, 2);
  const because = reasons.length ? reasons.slice(0, 4) : fallbackReasons;
  if (!because.length && !graph.tradeOff && !ruledOut) return null;

  return (
    <section className="border-t border-[#d4af37]/20 bg-[#0d0b0f] px-6 py-10" aria-live="polite">
      <div className="mx-auto max-w-3xl rounded-2xl border border-[#d4af37]/30 bg-[#171419] p-6 md:p-8">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#d4af37]">Why this recommendation won</p>
        {because.length > 0 && (
          <div className="mt-5">
            <h3 className="text-sm font-bold uppercase tracking-widest text-[#fdfbf7]">Because</h3>
            <ul className="mt-3 space-y-2">
              {because.map((reason) => <li key={reason} className="flex gap-3 text-sm leading-6 text-[#bbb0a1]"><span className="text-[#d4af37]">✓</span><span>{reason}</span></li>)}
            </ul>
          </div>
        )}
        {graph.tradeOff && (
          <div className="mt-6 border-l-2 border-[#d4af37] pl-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#d4af37]">Trade-off</p>
            <p className="mt-2 text-sm leading-6 text-[#bbb0a1]">{graph.tradeOff}</p>
          </div>
        )}
        {ruledOut && (
          <div className="mt-6 border-t border-white/10 pt-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#d4af37]">We ruled out for this recommendation</p>
            <p className="mt-2 text-sm leading-6 text-[#bbb0a1]"><strong className="text-[#fdfbf7]">{ruledOut.title}</strong> — {ruledOut.reason}</p>
          </div>
        )}
        <p className="mt-6 text-[11px] leading-5 text-white/45">This explanation only uses recommendation inputs and Experience Graph facts currently available to WNO. Variant-dependent details still must be confirmed during booking.</p>
      </div>
    </section>
  );
}
