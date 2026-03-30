import { redirect } from "next/navigation";
import CheckoutPageClient from "./CheckoutPageClient";
import {
  getCheckoutProduct,
  getCheckoutRouteConfig,
} from "@/lib/checkoutProducts";
import { buildParrPrivateRedRocksUrl } from "@/lib/dcc/contracts/dccParrBridge";

type SearchParamsValue = string | string[] | undefined;

type CheckoutPageProps = {
  searchParams?: Promise<Record<string, SearchParamsValue>>;
};

function readFirst(value: SearchParamsValue) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const route = readFirst(resolvedSearchParams.route) || null;

  if (route === "parr-private") {
    const redirectParams = new URLSearchParams();
    const product = readFirst(resolvedSearchParams.product);
    const date = readFirst(resolvedSearchParams.date);
    const pickup = readFirst(resolvedSearchParams.pickup);
    const pickupTime = readFirst(resolvedSearchParams.pickupTime);
    const partySize = readFirst(resolvedSearchParams.partySize);

    if (product) redirectParams.set("product", product);
    if (date) redirectParams.set("date", date);
    if (pickup) redirectParams.set("pickup", pickup);
    if (pickupTime) redirectParams.set("pickupTime", pickupTime);
    if (partySize) redirectParams.set("partySize", partySize);

    redirect(buildParrPrivateRedRocksUrl(Object.fromEntries(redirectParams.entries())));
  }

  const routeConfig = getCheckoutRouteConfig(route);

  let initialSnapshot = null;

  if (routeConfig) {
    const productKey = readFirst(resolvedSearchParams.product);
    const date = readFirst(resolvedSearchParams.date);
    const qty = Math.max(1, Number(readFirst(resolvedSearchParams.qty) || "1"));
    const partySize = Math.max(
      1,
      Number(readFirst(resolvedSearchParams.partySize) || readFirst(resolvedSearchParams.qty) || "1"),
    );
    const pickup = (readFirst(resolvedSearchParams.pickup) || routeConfig.defaultPickup).trim();
    const dropoff = (readFirst(resolvedSearchParams.dropoff) || routeConfig.defaultDropoff || "").trim();
    const pickupTime = (readFirst(resolvedSearchParams.pickupTime) || "4:30 PM").trim();
    const product = getCheckoutProduct(productKey);

    if (product && date && product.route === routeConfig.key) {
      initialSnapshot = {
        route: routeConfig.key,
        productKey: product.key,
        title: product.title,
        date,
        qty: Math.min(qty, product.maxQty),
        partySize: Math.min(partySize, product.maxPassengers || partySize),
        pickup,
        dropoff,
        pickupTime,
      };
    }
  }

  return (
    <CheckoutPageClient
      initialRoute={route}
      initialSnapshot={initialSnapshot}
    />
  );
}
