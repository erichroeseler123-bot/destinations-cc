import type { Metadata } from "next";
import LiveNightGuide from "../../components/LiveNightGuide";

export const metadata: Metadata = {
  title: "What’s Happening in New Orleans | Tonight, This Weekend & Live Events",
  description: "See concerts, games, shows, comedy, theater, and other live events happening around New Orleans while you’re here, plus dinner and next-morning planning ideas.",
  alternates: { canonical: "/guides/whats-happening" },
};

export default function WhatsHappeningGuidePage() {
  return (
    <LiveNightGuide
      title="What’s happening while you’re here?"
      eyebrow="New Orleans right now"
      intro="You may have come for New Orleans, not for a particular concert, game, or show. Here are live events happening around town that visitors can easily miss."
    />
  );
}
