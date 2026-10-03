import type { Metadata } from "next";
import HelicopterDispatchBoard from "../../components/HelicopterDispatchBoard";

export const metadata: Metadata = {
  title: "Skagway Helicopter Tours",
  description: "Compare Skagway helicopter and glacier-flight options with cruise-day timing before opening a provider booking page.",
  alternates: { canonical: "https://juneauflightdeck.com/skagway/helicopter" },
};

export default function SkagwayHelicopterPage() {
  return (
    <main id="main-content">
      <HelicopterDispatchBoard portSlug="skagway" sourcePage="/skagway/helicopter" />
    </main>
  );
}
