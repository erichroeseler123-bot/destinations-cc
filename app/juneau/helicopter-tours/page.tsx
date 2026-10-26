import type { Metadata } from "next";
import Link from "next/link";
import CategoryDecisionEngineExperience from "@/app/components/dcc/CategoryDecisionEngineExperience";
import JsonLd from "@/app/components/dcc/JsonLd";
import { JUNEAU_HELICOPTER_DECISION_ENGINE } from "@/lib/dcc/decisionEngines/juneauHelicopterEngine";
import type { DecisionResult } from "@/lib/dcc/decisionEngines/types";
import { buildBreadcrumbJsonLd, buildWebPageJsonLd } from "@/lib/dcc/jsonld";
import { getEdgeSignalMapForSubjects } from "@/lib/dcc/routing/edge-signals";
import {
  buildDccJuneauHelicopterGoUrl,
  JUNEAU_HELICOPTER_GO_PATH,
  JUNEAU_HELICOPTER_SIGNAL_SUBJECT_IDS,
  resolveGoRedirect,
} from "@/lib/dcc/routing/middleware";

const PAGE_URL = "https://destinationcommandcenter.com/juneau/helicopter-tours";

type SearchParams = {
  date?: string;
};

const EXPERIENCE_LANES = [
  {
    title: "Glacier landing flights",
    body: "Best for cruise visitors who want the cleanest Juneau helicopter category and a strong one-day premium memory.",
    query: "glacier landing",
    directHref: "https://juneauflightdeck.com/helicopter",
  },
  {
    title: "Operator comparison (TEMSCO vs. Coastal vs. NorthStar)",
    body: "Compare check-in lead times, glacier landing zones, and trek vs. walkabout formats before selecting a flight.",
    query: "icefield explorer",
    directHref: "https://juneauflightdeck.com/temsco-vs-coastal-vs-northstar-juneau",
  },
  {
    title: "Dog sled + helicopter",
    body: "The higher-intensity premium lane for buyers who already know they want a signature snow-camp add-on.",
    query: "dog sled helicopter",
    directHref: "https://juneauflightdeck.com/juneau-dogsled-helicopter-tours",
  },
];

export const metadata: Metadata = {
  title: "Juneau Helicopter Tours | Port-Window Fit & Operator Comparison | DCC",
  description:
    "Compare Juneau helicopter flight lanes, weather-backup protocols, and direct operator rules before continuing to Juneau Flight Deck or direct operators.",
  alternates: { canonical: "/juneau/helicopter-tours" },
  keywords: [
    "juneau helicopter tours",
    "juneau glacier helicopter tours",
    "juneau cruise helicopter excursion",
    "juneau helicopter tour availability",
  ],
  openGraph: {
    title: "Juneau Helicopter Tours | Destination Command Center",
    description:
      "Decision-first Juneau helicopter routing and operator comparison for cruise port days.",
    url: PAGE_URL,
    type: "website",
  },
};

function JsonLdGraph() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@graph": [
          buildWebPageJsonLd({
            path: "/juneau/helicopter-tours",
            name: "Juneau Helicopter Tours",
            description:
              "Decision-first DCC guide for Juneau helicopter-tour travelers comparing port-window fit, weather risk, and operator differences.",
            dateModified: "2026-10-25",
            isPartOfPath: "/juneau",
          }),
          buildBreadcrumbJsonLd([
            { name: "Juneau", item: "/juneau" },
            { name: "Juneau Helicopter Tours", item: "/juneau/helicopter-tours" },
          ]),
        ],
      }}
    />
  );
}

function isValidDate(value?: string): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

