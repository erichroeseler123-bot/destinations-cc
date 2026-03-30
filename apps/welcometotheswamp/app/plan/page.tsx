import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/app/components/JsonLd";
import WarmTransferTelemetry from "@/app/components/WarmTransferTelemetry";
import { IntentRouter } from "@/app/components/IntentRouter";
import { SITE_CONFIG } from "@/app/site-config";
import {
  buildBreadcrumbJsonLd,
  buildCollectionPageJsonLd,
  buildItemListJsonLd,
  buildWebPageJsonLd,
} from "@/lib/jsonld";
import { parseWarmTransfer, inferLaneFromTransfer, getTransferHeadline } from "@/lib/warmTransfer";
import { getLaneCopy, getShortlistForLane, getSwampProducts } from "@/lib/swampProducts";

export const pageIntent = "decide";

export const metadata: Metadata = {
  title: "Plan Your Swamp Tour | Welcome to the Swamp",
  description:
    "Canonical warm-transfer decision page for choosing the right New Orleans swamp tour before you review the shortlist.",
  alternates: { canonical: "https://welcometotheswamp.com/plan" },
};

function getDecisionShortlistCopy(packet: { subtype: string | null }, laneCopy: { title: string; intro: string } | null) {
  if (packet.subtype === "airboat-vs-boat") {
    return {
      title: "Start with the safer default, then switch to speed-first if thrill is the real priority",
      intro: "Because this handoff started with speed versus scenery, the shortlist opens on the calmer default first and still keeps the faster lane one click away.",
    };
  }
  if (packet.subtype === "types") {
    return {
      title: "These are the most useful starting lanes when the market feels too broad",
      intro: "This shortlist reduces option overload instead of pretending every swamp-tour format deserves equal attention.",
    };
  }
  if (packet.subtype === "worth-it") {
    return {
      title: "These are the strongest first-pass options if you are still pressure-testing the fit",
      intro: "The goal here is to make the value feel concrete fast, not to send you back into another abstract worth-it loop.",
    };
  }
  if (packet.subtype === "best-time") {
    return {
      title: "These are the safest first-pass options when timing and weather fit matter most",
      intro: "The shortlist starts with lower-friction options because timing questions usually signal risk reduction, not thrill-seeking.",
    };
  }
  return laneCopy;
}

function getRecheckHref(packet: { subtype: string | null; context: string | null }) {
  if (packet.subtype === "airboat-vs-boat") return "/airboat-vs-boat";
  if (packet.subtype === "with-kids" || packet.context === "kids") return "/with-kids";
  if (packet.subtype === "best-time" || packet.context === "short-trip") return "/best-time";
  if (packet.subtype === "transportation" || packet.context === "no-car") return "/transportation";
  if (packet.subtype === "worth-it") return "/worth-it";
  if (packet.subtype === "types") return "/types";
  return "/";
}

function getContextSummary(context: string | null) {
  if (context === "first-time") return "First-time visitor";
  if (context === "kids") return "Traveling with kids";
  if (context === "no-car") return "No-car / pickup-sensitive";
  if (context === "short-trip") return "Short-trip fit";
  if (context === "mixed-group") return "Mixed-age or mixed-priority group";
  return null;
}

