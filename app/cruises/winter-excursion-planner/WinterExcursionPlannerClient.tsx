"use client";

import React, { useState } from "react";
import Link from "next/link";
import type {
  EvaluatedWinterSailingPlanResponse,
  WinterExcursionPortSlug,
} from "@/lib/dcc/winterExcursionPlanner";

const PORT_ORDER: WinterExcursionPortSlug[] = [
  "nassau",
  "st-thomas",
  "cozumel",
  "roatan",
  "grand-cayman",
];

interface Props {
  initialData: EvaluatedWinterSailingPlanResponse;
}

export default function WinterExcursionPlannerClient({ initialData }: Props) {
  const [data, setData] = useState<EvaluatedWinterSailingPlanResponse>(initialData);
  const [shipName, setShipName] = useState(initialData.shipName);
  const [sailDate, setSailDate] = useState(initialData.sailDate);
  const [adults, setAdults] = useState(initialData.party.adults);
  const [savedByPort, setSavedByPort] = useState<
    Record<WinterExcursionPortSlug, string | null>
  >({
    nassau: initialData.fivePortsBySlug.nassau.savedInShareablePlan
      ? initialData.fivePortsBySlug.nassau.selectedOption?.tourId || null
      : null,
    "st-thomas": initialData.fivePortsBySlug["st-thomas"].savedInShareablePlan
      ? initialData.fivePortsBySlug["st-thomas"].selectedOption?.tourId || null
      : null,
    cozumel: initialData.fivePortsBySlug.cozumel.savedInShareablePlan
      ? initialData.fivePortsBySlug.cozumel.selectedOption?.tourId || null
      : null,
    roatan: initialData.fivePortsBySlug.roatan.savedInShareablePlan
      ? initialData.fivePortsBySlug.roatan.selectedOption?.tourId || null
      : null,
    "grand-cayman": initialData.fivePortsBySlug["grand-cayman"].savedInShareablePlan
      ? initialData.fivePortsBySlug["grand-cayman"].selectedOption?.tourId || null
      : null,
  });
  const [missingAllAboardPorts, setMissingAllAboardPorts] = useState<
    Record<WinterExcursionPortSlug, boolean>
  >({
    nassau: false,
    "st-thomas": false,
    cozumel: false,
    roatan: false,
    "grand-cayman": false,
  });
  const [loading, setLoading] = useState(false);
  const [copiedBanner, setCopiedBanner] = useState<string | null>(null);

  async function refreshPlan(
    nextSaved = savedByPort,
    nextMissing = missingAllAboardPorts,
    nextAdults = adults,
    nextShip = shipName,
    nextSailDate = sailDate,
  ) {
    setLoading(true);
    try {
      const missingList = PORT_ORDER.filter((slug) => nextMissing[slug]);
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
      if (res.ok) {
        const json = (await res.json()) as EvaluatedWinterSailingPlanResponse;
        if (json.ok) {
          setData(json);
        }
      }
    } finally {
      setLoading(false);
    }
  }

  function handleSelectTour(portSlug: WinterExcursionPortSlug, tourId: string | null) {
    const next = { ...savedByPort, [portSlug]: tourId };
    setSavedByPort(next);
    void refreshPlan(next, missingAllAboardPorts, adults, shipName, sailDate);
  }

  function handleToggleMissingAllAboard(portSlug: WinterExcursionPortSlug) {
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
      {/* Top Shareable Sailing Banner */}
      <div className="rounded-2xl border border-cyan-500/30 bg-slate-900/90 p-6 shadow-xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-cyan-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-300 border border-cyan-500/40">
                Shareable Whole-Sailing Plan · {data.plan.planCode}
              </span>
              <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300 border border-emerald-500/40">
                Live Viator Option & Party Price Verified
              </span>
              <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-300 border border-amber-500/40">
                Tender & Pier Transfer Math Enforced
              </span>
            </div>
            <h1 className="mt-3 text-2xl sm:text-3xl font-bold text-white">
              {data.shipName} · {data.plan.itineraryTitle}
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
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() =>
                copyShareLink(
                  data.plan.cruisePromenadeShareUrl,
                  "Cruise Promenade Group Share URL",
                )
              }
              className="rounded-xl bg-cyan-500 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-cyan-400 transition"
            >
              Share Cruise Promenade Plan ({data.plan.planCode})
            </button>
            <button
              type="button"
              onClick={() => copyShareLink(data.plan.dccShareUrl, "DCC Planner URL")}
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

      {/* Saved Group Excursion Summary (Nassau + St. Thomas by default) */}
      <div className="rounded-2xl border border-emerald-500/30 bg-slate-900/90 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white">
              Saved Group Excursion Plan ({data.savedPortsSummary.savedToursCount}{" "}
              {data.savedPortsSummary.savedToursCount === 1 ? "Port" : "Ports"} Saved)
            </h2>
            <p className="text-sm text-slate-300">
              Default January 24, 2027 <em>Independence of the Seas</em> shareable example
              saves <strong>Nassau</strong> (Day 2 · Jan 25, 2027) and{" "}
              <strong>St. Thomas</strong> (Day 5 · Jan 28, 2027). Add or swap Cozumel,
              Roatán, or Grand Cayman below.
            </p>
          </div>
          <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/40 px-4 py-3 text-right">
            <div className="text-xs uppercase tracking-wider text-emerald-300">
              Combined Verified Party Total ({data.party.adults} Adults)
            </div>
            <div className="text-2xl font-extrabold text-white">
              {data.savedPortsSummary.combinedPartyTotalFormatted}{" "}
              <span className="text-xs font-normal text-emerald-300">USD</span>
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          {data.savedPortsSummary.savedSelections.map((sel) => (
            <div
              key={`${sel.portSlug}-${sel.tourId}`}
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
                    <span className="text-slate-400 block">Pickup & Berth:</span>
                    <span className="font-semibold text-cyan-200">
                      {sel.pickupBadgeLabel}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Tender / Transfer Math:</span>
                    <span className="font-semibold text-slate-200">
                      {sel.isTenderPort ? "45m tender" : "30m dock"} +{" "}
                      {sel.transferBeforeMinutes ?? 0}m each way (All-Aboard{" "}
                      {sel.allAboardTime || "Missing → Needs confirmation"})
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
                <a
                  href={sel.trackedViatorCheckoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition"
                >
                  Book Verified Option at Viator ({sel.totalPartyPriceFormatted}) ↗
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Five-Port Interactive Excursion Picker (Nassau, St. Thomas, Cozumel, Roatán, Grand Cayman) */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white">
            Five-Port Winter Excursion Matcher (Nassau · St. Thomas · Cozumel · Roatán ·
            Grand Cayman)
          </h2>
          <p className="mt-1 text-sm text-slate-300">
            Every option below is evaluated against the ship’s port window, dock/tender
            clearance (30m docked vs 45m tender at Grand Cayman), and round-trip pier
            transfer buffer. Toggle <strong>Simulate Missing Ship All-Aboard Time</strong>{" "}
            on any port to verify that missing required facts immediately surface{" "}
            <code className="text-amber-300">Needs confirmation</code>.
          </p>
        </div>

        {PORT_ORDER.map((portSlug) => {
          const slot = data.fivePortsBySlug[portSlug];
          const isSaved = Boolean(savedByPort[portSlug]);
          const isMissingAllAboard = Boolean(missingAllAboardPorts[portSlug]);

          return (
            <div
              key={portSlug}
              className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-lg font-bold text-white">
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
                    {slot.onActiveSailingItinerary ? (
                      <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-300 border border-emerald-500/40">
                        On Jan 24 Independence of the Seas Sailing ({slot.date})
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-medium text-slate-300">
                        Western Caribbean Winter Port ({slot.date})
                      </span>
                    )}
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
                      {slot.allAboardTime || "MISSING (Forces Needs confirmation)"}
                    </strong>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
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
                  <Link
                    href={slot.portSpec.dccPortGuidePath}
                    className="rounded-lg border border-cyan-500/40 bg-cyan-950/40 px-3 py-1.5 text-xs font-semibold text-cyan-200 hover:bg-cyan-900/50 transition"
                  >
                    DCC Port Guide →
                  </Link>
                </div>
              </div>

              {/* Matched Tours List for Port */}
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
                          <span className="text-slate-400 block">Pickup Option:</span>
                          <span className="font-semibold text-slate-200">
                            {opt.boundOffer.pickupBadgeLabel}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">
                            Clearance & Return Math:
                          </span>
                          <span className="font-semibold text-slate-200">
                            {fit
                              ? `${fit.debarkClearanceMinutes}m clearance · back ${
                                  fit. bufferBeforeAllAboardMinutes !== null
                                    ? `${fit.bufferBeforeAllAboardMinutes}m before All-Aboard`
                                    : "All-Aboard unconfirmed"
                                }`
                              : "Needs confirmation"}
                          </span>
                        </div>
                      </div>

                      {opt.missingInformation.length > 0 ? (
                        <div className="mt-2 rounded-lg border border-amber-500/30 bg-amber-950/30 px-3 py-1.5 text-xs text-amber-200">
                          <strong>Needs confirmation:</strong>{" "}
                          {opt.missingInformation.join(", ")}
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

                        {opt.bookingPath.trackedClickUrl ? (
                          <a
                            href={opt.bookingPath.trackedClickUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-lg bg-emerald-500 px-3.5 py-1.5 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition"
                          >
                            Viator Checkout ({totalFormatted}) ↗
                          </a>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
