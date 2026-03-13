import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import DecisionEngineTemplate from "@/app/components/dcc/DecisionEngineTemplate";
import { getSurface, hasSurfaceEntity } from "@/lib/dcc/surfaces/getSurface";
import {
  getDecisionEnginePageByPath,
  listDecisionEnginePagesByPrefix,
} from "@/src/data/decision-engine-pages";

type Params = { slug: string };

export function generateStaticParams() {
  return listDecisionEnginePagesByPrefix("/attractions/")
    .map((page) => ({ slug: page.canonicalPath.split("/")[2] }))
    .filter((entry) => Boolean(entry.slug));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const entityKey = `attraction:${slug}`;
  const surface =
    hasSurfaceEntity(entityKey) ?
      await getSurface({
        entityKey: entityKey as `attraction:${string}`,
        modules: ["decision"],
        strict: false,
      })
    : null;
  const page = surface?.modules.decision?.page || getDecisionEnginePageByPath(`/attractions/${slug}`);
  if (!page) return { title: "Attraction Guide" };

  return {
    title: page.title,
    description: page.hero.summary,
    alternates: { canonical: page.canonicalPath },
  };
}

export default async function AttractionDecisionPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const entityKey = `attraction:${slug}`;
  const surface =
    hasSurfaceEntity(entityKey) ?
      await getSurface({
        entityKey: entityKey as `attraction:${string}`,
        modules: ["decision", "graph", "media", "share", "counts"],
        strict: false,
      })
    : null;
  const page = surface?.modules.decision?.page || getDecisionEnginePageByPath(`/attractions/${slug}`);
  if (!page) notFound();

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-6xl px-6 py-14 space-y-8">
        <DecisionEngineTemplate page={page} />
        <footer className="text-sm text-zinc-400">
          <Link href="/cruises/shore-excursions" className="hover:text-zinc-200">
            Open shore excursions guide →
          </Link>
        </footer>
      </div>
    </main>
  );
}
