import type { Metadata } from "next";
import LiveNightGuide from "../components/LiveNightGuide";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "What’s Happening in New Orleans? | Live Events for Visitors",
  description:
    "See concerts, games, shows and other live events happening around New Orleans, then pair the night with dinner, tours and the $5 French Quarter Orientation.",
  alternates: { canonical: "/new-orleans/whats-happening" },
};

export default function WhatsHappeningPage() {
  return (
    <LiveNightGuide
      window="all"
      eyebrow="Live New Orleans · Visitor Edition"
      title="What’s happening while you’re here?"
      intro="You may have come to New Orleans for the city, not for a particular game, concert or show. This page surfaces live events happening around town so you can spot something you might never have thought to search for."
    />
  );
}
