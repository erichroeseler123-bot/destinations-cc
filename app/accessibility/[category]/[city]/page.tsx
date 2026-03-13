import { notFound } from "next/navigation";
import OverlayCategoryPageTemplate, { buildOverlayCategoryMetadata } from "@/app/components/dcc/OverlayCategoryPageTemplate";
import { getOverlayCategoryPageData, getOverlayCategoryStaticParams } from "@/src/lib/overlay-pages";

type Params = { category: string; city: string };

export function generateStaticParams() {
  return getOverlayCategoryStaticParams("accessibility");
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { category, city } = await params;
  const data = getOverlayCategoryPageData("accessibility", city, category);
  if (!data) return {};
  return buildOverlayCategoryMetadata(data.city, data.overlay, category, `/accessibility/${category}/${city}`);
}

export default async function AccessibilityOverlayCategoryPage({ params }: { params: Promise<Params> }) {
  const { category, city } = await params;
  const data = getOverlayCategoryPageData("accessibility", city, category);
  if (!data) notFound();

  return (
    <OverlayCategoryPageTemplate
      city={data.city}
      overlay={data.overlay}
      category={category}
      entities={data.entities}
      canonicalPath={`/accessibility/${category}/${city}`}
    />
  );
}
