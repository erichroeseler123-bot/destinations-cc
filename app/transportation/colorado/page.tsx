import type { Metadata } from "next";
import Link from "next/link";
import RideOptionsCard from "@/app/components/transportation/RideOptionsCard";
import { getTransportEntriesByRegion } from "@/src/data/transport-directory";

export const metadata: Metadata = {
  title: "Colorado Transportation Coverage | Destination Command Center",
  description:
    "Colorado transportation coverage across Red Rocks, major Denver venues, clubs, Boulder, and mountain venues.",
  alternates: { canonical: "/transportation/colorado" },
};

const GROUPS = [
  {
    title: "Red Rocks",
    slugs: ["red-rocks-amphitheatre"],
  },
  {
    title: "Major Denver venues",
    slugs: ["mission-ballroom", "ball-arena", "fiddlers-green-amphitheatre"],
  },
  {
    title: "Denver clubs and theatres",
    slugs: ["ogden-theatre", "gothic-theatre", "cervantes-masterpiece", "bluebird-theater", "summit-music-hall", "marquis-theater"],
  },
  {
    title: "Boulder",
    slugs: ["boulder-theater", "fox-theatre"],
  },
  {
    title: "Mountain and destination venues",
    slugs: ["mishawaka-amphitheatre"],
  },
];

export default function ColoradoTransportationPage() {
  const entries = getTransportEntriesByRegion("Colorado");
  const bySlug = new Map(entries.map((entry) => [entry.slug, entry]));

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-6xl px-6 py-16 space-y-8">
        <header className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.14),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-7 shadow-[0_20px_70px_rgba(0,0,0,0.35)]">
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Colorado coverage</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">Colorado transportation directory</h1>
          <p className="mt-4 max-w-4xl text-base leading-8 text-zinc-300">
            Colorado is the first supported transportation region. Red Rocks is active. The rest of the Colorado venue
            map is staged intentionally as limited or coming soon so DCC can stay accurate about where transportation
            is actually available.
          </p>
        </header>

        <RideOptionsCard venueSlug="red-rocks-amphitheatre" sourcePage="/transportation/colorado" />

        {GROUPS.map((group) => {
          const groupEntries = group.slugs
            .map((slug) => bySlug.get(slug))
            .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));
          if (groupEntries.length === 0) return null;

          return (
            <section key={group.title} className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-2xl font-bold">{group.title}</h2>
              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {groupEntries.map((entry) => (
                  <Link
                    key={entry.slug}
                    href={entry.dccUrl}
                    className="rounded-2xl border border-white/10 bg-black/20 p-4 hover:bg-white/10"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                          {entry.city}, {entry.state}
                        </p>
                        <h3 className="mt-2 text-lg font-semibold text-white">{entry.name}</h3>
                      </div>
                      <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-cyan-200">
                        {entry.serviceStatus.replace("_", " ")}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-zinc-300">{entry.notes}</p>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
