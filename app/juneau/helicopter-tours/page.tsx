import { randomUUID } from "crypto";
import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/app/components/dcc/JsonLd";
import { buildBreadcrumbJsonLd, buildWebPageJsonLd } from "@/lib/dcc/jsonld";
import { getEdgeSignalMapForSubjects } from "@/lib/dcc/routing/edge-signals";
import {
  buildDccJuneauHelicopterGoUrl,
  JUNEAU_HELICOPTER_GO_PATH,
  JUNEAU_HELICOPTER_SIGNAL_SUBJECT_IDS,
  resolveGoRedirect,
} from "@/lib/dcc/routing/middleware";
import { buildWtaProductWidgetUrl } from "@/lib/wta/embed";

const PAGE_URL = "https://destinationcommandcenter.com/juneau/helicopter-tours";

type SearchParams = {
  date?: string;
};

const EXPERIENCE_LANES = [
  {
    title: "Glacier landing flights",
    body: "Best for cruise visitors who want the cleanest Juneau helicopter category and a strong one-day premium memory.",
    query: "glacier landing",
  },
  {
    title: "Icefield explorer flights",
    body: "A good lane when the buyer wants broad scenic value without overcomplicating the decision with operator research.",
    query: "icefield explorer",
  },
  {
    title: "Dog sled + helicopter",
    body: "The higher-intensity premium lane for buyers who already know they want a signature Alaska-style add-on.",
    query: "dog sled helicopter",
  },
];

