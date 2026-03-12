import Link from "next/link";
import type { SportsTeamConfig } from "@/src/data/sports-teams-config";

type CitySportsSectionProps = {
  cityName: string;
  citySlug: string;
  teams: SportsTeamConfig[];
};

export default function CitySportsSection({ cityName, citySlug, teams }: CitySportsSectionProps) {
  if (teams.length === 0) return null;

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">Sports Tickets</p>
        <h2 className="text-2xl font-bold">{cityName} sports teams and ticket routes</h2>
        <p className="max-w-3xl text-zinc-300">
          Use the sports layer for team pages, venue-driven event demand, and ticket buyer intent that does not belong in
          the shows or tours lanes.
        </p>
      </div>

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

      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          href="/sports"
          className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-200 hover:bg-white/10"
        >
          Open sports hub
        </Link>
        <Link
          href={`/sports/${teams[0]?.leagueSlug ?? "nfl"}`}
          className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-200 hover:bg-white/10"
        >
          Browse {teams[0]?.leagueSlug?.toUpperCase() ?? "sports"} league
        </Link>
        <Link
          href={`/${citySlug}/shows`}
          className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-200 hover:bg-white/10"
        >
          Keep shows separate
        </Link>
      </div>
    </section>
  );
}
