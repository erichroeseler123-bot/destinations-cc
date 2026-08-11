"use client";

import { useMemo, useState } from "react";
import { trackAirport420Event } from "@/lib/telemetry";
import type { HandoffContext, InitialUiState } from "@/lib/handoff/types";

type ResolutionDebug = {
  downgraded: boolean;
  winners: Array<{ field: string; confidence: number; ruleId: string; reason: string }>;
};

const CHECKOUT_URL = "https://www.destinationcommandcenter.com/checkout";

function buildCheckoutHref(handoff: HandoffContext, productSlug: string, date: string, dropoff: string) {
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
    initialHandoffContext.decisionProduct || initialHandoffContext.productSlug || initialUiState.defaultCardSlug || "airport-pickup";

  const checkoutHref = useMemo(
    () => buildCheckoutHref(initialHandoffContext, checkoutProductSlug, date, dropoff),
    [checkoutProductSlug, date, dropoff, initialHandoffContext],
  );

  function trackCheckout(stage: string) {
    trackAirport420Event("checkout_started", {
      corridor: "airport-420-pickup",
      page_type: "airport-home",
      source_page: initialHandoffContext.sourcePage || "/",
      handoff_id: initialHandoffContext.handoffId,
      date,
      product_slug: checkoutProductSlug,
      confidence_downgraded: initialResolutionDebug.downgraded,
      winning_rule_ids: initialResolutionDebug.winners.map((winner) => winner.ruleId),
      stage,
      target_path: checkoutHref,
    });
  }

  return (
    <main className="stack">
      <section className="hero">
        <div>
          <p className="eyebrow">Private DEN arrival service · 21+</p>
          <h1>Land in Denver. Start Colorado privately.</h1>
          <p className="arrival-line">A discreet private airport pickup for adults who want the arrival handled before they land.</p>
          <p className="hero-copy">
            Go straight to your hotel or build an optional dispensary stop into the ride. No shared shuttle, no random rideshare match, and no need to explain the trip to a stranger.
          </p>
          <div className="cta-row">
            <a className="button" href={checkoutHref} onClick={() => trackCheckout("primary_booking_cta")}>Book private DEN pickup</a>
            <a className="button-secondary" href="#options">See arrival options</a>
          </div>
        </div>
      </section>

      <section id="options" className="panel">
        <p className="eyebrow">Choose your arrival</p>
        <h2>One private ride. Two ways to start.</h2>
        <div className="trust-grid">
          <div className="trust-item">
            <strong>Direct private pickup</strong>
            <p className="muted">DEN to your Denver hotel, home base, or agreed destination.</p>
          </div>
          <div className="trust-item">
            <strong>Optional dispensary stop</strong>
            <p className="muted">For adults 21+, a retail stop can be planned into the route where lawful and practical.</p>
          </div>
          <div className="trust-item">
            <strong>Onward Colorado</strong>
            <p className="muted">Heading farther? Continue into dedicated Red Rocks or mountain transportation instead of forcing one ride to do everything.</p>
          </div>
        </div>
      </section>

      <section className="panel">
        <p className="eyebrow">Why this works</p>
        <h2>Private, discreet, and built around arrival day.</h2>
        <ul>
          <li>Private vehicle only.</li>
          <li>Arrival-focused pickup from Denver International Airport.</li>
          <li>Optional 21+ stop planning without making cannabis use part of the ride itself.</li>
          <li>Clear destination and pricing before payment.</li>
        </ul>
      </section>

      <section id="pricing" className="panel">
        <p className="eyebrow">Book your arrival</p>
        <h2>See the live price before you pay.</h2>
        <p className="muted">Final price depends on destination, timing, and trip details.</p>
        <div className="form-grid" style={{ marginTop: 24 }}>
          <div className="field">
            <label htmlFor="arrival-date">Arrival date</label>
            <input id="arrival-date" className="date-input" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="dropoff-location">Destination / drop-off</label>
            <input id="dropoff-location" value={dropoff} onChange={(event) => setDropoff(event.target.value)} />
          </div>
        </div>
        <div className="cta-row">
          <a className="button" href={checkoutHref} onClick={() => trackCheckout("pricing_section_booking_cta")}>See price & book</a>
        </div>
      </section>

      <section className="panel">
        <p className="eyebrow">Keep the rest of the trip clean</p>
        <h2>Use the right transportation for the next leg.</h2>
        <div className="trust-grid">
          <div className="trust-item">
            <strong>Denver arrival</strong>
            <p className="muted">Use this site for the private airport arrival itself.</p>
          </div>
          <div className="trust-item">
            <strong>Red Rocks</strong>
            <p className="muted"><a href="https://partyatredrocks.com/">Private Red Rocks transportation</a> is the better fit for a concert day.</p>
          </div>
          <div className="trust-item">
            <strong>Mountain resorts</strong>
            <p className="muted"><a href="https://gosno.co/">GoSno</a> handles private airport-to-resort transportation for Colorado ski destinations.</p>
          </div>
        </div>
      </section>

      <section className="panel">
        <p className="eyebrow">Important</p>
        <h2>21+ means 21+. Transportation stays transportation.</h2>
        <ul>
          <li>Retail cannabis is for adults age 21 and older in Colorado.</li>
          <li>Passengers are responsible for following all applicable state, local, property, and federal rules.</li>
          <li>No public-use promise is made, and the vehicle is not presented as a consumption space.</li>
          <li>This is private transportation, not a cannabis retailer or consumption venue.</li>
        </ul>
      </section>

      <section className="panel">
        <p className="eyebrow">Book now</p>
        <h2>Handle the arrival before you land.</h2>
        <div className="cta-row">
          <a className="button" href={checkoutHref} onClick={() => trackCheckout("final_booking_cta")}>Book private DEN pickup</a>
        </div>
      </section>
    </main>
  );
}
