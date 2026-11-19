import type { Metadata } from "next";
import Link from "next/link";
import {
  JFD_CANCELED_BACKUP_URL,
  JFD_GLACIER_WEATHER_URL,
  JFD_WEIGHT_AND_SEATING_URL,
} from "@/components/JuneauFlightDeckPlanningCallout";
import { WeekendInJuneauPlannerClient } from "@/components/WeekendInJuneauPlannerClient";
import { WeekendOutboundLink } from "@/components/WeekendOutboundLink";
import { buildWeekendInJuneauGuideJsonLd } from "@/lib/structuredData";
import {
  GETTING_AROUND_JUNEAU_ROWS,
  JUNEAU_BASE_OPTIONS,
  JUNEAU_EVENING_SPOTS,
  WEATHER_FLEXIBILITY_ROWS,
  WEEKEND_ADVENTURE_CARDS,
  WEEKEND_CLAIM_SOURCE_LEDGER,
  WEEKEND_IN_JUNEAU_CANONICAL_URL,
  WEEKEND_IN_JUNEAU_PATH,
  WEEKEND_IN_JUNEAU_RELEASE_READY,
  WEEKEND_IN_JUNEAU_RETRIEVAL_DATE_ISO,
  WEEKEND_IN_JUNEAU_RETRIEVAL_DATE_LONG,
  WHY_STAY_IN_JUNEAU_PILLARS,
} from "@/lib/weekendInJuneauGuideData";
import rawStyles from "./weekend-in-juneau.module.css";

const styles = (rawStyles ?? {}) as Record<string, string>;

const PAGE_TITLE = "Weekend in Juneau: 2- & 3-Day Fly-In Alaska Stay Guide";
const PAGE_DESCRIPTION =
  "Your Alaska adventure, based in Juneau. Plan a 2- or 3-full-day fly-in stay in Alaska’s roadless capital—comparing downtown vs. valley bases, glaciers, whales, kayaking, walkable evenings, weather flexibility, and a printable plan.";

