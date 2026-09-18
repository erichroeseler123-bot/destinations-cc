import type { Metadata } from "next";
import Link from "next/link";
import NolaGhostRidersDirectory from "./NolaGhostRidersDirectory";

export const metadata: Metadata = {
  title: "NOLA GhostRiders Tours — BYOB Cemetery Bus & Ghost Tours | WNO",
  description:
    "Compare verified NOLA GhostRiders experiences in New Orleans. Browse the famous BYOB Night Cemetery Bus Tour, Destrehan Plantation Haunted Night Tour, Paranormal Investigations, and French Quarter walks with starting prices and live booking on Viator.",
  alternates: {
    canonical: "https://www.welcometoneworleanstours.com/tours/nola-ghost-riders",
  },
  openGraph: {
    title: "NOLA GhostRiders Tours — BYOB Night Cemetery Bus & Ghost Tours | WNO",
    description:
      "Compare all active NOLA GhostRiders tours: BYOB Cemetery Bus, Destrehan Haunted Night Tour, Paranormal Investigations with EMF meters, and French Quarter walks. Book securely on Viator.",
    url: "https://www.welcometoneworleanstours.com/tours/nola-ghost-riders",
    siteName: "Welcome to New Orleans Tours",
    images: [
      {
        url: "/images/wikimedia/originals/french-quarter-night.jpg",
        width: 1200,
        height: 630,
        alt: "NOLA GhostRiders Night Tour in New Orleans",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NOLA GhostRiders Tours — BYOB Cemetery Bus & Ghost Tours",
    description:
      "Compare the iconic BYOB Night Cemetery Bus, Destrehan Plantation Haunted Night Tour, and ghost hunts in New Orleans. Book securely on Viator.",
    images: ["/images/wikimedia/originals/french-quarter-night.jpg"],
  },
};

export default function NolaGhostRidersPage() {
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
            "name": "NOLA GhostRiders",
            "item": "https://www.welcometoneworleanstours.com/tours/nola-ghost-riders"
          }
        ]
      },
      {
        "@type": "ItemList",
        "name": "NOLA GhostRiders Tour Collection",
        "description": "Directory of verified New Orleans ghost, cemetery, and plantation tours operated by NOLA GhostRiders and bookable on Viator.",
        "itemListElement": [
          {
            "@type": "TouristTrip",
            "position": 1,
            "name": "Cemetery and Ghost BYOB Bus Tour in New Orleans",
            "description": "Signature climate-controlled night cemetery and ghost bus tour with BYOB privileges.",
            "offers": {
              "@type": "Offer",
              "price": "30.00",
              "priceCurrency": "USD",
              "availability": "https://schema.org/InStock",
              "url": "https://www.viator.com/tours/New-Orleans/Night-Cemetery-and-Ghost-BYOB-Bus-Tour-in-New-Orleans/d675-64332P4?pid=P00306962&mcid=42383&medium=link&campaign=wno-ghostriders-byob-bus&utm_source=welcometoneworleanstours.com&utm_medium=affiliate&utm_campaign=wno-ghostriders"
            }
          },
          {
            "@type": "TouristTrip",
            "position": 2,
            "name": "Destrehan Plantation Haunted Night Tour",
            "description": "Rare after-dark lantern tour inside Louisiana's oldest documented plantation manor.",
            "offers": {
              "@type": "Offer",
              "price": "69.00",
              "priceCurrency": "USD",
              "availability": "https://schema.org/InStock",
              "url": "https://www.viator.com/tours/New-Orleans/Destrehan-Plantation-Haunted-Night-Tour/d675-64332P13?pid=P00306962&mcid=42383&medium=link&campaign=wno-ghostriders-destrehan-night&utm_source=welcometoneworleanstours.com&utm_medium=affiliate&utm_campaign=wno-ghostriders"
            }
          },
          {
            "@type": "TouristTrip",
            "position": 3,
            "name": "New Orleans Cemetery and Paranormal Investigation Bus Tour",
            "description": "Active ghost hunt equipped with handheld EMF meters, spirit boxes, and thermal readers.",
            "offers": {
              "@type": "Offer",
              "price": "35.00",
              "priceCurrency": "USD",
              "availability": "https://schema.org/InStock",
              "url": "https://www.viator.com/tours/New-Orleans/Night-Cemetery-and-Ghost-Hunt-Bus-Tour-Paranormal-Investigation/d675-64332P7?pid=P00306962&mcid=42383&medium=link&campaign=wno-ghostriders-paranormal-hunt&utm_source=welcometoneworleanstours.com&utm_medium=affiliate&utm_campaign=wno-ghostriders"
          }
          },
          {
            "@type": "TouristTrip",
            "position": 4,
            "name": "Haunted Drunken History Tour from New Orleans",
            "description": "French Quarter pub crawl pairing true crime and occult lore with historic bar stops.",
            "offers": {
              "@type": "Offer",
              "price": "24.00",
              "priceCurrency": "USD",
              "availability": "https://schema.org/InStock",
              "url": "https://www.viator.com/tours/New-Orleans/Drunken-History-Tour-in-New-Orleans/d675-64332P3?pid=P00306962&mcid=42383&medium=link&campaign=wno-ghostriders-drunken-history&utm_source=welcometoneworleanstours.com&utm_medium=affiliate&utm_campaign=wno-ghostriders"
            }
          },
          {
            "@type": "TouristTrip",
            "position": 5,
            "name": "Haunted Ghost and Paranormal Tour in New Orleans",
            "description": "French Quarter ghost and voodoo walking tour covering the Lalaurie Mansion and historic courtyards.",
            "offers": {
              "@type": "Offer",
              "price": "15.00",
              "priceCurrency": "USD",
              "availability": "https://schema.org/InStock",
              "url": "https://www.viator.com/tours/New-Orleans/Haunted-Ghost-and-Paranormal-Tour-in-New-Orleans/d675-64332P1?pid=P00306962&mcid=42383&medium=link&campaign=wno-ghostriders-french-quarter-walk&utm_source=welcometoneworleanstours.com&utm_medium=affiliate&utm_campaign=wno-ghostriders"
            }
          },
          {
            "@type": "TouristTrip",
            "position": 6,
            "name": "New Orleans Haunted Ghost Tour: Explore The Paranormal",
            "description": "Twilight walking tour exploring Vieux Carré supernatural legends.",
            "offers": {
              "@type": "Offer",
              "price": "15.00",
              "priceCurrency": "USD",
              "availability": "https://schema.org/InStock",
              "url": "https://www.viator.com/tours/New-Orleans/Haunted-Ghost-Tour-Explore-The-Paranormal/d675-64332P10?pid=P00306962&mcid=42383&medium=link&campaign=wno-ghostriders-explore-paranormal&utm_source=welcometoneworleanstours.com&utm_medium=affiliate&utm_campaign=wno-ghostriders"
            }
          },
          {
            "@type": "TouristTrip",
            "position": 7,
            "name": "Night Cemetery Insiders Bus Tour in New Orleans",
            "description": "Mini-coach tour examining above-ground burial vaults and yellow fever history.",
            "offers": {
              "@type": "Offer",
              "price": "30.00",
              "priceCurrency": "USD",
              "availability": "https://schema.org/InStock",
              "url": "https://www.viator.com/tours/New-Orleans/Cemetery-Insiders-Tour-With-Transportation/d675-64332P11?pid=P00306962&mcid=42383&medium=link&campaign=wno-ghostriders-cemetery-insiders&utm_source=welcometoneworleanstours.com&utm_medium=affiliate&utm_campaign=wno-ghostriders"
            }
          }
        ]
      }
    ]
  };

  return (
    <div data-wno-surface="ghost-riders" className="min-h-screen w-full bg-[#080708] text-[#fdfbf7] selection:bg-[#d4af37] selection:text-black">
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero Section */}
      <header className="relative border-b border-[#d4af37]/25 bg-gradient-to-b from-[#16121b] via-[#0d0b10] to-[#080708] px-6 pt-16 pb-14 md:pt-24 md:pb-20">
        <div className="mx-auto max-w-6xl">
          {/* Breadcrumb Navigation */}
          <nav className="mb-6 flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-white/50">
            <Link href="/" className="hover:text-[#d4af37] transition-colors">Home</Link>
            <span>/</span>
            <Link href="/tours" className="hover:text-[#d4af37] transition-colors">Tours</Link>
            <span>/</span>
            <span className="text-[#d4af37]">NOLA GhostRiders</span>
          </nav>

          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d4af37]/40 bg-[#d4af37]/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#d4af37]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#d4af37] animate-pulse" />
              Verified Local Operator
            </span>
            <span className="rounded-full border border-white/15 bg-white/5 px-3.5 py-1 text-xs font-medium text-white/70">
              New Orleans, LA
            </span>
            <span className="rounded-full border border-emerald-500/30 bg-emerald-950/40 px-3.5 py-1 text-xs font-semibold text-emerald-400">
              Book securely on Viator
            </span>
          </div>

          <h1
            className="mt-5 font-serif text-4xl font-bold tracking-tight text-[#fdfbf7] md:text-6xl lg:text-7xl"
            style={{ color: '#fdfbf7', WebkitTextFillColor: '#fdfbf7' }}
          >
            NOLA GhostRiders Tours
          </h1>

          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-white/80 md:text-xl">
            Home of New Orleans&apos; premier BYOB Night Cemetery Bus Tour, Destrehan Plantation Haunted Night Tours, and active paranormal investigations with real EMF gear.
          </p>

          {/* Quick Trust Highlights Strip */}
          <div data-ghost-trust-strip className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-4 border-t border-white/10 pt-6 text-xs text-white/80">
            <div className="flex items-center gap-2.5 rounded-lg bg-[#18151f] p-3 border border-[#d4af37]/30 shadow-md">
              <span className="text-xl">🚌</span>
              <div>
                <p className="font-bold text-[#fdfbf7]" style={{ color: '#fdfbf7', WebkitTextFillColor: '#fdfbf7' }}>Air-Conditioned Buses</p>
                <p className="text-[11px] text-white/70">Comfortable city & cemetery transit</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 rounded-lg bg-[#18151f] p-3 border border-[#d4af37]/30 shadow-md">
              <span className="text-xl">🍺</span>
              <div>
                <p className="font-bold text-[#fdfbf7]" style={{ color: '#fdfbf7', WebkitTextFillColor: '#fdfbf7' }}>BYOB Allowed on Buses</p>
                <p className="text-[11px] text-white/70">Cans & plastic cups welcome</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 rounded-lg bg-[#18151f] p-3 border border-[#d4af37]/30 shadow-md">
              <span className="text-xl">⚡</span>
              <div>
                <p className="font-bold text-[#fdfbf7]" style={{ color: '#fdfbf7', WebkitTextFillColor: '#fdfbf7' }}>Paranormal Equipment</p>
                <p className="text-[11px] text-white/70">EMF meters on ghost hunts</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 rounded-lg bg-[#18151f] p-3 border border-[#d4af37]/30 shadow-md">
              <span className="text-xl">⭐</span>
              <div>
                <p className="font-bold text-[#fdfbf7]" style={{ color: '#fdfbf7', WebkitTextFillColor: '#fdfbf7' }}>4.5★ Average Rating</p>
                <p className="text-[11px] text-white/70">Across featured experiences</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Tour Directory Section */}
      <section className="px-6 py-12 md:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d4af37]">Verified Experiences</p>
            <h2
              className="mt-2 font-serif text-3xl font-bold text-[#fdfbf7] md:text-4xl"
              style={{ color: '#fdfbf7', WebkitTextFillColor: '#fdfbf7' }}
            >
              Choose Your NOLA GhostRiders Experience
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/75">
              Welcome to New Orleans Tours tracks live, verified experiences from NOLA GhostRiders. Review starting prices, durations, and traveler feedback below, then check dates and book securely through Viator.
            </p>
          </div>

          {/* Interactive Client-Side Directory Component */}
          <NolaGhostRidersDirectory />
        </div>
      </section>

      {/* Comparison & Decision Guide Section */}
      <section className="border-t border-[#d4af37]/20 bg-[#0e0c12] px-6 py-14 md:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d4af37]">Decision Guide</p>
            <h2
              className="mt-2 font-serif text-3xl font-bold text-[#fdfbf7] md:text-4xl"
              style={{ color: '#fdfbf7', WebkitTextFillColor: '#fdfbf7' }}
            >
              Which NOLA GhostRiders Tour Is Right for You?
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-white/75">
              Compare tour formats, walking distances, and supernatural intensity before booking.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {/* Guide Card 1 */}
            <div data-ghost-guide-card className="rounded-xl border border-[#d4af37]/30 bg-[#14121a] p-6 shadow-lg">
              <div className="text-2xl mb-3">🚌</div>
              <h3
                className="font-serif text-xl font-bold text-[#fdfbf7]"
                style={{ color: '#fdfbf7', WebkitTextFillColor: '#fdfbf7' }}
              >
                BYOB Cemetery Bus Tour
              </h3>
              <p className="mt-1 text-xs font-bold text-[#d4af37]">Best For: Easy Comfort & Groups</p>
              <p className="mt-3 text-xs leading-relaxed text-white/75">
                If you want to avoid humid walking and cover multiple historic cemetery locations across town, this is the #1 choice. The climate-controlled bus lets you relax with your favorite drinks while hearing dramatic stories, with short guided walks inside illuminated vaults.
              </p>
              <ul className="mt-4 space-y-1.5 text-xs text-white/70">
                <li>• Walking: Minimal (under 0.5 miles)</li>
                <li>• Drinks: BYOB allowed on board (cans/cups)</li>
                <li>• Pace: Relaxed & social</li>
              </ul>
            </div>

            {/* Guide Card 2 */}
            <div data-ghost-guide-card className="rounded-xl border border-[#d4af37]/30 bg-[#14121a] p-6 shadow-lg">
              <div className="text-2xl mb-3">⚡</div>
              <h3
                className="font-serif text-xl font-bold text-[#fdfbf7]"
                style={{ color: '#fdfbf7', WebkitTextFillColor: '#fdfbf7' }}
              >
                Paranormal Investigation Tour
              </h3>
              <p className="mt-1 text-xs font-bold text-[#d4af37]">Best For: Hands-On Ghost Hunters</p>
              <p className="mt-3 text-xs leading-relaxed text-white/75">
                For travelers who want real tools rather than just ghost stories. You are handed actual EMF meters and temperature sensors to measure anomalies firsthand at notorious burial grounds and murder scenes.
              </p>
              <ul className="mt-4 space-y-1.5 text-xs text-white/70">
                <li>• Walking: Moderate cemetery strolls</li>
                <li>• Tools: Real EMF detectors provided</li>
                <li>• Pace: Analytical & atmospheric</li>
              </ul>
            </div>

            {/* Guide Card 3 */}
            <div data-ghost-guide-card className="rounded-xl border border-[#d4af37]/30 bg-[#14121a] p-6 shadow-lg">
              <div className="text-2xl mb-3">🕯️</div>
              <h3
                className="font-serif text-xl font-bold text-[#fdfbf7]"
                style={{ color: '#fdfbf7', WebkitTextFillColor: '#fdfbf7' }}
              >
                Destrehan Plantation Night Tour
              </h3>
              <p className="mt-1 text-xs font-bold text-[#d4af37]">Best For: History & Rare Night Access</p>
              <p className="mt-3 text-xs leading-relaxed text-white/75">
                Destrehan is normally closed at sundown. This excursion transports you out along the Mississippi River for a rare lantern-lit tour of Louisiana&apos;s oldest plantation house, hearing authentic historical records and supernatural folklore.
              </p>
              <ul className="mt-4 space-y-1.5 text-xs text-white/70">
                <li>• Transit: Roundtrip bus included</li>
                <li>• Setting: 1787 River Road estate</li>
                <li>• Pace: Exclusive small group</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Concierge Help CTA Section */}
      <section className="border-t border-[#d4af37]/20 bg-[#121017] px-6 py-12 md:py-16">
        <div className="mx-auto max-w-4xl rounded-xl border border-[#d4af37]/35 bg-gradient-to-r from-[#1b1722] to-[#120f18] p-8 md:p-12 shadow-[0_12px_40px_rgba(0,0,0,0.6)]">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#d4af37]">
                Free Concierge Assistance
              </span>
              <h2
                className="mt-2 font-serif text-2xl font-bold text-[#fdfbf7] md:text-3xl"
                style={{ color: '#fdfbf7', WebkitTextFillColor: '#fdfbf7' }}
              >
                Need Help Choosing the Right Tour?
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/75">
                Unsure which ghost tour fits your group size, mobility requirements, or evening dinner plans? Welcome to New Orleans Tours provides unbiased local guidance so you pick the perfect experience.
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
      <section className="border-t border-white/10 px-6 py-14 md:py-20">
        <div className="mx-auto max-w-4xl">
          <div className="mb-10 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d4af37]">Essential Info</p>
            <h2
              className="mt-2 font-serif text-3xl font-bold text-[#fdfbf7] md:text-4xl"
              style={{ color: '#fdfbf7', WebkitTextFillColor: '#fdfbf7' }}
            >
              NOLA GhostRiders FAQs
            </h2>
          </div>

          <div className="space-y-6">
            <div data-ghost-faq-card className="rounded-xl border border-white/10 bg-[#121016] p-6">
              <h3
                className="font-serif text-lg font-bold text-[#fdfbf7]"
                style={{ color: '#fdfbf7', WebkitTextFillColor: '#fdfbf7' }}
              >
                What is the BYOB policy on the NOLA GhostRiders bus tours?
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/70">
                Guests aged 21 and older are welcome to bring beer, wine, or cocktails in cans or plastic cups. For safety reasons, <strong className="text-white">absolutely no glass containers</strong> are permitted on board. Small personal soft-sided coolers that fit under your seat are permitted.
              </p>
            </div>

            <div data-ghost-faq-card className="rounded-xl border border-white/10 bg-[#121016] p-6">
              <h3
                className="font-serif text-lg font-bold text-[#fdfbf7]"
                style={{ color: '#fdfbf7', WebkitTextFillColor: '#fdfbf7' }}
              >
                What happens if it rains?
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/70">
                Tours operate rain or shine. One of the greatest advantages of NOLA GhostRiders&apos; bus excursions is that the majority of your tour takes place inside a climate-controlled, dry mini-coach, keeping you comfortable even during Louisiana evening showers.
              </p>
            </div>

            <div data-ghost-faq-card className="rounded-xl border border-white/10 bg-[#121016] p-6">
              <h3
                className="font-serif text-lg font-bold text-[#fdfbf7]"
                style={{ color: '#fdfbf7', WebkitTextFillColor: '#fdfbf7' }}
              >
                Where do the tours depart from?
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/70">
                Most walking and bus tours depart from convenient locations in or immediately adjacent to the French Quarter (e.g. 1300 Decatur St near the French Market). Destination plantation excursions offer downtown and French Quarter hotel pickup options. Exact meeting instructions are confirmed immediately upon booking.
              </p>
            </div>

            <div data-ghost-faq-card className="rounded-xl border border-white/10 bg-[#121016] p-6">
              <h3
                className="font-serif text-lg font-bold text-[#fdfbf7]"
                style={{ color: '#fdfbf7', WebkitTextFillColor: '#fdfbf7' }}
              >
                What is the cancellation and refund policy?
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/70">
                Most standard NOLA GhostRiders tours offer free cancellation with a full refund when cancelled at least 24 hours prior to departure. Specialty or private bookings may have distinct terms; please check the exact cancellation terms for your selected experience on Viator before completing checkout.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Marketplace Role Separation & Disclosures */}
      <footer className="border-t border-[#d4af37]/20 bg-[#0a090c] px-6 py-12 text-xs leading-relaxed text-white/50">
        <div className="mx-auto max-w-5xl grid gap-8 md:grid-cols-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#d4af37]">Operator Separation</p>
            <p className="mt-2">
              NOLA GhostRiders operates and fulfills all tour departures, transportation, equipment, and customer fulfillment. Welcome to New Orleans Tours is an independent editorial guide and referral service helping travelers evaluate and choose local experiences.
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#d4af37]">Affiliate Disclosure</p>
            <p className="mt-2">
              Welcome to New Orleans Tours is a verified partner. When you reserve experiences through links on this page, we may earn a referral commission at no additional cost to you. Bookings are processed securely on Viator.
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
