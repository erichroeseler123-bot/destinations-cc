export const dynamicParams = false;

import { redirect } from "next/navigation";
import aliases from "@/data/city-aliases.json";
import { resolveCanonicalCityKey } from "@/src/data/city-aliases";

type Params = { city: string };

function titleCase(value: string) {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export async function generateStaticParams() {
  return Object.keys(aliases).map((city) => ({ city }));
}

export default async function CityFoodRedirect({
  params,
}: {
  params: Promise<Params>;
}) {
  const { city } = await params;
  const cityKey = resolveCanonicalCityKey(city);
  const cityName = titleCase(cityKey);
  redirect(`/${cityKey}/tours?q=${encodeURIComponent(`${cityName} food tour`)}`);
}
