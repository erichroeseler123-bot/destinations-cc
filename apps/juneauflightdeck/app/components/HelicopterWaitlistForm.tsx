"use client";

import { useState, useEffect } from "react";
import {
  ALASKA_CRUISE_FLEET,
  type AlaskaShipData,
} from "../../lib/alaskaCruiseFleet";
import { sendJfdTelemetry } from "./DccNetworkBridge";

const CRUISE_LINES = [
  "Princess Cruises",
  "Holland America Line",
  "Royal Caribbean",
  "Norwegian Cruise Line (NCL)",
  "Celebrity Cruises",
  "Carnival Cruise Line",
  "Disney Cruise Line",
  "Viking Ocean Cruises",
  "Silversea / Regent / Seabourn",
  "Other / Independent Hotel Stay",
];

export interface TourOption {
  value: string;
  label: string;
  operator?: string;
  category: "glacier_landing" | "dog_sledding" | "ice_trek" | "flightseeing" | "any";
  highlight?: string;
}

export const TOUR_OPTIONS: TourOption[] = [
  {
    value: "temsco-mendenhall-glacier-walk",
    label: "TEMSCO: Mendenhall Glacier Tour & Guided Ice Walk",
    operator: "TEMSCO Helicopters",
    category: "glacier_landing",
    highlight: "Landing directly on Mendenhall Glacier ice with guided walk",
  },
  {
    value: "temsco-glacier-dog-sledding",
    label: "TEMSCO: Helicopter Glacier Dog Sledding Tour",
    operator: "TEMSCO Helicopters",
    category: "dog_sledding",
    highlight: "High demand — authentic high-altitude glacier dog sled camp",
  },
  {
    value: "coastal-icefield-landing",
    label: "Coastal: Juneau Icefield Flight & Glacier Landing",
    operator: "Coastal Helicopters",
    category: "glacier_landing",
    highlight: "Herbert Glacier deep crevasses and cascading icefall landing",
  },
  {
    value: "northstar-glacier-ice-trek",
    label: "NorthStar: Small-Group Glacier Ice Trek & Mountaineering",
    operator: "NorthStar Trekking",
    category: "ice_trek",
    highlight: "Crampons, harnesses & 2hr deep crevasse exploration",
  },
  {
    value: "any",
    label: "Any Available Helicopter Seat (Highest Success Rate)",
    category: "any",
    highlight: "Scans all 3 operators for any open passenger space",
  },
  {
    value: "glacier_landing",
    label: "Any Glacier Landing (TEMSCO or Coastal Helicopters)",
    category: "glacier_landing",
  },
  {
    value: "dog_sledding",
    label: "Any Glacier Dog Sledding (TEMSCO Juneau or Skagway)",
    category: "dog_sledding",
  },
  {
    value: "ice_trek",
    label: "Any Glacier Ice Trek / Climb (NorthStar Trekking)",
    category: "ice_trek",
  },
  {
    value: "flightseeing",
    label: "Scenic Flightseeing (Pure Airtime, No Ice Landing)",
    category: "flightseeing",
  },
];

