import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About French Quarter Orientation | New Orleans First-Hour Guide",
  description:
    "How French Quarter Orientation helps first-time New Orleans visitors understand boundaries, streets, and regroup landmarks before booking tours.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <>
      <main>
        <section className="hero">
          <div className="shell">
            <div className="eyebrow">French Quarter Orientation · About</div>
            <h1>A 30-minute spatial map before you start wandering.</h1>
            <p>
              French Quarter Orientation is an independent New Orleans neighborhood resource in the Destination
              Command Center network. Its single job is helping visitors understand the four edges of the Quarter
              (Mississippi River, Canal Street, Rampart Street, and Esplanade Avenue), choose the right first
              street, and set a clear group meeting point.
            </p>
            <div className="actions">
              <Link className="btn primary" href="/">
                Open the First-Hour Playbook
              </Link>
              <a
                className="btn secondary"
                href="https://www.welcometoneworleanstours.com/tours?utm_source=frenchquarterorientation&utm_medium=referral&utm_campaign=fqo_about"
              >
                Compare New Orleans Tours ↗
              </a>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="shell">
            <div className="eyebrow" style={{ color: "#8c352f" }}>
              Editorial &amp; Booking Boundary
            </div>
            <h2>No fake countdowns. Clear provider accountability.</h2>
            <p className="lede">
              French Quarter Orientation does not sell tickets, hold inventory, or process payments. When you are
              ready to compare steamboat cruises, walking tours, plantation shuttles, or swamp excursions, we
              connect you to Welcome to New Orleans Tours and Destination Command Center—where final live
              schedules, prices, restrictions, and cancellation terms always belong to the operating company or
              disclosed booking provider.
            </p>
          </div>
        </section>
      </main>
      <footer>
        <div className="shell">
          French Quarter Orientation · Independent New Orleans orientation resource in the Destination Command
          Center network.
        </div>
      </footer>
    </>
  );
}
