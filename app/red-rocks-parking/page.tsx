import type { Metadata } from "next";
import RedRocksAuthorityPage from "@/app/components/dcc/RedRocksAuthorityPage";

export const metadata: Metadata = {
  title: "Red Rocks Parking Guide | Destination Command Center",
  description: "Parking reality for Red Rocks concerts including arrival windows, uphill walking, and why some visitors choose shuttle service instead.",
  alternates: { canonical: "/red-rocks-parking" },
  keywords: [
    "red rocks parking",
    "red rocks parking tips",
    "red rocks parking lots",
    "can you park at red rocks",
    "red rocks shuttle vs parking",
  ],
  openGraph: {
    title: "Red Rocks Parking Guide | Destination Command Center",
    description: "Red Rocks parking guide covering arrival windows, walking load, exit friction, and when shuttle service is the cleaner play.",
    url: "/red-rocks-parking",
    type: "article",
  },
};

export default function RedRocksParkingPage() {
  return (
    <RedRocksAuthorityPage
      eyebrow="DCC Parking Guide"
      title="Do not make Red Rocks parking the plan unless you want the burden."
      intro="For most concert nights, take the shared shuttle instead. Parking means lot strategy, uphill walking, and a slower exit after the show."
      sourcePath="/red-rocks-parking"
      primaryCtaHref="/red-rocks-transportation"
      primaryCtaLabel="Check Shared Shuttle Availability"
      buyerIntentLabel="Red Rocks parking decision"
      heroTrustBadges={[
        "Parking is the friction",
        "Shared shuttle removes the lot decision",
        "Party at Red Rocks executes booking",
      ]}
      heroSummaryCards={[
        {
          label: "Verdict",
          body: "If you are trying to avoid parking stress, stop here and choose shuttle.",
        },
        {
          label: "What driving costs",
          body: "Time, walking, exit traffic, and the need for a sober driver.",
        },
        {
          label: "Next step",
          body: "Confirm shared vs private, then book with Party at Red Rocks.",
        },
      ]}
      sections={[
        {
          title: "Parking reality on busy nights",
          body: "The stress is not just finding a space. The shared shuttle is the better default for most Denver visitors because it removes arrival timing, lot selection, walking grade, weather exposure, and exit drag after the encore.",
          bullets: [
            "Parking chaos avoided.",
            "No post-show waiting around the lots.",
            "Predictable timing before and after the show.",
          ],
        },
        {
          title: "Why parking pages naturally recommend shuttles",
          body: "A useful parking guide should say when driving is still fine and when avoiding the car is smarter. For many visitors staying in Denver, a dedicated shuttle removes the need to optimize lot strategy and reduces the chance of a slow, messy end-of-night exit.",
        },
      ]}
    />
  );
}
