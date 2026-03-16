import Link from "next/link";
import { CityNode } from "@/lib/data/locations";

export default function CityGrid({
  title,
  subtitle,
  cities,
}: {
  title: string;
  subtitle?: string;
  cities: CityNode[];
}) {
  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <div className="text-[11px] font-black uppercase tracking-[0.28em] text-[#f5c66c]">City Network</div>
        <h2 className="text-2xl md:text-3xl font-black uppercase text-white">{title}</h2>
        {subtitle ? <p className="max-w-3xl text-[#f8f4ed]/66">{subtitle}</p> : null}
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cities.map((c) => (
          <Link
            key={c.id}
            href={`/${c.slug}`}
            className="rounded-[1.65rem] border border-white/10 bg-[linear-gradient(180deg,rgba(24,21,18,0.86),rgba(15,13,12,0.92))] p-5 transition hover:-translate-y-0.5 hover:border-[#f5c66c]/30 hover:bg-white/[0.04]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[11px] font-black uppercase tracking-[0.22em] text-[#f5c66c]">Destination</div>
                <div className="mt-3 truncate text-lg font-black uppercase text-white">{c.name}</div>
                <div className="mt-2 truncate text-sm text-[#f8f4ed]/66">
                  {c.admin?.country || "—"}
                  {c.admin?.region_code ? ` • ${c.admin.region_code}` : ""}
                  {typeof c.metrics?.population === "number"
                    ? ` • Pop ${c.metrics.population.toLocaleString()}`
                    : ""}
                </div>
                <div className="mt-2 truncate text-xs uppercase tracking-[0.16em] text-[#f8f4ed]/42">/{c.slug}</div>
              </div>

              <div className="shrink-0 text-xs font-black uppercase tracking-[0.16em] text-[#efe5d3]">Open</div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
