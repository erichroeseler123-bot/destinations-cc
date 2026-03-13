import { notFound } from "next/navigation";
import OverlayCategoryPageTemplate, { buildOverlayCategoryMetadata } from "@/app/components/dcc/OverlayCategoryPageTemplate";
import { getOverlayCategoryPageData, getOverlayCategoryStaticParams } from "@/src/lib/overlay-pages";

type Params = { slug: string; city: string };

export function generateStaticParams() {
  return getOverlayCategoryStaticParams("smoking").map(({ category, city }) => ({ slug: category, city }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { slug, city } = await params;
  const data = getOverlayCategoryPageData("smoking", city, slug);
  if (!data) return {};
  return buildOverlayCategoryMetadata(data.city, data.overlay, slug, `/smoking/${slug}/${city}`);
}

export default async function SmokingOverlayCategoryPage({ params }: { params: Promise<Params> }) {
  const { slug, city } = await params;
  const data = getOverlayCategoryPageData("smoking", city, slug);
  if (!data) notFound();

  return (
    <OverlayCategoryPageTemplate
      city={data.city}
      overlay={data.overlay}
      category={slug}
      entities={data.entities}
      canonicalPath={`/smoking/${slug}/${city}`}
    />
  );
}
