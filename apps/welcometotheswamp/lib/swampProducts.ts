import { SITE_CONFIG } from "@/app/site-config";

export type SwampLane = "comfort" | "speed" | "families" | "pickup";

export type SwampProduct = {
  id: string;
  title: string;
  description: string | null;
  durationMinutes: number | null;
  priceLabel: string | null;
  imageUrl: string | null;
  supplierName: string | null;
  bookHref: string;
  rating?: number | null;
  reviewCount?: number | null;
  itineraryType?: string | null;
  bookingConfirmationType?: string | null;
  optionCount?: number | null;
  displayTags?: string[];
};

export type SwampProductsResponse = {
  generatedAt: string;
  signals: { headline?: string };
  browseHref?: string;
  products: SwampProduct[];
};

export type ShortlistItem = {
  product: SwampProduct;
  score: number;
  pros: string[];
  cautions: string[];
  fitSummary: string;
};

const LANE_LABELS: Record<SwampLane, string> = {
  comfort: "comfort-first",
  speed: "speed-first",
  families: "family-friendly",
  pickup: "pickup-friendly",
};

const AIRBOAT_RE = /\bairboat\b/i;
const COVERED_RE = /\bcovered\b|\bpontoon\b|\bboat\b|\bbarge\b/i;
const FAMILY_RE = /\bfamily\b|\bkid\b|\bkids\b|\bchildren\b/i;
const PICKUP_RE = /\bpickup\b|\bhotel\b|\btransport\b|\btransfer\b/i;
const SMALL_RE = /\bsmall\b/i;
const LARGE_RE = /\blarge\b/i;

function haystack(product: SwampProduct) {
  return `${product.title} ${product.description || ""} ${(product.displayTags || []).join(" ")}`.trim();
}

function pushUnique(list: string[], value: string | null) {
  if (!value || list.includes(value)) return;
  list.push(value);
}

function laneScore(product: SwampProduct, lane: SwampLane) {
  const text = haystack(product);
  const duration = product.durationMinutes ?? 0;
  const reviews = product.reviewCount ?? 0;
  const rating = product.rating ?? 0;
  let score = reviews / 100 + rating * 4;

  if ((product.optionCount ?? 0) > 2) score += 0.5;
  if ((product.bookingConfirmationType || "").toLowerCase().includes("instant")) score += 0.5;

  if (lane === "speed") {
    if (AIRBOAT_RE.test(text)) score += 8;
    if (SMALL_RE.test(text)) score += 1.5;
    if (duration > 0 && duration <= 120) score += 1;
    if (COVERED_RE.test(text)) score -= 2;
  }

  if (lane === "comfort") {
    if (COVERED_RE.test(text)) score += 6;
    if (LARGE_RE.test(text)) score += 2;
    if (AIRBOAT_RE.test(text)) score -= 3;
    if (duration >= 90 && duration <= 240) score += 1;
  }

  if (lane === "families") {
    if (FAMILY_RE.test(text)) score += 6;
    if (COVERED_RE.test(text)) score += 2;
    if (duration > 0 && duration <= 150) score += 2;
    if (AIRBOAT_RE.test(text)) score -= 2;
  }

  if (lane === "pickup") {
    if (PICKUP_RE.test(text)) score += 8;
    if (duration >= 90) score += 0.5;
  }

  return score;
}

