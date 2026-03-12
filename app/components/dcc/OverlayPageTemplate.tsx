import type { Metadata } from "next";
import Link from "next/link";
import PageActionBar from "@/app/components/dcc/PageActionBar";
import OverlayEntityGridSection from "@/app/components/dcc/OverlayEntityGridSection";
import type { DccCityRegistryNode } from "@/src/data/cities-registry";
import type { DccEntityRegistryNode } from "@/src/data/entities-registry";
import type { DccOverlayRegistryNode } from "@/src/data/overlay-registry";
import { buildMapsSearchUrl, type PageAction } from "@/src/lib/page-actions";

function formatOverlayLabel(overlayType: string) {
  return overlayType.replace(/-/g, " ");
}

export function buildOverlayMetadata(city: DccCityRegistryNode, overlay: DccOverlayRegistryNode): Metadata {
  const overlayLabel = formatOverlayLabel(overlay.overlayType);
  const cityLabel = city.name;
  const title = `${overlayLabel.replace(/\b\w/g, (match) => match.toUpperCase())} ${cityLabel} | Destination Command Center`;
  const description = `${overlay.summary} Use this ${overlayLabel} overlay to branch into the strongest matching ${cityLabel} nodes.`;
  return {
    title,
    description,
    alternates: { canonical: overlay.canonicalPath },
    openGraph: {
      title,
      description,
      url: `https://destinationcommandcenter.com${overlay.canonicalPath}`,
      type: "website",
    },
  };
}

type Props = {
  city: DccCityRegistryNode;
  overlay: DccOverlayRegistryNode;
  entities: DccEntityRegistryNode[];
};

export default function OverlayPageTemplate({ city, overlay, entities }: Props) {
  const overlayLabel = formatOverlayLabel(overlay.overlayType);
  const title = `${overlayLabel.replace(/\b\w/g, (match) => match.toUpperCase())} ${city.name}`;
  const actionBarActions: PageAction[] = [
    { href: city.canonicalPath, label: `${city.name} hub`, kind: "internal" },
    { href: buildMapsSearchUrl(`${city.name}, ${city.state ?? city.country}`), label: "Open city in Maps", kind: "external" },
    ...(overlay.relatedLinks?.slice(0, 3).map((link) => ({ href: link.href, label: link.label, kind: "internal" as const })) ?? []),
  ];

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(217,119,6,0.14),_transparent_24%),radial-gradient(circle_at_88%_18%,_rgba(34,211,238,0.12),_transparent_18%),linear-gradient(180deg,_#111217_0%,_#090a0d_100%)] text-white">
      <div className="mx-auto max-w-6xl px-6 py-16 space-y-8">
        <header className="space-y-5">
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">DCC Overlay Node</p>
          <h1 className="text-4xl font-black tracking-tight md:text-6xl">{title}</h1>
          <p className="max-w-3xl text-lg text-zinc-200">{overlay.summary}</p>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">
            {city.name} · Last updated: March 2026
          </p>
        </header>

        <PageActionBar title={`Useful actions for ${title}`} actions={actionBarActions} />

        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.22)]">
            <h2 className="text-lg font-semibold">What this overlay is for</h2>
            <p className="mt-2 text-sm text-zinc-300">
              This page exists for the way people actually search: intent first, then specific hotels, beaches, attractions, or pools that fit it.
            </p>
          </article>
          <article className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.22)]">
            <h2 className="text-lg font-semibold">Entity coverage</h2>
            <p className="mt-2 text-sm text-zinc-300">
              {overlay.entityTypes.map((entityType) => entityType.replace(/-/g, " ")).join(" · ")}
            </p>
          </article>
          <article className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.22)]">
            <h2 className="text-lg font-semibold">Why this matters</h2>
            <p className="mt-2 text-sm text-zinc-300">
              Overlay pages make the DCC graph easier to browse, easier to crawl, and closer to how real trip planning decisions get made.
            </p>
          </article>
        </section>

        <OverlayEntityGridSection
          eyebrow={`${city.name} overlay`}
          title={title}
          intro={`Use this ${overlayLabel} surface to compare the strongest matching ${city.name} entities without dropping back into a generic city list.`}
          entities={entities}
        />

        {overlay.relatedLinks?.length ? (
          <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.26)]">
            <h2 className="text-2xl font-bold">Related guides</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {overlay.relatedLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-xl border border-white/10 bg-black/20 p-4 hover:bg-white/10"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
