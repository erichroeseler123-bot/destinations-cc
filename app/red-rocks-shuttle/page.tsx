import type { Metadata } from "next";
import RedRocksAuthorityPage from "@/app/components/dcc/RedRocksAuthorityPage";

export const metadata: Metadata = {
  title: "Red Rocks Shuttle From Denver | Shuttle vs Driving vs Uber",
  description: "Compare Red Rocks shuttle service, driving, parking, and Uber after the show. Built for visitors deciding how to get to Red Rocks from Denver.",
  alternates: { canonical: "/red-rocks-shuttle" },
};

export default function RedRocksShuttlePage() {
  return (
    <RedRocksAuthorityPage
      eyebrow="DCC Shuttle Guide"
      title="Red Rocks shuttle from Denver is usually the cleanest answer when you do not want to fight parking or post-show Uber."
      intro="Visitors searching for a Red Rocks shuttle are usually past the inspiration phase. They want the simplest way to get from Denver to Red Rocks and back without parking stress, uphill lot walks, or a surge-priced pickup mess after the encore."
      sourcePath="/red-rocks-shuttle"
      primaryCtaHref="/book"
      primaryCtaLabel="Book Red Rocks Shuttle"
      secondaryCtaHref="/red-rocks-transportation"
      secondaryCtaLabel="Compare All Ride Options"
      buyerIntentLabel="Red Rocks shuttle from Denver"
      sections={[
        {
          title: "Why visitors search for a Red Rocks shuttle",
          body: "This is a problem-solving query, not a browsing query. Most searchers are trying to avoid parking stress, long uphill walks from late lots, and the uncertainty of getting back to Denver after the show.",
          bullets: [
            "They already know the venue.",
            "They already know transportation is the main friction point.",
            "They are deciding between shuttle, driving, Uber, or private ride.",
          ],
        },
        {
          title: "Shuttle vs. driving",
          body: "Driving works for visitors who want full control and can arrive early. Shuttle service is stronger when the group wants to offload the parking decision and reduce end-of-night route friction.",
        },
        {
          title: "Shuttle vs. rideshare",
          body: "Uber and Lyft can work on the way in, but the return trip is where the plan gets brittle. Shuttle service is stronger for visitors who care more about a clean ride home than gambling on surge pricing and pickup congestion.",
          bullets: [
            "Ingress is usually easier than egress.",
            "Dedicated ride-home certainty matters more after sold-out shows.",
            "This is the main reason shuttle pages convert.",
          ],
        },
      ]}
    />
  );
}
