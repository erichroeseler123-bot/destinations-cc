import type { Metadata } from "next";
import Link from "next/link";
import { getAllAlaskaShips } from "@/lib/alaska-ships";

const SITE = "https://www.lastfrontiershoreexcursions.com";

export const metadata: Metadata = {
  title: "Alaska Cruise Ships & Port Shore Excursions (2026/2027 Fleet Guide)",
  description: "Explore verified Alaska cruise ship shore excursion guides for Juneau, Skagway, Ketchikan, Sitka, and Icy Strait Point. Find dock logistics, transit buffers, and cruise-safe tours.",
  alternates: { canonical: `${SITE}/cruise-ships` },
  openGraph: {
    title: "Alaska Cruise Ships & Port Shore Excursions | Last Frontier",
    description: "Find verified shore excursions and dock logistics tailored for your specific Alaska cruise ship and port schedule.",
    url: `${SITE}/cruise-ships`,
    siteName: "Last Frontier Shore Excursions",
  },
};

export default function CruiseShipsIndexPage() {
  const ships = getAllAlaskaShips();
  const cruiseLines = Array.from(new Set(ships.map((s) => s.cruiseLine)));

  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Alaska Cruise Ships & Port Shore Excursions",
    url: `${SITE}/cruise-ships`,
    description: "Comprehensive guide to Alaska cruise ships and port-specific shore excursions.",
    mainEntity: {
      "@type": "ItemList",
      itemListElement: ships.map((ship, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: `${ship.name} (${ship.cruiseLine})`,
        url: `${SITE}/cruise-ships/${ship.slug}`,
      })),
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <section className="hero">
        <div className="shell">
          <p className="eyebrow">Alaska Fleet Directory · 2026/2027</p>
          <h1>Alaska Cruise Ships & Port Excursion Guides</h1>
          <p className="lead">
            Every cruise ship in Alaska operates with distinct port windows, dock locations, and transit logistics. Choose your vessel below to view verified dock notes, transit margins, and excursions that fit your specific port day.
          </p>
          <div className="cta-row">
            <Link className="button" href="/decision/best-excursion-for-each-port">View Best Excursions by Port</Link>
            <Link className="button secondary" href="/tours">Browse All Tours</Link>
          </div>
        </div>
      </section>

      <div className="shell" style={{ padding: "48px 20px" }}>
        {cruiseLines.map((line) => {
          const lineShips = ships.filter((s) => s.cruiseLine === line);
          return (
            <section key={line} style={{ marginBottom: 48 }}>
              <div style={{ marginBottom: 20 }}>
                <span className="eyebrow" style={{ color: "var(--accent)" }}>Cruise Line Fleet</span>
                <h2 style={{ fontSize: 28, margin: "6px 0 12px", color: "var(--deep)" }}>{line}</h2>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
                {lineShips.map((ship) => (
                  <Link
                    key={ship.slug}
                    href={`/cruise-ships/${ship.slug}`}
                    style={{
                      background: "white",
                      border: "1px solid var(--line)",
                      borderRadius: 12,
                      padding: 24,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      boxShadow: "var(--card-shadow)",
                      transition: "transform 0.15s ease, border-color 0.15s ease",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                        <h3 style={{ fontSize: 20, margin: 0, color: "var(--deep)" }}>{ship.name}</h3>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--forest)", background: "var(--ice)", padding: "3px 8px", borderRadius: 6 }}>
                          {ship.shipClass}
                        </span>
                      </div>
                      <p style={{ color: "var(--muted)", fontSize: 14, margin: "12px 0", lineHeight: 1.5 }}>
                        {ship.summaryDescription}
                      </p>
                    </div>

                    <div>
                      <div style={{ borderTop: "1px solid var(--line)", paddingTop: 12, display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {Object.values(ship.ports).map((p) => (
                          <span key={p.portSlug} style={{ fontSize: 12, background: "#f8fbfb", border: "1px solid var(--line)", padding: "2px 8px", borderRadius: 4, color: "var(--deep)" }}>
                            {p.portName}
                          </span>
                        ))}
                      </div>
                      <div style={{ marginTop: 12, color: "var(--accent)", fontWeight: 700, fontSize: 14 }}>
                        View {ship.name} Port Guides &rarr;
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}