export default async function JuneauHelicopterToursPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const selectedDate = isValidDate(sp.date) ? sp.date : null;
  const initialEngineAnswers = selectedDate
    ? {
        ...JUNEAU_HELICOPTER_DECISION_ENGINE.defaultExampleInput,
        date: selectedDate,
        travelMonth: Number(selectedDate.slice(5, 7)),
      }
    : JUNEAU_HELICOPTER_DECISION_ENGINE.defaultExampleInput;
  const initialEngineResult = JUNEAU_HELICOPTER_DECISION_ENGINE.evaluate(
    initialEngineAnswers,
  ) as unknown as DecisionResult<Record<string, unknown>>;

  const signalMap = await getEdgeSignalMapForSubjects([...JUNEAU_HELICOPTER_SIGNAL_SUBJECT_IDS]);
  const goHref = buildDccJuneauHelicopterGoUrl(
    selectedDate
      ? {
          date: selectedDate,
          port: "juneau",
          lane: "premium-helicopter",
          recommendationSlug: "date-first-primary",
          sourcePage: "/juneau/helicopter-tours",
          cta: "primary",
        }
      : {
          port: "juneau",
          lane: "premium-helicopter",
          recommendationSlug: "date-first-primary",
          sourcePage: "/juneau/helicopter-tours",
          cta: "primary",
        }
  );
  const resolvedPrimary = resolveGoRedirect({
    pathname: JUNEAU_HELICOPTER_GO_PATH,
    searchParams: new URLSearchParams(
      selectedDate
        ? {
            date: selectedDate,
            port: "juneau",
            lane: "premium-helicopter",
            recommendationSlug: "date-first-primary",
            sourcePage: "/juneau/helicopter-tours",
            cta: "primary",
          }
        : {
            port: "juneau",
            lane: "premium-helicopter",
            recommendationSlug: "date-first-primary",
            sourcePage: "/juneau/helicopter-tours",
            cta: "primary",
          }
    ),
    signalMap,
  });
  const primaryCtaLabel =
    resolvedPrimary?.ctaText ||
    (selectedDate
      ? `Compare Juneau Flight Deck for ${selectedDate}`
      : "Compare Juneau Helicopter Flights on Juneau Flight Deck");

  return (
    <main className="min-h-screen bg-[#07131d] text-white">
      <JsonLdGraph />
      <div className="mx-auto max-w-6xl space-y-8 px-6 py-16">
        <header className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(103,232,249,0.12),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(96,165,250,0.10),transparent_24%),linear-gradient(180deg,rgba(9,17,24,0.97),rgba(5,8,22,0.99))] p-8 shadow-[0_28px_90px_rgba(0,0,0,0.45)] md:p-10">
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Juneau Aviation &amp; Port-Window Planning</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">Juneau helicopter tours</h1>
          <p className="mt-4 text-base font-bold uppercase tracking-[0.18em] text-[#8df0cc]">
            Check port-day buffer, ceiling &amp; visibility risk, and operator rules first
          </p>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-white/82">
            Most cruise visitors only have one port call in Juneau. Verify your ship window, JNU heliport check-in lead time (45–60 minutes before flight), and weather-backup plan before booking.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/juneau"
              className="rounded-2xl border border-white/12 bg-white/6 px-5 py-3 text-sm font-semibold text-white/88 hover:bg-white/10"
            >
              Open Juneau Port-Day Planner
            </Link>
            <Link
              href="/juneau/whale-watching-tours"
              className="rounded-2xl border border-white/12 bg-white/6 px-5 py-3 text-sm text-white/88 hover:bg-white/10"
            >
              Juneau whale backup corridor
            </Link>
            <Link
              href="/hawaii/whale-watching"
              className="rounded-2xl border border-cyan-400/30 bg-cyan-950/40 px-5 py-3 text-sm text-cyan-200 hover:bg-cyan-900/50"
            >
              Explore Hawaiʻi Whale Watching Engine
            </Link>
          </div>
        </header>

        {/* Shared DCC Category Decision Engine for Juneau Helicopter Tours */}
        <CategoryDecisionEngineExperience
          engineId="juneau-helicopter-tours"
          initialAnswers={initialEngineAnswers as unknown as Record<string, unknown>}
          initialResult={initialEngineResult}
        />

        {/* Segment by Traveler Intent Cards */}
        <section className="rounded-3xl border border-cyan-400/20 bg-gradient-to-b from-cyan-950/20 to-[#07131d] p-6 md:p-8 space-y-6 shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
          <div>
            <span className="text-xs uppercase tracking-[0.24em] text-cyan-300">FLIGHT PATH SELECTION</span>
            <h2 className="mt-2 text-3xl font-black uppercase tracking-tight text-white">Compare helicopter flight lanes</h2>
            <p className="mt-2 text-sm text-white/70">
              Compare the three primary Juneau helicopter categories. Owned-network specialist links below route to <strong>Juneau Flight Deck</strong> (a DCC owned specialist site); direct FAA Part 135 operators are also listed so you can book directly.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {EXPERIENCE_LANES.map((lane) => {
              const targetHref =
                lane.directHref === "https://juneauflightdeck.com/helicopter" && selectedDate
                  ? `${lane.directHref}?date=${encodeURIComponent(selectedDate)}`
                  : lane.directHref;
              return (
                <article key={lane.title} className="rounded-2xl border border-white/10 bg-[#091724] p-5 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8df0cc]">
                      {lane.title === "Dog sled + helicopter" ? "Adventure Fit" : lane.title === "Glacier landing flights" ? "First-Time Fit" : "Operator Comparison"}
                    </span>
                    <h3 className="mt-2 text-xl font-bold text-white">{lane.title}</h3>
                    <p className="mt-3 text-xs leading-6 text-white/70">{lane.body}</p>
                  </div>
                  <div className="mt-6 space-y-2">
                    <a
                      href={targetHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-[#67e8f9] px-4 text-xs font-black uppercase tracking-[0.16em] text-[#071018] transition hover:bg-[#60a5fa]"
                    >
                      Open on Juneau Flight Deck ↗
                    </a>
                    <p className="text-[11px] text-white/55">
                      DCC owned specialist site (Juneau Flight Deck)
                    </p>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <a
              href={goHref}
              className="rounded-2xl border border-[#67e8f9]/30 bg-[linear-gradient(180deg,#67e8f9,#60a5fa)] px-5 py-3 text-sm font-black uppercase tracking-[0.16em] text-[#071018] shadow-[0_18px_38px_rgba(96,165,250,0.12)] transition hover:scale-[1.02]"
            >
              {primaryCtaLabel}
            </a>
            <a
              href="https://juneauflightdeck.com/juneau/what-to-do-if-helicopter-tour-canceled"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-2xl border border-white/12 bg-white/6 px-5 py-3 text-sm text-white/88 hover:bg-white/10"
            >
              What to do if your helicopter flight cancels (Juneau Flight Deck) ↗
            </a>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-sm leading-7 text-white/78 space-y-3">
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">
            Direct Operators &amp; Ownership Disclosure
          </div>
          <p>
            <strong>Juneau Flight Deck</strong> (<code>https://juneauflightdeck.com</code>) is a DCC owned specialist site for Juneau helicopter tours, glacier flights, and weather-sensitive aviation comparisons. Owned-site status never changes DCC&apos;s port-window math or fit conclusions.
          </p>
          <p>
            You can also inspect and book directly with Juneau&apos;s authorized glacier helicopter operators:{" "}
            <a href="https://temscoair.com/juneau-tours/" target="_blank" rel="noopener noreferrer" className="underline text-cyan-300">
              TEMSCO Helicopters
            </a>
            ,{" "}
            <a href="https://coastalhelicopters.com/tours/" target="_blank" rel="noopener noreferrer" className="underline text-cyan-300">
              Coastal Helicopters
            </a>
            , and{" "}
            <a href="https://www.northstartrekking.com/" target="_blank" rel="noopener noreferrer" className="underline text-cyan-300">
              NorthStar Trekking
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
