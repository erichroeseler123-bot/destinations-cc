import type { Metadata } from "next";
import Link from "next/link";
import { PORTS } from "@/lib/ports";
import { PORT_ACTIVITIES } from "@/lib/portActivities";
import { DECISION_PAGES } from "@/lib/decisionPages";
import { AFFILIATE_CATALOG } from "@/lib/affiliate/catalog";
import { ExcursionFilters } from "@/components/ExcursionFilters";
import { CruiseWindowCalculator } from "@/components/CruiseWindowCalculator";
import { ExcursionComparisonTable } from "@/components/ExcursionComparisonTable";
import { TrustDisclosure } from "@/components/TrustDisclosure";

const SITE = "https://www.lastfrontiershoreexcursions.com";

export const metadata: Metadata = {
  title: "Alaska Shore Excursions Catalog | Tours by Port, Activity & Timing",
  description: "Browse all Alaska cruise shore excursions sorted by port, activity type, duration, and cruise-safe return-to-ship margins. Juneau, Skagway, Ketchikan, Sitka, and ISP.",
  alternates: { canonical: `${SITE}/tours` },
};

export default function ToursCatalogPage() {
  return (
    <main>
      <section className="port-hero">
        <div className="shell">
          <nav className="breadcrumbs" aria-label="Breadcrumbs">
            <Link href="/">Home</Link>
            <span>›</span>
            <span>All Tours</span>
          </nav>
          <p className="eyebrow" style={{ color: "#607078" }}>Comprehensive Directory</p>
          <h1>Alaska Shore Excursion Discovery Catalog</h1>
          <p className="lead" style={{ color: "#485b63" }}>
            Compare high-intent shore excursions across all major Southeast Alaska cruise ports, sorted by activity, duration, meeting point, and return-to-ship safety margin.
          </p>
          <TrustDisclosure compact />
        </div>
      </section>

      {/* Cruise Window Calculator */}
      <section className="section" style={{ background: "#f8fbfb", padding: "32px 0" }}>
        <div className="shell">
          <CruiseWindowCalculator portSlug="juneau" defaultDurationMinutes={210} />
        </div>
      </section>

      {/* Dynamic Excursion Filter & Results */}
      <section className="section" style={{ background: "#ffffff" }}>
        <div className="shell">
          <h2>Compare &amp; Filter All Alaska Excursions</h2>
          <p className="lead" style={{ color: "var(--muted)", marginBottom: 24 }}>
            Filter by cruise port, maximum duration, price, mobility level, and weather sensitivity. Explore curated options with live search links on Viator or GetYourGuide:
          </p>

          <ExcursionFilters excursions={AFFILIATE_CATALOG} showPortFilter={true} />
        </div>
      </section>

      {/* Side-by-Side Comparison Table */}
      <section className="section" style={{ background: "#f8fbfb", borderTop: "1px solid var(--line)" }}>
        <div className="shell">
          <h2>Side-by-Side Excursion Timing &amp; Pricing Table</h2>
          <p style={{ color: "var(--muted)" }}>
            Quick overview of duration, baseline price, meeting piers, and transfer buffers across all ports:
          </p>
          <ExcursionComparisonTable excursions={AFFILIATE_CATALOG} />
          <TrustDisclosure />
        </div>
      </section>

      {/* Port Jump Bar */}
      <section className="section" style={{ background: "white", padding: "24px 0", borderBottom: "1px solid var(--line)" }}>
        <div className="shell">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
            <strong style={{ fontSize: "14px", color: "var(--deep)" }}>Jump to Port Guides:</strong>
            {PORTS.map((p) => (
              <a className="button small secondary" href={`#port-${p.slug}`} key={p.slug}>
                {p.name} ({PORT_ACTIVITIES.filter((a) => a.portSlug === p.slug).length})
              </a>
            ))}
            <a className="button small" href="#decisions">
              Decision Guides (11)
            </a>
          </div>
        </div>
      </section>

      {/* Activities by Port */}
      {PORTS.map((port) => {
        const portActs = PORT_ACTIVITIES.filter((a) => a.portSlug === port.slug);
        return (
          <section className="section" id={`port-${port.slug}`} key={port.slug} style={{ borderBottom: "1px solid var(--line)" }}>
            <div className="shell">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap" }}>
                <div>
                  <p className="eyebrow" style={{ color: "var(--muted)" }}>{port.region}</p>
                  <h2>{port.name} Shore Excursions</h2>
                </div>
                <Link href={`/ports/${port.slug}`} style={{ color: "var(--forest)", fontWeight: 700, fontSize: "15px" }}>
                  View full {port.name} port guide & dock map →
                </Link>
              </div>

              <div className="grid" style={{ marginTop: 20 }}>
                {portActs.map((act) => (
                  <Link className="card" href={`/${act.portSlug}/${act.slug}`} key={act.slug}>
                    <span className="badge badge-safety" style={{ alignSelf: "flex-start", marginBottom: 8 }}>
                      {act.typicalDuration}
                    </span>
                    <h3>{act.h1}</h3>
                    <p>{act.metaDescription}</p>
                    <div className="chips">
                      <span className="chip">{act.returnMargin}</span>
                      <span className="chip" style={{ color: act.weatherSensitivity === 'High' ? '#9e2323' : '#156d3a' }}>
                        {act.weatherSensitivity} Sensitivity
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        );
      })}

      {/* Decision Guides Section */}
      <section className="section" id="decisions" style={{ background: "#eef5f6" }}>
        <div className="shell">
          <p className="eyebrow" style={{ color: "var(--muted)" }}>Decision Support</p>
          <h2>Alaska Shore Excursion Decision Guides</h2>
          <p className="lead" style={{ color: "var(--muted)" }}>
            In-depth comparison guides and decision matrices resolving common cruise-day dilemmas:
          </p>

          <div className="grid" style={{ marginTop: 24 }}>
            {DECISION_PAGES.map((d) => (
              <Link className="card" href={`/decision/${d.slug}`} key={d.slug} style={{ background: "white" }}>
                <span className="badge badge-safety" style={{ alignSelf: "flex-start", marginBottom: 8 }}>
                  Decision Matrix
                </span>
                <h3>{d.h1}</h3>
                <p>{d.lead}</p>
                <div className="chips">
                  <span className="chip">{d.eyebrow}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
