import type { Metadata } from "next";
import RedRocksAuthorityPage from "@/app/components/dcc/RedRocksAuthorityPage";
import { PARR_OPERATOR } from "@/lib/parrOperator";
import SatelliteHandoffStatusCard from "@/app/components/dcc/SatelliteHandoffStatusCard";
import { getLocalFallbackImageSetForEntity } from "@/src/lib/media/source-local";
import { buildParrPrivateRedRocksUrl, buildParrSharedRedRocksUrl } from "@/lib/dcc/contracts/dccParrBridge";

export const metadata: Metadata = {
  title: "Red Rocks Shuttle From Denver | Shuttle vs Driving vs Uber",
  description: "Compare Red Rocks shuttle service, driving, parking, and Uber after the show. Built for visitors deciding how to get to Red Rocks from Denver.",
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
      title="Red Rocks shuttle from Denver is usually the cleanest answer when you do not want to fight parking or post-show Uber."
      intro="Visitors searching for a Red Rocks shuttle are usually past the inspiration phase. They want the simplest way to get from Denver to Red Rocks and back without parking stress, uphill lot walks, or a surge-priced pickup mess after the show."
      sourcePath="/red-rocks-shuttle"
      primaryCtaHref="/red-rocks-transportation"
      primaryCtaLabel="See The Transport Decision"
      secondaryCtaHref={buildParrSharedRedRocksUrl()}
      secondaryCtaLabel="Book Shared Shuttle If You Are Sure"
      buyerIntentLabel="Red Rocks shuttle from Denver"
      heroImageSrc={imageSet?.hero?.src || "https://www.partyatredrocks.com/hero/hero-home.jpg"}
      heroImageAlt={imageSet?.hero?.alt || "Red Rocks shuttle proof image tied to the live Party at Red Rocks service"}
      notice={
        <>
          <SatelliteHandoffStatusCard handoffId={handoffId} />
          <section className="rounded-[1.9rem] border border-white/10 bg-white/[0.06] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.26)]">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Private ride shortcut</p>
            <p className="mt-3 text-sm leading-7 text-zinc-300">
              If the group already knows it wants one vehicle for the full night, skip the generic transport loop and go straight to{" "}
              <a
                href={buildParrPrivateRedRocksUrl({ product: "parr-suburban" })}
                className="font-semibold text-cyan-300 underline decoration-cyan-400/40 underline-offset-4"
              >
                private shuttle for Red Rocks concerts
              </a>
              . That page shows current SUV, van, Sprinter, and party-bus pricing with the custom online checkout flow.
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
          title: "What makes this a real product lane",
          body: "This page routes directly into the live Party at Red Rocks booking flow for shared seats and private rides once the visitor decides they want less parking and pickup friction.",
        },
      ]}
    />
  );
}
