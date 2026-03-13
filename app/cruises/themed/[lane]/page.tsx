import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import BookableToursSection from "@/app/components/dcc/BookableToursSection";
import PoweredByViator from "@/app/components/dcc/PoweredByViator";
import {
  CRUISE_SPECIALTY_LANE_KEYS,
  getCruiseSpecialtyLane,
} from "@/src/data/cruise-specialty-lanes";

const BASE_URL = "https://destinationcommandcenter.com";

export const dynamicParams = false;

export function generateStaticParams() {
  return CRUISE_SPECIALTY_LANE_KEYS.map((lane) => ({ lane }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lane: string }>;
}): Promise<Metadata> {
  const resolved = await params;
  const lane = getCruiseSpecialtyLane(resolved.lane);
  if (!lane) {
    return {};
  }

  const title = `${lane.title} | Cruise Explorer`;
  const description = lane.description;
  const canonical = `/cruises/themed/${lane.key}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}${canonical}`,
      type: "website",
    },
  };
}

export default async function CruiseThemedLanePage({
  params,
}: {
  params: Promise<{ lane: string }>;
}) {
  const resolved = await params;
  const lane = getCruiseSpecialtyLane(resolved.lane);

  if (!lane) {
    notFound();
  }

  const intents = lane.intents.map((intent) => ({
    label: intent.label,
    href: `/tours?q=${encodeURIComponent(intent.query)}`,
  }));

  return (
    <main className="max-w-6xl mx-auto px-6 py-16 space-y-10">
      <header className="space-y-4 border-b border-white/10 pb-8">
        <p className="text-xs uppercase tracking-[0.22em] text-fuchsia-300">Themed Cruise Route</p>
        <h1 className="text-4xl font-black tracking-tight">{lane.title}</h1>
        <p className="max-w-3xl text-zinc-300">{lane.description}</p>
        <div className="flex flex-wrap gap-2">
          {lane.tags?.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-zinc-200"
            >
              {tag}
            </span>
          ))}
        </div>
      </header>

      <BookableToursSection
        cityName={lane.title}
        title={`Plan ${lane.title}`}
        description={`Use this lane to move from cruise theme discovery into shore-day research, port context, and external booking handoffs.`}
        primaryLabel={lane.ctaLabel}
        primaryHref={lane.ctaHref}
        secondaryLabel="Open Cruise Explorer"
        secondaryHref="/cruises"
        intents={intents}
        eyebrow="Book with DCC via Viator"
      />

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Featured Ports</p>
            <h2 className="mt-2 text-2xl font-bold">Ports that fit this lane</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {lane.featuredPortSlugs.map((slug) => (
              <Link
                key={slug}
                href={`/cruises/port/${slug}`}
                className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-zinc-200 hover:bg-white/10"
              >
                <div className="text-sm uppercase tracking-[0.18em] text-zinc-500">Cruise port</div>
                <div className="mt-2 text-lg font-semibold">{slug}</div>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Featured Ships</p>
            <h2 className="mt-2 text-2xl font-bold">Ships currently mapped to this lane</h2>
          </div>
          <div className="grid gap-3">
            {lane.featuredShipSlugs.map((slug) => (
              <Link
                key={slug}
                href={`/cruises/ship/${slug}`}
                className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-zinc-200 hover:bg-white/10"
              >
                <div className="text-sm uppercase tracking-[0.18em] text-zinc-500">Ship profile</div>
                <div className="mt-2 text-lg font-semibold">{slug}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {lane.organizers?.length ? (
        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Organizer Context</p>
            <h2 className="mt-2 text-2xl font-bold">Known organizers in this lane</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            {lane.organizers.map((organizer) => (
              <span
                key={organizer}
                className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-zinc-200"
              >
                {organizer}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      <PoweredByViator
        disclosure
        body={`DCC uses this ${lane.title.toLowerCase()} lane to connect niche cruise intent with port research and excursion booking handoffs via Viator.`}
        bullets={[
          "Themed discovery pages help users narrow cruise fit faster",
          "Port and ship links keep the cruise graph navigable",
          "Booking actions still hand off to Viator for secure checkout",
        ]}
      />
    </main>
  );
}
