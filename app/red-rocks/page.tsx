import type { Metadata } from "next";
import RedRocksAuthorityPage from "@/app/components/dcc/RedRocksAuthorityPage";
import { PARR_OPERATOR } from "@/lib/parrOperator";
import { getLocalFallbackImageSetForEntity } from "@/src/lib/media/source-local";

export const metadata: Metadata = {
  title: "Red Rocks Guide | Destination Command Center",
  description: "Red Rocks venue, transportation, parking, and exit-planning guide for people who want the night to go smoothly.",
  alternates: { canonical: "/red-rocks" },
  keywords: [
    "red rocks guide",
    "red rocks concerts",
    "red rocks transportation",
    "red rocks parking",
    "how to plan a red rocks concert night",
  ],
  openGraph: {
    title: "Red Rocks Guide | Destination Command Center",
    description: "The best part of Red Rocks is the venue. The hardest part is getting in and out cleanly.",
    url: "/red-rocks",
    type: "article",
  },
};

export default function RedRocksPage() {
  const imageSet = getLocalFallbackImageSetForEntity("venue", "red-rocks-amphitheatre");

  return (
    <RedRocksAuthorityPage
      eyebrow="DCC Red Rocks Hub"
      title="Red Rocks is one of the best venues in the world. Getting home is usually the part people underestimate."
      intro="Most people plan the tickets, the show, and maybe dinner. Then they discover the hardest part of the night is parking, pickup, uphill walking, and leaving with thousands of other people at once. DCC exists to solve that part before it ruins the night."
      sourcePath="/red-rocks"
      heroImageSrc={imageSet?.hero?.src || "https://www.partyatredrocks.com/hero/hero-home.jpg"}
      heroImageAlt={imageSet?.hero?.alt || "Red Rocks Amphitheatre at sunset with the venue bowl visible"}
      operatorAttribution={PARR_OPERATOR}
      sections={[
        {
          title: "The hidden Red Rocks problem",
          body: "Red Rocks does not usually fail on the concert. It fails on the last mile. Parking gets crowded, arrival timing matters more than people expect, and the ride home becomes chaotic if it was never actually planned. That is why transportation is not a side detail here. It is the part that determines whether the night feels clean or stressful.",
        },
        {
          title: "What a good Red Rocks plan actually solves",
          body: "A strong Red Rocks plan solves ingress and egress before anything else. Once the route in and the ride home are handled, dinner, tailgating, and after-show plans get much easier. The mistake is treating transport like a detail you can improvise later.",
          bullets: [
            "Parking only works cleanly if you accept the walk and the exit delay.",
            "Rideshare is easier on the way in than the way out.",
            "Shared shuttle is the best default for most Denver visitors.",
            "Private ride is stronger when the group wants one pickup and one exact plan.",
          ],
        },
        {
          title: "Where the plan goes next",
          body: "Use DCC to understand the tradeoffs, then move into Party at Red Rocks when the answer is obvious. That keeps the system clean: DCC explains the problem, and PARR executes the ride.",
        },
      ]}
    />
  );
}
