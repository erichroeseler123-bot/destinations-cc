import type { Metadata } from "next";
import HelicopterDispatchBoard from "../components/HelicopterDispatchBoard";

export const metadata: Metadata = {
  title: "Juneau Glacier Landing vs Scenic Flight | Helicopter Tour Comparison",
  description:
    "Compare Juneau glacier-landing and scenic helicopter flight formats, then check the full cruise-day timing, weather policy, and provider terms before booking.",
  alternates: { canonical: "https://juneauflightdeck.com/helicopter" },
  openGraph: {
    title: "Juneau Glacier Landing vs Scenic Flight | Juneau Flight Deck",
    description:
      "Choose whether stepping onto glacier terrain or seeing the Juneau Icefield from above matters more to your group.",
    url: "https://juneauflightdeck.com/helicopter",
    siteName: "Juneau Flight Deck",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Juneau Glacier Landing vs Scenic Flight",
    description:
      "Compare Juneau helicopter formats around your ship day before choosing a provider.",
  },
};

export const dynamic = "force-dynamic";

export default async function HelicopterPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearch = searchParams ? await searchParams : {};
  const firstStr = (v: string | string[] | undefined) =>
    Array.isArray(v) ? v[0] : v;
  const dateParam = firstStr(resolvedSearch.date) || firstStr(resolvedSearch.arrivalDate) || null;
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
      <HelicopterDispatchBoard
        portSlug="juneau"
        sourcePage="/helicopter"
        initialDate={dateParam}
        initialPassengerCount={initialPassengerCount}
      />
    </main>
  );
}
