import type { Metadata } from "next";
import Link from "next/link";
import { SITE_IDENTITY } from "@/src/data/site-identity";
import JsonLd from "@/app/components/dcc/JsonLd";
import {
  buildBreadcrumbJsonLd,
  buildFaqJsonLd,
  buildOrganizationJsonLd,
  buildWebPageJsonLd,
} from "@/lib/dcc/jsonld";
import {
  NETWORK_SATELLITES,
  buildNetworkSatelliteHref,
  listNetworkSatellites,
} from "@/lib/dcc/contracts/networkSatellites";

const PAGE_TITLE = "How the Destination Command Center network works";
const PAGE_DESCRIPTION =
  "Destination Command Center turns traveler uncertainty into a tracked, monetizable next step. See the four layers: Earth OS place intelligence, the DCC decision and routing layer, satellite storefronts, and fulfillment partners.";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: `${PAGE_TITLE} | ${SITE_IDENTITY.name}`,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/network" },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: `${SITE_IDENTITY.siteUrl}/network`,
    type: "website",
  },
};

const STACK = [
  {
    tag: "Layer 01",
    name: "Earth OS",
    role: "Place and corridor intelligence",
    body: "The foundation. Earth OS holds what is true about a place: timing windows, route pressure, seasonality, and the local context that decides whether a move is smart or a mistake. It is the reason a recommendation is correct here and now, not generic.",
  },
  {
    tag: "Layer 02",
    name: "Destination Command Center",
    role: "Decision and routing layer",
    body: "DCC reads the situation, removes the wrong options, and compresses everything into one confident next move. Then it routes that move through a tracked handoff and measures what happened. It owns the decision, the route, and the telemetry.",
  },
  {
    tag: "Layer 03",
    name: "Satellite sites",
    role: "Public storefronts for specific intent",
    body: "Each satellite is a public brand built around one traveler problem, so the front door already speaks the visitor's language. Party at Red Rocks, Juneau Flight Deck, Welcome to the Swamp, GoSno, and Shuttleya are storefronts on top of the same decision layer.",
  },
  {
    tag: "Layer 04",
    name: "Fulfillment",
    role: "Where the booking actually happens",
    body: "Operators, GetYourGuide, Viator, Rezdy, FareHarbor, lead forms, and owned checkout. Fulfillment is replaceable. The corridor and the decision stay with DCC, so a supplier can change without the lane breaking.",
  },
] as const;

const FLOW = [
  {
    step: "1",
    title: "Classify the situation",
    body: "A traveler arrives with a messy question. DCC works out what they are actually trying to solve.",
  },
  {
    step: "2",
    title: "Compress to one move",
    body: "Earth OS context narrows the field. DCC takes a position instead of handing back a list.",
  },
  {
    step: "3",
    title: "Route a tracked handoff",
    body: "The accepted decision is carried, with its corridor context, into the right satellite or operator.",
  },
  {
    step: "4",
    title: "Measure and retune",
    body: "Every handoff is measured end to end, so winning lanes get promoted and weak ones get fixed.",
  },
] as const;

const FAQ = [
  {
    question: "What does Destination Command Center actually do?",
    answer:
      "It turns traveler uncertainty into a tracked next step. Instead of listing options, it decides the correct move for a specific situation and routes the traveler to the right place to act on it.",
  },
  {
    question: "How is this different from a travel blog or directory?",
    answer:
      "A blog explains and a directory lists. DCC takes a position. It removes the wrong options first, then hands the traveler off to fulfillment with their decision context preserved.",
  },
  {
    question: "What is Earth OS?",
    answer:
      "Earth OS is the place and corridor intelligence layer underneath DCC. It supplies timing windows, route pressure, and local context that make a recommendation correct rather than generic.",
  },
  {
    question: "Who handles the booking?",
    answer:
      "Fulfillment partners do: operators, GetYourGuide, Viator, Rezdy, FareHarbor, lead forms, or owned checkout. DCC owns the decision, the route, and the telemetry, not the final inventory.",
  },
] as const;

const PANEL =
  "rounded-[2rem] border border-white/10 bg-[#0b1017] p-6 md:p-8";

