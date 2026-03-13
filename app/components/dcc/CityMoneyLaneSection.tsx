import Link from "next/link";
import type { CityMoneyLaneConfig } from "@/src/data/city-money-lanes";
import { buildCityTrackedHref } from "@/src/lib/city-analytics";
import PoweredByViator from "@/app/components/dcc/PoweredByViator";

export default function CityMoneyLaneSection({
  config,
  tone = "cyan",
}: {
  config: CityMoneyLaneConfig;
  tone?: "cyan" | "amber";
}) {
  const shellClass =
    tone === "amber"
      ? "rounded-2xl border border-amber-400/20 bg-amber-500/5 p-6"
      : "rounded-2xl border border-cyan-400/20 bg-cyan-500/5 p-6";
  const primaryClass =
    tone === "amber"
      ? "inline-flex items-center justify-center rounded-xl bg-amber-500 px-5 py-3 font-semibold text-black hover:bg-amber-400"
      : "inline-flex items-center justify-center rounded-xl bg-cyan-600 px-5 py-3 font-semibold text-white hover:bg-cyan-500";
  const trustClass = tone === "amber" ? "text-zinc-300" : "text-zinc-300";

  return (
    <section className={shellClass}>
      <h2 className="text-2xl font-bold">{config.sectionTitle}</h2>
      <p className="mt-2 text-zinc-300">{config.sectionDescription}</p>
      <p className={`mt-2 text-xs ${trustClass}`}>{config.trustLine}</p>
      <div className="mt-4">
        <PoweredByViator
          compact
          disclosure
          body={`Use DCC to quickly find the best-fit tours, activities, and excursions in ${config.cityName}. When you're ready to book, you can book with DCC via Viator through secure checkout.`}
        />
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <Link
          href={buildCityTrackedHref({
            href: config.primaryCtaHref,
            city: config.cityKey,
            lane: "money",
            sourceSection: "city_money_lane_primary",
          })}
          data-dcc-city={config.cityKey}
          data-dcc-lane="money"
          data-dcc-source-section="city_money_lane_primary"
          className={primaryClass}
        >
          {config.primaryCtaLabel}
        </Link>
        <Link
          href={buildCityTrackedHref({
            href: config.secondaryCtaHref,
            city: config.cityKey,
            lane: "money",
            sourceSection: "city_money_lane_secondary",
          })}
          data-dcc-city={config.cityKey}
          data-dcc-lane="money"
          data-dcc-source-section="city_money_lane_secondary"
          className="inline-flex items-center justify-center rounded-xl border border-white/15 px-5 py-3 font-semibold text-zinc-200 hover:bg-white/10"
        >
          {config.secondaryCtaLabel}
        </Link>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {config.intents.map((intent) => (
          <Link
            key={intent.query}
            href={buildCityTrackedHref({
              href: `/tours?city=${encodeURIComponent(config.cityKey)}&q=${encodeURIComponent(intent.query)}`,
              city: config.cityKey,
              lane: "money",
              sourceSection: "city_money_lane_intent",
              intentQuery: intent.query,
            })}
            data-dcc-city={config.cityKey}
            data-dcc-lane="money"
            data-dcc-source-section="city_money_lane_intent"
            data-dcc-intent-query={intent.query}
            className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-200 hover:bg-white/10"
          >
            {intent.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
