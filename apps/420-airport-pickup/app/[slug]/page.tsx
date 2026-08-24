import type { Metadata } from "next";
import { notFound } from "next/navigation";
import StaticPage from "@/app/components/StaticPage";
import { SITE_URL, sitePageMap, sitePages } from "@/lib/sitePages";
import { getAirport420RouteGovernance } from "@/lib/route-governance";

export function generateStaticParams() {
  return sitePages.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = sitePageMap.get(slug);
  if (!page) return {};
  const governance = getAirport420RouteGovernance(`/${slug}`);
  return {
    title: `${page.title} | 420 Friendly Airport Pickup`,
    description: page.description,
    alternates: { canonical: `${SITE_URL}/${slug}` },
    robots:
      governance?.publishState === "live_unpromoted"
        ? {
            index: false,
            follow: true,
          }
        : undefined,
  };
}

export default async function Airport420StaticPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = sitePageMap.get(slug);
  if (!page) notFound();
  return <StaticPage page={page} />;
}
