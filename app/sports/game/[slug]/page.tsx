import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  buildSeatGeekGameSlug,
  extractSeatGeekEventId,
  fetchSeatGeekEventById,
} from "@/lib/dcc/providers/adapters/seatgeek";
import { getSportsTeamByPerformerSlug } from "@/src/data/sports-teams-config";
import { matchSportsVenueByName } from "@/src/data/sports-venues-config";

type Params = { slug: string };

function formatDate(value: string | null): string {
  if (!value) return "Check event date";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return value;
  return dt.toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const eventId = extractSeatGeekEventId(slug);
  if (!eventId) return { title: "Game Tickets | Destination Command Center" };
  const result = await fetchSeatGeekEventById(eventId);
  if (!result.data) return { title: "Game Tickets | Destination Command Center" };
  return {
    title: `${result.data.title} Tickets and Game Guide | Destination Command Center`,
    description: `${result.data.title} ticket discovery, venue context, and related team routes.`,
    alternates: { canonical: `/sports/game/${buildSeatGeekGameSlug(result.data)}` },
  };
}

function JsonLd({
  slug,
  title,
  startDateTime,
  venueName,
  city,
}: {
  slug: string;
  title: string;
  startDateTime: string | null;
  venueName: string | null;
  city: string | null;
}) {
  const url = `https://destinationcommandcenter.com/sports/game/${slug}`;
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["SportsEvent", "Event"],
        "@id": url,
        url,
        name: title,
        startDate: startDateTime || undefined,
        eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
        eventStatus: "https://schema.org/EventScheduled",
        location: venueName
          ? {
              "@type": "StadiumOrArena",
              name: venueName,
              address: city || undefined,
            }
          : undefined,
      },
      {
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        url,
        name: `${title} Tickets and Game Guide`,
        description: `${title} ticket discovery, venue context, and related team routes.`,
        dateModified: "2026-03-12",
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Sports", item: "https://destinationcommandcenter.com/sports" },
          { "@type": "ListItem", position: 2, name: "Games", item: "https://destinationcommandcenter.com/sports" },
          { "@type": "ListItem", position: 3, name: title, item: url },
        ],
      },
    ],
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export default async function SportsGamePage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const eventId = extractSeatGeekEventId(slug);
  if (!eventId) notFound();

  const result = await fetchSeatGeekEventById(eventId);
  const event = result.data;
  if (!event) notFound();

  const teams = event.performerSlugs
    .map((performerSlug) => getSportsTeamByPerformerSlug(performerSlug))
    .filter((team): team is NonNullable<typeof team> => Boolean(team));
  const venue = matchSportsVenueByName(event.venueName);
  const canonicalSlug = buildSeatGeekGameSlug(event);
  const citySlug = teams[0]?.citySlug || venue?.citySlug || null;
  const cityLabel = teams[0]?.cityName || venue?.cityName || event.city || "City";
  const leagueLinks = Array.from(new Set(teams.map((team) => team.leagueSlug))).map((leagueSlug) => ({
    href: `/sports/${leagueSlug}`,
    label: `More ${leagueSlug.toUpperCase()} games`,
  }));

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <JsonLd
        slug={canonicalSlug}
        title={event.title}
        startDateTime={event.startDateTime}
        venueName={event.venueName}
        city={event.city}
      />
      <div className="mx-auto max-w-6xl px-6 py-16 space-y-8">
        <header className="space-y-4">
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">DCC Sports Game Node</p>
          <h1 className="text-4xl font-black tracking-tight md:text-6xl">{event.title}</h1>
          <p className="max-w-3xl text-zinc-300">
            Game pages sit between team nodes, venue nodes, and SeatGeek execution. This is the highest-intent sports
            search surface in the current graph.
          </p>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Last updated: March 2026</p>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Game date</p>
            <p className="mt-2 text-lg font-semibold">{formatDate(event.startDateTime)}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Venue</p>
            <p className="mt-2 text-lg font-semibold">{event.venueName || "Check venue"}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Ticket pricing</p>
            <p className="mt-2 text-lg font-semibold">
              {typeof event.lowestPrice === "number" ? `From USD ${event.lowestPrice}` : "See live price"}
            </p>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">SeatGeek Execution Layer</p>
              <h2 className="mt-2 text-2xl font-bold">Live ticket handoff</h2>
              <p className="mt-2 max-w-3xl text-zinc-300">
                Sports game pages capture direct ticket intent. They should answer the event, venue, and route context
                before sending the user to SeatGeek.
              </p>
            </div>
            {event.url ? (
              <a
                href={event.url}
                target="_blank"
                rel="noopener noreferrer sponsored nofollow"
                className="inline-flex items-center justify-center rounded-2xl bg-cyan-600 px-5 py-3 font-semibold text-white hover:bg-cyan-500"
              >
                Buy on SeatGeek
              </a>
            ) : null}
          </div>
          {event.imageUrl ? (
            <div className="mt-6 overflow-hidden rounded-3xl border border-white/10">
              <img src={event.imageUrl} alt={event.title} className="h-full w-full object-cover" loading="lazy" />
            </div>
          ) : null}
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-bold">Related team and venue nodes</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {teams.map((team) => (
              <Link
                key={team.slug}
                href={`/sports/team/${team.slug}`}
                className="rounded-2xl border border-white/10 bg-black/20 p-4 hover:bg-white/10"
              >
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">{team.leagueSlug.toUpperCase()}</p>
                <h3 className="mt-2 text-lg font-semibold">{team.name}</h3>
                <p className="mt-2 text-sm text-zinc-300">{team.venueName}</p>
              </Link>
            ))}
            {venue ? (
              <Link
                href={`/venues/${venue.slug}`}
                className="rounded-2xl border border-white/10 bg-black/20 p-4 hover:bg-white/10"
              >
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Venue node</p>
                <h3 className="mt-2 text-lg font-semibold">{venue.name}</h3>
                <p className="mt-2 text-sm text-zinc-300">{venue.cityName}</p>
              </Link>
            ) : null}
            {citySlug ? (
              <Link
                href={`/${citySlug === "las-vegas" ? "vegas" : citySlug}`}
                className="rounded-2xl border border-white/10 bg-black/20 p-4 hover:bg-white/10"
              >
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">City hub</p>
                <h3 className="mt-2 text-lg font-semibold">Explore {cityLabel}</h3>
                <p className="mt-2 text-sm text-zinc-300">Return to the city node for sports, tours, and venue context.</p>
              </Link>
            ) : null}
            {leagueLinks.map((league) => (
              <Link
                key={league.href}
                href={league.href}
                className="rounded-2xl border border-white/10 bg-black/20 p-4 hover:bg-white/10"
              >
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">League hub</p>
                <h3 className="mt-2 text-lg font-semibold">{league.label}</h3>
                <p className="mt-2 text-sm text-zinc-300">Browse more team and game nodes in this league cluster.</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
