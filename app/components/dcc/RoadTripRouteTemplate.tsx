import type { Metadata } from "next";
import Link from "next/link";
import PageActionBar from "@/app/components/dcc/PageActionBar";
import RoadTripStopCards from "@/app/components/dcc/RoadTripStopCards";
import type { RoadTripSegment } from "@/src/data/road-trip-segments-registry";
import type { RoadTripStop } from "@/src/data/road-trip-stops-registry";
import { getRoadTripStopHref } from "@/src/data/road-trip-stops-registry";
import { ROAD_TRIP_WARNING_COPY, type RoadTripRoute } from "@/src/data/road-trips-registry";
import { buildMapsSearchUrl, type PageAction } from "@/src/lib/page-actions";

export function buildRoadTripRouteMetadata(route: RoadTripRoute): Metadata {
  const title = `${route.title.replace(/\b\w/g, (match) => match.toUpperCase())} | Destination Command Center`;
  return {
    title,
    description: route.summary,
    alternates: { canonical: `/road-trips/${route.slug}` },
    openGraph: {
      title,
      description: route.summary,
      url: `https://destinationcommandcenter.com/road-trips/${route.slug}`,
      type: "website",
    },
  };
}

function JsonLd({ route }: { route: RoadTripRoute }) {
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["WebPage", "Trip"],
        "@id": `https://destinationcommandcenter.com/road-trips/${route.slug}`,
        url: `https://destinationcommandcenter.com/road-trips/${route.slug}`,
        name: route.title,
        description: route.summary,
        dateModified: "2026-03-12",
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Road Trips", item: "https://destinationcommandcenter.com/road-trips" },
          { "@type": "ListItem", position: 2, name: route.title, item: `https://destinationcommandcenter.com/road-trips/${route.slug}` },
        ],
      },
    ],
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export default function RoadTripRouteTemplate({
  route,
  segments,
  stops,
}: {
  route: RoadTripRoute;
  segments: RoadTripSegment[];
  stops: RoadTripStop[];
}) {
  const actionBarActions: PageAction[] = [
    { href: buildMapsSearchUrl(route.title), label: "Open route in Maps", kind: "external" },
    ...route.externalLinks.slice(1, 4).map((link) => ({ href: link.href, label: link.label, kind: "external" as const })),
    { href: "/vegas", label: "Vegas hub", kind: "internal" },
  ];

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(217,119,6,0.15),_transparent_26%),radial-gradient(circle_at_88%_20%,_rgba(34,211,238,0.12),_transparent_18%),linear-gradient(180deg,_#121318_0%,_#090a0d_100%)] text-white">
      <JsonLd route={route} />
      <div className="mx-auto max-w-6xl px-6 py-16 space-y-8">
        <header className="space-y-5">
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">DCC Road Trip Route</p>
          <h1 className="text-4xl font-black tracking-tight md:text-6xl">{route.title}</h1>
          <p className="max-w-4xl text-lg text-zinc-200">{route.summary}</p>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Last updated: March 2026</p>
        </header>

        <PageActionBar title={`Useful actions for ${route.title}`} actions={actionBarActions} />

        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.22)]">
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Drive time</p>
            <p className="mt-2 text-lg font-semibold">{route.driveTimeNote}</p>
          </article>
          <article className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.22)]">
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Distance</p>
            <p className="mt-2 text-lg font-semibold">{route.distanceNote}</p>
          </article>
          <article className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.22)]">
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Best for</p>
            <p className="mt-2 text-lg font-semibold">{route.bestFor.join(" · ")}</p>
          </article>
        </section>

        <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.26)]">
          <h2 className="text-2xl font-bold">Route segments</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {segments.map((segment) => (
              <Link
                key={segment.slug}
                href={`/route-segment/${segment.slug}`}
                className="rounded-[1.4rem] border border-white/10 bg-black/25 p-5 hover:bg-white/10"
              >
                <h3 className="text-lg font-semibold">{segment.fromLabel} to {segment.toLabel}</h3>
                <p className="mt-2 text-sm text-zinc-300">{segment.summary}</p>
                <p className="mt-3 text-xs uppercase tracking-[0.16em] text-zinc-500">
                  {segment.driveTimeNote}
                </p>
              </Link>
            ))}
          </div>
        </section>

        <RoadTripStopCards
          title="Top stops on this drive"
          intro="These are the stops that make this route actually useful: one scenic anchor, one practical reset, one classic town break, one food stop, and one destination payoff."
          stops={stops}
        />

        <section className="grid gap-4 md:grid-cols-2">
          <article className="rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.26)]">
            <h2 className="text-2xl font-bold">Warnings and road conditions</h2>
            <div className="mt-4 space-y-3">
              {route.warningSlugs.map((warningSlug) => {
                const warning = ROAD_TRIP_WARNING_COPY[warningSlug];
                return (
                  <div key={warningSlug} className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <h3 className="font-semibold">{warning.title}</h3>
                    <p className="mt-2 text-sm text-zinc-300">{warning.body}</p>
                  </div>
                );
              })}
            </div>
          </article>
          <article className="rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.26)]">
            <h2 className="text-2xl font-bold">Alternatives to driving</h2>
            <div className="mt-4 space-y-3">
              {route.alternatives.map((item) => (
                <Link key={item.href} href={item.href} className="block rounded-xl border border-white/10 bg-black/20 p-4 hover:bg-white/10">
                  <h3 className="font-semibold">{item.label}</h3>
                  <p className="mt-2 text-sm text-zinc-300">{item.body}</p>
                </Link>
              ))}
            </div>
          </article>
        </section>

        <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.26)]">
          <h2 className="text-2xl font-bold">Quick stop links</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {stops.slice(0, 6).map((stop) => (
              <Link key={stop.slug} href={getRoadTripStopHref(stop)} className="rounded-xl border border-white/10 bg-black/20 p-4 hover:bg-white/10">
                <h3 className="font-semibold">{stop.title}</h3>
                <p className="mt-2 text-sm text-zinc-300">{stop.quickFacts?.[0] ?? stop.summary}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
