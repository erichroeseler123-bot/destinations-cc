export const dynamicParams = false;

import aliases from "@/data/city-aliases.json";
import CityToursPageContent from "@/app/components/dcc/CityToursPageContent";

type Params = { city: string };

export async function generateStaticParams() {
  return Object.keys(aliases).map((city) => ({ city }));
}

export default async function CityToursPage({ params }: { params: Promise<Params> }) {
  const { city } = await params;
  return <CityToursPageContent cityKey={(city || "").toLowerCase()} />;
}
