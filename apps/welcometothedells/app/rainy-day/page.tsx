import type { Metadata } from "next";
import DellsDecisionPage from "../components/DellsDecisionPage";

export const metadata: Metadata = {
  title: "Rainy Day in Wisconsin Dells | What to Do",
  description:
    "A simple Wisconsin Dells rainy-day plan with indoor waterparks, shows, arcades, and low-weather-risk backups.",
  alternates: { canonical: "/rainy-day" },
};

export default function Page() {
  return (
    <DellsDecisionPage
      currentPath="/rainy-day"
      eyebrow="Rainy day"
      title="Rain does not have to wreck the Dells."
      intro="Build the day around one indoor anchor, then add short low-risk stops instead of driving around looking for a miracle."
      sections={[
        {
          title: "Indoor waterpark first",
          body: "If your resort includes a strong indoor waterpark, use it as the anchor instead of abandoning a benefit you already paid for.",
          href: "/waterparks",
          cta: "Compare waterpark plans",
        },
        {
          title: "Pick one indoor attraction",
          body: "Arcades, indoor amusement, museums, shows, and other weather-proof options work best when you commit to one instead of venue hopping.",
          href: "/things-to-do",
          cta: "Compare activity types",
        },
        {
          title: "Keep dinner close",
          body: "Bad weather makes traffic and parking more annoying. Finish near the resort or area where you already are.",
          href: "/tonight",
          cta: "Plan tonight's stops",
        },
      ]}
      ctaHref="/families"
      ctaLabel="See the family plan"
    />
  );
}
