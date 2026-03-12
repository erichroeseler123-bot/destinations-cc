import { notFound } from "next/navigation";
import RoadTripStopTemplate, { buildRoadTripStopMetadata, roadTripStopTypeMatchesFamily } from "@/app/components/dcc/RoadTripStopTemplate";
import { getRoadTripStop, listRoadTripStopSlugs } from "@/src/data/road-trip-stops-registry";

type Params = { slug: string };

export function generateStaticParams() {
  return listRoadTripStopSlugs("diner").map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const stop = getRoadTripStop(slug);
  if (!stop || !roadTripStopTypeMatchesFamily(stop.stopType, "diner")) return {};
  return buildRoadTripStopMetadata(stop);
}

export default async function DinerStopPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const stop = getRoadTripStop(slug);
  if (!stop || !roadTripStopTypeMatchesFamily(stop.stopType, "diner")) notFound();
  return <RoadTripStopTemplate stop={stop} />;
}
