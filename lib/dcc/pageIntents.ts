export type DccPageIntent = "explore" | "understand" | "compare" | "act";

export type DccRouteOption = {
  title: string;
  description: string;
  href: string;
  kind: "internal" | "external";
  emphasis?: "primary" | "secondary";
};

export const DCC_INTENT_LABELS: Record<DccPageIntent, string> = {
  explore: "Explore",
  understand: "Understand",
  compare: "Compare",
  act: "Act",
};
