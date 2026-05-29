import {
  RIVER_OPS_TERMINAL,
  SITE_URL,
  riverOpsOutbound,
} from "@/lib/content";

export type OperatorSurfaceConfig = {
  slug: string;
  routePath: string;
  associatedCorridor: string;
  decisionProduct: string;
  executionEntity: string;
  executionTier: "controlled_partner_execution";
  upstreamVerdict: string;
  userIntentProblem: string;
  primaryCtaLabel: string;
  secondaryCtaLabel: string;
  upstreamEscapeRoute: string;
  sidewaysEscapeRoute: string;
  media: {
    imageUrl: string;
    imageAlt: string;
    blurDataURL?: string;
  };
  outboundHref: string;
};

const jetBoatCard = RIVER_OPS_TERMINAL.find(
  (card) => card.slug === "jet-boat-adventures",
);

export const JET_BOAT_OPERATOR_SURFACE: OperatorSurfaceConfig = {
  slug: "jet-boat-adventures",
  routePath: "/river-ops/jet-boat-adventures",
  associatedCorridor: "wisconsin-dells-river-ops",
  decisionProduct: "jet-boat-primary",
  executionEntity: "Jet Boat Adventures / Ticket Hub",
  executionTier: "controlled_partner_execution",
  upstreamVerdict: "Jet Boat Adventures is the fast, physical river move.",
  userIntentProblem:
    "You want the raw canyon run without browsing every attraction or generic Dells directory.",
  primaryCtaLabel: "Check jet boat times",
  secondaryCtaLabel: "Continue to ticket hub",
  upstreamEscapeRoute: "/#hubs",
  sidewaysEscapeRoute: "/lounge",
  media: {
    imageUrl:
      jetBoatCard?.imageUrl ||
      "https://www.jetboatadv.com/wp-content/uploads/2023/07/homepage_hero.png",
    imageAlt:
      jetBoatCard?.imageAlt ||
      "Jet Boat Adventures running through the Wisconsin Dells canyon",
    blurDataURL: jetBoatCard?.blurDataURL,
  },
  outboundHref: riverOpsOutbound("jet-boat-primary"),
};

export const OPERATOR_SURFACES = [JET_BOAT_OPERATOR_SURFACE] as const;

export function getOperatorSurface(slug: string) {
  return OPERATOR_SURFACES.find((surface) => surface.slug === slug) ?? null;
}

export function buildOperatorSurfaceUrl(surface: OperatorSurfaceConfig) {
  return `${SITE_URL}${surface.routePath}`;
}
