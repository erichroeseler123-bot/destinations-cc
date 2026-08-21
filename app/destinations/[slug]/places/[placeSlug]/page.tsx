import Link from "next/link";
import { notFound } from "next/navigation";
import CommercialActionPanel from "@/app/components/dcc/CommercialActionPanel";
import { getDestinationConfig } from "@/src/data/destination-configs";
import { resolveCommercialActions } from "@/src/lib/dcc/commercial-actions";

export default async function DestinationPlacePage({ params }: { params: Promise<{ slug: string; placeSlug: string }> }) {
  const { slug, placeSlug } = await params;
  const config = getDestinationConfig(slug);
  if (!config) notFound();
  const place = config.places.find((candidate) => candidate.slug === placeSlug);
  if (!place) notFound();
  const actions = resolveCommercialActions(config, { destinationId: config.id, pageKind: place.kind, placeId: place.id });

  return (
    <main className="min-h-screen bg-[#050816] text-white">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <Link href={`/destinations/${config.slug}`} className="text-sm font-bold text-[#3df3ff]">← {config.name}</Link>
        <div className="mt-8 text-[11px] font-black uppercase tracking-[0.22em] text-[#8fd0ff]">{place.kind}</div>
        <h1 className="mt-3 text-4xl font-black uppercase tracking-[-0.04em] sm:text-6xl">{place.name}</h1>
        <p className="mt-4 text-base leading-7 text-white/70">{place.summary || `Use ${place.name} as a stable place entity inside the ${config.name} destination graph.`}</p>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <article className="rounded-[26px] border border-white/10 bg-[#0b1224] p-6"><div className="text-[11px] font-black uppercase tracking-[0.2em] text-[#ffb07c]">See it</div><p className="mt-3 text-sm leading-6 text-white/70">Street View, webcam, and live-source modules attach here when the destination capability exists.</p></article>
          <article className="rounded-[26px] border border-white/10 bg-[#0b1224] p-6"><div className="text-[11px] font-black uppercase tracking-[0.2em] text-[#ffb07c]">Understand it</div><p className="mt-3 text-sm leading-6 text-white/70">Stable graph facts, location relationships, and movement context explain how this place fits the trip.</p></article>
          <article className="rounded-[26px] border border-white/10 bg-[#0b1224] p-6"><div className="text-[11px] font-black uppercase tracking-[0.2em] text-[#ffb07c]">Experience it</div><p className="mt-3 text-sm leading-6 text-white/70">A commercial action appears only when the rule engine finds a legitimate next step.</p></article>
        </section>

        <div className="mt-8"><CommercialActionPanel actions={actions} /></div>
      </div>
    </main>
  );
}
