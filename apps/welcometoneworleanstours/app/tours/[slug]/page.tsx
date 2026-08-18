import type { Metadata } from "next";
import SharedTourDetailPage, { generateMetadata as generateSharedMetadata } from "@/app/new-orleans/tours/[slug]/page";
import { HELD_COMBO_SLUG } from "@/app/new-orleans/data/truthPolicy";
import HeldProductPage from "../HeldProductPage";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { slug } = await props.params;
  if (slug === HELD_COMBO_SLUG) {
    return {
      metadataBase: new URL("https://www.welcometoneworleanstours.com"),
      title: { absolute: "Covered Boat + Plantation | Details Pending Verification" },
      description: "Covered-boat and plantation combination details are pending current operator verification. Call 504-484-9687 to confirm before booking.",
      alternates: { canonical: `/tours/${HELD_COMBO_SLUG}` },
      robots: { index: true, follow: true },
    };
  }
  return generateSharedMetadata(props as any);
}

export default async function WnoTourDetailPage(props: Props) {
  const { slug } = await props.params;
  if (slug === HELD_COMBO_SLUG) return <HeldProductPage />;
  return <SharedTourDetailPage {...(props as any)} />;
}
