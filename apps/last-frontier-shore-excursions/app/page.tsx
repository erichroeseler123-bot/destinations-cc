import Link from "next/link";
import { cookies } from "next/headers";
import { PORTS } from "@/lib/ports";
import { DECISION_PAGES } from "@/lib/decisionPages";
import { PORT_ACTIVITIES } from "@/lib/portActivities";
import { AFFILIATE_CATALOG } from "@/lib/affiliate/catalog";
import { buildAffiliateUrl, buildDccHandoffAffiliateUrl } from "@/lib/affiliate/links";
import { HERO_IMAGE, getActivityImage } from "@/lib/images";
import { CruiseWindowCalculator } from "@/components/CruiseWindowCalculator";
import { ExcursionCard } from "@/components/ExcursionCard";
import { TrustDisclosure } from "@/components/TrustDisclosure";

export default async function HomePage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = searchParams ? await searchParams : {};
  let cookieCtx: string | undefined;
  try {
    const cookieStore = await cookies();
    cookieCtx =
      cookieStore.get("lfse_trip_ctx")?.value ||
      cookieStore.get("dcc_trip_ctx")?.value ||
      undefined;
  } catch {
    cookieCtx = undefined;
  }
  const rawCtx =
    (typeof sp.ctx === "string" ? sp.ctx : undefined) ||
    (typeof sp.dcc_ctx === "string" ? sp.dcc_ctx : undefined) ||
    cookieCtx ||
    null;
  const carriedDate = typeof sp.date === "string" ? sp.date : null;
  const rawParty =
    (typeof sp.partySize === "string" ? sp.partySize : undefined) ||
    (typeof sp.guests === "string" ? sp.guests : undefined);
  const carriedPartySize =
    rawParty && Number.isFinite(Number(rawParty)) ? Number(rawParty) : null;
  const carriedShip = typeof sp.ship === "string" ? sp.ship : null;
  const ctxQuery = rawCtx
    ? `?ctx=${encodeURIComponent(rawCtx)}`
    : carriedDate || carriedPartySize
    ? `?${new URLSearchParams({
        ...(carriedDate ? { date: carriedDate } : {}),
        ...(carriedPartySize ? { partySize: String(carriedPartySize) } : {}),
      }).toString()}`
    : "";

  const viatorSampleDest = buildAffiliateUrl(
    "viator",
    "https://www.viator.com/Juneau-tours/Port-Transfers/d941-g24-c4032",
    "last-frontier-home-juneau",
    "Juneau whale watching shore excursion",
    false,
  );
  const viatorHandoffHref = buildDccHandoffAffiliateUrl({
    source: "viator",
    destinationUrl: viatorSampleDest,
    productCode: "juneau-whale-mendenhall-combo",
    campaign: "last-frontier-home-viator",
    contextId: rawCtx,
    intendedDate: carriedDate,
    partySize: carriedPartySize,
  });
  const gygSampleDest = buildAffiliateUrl(
    "getyourguide",
    "https://www.getyourguide.com/s/?q=Alaska+shore+excursions",
    "last-frontier-home-gyg",
    "Alaska shore excursions",
    false,
  );
  const gygHandoffHref = buildDccHandoffAffiliateUrl({
    source: "getyourguide",
    destinationUrl: gygSampleDest,
    productCode: "alaska-gyg-catalog",
    campaign: "last-frontier-home-gyg",
    contextId: rawCtx,
    intendedDate: carriedDate,
    partySize: carriedPartySize,
  });
  const fhHandoffHref = buildDccHandoffAffiliateUrl({
    source: "fareharbor",
    destinationUrl:
      "https://fareharbor.com/embeds/book/allenmarine/items/?asn=welcometoalaskatours&ref=last-frontier-home",
    productCode: "juneau-allen-marine-whale",
    campaign: "last-frontier-home-fh",
    contextId: rawCtx,
    intendedDate: carriedDate,
    partySize: carriedPartySize,
  });

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
                  width={1024}
                  height={426}
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

      {/* DCC v0.3 Decision Assurance & Commercial Attribution Boundary */}
      <section
        aria-label="DCC Decision Assurance & Attribution Disclosure"
        data-dcc-assurance-banner="true"
        data-dcc-site="lastfrontiershoreexcursions.com"
        data-dcc-engine-id="alaska-shore-excursions"
        data-dcc-classification="qualified"
        data-dcc-context-id={rawCtx || ""}
        style={{ background: "#0b1724", color: "#e2e8f0", padding: "20px 0", borderBottom: "1px solid rgba(148,163,184,0.25)" }}
      >
        <div className="shell" style={{ fontSize: "13.5px", lineHeight: 1.55 }}>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  padding: "3px 9px",
                  borderRadius: 999,
                  fontSize: "11px",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  background: "rgba(56, 189, 248, 0.16)",
                  color: "#7dd3fc",
                  border: "1px solid rgba(56, 189, 248, 0.35)",
                }}
              >
                DCC v0.3 Classification: QUALIFIED
              </span>
              <span style={{ color: "#94a3b8", fontSize: "12px" }}>
                Engine: <code>alaska-shore-excursions@0.3.0</code> · Isolated from commission &amp; routing priority
              </span>
            </div>
            <a
              href="https://www.destinationcommandcenter.com/api/v1/docs/receipt-verification"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#38bdf8", textDecoration: "underline", fontWeight: 600, fontSize: "12px" }}
            >
              Verify DCC Decision Receipt Boundary ↗
            </a>
          </div>
          <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(15, 23, 42, 0.75)", border: "1px solid rgba(148,163,184,0.18)", marginBottom: 10 }}>
            <strong style={{ color: "#f8fafc" }}>Evidence-Bounded Classification &amp; Unresolved Requirements:</strong>{" "}
            <span>
              45-minute all-aboard margin + dock shuttle buffer (AJ Dock / Ward Cove) required. Live seat availability and ship-berth departure schedules remain unestablished until confirmed on the selected partner checkout.
            </span>
          </div>
          {(rawCtx || carriedDate || carriedPartySize || carriedShip) && (
            <div
              data-dcc-carried-context="true"
              style={{ padding: "8px 12px", borderRadius: 8, background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)", marginBottom: 10, color: "#d1fae5", fontSize: "12.5px" }}
            >
              <strong>Carried Trip Context:</strong>{" "}
              {rawCtx && <span>Opaque Ref <code>{rawCtx}</code> </span>}
              {carriedDate && <span>· Date: <strong>{carriedDate}</strong> </span>}
              {carriedPartySize && <span>· Guests: <strong>{carriedPartySize}</strong> </span>}
              {carriedShip && <span>· Ship: <strong>{carriedShip}</strong> </span>}
            </div>
          )}
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              <a
                href={viatorHandoffHref}
                data-dcc-handoff-link="true"
                data-dcc-provider="Viator"
                data-dcc-account="pid=P00281144"
                target="_blank"
                rel="sponsored noopener noreferrer"
                style={{ padding: "6px 12px", borderRadius: 6, background: "#0284c7", color: "#fff", fontWeight: 700, fontSize: "12px", textDecoration: "none" }}
              >
                Check Alaska Excursions on Viator (pid=P00281144)
              </a>
              <a
                href={gygHandoffHref}
                data-dcc-handoff-link="true"
                data-dcc-provider="GetYourGuide"
                data-dcc-account="partner_id=F2MMUUH"
                target="_blank"
                rel="sponsored noopener noreferrer"
                style={{ padding: "6px 12px", borderRadius: 6, background: "#0369a1", color: "#fff", fontWeight: 700, fontSize: "12px", textDecoration: "none" }}
              >
                Compare on GetYourGuide (partner_id=F2MMUUH)
              </a>
              <a
                href={fhHandoffHref}
                data-dcc-handoff-link="true"
                data-dcc-provider="FareHarbor"
                data-dcc-account="asn=welcometoalaskatours"
                target="_blank"
                rel="sponsored noopener noreferrer"
                style={{ padding: "6px 12px", borderRadius: 6, background: "#0f766e", color: "#fff", fontWeight: 700, fontSize: "12px", textDecoration: "none" }}
              >
                Direct Alaska Operator via FareHarbor (asn=welcometoalaskatours)
              </a>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, fontSize: "12px" }}>
              <a
                href={`https://juneauflightdeck.com/${ctxQuery}`}
                data-dcc-cross-site-link="true"
                style={{ color: "#93c5fd", textDecoration: "underline", fontWeight: 600 }}
              >
                Continue to Juneau Flight Deck (Helicopter Dispatch) →
              </a>
              <a
                href={`https://cruisepromenade.com/planner${ctxQuery}`}
                data-dcc-cross-site-link="true"
                style={{ color: "#93c5fd", textDecoration: "underline", fontWeight: 600 }}
              >
                Return to Cruise Promenade Planner →
              </a>
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
