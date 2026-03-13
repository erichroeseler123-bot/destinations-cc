import { notFound } from "next/navigation";
import OverlayPageTemplate, { buildOverlayMetadata } from "@/app/components/dcc/OverlayPageTemplate";
import { getOverlayPageData, getOverlayStaticParams } from "@/src/lib/overlay-pages";

type Params = { city: string };

export function generateStaticParams() {
  return getOverlayStaticParams("accessibility");
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { city } = await params;
  const data = getOverlayPageData("accessibility", city);
  if (!data) return {};
  return buildOverlayMetadata(data.city, data.overlay);
}

export default async function AccessibilityOverlayPage({ params }: { params: Promise<Params> }) {
  const { city } = await params;
  const data = getOverlayPageData("accessibility", city);
  if (!data) notFound();

  return <OverlayPageTemplate city={data.city} overlay={data.overlay} entities={data.entities} />;
}
