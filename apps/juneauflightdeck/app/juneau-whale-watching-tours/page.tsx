import type { Metadata } from "next";
import StaticPage from "../components/StaticPage";

export const metadata: Metadata = {
  title: "Juneau Whale Watching Tours",
  description: "Plan a Juneau whale-watching shore excursion with cruise-day timing, weather-pivot context, and provider-booking handoff.",
  alternates: { canonical: "https://juneauflightdeck.com/juneau-whale-watching-tours" },
};

export default function WhaleWatchingPage() {
  return (
    <StaticPage
      eyebrow="Juneau whale watching"
      title="A strong Juneau primary plan — and a practical flight-day backup."
      intro="Whale watching belongs in the same decision set as helicopter tours because weather, port time, transfer time, and what your group actually wants can change the best answer."
      bullets={[
        "Compare total door-to-door time, not only the advertised time on the water.",
        "For cruise passengers, protect a meaningful return-to-ship buffer after the scheduled tour end.",
        "If helicopter weather deteriorates, whale watching can be a useful pivot when marine operations remain suitable.",
        "Use the provider page for current departures, pickup locations, vessel details, pricing, and cancellation rules.",
      ]}
    />
  );
}
