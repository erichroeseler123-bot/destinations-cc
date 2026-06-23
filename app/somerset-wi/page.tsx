import type { Metadata } from "next";
import Link from "next/link";
import { getStCroixVenueCalendarGroups } from "@/lib/dcc/corridors/stCroixCalendar";
import { SOMERSET_PAGES } from "@/lib/dcc/corridors/somersetPages";
import JsonLd from "@/app/components/dcc/JsonLd";
import { buildCityJsonLd, buildBreadcrumbJsonLd } from "@/lib/dcc/jsonld";

export const metadata: Metadata = {
  title: "Somerset WI Concerts, Tubing, and St. Croix Valley Trips",
  description:
    "Somerset WI visitor planning for Apple River tubing, River's Edge weekends, St. Croix Valley concerts, Mystic Lake, The Ledge, and future shuttle transportation.",
  alternates: { canonical: "/somerset-wi" },
  openGraph: {
    title: "Somerset WI Concerts, Tubing, and St. Croix Valley Trips",
    description:
      "A practical Somerset WI planning hub for tubing, concerts, venue calendars, and St. Croix Valley transportation decisions.",
    url: "/somerset-wi",
    type: "article",
  },
};

export const revalidate = 3600;

export default async function SomersetHubPage() {
  const venueCalendarGroups = await getStCroixVenueCalendarGroups();

  return (
    <main className="min-h-screen bg-[#f7f5ef] text-slate-950">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            buildCityJsonLd({
              path: "/somerset-wi",
              name: "Somerset",
              description:
                "Somerset WI visitor planning for Apple River tubing, River's Edge weekends, St. Croix Valley concerts, Mystic Lake, The Ledge, and future shuttle transportation.",
              address: {
                locality: "Somerset",
                region: "WI",
                country: "US",
              },
              geo: {
                lat: 45.1244,
                lng: -92.6758,
              },
              touristTypes: ["Concertgoers", "Tubing groups", "Weekend travelers"],
            }),
            buildBreadcrumbJsonLd([
              { name: "Home", item: "/" },
              { name: "Somerset WI", item: "/somerset-wi" },
            ]),
          ],
        }}
      />
      <div className="mx-auto max-w-6xl px-6 py-14">
        <header>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-800">
            Somerset WI
          </p>
          <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-[-0.04em] md:text-6xl">
            Somerset concerts, Apple River tubing, and St. Croix Valley weekends.
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-slate-700">
            Use Somerset as the Apple River tubing anchor and as a live-music planning lane for
            River&apos;s Edge, Hudson-Stillwater, Mystic Lake Amphitheater, and The Ledge Amphitheater.
          </p>
        </header>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          {SOMERSET_PAGES.map((page) => (
            <Link
              key={page.slug}
              href={`/somerset-wi/${page.slug}`}
              className="rounded-[1.3rem] border border-emerald-900/10 bg-white/80 p-5 shadow-[0_18px_55px_rgba(18,38,31,0.08)] transition hover:bg-white"
            >
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-800">
                {page.eyebrow}
              </p>
              <h2 className="mt-3 text-xl font-black tracking-[-0.02em]">{page.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-700">{page.description}</p>
            </Link>
          ))}
        </section>

        <section className="mt-8 rounded-[1.9rem] border border-emerald-900/10 bg-white/80 p-6 shadow-[0_18px_55px_rgba(18,38,31,0.08)]">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-800">
            Auto-updating venue calendars
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-[-0.03em]">
            Current ticketed shows, refreshed hourly.
          </h2>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {venueCalendarGroups.map((group) => (
              <article key={group.slug} className="rounded-[1.3rem] border border-emerald-900/10 bg-[#f7f5ef] p-5">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-800">
                  {group.location}
                </p>
                <h3 className="mt-2 text-xl font-black">{group.name}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-700">{group.description}</p>
                <p className="mt-4 text-sm font-semibold text-slate-700">
                  {group.events.length} live ticketed shows in the current feed.
                </p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
