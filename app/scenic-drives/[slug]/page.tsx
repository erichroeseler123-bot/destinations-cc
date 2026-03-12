import { notFound } from "next/navigation";
import RoadTripOverlayTemplate, { buildRoadTripOverlayMetadata } from "@/app/components/dcc/RoadTripOverlayTemplate";
import { getRoadTripOverlayByCanonicalSlug, listRoadTripOverlayRouteSlugs } from "@/src/data/road-trip-overlays-registry";
import { getRoadTripRoute, type RoadTripRoute } from "@/src/data/road-trips-registry";
import { getRoadTripStop, type RoadTripStop } from "@/src/data/road-trip-stops-registry";

type Params = { slug: string };

export function generateStaticParams() {
  return listRoadTripOverlayRouteSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const overlay = getRoadTripOverlayByCanonicalSlug(slug);
  if (!overlay) return {};
  return buildRoadTripOverlayMetadata(overlay);
}

export default async function ScenicDriveOverlayPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const overlay = getRoadTripOverlayByCanonicalSlug(slug);
  if (!overlay) notFound();

  const routes = overlay.routeSlugs
    .map((routeSlug) => getRoadTripRoute(routeSlug))
    .filter((route): route is RoadTripRoute => Boolean(route));
  const stops = overlay.stopSlugs
    .map((stopSlug) => getRoadTripStop(stopSlug))
    .filter((stop): stop is RoadTripStop => Boolean(stop));

  return <RoadTripOverlayTemplate overlay={overlay} routes={routes} stops={stops} />;
}
