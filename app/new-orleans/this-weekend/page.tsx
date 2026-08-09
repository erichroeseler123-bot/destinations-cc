import type { Metadata } from "next";
import LiveNightGuide from "../components/LiveNightGuide";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "New Orleans This Weekend | Live Events + Dinner Ideas",
  description:
    "See live concerts, games, shows and other events happening in New Orleans this weekend and pair them with dinner and visitor-friendly plans.",
  alternates: { canonical: "/new-orleans/this-weekend" },
};

export default function ThisWeekendPage() {
  return (
    <LiveNightGuide
      window="weekend"
      eyebrow="This Weekend in New Orleans"
      title="What’s happening around town this weekend?"
      intro="If your trip overlaps a concert, game, comedy night, theater performance or other local event, this is where to catch it. Build the evening around the event instead of discovering it after you leave town."
    />
  );
}
