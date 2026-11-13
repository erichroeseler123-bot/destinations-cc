"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import TrackedCruisePromenadeLink from "@/app/components/dcc/TrackedCruisePromenadeLink";
import { getOrCreateJourneyId } from "@/lib/dcc/telemetry/clientNetworkEvents";

type AnswerValue = "yes" | "no" | "depends";

type CyoaJourneyStageId = "dreaming" | "comparing" | "excursions" | "booked";

type RegionFilterId =
  | "any"
  | "caribbean"
  | "alaska"
  | "europe"
  | "bahamas"
  | "mexico"
  | "hawaii"
  | "new-england";

type TravelPartyFilterId = "any" | "couple" | "family" | "friends-group" | "solo";

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

const CYOA_STAGES: Array<{
  id: CyoaJourneyStageId;
  label: string;
  stepRange: string;
  helper: string;
}> = [
  {
    id: "dreaming",
    label: "Dreaming",
    stepRange: "Stages 1–2 · Fit & Real Budget",
    helper: "Exploring whether a cruise fits how you travel before picking a ship.",
  },
  {
    id: "comparing",
    label: "Comparing Lines & Ships",
    stepRange: "Stages 3–4 · Line, Ship & Cabin",
    helper: "Narrowing down ships, crowd energy, departure ports, and itineraries.",
  },
  {
    id: "excursions",
    label: "Checking Port Excursions",
    stepRange: "Stages 6–8 · Port Days & 2h Buffer",
    helper: "Matching shore excursions against your port window and 120-min buffer.",
  },
  {
    id: "booked",
    label: "Already Booked",
    stepRange: "Stages 5–12 · Countdown to Port Day",
    helper: "Coordinating your group board, turnaround logistics, and port backups.",
  },
];

const REGION_OPTIONS: Array<{ id: RegionFilterId; label: string }> = [
  { id: "any", label: "Any Region" },
  { id: "caribbean", label: "Caribbean" },
  { id: "alaska", label: "Alaska" },
  { id: "europe", label: "Europe / Med" },
  { id: "bahamas", label: "Bahamas" },
  { id: "mexico", label: "Mexico" },
  { id: "hawaii", label: "Hawaii" },
  { id: "new-england", label: "Canada & New England" },
];

const PARTY_OPTIONS: Array<{ id: TravelPartyFilterId; label: string }> = [
  { id: "any", label: "Any Party" },
  { id: "couple", label: "Couple / Adults" },
  { id: "family", label: "Family / Multigen" },
  { id: "friends-group", label: "Friends Group" },
  { id: "solo", label: "Solo Traveler" },
];

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

