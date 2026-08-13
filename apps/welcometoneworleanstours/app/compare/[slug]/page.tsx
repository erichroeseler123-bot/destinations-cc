import { notFound } from "next/navigation";
import ThreeHours from "@/app/new-orleans/compare/best-new-orleans-tour-if-you-only-have-3-hours/page";
import CoveredVsAirboat from "@/app/new-orleans/compare/covered-swamp-boat-vs-airboat/page";
import Riverboats from "@/app/new-orleans/compare/natchez-vs-city-of-new-orleans-riverboat/page";
import SmallVsLarge from "@/app/new-orleans/compare/small-vs-large-airboat/page";
import Transport from "@/app/new-orleans/compare/swamp-tour-with-vs-without-transportation/page";
import Plantations from "@/app/new-orleans/compare/whitney-vs-oak-alley/page";

const pages = {
  "best-new-orleans-tour-if-you-only-have-3-hours": ThreeHours,
  "covered-swamp-boat-vs-airboat": CoveredVsAirboat,
  "natchez-vs-city-of-new-orleans-riverboat": Riverboats,
  "small-vs-large-airboat": SmallVsLarge,
  "swamp-tour-with-vs-without-transportation": Transport,
  "whitney-vs-oak-alley": Plantations,
} as const;

export default async function ComparisonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const Page = pages[slug as keyof typeof pages];
  if (!Page) notFound();
  return <Page />;
}
