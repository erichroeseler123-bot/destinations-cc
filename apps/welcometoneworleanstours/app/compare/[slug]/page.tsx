import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ThreeHours, { metadata as threeHoursMetadata } from "@/app/new-orleans/compare/best-new-orleans-tour-if-you-only-have-3-hours/page";
import CoveredVsAirboat, { metadata as coveredVsAirboatMetadata } from "@/app/new-orleans/compare/covered-swamp-boat-vs-airboat/page";
import Riverboats, { metadata as riverboatsMetadata } from "@/app/new-orleans/compare/natchez-vs-city-of-new-orleans-riverboat/page";
import SmallVsLarge, { metadata as smallVsLargeMetadata } from "@/app/new-orleans/compare/small-vs-large-airboat/page";
import Transport, { metadata as transportMetadata } from "@/app/new-orleans/compare/swamp-tour-with-vs-without-transportation/page";
import Plantations, { metadata as plantationsMetadata } from "@/app/new-orleans/compare/whitney-vs-oak-alley/page";

const pages = {
  "best-new-orleans-tour-if-you-only-have-3-hours": ThreeHours,
  "covered-swamp-boat-vs-airboat": CoveredVsAirboat,
  "natchez-vs-city-of-new-orleans-riverboat": Riverboats,
  "small-vs-large-airboat": SmallVsLarge,
  "swamp-tour-with-vs-without-transportation": Transport,
  "whitney-vs-oak-alley": Plantations,
} as const;

const metadataBySlug: Record<string, Metadata> = {
  "best-new-orleans-tour-if-you-only-have-3-hours": threeHoursMetadata,
  "covered-swamp-boat-vs-airboat": coveredVsAirboatMetadata,
  "natchez-vs-city-of-new-orleans-riverboat": riverboatsMetadata,
  "small-vs-large-airboat": smallVsLargeMetadata,
  "swamp-tour-with-vs-without-transportation": transportMetadata,
  "whitney-vs-oak-alley": plantationsMetadata,
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return metadataBySlug[slug] || {};
}

export default async function ComparisonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const Page = pages[slug as keyof typeof pages];
  if (!Page) notFound();
  return <Page />;
}
