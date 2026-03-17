export const dynamicParams = false;

import { redirect } from "next/navigation";
import aliases from "@/data/city-aliases.json";
import { resolveCanonicalCityKey } from "@/src/data/city-aliases";

type Params = { city: string };

export async function generateStaticParams() {
  return Object.keys(aliases).map((city) => ({ city }));
}

export default async function CityThingsToDoRedirect({
  params,
}: {
  params: Promise<Params>;
}) {
  const { city } = await params;
  const cityKey = resolveCanonicalCityKey(city);
  redirect(`/${cityKey}/attractions`);
}
