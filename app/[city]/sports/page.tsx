export const dynamicParams = false;

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  buildSeatGeekGameSlug,
  seatGeekAdapter,
  type SeatGeekEvent,
} from "@/lib/dcc/providers/adapters/seatgeek";
import { getSportsCitySlugs, getTeamsByCity } from "@/src/data/sports-teams-config";
import { getSportsVenuesByCity } from "@/src/data/sports-venues-config";

type Params = { city: string };

function cityHubHref(citySlug: string) {
  return `/${citySlug === "las-vegas" ? "vegas" : citySlug}`;
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

export async function generateStaticParams() {
  return getSportsCitySlugs().map((city) => ({ city }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { city } = await params;
  const teams = getTeamsByCity(city);
  if (!teams.length) return { title: "City Sports | Destination Command Center" };
  const cityName = teams[0].cityName;
  return {
    title: `${cityName} Sports Teams, Venues, and Tickets | Destination Command Center`,
    description: `What sports teams play in ${cityName}, where they play, and how to buy tickets through the DCC sports graph.`,
    alternates: { canonical: `/${city}/sports` },
  };
}

function JsonLd({
  citySlug,
  cityName,
  teamNames,
}: {
  citySlug: string;
  cityName: string;
  teamNames: string[];
}) {
  const url = `https://destinationcommandcenter.com/${citySlug}/sports`;
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["CollectionPage", "WebPage"],
        "@id": url,
        url,
        name: `${cityName} Sports Teams, Venues, and Tickets`,
        description: `What sports teams play in ${cityName}, where they play, and how to buy tickets.`,
        dateModified: "2026-03-12",
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: cityName, item: `https://destinationcommandcenter.com${cityHubHref(citySlug)}` },
          { "@type": "ListItem", position: 2, name: "Sports", item: url },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: `What sports teams play in ${cityName}?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: `${cityName} sports coverage currently includes ${teamNames.join(", ")}.`,
            },
          },
          {
            "@type": "Question",
            name: `Where can you watch a game in ${cityName}?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: `Use the venue nodes and game pages in the ${cityName} sports layer to find stadiums, arenas, and live ticket routes.`,
            },
          },
        ],
      },
    ],
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export default async function CitySportsAnswerPage({ params }: { params: Promise<Params> }) {
  const { city } = await params;
  const teams = getTeamsByCity(city);
  if (!teams.length) notFound();

  const citySlug = city.toLowerCase();
  const cityName = teams[0].cityName;
  const venues = getSportsVenuesByCity(citySlug);
  const eventResults = await Promise.all(
    teams.map((team) =>
      seatGeekAdapter.fetch({
        performerSlug: team.seatGeekPerformerSlug,
        venueCity: team.cityName,
        size: 3,
      })
    )
  );

  const upcomingGames = eventResults
    .flatMap((result) => result.data)
    .filter((event, index, list) => list.findIndex((item) => item.id === event.id) === index)
    .sort((a, b) => {
      const left = a.startDateTime ? new Date(a.startDateTime).getTime() : Number.MAX_SAFE_INTEGER;
      const right = b.startDateTime ? new Date(b.startDateTime).getTime() : Number.MAX_SAFE_INTEGER;
      return left - right;
    })
    .slice(0, 12);

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <JsonLd citySlug={citySlug} cityName={cityName} teamNames={teams.map((team) => team.name)} />
      <div className="mx-auto max-w-6xl px-6 py-16 space-y-8">
        <header className="space-y-4">
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">DCC City Sports Layer</p>
          <h1 className="text-4xl font-black tracking-tight md:text-6xl">{cityName} sports teams, venues, and tickets</h1>
          <p className="max-w-3xl text-zinc-300">
            This page answers the basic sports questions for {cityName}: what teams play here, where they play, and how
            to route into live ticket inventory without mixing sports into shows or tours.
          </p>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Last updated: March 2026</p>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Major teams</p>
            <p className="mt-2 text-lg font-semibold">{teams.length}</p>
            <p className="mt-2 text-sm text-zinc-300">Multi-league sports nodes already connected to the city graph.</p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Major venues</p>
            <p className="mt-2 text-lg font-semibold">{venues.length}</p>
            <p className="mt-2 text-sm text-zinc-300">Venue authority pages tied back to team nodes and live game inventory.</p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Upcoming games</p>
            <p className="mt-2 text-lg font-semibold">{upcomingGames.length}</p>
            <p className="mt-2 text-sm text-zinc-300">Current SeatGeek event nodes available for direct ticket routing.</p>
          </article>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-bold">What sports teams play in {cityName}?</h2>
          <p className="mt-2 max-w-3xl text-zinc-300">
            {cityName} currently has {teams.map((team) => team.name).join(", ")} in the live DCC sports graph.
          </p>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {teams.map((team) => (
              <div key={team.slug} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <Link href={`/sports/team/${team.slug}`} className="block hover:text-cyan-200">
                  <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">{team.leagueSlug.toUpperCase()}</p>
                  <h3 className="mt-2 text-lg font-semibold text-white">{team.name}</h3>
                  <p className="mt-2 text-sm text-zinc-300">{team.venueName}</p>
                  <p className="mt-3 text-sm text-zinc-400 line-clamp-3">{team.description}</p>
                </Link>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href={`/sports/team/${team.slug}`}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-zinc-200 hover:bg-white/10"
                  >
                    Team page
                  </Link>
                  <Link
                    href={`/venues/${team.venueSlug}`}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-zinc-200 hover:bg-white/10"
                  >
                    Venue page
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-bold">Major sports venues in {cityName}</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {venues.map((venue) => (
              <Link
                key={venue.slug}
                href={`/venues/${venue.slug}`}
                className="rounded-2xl border border-white/10 bg-black/20 p-4 hover:bg-white/10"
              >
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                  {venue.sportsLeagues.map((league) => league.toUpperCase()).join(" • ")}
                </p>
                <h3 className="mt-2 text-lg font-semibold text-white">{venue.name}</h3>
                <p className="mt-2 text-sm text-zinc-300">{venue.addressNote}</p>
                <p className="mt-3 text-sm text-zinc-400 line-clamp-3">{venue.description}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-bold">Upcoming games in {cityName}</h2>
          <p className="mt-2 max-w-3xl text-zinc-300">
            These game nodes are generated from the same SeatGeek inventory used by the team and venue layers.
          </p>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {upcomingGames.map((event: SeatGeekEvent) => (
              <article key={event.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <Link href={`/sports/game/${buildSeatGeekGameSlug(event)}`} className="block hover:text-cyan-200">
                  <h3 className="text-lg font-semibold text-white">{event.title}</h3>
                  <p className="mt-2 text-sm text-zinc-300">{formatDate(event.startDateTime)}</p>
                  <p className="mt-2 text-sm text-zinc-400">
                    {[event.venueName, event.city].filter(Boolean).join(" • ") || "Live event"}
                  </p>
                </Link>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href={`/sports/game/${buildSeatGeekGameSlug(event)}`}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-zinc-200 hover:bg-white/10"
                  >
                    Game page
                  </Link>
                  {event.url ? (
                    <a
                      href={event.url}
                      target="_blank"
                      rel="noopener noreferrer sponsored nofollow"
                      className="rounded-xl bg-cyan-600 px-3 py-2 text-xs font-semibold text-white hover:bg-cyan-500"
                    >
                      Buy on SeatGeek
                    </a>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="flex flex-wrap gap-3">
          <Link
            href={cityHubHref(citySlug)}
            className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-200 hover:bg-white/10"
          >
            Open {cityName} hub
          </Link>
          <Link
            href="/sports"
            className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-200 hover:bg-white/10"
          >
            Open sports hub
          </Link>
        </section>
      </div>
    </main>
  );
}
