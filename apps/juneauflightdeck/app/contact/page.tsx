import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Tour Planning & Booking Help",
  description: "Ask Juneau Flight Deck about tour choices, cruise pickup and timing, availability requests, and weather alternatives.",
  alternates: { canonical: "https://juneauflightdeck.com/contact" },
};

export default function ContactPage() {
  return (
    <main className="page-shell static-page-shell">
      <section className="static-page-card">
        <div
          style={{
            marginBottom: 20,
            borderRadius: 16,
            overflow: "hidden",
            border: "1px solid var(--line, #334155)",
            aspectRatio: "16 / 9",
            maxHeight: 280,
            background: "#071626",
          }}
        >
          <img
            src="/images/juneau-helicopter-hero.jpg"
            alt="Flightseeing helicopter soaring above an expansive Alaska glacier valley and snow-capped peaks"
            width={1440}
            height={900}
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 48%", display: "block" }}
          />
        </div>
        <p className="eyebrow">Juneau Flight Deck planning help</p>
        <h1 className="static-page-title">Let’s find the right experience for your port day.</h1>
        <p className="chooser-trust-line">Ask us about glacier tour choices, meeting points, cruise timing, or alternatives if weather changes your plans.</p>
        <p><a href="mailto:dispatch@juneauflightdeck.com">dispatch@juneauflightdeck.com</a></p>
        <p>Include your ship, Juneau date, party size, confirmed arrival and all-aboard times, and the tour you are considering. For an existing availability request, include your JFD request code.</p>
        <h2>For an existing reservation</h2>
        <p>Contact the operator or booking provider shown on your confirmation for payment, changes, refunds, or urgent pickup and departure updates. We can help you explore other activities, but your provider controls your reservation. Alternatives depend on availability and require separate booking.</p>
        <Link href="/helicopter" className="primary-cta">Compare and Book Tours</Link>
      </section>
    </main>
  );
}
