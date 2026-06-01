import type { Metadata } from "next";
import Link from "next/link";
import { SITE_IDENTITY } from "@/src/data/site-identity";
import JsonLd from "@/app/components/dcc/JsonLd";
import {
  buildBreadcrumbJsonLd,
  buildOrganizationJsonLd,
  buildWebPageJsonLd,
} from "@/lib/dcc/jsonld";
import { listNetworkSatellites } from "@/lib/dcc/contracts/networkSatellites";

const PAGE_TITLE = "For operators";
const PAGE_DESCRIPTION =
  "Destination Command Center routes travelers who have already accepted a specific decision corridor. Operators receive compressed, qualified intent through tracked handoffs, not random impressions.";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: `${PAGE_TITLE} | ${SITE_IDENTITY.name}`,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/operators" },
  openGraph: {
    title: `${PAGE_TITLE} | ${SITE_IDENTITY.name}`,
    description: PAGE_DESCRIPTION,
    url: `${SITE_IDENTITY.siteUrl}/operators`,
    type: "website",
  },
};

const CONTRAST = [
  {
    label: "What we do not sell",
    tone: "muted" as const,
    items: [
      "Banner ads and generic impressions",
      "Cold traffic that has not chosen anything",
      "Clicks with no decision context attached",
    ],
  },
  {
    label: "What you actually receive",
    tone: "accent" as const,
    items: [
      "Qualified traveler intent that already accepted a decision corridor",
      "A tracked route with the decision and product context preserved",
      "Partner handoffs you can capture, with fallback inventory when you are full",
    ],
  },
];

const STEPS = [
  {
    step: "1",
    title: "Traveler accepts a corridor",
    body: "On a satellite front door, the traveler commits to a specific decision lane, not a vague search. That acceptance is the qualifying event.",
  },
  {
    step: "2",
    title: "We route an accepted handoff",
    body: "The decision corridor, action, product, and source are carried into your surface as a tracked route, so the intent arrives intact.",
  },
  {
    step: "3",
    title: "Operator capture or fallback",
    body: "You capture the booking when you have capacity. When you are full or paused, the lane routes to fallback inventory instead of dying.",
  },
  {
    step: "4",
    title: "Measured end to end",
    body: "Every handoff is measured from view to booking, so strong corridors get promoted and weak ones get fixed.",
  },
];

const GLOSSARY = [
  {
    term: "Decision corridor",
    body: "A narrow, owned lane that pairs a traveler problem with one correct next move.",
  },
  {
    term: "Accepted handoff",
    body: "A traveler who has already chosen the corridor before they reach you.",
  },
  {
    term: "Qualified traveler intent",
    body: "Demand with context attached, not an anonymous click.",
  },
  {
    term: "Tracked route",
    body: "A handoff that carries decision and product context the whole way through.",
  },
  {
    term: "Partner handoff",
    body: "Intent forwarded to your booking surface with attribution preserved.",
  },
  {
    term: "Operator capture",
    body: "You convert the accepted handoff into a confirmed booking.",
  },
  {
    term: "Fallback inventory",
    body: "Where a lane routes when you are full, paused, or degraded, so the traveler is never stranded.",
  },
];

const PANEL = "rounded-[2rem] border border-white/10 bg-[#0b1017] p-6 md:p-8";

