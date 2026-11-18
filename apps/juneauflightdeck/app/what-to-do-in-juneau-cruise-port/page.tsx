import type { Metadata } from "next";
import StaticPage from "../components/StaticPage";
import SourcesAndFreshness from "../components/SourcesAndFreshness";
import {
  LFSE_CANONICAL_LINKS,
  TWO_HOUR_BUFFER_CLARIFICATION,
  VERBATIM_TWO_HOUR_BUFFER_RULE,
} from "@/lib/verifiedOperatorPricing";

export const metadata: Metadata = {
  title: "What to Do in Juneau Cruise Port",
  description:
    "Choose a Juneau cruise-port plan by port time, weather, glacier priority, wildlife interest, and a recommended two-hour return buffer before all-aboard.",
  alternates: { canonical: "https://juneauflightdeck.com/what-to-do-in-juneau-cruise-port" },
};

export default function JuneauCruisePortPage() {
  return (
    <StaticPage
      eyebrow="Juneau cruise port"
      title="Choose the experience that fits your actual port day."
      intro="Juneau Flight Deck is an independent flightseeing education and concierge planning guide. Compare glacier flights, sea-level wildlife tours, and cruise return timing before opening a provider checkout."
      bullets={[
        "Choose a glacier helicopter tour (TEMSCO, Coastal, or NorthStar) when stepping onto glacier ice or seasonal snowpack is your top Juneau priority.",
        "Choose sea-level Auke Bay whale watching when marine wildlife is the priority or when low mountain cloud ceilings ground upper-icefield flights.",
        `${VERBATIM_TWO_HOUR_BUFFER_RULE} ${TWO_HOUR_BUFFER_CLARIFICATION}`,
        "Keep a weather pivot ready before port day so a flight cancellation never forces a rushed dockside decision.",
        "Review final checkout totals—including CBJ sales tax, fees, and clothed weight surcharges—on the booking provider's page before reserving.",
      ]}
      ctaHref="/helicopter"
      ctaLabel="Start with glacier flights"
    >
      <div
        style={{
          margin: "18px 0 22px",
          padding: "16px 18px",
          borderRadius: 12,
          background: "rgba(7, 24, 36, 0.78)",
          border: "1px solid rgba(151, 211, 255, 0.22)",
          fontSize: "0.88rem",
          lineHeight: 1.6,
        }}
      >
        <strong style={{ display: "block", color: "#ffd596", marginBottom: 6 }}>
          Canonical Juneau Port &amp; Operator Profiles (Last Frontier Shore Excursions)
        </strong>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 16px" }}>
          <a
            href={LFSE_CANONICAL_LINKS.juneauPort}
            style={{ color: "#9ed9ff", textDecoration: "underline", fontWeight: 700 }}
          >
            Juneau Port Guide ↗
          </a>
          <a
            href={LFSE_CANONICAL_LINKS.juneauHelicopterCategory}
            style={{ color: "#9ed9ff", textDecoration: "underline", fontWeight: 700 }}
          >
            Juneau Helicopter Glacier Tours ↗
          </a>
          <a
            href={LFSE_CANONICAL_LINKS.juneauWhaleCategory}
            style={{ color: "#9ed9ff", textDecoration: "underline", fontWeight: 700 }}
          >
            Juneau Whale Watching ↗
          </a>
          <a
            href={LFSE_CANONICAL_LINKS.temsco}
            style={{ color: "#9ed9ff", textDecoration: "underline", fontWeight: 700 }}
          >
            TEMSCO Helicopters ↗
          </a>
          <a
            href={LFSE_CANONICAL_LINKS.coastal}
            style={{ color: "#9ed9ff", textDecoration: "underline", fontWeight: 700 }}
          >
            Coastal Helicopters ↗
          </a>
          <a
            href={LFSE_CANONICAL_LINKS.northstar}
            style={{ color: "#9ed9ff", textDecoration: "underline", fontWeight: 700 }}
          >
            NorthStar Trekking ↗
          </a>
          <a
            href={LFSE_CANONICAL_LINKS.wings}
            style={{ color: "#9ed9ff", textDecoration: "underline", fontWeight: 700 }}
          >
            Wings Airways ↗
          </a>
          <a
            href={LFSE_CANONICAL_LINKS.juneauWhaleWatch}
            style={{ color: "#9ed9ff", textDecoration: "underline", fontWeight: 700 }}
          >
            Juneau Tours &amp; Whale Watch ↗
          </a>
        </div>
      </div>
      <SourcesAndFreshness />
    </StaticPage>
  );
}
