import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/app/components/dcc/JsonLd";
import PageIntentRouter from "@/app/components/dcc/PageIntentRouter";
import {
  buildBreadcrumbJsonLd,
  buildCollectionPageJsonLd,
  buildWebPageJsonLd,
} from "@/lib/dcc/jsonld";
import { buildSwampPlanHref } from "@/lib/dcc/warmTransfer";
import { NEW_ORLEANS_TOUR_CATEGORY_PAGES } from "@/src/data/new-orleans-city-site";

const page = NEW_ORLEANS_TOUR_CATEGORY_PAGES["swamp-tours"];
const PAGE_PATH = "/new-orleans/swamp-tours";
const PAGE_URL = "https://destinationcommandcenter.com/new-orleans/swamp-tours";
const SATELLITE_URL = "https://welcometotheswamp.com";
const PAGE_INTENT = "compare" as const;

export const metadata: Metadata = {
  title: "DCC Fast Pass | New Orleans Swamp Tours | Live Availability and Direct Bookings",
  description:
    "DCC Fast Pass for New Orleans swamp tours. Understand the main buying lanes, then hand off to a dedicated mobile-first booking surface for live availability and direct bookings.",
  alternates: { canonical: "/new-orleans/swamp-tours" },
  keywords: [
    "new orleans swamp tours",
    "new orleans airboat tours",
    "new orleans bayou tours",
    "swamp tours from new orleans",
  ],
  openGraph: {
    title: "DCC Fast Pass | New Orleans Swamp Tours",
    description:
      "DCC Fast Pass guide to New Orleans swamp-tour intent, with a direct handoff into the dedicated live-availability booking surface.",
    url: PAGE_URL,
    type: "website",
  },
};

function JsonLdGraph() {
  const laneItems = page.intents.map((intent) => ({
    name: intent.label,
    description: intent.description,
    url: buildSwampPlanHref({
      intent: "compare",
      topic: "swamp-tours",
      subtype: intent.label.toLowerCase().includes("airboat")
        ? "airboat"
        : intent.label.toLowerCase().includes("family")
          ? "families"
          : intent.label.toLowerCase().includes("half-day")
            ? "comfort"
            : "bayou",
      context: intent.label.toLowerCase().includes("family") ? "kids" : intent.label.toLowerCase().includes("half-day") ? "short-trip" : "first-time",
      sourcePage: PAGE_PATH,
    }),
  }));

  const data = {
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
        { name: "Tours", item: "/new-orleans/tours" },
        { name: "Swamp Tours", item: PAGE_PATH },
      ]),
      buildCollectionPageJsonLd({
        path: PAGE_PATH,
        name: "New Orleans swamp-tour buying lanes",
        description:
          "Decision lanes and handoff paths for visitors comparing New Orleans swamp tours before moving into the dedicated booking surface.",
        items: laneItems,
      }),
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "What does DCC do on this page?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Destination Command Center explains the main swamp-tour buying lanes, then routes visitors into the dedicated live-availability booking surface.",
            },
          },
          {
            "@type": "Question",
            name: "How does booking work?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Visitors choose a live departure or live comparison path on the satellite site and then complete the reservation with the provider or the linked booking flow.",
            },
          },
        ],
      },
    ],
  };

  return <JsonLd data={data} />;
}

