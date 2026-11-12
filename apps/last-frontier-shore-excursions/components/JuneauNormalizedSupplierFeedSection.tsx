"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  buildLfsePublicJuneauAvailabilityView,
  type LfseJuneauNormalizedFeedResult,
  type LfsePublicDepartureButton,
  type LfsePublicJuneauAvailabilityView,
  type LfsePublicTourCardModel,
} from "../lib/dccJuneauSupplierFeed";

interface JuneauNormalizedSupplierFeedSectionProps {
  feed?: LfseJuneauNormalizedFeedResult;
  initialView?: LfsePublicJuneauAvailabilityView;
  initialPartySize?: number | null;
  initialShipArrival?: string | null;
  initialAllAboard?: string | null;
  activitySlug?: string;
}

const PARTY_SIZE_CHOICES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12];

export function JuneauNormalizedSupplierFeedSection({
  feed,
  initialView,
  initialPartySize = null,
  initialShipArrival = null,
  initialAllAboard = null,
  activitySlug,
}: JuneauNormalizedSupplierFeedSectionProps) {
  const computedInitialView = useMemo(() => {
    if (initialView) return initialView;
    if (!feed) {
      return {
        ok: false,
        operatorName: "Juneau Tours & Whale Watch",
        serviceDate: null,
        enteredPartySize: initialPartySize,
        partySizePrompt: "How many people are going?" as const,
        shipArrivalTime: initialShipArrival,
        shipAllAboardTime: initialAllAboard,
        cards: [],
      };
    }
    return buildLfsePublicJuneauAvailabilityView(feed, {
      partySize: initialPartySize,
      shipArrivalTime: initialShipArrival,
      shipAllAboardTime: initialAllAboard,
      allAboardConfirmed: Boolean(initialAllAboard),
    });
  }, [feed, initialView, initialPartySize, initialShipArrival, initialAllAboard]);

  const [liveView, setLiveView] = useState<LfsePublicJuneauAvailabilityView | null>(null);
  const view = liveView ?? computedInitialView;

  const [serviceDate, setServiceDate] = useState<string>(
    view.serviceDate || "2027-07-15",
  );
  const [partySize, setPartySize] = useState<number | null>(
    view.enteredPartySize ?? initialPartySize,
  );
  const [shipArrival, setShipArrival] = useState<string>(
    view.shipArrivalTime || initialShipArrival || "",
  );
  const [allAboard, setAllAboard] = useState<string>(
    view.shipAllAboardTime || initialAllAboard || "",
  );
  const [loadingRecheck, setLoadingRecheck] = useState<boolean>(false);
  const [selectedKeyByCard, setSelectedKeyByCard] = useState<Record<string, string>>({});
  const [revalidatingCardId, setRevalidatingCardId] = useState<string | null>(null);
  const [cardNoticeById, setCardNoticeById] = useState<Record<string, string>>({});
  const [pendingReducedCheckout, setPendingReducedCheckout] = useState<{
    cardId: string;
    checkoutHref: string;
    warningLabel: string;
  } | null>(null);

  async function recheckAvailability(
    nextDate: string,
    nextPartySize: number | null,
    nextArr?: string,
    nextAboard?: string,
  ) {
    setLoadingRecheck(true);
    try {
      const qs = new URLSearchParams();
      qs.set("date", nextDate);
      if (activitySlug) qs.set("activity", activitySlug);
      if (nextPartySize !== null && nextPartySize >= 1) {
        qs.set("partySize", String(nextPartySize));
      }
      const effArr = (nextArr !== undefined ? nextArr : shipArrival).trim();
      const effAboard = (nextAboard !== undefined ? nextAboard : allAboard).trim();
      if (effArr) qs.set("shipArrival", effArr);
      if (effAboard) qs.set("allAboard", effAboard);
      const res = await fetch(`/api/juneau-live-availability?${qs.toString()}`, {
        method: "GET",
        cache: "no-store",
      });
      if (res.ok) {
        const nextView = (await res.json()) as LfsePublicJuneauAvailabilityView;
        setLiveView(nextView);
      }
    } catch {
      // Keep current view on transient network failure
    } finally {
      setLoadingRecheck(false);
    }
  }

  useEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    const urlDate = (sp.get("date") || "").trim();
    const urlPartyRaw = sp.get("partySize");
    const urlArr = (sp.get("shipArrival") || sp.get("claa_arrival") || "").trim();
    const urlAboard = (sp.get("allAboard") || sp.get("all_aboard") || "").trim();

    const parsedUrlParty =
      urlPartyRaw !== null && urlPartyRaw.trim() !== ""
        ? Number.parseInt(urlPartyRaw.trim(), 10)
        : null;
    const cleanUrlParty =
      typeof parsedUrlParty === "number" && Number.isFinite(parsedUrlParty) && parsedUrlParty >= 1
        ? parsedUrlParty
        : null;

    const validUrlDate = /^\d{4}-\d{2}-\d{2}$/.test(urlDate) ? urlDate : null;
    if (!validUrlDate && cleanUrlParty === null && !urlArr && !urlAboard) {
      return;
    }

    const targetDate = validUrlDate || serviceDate;
    const targetParty = cleanUrlParty !== null ? cleanUrlParty : partySize;
    const targetArr = urlArr || shipArrival;
    const targetAboard = urlAboard || allAboard;

    if (validUrlDate) setServiceDate(validUrlDate);
    if (cleanUrlParty !== null) setPartySize(cleanUrlParty);
    if (urlArr) setShipArrival(urlArr);
    if (urlAboard) setAllAboard(urlAboard);

    void recheckAvailability(targetDate, targetParty, targetArr, targetAboard);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!view.ok && view.cards.length === 0 && !liveView) {
    return null;
  }

  function handlePartySizeChange(rawVal: string) {
    const parsed = rawVal ? Number.parseInt(rawVal, 10) : NaN;
    const nextParty = Number.isFinite(parsed) && parsed >= 1 ? parsed : null;
    setPartySize(nextParty);
    setCardNoticeById({});
    setPendingReducedCheckout(null);
    void recheckAvailability(serviceDate, nextParty);
  }

  function getActiveDeparture(card: LfsePublicTourCardModel): LfsePublicDepartureButton | null {
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
    card: LfsePublicTourCardModel,
    activeDep: LfsePublicDepartureButton | null,
  ) {
    if (!activeDep || !card.checkoutAvailable) return;

    if (partySize === null || partySize < 1) {
      setCardNoticeById((prev) => ({
        ...prev,
        [card.cardId]:
          "How many people are going? Select your group size first so we can verify availability before checkout.",
      }));
      return;
    }

    setRevalidatingCardId(card.cardId);
    setCardNoticeById((prev) => ({ ...prev, [card.cardId]: "" }));

    try {
      const res = await fetch("/api/juneau-live-availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: card.serviceDate || serviceDate,
          partySize,
          activity: activitySlug,
          cardId: card.cardId,
          rezgoUid: activeDep.rezgoUid,
          departureTime24: activeDep.departureTime24,
          shipArrival: shipArrival.trim() || undefined,
          allAboard: allAboard.trim() || undefined,
        }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        available?: boolean;
        message?: string;
        checkoutHref?: string | null;
        requiresReducedBufferConfirmation?: boolean;
        reducedBufferWarningLabel?: string | null;
        refreshedView?: LfsePublicJuneauAvailabilityView;
      };

      if (json.refreshedView) {
        setLiveView(json.refreshedView);
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
        [card.cardId]: "Unable to verify live availability right now. Please try again.",
      }));
    } finally {
      setRevalidatingCardId(null);
    }
  }

  return (
    <section
      className="section"
      data-testid="lfse-juneau-normalized-supplier-feed"
      style={{
        background: "#ffffff",
        borderTop: "1px solid var(--line)",
        borderBottom: "1px solid var(--line)",
        padding: "32px 0",
      }}
    >
      <div className="shell">
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "flex-end",
            gap: 14,
            marginBottom: 18,
          }}
        >
          <div>
            <p className="eyebrow" style={{ color: "var(--muted)", marginBottom: 4 }}>
              Live Operator Availability
            </p>
            <h2 style={{ margin: 0, fontSize: "22px" }}>
              {view.operatorName} — Live Operator Availability
            </h2>
            <p style={{ color: "var(--muted)", fontSize: "14px", margin: "6px 0 0" }}>
              Choose your sailing date and group size to see available departure times.
            </p>
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
              alignItems: "flex-end",
            }}
          >
            <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: "12px", fontWeight: 700, color: "var(--deep)" }}>
              Port Date
              <input
                type="date"
                value={serviceDate}
                onChange={(e) => {
                  const nextDate = e.target.value;
                  setServiceDate(nextDate);
                  if (/^\d{4}-\d{2}-\d{2}$/.test(nextDate)) {
                    void recheckAvailability(nextDate, partySize);
                  }
                }}
                style={{
                  padding: "7px 10px",
                  borderRadius: 8,
                  border: "1px solid var(--line)",
                  fontSize: "13px",
                  background: "#ffffff",
                }}
              />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: "12px", fontWeight: 700, color: "var(--deep)" }}>
              How many people are going?
              <select
                aria-label="How many people are going?"
                value={partySize ?? ""}
                onChange={(e) => handlePartySizeChange(e.target.value)}
                style={{
                  padding: "7px 10px",
                  borderRadius: 8,
                  border: "1px solid var(--forest)",
                  fontSize: "13px",
                  fontWeight: 600,
                  background: "#ffffff",
                }}
              >
                <option value="">Select group size…</option>
                {PARTY_SIZE_CHOICES.map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? "person" : "people"}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: "12px", fontWeight: 700, color: "var(--deep)" }}>
              Ship Arrival
              <input
                type="time"
                aria-label="Ship Arrival"
                value={shipArrival}
                onChange={(e) => {
                  const nextArr = e.target.value;
                  setShipArrival(nextArr);
                  void recheckAvailability(serviceDate, partySize, nextArr, allAboard);
                }}
                style={{
                  padding: "7px 10px",
                  borderRadius: 8,
                  border: "1px solid var(--line)",
                  fontSize: "13px",
                  background: "#ffffff",
                }}
              />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: "12px", fontWeight: 700, color: "var(--deep)" }}>
              Confirmed All-Aboard
              <input
                type="time"
                aria-label="Confirmed All-Aboard"
                value={allAboard}
                onChange={(e) => {
                  const nextAboard = e.target.value;
                  setAllAboard(nextAboard);
                  void recheckAvailability(serviceDate, partySize, shipArrival, nextAboard);
                }}
                style={{
                  padding: "7px 10px",
                  borderRadius: 8,
                  border: "1px solid var(--line)",
                  fontSize: "13px",
                  background: "#ffffff",
                }}
              />
            </label>
            {loadingRecheck && (
              <span style={{ fontSize: "12px", color: "var(--muted)", paddingBottom: 8 }}>
                Checking…
              </span>
            )}
          </div>
        </div>

        {view.cards.length > 0 ? (
          <div
            className="grid"
            style={{
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 310px), 1fr))",
              gap: 16,
            }}
          >
            {view.cards.map((card) => {
              const activeDep = getActiveDeparture(card);
              const cardNotice = cardNoticeById[card.cardId];
              const isRevalidating = revalidatingCardId === card.cardId;
              const pendingReduced =
                pendingReducedCheckout?.cardId === card.cardId ? pendingReducedCheckout : null;

              return (
                <article
                  className="card"
                  key={card.cardId}
                  data-testid="lfse-juneau-simplified-tour-card"
                  style={{
                    background: "#f8fbfb",
                    border: "1px solid var(--line)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: 14,
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: 8,
                        marginBottom: 6,
                      }}
                    >
                      <div>
                        <span
                          style={{
                            fontSize: "11.5px",
                            fontWeight: 700,
                            color: "var(--muted)",
                            textTransform: "uppercase",
                            letterSpacing: "0.04em",
                          }}
                        >
                          {card.operatorName}
                        </span>
                        <h3 style={{ fontSize: "17px", margin: "2px 0 4px" }}>{card.title}</h3>
                      </div>
                      {card.startingPriceLabel && (
                        <strong style={{ color: "var(--forest)", fontSize: "14px", whiteSpace: "nowrap" }}>
                          {card.startingPriceLabel}
                        </strong>
                      )}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 12,
                        fontSize: "13px",
                        color: "var(--muted)",
                        marginBottom: 12,
                      }}
                    >
                      {card.durationLabel && (
                        <span>
                          Duration: <strong style={{ color: "var(--ink)" }}>{card.durationLabel}</strong>
                        </span>
                      )}
                      {card.serviceDate && (
                        <span>
                          Date: <strong style={{ color: "var(--ink)" }}>{card.serviceDate}</strong>
                        </span>
                      )}
                    </div>

                    <div
                      style={{
                        padding: "10px 12px",
                        borderRadius: 8,
                        background: "#ffffff",
                        border: "1px solid var(--line)",
                        marginBottom: 12,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <label style={{ fontSize: "12.5px", fontWeight: 700, color: "var(--deep)" }}>
                          {card.partySizePrompt}
                        </label>
                        <select
                          aria-label={`${card.title} — How many people are going?`}
                          value={partySize ?? ""}
                          onChange={(e) => handlePartySizeChange(e.target.value)}
                          style={{
                            padding: "5px 8px",
                            borderRadius: 6,
                            border: "1px solid var(--line)",
                            fontSize: "12.5px",
                            fontWeight: 600,
                            background: "#f8fbfb",
                          }}
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
                          style={{
                            margin: "6px 0 0",
                            fontSize: "12.5px",
                            fontWeight: 700,
                            color: "#156d3a",
                          }}
                        >
                          {card.partyAvailabilityLabel}
                        </p>
                      )}
                      {card.insufficientPartyMessage && (
                        <p
                          style={{
                            margin: "6px 0 0",
                            fontSize: "12.5px",
                            fontWeight: 700,
                            color: "#875c00",
                          }}
                        >
                          {card.insufficientPartyMessage}
                        </p>
                      )}
                    </div>

                    {card.recommendedDepartures.length > 0 && (
                      <div style={{ marginBottom: 10 }}>
                        <span
                          style={{
                            display: "block",
                            fontSize: "11.5px",
                            fontWeight: 700,
                            color: "#156d3a",
                            textTransform: "uppercase",
                            marginBottom: 6,
                          }}
                        >
                          Recommended times
                        </span>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {card.recommendedDepartures.map((dep) => {
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
                                style={{
                                  padding: "6px 11px",
                                  borderRadius: 7,
                                  fontSize: "12.5px",
                                  fontWeight: 700,
                                  cursor: "pointer",
                                  border: selected
                                    ? "2px solid #156d3a"
                                    : "1px solid #9ad3b0",
                                  background: selected ? "#dcfce7" : "#f0fdf4",
                                  color: "#14532d",
                                }}
                              >
                                {dep.timeLabel}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {card.confirmTimingDepartures.length > 0 && (
                      <div style={{ marginBottom: 10 }}>
                        <span
                          style={{
                            display: "block",
                            fontSize: "11.5px",
                            fontWeight: 700,
                            color: "var(--muted)",
                            textTransform: "uppercase",
                            marginBottom: 6,
                          }}
                        >
                          Available departure times
                        </span>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {card.confirmTimingDepartures.map((dep) => {
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
                                style={{
                                  padding: "6px 11px",
                                  borderRadius: 7,
                                  fontSize: "12.5px",
                                  fontWeight: 700,
                                  cursor: "pointer",
                                  border: selected
                                    ? "2px solid var(--forest)"
                                    : "1px solid var(--line)",
                                  background: selected ? "#e8f4f1" : "#ffffff",
                                  color: "var(--deep)",
                                }}
                              >
                                {dep.timeLabel}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {card.otherAvailableTimes.length > 0 && (
                      <div
                        style={{
                          borderTop: "1px solid var(--line)",
                          paddingTop: 8,
                          marginBottom: 10,
                        }}
                      >
                        <span
                          style={{
                            display: "block",
                            fontSize: "11.5px",
                            fontWeight: 700,
                            color: "#875c00",
                            textTransform: "uppercase",
                            marginBottom: 6,
                          }}
                        >
                          Other available times
                        </span>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 4 }}>
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
                                style={{
                                  padding: "6px 11px",
                                  borderRadius: 7,
                                  fontSize: "12.5px",
                                  fontWeight: 700,
                                  cursor: "pointer",
                                  border: selected ? "2px solid #875c00" : "1px solid #e2c893",
                                  background: selected ? "#fef3c7" : "#fffbeb",
                                  color: "#78350f",
                                }}
                              >
                                {dep.timeLabel}
                              </button>
                            );
                          })}
                        </div>
                        <p style={{ margin: 0, fontSize: "12px", color: "#875c00" }}>
                          {card.otherAvailableTimes
                            .map((d) => `${d.timeLabel}: ${d.timingStatusLabel}`)
                            .join(" · ")}
                        </p>
                      </div>
                    )}

                    {activeDep && (
                      <div
                        style={{
                          padding: "7px 10px",
                          borderRadius: 7,
                          background: "#ffffff",
                          border: "1px solid var(--line)",
                          fontSize: "12.5px",
                          marginBottom: 8,
                        }}
                      >
                        <span style={{ color: "var(--muted)" }}>
                          Timing status ({activeDep.timeLabel}):{" "}
                        </span>
                        <strong
                          style={{
                            color:
                              activeDep.timingBucket === "recommended"
                                ? "#156d3a"
                                : activeDep.timingBucket === "other_available_times"
                                  ? "#875c00"
                                  : "var(--deep)",
                          }}
                        >
                          {activeDep.timingStatusLabel}
                        </strong>
                      </div>
                    )}

                    {card.doesNotFitShipDayTimes.length > 0 && (
                      <details
                        style={{
                          padding: "6px 10px",
                          borderRadius: 7,
                          background: "#f1f5f9",
                          border: "1px solid var(--line)",
                          fontSize: "12px",
                          color: "var(--muted)",
                        }}
                      >
                        <summary style={{ cursor: "pointer", fontWeight: 600, color: "var(--deep)" }}>
                          Doesn’t fit this ship day
                        </summary>
                        <p style={{ margin: "6px 0 0" }}>
                          {card.doesNotFitShipDayTimes.map((t) => t.timeLabel).join(", ")} — outside
                          your ship’s port window.
                        </p>
                      </details>
                    )}

                    {cardNotice && (
                      <p
                        role="status"
                        style={{
                          margin: "8px 0 0",
                          padding: "7px 10px",
                          borderRadius: 7,
                          background: "#fffbeb",
                          border: "1px solid #e2c893",
                          fontSize: "12.5px",
                          fontWeight: 600,
                          color: "#78350f",
                        }}
                      >
                        {cardNotice}
                      </p>
                    )}

                    {pendingReduced && (
                      <div
                        role="alertdialog"
                        style={{
                          marginTop: 8,
                          padding: "10px 12px",
                          borderRadius: 8,
                          background: "#fffbeb",
                          border: "2px solid #d97706",
                          fontSize: "12px",
                          color: "#78350f",
                        }}
                      >
                        <strong style={{ display: "block", marginBottom: 4 }}>
                          {pendingReduced.warningLabel}
                        </strong>
                        <p style={{ margin: "0 0 8px" }}>
                          Recommended excursions return at least 2 hours before all-aboard. Confirm
                          if you want to continue to checkout.
                        </p>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            type="button"
                            onClick={() => {
                              const href = pendingReduced.checkoutHref;
                              setPendingReducedCheckout(null);
                              window.open(href, "_blank", "noopener,noreferrer");
                            }}
                            style={{
                              padding: "6px 10px",
                              borderRadius: 6,
                              border: "none",
                              background: "#d97706",
                              color: "#ffffff",
                              fontWeight: 700,
                              fontSize: "12px",
                              cursor: "pointer",
                            }}
                          >
                            Continue to checkout ↗
                          </button>
                          <button
                            type="button"
                            onClick={() => setPendingReducedCheckout(null)}
                            style={{
                              padding: "6px 10px",
                              borderRadius: 6,
                              border: "1px solid var(--line)",
                              background: "#ffffff",
                              color: "var(--deep)",
                              fontWeight: 600,
                              fontSize: "12px",
                              cursor: "pointer",
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{ borderTop: "1px solid var(--line)", paddingTop: 10 }}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {card.checkoutAvailable && activeDep ? (
                        <button
                          type="button"
                          disabled={isRevalidating}
                          onClick={() => void handleBookThisTour(card, activeDep)}
                          style={{
                            flex: 1,
                            padding: "9px 12px",
                            borderRadius: 8,
                            border: "none",
                            background: "var(--forest)",
                            color: "#ffffff",
                            fontSize: "13px",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          {isRevalidating ? "Checking…" : card.checkoutCtaLabel}
                        </button>
                      ) : (
                        <span
                          style={{
                            flex: 1,
                            textAlign: "center",
                            padding: "9px 12px",
                            borderRadius: 8,
                            border: "1px solid var(--line)",
                            background: "#ffffff",
                            color: "var(--muted)",
                            fontSize: "12.5px",
                            fontWeight: 600,
                          }}
                        >
                          {activeDep ? "Online booking unavailable" : "Select an available date"}
                        </span>
                      )}

                      {activeDep && (
                        <button
                          type="button"
                          onClick={() => {
                            if (typeof window !== "undefined") {
                              window.location.assign(activeDep.plannerAddHref);
                            }
                          }}
                          style={{
                            flex: 1,
                            textAlign: "center",
                            padding: "9px 12px",
                            borderRadius: 8,
                            border: "1px solid var(--forest)",
                            background: "#ffffff",
                            color: "var(--forest)",
                            fontSize: "13px",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          {card.addToGroupPlanLabel}
                        </button>
                      )}
                    </div>
                    {card.checkoutAvailable && card.checkoutProviderLabel && activeDep && (
                      <p
                        style={{
                          fontSize: "11.5px",
                          color: "var(--muted)",
                          margin: "6px 0 0",
                          textAlign: "center",
                        }}
                      >
                        {card.checkoutProviderLabel} · Availability rechecked before checkout
                      </p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <p style={{ color: "var(--muted)", fontSize: "14px", margin: 0 }}>
            No live departures are currently available for {serviceDate}. Try another Alaska sailing
            date between May and September.
          </p>
        )}
      </div>
    </section>
  );
}
