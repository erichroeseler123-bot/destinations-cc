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
    title: "A Back-to-Ship Guarantee must be explicit (Viator Terms §20 vs. DCC Timing)",
    text: "DCC evaluates tour suitability and calculates cruise-port timing buffers; Juneau Flight Deck explains the options; Viator handles the booking and applicable booking protections. DCC itself does not provide a back-to-ship guarantee. Viator's Terms of Use (Section 20, “Worry-free Shore Excursions”) create a contractual guarantee only for products marked “Worry-free Shore Excursion” (such as Viator product 6251SHOREXICEWALK, Tag 367649). Eligibility requires supplying Viator with accurate ship arrival/departure details, at least 2 hours (120 minutes) between tour end and ship departure, no traveler-caused delay, and contacting Viator directly before arranging transport (up to US$1,000 per person next-port transport; 14-day refund window if a ship misses port).",
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

const primarySources = [
  {
    label: "Viator Terms of Use — Worry-free Shore Excursions, §20",
    href: "https://www.viator.com/support/termsAndConditions",
    note: "Return-to-ship eligibility and $1,000 next-port limit",
  },
  {
    label: "TEMSCO Juneau tour pages",
    href: "https://temscoair.com/juneau-helicopter-tours/mendenhall-glacier/",
    note: "Duration, transfers, weight surcharge, and weather refund",
  },
  {
    label: "Coastal Helicopters FAQ",
    href: "https://coastalhelicopters.com/faq/",
    note: "Cancellation tiers, weather refund, cruise disruption, and return support",
  },
  {
    label: "NorthStar Trekking FAQ",
    href: "https://northstartrekking.com/faqs/",
    note: "Customer cancellation and seating policies",
  },
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

      <div className={styles.sources}>
        <div>
          <p className={styles.checklistLabel}>Source-of-truth standard</p>
          <h3>Claims should be traceable, dated, and narrow.</h3>
          <p>
            We use operator pages and current booking terms as primary sources. “Starting at”
            prices are snapshots, not quotes; checkout controls. When channels disagree, we show
            the disagreement instead of guessing.
          </p>
          <span>Primary sources last checked October 23, 2026.</span>
        </div>
        <ul>
          {primarySources.map((source) => (
            <li key={source.href}>
              <a href={source.href} target="_blank" rel="noopener noreferrer">{source.label}</a>
              <small>{source.note}</small>
            </li>
          ))}
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
