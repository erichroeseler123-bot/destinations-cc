"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  getOrCreateJourneyId,
  isQaTestMode,
  trackNetworkEvent,
} from "@/lib/dcc/telemetry/clientNetworkEvents";

interface ContextualSpecialistReturnBannerProps {
  specialist: "parr" | "gosno";
}

function buildParrReturnUrl(params: {
  date?: string | null;
  artist?: string | null;
  partySize?: number;
  origin?: string | null;
  vehicle?: string | null;
  journeyId?: string;
  qaTest?: boolean;
}): string {
  const vehicle =
    params.vehicle === "van" || params.vehicle === "suv"
      ? params.vehicle
      : (params.partySize ?? 4) > 6
        ? "van"
        : "suv";
  const url = new URL(`https://www.partyatredrocks.com/book/red-rocks-amphitheatre/private/${vehicle}`);
  url.searchParams.set("source", "dcc");
  url.searchParams.set("intent", "red-rocks-private-transfer");
  url.searchParams.set("vehicle", vehicle);
  if (params.journeyId) url.searchParams.set("journey_id", params.journeyId);
  if (params.qaTest) url.searchParams.set("qa_test", "1");
  if (params.date) url.searchParams.set("date", params.date);
  if (params.artist) url.searchParams.set("artist", params.artist);
  if (params.partySize) url.searchParams.set("partySize", String(params.partySize));
  if (params.origin) url.searchParams.set("origin", params.origin);
  return url.toString();
}

function buildGosnoReturnUrl(params: {
  airport?: string | null;
  resort?: string | null;
  date?: string | null;
  partySize?: number;
  direction?: string | null;
  journeyId?: string;
  qaTest?: boolean;
}): string {
  const slug = (params.resort || "breckenridge").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const url = new URL(`https://gosno.co/${slug || "breckenridge"}`);
  url.searchParams.set("source", "dcc");
  url.searchParams.set("intent", "mountain-private-transfer");
  if (params.journeyId) url.searchParams.set("journey_id", params.journeyId);
  if (params.qaTest) url.searchParams.set("qa_test", "1");
  if (params.airport) url.searchParams.set("airport", params.airport);
  if (params.date) url.searchParams.set("date", params.date);
  if (params.partySize) url.searchParams.set("partySize", String(params.partySize));
  if (params.direction) url.searchParams.set("direction", params.direction);
  return url.toString();
}

