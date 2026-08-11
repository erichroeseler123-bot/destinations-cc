import type { Metadata } from "next";
import HelicopterDispatchBoard from "../../components/HelicopterDispatchBoard";

export const metadata: Metadata = {
  title: "Juneau Glacier Helicopter Tours",
  description:
    "Compare Juneau glacier helicopter tours, landing-style experiences, cruise-day timing, and weather-aware backup planning.",
  alternates: { canonical: "https://juneauflightdeck.com/juneau/helicopter" },
};

export default function JuneauHelicopterPage() {
  return <HelicopterDispatchBoard portSlug="juneau" sourcePage="/juneau/helicopter" />;
}
