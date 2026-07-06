// New Orleans Tours Outpost - Tour Database & Configurations
import { appendViatorAttribution, buildViatorCampaignFromParts } from "@/lib/viator/links";

export const NEW_ORLEANS_TOURS_PATH = "/new-orleans/tours";
export interface ListingNode {
  id: string;
  name: string;
  category: "swamp" | "ghost" | "food" | "history" | "cruise" | "essentials" | "living-here" | "incubator" | "events";
  location: string;
  vibe: string;
  phone: string;
  mapUrl: string;
  menuUrl: string; // Booking or details link
  logistics: Record<string, string>;
  hours: { open: number; close: number }; // 24h format
  verification_status: "unverified" | "contacted" | "verified_active" | "update_received" | "wrong_number" | "do_not_contact";
  price?: string;
  rating?: number;
  reviewsCount?: number;
}

const RAW_DIRECTORY_DATA: ListingNode[] = [
  {
    id: "steamboat-natchez",
    name: "Steamboat Natchez Jazz Cruise",
    category: "cruise",
    location: "Toulouse St. Wharf, French Quarter",
    vibe: "Authentic Steam Paddlewheeler",
    phone: "5045691401",
    mapUrl: "https://maps.google.com/?q=Toulouse+Street+Wharf+New+Orleans",
    menuUrl: "https://www.viator.com/tours/New-Orleans/Steamboat-Natchez-Harbor-Cruise/d675-3780STEAM",
    logistics: {
      "Vibe": "Historic Riverboat & Dixieland Jazz",
      "Boarding": "Toulouse St. Wharf (walkable from Quarter)",
      "Vessel": "Last authentic steam paddlewheeler on Mississippi",
      "Duration": "2 Hours (cruising)",
      "Cancellation": "Free cancellation up to 24h"
    },
    hours: { open: 11, close: 21 },
    verification_status: "verified_active",
    price: "$48.00",
    rating: 4.7,
    reviewsCount: 3412
  },
  {
    id: "airboat-swamp",
    name: "Cajun Pride Covered Swamp Tour",
    category: "swamp",
    location: "LaPlace, LA (optional hotel pickup)",
    vibe: "Shaded Pontoon Bayou Cruise",
    phone: "5044670758",
    mapUrl: "https://maps.google.com/?q=Cajun+Pride+Swamp+Tours",
    menuUrl: "https://www.viator.com/tours/New-Orleans/New-Orleans-Swamp-and-Bayou-Boat-Tour-with-Transportation/d675-3780SWAMP",
    logistics: {
      "Vibe": "Narrated wetlands sightseeing",
      "Boat Type": "Covered Pontoon Boat",
      "Hotel Pickup": "Yes (French Quarter & CBD hotels)",
      "Wildlife": "Alligators, swamp raccoons, egrets",
      "Cancellation": "Free cancellation up to 24h"
    },
    hours: { open: 8, close: 17 },
    verification_status: "verified_active",
    price: "$59.00",
    rating: 4.8,
    reviewsCount: 2980
  },
  {
    id: "airboat-adventure-large",
    name: "Jean Lafitte Airboat Swamp Tour",
    category: "swamp",
    location: "Lafitte, LA (optional hotel pickup)",
    vibe: "High-Speed Open-Air Ride",
    phone: "5046894103",
    mapUrl: "https://maps.google.com/?q=Jean+Lafitte+Swamp+Tours",
    menuUrl: "https://www.viator.com/tours/New-Orleans/New-Orleans-Airboat-Swamp-Tour/d675-5807AIR",
    logistics: {
      "Vibe": "High-speed open-air adventure",
      "Boat Type": "16-30 passenger Airboat",
      "Hotel Pickup": "Yes (French Quarter & CBD hotels)",
      "Wildlife": "Alligators, turtles, bald eagles",
      "Cancellation": "Free cancellation up to 24h"
    },
    hours: { open: 8, close: 17 },
    verification_status: "verified_active",
    price: "$85.00",
    rating: 4.7,
    reviewsCount: 1980
  },
  {
    id: "airboat-adventure-small",
    name: "Small-Group Airboat Swamp Adventure",
    category: "swamp",
    location: "Lafitte, LA (optional hotel pickup)",
    vibe: "Adrenaline-fueled intimate ride",
    phone: "5046894103",
    mapUrl: "https://maps.google.com/?q=Jean+Lafitte+Swamp+Tours",
    menuUrl: "https://www.viator.com/tours/New-Orleans/Small-Group-Airboat-Swamp-Adventure-with-Transportation/d675-3162AIR",
    logistics: {
      "Vibe": "High-speed shallow-water thrill",
      "Boat Type": "6-8 passenger Small Airboat",
      "Hotel Pickup": "Yes (French Quarter & CBD hotels)",
      "Wildlife": "Up-close alligator encounters",
      "Cancellation": "Free cancellation up to 24h"
    },
    hours: { open: 8, close: 17 },
    verification_status: "verified_active",
    price: "$109.00",
    rating: 4.8,
    reviewsCount: 2450
  },
  {
    id: "ghost-cemetery",
    name: "French Quarter Ghost & Voodoo Tour",
    category: "ghost",
    location: "Jackson Square, French Quarter",
    vibe: "Candlelit Walk of Creole Legends",
    phone: "5045812323",
    mapUrl: "https://maps.google.com/?q=Jackson+Square+New+Orleans",
    menuUrl: "https://www.viator.com/tours/New-Orleans/New-Orleans-Ghosts-and-Spirits-Walking-Tour/d675-3316GHOST",
    logistics: {
      "Vibe": "Spooky & Historical nighttime walk",
      "Duration": "2 Hours (walking)",
      "Stops": "St. Louis Cemetery and haunted gates",
      "Content Fit": "All ages (PG-13 rated stories)",
      "Cancellation": "Free cancellation up to 24h"
    },
    hours: { open: 18, close: 22 },
    verification_status: "verified_active",
    price: "$29.00",
    rating: 4.6,
    reviewsCount: 1845
  },
  {
    id: "food-cocktail",
    name: "Creole Food & Cocktail Walk",
    category: "food",
    location: "Royal St, French Quarter",
    vibe: "Tasting NOLA History Block-by-Block",
    phone: "5045680100",
    mapUrl: "https://maps.google.com/?q=French+Quarter+New+Orleans",
    menuUrl: "https://www.viator.com/tours/New-Orleans/French-Quarter-Food-Tour/d675-5674FQFOOD",
    logistics: {
      "Vibe": "Culinary & Social walking tour",
      "Included": "5 food tastings & 3 historic cocktails",
      "Walking": "1.5 miles (leisurely pace)",
      "Dietary Support": "Vegetarian options supported",
      "Cancellation": "Free cancellation up to 24h"
    },
    hours: { open: 11, close: 15 },
    verification_status: "verified_active",
    price: "$89.00",
    rating: 4.9,
    reviewsCount: 1204
  },
  {
    id: "free-tours-foot",
    name: "Free Tours by Foot FQ Tour",
    category: "history",
    location: "St. Peter & Chartres St, French Quarter",
    vibe: "Pay-What-You-Wish FQ Layout",
    phone: "5042220101",
    mapUrl: "https://maps.google.com/?q=St+Peter+and+Chartres+St+New+Orleans",
    menuUrl: "https://freetoursbyfoot.com/french-quarter-walking-tours/",
    logistics: {
      "Vibe": "Casual, educational architectural walk",
      "Cost": "Pay-what-you-wish tipping basis",
      "Meeting Point": "Outside St. Louis Cathedral gates",
      "Duration": "2 Hours",
      "Cancellation": "No-fee reservations"
    },
    hours: { open: 9, close: 17 },
    verification_status: "verified_active",
    price: "Tips",
    rating: 4.9,
    reviewsCount: 4233
  },
  {
    id: "preservation-hall",
    name: "Preservation Hall Jazz Concerts",
    category: "events",
    location: "726 St Peter St, French Quarter",
    vibe: "Raw Acoustic Jazz Sanctuary",
    phone: "5045222234",
    mapUrl: "https://maps.google.com/?q=Preservation+Hall+New+Orleans",
    menuUrl: "https://www.preservationhall.com",
    logistics: {
      "Vibe": "Historic, intimate listening room",
      "Shows": "Daily at 5:00 PM, 6:15 PM, 7:30 PM, 8:45 PM",
      "Age Limit": "All ages welcome",
      "Rules": "Strictly no phones or flash photography allowed"
    },
    hours: { open: 17, close: 22 },
    verification_status: "verified_active"
  },
  {
    id: "tulane-er",
    name: "Tulane Medical Center Emergency Room",
    category: "essentials",
    location: "1415 Tulane Ave, New Orleans",
    vibe: "24/7 Emergency Medical Support",
    phone: "5049885263",
    mapUrl: "https://maps.google.com/?q=Tulane+Medical+Center+New+Orleans",
    menuUrl: "tel:5049885263",
    logistics: {
      "ER Open": "24 Hours / 365 Days",
      "Transit": "10-minute rideshare from French Quarter",
      "Services": "Full emergency medical, trauma care, pharmacy sync"
    },
    hours: { open: 0, close: 24 },
    verification_status: "verified_active"
  },
  {
    id: "walgreens-fq",
    name: "Walgreens FQ Pharmacy",
    category: "essentials",
    location: "900 Canal St, French Quarter",
    vibe: "FQ Provisions & Pharmacy",
    phone: "5045689511",
    mapUrl: "https://maps.google.com/?q=Walgreens+Canal+St+New+Orleans",
    menuUrl: "https://www.walgreens.com",
    logistics: {
      "Store Hours": "8:00 AM - 10:00 PM (Daily)",
      "Pharmacy": "On-site prescriptions & OTC relief",
      "Convenience": "Water, snacks, basic toiletries"
    },
    hours: { open: 8, close: 22 },
    verification_status: "verified_active"
  },
  {
    id: "safety-zones-guide",
    name: "Block-by-Block Safety Dispatch",
    category: "living-here",
    location: "French Quarter Grid",
    vibe: "NOLA Safety Protocols",
    phone: "5045559111",
    mapUrl: "https://maps.google.com/?q=French+Quarter+New+Orleans",
    menuUrl: "https://www.google.com",
    logistics: {
      "Rule 1": "Stick to lit paths (Decatur, Canal St)",
      "Rule 2": "Avoid N. Rampart St at night alone",
      "Rule 3": "Don't wander down dark residential side streets late"
    },
    hours: { open: 0, close: 24 },
    verification_status: "verified_active"
  },
  {
    id: "scam-guide",
    name: "Orleans Scam Cheat Sheet",
    category: "living-here",
    location: "Bourbon / Decatur St",
    vibe: "Dodge the Hustlers Like a Local",
    phone: "5045559222",
    mapUrl: "https://maps.google.com/?q=Jackson+Square+New+Orleans",
    menuUrl: "https://www.google.com",
    logistics: {
      "Shoe Hustle": "Bet twenty they spell where you got shoes. Answer: 'On my feet in Louisiana!'",
      "CD Hustler": "Never let anyone hand you a CD. Keep hands in pockets.",
      "Vibe Check": "A polite 'No thanks, I'm good' with a continuous walk works best."
    },
    hours: { open: 0, close: 24 },
    verification_status: "verified_active"
  },
  {
    id: "jazz-foundation",
    name: "NOLA Jazz & Heritage Foundation",
    category: "incubator",
    location: "1205 N Rampart St, New Orleans",
    vibe: "Cultural Incubator & Musicians Support",
    phone: "5045586100",
    mapUrl: "https://maps.google.com/?q=New+Orleans+Jazz+and+Heritage+Foundation",
    menuUrl: "https://www.jazzandheritage.org",
    logistics: {
      "Mission": "Community development, arts grants, music training",
      "Support": "Donate directly to support local NOLA musicians",
      "Events": "Sponsors of local community free festivals"
    },
    hours: { open: 9, close: 17 },
    verification_status: "verified_active"
  }
];

