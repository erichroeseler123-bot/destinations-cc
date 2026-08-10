import JsonLd from "@/app/components/dcc/JsonLd";
import WnoBreadcrumbs from "../components/WnoBreadcrumbs";
import { buildWnoFaqJsonLd } from "../lib/structuredData";
import { SupportPageShell, buildSupportMetadata } from "../supportPages";

export const metadata = buildSupportMetadata(
  "/faq",
  "FAQ | Welcome to New Orleans Tours",
  "General booking, operator, cancellation, accessibility, orientation, and affiliate questions for Welcome to New Orleans Tours and the New Orleans Concierge Desk.",
);

const FAQS = [
  {
    question: "Does New Orleans Concierge Desk operate the tours?",
    answer:
      "We offer our own $5 French Quarter Morning Orientation. The other tours displayed on the site are provided by independent participating operators, which generally manage the customer experience after purchase.",
  },
  {
    question: "Where do I book tours?",
    answer:
      "Third-party tour pages link to FareHarbor booking paths or lightframes. Review the live checkout details before completing a purchase.",
  },
  {
    question: "How do I reserve the $5 French Quarter Orientation?",
    answer:
      "The orientation runs daily at 8:00 AM and 9:30 AM. Until online checkout is connected, call or text the Concierge Desk to reserve and pay $5 per person at check-in.",
  },
  {
    question: "Can I change or cancel a third-party tour booking?",
    answer:
      "Policies vary by tour and operator. The policy shown in checkout and your confirmation controls. After booking, use the operator details in your confirmation email.",
  },
  {
    question: "Are prices, times, and durations guaranteed on this site?",
    answer:
      "No. Third-party prices, availability, schedules, durations, inclusions, and restrictions may change. Treat the operator checkout and confirmation as the final source.",
  },
  {
    question: "Do you receive a commission?",
    answer:
      "This site may receive compensation or commission from third-party bookings made through links or booking tools on the site.",
  },
  {
    question: "How do I ask about accessibility or group needs?",
    answer:
      "Before booking, contact the Concierge Desk for planning help or review the operator checkout. For specific accommodation commitments on partner tours, confirm directly with the operator.",
  },
] as const;

export default function FaqPage() {
  return (
    <>
      <JsonLd data={buildWnoFaqJsonLd(FAQS.map((item) => ({ question: item.question, answer: item.answer })))} />
      <WnoBreadcrumbs
        items={[
          { name: "Home", path: "/" },
          { name: "FAQ", path: "/faq" },
        ]}
      />
      <SupportPageShell
        eyebrow="FAQ"
        title="Frequently Asked Questions"
        intro="General answers for visitors using Welcome to New Orleans Tours and the New Orleans Concierge Desk. Specific third-party tour terms may differ, so always check the tour page and checkout terms before booking."
        sections={FAQS.map((item) => ({ title: item.question, body: [item.answer] }))}
      />
    </>
  );
}
