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
    title: page.title,
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

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-6xl px-6 py-14 space-y-8">
        <DecisionEngineTemplate page={page} />
        <footer className="text-sm text-zinc-400">
          <Link href="/cities/denver" className="hover:text-zinc-200">
            Open Denver decision engine →
          </Link>
        </footer>
      </div>
    </main>
  );
}
