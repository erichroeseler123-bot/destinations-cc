import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/app/components/dcc/JsonLd";
import TravelReferenceExperience from "@/app/components/dcc/TravelReferenceExperience";
import { getPublishedTravelReferenceNodeById } from "@/lib/dcc/travelReference";
import {
  buildBreadcrumbJsonLd,
  buildCollectionPageJsonLd,
  buildWebPageJsonLd,
} from "@/lib/dcc/jsonld";
import {
  juneauDecisionCards,
  juneauGuideLinks,
} from "@/lib/dcc/juneauCommercialHub";

const PAGE_PATH = "/juneau";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Juneau, Alaska Travel Reference, Port Logistics & Shore Excursion Guide | Destination Command Center",
  description:
    "Comprehensive Juneau travel reference combining history, geography, air/ferry/cruise access, 6-factor entry rules, live NOAA/NWS/FAA conditions, operational safety boundaries, and shore excursion decisions.",
  alternates: { canonical: PAGE_PATH },
  openGraph: {
    title: "Juneau, Alaska Travel Reference & Port Decision Hub | Destination Command Center",
    description:
      "Source-attributed Juneau travel reference with live NOAA tides, NWS alerts, PAJN aviation weather, entry dependency rules, and excursion planning.",
    url: PAGE_PATH,
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
            path: PAGE_PATH,
            name: "Juneau Shore Excursions & Port-Day Reference",
            description:
              "Source-attributed Juneau travel reference and interactive port-day decision engine for glacier, whale watching, transit, and cruise-timing decisions.",
            dateModified: "2026-10-25",
            isPartOfPath: "/network",
          }),
          buildBreadcrumbJsonLd([
            { name: "DCC", item: "/" },
            { name: "Juneau", item: PAGE_PATH },
          ]),
          buildCollectionPageJsonLd({
            path: PAGE_PATH,
            name: "Juneau excursion decision paths",
            description:
              "DCC Juneau decision paths for helicopter, whale watching, Mendenhall, weather backup, and short port-call planning.",
            items: juneauDecisionCards.map((card) => ({
              name: card.title,
              url: card.cta_href,
              description: card.decision_reason,
            })),
          }),
        ],
      }}
    />
  );
}

export default async function JuneauCommercialHubPage({
  searchParams,
}: {
  searchParams?:
    | Promise<Record<string, string | string[] | undefined>>
    | Record<string, string | string[] | undefined>;
} = {}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const juneauReference = await getPublishedTravelReferenceNodeById("juneau");

  return (
    <main className="min-h-screen overflow-hidden bg-[#041018] text-white">
      <JsonLdGraph />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {juneauReference ? (
          <TravelReferenceExperience
            node={juneauReference}
            initialSearchParams={resolvedSearchParams}
          />
        ) : null}
      </div>

      <section className="mx-auto max-w-7xl px-6 pb-16">
        <div className="rounded-[1.8rem] border border-white/10 bg-black/[0.24] p-6">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-cyan-200">
                Related Juneau Planning Guides
              </p>
              <h2 className="mt-3 text-2xl font-black tracking-tight text-white">
                Focused Topic Guides for Juneau Port Calls
              </h2>
              <p className="mt-3 text-sm leading-6 text-white/[0.68]">
                Explore detailed breakdowns for weather cancellations, short port windows, and Mendenhall Glacier ground logistics. Tour sales remain optional; you can use municipal transit, walk downtown, book directly with operators, or use a partner link where convenient.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {juneauGuideLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm font-bold text-white/80 transition hover:border-cyan-200/[0.30] hover:bg-cyan-200/[0.10] hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
