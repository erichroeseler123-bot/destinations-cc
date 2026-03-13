import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageActionBar from "@/app/components/dcc/PageActionBar";
import DecisionEngineTemplate from "@/app/components/dcc/DecisionEngineTemplate";
import LivePulseBlock from "@/app/components/dcc/livePulse/LivePulseBlock";
import LivePulseShareCard from "@/app/components/dcc/share/LivePulseShareCard";
import { buildSeatGeekGameSlug, seatGeekAdapter } from "@/lib/dcc/providers/adapters/seatgeek";
import { getSurface, hasSurfaceEntity } from "@/lib/dcc/surfaces/getSurface";
import { getDecisionEnginePageByPath } from "@/src/data/decision-engine-pages";
import { getSportsTeam, getTeamsByVenue } from "@/src/data/sports-teams-config";
import { getSportsVenue, getSportsVenueSlugs } from "@/src/data/sports-venues-config";
import { buildMapsSearchUrl, buildOfficialSearchUrl, type PageAction } from "@/src/lib/page-actions";

type Params = { slug: string };

export async function generateStaticParams() {
  return getSportsVenueSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const venue = getSportsVenue(slug);
  if (!venue) {
    return { title: "Venue | Destination Command Center" };
  }
  return {
    title: `${venue.name} Venue Guide and Tickets | Destination Command Center`,
    description: `${venue.name} venue context, primary teams, and ticket discovery.`,
    alternates: { canonical: `/venues/${venue.slug}` },
  };
}

