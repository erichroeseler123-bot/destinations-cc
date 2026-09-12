import type { Metadata } from "next";
import Link from "next/link";
import { buildAirportPickupCheckoutHref } from "@/lib/bookingLinks";

export const metadata: Metadata = {
  title: "420 Airport Pickup Denver | Private DEN Airport Transportation",
  description:
    "Private airport pickup and transportation service from Denver International Airport (DEN) to Denver metro, Boulder, and Colorado mountain ski resorts. Reliable curbside pickup at Level 5 Island 2, flat-rate pricing, 1-6 passenger AWD SUVs, and optional 21+ dispensary stop.",
  alternates: { canonical: "https://420friendlyairportpickup.com/denver-airport-pickup" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "420 Airport Pickup Denver | Private DEN Airport Transportation",
    description:
      "Private DEN airport pickup and pre-arranged transportation to Denver metro, Boulder, and Colorado mountain ski resorts with professional drivers and optional 21+ retail stop.",
    url: "https://420friendlyairportpickup.com/denver-airport-pickup",
    type: "website",
  },
};

const PHONE_NUMBER = "(720) 369-6292";
const PHONE_HREF = "tel:17203696292";

export default function DenverAirportPickupPage() {
  const standardBookingHref = buildAirportPickupCheckoutHref({
    product: "airport-pickup",
    sourcePage: "/denver-airport-pickup",
    cta: "book-denver-airport-pickup",
  });

  const friendlyBookingHref = buildAirportPickupCheckoutHref({
    product: "airport-dispensary",
    sourcePage: "/denver-airport-pickup",
    cta: "book-420-friendly-denver-pickup",
  });

  const schemaJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "LocalBusiness",
        "@id": "https://420friendlyairportpickup.com/#local-business",
        name: "420 Friendly Airport Pickup Denver",
        telephone: "+1-720-369-6292",
        url: "https://420friendlyairportpickup.com/denver-airport-pickup",
        email: "contact@gosno.co",
        description:
          "Private airport transportation and pre-arranged pickup service operating from Denver International Airport (DEN) across the Denver metropolitan area and Colorado mountain destinations.",
        address: {
          "@type": "PostalAddress",
          addressLocality: "Denver",
          addressRegion: "CO",
          addressCountry: "US",
        },
        areaServed: [
          { "@type": "City", name: "Denver" },
          { "@type": "City", name: "Boulder" },
          { "@type": "City", name: "Aurora" },
          { "@type": "City", name: "Lakewood" },
          { "@type": "City", name: "Golden" },
          { "@type": "Place", name: "Vail" },
          { "@type": "Place", name: "Breckenridge" },
          { "@type": "Place", name: "Keystone" },
          { "@type": "Place", name: "Beaver Creek" },
          { "@type": "Place", name: "Aspen" },
        ],
        priceRange: "$$",
      },
      {
        "@type": "TaxiService",
        "@id": "https://420friendlyairportpickup.com/denver-airport-pickup#service",
        name: "Denver Airport Pickup Service",
        serviceType: "Private Airport Transportation",
        provider: { "@id": "https://420friendlyairportpickup.com/#local-business" },
        areaServed: "Denver International Airport (DEN)",
        description:
          "Pre-arranged private airport transportation from DEN Jeppesen Terminal Level 5 Island 2 to Denver metro hotels, private residences, and Colorado mountain ski resorts.",
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "Where do I pick up arriving passengers at Denver Airport?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "At Denver International Airport (DEN), private personal passenger pick-up occurs on Terminal Level 4 curbside outside baggage claim. Pre-arranged commercial livery, limousine, and luxury SUV pickups take place exclusively on Terminal Level 5, Island 2 outside doors 507, 511, and 513 on the East Terminal or doors 504, 506, and 510 on the West Terminal.",
            },
          },
          {
            "@type": "Question",
            name: "What level is passenger pickup at Denver International Airport?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Passenger pickup at DEN is split between two levels: Level 4 is for personal private vehicles picking up arriving friends or family curbside. Level 5 is the Ground Transportation level where commercial pickups occur (Island 2 for pre-arranged private car services/limousines, Island 5 for rideshare services like Uber and Lyft).",
            },
          },
          {
            "@type": "Question",
            name: "How do I meet my private driver at DEN airport?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Your private chauffeur tracks your flight status in real time. Once you land and claim your bags at Jeppesen Terminal Level 5 baggage claim, step outside through the designated door onto Level 5, cross the first roadway to Island 2 (Commercial Livery / Limousine), and your driver will pull curbside to assist with luggage and board your private vehicle.",
            },
          },
          {
            "@type": "Question",
            name: "Can the driver stop at a dispensary after airport pickup?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes, for adults age 21 and older, an optional lawful dispensary stop can be pre-planned into your private transfer route. Drivers provide licensed passenger transportation only; cannabis consumption is strictly prohibited inside the vehicle and on airport property.",
            },
          },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaJsonLd) }}
      />

      <main className="site-shell static-page-shell">
        {/* Hero Section */}
        <section className="panel static-page-card" style={{ padding: "40px 32px" }}>
          <p className="eyebrow">Denver International Airport (DEN) · Private Transportation</p>
          <h1 className="static-page-title">Denver Airport Pickup</h1>
          <p className="arrival-line" style={{ color: "var(--accent)" }}>
            Private Pre-Arranged Chauffeur &amp; SUV Transportation from DEN
          </p>
          <p className="entry-snippet" style={{ maxWidth: 820, fontSize: 18, lineHeight: 1.7, color: "var(--copy)" }}>
            Touch down at Denver International Airport and step directly into a private, climate-controlled
            all-wheel-drive SUV or executive passenger van. No shared shuttle detours, no surge pricing, and no
            waiting in crowded taxi ranks. Whether you are heading straight to downtown Denver, Boulder, Front Range
            destinations, or ascending into the Rocky Mountain ski resorts, your private driver meets you at
            Jeppesen Terminal Level 5 for a seamless arrival.
          </p>

          <div className="cta-row" style={{ alignItems: "center", gap: 16 }}>
            <Link href={standardBookingHref} className="button">
              Book Denver Airport Pickup
            </Link>
            <Link href={friendlyBookingHref} className="button-secondary">
              Add Optional 21+ Dispensary Stop
            </Link>
            <a
              href={PHONE_HREF}
              className="button-secondary"
              style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
            >
              <span>Call / Text:</span>
              <strong>{PHONE_NUMBER}</strong>
            </a>
          </div>
        </section>

        {/* Quick Specs / Service Overview */}
        <section className="panel" style={{ marginTop: 24 }}>
          <p className="eyebrow">Service specifications &amp; booking details</p>
          <h2>Everything you need to know about your DEN airport pickup.</h2>
          <div className="trust-grid" style={{ marginTop: 20 }}>
            <div className="trust-item">
              <strong>Who Can Book</strong>
              <p className="muted">
                Solo travelers, couples, families, ski groups, corporate visitors, and vacationers. Adults 21+ can
                optionally include a licensed retail dispensary stop on the confirmed route.
              </p>
            </div>
            <div className="trust-item">
              <strong>Where Driver Meets You</strong>
              <p className="muted">
                Jeppesen Terminal Level 5 (Commercial Ground Transportation Level), Island 2 for Pre-Arranged Liveries
                and Limousines. Driver tracks flight radar and coordinates curbside pickup via phone/text.
              </p>
            </div>
            <div className="trust-item">
              <strong>Destinations Covered</strong>
              <p className="muted">
                Downtown Denver (LoDo, RiNo, Cherry Creek, DTC), Boulder, Golden, Red Rocks, and mountain ski resorts
                including Vail, Beaver Creek, Breckenridge, Keystone, Copper Mountain, Aspen, and Steamboat.
              </p>
            </div>
            <div className="trust-item">
              <strong>Passenger &amp; Luggage Capacity</strong>
              <p className="muted">
                Private AWD SUVs accommodate 1 to 6 passengers comfortably with full luggage plus ski/snowboard bags.
                Executive passenger vans are available for larger groups and heavy expedition gear.
              </p>
            </div>
            <div className="trust-item">
              <strong>Flat-Rate Pricing &amp; Quotes</strong>
              <p className="muted">
                Transparent flat pricing per private vehicle with zero surge multipliers or hidden airport toll fees.
                Book instantly online through our booking lane or call dispatch at {PHONE_NUMBER} for a custom quote.
              </p>
            </div>
            <div className="trust-item">
              <strong>Strict Regulatory Compliance</strong>
              <p className="muted">
                Licensed under Colorado PUC operating authority LL-03577. Private passenger transportation only.
                Strictly no consumption in vehicle or on airport property; no airport delivery of regulated products.
              </p>
            </div>
          </div>
        </section>

        {/* Dedicated Guide: Where do I pick up arriving passengers at Denver Airport? */}
        <section className="panel" id="den-pickup-guide" style={{ marginTop: 24 }}>
          <p className="eyebrow">Terminal navigation &amp; pickup guide</p>
          <h2>Where do I pick up arriving passengers at Denver Airport?</h2>
          <p className="muted" style={{ maxWidth: 840, fontSize: 16, lineHeight: 1.75 }}>
            Denver International Airport (DEN) is the largest airport by land area in North America. Navigating passenger
            pickup can be confusing because the Jeppesen Terminal separates vehicle traffic across three distinct
            vertical roadway levels, and strictly segregates personal vehicles from commercial transportation. Here is the
            exact official procedure for both private family drivers and pre-arranged commercial pickup services.
          </p>

          <div className="card-grid" style={{ marginTop: 24 }}>
            {/* Level 4: Personal Vehicles */}
            <div className="package-card">
              <span className="badge">Level 4</span>
              <h3 style={{ marginTop: 12 }}>Personal Passenger Pick-Up (Friends &amp; Family)</h3>
              <p className="muted">
                If you are driving your personal vehicle to pick up an arriving friend or family member, use{" "}
                <strong>Level 4</strong>.
              </p>
              <ul className="static-page-bullets" style={{ marginTop: 12, fontSize: 14 }}>
                <li>
                  <strong>Curbside Loading:</strong> Level 4 runs along both Terminal East and Terminal West directly
                  outside the lower doors.
                </li>
                <li>
                  <strong>No Active Idling or Parking:</strong> Airport police strictly prohibit parking or unattended
                  waiting at curbside. Vehicles left unattended are immediately ticketed and towed.
                </li>
                <li>
                  <strong>Use the Free Cell Phone Waiting Lot:</strong> Personal drivers should wait in DEN&apos;s Free
                  45-minute Cell Phone Lot (located at 5303 E. 78th Ave, near Final Approach). The lot features free
                  Wi-Fi, flight display screens, restrooms, and food options.
                </li>
                <li>
                  <strong>Coordinate by Door:</strong> Wait in the Cell Phone Lot until the arriving passenger has
                  retrieved all checked luggage, walked out to Level 4, and texted you their exact door number (e.g.,
                  Door 404 West or Door 411 East). It takes approximately 4–5 minutes to drive from the Cell Phone Lot to
                  curbside.
                </li>
              </ul>
            </div>

            {/* Level 5: Commercial Ground Transportation */}
            <div className="package-card package-card--featured">
              <span className="badge">Level 5 · Island 2</span>
              <h3 style={{ marginTop: 12 }}>Commercial &amp; Private Chauffeur Pick-Up</h3>
              <p className="muted">
                All licensed commercial transportation providers, private limousines, luxury livery SUVs, and app-based
                rideshares pick up on <strong>Level 5</strong>.
              </p>
              <ul className="static-page-bullets" style={{ marginTop: 12, fontSize: 14 }}>
                <li>
                  <strong>Pre-Arranged Livery / Limousine:</strong> Located on <strong>Island 2</strong> on both East and
                  West sides of Jeppesen Terminal.
                </li>
                <li>
                  <strong>Terminal East Doors:</strong> Step out through Doors <strong>507, 511, or 513</strong>, cross the
                  first pedestrian roadway to Island 2.
                </li>
                <li>
                  <strong>Terminal West Doors:</strong> Step out through Doors <strong>504, 506, or 510</strong>, cross the
                  first pedestrian roadway to Island 2.
                </li>
                <li>
                  <strong>Island 5 for Rideshare:</strong> App-based rideshares (Uber/Lyft) load further out on Island 5,
                  which frequently involves long queues and wait times during peak flight banks.
                </li>
                <li>
                  <strong>Island 1 for Metred Cabs:</strong> Standard taxi stands operate from Island 1.
                </li>
              </ul>
            </div>

            {/* Level 6: Departures */}
            <div className="package-card">
              <span className="badge">Level 6</span>
              <h3 style={{ marginTop: 12 }}>Passenger Drop-Off &amp; Departures Only</h3>
              <p className="muted">
                <strong>Level 6</strong> is exclusively for passenger drop-off, ticketing, check-in, and departures.
              </p>
              <ul className="static-page-bullets" style={{ marginTop: 12, fontSize: 14 }}>
                <li>
                  <strong>No Pickups Allowed:</strong> Arriving passenger pickups are strictly prohibited on Level 6 by
                  airport authority rules.
                </li>
                <li>
                  <strong>Curbside Check-In:</strong> Airline check-in counters and TSA security screening entrances are
                  accessed from this level.
                </li>
                <li>
                  <strong>Return Trips:</strong> When our service drops you off at DEN for your flight home, your driver
                  pulls directly to your airline&apos;s curbside check-in on Level 6.
                </li>
              </ul>
            </div>
          </div>

          <div
            style={{
              marginTop: 24,
              padding: 20,
              borderRadius: 18,
              border: "1px solid var(--panel-border)",
              background: "rgba(214, 241, 116, 0.05)",
            }}
          >
            <h4 style={{ margin: "0 0 8px 0", color: "var(--accent)" }}>
              How our private airport pickup works when your flight lands:
            </h4>
            <ol style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 8, color: "var(--copy)", lineHeight: 1.6 }}>
              <li>
                <strong>Real-Time Flight Radar:</strong> Our dispatch team monitors your incoming flight. If your flight is
                early or delayed, your pickup schedule automatically adjusts without penalty.
              </li>
              <li>
                <strong>Driver Contact Upon Touchdown:</strong> As soon as your aircraft touches down, your chauffeur sends
                a text message introducing themselves with vehicle description and license plate.
              </li>
              <li>
                <strong>Baggage Retrieval:</strong> Collect your luggage at Level 5 baggage claim (Terminal East or West
                depending on your airline).
              </li>
              <li>
                <strong>Step to Island 2:</strong> Exit through the designated door onto Level 5, cross one lane to
                Island 2, and your driver pulls curbside, loads your gear, and gets your journey underway immediately.
              </li>
            </ol>
          </div>
        </section>

        {/* Comparison: Private Pickup vs Rideshare vs Airport Train */}
        <section className="panel" style={{ marginTop: 24 }}>
          <p className="eyebrow">Comparison</p>
          <h2>Why choose pre-arranged private DEN airport transportation?</h2>
          <div className="trust-grid" style={{ marginTop: 20 }}>
            <div className="trust-item">
              <strong>Guaranteed Private Vehicle</strong>
              <p className="muted">
                Your vehicle is reserved exclusively for your party. No shared rides with strangers, no multiple stops, and
                no unpredictable ride-matching delays.
              </p>
            </div>
            <div className="trust-item">
              <strong>All-Weather AWD / 4WD Fleet</strong>
              <p className="muted">
                Colorado weather can change rapidly. Our fleet features mountain-rated all-wheel-drive SUVs equipped for
                heavy snow, I-70 traction laws, and sudden Front Range storms.
              </p>
            </div>
            <div className="trust-item">
              <strong>Curbside Assistance</strong>
              <p className="muted">
                Unlike the airport train (A-Line) which drops you at Union Station requiring secondary transfers with heavy
                luggage, our service provides direct door-to-door transportation to your hotel or rental.
              </p>
            </div>
            <div className="trust-item">
              <strong>Optional 21+ Dispensary Route</strong>
              <p className="muted">
                Visitors 21+ who want to visit a top-rated dispensary can have a legal, licensed retail stop built into the
                route before heading to their final destination.
              </p>
            </div>
          </div>
        </section>

        {/* Colorado Law & Safety Compliance */}
        <section className="panel" style={{ marginTop: 24 }}>
          <p className="eyebrow">Legal guidelines &amp; safety standards</p>
          <h2>Colorado transportation law &amp; cannabis regulations.</h2>
          <p className="muted" style={{ maxWidth: 840, lineHeight: 1.75 }}>
            We provide lawful, professional transportation. To ensure total transparency and passenger safety, please review
            the following legal boundaries:
          </p>
          <ul className="static-page-bullets" style={{ marginTop: 16 }}>
            <li>
              <strong>Age Requirement:</strong> Any optional dispensary stop is strictly limited to adults age 21 and older
              with valid, government-issued photo identification (state driver&apos;s license or passport).
            </li>
            <li>
              <strong>No Airport Possession or Consumption:</strong> Denver International Airport property is governed by
              federal and City of Denver municipal jurisdiction. Possession, use, or display of cannabis products is
              prohibited on airport grounds.
            </li>
            <li>
              <strong>No In-Vehicle Consumption:</strong> Colorado state law and PUC carrier regulations strictly forbid the
              consumption or open packaging of cannabis inside moving commercial motor vehicles.
            </li>
            <li>
              <strong>Transportation Provider Role:</strong> Our service provides private passenger transportation only.
              Drivers do not sell, supply, carry, or deliver cannabis products, nor do drivers enter retail establishments to
              make purchases for passengers. All purchases must be made independently by passengers at licensed state retail
              facilities.
            </li>
            <li>
              <strong>Mountain Travel Preparedness:</strong> Trips to mountain destinations (Vail, Breckenridge, Aspen, etc.)
              are subject to Colorado Department of Transportation (CDOT) Passenger Vehicle Traction Laws (Code 15/16). Our
              vehicles are fully compliant with commercial mountain safety requirements.
            </li>
          </ul>
        </section>

        {/* Bottom Booking & Contact Panel */}
        <section className="panel" style={{ marginTop: 24, textAlign: "center", padding: "48px 32px" }}>
          <p className="eyebrow">Ready to lock in your Denver arrival?</p>
          <h2 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", maxWidth: 700, margin: "14px auto" }}>
            Book your Denver Airport pickup now.
          </h2>
          <p className="muted" style={{ maxWidth: 640, margin: "0 auto 28px", fontSize: 16 }}>
            Lock in your guaranteed private pickup at Denver International Airport. Instant online booking or speak
            directly with our Colorado dispatch team.
          </p>
          <div className="cta-row" style={{ justifyContent: "center", gap: 16 }}>
            <Link href={standardBookingHref} className="button" style={{ minWidth: 260 }}>
              Book Denver Airport Pickup
            </Link>
            <a href={PHONE_HREF} className="button-secondary" style={{ minWidth: 260 }}>
              Call Dispatch: {PHONE_NUMBER}
            </a>
          </div>
          <p className="muted" style={{ marginTop: 24, fontSize: 13 }}>
            Operating Authority: CO PUC LL-03577 · GoSno LLC · Dispatch &amp; Support: contact@gosno.co
          </p>
        </section>
      </main>
    </>
  );
}
