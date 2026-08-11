import type { Metadata } from "next";
import StaticPage from "../components/StaticPage";

export const metadata: Metadata = {
  title: "About",
  description: "About Juneau Flight Deck, a focused cruise-day planning guide for Juneau glacier flights, whale watching, weather pivots, and return-to-ship timing.",
  alternates: { canonical: "https://juneauflightdeck.com/about" },
};

export default function AboutPage() {
  return (
    <StaticPage
      eyebrow="About Juneau Flight Deck"
      title="A focused decision guide for one of Alaska's biggest shore days."
      intro="Juneau Flight Deck helps cruise travelers narrow the choices that matter most before they open a provider booking page."
      bullets={[
        "Compare helicopter and glacier-flight formats before chasing live inventory.",
        "Keep port time, transfer time, weather risk, and return-to-ship margin in the decision.",
        "Use whale watching and other Juneau options as practical weather pivots when flying is not the right move.",
        "Final pricing, availability, pickup details, cancellation terms, and booking stay with the provider.",
      ]}
    />
  );
}