export default function ContextualSpecialistReturnBanner({
  specialist,
}: ContextualSpecialistReturnBannerProps) {
  const searchParams = useSearchParams();
  const source = searchParams.get("source");
  const date = searchParams.get("date");
  const artist = searchParams.get("artist");
  const partySizeRaw = searchParams.get("partySize");
  const partySize = partySizeRaw ? Number.parseInt(partySizeRaw, 10) : undefined;
  const origin = searchParams.get("origin");
  const vehicle = searchParams.get("vehicle");
  const airport = searchParams.get("airport");
  const resort = searchParams.get("resort");
  const direction = searchParams.get("direction");
  const [journeyId, setJourneyId] = useState<string>("");
  const [qaTest, setQaTest] = useState<boolean>(false);

  useEffect(() => {
    setJourneyId(getOrCreateJourneyId());
    setQaTest(isQaTestMode());
  }, []);

  const isContextualFromSpecialist =
    specialist === "parr"
      ? source === "partyatredrocks" || Boolean(date || origin || partySizeRaw)
      : source === "gosno" || Boolean(airport || resort || date || direction);

  const returnHref = useMemo(() => {
    if (specialist === "parr") {
      return buildParrReturnUrl({
        date,
        artist,
        partySize: Number.isFinite(partySize) ? partySize : undefined,
        origin,
        vehicle,
        journeyId: journeyId || undefined,
        qaTest,
      });
    }
    return buildGosnoReturnUrl({
      airport,
      resort,
      date,
      partySize: Number.isFinite(partySize) ? partySize : undefined,
      direction,
      journeyId: journeyId || undefined,
      qaTest,
    });
  }, [specialist, date, artist, partySize, origin, vehicle, airport, resort, direction, journeyId, qaTest]);

  useEffect(() => {
    trackNetworkEvent({
      eventName: "service_page_view",
      originatingSite: "dcc",
      destinationSite: specialist === "parr" ? "partyatredrocks" : "gosno",
      travelIntent: specialist === "parr" ? "red-rocks-concert-planning" : "mountain-transfer-planning",
      campaignSource: source || "organic",
      date: date || undefined,
      corridorId: specialist === "parr" ? "red-rocks" : "denver-breckenridge",
    });
  }, [specialist, source, date]);

  const handleReturnClick = () => {
    trackNetworkEvent({
      eventName: "network_handoff",
      originatingSite: "dcc",
      destinationSite: specialist === "parr" ? "partyatredrocks" : "gosno",
      travelIntent: specialist === "parr" ? "red-rocks-private-transfer" : "mountain-private-transfer",
      campaignSource: source || "organic",
      date: date || undefined,
      corridorId: specialist === "parr" ? "red-rocks" : "denver-breckenridge",
    });
  };

  if (specialist === "parr") {
    return (
      <section
        aria-label="Red Rocks concert-night transportation recommendation"
        className="mx-auto max-w-6xl px-6 pt-8"
      >
        <div className="rounded-3xl border border-cyan-400/25 bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-cyan-950/35 p-6 shadow-xl">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2.5">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200">
                {isContextualFromSpecialist
                  ? "Your Red Rocks Concert-Night Plan"
                  : "Compare drive / rideshare / private"}
              </div>
              <h2 className="text-xl font-bold text-white sm:text-2xl">
                {isContextualFromSpecialist
                  ? "Tailored timing, weather & post-show exit guidance"
                  : "Need a guaranteed ride home after the encore?"}
              </h2>
              <p className="max-w-2xl text-sm leading-relaxed text-slate-300">
                {isContextualFromSpecialist
                  ? "Plan your pre-show arrival window, canyon weather layers, and Upper North / Lower South pickup staging—then return directly to Party at Red Rocks with your trip details preserved."
                  : "Rideshare surges and 45-minute lot queues hit hard after Red Rocks shows. Compare driving, rideshare, and pre-staged private vehicles—or book direct with our Colorado concert specialist."}
              </p>
              {isContextualFromSpecialist ? (
                <div className="flex flex-wrap gap-2 pt-1 text-xs text-slate-200">
                  {date ? (
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1">
                      Show date: {date}
                    </span>
                  ) : null}
                  {partySize && Number.isFinite(partySize) ? (
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1">
                      Party of {partySize}
                    </span>
                  ) : null}
                  {origin ? (
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1">
                      Pickup: {origin}
                    </span>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="flex shrink-0 flex-col items-start gap-2 lg:items-end">
              <a
                href={returnHref}
                onClick={handleReturnClick}
                className="inline-flex items-center gap-2 rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300"
              >
                {isContextualFromSpecialist
                  ? "Return to Party at Red Rocks to book"
                  : "Book private transportation with Party at Red Rocks"}
                <span aria-hidden="true">→</span>
              </a>
              <span className="text-[11px] text-slate-400">
                2027 flat round-trip: Private Suburban ($499) &amp; Private Van ($699) · Upper North Lot tailgating &amp; on-site wait · Party at Red Rocks (independently bookable)
              </span>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      aria-label="Mountain transfer planning recommendation"
      className="mx-auto max-w-6xl px-6 pt-8"
    >
      <div className="rounded-3xl border border-emerald-400/25 bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-emerald-950/35 p-6 shadow-xl">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2.5">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-200">
              {isContextualFromSpecialist
                ? "Your Mountain Transfer Plan"
                : "Compare bus / rental / private vehicle"}
            </div>
            <h2 className="text-xl font-bold text-white sm:text-2xl">
              {isContextualFromSpecialist
                ? "I-70 corridor timing, winter traction & airport buffer guidance"
                : "Compare shuttle bus, rental car, and flat-rate private SUV"}
            </h2>
            <p className="max-w-2xl text-sm leading-relaxed text-slate-300">
              {isContextualFromSpecialist
                ? "Factor in Eisenhower Tunnel traffic windows, chain-law conditions, and DEN baggage buffer—then head right back to GoSno to lock in your flat-rate private vehicle."
                : "Ski gear, winter I-70 delays, and per-person shuttle fees add up fast. Compare transit options side by side or check flat-rate private SUV/van availability with GoSno."}
            </p>
            {isContextualFromSpecialist ? (
              <div className="flex flex-wrap gap-2 pt-1 text-xs text-slate-200">
                {airport || resort ? (
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1">
                    {(airport || "DEN").toUpperCase()} ↔ {resort || "Breckenridge"}
                  </span>
                ) : null}
                {date ? (
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1">
                    Travel date: {date}
                  </span>
                ) : null}
                {partySize && Number.isFinite(partySize) ? (
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1">
                    Party of {partySize}
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="flex shrink-0 flex-col items-start gap-2 lg:items-end">
            <a
              href={returnHref}
              onClick={handleReturnClick}
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-300"
            >
              {isContextualFromSpecialist
                ? "Return to GoSno to check availability"
                : "Check private transfer availability with GoSno"}
              <span aria-hidden="true">→</span>
            </a>
            <span className="text-[11px] text-slate-400">
              Flat-rate private SUV &amp; van · Ski gear &amp; AWD · GoSno (DCC network)
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
