"use client";

import Script from "next/script";

const PARTNER_ID = process.env.NEXT_PUBLIC_GETYOURGUIDE_PARTNER_ID || "F2MMUUH";

export default function GygAvailabilityProof({ selectedDate }: { selectedDate: string }) {
  return (
    <section className="panel gyg-proof" aria-labelledby="gyg-proof-title">
      <div className="gyg-proof__header">
        <p className="eyebrow">Cruise-day proof</p>
        <h2 id="gyg-proof-title">For most cruise days, this is the move.</h2>
        <p className="muted">
          The page still decides first. These live GetYourGuide departures prove that Juneau helicopter inventory is
          bookable, then move you into checkout for {selectedDate || "your cruise day"} without another comparison loop.
        </p>
        <div className="gyg-proof__signals" aria-label="Juneau availability proof signals">
          <span>Next available departures</span>
          <span>Cruise-day timing check</span>
          <span>Live checkout from the proof layer</span>
        </div>
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
        These are fallback live listings. JFD makes the recommendation; GetYourGuide handles availability, payment,
        confirmation, and cancellation once you choose a departure.
      </p>
      <Script async src="https://widget.getyourguide.com/dist/pa.umd.production.min.js" />
    </section>
  );
}
