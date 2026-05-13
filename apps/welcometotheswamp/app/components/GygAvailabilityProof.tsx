"use client";

const PARTNER_ID = process.env.NEXT_PUBLIC_GETYOURGUIDE_PARTNER_ID || "F2MMUUH";
const TOUR_ID = process.env.NEXT_PUBLIC_WTS_GYG_TOUR_ID || "280242";
const CURRENCY = process.env.NEXT_PUBLIC_GETYOURGUIDE_CURRENCY || "USD";

export default function GygAvailabilityProof() {
  return (
    <section className="panel gyg-proof" aria-labelledby="gyg-proof-title">
      <div className="gyg-proof__header">
        <p className="eyebrow">Live availability proof</p>
        <h2 id="gyg-proof-title">For most visitors, start with the recommended swamp-tour lane.</h2>
        <p className="muted">
          The recommendation stays first. The live GetYourGuide feed below proves that bookable New Orleans swamp-tour
          departures exist now, then sends you to checkout without another research loop.
        </p>
      </div>

      <div
        className="gyg-proof__widget"
        data-gyg-href="https://widget.getyourguide.com/default/availability.frame"
        data-gyg-tour-id={TOUR_ID}
        data-gyg-locale-code="en-US"
        data-gyg-currency={CURRENCY}
        data-gyg-widget="availability"
        data-gyg-variant="horizontal"
        data-gyg-cmp="wts_availability_proof"
        data-gyg-partner-id={PARTNER_ID}
      >
        <span>
          Powered by{" "}
          <a target="_blank" rel="sponsored noreferrer" href="https://www.getyourguide.com/new-orleans-l370/">
            GetYourGuide
          </a>
        </span>
      </div>

      <p className="gyg-proof__note">
        GetYourGuide handles live availability, supplier terms, payment, confirmation, and cancellation for these
        fallback listings.
      </p>
    </section>
  );
}
