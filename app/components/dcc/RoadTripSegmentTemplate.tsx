import type { Metadata } from "next";
import Link from "next/link";
import PageActionBar from "@/app/components/dcc/PageActionBar";
import RoadTripStopCards from "@/app/components/dcc/RoadTripStopCards";
import type { RoadTripSegment } from "@/src/data/road-trip-segments-registry";
import type { RoadTripStop } from "@/src/data/road-trip-stops-registry";
import { ROAD_TRIP_WARNING_COPY } from "@/src/data/road-trips-registry";
import { buildMapsSearchUrl, type PageAction } from "@/src/lib/page-actions";

export function buildRoadTripSegmentMetadata(segment: RoadTripSegment): Metadata {
  const title = `${segment.fromLabel} to ${segment.toLabel} Drive Guide | Destination Command Center`;
  return {
    title,
    description: segment.summary,
    alternates: { canonical: `/route-segment/${segment.slug}` },
    openGraph: {
      title,
      description: segment.summary,
      url: `https://destinationcommandcenter.com/route-segment/${segment.slug}`,
      type: "website",
    },
  };
}

export default function RoadTripSegmentTemplate({
  segment,
  stops,
}: {
  segment: RoadTripSegment;
  stops: RoadTripStop[];
}) {
  const actionBarActions: PageAction[] = [
    { href: buildMapsSearchUrl(`${segment.fromLabel} to ${segment.toLabel}`), label: "Open segment in Maps", kind: "external" },
    { href: `/road-trips/${segment.routeSlug}`, label: "Back to main route", kind: "internal" },
    ...(stops[0] ? [{ href: "/stops-near/hoover-dam", label: "Nearby stop relationships", kind: "internal" as const }] : []),
  ];

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(217,119,6,0.15),_transparent_26%),radial-gradient(circle_at_88%_20%,_rgba(34,211,238,0.12),_transparent_18%),linear-gradient(180deg,_#121318_0%,_#090a0d_100%)] text-white">
      <div className="mx-auto max-w-6xl px-6 py-16 space-y-8">
        <header className="space-y-5">
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">DCC Route Segment</p>
          <h1 className="text-4xl font-black tracking-tight md:text-6xl">
            {segment.fromLabel} to {segment.toLabel}
          </h1>
          <p className="max-w-4xl text-lg text-zinc-200">{segment.summary}</p>
        </header>

        <PageActionBar title="Useful actions for this segment" actions={actionBarActions} />

        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.22)]">
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Drive time</p>
            <p className="mt-2 text-lg font-semibold">{segment.driveTimeNote}</p>
          </article>
          <article className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.22)]">
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Distance</p>
            <p className="mt-2 text-lg font-semibold">{segment.distanceNote}</p>
          </article>
          <article className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.22)]">
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Route role</p>
            <p className="mt-2 text-lg font-semibold">One planning leg, not the whole trip</p>
          </article>
        </section>

        <RoadTripStopCards
          title="Stops on this segment"
          intro="Use the segment view when the route feels too broad and you want just the relevant stops, warnings, and reset points for this leg."
          stops={stops}
        />

        <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.26)]">
          <h2 className="text-2xl font-bold">Segment warnings</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {segment.warningSlugs.map((slug) => {
              const warning = ROAD_TRIP_WARNING_COPY[slug];
              return (
                <article key={slug} className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <h3 className="font-semibold">{warning.title}</h3>
                  <p className="mt-2 text-sm text-zinc-300">{warning.body}</p>
                </article>
              );
            })}
          </div>
        </section>

        <Link href={`/road-trips/${segment.routeSlug}`} className="inline-flex rounded-full border border-white/10 bg-black/25 px-5 py-3 font-medium text-white hover:bg-white/10">
          Back to main route
        </Link>
      </div>
    </main>
  );
}
