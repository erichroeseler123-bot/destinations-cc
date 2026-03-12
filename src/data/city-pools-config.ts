import type { NodeImageAsset } from "@/src/lib/media-resolver";
import { buildLocalImageAsset } from "@/src/lib/media-resolver";

export type CityPoolNode = {
  slug: string;
  title: string;
  summary: string;
  type: "luxury" | "family" | "dayclub" | "spa" | "resort";
  hotelHref?: string;
};

export type CityPoolsConfig = {
  cityKey: string;
  cityName: string;
  heroSummary: string;
  heroImage: NodeImageAsset;
  gallery: NodeImageAsset[];
  highlights: string[];
  poolNodes: CityPoolNode[];
  relatedLinks: Array<{ href: string; label: string }>;
  faq: Array<{ q: string; a: string }>;
};

export const CITY_POOLS_CONFIG: Record<string, CityPoolsConfig> = {
  "las-vegas": {
    cityKey: "las-vegas",
    cityName: "Las Vegas",
    heroSummary:
      "Vegas pools are their own search and booking lane: flagship resort pools, luxury pool decks, dayclub-adjacent scenes, and family-friendly hotel pool choices.",
    heroImage: buildLocalImageAsset(
      "/images/las-vegas/pools/hero.svg",
      "Las Vegas resort pool deck with palm trees and skyline styling",
    ),
    gallery: [
      buildLocalImageAsset("/images/las-vegas/pools/luxury-deck.svg", "Luxury Las Vegas pool deck concept artwork"),
      buildLocalImageAsset("/images/las-vegas/pools/dayclub.svg", "Las Vegas dayclub pool concept artwork"),
      buildLocalImageAsset("/images/las-vegas/pools/family-pool.svg", "Family-friendly Las Vegas resort pool concept artwork"),
      buildLocalImageAsset("/images/las-vegas/pools/sunset-cabana.svg", "Las Vegas sunset pool cabana concept artwork"),
    ],
    highlights: [
      "Luxury-pool intent is different from family-pool intent, so the page should split those paths early.",
      "Many pool buyers are really choosing a hotel through the pool surface first, then branching into shows, restaurants, and Strip routing.",
      "Cabana and pool-party activity buyers often overlap with dayclub and premium-weekend inventory rather than general sightseeing.",
    ],
    poolNodes: [
      {
        slug: "bellagio-pools",
        title: "Bellagio pool deck",
        summary: "Classic luxury-pool routing for premium Strip stays, couples, and calmer flagship-resort buyers.",
        type: "luxury",
        hotelHref: "/hotel/bellagio",
      },
      {
        slug: "caesars-palace-pools",
        title: "Caesars Palace Garden of the Gods pools",
        summary: "Large flagship resort pool identity with luxury, sportsbook, and center-Strip overlap.",
        type: "luxury",
        hotelHref: "/hotel/caesars-palace",
      },
      {
        slug: "wynn-encore-pools",
        title: "Wynn and Encore pools",
        summary: "Premium pool-and-daylife cluster for luxury buyers who still want nightlife crossover.",
        type: "dayclub",
        hotelHref: "/hotel/wynn",
      },
      {
        slug: "mandalay-bay-pools",
        title: "Mandalay Bay beach pool complex",
        summary: "One of the clearest family and resort-style pool nodes in the Vegas graph.",
        type: "family",
        hotelHref: "/hotel/mandalay-bay",
      },
      {
        slug: "mgm-grand-pools",
        title: "MGM Grand pool complex",
        summary: "Big-resort pool routing for event weekends, larger groups, and entertainment-first trips.",
        type: "resort",
        hotelHref: "/hotel/mgm-grand",
      },
      {
        slug: "circus-circus-pools",
        title: "Circus Circus and family-value pools",
        summary: "Budget and kid-friendly pool routing when the hotel decision is driven by price and family logistics first.",
        type: "family",
        hotelHref: "/hotel/circus-circus",
      },
    ],
    relatedLinks: [
      { href: "/las-vegas/hotels", label: "Las Vegas hotels" },
      { href: "/luxury-hotels-las-vegas", label: "Luxury hotels in Las Vegas" },
      { href: "/kid-friendly/las-vegas", label: "Kid-friendly Las Vegas" },
      { href: "/las-vegas-strip", label: "Las Vegas Strip" },
    ],
    faq: [
      {
        q: "Are Vegas pools worth planning around?",
        a: "Yes. Pool identity often changes which hotel, district, and daily route makes sense, especially for summer, luxury, and group trips.",
      },
      {
        q: "What is the difference between Vegas pools and dayclubs?",
        a: "Resort pools fit stay-first or family-first planning, while dayclubs behave more like nightlife inventory with stronger premium-weekend and bottle-service crossover.",
      },
      {
        q: "Which Vegas hotels are better for families and pools?",
        a: "Family-led pool choices usually cluster around larger resort complexes with calmer daytime layouts and easier attraction pairing, such as Mandalay Bay and Circus Circus.",
      },
    ],
  },
};

export function getCityPoolsConfig(cityKey: string) {
  return CITY_POOLS_CONFIG[cityKey] || null;
}
