import nodes from "../../../data/nodes.json";

import { notFound } from "next/navigation";
import type { Metadata } from "next";

/* --------------------------------
   Types
-------------------------------- */

interface Node {
  id: string;
  slug: string;
  name: string;
  type: string;
  region: string;
  status: "active" | "inactive" | "planned";
  description: string;
  capabilities?: string[];
}

/* --------------------------------
   Helpers
-------------------------------- */

function getNode(slug: string): Node | undefined {
  return (nodes as Node[]).find((n) => n.slug === slug);
}

/* --------------------------------
   Static Generation
-------------------------------- */

export function generateStaticParams() {
  return (nodes as Node[]).map((node) => ({
    slug: node.slug,
  }));
}

/* --------------------------------
   Metadata / SEO
-------------------------------- */

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const node = getNode(params.slug);

  if (!node) return {};

  const url = `https://destinationcommandcenter.com/nodes/${node.slug}`;

  return {
    title: `${node.name} | Destination Command Center`,
    description: node.description,

    alternates: {
      canonical: url,
    },

    openGraph: {
      title: node.name,
      description: node.description,
      url,
      siteName: "Destination Command Center",
      type: "website",
    },

    twitter: {
      card: "summary_large_image",
      title: node.name,
      description: node.description,
    },
  };
}

/* --------------------------------
   Page Component
-------------------------------- */

export default function NodePage({
  params,
}: {
  params: { slug: string };
}) {
  const node = getNode(params.slug);

  if (!node || node.status !== "active") {
    return notFound();
  }

  const isVegas = node.slug === "vegas-guide";

  /* --------------------------------
     Schema (SEO)
  -------------------------------- */

  const schema = {
    "@context": "https://schema.org",
    "@type": "TouristInformationCenter",
    name: node.name,
    description: node.description,
    url: `https://destinationcommandcenter.com/nodes/${node.slug}`,
    areaServed: node.region,
  };

  return (
    <main className="max-w-5xl mx-auto px-6 py-24">

      {/* SEO Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schema),
        }}
      />

      {/* --------------------------------
         Header
      -------------------------------- */}

      <header className="border-b border-zinc-800 pb-8">

        <div className="flex items-center justify-between gap-4">

          <h1 className="text-4xl md:text-5xl font-black tracking-tight">
            {node.name}
          </h1>

          <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            {node.status}
          </span>

        </div>

        <p className="mt-4 text-zinc-400 max-w-2xl">
          {node.description}
        </p>

        <div className="mt-4 flex gap-3 text-xs uppercase tracking-wider text-cyan-400">
          <span>{node.type}</span>
          <span>•</span>
          <span>{node.region}</span>
        </div>

      </header>

      {/* --------------------------------
         Main Content
      -------------------------------- */}

      <section className="mt-12 grid gap-12">

        {/* Overview */}
        <div>

          <h2 className="text-xl font-semibold mb-3">
            Overview
          </h2>

          <p className="text-zinc-300 leading-relaxed">
            {node.name} operates as an execution node within the
            Destination Command Center network. This location
            provides verified transportation, activity, and
            logistics intelligence synchronized with the
            authority layer.
          </p>

        </div>

        {/* Capabilities */}
        <div>

          <h2 className="text-xl font-semibold mb-3">
            Capabilities
          </h2>

          <ul className="grid md:grid-cols-2 gap-3 text-zinc-300">

            {(node.capabilities ?? [
              "Local transportation routing",
              "Tour & activity aggregation",
              "Risk-aware scheduling",
              "Booking integration (planned)",
              "Real-time updates (future)",
              "Authority data validation",
            ]).map((cap) => (
              <li key={cap}>• {cap}</li>
            ))}

          </ul>

        </div>

        {/* --------------------------------
           Vegas Placeholder (Safe)
        -------------------------------- */}

        {isVegas && (

          <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-6">

            <h2 className="text-xl font-bold mb-3">
              Las Vegas Tours & Experiences
            </h2>

            <p className="text-zinc-400 text-sm leading-relaxed">
              Verified tours and experiences are being integrated
              into this node. Real-time booking and availability
              will be enabled shortly.
            </p>

          </div>

        )}

        {/* Status Panel */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-6">

          <h3 className="font-semibold mb-2">
            Node Status
          </h3>

          <p className="text-sm text-zinc-400 leading-relaxed">
            This node is currently{" "}
            <span className="text-cyan-400 font-medium">
              {node.status}
            </span>{" "}
            and synchronized with the Destination Command Center
            authority layer.
          </p>

        </div>

      </section>

      {/* --------------------------------
         Footer
      -------------------------------- */}

      <footer className="mt-24 pt-8 border-t border-zinc-800 text-sm text-zinc-500">

        <p>
          Part of the Destination Command Center execution network.
        </p>

      </footer>

    </main>
  );
}
