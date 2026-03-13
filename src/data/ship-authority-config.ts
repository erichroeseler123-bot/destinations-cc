export type ShipAuthorityLink = {
  label: string;
  href: string;
};

export type ShipAuthorityConfig = {
  slug: string;
  name: string;
  line: string;
  updatedAt: string;
  buildYear: number;
  tonnage: string;
  passengerCapacity: string;
  crew: string;
  bestFor: string[];
  keyAmenities: string[];
  deckHighlights: string[];
  pros: string[];
  tradeoffs: string[];
  comparisonNotes: string[];
  relatedLinks: ShipAuthorityLink[];
};

export const SHIP_AUTHORITY_CONFIG: Record<string, ShipAuthorityConfig> = {
  "icon-of-the-seas": {
    slug: "icon-of-the-seas",
    name: "Icon of the Seas",
    line: "Royal Caribbean International",
    updatedAt: "2026-03-11",
    buildYear: 2024,
    tonnage: "250,800 GT",
    passengerCapacity: "5,610 guests double occupancy",
    crew: "2,350 crew",
    bestFor: ["Families", "First-time mega-ship cruisers", "Waterpark-heavy vacations"],
    keyAmenities: [
      "Waterslides",
      "Surf simulator",
      "Kids Club",
      "AquaTheater",
      "Broadway-style shows",
      "Spa and fitness center",
    ],
    deckHighlights: [
      "Huge open-deck family activity footprint",
      "Aqua show and production entertainment stack",
      "Resort-style pool zones with broad all-day use",
    ],
    pros: [
      "Strongest family activity density in this ship set",
      "Very clear value for travelers who want the ship itself to be the destination",
      "Good fit for Caribbean buyers comparing entertainment-first vacations",
    ],
    tradeoffs: [
      "Scale is a feature for some travelers and a negative for others",
      "Less attractive if you want a quieter, smaller-ship feel",
      "High-demand sailings can price up quickly",
    ],
    comparisonNotes: [
      "Choose Icon of the Seas over Carnival Jubilee if waterslides, spectacle, and all-ages activity density matter more than a looser fun-ship vibe.",
      "Choose it over Viking Octantis only if you want a mainstream resort-at-sea model, not expedition depth.",
    ],
    relatedLinks: [
      { label: "Cruises hub", href: "/cruises" },
      { label: "Miami port page", href: "/cruises/port/miami-usa" },
      { label: "Cozumel port page", href: "/cruises/port/cozumel-mexico" },
    ],
  },
  "carnival-jubilee": {
    slug: "carnival-jubilee",
    name: "Carnival Jubilee",
    line: "Carnival Cruise Line",
    updatedAt: "2026-03-11",
    buildYear: 2023,
    tonnage: "183,521 GT",
    passengerCapacity: "5,282 guests double occupancy",
    crew: "1,735 crew",
    bestFor: ["Families", "Group trips", "Value-focused Caribbean buyers"],
    keyAmenities: [
      "WaterWorks",
      "Family Zone",
      "Comedy Club",
      "Live Music",
      "Cloud 9 Spa",
      "Casino",
    ],
    deckHighlights: [
      "Fun-forward public spaces with strong family energy",
      "Comedy and live music stack for casual nights",
      "Large-format Caribbean ship with broad group appeal",
    ],
    pros: [
      "Easy fit for value-oriented families and casual groups",
      "Good match for travelers who want a more relaxed fun-first tone than Royal Caribbean spectacle",
      "Galveston embarkation can be a strong draw for Texas-based buyers",
    ],
    tradeoffs: [
      "Less premium and less polished-feeling than a luxury or expedition product",
      "Not the right ship if your priority is calm, low-crowd space",
      "The best sailings can compress on price when demand spikes",
    ],
    comparisonNotes: [
      "Choose Carnival Jubilee over Icon of the Seas if you want a fun-ship Caribbean product with a simpler value equation.",
      "Choose it over Viking Octantis if you want mainstream leisure and family entertainment instead of expedition learning and remote routing.",
    ],
    relatedLinks: [
      { label: "Cruises hub", href: "/cruises" },
      { label: "Galveston port page", href: "/cruises/port/galveston-usa" },
      { label: "Roatan port page", href: "/cruises/port/roatan-honduras" },
    ],
  },
  "viking-octantis": {
    slug: "viking-octantis",
    name: "Viking Octantis",
    line: "Viking Expeditions",
    updatedAt: "2026-03-11",
    buildYear: 2022,
    tonnage: "30,150 GT",
    passengerCapacity: "378 guests",
    crew: "256 crew",
    bestFor: ["Expedition travelers", "Nature-led itineraries", "Lower-capacity premium buyers"],
    keyAmenities: [
      "Zodiac landings",
      "Kayak excursions",
      "Exploration lectures",
      "Science lab",
      "Nordic spa",
      "Nordic-inspired dining",
    ],
    deckHighlights: [
      "Expedition operations are the core differentiator, not broad entertainment",
      "Smaller ship scale supports a more focused premium feel",
      "Science and learning layer is part of the product identity",
    ],
    pros: [
      "Strongest fit for travelers who care about destination depth over ship spectacle",
      "More coherent expedition identity than mainstream large-ship alternatives",
      "Alaska and remote-leaning buyers have a clearer use case here",
    ],
    tradeoffs: [
      "Much less relevant for travelers who want waterparks, casinos, or family mega-ship energy",
      "Smaller capacity means the vibe is narrower and more specific",
      "Pricing usually sits in a more premium decision band",
    ],
    comparisonNotes: [
      "Choose Viking Octantis over Icon of the Seas or Carnival Jubilee if destination immersion, learning, and expedition gear matter more than entertainment volume.",
      "Choose a mainstream ship instead if your trip is family-led, resort-like, or value-first.",
    ],
    relatedLinks: [
      { label: "Cruises hub", href: "/cruises" },
      { label: "Seward port page", href: "/cruises/port/seward-alaska" },
      { label: "Juneau port page", href: "/cruises/port/juneau-alaska" },
    ],
  },
};

export function getShipAuthorityConfig(slug: string): ShipAuthorityConfig | null {
  return SHIP_AUTHORITY_CONFIG[slug] || null;
}
