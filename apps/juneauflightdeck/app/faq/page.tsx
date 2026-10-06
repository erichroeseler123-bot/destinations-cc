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
        "Weather cancellations happen when mountain ceilings drop. Our dispatch team tracks FAA ridge cameras and pass weather hours ahead—we usually know a flight is likely to cancel hours early, and proactively work on securing alternative activities (like Auke Bay whale watching) before your tour is even canceled, beating the rush at the docks.",
        "Helicopter tours are weather-sensitive. If an operator cancels for weather, you receive a 100% full refund from the operator or booking platform; backup tours depend on available capacity and are booked separately.",
        "Do not use the advertised tour duration as your entire timing calculation; include getting to the meeting point and a practical return buffer with ship all-aboard time.",
        "Glacier landing, dogsled, and pure flightseeing are different products. Choose the experience shape first, then compare live listings.",
        "For cruise passengers, ship all-aboard time matters more than the time printed as the port-call end in a generic itinerary.",
        "Juneau Flight Deck is an independent planning and comparison surface. The provider controls inventory, pricing, pickup, cancellation, and fulfillment.",
      ]}
    />
  );
}
