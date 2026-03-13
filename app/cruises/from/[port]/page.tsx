import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import DiagnosticsBlock from "@/app/components/DiagnosticsBlock";
import StatGrid from "@/app/components/StatGrid";
import {
  buildEmbarkCruisePayload,
  getCruiseEmbarkPortCanonicalSlug,
  listCruiseEmbarkPortSlugs,
  slugifyCruiseRoute,
} from "@/lib/dcc/internal/cruisePayload";

const BASE_URL = "https://destinationcommandcenter.com";

export const dynamicParams = false;

export function generateStaticParams() {
  return listCruiseEmbarkPortSlugs().map((port) => ({ port }));
}

function fmtDate(value: string): string {
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return value;
  return dt.toISOString().slice(0, 10);
}

function toTitle(input: string): string {
  return input
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function summarizeDestinations(
  cruises: Awaited<ReturnType<typeof buildEmbarkCruisePayload>>["cruises"],
  canonicalPort: string
) {
  const counts = new Map<string, number>();
  for (const sailing of cruises) {
    for (const port of sailing.ports) {
      const slug = slugifyCruiseRoute(port.port_name);
      if (!slug || slug === canonicalPort || slug === "at-sea") continue;
      counts.set(port.port_name, (counts.get(port.port_name) || 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
}

function JsonLd({
  pageUrl,
  title,
  portName,
  cruises,
}: {
  pageUrl: string;
  title: string;
  portName: string;
  cruises: Awaited<ReturnType<typeof buildEmbarkCruisePayload>>["cruises"];
}) {
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": pageUrl,
        url: pageUrl,
        name: title,
        description:
          "Cruise departures by embarkation port with ship choices, departure dates, and route context.",
      },
      {
        "@type": "ItemList",
        name: `Cruises from ${portName}`,
        itemListElement: cruises.slice(0, 24).map((sailing, idx) => ({
          "@type": "ListItem",
          position: idx + 1,
          item: {
            "@type": "Trip",
            name: `${sailing.ship} from ${portName}`,
            departureTime: sailing.departure_date,
            provider: {
              "@type": "Organization",
              name: sailing.line,
            },
            offers:
              typeof sailing.starting_price?.amount === "number"
                ? {
                    "@type": "Offer",
                    price: sailing.starting_price.amount,
                    priceCurrency: sailing.starting_price.currency || "USD",
                  }
                : undefined,
          },
        })),
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ port: string }>;
}): Promise<Metadata> {
  const resolved = await params;
  const canonicalPort = getCruiseEmbarkPortCanonicalSlug(resolved.port);
  const payload = await buildEmbarkCruisePayload({ port: canonicalPort });
  const portName = payload.cruises[0]?.embark_port.port_name.split(",")[0] || toTitle(canonicalPort);
  const canonicalPath = `/cruises/from/${canonicalPort}`;

  return {
    title: `Cruises from ${portName} | Departure Planner`,
    description: `Compare cruise ships and upcoming departures from ${portName} with route context and linked ship guides.`,
    alternates: { canonical: canonicalPath },
    openGraph: {
      title: `Cruises from ${portName}`,
      description:
        "Departure-focused cruise planner with ships, dates, and route context.",
      url: `${BASE_URL}${canonicalPath}`,
      type: "website",
    },
  };
}

export default async function CruisesFromPortPage({
  params,
}: {
  params: Promise<{ port: string }>;
}) {
  const resolved = await params;
  const payload = await buildEmbarkCruisePayload({ port: resolved.port });

  if (!payload.cruises.length) {
    return notFound();
  }

  const canonicalPort = payload.query.port;
  const canonicalPath = `/cruises/from/${canonicalPort}`;
  const first = payload.cruises[0];
  const portName = first.embark_port.port_name.split(",")[0] || toTitle(canonicalPort);
  const destinationCounts = summarizeDestinations(payload.cruises, canonicalPort);
  const lines = Array.from(new Set(payload.cruises.map((sailing) => sailing.line))).slice(0, 5);

  return (
    <main className="max-w-6xl mx-auto px-6 py-16 space-y-10">
      <JsonLd
        pageUrl={`${BASE_URL}${canonicalPath}`}
        title={`Cruises from ${portName}`}
        portName={portName}
        cruises={payload.cruises}
      />

      <header className="space-y-3 border-b border-white/10 pb-8">
        <p className="text-xs uppercase tracking-wider text-zinc-500">Cruise Departure Planner</p>
        <h1 className="text-4xl font-black tracking-tight">Cruises from {portName}</h1>
        <p className="text-zinc-300 max-w-3xl">
          Compare ships, dates, and destination patterns leaving from {portName}. Use this page to
          choose the right departure lane before drilling into ship guides and port logistics.
        </p>
        <p className="text-sm text-zinc-500">Canonical route: {canonicalPath}</p>
      </header>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
        <h2 className="text-xl font-semibold">Trip Planning Snapshot</h2>
        <StatGrid
          items={[
            { label: "Upcoming departures", value: payload.summary?.total_results || payload.cruises.length },
            {
              label: "Typical length",
              value:
                payload.summary && payload.summary.min_duration_days === payload.summary.max_duration_days
                  ? `${payload.summary.min_duration_days} nights`
                  : `${payload.summary?.min_duration_days || 0}-${payload.summary?.max_duration_days || 0} nights`,
            },
            {
              label: "Price range",
              value: payload.summary?.price_range
                ? `${payload.summary.price_range.currency} ${payload.summary.price_range.min}-${payload.summary.price_range.max}`
                : "Pricing varies",
            },
            { label: "Popular lines", value: lines.join(", ") || "Mixed" },
          ]}
        />
        <p className="text-zinc-300">
          {payload.context.risk_summary ||
            `Use embark day, ship size, and itinerary length together. ${portName} departures can feel very different depending on whether you want a fast Bahamas loop, a longer Caribbean run, or a premium ship-first trip.`}
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.4fr,0.9fr]">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
          <h2 className="text-xl font-semibold">Upcoming departures</h2>
          <div className="space-y-4">
            {payload.cruises.map((sailing) => (
              <article
                key={sailing.sailing_id}
                className="rounded-xl border border-white/10 bg-black/20 p-5 space-y-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-zinc-100">{sailing.ship}</h3>
                    <p className="text-sm text-zinc-400">
                      {sailing.line} • Departs {fmtDate(sailing.departure_date)} • {sailing.duration_days} nights
                    </p>
                  </div>
                  {typeof sailing.starting_price?.amount === "number" ? (
                    <div className="text-right">
                      <div className="text-xs uppercase tracking-wider text-zinc-500">Starting from</div>
                      <div className="font-semibold text-cyan-300">
                        {sailing.starting_price.currency} {sailing.starting_price.amount}
                      </div>
                    </div>
                  ) : null}
                </div>

                <p className="text-sm text-zinc-300">
                  Route: {sailing.ports.map((port) => port.port_name).join(" -> ")}
                </p>

                <div className="flex flex-wrap gap-4 text-sm">
                  <Link
                    href={`/cruises/ship/${slugifyCruiseRoute(sailing.ship_slug || sailing.ship)}`}
                    className="text-cyan-300 hover:text-cyan-200"
                  >
                    View ship guide →
                  </Link>
                  <Link
                    href={`/cruises/port/${slugifyCruiseRoute(sailing.embark_port.port_name)}`}
                    className="text-zinc-300 hover:text-zinc-100"
                  >
                    Embark port logistics →
                  </Link>
                  {sailing.external_booking_url ? (
                    <a
                      href={sailing.external_booking_url}
                      target="_blank"
                      rel="noopener noreferrer sponsored nofollow"
                      className="text-emerald-300 hover:text-emerald-200"
                    >
                      Check provider site →
                    </a>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </div>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-3">
            <h2 className="text-xl font-semibold">Popular destination pattern</h2>
            {destinationCounts.length ? (
              <ul className="space-y-2 text-sm text-zinc-300">
                {destinationCounts.map(([name, count]) => (
                  <li key={name} className="flex items-center justify-between gap-3">
                    <span>{name}</span>
                    <span className="text-zinc-500">{count} sailings</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-zinc-400">Destination counts are still building for this embark port.</p>
            )}
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-3">
            <h2 className="text-xl font-semibold">Planning links</h2>
            <div className="flex flex-col gap-3 text-sm">
              <Link href={`/cruises/port/${canonicalPort}`} className="text-zinc-200 hover:text-white">
                Embark port schedule and logistics →
              </Link>
              <Link href="/cruises/shore-excursions" className="text-zinc-200 hover:text-white">
                Shore excursions guide →
              </Link>
              <Link href="/cruises/tendering" className="text-zinc-200 hover:text-white">
                Tendering guide →
              </Link>
              <Link href="/cruises" className="text-zinc-200 hover:text-white">
                Back to cruise explorer →
              </Link>
            </div>
          </section>
        </aside>
      </section>

      <DiagnosticsBlock
        diagnostics={payload.diagnostics}
        extraLine={payload.summary?.sort_mode ? `sort_mode=${payload.summary.sort_mode}` : null}
      />
    </main>
  );
}
