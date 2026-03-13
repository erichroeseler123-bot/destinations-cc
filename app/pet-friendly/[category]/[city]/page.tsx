import { notFound } from "next/navigation";
import OverlayCategoryPageTemplate, { buildOverlayCategoryMetadata } from "@/app/components/dcc/OverlayCategoryPageTemplate";
import { getOverlayCategoryPageData, getOverlayCategoryStaticParams } from "@/src/lib/overlay-pages";

type Params = { category: string; city: string };

export function generateStaticParams() {
  return getOverlayCategoryStaticParams("pet-friendly");
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { category, city } = await params;
  const data = getOverlayCategoryPageData("pet-friendly", city, category);
  if (!data) return {};
  return buildOverlayCategoryMetadata(data.city, data.overlay, category, `/pet-friendly/${category}/${city}`);
}

export default async function PetFriendlyOverlayCategoryPage({ params }: { params: Promise<Params> }) {
  const { category, city } = await params;
  const data = getOverlayCategoryPageData("pet-friendly", city, category);
  if (!data) notFound();

  return (
    <OverlayCategoryPageTemplate
      city={data.city}
      overlay={data.overlay}
      category={category}
      entities={data.entities}
      canonicalPath={`/pet-friendly/${category}/${city}`}
    />
  );
}
