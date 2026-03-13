import { notFound } from "next/navigation";
import OverlayPageTemplate, { buildOverlayMetadata } from "@/app/components/dcc/OverlayPageTemplate";
import { getOverlayPageData, getOverlayStaticParams } from "@/src/lib/overlay-pages";

type Params = { slug: string };

export function generateStaticParams() {
  return getOverlayStaticParams("smoking").map(({ city }) => ({ slug: city }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const data = getOverlayPageData("smoking", slug);
  if (!data) return {};
  return buildOverlayMetadata(data.city, data.overlay);
}

export default async function SmokingOverlayPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const data = getOverlayPageData("smoking", slug);
  if (!data) notFound();

  return <OverlayPageTemplate city={data.city} overlay={data.overlay} entities={data.entities} />;
}
