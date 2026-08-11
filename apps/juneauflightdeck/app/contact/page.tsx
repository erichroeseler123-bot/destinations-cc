import type { Metadata } from "next";
import StaticPage from "../components/StaticPage";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact and booking-help information for Juneau Flight Deck.",
  alternates: { canonical: "https://juneauflightdeck.com/contact" },
};

export default function ContactPage() {
  return (
    <StaticPage
      eyebrow="Contact"
      title="Need help narrowing your Juneau shore day?"
      intro="Use the planning tools on the homepage to compare the right experience shape first. For an existing reservation, payment, pickup, cancellation, or operator-specific question, contact the provider shown on your booking confirmation."
      bullets={[
        "Juneau Flight Deck is a planning and referral surface, not the tour operator.",
        "Provider booking pages are the source of truth for live prices, availability, meeting instructions, and cancellation terms.",
        "For cruise timing questions, have your ship name, Juneau date, arrival time, and all-aboard time available.",
      ]}
    />
  );
}