export const DIRECTORY_DATA: ListingNode[] = RAW_DIRECTORY_DATA.map(item => {
  if (item.menuUrl && item.menuUrl.includes("viator.com")) {
    return {
      ...item,
      menuUrl: appendViatorAttribution(item.menuUrl, {
        campaign: buildViatorCampaignFromParts(["welcome-to-new-orleans-tours", item.id])
      })
    };
  }
  return item;
});

export const CATEGORIES = [
  { id: "all", label: "All Tours", icon: "🌐" },
  { id: "swamp", label: "Swamps & Airboats", icon: "🐊" },
  { id: "ghost", label: "Ghosts & Voodoo", icon: "👻" },
  { id: "food", label: "Food & Cocktails", icon: "🍹" },
  { id: "history", label: "Historic Walks", icon: "⛪" },
  { id: "cruise", label: "Mississippi Cruises", icon: "🚢" },
  { id: "essentials", label: "Essentials", icon: "💊" },
  { id: "events", label: "Live Events", icon: "🎺" },
  { id: "living-here", label: "Local Guides", icon: "⚜️" },
  { id: "incubator", label: "Community Support", icon: "💡" }
];

export const METADATA = {
  title: "Welcome To New Orleans Tours | Swamp, French Quarter, Food & Riverboat Tours",
  description: "Compare and book New Orleans swamp tours, airboat runs, French Quarter history walks, food crawls, ghost stories, and riverboat cruises.",
  keywords: ["new orleans tours", "swamp tour hotel pickup", "french quarter ghost tour", "creole food tasting", "steamboat natchez"]
};
