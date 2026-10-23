import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import DecisionEngineTemplate from "@/app/components/dcc/DecisionEngineTemplate";
import TravelReferenceExperience from "@/app/components/dcc/TravelReferenceExperience";
import RideOptionsCard from "@/app/components/transportation/RideOptionsCard";
import { getTravelReferenceNodeById } from "@/lib/dcc/travelReference";
import { getSurface, hasSurfaceEntity } from "@/lib/dcc/surfaces/getSurface";
import {
  getDecisionEnginePageByPath,
  listDecisionEnginePagesByPrefix,
} from "@/src/data/decision-engine-pages";

export const revalidate = 300;

type Params = { slug: string };

export function generateStaticParams() {
  return listDecisionEnginePagesByPrefix("/routes/")
    .map((page) => ({ slug: page.canonicalPath.split("/")[2] }))
    .filter((entry) => Boolean(entry.slug));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const entityKey = `route:${slug}`;
  const surface =
    hasSurfaceEntity(entityKey) ?
      await getSurface({ entityKey: entityKey as `route:${string}`, modules: ["decision"], strict: false })
    : null;
  const page = surface?.modules.decision?.page || getDecisionEnginePageByPath(`/routes/${slug}`);
  if (!page) return { title: "Route Guide" };

  return {
    title: `${page.title} | Destination Command Center`,
    description: page.hero.summary,
    alternates: { canonical: page.canonicalPath },
  };
}

export default async function RouteDecisionPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const entityKey = `route:${slug}`;
  const surface =
    hasSurfaceEntity(entityKey) ?
      await getSurface({
        entityKey: entityKey as `route:${string}`,
        modules: ["decision", "graph", "media", "share", "counts"],
        strict: false,
      })
    : null;
  const page = surface?.modules.decision?.page || getDecisionEnginePageByPath(`/routes/${slug}`);
  if (!page) notFound();

  const referenceNode =
    slug === "denver-breckenridge"
      ? getTravelReferenceNodeById("denver-breckenridge")
      : slug === "denver-red-rocks"
        ? getTravelReferenceNodeById("red-rocks")
        : null;

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      {referenceNode ? <TravelReferenceExperience node={referenceNode} embedded /> : null}
      <div className="mx-auto max-w-6xl px-6 py-14 space-y-8">
        <DecisionEngineTemplate page={page} />
        {slug === "denver-red-rocks" ? <RideOptionsCard venueSlug="red-rocks-amphitheatre" sourcePage="/routes/denver-red-rocks" /> : null}
        <footer className="flex flex-wrap gap-6 text-sm text-zinc-400">
          <Link href="/cities/denver" className="hover:text-zinc-200">
            Open Denver decision engine →
          </Link>
          <Link href="/transportation/colorado" className="hover:text-zinc-200">
            Open Colorado transportation hub →
          </Link>
          <Link href="/regions/colorado" className="hover:text-zinc-200">
            Open Colorado region guide →
          </Link>
        </footer>
      </div>
    </main>
  );
}
