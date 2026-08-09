import type { Metadata } from "next";
import LiveNightGuide from "../../components/LiveNightGuide";

export const metadata: Metadata = {
  title: "What’s Happening in New Orleans This Weekend | Live Events & Dinner",
  description: "See concerts, games, shows, and other live events in New Orleans this weekend, with dinner and visitor-planning ideas.",
  alternates: { canonical: "/guides/this-weekend" },
};

export default function ThisWeekendGuidePage() {
  return (
    <LiveNightGuide
      window="weekend"
      title="What’s happening this weekend?"
      eyebrow="This weekend in New Orleans"
      intro="See what is actually happening around town during your visit and build dinner, the event, and the rest of the night around it."
    />
  );
}
