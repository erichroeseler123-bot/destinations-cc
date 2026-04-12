import type { Metadata } from "next";
import TrackOnMount from "@/app/components/analytics/TrackOnMount";
import TrackedExternalAnchor from "@/app/components/analytics/TrackedExternalAnchor";
import { getViatorPublicConfig } from "@/lib/viator/config";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sedona Jeep Tours | Choose The Right Route First",
  description:
    "Use DCC to choose the right Sedona jeep route first, then move into the exact product page without browsing a giant marketplace list.",
  alternates: { canonical: "/sedona/jeep-tours" },
  openGraph: {
    title: "Sedona Jeep Tours | Choose The Right Route First",
    description:
      "Three Sedona jeep routes with a cleaner fit-first decision path and direct availability links.",
    url: "https://destinationcommandcenter.com/sedona/jeep-tours",
    type: "website",
  },
};

type SedonaTour = {
  id: string;
  title: string;
  fitTag: string;
  shortWhy: string;
  duration: string;
  href: string;
};

const SEDONA_TOURS: SedonaTour[] = [
  {
    id: "3272P15",
    title: "Ultimate Scenic Rim Adventure",
    fitTag: "Start here if you are unsure",
    shortWhy:
      "The safest broad-fit Sedona pick when you want the red-rock payoff without making the ride itself the whole point.",
    duration: "2 hours 30 minutes",
    href: buildMinimalViatorProductUrl(
      "https://www.viator.com/tours/Sedona/Scenic-Sedona-Adventure-Tour/d750-3272P15",
    ),
  },
  {
    id: "3272BA",
    title: "Broken Arrow Jeep Tour in Sedona",
    fitTag: "Choose this if you want the rougher ride",
    shortWhy:
      "The classic off-road Sedona choice when the terrain, tilt, and adrenaline are the real reason you are booking.",
    duration: "2 hours",
    href: buildMinimalViatorProductUrl(
      "https://www.viator.com/tours/Sedona/Broken-Arrow-Jeep-Tour/d750-3272BA",
    ),
  },
  {
    id: "15880P9",
    title: "Sedona Red Rocks Outback Tour: Scenic with mild off-roading",
    fitTag: "Choose this for the middle path",
    shortWhy:
      "A softer scenic route with mild off-roading when the group wants views and movement without going full rugged.",
    duration: "2 hours",
    href: buildMinimalViatorProductUrl(
      "https://www.viator.com/tours/Sedona/Outback/d750-15880P9",
    ),
  },
];

function pickFirst(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] || "" : value || "";
}

function buildMinimalViatorProductUrl(url: string) {
  const normalized = new URL(url);
  const config = getViatorPublicConfig();

  if (config.pid) normalized.searchParams.set("pid", config.pid);
  if (config.mcid) normalized.searchParams.set("mcid", config.mcid);

  return normalized.toString();
}

function formatSelectedDate(date: string) {
  if (!date) return "";
  const parsed = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}

