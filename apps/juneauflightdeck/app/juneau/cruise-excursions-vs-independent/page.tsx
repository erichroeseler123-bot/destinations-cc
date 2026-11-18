import type { Metadata } from "next";
import Link from "next/link";
import HelicopterWaitlistForm from "../../components/HelicopterWaitlistForm";
import TourSavingsCalculator from "../../components/TourSavingsCalculator";
import ExcursionRateComparison from "../../components/ExcursionRateComparison";
import SourcesAndFreshness from "../../components/SourcesAndFreshness";
import {
  LFSE_CANONICAL_LINKS,
  TWO_HOUR_BUFFER_CLARIFICATION,
  UNVERIFIED_CRUISE_PORTAL_PRICE_LABEL,
  VERBATIM_TWO_HOUR_BUFFER_RULE,
  VERIFIED_TARIFF_DATE_LONG,
} from "@/lib/verifiedOperatorPricing";

export const metadata: Metadata = {
  title: "Booking Independent vs. Cruise Ship Helicopter Tours in Juneau | Full Guide",
  description:
    "Compare verified direct Juneau helicopter tariffs (as of November 18, 2026) against your cruise ship's sailing portal quote, plus pickup logistics, cancellation cutoffs, and 2-hour return planning.",
  alternates: {
    canonical: "https://juneauflightdeck.com/juneau/cruise-excursions-vs-independent",
  },
  openGraph: {
    title: "Cruise Ship Excursion Desk vs. Independent Helicopter Booking in Juneau",
    description:
      "Compare verified official operator base rates (as of November 18, 2026) against dynamic cruise-line excursion portal quotes.",
    url: "https://juneauflightdeck.com/juneau/cruise-excursions-vs-independent",
    type: "article",
  },
};

const vsShipFaqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Will my cruise ship wait if an independent helicopter tour is delayed?",
      acceptedAnswer: {
        "@type": "Answer",
        text: `Do not assume the ship will wait for an independently booked tour. ${VERBATIM_TWO_HOUR_BUFFER_RULE} ${TWO_HOUR_BUFFER_CLARIFICATION}`,
      },
    },
    {
      "@type": "Question",
      name: "Do cruise ships use different helicopter companies than independent travelers?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Cruise lines and independent channels sell excursions flown by Juneau's three licensed FAA Part 135 helicopter carriers—TEMSCO Helicopters, Coastal Helicopters, and NorthStar Trekking. Always compare the exact tour duration, glacier, weight surcharge tier, cancellation terms, and final checkout total.",
      },
    },
    {
      "@type": "Question",
      name: "Why doesn't Juneau Flight Deck publish cruise-line excursion dollar amounts?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Cruise-line shore-excursion prices vary dynamically by sailing inside passenger login portals and cannot be verified publicly for an identical sailing/option. Instead, we publish verified primary operator base rates (as of November 18, 2026) and let you enter your own sailing portal quote in our calculator.",
      },
    },
  ],
};

