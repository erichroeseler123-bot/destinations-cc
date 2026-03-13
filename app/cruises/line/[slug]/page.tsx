import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import DiagnosticsBlock from "@/app/components/DiagnosticsBlock";
import StatGrid from "@/app/components/StatGrid";
import {
  buildCruisePayload,
  slugifyCruiseRoute,
} from "@/lib/dcc/internal/cruisePayload";
import {
  getCruiseLineConfig,
  listCruiseLineSlugs,
} from "@/src/data/cruise-lines-config";
import { getShipAuthorityConfig } from "@/src/data/ship-authority-config";

const BASE_URL = "https://destinationcommandcenter.com";

export const dynamicParams = false;

export function generateStaticParams() {
  return listCruiseLineSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const resolved = await params;
  const line = getCruiseLineConfig(resolved.slug);
  if (!line) return {};

  const title = `${line.name} Cruises | Ships, Ports, and Sailings`;
  return {
    title,
    description: line.summary,
    alternates: { canonical: `/cruises/line/${line.slug}` },
    openGraph: {
      title,
      description: line.summary,
      url: `${BASE_URL}/cruises/line/${line.slug}`,
      type: "website",
    },
  };
}

function fmtDate(value: string): string {
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return value;
  return dt.toISOString().slice(0, 10);
}

export default async function CruiseLinePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolved = await params;
  const line = getCruiseLineConfig(resolved.slug);
  if (!line) notFound();

  const payload = await buildCruisePayload({ type: "line", value: line.slug });
  if (!payload || payload.cruises.length === 0) notFound();

  const uniqueShips = Array.from(
    new Map(
      payload.cruises.map((sailing) => {
        const shipSlug = slugifyCruiseRoute(sailing.ship_slug || sailing.ship);
        return [shipSlug, { slug: shipSlug, name: sailing.ship }];
      })
    ).values()
  );

  const uniquePorts = Array.from(
    new Map(
      payload.cruises.flatMap((sailing) =>
        sailing.ports.map((port) => {
          const portSlug = slugifyCruiseRoute(port.port_name);
          return [portSlug, { slug: portSlug, name: port.port_name }];
        })
      )
    ).values()
  ).slice(0, 8);

  return (
    <main className="max-w-6xl mx-auto px-6 py-16 space-y-10">
      <header className="space-y-4 border-b border-white/10 pb-8">
        <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">Cruise Line View</p>
        <h1 className="text-4xl font-black tracking-tight">{line.name}</h1>
        <p className="max-w-3xl text-zinc-300">{line.summary}</p>
      </header>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4">
          <h2 className="text-2xl font-bold">Line snapshot</h2>
          <StatGrid
            items={[
              { label: "Ship profiles live", value: uniqueShips.length },
              { label: "Upcoming sailings", value: payload.cruises.length },
              { label: "Featured ports", value: uniquePorts.length },
            ]}
          />
          <div className="flex flex-wrap gap-2">
            {line.bestFor.map((item) => (
              <span
                key={item}
                className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-sm text-zinc-200"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4">
          <h2 className="text-2xl font-bold">Fleet style</h2>
          <ul className="space-y-2 text-zinc-300">
            {line.fleetStyle.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Fleet</p>
          <h2 className="mt-2 text-2xl font-bold">Ships in this line</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {uniqueShips.map((ship) => {
            const shipConfig = getShipAuthorityConfig(ship.slug);
            return (
              <Link
                key={ship.slug}
                href={`/cruises/ship/${ship.slug}`}
                className="rounded-2xl border border-white/10 bg-black/20 p-5 hover:bg-white/10"
              >
                <div className="space-y-2">
                  <div className="text-sm uppercase tracking-[0.18em] text-zinc-500">Ship profile</div>
                  <h3 className="text-xl font-semibold text-white">{ship.name}</h3>
                  <p className="text-sm text-zinc-300">
                    {shipConfig ? shipConfig.bestFor.slice(0, 2).join(" • ") : "Schedule and sailings view"}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Ports</p>
            <h2 className="mt-2 text-2xl font-bold">Ports this line touches</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {uniquePorts.map((port) => (
              <Link
                key={port.slug}
                href={`/cruises/port/${port.slug}`}
                className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-zinc-200 hover:bg-white/10"
              >
                {port.name}
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-bold">Upcoming sailings</h2>
            <span className="text-xs uppercase tracking-[0.22em] text-zinc-500">
              {payload.summary?.total_results ?? payload.cruises.length} results
            </span>
          </div>
          <div className="space-y-3">
            {payload.cruises.slice(0, 8).map((sailing) => (
              <article
                key={sailing.sailing_id}
                className="rounded-2xl border border-white/10 bg-black/20 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{sailing.ship}</h3>
                    <p className="text-sm text-zinc-400">
                      {fmtDate(sailing.departure_date)} • {sailing.duration_days} days
                    </p>
                  </div>
                  <Link
                    href={`/cruises/ship/${slugifyCruiseRoute(sailing.ship_slug || sailing.ship)}`}
                    className="text-cyan-300 hover:text-cyan-200"
                  >
                    Ship page →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Related links</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {line.relatedLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-zinc-200 hover:bg-white/10"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </section>

      <DiagnosticsBlock
        diagnostics={payload.diagnostics}
        extraLine={payload.summary?.sort_mode ? `sort_mode=${payload.summary.sort_mode}` : null}
      />
    </main>
  );
}
