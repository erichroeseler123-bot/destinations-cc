"use client";

import Link from "next/link";
import { useState } from "react";
import {
  CRUISE_PORTAL_PRICE_NOTE,
  DIRECT_OPERATOR_BENCHMARKS,
  SAVINGS_CHECKED_DATE,
  SAVINGS_OPTIONS,
  formatDollars,
  getBenchmarkTariff,
  readPriceCents,
  type BenchmarkTourId,
} from "@/lib/tourSavings";
import {
  VERBATIM_TWO_HOUR_BUFFER_RULE,
  VERIFIED_OPERATORS,
} from "@/lib/verifiedOperatorPricing";
import styles from "./TourSavingsCalculator.module.css";

export default function TourSavingsCalculator() {
  const [travelers, setTravelers] = useState(4);
  const [selectedId, setSelectedId] = useState<BenchmarkTourId>(
    "temsco-juneau-mendenhall-walk",
  );
  const [cruisePrice, setCruisePrice] = useState("");
  const [customDirectPrice, setCustomDirectPrice] = useState("");

  const custom = selectedId === "custom";
  const selectedTariff = getBenchmarkTariff(selectedId);

  const cruiseCents = readPriceCents(cruisePrice);
  const directCents = custom
    ? readPriceCents(customDirectPrice)
    : selectedTariff
      ? selectedTariff.basePriceUsd * 100
      : null;

  const perPersonDiff =
    cruiseCents !== null && directCents !== null
      ? cruiseCents - directCents
      : null;
  const directIsHigher = perPersonDiff !== null && perPersonDiff < 0;

  return (
    <section className={styles.panel} aria-labelledby="tour-savings-title">
      <div className={styles.intro}>
        <p className={styles.eyebrow}>Compare your sailing portal against direct tariffs</p>
        <h2 id="tour-savings-title">Compare your ship&apos;s helicopter quote with official operator rates.</h2>
        <p>
          Cruise-line shore-excursion prices vary dynamically by sailing inside passenger login
          portals. Select a verified official operator tariff (as of {SAVINGS_CHECKED_DATE}) and
          enter the price quoted in your sailing portal to calculate your exact group difference.
        </p>
        <div className={styles.actions}>
          <a className={styles.primary} href="#viator-featured-tours">
            Compare verified operator tariffs ↓
          </a>
          <Link href="/helicopter-waitlist">
            Sold out on your ship? Check port timing &amp; waitlist →
          </Link>
        </div>
        <p className={styles.support}>
          {VERBATIM_TWO_HOUR_BUFFER_RULE} Explore{" "}
          <Link href="/juneau/what-to-do-if-helicopter-tour-canceled">
            weather backup options
          </Link>{" "}
          before port day.
        </p>
      </div>

      <div className={styles.calculator}>
        <div className={styles.controls}>
          <label>
            Official operator benchmark (as of {SAVINGS_CHECKED_DATE})
            <select
              value={selectedId}
              onChange={(event) => setSelectedId(event.target.value as BenchmarkTourId)}
            >
              {SAVINGS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Travelers
            <select
              value={travelers}
              onChange={(event) => setTravelers(Number(event.target.value))}
            >
              {Array.from({ length: 20 }, (_, index) => (
                <option key={index + 1} value={index + 1}>
                  {index + 1}
                </option>
              ))}
            </select>
          </label>
        </div>

        {selectedTariff && (
          <div
            style={{
              marginTop: 14,
              padding: "12px 14px",
              borderRadius: 10,
              background: "rgba(16, 45, 62, 0.72)",
              border: "1px solid rgba(151, 211, 255, 0.2)",
              fontSize: "0.82rem",
              lineHeight: 1.5,
              color: "#dcebf3",
            }}
          >
            <div>
              <strong>Verified Direct Base Price:</strong> ${selectedTariff.basePriceUsd} / person
              (as of {SAVINGS_CHECKED_DATE}, {selectedTariff.ageRule})
            </div>
            <div>
              <strong>Qualifications:</strong> {selectedTariff.weightSurchargeRule} ·{" "}
              {selectedTariff.taxAndFeesNote} · {selectedTariff.seasonalWindow}
            </div>
            <div style={{ color: "#ffd396", fontWeight: 700, marginTop: 4 }}>
              Cruise-line excursion desk: {CRUISE_PORTAL_PRICE_NOTE}
            </div>
          </div>
        )}

        <div className={styles.prices}>
          <label>
            Your ship&apos;s quoted cruise-line price per person (USD)
            <input
              type="number"
              inputMode="decimal"
              min="0"
              max="100000"
              step="0.01"
              placeholder={CRUISE_PORTAL_PRICE_NOTE}
              value={cruisePrice}
              onChange={(event) => setCruisePrice(event.target.value)}
            />
          </label>
          {custom && (
            <label>
              Direct / partner checkout price per person (USD)
              <input
                type="number"
                inputMode="decimal"
                min="0"
                max="100000"
                step="0.01"
                placeholder="Enter direct operator or partner price"
                value={customDirectPrice}
                onChange={(event) => setCustomDirectPrice(event.target.value)}
              />
            </label>
          )}
        </div>

        <div className={styles.result} role="status" aria-live="polite" aria-atomic="true">
          <p>
            {perPersonDiff === null
              ? "Enter your ship's sailing-portal quote above to compare"
              : directIsHigher
                ? "Direct base tariff is higher than your portal quote by"
                : perPersonDiff === 0
                  ? "Direct base tariff matches your portal quote"
                  : "Difference vs. direct base tariff per person"}
          </p>
          <div className={styles.equation}>
            <strong>
              {perPersonDiff === null ? "—" : formatDollars(Math.abs(perPersonDiff))}
            </strong>
            <span>
              × {travelers} {travelers === 1 ? "traveler" : "travelers"}
            </span>
          </div>
          <p className={styles.total}>
            {perPersonDiff === null
              ? CRUISE_PORTAL_PRICE_NOTE
              : `${formatDollars(Math.abs(perPersonDiff * travelers))} ${
                  directIsHigher
                    ? "more before operator tax & surcharges"
                    : perPersonDiff === 0
                      ? "difference before operator tax & surcharges"
                      : "lower base rate across your group (before operator tax & weight surcharges)"
                }`}
          </p>
          {selectedTariff && (
            <p className={styles.qualifier}>
              Direct base: ${selectedTariff.basePriceUsd} as of {SAVINGS_CHECKED_DATE} (
              {selectedTariff.taxAndFeesNote}; {selectedTariff.weightSurchargeRule})
            </p>
          )}
        </div>

        <p className={styles.note}>
          Direct operator tariffs above are base per-person rates verified on{" "}
          {SAVINGS_CHECKED_DATE} before municipal sales tax, port/landing fees, and clothed weight
          surcharges. Compare final checkout totals, inclusions, cancellation cutoffs, and return
          timing for your exact sailing.
        </p>

        <details className={styles.sources}>
          <summary>Sources and freshness (verified {SAVINGS_CHECKED_DATE})</summary>
          <p>
            Official operator tariffs verified directly from primary operator pages on{" "}
            {SAVINGS_CHECKED_DATE}. Cruise-line shore-excursion rates are gated inside passenger
            sailing portals and are never estimated here.
          </p>
          <ul>
            {DIRECT_OPERATOR_BENCHMARKS.map((tariff) => (
              <li key={tariff.id}>
                <strong>
                  {tariff.operatorName} ({tariff.port}) — {tariff.tourName}
                </strong>
                <br />
                {tariff.priceDisplayLong} ({tariff.totalDurationLabel}; {tariff.seasonalWindow};{" "}
                {tariff.weightSurchargeRule}; {tariff.taxAndFeesNote}) ·{" "}
                <a href={tariff.officialSourceUrl} target="_blank" rel="noopener noreferrer">
                  Official tariff source ↗
                </a>{" "}
                ·{" "}
                <a href={VERIFIED_OPERATORS[tariff.operatorKey].lfseProfileUrl}>
                  LFSE operator profile ↗
                </a>
              </li>
            ))}
          </ul>
        </details>
      </div>
    </section>
  );
}