export default function CruiseExcursionsVsIndependentPage() {
  return (
    <main id="main-content" className="page-shell py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(vsShipFaqJsonLd) }}
      />

      <div className="site-shell max-w-5xl mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <p className="eyebrow">
            Independent Cruise Decision Guide · Verified {VERIFIED_TARIFF_DATE_LONG}
          </p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
            Booking Independent vs. The Cruise Ship Shore Excursion Desk
          </h1>
          <p className="text-lg text-slate-300 leading-relaxed">
            Compare verified direct tariffs from{" "}
            <a
              href={LFSE_CANONICAL_LINKS.temsco}
              style={{ color: "#9ed9ff", textDecoration: "underline", fontWeight: 700 }}
            >
              TEMSCO ↗
            </a>
            ,{" "}
            <a
              href={LFSE_CANONICAL_LINKS.coastal}
              style={{ color: "#9ed9ff", textDecoration: "underline", fontWeight: 700 }}
            >
              Coastal ↗
            </a>
            , and{" "}
            <a
              href={LFSE_CANONICAL_LINKS.northstar}
              style={{ color: "#9ed9ff", textDecoration: "underline", fontWeight: 700 }}
            >
              NorthStar ↗
            </a>{" "}
            (as of {VERIFIED_TARIFF_DATE_LONG}) against the exact price shown in your ship&apos;s
            sailing portal—without guesswork or unverified savings claims.
          </p>
        </div>

        <div
          style={{
            marginBottom: 28,
            borderRadius: 18,
            overflow: "hidden",
            border: "1px solid rgba(148, 163, 184, 0.25)",
            aspectRatio: "16 / 9",
            maxHeight: 340,
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

        {/* Interactive Calculator */}
        <TourSavingsCalculator />

        {/* Verified Direct Tariffs vs Sailing Portal Table */}
        <section id="viator-featured-tours" className="mb-10">
          <ExcursionRateComparison />
        </section>

        {/* Side-by-Side Policy Comparison */}
        <section className="section-block p-6 md:p-8 mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">
            Contract &amp; Logistics Comparison
          </h2>
          <div className="seo-table-container">
            <table className="seo-matrix-table">
              <thead>
                <tr>
                  <th>Feature</th>
                  <th>Cruise Line Shore Portal</th>
                  <th>Direct Operator / Partner Checkout</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <strong>Glacier Landing Price</strong>
                  </td>
                  <td>{UNVERIFIED_CRUISE_PORTAL_PRICE_LABEL}</td>
                  <td>
                    <strong className="text-emerald-400">
                      $449 TEMSCO · $459 Coastal Standard (as of Nov 18, 2026 + CBJ tax, fees &amp;
                      weight surcharges)
                    </strong>
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>Glacier Walkabout / Trek Price</strong>
                  </td>
                  <td>{UNVERIFIED_CRUISE_PORTAL_PRICE_LABEL}</td>
                  <td>
                    <strong className="text-emerald-400">
                      $539 Walkabout · $599 Trek NorthStar (as of Nov 18, 2026; +$250 at 250+ lbs +
                      CBJ tax &amp; fees)
                    </strong>
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>Seasonal Dog Sledding (May–Aug)</strong>
                  </td>
                  <td>{UNVERIFIED_CRUISE_PORTAL_PRICE_LABEL}</td>
                  <td>
                    <strong className="text-emerald-400">
                      $759 TEMSCO · $769 Coastal · $789 NorthStar (as of Nov 18, 2026 + CBJ tax,
                      fees &amp; weight surcharges)
                    </strong>
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>Who Operates the Aircraft?</strong>
                  </td>
                  <td>Contracted local Part 135 operator</td>
                  <td>
                    Named Part 135 operator (TEMSCO, Coastal, or NorthStar — see{" "}
                    <a
                      href={LFSE_CANONICAL_LINKS.juneauHelicopterCategory}
                      style={{ color: "#9ed9ff", textDecoration: "underline" }}
                    >
                      LFSE directory ↗
                    </a>
                    )
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>Return-Buffer Planning</strong>
                  </td>
                  <td>Managed under cruise excursion schedule</td>
                  <td>
                    {VERBATIM_TWO_HOUR_BUFFER_RULE} ({TWO_HOUR_BUFFER_CLARIFICATION})
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>Weather Cancellation</strong>
                  </td>
                  <td>Governed by cruise-line excursion terms</td>
                  <td>
                    100% refund (or optional reschedule) under operator or Viator confirmation terms
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* When the Ship Portal Shows Sold Out */}
        <section className="section-block p-6 md:p-8 mb-10">
          <h2 className="text-2xl font-bold text-white mb-2">
            What to Do When Your Cruise Portal Shows Sold Out
          </h2>
          <p className="text-slate-300 text-sm md:text-base leading-relaxed mb-6">
            A ship excursion portal marked sold out reflects only that cruise line&apos;s contracted
            block—not necessarily every seat on TEMSCO, Coastal, or NorthStar. Submit your ship date
            below for a free human concierge review, or compare{" "}
            <Link
              href="/skagway/helicopter"
              style={{ color: "#9ed9ff", textDecoration: "underline", fontWeight: 700 }}
            >
              Skagway helicopter options ($479 Discovery / $649 Dog Sledding base, as of Nov 18,
              2026)
            </Link>
            .
          </p>

          <HelicopterWaitlistForm compact={true} defaultPort="juneau" />
        </section>

        <SourcesAndFreshness includeSkagway />

        <div className="text-center mt-8 mb-8">
          <Link href="/helicopter" className="button button-primary">
            Compare Juneau Helicopter Tours →
          </Link>
        </div>
      </div>
    </main>
  );
}
