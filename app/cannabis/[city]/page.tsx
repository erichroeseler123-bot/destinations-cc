import { notFound } from "next/navigation";
import OverlayPageTemplate, { buildOverlayMetadata } from "@/app/components/dcc/OverlayPageTemplate";
import { getOverlayPageData, getOverlayStaticParams } from "@/src/lib/overlay-pages";

type Params = { city: string };

export function generateStaticParams() {
  return getOverlayStaticParams("cannabis-rules");
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { city } = await params;
  const data = getOverlayPageData("cannabis-rules", city);
  if (!data) return {};
  return buildOverlayMetadata(data.city, data.overlay);
}

export default async function CannabisRulesOverlayPage({ params }: { params: Promise<Params> }) {
  const { city } = await params;
  const data = getOverlayPageData("cannabis-rules", city);
  if (!data) notFound();

  return <OverlayPageTemplate city={data.city} overlay={data.overlay} entities={data.entities} />;
}
