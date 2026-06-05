import type { ViatorActionProduct } from "@/lib/viator/schema";
import {
  isDirectViatorProductUrl,
  normalizedProductSupportsIntent,
  normalizeViatorResolverProduct,
} from "@/lib/viator/normalize";
import type {
  NormalizedViatorProduct,
  RankedRecommendation,
  ResolverInput,
  ViatorIntent,
} from "@/lib/viator/types";

type ScoredProduct = {
  product: NormalizedViatorProduct;
  score: number;
  reasons: string[];
};

function intentFromText(text: string): ViatorIntent {
  if (/whale/.test(text)) return "whale-watching";
  if (/helicopter|heli|flightseeing|glacier landing/.test(text)) return "helicopter-tours";
  if (/airboat/.test(text)) return "airboat";
  if (/swamp|bayou/.test(text)) return "swamp-tour";
  if (/jeep|4x4|off-road/.test(text)) return "jeep-tour";
  if (/luxury|vip|premium|private/.test(text)) return "luxury";
  if (/family|kid|children/.test(text)) return "family";
  if (/cruise|shore|port/.test(text)) return "cruise-compatible";
  return "value";
}

export function inferViatorIntent(
  ...values: Array<string | null | undefined>
): ViatorIntent {
  return intentFromText(values.filter(Boolean).join(" ").toLowerCase());
}

function getMinimumRating(input: ResolverInput): number {
  return input.minRating ?? 4.5;
}

function getMinimumReviewCount(input: ResolverInput): number {
  return input.minReviewCount ?? 25;
}

function violatesHardFilters(product: NormalizedViatorProduct, input: ResolverInput): string | null {
  if (!isDirectViatorProductUrl(product.bookUrl)) return "missing_direct_product_url";
  if ((product.rating ?? 0) < getMinimumRating(input)) return "rating_below_threshold";
  if ((product.reviewCount ?? 0) < getMinimumReviewCount(input)) return "review_depth_below_threshold";
  if (!normalizedProductSupportsIntent(product, input.intent)) return "intent_mismatch";
  if (input.minPrice !== undefined && product.price !== null && product.price < input.minPrice) {
    return "price_below_floor";
  }
  if (input.maxPrice !== undefined && product.price !== null && product.price > input.maxPrice) {
    return "price_above_ceiling";
  }
  if ((input.cruiseCompatible || input.intent === "cruise-compatible") && product.durationMinutes !== null) {
    if (product.durationMinutes > 360) return "duration_exceeds_cruise_window";
  }
  return null;
}

function scoreProduct(product: NormalizedViatorProduct, input: ResolverInput): ScoredProduct {
  const reasons: string[] = [];
  let score = 0;

  const rating = product.rating ?? 0;
  const reviews = product.reviewCount ?? 0;

  score += rating * 18;
  if (rating >= 4.8) reasons.push("excellent_rating");
  else if (rating >= 4.6) reasons.push("strong_rating");

  const reviewDepthScore = Math.log10(Math.max(reviews, 1)) * 14;
  score += reviewDepthScore;
  if (reviews >= 250) reasons.push("deep_review_history");
  else if (reviews >= 100) reasons.push("proven_review_depth");

  if (normalizedProductSupportsIntent(product, input.intent)) {
    score += 32;
    reasons.push("exact_intent_match");
  }

  if (product.availabilityStatus === "available") {
    score += 12;
    reasons.push("availability_signal");
  } else if (product.availabilityStatus === "limited") {
    score -= 8;
  }

  if ((input.cruiseCompatible || input.intent === "cruise-compatible") && product.durationMinutes !== null) {
    if (product.durationMinutes <= 300) {
      score += 10;
      reasons.push("cruise_safe_duration");
    } else if (product.durationMinutes > 360) {
      score -= 18;
    }
  }

  if (input.intent === "luxury" && product.price !== null) {
    if (product.price >= Math.max(input.minPrice ?? 200, 200)) {
      score += 10;
      reasons.push("luxury_price_fit");
    } else {
      score -= 10;
    }
  }

  if (input.intent === "value" && product.price !== null && input.maxPrice !== undefined) {
    if (product.price <= input.maxPrice) {
      score += 8;
      reasons.push("value_price_fit");
    } else {
      score -= 10;
    }
  }

  return { product, score, reasons };
}

function confidenceFromScores(top: ScoredProduct | null, next: ScoredProduct | null): RankedRecommendation["confidence"] {
  if (!top) return "none";
  if (top.score >= 150 && (!next || top.score - next.score >= 20)) return "high";
  if (top.score >= 125 && (!next || top.score - next.score >= 10)) return "medium";
  return "low";
}

export function rankViatorProducts(
  products: NormalizedViatorProduct[],
  input: ResolverInput,
): RankedRecommendation {
  const eligible = products
    .map((product) => ({
      product,
      filterFailure: violatesHardFilters(product, input),
    }))
    .filter((row) => row.filterFailure === null)
    .map((row) => scoreProduct(row.product, input))
    .sort((a, b) => b.score - a.score);

  const winner = eligible[0] || null;
  const runnerUp = eligible[1] || null;
  const confidence = confidenceFromScores(winner, runnerUp);

  if (!winner) {
    return {
      winner: null,
      score: null,
      confidence: "none",
      resolutionPath: "none",
      fitReason: "No Viator product cleared the hard filters for this DCC decision.",
      alternatives: [],
    };
  }

  const resolutionPath =
    input.resolutionPathHint ||
    (products.length <= 5 ? "tier1_exact" : "tier2_filtered");

  return {
    winner: winner.product,
    score: Number(winner.score.toFixed(2)),
    confidence,
    resolutionPath,
    fitReason: winner.reasons.join(", ") || "best_available_fit",
    alternatives: eligible.slice(1, 4).map((row) => row.product),
  };
}

export function rankViatorActionProducts(
  products: ViatorActionProduct[],
  input: ResolverInput,
): {
  recommendation: RankedRecommendation;
  orderedProducts: ViatorActionProduct[];
} {
  const normalized = products.map(normalizeViatorResolverProduct);
  const recommendation = rankViatorProducts(normalized, input);

  if (!recommendation.winner) {
    return { recommendation, orderedProducts: products };
  }

  const preferredOrder = [recommendation.winner, ...recommendation.alternatives].map(
    (item) => item.productCode,
  );
  const order = new Map(preferredOrder.map((code, index) => [code, index]));
  const orderedProducts = [...products].sort((a, b) => {
    const aIndex = order.get(a.product_code) ?? Number.MAX_SAFE_INTEGER;
    const bIndex = order.get(b.product_code) ?? Number.MAX_SAFE_INTEGER;
    return aIndex - bIndex;
  });

  return { recommendation, orderedProducts };
}
