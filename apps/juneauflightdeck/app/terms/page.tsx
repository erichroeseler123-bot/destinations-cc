import type { Metadata } from "next";
import StaticPage from "../components/StaticPage";

export const metadata: Metadata = {
  title: "Terms",
  description: "Terms of use for Juneau Flight Deck.",
  alternates: { canonical: "https://juneauflightdeck.com/terms" },
};

export default function TermsPage() {
  return (
    <StaticPage
      eyebrow="Terms of use"
      title="Booking with Juneau Flight Deck"
      intro="Juneau Flight Deck helps you choose and book excursions with operator comparisons and cruise planning guidance. Your selected operator runs the tour, and the booking provider shown handles payment, confirmation, and reservation terms."
      bullets={[
        "Prices, availability, schedules, pickup details, accessibility, weather policies, cancellation terms, and fulfillment are controlled by the provider.",
        "Travel and weather conditions can change. Reconfirm critical timing and operating details before departure.",
        "Cruise passengers are responsible for knowing their ship's all-aboard time and choosing an appropriate return margin.",
        "Outbound links may be affiliate or referral links. If a qualifying booking is made, Juneau Flight Deck may receive compensation without changing the provider's public price unless the provider states otherwise.",
      ]}
      ctaLabel="Compare and Book Tours"
    />
  );
}
