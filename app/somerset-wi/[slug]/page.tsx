import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getStCroixVenueCalendarGroups } from "@/lib/dcc/corridors/stCroixCalendar";
import {
  getSomersetPage,
  SOMERSET_BASE_PATH,
  SOMERSET_PAGES,
} from "@/lib/dcc/corridors/somersetPages";
import JsonLd from "@/app/components/dcc/JsonLd";
import { buildBreadcrumbJsonLd, buildEventJsonLd } from "@/lib/dcc/jsonld";

export const revalidate = 3600;

export function generateStaticParams() {
  return SOMERSET_PAGES.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const page = getSomersetPage((await params).slug);
  if (!page) return {};

  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: `${SOMERSET_BASE_PATH}/${page.slug}` },
    openGraph: {
      title: page.title,
      description: page.description,
      url: `${SOMERSET_BASE_PATH}/${page.slug}`,
      type: "article",
    },
  };
}

function matchesVenueGroup(slug: string, groupSlug: string) {
  if (slug === "concerts") return true;
  if (slug === "rivers-edge-campground") return groupSlug === "somerset-rivers-edge";
  if (slug === "mystic-lake-amphitheater") return groupSlug === "mystic-lake-amphitheater";
  if (slug === "the-ledge-amphitheater") return groupSlug === "the-ledge-amphitheater";
  return false;
}

export default async function SomersetDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const page = getSomersetPage((await params).slug);
  if (!page) notFound();

  const venueCalendarGroups = (await getStCroixVenueCalendarGroups()).filter((group) =>
    matchesVenueGroup(page.slug, group.slug),
  );

  const schemas: Record<string, unknown>[] = [];

  // 1. Breadcrumbs
  schemas.push(
    buildBreadcrumbJsonLd([
      { name: "Home", item: "/" },
      { name: "Somerset WI", item: SOMERSET_BASE_PATH },
      { name: page.eyebrow, item: `${SOMERSET_BASE_PATH}/${page.slug}` },
    ])
  );

  // 2. Events from live calendars
  if (venueCalendarGroups.length > 0) {
    for (const group of venueCalendarGroups) {
      for (const event of group.events) {
        if (!event.startsAt) continue; // Filter out events without a valid start date/time

        schemas.push(
          buildEventJsonLd({
            path: `${SOMERSET_BASE_PATH}/${page.slug}`,
            type: "MusicEvent",
            name: event.title,
            description: `${event.title} live at ${event.venueName || group.name}. Refreshed hourly.`,
            startDate: event.startsAt,
            venueName: event.venueName || group.name,
            address: {
              locality: group.location || "Somerset",
              region: "WI",
              country: "US",
            },
            offerUrl: event.url,
          })
        );
      }
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f5ef] text-slate-950">
      <JsonLd data={{ "@context": "https://schema.org", "@graph": schemas }} />
      <div className="mx-auto max-w-5xl px-6 py-14">
        <Link href={SOMERSET_BASE_PATH} className="text-sm font-bold text-emerald-800 hover:text-emerald-950">
          Somerset WI
        </Link>
        <header className="mt-5">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-800">
            {page.eyebrow}
          </p>
          <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-[-0.04em] md:text-6xl">
            {page.title}
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-slate-700">{page.description}</p>
        </header>

        <section className="mt-8 grid gap-4 md:grid-cols-2">
          {page.sections.map((section) => (
            <article key={section.title} className="rounded-[1.3rem] border border-emerald-900/10 bg-white/80 p-5 shadow-[0_18px_55px_rgba(18,38,31,0.08)]">
              <h2 className="text-xl font-black tracking-[-0.02em]">{section.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-700">{section.body}</p>
            </article>
          ))}
        </section>

        {venueCalendarGroups.length > 0 ? (
          <section className="mt-8 rounded-[1.9rem] border border-emerald-900/10 bg-white/80 p-6 shadow-[0_18px_55px_rgba(18,38,31,0.08)]">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-800">
              Live calendar
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.03em]">
              Auto-updating ticketed shows
            </h2>
            <div className="mt-5 grid gap-4">
              {venueCalendarGroups.map((group) => (
                <article key={group.slug} className="rounded-[1.3rem] border border-emerald-900/10 bg-[#f7f5ef] p-5">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-800">
                    {group.location}
                  </p>
                  <h3 className="mt-2 text-xl font-black">{group.name}</h3>
                  <div className="mt-4 divide-y divide-emerald-900/10 rounded-[1rem] border border-emerald-900/10 bg-white/80 px-4">
                    {group.events.map((event) => (
                      <div key={`${group.slug}-${event.source}-${event.id}`} className="py-4">
                        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
                          {event.dateLabel} · {event.venueName}
                        </p>
                        <h4 className="mt-2 text-base font-black">{event.title}</h4>
                        <p className="mt-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                          {event.source === "ticketmaster" ? "Ticketmaster" : "SeatGeek"}
                          {event.priceLabel ? ` · ${event.priceLabel}` : ""}
                        </p>
                        {event.url ? (
                          <a href={event.url} className="mt-3 inline-flex text-xs font-black uppercase tracking-[0.14em] text-emerald-800 hover:text-emerald-950">
                            View show
                          </a>
                        ) : null}
                      </div>
                    ))}
                    {group.events.length === 0 ? (
                      <div className="py-4 text-sm leading-7 text-slate-700">
                        No live ticketed shows are available from the configured feeds right now. Check
                        official venue and event calendars for civic or campground updates.
                      </div>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-8 rounded-[1.9rem] border border-emerald-900/10 bg-white/80 p-6">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-800">
            Somerset sitemap pages
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {SOMERSET_PAGES.map((item) => (
              <Link
                key={item.slug}
                href={`${SOMERSET_BASE_PATH}/${item.slug}`}
                className="rounded-full border border-emerald-900/10 bg-[#f7f5ef] px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-slate-800"
              >
                {item.eyebrow}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
