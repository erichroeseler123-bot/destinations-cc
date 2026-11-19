import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import OperatorIdentityMark from "@/app/components/OperatorIdentityMark";
import SourcesAndFreshness from "@/app/components/SourcesAndFreshness";
import UncruiseFiveStepChecklist from "@/app/components/UncruiseFiveStepChecklist";
import {
  buildPortfolioHandoffUrl,
  evaluatePortfolioAssuranceSummary,
} from "@/lib/dcc/commerce/portfolio";
import { buildFlightGuideJsonLd } from "@/lib/operatorSchema";
import {
  getUncruiseGuideFreshnessLabel,
  UNCRUISE_CLAIM_SOURCE_LEDGER,
  UNCRUISE_FARE_COMPARISON,
  UNCRUISE_GUIDE_CANONICAL_URL,
  UNCRUISE_GUIDE_FAQS,
  UNCRUISE_GUIDE_HUMAN_ATTESTATION_CLEARED,
  UNCRUISE_GUIDE_PATH,
  UNCRUISE_JUNEAU_TURNAROUND_FACTS,
  UNCRUISE_OPERATOR_CHANNEL_CARDS,
  UNCRUISE_PRIMARY_RETRIEVAL_DATE_LONG,
} from "@/lib/uncruiseJuneauGuideData";
import { VERIFIED_TARIFF_DATE_LONG } from "@/lib/verifiedOperatorPricing";
import styles from "./uncruise-guide.module.css";

const PAGE_TITLE = "Adding a Juneau Helicopter Tour Before or After Your UnCruise";
const PAGE_DESCRIPTION =
  "Independent planning guide for UnCruise travelers adding a Juneau helicopter glacier landing or trek without conflicting with 76 Egan Drive check-in, luggage storage, or included transfers.";

const isProductionIndexable =
  process.env.VERCEL_ENV === "production" && UNCRUISE_GUIDE_HUMAN_ATTESTATION_CLEARED;

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: UNCRUISE_GUIDE_CANONICAL_URL,
  },
  robots: {
    index: isProductionIndexable,
    follow: isProductionIndexable,
    googleBot: {
      index: isProductionIndexable,
      follow: isProductionIndexable,
    },
  },
  openGraph: {
    title: `${PAGE_TITLE} | Juneau Flight Deck`,
    description: PAGE_DESCRIPTION,
    url: UNCRUISE_GUIDE_CANONICAL_URL,
    siteName: "Juneau Flight Deck",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: `${PAGE_TITLE} | Juneau Flight Deck`,
    description: PAGE_DESCRIPTION,
  },
};

function buildSellerHandoffHref(
  card: (typeof UNCRUISE_OPERATOR_CHANNEL_CARDS)[number],
  evaluationRunId: string,
  receiptId: string,
): string {
  const baseHref = buildPortfolioHandoffUrl({
    originatingSite: "juneauflightdeck.com",
    provider: card.handoffConfig.provider,
    providerAccount: card.handoffConfig.providerAccount,
    productCode: card.handoffConfig.productCode,
    destinationUrl: card.handoffConfig.destinationUrl,
    campaign: card.handoffConfig.campaign,
    sourcePage: UNCRUISE_GUIDE_PATH,
    evaluationRunId,
    receiptId,
  });

  // Keep Preview / synthetic verification clicks strictly out of Production business metrics
  if (process.env.VERCEL_ENV !== "production") {
    return `${baseHref}&qa=1`;
  }
  return baseHref;
}

