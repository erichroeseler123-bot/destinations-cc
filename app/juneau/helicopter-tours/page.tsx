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
        : "The button routes through DCC first, then resolves into the live Juneau helicopter handoff at the edge.";

  return (
    <main className="min-h-screen bg-[#07131d] text-white">
      <JsonLdGraph />
      <div className="mx-auto max-w-6xl space-y-8 px-6 py-16">
        <header className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(103,232,249,0.12),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(96,165,250,0.10),transparent_24%),linear-gradient(180deg,rgba(9,17,24,0.97),rgba(5,8,22,0.99))] p-8 shadow-[0_28px_90px_rgba(0,0,0,0.45)] md:p-10">
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">DCC Juneau flight lane</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">Juneau helicopter tours</h1>
          <p className="mt-4 text-base font-bold uppercase tracking-[0.18em] text-[#8df0cc]">
            DCC Fast Pass - Real-time availability to direct bookings
          </p>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-white/82">
            Juneau helicopter-tour buyers behave differently from same-day activity buyers. Most cruise visitors only have one day in port, so the cleanest booking path starts with the date they will actually be in Juneau and shows only that day&apos;s helicopter inventory.
          </p>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-white/68">
            DCC explains the category and routes the buyer into a dedicated date-first booking surface. From there, the visitor sees live helicopter availability for the chosen day and completes the reservation directly with the provider through FareHarbor.
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

        <section className="hidden items-center justify-between gap-8 rounded-3xl border border-[#8df0cc]/20 bg-[linear-gradient(135deg,rgba(17,29,31,0.96),rgba(7,14,22,0.96))] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.28)] lg:flex">
          <div className="max-w-2xl">
            <div className="text-xs uppercase tracking-[0.24em] text-[#8df0cc]">Desktop handoff</div>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-white">This site is designed for mobile.</h2>
            <p className="mt-3 text-base leading-7 text-white/76">
              The dedicated Juneau helicopter site is optimized for fast cruise-day booking. Pick the exact date you will be in port and move straight into live availability.
            </p>
            <a
              href={goHref}
              className="mt-5 inline-flex rounded-2xl border border-white/12 bg-white/6 px-5 py-3 text-sm font-medium text-white/88 hover:bg-white/10"
            >
              {primaryCtaLabel}
            </a>
          </div>
          <div className="shrink-0 rounded-[2rem] border border-white/10 bg-white p-4 text-center shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
            <img
              src={mobileHandoffQr}
              alt="QR code to open the Juneau helicopter tours page on your phone"
              width={220}
              height={220}
              className="h-[220px] w-[220px] rounded-2xl"
            />
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">Scan on your phone</p>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <article className="rounded-3xl border border-white/10 bg-white/[0.05] p-6">
            <h2 className="text-2xl font-bold">Why Juneau is different</h2>
            <div className="mt-4 space-y-4 text-sm leading-7 text-white/78">
              <p>
                Helicopter tours in Juneau are usually not impulse same-day purchases in the way swamp or nightlife products can be. Cruise visitors tend to know their exact port day and only care about what is open on that one date.
              </p>
              <p>
                That is why the satellite flow starts with the date instead of a generic list. The DCC page exists to capture search intent, explain the structure, and route the visitor into a cleaner booking surface that only shows relevant helicopter slots.
              </p>
            </div>
          </article>
          <article className="rounded-3xl border border-white/10 bg-black/20 p-6">
            <div className="text-xs uppercase tracking-[0.18em] text-cyan-300">Booking notice</div>
            <p className="mt-4 text-sm leading-7 text-white/76">
              DCC Fast Pass keeps this lane date-first and helicopter-only. When you choose a slot there, the reservation is completed directly with the operator through FareHarbor. DCC may earn a commission from the operator.
            </p>
            <p className="mt-4 text-sm leading-7 text-white/62">
              {selectedDate
                ? `Current handoff date: ${selectedDate}.`
                : "If you already know your port date, add it to the URL or pick it on the satellite site first."}
            </p>
            <p className="mt-4 text-xs uppercase tracking-[0.18em] text-[#8df0cc]">{liveStateCopy}</p>
          </article>
        </section>

        <section className="rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(6,22,33,0.96),rgba(4,13,22,0.98))] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.28)]">
          <div className="max-w-3xl">
            <div className="text-xs uppercase tracking-[0.24em] text-cyan-300">Embedded booking surface</div>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-white">This is the live WTA widget DCC can drop directly into the corridor</h2>
            <p className="mt-3 text-sm leading-7 text-white/78">
              Instead of handing every traveler to a generic catalog, DCC can embed a real Juneau helicopter product with branded pricing, booking context, and attribution already attached.
            </p>
          </div>
          <div className="mt-6 overflow-hidden rounded-[28px] border border-white/10 bg-white shadow-[0_24px_70px_rgba(0,0,0,0.34)]">
            <iframe
              src={featuredWidgetHref}
              title="Juneau helicopter tour widget"
              loading="lazy"
              className="block h-[980px] w-full bg-white"
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href={featuredWidgetHref}
              target="_blank"
              rel="noreferrer"
              className="rounded-2xl border border-white/12 bg-white/6 px-5 py-3 text-sm text-white/88 hover:bg-white/10"
            >
              Open widget in a new tab
            </a>
            <p className="text-sm leading-7 text-white/60">
              The embed carries a shared handoff id, source page, placement id, and return link so WTA can report iframe views, widget CTA clicks, and downstream booking events back into DCC analytics.
            </p>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {EXPERIENCE_LANES.map((lane) => (
            <article key={lane.title} className="rounded-3xl border border-white/10 bg-white/[0.05] p-5">
              <h2 className="text-xl font-semibold text-white">{lane.title}</h2>
              <p className="mt-3 text-sm leading-7 text-white/74">{lane.body}</p>
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
                className="mt-5 inline-flex text-sm font-medium text-cyan-200 hover:text-cyan-100"
              >
                Hand off to this helicopter lane →
              </a>
            </article>
          ))}
        </section>

        <p className="text-center text-sm font-semibold uppercase tracking-[0.18em] text-white/46">
          DCC Fast Pass - To Direct Bookings
        </p>
      </div>
    </main>
  );
}
