import { getResolvedViatorProductDetail } from "@/lib/viator/product";

export async function getViatorProductDetailForTour(input: {
  id: string;
  productCode?: string | null;
}) {
  return getResolvedViatorProductDetail(input.id, {
    productCode: input.productCode || null,
  });
}
