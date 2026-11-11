"use client";

import { useEffect, useMemo, useState } from "react";
import {
  buildCruisePromenadeCoordinationHref,
  extractNonPiiAttribution,
  stripPrivateParamsFromSearch,
  type SanitizedCommercialAttribution,
} from "@/lib/dcc/commercialAttribution";

const WNO_ATTRIBUTION_STORAGE_KEY = "wno_commercial_attribution_v1";

interface PortNolaShipOption {
  shipName: string;
  cruiseLine: string;
  terminal: "Erato Street Cruise Terminal" | "Julia Street Cruise Terminal";
  typicalFinalBoarding: string;
}

const PORT_NOLA_SHIPS: PortNolaShipOption[] = [
  {
    shipName: "Carnival Liberty",
    cruiseLine: "Carnival Cruise Line",
    terminal: "Erato Street Cruise Terminal",
    typicalFinalBoarding: "14:30",
  },
  {
    shipName: "Carnival Dream",
    cruiseLine: "Carnival Cruise Line",
    terminal: "Erato Street Cruise Terminal",
    typicalFinalBoarding: "14:30",
  },
  {
    shipName: "Carnival Valor",
    cruiseLine: "Carnival Cruise Line",
    terminal: "Erato Street Cruise Terminal",
    typicalFinalBoarding: "14:30",
  },
  {
    shipName: "Norwegian Getaway",
    cruiseLine: "Norwegian Cruise Line",
    terminal: "Julia Street Cruise Terminal",
    typicalFinalBoarding: "14:30",
  },
  {
    shipName: "Norwegian Breakaway",
    cruiseLine: "Norwegian Cruise Line",
    terminal: "Julia Street Cruise Terminal",
    typicalFinalBoarding: "14:30",
  },
  {
    shipName: "Mariner of the Seas",
    cruiseLine: "Royal Caribbean",
    terminal: "Julia Street Cruise Terminal",
    typicalFinalBoarding: "14:30",
  },
];

