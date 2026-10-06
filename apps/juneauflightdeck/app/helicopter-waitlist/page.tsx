import type { Metadata } from "next";
import HelicopterWaitlistForm from "../components/HelicopterWaitlistForm";

export const metadata: Metadata = {
  title: "Helicopter Tour Availability Watch & Waitlist | Juneau Flight Deck",
  description:
    "Put our daily 10:00 AM seat scanner on your cruise port date. Automated monitoring of TEMSCO, Coastal, and NorthStar glacier helicopter flights with direct operator booking links.",
  alternates: { canonical: "https://juneauflightdeck.com/helicopter-waitlist" },
  openGraph: {
    title: "Helicopter Tour Availability Watch | Juneau Flight Deck",
    description:
      "Daily seat drop monitoring for Juneau & Skagway helicopter glacier tours. Direct operator booking and concierge dispatch alerts.",
    url: "https://juneauflightdeck.com/helicopter-waitlist",
  },
};

export default function Page() {
  return (
    <main id="main-content" className="jfd-root waitlist-page-container">
      <div className="site-shell" style={{ maxWidth: 940, margin: "0 auto", padding: "44px 20px 80px" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <p className="eyebrow" style={{ color: "var(--accent, #f0b35b)", marginBottom: 8 }}>
            Juneau Flight Deck • Seat Monitoring Service
          </p>
          <h1
            style={{
              fontSize: "clamp(2rem, 4.5vw, 2.85rem)",
              fontWeight: 900,
              lineHeight: 1.15,
              color: "#ffffff",
              margin: "0 0 16px",
              letterSpacing: "-0.02em",
            }}
          >
            Helicopter Tour Availability Watch
          </h1>
          <p
            style={{
              fontSize: "1.05rem",
              lineHeight: 1.6,
              color: "rgba(228, 239, 246, 0.9)",
              maxWidth: 720,
              margin: "0 auto",
            }}
          >
            Glacier helicopter tours sell out months in advance through cruise ship excursion desks. 
            Our program monitors local fleet inventories (TEMSCO, Coastal, NorthStar) daily at 10:00 AM 
            when cancellations and group holds drop, alerting you the moment matching seats appear.
          </p>
        </div>

        <HelicopterWaitlistForm />
      </div>
    </main>
  );
}
