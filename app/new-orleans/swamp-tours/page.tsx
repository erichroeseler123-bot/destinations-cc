import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/app/components/dcc/JsonLd";
import PageIntentRouter from "@/app/components/dcc/PageIntentRouter";
import {
  buildBreadcrumbJsonLd,
  buildCollectionPageJsonLd,
  buildWebPageJsonLd,
} from "@/lib/dcc/jsonld";
import { buildDccNewOrleansSwampGoUrl } from "@/lib/dcc/routing/middleware";
import { NEW_ORLEANS_TOUR_CATEGORY_PAGES } from "@/src/data/new-orleans-city-site";

const page = NEW_ORLEANS_TOUR_CATEGORY_PAGES["swamp-tours"];
const PAGE_PATH = "/new-orleans/swamp-tours";
const PAGE_URL = "https://destinationcommandcenter.com/new-orleans/swamp-tours";
const SATELLITE_URL = "https://welcometotheswamp.com";
const PAGE_INTENT = "compare" as const;

const DECISION_CARDS = [
  {
    title: "Airboat vs covered swamp boat",
    body: "Choose an airboat when the ride should feel fast, loud, and thrill-forward. Choose a covered swamp boat when shade, slower pacing, and easier conversation matter more.",
    subtype: "airboat",
    context: "first-time",
    cta: "Choose the right swamp tour",
  },
  {
    title: "Hotel pickup vs self-drive",
    body: "Hotel pickup is the safer default if you are staying near the Quarter, CBD, or Warehouse District and do not want to solve bayou transportation. Self-drive only makes sense if you already have a car and want more control over timing.",
    subtype: "pickup",
    context: "no-car",
    cta: "Compare live swamp tour options",
  },
  {
    title: "Family-safe vs thrill ride",
    body: "Families and mixed-age groups usually want the calmer, covered, lower-friction lane first. Thrill-seekers should start with airboat options and confirm age, noise, weather, and ride-style details before booking.",
    subtype: "families",
    context: "kids",
    cta: "See swamp tour picks",
  },
  {
    title: "First-timer recommendation",
    body: "If this is your first New Orleans swamp tour and you are unsure, start with the comfort-first shortlist: covered boat, simple timing, and pickup-friendly options before switching to a faster ride.",
    subtype: "comfort",
    context: "first-time",
    cta: "Compare live swamp tour options",
  },
] as const;

function buildSwampGoHref(input: {
  intent: "compare" | "act";
  subtype: string;
  context: string;
}) {
  return buildDccNewOrleansSwampGoUrl({
    intent: input.intent,
    topic: "swamp-tours",
    subtype: input.subtype,
    context: input.context,
    sourcePage: PAGE_PATH,
    decision_corridor: "swamp-tours",
    decision_action:
      input.intent === "act"
        ? "open_live_swamp_options"
        : "compare_swamp_tour_lanes",
    decision_product: "wts-swamp-plan",
    decision_option: input.subtype,
    decision_state: "continuing",
  });
}

export const metadata: Metadata = {
  title: "New Orleans Swamp Tours | Airboat vs Boat, Pickup, Family Fit",
  description:
    "Choose the right New Orleans swamp tour: airboat vs covered boat, hotel pickup vs self-drive, family-safe vs thrill ride, then compare live options.",
  alternates: { canonical: "/new-orleans/swamp-tours" },
  keywords: [
    "new orleans swamp tours",
    "new orleans airboat tours",
    "new orleans bayou tours",
    "swamp tours from new orleans",
  ],
  openGraph: {
    title: "New Orleans Swamp Tours",
    description:
      "A decision-first guide to airboat vs covered boat, pickup vs self-drive, and family-safe vs thrill-focused New Orleans swamp tours.",
    url: PAGE_URL,
    type: "website",
  },
};

function JsonLdGraph() {
  const laneItems = page.intents.map((intent) => ({
    name: intent.label,
    description: intent.description,
    url: buildSwampGoHref({
      intent: "compare",
      subtype: intent.label.toLowerCase().includes("airboat")
        ? "airboat"
        : intent.label.toLowerCase().includes("family")
          ? "families"
          : intent.label.toLowerCase().includes("half-day")
            ? "comfort"
            : "bayou",
      context: intent.label.toLowerCase().includes("family") ? "kids" : intent.label.toLowerCase().includes("half-day") ? "short-trip" : "first-time",
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
              text: "Destination Command Center helps visitors choose between airboat and covered boat, pickup and self-drive, family-safe and thrill-focused swamp tour lanes, then routes them into the dedicated comparison surface.",
            },
          },
          {
            "@type": "Question",
            name: "How does booking work?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Visitors continue through the governed DCC handoff to Welcome to the Swamp, where visible shortlist cards open current provider booking details through attributed product links.",
            },
          },
        ],
      },
    ],
  };

  return <JsonLd data={data} />;
}

