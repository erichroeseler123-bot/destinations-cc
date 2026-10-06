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
      eyebrow="Dispatch Desk &amp; Booking Support"
      title="Need help with your booking, availability watch, or weather backup?"
      intro="Our Juneau dispatch coordination desk assists cruise travelers with port-day flight timing, availability watch requests, and same-day backup options when weather affects helicopter schedules."
      bullets={[
        "Email Dispatch: Reach our coordination desk directly at dispatch@juneauflightdeck.com with your Confirmation Code (e.g. JFD-SCAN-...), ship name, and port date.",
        "Flight Weather Pivots: If your helicopter flight is grounded due to weather, we help identify same-day sea-level alternatives—such as Auke Bay whale watching or Mendenhall glacier land shuttles—that fit your ship's remaining port window.",
        "How Alternatives Are Booked: Backup tours depend on live operator availability and are booked directly with the respective tour operator (or via Viator) to keep billing transparent and avoid bundled markups.",
        "Operator Source of Truth: For active payments, immediate morning pickup adjustments, or flight manifests, the operating flight company (TEMSCO, Coastal, or NorthStar) listed on your voucher remains the ultimate operational authority.",
      ]}
      ctaHref="/juneau/what-to-do-if-helicopter-tour-canceled"
      ctaLabel="Review Weather Backup Plan →"
    />
  );
}
