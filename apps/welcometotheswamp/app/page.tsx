import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/app/components/JsonLd";
import { IntentRouter } from "@/app/components/IntentRouter";
import { SITE_CONFIG } from "@/app/site-config";
import {
  buildBreadcrumbJsonLd,
  buildItemListJsonLd,
  buildWebPageJsonLd,
} from "@/lib/jsonld";

export const pageIntent = "decide";

export const metadata: Metadata = {
  title: "Choose Your Swamp Tour Question | Welcome to the Swamp",
  description:
    "Choose the right New Orleans swamp-tour question before moving into the best-fit shortlist.",
  alternates: { canonical: "https://welcometotheswamp.com/" },
};

const ENTRY_PATHS = [
  {
    href: "/airboat-vs-boat",
    title: "Airboat vs boat",
    summary: "Start here if you are choosing between speed and scenery.",
  },
  {
    href: "/with-kids",
    title: "With kids",
    summary: "Start here if the group needs a calmer, easier family fit.",
  },
  {
    href: "/best-time",
    title: "Best time",
    summary: "Start here if weather, timing, or short-trip fit is the blocker.",
  },
  {
    href: "/worth-it",
    title: "Worth it?",
    summary: "Start here if you are still pressure-testing whether the swamp belongs in the trip.",
  },
  {
    href: "/transportation",
    title: "Transportation",
    summary: "Start here if pickup burden or no-car logistics are shaping the decision.",
  },
  {
    href: "/types",
    title: "Tour types",
    summary: "Start here if the market feels too broad and you need the right lane first.",
  },
] as const;

const PLAN_HREF = "/plan?intent=compare&topic=swamp-tours&subtype=types&context=first-time";

export default function HomePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      buildWebPageJsonLd({
        path: "/",
        name: "Welcome to the Swamp Question Router",
        description:
          "Homepage question router for choosing the right New Orleans swamp-tour question before moving into the shortlist.",
      }),
      buildBreadcrumbJsonLd([{ name: "Welcome to the Swamp", item: "/" }]),
      buildItemListJsonLd({
        items: ENTRY_PATHS.map((item) => ({
          name: item.title,
          description: item.summary,
          url: item.href,
        })),
      }),
    ],
  };

  return (
    <main className="page-stack" data-page-intent={pageIntent}>
      <JsonLd data={jsonLd} />
      <section className="hero-card hero-guide">
        <div className="router-head">
          <p className="eyebrow">Choose your question</p>
          <div className="intent-pill">Intent: Compare</div>
        </div>
        <h1>What are you trying to figure out before you choose a swamp tour?</h1>
        <p className="lede">
          Pick the question that matches your real blocker, then move straight into the right entry flow and shortlist.
        </p>
        <div className="cta-row">
          <Link href={PLAN_HREF} className="button">
            See the right tours for you
          </Link>
        </div>
      </section>

      <section className="panel">
        <p className="eyebrow">Pick your question</p>
        <div className="card-grid">
          {ENTRY_PATHS.map((item) => (
            <Link key={item.href} href={item.href} className="decision-card">
              <h2>{item.title}</h2>
              <p className="muted">{item.summary}</p>
            </Link>
          ))}
        </div>
      </section>

      <IntentRouter
        intent="compare"
        title="Choose the next step based on the decision you actually need to make"
        summary="WTS should route direct visitors into the same decision lanes and shortlist flow that DCC uses, not act like a generic tour browser."
        options={[
          {
            title: "I need the main shortlist now",
            description: "Use this if you already know you want a swamp tour and just need the best-fit options.",
            href: PLAN_HREF,
            kind: "internal",
            emphasis: "primary",
          },
          {
            title: "I need help with ride style",
            description: "Start with airboat versus boat if speed, noise, and scenery are still unresolved.",
            href: "/airboat-vs-boat",
            kind: "internal",
          },
          {
            title: "I need help with family or pickup fit",
            description: "Start with the family or transportation entry if the day has practical constraints.",
            href: "/with-kids",
            kind: "internal",
          },
          {
            title: "I still need broader swamp context",
            description: "Go back to DCC if the real question is still educational rather than comparative.",
            href: `${SITE_CONFIG.dccOrigin}/new-orleans/swamp-tours`,
            kind: "external",
          },
        ]}
      />
    </main>
  );
}
