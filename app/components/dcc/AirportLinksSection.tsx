import Link from "next/link";
import type { AirportView } from "@/lib/dcc/airports";

export default function AirportLinksSection({
  title,
  intro,
  airports,
}: {
  title: string;
  intro: string;
  airports: AirportView[];
}) {
  if (!airports.length) return null;

  return (
    <section className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(8,13,26,0.96),rgba(6,9,18,0.96))] p-6 sm:p-8">
      <div className="text-[11px] font-black uppercase tracking-[0.22em] text-[#8fd0ff]">Arrival routing</div>
      <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.03em] sm:text-3xl">{title}</h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-white/70">{intro}</p>
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {airports.map((airport) => (
          <Link
            key={airport.slug}
            href={`/airports/${airport.slug}`}
            className="rounded-[26px] border border-white/10 bg-[#0b1224] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.35)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_80px_rgba(0,0,0,0.42)]"
          >
            <div className="text-[11px] font-black uppercase tracking-[0.22em] text-[#ffb07c]">{airport.iata}</div>
            <h3 className="mt-3 text-xl font-black uppercase tracking-[-0.03em] text-white">{airport.name}</h3>
            <p className="mt-3 text-sm leading-6 text-white/70">{airport.transferFocus}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-zinc-200">
                {airport.cityName}
              </span>
              <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-zinc-200">
                {airport.state}
              </span>
            </div>
            <div className="mt-5 text-sm font-bold text-[#3df3ff]">Open airport guide →</div>
          </Link>
        ))}
      </div>
    </section>
  );
}
