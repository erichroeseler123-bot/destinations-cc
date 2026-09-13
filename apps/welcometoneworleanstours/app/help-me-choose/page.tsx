import type { Metadata } from "next";
import HelpMeChoosePage, { metadata as baseMetadata } from "@/app/new-orleans/help-me-choose/page";

export const metadata: Metadata = {
  ...baseMetadata,
  alternates: {
    canonical: "https://www.welcometoneworleanstours.com/help-me-choose",
  },
};

export default function WnoHelpMeChoosePage() {
  return (
    <div data-wno-surface="chooser" data-wno-version="chooser-bookable-routing-2026-09-08">
      <HelpMeChoosePage />
    </div>
  );
}
