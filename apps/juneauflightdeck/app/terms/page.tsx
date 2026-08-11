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
      title="Planning guidance is not the tour contract."
      intro="Juneau Flight Deck provides independent planning, comparison, and referral information. A reservation is governed by the operator or booking provider you ultimately use."
      bullets={[
        "Prices, availability, schedules, pickup details, accessibility, weather policies, cancellation terms, and fulfillment are controlled by the provider.",
        "Travel and weather conditions can change. Reconfirm critical timing and operating details before departure.",
        "Cruise passengers are responsible for knowing their ship's all-aboard time and choosing an appropriate return margin.",
        "Outbound links may be affiliate or referral links. If a qualifying booking is made, Juneau Flight Deck may receive compensation without changing the provider's public price unless the provider states otherwise.",
      ]}
      ctaLabel="Back to Juneau planning"
    />
  );
}
