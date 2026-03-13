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
      <header className="space-y-1">
        <h2 className="text-2xl md:text-3xl font-bold text-white">{title}</h2>
        {subtitle ? <p className="text-zinc-400">{subtitle}</p> : null}
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cities.map((c) => (
          <Link
            key={c.id}
            href={`/${c.slug}`}
            className="rounded-2xl border border-white/10 bg-white/5 hover:bg-white/7 transition p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-lg font-semibold text-white truncate">{c.name}</div>
                <div className="text-sm text-zinc-400 truncate">
                  {c.admin?.country || "—"}
                  {c.admin?.region_code ? ` • ${c.admin.region_code}` : ""}
                  {typeof c.metrics?.population === "number"
                    ? ` • Pop ${c.metrics.population.toLocaleString()}`
                    : ""}
                </div>
                <div className="text-xs text-zinc-500 mt-1 truncate">/{c.slug}</div>
              </div>

              <div className="text-xs text-cyan-300 shrink-0">Open →</div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
