import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ContextualSpecialistReturnBanner from "@/app/components/dcc/ContextualSpecialistReturnBanner";
import DecisionEngineTemplate from "@/app/components/dcc/DecisionEngineTemplate";
import TravelReferenceExperience from "@/app/components/dcc/TravelReferenceExperience";
import RideOptionsCard from "@/app/components/transportation/RideOptionsCard";
import { getPublishedTravelReferenceNodeById } from "@/lib/dcc/travelReference";
import { syncDurableLedgerWithPostgres } from "@/lib/dcc/storage/durableTransactionalStore";
import { getSurface, hasSurfaceEntity } from "@/lib/dcc/surfaces/getSurface";
import {
  getDecisionEnginePageByPath,
  listDecisionEnginePagesByPrefix,
} from "@/src/data/decision-engine-pages";

import { getPublicationManifestEntry } from "@/src/data/publication-manifest";

export const dynamic = "force-dynamic";

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
  await syncDurableLedgerWithPostgres();
  const { slug } = await params;
  const entityKey = `route:${slug}`;
  const surface =
    hasSurfaceEntity(entityKey) ?
      await getSurface({ entityKey: entityKey as `route:${string}`, modules: ["decision"], strict: false })
    : null;
  const page = surface?.modules.decision?.page || getDecisionEnginePageByPath(`/routes/${slug}`);
  if (!page) return { title: "Route Guide" };

  const manifestEntry = getPublicationManifestEntry(`/routes/${slug}`);
  const isIndexable = manifestEntry?.indexingState === "index_follow";

  return {
    title: `${page.title} | Destination Command Center`,
    description: page.hero.summary,
    alternates: { canonical: manifestEntry?.canonicalUrl || page.canonicalPath },
    robots: { index: isIndexable, follow: isIndexable },
  };
}

export default async function RouteDecisionPage({
  params,
}: {
  params: Promise<Params>;
}) {
  await syncDurableLedgerWithPostgres();
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
      ? await getPublishedTravelReferenceNodeById("denver-breckenridge")
      : slug === "denver-red-rocks"
        ? await getPublishedTravelReferenceNodeById("red-rocks")
        : null;

  const routeBanner =
    slug === "denver-breckenridge"
      ? {
          src: "/images/portfolio/colorado-i70-corridor.webp",
          alt: "Interstate 70 winter mountain corridor approaching the Eisenhower-Johnson Memorial Tunnel between Denver and Breckenridge",
          width: 1440,
          height: 810,
        }
      : slug === "denver-red-rocks"
        ? {
            src: "/images/authority/routes/denver-red-rocks/hero.webp",
            alt: "Concert shuttle Sprinter along the Denver to Red Rocks Amphitheatre corridor",
            width: 1280,
            height: 720,
          }
        : null;

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      {routeBanner ? (
        <div className="mx-auto max-w-6xl px-6 pt-10">
          <div className="overflow-hidden rounded-3xl border border-white/12 bg-black/40 shadow-2xl">
            <img
              src={routeBanner.src}
              alt={routeBanner.alt}
              width={routeBanner.width}
              height={routeBanner.height}
              loading="eager"
              className="h-52 w-full object-cover object-center sm:h-68"
            />
          </div>
        </div>
      ) : null}
      {referenceNode ? (
        <TravelReferenceExperience
          node={referenceNode}
          embedded
        />
      ) : null}
      <div className="mx-auto max-w-6xl px-6 py-14 space-y-8">
        {slug === "denver-breckenridge" ? (
          <Suspense fallback={null}>
            <ContextualSpecialistReturnBanner specialist="gosno" />
          </Suspense>
        ) : null}
        <DecisionEngineTemplate page={page} />
        {slug === "denver-red-rocks" ? (
          <RideOptionsCard
            venueSlug="red-rocks-amphitheatre"
            sourcePage="/routes/denver-red-rocks"
          />
        ) : null}

        <footer className="flex flex-wrap gap-6 text-sm text-zinc-400">
          <Link href="/cities/denver" className="hover:text-zinc-200">
            Open Denver decision engine →
          </Link>
          <Link href="/transportation/colorado" className="hover:text-zinc-200">
            Open Colorado transportation hub →
          </Link>
          <Link href="/destinations/colorado" className="hover:text-zinc-200">
            Open Colorado region guide →
          </Link>
        </footer>
      </div>
    </main>
  );
}
