import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "What to Do If Your Juneau Helicopter Tour Is Canceled | Juneau Flight Deck",
  description:
    "Why waiting for the official flight cancellation call leaves you stuck at the docks, and how our early weather dispatch secures alternative activities hours in advance.",
  alternates: {
    canonical: "https://juneauflightdeck.com/juneau/what-to-do-if-helicopter-tour-canceled",
  },
  openGraph: {
    title: "What to Do If Your Juneau Helicopter Tour Is Canceled | Juneau Flight Deck",
    description:
      "Why waiting for the official flight cancellation call leaves you stuck at the docks, and how our early weather dispatch secures alternative activities hours in advance.",
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
        text: "Our local dispatch monitors FAA mountain pass webcams (Gastineau Channel, Herbert Glacier, Mendenhall Valley), ridge-top weather stations, and barometric trends across Southeast Alaska. We typically identify deteriorating flight conditions and likely groundings 2 to 3 hours before the official cutoff call is announced.",
      },
    },
    {
      "@type": "Question",
      name: "How does the proactive backup plan protect our port day?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "When 400+ helicopter passengers are canceled simultaneously across 3 to 4 cruise ships, local dockside excursions and whale watching boats sell out within minutes. Because we detect deteriorating weather hours in advance, we actively work on securing alternative activities—such as Auke Bay whale watching catamarans—before your tour is even canceled.",
      },
    },
    {
      "@type": "Question",
      name: "Do I get a full refund if my helicopter tour is canceled?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. When an operator cancels a flight due to weather, standard operator and Viator policy provides a 100% refund back to your original payment card. Alternative backup activities are booked separately and depend on real-time availability.",
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
            The Local Advantage
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

      {/* The Dock Rush Reality */}
      <section
        style={{
          background: "var(--panel, rgba(17, 41, 61, 0.45))",
          border: "1px solid var(--line, rgba(255, 255, 255, 0.1))",
          borderRadius: "var(--radius-lg, 16px)",
          padding: "30px 26px",
          marginBottom: "36px",
        }}
      >
        <div style={{ color: "var(--ice, #7dd3fc)", fontSize: "0.78rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
          The Juneau Excursion Bottleneck
        </div>
        <h2 style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--text, #ffffff)", margin: "0 0 14px" }}>
          Why Waiting for the Official Cancellation Leaves You Stranded
        </h2>
        <p style={{ lineHeight: 1.6, color: "var(--muted, #cbd5e1)", margin: "0 0 18px" }}>
          On a typical peak summer day in Juneau, 3 to 5 mega-cruise ships are berthed along Franklin and South Franklin Docks, 
          carrying anywhere from 9,000 to 18,000 passengers.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
          <div style={{ background: "rgba(3, 14, 23, 0.6)", border: "1px solid var(--line, rgba(255, 255, 255, 0.08))", borderRadius: 12, padding: "18px" }}>
            <h3 style={{ color: "#ef4444", fontSize: "1rem", margin: "0 0 8px" }}>1. Simultaneous 400-Seat Groundings</h3>
            <p style={{ fontSize: "0.88rem", lineHeight: 1.55, color: "var(--muted, #cbd5e1)", margin: 0 }}>
              TEMSCO, Coastal, and NorthStar operate out of the same airport corridor. When mountain ceilings drop, all 3 operators ground their fleets simultaneously. That suddenly leaves 300 to 500 disappointed passengers with no plans.
            </p>
          </div>
          <div style={{ background: "rgba(3, 14, 23, 0.6)", border: "1px solid var(--line, rgba(255, 255, 255, 0.08))", borderRadius: 12, padding: "18px" }}>
            <h3 style={{ color: "#ef4444", fontSize: "1rem", margin: "0 0 8px" }}>2. The 15-Minute Dock Scramble</h3>
            <p style={{ fontSize: "0.88rem", lineHeight: 1.55, color: "var(--muted, #cbd5e1)", margin: 0 }}>
              The moment ship passengers receive an official cancellation message, they rush ship excursion desks and shore tour booths. Top-rated marine tours and glacier shuttles sell out within 15 to 20 minutes.
            </p>
          </div>
          <div style={{ background: "rgba(3, 14, 23, 0.6)", border: "1px solid var(--line, rgba(255, 255, 255, 0.08))", borderRadius: 12, padding: "18px" }}>
            <h3 style={{ color: "#22c55e", fontSize: "1rem", margin: "0 0 8px" }}>3. The Early-Action Solution</h3>
            <p style={{ fontSize: "0.88rem", lineHeight: 1.55, color: "var(--muted, #cbd5e1)", margin: 0 }}>
              By actively lining up sea-level alternatives 2 to 3 hours before the grounding call, our guests stay ahead of the rush, saving their Alaska port day rather than spending it in a shore desk queue.
            </p>
          </div>
        </div>
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
                When conditions clearly trend toward a grounding, our team begins working on securing alternative activities—such as heated catamaran whale watching out of Auke Bay or private small-group land excursions—before official flight cancellations are announced.
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
                Because the helicopter flight was cancelled for weather, the operator (or Viator) issues a 100% full refund back to your original payment card. Any backup activity is booked separately based on confirmed capacity.
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
