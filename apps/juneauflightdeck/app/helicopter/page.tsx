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

export default function HelicopterPage() {
  return <HelicopterDispatchBoard portSlug="juneau" sourcePage="/helicopter" />;
}
