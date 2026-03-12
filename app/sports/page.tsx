import type { Metadata } from "next";
import Link from "next/link";
import { SPORTS_LEAGUES_CONFIG } from "@/src/data/sports-leagues-config";
import { SPORTS_TEAMS_CONFIG } from "@/src/data/sports-teams-config";

export const metadata: Metadata = {
  title: "Sports Tickets and Team Hubs | Destination Command Center",
  description:
    "Browse sports leagues, foundation-city team nodes, and live game-ticket discovery powered by the DCC sports graph.",
  alternates: { canonical: "/sports" },
};

function JsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": "https://destinationcommandcenter.com/sports",
        url: "https://destinationcommandcenter.com/sports",
        name: "Sports Tickets and Team Hubs",
        description: "League hubs, team nodes, and sports-ticket discovery for DCC.",
        dateModified: "2026-03-12",
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://destinationcommandcenter.com/" },
          { "@type": "ListItem", position: 2, name: "Sports", item: "https://destinationcommandcenter.com/sports" },
        ],
      },
    ],
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export default function SportsHubPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <JsonLd />
      <div className="mx-auto max-w-6xl px-6 py-16 space-y-8">
        <header className="space-y-4">
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">DCC Sports Layer</p>
          <h1 className="text-4xl font-black tracking-tight md:text-6xl">Sports tickets, teams, and venue intent</h1>
          <p className="max-w-3xl text-zinc-300">
            This vertical separates sports from shows and tours. Use it for team nodes, game-ticket discovery, venue intent,
            and sports-event planning that needs a direct ticket handoff instead of a tour marketplace.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          {SPORTS_LEAGUES_CONFIG.map((league) => (
            <Link
              key={league.slug}
              href={`/sports/${league.slug}`}
              className="rounded-3xl border border-white/10 bg-white/5 p-6 hover:bg-white/10"
            >
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">{league.name}</p>
              <h2 className="mt-3 text-2xl font-bold">{league.description}</h2>
              <p className="mt-2 text-sm text-zinc-300">{league.focus}</p>
            </Link>
          ))}
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-bold">Seed team nodes live now</h2>
          <p className="mt-2 max-w-3xl text-zinc-300">
            The sports graph now spans the Phase 1 foundation cities and the next expansion set: Las Vegas, Miami,
            Orlando, New Orleans, Chicago, New York, Los Angeles, Nashville, Boston, Seattle, San Francisco, and
            Washington, D.C., plus Atlanta, Dallas, Houston, and Philadelphia.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {SPORTS_TEAMS_CONFIG.map((team) => (
              <Link
                key={team.slug}
                href={`/sports/team/${team.slug}`}
                className="rounded-2xl border border-white/10 bg-black/20 p-4 hover:bg-white/10"
              >
                <h3 className="font-semibold">{team.name}</h3>
                <p className="mt-2 text-sm text-zinc-300">{team.venueName}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
