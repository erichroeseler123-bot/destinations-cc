import type { Metadata } from "next";
import Link from "next/link";
import ViatorTourGrid from "@/app/components/dcc/ViatorTourGrid";
import {
  NEW_ORLEANS_GUIDE_PAGES,
  NEW_ORLEANS_TOUR_CATEGORIES,
  NEW_ORLEANS_TOUR_CATEGORY_PAGES,
} from "@/src/data/new-orleans-city-site";

const page = NEW_ORLEANS_GUIDE_PAGES.tours;

export const metadata: Metadata = {
  title: "New Orleans Tours and Experiences | Destination Command Center",
  description: page.description,
  alternates: { canonical: "/new-orleans/tours" },
};

export default async function NewOrleansToursPage() {
  return (
    <main className="min-h-screen bg-[#050816] text-white">
      <div className="mx-auto max-w-6xl px-6 py-16 space-y-8">
        <header className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(255,176,124,0.12),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(61,243,255,0.10),transparent_26%),linear-gradient(180deg,rgba(15,23,42,0.96),rgba(7,11,25,0.98))] p-8 shadow-[0_28px_90px_rgba(0,0,0,0.45)] md:p-10">
          <p className="text-xs uppercase tracking-[0.24em] text-[#ffb07c]">New Orleans tours</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">{page.title}</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-white/82">{page.description}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/new-orleans" className="rounded-2xl border border-white/12 bg-white/6 px-5 py-3 text-sm text-white/88 hover:bg-white/10">
              Back to New Orleans
            </Link>
            <Link href="/new-orleans/things-to-do" className="rounded-2xl border border-white/12 bg-white/6 px-5 py-3 text-sm text-white/88 hover:bg-white/10">
              Explore things to do
            </Link>
          </div>
        </header>

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