export default function UncruiseJuneauHelicopterGuidePage() {
  const assurance = evaluatePortfolioAssuranceSummary({
    engineId: "juneau-helicopter-tours",
    inputs: {
      tripContext: "uncruise_juneau_pre_post_turnaround",
      partySize: 2,
    },
    callerClientId: "ssr:juneauflightdeck.com:uncruise-guide",
  });

  const guideJsonLd = buildFlightGuideJsonLd({
    canonicalUrl: UNCRUISE_GUIDE_CANONICAL_URL,
    title: `${PAGE_TITLE} | Juneau Flight Deck`,
    description: PAGE_DESCRIPTION,
    breadcrumbs: [
      { name: "Juneau Flight Deck", url: "https://juneauflightdeck.com/" },
      { name: PAGE_TITLE, url: UNCRUISE_GUIDE_CANONICAL_URL },
    ],
    comparedOperators: ["temsco", "northstar", "coastal"],
    itemListName:
      "Licensed Juneau Helicopter Operators Compared for Pre- and Post-UnCruise Turnarounds",
  });

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: UNCRUISE_GUIDE_FAQS.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <main id="main-content" className={styles.pageMain}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(guideJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <div className={`site-shell ${styles.stack}`}>
        {/* HERO */}
        <header className={styles.heroCard} data-testid="jfd-uncruise-guide-hero">
          <p className={styles.eyebrow}>
            Independent Pre- &amp; Post-Cruise Flightseeing Guide · Juneau, Alaska
          </p>
          <h1 className={styles.heroTitle}>{PAGE_TITLE}</h1>
          <p className={styles.heroLead}>
            UnCruise’s small-ship voyages cover guided kayaking, paddleboarding, inflatable skiff
            explorations, wilderness hikes, and embarkation/disembarkation day airport-to-vessel
            transfers—while commercial helicopter glacier landings and icefield treks are booked
            separately ashore. Here is how to plan a Juneau flight without colliding with{" "}
            <strong>76 Egan Drive</strong> check-in cutoffs, suitcase storage, or your included
            transfers.
          </p>

          <div
            className={styles.independenceNotice}
            data-testid="jfd-uncruise-independence-disclosure"
          >
            <strong>Independent Guide &amp; Scope Disclosure:</strong> Juneau Flight Deck is an
            independent flightseeing planning site and is{" "}
            <strong>not affiliated with, sponsored by, or endorsed by UnCruise Adventures</strong>{" "}
            (InnerSea Discoveries, Alaska, Corp.). We are not an FAA Part 135 air carrier, and
            nothing on this page guarantees flyable weather, open replacement seats, or schedule
            compatibility.{" "}
            <span style={{ color: "#9ed9ff" }}>{getUncruiseGuideFreshnessLabel()}</span>
          </div>

          <div className={styles.heroActions}>
            <a href="#five-step-flow" className={styles.primaryJumpBtn}>
              Start 5-Step Timing &amp; Pickup Check ↓
            </a>
            <a href="#operator-channel-cards" className={styles.secondaryJumpBtn}>
              Compare Operator &amp; Channel Cards ↓
            </a>
          </div>
        </header>

        {/* SECTION 1: WHAT UNCRUISE INCLUDES VS SEPARATE */}
        <section
          className={styles.sectionCard}
          aria-labelledby="uncruise-inclusions-heading"
          data-testid="jfd-uncruise-inclusions-section"
        >
          <div>
            <p className={styles.eyebrow}>Step 0 · Avoid Duplicate Purchases</p>
            <h2 id="uncruise-inclusions-heading" className={styles.sectionHeading}>
              What Your UnCruise Fare Already Covers vs. What Is Purchased Separately
            </h2>
            <p className={styles.sectionSub}>
              Before adding anything in Juneau, separate what your cruise fare already provides from
              third-party experiences governed by independent operator or reseller terms.
            </p>
          </div>

          <div className={styles.twoColGrid}>
            <div className={styles.infoPanel}>
              <span className={`${styles.panelTag} ${styles.tagIncluded}`}>
                Included in UnCruise Cruise Fare
              </span>
              <ul className={styles.itemList}>
                {UNCRUISE_FARE_COMPARISON.includedInUncruiseFare.map((entry) => (
                  <li key={entry.item}>
                    <strong>{entry.item}:</strong> {entry.detail}{" "}
                    <a
                      href={entry.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.sourceInlineLink}
                    >
                      ({entry.sourceLabel} ↗)
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className={styles.infoPanel}>
              <span className={`${styles.panelTag} ${styles.tagSeparate}`}>
                Not Included · Booked Separately
              </span>
              <ul className={styles.itemList}>
                {UNCRUISE_FARE_COMPARISON.purchasedSeparately.map((entry) => (
                  <li key={entry.item}>
                    <strong>{entry.item}:</strong> {entry.detail}{" "}
                    <a
                      href={entry.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.sourceInlineLink}
                    >
                      ({entry.sourceLabel} ↗)
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className={styles.turnaroundBox}>
            <strong style={{ color: "#ffd596" }}>
              Published UnCruise Juneau Check-In &amp; Turnaround Cutoffs (checked{" "}
              {UNCRUISE_PRIMARY_RETRIEVAL_DATE_LONG}):
            </strong>
            <div>
              • <strong>Check-in, embarkation &amp; disembarkation address:</strong>{" "}
              {UNCRUISE_JUNEAU_TURNAROUND_FACTS.hospitalityAddress} · Hospitality hours:{" "}
              <strong>{UNCRUISE_JUNEAU_TURNAROUND_FACTS.hospitalityHours}</strong>.
              <br />• <strong>Embarkation day:</strong>{" "}
              {UNCRUISE_JUNEAU_TURNAROUND_FACTS.embarkationFlightCutoff};{" "}
              <strong>{UNCRUISE_JUNEAU_TURNAROUND_FACTS.embarkationLuggageCutoff}</strong>;{" "}
              <strong>{UNCRUISE_JUNEAU_TURNAROUND_FACTS.embarkationHospitalityCutoff}</strong>.
              <br />• <strong>Disembarkation day:</strong>{" "}
              {UNCRUISE_JUNEAU_TURNAROUND_FACTS.disembarkationFlightCutoff}.{" "}
              {UNCRUISE_JUNEAU_TURNAROUND_FACTS.finalDocsTimingNote}
              <br />• <strong>Downtown Juneau layout:</strong>{" "}
              {UNCRUISE_JUNEAU_TURNAROUND_FACTS.downtownProximityNote}
            </div>
          </div>
        </section>

        {/* SECTION 2: DEDICATED LAND DAY VS EMBARK / DISEMBARK */}
        <section
          className={styles.sectionCard}
          aria-labelledby="land-day-vs-turnaround-heading"
          data-testid="jfd-uncruise-day-comparison"
        >
          <div>
            <p className={styles.eyebrow}>Choosing Which Day to Fly</p>
            <h2 id="land-day-vs-turnaround-heading" className={styles.sectionHeading}>
              Dedicated Juneau Land Day vs. Embarkation or Disembarkation Day
            </h2>
            <p className={styles.sectionSub}>
              Most Juneau helicopter pages assume you are stepping off a docked mega-ship with your
              bags in a stateroom. Staying at a Juneau hotel or turning around for an UnCruise
              changes three variables: cutoff pressure, suitcase storage, and pickup geography.
            </p>
          </div>

          <div className={styles.threeColGrid}>
            <article className={styles.infoPanel}>
              <span className={`${styles.panelTag} ${styles.tagIncluded}`}>
                Simplest Operational Fit
              </span>
              <h3 style={{ margin: 0, fontSize: "1.1rem", color: "#ffffff" }}>
                1. Dedicated Pre- or Post-Cruise Land Day
              </h3>
              <p className={styles.specText}>
                Flying in at least a day early—or staying an extra night in Juneau after
                disembarkation—removes same-day vessel check-in and airline bag-drop cutoffs from
                your flightseeing window (2h 15m to 4h 15m door-to-door).
              </p>
              <p className={styles.specText}>
                <strong>Honest weather note:</strong> An extra day gives you scheduling flexibility
                to ask an operator about another departure if low ceilings or winds ground your
                flight, and keeps your UnCruise embarkation-day transfer untouched—but{" "}
                <strong>
                  suitable flight weather and open replacement seats are never guaranteed
                </strong>
                , especially on summer days when multiple large cruise ships are in port.
              </p>
            </article>

            <article className={styles.infoPanel}>
              <span className={`${styles.panelTag} ${styles.tagSeparate}`}>
                Confirm Cutoffs &amp; Bags First
              </span>
              <h3 style={{ margin: 0, fontSize: "1.1rem", color: "#ffffff" }}>
                2. UnCruise Embarkation Day
              </h3>
              <p className={styles.specText}>
                UnCruise’s Juneau hospitality at <strong>76 Egan Drive</strong> opens at{" "}
                <strong>9:00 a.m.</strong>, requires luggage checked in by{" "}
                <strong>3:00 p.m.</strong>, and requires you back in hospitality by{" "}
                <strong>4:30 p.m.</strong> (<strong>3:00 p.m.</strong> on <em>Safari Quest</em>).
              </p>
              <p className={styles.specText}>
                Because TEMSCO, NorthStar, and Coastal all prohibit suitcases on tour, an
                embarkation-morning flight requires: (a) already being in Juneau overnight or
                arriving very early, (b) confirmed hotel bell-desk storage or 76 Egan Drive bag
                drop after 9:00 a.m., and (c) finishing well ahead of 3:00 p.m. / 4:30 p.m. Also
                note UnCruise’s Terms give no refund for included transfers voluntarily omitted.
              </p>
            </article>

            <article className={styles.infoPanel}>
              <span className={`${styles.panelTag} ${styles.tagSeparate}`}>
                Confirm Final Docs &amp; Flight Home
              </span>
              <h3 style={{ margin: 0, fontSize: "1.1rem", color: "#ffffff" }}>
                3. UnCruise Disembarkation Day
              </h3>
              <p className={styles.specText}>
                UnCruise advises scheduling outbound JNU flights{" "}
                <strong>no earlier than 11:30 a.m.</strong>, and exact morning disembarkation times
                are confirmed in your final e-documents (~45 days before sailing).
              </p>
              <p className={styles.specText}>
                Operators explicitly note that rapidly changing icefield weather can occasionally
                delay return from the glacier. Only consider a disembarkation-day helicopter tour if
                you have a confirmed late-afternoon/evening flight (or post-cruise hotel night),
                confirmed suitcase storage after leaving 76 Egan Drive, and comfortable buffer
                before airline bag-drop cutoffs.
              </p>
            </article>
          </div>
        </section>

        {/* SECTION 3: FIVE-STEP TRAVELER FLOW */}
        <div id="five-step-flow">
          <UncruiseFiveStepChecklist />
        </div>

        {/* SECTION 4: ONE-OPERATOR / ONE-CHANNEL CARDS */}
        <section
          id="operator-channel-cards"
          className={styles.sectionCard}
          aria-labelledby="operator-cards-heading"
          data-testid="jfd-uncruise-operator-cards"
        >
          <div>
            <p className={styles.eyebrow}>
              One Card = One Licensed Operator &amp; One Booking Channel
            </p>
            <h2 id="operator-cards-heading" className={styles.sectionHeading}>
              Compare Juneau Helicopter Options &amp; Reach the Exact Seller
            </h2>
            <p className={styles.sectionSub}>
              Direct operator checkouts and third-party partner listings (such as Viator) carry
              different voluntary cancellation windows and pickup selectors. Each card below binds
              one FAA Part 135 operator to one specific booking channel—and holds any unverified
              channel detail rather than blending policies across sellers.
            </p>
          </div>

          <div className={styles.operatorStack}>
            {UNCRUISE_OPERATOR_CHANNEL_CARDS.map((card) => {
              const sellerHref = buildSellerHandoffHref(
                card,
                assurance.evaluationRunId,
                assurance.receiptId,
              );

              return (
                <article
                  key={card.cardId}
                  className={styles.operatorCard}
                  data-testid={`jfd-uncruise-card-${card.cardId}`}
                >
                  <div className={styles.operatorHeroRow}>
                    <div className={styles.operatorImageWrap}>
                      <Image
                        src={card.imageSrc}
                        alt={card.imageAlt}
                        fill
                        sizes="(max-width: 820px) 100vw, 280px"
                        style={{ objectFit: "cover" }}
                      />
                    </div>

                    <div className={styles.operatorHeaderBody}>
                      <div className={styles.channelBadgeRow}>
                        <OperatorIdentityMark operator={card.operatorKey} size="sm" />
                        <span
                          className={
                            card.bookingChannelType === "direct_operator"
                              ? styles.channelBadgeDirect
                              : styles.channelBadgePartner
                          }
                        >
                          {card.bookingSellerLabel}
                        </span>
                      </div>

                      <h3 style={{ margin: 0, fontSize: "1.3rem", color: "#ffffff" }}>
                        {card.tourTitle}
                      </h3>

                      <p className={styles.specText}>
                        <strong>Operating Carrier:</strong> {card.operatorName} (
                        {card.operatingBaseAddress})
                        <br />
                        <strong>Published Tariff &amp; Channel Scope:</strong>{" "}
                        {card.publishedPriceSummary}
                      </p>

                      {card.secondaryOptionNote && (
                        <p
                          style={{
                            margin: 0,
                            fontSize: "0.82rem",
                            color: "rgba(228, 239, 246, 0.78)",
                          }}
                        >
                          {card.secondaryOptionNote} · {card.photoCredit}
                        </p>
                      )}
                      {!card.secondaryOptionNote && (
                        <p
                          style={{
                            margin: 0,
                            fontSize: "0.8rem",
                            color: "rgba(228, 239, 246, 0.68)",
                          }}
                        >
                          {card.photoCredit}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className={styles.operatorBodyGrid}>
                    <div className={styles.specBox}>
                      <span className={styles.specLabel}>
                        Duration &amp; Meaning of Selected Time
                      </span>
                      <p className={styles.specText}>{card.totalDurationSummary}</p>
                      <p className={styles.specText}>
                        <strong>Selected time rule:</strong> {card.selectedTimeMeaning}
                      </p>
                    </div>

                    <div className={styles.specBox}>
                      <span className={styles.specLabel}>Pickup &amp; Collection Rules</span>
                      <p className={styles.specText}>{card.pickupVerifiedSummary}</p>
                    </div>

                    <div className={styles.specBox}>
                      <span className={styles.specLabel}>
                        Baggage, Gear &amp; Participation Limits
                      </span>
                      <p className={styles.specText}>{card.baggageAndGearSummary}</p>
                      <p className={styles.specText}>{card.participationRestrictions}</p>
                    </div>

                    <div className={styles.specBox}>
                      <span className={styles.specLabel}>
                        Customer vs. Operator Weather Cancellation
                      </span>
                      <p className={styles.specText}>
                        <strong>Customer cancellation:</strong> {card.customerCancellationSummary}
                      </p>
                      <p className={styles.specText}>
                        <strong>Operator weather cancellation:</strong>{" "}
                        {card.operatorWeatherCancellationSummary}
                      </p>
                    </div>
                  </div>

                  {card.heldClaims.length > 0 && (
                    <div
                      className={styles.heldClaimsWrap}
                      data-testid={`jfd-held-claims-${card.cardId}`}
                    >
                      <p className={styles.heldTitle}>
                        Held / Confirm-Before-Booking Channel Details ({card.heldClaims.length})
                      </p>
                      {card.heldClaims.map((hold) => (
                        <div key={hold.holdId} style={{ fontSize: "0.85rem", lineHeight: 1.54 }}>
                          <strong>
                            [{hold.holdId}] {hold.scope}:
                          </strong>{" "}
                          {hold.reason}{" "}
                          <span style={{ color: "#ffd596" }}>
                            <strong>Action:</strong> {hold.travelerActionRequired}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className={styles.operatorFooterBar}>
                    <div style={{ maxWidth: 680, display: "grid", gap: 4 }}>
                      <span style={{ fontSize: "0.8rem", color: "rgba(228, 239, 246, 0.82)" }}>
                        {card.commissionDisclosure}
                      </span>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 14px" }}>
                        <a
                          href={card.officialOperatorSourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.sourceInlineLink}
                        >
                          Official operator tour page ↗
                        </a>
                        <a href={card.lfseOperatorHref} className={styles.sourceInlineLink}>
                          DCC / Last Frontier operator profile ↗
                        </a>
                      </div>
                    </div>

                    <a
                      href={sellerHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.sellerBtn}
                      data-testid={`jfd-seller-cta-${card.cardId}`}
                    >
                      {card.handoffConfig.ctaLabel}
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* SECTION 5: FAQ & RELATED JFD GUIDES */}
        <section
          className={styles.sectionCard}
          aria-labelledby="uncruise-faq-heading"
          data-testid="jfd-uncruise-faq-section"
        >
          <div>
            <p className={styles.eyebrow}>Common Questions</p>
            <h2 id="uncruise-faq-heading" className={styles.sectionHeading}>
              Frequently Asked Questions for UnCruise &amp; Juneau Hotel Guests
            </h2>
          </div>

          <div className={styles.twoColGrid}>
            {UNCRUISE_GUIDE_FAQS.map((item) => (
              <article key={item.question} className={styles.infoPanel}>
                <h3 style={{ margin: 0, fontSize: "1.02rem", color: "#ffffff" }}>
                  {item.question}
                </h3>
                <p className={styles.specText}>{item.answer}</p>
              </article>
            ))}
          </div>

          <div
            style={{
              paddingTop: 8,
              borderTop: "1px solid rgba(151, 211, 255, 0.14)",
              display: "flex",
              flexWrap: "wrap",
              gap: "10px 18px",
              fontSize: "0.88rem",
            }}
          >
            <span style={{ fontWeight: 800, color: "#9ed9ff" }}>Related Juneau Flight Deck Guides:</span>
            <Link href="/temsco-vs-coastal-vs-northstar-juneau" className={styles.sourceInlineLink}>
              TEMSCO vs. Coastal vs. NorthStar Full Comparison
            </Link>
            <Link
              href="/juneau-helicopter-tour-weight-limits-and-seating"
              className={styles.sourceInlineLink}
            >
              Weight Limits &amp; Aircraft Seating Rules
            </Link>
            <Link href="/juneau-glacier-flight-weather" className={styles.sourceInlineLink}>
              Juneau Icefield Weather &amp; FAA Cams
            </Link>
            <Link
              href="/juneau/what-to-do-if-helicopter-tour-canceled"
              className={styles.sourceInlineLink}
            >
              What to Do If Weather Cancels Your Flight
            </Link>
          </div>
        </section>

        {/* SECTION 6: CLAIM-TO-SOURCE LEDGER & FRESHNESS */}
        <section
          className={styles.sectionCard}
          aria-labelledby="claim-ledger-heading"
          data-testid="jfd-uncruise-evidence-ledger"
        >
          <div>
            <p className={styles.eyebrow}>
              Claim-to-Source Ledger · Channel Separation &amp; Freshness
            </p>
            <h2 id="claim-ledger-heading" className={styles.sectionHeading}>
              Primary-Source Citations &amp; Held Channel Claims
            </h2>
            <p className={styles.sectionSub}>
              Operator tariffs were verified on {VERIFIED_TARIFF_DATE_LONG}, and UnCruise Juneau
              turnaround, baggage, transfer, and operator pickup/cancellation texts were checked
              against primary public pages on {UNCRUISE_PRIMARY_RETRIEVAL_DATE_LONG}. Automated
              retrieval is recorded distinctly from human editorial attestation.
            </p>
          </div>

          <div className={styles.ledgerGrid}>
            {UNCRUISE_CLAIM_SOURCE_LEDGER.map((row) => (
              <div key={row.claimId} className={styles.ledgerCard}>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    justifyContent: "space-between",
                    gap: 8,
                  }}
                >
                  <strong style={{ color: "#ffffff" }}>
                    [{row.claimId}] {row.subject} — {row.channelScope}
                  </strong>
                  <span style={{ color: "#ffd596", fontWeight: 700, fontSize: "0.78rem" }}>
                    Retrieved {row.retrievedDate} · {row.verificationState}
                  </span>
                </div>
                <div>{row.claimSummary}</div>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    justifyContent: "space-between",
                    gap: 8,
                    fontSize: "0.8rem",
                    color: "rgba(228, 239, 246, 0.78)",
                  }}
                >
                  <a
                    href={row.primarySourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.sourceInlineLink}
                  >
                    Primary source: {row.primarySourceUrl} ↗
                  </a>
                  <span>Attestation note: {row.humanAttestationNote}</span>
                </div>
              </div>
            ))}
          </div>

          <SourcesAndFreshness>
            <p style={{ margin: 0 }}>
              <strong>UnCruise Turnaround &amp; Fare Terms (checked {UNCRUISE_PRIMARY_RETRIEVAL_DATE_LONG}):</strong>{" "}
              UnCruise fare inclusions, exclusions, and Juneau 76 Egan Drive hospitality, luggage,
              and flight-time cutoffs reference{" "}
              <a
                href="https://uncruise.com/pages/terms-conditions"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#9ed9ff", textDecoration: "underline" }}
              >
                UnCruise Terms &amp; Conditions ↗
              </a>{" "}
              and{" "}
              <a
                href="https://uncruise.com/pages/prepare-for-your-cruise-alaska"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#9ed9ff", textDecoration: "underline" }}
              >
                Prepare for Your Cruise: Alaska ↗
              </a>
              . Always verify your voyage’s final e-documents (~45 days pre-departure) for any
              vessel-specific schedule updates.
            </p>
          </SourcesAndFreshness>
        </section>
      </div>
    </main>
  );
}
