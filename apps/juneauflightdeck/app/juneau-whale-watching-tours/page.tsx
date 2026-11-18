import type { Metadata } from "next";
import Link from "next/link";
import SourcesAndFreshness from "../components/SourcesAndFreshness";
import {
  LFSE_CANONICAL_LINKS,
  TWO_HOUR_BUFFER_CLARIFICATION,
  UNVERIFIED_PARTNER_PRICE_LABEL,
  VERBATIM_TWO_HOUR_BUFFER_RULE,
} from "@/lib/verifiedOperatorPricing";

export const metadata: Metadata = {
  title: "Juneau Flight-Canceled Backup Options | Juneau Flight Deck",
  description:
    "Same-day weather-canceled helicopter backup timing and Auke Bay whale watching options for Juneau cruise passengers.",
  robots: { index: false, follow: true },
  alternates: {
    canonical: "https://www.lastfrontiershoreexcursions.com/ports/juneau/whale-watching",
  },
  openGraph: {
    title: "Juneau Same-Day Whale Watching Backups | Juneau Flight Deck",
    description:
      "Check Juneau cruise-dock return buffers and explore Auke Bay whale-watching backup departures when mountain cloud ceilings ground glacier flights.",
    url: "https://juneauflightdeck.com/juneau-whale-watching-tours",
    siteName: "Juneau Flight Deck",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Juneau Flight-Canceled Backup Options | Juneau Flight Deck",
    description:
      "Compare Juneau whale watching backup tours and 2-hour cruise return buffers.",
  },
};

const CLAA_JUNEAU_CALLS = [
  {
    shipName: "Norwegian Bliss",
    serviceDate: "Sample Morning Call",
    berthCode: "AJ",
    berthLabel: "AJ Dock (35m shuttle to Auke Bay)",
    claaWindow: "07:00–13:30",
    confirmedAllAboard: "12:30",
    dccBufferMinutes: 120,
    whale35hStatus: "Reduced buffer (1:00 remaining) — not recommended",
  },
  {
    shipName: "Royal Princess",
    serviceDate: "Sample Full-Day Call",
    berthCode: "FKL",
    berthLabel: "South Franklin Dock (20m transfer to Auke Bay)",
    claaWindow: "08:00–21:00",
    confirmedAllAboard: "20:30",
    dccBufferMinutes: 120,
    whale35hStatus: "Fits cruise window (2-hour return buffer cleared)",
  },
  {
    shipName: "Eurodam",
    serviceDate: "Sample Afternoon/Evening Call",
    berthCode: "CT",
    berthLabel: "Cruise Terminal Dock (20m transfer to Auke Bay)",
    claaWindow: "12:30–22:00",
    confirmedAllAboard: "21:30",
    dccBufferMinutes: 120,
    whale35hStatus: "Fits cruise window (2-hour return buffer cleared)",
  },
  {
    shipName: "Ovation of the Seas",
    serviceDate: "Sample Afternoon Call",
    berthCode: "AS",
    berthLabel: "Alaska Steamship Dock (25m transfer to Auke Bay)",
    claaWindow: "13:00–21:00",
    confirmedAllAboard: null,
    dccBufferMinutes: 120,
    whale35hStatus: "Confirm ship timing",
  },
];

const whaleFaqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How should cruise passengers time a same-day whale-watching backup tour?",
      acceptedAnswer: {
        "@type": "Answer",
        text: `${VERBATIM_TWO_HOUR_BUFFER_RULE} ${TWO_HOUR_BUFFER_CLARIFICATION}`,
      },
    },
    {
      "@type": "Question",
      name: "Why do whale-watching tours operate when glacier helicopter flights cancel?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Auke Bay and Stephens Passage whale-watching vessels operate at sea level under Coast Guard marine visibility rules, whereas glacier helicopters require clear VFR mountain passes between 1,800 and 4,000 feet.",
      },
    },
    {
      "@type": "Question",
      name: "How do I confirm group availability and current pricing?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Open the provider booking page or Last Frontier Shore Excursions directory, select your exact date and party size, and verify current operator pricing and return times before paying.",
      },
    },
  ],
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: "https://juneauflightdeck.com/",
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Same-Day Whale Watching Backups",
      item: "https://juneauflightdeck.com/juneau-whale-watching-tours",
    },
  ],
};

