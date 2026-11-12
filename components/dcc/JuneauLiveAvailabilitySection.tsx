"use client";

import React, { useEffect, useState } from "react";
import type {
  PublicJuneauDepartureButton,
  PublicJuneauLiveAvailabilityView,
  PublicJuneauTourCardModel,
} from "@/lib/dcc/liveSlots/rezgoReadOnly";

interface JuneauLiveAvailabilitySectionProps {
  initialView: PublicJuneauLiveAvailabilityView;
  initialDate: string;
  initialShipArrival: string;
  initialAllAboard: string;
  initialBerth: string;
  flightCanceledParam?: string;
  cancelRefParam?: string;
}

const PARTY_SIZE_CHOICES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12];

export function JuneauLiveAvailabilitySection({
  initialView,
  initialDate,
  initialShipArrival,
  initialAllAboard,
  initialBerth,
  flightCanceledParam,
  cancelRefParam,
}: JuneauLiveAvailabilitySectionProps) {
  const [view, setView] = useState<PublicJuneauLiveAvailabilityView>(initialView);
  const [serviceDate, setServiceDate] = useState<string>(initialDate);
  const [shipArrival, setShipArrival] = useState<string>(initialShipArrival);
  const [allAboard, setAllAboard] = useState<string>(initialAllAboard);
  const [berth, setBerth] = useState<string>(initialBerth);
  const [partySize, setPartySize] = useState<number | null>(initialView.enteredPartySize);
  const [loadingRecheck, setLoadingRecheck] = useState<boolean>(false);
  const [selectedKeyByCard, setSelectedKeyByCard] = useState<Record<string, string>>({});
  const [revalidatingCardId, setRevalidatingCardId] = useState<string | null>(null);
  const [cardNoticeById, setCardNoticeById] = useState<Record<string, string>>({});
  const [pendingReducedCheckout, setPendingReducedCheckout] = useState<{
    cardId: string;
    checkoutHref: string;
    warningLabel: string;
  } | null>(null);

  useEffect(() => {
    setView(initialView);
    setServiceDate(initialDate);
    setShipArrival(initialShipArrival);
    setAllAboard(initialAllAboard);
    setBerth(initialBerth);
    setPartySize(initialView.enteredPartySize);
  }, [initialView, initialDate, initialShipArrival, initialAllAboard, initialBerth]);

  async function fetchLiveAvailability(nextDate: string, nextPartySize: number | null, nextArr: string, nextAa: string) {
    setLoadingRecheck(true);
    try {
      const qs = new URLSearchParams();
      qs.set("date", nextDate);
      qs.set("surface", "dcc");
      if (nextPartySize !== null && nextPartySize >= 1) {
        qs.set("partySize", String(nextPartySize));
      }
      if (nextArr) qs.set("shipArrival", nextArr);
      if (nextAa) qs.set("allAboard", nextAa);

      const res = await fetch(`/api/public/juneau-live-availability?${qs.toString()}`, {
        method: "GET",
        cache: "no-store",
      });
      if (res.ok) {
        const nextView = (await res.json()) as PublicJuneauLiveAvailabilityView;
        setView(nextView);
      }
    } catch {
      // Keep current view on transient network error
    } finally {
      setLoadingRecheck(false);
    }
  }

  function handlePartySizeChange(rawValue: string) {
    const parsed = rawValue ? Number.parseInt(rawValue, 10) : NaN;
    const nextParty = Number.isFinite(parsed) && parsed >= 1 ? parsed : null;
    setPartySize(nextParty);
    setCardNoticeById({});
    setPendingReducedCheckout(null);
    void fetchLiveAvailability(serviceDate, nextParty, shipArrival, allAboard);
  }

  function getActiveDeparture(card: PublicJuneauTourCardModel): PublicJuneauDepartureButton | null {
    const allSelectable = [
      ...card.recommendedDepartures,
      ...card.confirmTimingDepartures,
      ...card.otherAvailableTimes,
    ];
    if (allSelectable.length === 0) return null;
    const chosenKey = selectedKeyByCard[card.cardId];
    return allSelectable.find((b) => b.selectionKey === chosenKey) || allSelectable[0];
  }

  async function handleBookThisTour(
    card: PublicJuneauTourCardModel,
    activeDep: PublicJuneauDepartureButton | null,
  ) {
    if (!activeDep || !card.checkoutAvailable) return;

    if (partySize === null || partySize < 1) {
      setCardNoticeById((prev) => ({
        ...prev,
        [card.cardId]: "How many people are going? Select your group size first so we can verify seats before checkout.",
      }));
      return;
    }

    setRevalidatingCardId(card.cardId);
    setCardNoticeById((prev) => ({ ...prev, [card.cardId]: "" }));

    try {
      const res = await fetch("/api/public/juneau-live-availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: card.serviceDate || serviceDate,
          partySize,
          cardId: card.cardId,
          rezgoUid: activeDep.syncSelection.rezgoUid,
          departureTime24: activeDep.departureTime24,
          shipArrival: shipArrival || undefined,
          allAboard: allAboard || undefined,
        }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        available?: boolean;
        message?: string;
        checkoutHref?: string | null;
        requiresReducedBufferConfirmation?: boolean;
        reducedBufferWarningLabel?: string | null;
        refreshedView?: PublicJuneauLiveAvailabilityView;
      };

      if (json.refreshedView) {
        setView(json.refreshedView);
      }

      if (!json.available || !json.checkoutHref) {
        const noun = partySize === 1 ? "person" : "people";
        setCardNoticeById((prev) => ({
          ...prev,
          [card.cardId]:
            json.message ||
            `No departure currently has enough availability for ${partySize} ${noun}.`,
        }));
        return;
      }

      if (json.requiresReducedBufferConfirmation) {
        setPendingReducedCheckout({
          cardId: card.cardId,
          checkoutHref: json.checkoutHref,
          warningLabel:
            json.reducedBufferWarningLabel ||
            activeDep.timingStatusLabel ||
            "Reduced buffer · Not recommended",
        });
        return;
      }

      window.open(json.checkoutHref, "_blank", "noopener,noreferrer");
    } catch {
      setCardNoticeById((prev) => ({
        ...prev,
        [card.cardId]: "Unable to revalidate availability right now. Please try again.",
      }));
    } finally {
      setRevalidatingCardId(null);
    }
  }

  return (
    <section
      id="juneau-tours-live-availability"
      data-testid="dcc-juneau-tours-live-availability"
      className="rounded-[1.9rem] border border-amber-400/35 bg-[#0c121b] p-6 md:p-8 space-y-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#f5b34b]">
            Juneau Tours &amp; Whale Watch · Live Availability
          </p>
          <h2 className="mt-1 text-2xl font-black text-white md:text-3xl">
            Juneau Tours — Live Operator Availability
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/75">
            Select your port date and group size to check live departure times for{" "}
            <strong className="text-white">{view.operatorName}</strong>.
          </p>
        </div>
      </div>

      <form
        method="GET"
        action="/juneau/whale-watching-tours#juneau-tours-live-availability"
        onSubmit={(e) => {
          e.preventDefault();
          void fetchLiveAvailability(serviceDate, partySize, shipArrival, allAboard);
        }}
        className="grid gap-3 rounded-2xl border border-white/10 bg-black/40 p-4 sm:grid-cols-2 md:grid-cols-5"
      >
        {flightCanceledParam ? (
          <input type="hidden" name="flight_canceled" value={flightCanceledParam} />
        ) : null}
        {cancelRefParam ? (
          <input type="hidden" name="cancel_ref" value={cancelRefParam} />
        ) : null}
        <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-wider text-white/70">
          Port Date
          <input
            type="date"
            name="date"
            value={serviceDate}
            onChange={(e) => {
              const nextDate = e.target.value;
              setServiceDate(nextDate);
              if (/^\d{4}-\d{2}-\d{2}$/.test(nextDate)) {
                void fetchLiveAvailability(nextDate, partySize, shipArrival, allAboard);
              }
            }}
            className="rounded-lg border border-white/15 bg-[#0b1017] px-2.5 py-1.5 text-xs font-normal text-white"
          />
        </label>
        <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-wider text-white/70">
          How many people are going?
          <select
            aria-label="How many people are going?"
            data-testid="dcc-juneau-party-size-select"
            value={partySize ?? ""}
            onChange={(e) => handlePartySizeChange(e.target.value)}
            className="rounded-lg border border-amber-400/45 bg-[#0b1017] px-2.5 py-1.5 text-xs font-semibold text-white"
          >
            <option value="">Select group size…</option>
            {PARTY_SIZE_CHOICES.map((n) => (
              <option key={n} value={n}>
                {n} {n === 1 ? "person" : "people"}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-wider text-white/70">
          Ship Arrival
          <input
            type="time"
            name="claa_arrival"
            value={shipArrival}
            onChange={(e) => setShipArrival(e.target.value)}
            className="rounded-lg border border-white/15 bg-[#0b1017] px-2.5 py-1.5 text-xs font-normal text-white"
          />
        </label>
        <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-wider text-white/70">
          Confirmed All-Aboard
          <input
            type="time"
            name="all_aboard"
            value={allAboard}
            onChange={(e) => setAllAboard(e.target.value)}
            className="rounded-lg border border-white/15 bg-[#0b1017] px-2.5 py-1.5 text-xs font-normal text-white"
          />
        </label>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={loadingRecheck}
            className="w-full rounded-xl bg-[#f5b34b] px-4 py-2 text-xs font-black uppercase tracking-wider text-[#07111d] hover:bg-[#f7bf6a] transition disabled:opacity-60"
          >
            {loadingRecheck ? "Checking…" : "Update Times"}
          </button>
        </div>
      </form>

      {view.cards.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2">
          {view.cards.map((card) => {
            const activeDep = getActiveDeparture(card);
            const primaryDepartures = [
              ...card.recommendedDepartures,
              ...card.confirmTimingDepartures,
            ];
            const cardNotice = cardNoticeById[card.cardId];
            const isRevalidating = revalidatingCardId === card.cardId;
            const pendingReduced =
              pendingReducedCheckout?.cardId === card.cardId ? pendingReducedCheckout : null;

            return (
              <article
                key={card.cardId}
                data-testid="dcc-juneau-simplified-tour-card"
                className="rounded-2xl border border-white/15 bg-black/50 p-5 flex flex-col justify-between space-y-5"
              >
                <div className="space-y-4">
                  {/* 1. Tour name, 2. Duration, 3. Starting adult price */}
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-[#f5b34b]">
                        {card.operatorName}
                      </p>
                      <h3 className="mt-0.5 text-lg font-black text-white">{card.title}</h3>
                    </div>
                    {card.startingPriceLabel && (
                      <span className="rounded-full border border-emerald-400/35 bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-200">
                        {card.startingPriceLabel}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-white/80">
                    {card.durationLabel && <span>Duration: <strong>{card.durationLabel}</strong></span>}
                    {card.serviceDate && <span>Date: <strong>{card.serviceDate}</strong></span>}
                  </div>

                  {/* 4. Party-size selector / status */}
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label className="text-xs font-bold text-white">
                        {card.partySizePrompt}
                      </label>
                      <select
                        aria-label={`${card.title} — How many people are going?`}
                        value={partySize ?? ""}
                        onChange={(e) => handlePartySizeChange(e.target.value)}
                        className="rounded-lg border border-white/20 bg-[#0b1017] px-2.5 py-1 text-xs font-semibold text-white"
                      >
                        <option value="">Select guests</option>
                        {PARTY_SIZE_CHOICES.map((n) => (
                          <option key={n} value={n}>
                            {n} {n === 1 ? "person" : "people"}
                          </option>
                        ))}
                      </select>
                    </div>
                    {card.partyAvailabilityLabel && (
                      <p
                        data-testid="dcc-juneau-party-available-msg"
                        className="text-xs font-semibold text-emerald-300"
                      >
                        {card.partyAvailabilityLabel}
                      </p>
                    )}
                    {card.insufficientPartyMessage && (
                      <p
                        data-testid="dcc-juneau-party-insufficient-msg"
                        className="text-xs font-semibold text-amber-300"
                      >
                        {card.insufficientPartyMessage}
                      </p>
                    )}
                  </div>

                  {/* 5. Available departure-time buttons (time only) */}
                  {primaryDepartures.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-white/70">
                        Available departure times
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {primaryDepartures.map((dep) => {
                          const selected = activeDep?.selectionKey === dep.selectionKey;
                          return (
                            <button
                              key={dep.selectionKey}
                              type="button"
                              onClick={() => {
                                setSelectedKeyByCard((prev) => ({
                                  ...prev,
                                  [card.cardId]: dep.selectionKey,
                                }));
                                setPendingReducedCheckout(null);
                              }}
                              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                                selected
                                  ? "border-2 border-[#f5b34b] bg-[#f5b34b]/20 text-white"
                                  : "border border-white/15 bg-white/5 text-white/85 hover:bg-white/10"
                              }`}
                            >
                              {dep.timeLabel}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {card.otherAvailableTimes.length > 0 && (
                    <div className="space-y-2 border-t border-white/10 pt-2.5">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                        Other available times
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {card.otherAvailableTimes.map((dep) => {
                          const selected = activeDep?.selectionKey === dep.selectionKey;
                          return (
                            <button
                              key={dep.selectionKey}
                              type="button"
                              onClick={() => {
                                setSelectedKeyByCard((prev) => ({
                                  ...prev,
                                  [card.cardId]: dep.selectionKey,
                                }));
                                setPendingReducedCheckout(null);
                              }}
                              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                                selected
                                  ? "border-2 border-amber-400 bg-amber-500/20 text-amber-100"
                                  : "border border-amber-400/30 bg-amber-500/10 text-amber-200 hover:bg-amber-500/15"
                              }`}
                            >
                              {dep.timeLabel}
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-[11px] text-amber-200/90">
                        {card.otherAvailableTimes
                          .map((d) => `${d.timeLabel}: ${d.timingStatusLabel}`)
                          .join(" · ")}
                      </p>
                    </div>
                  )}

                  {/* 6. Plain-language timing status */}
                  {activeDep && (
                    <div className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs">
                      <span className="text-white/70">Timing status ({activeDep.timeLabel}): </span>
                      <strong
                        className={
                          activeDep.timingBucket === "recommended"
                            ? "text-emerald-300"
                            : activeDep.timingBucket === "other_available_times"
                              ? "text-amber-300"
                              : "text-amber-200"
                        }
                      >
                        {activeDep.timingStatusLabel}
                      </strong>
                    </div>
                  )}

                  {card.doesNotFitShipDayTimes.length > 0 && (
                    <details className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs text-white/65">
                      <summary className="cursor-pointer font-semibold text-white/75">
                        Doesn’t fit this ship day
                      </summary>
                      <p className="mt-1.5 leading-5">
                        {card.doesNotFitShipDayTimes.map((t) => t.timeLabel).join(", ")} — outside
                        your ship’s port window.
                      </p>
                    </details>
                  )}

                  {cardNotice && (
                    <p
                      role="status"
                      className="rounded-lg border border-amber-400/35 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-200"
                    >
                      {cardNotice}
                    </p>
                  )}

                  {pendingReduced && (
                    <div
                      role="alertdialog"
                      className="rounded-xl border border-amber-400/60 bg-amber-500/15 p-3 space-y-2 text-xs text-amber-100"
                    >
                      <p className="font-bold">{pendingReduced.warningLabel}</p>
                      <p>
                        Recommended excursions leave at least 2 hours before all-aboard. Confirm if
                        you still want to continue to checkout.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const href = pendingReduced.checkoutHref;
                            setPendingReducedCheckout(null);
                            window.open(href, "_blank", "noopener,noreferrer");
                          }}
                          className="rounded-lg bg-amber-400 px-3 py-1.5 text-xs font-black text-[#07111d]"
                        >
                          Continue to checkout ↗
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingReducedCheckout(null)}
                          className="rounded-lg border border-white/20 bg-black/40 px-3 py-1.5 text-xs font-semibold text-white"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 7. Book this tour + 8. Add to group plan */}
                <div className="space-y-2 border-t border-white/10 pt-3">
                  <div className="grid gap-2 sm:grid-cols-2">
                    {card.checkoutAvailable && activeDep ? (
                      <button
                        type="button"
                        disabled={isRevalidating}
                        onClick={() => void handleBookThisTour(card, activeDep)}
                        className="w-full rounded-xl bg-[#f5b34b] px-4 py-2.5 text-center text-xs font-black uppercase tracking-wider text-[#07111d] hover:bg-[#f7bf6a] transition disabled:opacity-60"
                      >
                        {isRevalidating ? "Checking…" : card.checkoutCtaLabel}
                      </button>
                    ) : (
                      <span className="block w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-center text-xs font-semibold text-white/60">
                        {activeDep ? "Online booking unavailable" : "Select an available date"}
                      </span>
                    )}

                    {activeDep ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (typeof window !== "undefined") {
                            window.location.assign(activeDep.plannerAddHref);
                          }
                        }}
                        className="block w-full rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-center text-xs font-bold text-white hover:bg-white/10 transition"
                      >
                        {card.addToGroupPlanLabel}
                      </button>
                    ) : null}
                  </div>
                  {card.checkoutAvailable && card.checkoutProviderLabel && activeDep && (
                    <p className="text-center text-[11px] text-white/65">
                      {card.checkoutProviderLabel} · Availability rechecked before checkout
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-black/45 p-5 text-xs leading-6 text-white/80">
          <p>
            No live departures are currently available for <strong>{serviceDate}</strong>. Try
            another Alaska sailing date between May and September.
          </p>
        </div>
      )}
    </section>
  );
}
