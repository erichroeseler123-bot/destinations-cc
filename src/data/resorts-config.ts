export interface OptionComparison {
  label: string;
  tradeoff: string;
}

export interface ResortConfig {
  slug: string;
  name: string;
  location: string;
  eyebrow: string;
  title: string;
  description: string;
  problemStatement: string;
  solutionHighlight: string;
  checkoutLink10: string;
  checkoutLink20: string;
  comparisons: OptionComparison[];
  fitPoints: string[];
}

export const RESORTS_CONFIG: Record<string, ResortConfig> = {
  "kalahari-resort-dells": {
    slug: "kalahari-resort-dells",
    name: "Kalahari Resort (Wisconsin Dells)",
    location: "Wisconsin Dells, WI",
    eyebrow: "RESORT OS // KALAHARI DECK",
    title: "Operational Relief: Kalahari Large-Group Dining",
    description: "Captive group coordination infrastructure disguised as food. Zero logistics friction for large families, tournament groups, and reunions in Kalahari villas.",
    problemStatement: "Wisconsin Dells large-group dining is an operational failure mode. Coordinating restaurant reservations, complex transportation logistics, and individual dietary preferences for 10-20 people within captive resort areas creates massive coordinate overhead.",
    solutionHighlight: "Bypass the coordinator role. Deploy Feastly Spread infrastructure straight to your Kalahari suite or villa. Handled abundance, zero-scroll command.",
    checkoutLink10: "https://checkout.square.site/merchant/MLK2H2WJG4S6R/checkout/KALAHARI_10_DELLS",
    checkoutLink20: "https://checkout.square.site/merchant/MLK2H2WJG4S6R/checkout/KALAHARI_20_DELLS",
    comparisons: [
      {
        label: "Traditional Dinner Out",
        tradeoff: "Requires booking tables weeks in advance, organizing transport for 10-20 people, splitting bills, and waiting in crowded lobbies."
      },
      {
        label: "Standard Delivery",
        tradeoff: "Lukewarm containers, complex order gathering, wrong item drops, and the host is stuck with the cleanup."
      },
      {
        label: "Resort OS Spread",
        tradeoff: "Pure dining infrastructure. Staged directly inside your villa, self-governing hot station, zero logistics, full cleanup included."
      }
    ],
    fitPoints: [
      "Villa/Cabin hot-staging setup included",
      "High-capacity deployment (handles 10 to 20 operators)",
      "Zero catering menus or ordering complexity to manage",
      "All essential flatware, napkins, and clean-up built into the route fee",
      "Dietary compatibility checks resolved automatically pre-dispatch"
    ]
  },
  "wilderness-resort-dells": {
    slug: "wilderness-resort-dells",
    name: "Wilderness Resort (Wisconsin Dells)",
    location: "Wisconsin Dells, WI",
    eyebrow: "RESORT OS // WILDERNESS DECK",
    title: "Operational Relief: Wilderness Large-Group Dining",
    description: "Captive group coordination infrastructure disguised as food. Zero logistics friction for large families and tournament groups at Wilderness cabins and villas.",
    problemStatement: "Wilderness Resort's massive footprint makes moving 10-20 people off-property for dinner a significant bottleneck. Rideshare availability is low, and restaurant wait times are high.",
    solutionHighlight: "Bypass the dinner coordinator role. Deploy Feastly Spread infrastructure straight to your Wilderness cabin or villa. Handled abundance, zero-scroll command.",
    checkoutLink10: "https://checkout.square.site/merchant/MLK2H2WJG4S6R/checkout/WILDERNESS_10_DELLS",
    checkoutLink20: "https://checkout.square.site/merchant/MLK2H2WJG4S6R/checkout/WILDERNESS_20_DELLS",
    comparisons: [
      {
        label: "Traditional Dinner Out",
        tradeoff: "Requires booking tables weeks in advance, organizing transport for 10-20 people, splitting bills, and waiting in crowded lobbies."
      },
      {
        label: "Standard Delivery",
        tradeoff: "Lukewarm containers, complex order gathering, wrong item drops, and the host is stuck with the cleanup."
      },
      {
        label: "Resort OS Spread",
        tradeoff: "Pure dining infrastructure. Staged directly inside your villa, self-governing hot station, zero logistics, full cleanup included."
      }
    ],
    fitPoints: [
      "Villa/Cabin hot-staging setup included",
      "High-capacity deployment (handles 10 to 20 operators)",
      "Zero catering menus or ordering complexity to manage",
      "All essential flatware, napkins, and clean-up built into the route fee",
      "Dietary compatibility checks resolved automatically pre-dispatch"
    ]
  },
  "chula-vista-resort-dells": {
    slug: "chula-vista-resort-dells",
    name: "Chula Vista Resort (Wisconsin Dells)",
    location: "Wisconsin Dells, WI",
    eyebrow: "RESORT OS // CHULA VISTA DECK",
    title: "Operational Relief: Chula Vista Large-Group Dining",
    description: "Captive group coordination infrastructure disguised as food. Zero logistics friction for large families and tournament groups at Chula Vista villas.",
    problemStatement: "Chula Vista's north Dells location isolates large groups from off-property dining. Coordinating transport and seating for 10-20 people creates unnecessary operational friction.",
    solutionHighlight: "Bypass the dinner coordinator role. Deploy Feastly Spread infrastructure straight to your Chula Vista suite or villa. Handled abundance, zero-scroll command.",
    checkoutLink10: "https://checkout.square.site/merchant/MLK2H2WJG4S6R/checkout/CHULAVISTA_10_DELLS",
    checkoutLink20: "https://checkout.square.site/merchant/MLK2H2WJG4S6R/checkout/CHULAVISTA_20_DELLS",
    comparisons: [
      {
        label: "Traditional Dinner Out",
        tradeoff: "Requires booking tables weeks in advance, organizing transport for 10-20 people, splitting bills, and waiting in crowded lobbies."
      },
      {
        label: "Standard Delivery",
        tradeoff: "Lukewarm containers, complex order gathering, wrong item drops, and the host is stuck with the cleanup."
      },
      {
        label: "Resort OS Spread",
        tradeoff: "Pure dining infrastructure. Staged directly inside your villa, self-governing hot station, zero logistics, full cleanup included."
      }
    ],
    fitPoints: [
      "Villa/Cabin hot-staging setup included",
      "High-capacity deployment (handles 10 to 20 operators)",
      "Zero catering menus or ordering complexity to manage",
      "All essential flatware, napkins, and clean-up built into the route fee",
      "Dietary compatibility checks resolved automatically pre-dispatch"
    ]
  },
  "grand-geneva-resort": {
    slug: "grand-geneva-resort",
    name: "Grand Geneva Resort (Lake Geneva)",
    location: "Lake Geneva, WI",
    eyebrow: "RESORT OS // GRAND GENEVA DECK",
    title: "Operational Relief: Grand Geneva Large-Group Dining",
    description: "Captive group coordination infrastructure disguised as food. Zero logistics friction for large families and tournament groups at Grand Geneva villas.",
    problemStatement: "Coordinating dinners for 10-20 guests at Grand Geneva Resort requires matching everyone's schedules, booking far in advance, and coordinating off-property transportation.",
    solutionHighlight: "Bypass the dinner coordinator role. Deploy Feastly Spread infrastructure straight to your Grand Geneva villa. Handled abundance, zero-scroll command.",
    checkoutLink10: "https://checkout.square.site/merchant/MLK2H2WJG4S6R/checkout/GRANDGENEVA_10",
    checkoutLink20: "https://checkout.square.site/merchant/MLK2H2WJG4S6R/checkout/GRANDGENEVA_20",
    comparisons: [
      {
        label: "Traditional Dinner Out",
        tradeoff: "Requires booking tables weeks in advance, organizing transport for 10-20 people, splitting bills, and waiting in crowded lobbies."
      },
      {
        label: "Standard Delivery",
        tradeoff: "Lukewarm containers, complex order gathering, wrong item drops, and the host is stuck with the cleanup."
      },
      {
        label: "Resort OS Spread",
        tradeoff: "Pure dining infrastructure. Staged directly inside your villa, self-governing hot station, zero logistics, full cleanup included."
      }
    ],
    fitPoints: [
      "Villa/Cabin hot-staging setup included",
      "High-capacity deployment (handles 10 to 20 operators)",
      "Zero catering menus or ordering complexity to manage",
      "All essential flatware, napkins, and clean-up built into the route fee",
      "Dietary compatibility checks resolved automatically pre-dispatch"
    ]
  }
};

export function getResortConfig(slug: string): ResortConfig | null {
  const normalized = (slug || "").toLowerCase().trim();
  return RESORTS_CONFIG[normalized] || null;
}

export function listResortConfigs(): ResortConfig[] {
  return Object.values(RESORTS_CONFIG);
}
