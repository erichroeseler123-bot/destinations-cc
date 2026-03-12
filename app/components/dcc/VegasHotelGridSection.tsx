import Link from "next/link";
import type { VegasHotel, VegasHotelTag } from "@/src/data/vegas-hotels-config";

function formatTag(tag: VegasHotelTag) {
  return tag
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function VegasHotelGridSection({
  title,
  intro,
  hotels,
}: {
  title: string;
  intro: string;
  hotels: VegasHotel[];
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="max-w-3xl">
        <h2 className="text-3xl font-black tracking-tight">{title}</h2>
        <p className="mt-3 text-zinc-300">{intro}</p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {hotels.map((hotel) => (
          <article key={hotel.slug} className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-bold">{hotel.name}</h3>
                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-zinc-500">
                  {hotel.area.replace("-", " ")} · {hotel.tier.replace("-", " ")}
                </p>
              </div>
              {hotel.tags.includes("casino") ? (
                <span className="rounded-full border border-amber-400/30 px-2 py-1 text-[11px] uppercase tracking-[0.18em] text-amber-200">
                  Casino
                </span>
              ) : null}
            </div>

            <p className="mt-3 text-sm text-zinc-300">{hotel.summary}</p>

            <div className="mt-4 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.16em] text-zinc-400">
              {hotel.tags.slice(0, 5).map((tag) => (
                <span key={tag} className="rounded-full border border-white/10 px-2 py-1">
                  {formatTag(tag)}
                </span>
              ))}
            </div>

            <div className="mt-4">
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Known for</p>
              <p className="mt-2 text-sm text-zinc-300">{hotel.famousFor.join(" · ")}</p>
            </div>

            <div className="mt-4">
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Connects to</p>
              <p className="mt-2 text-sm text-zinc-300">{hotel.nearbyHooks.join(" · ")}</p>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/vegas" className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm text-zinc-200 hover:bg-white/10">
          Back to Vegas hub
        </Link>
        <Link href="/las-vegas-strip" className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm text-zinc-200 hover:bg-white/10">
          Las Vegas Strip pillar
        </Link>
        <Link href="/las-vegas/shows" className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm text-zinc-200 hover:bg-white/10">
          Las Vegas shows
        </Link>
      </div>
    </section>
  );
}
