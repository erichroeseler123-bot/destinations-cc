import Link from "next/link";
import styles from "./BookingTransparency.module.css";

const bookingFacts = [
  {
    number: "01",
    title: "Different channels can show different seats",
    text: "A cruise line can sell out its excursion allotment while a direct operator or marketplace still shows availability. That opening may be with a different operator, departure time, or version of the tour. A seat is not confirmed until the booking provider confirms it.",
  },
  {
    number: "02",
    title: "Compare the final total—not just the headline price",
    text: "Cruise lines and public booking channels may price comparable tours differently. Check the same date, age category, duration, transfers, taxes, booking fees, and weight-related surcharges. Our calculator uses published examples; it is not a quote or a promise that every sailing will be cheaper.",
  },
  {
    number: "03",
    title: "A stated Back-to-Ship Guarantee creates accountability",
    text: "For a product expressly marked “Worry-Free Shore Excursion,” Viator’s terms say it will arrange transportation to the next port if the supplier fails to return you in time through no fault of your own. That published promise is part of the booking agreement, and consumer-protection law prohibits advertising benefits that are not provided. Coverage requires correct ship details, at least a two-hour buffer between the tour’s end and the ship’s departure, and contacting Viator directly; Viator’s stated limit is $1,000 per person.",
  },
  {
    number: "04",
    title: "Cancellation terms vary by listing",
    text: "Some tours allow free cancellation; others are non-refundable. Weather cancellations and refunds are handled under the exact operator or marketplace terms attached to your reservation. Read those terms before paying and keep the provider’s confirmation.",
  },
] as const;

const checks = [
  "Named tour operator and exact experience",
  "Pickup point, start time, duration, and return time",
  "Your ship’s port date and all-aboard deadline",
  "Final price including taxes, fees, and surcharges",
  "Cancellation, weather-refund, and return-to-ship terms",
] as const;

export default function BookingTransparency() {
  return (
    <section className={styles.section} aria-labelledby="booking-transparency-title">
      <div className={styles.heading}>
        <p className={styles.eyebrow}>How independent booking actually works</p>
        <h2 id="booking-transparency-title">
          Sold out through the ship does not always mean sold out in Juneau.
        </h2>
        <p className={styles.lede}>
          Ship inventory, direct operator inventory, and marketplace inventory can be different.
          Juneau Flight Deck brings those booking paths together so you can compare what is
          available—and understand exactly what changes when you book outside the cruise line.
        </p>
      </div>

      <div className={styles.grid}>
        {bookingFacts.map((fact) => (
          <article className={styles.card} key={fact.number}>
            <span className={styles.number} aria-hidden="true">{fact.number}</span>
            <h3>{fact.title}</h3>
            <p>{fact.text}</p>
          </article>
        ))}
      </div>

      <div className={styles.checklist}>
        <div>
          <p className={styles.checklistLabel}>Before you book</p>
          <h3>Verify these five details on the checkout page.</h3>
          <p>
            Search results and published starting prices are useful for comparison. The booking
            provider’s checkout and confirmation control the reservation.
          </p>
        </div>
        <ul>
          {checks.map((check) => <li key={check}>{check}</li>)}
        </ul>
      </div>

      <div className={styles.disclosure}>
        <div>
          <strong>What Juneau Flight Deck does</strong>
          <p>
            We compare and link to independent options. We do not operate aircraft or hold the
            seats shown. The named operator runs the tour; the booking provider handles payment,
            confirmation, changes, and refunds. Some outbound links are affiliate links, which may
            compensate us without changing the provider’s public price.
          </p>
        </div>
        <div className={styles.actions}>
          <a className={styles.primary} href="#viator-featured-tours">Compare tour options</a>
          <Link href="/helicopter-waitlist">Nothing fits? Join the waitlist</Link>
        </div>
      </div>
    </section>
  );
}
