import type { Metadata } from "next";
import Link from "next/link";
import PageActionBar from "@/app/components/dcc/PageActionBar";
import RoadTripStopCards from "@/app/components/dcc/RoadTripStopCards";
import type { RoadTripOverlay } from "@/src/data/road-trip-overlays-registry";
import type { RoadTripRoute } from "@/src/data/road-trips-registry";
import type { RoadTripStop } from "@/src/data/road-trip-stops-registry";
import { buildMapsSearchUrl, type PageAction } from "@/src/lib/page-actions";

export function buildRoadTripOverlayMetadata(overlay: RoadTripOverlay): Metadata {
  const title = `${overlay.overlayType.replace(/-/g, " ")} road trips | Destination Command Center`;
  return {
    title,
    description: overlay.summary,
    alternates: { canonical: overlay.canonicalPath },
    openGraph: {
      title,
      description: overlay.summary,
      url: `https://destinationcommandcenter.com${overlay.canonicalPath}`,
      type: "website",
    },
  };
}

export default function RoadTripOverlayTemplate({
  overlay,
  routes,
  stops,
}: {
  overlay: RoadTripOverlay;
  routes: RoadTripRoute[];
  stops: RoadTripStop[];
}) {
  const actions: PageAction[] = [
    { href: buildMapsSearchUrl("Nevada Arizona scenic drive"), label: "Open route region in Maps", kind: "external" },
    ...overlay.relatedLinks.slice(0, 3).map((link) => ({ href: link.href, label: link.label, kind: "internal" as const })),
  ];

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(217,119,6,0.14),_transparent_24%),radial-gradient(circle_at_88%_18%,_rgba(34,211,238,0.12),_transparent_18%),linear-gradient(180deg,_#111217_0%,_#090a0d_100%)] text-white">
      <div className="mx-auto max-w-6xl px-6 py-16 space-y-8">
        <header className="space-y-5">
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">DCC Road Trip Overlay</p>
          <h1 className="text-4xl font-black tracking-tight md:text-6xl">{overlay.overlayType.replace(/-/g, " ")} drives</h1>
          <p className="max-w-4xl text-lg text-zinc-200">{overlay.summary}</p>
        </header>

        <PageActionBar title="Useful actions for this overlay" actions={actions} />

        <section className="grid gap-4 md:grid-cols-3">
          {routes.map((route) => (
            <Link key={route.slug} href={`/road-trips/${route.slug}`} className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.22)] hover:bg-white/10">
              <h2 className="text-lg font-semibold">{route.title}</h2>
              <p className="mt-2 text-sm text-zinc-300">{route.summary}</p>
            </Link>
          ))}
        </section>

        <RoadTripStopCards
          title="Stops that fit this overlay"
          intro="These stops give the route its scenic identity: real pullouts, classic road texture, and destination views that justify driving instead of just booking a ticket."
          stops={stops}
        />
      </div>
    </main>
  );
}
