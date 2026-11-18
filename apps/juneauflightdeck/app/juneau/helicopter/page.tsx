import type { Metadata } from "next";
import HelicopterDispatchBoard from "../../components/HelicopterDispatchBoard";
import { buildFlightGuideJsonLd } from "@/lib/operatorSchema";

export const metadata: Metadata = {
  title: "Juneau Glacier Helicopter Tours",
  description:
    "Compare Juneau glacier helicopter tours across TEMSCO, Coastal, and NorthStar with verified November 18, 2026 tariffs, cruise port-buffer planning, and weather backups.",
  alternates: { canonical: "https://juneauflightdeck.com/juneau/helicopter" },
};

const juneauHelicopterSchema = buildFlightGuideJsonLd({
  url: "https://juneauflightdeck.com/juneau/helicopter",
  name: "Juneau Glacier Helicopter Tours — Independent Planning Guide",
  description:
    "Independent Juneau helicopter tour guide comparing TEMSCO Helicopters, Coastal Helicopters, and NorthStar Trekking.",
  breadcrumbs: [
    { name: "Juneau Flight Deck", url: "https://juneauflightdeck.com/" },
    { name: "Juneau Helicopter Tours", url: "https://juneauflightdeck.com/juneau/helicopter" },
  ],
  comparedOperators: ["temsco", "coastal", "northstar"],
});

export default function JuneauHelicopterPage() {
  return (
    <main id="main-content">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(juneauHelicopterSchema) }}
      />
      <HelicopterDispatchBoard portSlug="juneau" sourcePage="/juneau/helicopter" />
    </main>
  );
}
