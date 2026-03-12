import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSportsLeague, getSportsLeagueSlugs } from "@/src/data/sports-leagues-config";
import { getTeamsByLeague } from "@/src/data/sports-teams-config";

type Params = { league: string };

export async function generateStaticParams() {
  return getSportsLeagueSlugs().map((league) => ({ league }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { league } = await params;
  const cfg = getSportsLeague(league);
  if (!cfg) {
    return { title: "Sports League | Destination Command Center" };
  }
  return {
    title: `${cfg.name} Team Hubs and Tickets | Destination Command Center`,
    description: cfg.description,
    alternates: { canonical: `/sports/${cfg.slug}` },
  };
}

export default async function SportsLeaguePage({ params }: { params: Promise<Params> }) {
  const { league } = await params;
  const cfg = getSportsLeague(league);
  if (!cfg) notFound();
  const teams = getTeamsByLeague(cfg.slug);

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-5xl px-6 py-16 space-y-8">
        <header className="space-y-4">
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">Sports League Hub</p>
          <h1 className="text-4xl font-black tracking-tight md:text-6xl">{cfg.name}</h1>
          <p className="max-w-3xl text-zinc-300">{cfg.description}</p>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          {teams.map((team) => (
            <Link
              key={team.slug}
              href={`/sports/team/${team.slug}`}
              className="rounded-3xl border border-white/10 bg-white/5 p-6 hover:bg-white/10"
            >
              <h2 className="text-2xl font-bold">{team.name}</h2>
              <p className="mt-2 text-sm text-zinc-300">{team.venueName}</p>
              <p className="mt-2 text-sm text-zinc-400">{team.description}</p>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
