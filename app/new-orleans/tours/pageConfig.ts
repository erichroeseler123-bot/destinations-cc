import type { NetworkCommercialPageConfig } from "@/app/components/network/types";
import { buildSwampPlanHref } from "@/lib/dcc/warmTransfer";

export const NEW_ORLEANS_TOURS_PATH = "/new-orleans/tours";

const swampDecisionHref = buildSwampPlanHref({
  intent: "compare",
  topic: "swamp-tours",
  subtype: "comfort",
  context: "first-time",
  sourcePage: NEW_ORLEANS_TOURS_PATH,
});

const swampPickupHref = buildSwampPlanHref({
  intent: "compare",
  topic: "swamp-tours",
  subtype: "pickup",
  context: "no-car",
  sourcePage: NEW_ORLEANS_TOURS_PATH,
});

const airboatDecisionHref = buildSwampPlanHref({
  intent: "compare",
  topic: "swamp-tours",
  subtype: "airboat",
  context: "first-time",
  sourcePage: NEW_ORLEANS_TOURS_PATH,
});

const smallBoatDecisionHref = buildSwampPlanHref({
  intent: "compare",
  topic: "swamp-tours",
  subtype: "boat",
  context: "mixed-group",
  sourcePage: NEW_ORLEANS_TOURS_PATH,
});

