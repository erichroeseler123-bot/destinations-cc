import { SupportPageShell, buildSupportMetadata } from "../supportPages";

export const metadata = buildSupportMetadata(
  "/booking-help",
  "Booking Help | New Orleans Concierge Desk",
  "Pre-booking and post-booking support guidance from New Orleans Concierge Desk.",
);

export default function BookingHelpPage() {
  return (
    <SupportPageShell
      eyebrow="Support"
      title="Booking Help"
      intro="Use this page to understand who to contact before and after booking a New Orleans tour through New Orleans Concierge Desk."
      sections={[
        {
          title: "Before you book",
          body: [
            "We can help compare tour categories, explain general differences between formats, and point you to the right tour page or operator checkout.",
            "For specific availability, live pricing, exact start times, pickup details, restrictions, or final inclusions, review the FareHarbor checkout for that tour before purchase.",
          ],
        },
        {
          title: "After you book",
          body: [
            "After booking a third-party tour, use the operator and FareHarbor details in your confirmation email for changes, cancellations, refunds, weather updates, late arrivals, pickup questions, and day-of-tour support.",
            "New Orleans Concierge Desk can help you identify where to look in your confirmation, but the participating operator generally manages the confirmed booking.",
          ],
        },
        {
          title: "$5 French Quarter Orientation",
          body: [
            "The orientation is a New Orleans Concierge Desk offering rather than a partner tour. Until online checkout is connected, call or text the Desk to reserve an 8:00 AM or 9:30 AM spot and pay $5 per person at check-in.",
          ],
        },
        {
          title: "What to include when asking for help",
          body: [
            "For pre-booking help, include your travel date, group size, mobility considerations, children or age concerns, hotel area, and tour categories you are considering.",
            "For post-booking questions, include your booking number and operator name if you have them. Do not send payment-card details by email or text.",
          ],
        },
      ]}
    />
  );
}
