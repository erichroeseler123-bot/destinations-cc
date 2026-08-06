import { SupportPageShell, buildSupportMetadata } from "../supportPages";

export const metadata = buildSupportMetadata(
  "/faq",
  "FAQ | Welcome to New Orleans Tours",
  "General booking, operator, cancellation, accessibility, and affiliate questions for Welcome to New Orleans Tours.",
);

export default function FaqPage() {
  return (
    <SupportPageShell
      eyebrow="FAQ"
      title="Frequently Asked Questions"
      intro="General answers for travelers using Welcome to New Orleans Tours. Specific tour terms may differ, so always check the tour page and checkout terms before booking."
      sections={[
        {
          title: "Does Welcome to New Orleans Tours operate the tours?",
          body: [
            "No. Welcome to New Orleans Tours is an affiliate and recommendation storefront. Independent operators provide the tours and generally manage the customer experience after purchase.",
          ],
        },
        {
          title: "Where do I book?",
          body: [
            "Tour pages link to FareHarbor booking paths or lightframes. Review the live checkout details before completing a purchase.",
          ],
        },
        {
          title: "Can I change or cancel a booking?",
          body: [
            "Policies vary by tour and operator. The policy shown in checkout and your confirmation controls. After booking, use the operator details in your confirmation email.",
          ],
        },
        {
          title: "Are prices, times, and durations guaranteed on this site?",
          body: [
            "No. Prices, availability, schedules, durations, inclusions, and restrictions may change. Treat the operator checkout and confirmation as the final source.",
          ],
        },
        {
          title: "Do you receive a commission?",
          body: [
            "This site may receive compensation or commission from bookings made through links or booking tools on the site.",
          ],
        },
        {
          title: "How do I ask about accessibility or group needs?",
          body: [
            "Before booking, contact us for planning help or review the operator checkout. For specific accommodation commitments, confirm directly with the operator.",
          ],
        },
      ]}
    />
  );
}