export default async function SwampPlanPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolved = searchParams ? await searchParams : undefined;
  const packet = parseWarmTransfer(resolved);
  const lane = inferLaneFromTransfer(packet);
  const headline = getTransferHeadline(packet, lane);
  const data = await getSwampProducts();
  const shortlist = lane ? getShortlistForLane(data.products, lane, 3) : [];
  const shortlistHref = "#decision-shortlist";
  const contextLabel = getContextSummary(packet.context);
  const laneCopy = lane ? getLaneCopy(lane) : null;
  const decisionCopy = getDecisionShortlistCopy(packet, laneCopy);
  const recheckHref = getRecheckHref(packet);
  const listItems = lane
    ? shortlist.map(({ product }) => ({ product }))
    : data.products.slice(0, 3).map((product) => ({ product }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      buildWebPageJsonLd({
        path: "/plan",
        name: "Plan Your Swamp Tour",
        description:
          "Canonical WTS decision page for warm transfers from DCC into swamp-tour planning, narrowing, and shortlist selection.",
      }),
      buildBreadcrumbJsonLd([
        { name: "Welcome to the Swamp", item: "/" },
        { name: "Plan", item: "/plan" },
      ]),
      buildCollectionPageJsonLd({
        path: "/plan",
        name: laneCopy ? laneCopy.title : "Swamp-tour planning lanes",
        description: headline.intro,
        items: listItems.map(({ product }) => ({
          name: product.title,
          description: product.description || undefined,
          url: product.bookHref,
        })),
      }),
      buildItemListJsonLd({
        items: [
          {
            name: packet.intent,
            description: `Warm transfer intent: ${packet.intent}`,
          },
          {
            name: packet.subtype || "general",
            description: packet.subtype ? `Warm transfer subtype: ${packet.subtype}` : "No subtype was passed.",
          },
        ],
      }),
    ],
  };

  return (
    <main className="page-stack" data-page-intent={pageIntent}>
      <JsonLd data={jsonLd} />
      <WarmTransferTelemetry packet={packet} lane={lane} />
      <section className="hero-card hero-guide">
        <div className="router-head">
          <p className="eyebrow">Warm transfer plan</p>
          <div className="intent-pill">Intent: Decide</div>
        </div>
        <h1>{headline.title}</h1>
        <p className="lede">{headline.intro}</p>
        <div className="stack-list">
          <article className="info-card">
            <h2>What we already know about you</h2>
            <p className="muted">
              This page keeps the handoff warm instead of dumping you into a generic list. It uses the context from DCC to start with the right decision lane before you review the shortlist.
            </p>
            <div className="lane-match-grid">
              <div className="lane-match-card">
                <strong>Intent</strong>
                <span>{packet.intent}</span>
              </div>
              <div className="lane-match-card">
                <strong>Subtype</strong>
                <span>{packet.subtype || "general swamp-tour planning"}</span>
              </div>
              <div className="lane-match-card">
                <strong>Context</strong>
                <span>{contextLabel || "No special constraint passed"}</span>
              </div>
            </div>
          </article>
        </div>
        <div className="cta-row">
          <Link href={shortlistHref} className="button" data-warm-transfer-click="hero_shortlist">
            {lane ? "See this shortlist" : "See your shortlist"}
          </Link>
          <Link href={recheckHref} className="button-secondary" data-warm-transfer-click="hero_recheck_lane">
            Re-check the right question
          </Link>
        </div>
      </section>

      <section id="decision-shortlist" className="panel">
        <p className="eyebrow">Decision shortlist</p>
        <h2>{decisionCopy ? decisionCopy.title : "Best next-fit options before you compare everything"}</h2>
        <p className="muted">
          {decisionCopy ? decisionCopy.intro : "Without a subtype, this page defaults to the broadest useful shortlist. The goal is still to reduce decision friction before you jump into booking or broader research."}
        </p>
        <div className="lane-match-grid">
          {(lane
            ? shortlist
            : data.products.slice(0, 3).map((product) => ({
                product,
                pros: ["Useful starting point when DCC did not pass a narrower subtype."],
                cautions: ["Confirm comfort, pickup burden, and actual ride style before booking."],
                fitSummary: "Best used as a starting point rather than a final answer.",
              }))
          ).map(({ product, pros, cautions, fitSummary }) => (
            <article key={product.id} className="lane-match-card">
              <strong>{product.title}</strong>
              <span>{fitSummary}</span>
              <span><strong>Why it fits:</strong> {pros[0]}</span>
              <span><strong>Watch for:</strong> {cautions[0]}</span>
            </article>
          ))}
        </div>
      </section>

      <IntentRouter
        intent="decide"
        title="What should happen after this warm transfer?"
        summary="The next step should either be this shortlist, a narrower WTS question, or a move back to DCC if the real problem is still educational."
        options={[
          {
            title: lane ? "Review this shortlist" : "Review your shortlist",
            description: lane
              ? "Best next step if the warm transfer already narrowed the user into the right lane."
              : "Use this if the visitor is ready to work from the shortlist even without a narrower subtype.",
            href: shortlistHref,
            kind: "internal",
            emphasis: "primary",
            trackingId: "router_live_options",
          },
          {
            title: lane ? "Re-check this question on WTS" : "Choose the right question first",
            description: lane
              ? "Go here if the user wants to validate the current fit question before clicking into live comparison."
              : "Use one of the focused entry pages if the handoff did not pass enough context.",
            href: recheckHref,
            kind: "internal",
            trackingId: "router_recheck_lane",
          },
          {
            title: "Check transportation fit",
            description: "Use this when pickup friction, staying without a car, or transfer burden are still the actual blockers.",
            href: "/transportation",
            kind: "internal",
            trackingId: "router_logistics",
          },
          {
            title: "Go back to DCC authority",
            description: "If the user is still asking whether the swamp fits the trip at all, return them to DCC instead of forcing action.",
            href: `${SITE_CONFIG.dccOrigin}${packet.sourcePage || "/new-orleans/swamp-tours"}`,
            kind: "external",
            trackingId: "router_back_to_dcc",
          },
        ]}
      />
    </main>
  );
}
