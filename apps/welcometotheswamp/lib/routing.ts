export type PageIntent = "explore" | "compare" | "decide" | "act";

export type RouteOption = {
  title: string;
  description: string;
  href: string;
  kind: "internal" | "external";
  emphasis?: "primary" | "secondary";
  trackingId?: string;
};

export const INTENT_LABELS: Record<PageIntent, string> = {
  explore: "Explore",
  compare: "Compare",
  decide: "Decide",
  act: "Act",
};
