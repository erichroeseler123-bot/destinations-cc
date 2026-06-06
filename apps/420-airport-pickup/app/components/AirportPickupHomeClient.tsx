"use client";

import { useMemo, useState } from "react";
import { trackAirport420Event } from "@/lib/telemetry";
import type { HandoffContext, InitialUiState } from "@/lib/handoff/types";

type ResolutionDebug = {
  downgraded: boolean;
  winners: Array<{
    field: string;
    confidence: number;
    ruleId: string;
    reason: string;
  }>;
};

const CHECKOUT_URL = "https://www.destinationcommandcenter.com/checkout";

function buildCheckoutHref(
  handoff: HandoffContext,
  productSlug: string,
  date: string,
  dropoff: string,
) {
  const params = new URLSearchParams();
  params.set("route", "airport-420-pickup");
  params.set("product", productSlug);
  params.set("qty", "1");
  params.set("partySize", "1");
  params.set("pickup", "DEN Terminal Level 5 - East side");
  params.set("dropoff", dropoff);
  params.set("pickupTime", "Arrival-based");
  params.set("arrival_focus", productSlug);

  if (date) params.set("date", date);
  if (handoff.handoffId) params.set("dcc_handoff_id", handoff.handoffId);
  if (handoff.sourcePage) params.set("source_page", handoff.sourcePage);
  if (handoff.decisionCorridor) params.set("decision_corridor", handoff.decisionCorridor);
  if (handoff.decisionCta) params.set("decision_cta", handoff.decisionCta);
  if (handoff.decisionAction) params.set("decision_action", handoff.decisionAction);
  if (handoff.decisionOption) params.set("decision_option", handoff.decisionOption);
  if (handoff.decisionEntry) params.set("decision_entry", handoff.decisionEntry);
  if (handoff.decisionState) params.set("decision_state", handoff.decisionState);
  if (handoff.requestedLane) params.set("requested_lane", handoff.requestedLane);
  if (handoff.resolvedLane) params.set("resolved_lane", handoff.resolvedLane);
  if (handoff.topic) params.set("topic", handoff.topic);
  if (handoff.subtype) params.set("subtype", handoff.subtype);
  if (handoff.port) params.set("port", handoff.port);
  params.set("decision_product", handoff.decisionProduct || productSlug);
  params.set("product_slug", handoff.decisionProduct || productSlug);

  return `${CHECKOUT_URL}?${params.toString()}`;
}

