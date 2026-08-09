import { SupportPageShell, buildSupportMetadata } from "../supportPages";

export const metadata = buildSupportMetadata(
  "/terms",
  "Terms of Use and Booking Terms | New Orleans Concierge Desk",
  "Terms explaining the visitor-help, affiliate recommendation, direct orientation, and operator-controlled booking roles of New Orleans Concierge Desk.",
);

export default function TermsPage() {
  return (
    <SupportPageShell
      eyebrow="Terms"
      title="Terms of Use and Booking Terms"
      updated="August 9, 2026"
      intro="New Orleans Concierge Desk provides visitor help, tour recommendations, and an independently offered $5 French Quarter Morning Orientation. Independent tour operators provide the other experiences displayed on this site and generally serve as the merchant and service provider for those bookings."
      sections={[
        {
          title: "Our role",
          body: [
            "We help travelers compare New Orleans tours, understand differences between experiences, and continue to participating operator booking paths. We do not operate every tour listed on this site.",
            "When you book a partner tour through a FareHarbor link or lightframe, the operator and FareHarbor booking flow provide the checkout terms that control that transaction.",
          ],
        },
        {
          title: "$5 French Quarter Orientation",
          body: [
            "The French Quarter Morning Orientation is offered by New Orleans Concierge Desk and is separate from third-party tours. Until online checkout is connected, reservations are confirmed directly by call or text and payment is handled at check-in.",
          ],
        },
        {
          title: "Availability and checkout details",
          body: [
            "Third-party prices, availability, schedules, inclusions, exclusions, age rules, accessibility details, pickup details, and restrictions may change. No partner tour is guaranteed available until the booking is confirmed through the operator checkout process.",
            "Site content may contain errors or become out of date. Review the specific tour page, FareHarbor checkout, and operator confirmation before relying on any third-party booking detail.",
          ],
        },
        {
          title: "Independent operators",
          body: [
            "Participating operators are responsible for operating their tours, setting participation rules, managing service delivery, and communicating confirmed booking terms.",
            "Questions after booking should be directed to the operator contact information in your confirmation email, especially for changes, cancellations, weather decisions, late arrivals, and day-of-tour instructions.",
          ],
        },
        {
          title: "Limitations",
          body: [
            "We provide recommendation and booking-assistance content as-is and cannot guarantee that all third-party information will be complete, current, or error-free at every moment.",
            "To the extent allowed by applicable law, New Orleans Concierge Desk is not responsible for operator service failures, schedule changes, denied participation, weather interruptions, or policies controlled by an independent operator.",
          ],
        },
      ]}
    />
  );
}
