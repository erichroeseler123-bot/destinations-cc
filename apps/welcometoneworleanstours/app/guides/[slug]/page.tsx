import type { Metadata } from "next";
import type { ReactNode } from "react";
import { permanentRedirect } from "next/navigation";
import CanonicalGuidePage, { generateMetadata as generateCanonicalMetadata } from "@/app/new-orleans/guides/[slug]/page";
import FourHours from "@/app/new-orleans/guides/4-hours-in-new-orleans/page";
import BestSwamp from "@/app/new-orleans/guides/best-new-orleans-swamp-tour/page";
import RainyDay from "@/app/new-orleans/guides/best-new-orleans-tours-for-a-rainy-day/page";
import FirstTime from "@/app/new-orleans/guides/first-time-new-orleans-tours/page";
import SwampTransport from "@/app/new-orleans/guides/best-swamp-tour-with-transportation/page";
import NearQuarter from "@/app/new-orleans/guides/new-orleans-tours-near-french-quarter/page";
import UnderFifty from "@/app/new-orleans/guides/new-orleans-tours-under-50-dollars/page";
import NoCar from "@/app/new-orleans/guides/new-orleans-swamp-tour-without-a-car/page";
import KidsAirboats from "@/app/new-orleans/guides/can-kids-ride-airboats-new-orleans/page";
import Orientation from "@/app/new-orleans/guides/french-quarter-orientation/page";
import VisitorRewards from "@/app/new-orleans/guides/visitor-rewards/page";
import WhitneyVsOakAlley from "@/app/new-orleans/guides/whitney-plantation-vs-oak-alley-history-focus/page";
import ThisWeekend from "@/app/new-orleans/guides/this-weekend/page";
import Tonight from "@/app/new-orleans/guides/tonight/page";
import KidsUnderSix from "@/app/new-orleans/guides/best-new-orleans-tours-with-kids-under-6/page";
import ArriveAtNoon from "@/app/new-orleans/guides/best-new-orleans-tours-if-you-arrive-at-noon/page";

const guideAliases = {
  "french-quarter-tour-timing": "french-quarter-orientation",
  "pre-cruise-new-orleans-tours": "new-orleans-tours-with-transportation",
  "post-cruise-new-orleans-tours": "new-orleans-tours-with-transportation",
} as const;

const directAliases = {
  "tour-planning": "/help-me-choose",
} as const;

export async function generateMetadata({ params }: { params: Promise<{ slug?: string }> }): Promise<Metadata> {
  const resolved = await params;
  const slug = resolved.slug;

  if (slug && directAliases[slug as keyof typeof directAliases]) {
    return {
      title: "Help Me Choose a New Orleans Tour",
      description: "Use the New Orleans tour chooser to narrow the best options for your group, schedule, pace, and interests.",
      alternates: { canonical: directAliases[slug as keyof typeof directAliases] },
      robots: { index: false, follow: true },
    };
  }

  const canonicalSlug = slug && guideAliases[slug as keyof typeof guideAliases]
    ? guideAliases[slug as keyof typeof guideAliases]
    : slug;

  return generateCanonicalMetadata({ params: Promise.resolve({ slug: canonicalSlug }) });
}

const pages = {
  "4-hours-in-new-orleans": FourHours,
  "best-new-orleans-swamp-tour": BestSwamp,
  "best-new-orleans-tours-for-a-rainy-day": RainyDay,
  "first-time-new-orleans-tours": FirstTime,
  "best-swamp-tour-with-transportation": SwampTransport,
  "new-orleans-tours-near-french-quarter": NearQuarter,
  "new-orleans-tours-under-50-dollars": UnderFifty,
  "new-orleans-swamp-tour-without-a-car": NoCar,
  "can-kids-ride-airboats-new-orleans": KidsAirboats,
  "french-quarter-orientation": Orientation,
  "visitor-rewards": VisitorRewards,
  "whitney-plantation-vs-oak-alley-history-focus": WhitneyVsOakAlley,
  "this-weekend": ThisWeekend,
  "tonight": Tonight,
  "best-new-orleans-tours-with-kids-under-6": KidsUnderSix,
  "best-new-orleans-tours-if-you-arrive-at-noon": ArriveAtNoon,
} as const;

export default async function GuideBridgePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const directTarget = directAliases[slug as keyof typeof directAliases];
  if (directTarget) permanentRedirect(directTarget);

  const guideTarget = guideAliases[slug as keyof typeof guideAliases];
  if (guideTarget) permanentRedirect(`/guides/${guideTarget}`);

  const Page = pages[slug as keyof typeof pages] as unknown as (() => ReactNode) | undefined;
  if (Page) return <>{Page()}</>;
  return <CanonicalGuidePage params={Promise.resolve({ slug })} />;
}
