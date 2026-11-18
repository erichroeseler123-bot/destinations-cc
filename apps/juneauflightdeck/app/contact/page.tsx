import type { Metadata } from "next";
import Link from "next/link";
import {
  LFSE_CANONICAL_LINKS,
  VERBATIM_TWO_HOUR_BUFFER_RULE,
} from "@/lib/verifiedOperatorPricing";

export const metadata: Metadata = {
  title: "Tour Planning & Concierge Help",
  description:
    "Ask Juneau Flight Deck's independent concierge desk about Juneau glacier flight comparisons, cruise port timing, availability requests, and weather backups.",
  alternates: { canonical: "https://juneauflightdeck.com/contact" },
};

export default function ContactPage() {
  return (
    <main id="main-content" className="page-shell static-page-shell">
      <section className="static-page-card">
        <div
          style={{
            marginBottom: 20,
            borderRadius: 16,
            overflow: "hidden",
            border: "1px solid var(--line, #334155)",
            aspectRatio: "16 / 9",
            maxHeight: 280,
            background: "#071626",
          }}
        >
          <img
            src="/images/juneau-helicopter-hero.jpg"
            alt="Flightseeing helicopter soaring above an expansive Alaska glacier valley and snow-capped peaks"
            width={1440}
            height={900}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "50% 48%",
              display: "block",
            }}
          />
        </div>
        <p className="eyebrow">Independent Concierge &amp; Planning Desk</p>
        <h1 className="static-page-title">
          Let&apos;s find the right glacier flight for your port day.
        </h1>
        <p className="chooser-trust-line">
          Juneau Flight Deck is an independent flightseeing education and concierge planning site
          (not an aircraft operator). Ask us about glacier tour comparisons, downtown shuttle
          meeting points, cruise return buffers, or weather-day alternatives.
        </p>
        <p>
          <a
            href="mailto:dispatch@juneauflightdeck.com"
            style={{ color: "#9ed9ff", textDecoration: "underline", fontWeight: 700 }}
          >
            dispatch@juneauflightdeck.com
          </a>
        </p>
        <p>
          Include your cruise ship, Juneau (or Skagway) port date, party size, confirmed arrival and
          all-aboard times, and the tour format you are considering. {VERBATIM_TWO_HOUR_BUFFER_RULE}
        </p>
        <h2>For an existing reservation</h2>
        <p>
          Contact the licensed flight operator (
          <a
            href={LFSE_CANONICAL_LINKS.temsco}
            style={{ color: "#9ed9ff", textDecoration: "underline" }}
          >
            TEMSCO ↗
          </a>
          ,{" "}
          <a
            href={LFSE_CANONICAL_LINKS.coastal}
            style={{ color: "#9ed9ff", textDecoration: "underline" }}
          >
            Coastal ↗
          </a>
          , or{" "}
          <a
            href={LFSE_CANONICAL_LINKS.northstar}
            style={{ color: "#9ed9ff", textDecoration: "underline" }}
          >
            NorthStar ↗
          </a>
          ) or the booking platform shown on your confirmation for payment, changes, refunds, or
          day-of check-in updates. Your booking provider controls your reservation.
        </p>
        <Link href="/helicopter" className="primary-cta">
          Compare Glacier Flights
        </Link>
      </section>
    </main>
  );
}
