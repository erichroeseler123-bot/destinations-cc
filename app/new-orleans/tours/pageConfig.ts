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

// Source credit: Library of Congress / Wikimedia Commons. Context image only; not a specific provider photo.
const swampDockImage = {
  src: "/media/corridors/swamp-dock-pickup.webp",
  alt: "Boats staged at a Louisiana marsh dock for a swamp tour departure",
};

// Source credit: Wikimedia Commons. Context image only; not a specific provider photo.
const airboatSwampImage = {
  src: "/images/wno/airboat-swamp-tour.webp",
  alt: "An airboat moving across swamp water during a Louisiana-style tour",
};

// Source credit: Wikimedia Commons. Context image only; not a specific provider photo.
const smallBoatSwampImage = {
  src: "/images/wno/small-boat-swamp-tour.webp",
  alt: "A covered swamp tour boat traveling through Louisiana marsh scenery",
};

// Source credit: Wikimedia Commons. Context image only; not a specific provider photo.
const louisianaSwampImage = {
  src: "/images/wno/louisiana-swamp-backup.webp",
  alt: "Still Louisiana swamp water and trees for a rainy-day tour planning backup",
};

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
    eyebrow: "New Orleans tours, swamp rides, Quarter nights",
    title: "Find the New Orleans tour that fits your trip.",
    summary:
      "A warm, practical tour desk for swamp rides, French Quarter history, food, ghost nights, riverboats, and pickup-friendly plans.",
    primaryCta: {
      label: "Find My Tour",
      href: "#tour-finder",
      ariaLabel: "Use the New Orleans tour finder",
    },
    secondaryCta: {
      label: "Compare Swamp Tours",
      href: swampDecisionHref,
    },
    trustChips: ["Hotel pickup options", "Airboats and bayou rides", "Food, ghosts, history", "Family and group picks"],
    media: {
      eyebrow: "Bookable first move",
      title: "Start with the right category, then check the tour.",
      body:
        "Choose the ride style, night slot, food route, or history lane first. Then open the booking path with fewer wrong tabs.",
      image: swampDockImage,
      rows: [
        { label: "Finder", value: "Trip fit before listings" },
        { label: "Book", value: "Partner availability path" },
        { label: "Backup", value: "Quarter, food, ghost, river" },
      ],
    },
  },
  trustStrip: {
    items: [
      {
        id: "hotel-pickup",
        label: "Pickup made easier",
        body: "Start with pickup if you are staying in the French Quarter, CBD, or nearby hotel zones.",
      },
      {
        id: "weather",
        label: "Real swamp energy",
        body: "Compare airboat speed against calmer bayou boats before choosing the main outdoor trip.",
      },
      {
        id: "family-group",
        label: "Group-fit picks",
        body: "Match families, couples, bachelor and bachelorette groups, reunions, and comfort needs.",
      },
      {
        id: "local-support",
        label: "Bad-weather backup",
        body: "Keep French Quarter, food, ghost, and shorter city tours ready when storms change the day.",
      },
    ],
  },
  decisionBlock: {
    eyebrow: "Tour finder",
    title: "Tell us the kind of day you want.",
    body:
      "Start with the customer decision: swamp or city, day or night, food or history, pickup or walkable. WTONOT keeps the choice practical before you check availability with the provider.",
    recommendation:
      "Most visitors should pick one headline category, then choose the tour that fits pickup, timing, group style, and weather.",
    supportPoints: ["tour type", "pickup", "timing", "group fit"],
    cta: {
      label: "Find My Tour",
      href: "#bookable-tours",
    },
  },
  featuredCards: [
    {
      id: "swamp-hotel-pickup",
      title: "Swamp Tour With Hotel Pickup",
      subtitle:
        "The low-friction classic: bayou scenery, boat time, and transportation handled before your day gets crowded.",
      category: "Swamp tours",
      destination: "wno",
      image: swampDockImage,
      tags: ["hotel pickup", "swamp tours", "first-time visitors"],
      cta: { label: "Check Availability", href: swampPickupHref },
      providerType: "partner_handoff",
      disclosure:
        "Pickup details continue on the swamp-tour booking path. Provider terms apply.",
      decisionReason: "Best for first-timers and no-car groups that want the signature swamp day without solving transport twice.",
    },
    {
      id: "airboat-tour",
      title: "Airboat Swamp Tour",
      subtitle:
        "Louder, faster, more wind-in-your-face. This is the high-energy swamp move when the group wants a ride.",
      category: "Airboat tours",
      destination: "wno",
      image: airboatSwampImage,
      tags: ["airboat tours", "open-air ride", "boat type"],
      cta: { label: "Compare Swamp Tours", href: airboatDecisionHref },
      providerType: "partner_handoff",
      disclosure: "Airboats are not the right fit for every group. Compare boat style before booking.",
      decisionReason: "Best for travelers who want the ride to be part of the memory, not just the transportation.",
    },
    {
      id: "small-boat-swamp-tour",
      title: "Small Boat Swamp Tour",
      subtitle:
        "A calmer bayou day for families, mixed-age groups, wildlife watching, and anyone choosing comfort over speed.",
      category: "Swamp tours",
      destination: "wno",
      image: smallBoatSwampImage,
      tags: ["family-friendly", "small boat", "wildlife"],
      cta: { label: "Check Availability", href: smallBoatDecisionHref },
      providerType: "partner_handoff",
      disclosure: "Covered or quieter boat options can be a better match when heat, rain, or younger travelers matter.",
      decisionReason: "Best when shade, pace, conversation, and easier group comfort matter more than speed.",
    },
    {
      id: "private-group-tour",
      title: "Private / Group Tour",
      subtitle:
        "For parties, reunions, team trips, and groups that need timing, pickup, or privacy to fit the day.",
      category: "Private groups",
      destination: "wno",
      image: swampDockImage,
      tags: ["private groups", "custom timing", "fallback"],
      cta: {
        label: "Check Availability",
        href: "/tours?city=new-orleans&q=private%20group%20tour%20new%20orleans&source_section=wno-featured-groups",
      },
      providerType: "affiliate_fallback",
      disclosure: "This is fallback marketplace coverage, not owned execution. Confirm group terms with the listed provider.",
      decisionReason: "Best when a public-tour schedule feels too tight or the group needs a cleaner meet-up plan.",
    },
    {
      id: "rainy-day-fallback",
      title: "Rainy-Day French Quarter Backup",
      subtitle:
        "Food, ghosts, history, music, and walkable Quarter options for stormy afternoons or short stays.",
      category: "Rainy-day options",
      destination: "wno",
      image: louisianaSwampImage,
      tags: ["rainy-day options", "French Quarter", "low transfer"],
      cta: { label: "Find backup ideas", href: "/new-orleans/things-to-do" },
      providerType: "affiliate_fallback",
      disclosure: "Use this when weather or travel time makes an outdoor swamp plan fragile.",
      decisionReason: "Best when the smart move is staying close, dry, and walkable instead of forcing another outdoor transfer.",
    },
  ],
  categoryGrid: {
    eyebrow: "Topic map",
    title: "Start with the tour category.",
    body:
      "These are the governed WTONOT topics. Each one can become a category page and booking helper once product coverage is confirmed.",
    items: [
      {
        id: "swamp-wildlife",
        title: "Swamp & Wildlife Tours",
        body: "Airboats, calmer bayou boats, wildlife, hotel pickup, and the outside-the-city New Orleans classic.",
        cta: { label: "Compare Swamp Tours", href: swampDecisionHref },
        providerType: "partner_handoff",
      },
      {
        id: "history-plantation",
        title: "French Quarter, History & Plantation Tours",
        body: "Walking tours, French Quarter context, architecture, cemetery routes, and plantation day decisions.",
        cta: { label: "Find history tours", href: "/?intent=history" },
        providerType: "partner_handoff",
      },
      {
        id: "food-cocktail",
        title: "Food, Cocktail & Culinary Tours",
        body: "Creole tastings, cocktail walks, hands-on food experiences, and easier first-day eating plans.",
        cta: { label: "Find food tours", href: "/?intent=food,cocktails" },
        providerType: "partner_handoff",
      },
      {
        id: "ghost-nightlife",
        title: "Ghost, Vampire, Jazz & Nightlife Tours",
        body: "Haunted stories, vampire lore, jazz nights, French Quarter energy, and after-dark tour decisions.",
        cta: { label: "Find night tours", href: "/?intent=ghosts,cocktails" },
        providerType: "partner_handoff",
      },
      {
        id: "riverboat-cruises",
        title: "Riverboat & Mississippi River Cruises",
        body: "Sightseeing cruises, dinner cruises, sunset routes, and water-first New Orleans plans.",
        cta: {
          label: "Check availability",
          href: "/tours?city=new-orleans&q=mississippi%20river%20cruise%20new%20orleans&source_section=wno-topic-grid",
        },
        providerType: "affiliate_fallback",
      },
      {
        id: "pickup-transfers",
        title: "Transportation, Hotel Pickup & Private Transfers",
        body: "Pickup-friendly tours, private routes, port transfers, and logistics checks before booking.",
        cta: {
          label: "Check pickup options",
          href: "/tours?city=new-orleans&q=new%20orleans%20tour%20hotel%20pickup&source_section=wno-topic-grid",
        },
        providerType: "affiliate_fallback",
      },
    ],
  },
  providerDisclosure: {
    providerType: "mixed",
    label: "Booking paths are labeled before you leave.",
    body:
      "Swamp-tour links may continue to Welcome to the Swamp. Broader tour links may open marketplace options. This page does not claim live availability, final prices, operator ratings, or guaranteed pickup.",
    allowedClaims: [
      "Compare New Orleans swamp tours and airboat tours",
      "Start with hotel pickup when transportation matters",
      "Find city-tour backups for weather or short stays",
      "See when a link opens a broader marketplace option",
    ],
    notClaimed: [
      "Final pickup zone and pickup window",
      "Final tour price and taxes",
      "Provider ratings and reviews",
      "Live availability on this page",
    ],
  },
  stickyMobileCta: {
    enabled: true,
    label: "Find My Tour",
    href: "#tour-finder",
    disclosureLabel: "Provider terms apply.",
    providerType: "partner_handoff",
  },
  footer: {
    eyebrow: "Welcome to New Orleans Tours",
    body:
      "A governed New Orleans tourism storefront for choosing swamp, history, food, ghost, riverboat, pickup-friendly, family, and premium tour paths before booking.",
    links: [
      { label: "Find My Tour", href: "#tour-finder" },
      { label: "Compare Swamp Tours", href: swampDecisionHref },
      { label: "Check Availability", href: "#bookable-tours" },
    ],
  },
};
