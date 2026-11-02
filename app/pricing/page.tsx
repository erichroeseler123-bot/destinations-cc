import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/app/components/dcc/JsonLd";
import { buildBreadcrumbJsonLd, buildWebPageJsonLd } from "@/lib/dcc/jsonld";
import { getPublicationManifestEntry } from "@/src/data/publication-manifest";

const PAGE_PATH = "/pricing";
const manifestEntry = getPublicationManifestEntry(PAGE_PATH);
const isIndexable = manifestEntry?.indexingState === "index_follow";

export const metadata: Metadata = {
  title: "Platform Access & Operator Directory Model | Destination Command Center",
  description:
    "How Destination Command Center provides free public travel reference guides, open coordinate API access, and transparent operator directory onboarding.",
  alternates: {
    canonical: manifestEntry?.canonicalUrl || "https://destinationcommandcenter.com/pricing",
  },
  robots: {
    index: isIndexable,
    follow: isIndexable,
  },
};

export default function PricingPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      buildWebPageJsonLd({
        path: PAGE_PATH,
        name: "Platform Access & Operator Directory Model",
        description:
          "How Destination Command Center provides free public travel reference guides, open coordinate API access, and transparent operator directory onboarding.",
        dateModified: manifestEntry?.materialChangeDate || "2026-10-23",
      }),
      buildBreadcrumbJsonLd([
        { name: "Destination Command Center", item: "/" },
        { name: "Pricing & Access Model", item: PAGE_PATH },
      ]),
    ],
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <JsonLd data={jsonLd} />
      <div className="mx-auto max-w-4xl px-6 py-16 space-y-8">
        <header className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(24,24,27,0.96),rgba(9,9,11,0.98))] p-8 shadow-[0_28px_80px_rgba(0,0,0,0.45)]">
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Platform Access &amp; Transparency</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">
            Platform Access &amp; Operator Directory Model
          </h1>
          <p className="mt-4 max-w-3xl text-lg text-zinc-300">
            Destination Command Center is free for travelers. Our travel reference nodes, decision guides, and public coordinate intelligence endpoints require no subscription or traveler fee.
          </p>
        </header>

        <section className="rounded-3xl border border-white/10 bg-white/[0.05] p-6 space-y-4 text-zinc-300">
          <h2 className="text-2xl font-bold text-white">Traveler Access: Free &amp; Unbiased</h2>
          <p>
            All DCC destination references, port-day timing calculators, and Ask DCC decision comparisons are open to the public at no cost. Commercial relationships carry zero weight (<code>commercialWeight = 0</code>) in how options are evaluated, and free/public or no-purchase alternatives are always included when relevant.
          </p>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.05] p-6 space-y-4 text-zinc-300">
          <h2 className="text-2xl font-bold text-white">Developer &amp; Operator Directory Access</h2>
          <p>
            Public coordinate intelligence endpoints (<code>/api/location/&#123;lat&#125;/&#123;lng&#125;</code>) and machine-readable manifests (<code>/scope.json</code>, <code>/agent.json</code>, <code>/openapi.json</code>) are documented on our{" "}
            <Link href="/developers" className="text-cyan-300 underline underline-offset-4">
              Developers page
            </Link>
            . Tour and transportation operators can review directory listing and verification rules on our{" "}
            <Link href="/operators" className="text-cyan-300 underline underline-offset-4">
              Operators page
            </Link>{" "}
            and{" "}
            <Link href="/affiliate-disclosure" className="text-cyan-300 underline underline-offset-4">
              Affiliate &amp; Portfolio Disclosure
            </Link>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
