import type { NetworkCommercialPageConfig } from "@/app/components/network/types";
import { buildWtsGetYourGuideSearchHref } from "@/lib/getyourguide";
import { SITE_CONFIG } from "./site-config";

const products = SITE_CONFIG.swampFareHarborProducts;
const asn = SITE_CONFIG.fareharborSwampAsn;
const fhAirboatProduct = products?.find(p => p.type === "airboat");

const airboatHref = fhAirboatProduct && asn
  ? (fhAirboatProduct.itemId
      ? `https://fareharbor.com/embeds/book/${fhAirboatProduct.companyShortname}/items/${fhAirboatProduct.itemId}/?asn=${asn}&flow=${fhAirboatProduct.flowId || ""}`
      : `https://fareharbor.com/embeds/book/${fhAirboatProduct.companyShortname}/?asn=${asn}&flow=${fhAirboatProduct.flowId || ""}`)
  : buildWtsGetYourGuideSearchHref("airboat", "wts-storefront-airboat");

const quietSwampImage = {
  src: "/images/boat-chooser/generic-swamp.jpg",
  alt: "Still Louisiana swamp water surrounded by cypress trees",
};

export const swampStorefrontConfig: NetworkCommercialPageConfig = {
  id: "wts-home",
  path: "/",
  metadata: {
    title: "Welcome to the Swamp | New Orleans Swamp Tours",
    description:
      "Compare New Orleans swamp-tour formats: airboats, calmer covered boats, pickup logistics, family fit, private options, and current provider booking paths.",
    keywords: [
      "New Orleans swamp tours",
      "New Orleans airboat tours",
      "covered swamp boat New Orleans",
      "swamp tour with pickup",
    ],
  },
  hero: {
    eyebrow: "New Orleans swamp-tour specialist",
    title: "Choose the swamp ride that fits your day.",
    summary:
      "Airboat or covered boat? Pickup or self-drive? Family trip or high-energy ride? Welcome to the Swamp narrows the swamp decision, then sends you to the provider page for current prices, availability, restrictions, and checkout.",
    primaryCta: {
      label: "Compare swamp options",
      href: "/plan",
      ariaLabel: "Compare current New Orleans swamp tour options",
    },
    secondaryCta: {
      label: "Airboat vs covered boat",
      href: "/airboat-vs-boat",
    },
    trustChips: ["Swamp-focused", "Pickup notes", "Family-fit guidance", "Provider checkout"],
    media: {
      eyebrow: "Start with the ride style",
      title: "Airboats, covered boats, and private swamp options",
      body:
        "Choose by intensity, shade, group fit, and transportation before comparing a provider's current departure details.",
      image: quietSwampImage,
      rows: [
        { label: "High energy", value: "Airboat" },
        { label: "Comfort", value: "Covered boat" },
        { label: "Logistics", value: "Pickup or self-drive" },
      ],
    },
  },
  trustStrip: {
    items: [
      {
        id: "focused",
        label: "Swamp-focused",
        body: "The storefront stays centered on Louisiana swamp-tour choices instead of trying to replace a full New Orleans tour marketplace.",
      },
      {
        id: "boat-style",
        label: "Compare the ride",
        body: "Understand the practical difference between open airboats and calmer covered swamp boats before opening checkout.",
      },
      {
        id: "terms",
        label: "Provider terms stay authoritative",
        body: "Current prices, schedules, age rules, pickup eligibility, restrictions, and cancellation terms remain on the provider page.",
      },
      {
        id: "pickup",
        label: "Transportation matters",
        body: "Pickup versus self-drive can change the fit of the excursion as much as the boat format itself.",
      },
    ],
  },
  decisionBlock: {
    eyebrow: "Quick chooser",
    title: "Pick the swamp format before the operator.",
    body:
      "Want speed, wind, and a louder open-air ride? Start with an airboat. Want shade, easier conversation, or a calmer pace? Start with a covered boat. Then compare pickup, group size, and the provider's current terms.",
    recommendation:
      "Choose one swamp format first. Do not turn a simple ride-style decision into a generic New Orleans tour search.",
    supportPoints: ["airboat vs covered boat", "pickup vs self-drive", "with kids", "private vs shared"],
    cta: {
      label: "Use the swamp chooser",
      href: "/airboat-vs-boat",
    },
  },
  featuredCards: [
    {
      id: "ragincajun-airboat",
      title: "Airboat Tour",
      subtitle: "Ragin Cajun Tours",
      category: "Airboat Tour",
      destination: "wts",
      image: undefined,
      tags: [],
      cta: { label: "Check Ragin Cajun airboat dates", href: "/tours/airboat-tour" },
      providerType: "affiliate_fallback",
      disclosure: "Fast, open-air swamp ride for travelers who want more action and wind exposure.",
    },
    {
      id: "ragincajun-covered-boat",
      title: "Covered Swamp Boat",
      subtitle: "Ragin Cajun Tours",
      category: "Swamp Boat Tour",
      destination: "wts",
      image: undefined,
      tags: [],
      cta: { label: "Check covered-boat dates", href: "/tours/covered-swamp-boat" },
      providerType: "affiliate_fallback",
      disclosure: "A calmer swamp ride with shade and easier conversation for groups that prefer less intensity.",
    },
    {
      id: "ragincajun-private-boat",
      title: "Private Covered Tour",
      subtitle: "Ragin Cajun Tours",
      category: "Private Tour",
      destination: "wts",
      image: undefined,
      tags: [],
      cta: { label: "Check private-tour dates", href: "/tours/private-covered-tour" },
      providerType: "affiliate_fallback",
      disclosure: "A private swamp format for groups that want more control over space and pace.",
    },
  ],
  categoryGrid: {
    eyebrow: "Browse by swamp format",
    title: "Choose the ride, then solve the logistics.",
    body:
      "Keep the decision narrow: ride style, group fit, transportation, and current provider terms.",
    items: [
      {
        id: "airboats",
        title: "Airboat Tours",
        body: "Compare speed, noise, exposure, and open-air ride formats.",
        cta: { label: "Compare airboats", href: "/airboat-vs-boat" },
        providerType: "affiliate_fallback",
      },
      {
        id: "swamp-boats",
        title: "Covered Swamp Boats",
        body: "Compare calmer, shaded bayou rides when comfort and conversation matter more than speed.",
        cta: { label: "Compare covered boats", href: "/airboat-vs-boat" },
        providerType: "affiliate_fallback",
      },
      {
        id: "private-tours",
        title: "Private Swamp Tours",
        body: "Consider a private format when group space, pace, or control matters more than the lowest shared price.",
        cta: { label: "Plan a private swamp tour", href: "/plan" },
        providerType: "affiliate_fallback",
      },
      {
        id: "pickup",
        title: "Pickup-Friendly Options",
        body: "Compare transportation requirements before committing to the boat itself.",
        cta: { label: "Solve transportation", href: "/transportation" },
        providerType: "affiliate_fallback",
      },
    ],
  },
  providerDisclosure: {
    providerType: "affiliate_fallback",
    label: "How booking works",
    body:
      "Welcome to the Swamp helps you choose the swamp-tour format, then sends you to provider or marketplace booking pages for current prices, availability, pickup rules, restrictions, cancellation terms, and provider-specific details.",
    allowedClaims: [
      "We can explain swamp-tour format tradeoffs.",
      "We can send you to current provider booking paths.",
      "We can flag pickup, weather, and family-fit questions.",
    ],
    notClaimed: [
      "We do not claim live availability on this page.",
      "We do not operate every tour shown by partners.",
      "We do not promise wildlife sightings, weather, or pickup eligibility.",
    ],
  },
  stickyMobileCta: {
    enabled: true,
    label: "Check airboat options",
    href: airboatHref,
    external: true,
    providerType: "affiliate_fallback",
    disclosureLabel: "Current terms continue on booking page",
  },
  footer: {
    eyebrow: "Welcome to the Swamp",
    body:
      "The New Orleans swamp-tour specialist for choosing the ride style, pickup plan, and provider booking path that fits your day.",
    links: [
      { label: "Airboat vs boat", href: "/airboat-vs-boat" },
      { label: "With kids", href: "/with-kids" },
      { label: "Transportation", href: "/transportation" },
    ],
  },
};
