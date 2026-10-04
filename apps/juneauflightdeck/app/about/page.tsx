import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About | Juneau Flight Deck",
  description:
    "Juneau Flight Deck combines online booking with people who know how to work directly with the local helicopter operators.",
  alternates: { canonical: "https://juneauflightdeck.com/about" },
};

export default function AboutPage() {
  return (
    <main className="page-shell static-page-shell">
      <section className="static-page-card">
        <p className="eyebrow">About Juneau Flight Deck</p>
        <h1 className="static-page-title" style={{ lineHeight: 1.25, marginBottom: "18px" }}>
          Juneau Flight Deck combines online booking with people who know how to work directly with the local operators.
        </h1>
        <p className="chooser-trust-line" style={{ fontSize: "1.05rem", lineHeight: 1.6, marginBottom: "20px" }}>
          You book tours through the same three helicopter companies everyone else uses. As an official Viator partner (a Tripadvisor company), your booking has the same direct inventory access, verified buyer protection, and secure checkout as the world’s leading travel platform; the cruise ship has its own allocated seats.
        </p>

        <div
          style={{
            background: "rgba(3, 14, 23, 0.6)",
            border: "1px solid var(--line-strong)",
            borderRadius: "var(--radius-md)",
            padding: "24px 22px",
            margin: "24px 0",
          }}
        >
          <h2 style={{ fontSize: "1.25rem", color: "var(--accent)", margin: "0 0 12px", fontWeight: 800 }}>
            Our advantage is what we do beyond that inventory.
          </h2>
          <p style={{ lineHeight: 1.65, color: "var(--text)", margin: "0 0 16px", fontSize: "0.98rem" }}>
            We live here, do this for a living, know the operators and local conditions, and know when a phone call might uncover an option the website doesn’t show—such as asking whether a sixth passenger seat can be released for a lighter group based on aircraft weight and balance.
          </p>

          <ul className="static-page-bullets" style={{ margin: "16px 0" }}>
            <li>
              <strong>Sold-Out Date Monitoring:</strong> For sold-out dates, we monitor openings, secure matching seats when cancellation terms permit, and call the next eligible traveler with right of first refusal.
            </li>
            <li>
              <strong>Pre-Booking Advice:</strong> We provide honest advice on flight styles, mountain pass microclimates, and ship-safe docking buffers.
            </li>
            <li>
              <strong>Cancellation &amp; Weather Support:</strong> For anyone booking through us, we provide advice beforehand and actively help find another activity (such as whale watching) if your flight is canceled.
            </li>
          </ul>

          <div
            style={{
              marginTop: "20px",
              paddingTop: "14px",
              borderTop: "1px solid var(--line)",
              fontWeight: 700,
              color: "var(--accent-strong)",
            }}
          >
            Customers are booking both the tour and our local expertise, relationships, and follow-through.
          </div>
        </div>

        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "24px" }}>
          <Link href="/" className="primary-cta">
            Compare Juneau Flights
          </Link>
          <Link
            href="/helicopter-waitlist"
            className="primary-cta"
            style={{ background: "transparent", border: "1px solid var(--line)", color: "var(--text)" }}
          >
            Join Availability Watch
          </Link>
        </div>
      </section>
    </main>
  );
}
