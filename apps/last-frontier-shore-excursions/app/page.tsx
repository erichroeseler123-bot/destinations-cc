import Link from "next/link";
import { PORTS } from "@/lib/ports";
import { DECISION_PAGES } from "@/lib/decisionPages";
import { PORT_ACTIVITIES } from "@/lib/portActivities";
import { AFFILIATE_CATALOG } from "@/lib/affiliate/catalog";
import { HERO_IMAGE, getActivityImage } from "@/lib/images";
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
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 36, alignItems: "center" }}>
            <div>
              <p className="eyebrow">Cruise-Safe Alaska Shore Excursions</p>
              <h1 style={{ fontSize: "clamp(32px, 4.5vw, 54px)", lineHeight: 1.1 }}>Cruise-Safe Alaska Shore Excursions, Sorted by Port &amp; Timing</h1>
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

            <div style={{ position: "relative" }}>
              <div
                style={{
                  position: "relative",
                  borderRadius: "16px",
                  overflow: "hidden",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  boxShadow: "0 16px 36px rgba(0, 0, 0, 0.25)",
                  aspectRatio: "16 / 10",
                  background: "#102b34",
                }}
              >
                <img
                  src={HERO_IMAGE.url}
                  alt={HERO_IMAGE.alt}
                  width={1920}
                  height={1200}
                  loading="eager"
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: "24px 16px 12px",
                    background: "linear-gradient(to top, rgba(14, 26, 31, 0.85) 0%, transparent 100%)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-end",
                  }}
                >
                  <span style={{ color: "#ffffff", fontSize: "12px", fontWeight: 600 }}>
                    {HERO_IMAGE.caption}
                  </span>
                  <span style={{ color: "#d8e9ed", fontSize: "11px", opacity: 0.85 }}>
                    Southeast Alaska
                  </span>
                </div>
              </div>
            </div>
          </div>
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
              <Link
                className="card"
                href={`/ports/${port.slug}`}
                key={port.slug}
                style={{
                  padding: 0,
                  overflow: "hidden",
                  transition: "transform 0.15s ease, box-shadow 0.15s ease",
                }}
              >
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    height: "175px",
                    overflow: "hidden",
                    background: "#eef5f6",
                  }}
                >
                  <img
                    src={port.image}
                    alt={port.imageAlt}
                    width={800}
                    height={533}
                    loading="lazy"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                  <span
                    style={{
                      position: "absolute",
                      top: 10,
                      left: 10,
                      background: "rgba(14, 26, 31, 0.75)",
                      backdropFilter: "blur(4px)",
                      color: "#ffffff",
                      fontSize: "11px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      padding: "3px 8px",
                      borderRadius: "4px",
                    }}
                  >
                    {port.region}
                  </span>
                  <span
                    style={{
                      position: "absolute",
                      bottom: 8,
                      right: 10,
                      background: "rgba(14, 26, 31, 0.65)",
                      color: "#ffffff",
                      fontSize: "10.5px",
                      padding: "2px 6px",
                      borderRadius: "3px",
                    }}
                  >
                    {port.imageCaption}
                  </span>
                </div>
                <div style={{ padding: 20, display: "flex", flexDirection: "column", flexGrow: 1 }}>
                  <h3 style={{ marginTop: 0, fontSize: "20px" }}>{port.name}</h3>
                  <p style={{ fontSize: "14px", flexGrow: 1, marginBottom: 14 }}>{port.hook}</p>
                  <div className="chips">
                    {port.bestFor.slice(0, 3).map((item) => (
                      <span className="chip" key={item}>{item}</span>
                    ))}
                  </div>
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
            {topActivities.map((act) => {
              const actImg = getActivityImage(act.portSlug, act.slug);
              return (
                <Link
                  className="card"
                  href={`/${act.portSlug}/${act.slug}`}
                  key={act.slug}
                  style={{
                    padding: 0,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      position: "relative",
                      width: "100%",
                      height: "150px",
                      overflow: "hidden",
                      background: "#eef5f6",
                    }}
                  >
                    <img
                      src={actImg.url}
                      alt={actImg.alt}
                      width={600}
                      height={400}
                      loading="lazy"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                    <span
                      style={{
                        position: "absolute",
                        top: 10,
                        left: 10,
                        background: "rgba(14, 26, 31, 0.75)",
                        backdropFilter: "blur(4px)",
                        color: "#ffffff",
                        fontSize: "11px",
                        fontWeight: 700,
                        padding: "3px 8px",
                        borderRadius: "4px",
                      }}
                    >
                      {act.portName}
                    </span>
                  </div>
                  <div style={{ padding: 18, display: "flex", flexDirection: "column", flexGrow: 1 }}>
                    <h3 style={{ marginTop: 0, fontSize: "18px" }}>{act.h1}</h3>
                    <p style={{ fontSize: "13px", flexGrow: 1, marginBottom: 12 }}>{act.metaDescription}</p>
                    <div className="chips">
                      <span className="chip" style={{ fontSize: "11px" }}>{act.returnMargin}</span>
                      <span className="chip" style={{ fontSize: "11px" }}>{act.typicalDuration}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
