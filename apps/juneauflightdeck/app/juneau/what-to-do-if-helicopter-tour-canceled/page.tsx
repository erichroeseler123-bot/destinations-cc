import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "What to Do If Your Juneau Helicopter Tour Is Canceled | Juneau Flight Deck",
  description:
    "We can do what no website can: we look out the window and diagnose acute Juneau weather hours early. Real passenger sob stories and how our proactive whale backup saves your port day.",
  alternates: {
    canonical: "https://juneauflightdeck.com/juneau/what-to-do-if-helicopter-tour-canceled",
  },
  openGraph: {
    title: "What to Do If Your Juneau Helicopter Tour Is Canceled | Juneau Flight Deck",
    description:
      "We can do what no website can: we look out the window and diagnose acute Juneau weather hours early. Real passenger sob stories and how our proactive whale backup saves your port day.",
    url: "https://juneauflightdeck.com/juneau/what-to-do-if-helicopter-tour-canceled",
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Why do Juneau helicopter tours get canceled for weather?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Helicopter glacier flights operate under strict FAA Visual Flight Rules (VFR). While downtown Juneau and the cruise ship docks may experience light rain or calm winds, mountain passes leading to the Mendenhall and Herbert Glaciers can experience cloud ceilings below 1,000 feet, sudden wind shear, or dense fog that prevents safe flight ingress.",
      },
    },
    {
      "@type": "Question",
      name: "When does the operator officially cancel a flight?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Operating chief pilots and dispatchers make the final go/no-go determination 45 to 90 minutes prior to scheduled departure. They hold off as long as safely possible in case a mountain weather window opens up.",
      },
    },
    {
      "@type": "Question",
      name: "How does Juneau Flight Deck have early warning before an official cancellation?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "We can do something no website or cruise app can do: we look out the window. We live right here in Juneau and have the local experience to diagnose acute weather patterns hours ahead—tracking FAA pass webcams (Gastineau Channel, Herbert Glacier, Mendenhall Valley), ridge-top weather stations, and mountain cloud decks. We typically know a grounding is imminent 2 to 3 hours before the official cutoff call.",
      },
    },
    {
      "@type": "Question",
      name: "How does the proactive backup plan protect our port day?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "When 400+ helicopter passengers are canceled simultaneously across 3 to 4 cruise ships, local dockside excursions and whale watching boats sell out within 15 minutes. Because we detect deteriorating weather hours in advance, we actively work on securing alternative activities—such as Auke Bay whale watching catamarans—at your expense before your tour is even canceled.",
      },
    },
    {
      "@type": "Question",
      name: "Do I get a full refund if my helicopter tour is canceled?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. When an operator cancels a flight due to weather, standard operator and Viator policy provides a 100% refund back to your original payment card. Alternative backup activities are booked separately at your expense and depend on real-time availability.",
      },
    },
  ],
};

