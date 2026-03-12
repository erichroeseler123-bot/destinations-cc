import type { Metadata } from "next";
import Link from "next/link";
import PageActionBar from "@/app/components/dcc/PageActionBar";
import type { RoadTripStop } from "@/src/data/road-trip-stops-registry";
import { getRoadTripStop, getRoadTripStopHref, type RoadTripStopType } from "@/src/data/road-trip-stops-registry";
import { buildMapsSearchUrl, buildOfficialSearchUrl, type PageAction } from "@/src/lib/page-actions";

export function buildRoadTripStopMetadata(stop: RoadTripStop): Metadata {
  const title = `${stop.title} | Destination Command Center`;
  const path = getRoadTripStopHref(stop);
  return {
    title,
    description: stop.summary,
    alternates: { canonical: path },
    openGraph: {
      title,
      description: stop.summary,
      url: `https://destinationcommandcenter.com${path}`,
      type: "website",
    },
  };
}

export default function RoadTripStopTemplate({ stop }: { stop: RoadTripStop }) {
  const nearbyStops = stop.nearbyStopSlugs
    .map((slug) => getRoadTripStop(slug))
    .filter((item): item is RoadTripStop => Boolean(item));
  const actions: PageAction[] = [
    { href: buildMapsSearchUrl(stop.title), label: "Open in Maps", kind: "external" },
    { href: buildOfficialSearchUrl(stop.title), label: "Find official info", kind: "external" },
    ...stop.externalLinks.slice(0, 2).map((link) => ({ href: link.href, label: link.label, kind: "external" as const })),
    { href: "/road-trips/las-vegas-to-grand-canyon", label: "Main route", kind: "internal" },
  ];

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(217,119,6,0.14),_transparent_24%),radial-gradient(circle_at_88%_18%,_rgba(34,211,238,0.12),_transparent_18%),linear-gradient(180deg,_#111217_0%,_#090a0d_100%)] text-white">
      <div className="mx-auto max-w-5xl px-6 py-16 space-y-8">
        <header className="space-y-5">
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">DCC Road Trip Stop</p>
          <h1 className="text-4xl font-black tracking-tight md:text-6xl">{stop.title}</h1>
          <p className="max-w-3xl text-lg text-zinc-200">{stop.summary}</p>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">{stop.stopType.replace(/-/g, " ")} · Last updated: March 2026</p>
        </header>

        <PageActionBar title={`Useful actions for ${stop.title}`} actions={actions} />

        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.22)]">
            <h2 className="text-lg font-semibold">Best use</h2>
            <p className="mt-2 text-sm text-zinc-300">Treat this stop as a purposeful route decision, not background filler.</p>
          </article>
          <article className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.22)]">
            <h2 className="text-lg font-semibold">Route fit</h2>
            <p className="mt-2 text-sm text-zinc-300">{stop.routeSlugs.map((item) => item.replace(/-/g, " ")).join(" · ")}</p>
          </article>
          <article className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.22)]">
            <h2 className="text-lg font-semibold">Quick facts</h2>
            <p className="mt-2 text-sm text-zinc-300">{stop.quickFacts?.join(" · ") ?? stop.tags.join(" · ")}</p>
          </article>
        </section>

        <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.26)]">
          <h2 className="text-2xl font-bold">Practical links</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {stop.externalLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="rounded-xl border border-white/10 bg-black/20 p-4 hover:bg-white/10"
              >
                {link.label}
              </a>
            ))}
          </div>
        </section>

        {nearbyStops.length ? (
          <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.26)]">
            <h2 className="text-2xl font-bold">Nearby stop nodes</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {nearbyStops.map((nearby) => (
                <Link key={nearby.slug} href={getRoadTripStopHref(nearby)} className="rounded-xl border border-white/10 bg-black/20 p-4 hover:bg-white/10">
                  <h3 className="font-semibold">{nearby.title}</h3>
                  <p className="mt-2 text-sm text-zinc-300">{nearby.summary}</p>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}

export function roadTripStopTypeMatchesFamily(stopType: RoadTripStopType, family: "roadside" | "diner" | "truck-stop" | "scenic") {
  switch (family) {
    case "diner":
      return stopType === "diner";
    case "truck-stop":
      return stopType === "truck-stop";
    case "scenic":
      return stopType === "scenic";
    default:
      return stopType === "roadside" || stopType === "town" || stopType === "gas" || stopType === "warning-zone";
  }
}
