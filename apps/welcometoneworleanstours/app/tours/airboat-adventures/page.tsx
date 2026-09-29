import type { Metadata } from "next";
import Link from "next/link";
import AirboatAdventuresDirectory from "./AirboatAdventuresDirectory";

export const metadata: Metadata = {
  title: "Airboat Adventures New Orleans — High-Speed Swamp Tours & Airboat Rides | WNO",
  description:
    "Compare verified Airboat Adventures swamp tours in Lafitte, Louisiana. High-speed 6- to 30-passenger airboat rides through Barataria Basin with optional New Orleans hotel pickup, live alligator sightings, and flexible cancellation on Viator.",
  alternates: {
    canonical: "https://www.welcometoneworleanstours.com/tours/airboat-adventures",
  },
  openGraph: {
    title: "Airboat Adventures New Orleans — High-Speed Louisiana Swamp Tours | WNO",
    description:
      "Explore high-speed airboat tours with Airboat Adventures in Lafitte, LA. Compare small 6–10 passenger and large 15–30 passenger airboats, check live availability, and book securely on Viator.",
    url: "https://www.welcometoneworleanstours.com/tours/airboat-adventures",
    siteName: "Welcome to New Orleans Tours",
    images: [
      {
        url: "/images/wno/airboat-swamp-tour.webp",
        width: 1200,
        height: 630,
        alt: "Airboat Adventures high-speed swamp tour gliding through Louisiana wetlands",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Airboat Adventures New Orleans — High-Speed Swamp Tours",
    description:
      "Compare verified small and large airboat excursions by Airboat Adventures in Lafitte, LA. Live availability, hotel transport info, and booking on Viator.",
    images: ["/images/wno/airboat-swamp-tour.webp"],
  },
};

export default function AirboatAdventuresPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://www.welcometoneworleanstours.com"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Tours",
            "item": "https://www.welcometoneworleanstours.com/tours"
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": "Swamp Tours",
            "item": "https://www.welcometoneworleanstours.com/swamp-tours"
          },
          {
            "@type": "ListItem",
            "position": 4,
            "name": "Airboat Adventures",
            "item": "https://www.welcometoneworleanstours.com/tours/airboat-adventures"
          }
        ]
      },
      {
        "@type": "TourOperator",
        "name": "Airboat Adventures",
        "legalName": "Airboat Adventures, LLC",
        "url": "https://airboatadventures.com",
        "telephone": "+1-504-689-2005",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "5145 Fleming Park Road",
          "addressLocality": "Lafitte",
          "addressRegion": "LA",
          "postalCode": "70067",
          "addressCountry": "US"
        },
        "description": "Independent Louisiana swamp tour operator specializing in high-speed airboat tours across the Barataria Basin wetlands."
      },
      {
        "@type": "TouristAttraction",
        "name": "Airboat Adventures Swamp Tour",
        "description": "Guided high-speed airboat excursions navigating cypress swamps, bayous, and alligator habitats in Lafitte, Louisiana, approximately 30 minutes from New Orleans.",
        "url": "https://www.welcometoneworleanstours.com/tours/airboat-adventures"
      },
      {
        "@type": "ItemList",
        "name": "Airboat Adventures Tour Collection",
        "description": "Directory of verified Airboat Adventures swamp excursions bookable with live availability on Viator.",
        "itemListElement": [
          {
            "@type": "TouristTrip",
            "position": 1,
            "name": "New Orleans Airboat Ride (Large Airboat)",
            "description": "Signature high-speed airboat ride across Barataria Basin bayous in a custom 15–30 passenger airboat.",
            "offers": {
              "@type": "Offer",
              "price": "59.00",
              "priceCurrency": "USD",
              "availability": "https://schema.org/InStock",
              "url": "https://www.viator.com/tours/New-Orleans/New-Orleans-Airboat-Ride/d675-6455NOLAAIR?pid=P00306962&mcid=42383&medium=link&campaign=wno-airboat-adventures-large&utm_source=welcometoneworleanstours.com&utm_medium=affiliate&utm_campaign=wno-airboat-adventures"
            }
          },
          {
            "@type": "TouristTrip",
            "position": 2,
            "name": "Premium Small-Group Airboat Adventure (6–10 Passengers)",
            "description": "Intimate, high-agility airboat ride accessing shallow, secluded bayou channels with a maximum of 6 to 10 guests.",
            "offers": {
              "@type": "Offer",
              "price": "89.00",
              "priceCurrency": "USD",
              "availability": "https://schema.org/InStock",
              "url": "https://www.viator.com/tours/New-Orleans/Premium-New-Orleans-Airboat-Adventure/d675-6455P7?pid=P00306962&mcid=42383&medium=link&campaign=wno-airboat-adventures-premium&utm_source=welcometoneworleanstours.com&utm_medium=affiliate&utm_campaign=wno-airboat-adventures"
            }
          },
          {
            "@type": "TouristTrip",
            "position": 3,
            "name": "Private New Orleans Airboat Adventure",
            "description": "Exclusive private airboat charter and dedicated captain customized for your travel party.",
            "offers": {
              "@type": "Offer",
              "price": "450.00",
              "priceCurrency": "USD",
              "availability": "https://schema.org/InStock",
              "url": "https://www.viator.com/tours/New-Orleans/Private-New-Orleans-Airboat-Adventure/d675-6455P6?pid=P00306962&mcid=42383&medium=link&campaign=wno-airboat-adventures-private&utm_source=welcometoneworleanstours.com&utm_medium=affiliate&utm_campaign=wno-airboat-adventures"
            }
          }
        ]
      },
      {
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "How far is Airboat Adventures from New Orleans?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Airboat Adventures is located at 5145 Fleming Park Road in Lafitte, Louisiana. It is approximately 25 to 30 miles south of downtown New Orleans and the French Quarter, which typically translates to a 30- to 35-minute drive depending on traffic."
            }
          },
          {
            "@type": "Question",
            "name": "Is transportation available from New Orleans hotels?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes. Optional round-trip shuttle transportation is offered from most major commercial hotels in downtown New Orleans and the French Quarter for an additional fee (typically around $30 per person or packaged in the tour ticket). Shuttles begin pickup approximately 1 hour and 15 minutes before tour departure. Pickups are not available from private Airbnbs or residential addresses."
            }
          },
          {
            "@type": "Question",
            "name": "Are airboat swamp tours safe?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes. Airboat Adventures vessels are custom-built, inspected, and captained by experienced, U.S. Coast Guard-licensed local captains. Sound-deadening hearing protection headsets are provided for all passengers, and safety orientations are conducted prior to departure."
            }
          },
          {
            "@type": "Question",
            "name": "Will we see alligators on the tour?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Alligators are wild animals in their native habitat, but sightings are extremely frequent from spring through autumn when temperatures are warm. In cooler winter months, alligators may brumate on bottom mudflats or sun themselves on sunny banks during warmer afternoons."
            }
          },
          {
            "@type": "Question",
            "name": "What should we wear and bring on an airboat tour?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Dress comfortably for open-air outdoor conditions. Sunglasses and secure strap-on hats are strongly advised due to high winds (35+ mph). Sunscreen and insect repellent are recommended in summer. In cooler weather, wear a windbreaker or jacket. Closed-toe shoes are recommended."
            }
          },
          {
            "@type": "Question",
            "name": "Is an airboat ride loud?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes. Airboats are powered by high-horsepower automotive engines (such as Chevy 454 or 502 cubic-inch engines) driving large aircraft-style propellers. Airboat Adventures provides sound-deadening headsets or ear protection for every guest to wear during high-speed runs."
            }
          },
          {
            "@type": "Question",
            "name": "Is an airboat tour appropriate for young children?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Children must be at least 5 years old to ride on Airboat Adventures airboats. Children under 5, infants, and pregnant women are not permitted to ride due to engine noise, wind speeds, and sudden hull movements. Families with children under 5 should choose a covered swamp boat tour instead."
            }
          },
          {
            "@type": "Question",
            "name": "What is the difference between an airboat and a covered swamp boat?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Airboats are open-air, high-speed flat-bottomed craft powered by giant rear aircraft propellers that can skim across shallow marsh grasses and mudflats at 35+ mph. Covered tour boats are slower, shaded pontoon vessels with quiet outboard motors and onboard restrooms, suitable for all ages including infants."
            }
          }
        ]
      }
    ]
  };

  return (
    <div data-wno-surface="airboat-adventures" className="min-h-screen w-full bg-[#080708] text-[#fdfbf7] selection:bg-[#d4af37] selection:text-black">
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero Section */}
      <header className="relative border-b border-[#d4af37]/25 bg-gradient-to-b from-[#0f1d16] via-[#0b130f] to-[#080708] px-6 pt-16 pb-14 md:pt-24 md:pb-20">
        <div className="mx-auto max-w-6xl">
          {/* Breadcrumb Navigation */}
          <nav className="mb-6 flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-white/50">
            <Link href="/" className="hover:text-[#d4af37] transition-colors">Home</Link>
            <span>/</span>
            <Link href="/tours" className="hover:text-[#d4af37] transition-colors">Tours</Link>
            <span>/</span>
            <Link href="/swamp-tours" className="hover:text-[#d4af37] transition-colors">Swamp Tours</Link>
            <span>/</span>
            <span className="text-[#d4af37]">Airboat Adventures</span>
          </nav>

          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d4af37]/40 bg-[#d4af37]/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#d4af37]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#d4af37] animate-pulse" />
              Verified Local Operator
            </span>
            <span className="rounded-full border border-white/15 bg-white/5 px-3.5 py-1 text-xs font-medium text-white/70">
              Lafitte, Louisiana (30 min from NOLA)
            </span>
            <span className="rounded-full border border-emerald-500/30 bg-emerald-950/40 px-3.5 py-1 text-xs font-semibold text-emerald-400">
              Book securely on Viator
            </span>
          </div>

          <h1
            className="mt-5 font-serif text-4xl font-bold tracking-tight text-[#fdfbf7] md:text-6xl lg:text-7xl"
            style={{ color: '#fdfbf7', WebkitTextFillColor: '#fdfbf7' }}
          >
            Airboat Adventures New Orleans
          </h1>

          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-white/80 md:text-xl">
            A high-speed, open-air Louisiana swamp experience. Skim across tidal marshes, moss-draped cypress bayous, and alligator habitats in the protected Barataria Basin with licensed Cajun captains.
          </p>

          {/* Action CTAs in Hero */}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a
              href="#available-tours"
              className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-[#d4af37] to-[#b38f28] px-7 py-4 text-xs font-bold uppercase tracking-wider text-[#080708] shadow-[0_4px_16px_rgba(212,175,55,0.35)] transition-all hover:brightness-110"
            >
              Check Availability & Rates ↓
            </a>
            <a
              href="#comparison-guide"
              className="inline-flex items-center justify-center rounded-lg border border-white/20 bg-white/5 px-6 py-4 text-xs font-semibold uppercase tracking-wider text-white hover:bg-white/10 transition-colors"
            >
              Compare New Orleans Airboat Tours →
            </a>
          </div>

          {/* Quick Trust Highlights Strip */}
          <div data-airboat-trust-strip className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-4 border-t border-white/10 pt-6 text-xs text-white/80">
            <div className="flex items-center gap-2.5 rounded-lg bg-[#141d18] p-3 border border-[#d4af37]/30 shadow-md">
              <span className="text-xl">🚤</span>
              <div>
                <p className="font-bold text-[#fdfbf7]" style={{ color: '#fdfbf7', WebkitTextFillColor: '#fdfbf7' }}>High-Speed Airboats</p>
                <p className="text-[11px] text-white/70">35+ mph propeller thrill</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 rounded-lg bg-[#141d18] p-3 border border-[#d4af37]/30 shadow-md">
              <span className="text-xl">📍</span>
              <div>
                <p className="font-bold text-[#fdfbf7]" style={{ color: '#fdfbf7', WebkitTextFillColor: '#fdfbf7' }}>30 Min from French Quarter</p>
                <p className="text-[11px] text-white/70">Fastest drive to wild swamp</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 rounded-lg bg-[#141d18] p-3 border border-[#d4af37]/30 shadow-md">
              <span className="text-xl">🚐</span>
              <div>
                <p className="font-bold text-[#fdfbf7]" style={{ color: '#fdfbf7', WebkitTextFillColor: '#fdfbf7' }}>Hotel Pickup Available</p>
                <p className="text-[11px] text-white/70">Roundtrip from commercial hotels</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 rounded-lg bg-[#141d18] p-3 border border-[#d4af37]/30 shadow-md">
              <span className="text-xl">⭐</span>
              <div>
                <p className="font-bold text-[#fdfbf7]" style={{ color: '#fdfbf7', WebkitTextFillColor: '#fdfbf7' }}>4.7★ (5,200+ Reviews)</p>
                <p className="text-[11px] text-white/70">Top-rated operator on Viator</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Operator Overview Section */}
      <section className="border-b border-white/10 px-6 py-14 md:py-20 bg-[#0c0f0d]">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-10 md:grid-cols-12 items-center">
            <div className="md:col-span-7">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d4af37]">Operator Profile</p>
              <h2
                className="mt-2 font-serif text-3xl font-bold text-[#fdfbf7] md:text-4xl"
                style={{ color: '#fdfbf7', WebkitTextFillColor: '#fdfbf7' }}
              >
                Who Is Airboat Adventures?
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-white/80">
                Operating out of Lafitte, Louisiana, <strong className="text-white">Airboat Adventures, LLC</strong> is one of the premier airboat excursion companies serving visitors to the Greater New Orleans area. Situated on Fleming Park Road along Bayou Barataria, the company operates custom-manufactured aluminum airboats designed to navigate southern Louisiana’s vast coastal wetlands.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-white/75">
                Unlike traditional swamp tour operations that run deep-draft pontoon vessels along established dredged canals, Airboat Adventures utilizes high-powered aircraft-propeller propulsion. This allows captains to traverse shallow marsh plains, mudflats, and secluded inlets that are otherwise completely inaccessible by land or standard marine craft.
              </p>

              <div className="mt-6 flex flex-wrap gap-4 text-xs text-white/80">
                <div className="rounded border border-white/15 bg-white/5 px-3 py-2">
                  <span className="text-[#d4af37] font-bold">Location:</span> 5145 Fleming Park Rd, Lafitte, LA 70067
                </div>
                <div className="rounded border border-white/15 bg-white/5 px-3 py-2">
                  <span className="text-[#d4af37] font-bold">Fleet:</span> 6–10 Passenger Small & 15–30 Passenger Large Airboats
                </div>
                <div className="rounded border border-white/15 bg-white/5 px-3 py-2">
                  <span className="text-[#d4af37] font-bold">Distance:</span> ~30 Minutes from Canal St / French Quarter
                </div>
              </div>
            </div>

            <div className="md:col-span-5 rounded-xl border border-[#d4af37]/30 bg-[#121915] p-6 shadow-xl">
              <h3 className="font-serif text-xl font-bold text-[#fdfbf7]">The Airboat Advantage</h3>
              <ul className="mt-4 space-y-3 text-xs text-white/80">
                <li className="flex items-start gap-2.5">
                  <span className="text-[#d4af37] font-bold">✓</span>
                  <span><strong className="text-white">Shallow-Water Access:</strong> Slides effortlessly over mudflats and inches of swamp water where alligators rest.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-[#d4af37] font-bold">✓</span>
                  <span><strong className="text-white">High Speed & Thrill:</strong> Bursts up to 35+ mph between quiet wildlife viewing stops.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-[#d4af37] font-bold">✓</span>
                  <span><strong className="text-white">Authentic Local Captains:</strong> Guided by licensed captains born and raised in Louisiana bayou country.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-[#d4af37] font-bold">✓</span>
                  <span><strong className="text-white">360° Unobstructed Views:</strong> Stadium-style tiered open seating with zero window glare.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Main Tour Directory Section */}
      <section id="available-tours" className="px-6 py-14 md:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d4af37]">Verified Live Experiences</p>
            <h2
              className="mt-2 font-serif text-3xl font-bold text-[#fdfbf7] md:text-4xl"
              style={{ color: '#fdfbf7', WebkitTextFillColor: '#fdfbf7' }}
            >
              Choose Your Airboat Adventures Tour
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/75">
              Welcome to New Orleans Tours tracks live, verified experiences from Airboat Adventures. Review vessel sizes, pricing, and hotel transport options below, then select your date and book securely through Viator.
            </p>
          </div>

          {/* Interactive Client-Side Directory Component */}
          <AirboatAdventuresDirectory />
        </div>
      </section>

      {/* What The Experience Is Like Section */}
      <section className="border-t border-[#d4af37]/20 bg-[#0d120f] px-6 py-14 md:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d4af37]">On the Water</p>
            <h2
              className="mt-2 font-serif text-3xl font-bold text-[#fdfbf7] md:text-4xl"
              style={{ color: '#fdfbf7', WebkitTextFillColor: '#fdfbf7' }}
            >
              What an Airboat Swamp Tour Is Actually Like
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-white/75">
              An airboat is fundamentally different from any other boat ride in New Orleans. Here is what to expect from engine roar to wildlife encounters.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-white/10 bg-[#141b16] p-6 shadow-md">
              <span className="text-3xl">⚡</span>
              <h3 className="mt-3 font-serif text-lg font-bold text-[#fdfbf7]">Speed & Propeller Thrill</h3>
              <p className="mt-2 text-xs leading-relaxed text-white/70">
                Driven by massive aircraft-style fans, airboats accelerate briskly across open bayou waters, carving sweeping turns and sliding over floating wetland plants at speeds of 30 to 35+ mph.
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#141b16] p-6 shadow-md">
              <span className="text-3xl">🐊</span>
              <h3 className="mt-3 font-serif text-lg font-bold text-[#fdfbf7]">Up-Close Wildlife</h3>
              <p className="mt-2 text-xs leading-relaxed text-white/70">
                Captains power down the motor in quiet coves so you can observe wild American alligators, white-tailed deer, river otters, snapping turtles, and predatory raptors in their natural habitat.
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#141b16] p-6 shadow-md">
              <span className="text-3xl">🎧</span>
              <h3 className="mt-3 font-serif text-lg font-bold text-[#fdfbf7]">Sound & Exposure</h3>
              <p className="mt-2 text-xs leading-relaxed text-white/70">
                These are open-air, high-noise vessels. Sound-muffling earmuffs are provided for all passengers. You will experience wind, water spray, and direct Louisiana sun exposure.
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#141b16] p-6 shadow-md">
              <span className="text-3xl">🎒</span>
              <h3 className="mt-3 font-serif text-lg font-bold text-[#fdfbf7]">What to Wear & Bring</h3>
              <p className="mt-2 text-xs leading-relaxed text-white/70">
                Wear sunglasses, weather-appropriate layers, and secured hats. Bring sunscreen, insect repellent, and closed-toe footwear. Ponchos are recommended if rain is in the forecast.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Logistics & Practical Information Section */}
      <section className="border-t border-white/10 bg-[#080708] px-6 py-14 md:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d4af37]">Logistics & Planning</p>
            <h2
              className="mt-2 font-serif text-3xl font-bold text-[#fdfbf7] md:text-4xl"
              style={{ color: '#fdfbf7', WebkitTextFillColor: '#fdfbf7' }}
            >
              Essential Trip Logistics
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-xl border border-[#d4af37]/30 bg-[#121814] p-6">
              <h3 className="font-serif text-lg font-bold text-[#d4af37]">Travel Time & Distance</h3>
              <p className="mt-3 text-xs leading-relaxed text-white/75">
                The dock is located in <strong className="text-white">Lafitte, Louisiana</strong>, approximately 25–30 miles south of the French Quarter (roughly 30 to 35 minutes by car). This is one of the closest wild swamp locations to New Orleans.
              </p>
              <div className="mt-4 border-t border-white/10 pt-3 text-[11px] text-white/60">
                Address: 5145 Fleming Park Rd, Lafitte, LA 70067. Free parking on-site for self-drivers.
              </div>
            </div>

            <div className="rounded-xl border border-[#d4af37]/30 bg-[#121814] p-6">
              <h3 className="font-serif text-lg font-bold text-[#d4af37]">Hotel Transportation</h3>
              <p className="mt-3 text-xs leading-relaxed text-white/75">
                Roundtrip shuttle van transfers are available from downtown and French Quarter commercial hotels. Pickups typically begin <strong className="text-white">1 hour and 15 minutes</strong> prior to tour time.
              </p>
              <div className="mt-4 border-t border-white/10 pt-3 text-[11px] text-white/60">
                Note: Shuttles service commercial hotel lobbies only; pickups are not offered from Airbnbs or residential rentals.
              </div>
            </div>

            <div className="rounded-xl border border-[#d4af37]/30 bg-[#121814] p-6">
              <h3 className="font-serif text-lg font-bold text-[#d4af37]">Age & Health Restrictions</h3>
              <p className="mt-3 text-xs leading-relaxed text-white/75">
                Children must be at least <strong className="text-white">5 years old</strong> to ride. For safety reasons, <strong className="text-white">pregnant women</strong> and individuals with neck or back injuries are strictly prohibited from riding.
              </p>
              <div className="mt-4 border-t border-white/10 pt-3 text-[11px] text-white/60">
                For travelers with infants, toddlers, or pregnancy, choose a <Link href="/tours/covered-tour-boat" className="text-[#d4af37] underline">covered tour boat</Link> instead.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Best For vs Think Twice Decision Guide */}
      <section className="border-t border-[#d4af37]/20 bg-[#0e1410] px-6 py-14 md:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d4af37]">Decision Guide</p>
            <h2
              className="mt-2 font-serif text-3xl font-bold text-[#fdfbf7] md:text-4xl"
              style={{ color: '#fdfbf7', WebkitTextFillColor: '#fdfbf7' }}
            >
              Is Airboat Adventures Right for Your Group?
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-white/75">
              Review traveler fit criteria before booking to ensure an optimal swamp experience.
            </p>
          </div>

          <div className="mt-10 grid gap-8 md:grid-cols-2">
            {/* Best For */}
            <div className="rounded-xl border border-emerald-500/40 bg-[#102018] p-8 shadow-lg">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 font-bold">✓</span>
                <h3 className="font-serif text-2xl font-bold text-emerald-300">Best For</h3>
              </div>
              <ul className="mt-6 space-y-3.5 text-xs text-white/80 leading-relaxed">
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-400 font-bold mt-0.5">•</span>
                  <span><strong className="text-white">Thrill & Speed Enthusiasts:</strong> Visitors who want an exhilarating ride with rapid acceleration and 360-degree spins.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-400 font-bold mt-0.5">•</span>
                  <span><strong className="text-white">Shallow Marsh Access:</strong> Travelers wanting to reach remote bayous and marsh grass where pontoon boats cannot go.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-400 font-bold mt-0.5">•</span>
                  <span><strong className="text-white">Adults & Older Kids (Ages 5+):</strong> Excellent for couples, friend groups, bachelor/bachelorette trips, and families with kids over 5.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-400 font-bold mt-0.5">•</span>
                  <span><strong className="text-white">Photographers:</strong> Unobstructed stadium seating provides clean sightlines without window reflections or roof posts.</span>
                </li>
              </ul>
            </div>

            {/* Think Twice If */}
            <div className="rounded-xl border border-amber-500/40 bg-[#201810] p-8 shadow-lg">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 font-bold">⚠</span>
                <h3 className="font-serif text-2xl font-bold text-amber-300">Think Twice If</h3>
              </div>
              <ul className="mt-6 space-y-3.5 text-xs text-white/80 leading-relaxed">
                <li className="flex items-start gap-2.5">
                  <span className="text-amber-400 font-bold mt-0.5">•</span>
                  <span><strong className="text-white">Traveling With Kids Under 5:</strong> Strictly prohibited. Choose a <Link href="/tours/covered-tour-boat" className="text-[#d4af37] underline">covered swamp tour boat</Link> which welcomes all ages.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-amber-400 font-bold mt-0.5">•</span>
                  <span><strong className="text-white">Pregnant Women or Back/Neck Pain:</strong> Airboat motion involves sudden acceleration and hull vibration; not permitted for health reasons.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-amber-400 font-bold mt-0.5">•</span>
                  <span><strong className="text-white">Seeking Complete Shade:</strong> Airboats are open-air with no overhead canopy. For sun and rain protection, pick a covered vessel.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-amber-400 font-bold mt-0.5">•</span>
                  <span><strong className="text-white">Need Onboard Restrooms:</strong> Airboats do not have restrooms on board. Covered pontoon tour boats have full marine restrooms.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Block: Airboat Adventures vs Ragin Cajun vs Gray Line vs Covered Boats */}
      <section id="comparison-guide" className="border-t border-white/10 px-6 py-14 md:py-20 bg-[#080708]">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d4af37]">Marketplace Comparison</p>
            <h2
              className="mt-2 font-serif text-3xl font-bold text-[#fdfbf7] md:text-4xl"
              style={{ color: '#fdfbf7', WebkitTextFillColor: '#fdfbf7' }}
            >
              Comparing New Orleans Swamp Operators
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-white/75">
              Welcome to New Orleans Tours keeps operator identities distinct so you know exactly who runs each vessel before booking.
            </p>
          </div>

          <div className="mt-10 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#d4af37]/30 bg-[#141b16] text-[#d4af37]">
                  <th className="p-4 font-bold uppercase tracking-wider">Feature</th>
                  <th className="p-4 font-bold uppercase tracking-wider bg-[#1a251e] border-x border-[#d4af37]/40">Airboat Adventures</th>
                  <th className="p-4 font-bold uppercase tracking-wider">Ragin Cajun Airboat</th>
                  <th className="p-4 font-bold uppercase tracking-wider">Gray Line Airboat</th>
                  <th className="p-4 font-bold uppercase tracking-wider">Covered Tour Boats</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 text-white/80">
                <tr>
                  <td className="p-4 font-semibold text-white">Vessel Type</td>
                  <td className="p-4 bg-[#141b16] border-x border-[#d4af37]/20 font-medium text-white">High-Speed Airboat (6–30 pass)</td>
                  <td className="p-4">High-Speed Airboat</td>
                  <td className="p-4">Small / Large Airboat</td>
                  <td className="p-4 text-emerald-400">Canopied Pontoon Boat</td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-white">Operating Location</td>
                  <td className="p-4 bg-[#141b16] border-x border-[#d4af37]/20">Lafitte, LA (Barataria Basin)</td>
                  <td className="p-4">Bayou wetlands</td>
                  <td className="p-4">Slidell / Pearl River area</td>
                  <td className="p-4">Honey Island / Barataria</td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-white">Speed & Thrill</td>
                  <td className="p-4 bg-[#141b16] border-x border-[#d4af37]/20">High (up to 35+ mph)</td>
                  <td className="p-4">High (35+ mph)</td>
                  <td className="p-4">High (35+ mph)</td>
                  <td className="p-4">Gentle, slow glide</td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-white">Minimum Age</td>
                  <td className="p-4 bg-[#141b16] border-x border-[#d4af37]/20 font-bold text-amber-300">5 Years Old</td>
                  <td className="p-4 font-bold text-amber-300">5 Years Old</td>
                  <td className="p-4 font-bold text-amber-300">5 Years Old</td>
                  <td className="p-4 font-bold text-emerald-400">All Ages (Infants welcome)</td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-white">Canopy Shade</td>
                  <td className="p-4 bg-[#141b16] border-x border-[#d4af37]/20">Open-Air (No roof)</td>
                  <td className="p-4">Open-Air</td>
                  <td className="p-4">Open-Air</td>
                  <td className="p-4 text-emerald-400">Full Covered Roof</td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-white">Onboard Restroom</td>
                  <td className="p-4 bg-[#141b16] border-x border-[#d4af37]/20">No</td>
                  <td className="p-4">No</td>
                  <td className="p-4">No</td>
                  <td className="p-4 text-emerald-400">Yes (Marine head on board)</td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-white">New Orleans Transport</td>
                  <td className="p-4 bg-[#141b16] border-x border-[#d4af37]/20">Optional Hotel Pickup</td>
                  <td className="p-4">Self-drive / Hotel pickup</td>
                  <td className="p-4">Included French Quarter pickup</td>
                  <td className="p-4">Optional Hotel Pickup</td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-white">WNO Booking Channel</td>
                  <td className="p-4 bg-[#141b16] border-x border-[#d4af37]/20 font-bold text-[#d4af37]">Viator Verified Link</td>
                  <td className="p-4">FareHarbor on WNO</td>
                  <td className="p-4">FareHarbor on WNO</td>
                  <td className="p-4">FareHarbor on WNO</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-8 flex flex-wrap gap-4 justify-center text-xs">
            <Link
              href="/tours/ragin-cajun-airboat-options"
              className="rounded border border-white/20 bg-white/5 px-4 py-2 text-white hover:text-[#d4af37] transition-colors"
            >
              View Ragin Cajun Airboat Tour →
            </Link>
            <Link
              href="/tours/small-airboat-swamp-adventure"
              className="rounded border border-white/20 bg-white/5 px-4 py-2 text-white hover:text-[#d4af37] transition-colors"
            >
              View Gray Line Small Airboat →
            </Link>
            <Link
              href="/tours/large-airboat-swamp-adventure"
              className="rounded border border-white/20 bg-white/5 px-4 py-2 text-white hover:text-[#d4af37] transition-colors"
            >
              View Gray Line Large Airboat →
            </Link>
            <Link
              href="/tours/covered-tour-boat"
              className="rounded border border-[#d4af37]/40 bg-[#d4af37]/10 px-4 py-2 text-[#d4af37] hover:bg-[#d4af37]/20 transition-colors"
            >
              View Covered Swamp Tour Boat →
            </Link>
          </div>
        </div>
      </section>

      {/* Concierge Help CTA Section */}
      <section className="border-t border-[#d4af37]/20 bg-[#101712] px-6 py-12 md:py-16">
        <div className="mx-auto max-w-4xl rounded-xl border border-[#d4af37]/35 bg-gradient-to-r from-[#17241c] to-[#0f1712] p-8 md:p-12 shadow-[0_12px_40px_rgba(0,0,0,0.6)]">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#d4af37]">
                Free Concierge Guidance
              </span>
              <h2
                className="mt-2 font-serif text-2xl font-bold text-[#fdfbf7] md:text-3xl"
                style={{ color: '#fdfbf7', WebkitTextFillColor: '#fdfbf7' }}
              >
                Still Deciding Between Airboat vs Covered Boat?
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/75">
                Tell us your travel group size, dates, and whether you are traveling with young children or seniors. We provide honest, unbiased recommendations so you choose the right swamp adventure.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row md:flex-col shrink-0">
              <Link
                href="/help-me-choose"
                className="inline-flex items-center justify-center rounded bg-[#d4af37] px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-[#080708] shadow-lg transition-all hover:bg-[#e0bc45]"
              >
                Help Me Choose →
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded border border-white/20 bg-white/5 px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-white hover:bg-white/10 transition-colors"
              >
                Ask a Specialist
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="border-t border-white/10 px-6 py-14 md:py-20 bg-[#080708]">
        <div className="mx-auto max-w-4xl">
          <div className="mb-10 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d4af37]">Essential Answers</p>
            <h2
              className="mt-2 font-serif text-3xl font-bold text-[#fdfbf7] md:text-4xl"
              style={{ color: '#fdfbf7', WebkitTextFillColor: '#fdfbf7' }}
            >
              Airboat Adventures FAQs
            </h2>
          </div>

          <div className="space-y-6">
            <div className="rounded-xl border border-white/10 bg-[#121814] p-6">
              <h3 className="font-serif text-lg font-bold text-[#fdfbf7]">
                How far is Airboat Adventures from New Orleans?
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/70">
                Airboat Adventures operates out of Lafitte, Louisiana (5145 Fleming Park Rd), roughly 25 to 30 miles south of downtown New Orleans and the French Quarter. The drive takes approximately 30 to 35 minutes via US-90 W and LA-45 S.
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#121814] p-6">
              <h3 className="font-serif text-lg font-bold text-[#fdfbf7]">
                Is transportation available from New Orleans?
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/70">
                Yes. Airboat Adventures offers optional round-trip shuttle transportation from major commercial hotels in downtown New Orleans and the French Quarter. Pickups begin approximately 1 hour and 15 minutes before tour departure. Please note that pickups from private residential rentals (such as Airbnbs) are not offered. Self-drivers can park for free at the Lafitte dock.
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#121814] p-6">
              <h3 className="font-serif text-lg font-bold text-[#fdfbf7]">
                Are airboats safe?
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/70">
                Yes. All Airboat Adventures boats are custom-built, commercially inspected, and operated by licensed captains credentialed by the United States Coast Guard. Vessels are equipped with life vests, fire suppression equipment, and sound-dampening hearing protection for every passenger.
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#121814] p-6">
              <h3 className="font-serif text-lg font-bold text-[#fdfbf7]">
                Will we see wild alligators?
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/70">
                During warmer months (spring through autumn), alligator sightings are exceptionally common because alligators are cold-blooded reptiles that actively feed and bask in warm weather. During winter cold snaps, alligators slow their metabolism and may submerge, though sunny winter afternoons still frequently bring them out onto banks.
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#121814] p-6">
              <h3 className="font-serif text-lg font-bold text-[#fdfbf7]">
                What should we wear and bring?
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/70">
                Dress in comfortable, weather-appropriate casual clothing. Airboats create a brisk breeze (up to 35+ mph), so secured sunglasses and hat straps are recommended. In summer, bring sunscreen and insect repellent. In winter or early spring, a light windbreaker or jacket is essential. Closed-toe shoes are recommended.
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#121814] p-6">
              <h3 className="font-serif text-lg font-bold text-[#fdfbf7]">
                Is an airboat ride loud?
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/70">
                Yes. The high-performance Chevy 454/502 engines that drive the propeller generate significant engine noise during acceleration. Airboat Adventures provides sound-deadening earmuffs or ear protection for every guest to wear during high-speed runs.
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#121814] p-6">
              <h3 className="font-serif text-lg font-bold text-[#fdfbf7]">
                Is it appropriate for children?
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/70">
                Children must be at least 5 years old to ride on Airboat Adventures airboats. Children under 5 are not permitted due to safety, wind, and noise guidelines. If you have babies or toddlers under 5, choose a <Link href="/tours/covered-tour-boat" className="text-[#d4af37] underline">covered tour boat</Link>, which accommodates all ages without restrictions.
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#121814] p-6">
              <h3 className="font-serif text-lg font-bold text-[#fdfbf7]">
                What is the difference between an airboat and a covered swamp boat?
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/70">
                Airboats are open-air, high-speed craft powered by giant aircraft propellers that can skim over shallow wetlands at 35+ mph. Covered tour boats are slower, shaded pontoon vessels with quiet outboard motors, full canopy roofs, and onboard restrooms, offering a relaxed eco-tour pace suitable for all ages.
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#121814] p-6">
              <h3 className="font-serif text-lg font-bold text-[#fdfbf7]">
                What happens in bad weather?
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/70">
                Tours generally operate rain or shine, as brief Louisiana rain showers are common and harmless. However, if severe storms, lightning, or dangerous high winds occur, Airboat Adventures prioritizes passenger safety and will delay, reschedule, or provide a 100% refund.
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#121814] p-6">
              <h3 className="font-serif text-lg font-bold text-[#fdfbf7]">
                What is the cancellation and refund policy?
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/70">
                When booking Airboat Adventures through Viator, you receive free cancellation with a full refund up to 24 hours before your tour departure time. For direct bookings through the operator, cancellations within 24 hours are non-refundable unless optional trip protection was purchased.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Internal Navigation Links Hub */}
      <section className="border-t border-white/10 bg-[#0d120f] px-6 py-12 text-xs">
        <div className="mx-auto max-w-5xl">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#d4af37]">Explore Related Experiences</p>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-3 text-white/70">
            <Link href="/swamp-tours" className="hover:text-[#d4af37] transition-colors">All New Orleans Swamp Tours</Link>
            <span>•</span>
            <Link href="/airboat-tours" className="hover:text-[#d4af37] transition-colors">Airboat Tours Collection</Link>
            <span>•</span>
            <Link href="/tours/covered-tour-boat" className="hover:text-[#d4af37] transition-colors">Covered Swamp Tour Boats</Link>
            <span>•</span>
            <Link href="/tours/ragin-cajun-airboat-options" className="hover:text-[#d4af37] transition-colors">Ragin Cajun Airboat Options</Link>
            <span>•</span>
            <Link href="/tours/small-airboat-swamp-adventure" className="hover:text-[#d4af37] transition-colors">Gray Line Small Airboat</Link>
            <span>•</span>
            <Link href="/tours/nola-ghost-riders" className="hover:text-[#d4af37] transition-colors">NOLA GhostRiders Tours</Link>
            <span>•</span>
            <Link href="/help-me-choose" className="hover:text-[#d4af37] transition-colors">Tour Recommendation Wizard</Link>
            <span>•</span>
            <Link href="/booking-help" className="hover:text-[#d4af37] transition-colors">Booking Support & FAQs</Link>
            <span>•</span>
            <Link href="/contact" className="hover:text-[#d4af37] transition-colors">Contact Our Concierge</Link>
          </div>
        </div>
      </section>

      {/* Marketplace Role Separation & Disclosures */}
      <footer className="border-t border-[#d4af37]/20 bg-[#080708] px-6 py-12 text-xs leading-relaxed text-white/50">
        <div className="mx-auto max-w-5xl grid gap-8 md:grid-cols-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#d4af37]">Operator Separation</p>
            <p className="mt-2">
              Airboat Adventures, LLC operates and fulfills all tour departures, airboat vessels, safety gear, and customer fulfillment out of Lafitte, Louisiana. Welcome to New Orleans Tours is an independent editorial guide and referral service helping travelers evaluate, compare, and choose verified local experiences.
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#d4af37]">Affiliate Disclosure</p>
            <p className="mt-2">
              Welcome to New Orleans Tours is an authorized referral partner. When you reserve experiences through links on this page, we may earn a referral commission at no additional cost to you. Bookings are processed securely on Viator.
            </p>
            <Link href="/how-we-choose" className="mt-3 inline-block font-semibold text-[#d4af37] underline underline-offset-4">
              Learn how we select & verify tours →
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
