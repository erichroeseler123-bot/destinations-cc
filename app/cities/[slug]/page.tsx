import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import DecisionEngineTemplate from "@/app/components/dcc/DecisionEngineTemplate";
import LivePulseBlock from "@/app/components/dcc/livePulse/LivePulseBlock";
import Next48Button from "@/app/components/dcc/next48/Next48Button";
import RideOptionsCard from "@/app/components/transportation/RideOptionsCard";
import ShareWeekendCard from "@/app/components/dcc/share/ShareWeekendCard";
import { getSurface, hasSurfaceEntity } from "@/lib/dcc/surfaces/getSurface";
import {
  getDecisionEnginePageByPath,
  listDecisionEnginePagesByPrefix,
} from "@/src/data/decision-engine-pages";

type Params = { slug: string };

export function generateStaticParams() {
  return listDecisionEnginePagesByPrefix("/cities/")
    .map((page) => ({ slug: page.canonicalPath.split("/")[2] }))
    .filter((entry) => Boolean(entry.slug));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const entityKey = `city:${slug}`;
  const surface =
    hasSurfaceEntity(entityKey) ?
      await getSurface({ entityKey: entityKey as `city:${string}`, modules: ["decision"], strict: false })
    : null;
  const page = surface?.modules.decision?.page || getDecisionEnginePageByPath(`/cities/${slug}`);
  if (!page) return { title: "City Guide" };

  return {
    title: page.title,
    description: page.hero.summary,
    alternates: { canonical: page.canonicalPath },
  };
}

export default async function CityDecisionPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const entityKey = `city:${slug}`;
  const surface =
    hasSurfaceEntity(entityKey) ?
      await getSurface({
        entityKey: entityKey as `city:${string}`,
        modules: ["decision", "livePulse", "next48", "share", "counts", "graph", "media"],
        strict: false,
      })
    : null;
  const page = surface?.modules.decision?.page || getDecisionEnginePageByPath(`/cities/${slug}`);
  if (!page) notFound();

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-6xl px-6 py-14 space-y-8">
        <DecisionEngineTemplate page={page} />
        {slug === "denver" ? <RideOptionsCard venueSlug="red-rocks-amphitheatre" sourcePage="/cities/denver" /> : null}
        {slug === "denver" ? (
          <LivePulseBlock
            entityType="city"
            entitySlug="denver"
            title="Denver Right Now"
            target="city-feed"
          />
        ) : null}
        {slug === "denver" ? <ShareWeekendCard /> : null}
        <footer className="text-sm text-zinc-400">
          <Link href={`/${slug}`} className="hover:text-zinc-200">
            Open core city hub →
          </Link>
        </footer>
      </div>
      {slug === "denver" ? <Next48Button entityType="city" slug="denver" /> : null}
    </main>
  );
}
