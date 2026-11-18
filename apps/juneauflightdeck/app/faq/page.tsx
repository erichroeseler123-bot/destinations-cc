import type { Metadata } from "next";
import StaticPage from "../components/StaticPage";
import SourcesAndFreshness from "../components/SourcesAndFreshness";
import {
  LFSE_CANONICAL_LINKS,
  TWO_HOUR_BUFFER_CLARIFICATION,
  VERBATIM_TWO_HOUR_BUFFER_RULE,
} from "@/lib/verifiedOperatorPricing";

export const metadata: Metadata = {
  title: "Juneau Tour FAQ",
  description:
    "Juneau shore-excursion FAQ covering helicopter weather, verified operator tariffs, 2-hour cruise return planning, and sea-level backups.",
  alternates: { canonical: "https://juneauflightdeck.com/faq" },
};

export default function FaqPage() {
  return (
    <StaticPage
      eyebrow="Juneau tour FAQ"
      title="The questions that change what you should book."
      intro="Juneau Flight Deck is an independent flightseeing education and concierge planning site—not an FAA Part 135 flight operator. Always verify final prices, weight tiers, and cancellation rules on the booking provider's checkout page."
      bullets={[
        "Weather cancellations happen when mountain cloud ceilings drop below Part 135 visual minimums. Check supplemental FAA WeatherCams and keep a sea-level backup in mind before port arrival.",
        "When TEMSCO, Coastal, or NorthStar cancels a flight for weather, you receive a 100% refund (or optional rebooking) under your reservation's terms; backup tours are optional and booked separately.",
        `${VERBATIM_TWO_HOUR_BUFFER_RULE} ${TWO_HOUR_BUFFER_CLARIFICATION}`,
        "Glacier walks ($449–$459 base), crampon treks ($539–$599 base), and seasonal May–August dog sledding ($759–$789 base, all verified November 18, 2026 before tax/fees/weight surcharges) are distinct products—choose the experience format first.",
        "Your ship's confirmed all-aboard deadline matters more than the generic sail-away time printed on a brochure.",
      ]}
    >
      <p style={{ fontSize: "0.88rem", lineHeight: 1.6 }}>
        Explore canonical Alaska operator and port profiles on Last Frontier Shore Excursions:{" "}
        <a
          href={LFSE_CANONICAL_LINKS.juneauHelicopterCategory}
          style={{ color: "#9ed9ff", textDecoration: "underline", fontWeight: 700 }}
        >
          Juneau Helicopter Tours ↗
        </a>{" "}
        ·{" "}
        <a
          href={LFSE_CANONICAL_LINKS.juneauWhaleCategory}
          style={{ color: "#9ed9ff", textDecoration: "underline", fontWeight: 700 }}
        >
          Juneau Whale Watching ↗
        </a>
        .
      </p>
      <SourcesAndFreshness includeSkagway />
    </StaticPage>
  );
}
