import { notFound } from "next/navigation";
import RoadTripRouteTemplate, { buildRoadTripRouteMetadata } from "@/app/components/dcc/RoadTripRouteTemplate";
import { getRoadTripSegmentsByRoute } from "@/src/data/road-trip-segments-registry";
import { getRoadTripStop, type RoadTripStop } from "@/src/data/road-trip-stops-registry";
import { getRoadTripRoute, listRoadTripRouteSlugs } from "@/src/data/road-trips-registry";

type Params = { slug: string };

export function generateStaticParams() {
  return listRoadTripRouteSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const route = getRoadTripRoute(slug);
  if (!route) return {};
  return buildRoadTripRouteMetadata(route);
}

export default async function RoadTripRoutePage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const route = getRoadTripRoute(slug);
  if (!route) notFound();

  const segments = getRoadTripSegmentsByRoute(route.slug);
  const stops = route.stopSlugs
    .map((stopSlug) => getRoadTripStop(stopSlug))
    .filter((stop): stop is RoadTripStop => Boolean(stop));

  return <RoadTripRouteTemplate route={route} segments={segments} stops={stops} />;
}
