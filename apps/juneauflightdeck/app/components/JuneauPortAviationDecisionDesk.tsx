"use client";

import { useEffect, useMemo, useState } from "react";
import {
  buildCruisePromenadeCoordinationHref,
  extractNonPiiAttribution,
  stripPrivateParamsFromSearch,
  type SanitizedCommercialAttribution,
} from "@/lib/dcc/commercialAttribution";
import { buildAddToCruisePromenadeUrl } from "@/lib/dcc/shared/addToCruisePromenadeUrl";
import { sharePortDate } from "@/lib/portDate";
import { ALASKA_CRUISE_FLEET } from "../../lib/alaskaCruiseFleet";
import { buildJfdViatorHandoffUrl } from "../../lib/viator/handoff";
import { sendJfdTelemetry } from "./DccNetworkBridge";

export const JFD_ATTRIBUTION_STORAGE_KEY = "jfd_commercial_attribution_v1";

function parseMinutes(hhmm: string): number | null {
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(hhmm.trim());
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

function formatClock(totalMinutes: number): string {
  const clamped = ((totalMinutes % 1440) + 1440) % 1440;
  const h24 = Math.floor(clamped / 60);
  const mins = String(clamped % 60).padStart(2, "0");
  const period = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${mins} ${period}`;
}

function evaluateSnowCampSeason(isoDate: string): {
  status: "in_window" | "shoulder_risk" | "outside_window" | "unset";
  badge: string;
  explanation: string;
} {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
    return {
      status: "unset",
      badge: "Select Port Date",
      explanation:
        "High-altitude Juneau Icefield dog-sled snow camps typically operate early May through late August depending on snowpack. Select your port date to verify.",
    };
  }
  const mmdd = isoDate.slice(5);
  if (mmdd >= "05-10" && mmdd <= "08-22") {
    return {
      status: "in_window",
      badge: "Inside Snow-Camp Window (May–Late Aug)",
      explanation:
        "Your port date falls inside the typical high-icefield snow-camp window for real helicopter glacier dog sledding (TEMSCO / Coastal). Do not confuse snow-glacier flights with $169 wheeled rainforest cart camps.",
    };
  }
  if ((mmdd >= "05-01" && mmdd < "05-10") || (mmdd > "08-22" && mmdd <= "09-03")) {
    return {
      status: "shoulder_risk",
      badge: "Shoulder Snowpack Window — Have Ice-Walk Backup",
      explanation:
        "Early May and late August sit on the snowpack boundary for glacier dog camps. Keep Mendenhall/Herbert Glacier Helicopter Ice Walk (operates through late Sept/Oct) selected as an immediate backup.",
    };
  }
  return {
    status: "outside_window",
    badge: "Outside Snow-Camp Season — Choose Glacier Landing / Ice Walk",
    explanation:
      "Glacier dog-sled camps on the Juneau Icefield have typically demobilized by September. Standard Helicopter Glacier Landings & Ice Walks still operate on bare blue glacial ice through late September/early October.",
  };
}

export function getOrCaptureJfdAttribution(): SanitizedCommercialAttribution | null {
  if (typeof window === "undefined") return null;
  const rawSearch = window.location.search;
  if (rawSearch && rawSearch.length > 1) {
    const params = new URLSearchParams(rawSearch);
    const extracted = extractNonPiiAttribution(params, {
      specialistSite: "juneauflightdeck.com",
      defaultPortSlug: "juneau",
      landingPath: window.location.pathname,
    });

    const { cleanSearch, strippedKeys } = stripPrivateParamsFromSearch(rawSearch);
    if (strippedKeys.length > 0 && window.history?.replaceState) {
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${cleanSearch}${window.location.hash || ""}`,
      );
    }

    try {
      sessionStorage.setItem(
        JFD_ATTRIBUTION_STORAGE_KEY,
        JSON.stringify(extracted),
      );
    } catch {
      // ignore storage quota errors
    }
    return extracted;
  }

  try {
    const cached = sessionStorage.getItem(JFD_ATTRIBUTION_STORAGE_KEY);
    if (cached) {
      return JSON.parse(cached) as SanitizedCommercialAttribution;
    }
  } catch {
    // ignore
  }

  return extractNonPiiAttribution(
    {},
    {
      specialistSite: "juneauflightdeck.com",
      defaultPortSlug: "juneau",
      landingPath: window.location.pathname,
    },
  );
}

