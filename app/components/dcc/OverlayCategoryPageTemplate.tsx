import type { Metadata } from "next";
import PageActionBar from "@/app/components/dcc/PageActionBar";
import OverlayEntityGridSection from "@/app/components/dcc/OverlayEntityGridSection";
import type { DccCityRegistryNode } from "@/src/data/cities-registry";
import type { DccEntityRegistryNode } from "@/src/data/entities-registry";
import type { DccOverlayRegistryNode, DccOverlayLink } from "@/src/data/overlay-registry";
import { buildMapsSearchUrl, type PageAction } from "@/src/lib/page-actions";

const CATEGORY_LABELS: Record<string, string> = {
  hotels: "Hotels",
  attractions: "Attractions",
  pools: "Pools",
  beaches: "Beaches",
  venues: "Venues",
  casinos: "Casinos",
};

function formatOverlayLabel(overlayType: string) {
  return overlayType.replace(/-/g, " ").replace(/\b\w/g, (match) => match.toUpperCase());
}

function linkKind(link: DccOverlayLink): "internal" | "external" {
  if (link.kind) return link.kind;
  return link.href.startsWith("http") ? "external" : "internal";
}

function getCategoryLabel(category: string) {
  return CATEGORY_LABELS[category] ?? category.replace(/-/g, " ").replace(/\b\w/g, (match) => match.toUpperCase());
}

export function buildOverlayCategoryMetadata(
  city: DccCityRegistryNode,
  overlay: DccOverlayRegistryNode,
  category: string,
  canonicalPath: string
): Metadata {
  const title = `${formatOverlayLabel(overlay.overlayType)} ${getCategoryLabel(category)} ${city.name} | Destination Command Center`;
  const description = `${overlay.summary} This page narrows the overlay to ${getCategoryLabel(category).toLowerCase()} in ${city.name}.`;
  return {
    title,
    description,
    alternates: { canonical: canonicalPath },
    openGraph: {
      title,
      description,
      url: `https://destinationcommandcenter.com${canonicalPath}`,
      type: "website",
    },
  };
}

type Props = {
  city: DccCityRegistryNode;
  overlay: DccOverlayRegistryNode;
  category: string;
  entities: DccEntityRegistryNode[];
  canonicalPath: string;
};

export default function OverlayCategoryPageTemplate({ city, overlay, category, entities, canonicalPath }: Props) {
  const overlayLabel = formatOverlayLabel(overlay.overlayType);
  const categoryLabel = getCategoryLabel(category);
  const title = `${overlayLabel} ${categoryLabel} ${city.name}`;
  const actionBarActions: PageAction[] = [
    { href: overlay.canonicalPath, label: `${overlayLabel} ${city.name}`, kind: "internal" },
    { href: city.canonicalPath, label: `${city.name} hub`, kind: "internal" },
    { href: buildMapsSearchUrl(`${city.name}, ${city.state ?? city.country}`), label: "Open city in Maps", kind: "external" },
    ...(overlay.relatedLinks?.slice(0, 2).map((link) => ({ href: link.href, label: link.label, kind: linkKind(link) })) ?? []),
  ];

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(217,119,6,0.14),_transparent_24%),radial-gradient(circle_at_88%_18%,_rgba(34,211,238,0.12),_transparent_18%),linear-gradient(180deg,_#111217_0%,_#090a0d_100%)] text-white">
      <div className="mx-auto max-w-6xl px-6 py-16 space-y-8">
        <header className="space-y-5">
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">DCC Overlay Category</p>
          <h1 className="text-4xl font-black tracking-tight md:text-6xl">{title}</h1>
          <p className="max-w-3xl text-lg text-zinc-200">
            {overlay.summary} This child page keeps the overlay useful for people who already know the category they care about.
          </p>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">
            {city.name} · {categoryLabel} · Last updated: March 2026
          </p>
        </header>

        <PageActionBar title={`Useful actions for ${title}`} actions={actionBarActions} />

        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.22)]">
            <h2 className="text-lg font-semibold">Best for</h2>
            <p className="mt-2 text-sm text-zinc-300">
              Use this page when the trip intent is already {overlay.overlayType.replace(/-/g, " ")} and the next question is which {categoryLabel.toLowerCase()} fit it best.
            </p>
          </article>
          <article className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.22)]">
            <h2 className="text-lg font-semibold">Why narrow it down</h2>
            <p className="mt-2 text-sm text-zinc-300">
              Category children turn a broad overlay into a stronger search target and a faster planning surface for real trip decisions.
            </p>
          </article>
          <article className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.22)]">
            <h2 className="text-lg font-semibold">Canonical path</h2>
            <p className="mt-2 text-sm text-zinc-300">{canonicalPath}</p>
          </article>
        </section>

        <OverlayEntityGridSection
          eyebrow={`${city.name} ${overlay.overlayType}`}
          title={title}
          intro={`Compare the strongest ${categoryLabel.toLowerCase()} for this overlay without dropping back into a generic city directory.`}
          entities={entities}
        />
      </div>
    </main>
  );
}
