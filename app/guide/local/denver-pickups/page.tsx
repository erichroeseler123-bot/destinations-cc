import type { Metadata } from "next";
import JsonLd from "@/app/components/dcc/JsonLd";
import RedRocksAuthorityPage from "@/app/components/dcc/RedRocksAuthorityPage";
import { buildBreadcrumbJsonLd, buildCollectionPageJsonLd, buildWebPageJsonLd } from "@/lib/dcc/jsonld";
import { PARR_OPERATOR } from "@/lib/parrOperator";
import { buildParrPrivateRedRocksUrl, buildParrSharedRedRocksUrl } from "@/lib/dcc/contracts/dccParrBridge";
import { getLocalFallbackImageSetForEntity } from "@/src/lib/media/source-local";

const PAGE_PATH = "/guide/local/denver-pickups";
const PAGE_URL = "https://destinationcommandcenter.com/guide/local/denver-pickups";
const PICKUP_ITEMS = [
  {
    name: "Downtown Denver pickup anchors",
    description: "Best fit for visitors staying in central Denver hotels who want the simplest ride-home plan.",
    url: buildParrSharedRedRocksUrl(),
  },
  {
    name: "Golden pickup anchors",
    description: "Useful when the group is staying closer to the foothills and wants a shorter pre-show move.",
    url: buildParrSharedRedRocksUrl(),
  },
  {
    name: "Private ride lane",
    description: "Best when the group wants one vehicle, one pickup plan, and tighter control over the whole night.",
    url: buildParrPrivateRedRocksUrl({ product: "parr-suburban" }),
  },
];

export const metadata: Metadata = {
  title: "Denver Pickup Locations for Red Rocks Shuttles | Fastest Way to Book the Right Ride",
  description:
    "See the main Denver and Golden pickup options for Red Rocks shuttle service, who each pickup lane fits best, and the fastest route into booking.",
  alternates: { canonical: PAGE_PATH },
  keywords: [
    "denver pickup locations red rocks shuttle",
    "red rocks shuttle pickup denver",
    "where does red rocks shuttle pick up",
    "denver to red rocks shuttle pickup locations",
  ],
  openGraph: {
    title: "Denver Pickup Locations for Red Rocks Shuttles",
    description:
      "High-intent Red Rocks transport page built to confirm pickup options fast and move riders straight into booking.",
    url: PAGE_URL,
    type: "article",
  },
};

function JsonLdGraph() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@graph": [
          buildWebPageJsonLd({
            path: PAGE_PATH,
            name: "Denver pickup locations for Red Rocks shuttles",
            description:
              "A high-intent landing page for visitors trying to choose the right Denver or Golden pickup lane for Red Rocks shuttle service.",
            dateModified: "2026-03-29",
            isPartOfPath: "/red-rocks-transportation",
          }),
          buildBreadcrumbJsonLd([
            { name: "Red Rocks Transportation", item: "/red-rocks-transportation" },
            { name: "Denver Pickups", item: PAGE_PATH },
          ]),
          buildCollectionPageJsonLd({
            path: PAGE_PATH,
            name: "Red Rocks pickup lanes from Denver and Golden",
            description:
              "Pickup-anchor guidance and booking paths for visitors comparing Denver and Golden shuttle boarding options before a Red Rocks show.",
            items: PICKUP_ITEMS,
          }),
        ],
      }}
    />
  );
}

export default function DenverPickupsPage() {
  const imageSet = getLocalFallbackImageSetForEntity("venue", "red-rocks-amphitheatre");

  return (
    <>
      <JsonLdGraph />
      <RedRocksAuthorityPage
        eyebrow="DCC Pickup Guide"
        title="Denver pickup locations for Red Rocks shuttles should answer one question fast: where should you board so the ride home stays clean?"
        intro="If you landed here from an old downtown or pickup link, you are already in high-intent planning mode. You do not need more generic transport theory. You need the pickup lane that fits where you are staying, how much control you want, and how that choice feeds into the main Red Rocks transport decision."
        sourcePath={PAGE_PATH}
        primaryCtaHref="/red-rocks-transportation"
        primaryCtaLabel="Open Transport Decision Hub"
        secondaryCtaHref={buildParrPrivateRedRocksUrl({ product: "parr-suburban" })}
        secondaryCtaLabel="Book Private If You Are Sure"
        buyerIntentLabel="Denver pickup locations for Red Rocks"
        heroImageSrc={imageSet?.hero?.src || "https://www.partyatredrocks.com/hero/hero-home.jpg"}
        heroImageAlt={imageSet?.hero?.alt || "Red Rocks concert transportation from Denver pickup anchors"}
        operatorAttribution={PARR_OPERATOR}
        notice={
          <section className="rounded-[1.9rem] border border-white/10 bg-white/[0.06] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.26)]">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">You are in the right place if</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-7 text-zinc-300">You are staying in Denver and want a clean, known pickup anchor.</div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-7 text-zinc-300">You want to avoid parking and post-show Uber pickup problems.</div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-7 text-zinc-300">You need to decide whether shared shuttle or private ride fits the night better.</div>
            </div>
          </section>
        }
        sections={[
          {
            title: "Start with the pickup lane that matches where you are staying",
            body: "Downtown Denver pickup anchors are usually the best fit for visitors staying in central hotels and rentals. Golden works better when the group is already west of the city and wants a shorter approach into Red Rocks. If the group wants one vehicle and tighter timing, skip the shared-stop question and go straight to the private ride lane.",
            bullets: [
              "Downtown Denver: strongest default for most visitors.",
              "Golden: cleaner fit for foothills-adjacent stays.",
              "Private ride: strongest when control matters more than seat price.",
            ],
          },
          {
            title: "What each option is really solving",
            body: "Shared shuttle pickup locations solve the ride-home problem in advance. Private rides solve both the pickup and group-control problem. What breaks most Red Rocks transport plans is not getting there. It is ending the night without a clear return strategy.",
          },
          {
            title: "Fastest next step",
            body: "If you already know you want the simplest round trip from a known pickup anchor, open the shuttle booking flow now. If the group wants one vehicle for the entire night, go straight to the private SUV and van lane instead of reading more generic comparison pages.",
            bullets: [
              "Shared shuttle: best value when one clean pickup anchor is enough.",
              "Private ride: best for birthdays, dates, tighter timing, and one-vehicle groups.",
              "Parking and rideshare: only stronger if the group truly wants to own those risks.",
            ],
          },
        ]}
      />
    </>
  );
}
