import { SupportPageShell, buildSupportMetadata } from "../supportPages";

export const metadata = buildSupportMetadata(
  "/booking-help",
  "Booking Help | Welcome to New Orleans Tours",
  "Pre-booking and post-booking support guidance for Welcome to New Orleans Tours.",
);

export default function BookingHelpPage() {
  return (
    <SupportPageShell
      eyebrow="Support"
      title="Booking Help"
      intro="Use this page to understand who to contact before and after booking a New Orleans tour through this storefront."
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
            "After booking, use the operator and FareHarbor details in your confirmation email for changes, cancellations, refunds, weather updates, late arrivals, pickup questions, and day-of-tour support.",
            "Welcome to New Orleans Tours can help you identify where to look in your confirmation, but the operator generally manages the confirmed booking.",
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
