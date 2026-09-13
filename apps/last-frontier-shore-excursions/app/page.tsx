import Link from "next/link";
import { PORTS } from "@/lib/ports";
import { DECISION_PAGES } from "@/lib/decisionPages";
import { PORT_ACTIVITIES } from "@/lib/portActivities";
import { AFFILIATE_CATALOG } from "@/lib/affiliate/catalog";
import { CruiseWindowCalculator } from "@/components/CruiseWindowCalculator";
import { ExcursionCard } from "@/components/ExcursionCard";
import { TrustDisclosure } from "@/components/TrustDisclosure";

export default function HomePage() {
  const topActivities = [
    PORT_ACTIVITIES.find((a) => a.slug === "whale-watching" && a.portSlug === "juneau")!,
    PORT_ACTIVITIES.find((a) => a.slug === "white-pass-railway-tours")!,
    PORT_ACTIVITIES.find((a) => a.slug === "misty-fjords-tours")!,
    PORT_ACTIVITIES.find((a) => a.slug === "helicopter-glacier-tours")!,
    PORT_ACTIVITIES.find((a) => a.slug === "wildlife-and-historic-tours")!,
    PORT_ACTIVITIES.find((a) => a.slug === "whale-and-wilderness-tours")!,
  ].filter(Boolean);

  const featuredTours = AFFILIATE_CATALOG.slice(0, 4);

  return (
    <main>
      <section className="hero">
        <div className="shell">
          <p className="eyebrow">Cruise-Safe Alaska Shore Excursions</p>
          <h1>Cruise-Safe Alaska Shore Excursions, Sorted by Port &amp; Timing</h1>
          <p className="lead">
            Your ship gives you hours. Alaska gives you too many choices. Compare curated shore excursions across Juneau, Skagway, Ketchikan, Sitka, and Icy Strait Point—with disciplined return margins, transparent pricing, and direct partner checkout.
          </p>
          <div className="cta-row">
            <a className="button" href="#calculator">Calculate your cruise window ↓</a>
            <Link className="button secondary" href="/tours">
              Browse all tours catalog →
            </Link>
          </div>
          <TrustDisclosure compact />
        </div>
      </section>

      {/* The 45-Minute All-Aboard Rule */}
      <section className="section" style={{ padding: "40px 0 20px" }}>
        <div className="shell">
          <div className="rule">
            <span className="badge badge-safety">The Last Frontier Standard</span>
            <h2 style={{ marginTop: 8, fontSize: "28px" }}>The 45-Minute Cruise Safety Rule</h2>
            <p style={{ fontSize: "16px", color: "#5a3e2e", lineHeight: 1.6 }}>
              <strong>Tour end time + transfer buffer + 45 minutes must be no later than your ship's all-aboard time.</strong> Never book an excursion when return timing or pier transfer logistics are unknown. We calculate true gangway clearance, traffic bottlenecks (like AJ Dock and Ward Cove), and pier buffers so you never stress on the gangway.
            </p>
            <div style={{ marginTop: 14 }}>
              <Link href="/decision/excursions-safe-for-cruise-ship-window" style={{ color: "#8b4c25", fontWeight: 700, textDecoration: "underline" }}>
                Read our complete port window calculation formula →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Cruise Window Calculator */}
      <section className="section" id="calculator" style={{ background: "#f8fbfb", padding: "20px 0 40px" }}>
        <div className="shell">
          <CruiseWindowCalculator portSlug="juneau" defaultDurationMinutes={210} />
        </div>
      </section>

      {/* Featured Partner Excursions */}
      <section className="section" style={{ background: "#ffffff" }}>
        <div className="shell">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap" }}>
            <div>
              <p className="eyebrow" style={{ color: "var(--muted)" }}>Curated Partner Options</p>
              <h2>Top Alaska Cruise Excursions</h2>
            </div>
            <Link href="/tours" style={{ color: "var(--forest)", fontWeight: 700 }}>
              Compare all excursions in directory →
            </Link>
          </div>

          <div className="grid" style={{ marginTop: 24 }}>
            {featuredTours.map((tour) => (
              <ExcursionCard key={tour.attributionCampaign || tour.title} excursion={tour} />
            ))}
          </div>
          <TrustDisclosure />
        </div>
      </section>

      {/* Ports Grid */}
      <section className="section" id="ports" style={{ background: "#fbfcfc", borderTop: "1px solid var(--line)" }}>
        <div className="shell">
          <p className="eyebrow" style={{ color: "#607078" }}>Port-First Architecture</p>
          <h2>Start with where your ship docks</h2>
          <p className="lead" style={{ color: "#607078" }}>
            Select your port to review dock locations, tender status, and targeted excursion categories:
          </p>

          <div className="grid" style={{ marginTop: 24 }}>
            {PORTS.map((port) => (
              <Link className="card" href={`/ports/${port.slug}`} key={port.slug}>
                <p className="eyebrow" style={{ color: "#607078" }}>{port.region}</p>
                <h3>{port.name}</h3>
                <p>{port.hook}</p>
                <div className="chips">
                  {port.bestFor.slice(0, 3).map((item) => (
                    <span className="chip" key={item}>{item}</span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Bucket-List Excursion Categories */}
      <section className="section" style={{ background: "#ffffff", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
        <div className="shell">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap" }}>
            <div>
              <p className="eyebrow" style={{ color: "var(--muted)" }}>In-Depth Guides</p>
              <h2>Flagship Shore Excursion Categories</h2>
            </div>
            <Link href="/tours" style={{ color: "var(--forest)", fontWeight: 700 }}>
              Browse all 20 excursion categories →
            </Link>
          </div>

          <div className="grid" style={{ marginTop: 24 }}>
            {topActivities.map((act) => (
              <Link className="card" href={`/${act.portSlug}/${act.slug}`} key={act.slug}>
                <span className="badge badge-safety" style={{ alignSelf: "flex-start", marginBottom: 8 }}>
                  {act.portName} · {act.typicalDuration}
                </span>
                <h3>{act.h1}</h3>
                <p>{act.metaDescription}</p>
                <div className="chips">
                  <span className="chip">{act.returnMargin}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
