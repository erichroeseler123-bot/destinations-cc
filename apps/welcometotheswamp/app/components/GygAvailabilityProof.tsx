"use client";

const PARTNER_ID = process.env.NEXT_PUBLIC_GETYOURGUIDE_PARTNER_ID || "F2MMUUH";
const TOUR_ID = process.env.NEXT_PUBLIC_WTS_GYG_TOUR_ID || "280242";
const CURRENCY = process.env.NEXT_PUBLIC_GETYOURGUIDE_CURRENCY || "USD";

export default function GygAvailabilityProof() {
  return (
    <section className="panel gyg-proof" aria-labelledby="gyg-proof-title">
      <div className="gyg-proof__header">
        <p className="eyebrow">Confirmed departures</p>
        <h2 id="gyg-proof-title">For most visitors, this is the move.</h2>
        <p className="muted">
          The page still decides first. These live GetYourGuide departures are proof that the recommended swamp-tour
          lane is real, bookable, and ready to move into checkout.
        </p>
        <div className="gyg-proof__signals" aria-label="Availability proof signals">
          <span>Next available departures</span>
          <span>Supplier terms handled</span>
          <span>Checkout opens from the proof layer</span>
        </div>
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
        These are fallback live listings. WTS makes the recommendation; GetYourGuide handles availability, payment,
        confirmation, and cancellation once you choose a departure.
      </p>
    </section>
  );
}
