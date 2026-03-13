import Link from "next/link";
import type { CruiseSpecialtyLane } from "@/src/data/cruise-specialty-lanes";

type CruiseSpecialtyLaneSectionProps = {
  title: string;
  description: string;
  lanes: CruiseSpecialtyLane[];
  contextType: "ship" | "port";
  contextName: string;
};

function buildLaneQuery(lane: CruiseSpecialtyLane, contextName: string): string {
  return `${contextName} ${lane.viatorQuery || lane.intents[0]?.query || "cruise excursions"}`.trim();
}

export default function CruiseSpecialtyLaneSection({
  title,
  description,
  lanes,
  contextType,
  contextName,
}: CruiseSpecialtyLaneSectionProps) {
  if (lanes.length === 0) return null;

  return (
    <section className="rounded-3xl border border-fuchsia-400/20 bg-[linear-gradient(180deg,rgba(217,70,239,0.08),rgba(255,255,255,0.03))] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.35)]">
      <div className="space-y-4">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.22em] text-fuchsia-300">Specialty Cruise Lanes</p>
          <h2 className="text-2xl font-bold md:text-3xl">{title}</h2>
          <p className="max-w-3xl text-zinc-300">{description}</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {lanes.map((lane) => (
            <article
              key={lane.key}
              className="rounded-2xl border border-white/10 bg-black/20 p-5 space-y-4"
            >
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/cruises/themed/${lane.key}`}
                    className="rounded-full border border-fuchsia-400/30 bg-fuchsia-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-fuchsia-200 hover:bg-fuchsia-500/20"
                  >
                    {lane.key} lane
                  </Link>
                  {lane.tags?.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <h3 className="text-xl font-semibold text-white">{lane.title}</h3>
                <p className="text-sm text-zinc-300">{lane.description}</p>
              </div>

              {lane.organizers?.length ? (
                <p className="text-sm text-zinc-400">
                  Organizers: {lane.organizers.join(", ")}
                </p>
              ) : null}

              <div className="grid gap-2 sm:grid-cols-2">
                <Link
                  href={`/cruises/themed/${lane.key}`}
                  className="inline-flex items-center justify-center rounded-2xl bg-fuchsia-500 px-4 py-3 font-semibold text-white hover:bg-fuchsia-400"
                >
                  Open {lane.key} lane
                </Link>
                <Link
                  href={`/tours?q=${encodeURIComponent(buildLaneQuery(lane, contextName))}`}
                  className="inline-flex items-center justify-center rounded-2xl border border-white/15 px-4 py-3 font-semibold text-zinc-100 hover:bg-white/10"
                >
                  {contextType === "port" ? "Browse themed excursions" : "Browse themed tours"}
                </Link>
              </div>

              <div className="flex flex-wrap gap-2">
                {lane.intents.slice(0, 3).map((intent) => (
                  <Link
                    key={`${lane.key}:${intent.query}`}
                    href={`/tours?q=${encodeURIComponent(intent.query)}`}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-zinc-200 hover:bg-white/10"
                  >
                    {intent.label}
                  </Link>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
