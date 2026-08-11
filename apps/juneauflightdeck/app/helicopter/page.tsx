import type { Metadata } from "next";
import HelicopterDispatchBoard from "../components/HelicopterDispatchBoard";

export const metadata: Metadata = {
  title: "Juneau Helicopter Tours",
  description: "Compare Juneau helicopter glacier tours with cruise-day timing and weather-aware planning before opening a provider booking page.",
  alternates: { canonical: "https://juneauflightdeck.com/helicopter" },
};

export default function HelicopterPage() {
  return <HelicopterDispatchBoard portSlug="juneau" sourcePage="/helicopter" />;
}