export const newOrleansToursPageConfig: NetworkCommercialPageConfig = {
  id: "wno-new-orleans-tours",
  path: NEW_ORLEANS_TOURS_PATH,
  metadata: {
    title: "New Orleans Tours | Swamp Tours, Airboats, Food Tours, Ghost Walks",
    description:
      "Choose New Orleans swamp tours, airboat tours, food tours, ghost walks, private group tours, family-friendly tours, and rainy-day options.",
    keywords: [
      "New Orleans tours",
      "New Orleans swamp tours",
      "New Orleans airboat tours",
      "hotel pickup swamp tour New Orleans",
      "family-friendly New Orleans tours",
      "private New Orleans tours",
    ],
  },
  hero: {
    eyebrow: "New Orleans tours",
    title: "Book the right New Orleans tour for your trip.",
    summary:
      "Compare swamp tours, airboat tours, hotel pickup, family-friendly options, private groups, food tours, ghost walks, and rainy-day backups before you commit.",
    primaryCta: {
      label: "Compare swamp pickup",
      href: swampDecisionHref,
      ariaLabel: "Compare New Orleans swamp tours with hotel pickup",
    },
    secondaryCta: {
      label: "What should I book?",
      href: "#what-to-book",
    },
    trustChips: ["Hotel pickup", "Airboat tours", "Family-friendly", "Rainy-day options"],
    media: {
      eyebrow: "Trip fit sorter",
      title: "Start with pickup, weather, group fit, and timing.",
      body:
        "The best New Orleans tour is usually the one that fits the day. Use the first decision to avoid sending a visitor into the wrong boat, pickup plan, or neighborhood.",
      rows: [
        { label: "Swamp intent", value: "Route pickup and boat-type questions to WTS" },
        { label: "City intent", value: "Keep food, ghost, and Quarter plans walkable" },
        { label: "Fallback", value: "Label marketplace inventory clearly" },
      ],
    },
  },
  trustStrip: {
    items: [
      {
        id: "hotel-pickup",
        label: "Hotel-pickup awareness",
        body: "Swamp and airboat tours can depend on pickup zone, timing, and whether the group has a car.",
      },
      {
        id: "weather",
        label: "Weather-aware planning",
        body: "Rain and heat can change the better move, so rainy-day and lower-transfer backups stay visible.",
      },
      {
        id: "family-group",
        label: "Family and group fit",
        body: "Mixed ages, private groups, and comfort needs should shape the tour before inventory does.",
      },
      {
        id: "local-support",
        label: "Local decision support",
        body: "The page narrows the next step without claiming fake availability, prices, ratings, or guarantees.",
      },
    ],
  },
  decisionBlock: {
    eyebrow: "What should I book?",
    title: "Start with the constraint.",
    body:
      "If pickup or boat type is unclear, start with the swamp-tour handoff. If the trip is city-first, stay close to food, French Quarter, ghost, cemetery, or neighborhood tours. If the group needs custom timing, use a clearly labeled fallback and confirm terms before booking.",
    recommendation:
      "For swamp or airboat intent, compare hotel pickup and boat type first. For city-first trips, choose a walkable tour and keep an indoor or short-transfer backup.",
    supportPoints: ["pickup need", "boat type", "weather risk", "group fit"],
    cta: {
      label: "Use the swamp handoff",
      href: swampDecisionHref,
    },
  },
  featuredCards: [
    {
      id: "swamp-hotel-pickup",
      title: "Swamp tour with hotel pickup",
      subtitle:
        "Best for visitors staying in the French Quarter, CBD, or nearby hotels who want the bayou plan without solving transportation first.",
      category: "Swamp tours",
      destination: "wno",
      tags: ["hotel pickup", "swamp tours", "first-time visitors"],
      cta: { label: "Compare pickup options", href: swampPickupHref },
      providerType: "partner_handoff",
      disclosure:
        "No live availability is claimed here. Pickup details continue on the swamp-tour handoff path.",
      decisionReason: "Use this when transportation is the main reason the visitor has not booked yet.",
    },
    {
      id: "airboat-tour",
      title: "Airboat tour",
      subtitle:
        "Best for travelers who want a faster open-air ride and are comfortable with noise, spray, heat, and weather tradeoffs.",
      category: "Airboat tours",
      destination: "wno",
      tags: ["airboat tours", "open-air ride", "boat type"],
      cta: { label: "Compare airboat fit", href: airboatDecisionHref },
      providerType: "partner_handoff",
      disclosure: "Airboats are not the right fit for every group. Compare boat type before booking.",
      decisionReason: "Use this when the visitor wants speed and energy, not a quieter covered-boat plan.",
    },
    {
      id: "small-boat-swamp-tour",
      title: "Small boat swamp tour",
      subtitle:
        "A better fit for families, mixed-age groups, wildlife viewing, and visitors who care more about comfort than speed.",
      category: "Swamp tours",
      destination: "wno",
      tags: ["family-friendly", "small boat", "wildlife"],
      cta: { label: "Compare small boat fit", href: smallBoatDecisionHref },
      providerType: "partner_handoff",
      disclosure: "Covered or quieter boat options can be a better match when heat, rain, or younger travelers matter.",
      decisionReason: "Use this when the trip needs easier comfort and lower friction.",
    },
    {
      id: "private-group-tour",
      title: "Private or group tour",
      subtitle:
        "For bachelor and bachelorette groups, reunions, team trips, and private parties that need timing or pickup flexibility.",
      category: "Private groups",
      destination: "wno",
      tags: ["private groups", "custom timing", "fallback"],
      cta: {
        label: "View group options",
        href: "/tours?city=new-orleans&q=private%20group%20tour%20new%20orleans&source_section=wno-featured-groups",
      },
      providerType: "affiliate_fallback",
      disclosure: "This is fallback marketplace coverage, not owned execution. Confirm group terms with the listed provider.",
      decisionReason: "Use this when standard public-tour timing is the problem.",
    },
    {
      id: "rainy-day-fallback",
      title: "Rainy-day or French Quarter fallback",
      subtitle:
        "For short stays, stormy afternoons, and city-first visitors who need a lower-transfer plan near the Quarter.",
      category: "Rainy-day options",
      destination: "wno",
      tags: ["rainy-day options", "French Quarter", "low transfer"],
      cta: { label: "Find backup ideas", href: "/new-orleans/things-to-do" },
      providerType: "affiliate_fallback",
      disclosure: "Use this when weather or travel time makes an outdoor swamp plan fragile.",
      decisionReason: "Use this when the best answer is not another outdoor transfer.",
    },
  ],
  categoryGrid: {
    eyebrow: "Tour categories",
    title: "Route by tour type.",
    body:
      "Category links use existing public New Orleans pages where available. Broader inventory is labeled as fallback when it leaves the owned guide path.",
    items: [
      {
        id: "swamp-tours",
        title: "New Orleans swamp tours",
        body: "Start here when the main question is hotel pickup, boat type, timing, or whether the swamp trip fits the group.",
        cta: { label: "Open swamp handoff", href: swampDecisionHref },
        providerType: "partner_handoff",
      },
      {
        id: "airboat-tours",
        title: "Airboat tours",
        body: "Compare the faster open-air ride against calmer swamp boats before sending the visitor to book.",
        cta: { label: "Compare airboats", href: airboatDecisionHref },
        providerType: "partner_handoff",
      },
      {
        id: "family-friendly",
        title: "Family-friendly tours",
        body: "Use this for mixed ages, comfort needs, daytime timing, and plans that should stay easy to execute.",
        cta: { label: "Open family guide", href: "/new-orleans/family-friendly" },
      },
      {
        id: "food-tours",
        title: "Food tours",
        body: "A city-first path for visitors who want classic dishes, neighborhoods, and a guided tasting route.",
        cta: { label: "Open food guide", href: "/new-orleans/food" },
      },
      {
        id: "french-quarter",
        title: "French Quarter tours",
        body: "The lower-transfer move for first-timers, short stays, history walks, and compact city context.",
        cta: { label: "Open Quarter context", href: "/new-orleans/neighborhoods" },
      },
      {
        id: "ghost-tours",
        title: "Ghost tours",
        body: "Night-walk inventory for groups that want atmosphere, stories, and French Quarter proximity.",
        cta: {
          label: "View fallback options",
          href: "/tours?city=new-orleans&q=new%20orleans%20ghost%20tour&source_section=wno-category-grid",
        },
        providerType: "affiliate_fallback",
      },
      {
        id: "cemetery-tours",
        title: "Cemetery tours",
        body: "Daytime walking tours where heat, access rules, distance, and timing matter.",
        cta: {
          label: "View fallback options",
          href: "/tours?city=new-orleans&q=new%20orleans%20cemetery%20tour&source_section=wno-category-grid",
        },
        providerType: "affiliate_fallback",
      },
      {
        id: "private-group",
        title: "Private and group tours",
        body: "Use when group size, pickup needs, or a custom route matters more than a standard public tour.",
        cta: {
          label: "View group options",
          href: "/tours?city=new-orleans&q=private%20group%20tour%20new%20orleans&source_section=wno-category-grid",
        },
        providerType: "affiliate_fallback",
      },
      {
        id: "rainy-day",
        title: "Rainy-day options",
        body: "Backup ideas for indoor, covered, shorter, or easier-to-reschedule plans when weather turns.",
        cta: { label: "Find rain backups", href: "/new-orleans/things-to-do" },
      },
    ],
  },
  providerDisclosure: {
    providerType: "mixed",
    label: "WTS handoff first, marketplace fallback where needed.",
    body:
      "Welcome to the Swamp is the focused swamp-tour handoff. Marketplace links are fallback coverage. This page does not claim live availability, final prices, operator ratings, or guaranteed pickup.",
    allowedClaims: [
      "New Orleans swamp tours and airboat tours",
      "Hotel pickup may depend on provider terms",
      "Marketplace fallback is labeled",
      "Provider terms should be checked before booking",
    ],
    notClaimed: [
      "No fake ratings or reviews",
      "No guaranteed pickup",
      "No lowest-price claim",
      "No live availability claim on this page",
    ],
  },
  stickyMobileCta: {
    enabled: true,
    label: "Compare swamp pickup",
    href: swampDecisionHref,
    disclosureLabel: "Handoff path. Provider terms apply.",
    providerType: "partner_handoff",
  },
  footer: {
    eyebrow: "New Orleans tour planner",
    body:
      "A mobile-first tour routing surface for matching New Orleans visitors to swamp, airboat, city, family, private group, and rainy-day options.",
    links: [
      { label: "Swamp tours", href: "/new-orleans/swamp-tours" },
      { label: "Things to do", href: "/new-orleans/things-to-do" },
      { label: "Food guide", href: "/new-orleans/food" },
    ],
  },
};
