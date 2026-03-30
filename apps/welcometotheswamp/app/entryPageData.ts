import type { Metadata } from "next";
import type { WarmTransferContext, WarmTransferSubtype } from "@/lib/warmTransfer";

export type EntryChoice = {
  label: string;
  description: string;
  subtype: WarmTransferSubtype;
  context: WarmTransferContext;
};

export type WtsEntryPage = {
  slug: "airboat-vs-boat" | "best-time" | "with-kids" | "worth-it" | "transportation" | "types";
  title: string;
  description: string;
  eyebrow: string;
  summary: string;
  confirmText: string;
  choices: readonly EntryChoice[];
  comparisonRows: readonly { left: string; right: string }[];
  ctaTitle: string;
  ctaBody: string;
  ctaButtonLabel: string;
  defaultSubtype: WarmTransferSubtype;
  defaultContext: WarmTransferContext;
  metadata: Metadata;
};

export const WTS_ENTRY_PAGES: Record<WtsEntryPage["slug"], WtsEntryPage> = {
  "airboat-vs-boat": {
    slug: "airboat-vs-boat",
    title: "Airboat or Swamp Boat? Let’s Find the Right Tour",
    description: "You’re deciding between speed and scenery. We’ll help you pick the right swamp tour based on what matters to you.",
    eyebrow: "Decision entry",
    summary: "You’re deciding between speed and scenery. We’ll help you turn that tradeoff into a real shortlist.",
    confirmText: "If you’re not sure which type of swamp tour to book, this is the right place. We’ll narrow it down quickly based on your preferences.",
    choices: [
      { label: "I want something fast and exciting", description: "Thrill-first, louder, and more intense.", subtype: "airboat", context: "first-time" },
      { label: "I want something calm and scenic", description: "Quieter, steadier, and easier to settle into.", subtype: "boat", context: "first-time" },
      { label: "I’m going with kids", description: "Bias toward comfort, duration, and lower friction.", subtype: "with-kids", context: "kids" },
      { label: "I need easy pickup from New Orleans", description: "Bias toward no-car simplicity and transport fit.", subtype: "transportation", context: "no-car" },
    ],
    comparisonRows: [
      { left: "Fast", right: "Slow" },
      { left: "Loud", right: "Quiet" },
      { left: "Thrilling", right: "Relaxed" },
      { left: "Covers more distance", right: "Better wildlife viewing" },
    ],
    ctaTitle: "Turn this tradeoff into a real shortlist",
    ctaBody: "Move forward with the lane that matches what matters most instead of reopening the whole market.",
    ctaButtonLabel: "See the right shortlist",
    defaultSubtype: "airboat-vs-boat",
    defaultContext: "first-time",
    metadata: {
      title: "Airboat or Swamp Boat? | Welcome to the Swamp",
      description: "Confirm whether speed or scenery should lead your swamp-tour choice, then move into /plan.",
      alternates: { canonical: "https://welcometotheswamp.com/airboat-vs-boat" },
    },
  },
  "best-time": {
    slug: "best-time",
    title: "Best Time to Go? Use Timing to Narrow the Shortlist",
    description: "Use timing as a decision input, then move into the right swamp-tour shortlist.",
    eyebrow: "Decision entry",
    summary: "Timing matters, but only because it changes which tour style and logistics fit best.",
    confirmText: "If timing is your blocker, this is the right place. We’ll route you into a stronger shortlist instead of leaving you in generic season advice.",
    choices: [
      { label: "I want the easiest default", description: "Bias toward calmer, lower-friction options.", subtype: "best-time", context: "short-trip" },
      { label: "I’m working around a short trip", description: "Bias toward safer fit and cleaner timing.", subtype: "best-time", context: "short-trip" },
      { label: "I care most about weather comfort", description: "Bias toward easier pacing and lower exposure risk.", subtype: "comfort", context: "first-time" },
      { label: "Pickup timing matters too", description: "Bias toward transport-sensitive fit.", subtype: "transportation", context: "no-car" },
    ],
    comparisonRows: [
      { left: "Cooler and easier", right: "Hotter and less forgiving" },
      { left: "More margin", right: "Less margin" },
      { left: "Comfort-first", right: "Exposure-first" },
      { left: "Trip-fit", right: "Bad itinerary fit" },
    ],
    ctaTitle: "See the timing-safe shortlist",
    ctaBody: "Open the shortlist that treats timing as a fit signal, not as a vague season debate.",
    ctaButtonLabel: "See timing-safe options",
    defaultSubtype: "best-time",
    defaultContext: "short-trip",
    metadata: {
      title: "Best Time | Welcome to the Swamp",
      description: "Use timing to narrow the right swamp-tour fit, then move into /plan.",
      alternates: { canonical: "https://welcometotheswamp.com/best-time" },
    },
  },
  "with-kids": {
    slug: "with-kids",
    title: "Swamp Tours with Kids? Start with the Easier Lane",
    description: "Confirm the family-fit question fast, then move into the right shortlist.",
    eyebrow: "Decision entry",
    summary: "You’re not choosing the loudest ride. You’re choosing the best family fit.",
    confirmText: "If you’re planning around kids, this is the right place. We’ll narrow the strongest family-fit lane quickly instead of making you read through generic family-travel filler.",
    choices: [
      { label: "I need a calm family fit", description: "Bias toward easier pacing and lower noise.", subtype: "with-kids", context: "kids" },
      { label: "I still want some excitement", description: "Keep some thrill, but do not lose group fit.", subtype: "families", context: "mixed-group" },
      { label: "Pickup simplicity matters", description: "Bias toward no-car family logistics.", subtype: "transportation", context: "no-car" },
      { label: "I need the safest default", description: "Bias toward comfort-first shortlist logic.", subtype: "comfort", context: "kids" },
    ],
    comparisonRows: [
      { left: "Calm", right: "Intense" },
      { left: "Lower noise", right: "More noise" },
      { left: "Mixed-age fit", right: "Selective fit" },
      { left: "Easier day", right: "More effort" },
    ],
    ctaTitle: "See the calmer family-fit shortlist",
    ctaBody: "Move into the shortlist that filters for kids, comfort, and a more manageable day.",
    ctaButtonLabel: "See family-fit options",
    defaultSubtype: "with-kids",
    defaultContext: "kids",
    metadata: {
      title: "With Kids | Welcome to the Swamp",
      description: "Confirm the family-fit lane, then move into /plan for the right swamp-tour shortlist.",
      alternates: { canonical: "https://welcometotheswamp.com/with-kids" },
    },
  },
  "worth-it": {
    slug: "worth-it",
    title: "Worth It? Let’s Pressure-Test the Fit",
    description: "Once the answer is maybe yes, move into the shortlist and test whether the day is actually worth it.",
    eyebrow: "Decision entry",
    summary: "If you’re close to yes, the next move is not more philosophy. It’s narrowing the fit.",
    confirmText: "If you’re deciding whether a swamp tour deserves part of the trip, this is the right place. We’ll move you toward a real fit check fast.",
    choices: [
      { label: "I want the safest default", description: "Start with a comfort-first shortlist.", subtype: "worth-it", context: "mixed-group" },
      { label: "I want a stronger thrill", description: "See whether the excitement justifies the time.", subtype: "airboat", context: "first-time" },
      { label: "I need easier logistics", description: "Pressure-test transport fit first.", subtype: "transportation", context: "no-car" },
      { label: "I’m choosing for a group", description: "Bias toward broader fit instead of edge-case intensity.", subtype: "comfort", context: "mixed-group" },
    ],
    comparisonRows: [
      { left: "Strong contrast", right: "Weak trip fit" },
      { left: "Good timing", right: "Overloaded day" },
      { left: "Clean logistics", right: "High friction" },
      { left: "Right format", right: "Wrong format" },
    ],
    ctaTitle: "See whether the strongest fits justify the day",
    ctaBody: "Open the shortlist and pressure-test whether the best-fit options actually earn the time and effort.",
    ctaButtonLabel: "See the strongest fits",
    defaultSubtype: "worth-it",
    defaultContext: "mixed-group",
    metadata: {
      title: "Worth It | Welcome to the Swamp",
      description: "Move skeptical traffic into the actual swamp-tour decision flow once the answer is close to yes.",
      alternates: { canonical: "https://welcometotheswamp.com/worth-it" },
    },
  },
  transportation: {
    slug: "transportation",
    title: "Need Easy Pickup? Let’s Find the Right Tour",
    description: "If transport is the blocker, confirm it immediately and move into a pickup-aware shortlist.",
    eyebrow: "Decision entry",
    summary: "You’re probably not choosing between tours yet. You’re choosing between levels of transport friction.",
    confirmText: "If pickup or no-car logistics are shaping the whole decision, this is the right place. We’ll route you into the right shortlist fast.",
    choices: [
      { label: "I need easy pickup from New Orleans", description: "Bias toward low-friction city-side logistics.", subtype: "transportation", context: "no-car" },
      { label: "I have a car but want the cleanest fit", description: "Bias toward overall low-friction timing.", subtype: "pickup", context: "first-time" },
      { label: "I’m on a short trip", description: "Bias toward simpler transport and lower risk.", subtype: "best-time", context: "short-trip" },
      { label: "I’m choosing for a family", description: "Bias toward mixed-age logistical ease.", subtype: "with-kids", context: "kids" },
    ],
    comparisonRows: [
      { left: "Easy pickup", right: "More self-managed" },
      { left: "Lower friction", right: "More effort" },
      { left: "Cleaner short-trip fit", right: "Harder to fit cleanly" },
      { left: "Transport-first", right: "Format-first" },
    ],
    ctaTitle: "See tours that keep the day logistically clean",
    ctaBody: "Move into the shortlist that treats pickup burden as part of the decision instead of an afterthought.",
    ctaButtonLabel: "See pickup-aware options",
    defaultSubtype: "transportation",
    defaultContext: "no-car",
    metadata: {
      title: "Transportation | Welcome to the Swamp",
      description: "Confirm transport-sensitive fit, then move into /plan with pickup-aware context.",
      alternates: { canonical: "https://welcometotheswamp.com/transportation" },
    },
  },
  types: {
    slug: "types",
    title: "Too Many Tour Types? Let’s Pick the Right Lane",
    description: "Collapse the market into useful lanes, then move into a shortlist instead of comparing everything at once.",
    eyebrow: "Decision entry",
    summary: "You do not need to understand every operator. You need the lane that fits you best.",
    confirmText: "If the market feels too broad, this is the right place. We’ll reduce it to a few useful choices and route you forward.",
    choices: [
      { label: "I want speed and excitement", description: "Bias toward thrill-first lanes.", subtype: "airboat", context: "first-time" },
      { label: "I want calm and comfort", description: "Bias toward lower-friction, steadier options.", subtype: "types", context: "first-time" },
      { label: "I’m choosing for kids or a group", description: "Bias toward broader fit and easier pacing.", subtype: "with-kids", context: "kids" },
      { label: "I need easier pickup", description: "Bias toward transport-sensitive fit.", subtype: "transportation", context: "no-car" },
    ],
    comparisonRows: [
      { left: "Thrill-first", right: "Comfort-first" },
      { left: "Louder", right: "Quieter" },
      { left: "Ride-driven", right: "Scenery-driven" },
      { left: "Selective fit", right: "Broader fit" },
    ],
    ctaTitle: "Turn the lane into a real shortlist",
    ctaBody: "Open the shortlist and move from market overload into a few usable options.",
    ctaButtonLabel: "See the right lane",
    defaultSubtype: "types",
    defaultContext: "first-time",
    metadata: {
      title: "Types | Welcome to the Swamp",
      description: "Collapse option overload into useful decision lanes, then move into /plan.",
      alternates: { canonical: "https://welcometotheswamp.com/types" },
    },
  },
};
