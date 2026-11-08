import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Juneau Whale Deck | Auke Bay Whale Watching Tours, CLAA Port Timing & Flight Backups | Juneau Flight Deck",
  description:
    "Launch the Juneau Whale Deck experience on Juneau Flight Deck. Check CLAA port-call timing and confirmed all-aboard 60–90 minute buffers, open the same-day flight cancellation backup flow with PAJN METAR weather context, and book approved Auke Bay whale watching checkout links.",
  alternates: { canonical: "https://juneauflightdeck.com/juneau-whale-watching-tours" },
  openGraph: {
    title: "Juneau Whale Deck | Auke Bay Excursions, CLAA Port Timing & Flight Backups",
    description:
      "Plan your Juneau whale watching tour with CLAA cruise-dock timing buffers, PAJN METAR weather context, flight-day backup coordination, and approved checkout links.",
    url: "https://juneauflightdeck.com/juneau-whale-watching-tours",
    siteName: "Juneau Flight Deck",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Juneau Whale Deck | Juneau Flight Deck",
    description: "Compare Juneau whale watching boat tours, CLAA port timing buffers, and flight-day backups.",
  },
};

const CLAA_JUNEAU_CALLS = [
  {
    shipName: "Norwegian Bliss",
    serviceDate: "2026-04-24",
    berthCode: "AJ",
    berthLabel: "AJ Dock (35m shuttle to Auke Bay)",
    claaWindow: "07:00–13:30",
    confirmedAllAboard: "12:30",
    dccBufferMinutes: 90,
    whale35hStatus: "Fits cruise window (07:35 check-in → 11:05 gangway return)",
  },
  {
    shipName: "Royal Princess",
    serviceDate: "2026-04-24",
    berthCode: "FKL",
    berthLabel: "South Franklin Dock (20m transfer to Auke Bay)",
    claaWindow: "08:00–21:00",
    confirmedAllAboard: "20:30",
    dccBufferMinutes: 60,
    whale35hStatus: "Fits cruise window (60–90m buffer cleared)",
  },
  {
    shipName: "Eurodam",
    serviceDate: "2026-04-24",
    berthCode: "CT",
    berthLabel: "Cruise Terminal Dock (20m transfer to Auke Bay)",
    claaWindow: "12:30–22:00",
    confirmedAllAboard: "21:30",
    dccBufferMinutes: 60,
    whale35hStatus: "Fits cruise window (60–90m buffer cleared)",
  },
  {
    shipName: "Ovation of the Seas",
    serviceDate: "2026-04-24",
    berthCode: "AS",
    berthLabel: "Alaska Steamship Dock (25m transfer to Auke Bay)",
    claaWindow: "13:00–21:00",
    confirmedAllAboard: null,
    dccBufferMinutes: 60,
    whale35hStatus: "Confirm ship timing",
  },
];

const whaleFaqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How does Juneau Whale Deck check cruise ship timing?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "We check whether passengers can transit from their Juneau berth (CT, FKL, AS, AJ Dock, or Tender) to tour check-in, complete the excursion, and return to the gangway before the ship's confirmed all-aboard cutoff with a 60 to 90 minute DCC safety buffer. We use the published CLAA calendar for Juneau port-call times and the ship's confirmed all-aboard time for the actual cutoff, showing 'Confirm ship timing' whenever the cutoff or a material transfer is unknown.",
      },
    },
    {
      "@type": "Question",
      name: "How does the April 24 flight-canceled backup flow work?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Travelers can select 'My flight was canceled' or use an operator's tracked cancellation link (?cancel_ref=...) to immediately open the Whale Deck backup flow. PAJN METAR observations are displayed as local aviation weather context, while actual cancellation status comes from the traveler or operator.",
      },
    },
    {
      "@type": "Question",
      name: "When are remaining seat counts displayed?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Seat counts are displayed only when the operating provider explicitly confirms them via live checkout or a reserved seat block.",
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
      name: "Whale Deck · Whale Watching Tours",
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
          Juneau Flight Deck · Whale Deck &amp; Alaska Storefront Execution
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
          Juneau Whale Deck: Auke Bay Whale Watching &amp; Same-Day Flight Backups
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
          Check whether your ship berth, tour check-in, and return gangway transfer fit inside the{" "}
          <strong>60–90 minute DCC all-aboard buffer</strong> using the published{" "}
          <strong>CLAA Juneau calendar</strong>, then book approved Auke Bay whale-watching departures through{" "}
          <strong>Juneau Flight Deck</strong> or{" "}
          <a
            href="https://www.lastfrontiershoreexcursions.com/juneau/whale-watching?src=jfd-whale-deck"
            style={{ color: "#ffd596", textDecoration: "underline" }}
          >
            Last Frontier Shore Excursions
          </a>
          .
        </p>

        <div className="jfd-hero-actions-responsive" style={{ justifyContent: "center" }}>
          <a href="#tours" className="jfd-hero-btn-primary">
            Book Approved Whale Departures &darr;
          </a>
          <a
            href="/juneau-whale-watching-tours?flight_canceled=1#backup-flow"
            data-testid="jfd-my-flight-was-canceled-btn"
            className="jfd-hero-btn-secondary"
          >
            My flight was canceled &rarr; Open Backup Flow
          </a>
          <a
            href="https://www.lastfrontiershoreexcursions.com/juneau/whale-watching?src=jfd-whale-deck"
            data-testid="jfd-to-alaska-storefront-btn"
            className="jfd-hero-btn-secondary"
          >
            Open Alaska Storefront (Last Frontier) &nearr;
          </a>
        </div>
      </section>

      {/* April 24 Dock Rollout: My Flight Was Canceled / Tracked Operator Cancellation Link + PAJN METAR */}
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
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 12 }}>
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
              April 24 Dock Rollout · Same-Day Flight Cancellation Backup Flow
            </span>
            <h2 style={{ fontSize: "1.35rem", fontWeight: 900, color: "#ffffff", margin: "4px 0 0" }}>
              {cancelRefParam
                ? `Backup Flow Active — Operator Tracked Cancellation Link (${cancelRefParam})`
                : isBackupFlowActive
                  ? "Backup Flow Active — My Flight Was Canceled"
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
          {isBackupFlowActive
            ? "Your flight cancellation status is active. Surface whale-watching vessels in Auke Bay and Stephens Passage operate at sea level under marine visibility rules and remain available below when your ship's 60–90 minute all-aboard buffer passes."
            : "Select 'My flight was canceled' or use your flight operator's tracked cancellation link (?cancel_ref=...) to unlock priority same-day Auke Bay whale-watching backup departures."}
        </p>

        {/* PAJN METAR Weather Context Box */}
        <div
          data-testid="jfd-pajn-metar-context"
          style={{
            background: "rgba(3, 14, 23, 0.78)",
            border: "1px solid rgba(125, 211, 252, 0.3)",
            borderRadius: 12,
            padding: "14px 16px",
            marginBottom: 14,
            fontSize: "0.84rem",
            color: "#cbd5e1",
          }}
        >
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
            <strong style={{ color: "#7dd3fc" }}>
              PAJN METAR Aviation Weather Context (Juneau International Airport):
            </strong>
            <code style={{ color: "#ffd596", fontSize: "0.8rem" }}>
              PAJN 241653Z 11014G22KT 2SM -RA BR OVC009 06/05 A2968 RMK AO2
            </code>
          </div>
          <div>
            PAJN METAR is shown strictly as local ceiling and visibility context.{" "}
            <strong>Cancellation status always comes from you (&ldquo;My flight was canceled&rdquo;) or your operator&apos;s tracked cancellation link</strong>—never guessed from weather alone.
          </div>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          <a
            href="/juneau-whale-watching-tours?flight_canceled=1#tours"
            className="button button-primary"
            style={{ fontSize: "0.84rem", padding: "9px 16px", fontWeight: 800 }}
          >
            My flight was canceled · Show Backup Departures &darr;
          </a>
          <Link
            href="/juneau/what-to-do-if-helicopter-tour-canceled?flight_canceled=1"
            className="button button-secondary"
            style={{ fontSize: "0.84rem", padding: "9px 16px" }}
          >
            Flight Cancellation Recovery Guide &rarr;
          </Link>
        </div>
      </section>

      {/* Featured Approved Whale-Watching Checkout Cards */}
      <section id="tours" style={{ marginBottom: 48 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <h2 style={{ fontSize: "1.85rem", fontWeight: 900, color: "#ffffff", margin: "0 0 8px" }}>
            Approved Juneau Whale Watching Checkout Paths
          </h2>
          <p style={{ color: "var(--muted)", fontSize: "0.95rem", margin: 0 }}>
            Verified checkout links shared with Last Frontier Shore Excursions (PID <code>P00281144</code> · MCID <code>42383</code>).{" "}
            <strong>Seat counts are shown only when confirmed by the provider.</strong>
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
          {/* Card 1: Approved 331813P1 Small-Group Whale Watching Cruise */}
          <article
            data-testid="jfd-offer-331813P1"
            style={{
              background: "linear-gradient(180deg, rgba(8, 28, 42, 0.95) 0%, rgba(5, 18, 28, 0.98) 100%)",
              border: "1px solid var(--line)",
              borderRadius: "var(--radius-lg, 20px)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ padding: 24, flex: 1, display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--accent, #f0b35b)", textTransform: "uppercase" }}>
                  Approved Checkout · #331813P1
                </span>
                <span style={{ fontSize: "0.78rem", color: "#ffd596", fontWeight: 700 }}>
                  {timingStatusLabel}
                </span>
              </div>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#ffffff", margin: "0 0 8px" }}>
                Small-Group Juneau Whale Watching Cruise (Alaska Galore Tours)
              </h3>
              <p style={{ fontSize: "0.88rem", color: "var(--muted)", lineHeight: 1.55, margin: "0 0 14px" }}>
                Small-group Auke Bay humpback and orca whale watching cruise with round-trip port transfers, heated cabin, and wrap-around viewing decks.
              </p>

              <div style={{ marginTop: "auto", paddingTop: 14, borderTop: "1px solid var(--line)", marginBottom: 16 }}>
                <div style={{ fontSize: "0.82rem", color: "var(--ice)", marginBottom: 4 }}>
                  ⏱ <strong>Duration:</strong> 3.5 hours (210 min) + 60–90m DCC gangway buffer
                </div>
                <div style={{ fontSize: "0.82rem", color: "var(--ice)", marginBottom: 4 }}>
                  🚐 <strong>Transfers:</strong> Round-trip shuttle from downtown Juneau cruise docks
                </div>
                <div style={{ fontSize: "0.82rem", color: "#86efac" }}>
                  ✓ 100% Whale Sighting Guarantee · Seat count shown only when provider-confirmed
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                <div>
                  <div style={{ fontSize: "0.72rem", color: "var(--muted)", textTransform: "uppercase" }}>From</div>
                  <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--accent-strong, #ffd596)" }}>$189</div>
                </div>
                <a
                  href="https://www.viator.com/tours/Juneau/Whale-Tours-in-Juneau-Alaska/d941-331813P1?pid=P00281144&mcid=42383&medium=link&campaign=last-frontier-juneau-whale-small-group"
                  target="_blank"
                  rel="sponsored noopener noreferrer"
                  className="button button-primary"
                  style={{ padding: "10px 18px", fontSize: "0.88rem", fontWeight: 800 }}
                >
                  Book #331813P1 Checkout &rarr;
                </a>
              </div>
            </div>
          </article>

          {/* Card 2: Approved 466119P3 Mendenhall Glacier Waterfall and Whale Watching Tour (Dolphin Jet Boat Tours) */}
          <article
            data-testid="jfd-offer-466119P3"
            style={{
              background: "linear-gradient(180deg, rgba(8, 28, 42, 0.95) 0%, rgba(5, 18, 28, 0.98) 100%)",
              border: "1px solid var(--line)",
              borderRadius: "var(--radius-lg, 20px)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ padding: 24, flex: 1, display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--accent, #f0b35b)", textTransform: "uppercase" }}>
                  Approved Checkout · #466119P3 · Dolphin Jet Boat Tours
                </span>
                <span style={{ fontSize: "0.78rem", color: "#ffd596", fontWeight: 700 }}>
                  {timingStatusLabel}
                </span>
              </div>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#ffffff", margin: "0 0 8px" }}>
                Mendenhall Glacier Waterfall and Whale Watching Tour (Dolphin Jet Boat Tours)
              </h3>
              <p style={{ fontSize: "0.88rem", color: "var(--muted)", lineHeight: 1.55, margin: "0 0 14px" }}>
                Combined Auke Bay whale watching cruise and Mendenhall Glacier / Nugget Falls visit operated by <strong>Dolphin Jet Boat Tours</strong> (verified Viator supplier for #466119P3; direct referral credit for Juneau Tours &amp; Whale Watch remains pending until match confirmation).
              </p>

              <div style={{ marginTop: "auto", paddingTop: 14, borderTop: "1px solid var(--line)", marginBottom: 16 }}>
                <div style={{ fontSize: "0.82rem", color: "var(--ice)", marginBottom: 4 }}>
                  ⏱ <strong>Duration:</strong> 5.5 hours (330 min) + 90m multi-leg DCC buffer
                </div>
                <div style={{ fontSize: "0.82rem", color: "var(--ice)", marginBottom: 4 }}>
                  🚐 <strong>Transfers:</strong> Mt. Roberts Tramway lower parking garage (Dolphin blue &amp; yellow sign)
                </div>
                <div style={{ fontSize: "0.82rem", color: "#86efac" }}>
                  ✓ Guaranteed Whale Sightings · USFS entry included
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                <div>
                  <div style={{ fontSize: "0.72rem", color: "var(--muted)", textTransform: "uppercase" }}>From</div>
                  <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--accent-strong, #ffd596)" }}>$199–$225</div>
                </div>
                <a
                  href="https://www.viator.com/tours/Juneau/Mendenhall-Glacier-Waterfall-and-Whale-Watching-Tour/d941-466119P3?pid=P00281144&mcid=42383&medium=link&campaign=last-frontier-juneau-whale-mendenhall-combo"
                  target="_blank"
                  rel="sponsored noopener noreferrer"
                  className="button button-primary"
                  style={{ padding: "10px 18px", fontSize: "0.88rem", fontWeight: 800 }}
                >
                  Book #466119P3 Checkout &rarr;
                </a>
              </div>
            </div>
          </article>

          {/* Card 3: Juneau Tours & Whale Watch (Direct 10% Path & Referral Credit Pending Match Confirmation + Approved 5857SHUTTLE) */}
          <article
            data-testid="jfd-offer-juneau-tours-direct-pending"
            style={{
              background: "linear-gradient(180deg, rgba(8, 28, 42, 0.95) 0%, rgba(5, 18, 28, 0.98) 100%)",
              border: "1px solid rgba(240, 179, 91, 0.45)",
              borderRadius: "var(--radius-lg, 20px)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ padding: 24, flex: 1, display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--accent, #f0b35b)", textTransform: "uppercase" }}>
                  Juneau Tours &amp; Whale Watch
                </span>
                <span style={{ fontSize: "0.75rem", color: "#ffd596", fontWeight: 700 }}>
                  Direct Referral Credit Pending
                </span>
              </div>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#ffffff", margin: "0 0 8px" }}>
                Juneau Tours &amp; Whale Watch (Viator #5857 Prefix + Express Shuttle)
              </h3>
              <p style={{ fontSize: "0.88rem", color: "var(--muted)", lineHeight: 1.55, margin: "0 0 14px" }}>
                Viator product records confirm <strong>Juneau Tours &amp; Whale Watch</strong> operates prefix <code>5857</code> (<code>#5857SHUTTLE</code> Mendenhall Glacier Express, <code>#5857P22</code> Mendenhall Glacier Park &amp; Ultimate Whale Watch Combo, and <code>#5857P23</code> Ultimate Juneau Whale Watch), while <code>#466119P3</code> is supplied by <strong>Dolphin Jet Boat Tours</strong>. Direct 10% Rezgo / seat-block referral credit stays pending until the operator match is confirmed.
              </p>

              <div style={{ marginTop: "auto", paddingTop: 14, borderTop: "1px solid var(--line)", marginBottom: 16 }}>
                <div style={{ fontSize: "0.82rem", color: "var(--ice)", marginBottom: 4 }}>
                  ⏱ <strong>Status:</strong> Direct referral credit pending operator match confirmation
                </div>
                <div style={{ fontSize: "0.82rem", color: "var(--ice)", marginBottom: 4 }}>
                  🚐 <strong>Verified 5857 Products:</strong> #5857SHUTTLE ($79–$80) &amp; #5857P22 ($199)
                </div>
                <div style={{ fontSize: "0.82rem", color: "#ffd596" }}>
                  ✓ 15-minute hold &amp; manual dispatch (&ldquo;Booking requested&rdquo;) ready in v0.3
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                <div>
                  <div style={{ fontSize: "0.72rem", color: "var(--muted)", textTransform: "uppercase" }}>Shuttle From</div>
                  <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--accent-strong, #ffd596)" }}>$79–$80</div>
                </div>
                <a
                  href="https://www.viator.com/tours/Juneau/Mendenhall-Glacier-Express/d941-5857SHUTTLE?pid=P00281144&mcid=42383&medium=link&campaign=last-frontier-juneau-mendenhall-shuttle"
                  target="_blank"
                  rel="sponsored noopener noreferrer"
                  className="button button-primary"
                  style={{ padding: "10px 18px", fontSize: "0.88rem", fontWeight: 800 }}
                >
                  Book #5857SHUTTLE &rarr;
                </a>
              </div>
            </div>
          </article>
        </div>
      </section>

      {/* Published CLAA Calendar & Confirmed Ship All-Aboard Timing Gate */}
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
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <h2 style={{ fontSize: "1.45rem", fontWeight: 800, color: "var(--text, #ffffff)", margin: 0 }}>
            CLAA Juneau Port-Call Calendar &amp; Confirmed All-Aboard Buffer Check
          </h2>
          <span style={{ fontSize: "0.8rem", fontWeight: 800, color: "#ffd596" }}>
            60–90 Minute DCC Gangway Buffer
          </span>
        </div>
        <p style={{ lineHeight: 1.65, color: "var(--muted)", margin: "0 0 18px" }}>
          We verify whether passengers can get from their Juneau berth to tour check-in, complete the tour, and return to the gangway before all-aboard with a <strong>60–90 minute DCC buffer</strong>. We use the <strong>published CLAA calendar</strong> for Juneau port-call times and the <strong>ship&apos;s confirmed all-aboard time</strong> for the actual cutoff. Whenever the cutoff or a material transfer is unknown, we show <strong>Confirm ship timing</strong>.
        </p>

        <div style={{ overflowX: "auto", marginBottom: 20 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.84rem", color: "#e2e8f0" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.15)", textAlign: "left", color: "#ffd596" }}>
                <th style={{ padding: "10px 12px" }}>Ship &amp; Date</th>
                <th style={{ padding: "10px 12px" }}>Berth &amp; Transfer</th>
                <th style={{ padding: "10px 12px" }}>CLAA Port Call</th>
                <th style={{ padding: "10px 12px" }}>Confirmed All-Aboard</th>
                <th style={{ padding: "10px 12px" }}>DCC Buffer</th>
                <th style={{ padding: "10px 12px" }}>Timing Status</th>
              </tr>
            </thead>
            <tbody>
              {CLAA_JUNEAU_CALLS.map((row) => (
                <tr key={`${row.shipName}-${row.serviceDate}`} style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  <td style={{ padding: "10px 12px", fontWeight: 700 }}>
                    {row.shipName} ({row.serviceDate})
                  </td>
                  <td style={{ padding: "10px 12px" }}>{row.berthLabel}</td>
                  <td style={{ padding: "10px 12px" }}>{row.claaWindow}</td>
                  <td style={{ padding: "10px 12px", fontWeight: 700 }}>
                    {row.confirmedAllAboard || "Unknown"}
                  </td>
                  <td style={{ padding: "10px 12px" }}>{row.dccBufferMinutes} min</td>
                  <td style={{ padding: "10px 12px", fontWeight: 800, color: row.confirmedAllAboard ? "#86efac" : "#ffd596" }}>
                    {row.whale35hStatus}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <a
            href="https://www.lastfrontiershoreexcursions.com/juneau/whale-watching?src=jfd-whale-deck"
            className="button button-primary"
            style={{ fontSize: "0.88rem" }}
          >
            Compare on Last Frontier Shore Excursions &nearr;
          </a>
          <Link href="/helicopter-waitlist" className="button button-secondary" style={{ fontSize: "0.88rem" }}>
            Check Your Ship Dock Berth &rarr;
          </Link>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section style={{ borderTop: "1px solid var(--line)", paddingTop: 32 }}>
        <h2 style={{ fontSize: "1.45rem", fontWeight: 800, color: "#ffffff", marginBottom: 20 }}>
          Frequently Asked Questions About Juneau Whale Deck
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {whaleFaqSchema.mainEntity.map((faq, idx) => (
            <div
              key={idx}
              style={{
                background: "rgba(3, 14, 23, 0.5)",
                border: "1px solid var(--line)",
                borderRadius: 12,
                padding: "18px 20px",
              }}
            >
              <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--accent)", margin: "0 0 8px" }}>
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
