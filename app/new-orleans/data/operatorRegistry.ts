import { STOREFRONT_PRODUCTS } from "../tours/pageConfig";
import { getGovernedExperienceGraphRecord } from "./experienceGraphGovernance";

export function operatorSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export const WNO_OPERATOR_ENTITIES = Array.from(
  new Map(
    STOREFRONT_PRODUCTS.map((product) => [product.operatorName, product.operatorName]),
  ).values(),
).map((name) => {
  const products = STOREFRONT_PRODUCTS.filter((product) => product.operatorName === name);
  const graphRecords = products
    .map((product) => getGovernedExperienceGraphRecord(product.slug))
    .filter((record): record is NonNullable<typeof record> => Boolean(record));

  return {
    slug: operatorSlug(name),
    name,
    companyShortnames: Array.from(new Set(products.map((product) => product.companyShortname))),
    products,
    governedCount: graphRecords.length,
    publishableGraphCount: graphRecords.filter((record) => record.verificationStatus !== "NEEDS_VERIFICATION").length,
  };
});

export function getWnoOperatorEntity(slug: string) {
  return WNO_OPERATOR_ENTITIES.find((operator) => operator.slug === slug) || null;
}
