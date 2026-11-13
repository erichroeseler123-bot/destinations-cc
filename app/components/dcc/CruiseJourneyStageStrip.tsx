"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import TrackedCruisePromenadeLink from "@/app/components/dcc/TrackedCruisePromenadeLink";
import { getOrCreateJourneyId, isQaTestMode } from "@/lib/dcc/telemetry/clientNetworkEvents";

interface JourneyStageCard {
  id: string;
  stagesLabel: string;
  title: string;
  description: string;
  dccHref: string;
  dccCta: string;
  cpHref: string;
  cpCta: string;
  rollCallHref?: string;
  rollCallCta?: string;
}

const JOURNEY_BANDS: JourneyStageCard[] = [
  {
    id: "dreaming-fit",
    stagesLabel: "Stages 1–2 · Steps 1–6",
    title: "Dreaming & Real Budget Fit",
    description:
      "Match crowd tolerance, scenery vs. ship energy, seasonality, and true all-in cruise budget before comparing prices.",
    dccHref: "/cruises/fit?stage=dreaming",
    dccCta: "Take DCC Fit Quiz →",
    cpHref: "https://cruisepromenade.com/journey?stage=dreaming",
    cpCta: "Open Stage 1 on Cruise Promenade ↗",
  },
  {
    id: "comparing-ships",
    stagesLabel: "Stages 3–5 · Steps 7–15",
    title: "Line, Ship & Turnaround Homeport",
    description:
      "Compare ship classes, embarkation homeports (PortMiami, Canaveral, Seattle, Vancouver), and pre-cruise flight buffers.",
    dccHref: "/cruises/from/miami",
    dccCta: "Compare Departure Ports →",
    cpHref: "https://cruisepromenade.com/journey?stage=comparing",
    cpCta: "Build Group Shortlist ↗",
    rollCallHref: "https://rollcallusa.com/",
    rollCallCta: "Join Sailing Roll Call on RollCallUSA ↗",
  },
  {
    id: "port-excursions",
    stagesLabel: "Stages 6–8 · Steps 16–25",
    title: "Port Days & 2-Hour Buffer Evaluator",
    description:
      "Lead with available departures that match your port schedule and preserve DCC's canonical 120-minute return buffer.",
    dccHref: "/cruises/shore-excursions",
    dccCta: "Evaluate Shore Excursions →",
    cpHref: "https://cruisepromenade.com/journey?stage=excursions",
    cpCta: "Coordinate Group Excursions ↗",
  },
  {
    id: "port-emergency-replan",
    stagesLabel: "Stages 9–12 · Steps 26–37",
    title: "In-Port Wi-Fi Replan & Disruptions",
    description:
      "Spotty ship Wi-Fi (< 50 KB) port replan views for late docking, tender queues, weather cancellations, and debark cutoffs.",
    dccHref: "/ports/juneau/replan",
    dccCta: "Open Ship-Wi-Fi Port Replan →",
    cpHref: "https://cruisepromenade.com/journey?stage=in_port",
    cpCta: "Open Port-Day Playbook ↗",
  },
];

export default function CruiseJourneyStageStrip() {
  const [journeyId, setJourneyId] = useState<string | null>(null);
  const [qaTest, setQaTest] = useState(false);

  useEffect(() => {
    const id = getOrCreateJourneyId();
    if (id && id !== "ssr") setJourneyId(id);
    setQaTest(isQaTestMode());
  }, []);

  const withJourneyInternal = (href: string) => {
    if (!journeyId) return href;
    const sep = href.includes("?") ? "&" : "?";
    return `${href}${sep}journey_id=${encodeURIComponent(journeyId)}${qaTest ? "&qa_test=1" : ""}`;
  };

  const withJourneyRollCall = (href: string) => {
    if (!journeyId) return href;
    try {
      const u = new URL(href);
      u.searchParams.set("journey_id", journeyId);
      if (qaTest) u.searchParams.set("qa_test", "1");
      return u.toString();
    } catch {
      return href;
    }
  };

  return (
    <section
      aria-label="12-Stage Cruise Journey: Choose Where You Are"
      data-testid="dcc-12-stage-cruise-journey-strip"
      className="rounded-3xl border border-cyan-400/25 bg-cyan-950/20 p-6"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">
            Connected 12-Stage / 37-Step CYOA Architecture
          </div>
          <h2 className="mt-1.5 text-2xl font-black text-white">
            12-Stage Cruise Journey: Choose Where You Are
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-300">
            Jump straight into the stage that matches your trip right now. Destination Command Center powers verified port intelligence and 2-hour buffer math, Cruise Promenade coordinates your interactive journey and group board, and RollCallUSA connects fellow passengers on your sailing.
          </p>
        </div>
        <TrackedCruisePromenadeLink
          href="https://cruisepromenade.com/journey"
          testId="cruise-hub-open-full-cyoa-journey"
          className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full bg-emerald-400 px-5 py-2 text-xs font-black uppercase tracking-[0.12em] text-zinc-950 transition hover:bg-emerald-300"
        >
          Open Full 12-Stage Journey →
        </TrackedCruisePromenadeLink>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {JOURNEY_BANDS.map((band) => (
          <article
            key={band.id}
            data-testid={`journey-band-${band.id}`}
            className="flex flex-col justify-between rounded-2xl border border-white/10 bg-black/35 p-5"
          >
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-cyan-300">
                {band.stagesLabel}
              </div>
              <h3 className="mt-1.5 text-lg font-bold text-white">{band.title}</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-300">{band.description}</p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 pt-2">
              <Link
                href={withJourneyInternal(band.dccHref)}
                className="inline-flex items-center rounded-full bg-cyan-300 px-3.5 py-2 text-xs font-bold text-zinc-950 transition hover:bg-cyan-200"
              >
                {band.dccCta}
              </Link>
              <TrackedCruisePromenadeLink
                href={band.cpHref}
                className="inline-flex items-center rounded-full border border-emerald-400/40 bg-emerald-500/15 px-3.5 py-2 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-500/25"
              >
                {band.cpCta}
              </TrackedCruisePromenadeLink>
              {band.rollCallHref && band.rollCallCta ? (
                <a
                  href={withJourneyRollCall(band.rollCallHref)}
                  data-testid="journey-strip-rollcallusa-link"
                  className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-semibold text-zinc-200 transition hover:bg-white/10"
                >
                  {band.rollCallCta}
                </a>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
