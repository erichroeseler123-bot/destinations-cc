import { notFound } from "next/navigation";
import OverlayCategoryPageTemplate, { buildOverlayCategoryMetadata } from "@/app/components/dcc/OverlayCategoryPageTemplate";
import { getOverlayCategoryPageData, getOverlayCategoryStaticParams } from "@/src/lib/overlay-pages";

type Params = { category: string; city: string };

export function generateStaticParams() {
  return getOverlayCategoryStaticParams("kid-friendly");
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { category, city } = await params;
  const data = getOverlayCategoryPageData("kid-friendly", city, category);
  if (!data) return {};
  return buildOverlayCategoryMetadata(data.city, data.overlay, category, `/kid-friendly/${category}/${city}`);
}

export default async function KidFriendlyOverlayCategoryPage({ params }: { params: Promise<Params> }) {
  const { category, city } = await params;
  const data = getOverlayCategoryPageData("kid-friendly", city, category);
  if (!data) notFound();

  return (
    <OverlayCategoryPageTemplate
      city={data.city}
      overlay={data.overlay}
      category={category}
      entities={data.entities}
      canonicalPath={`/kid-friendly/${category}/${city}`}
    />
  );
}
