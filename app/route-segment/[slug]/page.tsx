import { notFound } from "next/navigation";
import RoadTripSegmentTemplate, { buildRoadTripSegmentMetadata } from "@/app/components/dcc/RoadTripSegmentTemplate";
import { getRoadTripSegment, listRoadTripSegmentSlugs } from "@/src/data/road-trip-segments-registry";
import { getRoadTripStop, type RoadTripStop } from "@/src/data/road-trip-stops-registry";

type Params = { slug: string };

export function generateStaticParams() {
  return listRoadTripSegmentSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const segment = getRoadTripSegment(slug);
  if (!segment) return {};
  return buildRoadTripSegmentMetadata(segment);
}

export default async function RouteSegmentPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const segment = getRoadTripSegment(slug);
  if (!segment) notFound();

  const stops = segment.stopSlugs
    .map((stopSlug) => getRoadTripStop(stopSlug))
    .filter((stop): stop is RoadTripStop => Boolean(stop));

  return <RoadTripSegmentTemplate segment={segment} stops={stops} />;
}
