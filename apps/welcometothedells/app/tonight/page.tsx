import type { Metadata } from "next";
import DellsDecisionPage from "../components/DellsDecisionPage";

export const metadata: Metadata = {
  title: "What to Do Tonight in Wisconsin Dells",
  description:
    "A fast Wisconsin Dells evening plan for dinner, downtown, river experiences, shows, and after-dark options.",
};

export default function Page() {
  return (
    <DellsDecisionPage
      eyebrow="Tonight"
      title="Pick one strong Dells night."
      intro="Choose the kind of evening first, then use the linked planning path to compare the current operator options. Confirm tonight’s hours, tickets, age rules, and weather changes on the operator’s site before you go."
      sections={[
        {
          title: "Want atmosphere?",
          body: "Use downtown, the Riverwalk, dinner, and an after-dark river or canyon experience.",
          href: "/boat-tours",
          cta: "Compare river experiences",
        },
        {
          title: "Want entertainment?",
          body: "Choose one show or major evening attraction and make dinner work around it.",
          href: "/things-to-do",
          cta: "Compare activity types",
        },
        {
          title: "Want easy?",
          body: "Stay near the resort, use one nearby meal, and save the big attraction for tomorrow.",
          href: "/downtown",
          cta: "Plan a simple downtown night",
        },
      ]}
      ctaHref="/adults"
      ctaLabel="See adults-only ideas"
    />
  );
}