const isProductionIndexable =
  process.env.VERCEL_ENV === "production" && WEEKEND_IN_JUNEAU_RELEASE_READY;

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: WEEKEND_IN_JUNEAU_PATH,
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
    title: `${PAGE_TITLE} | Last Frontier Shore Excursions`,
    description: PAGE_DESCRIPTION,
    url: WEEKEND_IN_JUNEAU_CANONICAL_URL,
    siteName: "Last Frontier Shore Excursions",
    type: "article",
    images: [
      {
        url: "/images/alaska/juneau-mendenhall.jpg",
        width: 1600,
        height: 1067,
        alt: "Mendenhall Glacier, lake waters, and coastal peaks in Juneau, Alaska",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${PAGE_TITLE} | Last Frontier Shore Excursions`,
    description: PAGE_DESCRIPTION,
    images: ["/images/alaska/juneau-mendenhall.jpg"],
  },
};

export default function WeekendInJuneauGuidePage() {
  const jsonLd = buildWeekendInJuneauGuideJsonLd({
    title: `${PAGE_TITLE} | Last Frontier Shore Excursions`,
    description: PAGE_DESCRIPTION,
    lastModifiedAt: WEEKEND_IN_JUNEAU_RETRIEVAL_DATE_ISO,
  });

  return (
    <main data-testid="lfse-weekend-in-juneau-guide">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* HERO */}
      <section className={styles.guideHero} aria-labelledby="weekend-juneau-h1">
        <div className={`shell ${styles.heroGrid}`}>
          <div>
            <p className="eyebrow">
              Independent Fly-In &amp; Multi-Day Destination Guide · Juneau, Alaska
            </p>
            <h1 id="weekend-juneau-h1" className={styles.heroTitle}>
              Your Alaska Adventure, Based in Juneau
            </h1>
            <p className={styles.heroSubhead}>
              Fly in. Stay a few days. Explore glaciers, watch whales, enjoy the water—and stay for
              the evenings.
            </p>
            <p className={styles.heroBody}>
              Most visitors glimpse Alaska’s capital in a single afternoon. Flying into Juneau
              International Airport (<code>JNU</code>) and settling into one home base for two or
              three full days lets you hike out to Mendenhall Glacier in the morning, watch
              humpback whales in Favorite Channel, paddle sheltered island waters, and walk back to
              neighborhood kitchens and long Gastineau Channel twilights.
            </p>

            <div className={styles.heroActions}>
              <a href="#itinerary-planner" className={styles.heroPrimaryBtn}>
                Build &amp; Print Your 2- or 3-Day Plan ↓
              </a>
              <a href="#where-to-base" className={styles.heroSecondaryBtn}>
                Downtown vs. Valley Base ↓
              </a>
            </div>
          </div>

          <figure className={styles.heroImageCard} style={{ margin: 0 }}>
            <img
              src="/images/alaska/juneau-mendenhall.jpg"
              alt="Mendenhall Glacier face above Mendenhall Lake framed by Tongass mountains in Juneau, Alaska"
              width={1400}
              height={933}
              className={styles.heroImage}
            />
            <figcaption className={styles.heroCaption}>
              <span>Mendenhall Glacier &amp; Tongass National Forest · Juneau, AK</span>
              <span>Photo: Diego Delso (CC BY-SA 4.0)</span>
            </figcaption>
          </figure>
        </div>
      </section>

      {/* SECTION JUMP BAR */}
      <nav className={styles.jumpNav} aria-label="Weekend in Juneau sections">
        <div className={`shell ${styles.jumpRow}`}>
          <a href="#why-stay" className={styles.jumpPill}>
            Why Stay
          </a>
          <a href="#where-to-base" className={styles.jumpPill}>
            Where to Base
          </a>
          <a href="#itinerary-planner" className={styles.jumpPill}>
            2- &amp; 3-Full-Day Plans + Print
          </a>
          <a href="#adventure-choices" className={styles.jumpPill}>
            Adventures &amp; Sellers
          </a>
          <a href="#evenings-in-juneau" className={styles.jumpPill}>
            Evenings &amp; Dining
          </a>
          <a href="#getting-around" className={styles.jumpPill}>
            Getting Around
          </a>
          <a href="#weather-flexibility" className={styles.jumpPill}>
            Weather Flexibility
          </a>
          <a href="#sources-and-freshness" className={styles.jumpPill}>
            Sources &amp; Ledger
          </a>
        </div>
      </nav>

      {/* PILLAR 1: WHY STAY */}
      <section
        id="why-stay"
        className={`${styles.sectionWrap} ${styles.noPrintSection}`}
        aria-labelledby="why-stay-heading"
      >
        <div className="shell">
          <div className={styles.sectionIntro}>
            <p className={styles.sectionKicker}>Why Make Juneau the Destination</p>
            <h2 id="why-stay-heading" style={{ margin: 0, color: "var(--deep)" }}>
              Everyday Alaskan Capital Life Alongside Icefields and Fjord Waters
            </h2>
            <p className={styles.sectionLead}>
              Operating on traditional Áak’w Kwáan Tlingit territory with no highway to the rest of
              North America, Juneau pairs genuine year-round civic and culinary life with immediate
              access to glaciers, rainforest trails, and marine wildlife—without packing and
              unpacking every night.
            </p>
          </div>

          <div className="grid-3">
            {WHY_STAY_IN_JUNEAU_PILLARS.map((pillar) => (
              <article key={pillar.title} className="card">
                <p
                  style={{
                    margin: "0 0 4px",
                    fontSize: 11.5,
                    fontWeight: 800,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "var(--accent)",
                  }}
                >
                  {pillar.kicker}
                </p>
                <h3>{pillar.title}</h3>
                <p style={{ marginBottom: 0 }}>{pillar.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* PILLAR 2: WHERE TO BASE YOURSELF */}
      <section
        id="where-to-base"
        className={`${styles.sectionAlt} ${styles.noPrintSection}`}
        aria-labelledby="where-to-base-heading"
      >
        <div className="shell">
          <div className={styles.sectionIntro}>
            <p className={styles.sectionKicker}>Choosing One Home Base</p>
            <h2 id="where-to-base-heading" style={{ margin: 0, color: "var(--deep)" }}>
              Where to Stay: Walkable Downtown vs. Airport &amp; Mendenhall Valley
            </h2>
            <p className={styles.sectionLead}>
              Juneau’s lodging splits into two distinct corridors separated by roughly 8.5–9 miles
              along Egan Drive. Pick the base that matches whether you prefer car-free evenings on
              foot or suite kitchens right beside the airport, glacier trails, and Auke Bay docks.
            </p>
          </div>

          <div className={styles.baseGrid}>
            {JUNEAU_BASE_OPTIONS.map((base) => (
              <article
                key={base.key}
                className={styles.baseCard}
                data-testid={`lfse-base-card-${base.key}`}
              >
                <div>
                  <span className="chip">{base.shortLabel}</span>
                  <h3 style={{ margin: "10px 0 6px", fontSize: 22, color: "var(--deep)" }}>
                    {base.label}
                  </h3>
                  <p style={{ margin: 0, fontSize: 14.5, color: "var(--muted)" }}>
                    {base.corridorSummary}
                  </p>
                </div>

                <div>
                  <strong style={{ fontSize: 14, color: "var(--deep)" }}>Works well when you want:</strong>
                  <ul style={{ margin: "6px 0 0", paddingLeft: 18, fontSize: 14, lineHeight: 1.55 }}>
                    {base.bestFor.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <strong style={{ fontSize: 14, color: "var(--deep)" }}>
                    Practical transport tradeoffs:
                  </strong>
                  <ul
                    style={{
                      margin: "6px 0 0",
                      paddingLeft: 18,
                      fontSize: 14,
                      lineHeight: 1.55,
                      color: "var(--muted)",
                    }}
                  >
                    {base.transportTradeoffs.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div style={{ display: "grid", gap: 10 }}>
                  <strong style={{ fontSize: 14, color: "var(--deep)" }}>
                    Verified Official Property Examples (checked {WEEKEND_IN_JUNEAU_RETRIEVAL_DATE_LONG}):
                  </strong>
                  {base.verifiedLodgingExamples.map((hotel) => (
                    <div key={hotel.name} className={styles.lodgingBox}>
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          justifyContent: "space-between",
                          gap: 6,
                        }}
                      >
                        <strong style={{ color: "var(--deep)" }}>{hotel.name}</strong>
                        <WeekendOutboundLink
                          href={hotel.officialUrl}
                          telemetryKind="official_reference"
                          operatorName={hotel.name}
                          className={styles.inlineTextLink}
                        >
                          Official hotel site ↗
                        </WeekendOutboundLink>
                      </div>
                      <span style={{ fontSize: 12.5, color: "var(--muted)" }}>{hotel.address}</span>
                      <span>{hotel.verifiedFeatures}</span>
                      <div className={styles.restrictionCallout}>
                        <strong>Know before booking:</strong> {hotel.practicalRestrictions}
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* PILLAR 3 & 8: 2- & 3-FULL-DAY EXAMPLES + PRINTABLE PLAN */}
      <section
        id="itinerary-planner"
        className={styles.sectionWrap}
        aria-labelledby="itinerary-planner-heading"
      >
        <div className="shell">
          <div className={`${styles.sectionIntro} lfse-no-print`}>
            <p className={styles.sectionKicker}>
              Two- &amp; Three-Full-Day Examples · Printable Trip Sheet
            </p>
            <h2 id="itinerary-planner-heading" style={{ margin: 0, color: "var(--deep)" }}>
              Plan Two or Three Full Days (Keeping Travel Days Separate)
            </h2>
            <p className={styles.sectionLead}>
              A weekend in Juneau feels effortless when you separate{" "}
              <strong>Arrival Day and Departure Day</strong> from your{" "}
              <strong>Full Activity Days</strong>. Toggle between 2 full days (3 nights) and 3 full
              days (4 nights) below, match the tips to your lodging base, and print or save a clean
              PDF copy for your trip.
            </p>
          </div>

          <WeekendInJuneauPlannerClient />
        </div>
      </section>

      {/* PILLAR 4: ADVENTURE CHOICES */}
      <section
        id="adventure-choices"
        className={`${styles.sectionAlt} ${styles.noPrintSection}`}
        aria-labelledby="adventure-choices-heading"
      >
        <div className="shell">
          <div className={styles.sectionIntro}>
            <p className={styles.sectionKicker}>
              Supported Juneau Experiences · Operator &amp; Seller Identified
            </p>
            <h2 id="adventure-choices-heading" style={{ margin: 0, color: "var(--deep)" }}>
              Choose Your Juneau Adventures: Icefield, Whales, Kayaking &amp; Trails
            </h2>
            <p className={styles.sectionLead}>
              Every card below identifies the actual operating company separately from the booking
              channel, scopes published pricing and rules to the date checked, and places weight,
              baggage, and mobility restrictions right beside the booking link. Outbound clicks open
              seller calendars—they are not confirmed bookings, and we never fabricate package
              pricing or “best” rankings.
            </p>
          </div>

          <div className={styles.adventureGrid}>
            {WEEKEND_ADVENTURE_CARDS.map((card) => (
              <article
                key={card.id}
                className={styles.adventureCard}
                data-testid={`lfse-adventure-card-${card.id}`}
              >
                <img
                  src={card.imageSrc}
                  alt={card.imageAlt}
                  width={1200}
                  height={800}
                  loading="lazy"
                  className={styles.adventureImg}
                />
                <div className={styles.adventureBody}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
                    <span className="chip">{card.categoryLabel}</span>
                    <span className={styles.sellerPill}>{card.sellerLabel}</span>
                  </div>

                  <h3 style={{ margin: 0, fontSize: 20, color: "var(--deep)", lineHeight: 1.26 }}>
                    {card.title}
                  </h3>

                  <p style={{ margin: 0, fontSize: 13.5, color: "var(--forest)", fontWeight: 700 }}>
                    Operating provider(s): {card.operatorName} · {card.applicableDateLabel}
                  </p>

                  <p style={{ margin: 0, fontSize: 14, lineHeight: 1.56, color: "var(--ink)" }}>
                    {card.publishedFactSummary}
                  </p>

                  <div className={styles.restrictionCallout}>
                    <strong>Logistics &amp; participation notes:</strong>{" "}
                    {card.restrictionsAndLogistics}
                  </div>

                  <p style={{ margin: 0, fontSize: 12.2, color: "var(--muted)", lineHeight: 1.45 }}>
                    {card.commissionDisclosure} · {card.imageCredit}
                  </p>

                  {card.primaryCta && (
                    <div style={{ paddingTop: 4 }}>
                      <WeekendOutboundLink
                        href={card.primaryCta.href}
                        telemetryKind="seller_handoff"
                        operatorName={card.operatorName}
                        sellerChannel={card.sellerLabel}
                        provider={card.primaryCta.provider}
                        productCode={card.primaryCta.productCode}
                        campaign={card.primaryCta.campaign}
                        className={styles.primarySellerBtn}
                        testId={`lfse-seller-cta-${card.id}`}
                      >
                        {card.primaryCta.label}
                      </WeekendOutboundLink>
                    </div>
                  )}

                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 14px", paddingTop: 2 }}>
                    {card.secondaryLinks.map((lnk) =>
                      lnk.kind === "lfse_internal" ? (
                        <Link key={lnk.href} href={lnk.href} className={styles.inlineTextLink}>
                          {lnk.label} →
                        </Link>
                      ) : (
                        <WeekendOutboundLink
                          key={lnk.href}
                          href={lnk.href}
                          telemetryKind={
                            lnk.kind === "jfd_guide" ? "jfd_guide" : "official_reference"
                          }
                          operatorName={card.operatorName}
                          campaign={`lfse-weekend-${card.id}`}
                          className={styles.inlineTextLink}
                        >
                          {lnk.label}
                        </WeekendOutboundLink>
                      ),
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Dedicated Network Aviation Callout (Tracked JFD Handoffs) */}
          <aside
            className="lfse-jfd-callout"
            data-testid="juneau-flight-deck-planning-callout"
            style={{ marginTop: 28 }}
          >
            <div className="lfse-jfd-callout-header">
              <span className="badge badge-safety">
                Juneau Flight Deck · Deeper Aviation Comparisons
              </span>
              <h3>Comparing Helicopter Landings, Ice Treks &amp; Weather Ceilings?</h3>
              <p>
                Our sister aviation guide{" "}
                <WeekendOutboundLink
                  href="https://juneauflightdeck.com"
                  telemetryKind="jfd_guide"
                  campaign="lfse-weekend-jfd-home"
                >
                  Juneau Flight Deck ↗
                </WeekendOutboundLink>{" "}
                maintains dedicated side-by-side operator comparisons, clothed weight-balance tables,
                and FAA weather-camera resources for Juneau flightseeing:
              </p>
            </div>
            <div className="lfse-jfd-links-grid">
              <WeekendOutboundLink
                href="https://juneauflightdeck.com/temsco-vs-coastal-vs-northstar-juneau"
                telemetryKind="jfd_guide"
                campaign="lfse-weekend-jfd-3way-compare"
                className="lfse-jfd-link-card"
              >
                <strong>TEMSCO vs. Coastal vs. NorthStar Comparison ↗</strong>
                <span>
                  Compare Mendenhall vs. Herbert Glacier landings, 1–2 hr NorthStar crampon treks,
                  and direct operator checkout links.
                </span>
              </WeekendOutboundLink>
              <WeekendOutboundLink
                href={JFD_GLACIER_WEATHER_URL}
                telemetryKind="jfd_guide"
                campaign="lfse-weekend-jfd-weather"
                className="lfse-jfd-link-card"
              >
                <strong>Juneau VFR Ceiling &amp; FAA Weather-Cam Guide ↗</strong>
                <span>
                  Understand how cloud ceilings and mountain winds affect morning vs. afternoon
                  icefield dispatch.
                </span>
              </WeekendOutboundLink>
              <WeekendOutboundLink
                href={JFD_WEIGHT_AND_SEATING_URL}
                telemetryKind="jfd_guide"
                campaign="lfse-weekend-jfd-weights"
                className="lfse-jfd-link-card"
              >
                <strong>Helicopter Weight Limits &amp; Seating Rules ↗</strong>
                <span>
                  Review 250–260 lb clothed weight surcharge tiers and 6-passenger cabin balance
                  rules before booking.
                </span>
              </WeekendOutboundLink>
              <WeekendOutboundLink
                href={JFD_CANCELED_BACKUP_URL}
                telemetryKind="jfd_guide"
                campaign="lfse-weekend-jfd-canceled-backup"
                className="lfse-jfd-link-card"
              >
                <strong>What to Do If Clouds Cancel Your Flight ↗</strong>
                <span>
                  Same-day Juneau weather-cancellation backup options and 100% operator weather
                  refund policies.
                </span>
              </WeekendOutboundLink>
            </div>
          </aside>
        </div>
      </section>

      {/* PILLAR 5: EVENINGS IN JUNEAU */}
      <section
        id="evenings-in-juneau"
        className={`${styles.sectionWrap} ${styles.noPrintSection}`}
        aria-labelledby="evenings-heading"
      >
        <div className="shell">
          <div className={styles.sectionIntro}>
            <p className={styles.sectionKicker}>Stay for the Evenings</p>
            <h2 id="evenings-heading" style={{ margin: 0, color: "var(--deep)" }}>
              Dinner Tables, Taprooms &amp; Quiet Waterfront Walks After Dusk
            </h2>
            <p className={styles.sectionLead}>
              While summer port schedules vary—and some ships remain docked into late evening—daytime
              bus traffic along South Franklin winds down by dinnertime, leaving neighborhood dining
              rooms on Seward and Second Streets, Historic Merchants Wharf, and Overstreet Park’s
              waterfront boardwalk unhurried under long northern twilight.
            </p>
          </div>

          <div className={styles.eveningGrid}>
            {JUNEAU_EVENING_SPOTS.map((spot) => (
              <article key={spot.name} className={styles.eveningCard}>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    justifyContent: "space-between",
                    gap: 8,
                    alignItems: "baseline",
                  }}
                >
                  <h3 style={{ margin: 0, fontSize: 19, color: "var(--deep)" }}>{spot.name}</h3>
                  <WeekendOutboundLink
                    href={spot.officialUrl}
                    telemetryKind="official_reference"
                    operatorName={spot.name}
                    className={styles.inlineTextLink}
                  >
                    Official site ↗
                  </WeekendOutboundLink>
                </div>
                <span style={{ fontSize: 12.5, color: "var(--forest)", fontWeight: 700 }}>
                  {spot.neighborhood} · {spot.address}
                </span>
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: "var(--ink)" }}>
                  {spot.whatToExpect}
                </p>
                <div
                  style={{
                    background: "#ffffff",
                    border: "1px solid var(--line)",
                    borderRadius: 10,
                    padding: "8px 11px",
                    fontSize: 13,
                    lineHeight: 1.48,
                  }}
                >
                  <strong>Published hours (checked {spot.checkedDate}):</strong>{" "}
                  {spot.verifiedHoursAndSeasonality}
                  <br />
                  <span style={{ color: "var(--muted)" }}>{spot.practicalNote}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* PILLAR 6: GETTING AROUND */}
      <section
        id="getting-around"
        className={`${styles.sectionAlt} ${styles.noPrintSection}`}
        aria-labelledby="getting-around-heading"
      >
        <div className="shell">
          <div className={styles.sectionIntro}>
            <p className={styles.sectionKicker}>Practical Juneau Geography</p>
            <h2 id="getting-around-heading" style={{ margin: 0, color: "var(--deep)" }}>
              Getting Around: What Is Walkable vs. Where You Need Transport
            </h2>
            <p className={styles.sectionLead}>
              Downtown Juneau is compact and walkable on foot, while the airport, heliports,
              Mendenhall Glacier, and Auke Bay boat harbors sit 8.5 to 13 miles north along Egan
              Drive and Glacier Highway.
            </p>
          </div>

          <div className={styles.responsiveTableWrap}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>Juneau Corridor</th>
                  <th>Distance from Downtown</th>
                  <th>Walkable?</th>
                  <th>Transport Options</th>
                  <th>Key Practical Detail</th>
                </tr>
              </thead>
              <tbody>
                {GETTING_AROUND_JUNEAU_ROWS.map((row) => (
                  <tr key={row.corridor}>
                    <td>
                      <strong style={{ color: "var(--deep)" }}>{row.corridor}</strong>
                    </td>
                    <td>{row.distanceFromDowntown}</td>
                    <td>{row.walkableFromDowntown}</td>
                    <td>{row.practicalTransportOptions}</td>
                    <td style={{ color: "var(--muted)" }}>{row.verifiedConstraint}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* PILLAR 7: WEATHER FLEXIBILITY */}
      <section
        id="weather-flexibility"
        className={`${styles.sectionWrap} ${styles.noPrintSection}`}
        aria-labelledby="weather-flexibility-heading"
      >
        <div className="shell">
          <div className={styles.sectionIntro}>
            <p className={styles.sectionKicker}>Temperate Rainforest Reality</p>
            <h2 id="weather-flexibility-heading" style={{ margin: 0, color: "var(--deep)" }}>
              Weather Flexibility Without False Promises
            </h2>
            <p className={styles.sectionLead}>
              Staying two or three full days gives you room to swap indoor, marine, and trail plans
              around Southeast Alaska’s shifting clouds—without ever counting on guaranteed blue
              skies or guaranteed replacement flight seats.
            </p>
          </div>

          <div className={styles.responsiveTableWrap}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>Juneau Sky Condition</th>
                  <th>What Changes</th>
                  <th>Strong Juneau Alternatives</th>
                  <th>Honest Planning Boundary</th>
                </tr>
              </thead>
              <tbody>
                {WEATHER_FLEXIBILITY_ROWS.map((row) => (
                  <tr key={row.condition}>
                    <td>
                      <strong style={{ color: "var(--deep)" }}>{row.condition}</strong>
                    </td>
                    <td>{row.whatPausesOrChanges}</td>
                    <td>{row.strongJuneauAlternatives}</td>
                    <td style={{ color: "var(--muted)" }}>{row.honestBoundary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div
            style={{
              marginTop: 22,
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 800, color: "var(--deep)" }}>
              Explore More Verified Juneau Directory Pages:
            </span>
            <Link href="/ports/juneau" className={styles.inlineTextLink}>
              Juneau Destination &amp; Harbors Hub →
            </Link>
            <Link href="/ports/juneau/whale-watching" className={styles.inlineTextLink}>
              Juneau Whale Watching Comparison →
            </Link>
            <Link href="/ports/juneau/helicopter-glacier-tours" className={styles.inlineTextLink}>
              Juneau Helicopter &amp; Icefield Directory →
            </Link>
            <Link href="/ports/juneau/mendenhall-glacier-tours" className={styles.inlineTextLink}>
              Mendenhall Glacier Tours &amp; Shuttles →
            </Link>
          </div>
        </div>
      </section>

      {/* SOURCES, FRESHNESS & CLAIM LEDGER */}
      <section
        id="sources-and-freshness"
        className={`${styles.sectionAlt} ${styles.noPrintSection}`}
        aria-labelledby="sources-ledger-heading"
      >
        <div className="shell" style={{ display: "grid", gap: 18 }}>
          <div>
            <p className={styles.sectionKicker}>Editorial Provenance &amp; Channel Scope</p>
            <h2 id="sources-ledger-heading" style={{ margin: 0, color: "var(--deep)" }}>
              Sources and Freshness (Checked {WEEKEND_IN_JUNEAU_RETRIEVAL_DATE_LONG})
            </h2>
            <p className={styles.sectionLead}>
              Last Frontier Shore Excursions is an independent Southeast Alaska destination and
              excursion guide—not a tour operator, airline, or hotel. Every lodging, transit,
              restaurant, museum, and activity claim on this page is scoped to the named entity,
              booking channel, and verification date below.
            </p>
          </div>

          <details className={styles.sourcesDetails} open>
            <summary className={styles.sourcesSummary}>
              Sources and freshness — View Claim-to-Source Ledger ({WEEKEND_CLAIM_SOURCE_LEDGER.length} entries)
            </summary>
            <div className={styles.responsiveTableWrap} style={{ marginTop: 14 }}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Operator / Entity</th>
                    <th>Product / Scope</th>
                    <th>Booking / Reference Channel</th>
                    <th>Checked Date</th>
                    <th>Verified Summary &amp; Primary Source</th>
                  </tr>
                </thead>
                <tbody>
                  {WEEKEND_CLAIM_SOURCE_LEDGER.map((entry) => (
                    <tr key={entry.claimId}>
                      <td>
                        <code>{entry.claimId}</code>
                      </td>
                      <td>
                        <strong>{entry.operatorOrEntity}</strong>
                      </td>
                      <td>{entry.productOrScope}</td>
                      <td>{entry.bookingChannel}</td>
                      <td>{entry.applicableDate}</td>
                      <td>
                        {entry.verifiedSummary}{" "}
                        <WeekendOutboundLink
                          href={entry.officialSourceUrl}
                          telemetryKind="official_reference"
                          operatorName={entry.operatorOrEntity}
                          className={styles.inlineTextLink}
                        >
                          Source ↗
                        </WeekendOutboundLink>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </div>
      </section>
    </main>
  );
}