export default function AirportPickupHomeClient({
  initialUiState,
  initialHandoffContext,
  initialResolutionDebug,
}: {
  initialUiState: InitialUiState;
  initialHandoffContext: HandoffContext;
  initialResolutionDebug: ResolutionDebug;
}) {
  const [date, setDate] = useState(initialUiState.prefilledDate || "");
  const [dropoff, setDropoff] = useState("Denver metro drop-off");
  const checkoutProductSlug =
    initialHandoffContext.decisionProduct ||
    initialHandoffContext.productSlug ||
    initialUiState.defaultCardSlug ||
    "airport-pickup";

  const checkoutHref = useMemo(
    () => buildCheckoutHref(initialHandoffContext, checkoutProductSlug, date, dropoff),
    [checkoutProductSlug, date, dropoff, initialHandoffContext],
  );

  function trackCheckout(stage: string, targetPath: string) {
    trackAirport420Event("checkout_started", {
      corridor: "airport-420-pickup",
      page_type: "airport-home",
      source_page: initialHandoffContext.sourcePage || "/",
      handoff_id: initialHandoffContext.handoffId,
      decision_corridor: initialHandoffContext.decisionCorridor || "airport-420-pickup",
      decision_cta: initialHandoffContext.decisionCta,
      decision_action: initialHandoffContext.decisionAction,
      decision_option: initialHandoffContext.decisionOption,
      decision_product: initialHandoffContext.decisionProduct || checkoutProductSlug,
      decision_entry: initialHandoffContext.decisionEntry,
      decision_state: initialHandoffContext.decisionState,
      requested_lane: initialHandoffContext.requestedLane,
      resolved_lane: initialHandoffContext.resolvedLane,
      topic: initialHandoffContext.topic,
      subtype: initialHandoffContext.subtype,
      date,
      product_slug: initialHandoffContext.decisionProduct || checkoutProductSlug,
      default_card_slug: initialUiState.defaultCardSlug,
      fit_signal: initialUiState.fitSignal,
      urgency: initialUiState.urgency,
      confidence_downgraded: initialResolutionDebug.downgraded,
      winning_rule_ids: initialResolutionDebug.winners.map((winner) => winner.ruleId),
      stage,
      target_path: targetPath,
      clicked_product_slug: initialHandoffContext.decisionProduct || checkoutProductSlug,
    });
  }

  return (
    <main className="stack">
      <section className="hero">
        <div>
          <p className="eyebrow">420-friendly airport pickup</p>
          <h1>420-Friendly Airport Pickup in Denver</h1>
          <p className="arrival-line">
            Private ride from DEN with a driver who understands the experience.
          </p>
          <p className="hero-copy">
            This is a private airport pickup designed for riders who want a 420-friendly
            experience without awkward rideshare situations or extra transport planning.
          </p>
          <div className="cta-row">
            <a
              className="button"
              href={checkoutHref}
              onClick={() => trackCheckout("primary_booking_cta", checkoutHref)}
            >
              Book 420 Pickup
            </a>
            <a className="button-secondary" href="#pricing">
              See Pricing
            </a>
          </div>
        </div>
      </section>

      <section className="panel">
        <p className="eyebrow">What this is</p>
        <h2>Private airport pickup built for the experience.</h2>
        <div className="trust-grid">
          <div className="trust-item">
            <strong>Pickup at DEN</strong>
            <p className="muted">Airport pickup starts at Denver International Airport.</p>
          </div>
          <div className="trust-item">
            <strong>Private vehicle</strong>
            <p className="muted">No shared shuttle, no random rideshare match, no group confusion.</p>
          </div>
          <div className="trust-item">
            <strong>Direct to your destination</strong>
            <p className="muted">Go straight to your hotel, home base, or first stop.</p>
          </div>
        </div>
      </section>

      <section className="panel">
        <p className="eyebrow">Why choose this</p>
        <h2>Keep the arrival private, direct, and aligned.</h2>
        <ul>
          <li>No awkward rideshare situations.</li>
          <li>Driver is aligned with the experience.</li>
          <li>Clean, private, direct ride from the airport.</li>
        </ul>
      </section>

      <section id="pricing" className="panel">
        <p className="eyebrow">Pricing</p>
        <h2>Private airport pickup pricing is shown before payment.</h2>
        <p className="muted">
          Final pricing depends on destination, timing, and trip details. You will see the live
          price in checkout before you pay.
        </p>

        <div className="form-grid" style={{ marginTop: 24 }}>
          <div className="field">
            <label htmlFor="arrival-date">Arrival date</label>
            <input
              id="arrival-date"
              className="date-input"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="dropoff-location">Destination / drop-off</label>
            <input
              id="dropoff-location"
              value={dropoff}
              onChange={(event) => setDropoff(event.target.value)}
            />
          </div>
        </div>

        <div className="cta-row">
          <a
            className="button"
            href={checkoutHref}
            onClick={() => trackCheckout("pricing_section_booking_cta", checkoutHref)}
          >
            Book Your Ride
          </a>
        </div>
      </section>

      <section className="panel">
        <p className="eyebrow">How it works</p>
        <h2>Direct from booking to pickup.</h2>
        <ol>
          <li>Book your pickup.</li>
          <li>Land at DEN.</li>
          <li>Meet your driver.</li>
          <li>Ride directly to your destination.</li>
        </ol>
      </section>

      <section className="panel">
        <p className="eyebrow">Important</p>
        <h2>Know the basics before you ride.</h2>
        <ul>
          <li>Must be 21+.</li>
          <li>Follow local laws.</li>
          <li>This is a private ride, not a shared shuttle.</li>
        </ul>
      </section>

      <section className="panel">
        <p className="eyebrow">Book now</p>
        <h2>Ready to lock in the pickup?</h2>
        <div className="cta-row">
          <a
            className="button"
            href={checkoutHref}
            onClick={() => trackCheckout("final_booking_cta", checkoutHref)}
          >
            Book 420 Airport Pickup
          </a>
        </div>
      </section>
    </main>
  );
}
