"use client";

import { useState } from "react";
import Link from "next/link";

type AnswerValue = "yes" | "no" | "depends";

type Question = {
  id: string;
  prompt: string;
  answers: {
    value: AnswerValue;
    label: string;
    archetype: ArchetypeId;
  }[];
};

type ArchetypeId =
  | "relaxed-scenic"
  | "ship-first"
  | "family-logistics"
  | "premium-quiet"
  | "value-first";

type Archetype = {
  id: ArchetypeId;
  title: string;
  summary: string;
  whyItFits: string;
  avoid: string;
  nextLinks: {
    href: string;
    label: string;
  }[];
};

const QUESTIONS: Question[] = [
  {
    id: "crowds",
    prompt: "Would it bother you if the ship felt crowded or a little chaotic by the pool and buffet?",
    answers: [
      { value: "yes", label: "Yes, that would wear on me", archetype: "premium-quiet" },
      { value: "depends", label: "Only if the trip still feels easy", archetype: "family-logistics" },
      { value: "no", label: "No, energy is fine", archetype: "ship-first" },
    ],
  },
  {
    id: "scenery",
    prompt: "If the ship were just okay but the itinerary was beautiful, would that still feel like a win?",
    answers: [
      { value: "yes", label: "Yes, the destination matters more", archetype: "relaxed-scenic" },
      { value: "depends", label: "Only if the overall trip stays smooth", archetype: "family-logistics" },
      { value: "no", label: "No, the ship experience matters too much", archetype: "ship-first" },
    ],
  },
  {
    id: "budget",
    prompt: "Are you trying to keep this fairly tight, even if that means skipping some extras or polish?",
    answers: [
      { value: "yes", label: "Yes, value matters a lot", archetype: "value-first" },
      { value: "depends", label: "I care about value, but not if it creates friction", archetype: "family-logistics" },
      { value: "no", label: "No, I would pay more to avoid compromises", archetype: "premium-quiet" },
    ],
  },
] as const;

const ARCHETYPES: Record<ArchetypeId, Archetype> = {
  "relaxed-scenic": {
    id: "relaxed-scenic",
    title: "Relaxed scenic cruise",
    summary: "You are probably happiest when the itinerary is doing most of the work and the ship is there to support the view, not dominate it.",
    whyItFits:
      "The trip goes right for you when port days, scenery, and calm pacing matter more than headline ship features or nonstop activity.",
    avoid:
      "Avoid choosing purely on biggest-ship energy if the real thing you want is destination time and a steadier rhythm.",
    nextLinks: [
      { href: "/cruises/from/seattle", label: "Start with departure ports" },
      { href: "/cruises/tendering", label: "Check logistics-heavy days" },
    ],
  },
  "ship-first": {
    id: "ship-first",
    title: "High-energy ship-first cruise",
    summary: "You want the ship to feel like part of the vacation, not just the transportation between stops.",
    whyItFits:
      "This fit works when onboard energy, line personality, entertainment, and the feel of the ship matter more than squeezing every ounce out of the itinerary.",
    avoid:
      "Avoid over-weighting destination prestige if you know you will care more about the ship feeling lively and worth being on.",
    nextLinks: [
      { href: "/cruises/ship/icon-of-the-seas", label: "Compare ship feel" },
      { href: "/cruises/line/royal-caribbean-international", label: "See line personality" },
    ],
  },
  "family-logistics": {
    id: "family-logistics",
    title: "Family logistics-first cruise",
    summary: "You are not chasing the loudest or fanciest option. You want the trip to work without too many points of failure.",
    whyItFits:
      "This fit is strongest when transfers, embarkation stress, meal rhythm, and daily predictability matter more than marketing language about luxury or excitement.",
    avoid:
      "Avoid booking around price alone if the hidden cost is a week of friction, crowd stress, or awkward port-day timing.",
    nextLinks: [
      { href: "/cruises/tendering", label: "Reduce logistics risk" },
      { href: "/cruises/from/miami", label: "Compare easier departures" },
    ],
  },
  "premium-quiet": {
    id: "premium-quiet",
    title: "Premium quiet cruise",
    summary: "You are likely paying for calm, space, and fewer annoyances more than for maximum ship activity.",
    whyItFits:
      "This fit works when crowd feel, noise level, and overall polish will shape your experience more than the raw number of features on the brochure.",
    avoid:
      "Avoid value-heavy mass-market choices if you already know the crowded feel will ruin the trip for you by day two.",
    nextLinks: [
      { href: "/cruises/line/viking-expeditions", label: "See a calmer line profile" },
      { href: "/cruises/ship/viking-octantis", label: "Look at a quieter ship example" },
    ],
  },
  "value-first": {
    id: "value-first",
    title: "Value-first first-timer cruise",
    summary: "You want a good first cruise decision without paying for status signals or extras you may not care about yet.",
    whyItFits:
      "This fit works when the real goal is getting onto the right kind of trip at a sane cost while still avoiding the biggest mismatch mistakes.",
    avoid:
      "Avoid chasing ultra-cheap fares without checking what adds up later, especially if drinks, gratuities, and port-day expectations are fuzzy.",
    nextLinks: [
      { href: "/cruises/line/carnival-cruise-line", label: "See a value-oriented line example" },
      { href: "/cruises/shore-excursions", label: "Understand excursion cost pressure" },
    ],
  },
};

