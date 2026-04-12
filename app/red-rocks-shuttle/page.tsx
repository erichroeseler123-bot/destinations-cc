import type { Metadata } from "next";
import RedRocksAuthorityPage from "@/app/components/dcc/RedRocksAuthorityPage";
import { PARR_OPERATOR } from "@/lib/parrOperator";
import SatelliteHandoffStatusCard from "@/app/components/dcc/SatelliteHandoffStatusCard";
import { getLocalFallbackImageSetForEntity } from "@/src/lib/media/source-local";

export const metadata: Metadata = {
  title: "Red Rocks Shuttle From Denver | Cleanest Ride Plan",
  description: "Use the cleanest Red Rocks ride plan from Denver when you want parking and the ride home solved before the show starts.",
  alternates: { canonical: "/red-rocks-shuttle" },
  keywords: [
    "red rocks shuttle",
    "red rocks shuttle from denver",
    "denver to red rocks shuttle",
    "transportation to red rocks amphitheatre",
    "how to get to red rocks",
  ],
  openGraph: {
    title: "Red Rocks Shuttle From Denver | Shuttle vs Driving vs Uber",
    description: "Decision-first Red Rocks shuttle guide for visitors comparing parking, rideshare, and shuttle service from Denver.",
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
      eyebrow="DCC Shuttle Guide"
      title="Red Rocks shuttle from Denver is usually the cleanest move when you do not want to fight parking or post-show Uber."
      intro="Visitors searching for a Red Rocks shuttle are usually past the inspiration phase. They want the simplest way to get from Denver to Red Rocks and back without parking stress, uphill lot walks, or a surge-priced pickup mess after the show."
      sourcePath="/red-rocks-shuttle"
      primaryCtaHref="/red-rocks-transportation"
      primaryCtaLabel="Use The Transport Decision"
      buyerIntentLabel="Red Rocks shuttle from Denver"
      heroImageSrc={imageSet?.hero?.src || "https://www.partyatredrocks.com/hero/hero-home.jpg"}
      heroImageAlt={imageSet?.hero?.alt || "Red Rocks shuttle proof image tied to the live Party at Red Rocks service"}
      notice={
        <>
          <SatelliteHandoffStatusCard handoffId={handoffId} />
          <section className="rounded-[1.9rem] border border-white/10 bg-white/[0.06] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.26)]">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Feeder rule</p>
            <p className="mt-3 text-sm leading-7 text-zinc-300">
              This feeder exists for one reason only: to answer whether shuttle is the correct default. Once that answer is yes, the next move is the main transport corridor rather than another comparison stack.
            </p>
          </section>
        </>
      }
      operatorAttribution={PARR_OPERATOR}
      sections={[
        {
          title: "Why visitors search for a Red Rocks shuttle",
          body: "This is a problem-solving query, not a browsing query. Most searchers are trying to avoid parking stress, long uphill walks from late lots, and the uncertainty of getting back to Denver after the show.",
          bullets: [
            "They already know the venue.",
            "They already know transportation is the main friction point.",
            "They are narrowing the cleanest move between shuttle, driving, Uber, or private ride.",
          ],
        },
        {
          title: "When shuttle beats driving",
          body: "Driving works for visitors who want full control and can arrive early. Shuttle service is stronger when the group wants to offload the parking decision and reduce end-of-night route friction.",
        },
        {
          title: "When shuttle beats rideshare",
          body: "Uber and Lyft can work on the way in, but the return trip is where the plan gets brittle. Shuttle service is stronger for visitors who care more about a clean ride home than gambling on surge pricing and pickup congestion.",
          bullets: [
            "Ingress is usually easier than egress.",
            "Dedicated ride-home certainty matters more after sold-out shows.",
            "The real question is whether the exit plan is already solved before the show starts.",
          ],
        },
        {
          title: "The ride home is the real planning problem",
          body: "Most Red Rocks transport decisions feel easy on the way in. The hard part is ending the night cleanly when pickup zones compress, the crowd moves at once, and nobody wants to improvise after the encore. That is why the strongest plans solve the return before the show starts, not after.",
          bullets: [
            "If the group wants certainty, plan the ride home in advance.",
            "If the group is fine with waiting, surge pricing, or pickup friction, rideshare can still be acceptable.",
            "This is why shared shuttle and private ride both outperform casual Uber plans on sold-out nights.",
          ],
        },
        {
          title: "Plan the night in this order",
          body: "A clean Red Rocks transportation plan usually gets easier once the group stops thinking about arrival first.",
          bullets: [
            "1. When the show ends",
            "2. How you are getting back",
            "3. Then how you are getting there",
          ],
        },
        {
          title: "What makes this a valid feeder",
          body: "A feeder only stays visible when it removes one specific mistake and then hands the visitor into the dominant node. This page exists to rule shuttle in or out cleanly, then move the visitor into the main transportation decision.",
        },
      ]}
    />
  );
}