export const dynamic = "force-dynamic";

export default async function WhaleWatchingPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearch = searchParams ? await searchParams : {};
  const firstStr = (v: string | string[] | undefined) =>
    Array.isArray(v) ? v[0] : v;

  const flightCanceledParam = firstStr(resolvedSearch.flight_canceled);
  const cancelRefParam = firstStr(resolvedSearch.cancel_ref);
  const allAboardParam = firstStr(resolvedSearch.all_aboard);
  const berthParam = firstStr(resolvedSearch.berth);

  const isBackupFlowActive =
    flightCanceledParam === "1" ||
    flightCanceledParam === "true" ||
    Boolean(cancelRefParam && cancelRefParam.trim().length > 0);

  const timingStatusLabel =
    allAboardParam && berthParam ? "Fits cruise window" : "Confirm ship timing";

  return (
    <main
      id="main-content"
      data-testid="jfd-whale-deck-page"
      className="page-shell"
      style={{ maxWidth: 1040, margin: "0 auto", padding: "40px 20px 80px" }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(whaleFaqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {/* Hero Section */}
      <section style={{ textAlign: "center", marginBottom: 32 }}>
        <p className="eyebrow" style={{ color: "var(--accent, #f0b35b)", marginBottom: 8 }}>
          Juneau Flight Deck · Same-Day Weather Backup Options
        </p>
        <h1
          style={{
            fontSize: "clamp(1.4rem, 4.2vw, 2.75rem)",
            fontWeight: 900,
            lineHeight: 1.18,
            color: "var(--text, #ffffff)",
            margin: "0 0 16px",
            letterSpacing: "-0.02em",
          }}
        >
          Auke Bay Whale Watching &amp; Same-Day Flight Backups
        </h1>
        <p
          style={{
            fontSize: "1.02rem",
            lineHeight: 1.6,
            color: "var(--ice, #9ed9ff)",
            maxWidth: 820,
            margin: "0 auto 16px",
          }}
        >
          {VERBATIM_TWO_HOUR_BUFFER_RULE} Compare sea-level Auke Bay whale-watching backup options
          below or browse the full{" "}
          <a
            href="https://www.lastfrontiershoreexcursions.com/ports/juneau/whale-watching?src=jfd-whale-deck"
            style={{ color: "#ffd596", textDecoration: "underline" }}
          >
            Juneau Whale Watching Directory on Last Frontier Shore Excursions ↗
          </a>
          .
        </p>

        <div className="jfd-hero-actions-responsive" style={{ justifyContent: "center" }}>
          <a href="#tours" className="jfd-hero-btn-primary">
            Compare Backup Whale Departures ↓
          </a>
          <a
            href="/juneau-whale-watching-tours?flight_canceled=1#backup-flow"
            data-testid="jfd-my-flight-was-canceled-btn"
            className="jfd-hero-btn-secondary"
          >
            My flight was canceled → Open Backup Options
          </a>
          <a
            href="https://www.lastfrontiershoreexcursions.com/ports/juneau/whale-watching?src=jfd-whale-deck"
            data-testid="jfd-to-alaska-storefront-btn"
            className="jfd-hero-btn-secondary"
          >
            Open Last Frontier Shore Excursions ↗
          </a>
        </div>
      </section>

      {/* Same-Day Flight Cancellation Backup Banner */}
      <section
        id="backup-flow"
        data-testid="jfd-backup-flow-banner"
        style={{
          background: isBackupFlowActive
            ? "linear-gradient(135deg, rgba(14, 165, 233, 0.22) 0%, rgba(5, 24, 38, 0.96) 100%)"
            : "rgba(8, 28, 42, 0.85)",
          border: isBackupFlowActive
            ? "2px solid rgba(56, 189, 248, 0.65)"
            : "1px solid var(--line, rgba(255,255,255,0.15))",
          borderRadius: 18,
          padding: "24px",
          marginBottom: 32,
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            marginBottom: 12,
          }}
        >
          <div>
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                color: "var(--accent, #f0b35b)",
              }}
            >
              Same-Day Sea-Level Recovery
            </span>
            <h2 style={{ fontSize: "1.35rem", fontWeight: 900, color: "#ffffff", margin: "4px 0 0" }}>
              {isBackupFlowActive
                ? "Backup Options Active — My Flight Was Canceled"
                : "Was Your Helicopter or Floatplane Flight Canceled Today?"}
            </h2>
          </div>
          <span
            data-testid="jfd-timing-status-pill"
            style={{
              background: "rgba(240, 179, 91, 0.16)",
              border: "1px solid rgba(240, 179, 91, 0.45)",
              color: "#ffd596",
              padding: "6px 12px",
              borderRadius: 999,
              fontSize: "0.78rem",
              fontWeight: 800,
            }}
          >
            {timingStatusLabel}
          </span>
        </div>

        <p style={{ margin: "0 0 14px", fontSize: "0.92rem", color: "#e2e8f0", lineHeight: 1.6 }}>
          Surface whale-watching vessels in Auke Bay and Stephens Passage operate at sea level even
          when mountain cloud ceilings ground upper-icefield flights. {TWO_HOUR_BUFFER_CLARIFICATION}
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          <a
            href="/juneau-whale-watching-tours?flight_canceled=1#tours"
            className="button button-primary"
            style={{ fontSize: "0.84rem", padding: "9px 16px", fontWeight: 800 }}
          >
            Show Sea-Level Backup Options ↓
          </a>
          <Link
            href="/juneau/what-to-do-if-helicopter-tour-canceled?flight_canceled=1"
            className="button button-secondary"
            style={{ fontSize: "0.84rem", padding: "9px 16px" }}
          >
            Flight Cancellation Recovery Guide →
          </Link>
        </div>
      </section>

      {/* Featured Whale-Watching Checkout Cards */}
      <section id="tours" style={{ marginBottom: 48 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <h2 style={{ fontSize: "1.85rem", fontWeight: 900, color: "#ffffff", margin: "0 0 8px" }}>
            Juneau Whale Watching &amp; Ground Backup Paths
          </h2>
          <p style={{ color: "var(--muted)", fontSize: "0.95rem", margin: 0 }}>
            Partner links below open official Viator or regional Alaska checkout calendars (we may
            earn a partner commission at no extra cost to you). Confirm current operator pricing,
            party capacity, and return timing before reserving.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
            gap: 24,
          }}
        >
          {/* Card 1: 331813P1 */}
          <article
            data-testid="jfd-offer-331813P1"
            style={{
              background:
                "linear-gradient(180deg, rgba(8, 28, 42, 0.95) 0%, rgba(5, 18, 28, 0.98) 100%)",
              border: "1px solid var(--line)",
              borderRadius: "var(--radius-lg, 20px)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ padding: 24, flex: 1, display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 800,
                    color: "var(--accent, #f0b35b)",
                    textTransform: "uppercase",
                  }}
                >
                  Partner Listing · Auke Bay
                </span>
                <span style={{ fontSize: "0.78rem", color: "#ffd596", fontWeight: 700 }}>
                  {timingStatusLabel}
                </span>
              </div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#ffffff", margin: "0 0 8px" }}>
                Small-Group Juneau Whale Watching Cruise (Alaska Galore Tours)
              </h3>
              <p
                style={{
                  fontSize: "0.88rem",
                  color: "var(--muted)",
                  lineHeight: 1.55,
                  margin: "0 0 14px",
                }}
              >
                Small-group Auke Bay humpback and orca whale watching cruise with round-trip
                downtown port transfers, heated cabin, and wrap-around viewing decks.
              </p>

              <div
                style={{
                  marginTop: "auto",
                  paddingTop: 14,
                  borderTop: "1px solid var(--line)",
                  marginBottom: 16,
                }}
              >
                <div style={{ fontSize: "0.82rem", color: "var(--ice)", marginBottom: 4 }}>
                  ⏱ <strong>Duration:</strong> 3.5 hours + plan 2-hour return buffer before
                  all-aboard
                </div>
                <div style={{ fontSize: "0.82rem", color: "var(--ice)", marginBottom: 4 }}>
                  🚐 <strong>Transfers:</strong> Round-trip shuttle from downtown Juneau cruise
                  docks
                </div>
                <div style={{ fontSize: "0.82rem", color: "#86efac" }}>
                  ✓ Whale sighting guarantee · Confirm date &amp; party size on provider calendar
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <div
                    style={{ fontSize: "0.72rem", color: "var(--muted)", textTransform: "uppercase" }}
                  >
                    Rate
                  </div>
                  <div
                    style={{
                      fontSize: "0.9rem",
                      fontWeight: 800,
                      color: "var(--accent-strong, #ffd596)",
                    }}
                  >
                    {UNVERIFIED_PARTNER_PRICE_LABEL}
                  </div>
                </div>
                <a
                  href="https://www.viator.com/tours/Juneau/Whale-Tours-in-Juneau-Alaska/d941-331813P1?pid=P00281144&mcid=42383&medium=link&campaign=last-frontier-juneau-whale-small-group"
                  target="_blank"
                  rel="sponsored noopener noreferrer"
                  className="button button-primary"
                  style={{ padding: "10px 18px", fontSize: "0.86rem", fontWeight: 800 }}
                >
                  Check Partner Calendar ↗
                </a>
              </div>
            </div>
          </article>

          {/* Card 2: 466119P3 */}
          <article
            data-testid="jfd-offer-466119P3"
            style={{
              background:
                "linear-gradient(180deg, rgba(8, 28, 42, 0.95) 0%, rgba(5, 18, 28, 0.98) 100%)",
              border: "1px solid var(--line)",
              borderRadius: "var(--radius-lg, 20px)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ padding: 24, flex: 1, display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 800,
                    color: "var(--accent, #f0b35b)",
                    textTransform: "uppercase",
                  }}
                >
                  Partner Combo · Dolphin Jet Boat Tours
                </span>
                <span style={{ fontSize: "0.78rem", color: "#ffd596", fontWeight: 700 }}>
                  {timingStatusLabel}
                </span>
              </div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#ffffff", margin: "0 0 8px" }}>
                Mendenhall Glacier Waterfall &amp; Whale Watching Combo
              </h3>
              <p
                style={{
                  fontSize: "0.88rem",
                  color: "var(--muted)",
                  lineHeight: 1.55,
                  margin: "0 0 14px",
                }}
              >
                Combined Auke Bay whale watching cruise and ground visit to Mendenhall Glacier /
                Nugget Falls operated by Dolphin Jet Boat Tours.
              </p>

              <div
                style={{
                  marginTop: "auto",
                  paddingTop: 14,
                  borderTop: "1px solid var(--line)",
                  marginBottom: 16,
                }}
              >
                <div style={{ fontSize: "0.82rem", color: "var(--ice)", marginBottom: 4 }}>
                  ⏱ <strong>Duration:</strong> 5.5 hours + plan 2-hour return buffer before
                  all-aboard
                </div>
                <div style={{ fontSize: "0.82rem", color: "var(--ice)", marginBottom: 4 }}>
                  🚐 <strong>Transfers:</strong> Downtown Mt. Roberts Tramway meeting point
                </div>
                <div style={{ fontSize: "0.82rem", color: "#86efac" }}>
                  ✓ Whale sighting guarantee · USFS visitor area entry included
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <div
                    style={{ fontSize: "0.72rem", color: "var(--muted)", textTransform: "uppercase" }}
                  >
                    Rate
                  </div>
                  <div
                    style={{
                      fontSize: "0.9rem",
                      fontWeight: 800,
                      color: "var(--accent-strong, #ffd596)",
                    }}
                  >
                    {UNVERIFIED_PARTNER_PRICE_LABEL}
                  </div>
                </div>
                <a
                  href="https://www.viator.com/tours/Juneau/Mendenhall-Glacier-Waterfall-and-Whale-Watching-Tour/d941-466119P3?pid=P00281144&mcid=42383&medium=link&campaign=last-frontier-juneau-whale-mendenhall-combo"
                  target="_blank"
                  rel="sponsored noopener noreferrer"
                  className="button button-primary"
                  style={{ padding: "10px 18px", fontSize: "0.86rem", fontWeight: 800 }}
                >
                  Check Partner Calendar ↗
                </a>
              </div>
            </div>
          </article>

          {/* Card 3: Juneau Tours & Whale Watch */}
          <article
            data-testid="jfd-offer-juneau-tours-direct-pending"
            style={{
              background:
                "linear-gradient(180deg, rgba(8, 28, 42, 0.95) 0%, rgba(5, 18, 28, 0.98) 100%)",
              border: "1px solid rgba(52, 211, 153, 0.45)",
              borderRadius: "var(--radius-lg, 20px)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ padding: 24, flex: 1, display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 800,
                    color: "var(--accent, #f0b35b)",
                    textTransform: "uppercase",
                  }}
                >
                  Juneau Tours &amp; Whale Watch
                </span>
                <span style={{ fontSize: "0.75rem", color: "#86efac", fontWeight: 700 }}>
                  Local Juneau Operator
                </span>
              </div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#ffffff", margin: "0 0 8px" }}>
                Juneau Tours &amp; Whale Watch + Glacier Express Shuttle
              </h3>
              <p
                style={{
                  fontSize: "0.88rem",
                  color: "var(--muted)",
                  lineHeight: 1.55,
                  margin: "0 0 14px",
                }}
              >
                View the canonical{" "}
                <a
                  href={LFSE_CANONICAL_LINKS.juneauWhaleWatch}
                  style={{ color: "#9ed9ff", textDecoration: "underline", fontWeight: 700 }}
                >
                  Juneau Tours &amp; Whale Watch profile on Last Frontier Shore Excursions ↗
                </a>{" "}
                or check Mendenhall Glacier Express ground shuttle departures.
              </p>

              <div
                style={{
                  marginTop: "auto",
                  paddingTop: 14,
                  borderTop: "1px solid var(--line)",
                  marginBottom: 16,
                }}
              >
                <div style={{ fontSize: "0.82rem", color: "#86efac", marginBottom: 4 }}>
                  ✓ <strong>Whale Watch &amp; Combos:</strong> Compare departures on Last Frontier
                  Shore Excursions
                </div>
                <div style={{ fontSize: "0.82rem", color: "var(--ice)", marginBottom: 4 }}>
                  🚐 <strong>Mendenhall Glacier Express Shuttle:</strong>{" "}
                  {UNVERIFIED_PARTNER_PRICE_LABEL}
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <div
                    style={{ fontSize: "0.72rem", color: "var(--muted)", textTransform: "uppercase" }}
                  >
                    Rate
                  </div>
                  <div
                    style={{
                      fontSize: "0.9rem",
                      fontWeight: 800,
                      color: "var(--accent-strong, #ffd596)",
                    }}
                  >
                    {UNVERIFIED_PARTNER_PRICE_LABEL}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <a
                    href={LFSE_CANONICAL_LINKS.juneauWhaleWatch}
                    className="button button-primary"
                    style={{ padding: "10px 14px", fontSize: "0.84rem", fontWeight: 800 }}
                  >
                    Operator Profile ↗
                  </a>
                  <a
                    href="https://www.viator.com/tours/Juneau/Mendenhall-Glacier-Express/d941-5857SHUTTLE?pid=P00281144&mcid=42383&medium=link&campaign=last-frontier-juneau-mendenhall-shuttle"
                    target="_blank"
                    rel="sponsored noopener noreferrer"
                    className="button button-secondary"
                    style={{ padding: "10px 14px", fontSize: "0.84rem", fontWeight: 800 }}
                  >
                    Glacier Shuttle ↗
                  </a>
                </div>
              </div>
            </div>
          </article>
        </div>
      </section>

      {/* CLAA Calendar & Confirmed Ship All-Aboard Timing Gate */}
      <section
        data-testid="jfd-claa-timing-gate"
        style={{
          background: "var(--panel)",
          border: "1px solid var(--line-strong)",
          borderRadius: "var(--radius-lg, 20px)",
          padding: "32px 28px",
          marginBottom: 40,
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            marginBottom: 12,
          }}
        >
          <h2 style={{ fontSize: "1.45rem", fontWeight: 800, color: "var(--text, #ffffff)", margin: 0 }}>
            Illustrative Juneau Port-Call &amp; 2-Hour All-Aboard Buffer Examples
          </h2>
          <span style={{ fontSize: "0.8rem", fontWeight: 800, color: "#ffd596" }}>
            2-Hour Planning Standard
          </span>
        </div>
        <p style={{ lineHeight: 1.65, color: "var(--muted)", margin: "0 0 18px" }}>
          {VERBATIM_TWO_HOUR_BUFFER_RULE} {TWO_HOUR_BUFFER_CLARIFICATION} Always verify your
          voyage&apos;s confirmed all-aboard time on your ship&apos;s daily program.
        </p>

        <div style={{ overflowX: "auto", maxWidth: "100%", marginBottom: 20 }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "0.84rem",
              color: "#e2e8f0",
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: "1px solid rgba(255,255,255,0.15)",
                  textAlign: "left",
                  color: "#ffd596",
                }}
              >
                <th style={{ padding: "10px 12px" }}>Ship Example</th>
                <th style={{ padding: "10px 12px" }}>Berth &amp; Transfer</th>
                <th style={{ padding: "10px 12px" }}>Port Window</th>
                <th style={{ padding: "10px 12px" }}>Sample All-Aboard</th>
                <th style={{ padding: "10px 12px" }}>Planning Buffer</th>
                <th style={{ padding: "10px 12px" }}>3.5h Whale Status</th>
              </tr>
            </thead>
            <tbody>
              {CLAA_JUNEAU_CALLS.map((row) => (
                <tr
                  key={`${row.shipName}-${row.serviceDate}`}
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <td style={{ padding: "10px 12px", fontWeight: 700 }}>
                    {row.shipName} ({row.serviceDate})
                  </td>
                  <td style={{ padding: "10px 12px" }}>{row.berthLabel}</td>
                  <td style={{ padding: "10px 12px" }}>{row.claaWindow}</td>
                  <td style={{ padding: "10px 12px", fontWeight: 700 }}>
                    {row.confirmedAllAboard || "Confirm on ship"}
                  </td>
                  <td style={{ padding: "10px 12px" }}>{row.dccBufferMinutes} min</td>
                  <td
                    style={{
                      padding: "10px 12px",
                      fontWeight: 800,
                      color: row.confirmedAllAboard ? "#86efac" : "#ffd596",
                    }}
                  >
                    {row.whale35hStatus}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <a
            href="https://www.lastfrontiershoreexcursions.com/ports/juneau/whale-watching?src=jfd-whale-deck"
            className="button button-primary"
            style={{ fontSize: "0.88rem" }}
          >
            Compare on Last Frontier Shore Excursions ↗
          </a>
          <Link
            href="/helicopter-waitlist"
            className="button button-secondary"
            style={{ fontSize: "0.88rem" }}
          >
            Check Your Ship Dock Berth →
          </Link>
        </div>
      </section>

      <SourcesAndFreshness>
        <div
          data-testid="jfd-pajn-metar-context"
          style={{
            marginTop: 10,
            padding: "10px 12px",
            borderRadius: 8,
            background: "rgba(3, 14, 23, 0.78)",
            border: "1px solid rgba(125, 211, 252, 0.25)",
            fontSize: "0.78rem",
            color: "#cbd5e1",
          }}
        >
          <strong style={{ color: "#7dd3fc" }}>
            Sample PAJN METAR Aviation Weather Context:
          </strong>{" "}
          <code>PAJN 241653Z 11014G22KT 2SM -RA BR OVC009 06/05 A2968 RMK AO2</code> — Shown as
          supplemental ceiling context; actual cancellation status always comes from your operator.
        </div>
      </SourcesAndFreshness>

      {/* Frequently Asked Questions */}
      <section style={{ borderTop: "1px solid var(--line)", paddingTop: 32, marginTop: 32 }}>
        <h2 style={{ fontSize: "1.45rem", fontWeight: 800, color: "#ffffff", marginBottom: 20 }}>
          Frequently Asked Questions About Same-Day Backups
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {whaleFaqSchema.mainEntity.map((faq) => (
            <div
              key={faq.name}
              style={{
                background: "rgba(3, 14, 23, 0.5)",
                border: "1px solid var(--line)",
                borderRadius: 12,
                padding: "18px 20px",
              }}
            >
              <h3
                style={{
                  fontSize: "1.05rem",
                  fontWeight: 800,
                  color: "var(--accent)",
                  margin: "0 0 8px",
                }}
              >
                {faq.name}
              </h3>
              <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--muted)", lineHeight: 1.6 }}>
                {faq.acceptedAnswer.text}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
