import { notFound } from "next/navigation";
import OverlayCategoryPageTemplate, { buildOverlayCategoryMetadata } from "@/app/components/dcc/OverlayCategoryPageTemplate";
import { getOverlayCategoryPageData, getOverlayCategoryStaticParams } from "@/src/lib/overlay-pages";

type Params = { category: string; city: string };

export function generateStaticParams() {
  return getOverlayCategoryStaticParams("smoker-friendly");
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { category, city } = await params;
  const data = getOverlayCategoryPageData("smoker-friendly", city, category);
  if (!data) return {};
  return buildOverlayCategoryMetadata(data.city, data.overlay, category, `/smoker-friendly/${category}/${city}`);
}

export default async function SmokerFriendlyOverlayCategoryPage({ params }: { params: Promise<Params> }) {
  const { category, city } = await params;
  const data = getOverlayCategoryPageData("smoker-friendly", city, category);
  if (!data) notFound();

  return (
    <OverlayCategoryPageTemplate
      city={data.city}
      overlay={data.overlay}
      category={category}
      entities={data.entities}
      canonicalPath={`/smoker-friendly/${category}/${city}`}
    />
  );
}