export default function NewOrleansSwampToursPage() {
  const satelliteHref = buildSwampPlanHref({
    intent: "compare",
    topic: "swamp-tours",
    subtype: "comfort",
    context: "first-time",
    sourcePage: PAGE_PATH,
  });
  const mobileHandoffQr = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(PAGE_URL)}`;

  return (
    <main className="min-h-screen bg-[#050816] text-white" data-page-intent={PAGE_INTENT}>
      <JsonLdGraph />
      <div className="mx-auto max-w-6xl space-y-8 px-6 py-16">
        <header className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(125,211,252,0.12),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(74,222,128,0.10),transparent_24%),linear-gradient(180deg,rgba(9,17,24,0.97),rgba(5,8,22,0.99))] p-8 shadow-[0_28px_90px_rgba(0,0,0,0.45)] md:p-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">DCC swamp-tour lane</p>
            <div className="rounded-full border border-cyan-300/20 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-cyan-100">
              Intent: Compare
            </div>
          </div>
          <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">{page.title}</h1>
          <p className="mt-4 text-base font-bold uppercase tracking-[0.18em] text-[#8df0cc]">
            DCC Fast Pass - Real-time availability to direct bookings
          </p>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-white/82">{page.intro}</p>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-white/68">
            DCC is the discovery and routing layer here. When you are ready to book, the handoff goes to a dedicated swamp-tour surface showing live availability, and the reservation is completed directly with the provider through FareHarbor.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href={satelliteHref}
              className="rounded-2xl border border-[#7dd3fc]/30 bg-[linear-gradient(180deg,#7dd3fc,#4ade80)] px-5 py-3 text-sm font-black uppercase tracking-[0.16em] text-[#071018] shadow-[0_18px_38px_rgba(74,222,128,0.12)] transition hover:scale-[1.02]"
            >
              Get DCC Fast Pass
            </a>
            <Link href="/new-orleans/tours" className="rounded-2xl border border-white/12 bg-white/6 px-5 py-3 text-sm text-white/88 hover:bg-white/10">
              Back to New Orleans tours
            </Link>
          </div>
        </header>

        <section className="hidden items-center justify-between gap-8 rounded-3xl border border-[#8df0cc]/20 bg-[linear-gradient(135deg,rgba(17,29,31,0.96),rgba(7,14,22,0.96))] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.28)] lg:flex">
          <div className="max-w-2xl">
            <div className="text-xs uppercase tracking-[0.24em] text-[#8df0cc]">Desktop handoff</div>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-white">This site is designed for mobile.</h2>
            <p className="mt-3 text-base leading-7 text-white/76">
              DCC explains the lane here, but the fastest booking flow is on the dedicated mobile-first swamp-tour site.
            </p>
            <a
              href={satelliteHref}
              className="mt-5 inline-flex rounded-2xl border border-white/12 bg-white/6 px-5 py-3 text-sm font-medium text-white/88 hover:bg-white/10"
            >
              Open the booking surface
            </a>
          </div>
          <div className="shrink-0 rounded-[2rem] border border-white/10 bg-white p-4 text-center shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
            <img
              src={mobileHandoffQr}
              alt="QR code to open the New Orleans swamp tours page on your phone"
              width={220}
              height={220}
              className="h-[220px] w-[220px] rounded-2xl"
            />
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">Scan on your phone</p>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <article className="rounded-3xl border border-white/10 bg-white/[0.05] p-6">
            <h2 className="text-2xl font-bold">How this lane works</h2>
            <div className="mt-4 space-y-4 text-sm leading-7 text-white/78">
              <p>
                Swamp-tour buyers usually already know the activity. The real friction is figuring out which type of ride fits the day, whether there are open spots, and how to move straight into a live departure without bouncing through generic aggregator pages.
              </p>
              <p>
                DCC handles the explanation and intent routing. The satellite handles the live slot surface. The booking is then completed directly with the provider through FareHarbor, so the visitor feels like they are booking at the source instead of through a vague middle layer.
              </p>
            </div>
          </article>
          <article className="rounded-3xl border border-white/10 bg-black/20 p-6">
            <div className="text-xs uppercase tracking-[0.18em] text-cyan-300">Booking notice</div>
            <p className="mt-4 text-sm leading-7 text-white/76">
              DCC Fast Pass gives visitors a faster route into live availability and direct bookings with the provider through FareHarbor. DCC may earn a commission from the operator.
            </p>
            <a
              href={satelliteHref}
              className="mt-5 inline-flex rounded-2xl border border-white/12 bg-white/6 px-4 py-3 text-sm font-medium text-white/88 hover:bg-white/10"
            >
              Open live slots
            </a>
          </article>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {page.intents.map((intent) => (
            <article key={intent.label} className="rounded-3xl border border-white/10 bg-white/[0.05] p-5">
              <h2 className="text-xl font-semibold text-white">{intent.label}</h2>
              <p className="mt-3 text-sm leading-7 text-white/74">{intent.description}</p>
              <a
                href={buildSwampPlanHref({
                  intent: "compare",
                  topic: "swamp-tours",
                  subtype: intent.label.toLowerCase().includes("airboat")
                    ? "airboat"
                    : intent.label.toLowerCase().includes("family")
                      ? "families"
                      : intent.label.toLowerCase().includes("half-day")
                        ? "comfort"
                        : "bayou",
                  context: intent.label.toLowerCase().includes("family") ? "kids" : intent.label.toLowerCase().includes("half-day") ? "short-trip" : "first-time",
                  sourcePage: PAGE_PATH,
                })}
                className="mt-5 inline-flex text-sm font-medium text-cyan-200 hover:text-cyan-100"
              >
                Hand off to this lane →
              </a>
            </article>
          ))}
        </section>

        <PageIntentRouter
          intent={PAGE_INTENT}
          title="What is the best next step after this swamp-tour page?"
          summary="This DCC lane should either send visitors into the dedicated decision surface, broaden them to the full New Orleans tours layer, or move them back into city context if they are not ready to compare."
          options={[
            {
              title: "Compare on Welcome to the Swamp",
              description: "Best next step if the visitor is already close to booking and needs narrowing help, not more broad context.",
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
              title: "Open live swamp options",
              description: "Use the satellite live-options surface if the visitor already knows they want a swamp tour and just needs current choices.",
              href: buildSwampPlanHref({
                intent: "act",
                topic: "swamp-tours",
                subtype: "comfort",
                context: "first-time",
                sourcePage: PAGE_PATH,
              }),
              kind: "external",
            },
            {
              title: "Browse all New Orleans tours",
              description: "Broaden out if swamp tours are only one possibility and the visitor should compare the wider market.",
              href: "/new-orleans/tours",
              kind: "internal",
            },
            {
              title: "Go back to New Orleans authority",
              description: "Return to city context if the user is still in learn mode and deciding how the swamp fits the trip at all.",
              href: "/new-orleans",
              kind: "internal",
            },
          ]}
        />

        <section className="rounded-3xl border border-white/10 bg-white/[0.05] p-6">
          <h2 className="text-2xl font-bold">What makes swamp tours fit a New Orleans trip</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {page.bullets.map((bullet) => (
              <article key={bullet} className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/78">
                {bullet}
              </article>
            ))}
          </div>
        </section>

        <p className="text-center text-sm font-semibold uppercase tracking-[0.18em] text-white/46">
          DCC Fast Pass - To Direct Bookings
        </p>
      </div>
    </main>
  );
}
