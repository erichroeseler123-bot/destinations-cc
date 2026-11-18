import type { Metadata } from "next";
import Link from "next/link";
import {
  SITE_DESCRIPTION,
  BOOKING_ROLES,
  BOOKING_BENEFITS,
  BOOKING_FAQS,
} from "@/lib/sitePositioning";
import {
  LFSE_CANONICAL_LINKS,
  TWO_HOUR_BUFFER_CLARIFICATION,
  VERBATIM_TWO_HOUR_BUFFER_RULE,
} from "@/lib/verifiedOperatorPricing";
import SourcesAndFreshness from "../components/SourcesAndFreshness";

export const metadata: Metadata = {
  title: "About Juneau Flight Deck | Independent Flightseeing & Concierge Guide",
  description: SITE_DESCRIPTION,
  alternates: { canonical: "https://juneauflightdeck.com/about" },
};

export default function AboutPage() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: BOOKING_FAQS.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  };
  return (
    <main id="main-content" className="page-shell static-page-shell">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <section className="static-page-card">
        <div
          style={{
            margin: "0 0 22px",
            borderRadius: 16,
            overflow: "hidden",
            border: "1px solid var(--line, rgba(148, 163, 184, 0.25))",
            aspectRatio: "16 / 9",
            maxHeight: 300,
            background: "#071626",
          }}
        >
          <img
            src="/images/juneau-helicopter-hero.jpg"
            alt="Flightseeing helicopter over an Alaska glacier valley surrounded by snow-capped Coast Mountains"
            width={1440}
            height={900}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "50% 46%",
              display: "block",
            }}
          />
        </div>
        <p className="eyebrow">Independent Juneau Flight Guide &amp; Concierge</p>
        <h1 className="static-page-title">
          Independent flightseeing education, weather context, and cruise port planning.
        </h1>
        <p className="chooser-trust-line">{SITE_DESCRIPTION}</p>
        <p>
          <strong>Important identity note:</strong> Juneau Flight Deck is an independent editorial,
          weather-guidance, and concierge planning site—we do not own or operate aircraft and are
          not an FAA Part 135 air carrier. All glacier flights in Juneau are operated independently
          by licensed carriers:{" "}
          <a
            href={LFSE_CANONICAL_LINKS.temsco}
            style={{ color: "#9ed9ff", textDecoration: "underline", fontWeight: 700 }}
          >
            TEMSCO Helicopters ↗
          </a>
          ,{" "}
          <a
            href={LFSE_CANONICAL_LINKS.coastal}
            style={{ color: "#9ed9ff", textDecoration: "underline", fontWeight: 700 }}
          >
            Coastal Helicopters ↗
          </a>
          ,{" "}
          <a
            href={LFSE_CANONICAL_LINKS.northstar}
            style={{ color: "#9ed9ff", textDecoration: "underline", fontWeight: 700 }}
          >
            NorthStar Trekking ↗
          </a>
          , and{" "}
          <a
            href={LFSE_CANONICAL_LINKS.wings}
            style={{ color: "#9ed9ff", textDecoration: "underline", fontWeight: 700 }}
          >
            Wings Airways ↗
          </a>
          . Juneau Flight Deck is also completely separate from the Alaska Fish &amp; Chips Company
          at the Flight Deck restaurant at Merchants Wharf.
        </p>

        <div style={{ display: "grid", gap: 20, margin: "28px 0" }}>
          {BOOKING_BENEFITS.map((benefit) => (
            <section key={benefit.title}>
              <h2>{benefit.title}</h2>
              <p>{benefit.description}</p>
              <Link href={benefit.href}>{benefit.label} →</Link>
            </section>
          ))}
        </div>

        <h2>Who handles your reservation &amp; how we plan return timing</h2>
        <p>{BOOKING_ROLES}</p>
        <p>
          <strong>{VERBATIM_TWO_HOUR_BUFFER_RULE}</strong> {TWO_HOUR_BUFFER_CLARIFICATION}
        </p>

        <h2>If your cruise portal shows sold out</h2>
        <p>
          You can submit a free human concierge availability request with your ship, port date, and
          party size. Submitting a request does not collect payment, hold a seat, or guarantee an
          opening; always confirm final checkout pricing and terms directly with the booking
          provider before paying.
        </p>

        <h2>Questions about planning with us</h2>
        {BOOKING_FAQS.map(({ question, answer }) => (
          <section key={question}>
            <h3>{question}</h3>
            <p>{answer}</p>
          </section>
        ))}

        <SourcesAndFreshness includeSkagway />

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 28 }}>
          <Link href="/helicopter" className="primary-cta">
            Compare Glacier Flights
          </Link>
          <Link href="/contact" className="button button-secondary">
            Ask Our Concierge
          </Link>
        </div>
      </section>
    </main>
  );
}
