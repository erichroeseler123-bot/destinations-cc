import {
  buildPortfolioHandoffUrl,
  evaluatePortfolioAssuranceSummary,
  resolvePortfolioTripContext,
} from "@/lib/dcc/commerce/portfolio";
import { SITE_DESCRIPTION } from "@/lib/sitePositioning";
import {
  LFSE_CANONICAL_LINKS,
  TWO_HOUR_BUFFER_CLARIFICATION,
  VERBATIM_TWO_HOUR_BUFFER_RULE,
  VERIFIED_TARIFF_DATE_LONG,
  type OperatorKey,
} from "@/lib/verifiedOperatorPricing";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import HelicopterWaitlistForm from "./components/HelicopterWaitlistForm";
import OperatorIdentityMark from "./components/OperatorIdentityMark";
import SourcesAndFreshness from "./components/SourcesAndFreshness";
import styles from "./home.module.css";

export const metadata: Metadata = {
  title: {
    absolute: "Juneau Helicopter Tours & Glacier Flights | Juneau Flight Deck",
  },
  description: SITE_DESCRIPTION,
  alternates: { canonical: "https://juneauflightdeck.com/" },
  openGraph: {
    title: "Juneau Helicopter Tours & Glacier Flights | Juneau Flight Deck",
    description: SITE_DESCRIPTION,
    url: "https://juneauflightdeck.com/",
    siteName: "Juneau Flight Deck",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Juneau Helicopter Tours & Glacier Flights | Juneau Flight Deck",
    description: SITE_DESCRIPTION,
  },
};

const CP =
  "https://cruisepromenade.com/?utm_source=juneauflightdeck&utm_medium=referral&utm_campaign=alaska_cruise_planning";

