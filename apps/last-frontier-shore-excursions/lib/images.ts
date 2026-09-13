export interface ImageAsset {
  url: string;
  alt: string;
  caption: string;
}

export const HERO_IMAGE: ImageAsset = {
  url: "/images/alaska/inside-passage-hero-generated.png",
  alt: "Panoramic vista of a grand tidewater glacier flowing into the tranquil waters of the Alaska Inside Passage framed by snow-capped peaks and coastal evergreen forests",
  caption: "Inside Passage & Tidewater Glacier",
};

export const PORT_IMAGES: Record<string, ImageAsset> = {
  juneau: {
    url: "/images/alaska/juneau-mendenhall.jpg",
    alt: "Mendenhall Glacier terminus and mountain lake near Juneau, Alaska",
    caption: "Mendenhall Glacier, Juneau",
  },
  skagway: {
    url: "/images/alaska/skagway-white-pass.jpg",
    alt: "White Pass and Yukon Route railway navigating rugged mountain pass in Skagway, Alaska",
    caption: "White Pass and Yukon Route, Skagway",
  },
  ketchikan: {
    url: "/images/alaska/ketchikan-creek-street.jpg",
    alt: "Historic Creek Street wooden boardwalk over water in Ketchikan, Alaska",
    caption: "Historic Creek Street, Ketchikan",
  },
  sitka: {
    url: "/images/alaska/sitka-sound.jpg",
    alt: "Fishing vessels in Crescent Harbor against coastal mountains in Sitka, Alaska",
    caption: "Crescent Harbor and Mountains, Sitka",
  },
  "icy-strait-point": {
    url: "/images/alaska/icy-strait-point-wilderness.jpg",
    alt: "Historic cannery, excursion dock, and evergreen rainforest shore at Icy Strait Point, Hoonah",
    caption: "Historic Cannery and Waterfront, Icy Strait Point",
  },
};

export const ACTIVITY_IMAGES: Record<string, ImageAsset> = {
  "whale-watching": {
    url: "/images/alaska/whale-watching.jpg",
    alt: "Humpback whale breaching dramatically out of Alaska coastal waters",
    caption: "Humpback Whale Encounter, Southeast Alaska",
  },
  "whale-and-wilderness-tours": {
    url: "/images/alaska/whale-watching.jpg",
    alt: "Humpback whale breaching near Point Adolphus and Icy Strait Point",
    caption: "Point Adolphus Whale Waters, Icy Strait",
  },
  "mendenhall-glacier-tours": {
    url: "/images/alaska/juneau-mendenhall.jpg",
    alt: "Mendenhall Glacier and waterfall in Juneau, Alaska",
    caption: "Mendenhall Glacier, Juneau",
  },
  "helicopter-glacier-tours": {
    url: "/images/alaska/glacier-flightseeing.jpg",
    alt: "Tour helicopter landing on the blue ice crevasses of an Alaska icefield glacier",
    caption: "Helicopter Glacier Landing, Juneau Icefield",
  },
  flightseeing: {
    url: "/images/alaska/glacier-flightseeing.jpg",
    alt: "Scenic flightseeing aircraft surveying glaciated mountain fjords",
    caption: "Glacial Icefield Flightseeing, Southeast Alaska",
  },
  "floatplane-excursions": {
    url: "/images/alaska/glacier-flightseeing.jpg",
    alt: "Alaska floatplane and alpine aerial flightseeing",
    caption: "Floatplane Scenery, Misty Fjords",
  },
  "dog-sledding": {
    url: "/images/alaska/glacier-flightseeing.jpg",
    alt: "Glacier icefield dog sled camp access by helicopter",
    caption: "Glacier Dog Sled Camp, Alaska Icefield",
  },
  "white-pass-railway-tours": {
    url: "/images/alaska/scenic-railway.jpg",
    alt: "White Pass and Yukon Route scenic train climbing mountain cliffs",
    caption: "White Pass and Yukon Route Train, Skagway",
  },
  "scenic-mountain-routes": {
    url: "/images/alaska/skagway-white-pass.jpg",
    alt: "Scenic mountain pass and highway climbing into the Klondike Alpine",
    caption: "Klondike Highway and White Pass Summit",
  },
  "excursions-by-duration-and-ship-window": {
    url: "/images/alaska/scenic-railway.jpg",
    alt: "White Pass rail and mountain excursion options in Skagway",
    caption: "Skagway Excursion Routes by Ship Timing",
  },
  "yukon-excursions": {
    url: "/images/alaska/skagway-white-pass.jpg",
    alt: "Subalpine tundra and mountain pass leading into the Yukon Territory",
    caption: "White Pass Summit into the Yukon",
  },
  "gold-rush-tours": {
    url: "/images/alaska/scenic-railway.jpg",
    alt: "Historic Klondike Gold Rush rail and trail corridor in Skagway",
    caption: "Historic Klondike Trail Corridor, Skagway",
  },
  "misty-fjords-tours": {
    url: "/images/alaska/ketchikan-creek-street.jpg",
    alt: "Granite sea cliffs and marine gateway in Ketchikan",
    caption: "Misty Fjords Gateway, Ketchikan",
  },
  "wildlife-and-rainforest-tours": {
    url: "/images/alaska/wildlife-bear.jpg",
    alt: "Wild coastal black bear along the edge of the Tongass National Forest",
    caption: "Coastal Wildlife in Tongass National Forest",
  },
  "wildlife-excursions": {
    url: "/images/alaska/wildlife-bear.jpg",
    alt: "Coastal Alaska wildlife in temperate rainforest environment",
    caption: "Southeast Alaska Wildlife Habitat",
  },
  "bear-tours": {
    url: "/images/alaska/wildlife-bear.jpg",
    alt: "Wild black bear foraging along salmon stream in Southeast Alaska",
    caption: "Wild Bear Viewing, Tongass Forest",
  },
  "totem-and-cultural-tours": {
    url: "/images/alaska/native-culture-totem.jpg",
    alt: "Hand-carved Pacific Northwest Native totem poles at Saxman Totem Park",
    caption: "Tlingit Totem Heritage, Saxman / Ketchikan",
  },
  "wildlife-and-historic-tours": {
    url: "/images/alaska/sitka-sound.jpg",
    alt: "Sitka harbor with coastal mountains and marine wildlife habitat",
    caption: "Sitka Sound Marine and Historic District",
  },
  "excursions-by-cruise-ship-time": {
    url: "/images/alaska/inside-passage-hero-generated.png",
    alt: "Southeast Alaska Inside Passage waters and mountains",
    caption: "Cruise Ship Timing Excursion Routes",
  },
};

export function getActivityImage(portSlug: string, activitySlug: string): ImageAsset {
  if (ACTIVITY_IMAGES[activitySlug]) {
    return ACTIVITY_IMAGES[activitySlug];
  }
  if (PORT_IMAGES[portSlug]) {
    return PORT_IMAGES[portSlug];
  }
  return HERO_IMAGE;
}
