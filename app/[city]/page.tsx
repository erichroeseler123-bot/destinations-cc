import { notFound } from "next/navigation";
import NodePage from "@/app/nodes/[slug]/page";
import { getNodeSlugFromCity } from "@/src/data/city-aliases";

export default async function CityPage({ params }: any) {
  const slug = getNodeSlugFromCity(params.city);

  if (!slug) notFound();

  return <NodePage params={{ slug }} />;
}
