export const dynamicParams = false;

import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import JsonLd from "@/app/components/dcc/JsonLd";
import { getPortBySlug, getPortSlugs } from "@/lib/dcc/ports";
import PortAuthorityTemplate from "@/app/components/dcc/PortAuthorityTemplate";
import { getPortAuthorityConfig } from "@/src/data/port-authority-config";
import DecisionEngineTemplate from "@/app/components/dcc/DecisionEngineTemplate";
import LivePulseBlock from "@/app/components/dcc/livePulse/LivePulseBlock";
import Next48Button from "@/app/components/dcc/next48/Next48Button";
import ShareWeekendCard from "@/app/components/dcc/share/ShareWeekendCard";
import { getSurface, hasSurfaceEntity } from "@/lib/dcc/surfaces/getSurface";
import { getDecisionEnginePageByPath } from "@/src/data/decision-engine-pages";
import {
  buildBreadcrumbJsonLd,
  buildCityJsonLd,
  buildFaqJsonLd,
} from "@/lib/dcc/jsonld";

const BASE_URL = "https://destinationcommandcenter.com";

export async function generateStaticParams() {
  return getPortSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const port = getPortBySlug(resolvedParams.slug);
  if (!port) return { title: "Cruise Port" };

  const config = getPortAuthorityConfig(port);
  const pageTitle = config.heroTitle || `${port.name} Cruise Port`;
  const description = config.summary;
  const canonicalPath = `/ports/${port.slug}`;

  return {
    title: pageTitle,
    description,
    alternates: { canonical: canonicalPath },
    openGraph: {
      title: pageTitle,
      description,
      url: `${BASE_URL}${canonicalPath}`,
      type: "website",
      images: [`${BASE_URL}/api/og?title=${encodeURIComponent(pageTitle)}`],
    },
  };
}

export default async function PortPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  const port = getPortBySlug(resolvedParams.slug);
  if (!port) notFound();

  const config = getPortAuthorityConfig(port);
  const pageTitle = config.heroTitle || `${port.name} Cruise Port`;
  const description = config.summary;
  const pageUrl = `${BASE_URL}/ports/${port.slug}`;
  const region = port.area || port.region || port.country || "Cruise region";
  const country = port.country || "Unknown";
  const entityKey = `port:${port.slug}`;
  const surface =
    hasSurfaceEntity(entityKey) ?
      await getSurface({
        entityKey: entityKey as `port:${string}`,
        modules: ["decision", "livePulse", "next48", "share", "counts", "graph", "media"],
        strict: false,
      })
    : null;
  const decisionPage = surface?.modules.decision?.page || getDecisionEnginePageByPath(`/ports/${port.slug}`);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            buildCityJsonLd({
              path: `/ports/${port.slug}`,
              name: pageTitle,
              description,
              address: {
                region,
                country,
              },
              touristTypes: ["Cruise travelers", "Shore excursion buyers", "Port planners"],
            }),
            buildBreadcrumbJsonLd([
              { name: "Home", item: "/" },
              { name: "Ports", item: "/ports" },
              { name: port.name, item: `/ports/${port.slug}` },
            ]),
            buildFaqJsonLd(config.faq.slice(0, 3)),
          ],
        }}
      />
      <PortAuthorityTemplate port={port} config={config} />
      {decisionPage ? (
        <section className="max-w-6xl mx-auto px-6 pb-10">
          <DecisionEngineTemplate page={decisionPage} />
          {port.slug === "juneau" ? (
            <div className="mt-8 space-y-8">
              <LivePulseBlock
                entityType="port"
                entitySlug="juneau"
                title="Juneau Right Now"
                target="entity"
              />
              <ShareWeekendCard
                entityType="port"
                slug="juneau"
                title="Share This Weekend: Juneau"
                subtitle="Port Intelligence Snapshot"
                context="port:juneau"
                fallbackHero="/images/authority/ports/juneau/hero.webp"
                pageUrl="https://destinationcommandcenter.com/ports/juneau"
              />
            </div>
          ) : null}
        </section>
      ) : null}
      <footer className="max-w-6xl mx-auto px-6 pb-14">
        <Link href="/ports" className="text-sm text-zinc-400 hover:text-zinc-200">
          Back to Ports Directory →
        </Link>
      </footer>
      {port.slug === "juneau" ? <Next48Button entityType="port" slug="juneau" /> : null}
    </>
  );
}
