import type { Metadata } from "next";
import Link from "next/link";
import { TrustDisclosure } from "@/components/TrustDisclosure";

export const metadata: Metadata = {
  title: "About & Affiliate Transparency",
  description: "About Last Frontier Shore Excursions, our cruise-fit planning method, affiliate access tiers with Viator and GetYourGuide, and operator booking boundaries.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <main className="shell" style={{ paddingTop: 48, paddingBottom: 64 }}>
      <p className="eyebrow">About &amp; Transparency</p>
      <h1>Independent Alaska shore-excursion planning.</h1>
      <p className="lead" style={{ maxWidth: 820 }}>
        Last Frontier Shore Excursions is an independent Alaska cruise-excursion planning and comparison engine. We help cruise travelers compare experience types, port-day fit, duration, weather exposure, transportation, and return margins before continuing to the booking partner or tour operator that controls the reservation.
      </p>

      <section className="card" style={{ marginTop: 28 }}>
        <h2>The Last Frontier Planning Standard</h2>
        <p>
          Our planning method evaluates excursion feasibility against cruise all-aboard times: <strong>Tour end time + transfer buffer + 45-minute planning margin must be no later than your ship's scheduled all-aboard time.</strong>
        </p>
        <p>
          We analyze port-specific dock logistics—such as AJ Dock in Juneau, Ward Cove Mill in Ketchikan, and Old Sitka Dock in Sitka—factoring in mandatory shuttle bus transit times and security clearance margins.
        </p>
        <p style={{ fontStyle: "italic", color: "var(--muted)", fontSize: "14px", marginTop: 12 }}>
          Last Frontier’s planning method estimates whether an excursion fits the ship’s port window using the published all-aboard time, activity duration, meeting logistics, transfer time, and a planning margin. It is not a guarantee of ship timing, tour operation, or return.
        </p>
      </section>

      <section className="card" style={{ marginTop: 18 }}>
        <h2>Data Sourcing &amp; Affiliate Access Tiers</h2>
        <p>
          To maintain absolute operational transparency, Last Frontier documents its exact partner integration tiers:
        </p>
        <ul style={{ margin: "12px 0 16px", paddingLeft: 24, fontSize: "15px", lineHeight: 1.6, color: "var(--ink)" }}>
          <li>
            <strong>Viator Integration:</strong> Operates under approved <em>Basic Affiliate Access</em> using standard partner attribution tracking (tracking parameters <code>mcid=42383</code>, <code>medium=link</code>, campaign tags, and optional publisher ID). There is no automated server-to-server booking API key (<code>VIATOR_API_KEY</code>) enabled in production.
          </li>
          <li>
            <strong>GetYourGuide Integration:</strong> Operates under approved <em>Affiliate Partner Link Access</em> (Partner ID <code>F2MMUUH</code>). There is no live merchant API token (<code>GETYOURGUIDE_ACCESS_TOKEN</code>) enabled in production.
          </li>
          <li>
            <strong>Curated Editorial Data:</strong> Product listings, typical starting prices, sample departure schedules, and cancellation policies displayed across this site reflect manual editorial research and historical benchmarks rather than real-time automated API synchronization.
          </li>
          <li>
            <strong>Live Availability &amp; Booking:</strong> Because pricing and availability fluctuate dynamically based on ship occupancy and seasonality, our outbound links connect travelers directly to partner search options or verified partner listings where live rates, current cancellation terms, and real-time availability are displayed and booked directly.
          </li>
        </ul>
        <p>
          <strong>Affiliate Disclosure:</strong> Booking is completed with the listed provider or booking partner. Last Frontier may earn an affiliate commission at no extra cost to you.
        </p>
      </section>

      <section className="card" style={{ marginTop: 18 }}>
        <h2>Editorial Independence &amp; Content Integrity</h2>
        <p>
          We do not accept paid placements to artificially boost tour rankings. We do not copy third-party traveler reviews or present third-party star ratings as our own aggregate ratings. Our recommendations are driven by objective cruise-day feasibility: duration, return margin, weather sensitivity, and operator track record.
        </p>
      </section>

      <section className="card" style={{ marginTop: 18 }}>
        <h2>Relationship to Destination Command Center</h2>
        <p>
          Last Frontier Shore Excursions is affiliated with Destination Command Center (DCC), a location-intelligence and destination-research network. DCC provides underlying geographic and coordinate intelligence, while Last Frontier functions as the dedicated Alaska cruise-excursion planning and comparison engine.
        </p>
        <p>
          <a href="https://www.destinationcommandcenter.com" rel="noopener noreferrer">
            Open Destination Command Center →
          </a>
        </p>
      </section>

      <TrustDisclosure />

      <p style={{ marginTop: 28 }}>
        <Link href="/">← Back to Alaska shore-excursion planning</Link>
      </p>
    </main>
  );
}