function analyzeProduct(product: SwampProduct, lane: SwampLane): ShortlistItem {
  const text = haystack(product);
  const pros: string[] = [];
  const cautions: string[] = [];

  if (AIRBOAT_RE.test(text)) {
    pushUnique(pros, lane === "speed" ? "Strong fit if you want speed and noise." : null);
    pushUnique(cautions, lane !== "speed" ? "Likely louder and less comfort-first than larger boat options." : null);
  }

  if (COVERED_RE.test(text)) {
    pushUnique(pros, lane !== "speed" ? "Better fit for shade, calmer pacing, and easier conversation." : null);
  }

  if (FAMILY_RE.test(text)) {
    pushUnique(pros, "Current Viator labeling suggests it is meant to feel easier for mixed-age groups.");
  }

  if (PICKUP_RE.test(text)) {
    pushUnique(pros, "Current listing copy or tags mention pickup or transport help from the city.");
  } else if (lane === "pickup") {
    pushUnique(cautions, "Transport support is not obvious from the current Viator signals.");
  }

  if ((product.durationMinutes ?? 0) > 180) {
    pushUnique(cautions, "Longer total outing, so it can eat more of the day than expected.");
  } else if ((product.durationMinutes ?? 0) > 0 && (product.durationMinutes ?? 0) <= 120) {
    pushUnique(pros, "Shorter duration can be easier to fit into a New Orleans day.");
  }

  if ((product.rating ?? 0) >= 4.5) {
    pushUnique(pros, "Strong average traveler rating signal on Viator.");
  }

  if ((product.reviewCount ?? 0) >= 250) {
    pushUnique(pros, "Heavier review volume gives a stronger market signal than a thin listing.");
  }

  if ((product.optionCount ?? 0) >= 3) {
    pushUnique(pros, "Multiple booking options can make it easier to find a workable time slot.");
  }

  if ((product.bookingConfirmationType || "").toLowerCase().includes("instant")) {
    pushUnique(pros, "Instant confirmation signal reduces booking friction.");
  }

  if (!pros.length) pushUnique(pros, `Looks like a plausible ${LANE_LABELS[lane]} option based on current Viator signals.`);
  if (!cautions.length) pushUnique(cautions, "Confirm ride style, transfer burden, and weather fit before booking.");

  const fitSummary =
    lane === "comfort"
      ? "Best when you want the safest, least exhausting fit."
      : lane === "speed"
        ? "Best when the ride itself should feel like the thrill."
        : lane === "families"
          ? "Best when the group needs an easier, lower-friction outing."
          : "Best when pickup simplicity matters as much as the ride.";

  return {
    product,
    score: laneScore(product, lane),
    pros,
    cautions,
    fitSummary,
  };
}

export function getShortlistForLane(products: SwampProduct[], lane: SwampLane, max = 3): ShortlistItem[] {
  return products
    .map((product) => analyzeProduct(product, lane))
    .sort((a, b) => b.score - a.score)
    .slice(0, max);
}

export function getLaneFromSearchParam(value: string | string[] | undefined): SwampLane | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === "comfort" || raw === "speed" || raw === "families" || raw === "pickup") {
    return raw;
  }
  return null;
}

export function filterProductsForLane(products: SwampProduct[], lane: SwampLane): SwampProduct[] {
  const shortlistIds = new Set(getShortlistForLane(products, lane, 4).map((item) => item.product.id));
  const shortlisted = products.filter((product) => shortlistIds.has(product.id));
  return shortlisted.length ? shortlisted : products;
}

export function getLaneCopy(lane: SwampLane) {
  switch (lane) {
    case "comfort":
      return {
        title: "Comfort-first shortlist",
        intro: "These are the strongest current fits if you want calmer pacing, easier conversation, and a less punishing ride.",
      };
    case "speed":
      return {
        title: "Speed-first shortlist",
        intro: "These are the strongest current fits if you want a louder, faster, more thrilling ride.",
      };
    case "families":
      return {
        title: "Family-friendly shortlist",
        intro: "These are the strongest current fits if you want a more manageable day for mixed-age groups.",
      };
    case "pickup":
      return {
        title: "Pickup-friendly shortlist",
        intro: "These are the strongest current fits if transport simplicity from New Orleans matters most.",
      };
  }
}

export async function getSwampProducts(): Promise<SwampProductsResponse> {
  try {
    const response = await fetch(`${SITE_CONFIG.dccOrigin}/api/public/swamp-products-viator`, {
      cache: "no-store",
    });
    if (!response.ok) throw new Error("Failed to load swamp products");
    return (await response.json()) as SwampProductsResponse;
  } catch {
    return {
      generatedAt: new Date().toISOString(),
      signals: {},
      products: [],
    };
  }
}