export const metadata: Metadata = {
  title: "DCC Fast Pass | Juneau Helicopter Tours | Date-First Direct Bookings",
  description:
    "DCC Fast Pass for Juneau helicopter tours. DCC explains the buying lane, then routes visitors into a date-first booking surface built for cruise-day planning and direct bookings.",
  alternates: { canonical: "/juneau/helicopter-tours" },
  keywords: [
    "juneau helicopter tours",
    "juneau glacier helicopter tours",
    "juneau cruise helicopter excursion",
    "juneau helicopter tour availability",
  ],
  openGraph: {
    title: "DCC Fast Pass | Juneau Helicopter Tours",
    description:
      "A DCC Fast Pass routing page for Juneau helicopter-tour intent, built around date-first cruise-day booking behavior.",
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
              "Decision-first DCC feeder for Juneau helicopter-tour buyers who need a date-first handoff into live availability.",
            dateModified: "2026-04-10",
            isPartOfPath: "/command",
          }),
          buildBreadcrumbJsonLd([
            { name: "Command", item: "/command" },
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
  const primaryCtaLabel = resolvedPrimary?.ctaText || (selectedDate ? `Get DCC Fast Pass for ${selectedDate}` : "Get DCC Fast Pass");
  const widgetHandoffId = resolvedPrimary?.handoffId || randomUUID();
  const featuredWidgetHref = buildWtaProductWidgetUrl({
    company: "coastalhelicopters",
    item: "413056",
    attribution: {
      handoffId: widgetHandoffId,
      source: "dcc",
      sourceSlug: "dcc-juneau-helicopter-embed",
      sourcePage: "/juneau/helicopter-tours",
      topicSlug: "helicopter-tours",
      portSlug: "juneau-alaska",
      productSlug: "icefield-excursion",
      eventDate: selectedDate || undefined,
      returnPath: "/juneau/helicopter-tours",
      embedDomain: "destinationcommandcenter.com",
      embedPath: "/juneau/helicopter-tours",
      widgetPlacement: "inline-primary",
      embedId: "juneau-helicopter-inline-primary",
    },
  });
  const mobileHandoffQr = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(goHref)}`;
  const liveStateCopy =
    resolvedPrimary?.status === "fallback"
      ? "Helicopter inventory is not the cleanest live lane right now. The go path will fall back to a safer Juneau decision lane."
      : resolvedPrimary?.status === "warning"
        ? "Live signals are active for the helicopter lane. The go path stays in the primary handoff, but the CTA reflects tighter live conditions."
        : "The button routes through DCC first, then resolves into the live Juneau helicopter handoff.";

  return (
    <main className="min-h-screen bg-[#07131d] text-white">
      <JsonLdGraph />
      <div className="mx-auto max-w-6xl space-y-8 px-6 py-16">
        <header className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(103,232,249,0.12),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(96,165,250,0.10),transparent_24%),linear-gradient(180deg,rgba(9,17,24,0.97),rgba(5,8,22,0.99))] p-8 shadow-[0_28px_90px_rgba(0,0,0,0.45)] md:p-10">
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Juneau Shore Excursions</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">Juneau helicopter tours</h1>
          <p className="mt-4 text-base font-bold uppercase tracking-[0.18em] text-[#8df0cc]">
            Guaranteed flight lane – Real-time availability & direct bookings
          </p>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-white/82">
            Most cruise visitors only have one day in port, so the cleanest booking path starts with the date you will actually be in Juneau and shows only that day&apos;s helicopter inventory.
          </p>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-white/68">
            Choose your helicopter flight lane below to check live availability for your chosen date and complete the reservation directly with the operator.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href={goHref}
              className="rounded-2xl border border-[#67e8f9]/30 bg-[linear-gradient(180deg,#67e8f9,#60a5fa)] px-5 py-3 text-sm font-black uppercase tracking-[0.16em] text-[#071018] shadow-[0_18px_38px_rgba(96,165,250,0.12)] transition hover:scale-[1.02]"
            >
              {primaryCtaLabel}
            </a>
            <Link href="/juneau/whale-watching-tours" className="rounded-2xl border border-white/12 bg-white/6 px-5 py-3 text-sm text-white/88 hover:bg-white/10">
              Juneau whale corridor
            </Link>
          </div>
        </header>

        {/* Segment by Traveler Intent Cards */}
        <section className="rounded-3xl border border-cyan-400/20 bg-gradient-to-b from-cyan-950/20 to-[#07131d] p-6 md:p-8 space-y-6 shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
          <div>
            <span className="text-xs uppercase tracking-[0.24em] text-cyan-300">FLIGHT PATH SELECTION</span>
            <h2 className="mt-2 text-3xl font-black uppercase tracking-tight text-white">Segment by traveler intent</h2>
            <p className="mt-2 text-sm text-white/70">
              Compare the three canonical Juneau helicopter flight lanes. Select your fit and view live real-time schedules.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {EXPERIENCE_LANES.map((lane) => (
              <article key={lane.title} className="rounded-2xl border border-white/10 bg-[#091724] p-5 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8df0cc]">
                    {lane.title === "Dog sled + helicopter" ? "Adventure Fit" : lane.title === "Glacier landing flights" ? "First-Time Fit" : "Scenic Fit"}
                  </span>
                  <h3 className="mt-2 text-xl font-bold text-white">{lane.title}</h3>
                  <p className="mt-3 text-xs leading-6 text-white/70">{lane.body}</p>
                </div>
                <div className="mt-6">
                  <a
                    href={buildDccJuneauHelicopterGoUrl({
                      date: selectedDate || undefined,
                      port: "juneau",
                      lane: "premium-helicopter",
                      recommendationSlug: lane.query.replace(/\s+/g, "-"),
                      sourcePage: "/juneau/helicopter-tours",
                      cta: lane.query,
                      q: lane.query,
                    })}
                    className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-[#67e8f9] px-4 text-xs font-black uppercase tracking-[0.16em] text-[#071018] transition hover:bg-[#60a5fa]"
                  >
                    View Live Availability
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-sm leading-7 text-white/78 animate-fade-in">
          <p>
            Bookings made through these links are processed directly with registered local operators via FareHarbor. Flight safety, weather protocols, and cancelation guarantees are managed directly by your operator. We recommend booking early, as Juneau helicopter inventory is tightly limited on cruise arrival days.
          </p>
        </section>
      </div>
    </main>
  );
}
