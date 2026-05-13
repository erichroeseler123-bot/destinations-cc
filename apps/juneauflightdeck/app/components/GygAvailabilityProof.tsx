"use client";

const PARTNER_ID = process.env.NEXT_PUBLIC_GETYOURGUIDE_PARTNER_ID || "F2MMUUH";
const TOUR_ID = process.env.NEXT_PUBLIC_JFD_GYG_TOUR_ID || "1228279";
const CURRENCY = process.env.NEXT_PUBLIC_GETYOURGUIDE_CURRENCY || "USD";

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
        data-gyg-href="https://widget.getyourguide.com/default/availability.frame"
        data-gyg-tour-id={TOUR_ID}
        data-gyg-locale-code="en-US"
        data-gyg-currency={CURRENCY}
        data-gyg-widget="availability"
        data-gyg-variant="horizontal"
        data-gyg-cmp="jfd_availability_proof"
        data-gyg-partner-id={PARTNER_ID}
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
    </section>
  );
}