export default function NetworkPage() {
  const satellites = listNetworkSatellites();

  return (
    <main className="min-h-screen bg-[#05070b] text-white">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            buildOrganizationJsonLd(),
            buildWebPageJsonLd({
              path: "/network",
              name: PAGE_TITLE,
              description: PAGE_DESCRIPTION,
            }),
            buildBreadcrumbJsonLd([
              { name: "Home", item: "/" },
              { name: "How it works", item: "/network" },
            ]),
            buildFaqJsonLd([...FAQ]),
          ],
        }}
      />

      <div className="mx-auto max-w-6xl space-y-8 px-6 py-8 md:space-y-10 md:py-12">
        <section className="rounded-[2.25rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(245,179,75,0.12),transparent_26%),linear-gradient(180deg,#0d1118_0%,#06080d_100%)] px-6 py-8 md:px-10 md:py-12">
          <div className="text-[11px] font-black uppercase tracking-[0.32em] text-[#f5b34b]">
            How the network works
          </div>
          <h1 className="mt-4 max-w-3xl text-[clamp(2.4rem,6vw,4.5rem)] font-black uppercase leading-[0.92] tracking-[-0.05em] text-white text-balance">
            We turn travel uncertainty into a tracked, monetizable next step.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-white/72 md:text-lg">
            Travelers land on a satellite site built for their exact situation.
            Underneath, one decision and routing layer does the work and measures
            the result. Here is the whole stack, top to bottom.
          </p>
        </section>

        <section className={PANEL}>
          <div className="text-[11px] font-black uppercase tracking-[0.28em] text-[#f5b34b]">
            The four layers
          </div>
          <div className="mt-6 space-y-3">
            {STACK.map((layer) => (
              <div
                key={layer.name}
                className="grid gap-3 rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5 md:grid-cols-[180px_1fr] md:gap-6"
              >
                <div>
                  <div className="text-[11px] font-black uppercase tracking-[0.22em] text-[#f5b34b]">
                    {layer.tag}
                  </div>
                  <div className="mt-2 text-lg font-bold tracking-[-0.01em] text-white">
                    {layer.name}
                  </div>
                  <div className="mt-1 text-xs uppercase tracking-[0.14em] text-white/50">
                    {layer.role}
                  </div>
                </div>
                <p className="text-sm leading-7 text-white/72">{layer.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className={PANEL}>
          <div className="max-w-2xl">
            <div className="text-[11px] font-black uppercase tracking-[0.28em] text-[#f5b34b]">
              From question to handoff
            </div>
            <h2 className="mt-3 text-3xl font-black uppercase tracking-[-0.04em] text-white text-balance">
              A decision becomes a tracked route.
            </h2>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-4">
            {FLOW.map((item) => (
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
              Satellite storefronts
            </div>
            <h2 className="mt-3 text-3xl font-black uppercase tracking-[-0.04em] text-white text-balance">
              One layer, many front doors.
            </h2>
            <p className="mt-3 text-base leading-8 text-white/72">
              Each satellite owns a corridor. The link below carries your
              decision context into that storefront so nothing resets.
            </p>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {satellites.map((satellite) => {
              const href = buildNetworkSatelliteHref(satellite.id, {
                sourcePage: "/network",
                action: `open_${satellite.corridor.replace(/-/g, "_")}_lane`,
                cta: `network-page-${satellite.id}`,
                routeTarget: "satellite",
                revenueStage: "intent",
              });
              return (
                <div
                  key={satellite.id}
                  className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-lg font-bold tracking-[-0.01em] text-white">
                      {satellite.name}
                    </div>
                    <span className="rounded-full border border-white/12 bg-black/20 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white/55">
                      {satellite.revenueMode.replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-white/72">
                    <span className="text-white/50">Traveler problem: </span>
                    {satellite.travelerProblem}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-white/72">
                    <span className="text-white/50">Decision compressed: </span>
                    {satellite.decisionCompressed}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-white/72">
                    <span className="text-white/50">Fulfillment: </span>
                    {satellite.fulfillment}
                  </p>
                  <a
                    href={href}
                    rel="noopener"
                    className="mt-4 inline-flex text-xs font-black uppercase tracking-[0.18em] text-[#f5b34b] transition hover:text-[#f7bf6a]"
                  >
                    Enter the {satellite.name} lane
                  </a>
                </div>
              );
            })}
          </div>
        </section>

        <section className={PANEL}>
          <div className="text-[11px] font-black uppercase tracking-[0.28em] text-[#f5b34b]">
            Common questions
          </div>
          <div className="mt-6 space-y-3">
            {FAQ.map((item) => (
              <div
                key={item.question}
                className="rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-5"
              >
                <div className="text-base font-bold tracking-[-0.01em] text-white">
                  {item.question}
                </div>
                <p className="mt-2 text-sm leading-7 text-white/68">
                  {item.answer}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-2">
          <Link
            href="/operators"
            className="rounded-[1.4rem] border border-[#f5b34b]/25 bg-[#f5b34b] px-5 py-5 text-sm font-black uppercase tracking-[0.16em] text-[#07111d] transition hover:bg-[#f7bf6a]"
          >
            For operators
          </Link>
          <Link
            href="/"
            className="rounded-[1.4rem] border border-white/10 bg-white/[0.03] px-5 py-5 text-sm font-black uppercase tracking-[0.16em] text-white transition hover:border-[#f5b34b]/40 hover:bg-white/[0.05]"
          >
            Back to the front door
          </Link>
        </section>
      </div>
    </main>
  );
}
