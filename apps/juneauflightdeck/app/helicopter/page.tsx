import type { Metadata } from "next";
import HelicopterDispatchBoard from "../components/HelicopterDispatchBoard";
import { buildFlightGuideJsonLd } from "@/lib/operatorSchema";

export const metadata: Metadata = {
  title: "Juneau Glacier Landing vs Scenic Flight | Helicopter Tour Comparison",
  description:
    "Compare Juneau glacier-landing and scenic helicopter flight formats across TEMSCO, Coastal, and NorthStar, with verified November 18, 2026 base tariffs and 2-hour port return planning.",
  alternates: { canonical: "https://juneauflightdeck.com/helicopter" },
  openGraph: {
    title: "Juneau Glacier Landing vs Scenic Flight | Juneau Flight Deck",
    description:
      "Independent guide to Juneau Icefield helicopter landings, seasonal dog sledding, and technical ice treks.",
    url: "https://juneauflightdeck.com/helicopter",
    siteName: "Juneau Flight Deck",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Juneau Glacier Landing vs Scenic Flight",
    description:
      "Compare Juneau helicopter operators and verified base tariffs around your ship day.",
  },
};

export const dynamic = "force-dynamic";

const helicopterGuideSchema = buildFlightGuideJsonLd({
  url: "https://juneauflightdeck.com/helicopter",
  name: "Juneau Glacier Helicopter Flights & Operator Guide",
  description:
    "Independent comparison of Juneau glacier helicopter flights operated by TEMSCO Helicopters, Coastal Helicopters, and NorthStar Trekking, with verified base tariffs as of November 18, 2026.",
  breadcrumbs: [
    { name: "Juneau Flight Deck", url: "https://juneauflightdeck.com/" },
    { name: "Glacier Flights", url: "https://juneauflightdeck.com/helicopter" },
  ],
  comparedOperators: ["temsco", "coastal", "northstar", "wings"],
});

export default async function HelicopterPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearch = searchParams ? await searchParams : {};
  const firstStr = (v: string | string[] | undefined) =>
    Array.isArray(v) ? v[0] : v;
  const dateParam =
    firstStr(resolvedSearch.date) ||
    firstStr(resolvedSearch.port_date) ||
    firstStr(resolvedSearch.arrivalDate) ||
    null;
  const rawParty =
    firstStr(resolvedSearch.party_size) ||
    firstStr(resolvedSearch.travelers) ||
    firstStr(resolvedSearch.passengerCount) ||
    firstStr(resolvedSearch.passengers) ||
    firstStr(resolvedSearch.qty);
  const parsedParty = rawParty ? Number(rawParty) : NaN;
  const initialPassengerCount =
    Number.isInteger(parsedParty) && parsedParty >= 1 && parsedParty <= 12
      ? parsedParty
      : null;

  return (
    <main id="main-content">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(helicopterGuideSchema) }}
      />
      <HelicopterDispatchBoard
        portSlug="juneau"
        sourcePage="/helicopter"
        initialDate={dateParam}
        initialPassengerCount={initialPassengerCount}
      />
    </main>
  );
}
