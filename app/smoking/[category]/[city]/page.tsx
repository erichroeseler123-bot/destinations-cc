import { notFound } from "next/navigation";
import OverlayCategoryPageTemplate, { buildOverlayCategoryMetadata } from "@/app/components/dcc/OverlayCategoryPageTemplate";
import { getOverlayCategoryPageData, getOverlayCategoryStaticParams } from "@/src/lib/overlay-pages";

type Params = { category: string; city: string };

export function generateStaticParams() {
  return getOverlayCategoryStaticParams("smoking");
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { category, city } = await params;
  const data = getOverlayCategoryPageData("smoking", city, category);
  if (!data) return {};
  return buildOverlayCategoryMetadata(data.city, data.overlay, category, `/smoking/${category}/${city}`);
}

export default async function SmokingOverlayCategoryPage({ params }: { params: Promise<Params> }) {
  const { category, city } = await params;
  const data = getOverlayCategoryPageData("smoking", city, category);
  if (!data) notFound();

  return (
    <OverlayCategoryPageTemplate
      city={data.city}
      overlay={data.overlay}
      category={category}
      entities={data.entities}
      canonicalPath={`/smoking/${category}/${city}`}
    />
  );
}
