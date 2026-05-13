"use client";

import Script from "next/script";

const PARTNER_ID = process.env.NEXT_PUBLIC_GETYOURGUIDE_PARTNER_ID || "F2MMUUH";

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
        data-gyg-href="https://widget.getyourguide.com/default/activities.frame"
        data-gyg-locale-code="en-US"
        data-gyg-widget="activities"
        data-gyg-number-of-items="3"
        data-gyg-cmp="wts_availability_proof"
        data-gyg-partner-id={PARTNER_ID}
        data-gyg-q="New Orleans swamp tour"
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
      <Script async src="https://widget.getyourguide.com/dist/pa.umd.production.min.js" />
    </section>
  );
}
