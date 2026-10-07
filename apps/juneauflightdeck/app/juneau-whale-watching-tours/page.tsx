import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Juneau Whale Watching Tours | Compare Auke Bay Boat Excursions & Weather Backups",
  description:
    "Compare Juneau whale watching tours from Auke Bay. Guaranteed humpback sightings, heated cabins, cruise dock shuttles, and same-day helicopter weather backups.",
  alternates: { canonical: "https://juneauflightdeck.com/juneau-whale-watching-tours" },
  openGraph: {
    title: "Juneau Whale Watching Tours | Compare Auke Bay Excursions & Weather Backups",
    description:
      "Plan your Juneau whale watching tour with cruise-dock transfers, guaranteed whale sightings, and flight-day backup coordination.",
    url: "https://juneauflightdeck.com/juneau-whale-watching-tours",
    siteName: "Juneau Flight Deck",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Juneau Whale Watching Tours | Juneau Flight Deck",
    description: "Compare Juneau whale watching boat tours, port timing buffers, and flight-day backups.",
  },
};

const whaleFaqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Are whale sightings guaranteed on Juneau whale watching tours?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Premier Juneau whale watching operators operating out of Auke Bay provide a 100% whale sighting guarantee from May through September. Humpback whales migrate to the nutrient-rich waters of Saginaw Channel and Favorite Channel each summer to feed. If no whales are spotted, operators provide a full or partial cash refund or excursion credit according to their policy.",
      },
    },
    {
      "@type": "Question",
      name: "Where do Juneau whale watching boats depart from?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Most tours depart from Auke Bay Harbor or Statter Harbor, located approximately 12 miles (20 to 25 minutes) north of the downtown Juneau cruise ship docks. Tour packages include round-trip motorcoach shuttle transportation directly from your ship berth.",
      },
    },
    {
      "@type": "Question",
      name: "How much time is needed for a Juneau whale watching excursion?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Standard whale watching tours require 3.25 to 3.75 hours dock-to-dock. This includes 45 to 50 minutes of round-trip shuttle transit and approximately 2 to 2.5 hours on the water. Whale watching and Mendenhall Glacier combination tours run 4.5 to 5.5 hours total.",
      },
    },
    {
      "@type": "Question",
      name: "Can whale watching operate if helicopter tours are canceled for weather?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Tour boats operate safely at sea level in sheltered coastal fjords, whereas helicopters require clear cloud ceilings through mountain passes. On days when low cloud decks ground glacier flights, whale watching tours almost always operate normally, making them Juneau's premier same-day alternative.",
      },
    },
    {
      "@type": "Question",
      name: "What should I wear on a Juneau whale watching boat?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Dress in warm layers with a waterproof jacket, hat, and gloves. Even in mid-summer, winds on the water can feel brisk (45°F to 60°F). Tour boats feature heated indoor cabins with large viewing windows, but you will want warm gear when stepping onto the outdoor viewing decks.",
      },
    },
  ],
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: "https://juneauflightdeck.com/",
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Whale Watching Tours",
      item: "https://juneauflightdeck.com/juneau-whale-watching-tours",
    },
  ],
};

