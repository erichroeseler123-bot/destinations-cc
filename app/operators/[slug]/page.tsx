import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import tours from "@/data/tours.json";
import CityTimePanel from "@/app/components/dcc/CityTimePanel";
import JsonLd from "@/app/components/dcc/JsonLd";
import {
  getOperatorManifest,
  listOperatorSlugs,
  type TourOperatorRef,
} from "@/lib/dcc/operators";
import { buildBreadcrumbJsonLd, buildOperatorJsonLd } from "@/lib/dcc/jsonld";

type Tour = {
  id: string | number;
  name: string;
  city?: string;
  description?: string;
  timezone?: string;
  operator?: TourOperatorRef;
};

const allTours = tours as unknown as Tour[];

export function generateStaticParams() {
  return listOperatorSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const operator = getOperatorManifest(slug);
  if (!operator) return { title: "Operator" };

  return {
    title: `${operator.name} Tours and Company Overview`,
    description: `${operator.name} operates local experiences in ${operator.city}. See specialties, areas served, and tours listed on Destination Command Center.`,
    alternates: { canonical: `/operators/${slug}` },
  };
}

export default async function OperatorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const operator = getOperatorManifest(slug);
  if (!operator) notFound();

  const operatorTours = allTours.filter((tour) => tour.operator?.slug === slug);
  const timezone = operatorTours.find((tour) => tour.timezone)?.timezone;

  return (
    <main className="min-h-screen bg-[#050816] text-white">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            buildOperatorJsonLd({
              path: `/operators/${slug}`,
              name: operator.name,
              city: operator.city,
              website: operator.website,
              phone: operator.phone,
              areasServed: operator.areasServed,
            }),
            buildBreadcrumbJsonLd([
              { name: "Home", item: "/" },
              { name: "Operators", item: "/tours" },
              { name: operator.name, item: `/operators/${slug}` },
            ]),
          ],
        }}
      />
      <div className="mx-auto max-w-5xl space-y-8 px-6 py-16">
        <header className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(255,176,124,0.12),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(61,243,255,0.10),transparent_26%),linear-gradient(180deg,rgba(15,23,42,0.96),rgba(7,11,25,0.98))] p-8 shadow-[0_28px_90px_rgba(0,0,0,0.45)] md:p-10">
          <p className="text-xs uppercase tracking-[0.24em] text-[#ffb07c]">Tour operator</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">{operator.name}</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-white/82">
            {operator.overview ||
              `${operator.name} appears on DCC as a local operator connected to tours in ${operator.city}.`}
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm text-white/82">
            <span className="rounded-2xl border border-white/12 bg-white/6 px-4 py-2">{operator.city}</span>
            {operator.founded ? (
              <span className="rounded-2xl border border-white/12 bg-white/6 px-4 py-2">
                Founded {operator.founded}
              </span>
            ) : null}
            {operator.website ? (
              <a
                href={operator.website}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="rounded-2xl border border-white/12 bg-white/6 px-4 py-2 hover:bg-white/10"
              >
                Visit website
              </a>
            ) : null}
          </div>
          {timezone ? (
            <div className="mt-6 max-w-sm">
              <CityTimePanel cityName={operator.city} timezone={timezone} showWeekday />
            </div>
          ) : null}
        </header>

        {operator.specialties && operator.specialties.length > 0 ? (
          <section className="rounded-3xl border border-white/10 bg-white/[0.05] p-6">
            <p className="text-xs uppercase tracking-[0.22em] text-[#8fd0ff]">Specialties</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {operator.specialties.map((specialty) => (
                <span
                  key={specialty}
                  className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs uppercase tracking-[0.14em] text-zinc-300"
                >
                  {specialty}
                </span>
              ))}
            </div>
          </section>
        ) : null}

        {operator.areasServed && operator.areasServed.length > 0 ? (
          <section className="rounded-3xl border border-white/10 bg-white/[0.05] p-6">
            <p className="text-xs uppercase tracking-[0.22em] text-[#8fd0ff]">Areas served</p>
            <div className="mt-4 flex flex-wrap gap-3">
              {operator.areasServed.map((area) => (
                <span key={area} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-2 text-sm text-white/82">
                  {area}
                </span>
              ))}
            </div>
          </section>
        ) : null}

        <section className="rounded-3xl border border-white/10 bg-white/[0.05] p-6">
          <p className="text-xs uppercase tracking-[0.22em] text-[#8fd0ff]">Tours they operate</p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {operatorTours.length > 0 ? (
              operatorTours.map((tour) => (
                <Link
                  key={tour.id}
                  href={`/tours/${tour.id}`}
                  className="rounded-2xl border border-white/10 bg-black/20 p-5 hover:bg-white/[0.08]"
                >
                  <h2 className="text-lg font-semibold text-white">{tour.name}</h2>
                  <p className="mt-2 text-sm text-zinc-300">
                    {tour.city || operator.city}
                  </p>
                  {tour.description ? (
                    <p className="mt-3 text-sm leading-7 text-zinc-400">{tour.description}</p>
                  ) : null}
                </Link>
              ))
            ) : (
              <p className="text-sm text-zinc-400">
                Tours from this operator are not listed yet, but the company profile is available for transparency.
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
