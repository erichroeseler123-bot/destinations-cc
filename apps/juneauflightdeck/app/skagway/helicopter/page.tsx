import type { Metadata } from "next";
import HelicopterDispatchBoard from "../../components/HelicopterDispatchBoard";
import { buildFlightGuideJsonLd } from "@/lib/operatorSchema";

export const metadata: Metadata = {
  title: "Skagway Helicopter Tours & Glacier Flights (Verified 2026 Guide)",
  description:
    "Compare Skagway helicopter glacier landings ($479 base) and Denver Glacier dog sledding ($649 base, as of November 18, 2026) operated by TEMSCO Helicopters, with 2-hour cruise return planning.",
  alternates: { canonical: "https://juneauflightdeck.com/skagway/helicopter" },
};

const skagwayHelicopterSchema = buildFlightGuideJsonLd({
  url: "https://juneauflightdeck.com/skagway/helicopter",
  name: "Skagway & Juneau Corridor Helicopter Tours — Independent Planning Guide",
  description:
    "Independent Inside Passage helicopter planning guide covering Skagway flights operated by TEMSCO Helicopters ($479 Glacier Discovery and $649 Glacier Dog Sledding base tariffs as of November 18, 2026) alongside Juneau corridor operators.",
  breadcrumbs: [
    { name: "Juneau Flight Deck", url: "https://juneauflightdeck.com/" },
    { name: "Skagway Helicopter Tours", url: "https://juneauflightdeck.com/skagway/helicopter" },
  ],
  comparedOperators: ["temsco", "coastal", "northstar"],
});

export default function SkagwayHelicopterPage() {
  return (
    <main id="main-content">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(skagwayHelicopterSchema) }}
      />
      <HelicopterDispatchBoard portSlug="skagway" sourcePage="/skagway/helicopter" />
    </main>
  );
}
