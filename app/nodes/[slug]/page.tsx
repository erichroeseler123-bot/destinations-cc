import nodes from "../../../data/nodes.json";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

/* -----------------------------
   Types
----------------------------- */

interface Node {
  id: string;
  slug: string;
  name: string;
  type: string;
  region: string;
  status: string;
  description: string;
}

/* -----------------------------
   Static Generation
----------------------------- */

export function generateStaticParams() {
  return (nodes as Node[]).map((node) => ({
    slug: node.slug,
  }));
}

/* -----------------------------
   SEO / Metadata
----------------------------- */

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const node = (nodes as Node[]).find(
    (n) => n.slug === params.slug
  );

  if (!node) {
    return {};
  }

  return {
    title: `${node.name} | Destination Command Center`,
    description: node.description,

    openGraph: {
      title: node.name,
      description: node.description,
      url: `https://destinationcommandcenter.com/nodes/${node.slug}`,
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

/* -----------------------------
   Page Component
----------------------------- */

export default function NodePage({
  params,
}: {
  params: { slug: string };
}) {
  const node = (nodes as Node[]).find(
    (n) => n.slug === params.slug
  );

  if (!node || node.status !== "active") {
    return notFound();
  }

  return (
    <main className="max-w-5xl mx-auto px-6 py-24">

      {/* Header */}
      <header className="border-b border-zinc-800 pb-8">
        <h1 className="text-4xl md:text-5xl font-black tracking-tight">
          {node.name}
        </h1>

        <p className="mt-4 text-zinc-400 max-w-2xl">
          {node.description}
        </p>

        <div className="mt-4 flex gap-3 text-xs uppercase tracking-wider text-cyan-400">
          <span>{node.type}</span>
          <span>•</span>
          <span>{node.region}</span>
        </div>
      </header>

      {/* Main Content */}
      <section className="mt-12 grid gap-10">

        {/* Overview */}
        <div>
          <h2 className="text-xl font-semibold mb-3">
            Overview
          </h2>

          <p className="text-zinc-300 leading-relaxed">
            {node.name} is part of the Destination Command Center
            execution network. This node provides verified
            operational, transportation, and experience data
            connected to the main authority system.
          </p>
        </div>

        {/* Capabilities */}
        <div>
          <h2 className="text-xl font-semibold mb-3">
            Capabilities
          </h2>

          <ul className="grid md:grid-cols-2 gap-3 text-zinc-300">
            <li>• Local transportation routing</li>
            <li>• Tour & activity aggregation</li>
            <li>• Risk-aware scheduling</li>
            <li>• Booking integration (planned)</li>
            <li>• Real-time updates (future)</li>
            <li>• Authority data validation</li>
          </ul>
        </div>

        {/* Status */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-6">
          <h3 className="font-semibold mb-2">
            Node Status
          </h3>

          <p className="text-sm text-zinc-400">
            This node is currently{" "}
            <span className="text-cyan-400 font-medium">
              {node.status}
            </span>{" "}
            and synchronized with the Destination Command Center
            authority layer.
          </p>
        </div>

      </section>

      {/* Footer */}
      <footer className="mt-24 pt-8 border-t border-zinc-800 text-sm text-zinc-500">
        <p>
          Part of the Destination Command Center network.
        </p>
      </footer>

    </main>
  );
}
