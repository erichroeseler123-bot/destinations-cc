import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "What to Do If Your Juneau Helicopter Tour Is Canceled | Juneau Flight Deck",
  description:
    "If weather cancels your helicopter flight, we help you explore available alternatives that fit your remaining port time. Backup tours are optional, booked separately, and subject to availability.",
  alternates: {
    canonical: "https://juneauflightdeck.com/juneau/what-to-do-if-helicopter-tour-canceled",
  },
  openGraph: {
    title: "What to Do If Your Juneau Helicopter Tour Is Canceled | Juneau Flight Deck",
    description:
      "If weather cancels your helicopter flight, we help you explore available alternatives that fit your remaining port time. Backup tours are optional, booked separately, and subject to availability.",
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
        text: "Helicopter glacier flights operate under strict FAA Visual Flight Rules (VFR). While downtown Juneau and the cruise ship docks may experience calm winds or light drizzle, mountain passes leading to Mendenhall and Herbert Glaciers can experience cloud ceilings below safe minimums, localized wind shear, or fog that prevents safe transit.",
      },
    },
    {
      "@type": "Question",
      name: "When does an operator make a cancellation call?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Operating chief pilots and dispatchers make the final safety determination, typically finalized 45 to 90 minutes prior to scheduled departure as conditions evolve.",
      },
    },
    {
      "@type": "Question",
      name: "What happens if weather cancels my helicopter tour?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "If weather cancels your helicopter flight, we help you explore available alternatives that fit your remaining port time. Backup tours are optional, booked separately, and subject to availability. Refunds follow your booking’s cancellation terms.",
      },
    },
    {
      "@type": "Question",
      name: "Are refunds guaranteed if my flight is canceled for weather?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "When an operator cancels a flight due to weather, standard operator and Viator policy provides a 100% refund back to your original payment method according to your booking terms.",
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
          Juneau Flight Deck · Weather Guidance &amp; Backup Planning
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
            margin: "0 0 16px",
          }}
        >
          Southeast Alaska mountain weather can change quickly. A cloudy morning doesn&apos;t have to mean a lost port day.
        </p>
        <div
          style={{
            padding: "16px 20px",
            background: "rgba(240, 179, 91, 0.12)",
            border: "1px solid rgba(240, 179, 91, 0.35)",
            borderRadius: 12,
            color: "#ffffff",
            fontSize: "0.95rem",
            lineHeight: 1.6,
          }}
        >
          <strong>Our Policy &amp; Commitment:</strong> If weather cancels your helicopter flight, we help you explore available alternatives that fit your remaining port time. Backup tours are optional, booked separately, and subject to availability. Refunds follow your booking&apos;s cancellation terms.
        </div>
      </div>

      {/* Local Ground Experience */}
      <section
        style={{
          background: "linear-gradient(135deg, rgba(14, 165, 233, 0.1) 0%, rgba(15, 23, 42, 0.8) 100%)",
          border: "1px solid rgba(56, 189, 248, 0.3)",
          borderRadius: "var(--radius-lg, 16px)",
          padding: "28px 24px",
          marginBottom: "36px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: "1.2rem" }}>🏔️</span>
          <span
            style={{
              fontSize: "0.78rem",
              fontWeight: 800,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--ice, #7dd3fc)",
            }}
          >
            Local Ground Context
          </span>
        </div>
        <h2 style={{ fontSize: "1.45rem", fontWeight: 800, color: "var(--text, #ffffff)", margin: "0 0 12px" }}>
          Local Observations and Real-Time Awareness
        </h2>
        <p style={{ lineHeight: 1.65, color: "#e2e8f0", margin: "0 0 14px", fontSize: "0.96rem" }}>
          We live right here in Juneau. While generic weather apps show broad city forecasts, we monitor conditions directly—observing the Gastineau Channel, checking FAA pass webcams (Herbert Glacier, Mendenhall Valley), and tracking mountain cloud layers as coastal systems move through.
        </p>
        <p style={{ lineHeight: 1.65, color: "#e2e8f0", margin: "0 0 18px", fontSize: "0.96rem" }}>
          This is our livelihood, and we take helping travelers navigate their port day seriously. When you plan your flight with us:
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
          <div style={{ background: "rgba(3, 14, 23, 0.6)", borderRadius: 10, padding: "16px", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ color: "var(--accent, #f0b35b)", fontWeight: 800, fontSize: "0.9rem", marginBottom: 4 }}>Compare Prices</div>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--muted, #cbd5e1)", lineHeight: 1.5 }}>
              Compare direct operator and Viator pricing against typical cruise excursion desk rates for flights with premier operators (TEMSCO, Coastal, NorthStar).
            </p>
          </div>
          <div style={{ background: "rgba(3, 14, 23, 0.6)", borderRadius: 10, padding: "16px", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ color: "#86efac", fontWeight: 800, fontSize: "0.9rem", marginBottom: 4 }}>Clear Cancellation Terms</div>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--muted, #cbd5e1)", lineHeight: 1.5 }}>
              Bookings through our official Viator partner or direct operators feature stated terms and a 100% refund if the operator cancels for weather.
            </p>
          </div>
          <div style={{ background: "rgba(3, 14, 23, 0.6)", borderRadius: 10, padding: "16px", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ color: "var(--ice, #7dd3fc)", fontWeight: 800, fontSize: "0.9rem", marginBottom: 4 }}>Contingency Guidance</div>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--muted, #cbd5e1)", lineHeight: 1.5 }}>
              If weather grounds your flight, we help you check available sea-level options (such as whale watching) that fit your remaining ship schedule.
            </p>
          </div>
        </div>
      </section>

      {/* Common Weather Disruption Scenarios */}
      <section
        style={{
          background: "var(--panel, rgba(17, 41, 61, 0.45))",
          border: "1px solid var(--line, rgba(255, 255, 255, 0.1))",
          borderRadius: "var(--radius-lg, 16px)",
          padding: "30px 24px",
          marginBottom: "36px",
        }}
      >
        <div style={{ color: "var(--accent, #f0b35b)", fontSize: "0.78rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
          Understanding Shore-Day Weather
        </div>
        <h2 style={{ fontSize: "1.45rem", fontWeight: 800, color: "var(--text, #ffffff)", margin: "0 0 8px" }}>
          Common Cruise Port Scenarios When Flights Are Delayed or Canceled
        </h2>
        <p style={{ lineHeight: 1.6, color: "var(--muted, #cbd5e1)", margin: "0 0 20px" }}>
          Understanding how weather disruptions unfold helps travelers make practical decisions rather than losing valuable time in port:
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              background: "rgba(3, 14, 23, 0.7)",
              border: "1px solid var(--line, rgba(255, 255, 255, 0.08))",
              borderRadius: 12,
              padding: "18px 20px",
            }}
          >
            <h3 style={{ color: "#fca5a5", fontSize: "1rem", margin: "0 0 6px", fontWeight: 800 }}>
              Scenario 1: Rolling Weather Delays
            </h3>
            <p style={{ margin: 0, fontSize: "0.88rem", lineHeight: 1.6, color: "#cbd5e1" }}>
              Operators hold off on making a final call as long as safely possible in hopes that cloud ceilings lift. If a flight is delayed multiple times into the afternoon, travelers can find their remaining port window shortened, leaving fewer options if the flight is ultimately called off.
            </p>
          </div>

          <div
            style={{
              background: "rgba(3, 14, 23, 0.7)",
              border: "1px solid var(--line, rgba(255, 255, 255, 0.08))",
              borderRadius: 12,
              padding: "18px 20px",
            }}
          >
            <h3 style={{ color: "#fca5a5", fontSize: "1rem", margin: "0 0 6px", fontWeight: 800 }}>
              Scenario 2: Increased Same-Day Demand for Water Tours
            </h3>
            <p style={{ margin: 0, fontSize: "0.88rem", lineHeight: 1.6, color: "#cbd5e1" }}>
              When mountain ceilings prevent flying, water-level excursions like whale watching often continue running normally. When multiple flight departures are canceled, remaining seats on popular afternoon boats can fill up quickly.
            </p>
          </div>

          <div
            style={{
              background: "rgba(3, 14, 23, 0.7)",
              border: "1px solid var(--line, rgba(255, 255, 255, 0.08))",
              borderRadius: 12,
              padding: "18px 20px",
            }}
          >
            <h3 style={{ color: "#fca5a5", fontSize: "1rem", margin: "0 0 6px", fontWeight: 800 }}>
              Scenario 3: Sunny Port Weather vs. Mountain Pass Ceilings
            </h3>
            <p style={{ margin: 0, fontSize: "0.88rem", lineHeight: 1.6, color: "#cbd5e1" }}>
              Downtown Juneau and the cruise docks may have pleasant, open conditions while mountain passes leading to the icefield have cloud decks below FAA Visual Flight Rules minimums. Final go/no-go decisions rest with the operating pilot based on pass conditions.
            </p>
          </div>
        </div>
      </section>

      {/* Illustrative Example Timeline */}
      <section
        style={{
          background: "linear-gradient(135deg, rgba(14, 165, 233, 0.08) 0%, rgba(15, 23, 42, 0.85) 100%)",
          border: "1px solid rgba(56, 189, 248, 0.25)",
          borderRadius: "var(--radius-lg, 16px)",
          padding: "30px 24px",
          marginBottom: "36px",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 740, margin: "0 auto 24px" }}>
          <span
            style={{
              fontSize: "0.78rem",
              fontWeight: 800,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--accent, #f0b35b)",
              display: "block",
              marginBottom: 8,
            }}
          >
            Illustrative Example
          </span>
          <h2 style={{ fontSize: "clamp(1.3rem, 3.2vw, 1.8rem)", fontWeight: 900, color: "#ffffff", margin: "0 0 8px" }}>
            Possible Outcomes on a Weather-Disrupted Port Day
          </h2>
          <p style={{ color: "var(--muted, #cbd5e1)", fontSize: "0.92rem", lineHeight: 1.55, margin: 0 }}>
            The following example contrasts how a port day might unfold with and without an active backup plan:
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 18 }}>
          {/* Example A */}
          <div
            style={{
              background: "rgba(3, 14, 23, 0.75)",
              border: "1px solid rgba(239, 68, 68, 0.25)",
              borderRadius: 14,
              padding: "20px 18px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: "1.1rem" }}>⚠️</span>
              <h3 style={{ color: "#fca5a5", fontSize: "1rem", margin: 0, fontWeight: 800 }}>
                Without a Backup Plan
              </h3>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: "0.85rem", lineHeight: 1.5, color: "#cbd5e1" }}>
              <div>
                <strong>Morning:</strong> Flight is placed on weather hold. Passenger waits for operator updates.
              </div>
              <div>
                <strong>Midday:</strong> Rolling delays continue; other activities are not explored while waiting on the flight.
              </div>
              <div>
                <strong>Early Afternoon:</strong> Flight is officially canceled. Passenger searches for alternatives, but convenient departure times may have filled up.
              </div>
              <div style={{ color: "#fca5a5", fontWeight: 700, paddingTop: 4 }}>
                Possible Outcome: Much of the port day spent waiting, resulting in limited remaining options.
              </div>
            </div>
          </div>

          {/* Example B */}
          <div
            style={{
              background: "rgba(3, 14, 23, 0.75)",
              border: "1px solid rgba(34, 197, 94, 0.3)",
              borderRadius: 14,
              padding: "20px 18px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: "1.1rem" }}>✅</span>
              <h3 style={{ color: "#86efac", fontSize: "1rem", margin: 0, fontWeight: 800 }}>
                With Coordinated Backup Planning
              </h3>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: "0.85rem", lineHeight: 1.5, color: "#cbd5e1" }}>
              <div>
                <strong>Morning:</strong> Local observations indicate mountain ceilings are lowering; traveler is kept informed.
              </div>
              <div>
                <strong>Midday:</strong> Potential replacement options (such as whale watching) are identified early to match ship schedules.
              </div>
              <div>
                <strong>Early Afternoon:</strong> If flight cancels, refund processes per booking terms, and traveler chooses whether to pivot to an available alternative.
              </div>
              <div style={{ color: "#86efac", fontWeight: 700, paddingTop: 4 }}>
                Possible Outcome: Smooth transition to an alternative activity, preserving the day in port.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Practical Vacation Planning */}
      <section
        style={{
          background: "rgba(3, 14, 23, 0.7)",
          border: "1px solid var(--line, rgba(255, 255, 255, 0.1))",
          borderRadius: "var(--radius-lg, 16px)",
          padding: "28px 24px",
          marginBottom: "36px",
        }}
      >
        <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--text, #ffffff)", margin: "0 0 12px" }}>
          Making the Most of Your Port Window
        </h2>
        <p style={{ lineHeight: 1.6, color: "var(--muted, #cbd5e1)", margin: "0 0 16px", fontSize: "0.95rem" }}>
          Cruise itineraries typically allocate 8 to 10 hours in Juneau. Because helicopter flights are subject to Visual Flight Rules, treating a non-flight alternative as part of your plan provides peace of mind:
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
          <div style={{ background: "rgba(3, 14, 23, 0.6)", border: "1px solid var(--line, rgba(255, 255, 255, 0.08))", borderRadius: 12, padding: "18px" }}>
            <h3 style={{ color: "var(--accent, #f0b35b)", fontSize: "1rem", margin: "0 0 6px" }}>
              🐋 Auke Bay Whale Watching
            </h3>
            <p style={{ fontSize: "0.86rem", lineHeight: 1.55, color: "var(--muted, #cbd5e1)", margin: "0 0 10px" }}>
              Tour boats operate at sea level where low mountain cloud ceilings do not impede safe marine navigation.
            </p>
            <Link
              href="/juneau-whale-watching-tours"
              style={{ color: "var(--ice, #7dd3fc)", fontSize: "0.84rem", fontWeight: 700, textDecoration: "none" }}
            >
              Compare Whale Backups &rarr;
            </Link>
          </div>

          <div style={{ background: "rgba(3, 14, 23, 0.6)", border: "1px solid var(--line, rgba(255, 255, 255, 0.08))", borderRadius: 12, padding: "18px" }}>
            <h3 style={{ color: "var(--accent, #f0b35b)", fontSize: "1rem", margin: "0 0 6px" }}>
              🏔️ Mendenhall Valley &amp; Shuttles
            </h3>
            <p style={{ fontSize: "0.86rem", lineHeight: 1.55, color: "var(--muted, #cbd5e1)", margin: "0 0 10px" }}>
              Ground transportation to the Mendenhall Glacier Visitor Center, Nugget Falls trail, and scenic overlooks.
            </p>
            <Link
              href="/what-to-do-in-juneau-cruise-port"
              style={{ color: "var(--ice, #7dd3fc)", fontSize: "0.84rem", fontWeight: 700, textDecoration: "none" }}
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
          Ready to Plan Your Juneau Excursion?
        </h2>
        <p style={{ color: "var(--muted, #cbd5e1)", fontSize: "0.95rem", lineHeight: 1.6, maxWidth: 640, margin: "0 auto 20px" }}>
          Explore glacier flights, monitor availability, or contact our local team for port-day coordination.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12 }}>
          <Link href="/helicopter" className="button button-primary">
            Explore Glacier Flights
          </Link>
          <Link href="/helicopter-waitlist" className="button button-secondary">
            Join Availability Watch
          </Link>
          <Link href="/contact" className="button button-secondary">
            Contact Dispatch
          </Link>
        </div>
      </section>
    </main>
  );
}
