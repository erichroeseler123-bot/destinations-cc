import type { Metadata } from "next";
import ConciergeQaChecklist from "../../admin/qa/ConciergeQaChecklist";
import { STOREFRONT_PRODUCTS } from "../../tours/pageConfig";

export const metadata: Metadata = {
  title: "New Orleans Concierge QA | Internal",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function NewOrleansInternalQaPage() {
  const tours = STOREFRONT_PRODUCTS.map((product) => ({
    id: product.id,
    title: product.title,
    slug: product.slug,
    itemId: product.itemId,
    flowId: product.flowId,
    variantCount: product.bookingVariants?.length ?? 0,
  }));

  return <ConciergeQaChecklist tours={tours} />;
}