function appendJourneyContextToInternalPath(
  path: string,
  journeyId: string | null,
  stage: CyoaJourneyStageId,
): string {
  if (!journeyId || journeyId === "ssr") return path;
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}journey_id=${encodeURIComponent(journeyId)}&stage=${encodeURIComponent(stage)}`;
}

function buildCruisePromenadeCyoaUrl(params: {
  archetypeId: ArchetypeId;
  step?: number;
  selectedStage: CyoaJourneyStageId;
  region: RegionFilterId;
  travelParty: TravelPartyFilterId;
}): string {
  const url = new URL("https://cruisepromenade.com/journey");
  url.searchParams.set("stage", "dreaming");
  if (params.step !== undefined) {
    url.searchParams.set("step", String(params.step));
  }
  url.searchParams.set("archetype", params.archetypeId);
  if (params.selectedStage !== "dreaming") {
    url.searchParams.set("entryStage", params.selectedStage);
  }
  if (params.region !== "any") {
    url.searchParams.set("region", params.region);
  }
  if (params.travelParty !== "any") {
    url.searchParams.set("partyType", params.travelParty);
  }
  return url.toString();
}

export default function CruiseFitWizard() {
  const [selectedStage, setSelectedStage] = useState<CyoaJourneyStageId>("dreaming");
  const [regionFilter, setRegionFilter] = useState<RegionFilterId>("any");
  const [partyFilter, setPartyFilter] = useState<TravelPartyFilterId>("any");
  const [answers, setAnswers] = useState<Record<string, ArchetypeId>>({});
  const [journeyId, setJourneyId] = useState<string | null>(null);

  useEffect(() => {
    const id = getOrCreateJourneyId();
    if (id && id !== "ssr") {
      setJourneyId(id);
    }
    try {
      const params = new URLSearchParams(window.location.search);
      const urlStage = params.get("stage")?.trim().toLowerCase();
      if (
        urlStage === "dreaming" ||
        urlStage === "comparing" ||
        urlStage === "excursions" ||
        urlStage === "booked"
      ) {
        setSelectedStage(urlStage);
      }
      const urlRegion = params.get("region")?.trim().toLowerCase() as RegionFilterId | undefined;
      if (urlRegion && REGION_OPTIONS.some((r) => r.id === urlRegion)) {
        setRegionFilter(urlRegion);
      }
    } catch {
      // no-op
    }
  }, []);

  const answeredCount = Object.keys(answers).length;
  const hasResult = answeredCount === QUESTIONS.length;

  const result = hasResult
    ? Object.values(answers).reduce(
        (best, archetypeId) => {
          best[archetypeId] = (best[archetypeId] ?? 0) + 1;
          return best;
        },
        {} as Record<ArchetypeId, number>,
      )
    : null;

  const resultId = result
    ? (Object.entries(result).sort((a, b) => b[1] - a[1])[0]?.[0] as ArchetypeId)
    : null;

  const archetype = resultId ? ARCHETYPES[resultId] : null;
  const activeStageMeta =
    CYOA_STAGES.find((s) => s.id === selectedStage) || CYOA_STAGES[0];

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
          <div className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">
            Cruise fit conversation · Connected 12-Stage Journey
          </div>
          <h2 className="mt-2 text-2xl font-black">
            Answer a few real questions, not a generic quiz.
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-300">
            This is trying to surface what usually creates regret: crowd tolerance, ship-vs-itinerary priority, and how much friction your budget can absorb.
          </p>
        </div>
        <div className="text-sm text-zinc-400">
          {answeredCount}/{QUESTIONS.length} answered
        </div>
      </div>

      {/* Optional CYOA Stage + Destination / Travel Party Selector */}
      <div
        data-testid="cyoa-stage-selector"
        className="mt-6 rounded-2xl border border-cyan-400/20 bg-cyan-950/20 p-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.16em] text-cyan-300">
              Optional · Where are you in your cruise journey?
            </div>
            <p className="mt-1 text-xs text-zinc-300">{activeStageMeta.helper}</p>
          </div>
          <span className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-[11px] font-semibold text-cyan-200">
            {activeStageMeta.stepRange}
          </span>
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {CYOA_STAGES.map((stageOpt) => {
            const isActive = selectedStage === stageOpt.id;
            return (
              <button
                key={stageOpt.id}
                type="button"
                data-testid={`cyoa-stage-pill-${stageOpt.id}`}
                onClick={() => setSelectedStage(stageOpt.id)}
                className={
                  isActive
                    ? "rounded-xl border border-cyan-300/60 bg-cyan-500/20 px-3.5 py-2.5 text-left text-xs font-bold text-cyan-100"
                    : "rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 text-left text-xs font-semibold text-zinc-300 transition hover:bg-white/10"
                }
              >
                <div>{stageOpt.label}</div>
                <div className="mt-0.5 text-[10px] font-normal opacity-80">
                  {stageOpt.stepRange}
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-3 grid gap-3 border-t border-white/10 pt-3 sm:grid-cols-2">
          <div>
            <label
              htmlFor="cyoa-region-filter"
              className="block text-[11px] font-semibold text-zinc-400"
            >
              Optional Destination Region
            </label>
            <select
              id="cyoa-region-filter"
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value as RegionFilterId)}
              className="mt-1 w-full rounded-xl border border-white/15 bg-zinc-950 px-3 py-2 text-xs text-white"
            >
              {REGION_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="cyoa-party-filter"
              className="block text-[11px] font-semibold text-zinc-400"
            >
              Optional Travel Party
            </label>
            <select
              id="cyoa-party-filter"
              value={partyFilter}
              onChange={(e) => setPartyFilter(e.target.value as TravelPartyFilterId)}
              className="mt-1 w-full rounded-xl border border-white/15 bg-zinc-950 px-3 py-2 text-xs text-white"
            >
              {PARTY_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4">
        {QUESTIONS.map((question, index) => {
          const selected = answers[question.id] ?? null;
          return (
            <article key={question.id} className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">
                Question {index + 1}
              </div>
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
        <div
          data-testid="cruise-fit-result-card"
          className="mt-8 rounded-3xl border border-cyan-300/30 bg-cyan-500/10 p-6"
        >
          <div className="text-xs font-black uppercase tracking-[0.18em] text-cyan-200">
            Best-fit result
          </div>
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

          {/* CYOA Branch Launchers to Cruise Promenade */}
          <div className="mt-6 rounded-2xl border border-emerald-400/30 bg-emerald-950/35 p-4">
            <div className="text-xs font-black uppercase tracking-[0.16em] text-emerald-300">
              Continue Your Connected Cruise Journey
            </div>
            <p className="mt-1 text-xs text-zinc-200">
              Carry your <strong>{archetype.title}</strong> fit profile and active{" "}
              <code>journey_id</code> into Cruise Promenade&apos;s interactive 12-stage planner:
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              <TrackedCruisePromenadeLink
                href={buildCruisePromenadeCyoaUrl({
                  archetypeId: archetype.id,
                  selectedStage,
                  region: regionFilter,
                  travelParty: partyFilter,
                })}
                testId="cyoa-launch-cruise-promenade"
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-emerald-400 px-5 py-2 text-sm font-black text-zinc-950 transition hover:bg-emerald-300"
              >
                Launch Your Choose-Your-Own-Adventure Plan on Cruise Promenade →
              </TrackedCruisePromenadeLink>
              <TrackedCruisePromenadeLink
                href={buildCruisePromenadeCyoaUrl({
                  archetypeId: archetype.id,
                  step: 3,
                  selectedStage,
                  region: regionFilter,
                  travelParty: partyFilter,
                })}
                testId="cyoa-estimate-complete-trip-budget"
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-emerald-300/45 bg-emerald-500/15 px-5 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/25"
              >
                Estimate Real Complete-Trip Budget →
              </TrackedCruisePromenadeLink>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            {archetype.nextLinks.map((link) => (
              <Link
                key={link.href}
                href={appendJourneyContextToInternalPath(
                  link.href,
                  journeyId,
                  selectedStage,
                )}
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
