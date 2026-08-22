import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About",
  description: "About Last Frontier Shore Excursions, how the site works, how recommendations are made, and the booking and affiliate relationship with tour providers.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <main className="shell" style={{ paddingTop: 48, paddingBottom: 64 }}>
      <p className="eyebrow">About & transparency</p>
      <h1>Independent Alaska shore-excursion planning.</h1>
      <p className="lede" style={{ maxWidth: 820 }}>
        Last Frontier Shore Excursions is an independent Alaska cruise-excursion planning and comparison site. We help cruise travelers compare experience types, port-day fit, duration, weather exposure, transportation and backup options before continuing to the tour provider that controls the booking.
      </p>

      <section className="card" style={{ marginTop: 28 }}>
        <h2>What we do</h2>
        <p>We organize shore-excursion decisions around the realities of a cruise port day: what experience matters most, how much time is available, how weather can change the plan, and what lower-complexity backup makes sense if the first choice does not work.</p>
        <p>Public weather, tide and other official-source context may be shown where it is useful for planning. Those feeds are planning information, not a guarantee of tour operation, road access, vessel operation or cruise-ship timing.</p>
      </section>

      <section className="card" style={{ marginTop: 18 }}>
        <h2>What we are not</h2>
        <p>Last Frontier Shore Excursions is not a cruise line and does not present third-party tour operators as its own operation. Tour providers control their own availability, schedules, meeting instructions, transportation, restrictions, cancellation terms and service delivery.</p>
      </section>

      <section className="card" style={{ marginTop: 18 }}>
        <h2>How booking and compensation work</h2>
        <p>When a traveler follows a booking link, the reservation is completed with the identified tour provider or booking partner. Last Frontier Shore Excursions may receive affiliate or referral compensation when a booking is completed through participating links.</p>
        <p>Our role is to make the decision easier and keep provider boundaries clear. The provider's checkout is the controlling source for live price, availability, inclusions, restrictions and cancellation terms.</p>
      </section>

      <section className="card" style={{ marginTop: 18 }}>
        <h2>Relationship to Destination Command Center</h2>
        <p>Last Frontier Shore Excursions is affiliated with Destination Command Center, a location-intelligence and destination-research platform. DCC provides deeper destination and coordinate context; Last Frontier remains the Alaska cruise-excursion planning surface.</p>
        <p><a href="https://www.destinationcommandcenter.com" rel="noopener noreferrer">Open Destination Command Center</a></p>
      </section>

      <p style={{ marginTop: 28 }}><Link href="/">← Back to Alaska shore-excursion planning</Link></p>
    </main>
  );
}
