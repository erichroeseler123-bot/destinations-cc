import type { Metadata } from "next";
import WesternWisconsinShell from "@/app/components/dcc/WesternWisconsinShell";
import WesternWisconsinTrackedLink from "@/app/components/dcc/WesternWisconsinTrackedLink";
import {
  buildWesternWisconsinHref,
  getWesternWisconsinDecisionState,
  ST_CROIX_VALLEY_PROFILE,
} from "@/lib/dcc/corridors/westernWisconsin";
import {
  getStCroixCalendarEvents,
  getStCroixVenueCalendarGroups,
} from "@/lib/dcc/corridors/stCroixCalendar";
import { DecisionFraming } from "@/components/dcc/DecisionFraming";

export const metadata: Metadata = {
  title: "Eau Claire or La Crosse? | Western Wisconsin Weekend Decision",
  description:
    "Choose Eau Claire for the easiest western Wisconsin weekend. Choose La Crosse when scenic bluff-country payoff matters more than town energy.",
  alternates: { canonical: "/western-wisconsin" },
  keywords: [
    "eau claire vs la crosse",
    "western wisconsin weekend trip",
    "best weekend trip from twin cities",
    "la crosse or eau claire",
  ],
  openGraph: {
    title: "Choose Eau Claire or La Crosse",
    description:
      "Eau Claire is the default western Wisconsin weekend. La Crosse wins when you want scenery and bluff-country views over downtown energy.",
    url: "/western-wisconsin",
    type: "article",
  },
};

export const revalidate = 3600;

const PAGE_PATH = "/western-wisconsin";
const DEFAULT_DESTINATION = "eau-claire";

function buildState(searchParams?: Record<string, string | string[] | undefined>) {
  const state = getWesternWisconsinDecisionState(searchParams || {});
  return {
    ...state,
    destination: state.destination || DEFAULT_DESTINATION,
    sourcePage: PAGE_PATH,
  };
}

