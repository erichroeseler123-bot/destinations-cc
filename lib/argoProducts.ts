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
    title: "Shared Seat to the Mighty Argo Cable Car",
    priceCents: 3500,
    kind: "seat",
    maxQty: 12,
    description: "Shared transport option from Denver to the Mighty Argo Cable Car.",
  },
  "argo-suv": {
    key: "argo-suv",
    title: "Private SUV to the Mighty Argo Cable Car",
    priceCents: 20000,
    kind: "private",
    maxQty: 1,
    description: "Private transport option for your group heading to the Mighty Argo Cable Car.",
  },
};

export function getArgoProduct(key: string | null | undefined) {
  if (!key) return null;
  return ARGO_PRODUCTS[key as ArgoProductKey] || null;
}
