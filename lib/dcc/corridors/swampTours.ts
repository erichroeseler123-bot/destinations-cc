import type {
  CorridorDecisionCard,
  CorridorHandoffTarget,
  CorridorManifest,
  CorridorNavigationLink,
  CorridorRouteConfig,
  CorridorRouteRole,
} from "@/lib/dcc/corridors/types";

export const SWAMP_TOURS_CANONICAL_PLAN_TARGET = "https://welcometotheswamp.com/plan";

const handoffTargets: CorridorHandoffTarget[] = [
  {
    id: "plan",
    href: SWAMP_TOURS_CANONICAL_PLAN_TARGET,
    mode: "plan",
    satelliteId: "welcometotheswamp",
    citySlug: "new-orleans",
    notes: "Canonical planning handoff for the swamp tours corridor.",
    isCanonical: true,
  },
];

const relatedGuides: CorridorNavigationLink[] = [
  { href: "/new-orleans/swamp-tours/airboat-vs-boat", label: "Airboat vs boat" },
  { href: "/new-orleans/swamp-tours/first-time", label: "Best for first time" },
  { href: "/new-orleans/swamp-tours/with-kids", label: "With kids" },
  { href: "/new-orleans/swamp-tours/transportation", label: "Transportation" },
];

const decisionCards: CorridorDecisionCard[] = [
  {
    href: "/new-orleans/swamp-tours/airboat-vs-boat",
    title: "Airboat vs boat",
    body: "Best if the real question is thrill versus comfort.",
    label: "Format choice",
  },
  {
    href: "/new-orleans/swamp-tours/first-time",
    title: "Best for first time",
    body: "Best if you want the safest default without overthinking the whole market.",
    label: "First-time lane",
  },
  {
    href: "/new-orleans/swamp-tours/with-kids",
    title: "With kids",
    body: "Best if family fit, noise, and easier pacing are the real blockers.",
    label: "Family lane",
  },
  {
    href: "/new-orleans/swamp-tours/transportation",
    title: "Transportation",
    body: "Best if pickup from New Orleans changes the whole decision.",
    label: "Logistics lane",
  },
];

export const SWAMP_TOURS_CORRIDOR: CorridorManifest = {
  id: "new-orleans-swamp-tours",
  canonicalHubRoute: "/new-orleans/swamp-tours",
  handoff: {
    approvedParams: ["intent", "topic", "source", "subtype", "context", "sourcePage"],
    forbiddenLegacyParams: ["source_page", "src", "page", "cta", "product"],
    targets: handoffTargets,
  },
  relatedGuides,
  decisionCards,
  routes: [
    {
      route: "/new-orleans/swamp-tours",
      role: "hub",
      target: SWAMP_TOURS_CANONICAL_PLAN_TARGET,
      notes: "Canonical DCC swamp-tours understanding hub.",
    },
    {
      route: "/new-orleans/swamp-tours/airboat-vs-boat",
      role: "feeder",
      target: "/new-orleans/swamp-tours",
      notes: "Format-comparison feeder.",
    },
    {
      route: "/new-orleans/swamp-tours/first-time",
      role: "feeder",
      target: "/new-orleans/swamp-tours",
      notes: "First-time visitor feeder.",
    },
    {
      route: "/new-orleans/swamp-tours/best-time",
      role: "feeder",
      target: "/new-orleans/swamp-tours",
      notes: "Timing and seasonality feeder.",
    },
    {
      route: "/new-orleans/swamp-tours/transportation",
      role: "feeder",
      target: "/new-orleans/swamp-tours",
      notes: "Pickup and transport-friction feeder.",
    },
    {
      route: "/new-orleans/swamp-tours/types",
      role: "feeder",
      target: "/new-orleans/swamp-tours",
      notes: "Tour-type feeder.",
    },
    {
      route: "/new-orleans/swamp-tours/with-kids",
      role: "feeder",
      target: "/new-orleans/swamp-tours",
      notes: "Family-fit feeder.",
    },
    {
      route: "/new-orleans/swamp-tours/worth-it",
      role: "feeder",
      target: "/new-orleans/swamp-tours",
      notes: "Skeptical-worth-it feeder.",
    },
  ],
};

export function getSwampToursCorridorRoutesByRole(role: CorridorRouteRole): CorridorRouteConfig[] {
  return SWAMP_TOURS_CORRIDOR.routes.filter((entry) => entry.role === role);
}
