import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/app/components/dcc/JsonLd";
import PageIntentRouter from "@/app/components/dcc/PageIntentRouter";
import ViatorTourGrid from "@/app/components/dcc/ViatorTourGrid";
import { buildSwampPlanHref } from "@/lib/dcc/warmTransfer";
import {
  buildBreadcrumbJsonLd,
  buildCollectionPageJsonLd,
  buildWebPageJsonLd,
} from "@/lib/dcc/jsonld";
import {
  NEW_ORLEANS_GUIDE_PAGES,
  NEW_ORLEANS_TOUR_CATEGORIES,
  NEW_ORLEANS_TOUR_CATEGORY_PAGES,
} from "@/src/data/new-orleans-city-site";

const page = NEW_ORLEANS_GUIDE_PAGES.tours;
const PAGE_PATH = "/new-orleans/tours";
const PAGE_URL = "https://destinationcommandcenter.com/new-orleans/tours";
const PAGE_INTENT = "compare" as const;
const MOBILE_HANDOFF_QR = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(PAGE_URL)}`;

export const metadata: Metadata = {
  title: "New Orleans Tours and Experiences | Destination Command Center",
  description: page.description,
  keywords: [
    "new orleans tours",
    "best tours in new orleans",
    "new orleans swamp tours",
    "new orleans food tours",
    "new orleans ghost tours",
  ],
  alternates: { canonical: "/new-orleans/tours" },
};

function JsonLdGraph() {
  const categoryItems = NEW_ORLEANS_TOUR_CATEGORIES.map((item) => ({
    name: item.title,
    description: item.description,
    url: `/tours?city=${encodeURIComponent("new-orleans")}&q=${encodeURIComponent(item.query)}`,
  }));

  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@graph": [
          buildWebPageJsonLd({
            path: PAGE_PATH,
            name: page.title,
            description: page.description,
            dateModified: "2026-03-29",
            isPartOfPath: "/new-orleans",
          }),
          buildBreadcrumbJsonLd([
            { name: "New Orleans", item: "/new-orleans" },
            { name: "Tours", item: PAGE_PATH },
          ]),
          buildCollectionPageJsonLd({
            path: PAGE_PATH,
            name: "New Orleans tour comparison lanes",
            description:
              "Broad New Orleans tour comparison page routing visitors into category-specific, city-specific, and action-ready tour lanes.",
            items: categoryItems,
          }),
        ],
      }}
    />
  );
}

export default async function NewOrleansToursPage() {
  return (
    <main className="min-h-screen bg-[#050816] text-white" data-page-intent={PAGE_INTENT}>
      <JsonLdGraph />
      <div className="mx-auto max-w-6xl px-6 py-16 space-y-8">
        <header className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(255,176,124,0.12),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(61,243,255,0.10),transparent_26%),linear-gradient(180deg,rgba(15,23,42,0.96),rgba(7,11,25,0.98))] p-8 shadow-[0_28px_90px_rgba(0,0,0,0.45)] md:p-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-[0.24em] text-[#ffb07c]">New Orleans tours</p>
            <div className="rounded-full border border-cyan-300/20 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-cyan-100">
              Intent: Compare
            </div>
          </div>
          <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">{page.title}</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-white/82">{page.description}</p>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-white/68">
            This is the broad compare layer for New Orleans tours. The job here is to help visitors narrow into the right lane fast, then move them either into a stronger category page, the swamp decision surface, or a wider city planning page without dead-ending.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/new-orleans" className="rounded-2xl border border-white/12 bg-white/6 px-5 py-3 text-sm text-white/88 hover:bg-white/10">
              Back to New Orleans
            </Link>
            <Link href="/new-orleans/things-to-do" className="rounded-2xl border border-white/12 bg-white/6 px-5 py-3 text-sm text-white/88 hover:bg-white/10">
              Explore things to do
            </Link>
            <a
              href={buildSwampPlanHref({
                intent: "compare",
                topic: "swamp-tours",
                subtype: "comfort",
                context: "first-time",
                sourcePage: PAGE_PATH,
              })}
              className="rounded-2xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-400"
            >
              Need swamp-tour narrowing?
            </a>
          </div>
        </header>

        <section className="hidden items-center justify-between gap-8 rounded-3xl border border-[#8df0cc]/20 bg-[linear-gradient(135deg,rgba(17,29,31,0.96),rgba(7,14,22,0.96))] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.28)] lg:flex">
          <div className="max-w-2xl">
            <div className="text-xs uppercase tracking-[0.24em] text-[#8df0cc]">Desktop handoff</div>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-white">This compare layer works best when it routes fast.</h2>
            <p className="mt-3 text-base leading-7 text-white/76">
              Open this page on your phone for the fastest booking flow, easier scrolling, and the simplest path into live tour options.
            </p>
            <a
              href={PAGE_URL}
              className="mt-5 inline-flex rounded-2xl border border-white/12 bg-white/6 px-5 py-3 text-sm font-medium text-white/88 hover:bg-white/10"
            >
              Open on this device
            </a>
          </div>
          <div className="shrink-0 rounded-[2rem] border border-white/10 bg-white p-4 text-center shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
            <img
              src={MOBILE_HANDOFF_QR}
              alt="QR code to open the New Orleans tours page on your phone"
              width={220}
              height={220}
              className="h-[220px] w-[220px] rounded-2xl"
            />
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">Scan on your phone</p>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.05] p-6">
          <h2 className="text-2xl font-bold">How New Orleans tour intent usually breaks down</h2>
          <div className="mt-4 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-4 text-sm leading-7 text-white/78">
              <p>
                New Orleans tour searches usually split into four strong lanes: swamp and bayou trips, ghost and night walks, food and cocktail experiences, and music or neighborhood context. That makes this page a better organic target than a generic city query because it can route users into the exact experience type they already have in mind.
              </p>
              <p>
                The strongest path from here is into one category page first, then into matching tours or the broader things-to-do guide if the visitor is still shaping the trip.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <div className="text-xs uppercase tracking-[0.18em] text-cyan-300">Best next clicks</div>
              <div className="mt-4 grid gap-3">
                <Link href="/new-orleans/things-to-do" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm hover:bg-white/10">Things to do in New Orleans</Link>
                <Link href="/new-orleans/food" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm hover:bg-white/10">New Orleans food guide</Link>
                <Link href="/new-orleans/music" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm hover:bg-white/10">New Orleans music guide</Link>
                <Link href="/new-orleans/neighborhoods" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm hover:bg-white/10">New Orleans neighborhoods</Link>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {NEW_ORLEANS_TOUR_CATEGORIES.map((item) => {
            const href = `/tours?city=${encodeURIComponent("new-orleans")}&q=${encodeURIComponent(
              item.query
            )}&source_section=${encodeURIComponent("new-orleans-tours-categories")}`;

            return (
              <article key={item.title} className="rounded-3xl border border-white/10 bg-white/[0.05] p-5">
                <div className="text-2xl">{item.icon}</div>
                <h2 className="mt-3 text-xl font-semibold text-white">{item.title}</h2>
                <p className="mt-3 text-sm leading-7 text-white/74">{item.description}</p>
                <Link href={href} className="mt-5 inline-flex text-sm font-medium text-cyan-200 hover:text-cyan-100">
                  View matching tours →
                </Link>
              </article>
            );
          })}
        </section>

        <PageIntentRouter
          intent={PAGE_INTENT}
          title="What is the best next step after the main New Orleans tours page?"
          summary="This broad compare page should push visitors into a narrower category, the WTS swamp decision surface, or back into city-level context depending on what they actually need next."
          options={[
            {
              title: "Compare swamp tours with WTS",
              description: "Use the specialized decision layer if the visitor is already close to booking a swamp tour and needs narrowing help fast.",
              href: buildSwampPlanHref({
                intent: "compare",
                topic: "swamp-tours",
                subtype: "comfort",
                context: "first-time",
                sourcePage: PAGE_PATH,
              }),
              kind: "external",
              emphasis: "primary",
            },
            {
              title: "Open the New Orleans swamp lane",
              description: "Best when the visitor already knows the category and just needs the DCC compare surface for swamp-tour buying lanes.",
              href: "/new-orleans/swamp-tours",
              kind: "internal",
            },
            {
              title: "Go broader with things to do",
              description: "Use the city activity layer if the trip is still being shaped and tours are only one possible bucket.",
              href: "/new-orleans/things-to-do",
              kind: "internal",
            },
            {
              title: "Return to New Orleans authority",
              description: "Go back to the city root if the real need is context, neighborhoods, and overall trip structure before comparing tours.",
              href: "/new-orleans",
              kind: "internal",
            },
          ]}
        />

        <section className="rounded-3xl border border-white/10 bg-white/[0.05] p-6">
          <h2 className="text-2xl font-bold">Best-fit New Orleans tour plans</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/78">
              <h3 className="font-semibold text-white">First-time visitor</h3>
              <p className="mt-2">Start with one walking or sightseeing tour, one food or music experience, and one swamp or day-trip lane.</p>
            </article>
            <article className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/78">
              <h3 className="font-semibold text-white">Weekend trip</h3>
              <p className="mt-2">Keep the tour mix compact so one late music night or festival day does not crowd out the rest of the city.</p>
            </article>
            <article className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/78">
              <h3 className="font-semibold text-white">Culture-first trip</h3>
              <p className="mt-2">Bias toward food, history, neighborhoods, and jazz experiences instead of overloading the itinerary with transfer-heavy excursions.</p>
            </article>
            <article className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/78">
              <h3 className="font-semibold text-white">Add one outdoor escape</h3>
              <p className="mt-2">Swamp and bayou tours work best as one contrast block that breaks up the city without replacing the city itself.</p>
            </article>
          </div>
        </section>

        <ViatorTourGrid
          placeName="New Orleans"
          title="Featured New Orleans tours"
          description="Popular guided experiences and bookable activities for visitors planning around the city’s food, music, neighborhoods, and day trips."
          products={[]}
          fallbacks={Object.values(NEW_ORLEANS_TOUR_CATEGORY_PAGES).flatMap((item) =>
            item.intents.slice(0, 1).map((intent) => ({ label: intent.label, query: intent.query }))
          )}
          ctaLabel="View experience"
          linkBuilder={({ intentQuery }) =>
            `/tours?city=${encodeURIComponent("new-orleans")}&q=${encodeURIComponent(
              intentQuery
            )}&source_section=${encodeURIComponent("new-orleans-tours-grid")}`
          }
        />
      </div>
    </main>
  );
}