function formatDate(value: string | null): string {
  if (!value) return "Check event date";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return value;
  return dt.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function JsonLd({ name, slug }: { name: string; slug: string }) {
  const url = `https://destinationcommandcenter.com/venues/${slug}`;
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": url,
        url,
        name: `${name} Venue Guide and Tickets`,
        description: `${name} venue context, primary teams, and ticket discovery.`,
        dateModified: "2026-03-12",
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Venues", item: "https://destinationcommandcenter.com/venues" },
          { "@type": "ListItem", position: 2, name: name, item: url },
        ],
      },
    ],
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export default async function VenuePage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const venue = getSportsVenue(slug);
  if (!venue) notFound();

  const teams = getTeamsByVenue(venue.slug);
  const eventResults = await Promise.all(
    (venue.seatGeekPerformerSlugs || []).map((performerSlug) =>
      seatGeekAdapter.fetch({
        performerSlug,
        venueCity: venue.cityName,
        size: 4,
      })
    )
  );

  const events = eventResults
    .flatMap((result) => result.data)
    .filter((event, index, list) => list.findIndex((item) => item.id === event.id) === index)
    .slice(0, 8);

  const hasLiveInventory = eventResults.some((result) => result.ok);
  const isMissingKey = eventResults.some(
    (result) => result.diagnostics.fallback_reason === "missing_client_id"
  );
  const entityKey = `venue:${venue.slug}`;
  const surface =
    hasSurfaceEntity(entityKey) ?
      await getSurface({
        entityKey: entityKey as `venue:${string}`,
        modules: ["decision", "livePulse", "share", "counts", "graph", "media"],
        strict: false,
      })
    : null;
  const decisionPage = surface?.modules.decision?.page || getDecisionEnginePageByPath(`/venues/${venue.slug}`);
  const actionBarActions: PageAction[] = [
    { href: buildMapsSearchUrl(`${venue.name}, ${venue.cityName}`), label: "Open in Maps", kind: "external" },
    { href: buildOfficialSearchUrl(`${venue.name} ${venue.cityName}`), label: "Find official site", kind: "external" },
    { href: "/venues", label: "Nearby venues", kind: "internal" },
    ...(teams[0] ? [{ href: `/sports/team/${teams[0].slug}`, label: "Primary team", kind: "internal" as const }] : []),
    { href: "/sports", label: "Sports calendar", kind: "internal" },
  ];

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.14),_transparent_24%),radial-gradient(circle_at_90%_18%,_rgba(244,114,182,0.1),_transparent_18%),linear-gradient(180deg,_#111217_0%,_#090a0d_100%)] text-white">
      <JsonLd name={venue.name} slug={venue.slug} />
      <div className="mx-auto max-w-6xl px-6 py-16 space-y-8">
        <header className="space-y-4">
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">DCC Venue Node</p>
          <h1 className="text-4xl font-black tracking-tight md:text-6xl">{venue.name}</h1>
          <p className="max-w-3xl text-lg text-zinc-200">{venue.description}</p>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Last updated: March 2026</p>
        </header>

        <PageActionBar title={`Useful actions for ${venue.name}`} actions={actionBarActions} />

        {slug === "red-rocks-amphitheatre" ? (
          <section className="grid gap-6 lg:grid-cols-2">
            <LivePulseBlock
              entityType="venue"
              entitySlug="red-rocks-amphitheatre"
              title="Red Rocks Live Pulse"
              target="entity"
            />
            <LivePulseShareCard />
          </section>
        ) : null}

        {decisionPage ? <DecisionEngineTemplate page={decisionPage} /> : null}

        <section className="grid gap-4 md:grid-cols-3">
          {venue.whyItMatters.map((item) => (
            <article key={item} className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.22)]">
              <p className="text-sm text-zinc-200">{item}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.22)]">
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">City</p>
            <p className="mt-2 text-lg font-semibold">{venue.cityName}</p>
          </div>
          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.22)]">
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Sports Leagues</p>
            <p className="mt-2 text-lg font-semibold">{venue.sportsLeagues.map((item) => item.toUpperCase()).join(" • ")}</p>
          </div>
          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.22)]">
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Area Note</p>
            <p className="mt-2 text-lg font-semibold">{venue.addressNote || "Check venue location"}</p>
          </div>
        </section>

        <section className="rounded-[1.9rem] border border-white/10 bg-white/[0.06] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.26)]">
          <h2 className="text-2xl font-bold">Primary teams</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {teams.map((team) => (
              <Link
                key={team.slug}
                href={`/sports/team/${team.slug}`}
                className="rounded-2xl border border-white/10 bg-black/20 p-4 hover:bg-white/10"
              >
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">{team.leagueSlug.toUpperCase()}</p>
                <h3 className="mt-2 text-lg font-semibold">{team.name}</h3>
                <p className="mt-2 text-sm text-zinc-300">{team.description}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-[1.9rem] border border-white/10 bg-white/[0.06] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.26)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">SeatGeek Venue Layer</p>
              <h2 className="mt-2 text-2xl font-bold">Upcoming events and ticket discovery</h2>
              <p className="mt-2 text-zinc-300">
                Venue nodes connect teams, games, and ticket buyer intent into one authority surface.
              </p>
              <p className="mt-2 text-sm text-cyan-300">
                {hasLiveInventory
                  ? "Live SeatGeek inventory is loaded for this venue."
                  : isMissingKey
                    ? "SeatGeek API key is not configured, so live venue inventory is unavailable right now."
                    : "SeatGeek venue inventory is temporarily unavailable; try again later."}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-200">
              {venue.name}
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {events.length > 0 ? (
              events.map((event) => (
                <article key={event.id} className="overflow-hidden rounded-2xl border border-white/10 bg-black/20">
                  {event.imageUrl ? (
                    <div className="aspect-[4/3] overflow-hidden border-b border-white/10">
                      <img src={event.imageUrl} alt={event.title} className="h-full w-full object-cover" loading="lazy" />
                    </div>
                  ) : null}
                  <div className="space-y-3 p-4">
                    <Link href={`/sports/game/${buildSeatGeekGameSlug(event)}`} className="block hover:text-cyan-200">
                      <h3 className="font-semibold text-white">{event.title}</h3>
                    </Link>
                    <p className="text-sm text-zinc-300">{formatDate(event.startDateTime)}</p>
                    <p className="text-sm text-zinc-400">
                      {[event.venueName, event.city].filter(Boolean).join(" • ") || "Live event"}
                    </p>
                    <p className="text-sm text-zinc-300">
                      {typeof event.lowestPrice === "number" ? `From USD ${event.lowestPrice}` : "See live price"}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/sports/game/${buildSeatGeekGameSlug(event)}`}
                        className="inline-flex flex-1 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-semibold text-white hover:bg-white/10"
                      >
                        Game page
                      </Link>
                      {event.url ? (
                        <a
                          href={event.url}
                          target="_blank"
                          rel="noopener noreferrer sponsored nofollow"
                          className="inline-flex flex-1 items-center justify-center rounded-xl bg-cyan-600 px-4 py-3 font-semibold text-white hover:bg-cyan-500"
                        >
                          Buy on SeatGeek
                        </a>
                      ) : null}
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-sm text-zinc-300">
                No live venue events available in the current SeatGeek response.
              </div>
            )}
          </div>
        </section>

        <section className="rounded-[1.9rem] border border-white/10 bg-white/[0.06] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.26)]">
          <h2 className="text-2xl font-bold">Related routes</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {venue.relatedPages.map((page) => (
              <Link
                key={page.href}
                href={page.href}
                className="rounded-2xl border border-white/10 bg-black/20 p-4 hover:bg-white/10"
              >
                {page.label}
              </Link>
            ))}
            <Link
              href={`/sports/team/${getSportsTeam(venue.primaryTeams[0] || "")?.slug ?? ""}`}
              className="rounded-2xl border border-white/10 bg-black/20 p-4 hover:bg-white/10"
            >
              Open primary team node
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
