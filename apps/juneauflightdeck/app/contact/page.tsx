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
      title="Need help with your booking, availability inquiry, or weather backup?"
      intro="Our Juneau dispatch coordination desk assists cruise travelers with port-day flight timing, availability inquiries, and same-day backup options when weather affects helicopter schedules."
      bullets={[
        "Email Coordination: Reach our team at dispatch@juneauflightdeck.com (or info@juneauflightdeck.com) with your Confirmation Code (e.g. JFD-INQUIRY-...), ship name, and port date.",
        "Support Hours & Monitoring: Forwarded directly to our dispatch desk. During Alaska cruise season (May–September), inbox is monitored 7:00 AM – 7:00 PM Alaska Time with prioritized same-day response for active port dates. Off-season planning inquiries are answered within 24–48 hours.",
        "Flight Weather Pivots: If your helicopter flight is grounded due to weather, we help identify same-day sea-level alternatives—such as Auke Bay whale watching or Mendenhall glacier land shuttles—that fit your ship's remaining port window.",
        "How Alternatives Are Booked: Backup tours depend on live operator availability and are booked directly with the respective tour operator (or via Viator) to keep billing transparent and avoid bundled markups.",
        "Operator Source of Truth: For active payments, immediate morning pickup adjustments, or flight manifests, the operating flight company (TEMSCO, Coastal, or NorthStar) listed on your voucher remains the ultimate operational authority.",
      ]}
      ctaHref="/juneau/what-to-do-if-helicopter-tour-canceled"
      ctaLabel="Review Weather Backup Plan →"
    />
  );
}