export default async function HomePage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  let cookieCtx: string | null = null;
  try {
    const cookieStore = await cookies();
    cookieCtx =
      cookieStore.get("jfd_checkout_session")?.value ||
      cookieStore.get("dcc_trip_ctx")?.value ||
      null;
  } catch {
    cookieCtx = null;
  }

  const carriedContext = await resolvePortfolioTripContext({
    searchParams: resolvedSearchParams,
    cookieContextId: cookieCtx,
    claimingOwner: "juneauflightdeck.com",
    issueIfParamsPresent: true,
    defaultPortSlug: "juneau",
  });

  const assurance = evaluatePortfolioAssuranceSummary({
    engineId: "juneau-helicopter-tours",
    inputs: {
      portDurationMinutes: 360,
      partySize: carriedContext.payload.partySize || 2,
      maxPassengerWeightLbs: 210,
      scubaWithin24h: false,
    },
    callerClientId: "ssr:juneauflightdeck.com",
  });

  const coastalViatorHref = buildPortfolioHandoffUrl({
    originatingSite: "juneauflightdeck.com",
    provider: "viator",
    providerAccount: "P00058396",
    productCode: "6251SHOREXICEWALK",
    destinationUrl:
      "https://www.viator.com/tours/Juneau/Juneau-Shore-Excursion-Helicopter-Tour-and-Guided-Icefield-Walk/d941-6251SHOREXICEWALK?pid=P00058396&mcid=42383&medium=api",
    campaign: "jfd-home-coastal-viator",
    contextId: carriedContext.contextId,
    evaluationRunId: assurance.evaluationRunId,
    receiptId: assurance.receiptId,
    intendedDate: carriedContext.payload.date || null,
    partySize: carriedContext.payload.partySize || null,
  });

  const temscoDirectHref = buildPortfolioHandoffUrl({
    originatingSite: "juneauflightdeck.com",
    provider: "direct_operator",
    providerAccount: "temsco-juneau",
    productCode: "temsco-mendenhall-glacier-walk",
    destinationUrl: "https://temscoair.com/juneau-helicopter-tours/mendenhall-glacier/",
    campaign: "jfd-home-temsco-direct",
    contextId: carriedContext.contextId,
    evaluationRunId: assurance.evaluationRunId,
    receiptId: assurance.receiptId,
    intendedDate: carriedContext.payload.date || null,
    partySize: carriedContext.payload.partySize || null,
  });

  const northStarDirectHref = buildPortfolioHandoffUrl({
    originatingSite: "juneauflightdeck.com",
    provider: "direct_operator",
    providerAccount: "northstar-juneau",
    productCode: "northstar-glacier-ice-trek",
    destinationUrl: "https://northstartrekking.com/adventures/helicopter-glacier-trek/",
    campaign: "jfd-home-northstar-direct",
    contextId: carriedContext.contextId,
    evaluationRunId: assurance.evaluationRunId,
    receiptId: assurance.receiptId,
    intendedDate: carriedContext.payload.date || null,
    partySize: carriedContext.payload.partySize || null,
  });

  const featuredFlights: Array<{
    id: string;
    operatorKey: OperatorKey;
    whatItIs: string;
    operator: string;
    title: string;
    whereItGoes: string;
    aircraft: string;
    availability: string;
    duration: string;
    pickup: string;
    price: string;
    priceSub: string;
    scheduleFit: string;
    checkoutProcessor: string;
    weatherRule: string;
    imageSrc: string;
    imageAlt: string;
    imagePosition: string;
    photoCredit: string;
    ctaLabel: string;
    ctaHref: string;
    lfseOperatorHref: string;
    isExternal: boolean;
  }> = [
    {
      id: "coastal-icefield-walk",
      operatorKey: "coastal",
      whatItIs: "Helicopter Flight & Guided Glacier Walk",
      operator: "Coastal Helicopters",
      title: "Icefield Excursion & Herbert Glacier Landing",
      whereItGoes: "Herbert Glacier & Juneau Icefield, Juneau AK",
      aircraft: "Eurocopter AS350 / H125 AStar Helicopter (FAA Part 135)",
      availability: "May – September · Partner booking calendar",
      duration: "~2 hr 35 min door-to-door (~40 min on ice)",
      pickup: "Downtown Juneau Meeting Hub Shuttle → Juneau Airport Heliport",
      price: "$459 Standard",
      priceSub:
        "as of Nov 18, 2026 (1–259 lbs) · $609 (260–299 lbs), $918 (300+ lbs, 2 seats) + CBJ sales tax & fees",
      scheduleFit: "✓ Fits 5.5+ hr Juneau port windows (plan 2+ hr return buffer before all-aboard)",
      checkoutProcessor: "Partner Checkout via Viator (Worry-Free Shore Excursion §20)",
      weatherRule:
        "100% weather refund if clouds or winds cancel flight; 24h cancel on Viator (7+ days direct).",
      imageSrc: "/images/tours/coastal-icefield-landing.jpg",
      imageAlt: "Herbert Glacier blue icefall and Coast Mountains in the Juneau Icefield, Alaska",
      imagePosition: "50% 48%",
      photoCredit: "Photo: Gillfoto / Wikimedia Commons (CC BY-SA 4.0)",
      ctaLabel: "Check partner calendar →",
      ctaHref: coastalViatorHref,
      lfseOperatorHref: LFSE_CANONICAL_LINKS.coastal,
      isExternal: true,
    },
    {
      id: "temsco-mendenhall-walk",
      operatorKey: "temsco",
      whatItIs: "Mendenhall Glacier Helicopter Landing",
      operator: "TEMSCO Helicopters",
      title: "Mendenhall Glacier & Guided Walk",
      whereItGoes: "Mendenhall Glacier & Rainforest Spires, Juneau AK",
      aircraft: "AS350 AStar Turbine Helicopter (FAA Part 135)",
      availability: "May – September · Direct operator calendar",
      duration: "2 hr 15 min door-to-door",
      pickup: "Downtown Juneau Meeting Point → TEMSCO JNU Heliport",
      price: "$449 / person",
      priceSub:
        "ages 2+, as of Nov 18, 2026 · +$150 weight surcharge at 250+ lbs clothed + CBJ sales tax & fees",
      scheduleFit: "✓ Fits 5+ hr Juneau port windows (plan 2+ hr return buffer before all-aboard)",
      checkoutProcessor: "Direct Operator Checkout (TEMSCO Helicopters)",
      weatherRule:
        "100% refund if canceled by operator for weather; 100% direct refund 48h+ prior.",
      imageSrc: "/images/tours/temsco-mendenhall-glacier-walk.jpg",
      imageAlt: "Helicopter landed on Mendenhall Glacier blue ice near Juneau, Alaska",
      imagePosition: "50% 50%",
      photoCredit: "Photo: Robert Raines / Wikimedia Commons (CC BY-SA 2.0)",
      ctaLabel: "Check operator calendar →",
      ctaHref: temscoDirectHref,
      lfseOperatorHref: LFSE_CANONICAL_LINKS.temsco,
      isExternal: true,
    },
    {
      id: "temsco-dog-sledding",
      operatorKey: "temsco",
      whatItIs: "Seasonal Helicopter Glacier Dog Sledding",
      operator: "TEMSCO Helicopters",
      title: "Mendenhall Glacier Dog Sledding",
      whereItGoes: "Upper Glacier Snow Camp, Juneau AK",
      aircraft: "AS350 AStar Helicopter + Husky Team Sled",
      availability: "May – August seasonal snowpack window",
      duration: "2 hr 45 min door-to-door (~1 hr at snow camp)",
      pickup: "Downtown Juneau Meeting Point → Juneau Airport Heliport",
      price: "$759 / person",
      priceSub:
        "ages 2+, as of Nov 18, 2026 · May–Aug seasonal · +$150 at 250+ lbs clothed + CBJ sales tax & fees",
      scheduleFit: "✓ Fits 6+ hr Juneau port windows (plan 2+ hr return buffer) · Concierge check",
      checkoutProcessor: "Human Concierge Review → Official Operator Link",
      weatherRule: "Upper snow camp requires clear mountain ceilings; 100% weather refund.",
      imageSrc: "/images/tours/temsco-glacier-dog-sledding.jpg",
      imageAlt: "Alaskan husky sled dog team harnessed on an Alaska mountain snowfield at alpenglow",
      imagePosition: "55% 62%",
      photoCredit: "Photo: National Park Service (Public Domain)",
      ctaLabel: "Request concierge check ↓",
      ctaHref: "#concierge-request",
      lfseOperatorHref: LFSE_CANONICAL_LINKS.temsco,
      isExternal: false,
    },
    {
      id: "northstar-ice-trek",
      operatorKey: "northstar",
      whatItIs: "Small-Group Helicopter Glacier Trek",
      operator: "NorthStar Trekking",
      title: "Helicopter Glacier Trek (~2 Hours on Ice)",
      whereItGoes: "Mendenhall Glacier Crevasses & Ice Walls, Juneau AK",
      aircraft: "AS350 Helicopter + Mountaineering Crampons & Gear",
      availability: "May – September · Ages 12+ technical trek",
      duration: "4 hr 15 min door-to-door (~2 hrs trekking on glacier)",
      pickup: "Downtown Juneau Meeting Hub → NorthStar Airport Base",
      price: "$599 / person",
      priceSub:
        "ages 12+, as of Nov 18, 2026 (Walkabout 3h 15m: $539) · +$250 at 250+ lbs clothed + CBJ sales tax & fees",
      scheduleFit: "✓ Fits 7+ hr Juneau port calls (plan 2+ hr return buffer before all-aboard)",
      checkoutProcessor: "Direct Operator Checkout (NorthStar Trekking)",
      weatherRule:
        "Boots, crampons & rain gear included; operator weather cancel offers reschedule or full refund (direct voluntary cancel >24h minus 10% admin fee).",
      imageSrc: "/images/tours/northstar-glacier-ice-trek.jpg",
      imageAlt:
        "Guided glacier hiker with crampons and trekking poles exploring sculpted blue glacier ice in Alaska",
      imagePosition: "50% 42%",
      photoCredit: "Photo: National Park Service, Alaska Region (Public Domain)",
      ctaLabel: "Check operator calendar →",
      ctaHref: northStarDirectHref,
      lfseOperatorHref: LFSE_CANONICAL_LINKS.northstar,
      isExternal: true,
    },
  ];

  return (
    <main id="main-content" className={styles.pageWrap}>
      {/* SECTION 2: Destination Hero */}
      <section className={styles.hero} aria-labelledby="jfd-hero-heading">
        <Image
          src="/images/juneau-helicopter-hero.jpg"
          alt="Flightseeing helicopter soaring above an expansive Alaska glacier valley and snow-capped peaks"
          fill
          priority
          sizes="100vw"
          className={styles.heroImage}
        />
        <div className={styles.heroScrim} aria-hidden="true" />
        <div className={`${styles.container} ${styles.heroInner}`}>
          <div className={styles.heroCopy}>
            <div className={styles.heroBadges}>
              <span className={styles.goldBadge}>Independent Flight Guide &amp; Concierge</span>
              <span className={styles.glacierBadge}>Compare TEMSCO · Coastal · NorthStar</span>
            </div>
            <h1 id="jfd-hero-heading" className={styles.heroTitle}>
              Touch down on ancient Juneau glacier ice.
              <span className={styles.heroTitleAccent}>Matched to your ship&apos;s port window.</span>
            </h1>
            <p className={styles.heroLead}>
              Juneau Flight Deck is an independent flightseeing education, weather-guidance, and
              concierge planning guide—not an aircraft operator. Compare all three licensed FAA Part
              135 Juneau helicopter operators in one place, verify official base tariffs (as of{" "}
              {VERIFIED_TARIFF_DATE_LONG}), or ask our concierge desk to check dates your cruise
              portal marks sold out.
            </p>
            <div className={styles.heroPrimaryRow}>
              <a href="#featured-flights" className={styles.primaryBtn}>
                Compare verified flights →
              </a>
            </div>
            <div className={styles.heroSecondaryLinks}>
              <a href="#concierge-request" className={styles.heroTextLink}>
                Ship excursion sold out? Request a seat check
              </a>
              <span aria-hidden="true">·</span>
              <Link
                href="/temsco-vs-coastal-vs-northstar-juneau"
                className={styles.heroTextLink}
              >
                Compare all 3 operators
              </Link>
              <span aria-hidden="true">·</span>
              <Link href="/juneau-glacier-flight-weather" className={styles.heroTextLink}>
                Live FAA WeatherCams
              </Link>
            </div>
          </div>

          <aside className={styles.heroFlightCard} aria-label="At-a-glance flight facts">
            <span className={styles.heroCardEyebrow}>
              Flight Brief · Verified {VERIFIED_TARIFF_DATE_LONG}
            </span>
            <ul className={styles.heroFlightFacts}>
              <li>
                <span>Licensed Operators</span>
                <strong>TEMSCO · Coastal · NorthStar</strong>
              </li>
              <li>
                <span>Door-to-door time</span>
                <strong>2 hr 15 min – 4 hr 15 min</strong>
              </li>
              <li>
                <span>Return planning buffer</span>
                <strong>2+ hours before all-aboard</strong>
              </li>
              <li>
                <span>Verified base tariffs</span>
                <strong>$449 – $789 / person (as of Nov 18, 2026)</strong>
              </li>
              <li>
                <span>Taxes &amp; weight rules</span>
                <strong>+ CBJ tax/fees &amp; 250–260+ lb surcharges</strong>
              </li>
            </ul>
          </aside>
        </div>
        <span className={styles.heroPhotoCredit}>
          Photo: Adamcain62 / Wikimedia Commons (CC BY-SA 4.0)
        </span>
      </section>

      {/* SECTION 3: Three-Step How It Works */}
      <section className={styles.howSection} aria-labelledby="jfd-how-heading">
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <p className={styles.eyebrow}>How Independent Flight Planning Works</p>
            <h2 id="jfd-how-heading" className={styles.sectionTitle}>
              From cruise pier to glacier touchdown in three clear steps
            </h2>
            <p className={styles.sectionLead}>
              Cruise lines contract only a block of daily helicopter seats. Independent planning lets
              you compare primary operator tariffs, clothed weight rules, and safe return timing.
            </p>
          </div>

          <div className={styles.stepsGrid}>
            <article className={styles.stepCard}>
              <div className={styles.stepTop}>
                <span className={styles.stepNum}>1</span>
                <span className={styles.stepKicker}>2-Hour Return Standard</span>
              </div>
              <h3>Check your ship&apos;s dock hours</h3>
              <p>
                {VERBATIM_TWO_HOUR_BUFFER_RULE} {TWO_HOUR_BUFFER_CLARIFICATION}
              </p>
            </article>

            <article className={styles.stepCard}>
              <div className={styles.stepTop}>
                <span className={styles.stepNum}>2</span>
                <span className={styles.stepKicker}>Choose Your Glacier</span>
              </div>
              <h3>Pick walk, seasonal dog sled, or trek</h3>
              <p>
                Compare glacier walks ($449 TEMSCO / $459 Coastal base), NorthStar crampon treks
                ($539 Walkabout / $599 Trek), and May–August snow-camp dog sledding ($759–$789 base,
                all as of {VERIFIED_TARIFF_DATE_LONG}).
              </p>
            </article>

            <article className={styles.stepCard}>
              <div className={styles.stepTop}>
                <span className={styles.stepNum}>3</span>
                <span className={styles.stepKicker}>Book or Request Concierge</span>
              </div>
              <h3>Reserve with provider or request a check</h3>
              <p>
                Open the Viator partner calendar or official operator checkout—or submit your ship
                date below so our concierge desk can review alternative departures or{" "}
                <Link
                  href="/skagway/helicopter"
                  style={{ textDecoration: "underline", fontWeight: 700 }}
                >
                  Skagway glacier flights
                </Link>
                .
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* SECTION 4: Featured Experiences */}
      <section
        id="featured-flights"
        className={styles.featuredSection}
        aria-labelledby="jfd-featured-heading"
      >
        <div className={styles.container}>
          <div className={styles.sectionHeaderRow}>
            <div>
              <p className={styles.eyebrow}>
                Verified Glacier Tariffs · As of {VERIFIED_TARIFF_DATE_LONG}
              </p>
              <h2 id="jfd-featured-heading" className={styles.sectionTitle}>
                Compare Juneau helicopter experiences side by side
              </h2>
              <p className={styles.sectionLead}>
                Every card shows verified primary-source base pricing (as of{" "}
                {VERIFIED_TARIFF_DATE_LONG}), clothed weight surcharge rules, CBJ sales tax &amp;
                fee qualifications, weather refund terms, and canonical operator profiles on{" "}
                <a
                  href={LFSE_CANONICAL_LINKS.juneauHelicopterCategory}
                  style={{ textDecoration: "underline", fontWeight: 700, color: "#0369a1" }}
                >
                  Last Frontier Shore Excursions ↗
                </a>
                .
              </p>
            </div>
            <Link href="/helicopter" className={styles.secondaryOutlineLink}>
              View full flight directory →
            </Link>
          </div>

          <div className={styles.flightGrid}>
            {featuredFlights.map((flight) => (
              <article key={flight.id} className={styles.flightCard}>
                <div className={styles.flightImageWrap}>
                  <img
                    src={flight.imageSrc}
                    alt={flight.imageAlt}
                    width={1440}
                    height={900}
                    loading="lazy"
                    className={styles.flightImage}
                    style={{ objectPosition: flight.imagePosition }}
                  />
                  <span className={styles.flightTypeBadge}>{flight.whatItIs}</span>
                  <span className={styles.flightOperatorPill}>{flight.operator}</span>
                  {flight.photoCredit ? (
                    <span className={styles.cardPhotoCredit}>{flight.photoCredit}</span>
                  ) : null}
                </div>

                <div className={styles.flightBody}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 10,
                      flexWrap: "wrap",
                      marginBottom: 6,
                    }}
                  >
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <OperatorIdentityMark operator={flight.operatorKey} size="sm" />
                      <span className={styles.flightWhere} style={{ margin: 0 }}>
                        {flight.whereItGoes}
                      </span>
                    </div>
                    <a
                      href={flight.lfseOperatorHref}
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        color: "#0369a1",
                        textDecoration: "underline",
                      }}
                    >
                      Operator profile ↗
                    </a>
                  </div>

                  <h3 className={styles.flightTitle}>{flight.title}</h3>
                  <div className={styles.scheduleFitBanner}>{flight.scheduleFit}</div>

                  <dl className={styles.detailsGrid}>
                    <div className={styles.detailItem}>
                      <dt>Aircraft</dt>
                      <dd>{flight.aircraft}</dd>
                    </div>
                    <div className={styles.detailItem}>
                      <dt>Duration</dt>
                      <dd>{flight.duration}</dd>
                    </div>
                    <div className={styles.detailItem}>
                      <dt>Meeting &amp; Pickup</dt>
                      <dd>{flight.pickup}</dd>
                    </div>
                    <div className={styles.detailItem}>
                      <dt>Season &amp; Calendar</dt>
                      <dd>{flight.availability}</dd>
                    </div>
                    <div className={styles.detailItem} style={{ gridColumn: "1 / -1" }}>
                      <dt>Checkout Processor</dt>
                      <dd>{flight.checkoutProcessor}</dd>
                    </div>
                  </dl>

                  <p className={styles.weatherNote}>
                    <strong>Weather &amp; Cancellation:</strong> {flight.weatherRule} Glacier
                    overboots or crampons included.
                  </p>

                  <div className={styles.cardFooter}>
                    <div className={styles.priceBlock}>
                      <span className={styles.priceValue}>{flight.price}</span>
                      <span className={styles.priceSub}>{flight.priceSub}</span>
                    </div>
                    {flight.isExternal ? (
                      <a
                        href={flight.ctaHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.cardActionBtn}
                      >
                        {flight.ctaLabel}
                      </a>
                    ) : (
                      <a href={flight.ctaHref} className={styles.cardActionSecondary}>
                        {flight.ctaLabel}
                      </a>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 5: Trust, Weather Limitations, Timing & Concierge Request */}
      <section className={styles.trustSection} aria-labelledby="jfd-trust-heading">
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <p className={styles.eyebrow}>Weather, Weight Rules &amp; Port Backups</p>
            <h2 id="jfd-trust-heading" className={styles.sectionTitle}>
              What to know before flying in Southeast Alaska
            </h2>
            <p className={styles.sectionLead}>
              Mountain ceilings shift quickly in Juneau. Reviewing operator weight balance rules,
              shuttle timing, and{" "}
              <a
                href={LFSE_CANONICAL_LINKS.juneauPort}
                style={{ textDecoration: "underline", fontWeight: 700, color: "#0369a1" }}
              >
                Juneau port backups ↗
              </a>{" "}
              ahead of time protects your port call.
            </p>
          </div>

          <div className={styles.trustGrid}>
            <div className={styles.trustCard}>
              <strong>100% Operator Weather Refund</strong>
              <p>
                Licensed FAA Part 135 pilots fly only when cloud ceilings and visibility meet strict
                VFR margins. Operator weather cancellations receive a full refund under provider
                terms.
              </p>
            </div>
            <div className={styles.trustCard}>
              <strong>Operator Weight Surcharges (Nov 18, 2026)</strong>
              <p>
                Helicopters balance exact clothed passenger weights: TEMSCO adds +$150 at 250+ lbs;
                Coastal prices Standard Plus at $609 (260–299 lbs) and Premium at $918 (300+ lbs, 2
                seats) on Icefield walks; NorthStar adds +$250 at 250+ lbs.
              </p>
            </div>
            <div className={styles.trustCard}>
              <strong>2-Hour Port Return Planning</strong>
              <p>
                {VERBATIM_TWO_HOUR_BUFFER_RULE} Helicopters depart from Juneau Airport or Douglas
                Island (15–20 min shuttle from downtown berths).
              </p>
            </div>
            <div className={styles.trustCard}>
              <strong>Same-Day Weather Backups</strong>
              <p>
                When low clouds ground upper-icefield flights, Auke Bay whale boats still operate
                beneath the ceiling. Bookmark our{" "}
                <Link
                  href="/juneau/what-to-do-if-helicopter-tour-canceled"
                  style={{ textDecoration: "underline", fontWeight: 700, color: "#0369a1" }}
                >
                  canceled-flight guide
                </Link>{" "}
                and{" "}
                <a
                  href={LFSE_CANONICAL_LINKS.juneauWhaleCategory}
                  style={{ textDecoration: "underline", fontWeight: 700, color: "#0369a1" }}
                >
                  Juneau whale-watching directory ↗
                </a>
                .
              </p>
            </div>
          </div>

          <div id="concierge-request" className={styles.conciergeDarkShell}>
            <HelicopterWaitlistForm compact />
          </div>

          <div className={styles.cruiseBanner}>
            <div>
              <h3>Coordinating more than one cabin on your Alaska sailing?</h3>
              <p>
                Share one free port-day board with your group on Cruise Promenade—no app download
                required.
              </p>
            </div>
            <a
              href={CP}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.cruiseBannerBtn}
            >
              Plan the whole cruise →
            </a>
          </div>
        </div>
      </section>

      {/* SECTION 6: Simple FAQ & Sources */}
      <section className={styles.faqSection} aria-labelledby="jfd-faq-heading">
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <p className={styles.eyebrow}>Frequently Asked Questions</p>
            <h2 id="jfd-faq-heading" className={styles.sectionTitle}>
              Quick answers for cruise passengers
            </h2>
          </div>

          <div className={styles.faqList}>
            <details className={styles.faqItem}>
              <summary>Is Juneau Flight Deck a helicopter airline or operator?</summary>
              <p>
                No. Juneau Flight Deck is an independent flightseeing education, weather-guidance,
                and concierge planning site. All glacier helicopter flights in Juneau are operated
                independently by licensed FAA Part 135 carriers—{" "}
                <a
                  href={LFSE_CANONICAL_LINKS.temsco}
                  style={{ textDecoration: "underline", fontWeight: 700, color: "#0369a1" }}
                >
                  TEMSCO Helicopters ↗
                </a>
                ,{" "}
                <a
                  href={LFSE_CANONICAL_LINKS.coastal}
                  style={{ textDecoration: "underline", fontWeight: 700, color: "#0369a1" }}
                >
                  Coastal Helicopters ↗
                </a>
                , and{" "}
                <a
                  href={LFSE_CANONICAL_LINKS.northstar}
                  style={{ textDecoration: "underline", fontWeight: 700, color: "#0369a1" }}
                >
                  NorthStar Trekking ↗
                </a>
                .
              </p>
            </details>

            <details className={styles.faqItem}>
              <summary>How much buffer should I leave before my cruise ship&apos;s all-aboard?</summary>
              <p>
                {VERBATIM_TWO_HOUR_BUFFER_RULE} {TWO_HOUR_BUFFER_CLARIFICATION} Tours marked with
                Viator&apos;s Worry-Free Shore Excursion (§20) badge include separate contractual
                next-port transport terms when booked for a slot ending at least 2 hours before ship
                departure.
              </p>
            </details>

            <details className={styles.faqItem}>
              <summary>What happens if rain, fog, or low clouds cancel our flight?</summary>
              <p>
                Light rain rarely stops flights, but low cloud ceilings or high winds can. Only the
                operator&apos;s pilot and flight dispatcher make the safety call; if the operator
                cancels due to weather, you receive a 100% refund under your booking provider&apos;s
                terms.
              </p>
            </details>

            <details className={styles.faqItem}>
              <summary>What should we wear to walk on the glacier?</summary>
              <p>
                Glacier air is roughly 10–15°F cooler than downtown Juneau. Dress in warm layers
                (fleece or light puffer, long pants, sunglasses, and gloves). Waterproof traction
                overboots or mountaineering crampons are provided at the heliport, and passenger
                weights are measured fully clothed.
              </p>
            </details>
          </div>

          <SourcesAndFreshness tone="light" />
        </div>
      </section>
    </main>
  );
}
