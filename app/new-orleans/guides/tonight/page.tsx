import type { Metadata } from "next";
import LiveNightGuide from "../../components/LiveNightGuide";

export const metadata: Metadata = {
  title: "What to Do in New Orleans Tonight | Live Events & Dinner",
  description: "See live events happening in New Orleans tonight and pair them with dinner, evening tours, and next-morning plans.",
  alternates: { canonical: "/guides/tonight" },
};

export default function TonightGuidePage() {
  return (
    <LiveNightGuide
      window="tonight"
      title="What can we do tonight?"
      eyebrow="Tonight in New Orleans"
      intro="Start with what is actually happening around town tonight, then build dinner and the rest of the evening around it."
    />
  );
}
