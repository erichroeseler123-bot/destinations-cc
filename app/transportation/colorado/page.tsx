import type { Metadata } from "next";
import Link from "next/link";
import NextStepEngine from "@/app/components/dcc/NextStepEngine";
import TravelReferenceExperience from "@/app/components/dcc/TravelReferenceExperience";
import RideOptionsCard from "@/app/components/transportation/RideOptionsCard";
import { getColoradoTransferRecommendationActions } from "@/lib/dcc/handoffAnalytics";
import { getTravelReferenceNodeById } from "@/lib/dcc/travelReference";
import { getTransportEntriesByRegion } from "@/src/data/transport-directory";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Colorado Transportation & I-70 Mountain Corridor Reference | Destination Command Center",
  description:
    "Colorado transportation reference across the Denver–Breckenridge I-70 corridor, Red Rocks Amphitheatre, Denver venues, Bustang/Pegasus transit, and CDOT traction laws.",
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
  const actions = getColoradoTransferRecommendationActions();
  const entries = getTransportEntriesByRegion("Colorado");
  const bySlug = new Map(entries.map((entry) => [entry.slug, entry]));
  const corridorRef = getTravelReferenceNodeById("denver-breckenridge");

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-6xl px-6 py-16 space-y-8">
        <header className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.14),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-7 shadow-[0_20px_70px_rgba(0,0,0,0.35)]">
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Colorado coverage & reference</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">Colorado transportation & corridor directory</h1>
          <p className="mt-4 max-w-4xl text-base leading-8 text-zinc-300">
            Colorado is DCC&apos;s flagship surface for venue and mountain-corridor transportation reference. Explore the full source-attributed{" "}
            <Link href="/routes/denver-breckenridge" className="text-cyan-300 underline hover:text-cyan-100">
              Denver–Breckenridge I-70 Mountain Corridor Reference
            </Link>{" "}
            and{" "}
            <Link href="/red-rocks" className="text-cyan-300 underline hover:text-cyan-100">
              Red Rocks Amphitheatre Reference
            </Link>
            , alongside staged Denver and Boulder venue pages.
          </p>
        </header>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-bold">Flagship Colorado Reference Guides</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Link href="/routes/denver-breckenridge" className="rounded-2xl border border-cyan-400/25 bg-cyan-400/[0.06] p-4 hover:bg-cyan-400/[0.12]">
              <div className="text-xs uppercase tracking-[0.18em] text-cyan-300">Mountain corridor reference</div>
              <h3 className="mt-2 text-lg font-semibold text-white">Denver–Breckenridge (I-70 & CO-9)</h3>
              <p className="mt-3 text-sm text-zinc-300">Statutory CDOT traction laws, Bustang/Pegasus transit, GoSno endpoint, and live divide telemetry.</p>
            </Link>
            <Link href="/red-rocks" className="rounded-2xl border border-cyan-400/25 bg-cyan-400/[0.06] p-4 hover:bg-cyan-400/[0.12]">
              <div className="text-xs uppercase tracking-[0.18em] text-cyan-300">Venue reference</div>
              <h3 className="mt-2 text-lg font-semibold text-white">Red Rocks Park & Amphitheatre</h3>
              <p className="mt-3 text-sm text-zinc-300">Lot & step physics, lightning-hold boundaries, live Morrison telemetry, and shuttle handoffs.</p>
            </Link>
            <Link href="/red-rocks-shuttle-vs-uber" className="rounded-2xl border border-white/10 bg-black/20 p-4 hover:bg-white/10">
              <div className="text-xs uppercase tracking-[0.18em] text-cyan-300">Comparison page</div>
              <h3 className="mt-2 text-lg font-semibold text-white">Red Rocks shuttle vs Uber</h3>
              <p className="mt-3 text-sm text-zinc-300">Narrow-intent authority page for post-show ride-home decisions.</p>
            </Link>
            <Link href="/transportation/colorado/denver-to-vail-shuttle-guide" className="rounded-2xl border border-white/10 bg-black/20 p-4 hover:bg-white/10">
              <div className="text-xs uppercase tracking-[0.18em] text-cyan-300">Ski corridor guide</div>
              <h3 className="mt-2 text-lg font-semibold text-white">Denver to Vail shuttle guide</h3>
              <p className="mt-3 text-sm text-zinc-300">Authority-first transfer logic before the traveler moves into GOSNO execution.</p>
            </Link>
          </div>
        </section>

        {corridorRef ? <TravelReferenceExperience node={corridorRef} embedded /> : null}

        <RideOptionsCard venueSlug="red-rocks-amphitheatre" sourcePage="/transportation/colorado" />

        <NextStepEngine
          title="Colorado Transfer Next Step"
          eyebrow="Lane balancing"
          description="DCC can absorb ski-transfer demand when GOSNO is strained, then hand travelers back into execution once the lane recovers."
          actions={actions}
        />

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