export default function JuneauHelicopterCanceledPage() {
  return (
    <main className="page-shell" style={{ maxWidth: 940, margin: "0 auto", padding: "40px 20px 80px" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div style={{ marginBottom: 32 }}>
        <p className="eyebrow" style={{ color: "var(--accent, #f0b35b)", marginBottom: 8 }}>
          Juneau Flight Deck · Weather Contingency &amp; Early Warning
        </p>
        <h1
          style={{
            fontSize: "clamp(2rem, 4.5vw, 2.75rem)",
            fontWeight: 900,
            lineHeight: 1.18,
            color: "var(--text, #ffffff)",
            margin: "0 0 16px",
            letterSpacing: "-0.02em",
          }}
        >
          What to Do if Your Juneau Helicopter Tour Is Canceled
        </h1>
        <p
          style={{
            fontSize: "1.12rem",
            lineHeight: 1.6,
            color: "var(--muted, #94a3b8)",
            maxWidth: 780,
            margin: 0,
          }}
        >
          When mountain weather grounds glacier flights in Juneau, hundreds of cruise passengers scramble 
          for remaining excursions at the exact same moment. Here is how our local dispatch spots weather groundings 
          hours in advance—and works to secure alternative activities before your flight is even officially canceled.
        </p>
      </div>

      {/* The Local Edge: We Look Out The Window */}
      <section
        style={{
          background: "linear-gradient(135deg, rgba(14, 165, 233, 0.12) 0%, rgba(15, 23, 42, 0.8) 100%)",
          border: "1px solid rgba(56, 189, 248, 0.35)",
          borderRadius: "var(--radius-lg, 16px)",
          padding: "30px 26px",
          marginBottom: "36px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: "1.2rem" }}>👁️</span>
          <span
            style={{
              fontSize: "0.78rem",
              fontWeight: 800,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--ice, #7dd3fc)",
            }}
          >
            What No Website Algorithm Can Do
          </span>
        </div>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 900, color: "var(--text, #ffffff)", margin: "0 0 14px", lineHeight: 1.25 }}>
          We Can Look Out the Window. Because We Live Here.
        </h2>
        <p style={{ lineHeight: 1.65, color: "#e2e8f0", margin: "0 0 14px", fontSize: "1rem" }}>
          No national booking algorithm, Miami cruise desk, or generic weather app can look out the window at the Gastineau Channel, the Mount Roberts ridge, and the Herbert Glacier basin. We live right here in Juneau. We have the day-in, day-out experience to diagnose acute weather patterns at an expert level—watching wind shear drifts, cloud shelves, and ceiling trends before computer models even register them.
        </p>
        <p style={{ lineHeight: 1.65, color: "#e2e8f0", margin: "0 0 18px", fontSize: "1rem" }}>
          <strong>This is big money for travelers, and we take it seriously.</strong> This is our livelihood, it&apos;s all we do, and we are good at it. When you coordinate your Juneau flight through us:
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
          <div style={{ background: "rgba(3, 14, 23, 0.6)", borderRadius: 10, padding: "16px", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ color: "var(--accent, #f0b35b)", fontWeight: 800, fontSize: "0.9rem", marginBottom: 4 }}>💵 Money Off Ship Prices</div>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--muted, #cbd5e1)", lineHeight: 1.5 }}>
              Lower price than the cruise ship excursion desk for flights with the same premier operators (TEMSCO, Coastal, NorthStar).
            </p>
          </div>
          <div style={{ background: "rgba(3, 14, 23, 0.6)", borderRadius: 10, padding: "16px", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ color: "#86efac", fontWeight: 800, fontSize: "0.9rem", marginBottom: 4 }}>🛡️ Guaranteed Viator Booking</div>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--muted, #cbd5e1)", lineHeight: 1.5 }}>
              Official Tripadvisor/Viator partner checkout with Part 135 FAA operators, flexible cancellation terms, and 100% weather refunds.
            </p>
          </div>
          <div style={{ background: "rgba(3, 14, 23, 0.6)", borderRadius: 10, padding: "16px", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ color: "var(--ice, #7dd3fc)", fontWeight: 800, fontSize: "0.9rem", marginBottom: 4 }}>🐋 Ready When It Cancels</div>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--muted, #cbd5e1)", lineHeight: 1.5 }}>
              If your helicopter cancels, we book you on an available whale watch at your expense—and we are already lined up and ready the moment it cancels.
            </p>
          </div>
        </div>
      </section>

      {/* Real Passenger Sob Stories */}
      <section
        style={{
          background: "var(--panel, rgba(17, 41, 61, 0.45))",
          border: "1px solid var(--line, rgba(255, 255, 255, 0.1))",
          borderRadius: "var(--radius-lg, 16px)",
          padding: "32px 26px",
          marginBottom: "36px",
        }}
      >
        <div style={{ color: "#f87171", fontSize: "0.78rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
          The True Cost of Having No Backup Plan
        </div>
        <h2 style={{ fontSize: "1.45rem", fontWeight: 800, color: "var(--text, #ffffff)", margin: "0 0 8px" }}>
          Real Juneau Sob Stories: When Waiting Wastes Your Only Day in Port
        </h2>
        <p style={{ lineHeight: 1.6, color: "var(--muted, #cbd5e1)", margin: "0 0 24px" }}>
          These are not hypothetical warnings. Every single cruise season, hundreds of passengers get strung along all day or caught in dockside stampedes when mountain weather rolls in:
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Story 1 */}
          <div
            style={{
              background: "rgba(3, 14, 23, 0.75)",
              border: "1px solid rgba(239, 68, 68, 0.25)",
              borderRadius: 14,
              padding: "20px 22px",
            }}
          >
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ color: "#fca5a5", fontWeight: 800, fontSize: "0.95rem" }}>
                &ldquo;Strung Along All Day on the Ship—Did Nothing in the End&rdquo;
              </span>
              <span style={{ fontSize: "0.78rem", color: "var(--muted, #94a3b8)", background: "rgba(255,255,255,0.06)", padding: "3px 8px", borderRadius: 6 }}>
                Passenger on Majestic Princess · July 2024
              </span>
            </div>
            <p style={{ margin: "0 0 10px", fontSize: "0.9rem", lineHeight: 1.6, color: "#e2e8f0", fontStyle: "italic" }}>
              &ldquo;Our glacier dog sledding flight was originally set for 9:30 AM. At 8:45 AM, the ship excursion desk announced a &apos;temporary weather hold&apos; and told us to wait in the theater until 11:00 AM. At 11:00 AM, they pushed it to 1:15 PM. We were terrified to leave the dock area in case our names were called. At 2:30 PM, they finally announced all remaining flights were officially canceled. By that time, every single whale watch boat, tram car, and shuttle in Juneau was completely sold out. We ended up wandering around the dockside souvenir shops in the drizzle and walked back up the gangway having seen absolutely nothing of Alaska. Our entire day in Juneau was flushed down the drain.&rdquo;
            </p>
            <div style={{ fontSize: "0.82rem", color: "#f87171", fontWeight: 700 }}>
              ⚠️ The Trap: Waiting on the operator&apos;s rolling delay cycle eats your port clock until no alternatives remain.
            </div>
          </div>

          {/* Story 2 */}
          <div
            style={{
              background: "rgba(3, 14, 23, 0.75)",
              border: "1px solid rgba(239, 68, 68, 0.25)",
              borderRadius: 14,
              padding: "20px 22px",
            }}
          >
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ color: "#fca5a5", fontWeight: 800, fontSize: "0.95rem" }}>
                &ldquo;The 15-Minute Dockside Stampede&rdquo;
              </span>
              <span style={{ fontSize: "0.78rem", color: "var(--muted, #94a3b8)", background: "rgba(255,255,255,0.06)", padding: "3px 8px", borderRadius: 6 }}>
                Family of 4 on Ovation of the Seas · August 2024
              </span>
            </div>
            <p style={{ margin: "0 0 10px", fontSize: "0.9rem", lineHeight: 1.6, color: "#e2e8f0", fontStyle: "italic" }}>
              &ldquo;We were literally standing at the South Franklin pier waiting for our bus to the heliport when a company rep came out with a clipboard and announced the mountain passes were closed for the day. Instantly, over 100 passengers pulled out their phones and rushed the independent tour booths along the boardwalk. I tried to book a catamaran whale watch online, but by the time I entered my credit card info, the seats were gone. Every operator said the same thing: &apos;Sorry, we just sold out our remaining 40 seats five minutes ago when TEMSCO canceled.&apos; If we had known 2 hours earlier that conditions were collapsing, we could have had backup seats ready to go.&rdquo;
            </p>
            <div style={{ fontSize: "0.82rem", color: "#f87171", fontWeight: 700 }}>
              ⚠️ The Trap: When 400 helicopter seats cancel simultaneously, water tours sell out within 15 minutes.
            </div>
          </div>

          {/* Story 3 */}
          <div
            style={{
              background: "rgba(3, 14, 23, 0.75)",
              border: "1px solid rgba(239, 68, 68, 0.25)",
              borderRadius: 14,
              padding: "20px 22px",
            }}
          >
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ color: "#fca5a5", fontWeight: 800, fontSize: "0.95rem" }}>
                &ldquo;It Was Sunny at the Port, But Socked In on the Icefield&rdquo;
              </span>
              <span style={{ fontSize: "0.78rem", color: "var(--muted, #94a3b8)", background: "rgba(255,255,255,0.06)", padding: "3px 8px", borderRadius: 6 }}>
                Couple on Nieuw Amsterdam · June 2024
              </span>
            </div>
            <p style={{ margin: "0 0 10px", fontSize: "0.9rem", lineHeight: 1.6, color: "#e2e8f0", fontStyle: "italic" }}>
              &ldquo;We stepped off the ship into 62-degree sunshine and thought we had hit the weather lottery. We couldn&apos;t understand why our pilot canceled 45 minutes before departure. Nobody explained that the Gastineau Channel weather has zero correlation with the Herbert Glacier icefield, where a cloud deck at 800 feet blocked the pass. Because we thought the weather was great, we hadn&apos;t even thought about a backup plan. By noon, the docks were packed, tours were full, and we spent the afternoon sitting on a bench eating fish and chips.&rdquo;
            </p>
            <div style={{ fontSize: "0.82rem", color: "#f87171", fontWeight: 700 }}>
              ⚠️ The Trap: Sunny dock weather fools passengers into complacency while mountain ridges are already socked in.
            </div>
          </div>
        </div>
      </section>

      {/* The 2-3 Hour Early Warning Callout */}
      <section
        style={{
          background: "linear-gradient(135deg, rgba(240, 179, 91, 0.12) 0%, rgba(14, 165, 233, 0.08) 100%)",
          border: "1px solid rgba(240, 179, 91, 0.35)",
          borderRadius: "var(--radius-lg, 16px)",
          padding: "28px 24px",
          marginBottom: "36px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: "1.2rem" }}>⚡</span>
          <span
            style={{
              fontSize: "0.78rem",
              fontWeight: 800,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--accent-strong, #f59e0b)",
            }}
          >
            The Early Warning Solution
          </span>
        </div>
        <h2 style={{ fontSize: "1.45rem", fontWeight: 800, color: "var(--text, #ffffff)", margin: "0 0 12px" }}>
          We Know Your Flight Is Heading Toward a Cancellation Hours Before It Happens
        </h2>
        <p style={{ lineHeight: 1.65, color: "#e2e8f0", margin: "0 0 14px", fontSize: "0.98rem" }}>
          Helicopter operators cannot officially cancel a flight until 45 to 90 minutes before lift in case a mountain 
          hole opens up. But our local dispatch monitors real-time ridge-top weather stations, FAA pass cameras, and cloud ceiling 
          trends across the Chilkat and Coast Ranges.
        </p>
        <p style={{ lineHeight: 1.65, color: "#e2e8f0", margin: 0, fontSize: "0.98rem" }}>
          <strong>We have a very clear idea that a flight is going to be grounded hours before the official cancellation notification is issued.</strong> Rather than waiting for the cutoff text, we use that critical head start to identify and secure alternative shore activities before dockside availability disappears.
        </p>
      </section>

      {/* The Proactive Alternative Workflow */}
      <section
        style={{
          background: "rgba(3, 14, 23, 0.7)",
          border: "1px solid var(--line, rgba(255, 255, 255, 0.1))",
          borderRadius: "var(--radius-lg, 16px)",
          padding: "30px 26px",
          marginBottom: "36px",
        }}
      >
        <h2 style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--text, #ffffff)", margin: "0 0 16px" }}>
          How Our Proactive Weather Backup Workflow Operates
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", gap: 14 }}>
            <div style={{ minWidth: 32, height: 32, borderRadius: "50%", background: "var(--accent, #f0b35b)", color: "#000", fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem" }}>
              1
            </div>
            <div>
              <h4 style={{ color: "var(--text, #ffffff)", fontSize: "1.05rem", margin: "0 0 4px" }}>
                Continuous Mountain Pass &amp; Webcam Tracking
              </h4>
              <p style={{ margin: 0, fontSize: "0.9rem", lineHeight: 1.55, color: "var(--muted, #cbd5e1)" }}>
                We track FAA pass webcams at Gastineau Channel, Herbert Glacier, and Mendenhall Valley along with ridge-top weather stations. While conditions at sea level look fine, we track the cloud ceiling drops that dictate mountain VFR flight rules.
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: 14 }}>
            <div style={{ minWidth: 32, height: 32, borderRadius: "50%", background: "var(--accent, #f0b35b)", color: "#000", fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem" }}>
              2
            </div>
            <div>
              <h4 style={{ color: "var(--text, #ffffff)", fontSize: "1.05rem", margin: "0 0 4px" }}>
                Proactive Capacity Holds Before Official Cancellation
              </h4>
              <p style={{ margin: 0, fontSize: "0.9rem", lineHeight: 1.55, color: "var(--muted, #cbd5e1)" }}>
                When conditions clearly trend toward a grounding, our team begins working on securing alternative activities—specifically heated catamaran whale watching out of Auke Bay—at your expense before official flight cancellations are announced.
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: 14 }}>
            <div style={{ minWidth: 32, height: 32, borderRadius: "50%", background: "var(--accent, #f0b35b)", color: "#000", fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem" }}>
              3
            </div>
            <div>
              <h4 style={{ color: "var(--text, #ffffff)", fontSize: "1.05rem", margin: "0 0 4px" }}>
                Direct Coordination &amp; Ship All-Aboard Match
              </h4>
              <p style={{ margin: 0, fontSize: "0.9rem", lineHeight: 1.55, color: "var(--muted, #cbd5e1)" }}>
                We contact you directly with available options that strictly respect your ship&apos;s all-aboard time with a mandatory 90-minute safety buffer. You decide whether to take the alternative or take a day in town.
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: 14 }}>
            <div style={{ minWidth: 32, height: 32, borderRadius: "50%", background: "var(--accent, #f0b35b)", color: "#000", fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem" }}>
              4
            </div>
            <div>
              <h4 style={{ color: "var(--text, #ffffff)", fontSize: "1.05rem", margin: "0 0 4px" }}>
                100% Weather Refund on Canceled Flights
              </h4>
              <p style={{ margin: 0, fontSize: "0.9rem", lineHeight: 1.55, color: "var(--muted, #cbd5e1)" }}>
                Because the helicopter flight was cancelled for weather, the operator (or Viator) issues a 100% full refund back to your original payment card. The backup whale watch is booked separately at your expense based on confirmed capacity.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Best Alternatives That Run in Helicopter Weather */}
      <section
        style={{
          background: "var(--panel, rgba(17, 41, 61, 0.45))",
          border: "1px solid var(--line, rgba(255, 255, 255, 0.1))",
          borderRadius: "var(--radius-lg, 16px)",
          padding: "30px 26px",
          marginBottom: "36px",
        }}
      >
        <h2 style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--text, #ffffff)", margin: "0 0 12px" }}>
          What Alternatives Run When Helicopters Are Grounded?
        </h2>
        <p style={{ lineHeight: 1.6, color: "var(--muted, #cbd5e1)", margin: "0 0 20px" }}>
          Helicopters are grounded by cloud ceilings at 1,500–3,000 feet. Sea level excursions operate in almost all Southeast Alaska weather:
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
          <div style={{ background: "rgba(3, 14, 23, 0.6)", border: "1px solid var(--line, rgba(255, 255, 255, 0.08))", borderRadius: 12, padding: "18px" }}>
            <h3 style={{ color: "var(--accent, #f0b35b)", fontSize: "1.05rem", margin: "0 0 6px" }}>
              🐋 Auke Bay Whale Watching
            </h3>
            <p style={{ fontSize: "0.88rem", lineHeight: 1.55, color: "var(--muted, #cbd5e1)", margin: "0 0 10px" }}>
              Heated catamarans explore Stephens Passage and Saginaw Channel. Humpback whales feed regardless of overcast skies or light rain, and boats operate safely at water level.
            </p>
            <Link
              href="/juneau-whale-watching-tours"
              style={{ color: "var(--ice, #7dd3fc)", fontSize: "0.85rem", fontWeight: 700, textDecoration: "none" }}
            >
              Compare Whale Backups &rarr;
            </Link>
          </div>

          <div style={{ background: "rgba(3, 14, 23, 0.6)", border: "1px solid var(--line, rgba(255, 255, 255, 0.08))", borderRadius: 12, padding: "18px" }}>
            <h3 style={{ color: "var(--accent, #f0b35b)", fontSize: "1.05rem", margin: "0 0 6px" }}>
              🏔️ Mendenhall Valley &amp; Glacier Shuttles
            </h3>
            <p style={{ fontSize: "0.88rem", lineHeight: 1.55, color: "var(--muted, #cbd5e1)", margin: "0 0 10px" }}>
              Private or express shuttles to the Mendenhall Glacier Visitor Center, Nugget Falls trail, and Photo Point provide close-up glacier views from ground level.
            </p>
            <Link
              href="/what-to-do-in-juneau-cruise-port"
              style={{ color: "var(--ice, #7dd3fc)", fontSize: "0.85rem", fontWeight: 700, textDecoration: "none" }}
            >
              Juneau Port Guide &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Box */}
      <section
        style={{
          background: "linear-gradient(180deg, rgba(6, 17, 29, 0.85) 0%, rgba(3, 14, 23, 0.95) 100%)",
          border: "1px solid rgba(240, 179, 91, 0.4)",
          borderRadius: "var(--radius-lg, 16px)",
          padding: "32px 28px",
          textAlign: "center",
        }}
      >
        <h2 style={{ fontSize: "1.45rem", fontWeight: 900, color: "#ffffff", margin: "0 0 10px" }}>
          Make Sure Your Port Day Has an Early Warning Watch
        </h2>
        <p style={{ color: "var(--muted, #cbd5e1)", fontSize: "0.95rem", lineHeight: 1.6, maxWidth: 640, margin: "0 auto 20px" }}>
          Register your cruise date, ship, and passenger count on our Availability Watch. Whether you need sold-out seats or weather contingency dispatch, our local team is in your corner.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12 }}>
          <Link href="/helicopter-waitlist" className="button button-primary">
            Join the Availability Watch
          </Link>
          <Link href="/contact" className="button button-secondary">
            Contact Local Dispatch
          </Link>
        </div>
      </section>
    </main>
  );
}
