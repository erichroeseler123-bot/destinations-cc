import type { Metadata } from "next";
import SharedTourDetailPage, { generateMetadata as generateSharedMetadata } from "@/app/new-orleans/tours/[slug]/page";
import { HELD_COMBO_SLUG, HELD_JEAN_LAFITTE_SLUG, isHeldProduct } from "@/app/new-orleans/data/truthPolicy";
import HeldProductPage from "../HeldProductPage";

const WNO_ORIGIN = "https://www.welcometoneworleanstours.com";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { slug } = await props.params;
  if (slug === HELD_COMBO_SLUG) {
    return {
      metadataBase: new URL(WNO_ORIGIN),
      title: { absolute: "Covered Boat + Plantation | Details Pending Verification" },
      description: "Covered-boat and plantation combination details are pending current operator verification. Call 504-484-9687 to confirm before booking.",
      alternates: { canonical: `/tours/${HELD_COMBO_SLUG}` },
      robots: { index: true, follow: true },
    };
  }
  if (slug === HELD_JEAN_LAFITTE_SLUG) {
    return {
      metadataBase: new URL(WNO_ORIGIN),
      title: { absolute: "Jean Lafitte Swamp Tour with Hotel Pickup | Checkout Pending Verification" },
      description: "Direct Jean Lafitte Swamp Tours partner checkout and hotel-shuttle mapping are pending operator confirmation. Compare verified French Quarter hotel-pickup swamp boat options or call 504-484-9687.",
      alternates: { canonical: `/tours/${HELD_JEAN_LAFITTE_SLUG}` },
      robots: { index: false, follow: true },
    };
  }

  const shared = await generateSharedMetadata(props as any);
  return {
    ...shared,
    metadataBase: new URL(WNO_ORIGIN),
  };
}

export default async function WnoTourDetailPage(props: Props) {
  const { slug } = await props.params;
  if (isHeldProduct(slug)) return <HeldProductPage slug={slug} />;
  return <SharedTourDetailPage {...(props as any)} />;
}
