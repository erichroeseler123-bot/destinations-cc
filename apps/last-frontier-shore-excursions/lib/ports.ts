export type Port = {
  slug: string;
  name: string;
  slugAlt?: string;
  nameAlt?: string;
  region: string;
  hook: string;
  image: string;
  imageAlt: string;
  imageCaption: string;
  dockLocations: string[];
  tenderStatus: string;
  typicalPortHours: string;
  bestFor: string[];
  searchTerms: string[];
  weatherBackup: string;
  topActivities: { name: string; href: string }[];
};

export const PORTS: Port[] = [
  {
    slug: "juneau",
    name: "Juneau",
    region: "Southeast Alaska",
    hook: "Glaciers, whale watching, flightseeing, and the easiest place to build one unforgettable Alaska day.",
    image: "/images/alaska/juneau-mendenhall.jpg",
    imageAlt: "Mendenhall Glacier terminus and mountain lake near Juneau, Alaska",
    imageCaption: "Mendenhall Glacier, Juneau",
    dockLocations: [
      "Franklin Dock (South downtown)",
      "Marine Dock (Center downtown)",
      "Steamship Dock (Downtown waterfront)",
      "AJ Dock (1 mile south, requires continuous port shuttle)"
    ],
    tenderStatus: "Rarely tenders; all 4 main berths accommodate large cruise ships.",
    typicalPortHours: "7 to 12 hours (e.g., 7:00 AM - 4:00 PM or 1:00 PM - 9:00 PM)",
    bestFor: ["Mendenhall Glacier", "whale watching", "helicopter flightseeing", "first-time Alaska visitors"],
    searchTerms: ["Juneau shore excursions", "Juneau whale watching", "Juneau glacier tours"],
    weatherBackup: "Keep a ground-based glacier shuttle or downtown historic option in reserve if aviation weather closes in.",
    topActivities: [
      { name: "Whale Watching", href: "/juneau/whale-watching" },
      { name: "Mendenhall Glacier", href: "/juneau/mendenhall-glacier-tours" },
      { name: "Helicopter Glacier Landings", href: "/juneau/helicopter-glacier-tours" },
      { name: "Dog Sledding", href: "/juneau/dog-sledding" },
      { name: "Seaplane Flightseeing", href: "/juneau/flightseeing" },
      { name: "Excursions by Ship Time", href: "/juneau/excursions-by-cruise-ship-time" }
    ]
  },
  {
    slug: "skagway",
    name: "Skagway",
    region: "Inside Passage",
    hook: "Gold Rush history, White Pass scenery, rail, road trips, and mountain views built for a port day.",
    image: "/images/alaska/skagway-white-pass.jpg",
    imageAlt: "White Pass and Yukon Route railway navigating rugged mountain pass in Skagway, Alaska",
    imageCaption: "White Pass & Yukon Route, Skagway",
    dockLocations: [
      "Railroad Dock (Direct dockside train boarding)",
      "Broadway Dock (Steps from historic downtown)",
      "Ore Dock (Fast flat walk into Broadway)"
    ],
    tenderStatus: "Virtually never tenders. Dockside train boarding at Railroad Dock.",
    typicalPortHours: "8 to 13 hours (e.g., 7:00 AM - 5:00 PM or 7:00 AM - 8:00 PM)",
    bestFor: ["White Pass", "rail tours", "Yukon scenery", "Gold Rush history"],
    searchTerms: ["Skagway shore excursions", "White Pass tours", "Skagway Yukon tours"],
    weatherBackup: "Choose history or a shorter scenic drive if visibility is poor at mountain summit elevation.",
    topActivities: [
      { name: "White Pass Railway", href: "/skagway/white-pass-railway-tours" },
      { name: "Yukon Border & Lakes", href: "/skagway/yukon-excursions" },
      { name: "Gold Rush History", href: "/skagway/gold-rush-tours" },
      { name: "Scenic Mountain Drives", href: "/skagway/scenic-mountain-routes" },
      { name: "Excursions by Duration", href: "/skagway/excursions-by-duration-and-ship-window" }
    ]
  },
  {
    slug: "ketchikan",
    name: "Ketchikan",
    region: "Southeast Alaska",
    hook: "Totem culture, wildlife, rainforest, fishing, and floatplane scenery close to port.",
    image: "/images/alaska/ketchikan-creek-street.jpg",
    imageAlt: "Historic Creek Street wooden boardwalk over water in Ketchikan, Alaska",
    imageCaption: "Historic Creek Street, Ketchikan",
    dockLocations: [
      "Berths 1, 2, 3, 4 (Downtown waterfront, steps to Creek Street)",
      "Ward Cove (7 miles north, complimentary 20-min shuttle required)"
    ],
    tenderStatus: "Tendering is rare; 4 downtown berths and 2 Ward Cove berths handle all traffic.",
    typicalPortHours: "5 to 8 hours (e.g., 6:00 AM - 1:00 PM or 10:00 AM - 6:00 PM)",
    bestFor: ["Misty Fjords", "totem parks", "wildlife", "rainforest"],
    searchTerms: ["Ketchikan shore excursions", "Misty Fjords tours", "Ketchikan wildlife tours"],
    weatherBackup: "Totem parks and cultural experiences make strong backups when flying or boating is weather-sensitive.",
    topActivities: [
      { name: "Misty Fjords Flight & Boat", href: "/ketchikan/misty-fjords-tours" },
      { name: "Floatplane Flightseeing", href: "/ketchikan/flightseeing" },
      { name: "Rainforest & Wildlife", href: "/ketchikan/wildlife-and-rainforest-tours" },
      { name: "Bear Viewing Excursions", href: "/ketchikan/bear-tours" },
      { name: "Totem Poles & Native Art", href: "/ketchikan/totem-and-cultural-tours" }
    ]
  },
  {
    slug: "sitka",
    name: "Sitka",
    region: "Baranof Island",
    hook: "Wildlife, Russian-Alaska history, rainforest, and a less frantic port-day rhythm.",
    image: "/images/alaska/sitka-sound.jpg",
    imageAlt: "Fishing vessels in Crescent Harbor against coastal mountains in Sitka, Alaska",
    imageCaption: "Crescent Harbor & Mountains, Sitka",
    dockLocations: [
      "Sitka Sound Cruise Terminal / Old Sitka Dock (5 miles north, continuous 10-min shuttle)",
      "Crescent Harbor / O'Connell Bridge (Tender pier directly downtown for small ships)"
    ],
    tenderStatus: "Large ships dock at Old Sitka with free shuttles; smaller boutique ships tender downtown.",
    typicalPortHours: "6 to 9 hours (e.g., 8:00 AM - 4:00 PM)",
    bestFor: ["wildlife", "raptor center", "history", "small-group tours"],
    searchTerms: ["Sitka shore excursions", "Sitka wildlife tours", "Sitka Alaska tours"],
    weatherBackup: "Stay close to town with history, culture, or wildlife-center options if marine weather deteriorates.",
    topActivities: [
      { name: "Sea Otters, Raptors & History", href: "/sitka/wildlife-and-historic-tours" }
    ]
  },
  {
    slug: "icy-strait-point",
    name: "Icy Strait Point",
    slugAlt: "hoonah",
    nameAlt: "Hoonah",
    region: "Chichagof Island",
    hook: "Whales, bears, wilderness, and high-impact excursions without a big-city port feel.",
    image: "/images/alaska/icy-strait-point-wilderness.jpg",
    imageAlt: "Historic cannery, excursion dock, and evergreen rainforest shore at Icy Strait Point, Hoonah",
    imageCaption: "Historic Cannery & Waterfront, Icy Strait Point",
    dockLocations: [
      "Wilderness Dock (Connected to Cannery via Transporter Gondola)",
      "Adventure Dock (Direct foot access to Cannery Plaza)"
    ],
    tenderStatus: "Both deep-water berths handle large vessels directly; no tendering required.",
    typicalPortHours: "6 to 10 hours (e.g., 8:00 AM - 5:00 PM or 1:00 PM - 9:00 PM)",
    bestFor: ["whale watching", "bear viewing", "zipline", "wilderness"],
    searchTerms: ["Icy Strait Point shore excursions", "Hoonah whale watching", "Icy Strait Point bear tours"],
    weatherBackup: "Keep a lower-commitment local cannery walk or cultural option available if marine or wildlife conditions shift.",
    topActivities: [
      { name: "Point Adolphus Whales & Bears", href: "/icy-strait-point/whale-and-wilderness-tours" }
    ]
  },
];

export function getPort(slug: string) {
  return PORTS.find((port) => port.slug === slug) ?? null;
}