export default function OperatorsPage() {
  const satellites = listNetworkSatellites();

  return (
    <main className="min-h-screen bg-[#05070b] text-white">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            buildOrganizationJsonLd(),
            buildWebPageJsonLd({
              path: "/operators",
              name: `${PAGE_TITLE} | ${SITE_IDENTITY.name}`,
              description: PAGE_DESCRIPTION,
            }),
            buildBreadcrumbJsonLd([
              { name: "Home", item: "/" },
              { name: "For operators", item: "/operators" },
            ]),
          ],
        }}
      />

      <div className="mx-auto max-w-6xl space-y-8 px-6 py-8 md:space-y-10 md:py-12">
        <section className="rounded-[2.25rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(245,179,75,0.12),transparent_26%),linear-gradient(180deg,#0d1118_0%,#06080d_100%)] px-6 py-8 md:px-10 md:py-12">
          <div className="text-[11px] font-black uppercase tracking-[0.32em] text-[#f5b34b]">
            For operators
          </div>
          <h1 className="mt-4 max-w-3xl text-[clamp(2.4rem,6vw,4.5rem)] font-black uppercase leading-[0.92] tracking-[-0.05em] text-white text-balance">
            We send accepted decisions, not random traffic.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-white/72 md:text-lg">
            Destination Command Center routes travelers who have already accepted
            a specific decision corridor. You receive compressed, qualified intent
            through a tracked handoff, with fallback inventory when you are full.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/contact"
              className="inline-flex items-center rounded-full border border-[#f5b34b]/40 bg-[#f5b34b] px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-[#07111d] transition hover:bg-[#f7bf6a]"
            >
              Talk to us
            </Link>
            <Link
              href="/network"
              className="inline-flex items-center rounded-full border border-white/12 bg-white/[0.04] px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-white transition hover:border-[#f5b34b]/40 hover:bg-white/[0.07]"
            >
              How the network works
            </Link>
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-2">
          {CONTRAST.map((col) => (
            <div
              key={col.label}
              className={
                col.tone === "accent"
                  ? "rounded-[2rem] border border-[#f5b34b]/30 bg-[#f5b34b]/[0.06] p-6 md:p-8"
                  : "rounded-[2rem] border border-white/10 bg-white/[0.02] p-6 md:p-8"
              }
            >
              <div
                className={
                  col.tone === "accent"
                    ? "text-[11px] font-black uppercase tracking-[0.24em] text-[#f5b34b]"
                    : "text-[11px] font-black uppercase tracking-[0.24em] text-white/50"
                }
              >
                {col.label}
              </div>
              <ul className="mt-5 space-y-3">
                {col.items.map((item) => (
                  <li
                    key={item}
                    className="text-sm leading-7 text-white/78"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <section className={PANEL}>
          <div className="max-w-2xl">
            <div className="text-[11px] font-black uppercase tracking-[0.28em] text-[#f5b34b]">
              How the handoff works
            </div>
            <h2 className="mt-3 text-3xl font-black uppercase tracking-[-0.04em] text-white text-balance">
              From accepted decision to operator capture.
            </h2>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-4">
            {STEPS.map((item) => (
              <div
                key={item.step}
                className="rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-5"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#f5b34b]/40 text-sm font-black text-[#f5b34b]">
                  {item.step}
                </div>
                <div className="mt-4 text-base font-bold tracking-[-0.01em] text-white">
                  {item.title}
                </div>
                <p className="mt-2 text-sm leading-7 text-white/68">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className={PANEL}>
          <div className="max-w-2xl">
            <div className="text-[11px] font-black uppercase tracking-[0.28em] text-[#f5b34b]">
              Active corridors
            </div>
            <h2 className="mt-3 text-3xl font-black uppercase tracking-[-0.04em] text-white text-balance">
              Lanes already routing qualified intent.
            </h2>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {satellites.map((satellite) => (
              <div
                key={satellite.id}
                className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5"
              >
                <div className="text-lg font-bold tracking-[-0.01em] text-white">
                  {satellite.name}
                </div>
                <p className="mt-2 text-sm leading-7 text-white/72">
                  <span className="text-white/50">Corridor: </span>
                  {satellite.decisionCompressed}
                </p>
                <p className="mt-2 text-sm leading-7 text-white/72">
                  <span className="text-white/50">Fulfillment today: </span>
                  {satellite.fulfillment}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className={PANEL}>
          <div className="text-[11px] font-black uppercase tracking-[0.28em] text-[#f5b34b]">
            The vocabulary
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {GLOSSARY.map((item) => (
              <div
                key={item.term}
                className="rounded-[1.3rem] border border-white/10 bg-white/[0.03] p-5"
              >
                <div className="text-sm font-bold uppercase tracking-[0.08em] text-white">
                  {item.term}
                </div>
                <p className="mt-2 text-sm leading-7 text-white/66">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-2">
          <Link
            href="/contact"
            className="rounded-[1.4rem] border border-[#f5b34b]/25 bg-[#f5b34b] px-5 py-5 text-sm font-black uppercase tracking-[0.16em] text-[#07111d] transition hover:bg-[#f7bf6a]"
          >
            Become a corridor partner
          </Link>
          <Link
            href="/network"
            className="rounded-[1.4rem] border border-white/10 bg-white/[0.03] px-5 py-5 text-sm font-black uppercase tracking-[0.16em] text-white transition hover:border-[#f5b34b]/40 hover:bg-white/[0.05]"
          >
            See the full stack
          </Link>
        </section>
      </div>
    </main>
  );
}
