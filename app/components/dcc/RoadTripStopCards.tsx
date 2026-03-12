import Link from "next/link";
import { getRoadTripStopHref, type RoadTripStop } from "@/src/data/road-trip-stops-registry";

export default function RoadTripStopCards({ title, intro, stops }: { title: string; intro: string; stops: RoadTripStop[] }) {
  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.26)]">
      <div className="max-w-3xl">
        <h2 className="text-2xl font-bold">{title}</h2>
        <p className="mt-3 text-zinc-300">{intro}</p>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {stops.map((stop) => (
          <Link
            key={stop.slug}
            href={getRoadTripStopHref(stop)}
            className="rounded-[1.4rem] border border-white/10 bg-black/25 p-5 hover:bg-white/10"
          >
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">{stop.stopType.replace(/-/g, " ")}</p>
            <h3 className="mt-2 text-lg font-semibold text-white">{stop.title}</h3>
            <p className="mt-3 text-sm text-zinc-300">{stop.summary}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {stop.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-zinc-300"
                >
                  {tag.replace(/-/g, " ")}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