export default async function SedonaJeepToursPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = searchParams ? await searchParams : {};
  const date = pickFirst(params.date);
  const formattedDate = formatSelectedDate(date);

  return (
    <main className="min-h-screen bg-[#05070b] text-white">
      <TrackOnMount
        name="page_view"
        props={{
          surface: "sedona-jeep-v1",
          corridor: "sedona-jeep",
          date,
          product_count: SEDONA_TOURS.length,
        }}
      />

      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <header className="rounded-[2.2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(245,179,75,0.12),transparent_26%),linear-gradient(180deg,#0d1118_0%,#06080d_100%)] p-8 md:p-10">
            <div className="max-w-4xl">
              <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[#f5b34b]">
                Sedona jeep command
              </p>
              <h1 className="mt-4 text-[clamp(2.8rem,8vw,5.8rem)] font-black uppercase leading-[0.9] tracking-[-0.05em]">
                Choose the correct
                <br />
                jeep route first.
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-8 text-white/72 md:text-lg">
                Most Sedona visitors do not need more jeep options. They need the correct one for the kind of day they actually want.
              </p>
              <p className="mt-4 text-sm uppercase tracking-[0.18em] text-white/52">
                Avoid the common mistake: booking Broken Arrow just because it is famous.
              </p>
            </div>

            <form
              method="GET"
              action="/sedona/jeep-tours"
              className="mt-8 flex max-w-xl flex-col gap-3 rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5 sm:flex-row sm:items-end"
            >
              <label className="grid flex-1 gap-2 text-sm text-white/72">
                <span className="uppercase tracking-[0.16em] text-white/54">Trip date</span>
                <input
                  type="date"
                  name="date"
                  defaultValue={date}
                  className="rounded-xl border border-white/10 bg-[#0b1017] px-4 py-3 text-white outline-none"
                />
              </label>
              <button
                type="submit"
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#f5b34b] px-5 text-sm font-black uppercase tracking-[0.16em] text-[#07111d] transition hover:bg-[#f7bf6a]"
              >
                Hold this date
              </button>
            </form>

            {formattedDate ? (
              <div className="mt-4 inline-flex rounded-full border border-[#f5b34b]/25 bg-[#f5b34b]/10 px-4 py-2 text-sm font-medium text-[#f7cf8f]">
                Trip date saved: {formattedDate}
              </div>
            ) : (
              <p className="mt-4 text-sm leading-7 text-white/56">
                Save the trip date if you want to keep it visible while you compare the three routes.
              </p>
            )}
          </header>

          <section className="rounded-[1.9rem] border border-white/10 bg-[#0b1017] p-6 md:p-8">
            <div className="max-w-2xl">
              <div className="text-[11px] font-black uppercase tracking-[0.28em] text-[#f5b34b]">
                What this page does
              </div>
              <h2 className="mt-3 text-3xl font-black uppercase tracking-[-0.04em] text-white">
                It removes the wrong Sedona picks first.
              </h2>
              <p className="mt-3 text-base leading-8 text-white/72">
                This is not a jeep marketplace. It is a decision corridor for separating scenic, rugged, and middle-path buyers before you open the correct product page.
              </p>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            <article className="rounded-[1.7rem] border border-white/10 bg-[#0b1017] p-6">
              <div className="text-[11px] font-black uppercase tracking-[0.22em] text-[#f5b34b]">First-time fit</div>
              <h2 className="mt-4 text-xl font-black uppercase leading-[1.02] tracking-[-0.03em] text-white">
                Scenic Rim is the correct first choice
              </h2>
              <p className="mt-4 text-sm leading-7 text-white/68">
                Use this when the goal is red-rock scenery and a cleaner intro, not proving how rough the ride can get.
              </p>
            </article>

            <article className="rounded-[1.7rem] border border-white/10 bg-[#0b1017] p-6">
              <div className="text-[11px] font-black uppercase tracking-[0.22em] text-[#f5b34b]">Adventure fit</div>
              <h2 className="mt-4 text-xl font-black uppercase leading-[1.02] tracking-[-0.03em] text-white">
                Broken Arrow is only correct if the ride is the point
              </h2>
              <p className="mt-4 text-sm leading-7 text-white/68">
                Choose it when the terrain and off-road feeling are the main point of the booking, not just the backdrop.
              </p>
            </article>

            <article className="rounded-[1.7rem] border border-white/10 bg-[#0b1017] p-6">
              <div className="text-[11px] font-black uppercase tracking-[0.22em] text-[#f5b34b]">Mixed-group fit</div>
              <h2 className="mt-4 text-xl font-black uppercase leading-[1.02] tracking-[-0.03em] text-white">
                Outback is the correct middle path
              </h2>
              <p className="mt-4 text-sm leading-7 text-white/68">
                This is the better call when part of the group wants movement and part of the group wants a calmer scenic day.
              </p>
            </article>
          </section>

          <section className="rounded-[1.9rem] border border-white/10 bg-[#0b1017] p-6 md:p-8">
            <div className="max-w-3xl">
              <div className="text-[11px] font-black uppercase tracking-[0.28em] text-[#f5b34b]">
                Best options right now
              </div>
              <h2 className="mt-3 text-3xl font-black uppercase tracking-[-0.04em] text-white">
                Three routes. No giant marketplace list.
              </h2>
              <p className="mt-3 text-sm leading-7 text-white/72">
                Open the correct product page once the route is clear.
                {formattedDate ? ` Your saved trip date is ${formattedDate}.` : ""}
              </p>
            </div>

            <div className="mt-6 grid gap-4">
              {SEDONA_TOURS.map((tour, index) => (
                <article
                  key={tour.id}
                  className="rounded-[1.7rem] border border-white/10 bg-white/[0.03] p-5"
                >
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                    <div className="max-w-2xl">
                      <div className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-[#f5b34b]">
                        {index === 0 ? "Recommended first" : tour.fitTag}
                      </div>

                      <h3 className="mt-4 text-xl font-black uppercase leading-[1.02] tracking-[-0.03em] text-white">
                        {tour.title}
                      </h3>

                      <p className="mt-3 text-sm leading-7 text-white/68">
                        {tour.shortWhy}
                      </p>

                      <div className="mt-4 text-sm font-semibold uppercase tracking-[0.14em] text-white/48">
                        {tour.duration}
                      </div>
                    </div>

                    <div className="sm:shrink-0">
                      <TrackedExternalAnchor
                        href={tour.href}
                        className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#f5b34b] px-5 text-sm font-black uppercase tracking-[0.16em] text-[#07111d] transition hover:bg-[#f7bf6a]"
                        eventName="product_clicked"
                        eventProps={{
                          surface: "sedona-jeep-v1",
                          corridor: "sedona-jeep",
                          date,
                          clicked_slot: index + 1,
                          product_id: tour.id,
                          product_title: tour.title,
                          fit_tag: tour.fitTag,
                          vendor: "viator",
                        }}
                      >
                        Check availability
                      </TrackedExternalAnchor>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
