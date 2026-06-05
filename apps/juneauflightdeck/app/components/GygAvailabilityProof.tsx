"use client";

import Script from "next/script";

const PARTNER_ID = process.env.NEXT_PUBLIC_GETYOURGUIDE_PARTNER_ID || "F2MMUUH";

export default function GygAvailabilityProof({ selectedDate }: { selectedDate: string }) {
  return (
    <section className="panel gyg-proof" aria-labelledby="gyg-proof-title">
      <div className="gyg-proof__header">
        <p className="eyebrow">Live availability proof</p>
        <h2 id="gyg-proof-title">For most cruise days, start with one reliable helicopter choice.</h2>
        <p className="muted">
          The page still decides first. This GetYourGuide feed proves that Juneau helicopter inventory is bookable, then
          moves you into live checkout for {selectedDate || "your cruise day"}.
        </p>
      </div>

      <div
        className="gyg-proof__widget"
        data-gyg-href="https://widget.getyourguide.com/default/activities.frame"
        data-gyg-locale-code="en-US"
        data-gyg-widget="activities"
        data-gyg-number-of-items="3"
        data-gyg-cmp="jfd_availability_proof"
        data-gyg-partner-id={PARTNER_ID}
        data-gyg-q="Juneau helicopter tour"
      >
        <span>
          Powered by{" "}
          <a target="_blank" rel="sponsored noreferrer" href="https://www.getyourguide.com/juneau-l32584/">
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
