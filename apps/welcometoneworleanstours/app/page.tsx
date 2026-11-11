import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import {
  buildPortfolioHandoffUrl,
  evaluatePortfolioAssuranceSummary,
  resolvePortfolioTripContext,
} from "@/lib/dcc/commerce/portfolio";
import WnoCategoryShowcase, {
  type WnoHomeTourCard,
} from "./components/WnoCategoryShowcase";

export const metadata: Metadata = {
  title: "Welcome to New Orleans Tours | Bayou, French Quarter, Jazz & History",
  description:
    "Explore curated New Orleans swamp tours, French Quarter walks, food & cocktail tours, live jazz steamboats, and River Road plantations with clear hotel pickup and direct booking.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Welcome to New Orleans Tours | Bayou, French Quarter, Jazz & History",
    description:
      "Explore curated New Orleans swamp tours, French Quarter walks, food & cocktail tours, live jazz steamboats, and River Road plantations.",
    url: "/",
    type: "website",
  },
};

export default async function HomePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = (await searchParams) || {};
  let cookieCtx: string | null = null;
  try {
    const cookieStore = await cookies();
    cookieCtx =
      cookieStore.get("wtno_trip_ctx")?.value ||
      cookieStore.get("dcc_trip_ctx")?.value ||
      null;
  } catch {
    cookieCtx = null;
  }

  const carriedContext = await resolvePortfolioTripContext({
    searchParams: sp,
    cookieContextId: cookieCtx,
    claimingOwner: "welcometoneworleanstours.com",
    issueIfParamsPresent: true,
    defaultPortSlug: "new-orleans",
  });

  const assurance = evaluatePortfolioAssuranceSummary({
    engineId: "new-orleans-city-tours",
    inputs: {
      portSlug: "new-orleans",
      date: carriedContext.payload.date || "2026-11-15",
      partySize: carriedContext.payload.partySize || 2,
    },
    callerClientId: "portfolio:welcometoneworleanstours.com",
  });

  const viatorCityTourHref = buildPortfolioHandoffUrl({
    originatingSite: "welcometoneworleanstours.com",
    provider: "viator",
    providerAccount: "P00058396",
    productCode: "8013P1",
    destinationUrl:
      "https://www.viator.com/tours/New-Orleans/Three-Hour-City-Tour-of-New-Orleans/d675-8013P1?pid=P00058396&mcid=42383&medium=link",
    campaign: "wtno-home-viator",
    sourcePage: "/",
    contextId: carriedContext.contextId,
    evaluationRunId: assurance.evaluationRunId,
    receiptId: assurance.receiptId,
    intendedDate: carriedContext.payload.date || null,
    partySize: carriedContext.payload.partySize || null,
  });

  const gygSwampCruiseHref = buildPortfolioHandoffUrl({
    originatingSite: "welcometoneworleanstours.com",
    provider: "getyourguide",
    providerAccount: "F2MMUUH",
    productCode: "t20064",
    destinationUrl:
      "https://www.getyourguide.com/new-orleans-l375/new-orleans-manchac-swamp-cruise-t20064/?partner_id=F2MMUUH",
    campaign: "wtno-home-gyg",
    sourcePage: "/",
    contextId: carriedContext.contextId,
    evaluationRunId: assurance.evaluationRunId,
    receiptId: assurance.receiptId,
    intendedDate: carriedContext.payload.date || null,
    partySize: carriedContext.payload.partySize || null,
  });

  const featuredTours: WnoHomeTourCard[] = [
    {
      id: "louisiana-tour-company-swamp-tour-hotel-pickup",
      categoryKey: "swamp",
      whatItIs: "Covered Bayou Boat · Swamp Tours",
      title: "Barataria Bayou Swamp Boat with Hotel Pickup",
      whereItGoes: "Barataria Bayou (Crown Point, LA)",
      availability: "Daily · 8:00 AM, 10:20 AM & 12:30 PM pickups",
      duration: "4 hrs door-to-door (~1h 45m on water)",
      pickupLocation: "Hotel Monteleone (214 Royal St) & 13+ French Quarter hotels",
      pickupBadge: "Hotel Pickup Included",
      price: "From $60",
      priceSub: "per adult · $0 booking fee",
      scheduleFit: "✓ Fits morning or afternoon stays & pre-cruise mornings",
      checkoutProcessor: "Checkout via Viator (Louisiana Tour Co.)",
      imageSrc: "/images/travel-markets/new-orleans/hotel-pickup-swamp-boat.png",
      imageAlt: "Covered tour boat cruising through cypress trees in a Louisiana bayou",
      ctaLabel: "View dates & pickup →",
      ctaHref: "/tours/louisiana-tour-company-swamp-tour-hotel-pickup?src=wtonot-home",
      isExternal: false,
    },
    {
      id: "manchac-swamp-cruise-gyg",
      categoryKey: "swamp",
      whatItIs: "Manchac Bayou Cruise · Swamp Tours",
      title: "Manchac Cypress Swamp Pontoon Cruise",
      whereItGoes: "Manchac Swamp Wildlife Refuge, LA",
      availability: "Daily year-round · Live partner calendar",
      duration: "1 hr 30 min boat ride (3.5 hrs w/ transfer)",
      pickupLocation: "Optional Downtown New Orleans shuttle or bayou dock",
      pickupBadge: "Pickup Option",
      price: "From $35",
      priceSub: "self-drive · shuttle upgrade at checkout",
      scheduleFit: "✓ Shaded, calm ride ideal for families & mixed ages",
      checkoutProcessor: "Checkout via GetYourGuide",
      imageSrc: "/images/travel-markets/new-orleans/covered-boat-swamp.png",
      imageAlt: "Shaded pontoon boat gliding across calm Louisiana bayou waters",
      ctaLabel: "Check availability →",
      ctaHref: gygSwampCruiseHref,
      isExternal: true,
    },
    {
      id: "city-tour-of-new-orleans",
      categoryKey: "french-quarter",
      whatItIs: "AC Minibus · French Quarter & Neighborhoods",
      title: "3-Hour French Quarter, Garden District & Cemetery Tour",
      whereItGoes: "French Quarter, Tremé, Esplanade, Garden District & Metairie",
      availability: "Daily morning & afternoon departures",
      duration: "3 hours total",
      pickupLocation: "Selected French Quarter & Downtown hotel zones",
      pickupBadge: "Hotel Pickup Included",
      price: "From $50",
      priceSub: "per person · Southern Style Tours",
      scheduleFit: "✓ Best Day-1 orientation or Port NOLA turnaround morning",
      checkoutProcessor: "Checkout via Viator (Southern Style Tours)",
      imageSrc: "/images/travel-markets/new-orleans/french-quarter-street.jpg",
      imageAlt: "Wrought-iron balconies along a historic French Quarter street in New Orleans",
      ctaLabel: "Check availability →",
      ctaHref: viatorCityTourHref,
      isExternal: true,
    },
    {
      id: "cocktail-walking-tour",
      categoryKey: "food",
      whatItIs: "Guided Walk · Food & Cocktails",
      title: "French Quarter Historic Cocktail & Culinary Walk",
      whereItGoes: "Historic French Quarter Courtyards & Taverns",
      availability: "Afternoons · Check live operator calendar",
      duration: "2 hr 15 min guided walk",
      pickupLocation: "Walk-up meeting at 400 Toulouse St (French Quarter)",
      pickupBadge: "Walk-Up · French Quarter",
      price: "From $28",
      priceSub: "per guest (ages 21+ · drinks purchased on route or upgrade)",
      scheduleFit: "✓ Easy afternoon fit before French Quarter dinner",
      checkoutProcessor: "Checkout via FareHarbor (Gray Line)",
      imageSrc: "/images/wikimedia/originals/gumbo-dish.jpg",
      imageAlt: "Classic New Orleans Creole gumbo and French Quarter culinary flavors",
      ctaLabel: "View times & rates →",
      ctaHref: "/tours/cocktail-walking-tour?src=wtonot-home",
      isExternal: false,
    },
    {
      id: "evening-jazz-cruise",
      categoryKey: "music",
      whatItIs: "Paddlewheel Riverboat · Jazz & Music",
      title: "Steamboat Natchez Evening Live Jazz Cruise",
      whereItGoes: "Mississippi Riverfront & New Orleans Skyline",
      availability: "Nightly · Boards 6:00 PM, sails 7:00 – 9:00 PM",
      duration: "2 hours on the river",
      pickupLocation: "Toulouse St. Wharf (behind JAX Brewery, French Quarter)",
      pickupBadge: "Walk-Up · Riverfront",
      price: "From $58",
      priceSub: "sightseeing · optional Creole dinner seating",
      scheduleFit: "✓ Signature New Orleans evening with live jazz quintet",
      checkoutProcessor: "Checkout via FareHarbor (Steamboat Natchez)",
      imageSrc: "/images/travel-markets/new-orleans/steamboat-natchez.jpg",
      imageAlt: "Steamboat Natchez paddlewheeler on the Mississippi River in New Orleans",
      ctaLabel: "Choose seating →",
      ctaHref: "/tours/evening-jazz-cruise?src=wtonot-home",
      isExternal: false,
    },
    {
      id: "whitney-plantation-tour",
      categoryKey: "history",
      whatItIs: "Historic River Road · History",
      title: "Whitney or Oak Alley Plantation Guided Excursion",
      whereItGoes: "Great River Road, Wallace / Vacherie LA",
      availability: "Morning coach departures · Advance booking advised",
      duration: "4.5 – 5.5 hours round-trip",
      pickupLocation: "Coach departure from 400 Toulouse St (French Quarter)",
      pickupBadge: "Round-Trip Coach",
      price: "From $89",
      priceSub: "per adult · admission & coach included",
      scheduleFit: "✓ Half-day commitment · Returns mid-afternoon",
      checkoutProcessor: "Checkout via FareHarbor (Gray Line)",
      imageSrc: "/images/wikimedia/originals/oak-alley-front.jpg",
      imageAlt: "Canopy of centuries-old live oak trees along Louisiana's historic River Road",
      ctaLabel: "Compare & book →",
      ctaHref: "/tours/whitney-plantation-tour?src=wtonot-home",
      isExternal: false,
    },
  ];

  return (
    <div data-wno-remake="v3">
      {/* SECTION 2: Strong Destination Hero with One Primary Action */}
      <section className="wno-hero" aria-labelledby="wno-hero-heading">
        <img
          src="/images/new-orleans/hero-french-quarter-balcony.jpg"
          alt="Sunlit wrought-iron balconies and lush courtyard greenery in the New Orleans French Quarter"
          className="wno-hero-media"
        />
        <div className="wno-hero-scrim" aria-hidden="true" />
        <div className="wno-container wno-hero-grid">
          <div>
            <div className="wno-hero-badges">
              <span className="wno-pill-brass">Curated Local Operators</span>
              <span className="wno-pill-burgundy">Hotel Pickup Clearly Marked</span>
            </div>
            <h1 id="wno-hero-heading" className="wno-hero-title">
              Unmistakably New Orleans.
              <span className="wno-hero-accent">
                Booked around your hotel &amp; schedule.
              </span>
            </h1>
            <p className="wno-hero-lead">
              From shaded cypress bayou boats and River Road plantations to live steamboat jazz and
              French Quarter walks—see real durations, hotel pickup windows, and official checkout
              partners upfront.
            </p>
            <div className="wno-hero-cta-row">
              <a href="#featured-experiences" className="wno-primary-btn">
                Browse tours by category ↓
              </a>
            </div>
            <div className="wno-hero-sublinks">
              <Link href="/help-me-choose">Not sure what fits? Use Help Me Choose</Link>
              <span aria-hidden="true">·</span>
              <a
                href="tel:+15044849687"
                data-wno-event="contact_phone_clicked"
                data-wno-label="504-484-9687"
              >
                Call local desk: 504-484-9687
              </a>
            </div>
          </div>

          <aside className="wno-hero-card" aria-label="Jump directly to a category">
            <span className="wno-hero-card-kicker">Explore by Experience</span>
            <ul className="wno-hero-cat-list">
              <li>
                <Link href="/swamp-tours">
                  <span>Swamp &amp; Airboat Tours</span>
                  <span>From $35 →</span>
                </Link>
              </li>
              <li>
                <Link href="/city-tours">
                  <span>French Quarter &amp; Garden District</span>
                  <span>From $27 →</span>
                </Link>
              </li>
              <li>
                <Link href="/food-tours">
                  <span>Food &amp; Craft Cocktails</span>
                  <span>From $28 →</span>
                </Link>
              </li>
              <li>
                <Link href="/riverboat-cruises">
                  <span>Live Jazz Riverboats</span>
                  <span>From $44 →</span>
                </Link>
              </li>
              <li>
                <Link href="/plantation-tours">
                  <span>History &amp; River Road Plantations</span>
                  <span>From $67 →</span>
                </Link>
              </li>
            </ul>
          </aside>
        </div>
      </section>

      {/* SECTION 3: Three-Step How It Works */}
      <section className="wno-section-white" aria-labelledby="wno-how-heading">
        <div className="wno-container">
          <div className="wno-section-header">
            <p className="wno-eyebrow">How It Works</p>
            <h2 id="wno-how-heading" className="wno-section-title">
              Pick the right New Orleans tour without guesswork
            </h2>
            <p className="wno-section-lead">
              Bayous and plantations sit 35–60 minutes outside the French Quarter, while walks and
              riverboats depart steps from Jackson Square. We make transportation obvious first.
            </p>
          </div>

          <div className="wno-steps-grid">
            <div className="wno-step-card">
              <div className="wno-step-top">
                <span className="wno-step-num">1</span>
                <span className="wno-step-kicker">Pick Your Vibe</span>
              </div>
              <h3>Filter by category</h3>
              <p>
                Browse Swamp Tours, French Quarter sightseeing, Food &amp; Cocktails, Jazz
                steamboats, or River Road History—no generic search clutter.
              </p>
            </div>

            <div className="wno-step-card">
              <div className="wno-step-top">
                <span className="wno-step-num">2</span>
                <span className="wno-step-kicker">Check Pickup &amp; Fit</span>
              </div>
              <h3>Confirm hotel shuttle vs. walk-up</h3>
              <p>
                See immediately whether round-trip French Quarter hotel pickup is included or if
                boarding is a short walk to Toulouse Street Wharf.
              </p>
            </div>

            <div className="wno-step-card">
              <div className="wno-step-top">
                <span className="wno-step-num">3</span>
                <span className="wno-step-kicker">Direct Partner Checkout</span>
              </div>
              <h3>Book with official operators</h3>
              <p>
                Complete your reservation directly through FareHarbor, Viator, or GetYourGuide with
                transparent pricing and instant confirmation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: Featured Experiences by Category (9-Detail Cards) */}
      <section
        id="featured-experiences"
        className="wno-section-cream"
        aria-labelledby="wno-featured-heading"
      >
        <div className="wno-container">
          <div className="wno-section-header-row">
            <div>
              <p className="wno-eyebrow">Featured New Orleans Experiences</p>
              <h2 id="wno-featured-heading" className="wno-section-title">
                Direct tour choices across our five signature categories
              </h2>
              <p className="wno-section-lead">
                Every card shows exact duration, French Quarter pickup status, schedule fit, and the
                checkout provider handling your tickets.
              </p>
            </div>
            <Link href="/tours" className="wno-cat-tab">
              Browse all verified tours →
            </Link>
          </div>

          <WnoCategoryShowcase tours={featuredTours} />
        </div>
      </section>

      {/* SECTION 5: Trust, Hotel Pickup & Timing Information */}
      <section className="wno-section-white" aria-labelledby="wno-trust-heading">
        <div className="wno-container">
          <div className="wno-section-header">
            <p className="wno-eyebrow">Timing, Pickup &amp; Local Trust</p>
            <h2 id="wno-trust-heading" className="wno-section-title">
              Practical New Orleans logistics before you book
            </h2>
          </div>

          <div className="wno-trust-grid">
            <div className="wno-trust-card">
              <strong>French Quarter Hotel Shuttles</strong>
              <p>
                Narrow historic streets restrict large buses—operators pick up at designated Quarter
                corners and major hotels like Hotel Monteleone (214 Royal St) 60–90 minutes before
                launch.
              </p>
            </div>

            <div className="wno-trust-card">
              <strong>Covered Boat vs. Airboat</strong>
              <p>
                Covered boats offer shade, calm water, and all-ages seating; airboats are faster,
                louder, open-air rides typically requiring guests to be ages 5+.
              </p>
            </div>

            <div className="wno-trust-card">
              <strong>Port NOLA Cruise Timing</strong>
              <p>
                Sailing from Erato or Julia Street Cruise Terminal? Stick to 2–3 hour morning city
                tours or pre-cruise hotel nights rather than tight afternoon swamp transfers.
              </p>
            </div>

            <div className="wno-trust-card">
              <strong>Verified Checkout Only</strong>
              <p>
                We link directly to exact operator listings—and pause self-service checkout on any
                tour whose shuttle stops or operator schedule is still being re-verified.
              </p>
            </div>
          </div>

          <div className="wno-concierge-strip">
            <div>
              <h3>Traveling with family, seniors, or a group of 6+?</h3>
              <p>
                Use our interactive chooser or call our local New Orleans tour desk at 504-484-9687
                for schedule help arranged in advance.
              </p>
            </div>
            <Link href="/help-me-choose" className="wno-primary-btn">
              Open Help Me Choose →
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 6: Simple FAQ */}
      <section className="wno-section-cream" aria-labelledby="wno-faq-heading">
        <div className="wno-container">
          <div className="wno-section-header">
            <p className="wno-eyebrow">Frequently Asked Questions</p>
            <h2 id="wno-faq-heading" className="wno-section-title">
              Common questions from first-time visitors
            </h2>
          </div>

          <div className="wno-faq-list">
            <details className="wno-faq-item">
              <summary>Do I need a rental car for swamp or plantation tours?</summary>
              <p>
                No. Most visitors staying in the French Quarter, CBD, or Warehouse District book
                round-trip hotel shuttle packages (usually $25–$30 more per guest than self-drive,
                often cheaper than round-trip rideshares to the bayou).
              </p>
            </details>

            <details className="wno-faq-item">
              <summary>What is the difference between Whitney and Oak Alley Plantation?</summary>
              <p>
                Whitney Plantation is a museum dedicated exclusively to the history and first-person
                accounts of enslaved people in Louisiana. Oak Alley is known for its iconic quarter-mile
                alley of live oaks and Big House architecture alongside enslaved-community exhibits.
              </p>
            </details>

            <details className="wno-faq-item">
              <summary>Who processes payment and sends my tickets?</summary>
              <p>
                Every card states its checkout processor clearly—FareHarbor (direct operator booking
                system), Viator, or GetYourGuide. Your confirmation email, exact pickup time, and
                refund terms come directly from that official provider.
              </p>
            </details>

            <details className="wno-faq-item">
              <summary>Are swamp tours good year-round?</summary>
              <p>
                Boats run year-round. Alligators are most active in warm months (April through
                October), while cooler winter mornings highlight cypress moss scenery, egrets,
                herons, and raccoons—with jackets recommended on open water.
              </p>
            </details>
          </div>
        </div>
      </section>
    </div>
  );
}
