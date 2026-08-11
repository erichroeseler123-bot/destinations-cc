import type { Metadata } from "next";
import StaticPage from "../components/StaticPage";

export const metadata: Metadata = {
  title: "Juneau Tour FAQ",
  description: "Juneau shore-excursion FAQ covering helicopter weather, cruise timing, backups, provider booking, and port-day planning.",
  alternates: { canonical: "https://juneauflightdeck.com/faq" },
};

export default function FaqPage() {
  return (
    <StaticPage
      eyebrow="Juneau tour FAQ"
      title="The questions that change what you should book."
      intro="The exact answer can vary by operator, ship schedule, weather, and date, so confirm final details on the provider booking page."
      bullets={[
        "Helicopter tours can be weather-sensitive. Treat a strong non-flight alternative as part of the plan, not an afterthought.",
        "Do not use the advertised tour duration as your entire timing calculation; include getting to the meeting point and a practical return buffer.",
        "Glacier landing, dogsled, and pure flightseeing are different products. Choose the experience shape first, then compare live listings.",
        "For cruise passengers, ship all-aboard time matters more than the time printed as the port-call end in a generic itinerary.",
        "Juneau Flight Deck is an independent planning and comparison surface. The provider controls inventory, pricing, pickup, cancellation, and fulfillment.",
      ]}
    />
  );
}
