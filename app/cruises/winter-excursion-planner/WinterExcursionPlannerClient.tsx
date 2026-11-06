"use client";

import React, { useState } from "react";
import Link from "next/link";
import type {
  EvaluatedWinterSailingPlanResponse,
  WinterSailingPortSlug,
} from "@/lib/dcc/winterExcursionPlanner";

interface Props {
  initialData: EvaluatedWinterSailingPlanResponse;
}

export default function WinterExcursionPlannerClient({ initialData }: Props) {
  const [data, setData] = useState<EvaluatedWinterSailingPlanResponse>(initialData);
  const [shipName, setShipName] = useState(initialData.shipName);
  const [sailDate, setSailDate] = useState(initialData.sailDate);
  const [adults, setAdults] = useState(initialData.party.adults);
  const [savedByPort, setSavedByPort] = useState<
    Partial<Record<WinterSailingPortSlug, string | null>>
  >(() => {
    const map: Partial<Record<WinterSailingPortSlug, string | null>> = {};
    for (const slot of initialData.sailingPortCalls) {
      map[slot.portSlug] = slot.savedInShareablePlan
        ? slot.selectedOption?.tourId || null
        : null;
    }
    return map;
  });
  const [missingAllAboardPorts, setMissingAllAboardPorts] = useState<
    Partial<Record<WinterSailingPortSlug, boolean>>
  >(() => {
    const map: Partial<Record<WinterSailingPortSlug, boolean>> = {};
    for (const slot of initialData.sailingPortCalls) {
      map[slot.portSlug] = slot.allAboardStatus === "missing_needs_confirmation";
    }
    return map;
  });
  const [loading, setLoading] = useState(false);
  const [copiedBanner, setCopiedBanner] = useState<string | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  async function refreshPlan(
    nextSaved = savedByPort,
    nextMissing = missingAllAboardPorts,
    nextAdults = adults,
    nextShip = shipName,
    nextSailDate = sailDate,
  ) {
    setLoading(true);
    setErrorBanner(null);
    try {
      const missingList = data.sailingPortCallSlugs.filter(
        (slug) => nextMissing[slug],
      );
      const res = await fetch("/api/v1/cruises/winter-excursion-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planCode: data.plan.planCode,
          shipName: nextShip,
          sailDate: nextSailDate,
          adults: nextAdults,
          surface: "cruisepromenade",
          enableShortlistLiveCheck: true,
          savedPortOverrides: nextSaved,
          missingAllAboardPorts: missingList,
          isTest: true,
        }),
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        setData(json as EvaluatedWinterSailingPlanResponse);
      } else if (json?.error === "off_itinerary_tour_rejected") {
        setErrorBanner(
          json.message ||
            "Off-itinerary tour rejected: only verified port calls on this sailing can be saved.",
        );
      }
    } finally {
      setLoading(false);
    }
  }

  function handleSelectTour(portSlug: WinterSailingPortSlug, tourId: string | null) {
    const next = { ...savedByPort, [portSlug]: tourId };
    setSavedByPort(next);
    void refreshPlan(next, missingAllAboardPorts, adults, shipName, sailDate);
  }

  function handleToggleMissingAllAboard(portSlug: WinterSailingPortSlug) {
    const next = {
      ...missingAllAboardPorts,
      [portSlug]: !missingAllAboardPorts[portSlug],
    };
    setMissingAllAboardPorts(next);
    void refreshPlan(savedByPort, next, adults, shipName, sailDate);
  }

  function copyShareLink(url: string, label: string) {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      void navigator.clipboard.writeText(url);
    }
    setCopiedBanner(`Copied ${label}: ${url}`);
    setTimeout(() => setCopiedBanner(null), 4000);
  }

  return (
    <div className="space-y-8">
      {/* Off-Itinerary Tour Blocked Banner (when a saved link or direct request attempted to add an off-itinerary tour) */}
      {data.offItineraryBlocked && data.rejectedOffItineraryRequests.length > 0 ? (
        <div
          data-testid="off-itinerary-blocked-banner"
          className="rounded-2xl border border-rose-500/50 bg-rose-950/60 p-5 text-sm text-rose-100 shadow-lg"
        >
          <div className="flex items-center gap-2 font-bold text-rose-300 uppercase tracking-wider text-xs">
            <span>Off-Itinerary Tour Blocked</span>
            <span>·</span>
            <span>Sailing Port Calls Enforced ({data.sailingPortCallSlugs.join(", ")})</span>
          </div>
          {data.rejectedOffItineraryRequests.map((rej, idx) => (
            <p key={idx} className="mt-1.5 text-xs text-rose-100">
              <strong>Rejected ({rej.requestedPortSlug} / {rej.requestedTourId}):</strong>{" "}
              {rej.reason}{" "}
              {rej.applicablePortGuideUrl ? (
                <a
                  href={rej.applicablePortGuideUrl}
                  className="underline font-semibold text-cyan-300 ml-1"
                >
                  Open {rej.requestedPortSlug} Port Guide →
                </a>
              ) : null}
              {rej.applicableSailingPlanUrl ? (
                <a
                  href={rej.applicableSailingPlanUrl}
                  className="underline font-semibold text-emerald-300 ml-2"
                >
                  Open Applicable Western Caribbean Sailing Plan →
                </a>
              ) : null}
            </p>
          ))}
        </div>
      ) : null}

      {errorBanner ? (
        <div className="rounded-2xl border border-rose-500/50 bg-rose-950/60 p-4 text-xs font-semibold text-rose-200">
          {errorBanner}
        </div>
      ) : null}

      {/* Top Shareable Sailing Banner */}
      <div className="rounded-2xl border border-cyan-500/30 bg-slate-900/90 p-6 shadow-xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-cyan-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-300 border border-cyan-500/40">
                Planning Preview · Shareable Whole-Sailing Plan · {data.plan.planCode}
              </span>
              <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300 border border-emerald-500/40">
                Driven Strictly by Verified Sailing Port Calls ({data.sailingPortCallSlugs.join(" · ")})
              </span>
              <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-300 border border-amber-500/40">
                Conditional Cutoff & Return Buffer Until Ship Gangway Confirmation
              </span>
            </div>
            <h1 className="mt-3 text-2xl sm:text-3xl font-bold text-white">
              {data.shipName} · {data.plan.itineraryTitle} (Planning Preview)
            </h1>
            <p className="mt-1 text-sm text-slate-300">
              Sailing Date:{" "}
              <span className="font-semibold text-white">{data.sailDate}</span> (Return{" "}
              {data.plan.returnDate}) · Royal Caribbean Sailing ID{" "}
              <code className="text-cyan-300">{data.plan.sailingId}</code> · Party:{" "}
              <span className="font-semibold text-white">
                {data.party.adults} {data.party.adults === 1 ? "Adult" : "Adults"}
              </span>
            </p>
            <div
              data-testid="nassau-all-aboard-source-banner"
              className="mt-3 rounded-xl border border-amber-500/40 bg-amber-950/30 p-3 text-xs text-amber-100"
            >
              <strong>Nassau 3:15 PM All-Aboard Source &amp; Conditional Planning Preview:</strong>{" "}
              Royal Caribbean’s{" "}
              <a
                href={data.plan.officialCruiseLineItineraryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-semibold text-cyan-300"
              >
                public itinerary ({data.plan.sailingId})
              </a>{" "}
              publishes <strong>only docked port hours (7:00 AM – 4:00 PM / 07:00–16:00)</strong> for
              Day 2 in Nassau and does not list a port-specific all-aboard timestamp. Royal
              Caribbean’s{" "}
              <a
                href="https://www.royalcaribbean.com/faq/questions/onboard-ship-arrival-time"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-semibold text-cyan-300"
              >
                general port-of-call policy FAQ
              </a>{" "}
              requires boarding at least <strong>30 minutes before departure (3:30 PM)</strong>, with
              the binding cutoff announced onboard in the daily <em>Cruise Compass</em> and at the
              gangway. The planner’s <strong>3:15 PM (15:15)</strong> cutoff is a{" "}
              <strong>conditional 45-minute pre-departure planning heuristic</strong>, and the{" "}
              <strong>60-minute return buffer</strong> (from the 2:15 PM return to Prince George
              Wharf; 75 minutes before 3:30 PM) remains <strong>conditional</strong> until confirmed
              onboard.
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() =>
                copyShareLink(
                  data.organizerShareLinks.cruisePromenadeOrganizerUrl,
                  "Cruise Organizer Share URL",
                )
              }
              className="rounded-xl bg-cyan-500 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-cyan-400 transition"
            >
              Share Cruise Organizer Link ({data.plan.planCode})
            </button>
            <button
              type="button"
              onClick={() =>
                copyShareLink(data.organizerShareLinks.dccOrganizerUrl, "DCC Organizer URL")
              }
              className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
            >
              Copy DCC Plan Link
            </button>
            <a
              href={data.plan.officialCruiseLineItineraryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs font-medium text-cyan-300 hover:border-cyan-500/50 transition"
            >
              Royal Caribbean Itinerary ↗
            </a>
          </div>
        </div>

        {copiedBanner ? (
          <div className="mt-4 rounded-xl border border-emerald-500/40 bg-emerald-950/60 px-4 py-2.5 text-xs font-medium text-emerald-200">
            {copiedBanner}
          </div>
        ) : null}

        {/* Enter Ship & Sailing Date Once Form */}
        <div className="mt-6 grid grid-cols-1 gap-4 rounded-xl border border-slate-800 bg-slate-950/80 p-4 sm:grid-cols-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Cruise Ship (Entered Once)
            </label>
            <input
              type="text"
              value={shipName}
              onChange={(e) => setShipName(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Sailing Date
            </label>
            <input
              type="date"
              value={sailDate}
              onChange={(e) => setSailDate(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Party Size (Adults)
            </label>
            <select
              value={adults}
              onChange={(e) => {
                const nextAdults = Number(e.target.value) || 2;
                setAdults(nextAdults);
                void refreshPlan(
                  savedByPort,
                  missingAllAboardPorts,
                  nextAdults,
                  shipName,
                  sailDate,
                );
              }}
              className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
            >
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  {n} {n === 1 ? "Adult" : "Adults"}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="button"
              disabled={loading}
              onClick={() =>
                void refreshPlan(
                  savedByPort,
                  missingAllAboardPorts,
                  adults,
                  shipName,
                  sailDate,
                )
              }
              className="w-full rounded-lg bg-emerald-500 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-emerald-400 disabled:opacity-50 transition"
            >
              {loading ? "Live-Checking Viator…" : "Recalculate Whole Sailing"}
            </button>
          </div>
        </div>
      </div>

      {/* Verified 8-Day Sailing Itinerary Schedule (including San Juan on Day 4) */}
      <div
        data-testid="verified-sailing-itinerary-schedule"
        className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-white">
              Verified Sailing Port Calls & Day-by-Day Schedule ({data.plan.planCode})
            </h2>
            <p className="text-xs text-slate-300">
              Tour recommendations, saves, party totals, and checkout eligibility are driven
              strictly by this sailing’s verified port calls. San Juan (Day 4) is shown on the
              itinerary even though it has 0 matched catalog tours.
            </p>
          </div>
          <span className="rounded-full border border-cyan-500/30 bg-cyan-950/40 px-3 py-1 text-xs font-semibold text-cyan-200">
            Port Calls: {data.sailingPortCalls.map((c) => c.portSpec.portName).join(" → ")}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {data.plan.itineraryDays.map((day) => {
            const isPort = day.stopType === "port";
            const portSlot = day.portSlug
              ? data.sailingPortCalls.find((s) => s.portSlug === day.portSlug)
              : null;
            return (
              <div
                key={day.dayNumber}
                data-testid={`itinerary-day-${day.dayNumber}-${day.portSlug || day.stopType}`}
                className={`rounded-xl border p-3 text-xs ${
                  isPort
                    ? "border-cyan-500/30 bg-slate-950/90"
                    : "border-slate-800/80 bg-slate-950/40 text-slate-400"
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="font-bold text-white">
                    Day {day.dayNumber} · {day.date}
                  </span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                      isPort
                        ? "bg-cyan-500/20 text-cyan-300"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {day.stopType}
                  </span>
                </div>
                <div className="mt-1 font-semibold text-slate-100">{day.portLabel}</div>
                {day.arrivalTime || day.departureTime ? (
                  <div className="mt-0.5 text-[11px] text-slate-300">
                    Port Window: {day.arrivalTime || "—"} – {day.departureTime || "—"}{" "}
                    {day.allAboardTime ? `(All-Aboard ${day.allAboardTime})` : ""}
                  </div>
                ) : null}
                {portSlot ? (
                  <div className="mt-1.5 text-[11px]">
                    {portSlot.matchedToursCount > 0 ? (
                      <span className="text-emerald-300 font-semibold">
                        {portSlot.matchedToursCount} matched catalog{" "}
                        {portSlot.matchedToursCount === 1 ? "tour" : "tours"}
                      </span>
                    ) : (
                      <span className="text-amber-300 font-semibold">
                        0 matched catalog tours (Step-off walkable port call)
                      </span>
                    )}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {/* Saved Group Excursion Summary (Driven Strictly by Verified Port Calls) */}
      <div className="rounded-2xl border border-emerald-500/30 bg-slate-900/90 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white">
              Saved Group Excursion Plan ({data.savedPortsSummary.bookableSavedToursCount}{" "}
              Bookable of {data.savedPortsSummary.savedToursCount} Saved on This Sailing)
            </h2>
            <p className="text-sm text-slate-300">
              Only verified port calls on <strong>{data.shipName}</strong> ({data.plan.planCode}
              ) can be saved into this plan. <strong>Nassau</strong> (Jan 25, 2027 ·{" "}
              <code>254526P1</code> Option <code>TG4</code> pig-swim tour with verified Prince
              George Wharf pier pickup) is bookable now; <strong>St. Thomas</strong> (Jan 28,
              2027 · <code>7452P2</code> meeting at{" "}
              <strong>Marriott’s Frenchman’s Cove Dock</strong> with a{" "}
              <strong>30-minute check-in</strong> and{" "}
              <strong>independent travel both ways from the guest’s actual cruise berth</strong>
              ) shows <strong>Needs confirmation</strong> and withholds the cruise-fit booking
              recommendation while ship cutoff or berth transfer timing is unresolved.
            </p>
          </div>
          <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/40 px-4 py-3 text-right">
            <div className="text-xs uppercase tracking-wider text-emerald-300">
              Bookable Verified Party Total ({data.party.adults} Adults)
            </div>
            <div
              data-testid="combined-party-total"
              className="text-2xl font-extrabold text-white"
            >
              {data.savedPortsSummary.combinedPartyTotalFormatted}{" "}
              <span className="text-xs font-normal text-emerald-300">USD</span>
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          {data.savedPortsSummary.savedSelections.map((sel) => (
            <div
              key={`${sel.portSlug}-${sel.tourId}`}
              data-testid={`saved-selection-card-${sel.portSlug}`}
              className="rounded-xl border border-slate-700 bg-slate-950/90 p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                    {sel.portName} · {sel.date}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      sel.suitability === "recommended"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                    }`}
                  >
                    {sel.suitabilityLabel}
                  </span>
                </div>

                <h3 className="mt-2 text-lg font-bold text-white">{sel.title}</h3>
                <p className="mt-1 text-xs text-slate-300">
                  Matched Option:{" "}
                  <span className="font-semibold text-white">
                    {sel.optionTitle || "Standard Option"}
                  </span>{" "}
                  ({sel.providerProductCode}
                  {sel.optionCode ? ` · Option ${sel.optionCode}` : ""})
                </p>

                <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg border border-slate-800 bg-slate-900/70 p-3 text-xs">
                  <div>
                    <span className="text-slate-400 block">Verified Departure:</span>
                    <span className="font-bold text-white">
                      {sel.verifiedDepartureTime || "Needs confirmation"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Total Party Price:</span>
                    <span className="font-bold text-emerald-300">
                      {sel.totalPartyPriceFormatted} ({data.party.adults} Adults)
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Meeting Point / Pickup & Berth:</span>
                    <span className="font-semibold text-cyan-200">
                      {sel.applicableBerthOrMeetingPoint || sel.pickupBadgeLabel}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Check-In & Transfer Math:</span>
                    <span className="font-semibold text-slate-200">
                      {sel.transferBeforeMinutes !== null
                        ? `${sel.isTenderPort ? "45m tender" : "30m dock"} + ${sel.transferBeforeMinutes}m each way (All-Aboard ${sel.allAboardTime || "Missing → Needs confirmation"})`
                        : `${sel.isTenderPort ? "45m tender" : "30m dock"} + 30m check-in at Marriott Frenchman's Cove + independent travel both ways from actual cruise berth (All-Aboard ${sel.allAboardTime || "Missing"} · Needs confirmation)`}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-800">
                <Link
                  href={`/ports/${sel.portSlug}`}
                  className="text-xs font-semibold text-cyan-300 hover:underline"
                >
                  Open DCC {sel.portName} Guide →
                </Link>
                {sel.checkoutEligible && sel.trackedViatorCheckoutUrl ? (
                  <a
                    data-testid={`saved-checkout-cta-${sel.portSlug}`}
                    href={sel.trackedViatorCheckoutUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition"
                  >
                    Book Verified Option at Viator ({sel.totalPartyPriceFormatted}) ↗
                  </a>
                ) : (
                  <span
                    data-testid={`saved-checkout-withheld-${sel.portSlug}`}
                    className="rounded-lg border border-amber-500/40 bg-amber-950/40 px-3 py-1.5 text-xs font-semibold text-amber-200"
                  >
                    Needs confirmation — Cruise-fit booking recommendation withheld
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Sailing Port Calls Matcher (Nassau, San Juan [0 matched tours], St. Thomas for INDY-2027-01-24) */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white">
            Verified Sailing Port Calls ({data.shipName} · {data.plan.planCode})
          </h2>
          <p className="mt-1 text-sm text-slate-300">
            Only the verified port calls for this sailing are evaluated below. Toggle{" "}
            <strong>Simulate Missing Ship All-Aboard Time</strong> on any port call to verify
            that missing required timing facts immediately surface{" "}
            <code className="text-amber-300">Needs confirmation</code> and withhold the
            cruise-fit booking recommendation.
          </p>
        </div>

        {data.sailingPortCalls.map((slot) => {
          const portSlug = slot.portSlug;
          const isSaved = Boolean(savedByPort[portSlug]);
          const isMissingAllAboard = Boolean(missingAllAboardPorts[portSlug]);

          return (
            <div
              key={portSlug}
              data-testid={`sailing-port-card-${portSlug}`}
              className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-lg font-bold text-white">
                      {slot.dayNumber ? `Day ${slot.dayNumber} · ` : ""}
                      {slot.portSpec.portName}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        slot.portSpec.isTenderPort
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                          : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                      }`}
                    >
                      {slot.portSpec.isTenderPort
                        ? `TENDER PORT (${slot.portSpec.defaultClearanceMinutes}m clearance)`
                        : `DOCKED PORT (${slot.portSpec.defaultClearanceMinutes}m clearance)`}
                    </span>
                    <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-300 border border-emerald-500/40">
                      Verified Sailing Port Call ({slot.date})
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-300">
                    {slot.portSpec.logisticsSummary}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Port Window: Arrival <strong>{slot.shipArrival}</strong> · Ship
                    Departure <strong>{slot.shipDeparture}</strong> · Ship All-Aboard:{" "}
                    <strong
                      className={
                        slot.allAboardTime ? "text-emerald-300" : "text-amber-300"
                      }
                    >
                      {slot.allAboardTime ||
                        "MISSING (Needs confirmation · Recommendation withheld)"}
                    </strong>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {slot.matchedToursCount > 0 ? (
                    <button
                      type="button"
                      onClick={() => handleToggleMissingAllAboard(portSlug)}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                        isMissingAllAboard
                          ? "border-amber-400 bg-amber-500/20 text-amber-200"
                          : "border-slate-700 bg-slate-950 text-slate-300 hover:border-amber-500/40"
                      }`}
                    >
                      {isMissingAllAboard
                        ? "Restore Confirmed All-Aboard Time"
                        : "Simulate Missing All-Aboard Time"}
                    </button>
                  ) : null}
                  {portSlug !== "san-juan" ? (
                    <Link
                      href={slot.portSpec.dccPortGuidePath}
                      className="rounded-lg border border-cyan-500/40 bg-cyan-950/40 px-3 py-1.5 text-xs font-semibold text-cyan-200 hover:bg-cyan-900/50 transition"
                    >
                      DCC Port Guide →
                    </Link>
                  ) : null}
                </div>
              </div>

              {/* Port Call with 0 Matched Tours (San Juan) */}
              {slot.matchedToursCount === 0 ? (
                <div
                  data-testid={`no-matched-tours-${portSlug}`}
                  className="mt-4 rounded-xl border border-slate-800 bg-slate-950/80 p-5 text-sm text-slate-200"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold text-white">
                      No Matched Catalog Tours for {slot.portSpec.portName} ({slot.date})
                    </span>
                    <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-0.5 text-xs text-slate-300">
                      0 Matched Tours · Step-Off Walkable Port Call
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-300">
                    {slot.noMatchedToursReason ||
                      "This port call is on the verified sailing itinerary, but has no matched commercial catalog tours configured. Old San Juan Pier 3 disembarks directly into historic Old San Juan (Castillo San Felipe del Morro & Paseo de la Princesa)."}
                  </p>
                </div>
              ) : (
                <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {slot.allMatchedOptions.slice(0, 4).map((opt) => {
                    const selectedInPlan = savedByPort[portSlug] === opt.tourId;
                    const totalFormatted =
                      opt.boundOffer.totalPartyPriceCents !== null
                        ? `$${(opt.boundOffer.totalPartyPriceCents / 100).toFixed(2)}`
                        : "Check at Viator";
                    const unitFormatted =
                      opt.boundOffer.unitPriceCents !== null
                        ? `$${(opt.boundOffer.unitPriceCents / 100).toFixed(2)}/guest`
                        : "";
                    const fit = opt.cruiseScheduleFit;
                    const canCheckout =
                      opt.suitability === "recommended" &&
                      !slot.cruiseFitRecommendationWithheld &&
                      Boolean(opt.bookingPath.trackedClickUrl);

                    return (
                      <div
                        key={opt.tourId}
                        className={`rounded-xl border p-4 transition ${
                          selectedInPlan
                            ? "border-emerald-500 bg-emerald-950/20"
                            : "border-slate-800 bg-slate-950/80"
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                              opt.suitability === "recommended"
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                                : opt.suitability === "needs_confirmation"
                                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                                  : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                            }`}
                          >
                            {opt.suitability === "recommended"
                              ? "Recommended (Verified Fit)"
                              : opt.suitability === "needs_confirmation"
                                ? "Needs confirmation"
                                : "Ineligible"}
                          </span>
                          <span className="text-xs font-mono text-slate-400">
                            Viator {opt.providerProductCode}
                            {opt.boundOffer.optionCode
                              ? ` · Option ${opt.boundOffer.optionCode}`
                              : ""}
                          </span>
                        </div>

                        <h3 className="mt-2 text-base font-bold text-white">{opt.title}</h3>
                        {opt.boundOffer.optionTitle ? (
                          <p className="mt-0.5 text-xs text-cyan-300">
                            {opt.boundOffer.optionTitle}
                          </p>
                        ) : null}

                        <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg border border-slate-800/90 bg-slate-900/60 p-2.5 text-xs">
                          <div>
                            <span className="text-slate-400 block">Verified Departure:</span>
                            <span className="font-semibold text-white">
                              {opt.boundOffer.departureTime ||
                                opt.boundOffer.availableDepartureTimes[0] ||
                                "Needs confirmation"}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">
                              Party Total ({data.party.adults} Adults):
                            </span>
                            <span className="font-bold text-emerald-300">
                              {totalFormatted}{" "}
                              {unitFormatted ? (
                                <span className="text-slate-400 font-normal">
                                  ({unitFormatted})
                                </span>
                              ) : null}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">Meeting Point / Pickup:</span>
                            <span className="font-semibold text-slate-200">
                              {opt.boundOffer.applicableBerthOrMeetingPoint ||
                                opt.boundOffer.pickupBadgeLabel}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">
                              Clearance & Return Math:
                            </span>
                            <span className="font-semibold text-slate-200">
                              {fit
                                ? fit.transferBeforeMinutes !== null
                                  ? `${fit.debarkClearanceMinutes}m clearance + ${fit.transferBeforeMinutes}m/${fit.transferAfterMinutes ?? fit.transferBeforeMinutes}m transfer · ${
                                      fit.allAboardConfirmed !== false &&
                                      fit.lastTenderConfirmed !== false
                                        ? "Fits All-Aboard"
                                        : "All-Aboard / Tender unconfirmed"
                                    }`
                                  : `${fit.debarkClearanceMinutes}m clearance + 30m check-in at Marriott Frenchman's Cove + independent travel both ways from actual cruise berth (~15–35m taxi each way) · Needs confirmation`
                                : "Needs confirmation"}
                            </span>
                          </div>
                        </div>

                        {opt.missingInformation.length > 0 ||
                        opt.suitability === "needs_confirmation" ? (
                          <div className="mt-2 rounded-lg border border-amber-500/30 bg-amber-950/30 px-3 py-1.5 text-xs text-amber-200">
                            <strong>Needs confirmation:</strong>{" "}
                            {opt.providerProductCode === "7452P2"
                              ? "Meet at Marriott's Frenchman's Cove Dock (7338 Estate Bakkeroe). Includes 30-minute check-in + independent travel both ways from guest's actual cruise berth (Havensight WICO ~15–20m or Crown Bay ~30–35m each way). Cruise-fit booking recommendation withheld until berth transfer timing and ship cutoff are confirmed."
                              : opt.missingInformation.length > 0
                                ? opt.missingInformation.join(", ")
                                : "Cruise-fit booking recommendation withheld until ship all-aboard / last-tender time is confirmed."}
                          </div>
                        ) : null}

                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleSelectTour(
                                portSlug,
                                selectedInPlan ? null : opt.tourId,
                              )
                            }
                            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                              selectedInPlan
                                ? "border border-rose-500/40 bg-rose-950/40 text-rose-200 hover:bg-rose-900/50"
                                : "border border-cyan-500/40 bg-cyan-950/50 text-cyan-200 hover:bg-cyan-900/60"
                            }`}
                          >
                            {selectedInPlan
                              ? "Remove from Group Plan"
                              : isSaved
                                ? "Swap Into Group Plan"
                                : "Save to Group Plan"}
                          </button>

                          {canCheckout ? (
                            <a
                              data-testid={`checkout-cta-${portSlug}-${opt.providerProductCode}`}
                              href={opt.bookingPath.trackedClickUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-lg bg-emerald-500 px-3.5 py-1.5 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition"
                            >
                              Viator Checkout ({totalFormatted}) ↗
                            </a>
                          ) : (
                            <span
                              data-testid={`recommendation-withheld-${portSlug}-${opt.providerProductCode}`}
                              className="rounded-lg border border-amber-500/40 bg-amber-950/40 px-3 py-1.5 text-[11px] font-semibold text-amber-200"
                            >
                              Needs confirmation · Recommendation withheld
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Other Winter Release Ports (Available via Their Own Port Guides & Applicable Western Caribbean Sailings) */}
      {data.otherWinterPortGuides.length > 0 ? (
        <div
          data-testid="other-winter-ports-section"
          className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-white">
                Other Winter Release Ports (Not on {data.plan.planCode} Itinerary)
              </h2>
              <p className="mt-1 text-xs text-slate-300">
                {data.otherWinterPortGuides.map((g) => g.portName).join(", ")} are not port
                calls on the January 24, 2027 <em>{data.shipName}</em> Eastern Caribbean
                sailing and cannot be added to <code className="text-cyan-300">{data.plan.planCode}</code>.
                Explore them through their dedicated port guides or switch to an applicable
                Western Caribbean sailing plan:
              </p>
            </div>
            <Link
              href="/cruises/winter-excursion-planner?plan=WESTERN-2027-01-24"
              className="rounded-xl border border-cyan-500/40 bg-cyan-950/50 px-4 py-2 text-xs font-bold text-cyan-200 hover:bg-cyan-900/60 transition"
            >
              Switch to Western Caribbean Sailing (WESTERN-2027-01-24) →
            </Link>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {data.otherWinterPortGuides.map((guide) => (
              <div
                key={guide.portSlug}
                className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-sm text-white">{guide.portName}</span>
                    <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-300">
                      {guide.dockOrTender}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    Off-itinerary for {data.plan.planCode}. Available on{" "}
                    <code>{guide.applicableSailingPlanCode}</code> and standalone port guide.
                  </p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href={guide.dccPortGuidePath}
                    className="rounded-lg border border-cyan-500/40 bg-cyan-950/40 px-3 py-1.5 text-xs font-semibold text-cyan-200 hover:bg-cyan-900/50"
                  >
                    Open {guide.portName} Guide →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
