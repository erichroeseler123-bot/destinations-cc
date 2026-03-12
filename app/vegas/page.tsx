import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import AdventureLaneSection from "@/app/components/dcc/AdventureLaneSection";
import CityLiveEventsSection from "@/app/components/dcc/CityLiveEventsSection";
import CityMoneyLaneSection from "@/app/components/dcc/CityMoneyLaneSection";
import PoweredByViator from "@/app/components/dcc/PoweredByViator";
import ViatorTourGrid from "@/app/components/dcc/ViatorTourGrid";
import { getViatorActionForPlace } from "@/lib/dcc/internal/viatorAction";
import { ticketmasterAdapter } from "@/lib/dcc/providers/adapters/ticketmaster";
import { getCityAdventureLane } from "@/src/data/city-adventure-lanes";
import { CITY_AUTHORITY_CONFIG } from "@/src/data/city-authority-config";
import { getCityMoneyLane } from "@/src/data/city-money-lanes";

const PAGE_URL = "https://destinationcommandcenter.com/vegas";
const VEGAS = CITY_AUTHORITY_CONFIG["las-vegas"];
const LAST_UPDATED = "2026-03-11";

const QUICK_NAV = [
  { href: "#top-tours", label: "Top Tours" },
  { href: "#strip", label: "The Strip" },
  { href: "#fremont", label: "Fremont" },
  { href: "#hoover-dam", label: "Hoover Dam" },
  { href: "#nightlife", label: "Nightlife" },
  { href: "#history", label: "Vegas History" },
];

const STRIP_HIGHLIGHTS = [
  "Use the Strip for the core Vegas mix: landmark resorts, show nights, dining blocks, and short-transfer sightseeing.",
  "Good first-time planning stacks one major evening commitment with one lighter daytime attraction instead of overscheduling both.",
  "High-conversion categories here are observation rides, helicopter night flights, resort experiences, and short guided city tours.",
];

const FREMONT_HIGHLIGHTS = [
  "Downtown works best when you want a lower-cost contrast to the Strip with classic-casino energy, street spectacle, and shorter attraction hops.",
  "This zone is strong for Neon Museum pairings, Fremont canopy visits, bar crawls, and compact half-night plans.",
  "Visitors usually combine Fremont with arts-district stops or a late dinner rather than treating it as an all-day route.",
];

const HOOVER_DAM_HIGHLIGHTS = [
  "Hoover Dam is one of the cleanest day-trip decisions from Las Vegas because transit is short and combo inventory is deep.",
  "It works as a standalone engineering/history outing or as part of larger Grand Canyon and desert routes.",
  "Morning departures are usually the easiest fit if you still want a show or nightlife block later the same day.",
];

const NIGHTLIFE_HIGHLIGHTS = [
  "Nightlife buyers usually separate the city into clubs, dayclubs, party transport, and late-night attraction stacks.",
  "Bachelor and bachelorette traffic tends to overpack the schedule; a tighter plan converts better and feels better on the ground.",
  "Use prebooked entry or guided nightlife products when the goal is less queue risk and less coordination friction.",
];

const HISTORY_HIGHLIGHTS = [
  "Vegas history converts when it is packaged into easy landmark clusters: Rat Pack mythology, Mob Museum, Neon Museum, and old-strip storytelling.",
  "This lane works especially well for visitors who want a non-gambling daytime block before a show-heavy evening.",
  "History-focused half-days pair well with Fremont or downtown routing rather than another long desert excursion.",
];

const CASINO_GROUPS = [
  {
    title: "Strip anchor resorts",
    items: ["Bellagio", "Caesars Palace", "Venetian and Palazzo", "Wynn and Encore"],
  },
  {
    title: "Big-night venues",
    items: ["MGM Grand", "Cosmopolitan", "Resorts World", "Aria and Park MGM"],
  },
  {
    title: "Downtown contrasts",
    items: ["Golden Nugget", "The D", "Fremont Street cluster", "Arts District nearby"],
  },
];

const FAQ = VEGAS.faq;

export const metadata: Metadata = {
  title: VEGAS.seoTitle,
  description: VEGAS.seoDescription,
  keywords: VEGAS.keywords,
  alternates: { canonical: "/vegas" },
  openGraph: {
    title: "Las Vegas Travel Guide | Tours, Shows, and Logistics",
    description:
      "Mobile-first Las Vegas guide for Strip planning, Fremont routing, Hoover Dam tours, nightlife, and bookable attractions.",
    url: PAGE_URL,
    type: "website",
  },
};

function JsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": PAGE_URL,
        url: PAGE_URL,
        name: "Las Vegas Travel Guide",
        description:
          "Las Vegas planning guide with bookable tours, show-night context, nightlife routing, and practical attraction sections.",
        dateModified: LAST_UPDATED,
      },
      {
        "@type": "TouristDestination",
        name: "Las Vegas",
        url: PAGE_URL,
        touristType: VEGAS.structuredDataHints,
      },
      {
        "@type": "FAQPage",
        mainEntity: FAQ.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.a,
          },
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Cities", item: "https://destinationcommandcenter.com/cities" },
          { "@type": "ListItem", position: 2, name: "Las Vegas", item: PAGE_URL },
        ],
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export default async function VegasPage() {
  const moneyLane = getCityMoneyLane("las-vegas");
  const adventureLane = getCityAdventureLane("las-vegas");
  const viatorAction = await getViatorActionForPlace({
    slug: "las-vegas",
    name: "Las Vegas",
    citySlug: "las-vegas",
  });
  const ticketmasterResult = await ticketmasterAdapter.fetch({
    lat: 36.1147,
    lon: -115.1728,
    radius_km: 30,
    size: 8,
  });

  const fallbackTours = [
    { label: "Grand Canyon tours from Las Vegas", query: "grand canyon tour from las vegas" },
    { label: "Grand Canyon helicopter tours", query: "grand canyon helicopter tour las vegas" },
    { label: "Hoover Dam tours", query: "hoover dam tour from las vegas" },
    { label: "Las Vegas helicopter night tours", query: "las vegas helicopter night tour" },
    { label: "Red Rock Canyon tours", query: "red rock canyon tour from las vegas" },
    { label: "Las Vegas nightlife experiences", query: "las vegas nightlife experience" },
  ];

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <JsonLd />
      <div className="mx-auto max-w-6xl px-6 py-12 md:py-16 space-y-8 md:space-y-10">
        <header className="overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.22),transparent_35%),linear-gradient(180deg,rgba(24,24,27,0.92),rgba(9,9,11,0.96))] p-6 md:p-8 shadow-[0_28px_80px_rgba(0,0,0,0.45)]">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-5">
              <p className="text-xs uppercase tracking-[0.26em] text-amber-300">DCC Vegas Layer</p>
              <div className="space-y-3">
                <h1 className="max-w-3xl text-4xl font-black tracking-tight md:text-6xl">
                  Las Vegas 2026: shows, day trips, nightlife, and high-intent tours
                </h1>
                <p className="max-w-3xl text-base text-zinc-300 md:text-lg">
                  Use DCC to structure Vegas around what actually converts and what actually fits:
                  Strip nights, Fremont contrasts, Hoover Dam and canyon day trips, and bookable tour inventory.
                </p>
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Last updated: March 2026</p>
              </div>

              <div className="flex flex-wrap gap-3">
                <a
                  href="#top-tours"
                  className="inline-flex items-center justify-center rounded-2xl bg-orange-500 px-5 py-3 font-semibold text-white hover:bg-orange-400"
                >
                  Browse top Vegas tours
                </a>
                <a
                  href="#shows"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/15 px-5 py-3 font-semibold text-zinc-100 hover:bg-white/10"
                >
                  See shows and events
                </a>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {QUICK_NAV.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-200 hover:bg-white/10"
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {VEGAS.pillars.map((pillar) => (
                <div
                  key={pillar}
                  className="rounded-2xl border border-white/10 bg-black/25 p-4 text-sm text-zinc-200"
                >
                  {pillar}
                </div>
              ))}
              <div className="rounded-2xl border border-orange-400/20 bg-orange-500/10 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-orange-300">Why this page makes money</p>
                <p className="mt-2 text-sm text-zinc-200">
                  Vegas buyers usually choose between one big desert day trip, one premium night activity,
                  and one flexible sightseeing block. That is exactly where tour handoffs convert.
                </p>
              </div>
            </div>
          </div>
        </header>

        {moneyLane ? <CityMoneyLaneSection config={moneyLane} tone="amber" /> : null}

        <div id="top-tours">
          <ViatorTourGrid
            placeName="Las Vegas"
            title="Top Las Vegas tours and bookable experiences"
            description="This block uses the existing DCC Viator action layer to surface high-intent Vegas inventory first: canyon routes, helicopter products, dam trips, desert experiences, and nightlife-adjacent bookings."
            products={viatorAction.products}
            fallbacks={fallbackTours}
          />
        </div>

        <section className="grid gap-4 md:grid-cols-2">
          <Link
            href="/las-vegas/best-day-trips"
            className="rounded-3xl border border-cyan-400/20 bg-cyan-500/10 p-6 shadow-[0_16px_50px_rgba(0,0,0,0.35)] hover:bg-cyan-500/15"
          >
            <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">Best Of Spoke</p>
            <h2 className="mt-3 text-2xl font-bold">Best day trips from Las Vegas</h2>
            <p className="mt-2 text-zinc-200">
              A cleaner commercial page for Grand Canyon, Hoover Dam, Antelope Canyon, and desert route buyers.
            </p>
          </Link>
          <Link
            href="/las-vegas/helicopter-tours"
            className="rounded-3xl border border-cyan-400/20 bg-cyan-500/10 p-6 shadow-[0_16px_50px_rgba(0,0,0,0.35)] hover:bg-cyan-500/15"
          >
            <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">Activity Hub</p>
            <h2 className="mt-3 text-2xl font-bold">Las Vegas helicopter tours</h2>
            <p className="mt-2 text-zinc-200">
              A dedicated landing page for Strip flights, Grand Canyon helicopter products, and premium aerial inventory.
            </p>
          </Link>
        </section>

        {adventureLane ? <AdventureLaneSection config={adventureLane} /> : null}

        <section className="grid gap-4 md:grid-cols-3">
          <QuickCard
            title="The Strip"
            body="Best for first-time Vegas buyers, show-night planning, flagship resorts, and short-transfer paid attractions."
          />
          <QuickCard
            title="Fremont"
            body="Best for downtown energy, Neon Museum pairings, bar routes, and old-Vegas contrast without a full-day commitment."
          />
          <QuickCard
            title="Hoover Dam and Desert"
            body="Best for the cleanest day-trip decision from the city, especially if you want history, engineering, or a Grand Canyon combo."
          />
        </section>

        <ContentSection
          id="strip"
          eyebrow="Core Vegas"
          title="The Strip is still the main decision surface"
          intro="Most Vegas visitors still build the trip around the Strip, but the strongest route is usually one daytime attraction, one dinner block, and one evening commitment instead of constant movement."
          bullets={STRIP_HIGHLIGHTS}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {CASINO_GROUPS[0].items.concat(CASINO_GROUPS[1].items).map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-zinc-200">
                {item}
              </div>
            ))}
          </div>
        </ContentSection>

        <ContentSection
          id="fremont"
          eyebrow="Downtown"
          title="Fremont and downtown give Vegas a second mode"
          intro="Use downtown when the Strip starts to feel repetitive or overbuilt. It gives you a more compact night with easier attraction pairings and a different price/energy profile."
          bullets={FREMONT_HIGHLIGHTS}
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {["Fremont Street Experience", "Neon Museum", "Container Park", "Golden Nugget and the downtown core"].map(
              (item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-zinc-200"
                >
                  {item}
                </div>
              )
            )}
          </div>
        </ContentSection>

        <ContentSection
          id="hoover-dam"
          eyebrow="Day Trip"
          title="Hoover Dam remains one of the easiest upsells from Las Vegas"
          intro="It is close enough to fit a real Vegas itinerary, broad enough to work for couples, families, and history-led buyers, and often bundles well with bigger canyon products."
          bullets={HOOVER_DAM_HIGHLIGHTS}
        >
          <div className="grid gap-3 md:grid-cols-3">
            <IntentCard
              title="Express dam tours"
              body="Shorter round-trips for travelers protecting the evening for shows, dinner, or nightlife."
            />
            <IntentCard
              title="Dam plus Grand Canyon"
              body="Higher-ticket combo inventory for visitors trying to make one desert day do more work."
            />
            <IntentCard
              title="Helicopter and scenic upgrades"
              body="Premium inventory for shorter stays where time matters more than absolute budget."
            />
          </div>
        </ContentSection>

        <ContentSection
          id="nightlife"
          eyebrow="Night Planning"
          title="Nightlife works better when it is treated like routing, not chaos"
          intro="The strongest nightlife pages do not just list clubs. They help visitors choose the right night shape: one show plus one bar, one club plus transport, or one hosted package instead of fragmented decision-making."
          bullets={NIGHTLIFE_HIGHLIGHTS}
        >
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {["Nightclubs", "Dayclubs", "Party transport", "Bachelor and bachelorette planning"].map(
              (item) => (
                <IntentCard
                  key={item}
                  title={item}
                  body="High-intent Vegas buyer lane that pairs well with prebooked entry, premium tours, or reduced-friction group planning."
                />
              )
            )}
          </div>
        </ContentSection>

        <ContentSection
          id="history"
          eyebrow="Culture and Context"
          title="Vegas history is a real booking lane, not filler"
          intro="A lot of visitors want at least one non-casino daytime block. History and old-Vegas storytelling fill that slot well and keep the page from being only clubs and canyon products."
          bullets={HISTORY_HIGHLIGHTS}
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {["Neon Museum", "Mob Museum", "Atomic Museum", "Rat Pack and old-strip storytelling"].map(
              (item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-zinc-200"
                >
                  {item}
                </div>
              )
            )}
          </div>
        </ContentSection>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_16px_50px_rgba(0,0,0,0.35)]">
          <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Casino Guide</p>
              <h2 className="text-2xl font-bold">The resort map people actually care about</h2>
              <p className="text-zinc-300">
                Visitors usually are not comparing every casino. They are comparing energy profiles:
                flagship Strip icons, nightlife-heavy resorts, and downtown alternatives.
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {CASINO_GROUPS.map((group) => (
                <div key={group.title} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-400">
                    {group.title}
                  </h3>
                  <div className="mt-3 space-y-2 text-sm text-zinc-200">
                    {group.items.map((item) => (
                      <div key={item}>{item}</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="shows">
          <CityLiveEventsSection
            citySlug="las-vegas"
            cityName="Las Vegas"
            venues={VEGAS.eventVenues}
            ticketQueries={VEGAS.eventQueries}
            festivals={VEGAS.festivals}
            featuredEvents={ticketmasterResult.data.map((event) => ({
              id: event.id,
              name: event.name,
              startDate: event.start_date,
              url: event.url,
              venueName: event.venue_name,
            }))}
            liveStatus={
              ticketmasterResult.ok
                ? "Live Ticketmaster events are loaded for the Las Vegas area."
                : ticketmasterResult.diagnostics.fallback_reason === "missing_api_key"
                  ? "Ticketmaster API key is not configured, so this section is falling back to the stable Vegas events lane."
                  : "Live Ticketmaster inventory is temporarily unavailable; use the event discovery lane below."
            }
          />
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_16px_50px_rgba(0,0,0,0.35)]">
          <h2 className="text-2xl font-bold">Las Vegas FAQ</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {FAQ.map((item) => (
              <article key={item.q} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <h3 className="font-semibold text-white">{item.q}</h3>
                <p className="mt-2 text-sm text-zinc-300">{item.a}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-bold">Other popular city nodes</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Link href="/new-orleans" className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-zinc-200 hover:bg-white/10">New Orleans</Link>
            <Link href="/miami" className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-zinc-200 hover:bg-white/10">Miami</Link>
            <Link href="/orlando" className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-zinc-200 hover:bg-white/10">Orlando</Link>
            <Link href="/alaska" className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-zinc-200 hover:bg-white/10">Alaska</Link>
          </div>
        </section>

        <PoweredByViator
          disclosure
          body="DCC uses Las Vegas as a high-intent city layer: compare day trips, nightlife routes, and attraction categories here, then continue into secure booking with Viator."
          bullets={[
            "Top tour inventory is strongest when the city page separates day-trip and nightlife intent",
            "Fremont and history sections widen the page beyond only Strip buyers",
            "Shows stay on a separate live-events lane because that inventory changes faster",
          ]}
          className="bg-white/5"
        />

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-bold">Linked authority pages</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {VEGAS.linkedPages.map((page) => (
              <Link
                key={page.href}
                href={page.href}
                className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-zinc-200 hover:bg-white/10"
              >
                {page.label}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function QuickCard({ title, body }: { title: string; body: string }) {
  return (
    <article className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_16px_50px_rgba(0,0,0,0.25)]">
      <h2 className="text-xl font-bold">{title}</h2>
      <p className="mt-2 text-sm text-zinc-300">{body}</p>
    </article>
  );
}

function ContentSection({
  id,
  eyebrow,
  title,
  intro,
  bullets,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  intro: string;
  bullets: string[];
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_16px_50px_rgba(0,0,0,0.35)]"
    >
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">{eyebrow}</p>
          <h2 className="text-2xl font-bold md:text-3xl">{title}</h2>
          <p className="text-zinc-300">{intro}</p>
          <div className="space-y-2 text-sm text-zinc-300">
            {bullets.map((bullet) => (
              <p key={bullet}>• {bullet}</p>
            ))}
          </div>
        </div>
        <div>{children}</div>
      </div>
    </section>
  );
}

function IntentCard({ title, body }: { title: string; body: string }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <h3 className="text-base font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm text-zinc-300">{body}</p>
    </article>
  );
}
