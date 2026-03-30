import { PARR_PICKUP_HUBS } from "@/lib/parrOperator";

export type CheckoutRouteKey = "argo" | "parr-private" | "parr-shared";

export type CheckoutProductKind = "seat" | "private";

export type CheckoutProduct = {
  key: string;
  route: CheckoutRouteKey;
  title: string;
  priceCents: number;
  kind: CheckoutProductKind;
  maxQty: number;
  description: string;
  maxPassengers?: number;
};

export type CheckoutRouteConfig = {
  key: CheckoutRouteKey;
  title: string;
  intro: string;
  backHref: string;
  backLabel: string;
  defaultProduct: string;
  pickupMode: "select" | "freeform";
  pickupOptions?: string[];
  defaultPickup: string;
  checkoutTitle: string;
  checkoutIntro: string;
  prelaunchEnvVar: string;
  paymentsEnvVar: string;
  depositPercentage: number;
  balanceDueHours?: number;
  defaultDropoff?: string;
};

const PRODUCTS: CheckoutProduct[] = [
  {
    key: "argo-seat",
    route: "argo",
    title: "Argo Shuttle Seat",
    priceCents: 5900,
    kind: "seat",
    maxQty: 12,
    description: "Shared shuttle seat from Denver to the Argo attraction.",
  },
  {
    key: "argo-suv",
    route: "argo",
    title: "Argo Private SUV",
    priceCents: 49900,
    kind: "private",
    maxQty: 1,
    maxPassengers: 6,
    description: "Private SUV for your group to the Argo attraction.",
  },
  {
    key: "parr-shared-denver",
    route: "parr-shared",
    title: "Red Rocks Shared Seat - Denver",
    priceCents: 6500,
    kind: "seat",
    maxQty: 12,
    description: `Shared shuttle seat from ${PARR_PICKUP_HUBS.denver.businessName} to Red Rocks.`,
  },
  {
    key: "parr-shared-golden",
    route: "parr-shared",
    title: "Red Rocks Shared Seat - Golden",
    priceCents: 5900,
    kind: "seat",
    maxQty: 12,
    description: `Shared shuttle seat from ${PARR_PICKUP_HUBS.golden.businessName} to Red Rocks.`,
  },
  {
    key: "parr-suburban",
    route: "parr-private",
    title: "Red Rocks Private Suburban",
    priceCents: 49900,
    kind: "private",
    maxQty: 1,
    maxPassengers: 6,
    description: "Private Suburban for smaller groups headed to Red Rocks.",
  },
  {
    key: "parr-van-10",
    route: "parr-private",
    title: "Red Rocks 10-Passenger Van",
    priceCents: 59900,
    kind: "private",
    maxQty: 1,
    maxPassengers: 10,
    description: "Private 10-passenger van for one group and one show night.",
  },
  {
    key: "parr-sprinter-14",
    route: "parr-private",
    title: "Red Rocks 14-Passenger Sprinter",
    priceCents: 79900,
    kind: "private",
    maxQty: 1,
    maxPassengers: 14,
    description: "Private Sprinter for larger Red Rocks groups.",
  },
  {
    key: "parr-party-bus-24",
    route: "parr-private",
    title: "Red Rocks 24-Passenger Party Bus",
    priceCents: 119900,
    kind: "private",
    maxQty: 1,
    maxPassengers: 24,
    description: "Private party bus for larger Red Rocks nights.",
  },
];

