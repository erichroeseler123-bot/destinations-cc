import {
  buildPortfolioHandoffUrl,
  evaluatePortfolioAssuranceSummary,
  resolvePortfolioTripContext,
} from "@/lib/dcc/commerce/portfolio";
import { SITE_DESCRIPTION } from "@/lib/sitePositioning";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import HelicopterWaitlistForm from "./components/HelicopterWaitlistForm";
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
    destinationUrl: "https://temscoair.com/juneau-tours/",
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

  const featuredFlights = [
    {
      id: "coastal-icefield-walk",
      whatItIs: "Helicopter Flight & Guided Glacier Walk",
      operator: "Coastal Helicopters",
      title: "Juneau Icefield Excursion & Herbert Glacier Landing",
      whereItGoes: "Herbert Glacier & Juneau Icefield, Juneau AK",
      aircraft: "Eurocopter AS350 / H125 AStar Helicopter",
      availability: "May – September · Live partner calendar",
      duration: "2 hr 35 min door-to-door (~40 min on ice)",
      pickup: "Downtown Juneau Cruise Dock Shuttle → Juneau Airport Heliport",
      price: "From $459",
      priceSub: "per person · +$150 surcharge at 260–299 lbs",
      scheduleFit: "✓ Fits 5.5+ hr Juneau port windows (90+ min return buffer)",
      checkoutProcessor: "Checkout via Viator (Worry-Free Shore Excursion §20)",
      weatherRule: "100% refund if low clouds or winds cancel flight operations.",
      imageSrc: "/images/tours/coastal-icefield-landing.jpg",
      imageAlt: "Aerial panorama of Juneau Icefield crevasses and glacier icefalls",
      photoCredit: null,
      ctaLabel: "Check availability →",
      ctaHref: coastalViatorHref,
      isExternal: true,
    },
    {
      id: "temsco-mendenhall-walk",
      whatItIs: "Mendenhall Glacier Helicopter Landing",
      operator: "TEMSCO Helicopters",
      title: "Mendenhall Glacier Flight & Guided Blue-Ice Walk",
      whereItGoes: "Mendenhall Glacier & Rainforest Spires, Juneau AK",
      aircraft: "AS350 AStar Turbine Helicopter (FAA Part 135)",
      availability: "May – September · Direct operator calendar",
      duration: "2 hr 15 min door-to-door (~25 min on glacier)",
      pickup: "Downtown Juneau Pier Transfer → TEMSCO JNU Heliport",
      price: "From $449",
      priceSub: "per person · +$150 surcharge above 250 lbs",
      scheduleFit: "✓ Fits 5+ hr Juneau port windows (90+ min return buffer)",
      checkoutProcessor: "Direct Operator Checkout (TEMSCO Helicopters)",
      weatherRule: "Full refund on operator weather cancellations; 48h advance change window.",
      imageSrc: "/images/tours/temsco-mendenhall-glacier-walk.jpg",
      imageAlt: "Helicopter landed on Mendenhall Glacier blue ice near Juneau, Alaska",
      photoCredit: "Photo: Robert Raines / Wikimedia Commons (CC BY-SA 2.0)",
      ctaLabel: "Check availability →",
      ctaHref: temscoDirectHref,
      isExternal: true,
    },
    {
      id: "temsco-dog-sledding",
      whatItIs: "Helicopter Glacier Dog Sledding",
      operator: "TEMSCO Helicopters",
      title: "High-Snowfield Husky Sled Camp by Helicopter",
      whereItGoes: "Upper Mendenhall Glacier Snow Camp, Juneau AK",
      aircraft: "AS350 AStar Helicopter + Husky Team Sled",
      availability: "Mid-May – Late August · High sell-out demand",
      duration: "2 hr 45 min door-to-door (~1 hr at snow camp)",
      pickup: "Downtown Cruise Docks → Juneau Airport Heliport",
      price: "From $699",
      priceSub: "per person · +$150 surcharge above 250 lbs",
      scheduleFit: "✓ Fits 6+ hr Juneau port windows · Request concierge seat check",
      checkoutProcessor: "Human Concierge Review → Official Operator Link",
      weatherRule: "High-elevation snow camp requires clear upper ceilings; 100% weather refund.",
      imageSrc: "/images/tours/temsco-glacier-dog-sledding.jpg",
      imageAlt: "Alaskan husky dog sled team and musher on a Juneau glacier snowfield",
      photoCredit: null,
      ctaLabel: "Request this flight ↓",
      ctaHref: "#concierge-request",
      isExternal: false,
    },
    {
      id: "northstar-ice-trek",
      whatItIs: "Small-Group Helicopter Glacier Trek",
      operator: "NorthStar Trekking",
      title: "Level 1 Glacier Ice Trek (2 Full Hours on Ice)",
      whereItGoes: "Deep Mendenhall Glacier Crevasses & Ice Walls, Juneau AK",
      aircraft: "AS350 Helicopter + Mountaineering Crampons & Gear",
      availability: "May – September · Ages 12+ active hike",
      duration: "4 hr 15 min door-to-door (2 hrs hiking on glacier)",
      pickup: "Downtown Juneau Cruise Berth → NorthStar Heliport Base",
      price: "From $549",
      priceSub: "per person · +$150 surcharge above 250 lbs",
      scheduleFit: "✓ Fits 6.5+ hr Juneau port calls (90+ min return buffer)",
      checkoutProcessor: "Direct Operator Checkout (NorthStar Trekking)",
      weatherRule: "All boots, crampons & rain gear included; full refund if weather cancels.",
      imageSrc: "/images/tours/northstar-glacier-ice-trek.jpg",
      imageAlt: "Guided mountaineering trek across blue glacier ice near Juneau",
      photoCredit: null,
      ctaLabel: "Check availability →",
      ctaHref: northStarDirectHref,
      isExternal: true,
    },
  ];

  return (
    <main id="main-content" className={styles.pageWrap}>
      {/* SECTION 2: Strong Destination Hero with One Primary Action */}
      <section className={styles.hero} aria-labelledby="jfd-hero-heading">
        <Image
          src="/images/tours/temsco-mendenhall-glacier-walk.jpg"
          alt="Helicopter landed on ancient blue glacier ice beneath coastal peaks in Juneau, Alaska"
          fill
          priority
          sizes="100vw"
          className={styles.heroImage}
        />
        <div className={styles.heroScrim} aria-hidden="true" />
        <div className={`${styles.container} ${styles.heroInner}`}>
          <div className={styles.heroCopy}>
            <div className={styles.heroBadges}>
              <span className={styles.goldBadge}>Juneau Aviation Concierge</span>
              <span className={styles.glacierBadge}>TEMSCO · Coastal · NorthStar</span>
            </div>
            <h1 id="jfd-hero-heading" className={styles.heroTitle}>
              Touch down on ancient Juneau glacier ice.
              <span className={styles.heroTitleAccent}>Matched to your ship&apos;s port window.</span>
            </h1>
            <p className={styles.heroLead}>
              Soar past granite peaks and land directly on Mendenhall or Herbert Glacier. Compare
              every FAA-certified Juneau operator in one place—or ask our concierge desk to check
              dates your cruise ship marks sold out.
            </p>
            <div className={styles.heroPrimaryRow}>
              <a href="#featured-flights" className={styles.primaryBtn}>
                Check availability →
              </a>
            </div>
            <div className={styles.heroSecondaryLinks}>
              <a href="#concierge-request" className={styles.heroTextLink}>
                Ship excursion sold out? Request this flight
              </a>
              <span aria-hidden="true">·</span>
              <Link
                href="/temsco-vs-coastal-vs-northstar-juneau"
                className={styles.heroTextLink}
              >
                Compare all 3 operators
              </Link>
            </div>
          </div>

          <aside className={styles.heroFlightCard} aria-label="At-a-glance flight facts">
            <span className={styles.heroCardEyebrow}>Flight Brief · Juneau, Alaska</span>
            <ul className={styles.heroFlightFacts}>
              <li>
                <span>Aircraft</span>
                <strong>Eurocopter AS350 / H125 AStar</strong>
              </li>
              <li>
                <span>Door-to-door time</span>
                <strong>2 hr 15 min – 4 hr 15 min</strong>
              </li>
              <li>
                <span>Meeting location</span>
                <strong>Downtown Cruise Dock Shuttle</strong>
              </li>
              <li>
                <span>Published base fares</span>
                <strong>$449 – $739 / person</strong>
              </li>
              <li>
                <span>Weather policy</span>
                <strong>100% refund if clouds cancel</strong>
              </li>
            </ul>
          </aside>
        </div>
        <span className={styles.heroPhotoCredit}>
          Photo: Robert Raines / Wikimedia Commons (CC BY-SA 2.0)
        </span>
      </section>

      {/* SECTION 3: Three-Step How It Works */}
      <section className={styles.howSection} aria-labelledby="jfd-how-heading">
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <p className={styles.eyebrow}>How It Works</p>
            <h2 id="jfd-how-heading" className={styles.sectionTitle}>
              From cruise pier to glacier touchdown in three clear steps
            </h2>
            <p className={styles.sectionLead}>
              Cruise lines receive only a block of daily helicopter seats. Independent booking gives
              you transparent aircraft details, direct pricing, and clear return timing.
            </p>
          </div>

          <div className={styles.stepsGrid}>
            <article className={styles.stepCard}>
              <div className={styles.stepTop}>
                <span className={styles.stepNum}>1</span>
                <span className={styles.stepKicker}>Port Window Match</span>
              </div>
              <h3>Check your ship&apos;s dock hours</h3>
              <p>
                Every flight below includes round-trip transfer from downtown Juneau piers to the
                airport heliport with at least a 90-minute buffer before all-aboard.
              </p>
            </article>

            <article className={styles.stepCard}>
              <div className={styles.stepTop}>
                <span className={styles.stepNum}>2</span>
                <span className={styles.stepKicker}>Choose Your Glacier</span>
              </div>
              <h3>Pick walk, dog sled, or ice trek</h3>
              <p>
                Compare gentle 25–40 minute glacier walks, summer husky snow-camp flights, or 2-hour
                guided crampon hikes across Mendenhall and Herbert Glaciers.
              </p>
            </article>

            <article className={styles.stepCard}>
              <div className={styles.stepTop}>
                <span className={styles.stepNum}>3</span>
                <span className={styles.stepKicker}>Book or Request Concierge</span>
              </div>
              <h3>Reserve direct or request a seat check</h3>
              <p>
                Book open seats immediately with Viator or the operator—or submit your ship date so
                our human concierge desk can check newly released seats.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* SECTION 4: Featured Experiences (9-Detail Flight Cards) */}
      <section
        id="featured-flights"
        className={styles.featuredSection}
        aria-labelledby="jfd-featured-heading"
      >
        <div className={styles.container}>
          <div className={styles.sectionHeaderRow}>
            <div>
              <p className={styles.eyebrow}>Featured Glacier Flights</p>
              <h2 id="jfd-featured-heading" className={styles.sectionTitle}>
                Compare Juneau helicopter experiences side by side
              </h2>
              <p className={styles.sectionLead}>
                Every card shows aircraft type, tour length, pier pickup, weight rules, weather
                refund policy, and who processes your checkout.
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
                    loading="lazy"
                    className={styles.flightImage}
                  />
                  <span className={styles.flightTypeBadge}>{flight.whatItIs}</span>
                  <span className={styles.flightOperatorPill}>{flight.operator}</span>
                  {flight.photoCredit ? (
                    <span className={styles.cardPhotoCredit}>{flight.photoCredit}</span>
                  ) : null}
                </div>

                <div className={styles.flightBody}>
                  <p className={styles.flightWhere}>{flight.whereItGoes}</p>
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
                      <dt>Season &amp; Dates</dt>
                      <dd>{flight.availability}</dd>
                    </div>
                    <div className={styles.detailItem} style={{ gridColumn: "1 / -1" }}>
                      <dt>Checkout Processor</dt>
                      <dd>{flight.checkoutProcessor}</dd>
                    </div>
                  </dl>

                  <p className={styles.weatherNote}>
                    <strong>Weather &amp; Gear:</strong> {flight.weatherRule} Glacier overboots
                    included.
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
            <p className={styles.eyebrow}>Weather, Safety &amp; Concierge Support</p>
            <h2 id="jfd-trust-heading" className={styles.sectionTitle}>
              What to know before flying in Southeast Alaska
            </h2>
            <p className={styles.sectionLead}>
              Mountain ceilings shift quickly in Juneau. Knowing weight balance rules, shuttle
              timing, and backup options ahead of time protects your port day.
            </p>
          </div>

          <div className={styles.trustGrid}>
            <div className={styles.trustCard}>
              <strong>100% Weather Refund</strong>
              <p>
                FAA Part 135 pilots fly only when cloud ceilings and visibility meet strict visual
                margins. Operator weather cancellations always receive a full refund.
              </p>
            </div>
            <div className={styles.trustCard}>
              <strong>FAA Weight Balance Rules</strong>
              <p>
                Every helicopter balances exact guest weights (fully clothed). Operators apply a
                published $150 comfort/balance surcharge above 250–260 lbs.
              </p>
            </div>
            <div className={styles.trustCard}>
              <strong>Pier-to-Heliport Shuttles</strong>
              <p>
                Helicopters depart from Juneau International Airport (20 minutes from downtown cruise
                berths), never from the pier itself. Round-trip transfers are included.
              </p>
            </div>
            <div className={styles.trustCard}>
              <strong>Same-Day Weather Backups</strong>
              <p>
                If low clouds ground upper-icefield flights, Auke Bay whale boats still sail beneath
                the ceiling. Keep{" "}
                <Link
                  href="/juneau/what-to-do-if-helicopter-tour-canceled"
                  style={{ textDecoration: "underline", fontWeight: 700, color: "#0369a1" }}
                >
                  our canceled-flight backup guide
                </Link>{" "}
                handy.
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

      {/* SECTION 6: Simple FAQ */}
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
              <summary>Why does my cruise line say sold out when seats still exist?</summary>
              <p>
                Cruise lines contract a fixed allotment of seats months in advance. Local FAA Part
                135 operators (TEMSCO, Coastal, and NorthStar) hold separate direct and partner
                inventory—and also release seats when group blocks adjust.
              </p>
            </details>

            <details className={styles.faqItem}>
              <summary>Will I make it back to my cruise ship on time?</summary>
              <p>
                Yes—every featured tour is built around Juneau cruise schedules with downtown dock
                pickup and a 90+ minute buffer before departure. Tours marked with Viator&apos;s
                Worry-Free Shore Excursion (§20) badge include additional next-port transport
                protection when booked with accurate ship details.
              </p>
            </details>

            <details className={styles.faqItem}>
              <summary>What happens if rain, fog, or low clouds cancel our flight?</summary>
              <p>
                Light rain rarely stops flights, but low cloud ceilings or high winds can. Only the
                pilot and flight dispatcher make the safety call; if the operator cancels due to
                weather, you receive a 100% refund from your booking provider.
              </p>
            </details>

            <details className={styles.faqItem}>
              <summary>What should we wear to walk on the glacier?</summary>
              <p>
                Glacier air is roughly 10–15°F cooler than downtown Juneau. Dress in warm layers
                (fleece or light puffer, long pants, sunglasses, and gloves). Waterproof traction
                overboots or mountaineering crampons are provided at the heliport.
              </p>
            </details>
          </div>
        </div>
      </section>
    </main>
  );
}
