import type { Metadata } from "next";
import Link from "next/link";
import SourcesAndFreshness from "../../components/SourcesAndFreshness";
import {
  LFSE_CANONICAL_LINKS,
  TWO_HOUR_BUFFER_CLARIFICATION,
  VERBATIM_TWO_HOUR_BUFFER_RULE,
  VERIFIED_TARIFF_DATE_LONG,
} from "@/lib/verifiedOperatorPricing";

export const metadata: Metadata = {
  title: "What to Do If Your Juneau Helicopter Tour Is Canceled | Juneau Flight Deck",
  description:
    "Same-day Juneau port recovery guide if low cloud ceilings or winds cancel your glacier helicopter flight—covering weather refund rules, 2-hour ship return planning, and sea-level whale-watching backups.",
  alternates: {
    canonical: "https://juneauflightdeck.com/juneau/what-to-do-if-helicopter-tour-canceled",
  },
  openGraph: {
    title: "What to Do If Your Juneau Helicopter Tour Is Canceled | Juneau Flight Deck",
    description:
      "Explore sea-level Juneau backup excursions that fit your remaining port window with at least a two-hour return buffer before all-aboard.",
    url: "https://juneauflightdeck.com/juneau/what-to-do-if-helicopter-tour-canceled",
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Why do Juneau helicopter tours get canceled for weather?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Glacier helicopter flights operate under FAA Part 135 Visual Flight Rules (VFR). Even when downtown Juneau cruise docks are calm, mountain passes leading to Mendenhall and Herbert Glaciers can hold low cloud ceilings, fog, or wind shear below safe visual minimums.",
      },
    },
    {
      "@type": "Question",
      name: "When does an operator make a cancellation call?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Licensed Part 135 chief pilots and flight dispatchers make the final safety determination, typically 45 to 90 minutes prior to scheduled departure as pass conditions evolve.",
      },
    },
    {
      "@type": "Question",
      name: "What return buffer should I keep when booking a same-day backup tour?",
      acceptedAnswer: {
        "@type": "Answer",
        text: `${VERBATIM_TWO_HOUR_BUFFER_RULE} ${TWO_HOUR_BUFFER_CLARIFICATION}`,
      },
    },
    {
      "@type": "Question",
      name: "Are refunds provided if my flight is canceled for weather?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "When TEMSCO, Coastal, or NorthStar cancels a flight due to weather, direct operator and Viator policies provide a 100% refund (or optional reschedule if time allows) according to your booking confirmation.",
      },
    },
  ],
};

export const dynamic = "force-dynamic";

export default async function JuneauHelicopterCanceledPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearch = searchParams ? await searchParams : {};
  const firstStr = (v: string | string[] | undefined) =>
    Array.isArray(v) ? v[0] : v;
  const flightCanceledParam = firstStr(resolvedSearch.flight_canceled);
  const cancelRefParam = firstStr(resolvedSearch.cancel_ref);
  const isBackupActive =
    flightCanceledParam === "1" ||
    flightCanceledParam === "true" ||
    Boolean(cancelRefParam && cancelRefParam.trim().length > 0);

  const whaleBackupHref = `/juneau-whale-watching-tours?flight_canceled=1${
    cancelRefParam ? `&cancel_ref=${encodeURIComponent(cancelRefParam)}` : ""
  }#backup-flow`;

  return (
    <main
      id="main-content"
      className="page-shell"
      style={{ maxWidth: 940, margin: "0 auto", padding: "40px 20px 80px" }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div style={{ marginBottom: 32 }}>
        <p className="eyebrow" style={{ color: "var(--accent, #f0b35b)", marginBottom: 8 }}>
          Juneau Flight Deck · Independent Weather Contingency Guide
        </p>
        <h1
          style={{
            fontSize: "clamp(2rem, 4.5vw, 2.75rem)",
            fontWeight: 900,
            lineHeight: 1.18,
            color: "var(--text, #ffffff)",
            margin: "0 0 16px",
            letterSpacing: "-0.02em",
          }}
        >
          What to Do if Your Juneau Helicopter Tour Is Canceled
        </h1>
        <p
          style={{
            fontSize: "1.06rem",
            lineHeight: 1.6,
            color: "var(--muted, #94a3b8)",
            maxWidth: 780,
            margin: "0 0 18px",
          }}
        >
          Southeast Alaska mountain weather can shift quickly. If your licensed helicopter operator
          cancels your glacier flight due to low cloud ceilings or winds, use the same-day sea-level
          backup options below to make the most of your remaining Juneau port call.
        </p>
        <div
          style={{
            marginBottom: 22,
            borderRadius: 16,
            overflow: "hidden",
            border: "1px solid var(--line, #334155)",
            aspectRatio: "16 / 9",
            maxHeight: 300,
            background: "#071626",
          }}
        >
          <img
            src="/images/portfolio/mendenhall-glacier-overview.webp"
            alt="Mendenhall Glacier face, icebergs, and Coast Mountains in Juneau, Alaska"
            width={1440}
            height={900}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "50% 48%",
              display: "block",
            }}
          />
        </div>

        <div
          data-testid="jfd-canceled-backup-panel"
          style={{
            padding: "18px 20px",
            background: isBackupActive
              ? "rgba(14, 165, 233, 0.18)"
              : "rgba(240, 179, 91, 0.12)",
            border: isBackupActive
              ? "2px solid rgba(56, 189, 248, 0.55)"
              : "1px solid rgba(240, 179, 91, 0.35)",
            borderRadius: 12,
            color: "#ffffff",
            fontSize: "0.95rem",
            lineHeight: 1.6,
          }}
        >
          <div style={{ marginBottom: 10 }}>
            <strong>
              {isBackupActive
                ? "Same-Day Flight-Canceled Backup Options Active:"
                : "Same-Day Sea-Level Backup Guidance:"}
            </strong>{" "}
            {VERBATIM_TWO_HOUR_BUFFER_RULE} {TWO_HOUR_BUFFER_CLARIFICATION} Backup tours are
            optional, booked separately, and subject to remaining capacity.
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 12 }}>
            <a
              href={whaleBackupHref}
              className="button button-primary"
              style={{ fontSize: "0.85rem", padding: "9px 16px", fontWeight: 800 }}
            >
              My flight was canceled → Check Same-Day Whale Backups →
            </a>
            <a
              href={LFSE_CANONICAL_LINKS.juneauWhaleFlightCanceled}
              className="button button-secondary"
              style={{ fontSize: "0.85rem", padding: "9px 16px" }}
            >
              Juneau Whale Watching on Last Frontier Shore Excursions ↗
            </a>
          </div>
          <p style={{ margin: "10px 0 0", fontSize: "0.82rem", color: "#cbd5e1" }}>
            Canonical local operator profile:{" "}
            <a
              href={LFSE_CANONICAL_LINKS.juneauWhaleWatch}
              style={{ color: "#9ed9ff", textDecoration: "underline", fontWeight: 700 }}
            >
              Juneau Tours &amp; Whale Watch on Last Frontier Shore Excursions ↗
            </a>{" "}
            ·{" "}
            <a
              href={LFSE_CANONICAL_LINKS.juneauPort}
              style={{ color: "#9ed9ff", textDecoration: "underline", fontWeight: 700 }}
            >
              Juneau Port Guide ↗
            </a>
          </p>
        </div>
      </div>

      {/* Local Ground Context */}
      <section
        style={{
          background:
            "linear-gradient(135deg, rgba(14, 165, 233, 0.1) 0%, rgba(15, 23, 42, 0.8) 100%)",
          border: "1px solid rgba(56, 189, 248, 0.3)",
          borderRadius: "var(--radius-lg, 16px)",
          padding: "28px 24px",
          marginBottom: "36px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: "1.2rem" }}>🏔️</span>
          <span
            style={{
              fontSize: "0.78rem",
              fontWeight: 800,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--ice, #7dd3fc)",
            }}
          >
            Why Flights Ground While Boats Sail
          </span>
        </div>
        <h2
          style={{
            fontSize: "1.45rem",
            fontWeight: 800,
            color: "var(--text, #ffffff)",
            margin: "0 0 12px",
          }}
        >
          Mountain Pass Ceilings vs. Sea-Level Marine Channels
        </h2>
        <p style={{ lineHeight: 1.65, color: "#e2e8f0", margin: "0 0 16px", fontSize: "0.95rem" }}>
          Helicopter operators (
          <a
            href={LFSE_CANONICAL_LINKS.temsco}
            style={{ color: "#9ed9ff", textDecoration: "underline" }}
          >
            TEMSCO ↗
          </a>
          ,{" "}
          <a
            href={LFSE_CANONICAL_LINKS.coastal}
            style={{ color: "#9ed9ff", textDecoration: "underline" }}
          >
            Coastal ↗
          </a>
          , and{" "}
          <a
            href={LFSE_CANONICAL_LINKS.northstar}
            style={{ color: "#9ed9ff", textDecoration: "underline" }}
          >
            NorthStar ↗
          </a>
          ) must clear 1,800–4,000 ft alpine passes under FAA Part 135 visual minimums. Meanwhile,
          Auke Bay and Stephens Passage whale-watching vessels operate at sea level where low cloud
          ceilings rarely interrupt marine departures.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))",
            gap: 14,
          }}
        >
          <div
            style={{
              background: "rgba(3, 14, 23, 0.6)",
              borderRadius: 10,
              padding: "16px",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div
              style={{
                color: "#86efac",
                fontWeight: 800,
                fontSize: "0.9rem",
                marginBottom: 4,
              }}
            >
              100% Operator Weather Refund
            </div>
            <p
              style={{
                margin: 0,
                fontSize: "0.85rem",
                color: "var(--muted, #cbd5e1)",
                lineHeight: 1.5,
              }}
            >
              When your helicopter carrier cancels due to weather, you receive a 100% refund (or
              optional rebooking) under your reservation&apos;s stated terms.
            </p>
          </div>
          <div
            style={{
              background: "rgba(3, 14, 23, 0.6)",
              borderRadius: 10,
              padding: "16px",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div
              style={{
                color: "var(--accent, #f0b35b)",
                fontWeight: 800,
                fontSize: "0.9rem",
                marginBottom: 4,
              }}
            >
              2-Hour All-Aboard Buffer
            </div>
            <p
              style={{
                margin: 0,
                fontSize: "0.85rem",
                color: "var(--muted, #cbd5e1)",
                lineHeight: 1.5,
              }}
            >
              Only pick a replacement tour whose return transfer reaches the pier at least two hours
              before your ship&apos;s confirmed all-aboard deadline.
            </p>
          </div>
          <div
            style={{
              background: "rgba(3, 14, 23, 0.6)",
              borderRadius: 10,
              padding: "16px",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div
              style={{
                color: "var(--ice, #7dd3fc)",
                fontWeight: 800,
                fontSize: "0.9rem",
                marginBottom: 4,
              }}
            >
              Next-Port Flight Option
            </div>
            <p
              style={{
                margin: 0,
                fontSize: "0.85rem",
                color: "var(--muted, #cbd5e1)",
                lineHeight: 1.5,
              }}
            >
              Calling at Skagway or Ketchikan next? Check{" "}
              <Link
                href="/skagway/helicopter"
                style={{ color: "#9ed9ff", textDecoration: "underline" }}
              >
                Skagway TEMSCO flights
              </Link>{" "}
              or{" "}
              <a
                href={LFSE_CANONICAL_LINKS.ketchikanMistyFjords}
                style={{ color: "#9ed9ff", textDecoration: "underline" }}
              >
                Ketchikan Misty Fjords ↗
              </a>
              .
            </p>
          </div>
        </div>
      </section>

      {/* Common Weather Disruption Scenarios */}
      <section
        style={{
          background: "var(--panel, rgba(17, 41, 61, 0.45))",
          border: "1px solid var(--line, rgba(255, 255, 255, 0.1))",
          borderRadius: "var(--radius-lg, 16px)",
          padding: "30px 24px",
          marginBottom: "36px",
        }}
      >
        <div
          style={{
            color: "var(--accent, #f0b35b)",
            fontSize: "0.78rem",
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            marginBottom: 8,
          }}
        >
          Port-Day Scenarios
        </div>
        <h2
          style={{
            fontSize: "1.45rem",
            fontWeight: 800,
            color: "var(--text, #ffffff)",
            margin: "0 0 16px",
          }}
        >
          Three Common Weather Disruption Patterns in Juneau
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div
            style={{
              background: "rgba(3, 14, 23, 0.7)",
              border: "1px solid var(--line, rgba(255, 255, 255, 0.08))",
              borderRadius: 12,
              padding: "18px 20px",
            }}
          >
            <h3 style={{ color: "#fca5a5", fontSize: "1rem", margin: "0 0 6px", fontWeight: 800 }}>
              1. Rolling Weather Holds
            </h3>
            <p style={{ margin: 0, fontSize: "0.88rem", lineHeight: 1.6, color: "#cbd5e1" }}>
              Operators hold flights briefly when pass ceilings are lifting. Know the latest clock
              time you can still board a 3.5-hour whale watch and return two hours before all-aboard.
            </p>
          </div>

          <div
            style={{
              background: "rgba(3, 14, 23, 0.7)",
              border: "1px solid var(--line, rgba(255, 255, 255, 0.08))",
              borderRadius: 12,
              padding: "18px 20px",
            }}
          >
            <h3 style={{ color: "#fca5a5", fontSize: "1rem", margin: "0 0 6px", fontWeight: 800 }}>
              2. Surge in Afternoon Water-Tour Demand
            </h3>
            <p style={{ margin: 0, fontSize: "0.88rem", lineHeight: 1.6, color: "#cbd5e1" }}>
              When multiple morning flight waves cancel across cruise ships in port, afternoon Auke
              Bay boats fill quickly—having direct links ready saves dockside search time.
            </p>
          </div>

          <div
            style={{
              background: "rgba(3, 14, 23, 0.7)",
              border: "1px solid var(--line, rgba(255, 255, 255, 0.08))",
              borderRadius: 12,
              padding: "18px 20px",
            }}
          >
            <h3 style={{ color: "#fca5a5", fontSize: "1rem", margin: "0 0 6px", fontWeight: 800 }}>
              3. Clear Harbor vs. Sock-In on the Icefield
            </h3>
            <p style={{ margin: 0, fontSize: "0.88rem", lineHeight: 1.6, color: "#cbd5e1" }}>
              Check{" "}
              <Link
                href="/juneau-glacier-flight-weather"
                style={{ color: "#9ed9ff", textDecoration: "underline" }}
              >
                Juneau FAA WeatherCams
              </Link>{" "}
              for visual context, while relying on your operator&apos;s official confirmation for
              actual flight status.
            </p>
          </div>
        </div>
      </section>

      {/* Practical Alternatives */}
      <section
        style={{
          background: "rgba(3, 14, 23, 0.7)",
          border: "1px solid var(--line, rgba(255, 255, 255, 0.1))",
          borderRadius: "var(--radius-lg, 16px)",
          padding: "28px 24px",
          marginBottom: "32px",
        }}
      >
        <h2
          style={{
            fontSize: "1.35rem",
            fontWeight: 800,
            color: "var(--text, #ffffff)",
            margin: "0 0 12px",
          }}
        >
          Sea-Level Juneau Alternatives When Flights Cancel
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))",
            gap: 16,
          }}
        >
          <div
            style={{
              background: "rgba(3, 14, 23, 0.6)",
              border: "1px solid var(--line, rgba(255, 255, 255, 0.08))",
              borderRadius: 12,
              padding: "18px",
            }}
          >
            <h3 style={{ color: "var(--accent, #f0b35b)", fontSize: "1rem", margin: "0 0 6px" }}>
              🐋 Auke Bay Whale Watching
            </h3>
            <p
              style={{
                fontSize: "0.86rem",
                lineHeight: 1.55,
                color: "var(--muted, #cbd5e1)",
                margin: "0 0 10px",
              }}
            >
              Heated cabin boats operate at sea level in Auke Bay and Stephens Passage—including{" "}
              <a
                href={LFSE_CANONICAL_LINKS.juneauWhaleWatch}
                style={{ color: "#9ed9ff", textDecoration: "underline" }}
              >
                Juneau Tours &amp; Whale Watch ↗
              </a>
              .
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              <a
                href={LFSE_CANONICAL_LINKS.juneauWhaleFlightCanceled}
                style={{
                  color: "var(--ice, #7dd3fc)",
                  fontSize: "0.84rem",
                  fontWeight: 700,
                  textDecoration: "underline",
                }}
              >
                Explore Juneau Whale Tours ↗
              </a>
              <a
                href={whaleBackupHref}
                style={{
                  color: "#ffd596",
                  fontSize: "0.84rem",
                  fontWeight: 700,
                  textDecoration: "underline",
                }}
              >
                Same-Day Backup Timing Check →
              </a>
            </div>
          </div>

          <div
            style={{
              background: "rgba(3, 14, 23, 0.6)",
              border: "1px solid var(--line, rgba(255, 255, 255, 0.08))",
              borderRadius: 12,
              padding: "18px",
            }}
          >
            <h3 style={{ color: "var(--accent, #f0b35b)", fontSize: "1rem", margin: "0 0 6px" }}>
              🏔️ Mendenhall Valley Ground Access
            </h3>
            <p
              style={{
                fontSize: "0.86rem",
                lineHeight: 1.55,
                color: "var(--muted, #cbd5e1)",
                margin: "0 0 10px",
              }}
            >
              Ground shuttles to the Mendenhall Glacier Visitor Center, Nugget Falls trail, and
              rainforest boardwalks operate rain or shine.
            </p>
            <Link
              href="/what-to-do-in-juneau-cruise-port"
              style={{
                color: "var(--ice, #7dd3fc)",
                fontSize: "0.84rem",
                fontWeight: 700,
                textDecoration: "underline",
              }}
            >
              Juneau Cruise Port Guide →
            </Link>
          </div>
        </div>
      </section>

      {/* Calm Sources and Freshness Disclosure (containing PAJN METAR reference) */}
      <SourcesAndFreshness>
        <div
          data-testid="jfd-canceled-pajn-metar"
          style={{
            marginTop: 10,
            padding: "10px 12px",
            borderRadius: 8,
            background: "rgba(3, 14, 23, 0.72)",
            border: "1px solid rgba(125, 211, 252, 0.22)",
            fontSize: "0.78rem",
            color: "#cbd5e1",
          }}
        >
          <strong style={{ color: "#7dd3fc" }}>
            Sample NWS / FAA Juneau Airport (PAJN) Low-Ceiling METAR Reference:
          </strong>{" "}
          <code>PAJN 241653Z 11014G22KT 2SM -RA BR OVC009 06/05 A2968 RMK AO2</code> — Aviation
          weather observations provide supplemental ceiling context only; actual flight cancellation
          status always comes directly from your licensed operator (verified{" "}
          {VERIFIED_TARIFF_DATE_LONG}).
        </div>
      </SourcesAndFreshness>

      {/* CTA Box */}
      <section
        style={{
          marginTop: 32,
          background:
            "linear-gradient(180deg, rgba(6, 17, 29, 0.85) 0%, rgba(3, 14, 23, 0.95) 100%)",
          border: "1px solid rgba(240, 179, 91, 0.4)",
          borderRadius: "var(--radius-lg, 16px)",
          padding: "32px 28px",
          textAlign: "center",
        }}
      >
        <h2 style={{ fontSize: "1.45rem", fontWeight: 900, color: "#ffffff", margin: "0 0 10px" }}>
          Planning Ahead for Your Juneau Port Day?
        </h2>
        <p
          style={{
            color: "var(--muted, #cbd5e1)",
            fontSize: "0.95rem",
            lineHeight: 1.6,
            maxWidth: 640,
            margin: "0 auto 20px",
          }}
        >
          Compare glacier helicopter operators, review port-window buffers, or reach our concierge
          desk.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12 }}>
          <Link href="/helicopter" className="button button-primary">
            Explore Glacier Flights
          </Link>
          <Link href="/helicopter-waitlist" className="button button-secondary">
            Concierge Availability Watch
          </Link>
          <Link href="/contact" className="button button-secondary">
            Contact Concierge
          </Link>
        </div>
      </section>
    </main>
  );
}
