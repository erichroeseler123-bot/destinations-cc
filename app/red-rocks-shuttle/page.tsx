import type { Metadata } from "next";
import RedRocksAuthorityPage from "@/app/components/dcc/RedRocksAuthorityPage";
import { PARR_OPERATOR } from "@/lib/parrOperator";
import SatelliteHandoffStatusCard from "@/app/components/dcc/SatelliteHandoffStatusCard";
import { getLocalFallbackImageSetForEntity } from "@/src/lib/media/source-local";

export const metadata: Metadata = {
  title: "Red Rocks Shuttle From Denver | Private Transportation Alternative",
  description: "Looking for a Red Rocks shuttle from Denver? Party at Red Rocks now offers private transportation only: reserve a private Suburban or van for your concert night.",
  alternates: { canonical: "/red-rocks-shuttle" },
  keywords: [
    "red rocks shuttle",
    "red rocks shuttle from denver",
    "denver to red rocks shuttle",
    "private red rocks transportation",
    "transportation to red rocks amphitheatre",
  ],
  openGraph: {
    title: "Red Rocks Shuttle From Denver | Private Transportation Alternative",
    description: "Searching for a Red Rocks shuttle? Compare the current private Party at Red Rocks option with driving and rideshare.",
    url: "/red-rocks-shuttle",
    type: "article",
  },
};

export default async function RedRocksShuttlePage({
  searchParams,
}: {
  searchParams?: Promise<{ dcc_handoff_id?: string }>;
}) {
  const sp = await searchParams;
  const handoffId = sp?.dcc_handoff_id || null;
  const imageSet = getLocalFallbackImageSetForEntity("venue", "red-rocks-amphitheatre");

  return (
    <RedRocksAuthorityPage
      eyebrow="DCC Transportation Guide"
      title="Looking for a Red Rocks shuttle? The current Party at Red Rocks service is private transportation for your group."
      intro="A lot of visitors still search for a Red Rocks shuttle because the real problem is the same: getting from Denver to the amphitheatre and back without dealing with parking or a chaotic post-show Uber pickup. Party at Red Rocks now offers private service only, with a $399 Private Suburban and a $599 private van option."
      sourcePath="/red-rocks-shuttle"
      primaryCtaHref="/red-rocks-transportation"
      primaryCtaLabel="See Private Transport Options"
      buyerIntentLabel="Red Rocks transportation from Denver"
      heroImageSrc={imageSet?.hero?.src || "https://www.partyatredrocks.com/hero/hero-home.jpg"}
      heroImageAlt={imageSet?.hero?.alt || "Red Rocks transportation proof image tied to Party at Red Rocks"}
      notice={
        <>
          <SatelliteHandoffStatusCard handoffId={handoffId} />
          <section className="rounded-[1.9rem] border border-white/10 bg-white/[0.06] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.26)]">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Current service</p>
            <p className="mt-3 text-sm leading-7 text-zinc-300">
              Party at Red Rocks no longer sells shared shuttle seats. This page keeps answering the high-intent “Red Rocks shuttle” search, then hands the visitor into the current private transportation corridor.
            </p>
          </section>
        </>
      }
      operatorAttribution={PARR_OPERATOR}
      sections={[
        {
          title: "Why people still search for a Red Rocks shuttle",
          body: "The search phrase is really shorthand for a transportation problem: visitors want a reliable ride to the venue and a clear way home after the show without parking stress.",
          bullets: [
            "They already know the venue.",
            "They already know transportation is the friction point.",
            "They want an alternative to driving and post-show rideshare uncertainty.",
          ],
        },
        {
          title: "What Party at Red Rocks offers now",
          body: "The current service is private transportation only. Smaller groups can reserve the $399 Private Suburban, while larger groups can choose the $599 private van.",
          bullets: [
            "One private vehicle for your group.",
            "The ride home is part of the plan before the show starts.",
            "No shared seats or per-person shuttle fare.",
          ],
        },
        {
          title: "When private transportation beats driving",
          body: "Driving can work if you want full control and are comfortable with parking, walking, and the exit. Private transportation is stronger when the group wants to offload those decisions and keep the night together.",
        },
        {
          title: "When private transportation beats rideshare",
          body: "Uber and Lyft can be easy on the way in, but the return trip is where uncertainty rises. A pre-booked private ride is designed for groups who would rather have the ride home decided before the crowd leaves.",
          bullets: [
            "One group, one vehicle, one plan.",
            "No waiting for a new rideshare match after the show.",
            "No need to decide transportation again at the end of the night.",
          ],
        },
        {
          title: "Plan the night in this order",
          body: "A clean Red Rocks transportation plan gets easier when you solve the end of the night first.",
          bullets: [
            "1. Decide how your group is getting home.",
            "2. Reserve the vehicle for the concert date.",
            "3. Then lock in pickup details for the ride to Red Rocks.",
          ],
        },
      ]}
    />
  );
}
