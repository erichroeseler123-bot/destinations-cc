export const dynamicParams = false;

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLd from "@/app/components/dcc/JsonLd";
import AirportLinksSection from "@/app/components/dcc/AirportLinksSection";
import LocationMapCard from "@/app/components/dcc/LocationMapCard";
import { getAirportBySlug, getAirportSlugs, getAirportsByCitySlug } from "@/lib/dcc/airports";
import { buildAirportJsonLd, buildBreadcrumbJsonLd, buildFaqJsonLd } from "@/lib/dcc/jsonld";

const BASE_URL = "https://destinationcommandcenter.com";

export function generateStaticParams() {
  return getAirportSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const resolved = await params;
  const airport = getAirportBySlug(resolved.slug);
  if (!airport) return { title: "Airport Guide" };

  const title = `${airport.name} Transfer and Arrival Guide`;
  const description = airport.summary;
  const canonicalPath = `/airports/${airport.slug}`;

  return {
    title,
    description,
    keywords: [
      `${airport.iata} airport`,
      `${airport.cityName} airport transfer`,
      `${airport.iata} transfer guide`,
      `${airport.cityName} arrival logistics`,
      `${airport.name} transportation`,
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

export default async function AirportPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolved = await params;
  const airport = getAirportBySlug(resolved.slug);
  if (!airport) notFound();

  const cityHref = airport.citySlug ? `/${airport.citySlug}` : null;
  const nearbyAirports =
    airport.citySlug
      ? getAirportsByCitySlug(airport.citySlug).filter((entry) => entry.slug !== airport.slug)
      : [];

  return (
    <main className="max-w-6xl mx-auto px-6 py-16 space-y-10">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            buildAirportJsonLd({
              path: `/airports/${airport.slug}`,
              name: airport.name,
              description: airport.summary,
              address: {
                locality: airport.cityName,
                region: airport.state,
                country: airport.country,
              },
              geo: {
                lat: airport.lat,
                lng: airport.lng,
              },
              servedCityPath: cityHref || undefined,
              servedCityName: airport.cityName,
            }),
            buildBreadcrumbJsonLd([
              { name: "Home", item: "/" },
              { name: "Airports", item: "/airports" },
              { name: airport.name, item: `/airports/${airport.slug}` },
            ]),
            buildFaqJsonLd(airport.faq),
          ],
        }}
      />

      <header className="space-y-3 overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(61,243,255,0.12),transparent_30%),radial-gradient(circle_at_top_right,rgba(255,176,124,0.14),transparent_28%),linear-gradient(180deg,rgba(9,15,31,0.96),rgba(7,11,25,0.96))] p-8 shadow-[0_28px_80px_rgba(0,0,0,0.45)]">
        <div className="inline-flex rounded-full border border-white/12 bg-white/6 px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-[#8fd0ff]">
          Airport arrival guide
        </div>
        <p className="mt-4 text-xs uppercase tracking-wider text-zinc-500">
          {airport.iata} • {airport.cityName}
        </p>
        <h1 className="text-4xl font-black tracking-tight">{airport.name}</h1>
        <p className="text-zinc-300 max-w-3xl">{airport.summary}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          {cityHref ? (
            <Link
              href={cityHref}
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#3df3ff] px-6 text-sm font-black uppercase tracking-[0.16em] text-[#07111d] transition hover:bg-[#62f6ff]"
            >
              Open {airport.cityName} guide
            </Link>
          ) : null}
          {airport.nearbyCruisePortSlugs?.[0] ? (
            <Link
              href={`/cruises/port/${airport.nearbyCruisePortSlugs[0]}`}
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/14 bg-white/6 px-6 text-sm font-black uppercase tracking-[0.16em] text-white transition hover:bg-white/10"
            >
              Open nearby cruise port
            </Link>
          ) : null}
        </div>
        <p className="text-sm text-zinc-500">Canonical route: /airports/{airport.slug}</p>
      </header>

      <LocationMapCard
        title={`${airport.name} map and directions`}
        label={`${airport.name} (${airport.iata})`}
        lat={airport.lat}
        lng={airport.lng}
        description={`Use this as a fast airport location anchor for ${airport.cityName}. DCC keeps the first render light, then hands the traveler into a full map app only when transfer or direction intent becomes real.`}
        nearbyLinks={[
          ...(cityHref ? [{ href: cityHref, label: `${airport.cityName} guide` }] : []),
          ...(airport.nearbyCruisePortSlugs?.slice(0, 1).map((slug) => ({
            href: `/cruises/port/${slug}`,
            label: "Cruise port guide",
          })) || []),
          ...(airport.nearbyPortSlugs?.slice(0, 1).map((slug) => ({
            href: `/ports/${slug}`,
            label: "Port authority page",
          })) || []),
        ]}
      />

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-2xl font-bold">How to use this airport page</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4 text-sm leading-7 text-zinc-300">
            <p>{airport.transferFocus}</p>
            <p>
              Airport pages are stronger than generic transport blurbs because they route the traveler into the right city, port, or cruise decision after the arrival problem is clarified.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <div className="text-xs uppercase tracking-[0.18em] text-cyan-300">Best next clicks</div>
            <div className="mt-4 grid gap-3">
              {cityHref ? (
                <Link href={cityHref} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm hover:bg-white/10">
                  {airport.cityName} guide
                </Link>
              ) : null}
              {airport.nearbyCruisePortSlugs?.slice(0, 1).map((slug) => (
                <Link key={slug} href={`/cruises/port/${slug}`} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm hover:bg-white/10">
                  Cruise port page
                </Link>
              ))}
              {airport.nearbyPortSlugs?.slice(0, 1).map((slug) => (
                <Link key={slug} href={`/ports/${slug}`} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm hover:bg-white/10">
                  Port authority page
                </Link>
              ))}
              <Link href="/airports" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm hover:bg-white/10">
                Airports directory
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-2xl font-bold">What this airport is best for</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {airport.knownFor.map((item) => (
            <article key={item} className="rounded-xl border border-white/10 bg-black/20 p-4">
              <p className="text-sm text-zinc-300">{item}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-2xl font-bold">Arrival timing is the real transfer constraint</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4 text-sm leading-7 text-zinc-300">
            <p>
              Most airport plans look simple until flight timing, baggage claim, or late arrivals stretch the first transfer more than expected. Travelers usually do not break the trip on the attraction side first. They break it by assuming the airport exit will be faster and cleaner than it really is.
            </p>
            <p>
              That is why airport routing works best when the first transfer decision is solved before the rest of the day is stacked on top of it.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <div className="text-xs uppercase tracking-[0.18em] text-cyan-300">Plan arrival in this order</div>
            <div className="mt-4 grid gap-3">
              {[
                "1. When you land",
                "2. How you are getting to the city, hotel, or port",
                "3. Then what you are doing after arrival",
              ].map((item) => (
                <div key={item} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-200">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {nearbyAirports.length ? (
        <AirportLinksSection
          title={`Other airport options around ${airport.cityName}`}
          intro={`Use these when the traveler is comparing airport choice, transfer friction, and arrival strategy instead of assuming one airport is always the right answer.`}
          airports={nearbyAirports}
        />
      ) : null}

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-2xl font-bold">Common airport questions</h2>
        <div className="mt-4 space-y-4">
          {airport.faq.map((item) => (
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
