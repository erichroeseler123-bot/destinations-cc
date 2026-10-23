"use client";

import { useState } from "react";
import { SAVINGS_CHECKED_DATE, SAVINGS_OPTIONS, averageSavingsCents, formatDollars, getComparisons, readPriceCents, type SavingsMode } from "@/lib/tourSavings";
import styles from "./TourSavingsCalculator.module.css";

export default function TourSavingsCalculator() {
  const [travelers, setTravelers] = useState(4);
  const [mode, setMode] = useState<SavingsMode>("all");
  const [cruisePrice, setCruisePrice] = useState("");
  const [directPrice, setDirectPrice] = useState("");
  const cruiseCents = readPriceCents(cruisePrice);
  const directCents = readPriceCents(directPrice);
  const custom = mode === "custom";
  const comparisons = getComparisons(mode);
  const tourScope = mode === "all"
    ? "Juneau helicopter glacier walks, treks, and dog-sled tours"
    : mode === "glacier-walk"
      ? "Juneau helicopter glacier walks"
      : mode === "glacier-trek"
        ? "Juneau helicopter glacier treks"
        : "Juneau helicopter dog-sled tours";
  const perPerson = custom
    ? cruiseCents !== null && directCents !== null ? cruiseCents - directCents : null
    : averageSavingsCents(comparisons);
  const higher = perPerson !== null && perPerson < 0;

  return <section className={styles.panel} aria-labelledby="tour-savings-title">
    <div className={styles.intro}>
      <p className={styles.eyebrow}>Compare before you book through your ship</p>
      <h2 id="tour-savings-title">Spend less on your Juneau helicopter tour.</h2>
      <p>Compare cruise-line prices with direct operator booking options for Juneau helicopter tours. A lower price per person adds up fast for your whole group.</p>
      <div className={styles.actions}>
        <a className={styles.primary} href="#viator-featured-tours">Compare tours &amp; prices ↓</a>
        <a href="/helicopter-waitlist">Sold out on your ship? Join the waitlist →</a>
      </div>
      <p className={styles.support}>Tell us your ship and date. Explore other booking options, join the waiting list, and <a href="/juneau/what-to-do-if-helicopter-tour-canceled">make a backup plan</a>.</p>
    </div>
    <div className={styles.calculator}>
      <div className={styles.controls}>
        <label>Compare using
          <select value={mode} onChange={event => setMode(event.target.value as SavingsMode)}>
            {SAVINGS_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        <label>Travelers
          <select value={travelers} onChange={event => setTravelers(Number(event.target.value))}>
            {Array.from({ length: 20 }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1}</option>)}
          </select>
        </label>
      </div>
      {custom && <div className={styles.prices}>
        <label>Cruise price per person (USD)
          <input type="number" inputMode="decimal" min="0" max="100000" step="0.01" placeholder="Include all taxes & fees" value={cruisePrice} onChange={event => setCruisePrice(event.target.value)} />
        </label>
        <label>Our booking option per person (USD)
          <input type="number" inputMode="decimal" min="0" max="100000" step="0.01" placeholder="Include all taxes & fees" value={directPrice} onChange={event => setDirectPrice(event.target.value)} />
        </label>
      </div>}
      <div className={styles.result} role="status" aria-live="polite" aria-atomic="true">
        <p>{custom ? higher ? "This option costs more per person" : "Your price difference per person" : "Average savings per person for this tour type"}</p>
        <div className={styles.equation}>
          <strong>{perPerson === null ? "—" : formatDollars(Math.abs(perPerson))}</strong>
          <span>× {travelers} {travelers === 1 ? "traveler" : "travelers"}</span>
        </div>
        <p className={styles.total}>{perPerson === null ? "Enter both prices above" : `${formatDollars(Math.abs(perPerson * travelers))} ${higher ? "more for" : perPerson === 0 ? "difference for" : "less for"} your group`}</p>
        {!custom && <p className={styles.qualifier}>Before operator taxes &amp; booking fees</p>}
      </div>
      <p className={styles.note}>{custom
        ? "Use final per-person totals for the same tour, date, age category, and inclusions. Include taxes, booking fees, transfers, and any surcharges. Booking terms and return-to-ship protections vary."
        : `Based on ${comparisons.length} published adult ${comparisons.length === 1 ? "price comparison" : "price comparisons"} for ${tourScope}, checked ${SAVINGS_CHECKED_DATE}. Operator taxes and booking fees reduce these savings. Prices, inclusions, and booking protections vary; this is not a quote for your sailing.`}</p>
      {!custom && <details className={styles.sources}>
        <summary>See the prices behind the average</summary>
        <p>Checked {SAVINGS_CHECKED_DATE}. Equal-weight average of the {comparisons.length === 1 ? "difference" : `${comparisons.length} differences`} below, rounded to the nearest cent before multiplying by your group size. These are comparable experience types; the same operator or departure is not confirmed by the cruise listings.</p>
        <ul>{comparisons.map(comparison => <li key={`${comparison.category}-${comparison.cruiseLine}`}>
          <strong>{comparison.title}</strong><br />
          <a href={comparison.cruiseUrl} target="_blank" rel="noopener noreferrer">{comparison.cruiseLine}: from {formatDollars(comparison.cruiseCents)} ↗</a>
          {" · "}<a href={comparison.operatorUrl} target="_blank" rel="noopener noreferrer">{comparison.operator}: from {formatDollars(comparison.operatorCents)} before fees ↗</a>
        </li>)}</ul>
        <p>Compare final checkout totals and your ship’s schedule before reserving. A published price does not confirm seats. Children’s rates and cruise excursion credits may change your comparison.</p>
      </details>}
    </div>
  </section>;
}