export default function WhaleWatchingPage() {
  return (
    <main id="main-content" className="page-shell" style={{ maxWidth: 1040, margin: "0 auto", padding: "40px 20px 80px" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(whaleFaqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {/* Hero Section */}
      <section style={{ textAlign: "center", marginBottom: 36 }}>
        <p className="eyebrow" style={{ color: "var(--accent, #f0b35b)", marginBottom: 8 }}>
          Official Viator Partner · Auke Bay Marine Excursions
        </p>
        <h1
          style={{
            fontSize: "clamp(1.2rem, 4.2vw, 2.75rem)",
            fontWeight: 900,
            lineHeight: 1.2,
            color: "var(--text, #ffffff)",
            margin: "0 0 16px",
            letterSpacing: "-0.02em",
            wordBreak: "keep-all",
            overflowWrap: "normal",
          }}
        >
          Compare &amp; Book Juneau Whale Watching Excursions
        </h1>
        <p
          style={{
            fontSize: "1.02rem",
            lineHeight: 1.6,
            color: "var(--ice, #9ed9ff)",
            maxWidth: 820,
            margin: "0 auto 16px",
          }}
        >
          Juneau Flight Deck helps Alaska cruise passengers compare and book helicopter, glacier, dog-sledding, and whale-watching excursions. We provide operator comparisons and cruise-port timing guidance, availability alerts for sold-out tours, and alternatives when weather disrupts plans. Tours are operated by the named local providers.
        </p>
        <p
          style={{
            fontSize: "0.95rem",
            lineHeight: 1.6,
            color: "var(--muted, #cbd5e1)",
            maxWidth: 760,
            margin: "0 auto 24px",
          }}
        >
          Auke Bay and Favorite Channel are home to one of Alaska&apos;s richest summer humpback whale feeding grounds. Whether booked as your main Juneau experience or chosen as a reliable sea-level pivot when mountain clouds ground helicopters, explore top-rated boat options below.
        </p>

        <div className="jfd-hero-actions-responsive" style={{ justifyContent: "center" }}>
          <a href="#tours" className="jfd-hero-btn-primary">
            Explore Whale Watching Tours &darr;
          </a>
          <Link href="/helicopter" className="jfd-hero-btn-secondary">
            Compare Helicopter Flights
          </Link>
          <Link href="/juneau/what-to-do-if-helicopter-tour-canceled" className="jfd-hero-btn-secondary">
            Weather Backup Guide
          </Link>
        </div>
      </section>

      {/* 4 Core Pillars of JFD Whale Watching */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
          marginBottom: 40,
        }}
        aria-label="Whale Watching Benefits"
      >
        <div style={{ background: "rgba(8, 28, 42, 0.75)", border: "1px solid var(--line)", borderRadius: 14, padding: "20px" }}>
          <div style={{ fontSize: "1.5rem", marginBottom: 6 }}>🐋</div>
          <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#ffffff", margin: "0 0 6px" }}>100% Sighting Guarantee</h3>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--muted)", lineHeight: 1.55 }}>
            Local Juneau marine operators offer full whale sighting guarantees from May through September. If no humpbacks are seen, refunds or credits apply per operator policy.
          </p>
        </div>

        <div style={{ background: "rgba(8, 28, 42, 0.75)", border: "1px solid var(--line)", borderRadius: 14, padding: "20px" }}>
          <div style={{ fontSize: "1.5rem", marginBottom: 6 }}>🚐</div>
          <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#ffffff", margin: "0 0 6px" }}>Direct Cruise Dock Shuttles</h3>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--muted)", lineHeight: 1.55 }}>
            Complimentary round-trip shuttles pick you up right outside ship security at Franklin Dock, AJ Dock, Marine Park, or Steamship Wharf with a scenic 20-min ride.
          </p>
        </div>

        <div style={{ background: "rgba(8, 28, 42, 0.75)", border: "1px solid var(--line)", borderRadius: 14, padding: "20px" }}>
          <div style={{ fontSize: "1.5rem", marginBottom: 6 }}>⏱️</div>
          <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#ffffff", margin: "0 0 6px" }}>Ship-Safe Return Buffers</h3>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--muted)", lineHeight: 1.55 }}>
            All tour schedules are matched against cruise port itineraries, protecting a 90+ minute buffer back to your ship before all-aboard call.
          </p>
        </div>

        <div style={{ background: "rgba(8, 28, 42, 0.75)", border: "1px solid var(--line)", borderRadius: 14, padding: "20px" }}>
          <div style={{ fontSize: "1.5rem", marginBottom: 6 }}>🌧️</div>
          <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#ffffff", margin: "0 0 6px" }}>The #1 Flight Weather Backup</h3>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--muted)", lineHeight: 1.55 }}>
            Marine tours operate at sea level in sheltered waters. When low mountain ceilings ground helicopters, whale watching boat excursions run with 98%+ reliability.
          </p>
        </div>
      </section>

      {/* Featured Tour Cards Grid */}
      <section id="tours" style={{ marginBottom: 48 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <h2 style={{ fontSize: "1.85rem", fontWeight: 900, color: "#ffffff", margin: "0 0 8px" }}>
            Featured Juneau Whale Watching Tours
          </h2>
          <p style={{ color: "var(--muted)", fontSize: "0.95rem", margin: 0 }}>
            Book through our official Viator partner checkout with real-time departure verification and free cancellation.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
          {/* Tour Card 1: Small Boat */}
          <article
            style={{
              background: "linear-gradient(180deg, rgba(8, 28, 42, 0.95) 0%, rgba(5, 18, 28, 0.98) 100%)",
              border: "1px solid var(--line)",
              borderRadius: "var(--radius-lg, 20px)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ padding: 24, flex: 1, display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--accent, #f0b35b)", textTransform: "uppercase" }}>
                  Most Popular · Small Group
                </span>
                <span style={{ fontSize: "0.8rem", color: "#86efac", fontWeight: 700 }}>★ 4.9 (Top Rated)</span>
              </div>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#ffffff", margin: "0 0 8px" }}>
                Small-Boat Juneau Whale Watching from Auke Bay
              </h3>
              <p style={{ fontSize: "0.88rem", color: "var(--muted)", lineHeight: 1.55, margin: "0 0 14px" }}>
                Experience humpback whales close to water level on high-speed custom jet boats holding just 20 to 28 guests. Features 360-degree walk-around decks, heated cabin, and hydrophone sound systems.
              </p>

              <div style={{ marginTop: "auto", paddingTop: 14, borderTop: "1px solid var(--line)", marginBottom: 16 }}>
                <div style={{ fontSize: "0.82rem", color: "var(--ice)", marginBottom: 4 }}>
                  ⏱ <strong>Duration:</strong> ~3.5 hours dock-to-dock (2+ hours on water)
                </div>
                <div style={{ fontSize: "0.82rem", color: "var(--ice)", marginBottom: 4 }}>
                  🚐 <strong>Transfers:</strong> Round-trip shuttle from cruise ship dock included
                </div>
                <div style={{ fontSize: "0.82rem", color: "#86efac" }}>
                  ✓ 100% Whale Sighting Guarantee · Free cancellation up to 24h prior
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                <div>
                  <div style={{ fontSize: "0.72rem", color: "var(--muted)", textTransform: "uppercase" }}>From</div>
                  <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--accent-strong, #ffd596)" }}>$175</div>
                </div>
                <a
                  href="https://www.viator.com/searchResults/all?text=Juneau+whale+watching+small+boat&pid=P00058396&mcid=42383&medium=api"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="button button-primary"
                  style={{ padding: "10px 18px", fontSize: "0.88rem", fontWeight: 800 }}
                >
                  Check Dates on Viator &rarr;
                </a>
              </div>
            </div>
          </article>

          {/* Tour Card 2: Whale & Mendenhall Glacier Combo */}
          <article
            style={{
              background: "linear-gradient(180deg, rgba(8, 28, 42, 0.95) 0%, rgba(5, 18, 28, 0.98) 100%)",
              border: "1px solid var(--line)",
              borderRadius: "var(--radius-lg, 20px)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ padding: 24, flex: 1, display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--accent, #f0b35b)", textTransform: "uppercase" }}>
                  Best Value Combo Excursion
                </span>
                <span style={{ fontSize: "0.8rem", color: "#86efac", fontWeight: 700 }}>★ 4.8 (Verified)</span>
              </div>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#ffffff", margin: "0 0 8px" }}>
                Whale Watching &amp; Mendenhall Glacier Combo
              </h3>
              <p style={{ fontSize: "0.88rem", color: "var(--muted)", lineHeight: 1.55, margin: "0 0 14px" }}>
                The quintessential Juneau combo: 2 hours of boat whale watching in Auke Bay followed by free exploration time at Mendenhall Glacier Recreation Area, Nugget Falls, and Visitor Center trails.
              </p>

              <div style={{ marginTop: "auto", paddingTop: 14, borderTop: "1px solid var(--line)", marginBottom: 16 }}>
                <div style={{ fontSize: "0.82rem", color: "var(--ice)", marginBottom: 4 }}>
                  ⏱ <strong>Duration:</strong> ~4.5 to 5 hours dock-to-dock
                </div>
                <div style={{ fontSize: "0.82rem", color: "var(--ice)", marginBottom: 4 }}>
                  🚐 <strong>Transfers:</strong> Ship to boat, boat to glacier, glacier to ship
                </div>
                <div style={{ fontSize: "0.82rem", color: "#86efac" }}>
                  ✓ Guaranteed Whale Sightings · US Forest Service entry included
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                <div>
                  <div style={{ fontSize: "0.72rem", color: "var(--muted)", textTransform: "uppercase" }}>From</div>
                  <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--accent-strong, #ffd596)" }}>$195</div>
                </div>
                <a
                  href="https://www.viator.com/searchResults/all?text=Juneau+whale+watching+mendenhall+glacier+combo&pid=P00058396&mcid=42383&medium=api"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="button button-primary"
                  style={{ padding: "10px 18px", fontSize: "0.88rem", fontWeight: 800 }}
                >
                  Check Dates on Viator &rarr;
                </a>
              </div>
            </div>
          </article>

          {/* Tour Card 3: Private Charter */}
          <article
            style={{
              background: "linear-gradient(180deg, rgba(8, 28, 42, 0.95) 0%, rgba(5, 18, 28, 0.98) 100%)",
              border: "1px solid var(--line)",
              borderRadius: "var(--radius-lg, 20px)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ padding: 24, flex: 1, display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--accent, #f0b35b)", textTransform: "uppercase" }}>
                  Exclusive · Up to 6 or 12 Pax
                </span>
                <span style={{ fontSize: "0.8rem", color: "#86efac", fontWeight: 700 }}>VIP Family Experience</span>
              </div>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#ffffff", margin: "0 0 8px" }}>
                Private Juneau Whale Watching Charter
              </h3>
              <p style={{ fontSize: "0.88rem", color: "var(--muted)", lineHeight: 1.55, margin: "0 0 14px" }}>
                Reserve an entire vessel exclusively for your family or traveling group. Departure time is custom-tailored to your exact ship docking window, with a dedicated naturalist captain.
              </p>

              <div style={{ marginTop: "auto", paddingTop: 14, borderTop: "1px solid var(--line)", marginBottom: 16 }}>
                <div style={{ fontSize: "0.82rem", color: "var(--ice)", marginBottom: 4 }}>
                  ⏱ <strong>Duration:</strong> 3.5 to 4 hours customizable
                </div>
                <div style={{ fontSize: "0.82rem", color: "var(--ice)", marginBottom: 4 }}>
                  🚐 <strong>Transfers:</strong> Private VIP van transfer from your ship berth
                </div>
                <div style={{ fontSize: "0.82rem", color: "#86efac" }}>
                  ✓ Dedicated boat &amp; captain · Tailored marine navigation
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                <div>
                  <div style={{ fontSize: "0.72rem", color: "var(--muted)", textTransform: "uppercase" }}>Per Boat From</div>
                  <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--accent-strong, #ffd596)" }}>$1,250</div>
                </div>
                <a
                  href="https://www.viator.com/searchResults/all?text=Juneau+private+whale+watching+charter&pid=P00058396&mcid=42383&medium=api"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="button button-primary"
                  style={{ padding: "10px 18px", fontSize: "0.88rem", fontWeight: 800 }}
                >
                  Check Charters on Viator &rarr;
                </a>
              </div>
            </div>
          </article>
        </div>
      </section>

      {/* Cruise Ship Port Timing & Dock Transfers */}
      <section
        style={{
          background: "var(--panel)",
          border: "1px solid var(--line-strong)",
          borderRadius: "var(--radius-lg, 20px)",
          padding: "32px 28px",
          marginBottom: 40,
        }}
      >
        <h2 style={{ fontSize: "1.45rem", fontWeight: 800, color: "var(--text, #ffffff)", margin: "0 0 12px" }}>
          Cruise Port Logistics &amp; Safe Dock Return Timing
        </h2>
        <p style={{ lineHeight: 1.65, color: "var(--muted)", margin: "0 0 16px" }}>
          Auke Bay is located approximately 12 miles north of downtown Juneau. All reputable whale watching providers provide dedicated motorcoach shuttles that pick you up directly at your ship dock.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14, marginBottom: 20 }}>
          <div style={{ background: "rgba(3, 14, 23, 0.6)", borderRadius: 10, padding: "14px 16px", border: "1px solid var(--line)" }}>
            <strong style={{ color: "var(--accent)" }}>Downtown Berths (Franklin, Marine Park, CT):</strong>
            <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "var(--muted)" }}>
              Shuttle vans stage directly along South Franklin Street outside the terminal gates. Transfer time to Auke Bay is 20 minutes.
            </p>
          </div>
          <div style={{ background: "rgba(3, 14, 23, 0.6)", borderRadius: 10, padding: "14px 16px", border: "1px solid var(--line)" }}>
            <strong style={{ color: "var(--accent)" }}>AJ Dock (Norwegian, Oceania):</strong>
            <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "var(--muted)" }}>
              Shuttle pickup is right at the AJ terminal staging circle. Transfer time to Auke Bay is 25 minutes.
            </p>
          </div>
          <div style={{ background: "rgba(3, 14, 23, 0.6)", borderRadius: 10, padding: "14px 16px", border: "1px solid var(--line)" }}>
            <strong style={{ color: "var(--accent)" }}>Minimum Port Window Required:</strong>
            <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "var(--muted)" }}>
              We recommend at least a 5-hour total port call in Juneau to comfortably enjoy whale watching with a 90-minute safe buffer before all-aboard.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link href="/helicopter-waitlist" className="button button-secondary" style={{ fontSize: "0.88rem" }}>
            Check Your Ship Dock Berth &rarr;
          </Link>
          <Link href="/temsco-vs-coastal-vs-northstar-juneau" className="button button-secondary" style={{ fontSize: "0.88rem" }}>
            Compare Helicopter Operators &rarr;
          </Link>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section style={{ borderTop: "1px solid var(--line)", paddingTop: 32 }}>
        <h2 style={{ fontSize: "1.45rem", fontWeight: 800, color: "#ffffff", marginBottom: 20 }}>
          Frequently Asked Questions About Juneau Whale Watching
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {whaleFaqSchema.mainEntity.map((faq, idx) => (
            <div
              key={idx}
              style={{
                background: "rgba(3, 14, 23, 0.5)",
                border: "1px solid var(--line)",
                borderRadius: 12,
                padding: "18px 20px",
              }}
            >
              <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--accent)", margin: "0 0 8px" }}>
                {faq.name}
              </h3>
              <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--muted)", lineHeight: 1.6 }}>
                {faq.acceptedAnswer.text}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
