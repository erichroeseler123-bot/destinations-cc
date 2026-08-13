import type { ReactNode } from "react";
import CanonicalGuidePage, { generateMetadata } from "@/app/new-orleans/guides/[slug]/page";
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

export { generateMetadata };

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
} as const;

export default async function GuideBridgePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const Page = pages[slug as keyof typeof pages] as unknown as (() => ReactNode) | undefined;
  if (Page) return <>{Page()}</>;
  return <CanonicalGuidePage params={Promise.resolve({ slug })} />;
}
