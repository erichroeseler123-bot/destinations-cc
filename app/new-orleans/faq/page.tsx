import { SupportPageShell, buildSupportMetadata } from "../supportPages";

export const metadata = buildSupportMetadata(
  "/faq",
  "FAQ | New Orleans Concierge Desk",
  "General booking, operator, cancellation, accessibility, orientation, and affiliate questions for New Orleans Concierge Desk.",
);

export default function FaqPage() {
  return (
    <SupportPageShell
      eyebrow="FAQ"
      title="Frequently Asked Questions"
      intro="General answers for visitors using New Orleans Concierge Desk. Specific third-party tour terms may differ, so always check the tour page and checkout terms before booking."
      sections={[
        {
          title: "Does New Orleans Concierge Desk operate the tours?",
          body: [
            "We offer our own $5 French Quarter Morning Orientation. The other tours displayed on the site are provided by independent participating operators, which generally manage the customer experience after purchase.",
          ],
        },
        {
          title: "Where do I book tours?",
          body: [
            "Third-party tour pages link to FareHarbor booking paths or lightframes. Review the live checkout details before completing a purchase.",
          ],
        },
        {
          title: "How do I reserve the $5 French Quarter Orientation?",
          body: [
            "The orientation runs daily at 8:00 AM and 9:30 AM. Until online checkout is connected, call or text the Concierge Desk to reserve and pay $5 per person at check-in.",
          ],
        },
        {
          title: "Can I change or cancel a third-party tour booking?",
          body: [
            "Policies vary by tour and operator. The policy shown in checkout and your confirmation controls. After booking, use the operator details in your confirmation email.",
          ],
        },
        {
          title: "Are prices, times, and durations guaranteed on this site?",
          body: [
            "No. Third-party prices, availability, schedules, durations, inclusions, and restrictions may change. Treat the operator checkout and confirmation as the final source.",
          ],
        },
        {
          title: "Do you receive a commission?",
          body: [
            "This site may receive compensation or commission from third-party bookings made through links or booking tools on the site.",
          ],
        },
        {
          title: "How do I ask about accessibility or group needs?",
          body: [
            "Before booking, contact the Concierge Desk for planning help or review the operator checkout. For specific accommodation commitments on partner tours, confirm directly with the operator.",
          ],
        },
      ]}
    />
  );
}