export default function JuneauPortAviationDecisionDesk() {
  const [shipName, setShipName] = useState("Discovery Princess");
  const [portDate, setPortDate] = useState("2027-07-14");
  const [arrivalTime, setArrivalTime] = useState("07:00");
  const [allAboardTime, setAllAboardTime] = useState("16:00");
  const [berthType, setBerthType] = useState<"docked" | "tender">("docked");
  const [partySize, setPartySize] = useState(4);
  const [attribution, setAttribution] =
    useState<SanitizedCommercialAttribution | null>(null);
  const [handoffClicked, setHandoffClicked] = useState(false);

  useEffect(() => {
    const captured = getOrCaptureJfdAttribution();
    if (!captured) return;
    setAttribution(captured);

    if (captured.shipName) {
      setShipName(captured.shipName);
      const fleetMatch = ALASKA_CRUISE_FLEET.find(
        (s) => s.shipName.toLowerCase() === captured.shipName!.toLowerCase(),
      );
      if (
        fleetMatch &&
        fleetMatch.typicalScheduledBerth.toLowerCase().includes("anchor")
      ) {
        setBerthType("tender");
      }
    }
    if (captured.portDate || captured.sailDate) {
      const nextDate = (captured.portDate || captured.sailDate)!;
      setPortDate(nextDate);
      sharePortDate(nextDate);
    }
    if (captured.arrivalTime) setArrivalTime(captured.arrivalTime);
    if (captured.allAboardTime) setAllAboardTime(captured.allAboardTime);
    if (captured.berthOrTerminal === "tender") setBerthType("tender");
    if (captured.berthOrTerminal === "docked") setBerthType("docked");
    if (captured.partySize) setPartySize(captured.partySize);
  }, []);

  const timingCalc = useMemo(() => {
    const arrivalMins = parseMinutes(arrivalTime);
    const allAboardMins = parseMinutes(allAboardTime);
    const dccBerthBuffer = berthType === "tender" ? 90 : 60;
    const shuttleReturnMins = 20;
    const totalDccMargin = dccBerthBuffer + shuttleReturnMins;
    const viatorSection20Margin = 120;

    if (arrivalMins === null || allAboardMins === null || allAboardMins <= arrivalMins) {
      return null;
    }

    const earliestHeliportCheckin = arrivalMins + (berthType === "tender" ? 55 : 30);
    const latestSafeHeliportReturn = allAboardMins - totalDccMargin;
    const viatorWorryFreeEndCutoff = allAboardMins - viatorSection20Margin;
    const usableFlightMinutes = latestSafeHeliportReturn - earliestHeliportCheckin;

    return {
      dccBerthBuffer,
      shuttleReturnMins,
      totalDccMargin,
      earliestCheckinLabel: formatClock(earliestHeliportCheckin),
      latestSafeReturnLabel: formatClock(latestSafeHeliportReturn),
      viatorSection20EndLabel: formatClock(viatorWorryFreeEndCutoff),
      fits2HourIceWalk: usableFlightMinutes >= 135,
      fits3HourDogSled: usableFlightMinutes >= 195,
      usableHoursLabel: Math.max(0, usableFlightMinutes / 60).toFixed(1),
    };
  }, [arrivalTime, allAboardTime, berthType]);

  const snowSeason = useMemo(() => evaluateSnowCampSeason(portDate), [portDate]);

  const cpReturn = useMemo(
    () =>
      buildCruisePromenadeCoordinationHref({
        shipName,
        shipSlug: attribution?.shipSlug,
        sailDate: attribution?.sailDate || portDate,
        portSlug: "juneau",
        specialistSite: "juneauflightdeck.com",
        campaign: attribution?.utmCampaign || "jfd_sold_out_group_return",
      }),
    [shipName, attribution, portDate],
  );

  // Preserve existing P00058396 affiliate ID untouched per guardrail while routing via /go/commerce/handoff
  const verifiedViatorPartnerHref = useMemo(() => {
    const campaign = attribution?.utmCampaign
      ? `jfd-soldout-${attribution.utmCampaign}`
      : "jfd-soldout-coastal-icefield";
    const q = new URLSearchParams({
      pid: "P00058396",
      mcid: "42383",
      medium: "api",
      campaign,
    });
    if (/^\d{4}-\d{2}-\d{2}$/.test(portDate)) {
      q.set("startDate", portDate);
    }
    if (partySize >= 1 && partySize <= 15) {
      q.set("numTravelers", String(partySize));
    }
    const rawViatorUrl = `https://www.viator.com/tours/Juneau/Juneau-Shore-Excursion-Helicopter-Tour-and-Guided-Icefield-Walk/d941-6251SHOREXICEWALK?${q.toString()}`;
    return buildJfdViatorHandoffUrl(rawViatorUrl, {
      productCode: "6251SHOREXICEWALK",
      campaign,
      date: portDate,
      partySize,
      cruiseShip: shipName || null,
    });
  }, [portDate, partySize, attribution, shipName]);

  const handlePartnerHandoffClick = () => {
    setHandoffClicked(true);
    sendJfdTelemetry("jfd_partner_handoff_clicked", {
      conversionEvent: "jfd_partner_handoff_clicked",
      viatorProductCode: "6251SHOREXICEWALK",
      operator: "Coastal Helicopters",
      portDate,
      partySize,
      shipName,
      berthType,
      utmSource: attribution?.utmSource || attribution?.source || "direct",
      utmCampaign: attribution?.utmCampaign || null,
    });
  };

  return (
    <section
      data-testid="jfd-dcc-aviation-decision-desk"
      aria-label="DCC Juneau Glacier Aviation Timing and Booking Disclosure"
      style={{
        display: "grid",
        gap: "20px",
        marginBottom: "36px",
      }}
    >
      {/* 1. Explicit Commercial & Channel Disclosure */}
      <div
        data-testid="commercial-disclosure-banner"
        style={{
          background: "rgba(7, 25, 40, 0.92)",
          border: "1px solid rgba(151, 211, 255, 0.35)",
          borderRadius: "var(--radius-lg, 16px)",
          padding: "clamp(16px, 3vw, 22px)",
        }}
      >
        <div
          style={{
            fontSize: "0.75rem",
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.09em",
            color: "var(--accent, #f0b35b)",
            marginBottom: "6px",
          }}
        >
          Commercial &amp; Booking Channel Disclosure
        </div>
        <p
          style={{
            margin: 0,
            fontSize: "0.9rem",
            lineHeight: 1.6,
            color: "var(--text, #f8fafc)",
          }}
        >
          <strong>How Juneau Flight Deck works:</strong> We are an independent
          specialist guide — not the flight operator or merchant of record.{" "}
          <strong>(1) Partner Checkout (Affiliate Handoff):</strong> Links to
          Viator (such as Coastal Helicopters{" "}
          <code style={{ fontSize: "0.82rem" }}>6251SHOREXICEWALK</code>) may
          earn us a partner commission at no extra cost to you; Viator processes
          payment and governs Section 20 Worry-Free Shore Excursion terms.{" "}
          <strong>(2) Direct Operator Reference:</strong> Links to{" "}
          <strong>TEMSCO</strong>, <strong>Coastal</strong>, and{" "}
          <strong>NorthStar</strong> are non-commissioned policy/direct-booking
          references.{" "}
          <strong>(3) Qualified Availability Inquiry:</strong> Free human-reviewed
          request below — no payment or card hold is collected on this site.
        </p>
      </div>

      {/* 2. Source-Backed DCC Port-Window & Snow-Camp Suitability Calculator */}
      <div
        data-testid="dcc-port-timing-calculator"
        style={{
          background: "var(--panel, rgba(5, 19, 31, 0.92))",
          border: "1px solid var(--line-strong, rgba(151, 211, 255, 0.28))",
          borderRadius: "var(--radius-lg, 16px)",
          padding: "clamp(18px, 3.5vw, 28px)",
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "8px",
            marginBottom: "10px",
          }}
        >
          <span
            style={{
              fontSize: "0.76rem",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.09em",
              color: "var(--ice, #9ed9ff)",
            }}
          >
            Source-Backed DCC Port Suitability Check • Juneau, AK
          </span>
          {attribution && (attribution.utmSource || attribution.utmCampaign) ? (
            <span
              data-testid="jfd-active-attribution-pill"
              style={{
                fontSize: "0.72rem",
                fontFamily: "monospace",
                padding: "4px 10px",
                borderRadius: "999px",
                background: "rgba(56, 189, 248, 0.14)",
                border: "1px solid rgba(56, 189, 248, 0.35)",
                color: "#bae6fd",
              }}
            >
              Context: {attribution.utmSource || attribution.source} ·{" "}
              {attribution.utmCampaign || "sailing_handoff"}
              {attribution.strippedPrivateKeys.length > 0
                ? " · PII scrubbed"
                : ""}
            </span>
          ) : null}
        </div>

        <h2
          style={{
            fontSize: "clamp(1.25rem, 3vw, 1.55rem)",
            fontWeight: 800,
            color: "var(--text, #ffffff)",
            margin: "0 0 8px",
          }}
        >
          Step 1: Verify Your Ship&apos;s Safe Flight Window &amp; Snow-Camp Season
        </h2>
        <p
          style={{
            fontSize: "0.92rem",
            lineHeight: 1.55,
            color: "var(--muted, #cbd5e1)",
            margin: "0 0 18px",
          }}
        >
          Juneau&apos;s flight bases sit near Juneau International Airport (JNU),
          roughly <strong>15–20 minutes by operator shuttle</strong> from the
          downtown cruise docks. DCC recommends a{" "}
          <strong>2-hour return buffer</strong> before all-aboard on top of
          shuttle transit so you never race the gangway.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(min(100%, 165px), 1fr))",
            gap: "12px",
            marginBottom: "18px",
          }}
        >
          <label style={{ display: "grid", gap: "5px", fontSize: "0.78rem", color: "var(--ice)" }}>
            <span>Cruise Ship</span>
            <input
              type="text"
              value={shipName}
              onChange={(e) => setShipName(e.target.value)}
              style={{
                minHeight: "42px",
                padding: "8px 10px",
                borderRadius: "10px",
                background: "rgba(2, 11, 18, 0.85)",
                border: "1px solid rgba(151, 211, 255, 0.25)",
                color: "#fff",
                fontSize: "0.88rem",
                width: "100%",
                boxSizing: "border-box",
              }}
            />
          </label>

          <label style={{ display: "grid", gap: "5px", fontSize: "0.78rem", color: "var(--ice)" }}>
            <span>Juneau Port Date</span>
            <input
              type="date"
              value={portDate}
              onChange={(e) => {
                setPortDate(e.target.value);
                if (e.target.value) sharePortDate(e.target.value);
              }}
              style={{
                minHeight: "42px",
                padding: "8px 10px",
                borderRadius: "10px",
                background: "rgba(2, 11, 18, 0.85)",
                border: "1px solid rgba(151, 211, 255, 0.25)",
                color: "#fff",
                fontSize: "0.88rem",
                width: "100%",
                boxSizing: "border-box",
              }}
            />
          </label>

          <label style={{ display: "grid", gap: "5px", fontSize: "0.78rem", color: "var(--ice)" }}>
            <span>Berth Type</span>
            <select
              value={berthType}
              onChange={(e) =>
                setBerthType(e.target.value === "tender" ? "tender" : "docked")
              }
              style={{
                minHeight: "42px",
                padding: "8px 10px",
                borderRadius: "10px",
                background: "rgba(2, 11, 18, 0.85)",
                border: "1px solid rgba(151, 211, 255, 0.25)",
                color: "#fff",
                fontSize: "0.88rem",
                width: "100%",
                boxSizing: "border-box",
              }}
            >
              <option value="docked">Docked Pier (CT / AS / Franklin / AJ)</option>
              <option value="tender">Tendered Anchorage (+30m buffer)</option>
            </select>
          </label>

          <label style={{ display: "grid", gap: "5px", fontSize: "0.78rem", color: "var(--ice)" }}>
            <span>Ship Arrival</span>
            <input
              type="time"
              value={arrivalTime}
              onChange={(e) => setArrivalTime(e.target.value)}
              style={{
                minHeight: "42px",
                padding: "8px 10px",
                borderRadius: "10px",
                background: "rgba(2, 11, 18, 0.85)",
                border: "1px solid rgba(151, 255, 255, 0.25)",
                color: "#fff",
                fontSize: "0.88rem",
                width: "100%",
                boxSizing: "border-box",
              }}
            />
          </label>

          <label style={{ display: "grid", gap: "5px", fontSize: "0.78rem", color: "var(--ice)" }}>
            <span>Published All-Aboard</span>
            <input
              type="time"
              value={allAboardTime}
              onChange={(e) => setAllAboardTime(e.target.value)}
              style={{
                minHeight: "42px",
                padding: "8px 10px",
                borderRadius: "10px",
                background: "rgba(2, 11, 18, 0.85)",
                border: "1px solid rgba(151, 211, 255, 0.25)",
                color: "#fff",
                fontSize: "0.88rem",
                width: "100%",
                boxSizing: "border-box",
              }}
            />
          </label>

          <label style={{ display: "grid", gap: "5px", fontSize: "0.78rem", color: "var(--ice)" }}>
            <span>Party Size</span>
            <input
              type="number"
              min={1}
              max={18}
              value={partySize}
              onChange={(e) =>
                setPartySize(Math.max(1, Math.min(18, Number(e.target.value) || 2)))
              }
              style={{
                minHeight: "42px",
                padding: "8px 10px",
                borderRadius: "10px",
                background: "rgba(2, 11, 18, 0.85)",
                border: "1px solid rgba(151, 211, 255, 0.25)",
                color: "#fff",
                fontSize: "0.88rem",
                width: "100%",
                boxSizing: "border-box",
              }}
            />
          </label>
        </div>

        {timingCalc ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
              gap: "12px",
              marginBottom: "14px",
            }}
          >
            <div
              style={{
                background: "rgba(16, 185, 129, 0.1)",
                border: "1px solid rgba(52, 211, 153, 0.35)",
                borderRadius: "12px",
                padding: "14px",
              }}
            >
              <div style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: "#6ee7b7" }}>
                DCC Latest Safe Heliport Return
              </div>
              <div style={{ fontSize: "1.3rem", fontWeight: 900, color: "#ffffff", marginTop: "4px" }}>
                {timingCalc.latestSafeReturnLabel}
              </div>
              <div style={{ fontSize: "0.78rem", color: "#cbd5e1", marginTop: "4px" }}>
                Includes {timingCalc.dccBerthBuffer}m {berthType} buffer +{" "}
                {timingCalc.shuttleReturnMins}m dock shuttle ({timingCalc.usableHoursLabel}h usable window from {timingCalc.earliestCheckinLabel})
              </div>
            </div>

            <div
              style={{
                background: "rgba(56, 189, 248, 0.1)",
                border: "1px solid rgba(56, 189, 248, 0.35)",
                borderRadius: "12px",
                padding: "14px",
              }}
            >
              <div style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: "#7dd3fc" }}>
                Viator §20 Worry-Free Cutoff
              </div>
              <div style={{ fontSize: "1.3rem", fontWeight: 900, color: "#ffffff", marginTop: "4px" }}>
                End by {timingCalc.viatorSection20EndLabel}
              </div>
              <div style={{ fontSize: "0.78rem", color: "#cbd5e1", marginTop: "4px" }}>
                Tour must end ≥120m before departure to qualify for Viator §20 protection.{" "}
                {timingCalc.fits3HourDogSled
                  ? "✓ Fits both Ice Walk (2.25h) & Dog Sled (3.25h)."
                  : timingCalc.fits2HourIceWalk
                    ? "✓ Fits 2.25h Ice Walk; tight for 3.25h Dog Sled."
                    : "⚠ Tight port call — request concierge timing check."}
              </div>
            </div>

            <div
              style={{
                background:
                  snowSeason.status === "outside_window"
                    ? "rgba(245, 158, 11, 0.14)"
                    : "rgba(15, 23, 42, 0.8)",
                border:
                  snowSeason.status === "outside_window"
                    ? "1px solid rgba(251, 191, 36, 0.45)"
                    : "1px solid rgba(151, 211, 255, 0.25)",
                borderRadius: "12px",
                padding: "14px",
              }}
            >
              <div style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: "#fcd34d" }}>
                Snow-Camp vs. Wheeled Camp Check
              </div>
              <div style={{ fontSize: "0.92rem", fontWeight: 800, color: "#ffffff", marginTop: "4px" }}>
                {snowSeason.badge}
              </div>
              <div style={{ fontSize: "0.76rem", color: "#cbd5e1", marginTop: "4px", lineHeight: 1.45 }}>
                {snowSeason.explanation}
              </div>
            </div>
          </div>
        ) : null}

        {partySize > 6 ? (
          <div
            style={{
              padding: "12px 14px",
              borderRadius: "10px",
              background: "rgba(240, 179, 91, 0.14)",
              border: "1px solid rgba(240, 179, 91, 0.4)",
              fontSize: "0.84rem",
              color: "#fde68a",
            }}
          >
            <strong>FAA 6-Passenger Cabin Rule:</strong> AStar/Bell helicopters
            carry a maximum of <strong>6 guests per aircraft</strong> (subject to
            combined clothed weight; 250–260 lb+ per-person weight surcharges
            apply). Your party of <strong>{partySize}</strong> requires{" "}
            <strong>{Math.ceil(partySize / 6)} coordinated helicopters</strong>{" "}
            — use the Concierge Dispatch option below or coordinate splits in
            Cruise Promenade.
          </div>
        ) : null}
      </div>

      {/* 3. Verified Partner Checkout vs. Direct FAA Operator Reference */}
      <div
        data-testid="jfd-verified-inventory-card"
        style={{
          background: "rgba(3, 14, 23, 0.88)",
          border: "1px solid rgba(52, 211, 153, 0.35)",
          borderRadius: "var(--radius-lg, 16px)",
          padding: "clamp(18px, 3.5vw, 26px)",
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "8px",
            marginBottom: "8px",
          }}
        >
          <span
            style={{
              fontSize: "0.74rem",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "#6ee7b7",
            }}
          >
            Step 2A: Check Verified Partner Inventory Before Joining Waitlist
          </span>
          <span
            style={{
              fontSize: "0.72rem",
              padding: "3px 9px",
              borderRadius: "999px",
              background: "rgba(16, 185, 129, 0.18)",
              color: "#a7f3d0",
              fontWeight: 700,
            }}
          >
            Disclosed Affiliate Handoff · Viator 6251SHOREXICEWALK
          </span>
        </div>

        <h3
          style={{
            fontSize: "1.18rem",
            fontWeight: 800,
            color: "#ffffff",
            margin: "0 0 6px",
          }}
        >
          Coastal Helicopters: Juneau Shore Excursion Helicopter Tour &amp; Guided Icefield Walk
        </h3>
        <p
          style={{
            fontSize: "0.88rem",
            lineHeight: 1.55,
            color: "var(--muted, #cbd5e1)",
            margin: "0 0 14px",
          }}
        >
          Includes round-trip downtown cruise pier shuttle, flight over the
          Juneau Icefield, and guided glacier walk. Covered by{" "}
          <strong>Viator Terms of Use Section 20 (Worry-Free Shore Excursion)</strong>{" "}
          when booked for a slot ending ≥2 hours before ship departure.{" "}
          <em>
            Published base from $459/person (260–299 lb TG1 / 300+ lb TG2 weight
            tiers and live seat availability confirmed directly in Viator).
          </em>
        </p>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "10px",
            alignItems: "center",
          }}
        >
          <a
            href={verifiedViatorPartnerHref}
            data-testid="jfd-partner-checkout-cta"
            data-booking-click="true"
            data-tour-slug="coastal-icefield-landing"
            data-tour-name="Coastal Helicopters Icefield Excursion (6251SHOREXICEWALK)"
            target="_blank"
            rel="noopener noreferrer"
            onClick={handlePartnerHandoffClick}
            className="primary-cta"
            style={{
              fontSize: "0.88rem",
              padding: "11px 18px",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            Check Live Seats &amp; Final Price on Viator (Partner Checkout) ↗
          </a>

          <a
            href={buildAddToCruisePromenadeUrl({
              title:
                "Coastal Helicopters: Juneau Shore Excursion Helicopter Tour & Guided Icefield Walk",
              port: "juneau",
              date: portDate,
              portDate,
              ship: shipName,
              sailDate: attribution?.sailDate || portDate,
              durationMinutes: 135,
              partySize,
              operator: "Coastal Helicopters",
              fitStatus: timingCalc
                ? timingCalc.fits2HourIceWalk
                  ? "fits"
                  : "does_not_fit"
                : "needs_verification",
              sourceSite: "juneauflightdeck.com",
              productCode: "6251SHOREXICEWALK",
            })}
            data-testid="jfd-add-to-cp-plan"
            target="_blank"
            rel="noopener noreferrer"
            className="button button-secondary"
            style={{
              fontSize: "0.82rem",
              padding: "9px 14px",
              borderColor: "rgba(147, 197, 253, 0.45)",
              color: "#dbeafe",
            }}
          >
            Add to Cruise Promenade Plan ↗
          </a>

          <a
            href="https://temscoair.com/juneau-tours/"
            target="_blank"
            rel="noopener noreferrer"
            className="button button-secondary"
            style={{ fontSize: "0.82rem", padding: "9px 14px" }}
          >
            TEMSCO Direct Policy (Non-Commissioned) ↗
          </a>
          <a
            href="https://coastalhelicopters.com/tours/icefield-excursion/"
            target="_blank"
            rel="noopener noreferrer"
            className="button button-secondary"
            style={{ fontSize: "0.82rem", padding: "9px 14px" }}
          >
            Coastal Direct Policy (Non-Commissioned) ↗
          </a>
          <a
            href="https://www.northstartrekking.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="button button-secondary"
            style={{ fontSize: "0.82rem", padding: "9px 14px" }}
          >
            NorthStar Direct Policy (Non-Commissioned) ↗
          </a>
        </div>

        {handoffClicked ? (
          <p
            data-conversion-event="jfd_partner_handoff_clicked"
            style={{
              margin: "10px 0 0",
              fontSize: "0.78rem",
              color: "#6ee7b7",
            }}
          >
            ✓ Partner checkout opened in a new tab. If your date shows sold out
            on Viator, submit the free Qualified Availability Request in Step 2B
            below.
          </p>
        ) : null}
      </div>

      {/* 4. Commission-Neutral Route Back to Cruise Promenade */}
      <div
        data-testid="cp-coordination-bridge-card"
        style={{
          background: "rgba(12, 26, 44, 0.85)",
          border: "1px solid rgba(148, 163, 184, 0.3)",
          borderRadius: "var(--radius-lg, 16px)",
          padding: "16px 20px",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
        }}
      >
        <div style={{ flex: "1 1 280px", minWidth: 0 }}>
          <div
            style={{
              fontSize: "0.72rem",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "#93c5fd",
              marginBottom: "4px",
            }}
          >
            Coordinating Multiple Cabins or a Hosted Cruise Group?
          </div>
          <p
            style={{
              margin: 0,
              fontSize: "0.84rem",
              lineHeight: 1.5,
              color: "#cbd5e1",
            }}
          >
            Cruise Promenade tracks who in your group is on which operator and
            departure time — 100% commission-neutral, even when guests book
            independently across different channels.
          </p>
        </div>
        <a
          href={cpReturn.href}
          data-testid="cp-group-return-link"
          style={{
            padding: "10px 16px",
            borderRadius: "10px",
            border: "1px solid rgba(147, 197, 253, 0.5)",
            background: "rgba(30, 58, 138, 0.45)",
            color: "#eff6ff",
            fontSize: "0.82rem",
            fontWeight: 700,
            textDecoration: "none",
            whiteSpace: "normal",
            textAlign: "center",
          }}
        >
          {cpReturn.isExactSailingRollCall
            ? `Return to ${shipName} Group Board on Cruise Promenade →`
            : "Coordinate Group Port Plans on Cruise Promenade →"}
        </a>
      </div>
    </section>
  );
}
