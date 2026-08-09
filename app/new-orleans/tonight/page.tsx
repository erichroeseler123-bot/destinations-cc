import type { Metadata } from "next";
import LiveNightGuide from "../components/LiveNightGuide";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "What to Do in New Orleans Tonight | Live Events + Dinner",
  description:
    "See live events happening in New Orleans tonight and pair them with dinner, evening tours and tomorrow morning’s $5 French Quarter Orientation.",
  alternates: { canonical: "/new-orleans/tonight" },
};

export default function TonightPage() {
  return (
    <LiveNightGuide
      window="tonight"
      eyebrow="Tonight in New Orleans"
      title="You’re here tonight. What’s actually going on?"
      intro="Concerts, games, comedy, theater and other live events can be easy for visitors to miss because they are not always marketed as tourist attractions. Start with what is actually happening tonight, then build dinner around it."
    />
  );
}
