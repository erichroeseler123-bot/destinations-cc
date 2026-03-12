import type { Metadata } from "next";
import Link from "next/link";
import PageActionBar from "@/app/components/dcc/PageActionBar";
import type { RoadTripRelationship } from "@/src/data/road-trip-relationships-registry";
import type { RoadTripStop } from "@/src/data/road-trip-stops-registry";
import { getRoadTripStopHref } from "@/src/data/road-trip-stops-registry";
import { buildMapsSearchUrl, type PageAction } from "@/src/lib/page-actions";

export function buildRoadTripRelationshipMetadata(page: RoadTripRelationship): Metadata {
  const readableTitle = page.slug.replace(/-/g, " ");
  const title = `${readableTitle.replace(/\b\w/g, (match) => match.toUpperCase())} | Destination Command Center`;
  return {
    title,
    description: page.summary,
    alternates: { canonical: page.canonicalPath },
    openGraph: {
      title,
      description: page.summary,
      url: `https://destinationcommandcenter.com${page.canonicalPath}`,
      type: "website",
    },
  };
}

export default function RoadTripRelationshipTemplate({
  page,
  anchorLabel,
  results,
}: {
  page: RoadTripRelationship;
  anchorLabel: string;
  results: RoadTripStop[];
}) {
  const actions: PageAction[] = [
    { href: buildMapsSearchUrl(anchorLabel), label: "Open anchor in Maps", kind: "external" },
    ...page.relatedLinks.slice(0, 3).map((link) => ({ href: link.href, label: link.label, kind: "internal" as const })),
  ];

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(217,119,6,0.14),_transparent_24%),radial-gradient(circle_at_88%_18%,_rgba(34,211,238,0.12),_transparent_18%),linear-gradient(180deg,_#111217_0%,_#090a0d_100%)] text-white">
      <div className="mx-auto max-w-6xl px-6 py-16 space-y-8">
        <header className="space-y-5">
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">DCC Road Trip Relationship</p>
          <h1 className="text-4xl font-black tracking-tight md:text-6xl">{page.slug.replace(/-/g, " ")}</h1>
          <p className="max-w-4xl text-lg text-zinc-200">{page.summary}</p>
        </header>

        <PageActionBar title="Useful actions for this relationship page" actions={actions} />

        <section className="grid gap-4 md:grid-cols-2">
          {page.guidance.map((item) => (
            <article key={item.title} className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.22)]">
              <h2 className="text-lg font-semibold">{item.title}</h2>
              <p className="mt-2 text-sm text-zinc-300">{item.body}</p>
            </article>
          ))}
        </section>

        <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.26)]">
          <h2 className="text-2xl font-bold">Matching stops</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {results.map((stop) => (
              <Link key={stop.slug} href={getRoadTripStopHref(stop)} className="rounded-xl border border-white/10 bg-black/20 p-4 hover:bg-white/10">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">{stop.stopType.replace(/-/g, " ")}</p>
                <h3 className="mt-2 font-semibold">{stop.title}</h3>
                <p className="mt-2 text-sm text-zinc-300">{stop.summary}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
