import type { Metadata } from "next";
import DistrictWatchPage from "@/app/components/dcc/DistrictWatchPage";

type Params = { city: string; district: string };

function pretty(value: string) {
  return value.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { city, district } = await params;
  const cityName = pretty(city);
  const districtName = pretty(district);
  const canonical = `/${city}/watch/${district}`;
  return {
    title: `${districtName} Right Now | ${cityName} City Watch`,
    description: `Peek into ${districtName} in ${cityName} with current public activity signals layered over permanent district context.`,
    alternates: { canonical },
    openGraph: {
      title: `${districtName} Right Now | Destination Command Center`,
      description: `See what is shaping ${districtName} right now without tracking individuals.`,
      url: `https://destinationcommandcenter.com${canonical}`,
      type: "website",
    },
  };
}

export default async function Page({ params }: { params: Promise<Params> }) {
  const { city, district } = await params;
  return <DistrictWatchPage citySlug={city} districtSlug={district} />;
}
