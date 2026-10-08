"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { trackAirport420Event } from "@/lib/telemetry";
import type { HandoffContext, InitialUiState } from "@/lib/handoff/types";
import { COLORADO_TRANSFERS } from "@/lib/coloradoTransfers";

type ResolutionDebug = {
  downgraded: boolean;
  winners: Array<{ field: string; confidence: number; ruleId: string; reason: string }>;
};

const GOSNO_URL = "https://gosno.co/";

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
  return `${GOSNO_URL}?${params.toString()}`;
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
          <p className="eyebrow">Denver International Airport (DEN) · Private 420 Transportation · Adults 21+</p>
          <h1>420 Airport Pickup Denver: Private DEN Transportation</h1>
          <p className="arrival-line">
            Pre-arranged private airport pickup from Denver International Airport (DEN) with optional lawful dispensary-stop planning for adults 21+, direct to Denver metro hotels or Colorado mountain resorts.
          </p>
          <p className="hero-copy">
            Touch down at DEN, collect your bags at Level 5 baggage claim, and meet your dedicated driver curbside at Terminal Level 5 Island 2. Travel comfortably in a private all-wheel-drive SUV with room for your group and luggage, plus an optional licensed retail dispensary stop along your route before final drop-off. No shared shuttles, no surge pricing, and no consumption in the vehicle.
          </p>
          <div className="cta-row">
            <a className="button" href={checkoutHref} onClick={() => trackCheckout("primary_booking_cta")}>Book Denver Airport Pickup</a>
            <Link className="button-secondary" href="/denver-airport-420-friendly-pickup">View 420 Route Guide</Link>
            <Link className="button-secondary" href="/colorado">See All DEN Transfers</Link>
          </div>
        </div>
      </section>

      <section className="panel" aria-labelledby="booking-steps-title">
        <p className="eyebrow">How DEN Pickup &amp; Booking Works</p>
        <h2 id="booking-steps-title">Clear 3-Step Service &amp; Booking Process</h2>
        <div className="trust-grid" style={{ marginTop: 16 }}>
          <div className="trust-item">
            <strong>1. Book Online or Request Dispatch</strong>
            <p className="muted">Reserve your private transfer in advance with your arrival date, flight number, and drop-off destination. Choose direct transfer or the optional 21+ retail stop.</p>
          </div>
          <div className="trust-item">
            <strong>2. Seamless DEN Airport Meetup</strong>
            <p className="muted">Provide your flight number when reserving so your driver can monitor your flight arrival time. Grab luggage on Level 5 and step out to Island 2 (Commercial Livery / Limousine) where your private AWD SUV meets you curbside.</p>
          </div>
          <div className="trust-item">
            <strong>3. En Route Stop &amp; Direct Drop-Off</strong>
            <p className="muted">Enjoy smooth 420 transportation to a licensed Denver dispensary for independent retail shopping, then continue straight to your lodging, residence, or ski condo.</p>
          </div>
        </div>
      </section>

      <section className="panel">
        <p className="eyebrow">Two Colorado airports</p>
        <h2>Start from DEN or Colorado Springs Airport.</h2>
        <div className="trust-grid">
          <div className="trust-item">
            <strong>Denver International Airport (DEN)</strong>
            <p className="muted">Denver airport arrivals with private transfers to Denver, Colorado Springs, and major mountain destinations.</p>
            <p><Link href="/colorado">Browse DEN routes</Link></p>
          </div>
          <div className="trust-item">
            <strong>Colorado Springs Airport (COS)</strong>
            <p className="muted">Colorado Springs-area pickup plus configured GoSno routes to major Colorado mountain destinations.</p>
            <p><Link href="/colorado-springs-airport">Browse COS routes</Link></p>
          </div>
        </div>
      </section>

      <section className="panel">
        <p className="eyebrow">Where are you headed from DEN?</p>
        <h2>The 420-friendly option goes beyond Denver.</h2>
        <p className="muted">
          These private airport-to-destination trips are fulfilled through GoSno. Choose a destination here and continue to the corresponding GoSno route or quote flow for current availability, vehicle options, and final pricing.
        </p>
        <div className="trust-grid" style={{ marginTop: 24 }}>
          {COLORADO_TRANSFERS.map((transfer) => (
            <div className="trust-item" key={transfer.slug}>
              <strong>DEN → {transfer.destination}</strong>
              <p className="muted">Optional lawful dispensary stop when practical for the confirmed route and timing.</p>
              <p><Link href={`/colorado/${transfer.slug}`}>View {transfer.destination} transfer</Link></p>
            </div>
          ))}
        </div>
      </section>

      <section id="options" className="panel">
        <p className="eyebrow">Operated by GoSno</p>
        <h2>One private ride. Your destination. Optional 21+ stop.</h2>
        <div className="trust-grid">
          <div className="trust-item">
            <strong>Denver private pickup</strong>
            <p className="muted">DEN to your Denver hotel, home base, or agreed destination.</p>
          </div>
          <div className="trust-item">
            <strong>Colorado Springs pickup</strong>
            <p className="muted">Use the COS route hub for Colorado Springs Airport arrivals and mountain transfers.</p>
          </div>
          <div className="trust-item">
            <strong>Optional dispensary stop</strong>
            <p className="muted">For adults 21+, a lawful retail stop can be included when practical for the route and timing.</p>
          </div>
        </div>
      </section>

      <section className="panel">
        <p className="eyebrow">Why this works</p>
        <h2>Private transportation first. The 420-friendly stop is an amenity.</h2>
        <ul>
          <li>Private vehicle only.</li>
          <li>Airport pickup begins at DEN or COS depending on the selected route.</li>
          <li>Optional dispensary stop when lawful and practical for the confirmed trip.</li>
          <li>Passengers make any retail purchase independently from the retailer.</li>
          <li>No cannabis consumption is permitted in the vehicle.</li>
        </ul>
      </section>

      <section id="pricing" className="panel">
        <p className="eyebrow">Staying in Denver?</p>
        <h2>See the live Denver-arrival price before you pay.</h2>
        <p className="muted">For Colorado Springs Airport or mountain routes, use the airport and destination pages above to continue into the matching GoSno route or quote flow.</p>
        <div className="form-grid" style={{ marginTop: 24 }}>
          <div className="field">
            <label htmlFor="arrival-date">Arrival date</label>
            <input id="arrival-date" className="date-input" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="dropoff-location">Denver destination / drop-off</label>
            <input id="dropoff-location" value={dropoff} onChange={(event) => setDropoff(event.target.value)} />
          </div>
        </div>
        <div className="cta-row">
          <a className="button" href={checkoutHref} onClick={() => trackCheckout("pricing_section_booking_cta")}>Check GoSno price & availability</a>
        </div>
      </section>

      <section className="panel">
        <p className="eyebrow">Another Colorado day?</p>
        <h2>Use the right private transportation for the trip.</h2>
        <div className="trust-grid">
          <div className="trust-item">
            <strong>Mountain resorts</strong>
            <p className="muted"><Link href="/colorado">Browse private DEN mountain transfers</Link> fulfilled through GoSno.</p>
          </div>
          <div className="trust-item">
            <strong>Colorado Springs Airport</strong>
            <p className="muted"><Link href="/colorado-springs-airport">Browse COS private transportation</Link> to Colorado Springs and mountain destinations.</p>
          </div>
          <div className="trust-item">
            <strong>Red Rocks</strong>
            <p className="muted"><a href="https://partyatredrocks.com/">Party at Red Rocks</a> handles private concert transportation.</p>
          </div>
        </div>
      </section>

      <section className="panel">
        <p className="eyebrow">Important</p>
        <h2>21+ means 21+. Transportation stays transportation.</h2>
        <ul>
          <li>Retail cannabis purchases are for adults age 21 and older in Colorado.</li>
          <li>Passengers are responsible for following all applicable state, local, property, and federal rules.</li>
          <li>The transportation provider does not sell cannabis.</li>
          <li>No public-use promise is made, and the vehicle is not a consumption space.</li>
          <li>Road, weather, timing, retailer availability, and applicable law can affect whether a stop is practical.</li>
        </ul>
      </section>
    </main>
  );
}