export default function CruiseFitWizard() {
  const [answers, setAnswers] = useState<Record<string, ArchetypeId>>({});

  const answeredCount = Object.keys(answers).length;
  const hasResult = answeredCount === QUESTIONS.length;

  const result = hasResult
    ? Object.values(answers).reduce(
        (best, archetypeId) => {
          best[archetypeId] = (best[archetypeId] ?? 0) + 1;
          return best;
        },
        {} as Record<ArchetypeId, number>
      )
    : null;

  const resultId = result
    ? (Object.entries(result).sort((a, b) => b[1] - a[1])[0]?.[0] as ArchetypeId)
    : null;

  const archetype = resultId ? ARCHETYPES[resultId] : null;

  function setAnswer(questionId: string, archetypeId: ArchetypeId) {
    setAnswers((current) => ({ ...current, [questionId]: archetypeId }));
  }

  function reset() {
    setAnswers({});
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">Cruise fit conversation</div>
          <h2 className="mt-2 text-2xl font-black">Answer a few real questions, not a generic quiz.</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-300">
            This is trying to surface what usually creates regret: crowd tolerance, ship-vs-itinerary priority, and how much friction your budget can absorb.
          </p>
        </div>
        <div className="text-sm text-zinc-400">{answeredCount}/{QUESTIONS.length} answered</div>
      </div>

      <div className="mt-6 grid gap-4">
        {QUESTIONS.map((question, index) => {
          const selected = answers[question.id] ?? null;
          return (
            <article key={question.id} className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">Question {index + 1}</div>
              <h3 className="mt-2 text-lg font-semibold text-white">{question.prompt}</h3>
              <div className="mt-4 flex flex-col gap-3">
                {question.answers.map((answer) => {
                  const isSelected = selected === answer.archetype;
                  return (
                    <button
                      key={answer.label}
                      type="button"
                      onClick={() => setAnswer(question.id, answer.archetype)}
                      className={
                        isSelected
                          ? "rounded-2xl border border-cyan-300/40 bg-cyan-500/15 px-4 py-3 text-left text-sm font-semibold text-cyan-100"
                          : "rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-zinc-200 transition hover:bg-white/10"
                      }
                    >
                      {answer.label}
                    </button>
                  );
                })}
              </div>
            </article>
          );
        })}
      </div>

      {archetype ? (
        <div className="mt-8 rounded-3xl border border-cyan-300/30 bg-cyan-500/10 p-6">
          <div className="text-xs font-black uppercase tracking-[0.18em] text-cyan-200">Best-fit result</div>
          <h3 className="mt-2 text-2xl font-black text-white">{archetype.title}</h3>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-cyan-50">{archetype.summary}</p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-sm font-semibold text-white">Why this fits</div>
              <p className="mt-2 text-sm leading-7 text-zinc-300">{archetype.whyItFits}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-sm font-semibold text-white">What to avoid</div>
              <p className="mt-2 text-sm leading-7 text-zinc-300">{archetype.avoid}</p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {archetype.nextLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-cyan-300 px-5 text-sm font-semibold text-zinc-950 transition hover:bg-cyan-200"
              >
                {link.label}
              </Link>
            ))}
            <button
              type="button"
              onClick={reset}
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/12 bg-white/6 px-5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Start over
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
