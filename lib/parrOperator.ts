export type ParrPickupHub = {
  id: string;
  key: "denver" | "golden";
  city: string;
  shortLabel: string;
  checkoutLabel: string;
  businessName: string;
  address: string;
  pickupText: string;
  mapsUrl: string;
  websiteUrl?: string;
  menuUrl?: string;
};

export const PARR_SUPPORT_PHONE = "7203696292";
export const PARR_SUPPORT_PHONE_DISPLAY = "720-369-6292";
export const PARR_SUPPORT_SMS_URL = `sms:1${PARR_SUPPORT_PHONE}?&body=Hey%20-%20asking%20about%20Party%20at%20Red%20Rocks%20rides.`;
export const PARR_SUPPORT_WHATSAPP_URL = `https://wa.me/1${PARR_SUPPORT_PHONE}?text=Hey%20-%20asking%20about%20Party%20at%20Red%20Rocks%20rides.`;
export const PARR_SUPPORT_EMAIL = "contact@partyatredrocks.com";
export const PARR_SUPPORT_EMAIL_URL = `mailto:${PARR_SUPPORT_EMAIL}`;

export const PARR_PICKUP_HUBS = {
  denver: {
    id: "parr-denver-sheraton-court-place",
    key: "denver",
    city: "Denver",
    shortLabel: "Sheraton: 16th & Court",
    checkoutLabel: "Sheraton Denver Downtown - 16th & Court",
    businessName: "Sheraton Denver Downtown Hotel",
    address: "1550 Court Place, Denver, CO 80202",
    pickupText: "Sheraton Denver Downtown - 16th & Court",
    mapsUrl: "https://maps.google.com/?q=Sheraton+Denver+Downtown+Hotel+1550+Court+Place+Denver+CO+80202",
    websiteUrl: "https://www.marriott.com/en-us/hotels/dends-sheraton-denver-downtown-hotel/overview/",
    menuUrl: undefined,
  },
  golden: {
    id: "parr-golden-trailhead-taphouse",
    key: "golden",
    city: "Golden",
    shortLabel: "Trailhead Taphouse: 12th St",
    checkoutLabel: "Trailhead Taphouse - 12th St, Golden",
    businessName: "Trailhead Taphouse & Kitchen",
    address: "811 12th Street, Golden, CO 80401",
    pickupText: "Trailhead Taphouse - 12th St, Golden",
    mapsUrl: "https://maps.google.com/?q=Trailhead+Taphouse+and+Kitchen+811+12th+Street+Golden+CO+80401",
    websiteUrl: undefined,
    menuUrl: "https://places.singleplatform.com/trailhead-taphouse--kitchen/menu",
  },
} as const satisfies Record<"denver" | "golden", ParrPickupHub>;

export const PARR_PICKUP_HUB_LIST = Object.values(PARR_PICKUP_HUBS);

export const PARR_OPERATOR = {
  id: "partyatredrocks",
  name: "Party at Red Rocks",
  website: "https://www.partyatredrocks.com",
  summary:
    "Party at Red Rocks provides shared shuttle seats and private rides for Red Rocks show nights, with Denver and Golden pickup options plus private vehicles for groups.",
  trustPoints: [
    "Shared Denver and Golden pickup hubs",
    "Private SUV, van, Sprinter, and party bus lineup",
    "Return ride after the show",
  ],
  supportLabel: "Questions about pickup, payment, or your ride?",
  supportDetail: `Questions about pickup, payment, or your ride? Text ${PARR_SUPPORT_PHONE_DISPLAY} or email ${PARR_SUPPORT_EMAIL}.`,
  supportPhone: PARR_SUPPORT_PHONE_DISPLAY,
  supportSmsUrl: PARR_SUPPORT_SMS_URL,
  supportWhatsAppUrl: PARR_SUPPORT_WHATSAPP_URL,
  supportEmail: PARR_SUPPORT_EMAIL,
  supportEmailUrl: PARR_SUPPORT_EMAIL_URL,
  pickupHubs: PARR_PICKUP_HUB_LIST,
} as const;
