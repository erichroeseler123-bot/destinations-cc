"use client";

import styles from "./NextHelicopterFinder.module.css";

export default function NextHelicopterFinder() {
  return (
    <section className={styles.finder} aria-labelledby="next-helicopter-title">
      <p className={styles.eyebrow}>Juneau &amp; Skagway Aviation Desk</p>
      <h2 id="next-helicopter-title">Check Verified Operator Listings or Request Human Concierge Review</h2>
      <p>
        Live departure times, seat counts, and passenger weight rules are confirmed directly on each verified provider
        calendar—never guessed or simulated here. Compare current glacier landing, ice trek, and dog-sledding listings
        below, or submit your ship and port window for a manual concierge review.
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginTop: "14px" }}>
        <a className={styles.book} href="#viator-featured-tours">
          Browse Verified Glacier Listings ↓
        </a>
        <a
          href="/helicopter-waitlist"
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "10px 16px",
            borderRadius: "10px",
            border: "1px solid rgba(185, 234, 255, 0.4)",
            color: "#b9eaff",
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          Request Human Concierge Review →
        </a>
      </div>
      <p className={styles.note} style={{ marginTop: "12px" }}>
        Always verify pickup instructions, child rules, per-passenger weight surcharges, and your ship&apos;s confirmed
        all-aboard time on the provider checkout page before paying.
      </p>
    </section>
  );
}