export default async function WesternWisconsinHubPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const state = buildState((await searchParams) || {});
  const [liveEvents, venueCalendarGroups] = await Promise.all([
    getStCroixCalendarEvents(),
    getStCroixVenueCalendarGroups(),
  ]);
  const choice = state.destination === "la-crosse" ? "la-crosse" : DEFAULT_DESTINATION;
  const defaultHref = buildWesternWisconsinHref("/western-wisconsin/eau-claire-vs-la-crosse", {
    ...state,
    destination: DEFAULT_DESTINATION,
  });
  const alternativeHref = buildWesternWisconsinHref("/western-wisconsin/eau-claire-vs-la-crosse", {
    ...state,
    destination: "la-crosse",
  });

  return (
    <WesternWisconsinShell
      eyebrow="Western Wisconsin decision corridor"
      sourcePage={PAGE_PATH}
      pageRole="hub"
      recommendationSlug={choice}
      title="Choose Eau Claire for the easiest western Wisconsin weekend."
      intro="Start with Eau Claire if you want the weekend to work with the least planning. Switch to La Crosse only when bluff views and Mississippi scenery matter more than town energy."
      primaryAction={{
        href: defaultHref,
        label: "Plan your weekend in Eau Claire",
        action: "product_opened",
        fitSignal: DEFAULT_DESTINATION,
        metadata: {
          stage: "recommended",
          page_type: "decision_hub",
          decision_option: DEFAULT_DESTINATION,
        },
      }}
      highlights={[
        {
          label: "Core question",
          body: "Town energy and easy momentum, or scenic payoff and bluff-country views.",
        },
        {
          label: "Default",
          body: "Eau Claire is the strongest starting choice for most first-time western Wisconsin weekends.",
        },
        {
          label: "Alternative",
          body: "La Crosse wins when the weekend should feel scenic, slower, and more visual than social.",
        },
      ]}
    >
      <section className="rounded-[1.9rem] border border-emerald-900/10 bg-white/80 p-6 shadow-[0_18px_55px_rgba(18,38,31,0.08)]">
          <DecisionFraming />
          <section>
            <h2>Decision Locked</h2>
            <p>
              Choose Eau Claire as the default western Wisconsin weekend unless scenery is the
              whole point. That choice gives you a stronger base, easier food and drink stops, and
              less planning friction than trying to compare every river town.
            </p>
          </section>
        <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-800">The decision</p>
        <h2 className="mt-3 text-3xl font-black tracking-[-0.03em] text-slate-950">
          Start with Eau Claire unless scenery is the whole point.
        </h2>
        <p className="mt-4 max-w-3xl text-base leading-8 text-slate-700">
          Eau Claire wins as the default because it is easier to say yes to quickly. The downtown is
          more walkable, the brewery-and-music shape is easier to fill a weekend with, and it works
          better when you want one clean answer instead of a scenic route-planning exercise. Switch to
          La Crosse when the real goal is Mississippi views, bluff overlooks, and a more visual weekend
          than social one.
        </p>
        <div className="mt-5 rounded-[1.3rem] border border-emerald-900/10 bg-emerald-50 px-5 py-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">
            What happens next
          </p>
          <p className="mt-2 text-sm leading-7 text-slate-700">
            Open the Eau Claire plan, choose the stay/activity lane that fits the trip, and keep
            La Crosse as the controlled fallback only if the weekend needs scenery first.
          </p>
        </div>
      </section>

      <section className="rounded-[1.9rem] border border-emerald-900/10 bg-[linear-gradient(180deg,#f3f8f1,#fffdf8)] p-6 shadow-[0_18px_55px_rgba(18,38,31,0.08)]">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-800">
          Recommended first
        </p>
        <h2 className="mt-3 text-3xl font-black tracking-[-0.03em] text-slate-950">Eau Claire</h2>
        <p className="mt-4 max-w-3xl text-base leading-8 text-slate-700">
          Choose Eau Claire when you want the safest broad-fit weekend: breweries, music, a stronger
          social scene, and a downtown that feels active without requiring much planning overhead.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <article className="rounded-[1.3rem] border border-emerald-900/10 bg-white/80 p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Best for</p>
            <p className="mt-2 text-sm leading-7 text-slate-700">
              First western Wisconsin weekends, couples or friends, brewery stops, and a lively base.
            </p>
          </article>
          <article className="rounded-[1.3rem] border border-emerald-900/10 bg-white/80 p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Why it wins</p>
            <p className="mt-2 text-sm leading-7 text-slate-700">
              It delivers the clearest weekend shape without needing scenic detours or a longer planning arc.
            </p>
          </article>
          <article className="rounded-[1.3rem] border border-emerald-900/10 bg-white/80 p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Use this when</p>
            <p className="mt-2 text-sm leading-7 text-slate-700">
              You want one confident yes, not a browse session through every river town in the region.
            </p>
          </article>
        </div>
        <div className="mt-6">
          <p className="text-sm font-semibold text-slate-700">
            If you want the easiest strong western Wisconsin weekend, start here.
          </p>
          <div className="mt-4">
            <WesternWisconsinTrackedLink
              href={defaultHref}
              sourcePage={PAGE_PATH}
              action="product_opened"
              fitSignal={DEFAULT_DESTINATION}
              metadata={{
                stage: "recommended",
                page_type: "decision_hub",
                decision_option: DEFAULT_DESTINATION,
              }}
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-emerald-700 px-6 text-sm font-black uppercase tracking-[0.16em] text-white transition hover:bg-emerald-800"
            >
              Plan your weekend in Eau Claire
            </WesternWisconsinTrackedLink>
          </div>
        </div>
      </section>

      <section className="rounded-[1.9rem] border border-emerald-900/10 bg-white/80 p-6 shadow-[0_18px_55px_rgba(18,38,31,0.08)]">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-800">Choose the alternative when</p>
        <h2 className="mt-3 text-3xl font-black tracking-[-0.03em] text-slate-950">La Crosse</h2>
        <p className="mt-4 max-w-3xl text-base leading-8 text-slate-700">
          Pick La Crosse if the scenery is the attraction. This is the better lane when bluff views,
          Mississippi overlooks, and a more visual river weekend matter more than nightlife or brewery momentum.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <span className="rounded-full border border-slate-900/8 bg-[#f7f5ef] px-3 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-slate-700">
            Scenic default
          </span>
          <span className="rounded-full border border-slate-900/8 bg-[#f7f5ef] px-3 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-slate-700">
            Bluff-country views
          </span>
          <span className="rounded-full border border-slate-900/8 bg-[#f7f5ef] px-3 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-slate-700">
            More visual, less social
          </span>
        </div>
        <div className="mt-6">
          <WesternWisconsinTrackedLink
            href={alternativeHref}
            sourcePage={PAGE_PATH}
            action="product_opened"
            fitSignal="la-crosse"
            metadata={{
              stage: "alternative",
              page_type: "decision_hub",
              decision_option: "la-crosse",
            }}
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-emerald-900/12 bg-white px-5 text-sm font-black uppercase tracking-[0.16em] text-slate-900 transition hover:bg-[#eef5ef]"
          >
            Switch to La Crosse instead
          </WesternWisconsinTrackedLink>
        </div>
      </section>

      <section className="rounded-[1.9rem] border border-emerald-900/10 bg-white/80 p-6 shadow-[0_18px_55px_rgba(18,38,31,0.08)]">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-800">
          Venue calendars
        </p>
        <h2 className="mt-3 text-3xl font-black tracking-[-0.03em] text-slate-950">
          Separate auto-updating concert calendars for each St. Croix venue lane.
        </h2>
        <p className="mt-4 max-w-3xl text-base leading-8 text-slate-700">
          Each venue lane refreshes from the configured Ticketmaster and SeatGeek feeds. Official
          local calendars still control civic dates, campground rules, cancellations, and river-event details.
        </p>
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {venueCalendarGroups.map((group) => (
            <article key={group.slug} className="rounded-[1.3rem] border border-emerald-900/10 bg-[#f7f5ef] p-5">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-800">
                {group.location}
              </p>
              <h3 className="mt-2 text-xl font-black text-slate-950">{group.name}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-700">{group.description}</p>
              <div className="mt-5 divide-y divide-emerald-900/10 rounded-[1rem] border border-emerald-900/10 bg-white/80 px-4">
                {group.events.map((event) => (
                  <div key={`${group.slug}-${event.source}-${event.id}`} className="py-4">
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
                      {event.dateLabel} · {event.venueName}
                    </p>
                    <h4 className="mt-2 text-base font-black text-slate-950">{event.title}</h4>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                        {event.source === "ticketmaster" ? "Ticketmaster" : "SeatGeek"}
                        {event.priceLabel ? ` · ${event.priceLabel}` : ""}
                      </p>
                      {event.url ? (
                        <a href={event.url} className="text-xs font-black uppercase tracking-[0.14em] text-emerald-800 hover:text-emerald-950">
                          View show
                        </a>
                      ) : null}
                    </div>
                  </div>
                ))}
                {group.events.length === 0 ? (
                  <div className="py-4 text-sm leading-7 text-slate-700">
                    No live ticketed shows are available from the configured feeds right now. Keep this
                    lane active for official-calendar review and future provider matches.
                  </div>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-[1.9rem] border border-emerald-900/10 bg-white/80 p-6 shadow-[0_18px_55px_rgba(18,38,31,0.08)]">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-800">
          Unified area overview
        </p>
        <h2 className="mt-3 text-3xl font-black tracking-[-0.03em] text-slate-950">
          Somerset, Hudson, and Stillwater work as one St. Croix Valley corridor.
        </h2>
        <p className="mt-4 max-w-3xl text-base leading-8 text-slate-700">
          {ST_CROIX_VALLEY_PROFILE.overview}
        </p>
      </section>

      <section className="rounded-[1.9rem] border border-emerald-900/10 bg-[linear-gradient(180deg,#f3f8f1,#fffdf8)] p-6 shadow-[0_18px_55px_rgba(18,38,31,0.08)]">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-800">
          Rivers &amp; tubing
        </p>
        <h2 className="mt-3 text-3xl font-black tracking-[-0.03em] text-slate-950">
          Use Somerset for tubing and Hudson-Stillwater for St. Croix riverfront recreation.
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {ST_CROIX_VALLEY_PROFILE.rivers.map((river) => (
            <article key={river.name} className="rounded-[1.3rem] border border-emerald-900/10 bg-white/80 p-4">
              <h3 className="text-sm font-black uppercase tracking-[0.16em] text-slate-900">
                {river.name}
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-700">{river.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-[1.9rem] border border-emerald-900/10 bg-white/80 p-6 shadow-[0_18px_55px_rgba(18,38,31,0.08)]">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-800">
          Concerts &amp; events
        </p>
        <h2 className="mt-3 text-3xl font-black tracking-[-0.03em] text-slate-950">
          Summer music and festival planning needs current calendar checks.
        </h2>
        <p className="mt-4 max-w-3xl text-base leading-8 text-slate-700">
          {ST_CROIX_VALLEY_PROFILE.events.intro}
        </p>
        <ul className="mt-5 grid gap-3 text-sm leading-7 text-slate-700 md:grid-cols-3">
          {ST_CROIX_VALLEY_PROFILE.events.items.map((item) => (
            <li key={item} className="rounded-[1.3rem] border border-emerald-900/10 bg-[#f7f5ef] p-4">
              {item}
            </li>
          ))}
        </ul>
        <p className="mt-5 max-w-3xl text-sm leading-7 text-slate-600">
          {ST_CROIX_VALLEY_PROFILE.events.note}
        </p>
      </section>

      <section className="rounded-[1.9rem] border border-emerald-900/10 bg-[linear-gradient(180deg,#f3f8f1,#fffdf8)] p-6 shadow-[0_18px_55px_rgba(18,38,31,0.08)]">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-800">
          Somerset concert calendar
        </p>
        <h2 className="mt-3 text-3xl font-black tracking-[-0.03em] text-slate-950">
          {ST_CROIX_VALLEY_PROFILE.concertCalendar.title}
        </h2>
        <p className="mt-4 max-w-3xl text-base leading-8 text-slate-700">
          {ST_CROIX_VALLEY_PROFILE.concertCalendar.positioning}
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {ST_CROIX_VALLEY_PROFILE.concertCalendar.sources.map((source) => (
            <article key={source.name} className="rounded-[1.3rem] border border-emerald-900/10 bg-white/80 p-4">
              <h3 className="text-sm font-black uppercase tracking-[0.16em] text-slate-900">
                {source.name}
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-700">{source.role}</p>
            </article>
          ))}
        </div>
        <div className="mt-6 rounded-[1.3rem] border border-emerald-900/10 bg-white/80 p-5">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">
            Calendar manager rules
          </p>
          <ul className="mt-4 grid gap-3 text-sm leading-7 text-slate-700 md:grid-cols-2">
            {ST_CROIX_VALLEY_PROFILE.concertCalendar.managerNotes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
        <p className="mt-5 max-w-3xl text-sm font-semibold leading-7 text-slate-700">
          {ST_CROIX_VALLEY_PROFILE.concertCalendar.userPromise}
        </p>
        <div className="mt-6 rounded-[1.3rem] border border-emerald-900/10 bg-white/80 p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">
                Auto-updating feed
              </p>
              <h3 className="mt-2 text-xl font-black text-slate-950">
                Live ticketed shows from Ticketmaster and SeatGeek
              </h3>
            </div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
              Refreshes hourly
            </p>
          </div>
          <div className="mt-5 divide-y divide-emerald-900/10">
            {liveEvents.map((event) => (
              <article key={`${event.source}-${event.id}`} className="flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
                    {event.dateLabel} · {event.venueName} · {event.city}
                  </p>
                  <h4 className="mt-2 text-lg font-black text-slate-950">{event.title}</h4>
                  <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                    {event.source === "ticketmaster" ? "Ticketmaster" : "SeatGeek"}
                    {event.priceLabel ? ` · ${event.priceLabel}` : ""}
                  </p>
                </div>
                {event.url ? (
                  <a
                    href={event.url}
                    className="inline-flex min-h-11 items-center justify-center rounded-full border border-emerald-900/12 bg-white px-5 text-sm font-black uppercase tracking-[0.16em] text-slate-900 transition hover:bg-[#eef5ef]"
                  >
                    View show
                  </a>
                ) : null}
              </article>
            ))}
            {liveEvents.length === 0 ? (
              <div className="py-5 text-sm leading-7 text-slate-700">
                No live ticketed shows are available from the configured feeds right now. Use the official
                local calendars above for civic concerts, campground events, and date changes.
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="rounded-[1.9rem] border border-emerald-900/10 bg-white/80 p-6 shadow-[0_18px_55px_rgba(18,38,31,0.08)]">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-800">
          Regional amphitheater coverage
        </p>
        <h2 className="mt-3 text-3xl font-black tracking-[-0.03em] text-slate-950">
          Add The Ledge and Mystic Lake to the same concert decision layer.
        </h2>
        <p className="mt-4 max-w-3xl text-base leading-8 text-slate-700">
          Somerset concert discovery should not stop at one village calendar. DCC should also cover
          regional outdoor venues that shape summer trip decisions, ticket demand, and future
          group-transportation handoffs.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {ST_CROIX_VALLEY_PROFILE.regionalVenues.map((venue) => (
            <article key={venue.name} className="rounded-[1.3rem] border border-emerald-900/10 bg-[#f7f5ef] p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-800">
                {venue.location}
              </p>
              <h3 className="mt-2 text-lg font-black text-slate-950">{venue.name}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-700">{venue.body}</p>
              <p className="mt-4 rounded-[1rem] border border-emerald-900/10 bg-white/80 p-4 text-sm leading-7 text-slate-700">
                {venue.transportation}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-[1.9rem] border border-emerald-900/10 bg-white/80 p-6 shadow-[0_18px_55px_rgba(18,38,31,0.08)]">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-800">
          Detailed town breakdowns
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {ST_CROIX_VALLEY_PROFILE.towns.map((town) => (
            <article key={town.name} className="rounded-[1.3rem] border border-emerald-900/10 bg-white/80 p-4">
              <h2 className="text-lg font-black text-slate-950">{town.name}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-700">{town.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-[1.9rem] border border-emerald-900/10 bg-[linear-gradient(180deg,#f3f8f1,#fffdf8)] p-6 shadow-[0_18px_55px_rgba(18,38,31,0.08)]">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-800">
          Best for
        </p>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {ST_CROIX_VALLEY_PROFILE.bestFor.map((item) => (
            <p key={item} className="rounded-[1.3rem] border border-emerald-900/10 bg-white/80 p-4 text-sm font-semibold leading-7 text-slate-700">
              {item}
            </p>
          ))}
        </div>
      </section>

      <section className="rounded-[1.9rem] border border-emerald-900/10 bg-white/80 p-6 shadow-[0_18px_55px_rgba(18,38,31,0.08)]">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-800">
          Decision notes
        </p>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {ST_CROIX_VALLEY_PROFILE.decisionNotes.map((note) => (
            <p key={note} className="rounded-[1.3rem] border border-emerald-900/10 bg-[#f7f5ef] p-4 text-sm leading-7 text-slate-700">
              {note}
            </p>
          ))}
        </div>
      </section>
    </WesternWisconsinShell>
  );
}