export default function NewOrleansSwampToursPage() {
  const satelliteHref = buildSwampGoHref({
    intent: "compare",
    subtype: "comfort",
    context: "first-time",
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
            Choose the right swamp tour before opening booking details
          </p>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-white/82">
            The main choice is not whether the swamp is worth seeing. It is which version fits your day: fast airboat or calmer covered boat, pickup or self-drive, family-safe or thrill-first.
          </p>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-white/68">
            Start with the first-timer default if you are unsure: covered or comfort-first, pickup-friendly, and easy to fit around the rest of New Orleans. Then compare live swamp tour options on the WTS plan page, where visible product cards open attributed provider booking details.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href={satelliteHref}
              className="rounded-2xl border border-[#7dd3fc]/30 bg-[linear-gradient(180deg,#7dd3fc,#4ade80)] px-5 py-3 text-sm font-black uppercase tracking-[0.16em] text-[#071018] shadow-[0_18px_38px_rgba(74,222,128,0.12)] transition hover:scale-[1.02]"
            >
              Compare live swamp tour options
            </a>
            <Link href="/new-orleans/tours" className="rounded-2xl border border-white/12 bg-white/6 px-5 py-3 text-sm text-white/88 hover:bg-white/10">
              Back to New Orleans tours
            </Link>
          </div>
        </header>

        <section className="hidden items-center justify-between gap-8 rounded-3xl border border-[#8df0cc]/20 bg-[linear-gradient(135deg,rgba(17,29,31,0.96),rgba(7,14,22,0.96))] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.28)] lg:flex">
          <div className="max-w-2xl">
            <div className="text-xs uppercase tracking-[0.24em] text-[#8df0cc]">Desktop handoff</div>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-white">Choose the lane here, then compare options there.</h2>
            <p className="mt-3 text-base leading-7 text-white/76">
              DCC keeps the decision simple. The governed handoff preserves the choice and opens the WTS plan page, where the shortlist cards lead to attributed product exits.
            </p>
            <a
              href={satelliteHref}
              className="mt-5 inline-flex rounded-2xl border border-white/12 bg-white/6 px-5 py-3 text-sm font-medium text-white/88 hover:bg-white/10"
            >
              See swamp tour picks
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
                Swamp-tour buyers usually already know the activity. The real friction is choosing the right ride style and logistics before opening product pages.
              </p>
              <p>
                This page answers the buying decision first. The primary CTA uses <span className="font-semibold text-white">/go/new-orleans/swamp-tours</span>, preserves decision context, and sends you to WTS /plan, where shortlist cards now link to attributed product booking details.
              </p>
            </div>
          </article>
          <article className="rounded-3xl border border-white/10 bg-black/20 p-6">
            <div className="text-xs uppercase tracking-[0.18em] text-cyan-300">Booking notice</div>
            <p className="mt-4 text-sm leading-7 text-white/76">
              DCC may earn a commission when visitors continue through partner or marketplace links. Always confirm the final provider, pickup point, ride style, weather policy, and cancellation terms before paying.
            </p>
            <a
              href={satelliteHref}
              className="mt-5 inline-flex rounded-2xl border border-white/12 bg-white/6 px-4 py-3 text-sm font-medium text-white/88 hover:bg-white/10"
            >
              Choose the right swamp tour
            </a>
          </article>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {DECISION_CARDS.map((decision) => (
            <article key={decision.title} className="rounded-3xl border border-white/10 bg-white/[0.05] p-5">
              <h2 className="text-xl font-semibold text-white">{decision.title}</h2>
              <p className="mt-3 text-sm leading-7 text-white/74">{decision.body}</p>
              <a
                href={buildSwampGoHref({
                  intent: "compare",
                  subtype: decision.subtype,
                  context: decision.context,
                })}
                className="mt-5 inline-flex text-sm font-medium text-cyan-200 hover:text-cyan-100"
              >
                {decision.cta} →
              </a>
            </article>
          ))}
        </section>

        <PageIntentRouter
          intent={PAGE_INTENT}
          title="What is the best next step after this swamp-tour page?"
          summary="The best next step is the WTS plan path when the visitor is ready to compare current swamp tour options. Broaden only if they are not committed to a swamp-tour day."
          options={[
            {
              title: "Compare live swamp tour options",
              description: "Best next step if the visitor understands the ride-style and pickup tradeoffs and is ready for the WTS shortlist.",
              href: buildSwampGoHref({
                intent: "compare",
                subtype: "comfort",
                context: "first-time",
              }),
              kind: "external",
              emphasis: "primary",
            },
            {
              title: "See swamp tour picks",
              description: "Use this if the visitor already knows they want a swamp tour and just needs current product choices.",
              href: buildSwampGoHref({
                intent: "act",
                subtype: "comfort",
                context: "first-time",
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
