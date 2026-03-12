import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { seatGeekAdapter } from "@/lib/dcc/providers/adapters/seatgeek";
import { getSportsTeam, SPORTS_TEAMS_CONFIG } from "@/src/data/sports-teams-config";

type Params = { slug: string };

export async function generateStaticParams() {
  return SPORTS_TEAMS_CONFIG.map((team) => ({ slug: team.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const team = getSportsTeam(slug);
  if (!team) return { title: "Sports Team | Destination Command Center" };
  return {
    title: `${team.name} Tickets and Venue Guide | Destination Command Center`,
    description: `${team.name} ticket discovery, venue context, and related city routing.`,
    alternates: { canonical: `/sports/team/${team.slug}` },
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

function JsonLd({ teamName, slug }: { teamName: string; slug: string }) {
  const url = `https://destinationcommandcenter.com/sports/team/${slug}`;
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": url,
        url,
        name: `${teamName} Tickets and Venue Guide`,
        description: `${teamName} ticket discovery and venue context.`,
        dateModified: "2026-03-12",
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Sports", item: "https://destinationcommandcenter.com/sports" },
          { "@type": "ListItem", position: 2, name: teamName, item: url },
        ],
      },
    ],
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export default async function SportsTeamPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const team = getSportsTeam(slug);
  if (!team) notFound();

  const eventsResult = await seatGeekAdapter.fetch({
    performerSlug: team.seatGeekPerformerSlug,
    venueCity: team.cityName,
    size: 8,
  });

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <JsonLd teamName={team.name} slug={team.slug} />
      <div className="mx-auto max-w-6xl px-6 py-16 space-y-8">
        <header className="space-y-4">
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">DCC Sports Team Node</p>
          <h1 className="text-4xl font-black tracking-tight md:text-6xl">{team.name}</h1>
          <p className="max-w-3xl text-zinc-300">{team.description}</p>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Last updated: March 2026</p>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          {team.whyItMatters.map((item) => (
            <article key={item} className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-zinc-200">{item}</p>
            </article>
          ))}
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">SeatGeek Ticket Layer</p>
              <h2 className="mt-2 text-2xl font-bold">Upcoming games and ticket discovery</h2>
              <p className="mt-2 text-zinc-300">
                This is the sports execution layer: live game inventory and direct ticket handoff, kept separate from tours and shows.
              </p>
              <p className="mt-2 text-sm text-cyan-300">
                {eventsResult.ok
                  ? "Live SeatGeek inventory is loaded for this team."
                  : eventsResult.diagnostics.fallback_reason === "missing_client_id"
                    ? "SeatGeek API key is not configured, so live ticket inventory is unavailable right now."
                    : "SeatGeek inventory is temporarily unavailable; try again later."}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-200">
              {team.venueName}
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {eventsResult.data.length > 0 ? (
              eventsResult.data.map((event) => (
                <article key={event.id} className="overflow-hidden rounded-2xl border border-white/10 bg-black/20">
                  {event.imageUrl ? (
                    <div className="aspect-[4/3] overflow-hidden border-b border-white/10">
                      <img
                        src={event.imageUrl}
                        alt={event.title}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  ) : null}
                  <div className="space-y-3 p-4">
                    <h3 className="font-semibold text-white">{event.title}</h3>
                    <p className="text-sm text-zinc-300">{formatDate(event.startDateTime)}</p>
                    <p className="text-sm text-zinc-400">
                      {[event.venueName, event.city].filter(Boolean).join(" • ") || "Live event"}
                    </p>
                    <p className="text-sm text-zinc-300">
                      {typeof event.lowestPrice === "number" ? `From USD ${event.lowestPrice}` : "See live price"}
                    </p>
                    {event.url ? (
                      <a
                        href={event.url}
                        target="_blank"
                        rel="noopener noreferrer sponsored nofollow"
                        className="inline-flex w-full items-center justify-center rounded-xl bg-cyan-600 px-4 py-3 font-semibold text-white hover:bg-cyan-500"
                      >
                        Buy on SeatGeek
                      </a>
                    ) : null}
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-sm text-zinc-300">
                No live games available in the current SeatGeek response.
              </div>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-bold">Related city and venue routes</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {team.relatedCityPages.map((page) => (
              <Link
                key={page.href}
                href={page.href}
                className="rounded-2xl border border-white/10 bg-black/20 p-4 hover:bg-white/10"
              >
                {page.label}
              </Link>
            ))}
            <Link
              href={`/sports/${team.leagueSlug}`}
              className="rounded-2xl border border-white/10 bg-black/20 p-4 hover:bg-white/10"
            >
              {team.leagueSlug.toUpperCase()} league hub
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
