import { SupportPageShell, buildSupportMetadata } from "../supportPages";

export const metadata = buildSupportMetadata(
  "/terms",
  "Terms of Use and Booking Terms | Welcome to New Orleans Tours",
  "Terms explaining the affiliate recommendation role of Welcome to New Orleans Tours and operator-controlled booking terms.",
);

export default function TermsPage() {
  return (
    <SupportPageShell
      eyebrow="Terms"
      title="Terms of Use and Booking Terms"
      updated="August 5, 2026"
      intro="Welcome to New Orleans Tours is an affiliate and recommendation storefront. Independent tour operators provide the experiences and generally serve as the merchant and service provider for bookings."
      sections={[
        {
          title: "Our role",
          body: [
            "We help travelers compare New Orleans tours, understand differences between experiences, and continue to operator booking paths. We do not operate every tour listed on this site.",
            "When you book through a FareHarbor link or lightframe, the operator and FareHarbor booking flow provide the checkout terms that control the transaction.",
          ],
        },
        {
          title: "Availability and checkout details",
          body: [
            "Prices, availability, schedules, inclusions, exclusions, age rules, accessibility details, pickup details, and restrictions may change. No tour is guaranteed available until the booking is confirmed through the checkout process.",
            "Site content may contain errors or become out of date. Review the specific tour page, FareHarbor checkout, and operator confirmation before relying on any booking detail.",
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
            "We provide recommendation and booking-assistance content as-is and cannot guarantee that all information will be complete, current, or error-free at every moment.",
            "To the extent allowed by applicable law, Welcome to New Orleans Tours is not responsible for operator service failures, schedule changes, denied participation, weather interruptions, or policies controlled by an independent operator.",
          ],
        },
      ]}
    />
  );
}