function parseClockMinutes(hhmm: string): number | null {
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(hhmm.trim());
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

function formatClock12(totalMinutes: number): string {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  const h24 = Math.floor(normalized / 60);
  const mins = String(normalized % 60).padStart(2, "0");
  const suffix = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${mins} ${suffix}`;
}

function captureWnoAttribution(): SanitizedCommercialAttribution | null {
  if (typeof window === "undefined") return null;
  const rawSearch = window.location.search;
  if (rawSearch && rawSearch.length > 1) {
    const params = new URLSearchParams(rawSearch);
    const extracted = extractNonPiiAttribution(params, {
      specialistSite: "welcometoneworleanstours.com",
      defaultPortSlug: "new-orleans",
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
        WNO_ATTRIBUTION_STORAGE_KEY,
        JSON.stringify(extracted),
      );
    } catch {
      // ignore storage quota errors
    }
    return extracted;
  }

  try {
    const cached = sessionStorage.getItem(WNO_ATTRIBUTION_STORAGE_KEY);
    if (cached) {
      return JSON.parse(cached) as SanitizedCommercialAttribution;
    }
  } catch {
    // ignore
  }

  return extractNonPiiAttribution(
    {},
    {
      specialistSite: "welcometoneworleanstours.com",
      defaultPortSlug: "new-orleans",
      landingPath: window.location.pathname,
    },
  );
}

function fireWnoConversionEvent(
  eventName: string,
  payload: Record<string, unknown>,
) {
  if (typeof window === "undefined") return;
  try {
    const win = window as unknown as {
      gtag?: (...args: unknown[]) => void;
      dataLayer?: Array<Record<string, unknown>>;
    };
    if (typeof win.gtag === "function") {
      win.gtag("event", eventName, payload);
    } else if (Array.isArray(win.dataLayer)) {
      win.dataLayer.push({ event: eventName, ...payload });
    }
  } catch {
    // non-blocking
  }

  try {
    window.dispatchEvent(
      new CustomEvent(`wno:${eventName}`, { detail: payload }),
    );
  } catch {
    // non-blocking
  }
}

export default function NolaCruiseTurnaroundDesk() {
  const [timingScenario, setTimingScenario] = useState<
    "day_before_cruise" | "embarkation_day" | "post_cruise_debarkation"
  >("embarkation_day");
  const [shipName, setShipName] = useState("Carnival Liberty");
  const [sailDate, setSailDate] = useState("2027-03-14");
  const [cutoffTime, setCutoffTime] = useState("14:30");
  const [luggageStatus, setLuggageStatus] = useState<
    "hotel_or_porter_stored" | "rolling_bags_in_hand"
  >("rolling_bags_in_hand");
  const [partySize, setPartySize] = useState(6);
  const [attribution, setAttribution] =
    useState<SanitizedCommercialAttribution | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [interestFocus, setInterestFocus] = useState("riverboat_or_quarter_walk");
  const [notes, setNotes] = useState("");
  const [submitState, setSubmitState] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [submitError, setSubmitError] = useState("");
  const [submissionId, setSubmissionId] = useState("");

  useEffect(() => {
    const captured = captureWnoAttribution();
    if (!captured) return;
    setAttribution(captured);
    if (captured.shipName) setShipName(captured.shipName);
    if (captured.sailDate || captured.portDate) {
      setSailDate((captured.sailDate || captured.portDate)!);
    }
    if (captured.allAboardTime) setCutoffTime(captured.allAboardTime);
    if (captured.partySize) setPartySize(captured.partySize);
  }, []);

  const matchedShip = useMemo(
    () =>
      PORT_NOLA_SHIPS.find(
        (s) => s.shipName.toLowerCase() === shipName.toLowerCase(),
      ) || null,
    [shipName],
  );

  const terminalName =
    matchedShip?.terminal || "Erato / Julia Street Cruise Terminal";

  const suitability = useMemo(() => {
    const cutoffMins = parseClockMinutes(cutoffTime);
    if (timingScenario === "day_before_cruise") {
      return {
        safeCutoffLabel: "No Same-Day Gangway Clock",
        regionalSwampVerdict: "SAFE — Day-Before Arrival",
        regionalSwampTone: "safe" as const,
        explanation:
          "Arriving the day before embarkation unlocks half-day Jean Lafitte / Honey Island swamp tours (4.5h door-to-door) AND evening Steamboat Natchez jazz cruises or French Quarter ghost walks without risking your ship boarding window.",
      };
    }

    if (timingScenario === "post_cruise_debarkation") {
      const msyBufferMins = 150; // 35m I-10 to MSY + 115m bag drop & TSA margin
      const latestTourEnd =
        cutoffMins !== null ? cutoffMins - msyBufferMins : null;
      const fitsAfternoonTour = cutoffMins !== null && cutoffMins >= 16 * 60 + 30;
      return {
        safeCutoffLabel:
          latestTourEnd !== null
            ? `Depart for MSY by ${formatClock12(latestTourEnd)}`
            : "Enter MSY Flight Time",
        regionalSwampVerdict: fitsAfternoonTour
          ? "POSSIBLE WITH 4:30 PM+ FLIGHT & BAG HOLD"
          : "TOO TIGHT FOR REGIONAL BUS TOURS",
        regionalSwampTone: fitsAfternoonTour ? ("caution" as const) : ("risk" as const),
        explanation:
          luggageStatus === "rolling_bags_in_hand"
            ? "Debarkation self-assist finishes 8:00–9:30 AM, but rolling suitcases cannot board French Quarter walking tours or standard swamp shuttles unless stored first (confirm motorcoach luggage hold or baggage drop before booking)."
            : "With bags stored or checked, allow 150 minutes before your MSY flight departure (I-10 West traffic + TSA).",
      };
    }

    // Same-day embarkation morning
    const terminalBufferMins = 90; // DCC Port NOLA check-in & security margin before final boarding
    const latestTerminalArrival =
      cutoffMins !== null ? cutoffMins - terminalBufferMins : null;
    return {
      safeCutoffLabel:
        latestTerminalArrival !== null
          ? `At ${terminalName.split(" ")[0]} Terminal by ${formatClock12(latestTerminalArrival)}`
          : "At Terminal 90m Before Final Boarding",
      regionalSwampVerdict: "HIGH RISK — SKIP SWAMP / PLANTATION TODAY",
      regionalSwampTone: "risk" as const,
      explanation:
        luggageStatus === "rolling_bags_in_hand"
          ? `Drop checked bags with ${terminalName} porters (typically open ~10:00 AM) or your hotel bell desk FIRST. Regional swamp/plantation transfers take 4.5–5.5h across I-10/US-90 — stay walkable near Riverwalk, Jackson Square, or a 2h morning city/river outing.`
          : `Even with bags stored at your hotel, regional swamp/plantation bus tours (4.5–5.5h) leave zero highway delay margin before ${cutoffTime} final boarding at ${terminalName}. Stick to 2h city or riverfront options.`,
    };
  }, [timingScenario, cutoffTime, luggageStatus, terminalName]);

  const cpReturn = useMemo(
    () =>
      buildCruisePromenadeCoordinationHref({
        shipName,
        shipSlug: attribution?.shipSlug,
        sailDate,
        portSlug: "new-orleans",
        specialistSite: "welcometoneworleanstours.com",
        campaign: attribution?.utmCampaign || "wno_precruise_group_return",
      }),
    [shipName, attribution, sailDate],
  );

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    setSubmitState("submitting");

    try {
      const latestAttr = attribution || captureWnoAttribution();
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          shipName,
          sailDate,
          timingScenario,
          terminal: terminalName,
          luggageStatus,
          partySize,
          interestFocus,
          notes,
          sourcePath: window.location.pathname,
          attribution: latestAttr,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok || !data.persisted) {
        throw new Error(
          data.error ||
            "Unable to save your inquiry right now. Please check your details and try again.",
        );
      }

      setSubmissionId(data.submissionId);
      setSubmitState("success");

      fireWnoConversionEvent("wno_cruise_inquiry_submitted", {
        conversionEvent: "wno_cruise_inquiry_submitted",
        submissionId: data.submissionId,
        shipName,
        sailDate,
        timingScenario,
        luggageStatus,
        partySize,
        interestFocus,
        utmSource: latestAttr?.utmSource || latestAttr?.source || "direct",
        utmCampaign: latestAttr?.utmCampaign || null,
      });
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Failed to submit inquiry.",
      );
      setSubmitState("error");
    }
  };

  return (
    <section
      data-testid="wno-cruise-turnaround-desk"
      aria-label="DCC Port of New Orleans Turnaround Planner and Concierge"
      className="mx-auto max-w-6xl px-6 pb-12 space-y-6"
    >
      {/* 1. Explicit Commercial & Channel Disclosure */}
      <div
        data-testid="commercial-disclosure-banner"
        className="border border-[rgba(212,175,55,0.45)] bg-[#171510] p-5 md:p-6"
      >
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--nola-gold)] mb-1.5">
          Commercial &amp; Booking Channel Disclosure
        </p>
        <p className="text-sm leading-relaxed text-[#ece5d8]">
          <strong>How Welcome to New Orleans Tours works:</strong> Tours are
          operated by independent local New Orleans providers.{" "}
          <strong>(1) Partner Checkout (Disclosed Affiliate Handoff):</strong>{" "}
          Clicking &ldquo;Check Dates &amp; Prices&rdquo; on tour cards below
          opens third-party checkout via{" "}
          <strong>Viator or FareHarbor</strong>; we may earn a referral
          commission at no extra cost to you, and the checkout platform/operator
          is merchant of record.{" "}
          <strong>(2) Pre/Post-Cruise &amp; Group Concierge Inquiry:</strong>{" "}
          Free coordination request below for luggage-compatible timing or
          multi-cabin groups — <strong>no payment is collected on this site</strong>.
        </p>
      </div>

      {/* 2. DCC Port of New Orleans Turnaround & Luggage Calculator */}
      <div
        data-testid="dcc-nola-turnaround-calculator"
        className="border border-[var(--nola-border)] bg-[#12110e] p-5 md:p-8"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--nola-gold)]">
            DCC Port of New Orleans Timing &amp; Luggage Check • Erato &amp; Julia Terminals
          </span>
          {attribution && (attribution.utmSource || attribution.utmCampaign) ? (
            <span
              data-testid="wno-active-attribution-pill"
              className="rounded border border-[rgba(212,175,55,0.4)] bg-[#1f1b13] px-2.5 py-1 font-mono text-[11px] text-[#f5d97e]"
            >
              Context: {attribution.utmSource || attribution.source} ·{" "}
              {attribution.utmCampaign || "cruise_handoff"}
              {attribution.strippedPrivateKeys.length > 0
                ? " · PII scrubbed"
                : ""}
            </span>
          ) : null}
        </div>

        <h2 className="font-serif text-2xl md:text-3xl text-[#fdfbf7]">
          Check What Safely Fits Your Cruise Schedule &amp; Suitcases
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#cdc5b8]">
          Port of New Orleans cruise terminals sit right beside the Warehouse
          District and Riverwalk (<strong>Erato Street</strong> for Carnival;{" "}
          <strong>Julia Street</strong> for Norwegian &amp; Royal Caribbean),
          roughly 5–10 minutes from the French Quarter — while Jean Lafitte /
          Honey Island swamp docks sit 35–55 minutes outside downtown.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#d4af37]">
            <span>Cruise Window</span>
            <select
              value={timingScenario}
              onChange={(e) =>
                setTimingScenario(
                  e.target.value as
                    | "day_before_cruise"
                    | "embarkation_day"
                    | "post_cruise_debarkation",
                )
              }
              className="mt-1.5 min-h-[42px] w-full border border-[#3a3224] bg-[#1a1814] px-3 py-2 text-sm font-normal normal-case text-[#fdfbf7]"
            >
              <option value="embarkation_day">Same-Day Embarkation Morning</option>
              <option value="day_before_cruise">Arriving Day Before Cruise</option>
              <option value="post_cruise_debarkation">Post-Cruise Debarkation → MSY Flight</option>
            </select>
          </label>

          <label className="block text-xs font-semibold uppercase tracking-wider text-[#d4af37]">
            <span>Port NOLA Cruise Ship</span>
            <select
              value={shipName}
              onChange={(e) => setShipName(e.target.value)}
              className="mt-1.5 min-h-[42px] w-full border border-[#3a3224] bg-[#1a1814] px-3 py-2 text-sm font-normal normal-case text-[#fdfbf7]"
            >
              {PORT_NOLA_SHIPS.map((s) => (
                <option key={s.shipName} value={s.shipName}>
                  {s.shipName} ({s.terminal.replace(" Cruise Terminal", "")})
                </option>
              ))}
              {!PORT_NOLA_SHIPS.some(
                (s) => s.shipName.toLowerCase() === shipName.toLowerCase(),
              ) ? (
                <option value={shipName}>{shipName}</option>
              ) : null}
            </select>
          </label>

          <label className="block text-xs font-semibold uppercase tracking-wider text-[#d4af37]">
            <span>Sail / Turnaround Date</span>
            <input
              type="date"
              value={sailDate}
              onChange={(e) => setSailDate(e.target.value)}
              className="mt-1.5 min-h-[42px] w-full border border-[#3a3224] bg-[#1a1814] px-3 py-2 text-sm font-normal normal-case text-[#fdfbf7]"
            />
          </label>

          <label className="block text-xs font-semibold uppercase tracking-wider text-[#d4af37]">
            <span>
              {timingScenario === "post_cruise_debarkation"
                ? "MSY Flight Departure Time"
                : "Final Boarding / All-Aboard"}
            </span>
            <input
              type="time"
              value={cutoffTime}
              onChange={(e) => setCutoffTime(e.target.value)}
              className="mt-1.5 min-h-[42px] w-full border border-[#3a3224] bg-[#1a1814] px-3 py-2 text-sm font-normal normal-case text-[#fdfbf7]"
            />
          </label>

          <label className="block text-xs font-semibold uppercase tracking-wider text-[#d4af37]">
            <span>Suitcase / Luggage Status</span>
            <select
              value={luggageStatus}
              onChange={(e) =>
                setLuggageStatus(
                  e.target.value as
                    | "hotel_or_porter_stored"
                    | "rolling_bags_in_hand",
                )
              }
              className="mt-1.5 min-h-[42px] w-full border border-[#3a3224] bg-[#1a1814] px-3 py-2 text-sm font-normal normal-case text-[#fdfbf7]"
            >
              <option value="rolling_bags_in_hand">Rolling suitcases with us</option>
              <option value="hotel_or_porter_stored">Stored at hotel / dropped with terminal porters</option>
            </select>
          </label>

          <label className="block text-xs font-semibold uppercase tracking-wider text-[#d4af37]">
            <span>Party / Group Size</span>
            <input
              type="number"
              min={1}
              max={150}
              value={partySize}
              onChange={(e) =>
                setPartySize(Math.max(1, Math.min(150, Number(e.target.value) || 2)))
              }
              className="mt-1.5 min-h-[42px] w-full border border-[#3a3224] bg-[#1a1814] px-3 py-2 text-sm font-normal normal-case text-[#fdfbf7]"
            />
          </label>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="border-l-2 border-[var(--nola-gold)] bg-[#191712] p-4">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--nola-gold)]">
              DCC Cutoff &amp; Terminal Assignment ({terminalName})
            </div>
            <div className="mt-1 font-serif text-xl font-bold text-[#fdfbf7]">
              {suitability.safeCutoffLabel}
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-[#cdc5b8]">
              {suitability.explanation}
            </p>
          </div>

          <div
            className={`border-l-2 p-4 ${
              suitability.regionalSwampTone === "safe"
                ? "border-emerald-400 bg-emerald-950/25"
                : suitability.regionalSwampTone === "caution"
                  ? "border-amber-400 bg-amber-950/25"
                  : "border-rose-400 bg-rose-950/25"
            }`}
          >
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#f5d97e]">
              Regional Swamp &amp; Plantation Suitability Verdict
            </div>
            <div className="mt-1 font-serif text-lg font-bold text-[#fdfbf7]">
              {suitability.regionalSwampVerdict}
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-[#dcd5ca]">
              {partySize >= 8
                ? `Group of ${partySize} guests detected: standard hotel-shuttle vans cap seats per pickup stop. Use the Pre/Post-Cruise Concierge form below for coordinated group pickup & luggage hold.`
                : "Compare walkable French Quarter, city sightseeing, and Steamboat Natchez riverfront options below, or request luggage-compatible concierge help."}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Qualified Pre/Post-Cruise & Group Luggage Concierge Inquiry Form */}
      <div
        id="cruise-concierge-inquiry"
        data-testid="wno-concierge-form-card"
        className="border border-[#3a3224] bg-[#15130f] p-5 md:p-8"
      >
        <div className="mb-5">
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--nola-gold)]">
            Qualified Inquiry • Direct to Unified Operator Inbox (No Payment Collected)
          </span>
          <h3 className="mt-1.5 font-serif text-2xl text-[#fdfbf7]">
            Need Luggage-Friendly Timing or Pre/Post-Cruise Group Coordination?
          </h3>
          <p className="mt-1.5 max-w-3xl text-sm text-[#cdc5b8]">
            Tell us your ship, turnaround window, and bag count. We match
            travelers and cruise groups with verified local operators that
            fit your terminal check-in or MSY flight clock — without guessing
            about suitcase storage.
          </p>
        </div>

        {submitState === "success" ? (
          <div
            data-testid="wno-inquiry-confirmation"
            data-conversion-event="wno_cruise_inquiry_submitted"
            role="status"
            aria-live="polite"
            className="space-y-4 border border-emerald-500/40 bg-emerald-950/30 p-5"
          >
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-300">
                ✓ Qualified Turnaround Inquiry Logged
              </p>
              <p className="mt-1 font-serif text-xl text-white">
                Reference Code: <span className="font-mono text-[#f5d97e]">{submissionId}</span>
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[#e5dfd3]">
                Saved for <strong>{partySize} guest(s)</strong> on{" "}
                <strong>{shipName}</strong> ({sailDate || "date pending"} ·{" "}
                {terminalName}). No payment was collected; our concierge desk
                reviews your luggage and boarding window directly from the
                Unified Operator Inbox.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/15 pt-4">
              <span className="text-xs text-[#dcd5ca]">
                Sailing with friends or multiple cabins? Track everyone&apos;s
                plans commission-free on Cruise Promenade:
              </span>
              <a
                href={cpReturn.href}
                data-testid="wno-confirmation-cp-return"
                className="inline-block border border-[var(--nola-gold)] bg-[#1f1b13] px-4 py-2 text-xs font-bold uppercase tracking-wider text-[var(--nola-gold)] hover:bg-[var(--nola-gold)] hover:text-[#171717] transition"
              >
                Open Cruise Promenade Group Board →
              </a>
            </div>
          </div>
        ) : (
          <form onSubmit={handleInquirySubmit} className="space-y-4">
            {submitState === "error" ? (
              <div
                role="alert"
                className="border border-rose-500/50 bg-rose-950/40 px-4 py-3 text-xs text-rose-200"
              >
                {submitError}
              </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#dcd5ca]">
                <span>Your Name *</span>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jordan Taylor"
                  className="mt-1.5 min-h-[42px] w-full border border-[#3a3224] bg-[#1a1814] px-3 py-2 text-sm font-normal normal-case text-[#fdfbf7]"
                />
              </label>

              <label className="block text-xs font-semibold uppercase tracking-wider text-[#dcd5ca]">
                <span>Email Address *</span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jordan@domain.com"
                  className="mt-1.5 min-h-[42px] w-full border border-[#3a3224] bg-[#1a1814] px-3 py-2 text-sm font-normal normal-case text-[#fdfbf7]"
                />
              </label>

              <label className="block text-xs font-semibold uppercase tracking-wider text-[#dcd5ca]">
                <span>Mobile Phone (Optional)</span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(504) 200-0000"
                  className="mt-1.5 min-h-[42px] w-full border border-[#3a3224] bg-[#1a1814] px-3 py-2 text-sm font-normal normal-case text-[#fdfbf7]"
                />
              </label>

              <label className="block text-xs font-semibold uppercase tracking-wider text-[#dcd5ca]">
                <span>Experience Focus</span>
                <select
                  value={interestFocus}
                  onChange={(e) => setInterestFocus(e.target.value)}
                  className="mt-1.5 min-h-[42px] w-full border border-[#3a3224] bg-[#1a1814] px-3 py-2 text-sm font-normal normal-case text-[#fdfbf7]"
                >
                  <option value="riverboat_or_quarter_walk">Steamboat Jazz Cruise / Walkable Quarter</option>
                  <option value="city_bus_with_luggage_advice">City Sightseeing + Luggage Logistics</option>
                  <option value="day_prior_swamp_pickup">Day-Before Swamp Tour w/ Hotel Pickup</option>
                  <option value="private_cruise_group_van">Private Multi-Cabin Group Van (8+ Guests)</option>
                </select>
              </label>
            </div>

            <label className="block text-xs font-semibold uppercase tracking-wider text-[#dcd5ca]">
              <span>Hotel, Flight Time, or Group Notes</span>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g., Staying near Canal St, checking out at 10:30 AM with 6 rolling bags before boarding Carnival Liberty..."
                className="mt-1.5 w-full border border-[#3a3224] bg-[#1a1814] px-3 py-2 text-sm font-normal normal-case text-[#fdfbf7]"
              />
            </label>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
              <p className="text-xs text-[#b9b0a2]">
                Free concierge check • Zero payment collected • Routed to
                Unified Operator Inbox
              </p>
              <button
                type="submit"
                data-testid="wno-inquiry-submit-btn"
                disabled={submitState === "submitting"}
                className="min-h-[44px] bg-[var(--nola-gold)] px-6 py-3 text-xs font-bold uppercase tracking-widest text-[#171717] hover:bg-[#ffe494] disabled:opacity-60 transition"
              >
                {submitState === "submitting"
                  ? "Saving Turnaround Request…"
                  : "Request Cruise Turnaround Match →"}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* 4. Commission-Neutral Route Back to Cruise Promenade */}
      <div
        data-testid="cp-coordination-bridge-card"
        className="flex flex-wrap items-center justify-between gap-4 border border-[var(--nola-border)] bg-[#12110e] p-5"
      >
        <div className="max-w-2xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--nola-gold)]">
            Coordinating a Multi-Cabin Cruise Group Out of New Orleans?
          </p>
          <p className="mt-1 text-xs leading-relaxed text-[#cdc5b8]">
            Use Cruise Promenade to see who in your sailing party is arriving a
            day early, sharing hotel pickups, or booking shore excursions —
            100% commission-neutral for organizers and guests.
          </p>
        </div>
        <a
          href={cpReturn.href}
          data-testid="cp-group-return-link"
          className="min-h-[40px] inline-flex items-center border border-[rgba(212,175,55,0.55)] bg-[#1c1812] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[#fdfbf7] hover:border-[var(--nola-gold)] hover:text-[var(--nola-gold)] transition"
        >
          {cpReturn.isExactSailingRollCall
            ? `Return to ${shipName} Board on Cruise Promenade →`
            : "Coordinate Group Plans on Cruise Promenade →"}
        </a>
      </div>
    </section>
  );
}
