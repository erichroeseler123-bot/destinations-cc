export const dynamicParams = false;

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLd from "@/app/components/dcc/JsonLd";
import AirportLinksSection from "@/app/components/dcc/AirportLinksSection";
import LocationMapCard from "@/app/components/dcc/LocationMapCard";
import StationLinksSection from "@/app/components/dcc/StationLinksSection";
import { getAirportsByCitySlug } from "@/lib/dcc/airports";
import {
  getStationBySlug,
  getStationSlugs,
  getStationsByCitySlug,
  getStationSubtypeLabel,
} from "@/lib/dcc/stations";
import { buildBreadcrumbJsonLd, buildFaqJsonLd, buildTransitStationJsonLd } from "@/lib/dcc/jsonld";

const BASE_URL = "https://destinationcommandcenter.com";

export function generateStaticParams() {
  return getStationSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const resolved = await params;
  const station = getStationBySlug(resolved.slug);
  if (!station) return { title: "Station Guide" };

  const title = `${station.name} Transfer and Arrival Guide`;
  const description = station.summary;
  const canonicalPath = `/stations/${station.slug}`;

  return {
    title,
    description,
    keywords: [
      `${station.name} guide`,
      `${station.cityName} ${station.subtype === "train-station" ? "train station" : "bus station"}`,
      `${station.cityName} transfer planning`,
      `${station.name} transportation`,
      `${station.cityName} transit arrival`,
    ],
    alternates: { canonical: canonicalPath },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}${canonicalPath}`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function StationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolved = await params;
  const station = getStationBySlug(resolved.slug);
  if (!station) notFound();

  const cityHref = station.citySlug ? `/${station.citySlug}` : null;
  const nearbyStations =
    station.citySlug
      ? getStationsByCitySlug(station.citySlug).filter((entry) => entry.slug !== station.slug)
      : [];
  const nearbyAirports = station.citySlug ? getAirportsByCitySlug(station.citySlug) : [];

  const nextClickLinks = [
    ...(cityHref ? [{ href: cityHref, label: `${station.cityName} guide` }] : []),
    ...(station.nearbyCruisePortSlugs?.slice(0, 1).map((slug) => ({
      href: `/cruises/port/${slug}`,
      label: "Cruise port page",
    })) || []),
    ...(station.nearbyPortSlugs?.slice(0, 1).map((slug) => ({
      href: `/ports/${slug}`,
      label: "Port authority page",
    })) || []),
    ...(station.nearbyVenueSlugs?.slice(0, 1).map((slug) => ({
      href: `/transportation/venues/${slug}`,
      label: "Venue transportation",
    })) || []),
  ];

  return (
    <main className="mx-auto max-w-6xl space-y-10 px-6 py-16">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            buildTransitStationJsonLd({
              path: `/stations/${station.slug}`,
              subtype: station.subtype,
              name: station.name,
              description: station.summary,
              address: {
                locality: station.cityName,
                region: station.state,
                country: station.country,
              },
              geo: {
                lat: station.lat,
                lng: station.lng,
              },
              servedCityPath: cityHref || undefined,
              servedCityName: station.cityName,
            }),
            buildBreadcrumbJsonLd([
              { name: "Home", item: "/" },
              { name: "Stations", item: "/stations" },
              { name: station.name, item: `/stations/${station.slug}` },
            ]),
            buildFaqJsonLd(station.faq),
          ],
        }}
      />

      <header className="space-y-3 overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(61,243,255,0.12),transparent_30%),radial-gradient(circle_at_top_right,rgba(255,176,124,0.14),transparent_28%),linear-gradient(180deg,rgba(9,15,31,0.96),rgba(7,11,25,0.96))] p-8 shadow-[0_28px_80px_rgba(0,0,0,0.45)]">
        <div className="inline-flex rounded-full border border-white/12 bg-white/6 px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-[#8fd0ff]">
          {getStationSubtypeLabel(station.subtype)}
        </div>
        <p className="mt-4 text-xs uppercase tracking-wider text-zinc-500">
          {station.cityName} • {station.operator || "Transit anchor"}
        </p>
        <h1 className="text-4xl font-black tracking-tight">{station.name}</h1>
        <p className="max-w-3xl text-zinc-300">{station.summary}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          {cityHref ? (
            <Link
              href={cityHref}
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#3df3ff] px-6 text-sm font-black uppercase tracking-[0.16em] text-[#07111d] transition hover:bg-[#62f6ff]"
            >
              Open {station.cityName} guide
            </Link>
          ) : null}
          {station.nearbyCruisePortSlugs?.[0] ? (
            <Link
              href={`/cruises/port/${station.nearbyCruisePortSlugs[0]}`}
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/14 bg-white/6 px-6 text-sm font-black uppercase tracking-[0.16em] text-white transition hover:bg-white/10"
            >
              Open nearby cruise port
            </Link>
          ) : null}
          {station.nearbyVenueSlugs?.[0] ? (
            <Link
              href={`/transportation/venues/${station.nearbyVenueSlugs[0]}`}
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/14 bg-white/6 px-6 text-sm font-black uppercase tracking-[0.16em] text-white transition hover:bg-white/10"
            >
              Open nearby venue
            </Link>
          ) : null}
        </div>
        <p className="text-sm text-zinc-500">Canonical route: /stations/{station.slug}</p>
      </header>

      <LocationMapCard
        title={`${station.name} map and directions`}
        label={station.name}
        lat={station.lat}
        lng={station.lng}
        description={`Use this as a fast location anchor for ${station.name}. DCC keeps the first render light, then hands the traveler into a full map app only when station-to-city, station-to-port, or station-to-venue direction intent becomes real.`}
        nearbyLinks={nextClickLinks}
      />

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-2xl font-bold">How to use this station page</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4 text-sm leading-7 text-zinc-300">
            <p>{station.transferFocus}</p>
            <p>
              Station pages help when the trip starts with a rail or bus arrival and the real next question is where to route the traveler: downtown, port, hotel, or venue corridor.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <div className="text-xs uppercase tracking-[0.18em] text-cyan-300">Best next clicks</div>
            <div className="mt-4 grid gap-3">
              {nextClickLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm hover:bg-white/10"
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/stations"
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm hover:bg-white/10"
              >
                Stations directory
              </Link>
            </div>
          </div>
        </div>
      </section>

      {station.routeIdeas?.length ? (
        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-bold">High-intent route ideas</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {station.routeIdeas.map((idea) => (
              <Link
                key={idea.label}
                href={idea.href}
                className="rounded-xl border border-white/10 bg-black/20 p-5 transition hover:bg-white/10"
              >
                <div className="text-sm font-bold text-cyan-200">{idea.label}</div>
                <p className="mt-2 text-sm leading-6 text-zinc-300">{idea.note}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-2xl font-bold">What this station is best for</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {station.knownFor.map((item) => (
            <article key={item} className="rounded-xl border border-white/10 bg-black/20 p-4">
              <p className="text-sm text-zinc-300">{item}</p>
            </article>
          ))}
        </div>
      </section>

      {nearbyStations.length ? (
        <StationLinksSection
          title={`Other transit anchors around ${station.cityName}`}
          intro={`Use these when the traveler is comparing train-versus-bus arrival logic, downtown staging, or which transit side of ${station.cityName} fits the trip best.`}
          stations={nearbyStations}
        />
      ) : null}

      {nearbyAirports.length ? (
        <AirportLinksSection
          title={`Airports that interact with ${station.cityName} arrivals`}
          intro={`Use airport pages when the traveler is still comparing air versus rail or bus arrival strategy before committing to the rest of the plan.`}
          airports={nearbyAirports}
        />
      ) : null}

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-2xl font-bold">Common station questions</h2>
        <div className="mt-4 space-y-4">
          {station.faq.map((item) => (
            <article key={item.question} className="rounded-xl border border-white/10 bg-black/20 p-5">
              <h3 className="font-semibold text-white">{item.question}</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-300">{item.answer}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