const ROUTES: Record<CheckoutRouteKey, CheckoutRouteConfig> = {
  argo: {
    key: "argo",
    title: "Book Argo Shuttle",
    intro: "Choose your ride, date, and quantity, then continue to secure checkout.",
    backHref: "/mighty-argo-shuttle",
    backLabel: "Back to Argo page",
    defaultProduct: "argo-seat",
    pickupMode: "select",
    pickupOptions: ["Denver", "Union Station", "Downtown Hotel"],
    defaultPickup: "Denver",
    checkoutTitle: "Checkout",
    checkoutIntro: "Argo booking preload is active. Review this cart snapshot before payment.",
    prelaunchEnvVar: "NEXT_PUBLIC_ARGO_PRELAUNCH",
    paymentsEnvVar: "ENABLE_ARGO_PAYMENTS",
    depositPercentage: 100,
    defaultDropoff: "Argo Mill and Tunnel",
  },
  "parr-private": {
    key: "parr-private",
    title: "Book Red Rocks Private Transport",
    intro: "Choose the vehicle, event date, party size, and pickup details, then continue to secure checkout.",
    backHref: "/book/red-rocks",
    backLabel: "Back to Party at Red Rocks",
    defaultProduct: "parr-suburban",
    pickupMode: "freeform",
    defaultPickup: "Denver pickup address",
    checkoutTitle: "Red Rocks Private Checkout",
    checkoutIntro: "Review the vehicle, date, party size, and pickup details before payment.",
    prelaunchEnvVar: "NEXT_PUBLIC_PARR_PRIVATE_PRELAUNCH",
    paymentsEnvVar: "ENABLE_PARR_PRIVATE_PAYMENTS",
    depositPercentage: 50,
    balanceDueHours: 48,
    defaultDropoff: "Red Rocks Amphitheatre",
  },
  "parr-shared": {
    key: "parr-shared",
    title: "Book Red Rocks Shared Shuttle",
    intro: "Choose your pickup hub, date, and seat count, then continue to secure checkout.",
    backHref: "https://www.partyatredrocks.com/book/red-rocks-amphitheatre/custom/shared",
    backLabel: "Back to Red Rocks booking",
    defaultProduct: "parr-shared-golden",
    pickupMode: "select",
    pickupOptions: [
      PARR_PICKUP_HUBS.denver.pickupText,
      PARR_PICKUP_HUBS.golden.pickupText,
    ],
    defaultPickup: PARR_PICKUP_HUBS.golden.pickupText,
    checkoutTitle: "Red Rocks Shared Shuttle Checkout",
    checkoutIntro: "Review the pickup hub, concert date, and seat count before payment.",
    prelaunchEnvVar: "NEXT_PUBLIC_PARR_PRIVATE_PRELAUNCH",
    paymentsEnvVar: "ENABLE_PARR_PRIVATE_PAYMENTS",
    depositPercentage: 100,
    defaultDropoff: "Red Rocks Amphitheatre",
  },
};

export function getCheckoutRouteConfig(route: string | null | undefined) {
  if (route == null || route === "") return null;
  return ROUTES[route as CheckoutRouteKey] || null;
}

export function getCheckoutProductsForRoute(route: string | null | undefined) {
  return PRODUCTS.filter((product) => product.route === route);
}

export function getCheckoutProduct(key: string | null | undefined) {
  if (key == null || key === "") return null;
  return PRODUCTS.find((product) => product.key === key) || null;
}

export function isCheckoutPaymentsEnabled(route: string | null | undefined) {
  const config = getCheckoutRouteConfig(route);
  if (config == null) return false;
  if (process.env[config.paymentsEnvVar] === "true") return true;
  if (["parr-private", "parr-shared"].includes(route || "")) {
    return process.env.ENABLE_ARGO_PAYMENTS === "true";
  }
  return false;
}

export function isCheckoutPrelaunch(route: string | null | undefined) {
  const config = getCheckoutRouteConfig(route);
  if (config == null) return true;
  const value = process.env[config.prelaunchEnvVar];
  if (typeof value === "string") return value === "false" ? false : true;
  if (["parr-private", "parr-shared"].includes(route || "")) {
    return process.env.NEXT_PUBLIC_ARGO_PRELAUNCH === "false" ? false : true;
  }
  return process.env.NEXT_PUBLIC_ARGO_PRELAUNCH === "false" ? false : true;
}

export function getCheckoutPricing(
  route: string | null | undefined,
  productKey: string | null | undefined,
  qty: number,
) {
  const config = getCheckoutRouteConfig(route);
  const product = getCheckoutProduct(productKey);

  if (config == null || product == null || product.route !== config.key) {
    return null;
  }

  const normalizedQty = Math.min(product.maxQty, Math.max(1, Number(qty || 1)));
  const totalCents = product.priceCents * normalizedQty;
  const depositPercentage = Math.min(100, Math.max(1, config.depositPercentage || 100));
  const amountDueNowCents =
    depositPercentage >= 100
      ? totalCents
      : Math.max(1, Math.round(totalCents * (depositPercentage / 100)));
  const remainingBalanceCents = Math.max(0, totalCents - amountDueNowCents);

  return {
    totalCents,
    amountDueNowCents,
    remainingBalanceCents,
    depositPercentage,
    balanceDueHours: config.balanceDueHours || 0,
  };
}

export function getBalanceDueAt(date: string, balanceDueHours?: number) {
  const hours = Number(balanceDueHours || 0);
  if (date === "" || hours <= 0) return null;

  const serviceDate = new Date(`${date}T18:00:00.000Z`);
  if (Number.isNaN(serviceDate.getTime())) return null;
  return new Date(serviceDate.getTime() - hours * 60 * 60 * 1000).toISOString();
}
