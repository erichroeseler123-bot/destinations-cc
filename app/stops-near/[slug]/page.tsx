import { notFound } from "next/navigation";
import RoadTripRelationshipTemplate, { buildRoadTripRelationshipMetadata } from "@/app/components/dcc/RoadTripRelationshipTemplate";
import { getRoadTripRelationship, listRoadTripRelationshipSlugs } from "@/src/data/road-trip-relationships-registry";
import { getRoadTripStop, type RoadTripStop } from "@/src/data/road-trip-stops-registry";

type Params = { slug: string };

export function generateStaticParams() {
  return listRoadTripRelationshipSlugs("stops-near").map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const page = getRoadTripRelationship("stops-near", slug);
  if (!page) return {};
  return buildRoadTripRelationshipMetadata(page);
}

export default async function StopsNearPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const page = getRoadTripRelationship("stops-near", slug);
  if (!page) notFound();

  const anchor = getRoadTripStop(page.anchorSlug);
  const results = page.resultSlugs
    .map((stopSlug) => getRoadTripStop(stopSlug))
    .filter((stop): stop is RoadTripStop => Boolean(stop));

  return <RoadTripRelationshipTemplate page={page} anchorLabel={anchor?.title ?? page.anchorSlug} results={results} />;
}
