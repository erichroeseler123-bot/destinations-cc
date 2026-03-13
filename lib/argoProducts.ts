export type ArgoProductKey = "argo-seat" | "argo-suv";

export type ArgoProduct = {
  key: ArgoProductKey;
  title: string;
  priceCents: number;
  kind: "seat" | "private";
  maxQty: number;
  description: string;
};

export const ARGO_PRODUCTS: Record<ArgoProductKey, ArgoProduct> = {
  "argo-seat": {
    key: "argo-seat",
    title: "Argo Shuttle Seat",
    priceCents: 5900,
    kind: "seat",
    maxQty: 12,
    description: "Shared shuttle seat from Denver to the Argo attraction.",
  },
  "argo-suv": {
    key: "argo-suv",
    title: "Argo Private SUV",
    priceCents: 49900,
    kind: "private",
    maxQty: 1,
    description: "Private SUV for your group to the Argo attraction.",
  },
};

export function getArgoProduct(key: string | null | undefined) {
  if (!key) return null;
  return ARGO_PRODUCTS[key as ArgoProductKey] || null;
}
