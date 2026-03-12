import { notFound } from "next/navigation";
import RoadTripStopTemplate, { buildRoadTripStopMetadata, roadTripStopTypeMatchesFamily } from "@/app/components/dcc/RoadTripStopTemplate";
import { getRoadTripStop, listRoadTripStopSlugs } from "@/src/data/road-trip-stops-registry";

type Params = { slug: string };

export function generateStaticParams() {
  return listRoadTripStopSlugs("truck-stop").map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const stop = getRoadTripStop(slug);
  if (!stop || !roadTripStopTypeMatchesFamily(stop.stopType, "truck-stop")) return {};
  return buildRoadTripStopMetadata(stop);
}

export default async function TruckStopPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const stop = getRoadTripStop(slug);
  if (!stop || !roadTripStopTypeMatchesFamily(stop.stopType, "truck-stop")) notFound();
  return <RoadTripStopTemplate stop={stop} />;
}
