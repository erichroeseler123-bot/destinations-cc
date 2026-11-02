import type { Metadata } from "next";
import { notFound } from "next/navigation";
import RegionalHubTemplate from "@/app/components/dcc/RegionalHubTemplate";
import {
  getRegionalHubByStateSlug,
  listRegionalHubs,
} from "@/lib/dcc/regionalHubs";

export const revalidate = 3600;

export function generateStaticParams() {
  return listRegionalHubs().map((hub) => ({ state: hub.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ state: string }>;
}): Promise<Metadata> {
  const { state } = await params;
  const hub = getRegionalHubByStateSlug(state);
  if (!hub) {
    return {
      title: "Destination Hub Not Found | Destination Command Center",
      robots: { index: false, follow: false },
    };
  }

  const isIndexable = hub.manifestRecord?.acceptanceState === "public_indexable";
  return {
    title: `${hub.name} Travel Reference Hub, Transit Matrices & Coordinates | Destination Command Center`,
    description: hub.heroSummary,
    alternates: {
      canonical: `https://destinationcommandcenter.com${hub.canonicalPath}`,
    },
    robots: { index: isIndexable, follow: isIndexable },
    openGraph: {
      title: `${hub.name} Destination Hub | Destination Command Center`,
      description: hub.heroSummary,
      url: hub.canonicalPath,
      type: "website",
    },
  };
}

export default async function DestinationStateHubPage({
  params,
}: {
  params: Promise<{ state: string }>;
}) {
  const { state } = await params;
  const hub = getRegionalHubByStateSlug(state);
  if (!hub) notFound();

  return <RegionalHubTemplate hub={hub} routePrefix="/destinations" />;
}