export default function HelicopterWaitlistForm({
  compact = false,
  defaultPort = "juneau",
}: {
  compact?: boolean;
  defaultPort?: "juneau" | "skagway" | "either";
}) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    cruiseLine: "Princess Cruises",
    shipName: "",
    customShip: "",
    portDate: "",
    skagwayDate: "",
    portCity: defaultPort,
    tourType: "any",
    partySize: "2",
    allowSplitParty: false,
    notes: "",
    bookingMode: "instant_alert" as "instant_alert" | "concierge_dispatch",
  });

  const [preselectedTour, setPreselectedTour] = useState<TourOption | null>(null);
  const [selectedShipData, setSelectedShipData] = useState<AlaskaShipData | null>(null);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [submissionId, setSubmissionId] = useState("");
  const [copiedRollCall, setCopiedRollCall] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Read URL search parameters on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const shipParam = params.get("ship");
    const dateParam = params.get("date");
    const modeParam = params.get("mode");
    const tourParam = params.get("tour");

    if (tourParam) {
      const normalized = tourParam.toLowerCase().trim();
      const matchedTour =
        TOUR_OPTIONS.find((t) => t.value.toLowerCase() === normalized) ||
        TOUR_OPTIONS.find((t) => t.value.toLowerCase().includes(normalized)) ||
        TOUR_OPTIONS.find((t) => normalized.includes(t.value.toLowerCase())) ||
        TOUR_OPTIONS.find((t) => t.category.toLowerCase() === normalized) ||
        (normalized.includes("landing") ? TOUR_OPTIONS.find((t) => t.value === "temsco-mendenhall-glacier-walk") : null) ||
        (normalized.includes("dog") ? TOUR_OPTIONS.find((t) => t.value === "temsco-glacier-dog-sledding") : null) ||
        (normalized.includes("trek") ? TOUR_OPTIONS.find((t) => t.value === "northstar-glacier-ice-trek") : null) ||
        (normalized.includes("flight") ? TOUR_OPTIONS.find((t) => t.value === "flightseeing") : null);

      if (matchedTour) {
        setPreselectedTour(matchedTour);
        setFormData((prev) => ({
          ...prev,
          tourType: matchedTour.value,
        }));
      }
    }

    if (shipParam) {
      const matched = ALASKA_CRUISE_FLEET.find(
        (s) => s.shipName.toLowerCase() === shipParam.toLowerCase()
      );
      if (matched) {
        setSelectedShipData(matched);
        setFormData((prev) => ({
          ...prev,
          shipName: matched.shipName,
          cruiseLine: matched.cruiseLine,
        }));
      } else {
        setFormData((prev) => ({ ...prev, shipName: "Other", customShip: shipParam }));
      }
    }

    if (dateParam) {
      setFormData((prev) => ({ ...prev, portDate: dateParam }));
    }

    if (modeParam === "concierge" || modeParam === "concierge_dispatch") {
      setFormData((prev) => ({ ...prev, bookingMode: "concierge_dispatch" }));
    }
  }, []);

  const handleShipSelect = (shipName: string) => {
    if (shipName === "Other") {
      setSelectedShipData(null);
      setFormData((prev) => ({ ...prev, shipName: "Other" }));
      return;
    }

    const matched = ALASKA_CRUISE_FLEET.find((s) => s.shipName === shipName);
    if (matched) {
      setSelectedShipData(matched);
      setFormData((prev) => ({
        ...prev,
        shipName: matched.shipName,
        cruiseLine: matched.cruiseLine,
        notes: prev.notes || `Scheduled at ${matched.typicalScheduledBerth} (${matched.dockHours})`,
      }));
    } else {
      setSelectedShipData(null);
      setFormData((prev) => ({ ...prev, shipName }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.portDate) {
      setErrorMessage("Please fill out your name, email, and cruise port date.");
      setStatus("error");
      return;
    }

    if (formData.portCity === "either" && !formData.skagwayDate) {
      setErrorMessage(
        "Please enter your separate Skagway port date from your cruise itinerary to scan both ports."
      );
      setStatus("error");
      return;
    }

    if (formData.bookingMode === "concierge_dispatch" && (!formData.phone || formData.phone.trim().length < 7)) {
      setErrorMessage("Please provide a valid phone number so our dispatch team can contact you when seats open.");
      setStatus("error");
      return;
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    if (formData.portDate < todayStr) {
      setErrorMessage("Port date cannot be in the past.");
      setStatus("error");
      return;
    }

    if (formData.portCity === "either" && formData.skagwayDate < todayStr) {
      setErrorMessage("Skagway port date cannot be in the past.");
      setStatus("error");
      return;
    }

    setStatus("submitting");
    setErrorMessage("");

    const finalShipName =
      formData.shipName === "Other" && formData.customShip
        ? formData.customShip
        : formData.shipName || "Unspecified Ship";

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          shipName: finalShipName,
          juneauDate: formData.portCity !== "skagway" ? formData.portDate : undefined,
          skagwayDate: formData.portCity !== "juneau" ? formData.skagwayDate : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Unable to join waitlist. Please check inputs and try again.");
      }

      setSubmissionId(data.submissionId);
      setStatus("success");

      // Dispatch telemetry event for waitlist conversion
      const perSeat =
        formData.tourType === "dog_sledding" ? 649 : formData.tourType === "ice_trek" ? 599 : 449;
      const parsedParty = parseInt(String(formData.partySize), 10) || 2;
      sendJfdTelemetry("waitlist_submitted", {
        submissionId: data.submissionId,
        tourType: formData.tourType,
        partySize: parsedParty,
        portDate: formData.portDate,
        bookingMode: formData.bookingMode,
        shipName: finalShipName,
        cruiseLine: formData.cruiseLine,
        portCity: formData.portCity,
        estimatedValue: parsedParty * perSeat,
        sourcePage: window.location.pathname,
      });
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to submit request.");
      setStatus("error");
    }
  };

  const resolvedShipName =
    formData.shipName === "Other"
      ? formData.customShip || "Our Cruise Ship"
      : formData.shipName || "Our Cruise Ship";

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/helicopter-waitlist?ship=${encodeURIComponent(resolvedShipName)}&date=${encodeURIComponent(formData.portDate)}`
      : `https://juneauflightdeck.com/helicopter-waitlist?ship=${encodeURIComponent(resolvedShipName)}&date=${encodeURIComponent(formData.portDate)}`;

  const rollCallPostText = `Hey everyone on ${resolvedShipName} for our ${formData.portDate || "upcoming"} port call in Juneau! 

If you were looking for glacier helicopter landings or dog sledding and found them sold out through the ship's excursion desk, check out Juneau Flight Deck's daily availability check. 

They provide operator comparisons, ship port timing guidance, and a daily availability check across local helicopter operators (TEMSCO, Coastal, NorthStar) with direct booking links:
${shareUrl}`;

  const copyToClipboard = async (text: string, type: "rollcall" | "link") => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === "rollcall") {
        setCopiedRollCall(true);
        setTimeout(() => setCopiedRollCall(false), 3000);
      } else {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 3000);
      }
    } catch {
      // Fallback
    }
  };

  return (
    <div className={`waitlist-card-wrapper ${compact ? "waitlist-card-compact" : ""}`}>
      <div className="waitlist-card-header">
        <div className="waitlist-pill">
          <span className="waitlist-pill-dot" />
          <span>Daily Availability Check • Direct Operator Booking</span>
        </div>
        <h3>Sold Out on Your Ship? Request a Daily Availability Check.</h3>
        <p className="waitlist-explainer">
          Helicopter companies experience frequent cancellations and group releases. 
          We perform a daily availability check across local operators (TEMSCO, Coastal, NorthStar). 
          When an open space appears on your ship&apos;s date, <strong>we alert you with direct booking links to secure open seats directly with the operator</strong>.
        </p>
      </div>

      {preselectedTour && (
        <div className="waitlist-preselected-banner">
          <div className="waitlist-preselected-banner-inner">
            <span className="waitlist-preselected-icon">🎯</span>
            <div>
              <div className="waitlist-preselected-eyebrow">
                Selected Tour Experience
              </div>
              <h4 className="waitlist-preselected-title">
                {preselectedTour.label}
              </h4>
              {preselectedTour.highlight && (
                <p className="waitlist-preselected-highlight">
                  {preselectedTour.highlight}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="waitlist-how-it-works-grid">
        <div className="how-step">
          <span className="step-num">01</span>
          <h4>Daily Availability Check</h4>
          <p>We check local operator schedules each day for released seats and cancellation openings.</p>
        </div>
        <div className="how-step">
          <span className="step-num">02</span>
          <h4>Targeted Date &amp; Port Scan</h4>
          <p>We check the exact passenger-supplied cruise dates for Juneau and Skagway.</p>
        </div>
        <div className="how-step">
          <span className="step-num">03</span>
          <h4>Operator-Specific Policies</h4>
          <p>Published terms apply (TEMSCO: 48h full refund; Coastal: 7+ days full refund, 4–6 days 50%). 100% weather refund.</p>
        </div>
        <div className="how-step">
          <span className="step-num">04</span>
          <h4>Direct Operator Booking</h4>
          <p>You receive an alert with a direct link to lock in open seats directly with the flight operator.</p>
        </div>
      </div>

      {status === "success" ? (
        <div className="waitlist-success-banner space-y-6">
          <div className="text-center">
            <div className="success-icon inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 text-2xl mb-3">✓</div>
            <h4 className="text-xl font-bold text-white">
              {formData.bookingMode === "concierge_dispatch"
                ? "Concierge Dispatch Request Received"
                : "Daily Availability Check Request Received"}
            </h4>
            <p className="text-slate-300 mt-1">
              Confirmation Code: <strong className="text-amber-400 font-mono">{submissionId}</strong>
            </p>
            <p className="text-sm text-slate-300 mt-2">
              Your request is saved. We check Southeast Alaska fleet availability for your date (<strong>{formData.portDate}</strong>
              {formData.portCity === "either" && formData.skagwayDate ? ` and Skagway: ${formData.skagwayDate}` : ""}) 
              for <strong>{formData.partySize} guest(s)</strong> on <strong>{resolvedShipName}</strong> ({formData.cruiseLine}).
            </p>
          </div>

          <div className="success-reassurance bg-slate-900/80 border border-slate-700/60 rounded-xl p-4 text-xs text-slate-300 leading-relaxed">
            {formData.bookingMode === "concierge_dispatch"
              ? "🛎️ Request Logged: When an opening is detected during our daily availability check, our local dispatch team contacts you with direct flight checkout details."
              : "📱 Request Logged: When an opening is detected during our daily availability check, a direct booking link is generated so you can complete checkout directly with the operator."}
          </div>

          {/* Group Roll Call Share Box (Where Group Rules Allow) */}
          <div className="bg-sky-950/40 border border-sky-500/30 rounded-2xl p-5 text-left">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🛳️</span>
              <h5 className="text-sm font-bold text-white uppercase tracking-wider">
                Share With Your Ship&apos;s Cruise Critic &amp; Facebook Roll Call (Where Group Rules Allow)
              </h5>
            </div>
            <p className="text-xs text-sky-200/90 leading-relaxed mb-4">
              Glacier helicopter flights sell out 3–6 months early. Most guests on <strong>{resolvedShipName}</strong> do not 
              know daily cancellations open up seats. Where group rules allow, share this daily availability check with your shipmates so your sailing group can get booked:
            </p>

            <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800 text-xs font-mono text-slate-300 leading-relaxed whitespace-pre-wrap select-all mb-3 max-h-36 overflow-y-auto">
              {rollCallPostText}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => copyToClipboard(rollCallPostText, "rollcall")}
                className="button button-primary text-xs py-2 px-4 flex items-center gap-1.5"
              >
                <span>{copiedRollCall ? "✓" : "📋"}</span>
                <span>{copiedRollCall ? "Copied Roll Call Post!" : "Copy Cruise Critic Post (1-Click)"}</span>
              </button>
              <button
                type="button"
                onClick={() => copyToClipboard(shareUrl, "link")}
                className="button button-secondary text-xs py-2 px-4 flex items-center gap-1.5"
              >
                <span>{copiedLink ? "✓" : "🔗"}</span>
                <span>{copiedLink ? "Link Copied!" : "Copy Share Link"}</span>
              </button>
            </div>
          </div>

          <div className="text-center pt-2">
            <button
              type="button"
              className="text-xs text-slate-400 hover:text-white underline transition"
              onClick={() => {
                setStatus("idle");
                setFormData((prev) => ({ ...prev, name: "", email: "", phone: "", notes: "" }));
              }}
            >
              + Add Another Cruise Date or Ship
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="waitlist-form">
          {status === "error" && (
            <div className="form-error-alert" role="alert">
              {errorMessage}
            </div>
          )}

          {/* Mode Selector */}
          <div className="mb-6">
            <span className="text-xs font-bold text-sky-300 uppercase tracking-widest block mb-2">
              Choose Your Notification Alert Preference:
            </span>
            <div className="grid md:grid-cols-2 gap-3">
              <label
                className={`booking-mode-card ${
                  formData.bookingMode === "instant_alert" ? "booking-mode-selected" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="bookingMode"
                    value="instant_alert"
                    checked={formData.bookingMode === "instant_alert"}
                    onChange={() => setFormData({ ...formData, bookingMode: "instant_alert" })}
                    className="mt-1"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="text-white text-sm">📧 Daily Availability Alert</strong>
                      <span className="mode-badge-recommended">Direct Link</span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      <strong>Free Email Alert.</strong> When seats open during our daily check, we send you a direct booking link to complete checkout with the flight operator.
                    </p>
                  </div>
                </div>
              </label>

              <label
                className={`booking-mode-card ${
                  formData.bookingMode === "concierge_dispatch" ? "booking-mode-selected" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="bookingMode"
                    value="concierge_dispatch"
                    checked={formData.bookingMode === "concierge_dispatch"}
                    onChange={() => setFormData({ ...formData, bookingMode: "concierge_dispatch" })}
                    className="mt-1"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="text-white text-sm">🛎️ Concierge Dispatch Alert</strong>
                      <span className="mode-badge-free">Personal Follow-Up</span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      <strong>Dedicated local assistance.</strong> Our Juneau dispatch team notifies you via email and coordinates directly when openings are detected to help secure your booking.
                    </p>
                  </div>
                </div>
              </label>
            </div>
          </div>

          <div className="form-grid">
            {/* Ship Selection with Auto-Match */}
            <div className="form-field">
              <label htmlFor="shipName">Your Cruise Ship</label>
              <select
                id="shipName"
                value={formData.shipName}
                onChange={(e) => handleShipSelect(e.target.value)}
              >
                <option value="">-- Select Your Alaska Cruise Ship --</option>
                <optgroup label="Princess Cruises">
                  {ALASKA_CRUISE_FLEET.filter((s) => s.cruiseLine === "Princess Cruises").map((s) => (
                    <option key={s.shipName} value={s.shipName}>
                      {s.shipName}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Holland America Line">
                  {ALASKA_CRUISE_FLEET.filter((s) => s.cruiseLine === "Holland America Line").map((s) => (
                    <option key={s.shipName} value={s.shipName}>
                      {s.shipName}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Norwegian Cruise Line (NCL)">
                  {ALASKA_CRUISE_FLEET.filter((s) => s.cruiseLine.includes("Norwegian")).map((s) => (
                    <option key={s.shipName} value={s.shipName}>
                      {s.shipName}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Royal Caribbean &amp; Celebrity">
                  {ALASKA_CRUISE_FLEET.filter(
                    (s) => s.cruiseLine === "Royal Caribbean" || s.cruiseLine === "Celebrity Cruises"
                  ).map((s) => (
                    <option key={s.shipName} value={s.shipName}>
                      {s.shipName} ({s.cruiseLine})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Disney &amp; Carnival">
                  {ALASKA_CRUISE_FLEET.filter(
                    (s) => s.cruiseLine === "Disney Cruise Line" || s.cruiseLine === "Carnival Cruise Line"
                  ).map((s) => (
                    <option key={s.shipName} value={s.shipName}>
                      {s.shipName} ({s.cruiseLine})
                    </option>
                  ))}
                </optgroup>
                <option value="Other">Other Ship / Not Listed Above</option>
              </select>
            </div>

            {formData.shipName === "Other" && (
              <div className="form-field">
                <label htmlFor="customShip">Enter Ship Name</label>
                <input
                  id="customShip"
                  type="text"
                  placeholder="e.g. Viking Orion, Silver Muse"
                  value={formData.customShip}
                  onChange={(e) => setFormData({ ...formData, customShip: e.target.value })}
                  required
                />
              </div>
            )}

            <div className="form-field">
              <label htmlFor="cruiseLine">Cruise Line</label>
              <select
                id="cruiseLine"
                value={formData.cruiseLine}
                onChange={(e) => setFormData({ ...formData, cruiseLine: e.target.value })}
                required
              >
                {CRUISE_LINES.map((line) => (
                  <option key={line} value={line}>
                    {line}
                  </option>
                ))}
              </select>
            </div>

            {/* Pier & Port Timing Badge + Skagway Cross-Port Info */}
            {selectedShipData && (
              <div className="form-field full-width bg-sky-950/40 border border-sky-500/30 rounded-xl p-3.5 text-xs space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sky-800/40 pb-2">
                  <span className="font-bold text-sky-300 flex items-center gap-1.5">
                    <span>⚓</span> Typical Berth: {selectedShipData.typicalScheduledBerth}
                  </span>
                  <span className="text-slate-300 font-mono">
                    Port Window: {selectedShipData.dockHours}
                  </span>
                </div>
                <p className="text-slate-300 m-0">
                  <span className="text-emerald-400 font-semibold">Berth Logistics:</span> {selectedShipData.notes}
                  <span className="text-slate-400 ml-1">(Passenger-supplied dates — check cruise line app to verify arrival/departure times.)</span>
                </p>

                {/* Cross-Port Skagway Connection */}
                {selectedShipData.callsAtSkagway && (
                  <div className="bg-amber-950/50 border border-amber-500/40 rounded-lg p-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mt-2">
                    <div>
                      <strong className="text-amber-400 font-bold flex items-center gap-1">
                        <span>💡</span> Skagway Glacier Alternative Available:
                      </strong>
                      <p className="text-slate-300 text-[11px] m-0">
                        {selectedShipData.shipName} also typically calls at Skagway on Inside Passage routes ({selectedShipData.skagwayHours} at {selectedShipData.skagwayBerth}). If Juneau is full, TEMSCO Skagway operates Denver Glacier Dog Sledding &amp; Meade Ice Landings.
                      </p>
                    </div>
                    {formData.portCity !== "either" && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, portCity: "either" })}
                        className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] py-1 px-2.5 rounded transition flex-shrink-0"
                      >
                        Scan Both Ports
                      </button>
                    )}
                  </div>
                )}

                {/* Backup Option Badge */}
                <div className="text-[11px] text-slate-300 flex items-center gap-1.5 pt-1 border-t border-sky-900/50">
                  <span>🛡️</span>
                  <span>
                    <strong>Port Day Backup Option:</strong> If helicopter seats remain full on your date, our dispatch team checks verified live availability for Juneau&apos;s top-rated Auke Bay Whale Watching.
                  </span>
                </div>
              </div>
            )}

            <div className="form-field">
              <label htmlFor="portCity">Port Location to Scan</label>
              <select
                id="portCity"
                value={formData.portCity}
                onChange={(e) => setFormData({ ...formData, portCity: e.target.value as any })}
              >
                <option value="juneau">Juneau Only (Mendenhall / Herbert Glaciers)</option>
                <option value="skagway">Skagway Only (Denver / Meade Glaciers)</option>
                <option value="either">Both Juneau &amp; Skagway (Enter Dates for Each)</option>
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="portDate">
                {formData.portCity === "skagway" ? "Skagway Port Date *" : "Juneau Port Date *"}
              </label>
              <input
                id="portDate"
                type="date"
                required
                value={formData.portDate}
                onChange={(e) => setFormData({ ...formData, portDate: e.target.value })}
              />
              <span className="text-[11px] text-slate-400">Passenger-supplied date from cruise itinerary</span>
            </div>

            {formData.portCity === "either" && (
              <div className="form-field">
                <label htmlFor="skagwayDate">Skagway Port Date *</label>
                <input
                  id="skagwayDate"
                  type="date"
                  required
                  value={formData.skagwayDate}
                  onChange={(e) => setFormData({ ...formData, skagwayDate: e.target.value })}
                />
                <span className="text-[11px] text-slate-400">From cruise itinerary (distinct Skagway port call)</span>
              </div>
            )}

            <div className="form-field full-width">
              <label htmlFor="tourType">Tour Experience Preference</label>
              <select
                id="tourType"
                value={formData.tourType}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData({ ...formData, tourType: val });
                  const found = TOUR_OPTIONS.find((t) => t.value === val);
                  setPreselectedTour(found || null);
                }}
              >
                <optgroup label="Operator-Specific Flight Profiles">
                  {TOUR_OPTIONS.filter((opt) => opt.operator).map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Broad Helicopter Categories">
                  {TOUR_OPTIONS.filter((opt) => !opt.operator).map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="partySize">Number of Seats / Party Size</label>
              <select
                id="partySize"
                value={formData.partySize}
                onChange={(e) => setFormData({ ...formData, partySize: e.target.value })}
              >
                {[1, 2, 3, 4, 5, 6, "7+"].map((num) => (
                  <option key={num} value={num}>
                    {num} {typeof num === "number" && num === 1 ? "Passenger" : "Passengers"}
                  </option>
                ))}
              </select>
            </div>

            {/* Split Party Optimization Option */}
            {parseInt(String(formData.partySize), 10) >= 2 && (
              <div className="form-field full-width bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-3 text-xs" style={{ background: "rgba(6, 78, 59, 0.25)", border: "1px solid rgba(16, 185, 129, 0.4)", borderRadius: 10, padding: 12 }}>
                <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", color: "#e2e8f0" }}>
                  <input
                    type="checkbox"
                    checked={formData.allowSplitParty}
                    onChange={(e) => setFormData({ ...formData, allowSplitParty: e.target.checked })}
                    style={{ marginTop: 2, accentColor: "#10b981", width: 16, height: 16 }}
                  />
                  <div>
                    <strong style={{ color: "#6ee7b7", display: "block", fontSize: "0.82rem" }}>
                      Allow separate departures for our group
                    </strong>
                    <span style={{ color: "var(--muted)", fontSize: "0.76rem", lineHeight: 1.5, display: "block", marginTop: 2 }}>
                      We are willing to consider partial openings or separate departure times across our party if seats appear on our port date.
                    </span>
                  </div>
                </label>
              </div>
            )}

            <div className="form-field">
              <label htmlFor="name">Full Name *</label>
              <input
                id="name"
                type="text"
                required
                placeholder="Your full name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="form-field">
              <label htmlFor="email">Email Address (For Seat Alerts) *</label>
              <input
                id="email"
                type="email"
                required
                placeholder="name@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="form-field">
              <label htmlFor="phone">
                Mobile Phone {formData.bookingMode === "concierge_dispatch" ? "*" : "(Optional)"}
              </label>
              <input
                id="phone"
                type="tel"
                required={formData.bookingMode === "concierge_dispatch"}
                placeholder="(555) 123-4567"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
              <span className="text-[11px] text-slate-400">
                {formData.bookingMode === "concierge_dispatch"
                  ? "Used by Juneau dispatch team for direct flight coordination"
                  : "Optional direct contact for tour operator coordination"}
              </span>
            </div>

            <div className="form-field full-width">
              <label htmlFor="notes">Port Schedule / Docking Notes (Optional)</label>
              <input
                id="notes"
                type="text"
                placeholder="e.g. In port 1:00 PM to 9:00 PM, AJ Dock"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>

          <div className="waitlist-submit-row">
            <button
              type="submit"
              disabled={status === "submitting"}
              className="button button-primary waitlist-submit-btn"
            >
              {status === "submitting"
                ? "Submitting Request..."
                : formData.bookingMode === "concierge_dispatch"
                ? "Activate Concierge Dispatch Alert (Free) →"
                : "Request Daily Availability Check (Free) →"}
            </button>
            <p className="waitlist-legal-footnote">
              🔒 100% Free Service. We perform daily availability checks across local operator schedules. Cancellation terms are operator-specific (TEMSCO: 48h full refund; Coastal: 7+ days full refund, 50% 4–6 days, non-refundable &lt;3 days). All operators provide 100% full refund for weather cancellations.
            </p>
          </div>
        </form>
      )}
    </div>
  );
}
