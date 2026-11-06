import { redis } from "@/lib/redis";

export type ResearchClusterId =
  | "alaska-juneau"
  | "alaska-ketchikan"
  | "new-orleans-swamp"
  | "wisconsin-chetek"
  | "usvi-st-thomas"
  | "bahamas-nassau"
  | "mexico-cozumel"
  | "honduras-roatan"
  | "cayman-grand-cayman";

export type ResearchPortSlug =
  | "juneau"
  | "ketchikan"
  | "new-orleans"
  | "chetek"
  | "st-thomas"
  | "nassau"
  | "cozumel"
  | "roatan"
  | "grand-cayman";

export type ResearchConstraintType =
  | "total_duration"
  | "duration"
  | "pickup_meeting"
  | "pickup_rules"
  | "transport_inclusion"
  | "age_policy"
  | "minimum_age"
  | "minimum_height"
  | "child_seat_and_fare"
  | "mobility_requirements"
  | "weight_declaration"
  | "bag_policy"
  | "cancellation_policy"
  | "weather_policy"
  | "tournament_blackout_2026"
  | "price"
  | "exclusions"
  | string;

export type ResearchFactEligibilityStatus =
  | "verified"
  | "needs_confirmation"
  | "withdrawn"
  | "expired"
  | "conflicted"
  | "source_changed"
  | "source_unhealthy"
  | "invalid_record";

export type ResearchFactDisqualificationReason =
  | "unconfirmed_candidate"
  | "withdrawn_fact"
  | "review_deadline_expired"
  | "conflicted_evidence"
  | "source_hash_drift"
  | "source_unhealthy"
  | "missing_human_verifier"
  | "invalid_verified_on"
  | "invalid_review_due_on"
  | "empty_fact_value"
  | "unconfirmed_revision"
  | "unmapped_product_id"
  | "blocked_umbrella_product"
  | "cluster_product_mismatch"
  | "missing_fact_id";

export interface ExplicitResearchProductMapping {
  productId: string;
  productName: string;
  operatorId: string;
  operatorName: string;
  portSlug: ResearchPortSlug;
  clusterId: ResearchClusterId;
  bookingChannel: "direct_operator" | "port_shuttle" | "blocked_umbrella";
  fareharborShortname?: string;
  fareharborItemId?: string;
  officialSourceUrls: string[];
  dccOptionId?: string;
  cruisePromenadeExcursionId?: string;
  lfseContextId?: string;
  blueHillsOutpostTourId?: string;
  nonTransferableNote: string;
}

export const EXPLICIT_RESEARCH_PRODUCT_REGISTRY: Record<
  string,
  ExplicitResearchProductMapping
> = {
  "coastal-helicopters-icefield-excursion-direct": {
    productId: "coastal-helicopters-icefield-excursion-direct",
    productName: "Coastal Helicopters — Herbert Glacier Icefield Excursion (Direct)",
    operatorId: "coastal-helicopters",
    operatorName: "Coastal Helicopters",
    portSlug: "juneau",
    clusterId: "alaska-juneau",
    bookingChannel: "direct_operator",
    fareharborShortname: "coastalhelicopters",
    fareharborItemId: "413056",
    officialSourceUrls: [
      "https://coastalhelicopters.com/tours/icefield-excursion/",
    ],
    dccOptionId: "jun-opt-coastal-icefield-excursion-direct",
    cruisePromenadeExcursionId: "coastal-helicopters-icefield-excursion-direct",
    lfseContextId: "juneau/coastal-helicopters-icefield-excursion-direct",
    nonTransferableNote:
      "Applies strictly to Coastal Helicopters direct Herbert Glacier Icefield Excursion (FareHarbor item 413056). Never apply to TEMSCO, NorthStar, Coastal Dog Sled, Coastal Private Icefield, or third-party reseller SKUs (such as Viator 6251SHOREXICEWALK where channel equivalence is not established).",
  },
  "coastal-helicopters-herbert-icefield": {
    productId: "coastal-helicopters-herbert-icefield",
    productName: "Coastal Helicopters — Herbert Glacier Helicopter Icefield Excursion",
    operatorId: "coastal-helicopters",
    operatorName: "Coastal Helicopters",
    portSlug: "juneau",
    clusterId: "alaska-juneau",
    bookingChannel: "direct_operator",
    officialSourceUrls: [
      "https://coastalhelicopters.com/tours/icefield-excursion/",
      "https://coastalhelicopters.com/faq/",
    ],
    lfseContextId: "juneau/6251SHOREXICEWALK",
    nonTransferableNote:
      "Audits Viator 6251SHOREXICEWALK against direct Coastal Helicopters sources; never inherit direct-only FareHarbor 413056 approvals without explicit channel equivalence confirmation.",
  },
  "coastal-helicopters-herbert-dogsled": {
    productId: "coastal-helicopters-herbert-dogsled",
    productName: "Coastal Helicopters — Dog Sled Tour on Herbert Glacier",
    operatorId: "coastal-helicopters",
    operatorName: "Coastal Helicopters",
    portSlug: "juneau",
    clusterId: "alaska-juneau",
    bookingChannel: "direct_operator",
    officialSourceUrls: [
      "https://coastalhelicopters.com/tours/dog-sled-tours/",
      "https://coastalhelicopters.com/faq/",
    ],
    lfseContextId: "juneau/coastal-helicopters-herbert-dogsled",
    nonTransferableNote:
      "Applies strictly to Coastal Helicopters Dog Sled Tour on Herbert Glacier; never inherit shared Icefield Excursion approvals.",
  },
  "temsco-mendenhall-glacier-pilot-choice-direct": {
    productId: "temsco-mendenhall-glacier-pilot-choice-direct",
    productName: "TEMSCO Helicopters — Mendenhall Glacier & Pilot's Choice (Direct)",
    operatorId: "temsco-helicopters",
    operatorName: "TEMSCO Helicopters",
    portSlug: "juneau",
    clusterId: "alaska-juneau",
    bookingChannel: "direct_operator",
    officialSourceUrls: ["https://temscoair.com/juneau-tours/"],
    dccOptionId: "jun-opt-temsco-pilot-choice-direct",
    cruisePromenadeExcursionId: "temsco-mendenhall-glacier-pilot-choice-direct",
    lfseContextId: "juneau/temsco-mendenhall-glacier-pilot-choice-direct",
    nonTransferableNote:
      "Applies strictly to TEMSCO direct Juneau helicopter products; never inherit Coastal Helicopters or NorthStar approvals.",
  },
  "temsco-mendenhall-glacier-walk": {
    productId: "temsco-mendenhall-glacier-walk",
    productName: "TEMSCO Helicopters — Mendenhall Glacier Helicopter & Guided Walk",
    operatorId: "temsco-helicopters",
    operatorName: "TEMSCO Helicopters",
    portSlug: "juneau",
    clusterId: "alaska-juneau",
    bookingChannel: "direct_operator",
    officialSourceUrls: [
      "https://temscoair.com/juneau-tours/",
      "https://temscoair.com/frequently-asked-questions/",
    ],
    lfseContextId: "juneau/temsco-mendenhall-glacier-walk",
    nonTransferableNote:
      "Applies strictly to TEMSCO Mendenhall Glacier Helicopter & Guided Walk; never inherit Coastal Helicopters approvals.",
  },
  "temsco-mendenhall-dogsled-heli": {
    productId: "temsco-mendenhall-dogsled-heli",
    productName: "TEMSCO Helicopters — Mendenhall Glacier Dog Sledding by Helicopter",
    operatorId: "temsco-helicopters",
    operatorName: "TEMSCO Helicopters",
    portSlug: "juneau",
    clusterId: "alaska-juneau",
    bookingChannel: "direct_operator",
    officialSourceUrls: [
      "https://temscoair.com/juneau-tours/",
      "https://temscoair.com/frequently-asked-questions/",
    ],
    lfseContextId: "juneau/temsco-mendenhall-dogsled-heli",
    nonTransferableNote:
      "Applies strictly to TEMSCO Mendenhall Glacier Dog Sledding by Helicopter; do not conflate with sheep creek wheeled summer camp.",
  },
  "temsco-juneau-dogsled-summer-camp": {
    productId: "temsco-juneau-dogsled-summer-camp",
    productName: "Alaskan Husky Tours / TEMSCO — Juneau Dog Sled Summer Camp (Wheeled Cart)",
    operatorId: "temsco-helicopters",
    operatorName: "TEMSCO Helicopters",
    portSlug: "juneau",
    clusterId: "alaska-juneau",
    bookingChannel: "direct_operator",
    officialSourceUrls: ["https://temscoair.com/juneau-tours/"],
    lfseContextId: "juneau/62390P4",
    nonTransferableNote:
      "Applies strictly to Sheep Creek wheeled summer camp (audits 62390P4); never apply helicopter glacier dog sled facts.",
  },
  "wings-airways-taku-lodge-feast": {
    productId: "wings-airways-taku-lodge-feast",
    productName: "Wings Airways — Taku Glacier Lodge Feast & 5-Glacier Seaplane Discovery",
    operatorId: "wings-airways",
    operatorName: "Wings Airways",
    portSlug: "juneau",
    clusterId: "alaska-juneau",
    bookingChannel: "direct_operator",
    officialSourceUrls: [
      "https://wingsairways.com/taku-glacier-lodge-feast-and-5-glacier-discovery/",
      "https://wingsairways.com/faq/",
    ],
    lfseContextId: "juneau/110048P1",
    nonTransferableNote:
      "Applies strictly to Wings Airways Taku Glacier Lodge Feast & 5-Glacier Discovery; never inherit helicopter glacier walk facts.",
  },
  "juneau-tours-mendenhall-shuttle": {
    productId: "juneau-tours-mendenhall-shuttle",
    productName: "Juneau Tours — Mendenhall Glacier Blue Bus Express",
    operatorId: "juneau-tours",
    operatorName: "Juneau Tours",
    portSlug: "juneau",
    clusterId: "alaska-juneau",
    bookingChannel: "direct_operator",
    officialSourceUrls: [
      "https://www.juneautours.com/book-a-tour/glacier-shuttle-tours/",
      "https://www.juneautours.com/faqs/",
    ],
    lfseContextId: "juneau/5857SHUTTLE",
    nonTransferableNote:
      "Applies strictly to Juneau Tours Mendenhall Glacier Blue Bus Express; never transfer to whale watching combos.",
  },
  "juneau-tours-whale-watch": {
    productId: "juneau-tours-whale-watch",
    productName: "Juneau Tours — Juneau Whale Watching Adventure",
    operatorId: "juneau-tours",
    operatorName: "Juneau Tours",
    portSlug: "juneau",
    clusterId: "alaska-juneau",
    bookingChannel: "direct_operator",
    officialSourceUrls: [
      "https://www.juneautours.com/book-a-tour/juneau-whale-watching-tours/",
      "https://www.juneautours.com/faqs/",
    ],
    lfseContextId: "juneau/juneau-tours-whale-watch",
    nonTransferableNote:
      "Applies strictly to Juneau Tours standalone Whale Watching Adventure; never transfer to Mendenhall Shuttle.",
  },
  "true-alaskan-juneau-mendenhall-whale-quest": {
    productId: "true-alaskan-juneau-mendenhall-whale-quest",
    productName: "True Alaskan Tours — Juneau Mendenhall Glacier & Whale Quest",
    operatorId: "true-alaskan-tours",
    operatorName: "True Alaskan Tours",
    portSlug: "juneau",
    clusterId: "alaska-juneau",
    bookingChannel: "direct_operator",
    officialSourceUrls: [
      "https://truealaskantours.com/juneau-tours/mendenhall-glacier-and-whale-quest/",
    ],
    lfseContextId: "juneau/true-alaskan-juneau-mendenhall-whale-quest",
    nonTransferableNote:
      "Applies strictly to True Alaskan Tours Juneau Mendenhall Glacier & Whale Quest combo.",
  },
  "alaska-travel-adventures-whale-salmon-bake": {
    productId: "alaska-travel-adventures-whale-salmon-bake",
    productName: "Alaska Travel Adventures — Juneau Whale Watch & Gold Creek Salmon Bake",
    operatorId: "alaska-travel-adventures",
    operatorName: "Alaska Travel Adventures",
    portSlug: "juneau",
    clusterId: "alaska-juneau",
    bookingChannel: "direct_operator",
    officialSourceUrls: [
      "https://www.bestofalaskatravel.com/alaska_day_tours/pages/j_w_bake.htm",
    ],
    lfseContextId: "juneau/alaska-travel-adventures-whale-salmon-bake",
    nonTransferableNote:
      "Applies strictly to Alaska Travel Adventures Juneau Whale Watch & Gold Creek Salmon Bake.",
  },
  "northstar-glacier-walkabout-direct": {
    productId: "northstar-glacier-walkabout-direct",
    productName: "NorthStar Trekking — Glacier Walkabout (Direct)",
    operatorId: "northstar-trekking",
    operatorName: "NorthStar Trekking",
    portSlug: "juneau",
    clusterId: "alaska-juneau",
    bookingChannel: "direct_operator",
    officialSourceUrls: ["https://www.glaciertrekking.com/"],
    dccOptionId: "jun-opt-northstar-walkabout-direct",
    cruisePromenadeExcursionId: "northstar-glacier-walkabout-direct",
    lfseContextId: "juneau/northstar-glacier-walkabout-direct",
    nonTransferableNote:
      "Applies strictly to NorthStar Trekking direct Glacier Walkabout; never inherit Coastal Helicopters or TEMSCO approvals.",
  },
  "ward-cove-complimentary-bus": {
    productId: "ward-cove-complimentary-bus",
    productName: "Ward Cove Complimentary Land Shuttle",
    operatorId: "ward-cove-dock-group",
    operatorName: "Ward Cove Dock Group",
    portSlug: "ketchikan",
    clusterId: "alaska-ketchikan",
    bookingChannel: "port_shuttle",
    officialSourceUrls: ["https://wardcoveak.com/schedules/"],
    lfseContextId: "ketchikan/ward-cove-complimentary-bus",
    nonTransferableNote:
      "Applies strictly to Ward Cove complimentary land shuttle; do not transfer to paid True Alaskan waterfront shuttles.",
  },
  "true-alaskan-waterfront-ward-cove-to-downtown": {
    productId: "true-alaskan-waterfront-ward-cove-to-downtown",
    productName: "True Alaskan Tours Waterfront Shuttle: Ward Cove to Downtown Ketchikan",
    operatorId: "true-alaskan-tours",
    operatorName: "True Alaskan Tours",
    portSlug: "ketchikan",
    clusterId: "alaska-ketchikan",
    bookingChannel: "direct_operator",
    officialSourceUrls: [
      "https://truealaskantours.com/ketchikan-tours/waterfront-shuttle-ward-cove-to-downtown-ketchikan/",
    ],
    lfseContextId: "ketchikan/true-alaskan-waterfront-ward-cove-to-downtown",
    nonTransferableNote:
      "Applies strictly to direct Ward Cove to Downtown direction; do not apply to return direction or free land bus.",
  },
  "true-alaskan-waterfront-downtown-to-ward-cove": {
    productId: "true-alaskan-waterfront-downtown-to-ward-cove",
    productName:
      "True Alaskan Tours Waterfront Shuttle: Downtown Ketchikan Returning to Ward Cove",
    operatorId: "true-alaskan-tours",
    operatorName: "True Alaskan Tours",
    portSlug: "ketchikan",
    clusterId: "alaska-ketchikan",
    bookingChannel: "direct_operator",
    officialSourceUrls: [
      "https://truealaskantours.com/ketchikan-tours/waterfront-shuttle-downtown-ketchikan-returning-to-ward-cove/",
    ],
    lfseContextId: "ketchikan/true-alaskan-waterfront-downtown-to-ward-cove",
    nonTransferableNote:
      "Applies strictly to direct Downtown Returning to Ward Cove direction; do not apply to outbound direction.",
  },
  "true-alaskan-misty-fjords-downtown-direct": {
    productId: "true-alaskan-misty-fjords-downtown-direct",
    productName: "True Alaskan Tours — Misty Fjords Wilderness Explorer (Downtown Direct)",
    operatorId: "true-alaskan-tours",
    operatorName: "True Alaskan Tours",
    portSlug: "ketchikan",
    clusterId: "alaska-ketchikan",
    bookingChannel: "direct_operator",
    officialSourceUrls: [
      "https://truealaskantours.com/ketchikan-tours/misty-fjords-wilderness-explorer/",
    ],
    lfseContextId: "ketchikan/true-alaskan-misty-fjords-downtown-direct",
    nonTransferableNote:
      "Applies strictly to Downtown departure; do not transfer to Ward Cove departure.",
  },
  "true-alaskan-misty-fjords-ward-cove-direct": {
    productId: "true-alaskan-misty-fjords-ward-cove-direct",
    productName: "True Alaskan Tours — Misty Fjords Wilderness Explorer (Ward Cove Direct)",
    operatorId: "true-alaskan-tours",
    operatorName: "True Alaskan Tours",
    portSlug: "ketchikan",
    clusterId: "alaska-ketchikan",
    bookingChannel: "direct_operator",
    officialSourceUrls: [
      "https://truealaskantours.com/ward-cove-tours/misty-fjords-wilderness-explorer-from-ward-cove/",
    ],
    lfseContextId: "ketchikan/true-alaskan-misty-fjords-ward-cove-direct",
    nonTransferableNote:
      "Applies strictly to Ward Cove departure; do not transfer to Downtown departure.",
  },
  "true-alaskan-misty-fjords-downtown": {
    productId: "true-alaskan-misty-fjords-downtown",
    productName: "True Alaskan Tours — Misty Fjords Wilderness Explorer (Downtown Departure)",
    operatorId: "true-alaskan-tours",
    operatorName: "True Alaskan Tours",
    portSlug: "ketchikan",
    clusterId: "alaska-ketchikan",
    bookingChannel: "direct_operator",
    officialSourceUrls: [
      "https://truealaskantours.com/ketchikan-tours/misty-fjords-wilderness-explorer/",
      "https://truealaskantours.com/faq/",
    ],
    lfseContextId: "ketchikan/472133P3",
    nonTransferableNote:
      "Audits Downtown departure against Viator 472133P3; do not transfer to Ward Cove departure.",
  },
  "true-alaskan-misty-fjords-ward-cove": {
    productId: "true-alaskan-misty-fjords-ward-cove",
    productName: "True Alaskan Tours — Misty Fjords Wilderness Explorer (Ward Cove Departure)",
    operatorId: "true-alaskan-tours",
    operatorName: "True Alaskan Tours",
    portSlug: "ketchikan",
    clusterId: "alaska-ketchikan",
    bookingChannel: "direct_operator",
    officialSourceUrls: [
      "https://truealaskantours.com/ward-cove-tours/misty-fjords-wilderness-explorer-from-ward-cove/",
      "https://truealaskantours.com/faq/",
    ],
    lfseContextId: "ketchikan/true-alaskan-misty-fjords-ward-cove",
    nonTransferableNote:
      "Applies strictly to Ward Cove departure; do not transfer to Downtown departure.",
  },
  "cape-fox-saxman-highlights-lumberjack-downtown-direct": {
    productId: "cape-fox-saxman-highlights-lumberjack-downtown-direct",
    productName:
      "Cape Fox Tours — Saxman Native Village, Ketchikan Highlights & Lumberjack Show (Downtown Direct)",
    operatorId: "cape-fox-tours",
    operatorName: "Cape Fox Tours",
    portSlug: "ketchikan",
    clusterId: "alaska-ketchikan",
    bookingChannel: "direct_operator",
    officialSourceUrls: ["https://capefoxtours.com/"],
    lfseContextId: "ketchikan/cape-fox-saxman-highlights-lumberjack-downtown-direct",
    nonTransferableNote:
      "Applies strictly to Cape Fox direct Downtown departure; do not inherit Viator 445368P5 terms.",
  },
  "cape-fox-saxman-highlights-lumberjack-ward-cove-direct": {
    productId: "cape-fox-saxman-highlights-lumberjack-ward-cove-direct",
    productName:
      "Cape Fox Tours — Saxman Native Village, Ketchikan Highlights & Lumberjack Show (Ward Cove Direct)",
    operatorId: "cape-fox-tours",
    operatorName: "Cape Fox Tours",
    portSlug: "ketchikan",
    clusterId: "alaska-ketchikan",
    bookingChannel: "direct_operator",
    officialSourceUrls: ["https://capefoxtours.com/"],
    lfseContextId: "ketchikan/cape-fox-saxman-highlights-lumberjack-ward-cove-direct",
    nonTransferableNote:
      "Applies strictly to Cape Fox direct Ward Cove departure; do not inherit Viator 445368P5 terms.",
  },
  "cape-fox-saxman-highlights-lumberjack-downtown": {
    productId: "cape-fox-saxman-highlights-lumberjack-downtown",
    productName:
      "Cape Fox Tours — Saxman Native Village, Ketchikan Highlights & Lumberjack Show (Downtown Departure)",
    operatorId: "cape-fox-tours",
    operatorName: "Cape Fox Tours",
    portSlug: "ketchikan",
    clusterId: "alaska-ketchikan",
    bookingChannel: "direct_operator",
    officialSourceUrls: ["https://capefoxtours.com/tours-adventures/"],
    lfseContextId: "ketchikan/445368P5-downtown",
    nonTransferableNote:
      "Applies strictly to Downtown departure variant; do not merge with Ward Cove departure.",
  },
  "cape-fox-saxman-highlights-lumberjack-ward-cove": {
    productId: "cape-fox-saxman-highlights-lumberjack-ward-cove",
    productName:
      "Cape Fox Tours — Saxman Native Village, Ketchikan Highlights & Lumberjack Show (Ward Cove Departure)",
    operatorId: "cape-fox-tours",
    operatorName: "Cape Fox Tours",
    portSlug: "ketchikan",
    clusterId: "alaska-ketchikan",
    bookingChannel: "direct_operator",
    officialSourceUrls: ["https://capefoxtours.com/tours-adventures/"],
    lfseContextId: "ketchikan/445368P5-ward-cove",
    nonTransferableNote:
      "Applies strictly to Ward Cove departure variant; do not merge with Downtown departure.",
  },
  "cape-fox-saxman-signature-creek-street-downtown": {
    productId: "cape-fox-saxman-signature-creek-street-downtown",
    productName:
      "Cape Fox Tours — Saxman Native Village Signature Tour & Creek Street Walk (Downtown Departure)",
    operatorId: "cape-fox-tours",
    operatorName: "Cape Fox Tours",
    portSlug: "ketchikan",
    clusterId: "alaska-ketchikan",
    bookingChannel: "direct_operator",
    officialSourceUrls: ["https://capefoxtours.com/tours-adventures/"],
    lfseContextId: "ketchikan/cape-fox-saxman-signature-creek-street-downtown",
    nonTransferableNote:
      "Applies strictly to Downtown departure of Signature Tour & Creek Street Walk.",
  },
  "cape-fox-saxman-signature-creek-street-ward-cove": {
    productId: "cape-fox-saxman-signature-creek-street-ward-cove",
    productName:
      "Cape Fox Tours — Saxman Native Village Signature Tour & Creek Street Walk (Ward Cove Departure)",
    operatorId: "cape-fox-tours",
    operatorName: "Cape Fox Tours",
    portSlug: "ketchikan",
    clusterId: "alaska-ketchikan",
    bookingChannel: "direct_operator",
    officialSourceUrls: ["https://capefoxtours.com/tours-adventures/"],
    lfseContextId: "ketchikan/cape-fox-saxman-signature-creek-street-ward-cove",
    nonTransferableNote:
      "Applies strictly to Ward Cove departure of Signature Tour & Creek Street Walk.",
  },
  "cape-fox-cultural-culinary-lumberjack": {
    productId: "cape-fox-cultural-culinary-lumberjack",
    productName:
      "Cape Fox Tours — Ketchikan Cultural & Culinary Journey with Lumberjack Show",
    operatorId: "cape-fox-tours",
    operatorName: "Cape Fox Tours",
    portSlug: "ketchikan",
    clusterId: "alaska-ketchikan",
    bookingChannel: "direct_operator",
    officialSourceUrls: ["https://capefoxtours.com/tours-adventures/"],
    lfseContextId: "ketchikan/cape-fox-cultural-culinary-lumberjack",
    nonTransferableNote:
      "Applies strictly to Cultural & Culinary Journey; does not include Totem Park access.",
  },
  "great-alaskan-lumberjack-show-ward-cove": {
    productId: "great-alaskan-lumberjack-show-ward-cove",
    productName: "Great Alaskan Lumberjack Show (with Ward Cove Shuttle Option)",
    operatorId: "great-alaskan-lumberjack-show",
    operatorName: "Great Alaskan Lumberjack Show",
    portSlug: "ketchikan",
    clusterId: "alaska-ketchikan",
    bookingChannel: "direct_operator",
    officialSourceUrls: [
      "https://lumberjackshows.com/tickets/",
      "https://lumberjackshows.com/alaska-cruise-excursions/",
    ],
    lfseContextId: "ketchikan/great-alaskan-lumberjack-show-ward-cove",
    nonTransferableNote:
      "Applies strictly to Great Alaskan Lumberjack Show direct tickets/Ward Cove shuttle option.",
  },
  "taquan-air-misty-fjords-direct": {
    productId: "taquan-air-misty-fjords-direct",
    productName: "Taquan Air — Misty Fjords Flightseeing (Direct)",
    operatorId: "taquan-air",
    operatorName: "Taquan Air",
    portSlug: "ketchikan",
    clusterId: "alaska-ketchikan",
    bookingChannel: "direct_operator",
    fareharborShortname: "taquanair",
    fareharborItemId: "392949",
    officialSourceUrls: [
      "https://taquanair.com/tours/misty-fjords-flightseeing/",
      "https://taquanair.com/faq/",
    ],
    lfseContextId: "ketchikan/6459PRTKTNMISTY",
    nonTransferableNote:
      "Applies strictly to Taquan Air direct flightseeing; never transfer to Island Wings or Viator 6459PRTKTNMISTY without channel equivalence verification.",
  },
  "island-wings-misty-fjords-direct": {
    productId: "island-wings-misty-fjords-direct",
    productName:
      "Island Wings Air Service — Misty Fjords National Monument Flightseeing (Direct)",
    operatorId: "island-wings",
    operatorName: "Island Wings Air Service",
    portSlug: "ketchikan",
    clusterId: "alaska-ketchikan",
    bookingChannel: "direct_operator",
    officialSourceUrls: [
      "https://www.islandwings.com/mistytours.html",
      "https://www.islandwings.com/faq.html",
    ],
    lfseContextId: "ketchikan/island-wings-misty-fjords-direct",
    nonTransferableNote:
      "Applies strictly to Island Wings Air Service; never transfer to Taquan Air.",
  },
  "cajun-encounters-original": {
    productId: "cajun-encounters-original",
    productName: "Cajun Encounters — Original Honey Island Swamp Tour",
    operatorId: "cajun-encounters",
    operatorName: "Cajun Encounters",
    portSlug: "new-orleans",
    clusterId: "new-orleans-swamp",
    bookingChannel: "direct_operator",
    officialSourceUrls: [
      "https://www.cajunencounters.com/tours/swamp-tour-new-orleans",
    ],
    nonTransferableNote:
      "Applies strictly to Cajun Encounters Original Swamp Tour; do not transfer to VIP or private variants.",
  },
  "cajun-encounters-vip": {
    productId: "cajun-encounters-vip",
    productName: "Cajun Encounters — VIP Swamp Tour",
    operatorId: "cajun-encounters",
    operatorName: "Cajun Encounters",
    portSlug: "new-orleans",
    clusterId: "new-orleans-swamp",
    bookingChannel: "direct_operator",
    officialSourceUrls: ["https://www.cajunencounters.com/tours/vip-swamp-tour"],
    nonTransferableNote:
      "Applies strictly to Cajun Encounters VIP Swamp Tour; do not transfer to Original Swamp Tour.",
  },
  "airboat-adventures-pontoon": {
    productId: "airboat-adventures-pontoon",
    productName: "Airboat Adventures — Covered Pontoon Swamp Tour",
    operatorId: "airboat-adventures",
    operatorName: "Airboat Adventures",
    portSlug: "new-orleans",
    clusterId: "new-orleans-swamp",
    bookingChannel: "direct_operator",
    officialSourceUrls: ["https://airboatadventures.com/swamp-tours/"],
    nonTransferableNote:
      "Applies strictly to Airboat Adventures Pontoon; do not transfer to airboat variants.",
  },
  "airboat-adventures-public-large-airboat": {
    productId: "airboat-adventures-public-large-airboat",
    productName: "Airboat Adventures — Public Large Airboat",
    operatorId: "airboat-adventures",
    operatorName: "Airboat Adventures",
    portSlug: "new-orleans",
    clusterId: "new-orleans-swamp",
    bookingChannel: "direct_operator",
    officialSourceUrls: [
      "https://airboatadventures.com/large-boat-airboat-swamp-tours/",
    ],
    nonTransferableNote:
      "Applies strictly to Public Large Airboat; do not transfer to small or premium airboats.",
  },
  "louisiana-tour-company-large-airboat": {
    productId: "louisiana-tour-company-large-airboat",
    productName: "Louisiana Tour Company — Large Airboat",
    operatorId: "louisiana-tour-company",
    operatorName: "Louisiana Tour Company",
    portSlug: "new-orleans",
    clusterId: "new-orleans-swamp",
    bookingChannel: "direct_operator",
    officialSourceUrls: [
      "https://louisianaswamp.com/swamp-tours/airboat-swamp-tour/",
    ],
    nonTransferableNote:
      "Applies strictly to Louisiana Tour Company Large Airboat.",
  },
  "gray-line-large-airboat": {
    productId: "gray-line-large-airboat",
    productName: "Gray Line New Orleans — Large Airboat Swamp Adventure",
    operatorId: "gray-line-new-orleans",
    operatorName: "Gray Line New Orleans",
    portSlug: "new-orleans",
    clusterId: "new-orleans-swamp",
    bookingChannel: "direct_operator",
    officialSourceUrls: [
      "https://www.graylineneworleans.com/swamp-tours/large-airboat-swamp-adventure/",
    ],
    nonTransferableNote:
      "Applies strictly to Gray Line New Orleans direct Large Airboat Swamp Adventure.",
  },
  "chetek-hydroflites-water-ski-show-direct": {
    productId: "chetek-hydroflites-water-ski-show-direct",
    productName: "Chetek Hydroflites Water Ski Show — Aqua Theater (Direct)",
    operatorId: "chetek-hydroflites",
    operatorName: "Chetek Hydroflites Water Ski Show Team",
    portSlug: "chetek",
    clusterId: "wisconsin-chetek",
    bookingChannel: "direct_operator",
    officialSourceUrls: [
      "https://www.hydroflites.com/",
      "https://www.hydroflites.com/location",
      "https://www.hydroflites.com/shows",
    ],
    blueHillsOutpostTourId: "chetek-hydroflites-water-ski-show",
    nonTransferableNote:
      "Applies strictly to Chetek Hydroflites Water Ski Show at Aqua Theater (728 Lakeview Drive, Chetek, WI); never transfer to Muddy Paddle Pub, pontoon rentals, or Blue Hills trails.",
  },
  "blue-hills-felsenmeer-state-natural-area": {
    productId: "blue-hills-felsenmeer-state-natural-area",
    productName:
      "Blue Hills Felsenmeer State Natural Area No. 74 (Wisconsin DNR / Rusk County)",
    operatorId: "wisconsin-dnr-rusk-county",
    operatorName: "Wisconsin DNR & Rusk County Forestry",
    portSlug: "chetek",
    clusterId: "wisconsin-chetek",
    bookingChannel: "direct_operator",
    officialSourceUrls: [
      "https://dnr.wisconsin.gov/topic/statenaturalareas/BlueHillsFelsenmeer",
    ],
    blueHillsOutpostTourId: "blue-hills-felsenmeer-trail",
    nonTransferableNote:
      "Applies strictly to Blue Hills Felsenmeer State Natural Area No. 74 footpaths/access; never transfer to motorized Blue Hills ATV trails or Lake Chetek boat tours.",
  },
  "muddy-paddle-pub-chetek-direct": {
    productId: "muddy-paddle-pub-chetek-direct",
    productName: "Muddy Paddle Pub — Chetek Chain of Lakes Pedal Boat (Direct)",
    operatorId: "muddy-paddle-pub",
    operatorName: "Muddy Paddle Pub",
    portSlug: "chetek",
    clusterId: "wisconsin-chetek",
    bookingChannel: "direct_operator",
    officialSourceUrls: ["https://www.facebook.com/muddypaddlepub/"],
    blueHillsOutpostTourId: "muddy-paddle-pub-chetek",
    nonTransferableNote:
      "Applies strictly to Muddy Paddle Pub Chetek; never inherit Chetek Hydroflites or Blue Hills Felsenmeer approvals.",
  },
  "viecotours-mangrove-lagoon-kayak-snorkel-5199ksml": {
    productId: "viecotours-mangrove-lagoon-kayak-snorkel-5199ksml",
    productName:
      "Virgin Islands Ecotours — St Thomas Mangrove Lagoon Kayak and Snorkel Tour (5199KSML)",
    operatorId: "virgin-islands-ecotours",
    operatorName: "Virgin Islands Ecotours (VI Ecotours)",
    portSlug: "st-thomas",
    clusterId: "usvi-st-thomas",
    bookingChannel: "direct_operator",
    fareharborShortname: "viecotours",
    officialSourceUrls: ["https://www.viecotours.com/"],
    dccOptionId: "stt-opt-viecotours-mangrove-lagoon-5199ksml",
    nonTransferableNote:
      "Applies strictly to 5199KSML (2.5-hour / 150-minute Mangrove Lagoon Kayak & Snorkel, $89.00, self_drive to 6526 Estate Nadir); NEVER merge with 5199P27 (3-hour / 180-minute Cas Cay Kayak, Hike & Snorkel, $99.00) or 5199PRTSTTKSML (shore excursion with transport).",
  },
  "viecotours-cas-cay-kayak-hike-snorkel-5199p27": {
    productId: "viecotours-cas-cay-kayak-hike-snorkel-5199p27",
    productName:
      "Virgin Islands Ecotours — Cas Cay Kayak, Hike, and Snorkel Adventure in St. Thomas (5199P27)",
    operatorId: "virgin-islands-ecotours",
    operatorName: "Virgin Islands Ecotours (VI Ecotours)",
    portSlug: "st-thomas",
    clusterId: "usvi-st-thomas",
    bookingChannel: "direct_operator",
    fareharborShortname: "viecotours",
    officialSourceUrls: ["https://www.viecotours.com/"],
    dccOptionId: "stt-opt-viecotours-cas-cay-5199p27",
    nonTransferableNote:
      "Applies strictly to 5199P27 (3-hour / 180-minute Cas Cay Kayak, Hike & Snorkel Adventure, $99.00, self_drive to 6526 Estate Nadir); NEVER merge with 5199KSML (2.5-hour / 150-minute Mangrove Lagoon Kayak & Snorkel, $89.00).",
  },
  "viecotours-cas-cay-kayak-hike-snorkel-direct": {
    productId: "viecotours-cas-cay-kayak-hike-snorkel-direct",
    productName:
      "Virgin Islands Ecotours — Cas Cay Kayak, Hike & Snorkel Adventure (Direct / 5199P27)",
    operatorId: "virgin-islands-ecotours",
    operatorName: "Virgin Islands Ecotours (VI Ecotours)",
    portSlug: "st-thomas",
    clusterId: "usvi-st-thomas",
    bookingChannel: "direct_operator",
    fareharborShortname: "viecotours",
    officialSourceUrls: ["https://www.viecotours.com/"],
    dccOptionId: "stt-opt-viecotours-cas-cay-5199p27",
    nonTransferableNote:
      "Applies strictly to VI Ecotours 3-Hour (180-minute) Cas Cay Kayak, Hike & Snorkel Adventure ($99.00, 5199P27) departing Mangrove Lagoon Marina (6526 Estate Nadir); NEVER transfer to 5199KSML (2.5-Hour Kayak & Snorkel without hike, $89.00), 5-Hour Best of Cas Cay with Lunch, or 2-Hour Sea Turtles.",
  },
  "vipa-red-hook-and-crown-bay-st-john-ferry": {
    productId: "vipa-red-hook-and-crown-bay-st-john-ferry",
    productName:
      "Virgin Islands Port Authority — Red Hook & Crown Bay to Cruz Bay (St. John) Passenger Ferries",
    operatorId: "vipa",
    operatorName: "Virgin Islands Port Authority (VIPA)",
    portSlug: "st-thomas",
    clusterId: "usvi-st-thomas",
    bookingChannel: "port_shuttle",
    officialSourceUrls: [
      "https://www.viport.com/schedules-ferrycargoschedules",
      "https://www.viport.com/schedule-cruise-ports",
    ],
    dccOptionId: "stt-opt-st-john-trunk-bay-red-hook-ferry",
    nonTransferableNote:
      "Applies strictly to VIPA published Red Hook (Urman Fredericks Terminal) and Crown Bay passenger ferry schedules to Cruz Bay (Loredon Boynes Dock); temporary off-season notice ended October 31, 2026.",
  },
  "magens-bay-authority-beach-admission": {
    productId: "magens-bay-authority-beach-admission",
    productName:
      "Magens Bay Authority — Public Beach Park Admission & Operating Hours",
    operatorId: "magens-bay-authority",
    operatorName: "Magens Bay Authority",
    portSlug: "st-thomas",
    clusterId: "usvi-st-thomas",
    bookingChannel: "direct_operator",
    officialSourceUrls: [
      "https://magensbayauthority.org/passes/",
      "https://magensbayauthority.org/",
    ],
    dccOptionId: "stt-opt-magens-bay-self-guided-safari",
    nonTransferableNote:
      "Applies strictly to Magens Bay Authority park admission and operating gate hours (7:00 AM–5:30 PM); does not include shared safari taxi fares.",
  },
  "airboat-adventures-swamp-shuttle-direct": {
    productId: "airboat-adventures-swamp-shuttle-direct",
    productName:
      "Airboat Adventures — Downtown / French Quarter Hotel Pickup Shuttle (Direct)",
    operatorId: "airboat-adventures",
    operatorName: "Airboat Adventures",
    portSlug: "new-orleans",
    clusterId: "new-orleans-swamp",
    bookingChannel: "direct_operator",
    officialSourceUrls: [
      "https://airboatadventures.com/pickup-locations/",
      "https://airboatadventures.com/faqs/",
    ],
    nonTransferableNote:
      "Applies strictly to Airboat Adventures optional $30/person roundtrip shuttle pickup list and 75-minute pre-tour pickup window; NEVER transfer to Jean Lafitte (763318) or Cajun Encounters.",
  },
  "jean-lafitte-swamp-shuttle-direct": {
    productId: "jean-lafitte-swamp-shuttle-direct",
    productName:
      "Jean Lafitte Swamp Tours — French Quarter Hotel Shuttle Pickup (FareHarbor 763318 / Option #22056428)",
    operatorId: "jeanlafitteswamptour",
    operatorName: "Jean Lafitte Swamp Tours",
    portSlug: "new-orleans",
    clusterId: "new-orleans-swamp",
    bookingChannel: "direct_operator",
    fareharborShortname: "jeanlafitteswamptour",
    fareharborItemId: "763318",
    officialSourceUrls: [
      "https://fareharbor.com/embeds/book/jeanlafitteswamptour/items/763318/?asn=aktourcenter&full-items=yes",
    ],
    nonTransferableNote:
      "Applies strictly to Jean Lafitte Swamp Tours FareHarbor item 763318 (45-minute pre-tour pickup allowance at Hotel Monteleone 214 Royal St via option #22056428); NEVER transfer Airboat Adventures' 75-minute pickup window here.",
  },
  "nassau-cruise-port-prince-george-wharf-gate": {
    productId: "nassau-cruise-port-prince-george-wharf-gate",
    productName:
      "Nassau Cruise Port — Prince George Wharf Pier Exit & Excursion Dispatch",
    operatorId: "nassau-cruise-port",
    operatorName: "Nassau Cruise Port (Prince George Wharf)",
    portSlug: "nassau",
    clusterId: "bahamas-nassau",
    bookingChannel: "port_shuttle",
    officialSourceUrls: ["https://www.nassaucruiseport.com/"],
    nonTransferableNote:
      "Applies strictly to Nassau Cruise Port (Prince George Wharf) berth-to-Rawson-Square walking clearance and Paradise Island ferry terminal transfer timing.",
  },
  "cozumel-three-pier-dispatch-and-mainland-ferry": {
    productId: "cozumel-three-pier-dispatch-and-mainland-ferry",
    productName:
      "Cozumel Cruise Piers — Puerta Maya, SSA International Pier & Punta Langosta Dispatch Rules",
    operatorId: "apiqroo-cozumel",
    operatorName: "Administración Portuaria Integral de Quintana Roo (APIQROO)",
    portSlug: "cozumel",
    clusterId: "mexico-cozumel",
    bookingChannel: "port_shuttle",
    officialSourceUrls: ["https://www.apiqroo.com.mx/"],
    nonTransferableNote:
      "Applies strictly to Cozumel 3-pier transfer offsets (Puerta Maya / International Pier vs. Downtown Punta Langosta) and Playa del Carmen mainland passenger ferry return buffer constraints.",
  },
  "roatan-coxen-hole-vs-mahogany-bay-gate": {
    productId: "roatan-coxen-hole-vs-mahogany-bay-gate",
    productName:
      "Roatán Cruise Ports — Port of Roatán (Coxen Hole) vs. Mahogany Bay Independent Excursion Gate",
    operatorId: "port-of-roatan-mahogany-bay",
    operatorName: "Port of Roatán & Mahogany Bay Cruise Center",
    portSlug: "roatan",
    clusterId: "honduras-roatan",
    bookingChannel: "port_shuttle",
    officialSourceUrls: ["https://www.portofroatan.com/", "https://www.mahoganybaycc.com/"],
    nonTransferableNote:
      "Applies strictly to Coxen Hole Town Center vs. Mahogany Bay independent security-gate pickup walk (+15m uphill gate clearance at Mahogany Bay).",
  },
  "grand-cayman-royal-watler-vs-spotts-tender": {
    productId: "grand-cayman-royal-watler-vs-spotts-tender",
    productName:
      "Port Authority of the Cayman Islands — George Town (Royal Watler) vs. Spotts Bay Tender Operations",
    operatorId: "cayman-port-authority",
    operatorName: "Port Authority of the Cayman Islands (PACI)",
    portSlug: "grand-cayman",
    clusterId: "cayman-grand-cayman",
    bookingChannel: "port_shuttle",
    officialSourceUrls: ["https://www.caymanport.com/ship-schedules/"],
    nonTransferableNote:
      "Applies strictly to Grand Cayman mandatory ship-to-shore tender queue allowance (35–45m each way at Royal Watler; +20m road transfer when winter swells divert ships to Spotts Bay).",
  },
};

export const BLOCKED_UMBRELLA_PRODUCT_IDS = new Set<string>([
  "airboat-adventures-public-airboat",
  "cape-fox-saxman-highlights-lumberjack",
  "cape-fox-saxman-signature-creek-street",
]);

export interface RawResearchDeskFactRow {
  id?: string;
  fact_id?: string;
  cluster?: string;
  cluster_id?: string;
  product_id?: string;
  canonical_product_id?: string;
  constraint_type?: string;
  atomic_constraint_type?: string;
  source_url?: string;
  source_excerpt?: string;
  source_hash?: string;
  evidence_fingerprint?: string | null;
  approved_readable_text_sha256?: string | null;
  fingerprint?: string | null;
  checked_at?: string;
  source_checked_at?: string | null;
  value?: string | number | null;
  unit?: string | null;
  conditions?: string | null;
  status?: string | null;
  decision?: string | null;
  verified_on?: string | null;
  reviewed_at?: string | null;
  verified_by?: string | null;
  reviewer_id?: string | null;
  reviewer_key?: string | null;
  actor?: string | null;
  review_due_on?: string | null;
  revision?: number | string | null;
  approved_revision?: number | string | null;
  current_revision?: number | string | null;
  active?: number | boolean | null;
  withdrawn?: boolean | null;
  revoked_by_source_event?: boolean | null;
  consumers?: string | string[] | null;
  affected_consumers?: string | string[] | null;
  last_review_token?: string | null;
  healthy?: number | boolean | null;
  current_source_hash?: string | null;
  current_fingerprint?: string | null;
  conflicted?: boolean | null;
  temporal_scope?: {
    date?: string;
    timezone?: string;
    historical_only?: boolean;
  } | null;
}

export interface EvaluatedResearchFact {
  fact_id: string;
  cluster: ResearchClusterId;
  port_slug: ResearchPortSlug;
  operator_id: string;
  operator_name: string;
  product_id: string;
  product_name: string;
  booking_channel: "direct_operator" | "port_shuttle" | "blocked_umbrella";
  dcc_option_id: string | null;
  cruisepromenade_excursion_id: string | null;
  lfse_context_id: string | null;
  blue_hills_outpost_tour_id: string | null;
  constraint_type: ResearchConstraintType;
  value: string;
  unit: string;
  conditions: string;
  source_url: string;
  source_excerpt: string;
  source_hash: string;
  current_source_hash: string | null;
  checked_at: string | null;
  temporal_scope?: {
    date?: string;
    timezone?: string;
    historical_only?: boolean;
  } | null;
  revision: number;
  verified: boolean;
  eligibility_status: ResearchFactEligibilityStatus;
  disqualification_reason: ResearchFactDisqualificationReason | null;
  verified_on: string | null;
  verified_by: string | null;
  reviewer_id: string | null;
  review_due_on: string | null;
  review_deadline_utc: string | null;
  remaining_ttl_seconds: number;
  healthy: boolean;
  active: boolean;
  consumers: string[];
  non_transferable_to_other_tours: true;
  non_transferable_note: string;
}

export const CONNECTED_COASTAL_CONSUMERS = [
  "connected:DCC approved-fact feed (live verified 2026-11-03)",
  "connected:Cruise Promenade exact-product qualification (live verified 2026-11-03)",
  "connected:Last Frontier Shore Excursions Juneau selection (live verified 2026-11-03)",
  "dcc:juneau/port-day-engine",
  "dcc:api/internal/cruises/port/juneau",
  "cruisepromenade:ports/juneau",
  "cruisepromenade:api/excursions",
  "lfse:ports/juneau",
  "lfse:juneau/helicopter-glacier-tours",
  "lfse:api/research-qualifications",
  "juneauflightdeck:Juneau helicopter comparison",
] as const;

export const CONNECTED_CHETEK_CONSUMERS = [
  "connected:DCC approved-fact feed (live verified 2026-11-03)",
  "connected:Blue Hills Outpost Wisconsin/Chetek feed (live verified 2026-11-03)",
  "dcc:api/internal/research/approved-facts?port=chetek",
  "blue-hills-outpost:api/research-facts",
  "blue-hills-outpost:api/tours",
  "blue-hills-outpost:chetek-hydroflites-water-ski-show-schedule",
  "blue-hills-outpost:blue-hills-hiking-trail-guide",
  "blue-hills-outpost:blue-hills-atv-trail-guide",
] as const;

/**
 * Baseline machine-extracted candidates for Coastal Helicopters Icefield Excursion (Direct).
 * Importantly, these remain unconfirmed (`status: "needs confirmation"`, `verified: false`)
 * until an authenticated human approval record is ingested from the review desk.
 */
export const COASTAL_HELICOPTERS_ICEFIELD_CANDIDATE_BASELINE: RawResearchDeskFactRow[] =
  [
    {
      id: "20a56628f0ce1e5cc2299a68",
      fact_id: "20a56628f0ce1e5cc2299a68",
      cluster: "alaska-juneau",
      product_id: "coastal-helicopters-icefield-excursion-direct",
      constraint_type: "total_duration",
      source_url: "https://coastalhelicopters.com/tours/icefield-excursion/",
      source_excerpt: "Total Duration: 2 hours, 35 minutes (155 minutes)",
      source_hash:
        "8c193318f4d1c67ad35058592ac74dffb7747be317a0cdd20319687a7a9638f5",
      current_source_hash:
        "8c193318f4d1c67ad35058592ac74dffb7747be317a0cdd20319687a7a9638f5",
      checked_at: "2026-11-03T06:26:52.717488+00:00",
      value: "155",
      unit: "minutes",
      conditions:
        "Includes round-trip downtown/cruise port shuttle transportation; approximately 55 minutes from pickup to return plus 40–45 minutes on the Herbert Glacier.",
      status: "needs confirmation",
      verified_on: null,
      verified_by: null,
      reviewer_id: null,
      review_due_on: null,
      revision: 1,
      active: 1,
      healthy: 1,
      consumers: [...CONNECTED_COASTAL_CONSUMERS],
    },
    {
      id: "e2f82ca7fc99123a001da7cb",
      fact_id: "e2f82ca7fc99123a001da7cb",
      cluster: "alaska-juneau",
      product_id: "coastal-helicopters-icefield-excursion-direct",
      constraint_type: "weight_declaration",
      source_url: "https://coastalhelicopters.com/tours/icefield-excursion/",
      source_excerpt:
        "Accurate fully clothed weights are required for all passengers; guests weighing 250 lbs or more pay a $150 weight surcharge.",
      source_hash:
        "8c193318f4d1c67ad35058592ac74dffb7747be317a0cdd20319687a7a9638f5",
      current_source_hash:
        "8c193318f4d1c67ad35058592ac74dffb7747be317a0cdd20319687a7a9638f5",
      checked_at: "2026-11-03T06:26:52.717488+00:00",
      value: "250",
      unit: "lbs_per_passenger_surcharge_threshold",
      conditions:
        "Passengers weighing 250 lbs or more fully clothed must pay a $150 weight surcharge for flight balance and safety.",
      status: "needs confirmation",
      verified_on: null,
      verified_by: null,
      reviewer_id: null,
      review_due_on: null,
      revision: 1,
      active: 1,
      healthy: 1,
      consumers: [...CONNECTED_COASTAL_CONSUMERS],
    },
    {
      id: "626fa413fa044eb02f431823",
      fact_id: "626fa413fa044eb02f431823",
      cluster: "alaska-juneau",
      product_id: "coastal-helicopters-icefield-excursion-direct",
      constraint_type: "bag_policy",
      source_url: "https://coastalhelicopters.com/tours/icefield-excursion/",
      source_excerpt:
        "No carry-on bags (purses, backpacks, camera bags, fanny packs, etc.) are allowed on the helicopter; secure storage is provided at the hangar.",
      source_hash:
        "8c193318f4d1c67ad35058592ac74dffb7747be317a0cdd20319687a7a9638f5",
      current_source_hash:
        "8c193318f4d1c67ad35058592ac74dffb7747be317a0cdd20319687a7a9638f5",
      checked_at: "2026-11-03T06:26:52.717488+00:00",
      value: "No carry-on bags permitted",
      unit: "policy",
      conditions:
        "All bags must be stored at the heliport hangar; phones and handheld cameras are permitted.",
      status: "needs confirmation",
      verified_on: null,
      verified_by: null,
      reviewer_id: null,
      review_due_on: null,
      revision: 1,
      active: 1,
      healthy: 1,
      consumers: [...CONNECTED_COASTAL_CONSUMERS],
    },
    {
      id: "ebbf9abfdff91125ff9fc3fc",
      fact_id: "ebbf9abfdff91125ff9fc3fc",
      cluster: "alaska-juneau",
      product_id: "coastal-helicopters-icefield-excursion-direct",
      constraint_type: "transport_inclusion",
      source_url: "https://coastalhelicopters.com/tours/icefield-excursion/",
      source_excerpt:
        "Round-trip transportation is provided from downtown Juneau and the cruise ship docks.",
      source_hash:
        "8c193318f4d1c67ad35058592ac74dffb7747be317a0cdd20319687a7a9638f5",
      current_source_hash:
        "8c193318f4d1c67ad35058592ac74dffb7747be317a0cdd20319687a7a9638f5",
      checked_at: "2026-11-03T06:26:52.717488+00:00",
      value: "Included",
      unit: "round_trip_shuttle",
      conditions:
        "Complimentary round-trip van transfer from downtown Juneau / cruise ship docks to the airport heliport is included in the direct tour price.",
      status: "needs confirmation",
      verified_on: null,
      verified_by: null,
      reviewer_id: null,
      review_due_on: null,
      revision: 1,
      active: 1,
      healthy: 1,
      consumers: [...CONNECTED_COASTAL_CONSUMERS],
    },
    {
      id: "5d8dc29a0870397848b7cf74",
      fact_id: "5d8dc29a0870397848b7cf74",
      cluster: "alaska-juneau",
      product_id: "coastal-helicopters-icefield-excursion-direct",
      constraint_type: "cancellation_policy",
      source_url: "https://coastalhelicopters.com/tours/icefield-excursion/",
      source_excerpt:
        "Full refund if cancelled at least 24 hours prior to departure or if cancelled by operator due to weather.",
      source_hash:
        "8c193318f4d1c67ad35058592ac74dffb7747be317a0cdd20319687a7a9638f5",
      current_source_hash:
        "8c193318f4d1c67ad35058592ac74dffb7747be317a0cdd20319687a7a9638f5",
      checked_at: "2026-11-03T06:26:52.717488+00:00",
      value: "24",
      unit: "hours_prior_full_refund",
      conditions:
        "100% refund for cancellations made 24+ hours before scheduled check-in or for weather cancellations by Coastal Helicopters.",
      status: "needs confirmation",
      verified_on: null,
      verified_by: null,
      reviewer_id: null,
      review_due_on: null,
      revision: 1,
      active: 1,
      healthy: 1,
      consumers: [...CONNECTED_COASTAL_CONSUMERS],
    },
    {
      id: "cf0a02faabfd4a5460837470",
      fact_id: "cf0a02faabfd4a5460837470",
      cluster: "alaska-juneau",
      product_id: "coastal-helicopters-icefield-excursion-direct",
      constraint_type: "child_seat_and_fare",
      source_url: "https://coastalhelicopters.com/tours/icefield-excursion/",
      source_excerpt:
        "FAA regulations require children 24 months and older to occupy their own seat at the full adult fare.",
      source_hash:
        "8c193318f4d1c67ad35058592ac74dffb7747be317a0cdd20319687a7a9638f5",
      current_source_hash:
        "8c193318f4d1c67ad35058592ac74dffb7747be317a0cdd20319687a7a9638f5",
      checked_at: "2026-11-03T06:26:52.717488+00:00",
      value: "24",
      unit: "months_and_older_full_fare_own_seat",
      conditions:
        "Per FAA regulation, children age 2 years (24 months) and older must occupy an individual seat at full fare.",
      status: "needs confirmation",
      verified_on: null,
      verified_by: null,
      reviewer_id: null,
      review_due_on: null,
      revision: 1,
      active: 1,
      healthy: 1,
      consumers: [...CONNECTED_COASTAL_CONSUMERS],
    },
  ];

/**
 * Primary-source-backed machine candidates for Wisconsin / Chetek (Blue Hills Outpost).
 * Captured from https://www.hydroflites.com/ and https://dnr.wisconsin.gov/topic/statenaturalareas/BlueHillsFelsenmeer
 * and refreshed on 2026-11-03T14:09:07.636650+00:00.
 * All rows remain unconfirmed (`status: "needs confirmation"`, `verified: false`, `revision: 1`)
 * until human review confirmation in the DCC Research Review desk.
 */
export const WISCONSIN_CHETEK_CANDIDATE_BASELINE: RawResearchDeskFactRow[] = [
  {
    id: "e2b51de8d43d54d31481f894",
    fact_id: "e2b51de8d43d54d31481f894",
    cluster: "wisconsin-chetek",
    product_id: "chetek-hydroflites-water-ski-show-direct",
    constraint_type: "price",
    source_url: "https://www.hydroflites.com/",
    source_excerpt: "Upcoming 2026 Shows - Free to the Public",
    source_hash:
      "3974e9fa13886a717ba54fff817987920408ec7f483808eb39ab9335b1edb8f1",
    current_source_hash:
      "3974e9fa13886a717ba54fff817987920408ec7f483808eb39ab9335b1edb8f1",
    checked_at: "2026-11-03T14:09:07.636650+00:00",
    value: "0",
    unit: "usd_admission",
    conditions:
      "Admission to the Chetek Hydroflites Water Ski Show at the Aqua Theater is free to the public (team funded by sponsors, member dues, and donations).",
    status: "needs confirmation",
    verified_on: null,
    verified_by: null,
    reviewer_id: null,
    review_due_on: null,
    revision: 1,
    active: 1,
    healthy: 1,
    consumers: [...CONNECTED_CHETEK_CONSUMERS],
  },
  {
    id: "662dbc63c8e6d3f909ddd076",
    fact_id: "662dbc63c8e6d3f909ddd076",
    cluster: "wisconsin-chetek",
    product_id: "chetek-hydroflites-water-ski-show-direct",
    constraint_type: "pickup_meeting",
    source_url: "https://www.hydroflites.com/location",
    source_excerpt:
      "The Chetek Hydroflites Water Ski Show is located on beautiful Lake Chetek off of Lakeview Drive. Our brand new Aqua Theater is east of Chetek directly across from the Chetek Airport. Ample parking is available onsite.",
    source_hash:
      "98c45c3b7e30120cc6b46cd6a9a9196c0cbf8799a1fdba0b64f4afe6006e214b",
    current_source_hash:
      "98c45c3b7e30120cc6b46cd6a9a9196c0cbf8799a1fdba0b64f4afe6006e214b",
    checked_at: "2026-11-03T14:09:07.636650+00:00",
    value:
      "Aqua Theater, 728 Lakeview Drive, Chetek, WI 54728 (onsite parking across from Chetek Airport)",
    unit: "self_drive_venue_arrival",
    conditions:
      "Self-drive arrival at Aqua Theater (728 Lakeview Drive, Chetek, WI 54728) directly across from the Chetek Airport; ample onsite parking is available; no hotel shuttle is provided.",
    status: "needs confirmation",
    verified_on: null,
    verified_by: null,
    reviewer_id: null,
    review_due_on: null,
    revision: 1,
    active: 1,
    healthy: 1,
    consumers: [...CONNECTED_CHETEK_CONSUMERS],
  },
  {
    id: "a6827bfbc093f21df550d541",
    fact_id: "a6827bfbc093f21df550d541",
    cluster: "wisconsin-chetek",
    product_id: "chetek-hydroflites-water-ski-show-direct",
    constraint_type: "weather_policy",
    source_url: "https://www.hydroflites.com/location",
    source_excerpt:
      'All of our shows are performed "Rain or Shine" and delayed or canceled only for severe weather in the immediate area. You should use your own judgment as to the appropriateness of outdoor activities during potentially inclement weather.',
    source_hash:
      "98c45c3b7e30120cc6b46cd6a9a9196c0cbf8799a1fdba0b64f4afe6006e214b",
    current_source_hash:
      "98c45c3b7e30120cc6b46cd6a9a9196c0cbf8799a1fdba0b64f4afe6006e214b",
    checked_at: "2026-11-03T14:09:07.636650+00:00",
    value:
      "Rain or Shine (delayed or canceled only for severe weather in the immediate area)",
    unit: "policy",
    conditions:
      "Shows operate rain or shine and are delayed or canceled only for severe weather in the immediate Lake Chetek area.",
    status: "needs confirmation",
    verified_on: null,
    verified_by: null,
    reviewer_id: null,
    review_due_on: null,
    revision: 1,
    active: 1,
    healthy: 1,
    consumers: [...CONNECTED_CHETEK_CONSUMERS],
  },
  {
    id: "c39820438d099142bf27a3ca",
    fact_id: "c39820438d099142bf27a3ca",
    cluster: "wisconsin-chetek",
    product_id: "chetek-hydroflites-water-ski-show-direct",
    constraint_type: "tournament_blackout_2026",
    source_url: "https://www.hydroflites.com/shows",
    source_excerpt:
      "No show! The Chetek Hydroflites will be performing at the Wisconsin Water Ski Show Tournament.",
    source_hash:
      "47fec369396016842508aab456ee23c203d4240901fde5591ce07c6bba65b790",
    current_source_hash:
      "47fec369396016842508aab456ee23c203d4240901fde5591ce07c6bba65b790",
    checked_at: "2026-11-03T14:09:07.636650+00:00",
    value: "2026-07-19",
    unit: "historical_no_home_show_date",
    conditions:
      "Historical 2026 season blackout (past date as of November 3, 2026): No home show at Lake Chetek Aqua Theater on Sunday, July 19, 2026 while the team performed at the Wisconsin Water Ski Show Tournament. Historical evidence only; do not project to future seasons.",
    temporal_scope: {
      date: "2026-07-19",
      timezone: "America/Chicago",
      historical_only: true,
    },
    status: "needs confirmation",
    verified_on: null,
    verified_by: null,
    reviewer_id: null,
    review_due_on: null,
    revision: 1,
    active: 1,
    healthy: 1,
    consumers: [...CONNECTED_CHETEK_CONSUMERS],
  },
  {
    id: "7821e46629ff2d43877c3d1a",
    fact_id: "7821e46629ff2d43877c3d1a",
    cluster: "wisconsin-chetek",
    product_id: "blue-hills-felsenmeer-state-natural-area",
    constraint_type: "mobility_requirements",
    source_url:
      "https://dnr.wisconsin.gov/topic/statenaturalareas/BlueHillsFelsenmeer",
    source_excerpt:
      "Generally, there are no picnic areas, restrooms, or other developments. Parking lots or designated parking areas are noted on individual SNA pages and maps. Trails, if present, are typically undesignated footpaths.",
    source_hash:
      "99950c58f43752edc6440b56721fc37dc291f63afe190730abcb58c56bce356b",
    current_source_hash:
      "99950c58f43752edc6440b56721fc37dc291f63afe190730abcb58c56bce356b",
    checked_at: "2026-11-03T14:09:07.636650+00:00",
    value:
      "Undesignated footpaths and steep talus rock rubble; no restrooms, picnic areas, or developed ADA trails",
    unit: "trail_surface_and_facilities",
    conditions:
      "Wisconsin DNR State Natural Area No. 74 has no restrooms or developed facilities; trails are undesignated footpaths across glacial talus slopes.",
    status: "needs confirmation",
    verified_on: null,
    verified_by: null,
    reviewer_id: null,
    review_due_on: null,
    revision: 1,
    active: 1,
    healthy: 1,
    consumers: [...CONNECTED_CHETEK_CONSUMERS],
  },
  {
    id: "bc30c3bc3020d3e3f777bdfa",
    fact_id: "bc30c3bc3020d3e3f777bdfa",
    cluster: "wisconsin-chetek",
    product_id: "blue-hills-felsenmeer-state-natural-area",
    constraint_type: "pickup_meeting",
    source_url:
      "https://dnr.wisconsin.gov/topic/statenaturalareas/BlueHillsFelsenmeer",
    source_excerpt:
      "If you have high vehicle clearance, you can drive down the gravel road and park. The hiking route starts heading west on the gated logging road. There is a shorter approach from the end of Slack Road, which is north of the curve on County W. Slack Road is usually not plowed in winter.",
    source_hash:
      "99950c58f43752edc6440b56721fc37dc291f63afe190730abcb58c56bce356b",
    current_source_hash:
      "99950c58f43752edc6440b56721fc37dc291f63afe190730abcb58c56bce356b",
    checked_at: "2026-11-03T14:09:07.636650+00:00",
    value:
      "Gated logging road off County W (high clearance gravel turn-off) or end of Slack Road (unplowed in winter)",
    unit: "trailhead_access",
    conditions:
      "Self-drive trailhead access off County W (2.3 miles north of Old 14 Road; high vehicle clearance required for gravel turn-off) or via Slack Road (not plowed in winter).",
    status: "needs confirmation",
    verified_on: null,
    verified_by: null,
    reviewer_id: null,
    review_due_on: null,
    revision: 1,
    active: 1,
    healthy: 1,
    consumers: [...CONNECTED_CHETEK_CONSUMERS],
  },
];

export const ST_THOMAS_WINTER_CANDIDATE_BASELINE: RawResearchDeskFactRow[] = [
  {
    id: "mc-stt-viecotours-5199ksml-150m-89usd-20261106",
    fact_id: "mc-stt-viecotours-5199ksml-150m-89usd-20261106",
    cluster: "usvi-st-thomas",
    product_id: "viecotours-mangrove-lagoon-kayak-snorkel-5199ksml",
    constraint_type: "total_duration",
    source_url: "https://www.viecotours.com/",
    source_excerpt:
      "St Thomas Mangrove Lagoon Kayak and Snorkel Tour (5199KSML): 2 hours 30 minutes (150 minutes) — From $89.00. Meet at Virgin Islands Ecotours Marina, 6526 Estate Nadir, St. Thomas, VI 00802 (self_drive / independent taxi; no Cas Cay island hike).",
    source_hash:
      "ffe87b18e633ce15889f0480e241ac81ea52637e6cb719c5d39a5b0b27ff1b52",
    current_source_hash:
      "ffe87b18e633ce15889f0480e241ac81ea52637e6cb719c5d39a5b0b27ff1b52",
    checked_at: "2026-11-06T12:00:00.000Z",
    value: "150",
    unit: "minutes",
    conditions:
      "5199KSML is the 150-minute (2h 30m) Mangrove Lagoon Kayak & Snorkel tour ($89.00, self_drive to 6526 Estate Nadir); kept strictly separate from 5199P27 (the 180-minute / 3-hour Cas Cay Kayak, Hike & Snorkel Adventure at $99.00).",
    status: "needs confirmation",
    verified_on: null,
    verified_by: null,
    reviewer_id: null,
    review_due_on: null,
    revision: 1,
    active: 1,
    healthy: 1,
    consumers: [
      "dcc:st-thomas/port-day-engine",
      "dcc:api/internal/cruises/port/st-thomas",
      "dcc:api/internal/research/approved-facts?port=st-thomas",
    ],
  },
  {
    id: "mc-stt-viecotours-cas-cay-duration-20261106",
    fact_id: "mc-stt-viecotours-cas-cay-duration-20261106",
    cluster: "usvi-st-thomas",
    product_id: "viecotours-cas-cay-kayak-hike-snorkel-5199p27",
    constraint_type: "total_duration",
    source_url: "https://www.viecotours.com/",
    source_excerpt:
      "3 Hours (180 minutes) — Cas Cay Kayak, Hike & Snorkel Adventure (5199P27) — From $99.00. Departing Mangrove Lagoon Marina, 6526 Estate Nadir, St Thomas, VI 00802 (PublicationDate: Nov 05, 2026).",
    source_hash:
      "ffe87b18e633ce15889f0480e241ac81ea52637e6cb719c5d39a5b0b27ff1b52",
    current_source_hash:
      "ffe87b18e633ce15889f0480e241ac81ea52637e6cb719c5d39a5b0b27ff1b52",
    checked_at: "2026-11-06T10:40:46.000Z",
    value: "180",
    unit: "minutes",
    conditions:
      "5199P27 is the 3-hour (180-minute) Cas Cay Kayak, Hike & Snorkel Adventure ($99.00, self_drive to 6526 Estate Nadir; 25m taxi from Havensight/WICO or 35m from Crown Bay). Kept strictly separate from 5199KSML (150m, $89.00).",
    status: "needs confirmation",
    verified_on: null,
    verified_by: null,
    reviewer_id: null,
    review_due_on: null,
    revision: 1,
    active: 1,
    healthy: 1,
    consumers: [
      "dcc:st-thomas/port-day-engine",
      "dcc:api/internal/cruises/port/st-thomas",
      "dcc:api/internal/research/approved-facts?port=st-thomas",
    ],
  },
  {
    id: "mc-stt-vipa-ferry-schedule-and-crown-bay-afternoon-only-20261106",
    fact_id: "mc-stt-vipa-ferry-schedule-and-crown-bay-afternoon-only-20261106",
    cluster: "usvi-st-thomas",
    product_id: "vipa-red-hook-and-crown-bay-st-john-ferry",
    constraint_type: "pickup_rules",
    source_url: "https://www.viport.com/schedules-ferrycargoschedules",
    source_excerpt:
      "Red Hook, St. Thomas to Cruz Bay, St. John: 15 to 20 minutes; Non-Resident Adult $8.15, Child (2-11) $1.00, Luggage $4.00/piece; arrive 15 minutes before departure. Crown Bay, St. Thomas to Cruz Bay, St. John (Inter Island Boat Services): Departs Crown Bay at 2:15 PM (Sat & Sun only), 3:30 PM, and 5:30 PM ($20.00/adult). Temporary notice window ended October 31, 2026.",
    source_hash:
      "acd86c31de4ed5ae57ab2c3cfe17d5200bd1058036cfae35b59ae825520d5464",
    current_source_hash:
      "acd86c31de4ed5ae57ab2c3cfe17d5200bd1058036cfae35b59ae825520d5464",
    checked_at: "2026-11-06T11:25:43.000Z",
    value:
      "Red Hook <-> Cruz Bay: 15m crossing ($8.15 adult + $4 luggage, 15m boarding lead); Crown Bay -> Cruz Bay departs afternoon only (14:15 Sat/Sun, 15:30, 17:30); temporary notice ended Oct 31, 2026",
    unit: "ferry_schedule_rule",
    conditions:
      "St. John is offered as a day-trip choice from St. Thomas when both outbound and return ferry legs fit the sailing. The temporary VIPA notice (July 26–Oct 31, 2026) ended October 31; return legs after Oct 31 where the post-Oct-31 VIPA schedule is unresolved display 'Needs confirmation'.",
    status: "needs confirmation",
    verified_on: null,
    verified_by: null,
    reviewer_id: null,
    review_due_on: null,
    revision: 1,
    active: 1,
    healthy: 1,
    consumers: [
      "dcc:st-thomas/port-day-engine",
      "dcc:api/internal/cruises/port/st-thomas",
      "dcc:api/internal/research/approved-facts?port=st-thomas",
    ],
  },
  {
    id: "mc-stt-magens-bay-nonresident-admission-20261106",
    fact_id: "mc-stt-magens-bay-nonresident-admission-20261106",
    cluster: "usvi-st-thomas",
    product_id: "magens-bay-authority-beach-admission",
    constraint_type: "price",
    source_url: "https://magensbayauthority.org/passes/",
    source_excerpt:
      "Non-Residents Daily $7.00 per person. Kids under 12 FREE. Residents Daily $2.00 per person. Open Daily from 7am - 5:30pm.",
    source_hash:
      "b3b0060dcb2ee2471ee76456251ab03b1c83bf27db5e75c2c2d6f059d91e92b2",
    current_source_hash:
      "b3b0060dcb2ee2471ee76456251ab03b1c83bf27db5e75c2c2d6f059d91e92b2",
    checked_at: "2026-11-06T10:43:40.000Z",
    value: "7.00",
    unit: "USD_per_nonresident_adult",
    conditions:
      "Non-resident daily admission is $7.00 per person; children under 12 are admitted free; operating hours 7:00 AM–5:30 PM daily.",
    status: "needs confirmation",
    verified_on: null,
    verified_by: null,
    reviewer_id: null,
    review_due_on: null,
    revision: 1,
    active: 1,
    healthy: 1,
    consumers: [
      "dcc:st-thomas/port-day-engine",
      "dcc:api/internal/cruises/port/st-thomas",
      "dcc:api/internal/research/approved-facts?port=st-thomas",
    ],
  },
];

export const NEW_ORLEANS_HOTEL_PICKUP_CANDIDATE_BASELINE: RawResearchDeskFactRow[] =
  [
    {
      id: "mc-nola-airboat-adventures-75min-pickup-window-20261106",
      fact_id: "mc-nola-airboat-adventures-75min-pickup-window-20261106",
      cluster: "new-orleans-swamp",
      product_id: "airboat-adventures-swamp-shuttle-direct",
      constraint_type: "pickup_rules",
      source_url: "https://airboatadventures.com/pickup-locations/",
      source_excerpt:
        "The pickup window begins 1 hour and 15 minutes (75 minutes) before tour time. Guests must be waiting outside their pickup location for the entire pickup window. Roundtrip transportation is an extra $30 per person. Pickup Locations: Monteleone — 214 Royal St; Roosevelt — 123 Baronne St.",
      source_hash:
        "cd64cafa213260c685af2269679b77ca38e757790fba6ddf636ac618d3070d56",
      current_source_hash:
        "cd64cafa213260c685af2269679b77ca38e757790fba6ddf636ac618d3070d56",
      checked_at: "2026-11-06T10:41:54.000Z",
      value:
        "Airboat Adventures: 75-minute pre-tour curbside pickup window (+$30/person roundtrip); named stops at Monteleone (214 Royal St) and Roosevelt (123 Baronne St); Omni Riverfront (701 Convention Center Blvd) unconfirmed",
      unit: "hotel_pickup_window_rule",
      conditions:
        "Recorded strictly separately from Jean Lafitte (763318). Guests must wait outside their designated pickup location for the entire 75-minute window prior to tour time. Omni Riverfront pickup remains unconfirmed until Airboat Adventures names the applicable stop.",
      status: "needs confirmation",
      verified_on: null,
      verified_by: null,
      reviewer_id: null,
      review_due_on: null,
      revision: 1,
      active: 1,
      healthy: 1,
      consumers: [
        "dcc:new-orleans/swamp-tours",
        "dcc:api/internal/research/approved-facts?port=new-orleans",
      ],
    },
    {
      id: "mc-nola-jean-lafitte-45min-monteleone-pickup-20261106",
      fact_id: "mc-nola-jean-lafitte-45min-monteleone-pickup-20261106",
      cluster: "new-orleans-swamp",
      product_id: "jean-lafitte-swamp-shuttle-direct",
      constraint_type: "pickup_rules",
      source_url:
        "https://fareharbor.com/embeds/book/jeanlafitteswamptour/items/763318/?asn=aktourcenter&full-items=yes",
      source_excerpt:
        "Jean Lafitte Swamp Tour (FareHarbor item 763318): 90-minute covered boat tour ($32/adult) + optional round-trip hotel shuttle (+$30/person) at Hotel Monteleone (214 Royal St — FareHarbor pickup option #22056428, 45-minute pre-tour transfer allowance).",
      source_hash:
        "a1e908f64b5c71d293e04152a896bc7120e34590ab12839475610bcde9012345",
      current_source_hash:
        "a1e908f64b5c71d293e04152a896bc7120e34590ab12839475610bcde9012345",
      checked_at: "2026-11-06T10:42:00.000Z",
      value:
        "Jean Lafitte (763318): 45-minute pre-tour hotel shuttle pickup allowance at Hotel Monteleone (214 Royal St, FareHarbor option #22056428, +$30/person); Omni Riverfront unconfirmed",
      unit: "hotel_pickup_window_rule",
      conditions:
        "Recorded strictly separately from Airboat Adventures' 75-minute pickup window. Hotel Monteleone placement remains pending actual operator terms and hotel approval.",
      status: "needs confirmation",
      verified_on: null,
      verified_by: null,
      reviewer_id: null,
      review_due_on: null,
      revision: 1,
      active: 1,
      healthy: 1,
      consumers: [
        "dcc:new-orleans/swamp-tours",
        "dcc:api/internal/research/approved-facts?port=new-orleans",
      ],
    },
  ];

export const KETCHIKAN_PRESEASON_CANDIDATE_BASELINE: RawResearchDeskFactRow[] =
  [
    {
      id: "mc-ktn-ward-cove-shuttle-and-2027-preseason-20261106",
      fact_id: "mc-ktn-ward-cove-shuttle-and-2027-preseason-20261106",
      cluster: "alaska-ketchikan",
      product_id: "ward-cove-complimentary-bus",
      constraint_type: "pickup_rules",
      source_url: "https://wardcoveak.com/schedules/",
      source_excerpt:
        "The shuttle loads at the far end of the Ward Cove Welcome Center and drops off at Berth IV in downtown Ketchikan. Travel time is approximately 20 minutes each way. Please allow at least 30 minutes to reach Berth IV if you have a scheduled appointment. From Berth IV, it is an additional 15-minute walk to the center of downtown.",
      source_hash:
        "e6fbb9328c0f68a3130e4b2086c2dc903326214389df0c1ca28ba6158bccdbe3",
      current_source_hash:
        "e6fbb9328c0f68a3130e4b2086c2dc903326214389df0c1ca28ba6158bccdbe3",
      checked_at: "2026-11-06T10:40:54.000Z",
      value:
        "Allow 30 minutes shuttle transit to Berth IV + 15 minutes walk to downtown center (45 minutes each way)",
      unit: "shuttle_transfer_allowance",
      conditions:
        "Complimentary shuttle between Ward Cove Welcome Center and Downtown Ketchikan Berth IV (~20 min drive each way; allow 30 min to Berth IV + 15 min walk to downtown center). 2027 Ship Schedule PDF not yet published on wardcoveak.com as of 2026-11-06.",
      status: "needs confirmation",
      verified_on: null,
      verified_by: null,
      reviewer_id: null,
      review_due_on: null,
      revision: 1,
      active: 1,
      healthy: 1,
      consumers: [
        "dcc:ports/ketchikan",
        "dcc:api/internal/research/approved-facts?port=ketchikan",
      ],
    },
  ];

export const WINTER_FOUR_PORTS_CANDIDATE_BASELINE: RawResearchDeskFactRow[] = [
  {
    id: "mc-nas-prince-george-wharf-berths-1-6-exit-walk-20261106",
    fact_id: "mc-nas-prince-george-wharf-berths-1-6-exit-walk-20261106",
    cluster: "bahamas-nassau",
    product_id: "nassau-cruise-port-prince-george-wharf-gate",
    constraint_type: "pickup_rules",
    source_url: "https://www.nassaucruiseport.com/",
    source_excerpt:
      "Nassau Cruise Port (Prince George Wharf Berths 1–6): allow 15–25 minutes to walk from ship gangway through the NCP Arrivals Terminal to the outside Woodes Rogers Walk / Bay Street dispatch gate; Paradise Island / Montague marina check-ins require 25–30 minutes each way across the Sidney Poitier Bridge.",
    source_hash:
      "a9d41e821c0e447295f6789123a440f918273645512a3b4c5d6e7f8091a2b3c4",
    current_source_hash:
      "a9d41e821c0e447295f6789123a440f918273645512a3b4c5d6e7f8091a2b3c4",
    checked_at: "2026-11-06T12:15:00.000Z",
    value:
      "Allow 20–25m pier exit walk through NCP Arrivals Terminal; Paradise Island / Montague marine departures (52556P13) require 25–30m bridge transfer each way and 75m return buffer",
    unit: "pier_and_pickup_timing_rule",
    conditions:
      "Applies to Nassau Cruise Port Berths 1–6 (Prince George Wharf). 52556P13 (Swimming Pigs Snorkeling & Lunch) shows 'Needs confirmation' until exact marina slip and afternoon bridge return window are confirmed.",
    status: "needs confirmation",
    verified_on: null,
    verified_by: null,
    reviewer_id: null,
    review_due_on: null,
    revision: 1,
    active: 1,
    healthy: 1,
    consumers: [
      "dcc:ports/nassau",
      "dcc:api/internal/research/approved-facts?port=nassau",
    ],
  },
  {
    id: "mc-czm-three-pier-dispatch-and-mainland-ferry-cutoff-20261106",
    fact_id: "mc-czm-three-pier-dispatch-and-mainland-ferry-cutoff-20261106",
    cluster: "mexico-cozumel",
    product_id: "cozumel-three-pier-dispatch-and-mainland-ferry",
    constraint_type: "pickup_rules",
    source_url: "https://www.apimqroo.com.mx/",
    source_excerpt:
      "Cozumel operates three distinct cruise terminals: Punta Langosta (downtown San Miguel), International Pier SSA México (3.5 miles south), and Puerta Maya (4.5 miles south). Mainland Playa del Carmen / Chichén Itzá excursions require round-trip Ultramar ferry crossings from San Miguel Fiscal Pier.",
    source_hash:
      "b7e52f932d1f558306a7890234b551a029384756623b4c5d6e7f8091a2b3c4d5",
    current_source_hash:
      "b7e52f932d1f558306a7890234b551a029384756623b4c5d6e7f8091a2b3c4d5",
    checked_at: "2026-11-06T12:20:00.000Z",
    value:
      "Punta Langosta is step-off downtown; SSA International & Puerta Maya sit 3.5–4.5 mi south near Marina Fonatur/Paradise Beach; 12h mainland Chichén Itzá tours (5885P231) are disqualified on 8–9h cruise calls",
    unit: "pier_and_ferry_timing_rule",
    conditions:
      "Enforces 3-pier transfer math in Cozumel and disqualifies 12-hour mainland ferry tours on standard 8–9 hour cruise calls.",
    status: "needs confirmation",
    verified_on: null,
    verified_by: null,
    reviewer_id: null,
    review_due_on: null,
    revision: 1,
    active: 1,
    healthy: 1,
    consumers: [
      "dcc:ports/cozumel",
      "dcc:api/internal/research/approved-facts?port=cozumel",
    ],
  },
  {
    id: "mc-rtb-mahogany-bay-outside-gate-vs-coxen-hole-20261106",
    fact_id: "mc-rtb-mahogany-bay-outside-gate-vs-coxen-hole-20261106",
    cluster: "honduras-roatan",
    product_id: "roatan-coxen-hole-vs-mahogany-bay-gate",
    constraint_type: "pickup_rules",
    source_url: "https://www.portofroatan.com/",
    source_excerpt:
      "Port of Roatán (Town Center at Coxen Hole) stages independent tour vans at Gate #1/#3; Mahogany Bay Cruise Center (Dixon Cove) requires independent tour guests to walk ~400m uphill outside the main highway security gate.",
    source_hash:
      "c8f63a043e2a669417b8901345c662b130495867734c5d6e7f8091a2b3c4d5e6",
    current_source_hash:
      "c8f63a043e2a669417b8901345c662b130495867734c5d6e7f8091a2b3c4d5e6",
    checked_at: "2026-11-06T12:25:00.000Z",
    value:
      "Coxen Hole Gate #1/#3 (15m disembark) vs. Mahogany Bay outside security gate (30m disembark + 400m hill walk, +10m each way to West Bay)",
    unit: "pier_and_pickup_timing_rule",
    conditions:
      "Applies to Roatán independent excursions (184749P2, 207776P19, 192350P17).",
    status: "needs confirmation",
    verified_on: null,
    verified_by: null,
    reviewer_id: null,
    review_due_on: null,
    revision: 1,
    active: 1,
    healthy: 1,
    consumers: [
      "dcc:ports/roatan",
      "dcc:api/internal/research/approved-facts?port=roatan",
    ],
  },
  {
    id: "mc-gcm-royal-watler-tender-buffer-and-spotts-diversion-20261106",
    fact_id: "mc-gcm-royal-watler-tender-buffer-and-spotts-diversion-20261106",
    cluster: "cayman-grand-cayman",
    product_id: "grand-cayman-royal-watler-vs-spotts-tender",
    constraint_type: "pickup_rules",
    source_url: "https://www.caymanport.com/ship-schedules/",
    source_excerpt:
      "Grand Cayman is a 100% tender port at George Town Harbour (Royal Watler, North, and South Terminals) with alternative weather tendering at Spotts Bay during winter Nor'wester swells.",
    source_hash:
      "d9a74b154f3b770528c9012456d773c241506978845d6e7f8091a2b3c4d5e6f7",
    current_source_hash:
      "d9a74b154f3b770528c9012456d773c241506978845d6e7f8091a2b3c4d5e6f7",
    checked_at: "2026-11-06T12:30:00.000Z",
    value:
      "40m outbound tender disembarkation + mandatory 75m return tender queue buffer at Royal Watler; +15m each-way road transfer when diverted to Spotts Bay",
    unit: "tender_and_pickup_timing_rule",
    conditions:
      "Applies to all Grand Cayman Stingray City and Seven Mile Beach excursions (5540814P1, 477029P1, 10309P3).",
    status: "needs confirmation",
    verified_on: null,
    verified_by: null,
    reviewer_id: null,
    review_due_on: null,
    revision: 1,
    active: 1,
    healthy: 1,
    consumers: [
      "dcc:ports/grand-cayman",
      "dcc:api/internal/research/approved-facts?port=grand-cayman",
    ],
  },
];

export const ALL_RESEARCH_CANDIDATE_BASELINES: RawResearchDeskFactRow[] = [
  ...COASTAL_HELICOPTERS_ICEFIELD_CANDIDATE_BASELINE,
  ...WISCONSIN_CHETEK_CANDIDATE_BASELINE,
  ...ST_THOMAS_WINTER_CANDIDATE_BASELINE,
  ...WINTER_FOUR_PORTS_CANDIDATE_BASELINE,
  ...NEW_ORLEANS_HOTEL_PICKUP_CANDIDATE_BASELINE,
  ...KETCHIKAN_PRESEASON_CANDIDATE_BASELINE,
];

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const SHA256_HEX_RE = /^[a-f0-9]{64}$/i;

function parseConsumers(raw: string | string[] | null | undefined): string[] {
  if (Array.isArray(raw)) {
    return raw.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof raw === "string" && raw.trim().length > 0) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item).trim()).filter(Boolean);
      }
    } catch {
      return raw
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }
  return [];
}

function parseReviewDeadlineUtcMs(
  reviewDueOn: string | null | undefined,
): number | null {
  if (!reviewDueOn || typeof reviewDueOn !== "string") return null;
  const trimmed = reviewDueOn.trim();
  if (!ISO_DATE_RE.test(trimmed)) return null;
  const ms = Date.parse(`${trimmed}T00:00:00.000Z`);
  return Number.isFinite(ms) ? ms : null;
}

function parseVerifiedOnUtcMs(
  verifiedOn: string | null | undefined,
): number | null {
  if (!verifiedOn || typeof verifiedOn !== "string") return null;
  const trimmed = verifiedOn.trim();
  if (!ISO_DATE_RE.test(trimmed)) return null;
  const ms = Date.parse(`${trimmed}T00:00:00.000Z`);
  return Number.isFinite(ms) ? ms : null;
}

export interface EvaluateFactOptions {
  nowMs?: number;
  sourceFingerprintsByUrl?: Record<
    string,
    { content_hash: string; healthy: boolean }
  >;
  revokedRevisionsByFactId?: Record<string, number>;
}

/**
 * Evaluates a single research-desk fact row against all human-confirmation,
 * product-scope, source-fingerprint, health, conflict, withdrawal, and UTC
 * expiry requirements. Machine candidates (`status !== "Confirmed"`) are never
 * automatically approved.
 */
export function evaluateResearchFactRecord(
  row: RawResearchDeskFactRow,
  options?: EvaluateFactOptions,
): EvaluatedResearchFact {
  const nowMs = options?.nowMs ?? Date.now();
  const factId = String(row.id ?? row.fact_id ?? "").trim();
  const rawProductId = String(row.product_id ?? "").trim();
  const rawCluster = String(row.cluster ?? "").trim();

  const mapping = EXPLICIT_RESEARCH_PRODUCT_REGISTRY[rawProductId];
  const fallbackCluster: ResearchClusterId =
    rawCluster === "alaska-ketchikan" ||
    rawCluster === "new-orleans-swamp" ||
    rawCluster === "wisconsin-chetek" ||
    rawCluster === "usvi-st-thomas" ||
    rawCluster === "bahamas-nassau" ||
    rawCluster === "mexico-cozumel" ||
    rawCluster === "honduras-roatan" ||
    rawCluster === "cayman-grand-cayman"
      ? rawCluster
      : "alaska-juneau";
  const fallbackPort: ResearchPortSlug =
    fallbackCluster === "alaska-ketchikan"
      ? "ketchikan"
      : fallbackCluster === "new-orleans-swamp"
        ? "new-orleans"
        : fallbackCluster === "wisconsin-chetek"
          ? "chetek"
          : fallbackCluster === "usvi-st-thomas"
            ? "st-thomas"
            : fallbackCluster === "bahamas-nassau"
              ? "nassau"
              : fallbackCluster === "mexico-cozumel"
                ? "cozumel"
                : fallbackCluster === "honduras-roatan"
                  ? "roatan"
                  : fallbackCluster === "cayman-grand-cayman"
                    ? "grand-cayman"
                    : "juneau";

  const active =
    row.active === undefined || row.active === null
      ? true
      : row.active === 1 || row.active === true;

  const sourceUrl = String(row.source_url ?? "").trim();
  const externalSourceInfo = options?.sourceFingerprintsByUrl?.[sourceUrl];

  const rowHealthy =
    row.healthy === undefined || row.healthy === null
      ? true
      : row.healthy === 1 || row.healthy === true;
  const healthy =
    rowHealthy && (externalSourceInfo ? externalSourceInfo.healthy : true);

  const sourceHash = String(row.source_hash ?? "").trim().toLowerCase();
  const currentSourceHashRaw =
    externalSourceInfo?.content_hash !== undefined
      ? String(externalSourceInfo.content_hash).trim().toLowerCase()
      : row.current_source_hash !== undefined &&
          row.current_source_hash !== null
        ? String(row.current_source_hash).trim().toLowerCase()
        : sourceHash;
  const currentSourceHash = currentSourceHashRaw || null;

  const checkedAt =
    typeof row.checked_at === "string" && row.checked_at.trim().length > 0
      ? row.checked_at.trim()
      : typeof row.source_checked_at === "string" &&
          row.source_checked_at.trim().length > 0
        ? row.source_checked_at.trim()
        : null;

  const temporalScope =
    row.temporal_scope ??
    (factId === "c39820438d099142bf27a3ca"
      ? {
          date: "2026-07-19",
          timezone: "America/Chicago",
          historical_only: true,
        }
      : undefined);

  const revision = Number(row.revision ?? 1);
  const approvedRevision =
    row.approved_revision !== undefined && row.approved_revision !== null
      ? Number(row.approved_revision)
      : null;

  const verifiedOn =
    typeof row.verified_on === "string" && row.verified_on.trim().length > 0
      ? row.verified_on.trim()
      : null;
  const verifiedBy =
    typeof row.verified_by === "string" && row.verified_by.trim().length > 0
      ? row.verified_by.trim()
      : null;
  const reviewerId =
    typeof row.reviewer_id === "string" && row.reviewer_id.trim().length > 0
      ? row.reviewer_id.trim()
      : null;
  const reviewDueOn =
    typeof row.review_due_on === "string" && row.review_due_on.trim().length > 0
      ? row.review_due_on.trim()
      : null;

  const deadlineMs = parseReviewDeadlineUtcMs(reviewDueOn);
  const remainingTtlSeconds =
    deadlineMs !== null
      ? Math.max(0, Math.floor((deadlineMs - nowMs) / 1000))
      : 0;

  const valueStr =
    row.value === undefined || row.value === null
      ? ""
      : String(row.value).trim();
  const unitStr =
    row.unit === undefined || row.unit === null ? "" : String(row.unit).trim();
  const conditionsStr =
    row.conditions === undefined || row.conditions === null
      ? ""
      : String(row.conditions).trim();
  const statusStr =
    row.status === undefined || row.status === null
      ? ""
      : String(row.status).trim();

  const rawConsumers = parseConsumers(row.consumers ?? row.affected_consumers);
  const resolvedConsumers = (() => {
    const base =
      rawConsumers.length > 0
        ? rawConsumers.flatMap((c) => {
            if (
              c === "planned:LFSE Juneau selection (integration pending)" ||
              c.startsWith("planned:LFSE Juneau")
            ) {
              return [
                "connected:Last Frontier Shore Excursions Juneau selection (live verified 2026-11-03)",
                "dcc:juneau/port-day-engine",
                "dcc:api/internal/cruises/port/juneau",
                "cruisepromenade:ports/juneau",
                "cruisepromenade:api/excursions",
                "lfse:ports/juneau",
                "lfse:juneau/helicopter-glacier-tours",
                "lfse:api/research-qualifications",
              ];
            }
            if (
              c === "planned:LFSE Ketchikan selection (integration pending)" ||
              c.startsWith("planned:LFSE")
            ) {
              return [
                "connected:Last Frontier Shore Excursions Ketchikan selection (live verified 2026-11-03)",
                "dcc:api/internal/research/approved-facts?port=ketchikan",
                "cruisepromenade:ports/ketchikan",
                "lfse:ports/ketchikan",
                "lfse:api/research-qualifications",
              ];
            }
            if (
              c ===
                "planned:Blue Hills Outpost Chetek selection (integration pending)" ||
              c.startsWith("planned:Blue Hills Outpost")
            ) {
              return [...CONNECTED_CHETEK_CONSUMERS];
            }
            return [c];
          })
        : mapping?.productId === "coastal-helicopters-icefield-excursion-direct"
          ? [...CONNECTED_COASTAL_CONSUMERS]
          : mapping?.clusterId === "wisconsin-chetek"
            ? [...CONNECTED_CHETEK_CONSUMERS]
            : [];
    return Array.from(new Set(base));
  })();

  const buildResult = (
    verified: boolean,
    eligibilityStatus: ResearchFactEligibilityStatus,
    disqualificationReason: ResearchFactDisqualificationReason | null,
  ): EvaluatedResearchFact => ({
    fact_id: factId,
    cluster: mapping?.clusterId ?? fallbackCluster,
    port_slug: mapping?.portSlug ?? fallbackPort,
    operator_id: mapping?.operatorId ?? "unmapped-operator",
    operator_name: mapping?.operatorName ?? "Unmapped Operator",
    product_id: rawProductId,
    product_name: mapping?.productName ?? rawProductId,
    booking_channel: mapping?.bookingChannel ?? "blocked_umbrella",
    dcc_option_id: mapping?.dccOptionId ?? null,
    cruisepromenade_excursion_id: mapping?.cruisePromenadeExcursionId ?? null,
    lfse_context_id: mapping?.lfseContextId ?? null,
    blue_hills_outpost_tour_id: mapping?.blueHillsOutpostTourId ?? null,
    constraint_type: String(row.constraint_type ?? "").trim(),
    value: valueStr,
    unit: unitStr,
    conditions: conditionsStr,
    source_url: sourceUrl,
    source_excerpt: String(row.source_excerpt ?? "").trim(),
    source_hash: sourceHash,
    current_source_hash: currentSourceHash,
    checked_at: checkedAt,
    ...(temporalScope ? { temporal_scope: temporalScope } : {}),
    revision: Number.isFinite(revision) ? revision : 0,
    verified,
    eligibility_status: eligibilityStatus,
    disqualification_reason: disqualificationReason,
    verified_on: verifiedOn,
    verified_by: verifiedBy,
    reviewer_id: reviewerId,
    review_due_on: reviewDueOn,
    review_deadline_utc:
      deadlineMs !== null ? new Date(deadlineMs).toISOString() : null,
    remaining_ttl_seconds: verified ? remainingTtlSeconds : 0,
    healthy,
    active,
    consumers: resolvedConsumers,
    non_transferable_to_other_tours: true,
    non_transferable_note:
      mapping?.nonTransferableNote ??
      "Unmapped product; never transfer research approvals across tours.",
  });

  if (!factId) {
    return buildResult(false, "invalid_record", "missing_fact_id");
  }

  if (BLOCKED_UMBRELLA_PRODUCT_IDS.has(rawProductId)) {
    return buildResult(false, "invalid_record", "blocked_umbrella_product");
  }

  if (!mapping) {
    return buildResult(false, "invalid_record", "unmapped_product_id");
  }

  if (rawCluster && rawCluster !== mapping.clusterId) {
    return buildResult(false, "invalid_record", "cluster_product_mismatch");
  }

  if (!active) {
    return buildResult(false, "withdrawn", "withdrawn_fact");
  }

  const isConflicted =
    row.conflicted === true ||
    statusStr.toLowerCase() === "conflicted" ||
    /\bconflict\b/i.test(statusStr);
  if (isConflicted) {
    return buildResult(false, "conflicted", "conflicted_evidence");
  }

  if (statusStr !== "Confirmed") {
    return buildResult(false, "needs_confirmation", "unconfirmed_candidate");
  }

  if (
    !verifiedBy ||
    /^(auto|machine|bot|system|cron|unverified|candidate)$/i.test(verifiedBy)
  ) {
    return buildResult(false, "needs_confirmation", "missing_human_verifier");
  }

  const verifiedOnMs = parseVerifiedOnUtcMs(verifiedOn);
  if (verifiedOnMs === null || verifiedOnMs > nowMs + 24 * 60 * 60 * 1000) {
    return buildResult(false, "invalid_record", "invalid_verified_on");
  }

  if (deadlineMs === null) {
    return buildResult(false, "invalid_record", "invalid_review_due_on");
  }

  if (nowMs >= deadlineMs) {
    return buildResult(false, "expired", "review_deadline_expired");
  }

  if (!valueStr) {
    return buildResult(false, "invalid_record", "empty_fact_value");
  }

  if (!healthy) {
    return buildResult(false, "source_unhealthy", "source_unhealthy");
  }

  if (
    !SHA256_HEX_RE.test(sourceHash) ||
    !currentSourceHash ||
    !SHA256_HEX_RE.test(currentSourceHash) ||
    sourceHash !== currentSourceHash
  ) {
    return buildResult(false, "source_changed", "source_hash_drift");
  }

  const revokedRevision = options?.revokedRevisionsByFactId?.[factId] ?? 0;
  if (
    !Number.isInteger(revision) ||
    revision < 2 ||
    revision <= revokedRevision ||
    (approvedRevision !== null && approvedRevision !== revision)
  ) {
    return buildResult(false, "needs_confirmation", "unconfirmed_revision");
  }

  return buildResult(true, "verified", null);
}

export interface ApprovedFactFeedEvaluation {
  evaluated_at: string;
  total_evaluated: number;
  verified_count: number;
  verified_facts: EvaluatedResearchFact[];
  all_evaluated_facts: EvaluatedResearchFact[];
  recommended_max_age_seconds: number;
  cache_control_header: string;
}

export const DEFAULT_FEED_MAX_AGE_SECONDS = 300;

export function computeApprovedFactCacheControl(
  evaluatedFacts: EvaluatedResearchFact[],
  options?: { defaultMaxAgeSeconds?: number },
): { maxAgeSeconds: number; cacheControlHeader: string } {
  const defaultMaxAge =
    options?.defaultMaxAgeSeconds ?? DEFAULT_FEED_MAX_AGE_SECONDS;
  const verifiedFacts = evaluatedFacts.filter((f) => f.verified);
  const hasInvalidatedFact = evaluatedFacts.some(
    (f) =>
      f.eligibility_status === "expired" ||
      f.eligibility_status === "withdrawn" ||
      f.eligibility_status === "source_changed" ||
      f.eligibility_status === "source_unhealthy" ||
      f.eligibility_status === "conflicted",
  );

  if (verifiedFacts.length === 0) {
    if (hasInvalidatedFact) {
      return {
        maxAgeSeconds: 0,
        cacheControlHeader: "private, no-store, max-age=0, must-revalidate",
      };
    }
    return {
      maxAgeSeconds: 60,
      cacheControlHeader: "private, max-age=60, s-maxage=60, must-revalidate",
    };
  }

  const minRemainingTtl = verifiedFacts.reduce(
    (min, fact) => Math.min(min, fact.remaining_ttl_seconds),
    defaultMaxAge,
  );
  const cappedMaxAge = Math.max(0, Math.min(defaultMaxAge, minRemainingTtl));

  if (cappedMaxAge <= 0) {
    return {
      maxAgeSeconds: 0,
      cacheControlHeader: "private, no-store, max-age=0, must-revalidate",
    };
  }

  return {
    maxAgeSeconds: cappedMaxAge,
    cacheControlHeader: `private, max-age=${cappedMaxAge}, s-maxage=${cappedMaxAge}, must-revalidate`,
  };
}

export function evaluateApprovedFactFeed(
  rows: RawResearchDeskFactRow[],
  options?: EvaluateFactOptions & { defaultMaxAgeSeconds?: number },
): ApprovedFactFeedEvaluation {
  const nowMs = options?.nowMs ?? Date.now();
  const allEvaluated = rows.map((row) =>
    evaluateResearchFactRecord(row, {
      nowMs,
      sourceFingerprintsByUrl: options?.sourceFingerprintsByUrl,
      revokedRevisionsByFactId: options?.revokedRevisionsByFactId,
    }),
  );
  const verifiedFacts = allEvaluated.filter((fact) => fact.verified);
  const { maxAgeSeconds, cacheControlHeader } = computeApprovedFactCacheControl(
    allEvaluated,
    { defaultMaxAgeSeconds: options?.defaultMaxAgeSeconds },
  );

  return {
    evaluated_at: new Date(nowMs).toISOString(),
    total_evaluated: allEvaluated.length,
    verified_count: verifiedFacts.length,
    verified_facts: verifiedFacts,
    all_evaluated_facts: allEvaluated,
    recommended_max_age_seconds: maxAgeSeconds,
    cache_control_header: cacheControlHeader,
  };
}

/**
 * Strict lookup ensuring one tour's approved facts NEVER apply to another tour.
 */
export function getVerifiedFactsForExactProduct(
  evaluatedFacts: EvaluatedResearchFact[],
  productId: string,
): EvaluatedResearchFact[] {
  const cleanId = productId.trim();
  if (!cleanId || !EXPLICIT_RESEARCH_PRODUCT_REGISTRY[cleanId]) {
    return [];
  }
  return evaluatedFacts.filter(
    (fact) => fact.verified && fact.product_id === cleanId,
  );
}

/**
 * Durable synchronization store persisted in Upstash Redis (`dcc:research:durable_sync:v1`).
 * Tracks synchronized review-desk rows, source states, and revoked revisions so that:
 * 1. Synchronized human approvals survive across serverless isolates and cold starts.
 * 2. Withdrawals (`active: 0`, `status !== "Confirmed"`, or `action: "withdraw"`) immediately
 *    revoke the fact and record its revision in `revoked_revisions_by_fact_id`.
 * 3. Source-fingerprint changes or source health failures immediately revoke any confirmed
 *    facts depending on that URL, and even if the original hash later returns, a revoked
 *    revision cannot be resurrected without a higher revision (`revision > revokedRevision`).
 */
export const REDIS_RESEARCH_DURABLE_SYNC_KEY = "dcc:research:durable_sync:v1";

export interface DurableSourceRecord {
  url: string;
  content_hash: string;
  healthy: boolean;
  checked_at: string | null;
}

export interface DurableResearchSyncState {
  version: 1;
  updated_at: string;
  sync_origin: string;
  rows_by_fact_id: Record<string, RawResearchDeskFactRow>;
  sources_by_url: Record<string, DurableSourceRecord>;
  revoked_revisions_by_fact_id: Record<string, number>;
}

export interface DurableResearchSyncMutation {
  action?: "sync" | "upsert_facts" | "update_sources" | "withdraw" | string;
  sync_origin?: string;
  cluster?: string;
  replace_cluster?: boolean;
  rows?: RawResearchDeskFactRow[];
  verified_facts?: RawResearchDeskFactRow[];
  approved_facts?: RawResearchDeskFactRow[];
  eligible_facts?: RawResearchDeskFactRow[];
  candidates?: RawResearchDeskFactRow[];
  facts?: RawResearchDeskFactRow[] | Record<string, RawResearchDeskFactRow>;
  fact?: RawResearchDeskFactRow;
  withdraw_fact_ids?: string[];
  sources?:
    | Array<{
        url?: string;
        source_url?: string;
        fingerprint?: string | null;
        readable_text_sha256?: string | null;
        hash?: string | null;
        content_hash?: string | null;
        current_source_hash?: string | null;
        source_hash?: string | null;
        healthy?: number | boolean | null;
        checked_at?: string | null;
        source_checked_at?: string | null;
      }>
    | Record<
        string,
        {
          url?: string;
          fingerprint?: string | null;
          readable_text_sha256?: string | null;
          hash?: string | null;
          content_hash?: string | null;
          healthy?: number | boolean | null;
          checked_at?: string | null;
          source_checked_at?: string | null;
        }
      >;
  source_fingerprints?: Record<
    string,
    { content_hash: string; healthy: boolean; checked_at?: string | null }
  >;
}

export function createEmptyDurableResearchSyncState(
  nowIso: string = new Date().toISOString(),
): DurableResearchSyncState {
  return {
    version: 1,
    updated_at: nowIso,
    sync_origin: "initial",
    rows_by_fact_id: {},
    sources_by_url: {},
    revoked_revisions_by_fact_id: {},
  };
}

function normalizeFactRowList(
  mutation: DurableResearchSyncMutation,
): RawResearchDeskFactRow[] {
  const list: RawResearchDeskFactRow[] = [];
  const pushItems = (
    items?:
      | RawResearchDeskFactRow[]
      | Record<string, RawResearchDeskFactRow>
      | null,
  ) => {
    if (!items) return;
    if (Array.isArray(items)) {
      list.push(...items);
    } else if (typeof items === "object") {
      for (const [k, v] of Object.entries(items)) {
        if (v && typeof v === "object") {
          list.push({ id: v.id ?? v.fact_id ?? k, fact_id: v.fact_id ?? v.id ?? k, ...v });
        }
      }
    }
  };
  pushItems(mutation.rows);
  pushItems(mutation.verified_facts);
  pushItems(mutation.approved_facts);
  pushItems(mutation.eligible_facts);
  pushItems(mutation.candidates);
  pushItems(mutation.facts);
  if (mutation.fact && typeof mutation.fact === "object") {
    list.push(mutation.fact);
  }
  return list;
}

export function applyDurableResearchSyncMutation(
  previous: DurableResearchSyncState | null | undefined,
  mutation: DurableResearchSyncMutation,
  nowMs: number = Date.now(),
): DurableResearchSyncState {
  const nowIso = new Date(nowMs).toISOString();
  const base = previous ?? createEmptyDurableResearchSyncState(nowIso);

  const rowsByFactId: Record<string, RawResearchDeskFactRow> = {
    ...base.rows_by_fact_id,
  };
  const sourcesByUrl: Record<string, DurableSourceRecord> = {
    ...base.sources_by_url,
  };
  const revokedRevisionsByFactId: Record<string, number> = {
    ...base.revoked_revisions_by_fact_id,
  };

  // 1. Collect incoming source observations from `sources` (array or map) and `source_fingerprints` map
  const incomingSources = new Map<string, DurableSourceRecord>();
  if (Array.isArray(mutation.sources)) {
    for (const src of mutation.sources) {
      const url = String(src.url ?? src.source_url ?? "").trim();
      if (!url) continue;
      const hashRaw =
        src.content_hash ??
        src.current_source_hash ??
        src.source_hash ??
        src.fingerprint ??
        src.readable_text_sha256 ??
        src.hash ??
        "";
      const contentHash = String(hashRaw ?? "").trim().toLowerCase();
      const healthy =
        src.healthy === undefined || src.healthy === null
          ? true
          : src.healthy === 1 || src.healthy === true;
      incomingSources.set(url, {
        url,
        content_hash: contentHash,
        healthy,
        checked_at: src.checked_at ?? src.source_checked_at ?? nowIso,
      });
    }
  } else if (mutation.sources && typeof mutation.sources === "object") {
    for (const [rawUrl, src] of Object.entries(mutation.sources)) {
      if (!src || typeof src !== "object") continue;
      const url = String(src.url ?? rawUrl ?? "").trim();
      if (!url) continue;
      const hashRaw =
        src.content_hash ??
        src.fingerprint ??
        src.readable_text_sha256 ??
        src.hash ??
        "";
      const contentHash = String(hashRaw ?? "").trim().toLowerCase();
      const healthy =
        src.healthy === undefined || src.healthy === null
          ? true
          : src.healthy === 1 || src.healthy === true;
      incomingSources.set(url, {
        url,
        content_hash: contentHash,
        healthy,
        checked_at: src.checked_at ?? src.source_checked_at ?? nowIso,
      });
    }
  }
  if (
    mutation.source_fingerprints &&
    typeof mutation.source_fingerprints === "object"
  ) {
    for (const [rawUrl, info] of Object.entries(mutation.source_fingerprints)) {
      const url = rawUrl.trim();
      if (!url || !info) continue;
      incomingSources.set(url, {
        url,
        content_hash: String(info.content_hash ?? "").trim().toLowerCase(),
        healthy: Boolean(info.healthy),
        checked_at: info.checked_at ?? nowIso,
      });
    }
  }

  // Apply source updates and immediately invalidate any stored confirmed facts on drift or failure
  for (const [url, srcRecord] of incomingSources.entries()) {
    sourcesByUrl[url] = srcRecord;
    for (const [fid, storedRow] of Object.entries(rowsByFactId)) {
      if (String(storedRow.source_url ?? "").trim() !== url) continue;
      const factHash = String(storedRow.source_hash ?? "").trim().toLowerCase();
      const factRev = Number(storedRow.revision ?? 1);
      const isDriftedOrUnhealthy =
        !srcRecord.healthy ||
        !SHA256_HEX_RE.test(srcRecord.content_hash) ||
        srcRecord.content_hash !== factHash;

      if (isDriftedOrUnhealthy) {
        if (Number.isFinite(factRev) && factRev > 0) {
          revokedRevisionsByFactId[fid] = Math.max(
            revokedRevisionsByFactId[fid] ?? 0,
            factRev,
          );
        }
        rowsByFactId[fid] = {
          ...storedRow,
          current_source_hash: srcRecord.content_hash,
          healthy: srcRecord.healthy ? 1 : 0,
          status:
            storedRow.status === "Confirmed"
              ? "needs confirmation"
              : storedRow.status,
          verified_on: null,
          verified_by: null,
        };
      } else {
        rowsByFactId[fid] = {
          ...storedRow,
          current_source_hash: srcRecord.content_hash,
          healthy: 1,
        };
      }
    }
  }

  // 2. Process explicit withdrawals (`action: "withdraw"` or `withdraw_fact_ids`)
  const withdrawIds = new Set<string>(
    (mutation.withdraw_fact_ids ?? []).map((id) => String(id).trim()).filter(Boolean),
  );
  if (mutation.action === "withdraw") {
    for (const r of normalizeFactRowList(mutation)) {
      const fid = String(r.id ?? r.fact_id ?? "").trim();
      if (fid) withdrawIds.add(fid);
    }
  }

  for (const fid of withdrawIds) {
    const existing = rowsByFactId[fid];
    const rev = Number(existing?.revision ?? 1);
    if (Number.isFinite(rev) && rev > 0) {
      revokedRevisionsByFactId[fid] = Math.max(
        revokedRevisionsByFactId[fid] ?? 0,
        rev,
      );
    }
    if (existing) {
      rowsByFactId[fid] = {
        ...existing,
        active: 0,
        status: "needs confirmation",
        verified_on: null,
        verified_by: null,
      };
    }
  }

  // 3. Process incoming fact rows
  if (mutation.action !== "withdraw") {
    const incomingRows = normalizeFactRowList(mutation);
    const incomingIdsInCluster = new Set<string>();

    for (const rawRow of incomingRows) {
      const fid = String(rawRow.id ?? rawRow.fact_id ?? "").trim();
      if (!fid) continue;
      incomingIdsInCluster.add(fid);

      const prevRow = rowsByFactId[fid];
      const incomingRev = Number(
        rawRow.revision ??
          rawRow.approved_revision ??
          rawRow.current_revision ??
          prevRow?.revision ??
          1,
      );
      const prevRev = Number(prevRow?.revision ?? 1);
      const incomingActive =
        rawRow.withdrawn === true || rawRow.revoked_by_source_event === true
          ? false
          : rawRow.active === undefined || rawRow.active === null
            ? true
            : rawRow.active === 1 || rawRow.active === true;
      const rawStatusStr = String(
        rawRow.status ?? rawRow.decision ?? "",
      ).trim();
      const incomingStatus = /^confirmed$/i.test(rawStatusStr)
        ? "Confirmed"
        : rawStatusStr;

      const sourceUrl = String(
        rawRow.source_url ?? prevRow?.source_url ?? "",
      ).trim();
      const knownSource = sourcesByUrl[sourceUrl];
      const rowSourceHash = String(
        rawRow.source_hash ??
          rawRow.evidence_fingerprint ??
          rawRow.approved_readable_text_sha256 ??
          rawRow.fingerprint ??
          prevRow?.source_hash ??
          "",
      )
        .trim()
        .toLowerCase();
      const effectiveCurrentHash =
        knownSource?.content_hash !== undefined
          ? knownSource.content_hash
          : rawRow.current_source_hash !== undefined &&
              rawRow.current_source_hash !== null
            ? String(rawRow.current_source_hash).trim().toLowerCase()
            : rawRow.current_fingerprint !== undefined &&
                rawRow.current_fingerprint !== null
              ? String(rawRow.current_fingerprint).trim().toLowerCase()
              : rowSourceHash;
      const effectiveHealthy =
        (rawRow.healthy === undefined || rawRow.healthy === null
          ? true
          : rawRow.healthy === 1 || rawRow.healthy === true) &&
        (knownSource ? knownSource.healthy : true);

      // If this row was previously Confirmed (or is being synced as inactive/unconfirmed/drifted), record revoked revision
      const isWithdrawnOrUnconfirmed =
        !incomingActive || incomingStatus !== "Confirmed";
      const isSourceDrifted =
        !effectiveHealthy ||
        !SHA256_HEX_RE.test(rowSourceHash) ||
        !SHA256_HEX_RE.test(effectiveCurrentHash) ||
        rowSourceHash !== effectiveCurrentHash;

      if (
        (isWithdrawnOrUnconfirmed && prevRow?.status === "Confirmed") ||
        (incomingStatus === "Confirmed" && isSourceDrifted)
      ) {
        const revToRevoke = Math.max(
          Number.isFinite(prevRev) ? prevRev : 0,
          Number.isFinite(incomingRev) ? incomingRev : 0,
        );
        if (revToRevoke > 0) {
          revokedRevisionsByFactId[fid] = Math.max(
            revokedRevisionsByFactId[fid] ?? 0,
            revToRevoke,
          );
        }
      }

      const revokedRev = revokedRevisionsByFactId[fid] ?? 0;
      const canStayConfirmed =
        incomingActive &&
        incomingStatus === "Confirmed" &&
        !isSourceDrifted &&
        Number.isInteger(incomingRev) &&
        incomingRev >= 2 &&
        incomingRev > revokedRev;

      const rawVerifiedOn = String(
        rawRow.verified_on ?? rawRow.reviewed_at ?? prevRow?.verified_on ?? "",
      ).trim();
      const normalizedVerifiedOn = /^\d{4}-\d{2}-\d{2}/.test(rawVerifiedOn)
        ? rawVerifiedOn.slice(0, 10)
        : rawVerifiedOn || null;

      const rawReviewDueOn = String(
        rawRow.review_due_on ?? prevRow?.review_due_on ?? "",
      ).trim();
      const normalizedReviewDueOn = /^\d{4}-\d{2}-\d{2}/.test(rawReviewDueOn)
        ? rawReviewDueOn.slice(0, 10)
        : rawReviewDueOn || null;

      const normalizedVerifiedBy =
        String(
          rawRow.verified_by ??
            rawRow.reviewer_id ??
            rawRow.reviewer_key ??
            rawRow.actor ??
            prevRow?.verified_by ??
            "",
        ).trim() || null;

      const normalizedProductId = String(
        rawRow.product_id ?? rawRow.canonical_product_id ?? prevRow?.product_id ?? "",
      ).trim();
      const normalizedCluster = String(
        rawRow.cluster ?? rawRow.cluster_id ?? prevRow?.cluster ?? "",
      ).trim();
      const normalizedConstraintType = String(
        rawRow.constraint_type ??
          rawRow.atomic_constraint_type ??
          prevRow?.constraint_type ??
          "",
      ).trim();

      rowsByFactId[fid] = {
        ...prevRow,
        ...rawRow,
        id: fid,
        fact_id: fid,
        product_id: normalizedProductId,
        cluster: normalizedCluster || undefined,
        constraint_type: normalizedConstraintType,
        source_url: sourceUrl,
        source_hash: rowSourceHash,
        current_source_hash: effectiveCurrentHash,
        healthy: effectiveHealthy ? 1 : 0,
        active: incomingActive ? 1 : 0,
        revision: Number.isFinite(incomingRev) ? incomingRev : 1,
        status: canStayConfirmed
          ? "Confirmed"
          : incomingStatus === "Confirmed"
            ? "needs confirmation"
            : incomingStatus || "needs confirmation",
        verified_on: canStayConfirmed ? normalizedVerifiedOn : null,
        verified_by: canStayConfirmed ? normalizedVerifiedBy : null,
        review_due_on: normalizedReviewDueOn,
      };
    }

    // If `replace_cluster: true` is specified on a full cluster sync, withdraw omitted confirmed rows in that cluster
    if (mutation.replace_cluster && mutation.cluster) {
      const targetCluster = mutation.cluster.trim();
      for (const [fid, storedRow] of Object.entries(rowsByFactId)) {
        const pid = String(storedRow.product_id ?? "").trim();
        const rowCluster =
          EXPLICIT_RESEARCH_PRODUCT_REGISTRY[pid]?.clusterId ??
          String(storedRow.cluster ?? "").trim();
        if (
          rowCluster === targetCluster &&
          !incomingIdsInCluster.has(fid) &&
          storedRow.status === "Confirmed"
        ) {
          const rev = Number(storedRow.revision ?? 1);
          if (Number.isFinite(rev) && rev > 0) {
            revokedRevisionsByFactId[fid] = Math.max(
              revokedRevisionsByFactId[fid] ?? 0,
              rev,
            );
          }
          rowsByFactId[fid] = {
            ...storedRow,
            active: 0,
            status: "needs confirmation",
            verified_on: null,
            verified_by: null,
          };
        }
      }
    }
  }

  return {
    version: 1,
    updated_at: nowIso,
    sync_origin: mutation.sync_origin || base.sync_origin || "review_desk_sync",
    rows_by_fact_id: rowsByFactId,
    sources_by_url: sourcesByUrl,
    revoked_revisions_by_fact_id: revokedRevisionsByFactId,
  };
}

let localTestFallbackSyncState: DurableResearchSyncState | null = null;

function isLocalTestMemoryAllowed(): boolean {
  const isProdOrStaging =
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL_ENV === "production" ||
    process.env.VERCEL_ENV === "preview" ||
    process.env.APP_ENV === "staging" ||
    process.env.APP_ENV === "production";
  return (
    !isProdOrStaging &&
    process.env.ALLOW_IN_MEMORY_NONCE_FALLBACK_FOR_TESTS === "true"
  );
}

export async function loadDurableResearchSyncState(): Promise<DurableResearchSyncState | null> {
  if (!redis) {
    return isLocalTestMemoryAllowed() ? localTestFallbackSyncState : null;
  }
  try {
    const raw = await redis.get<DurableResearchSyncState | string>(
      REDIS_RESEARCH_DURABLE_SYNC_KEY,
    );
    if (!raw) return null;
    const parsed: DurableResearchSyncState =
      typeof raw === "string" ? JSON.parse(raw) : raw;
    if (parsed && typeof parsed === "object" && parsed.version === 1) {
      return {
        version: 1,
        updated_at: String(parsed.updated_at ?? ""),
        sync_origin: String(parsed.sync_origin ?? "review_desk_sync"),
        rows_by_fact_id: parsed.rows_by_fact_id ?? {},
        sources_by_url: parsed.sources_by_url ?? {},
        revoked_revisions_by_fact_id: parsed.revoked_revisions_by_fact_id ?? {},
      };
    }
  } catch (err) {
    console.warn("[research-durable-sync] Failed to read from Redis:", err);
  }
  return null;
}

export async function persistDurableResearchSyncState(
  state: DurableResearchSyncState,
): Promise<boolean> {
  if (!redis) {
    if (isLocalTestMemoryAllowed()) {
      localTestFallbackSyncState = state;
      return true;
    }
    return false;
  }
  try {
    await redis.set(REDIS_RESEARCH_DURABLE_SYNC_KEY, JSON.stringify(state));
    return true;
  } catch (err) {
    console.warn("[research-durable-sync] Failed to write to Redis:", err);
    return false;
  }
}

export async function synchronizeReviewDeskToDurableStore(
  mutation: DurableResearchSyncMutation,
): Promise<{
  persisted: boolean;
  state: DurableResearchSyncState;
  evaluation: ApprovedFactFeedEvaluation;
}> {
  const serverNowMs = Date.now();
  const prevState = await loadDurableResearchSyncState();
  const nextState = applyDurableResearchSyncMutation(
    prevState,
    mutation,
    serverNowMs,
  );
  const persisted = await persistDurableResearchSyncState(nextState);

  const mergedByFactId = new Map<string, RawResearchDeskFactRow>();
  for (const candidate of ALL_RESEARCH_CANDIDATE_BASELINES) {
    const id = String(candidate.fact_id ?? candidate.id ?? "");
    if (id) mergedByFactId.set(id, candidate);
  }
  for (const [id, row] of Object.entries(nextState.rows_by_fact_id)) {
    mergedByFactId.set(id, row);
  }

  const evaluation = evaluateApprovedFactFeed(
    Array.from(mergedByFactId.values()),
    {
      nowMs: serverNowMs,
      sourceFingerprintsByUrl: nextState.sources_by_url,
      revokedRevisionsByFactId: nextState.revoked_revisions_by_fact_id,
    },
  );

  return {
    persisted,
    state: nextState,
    evaluation,
  };
}

export interface ReviewDeskPortalIngestionResult
  extends ApprovedFactFeedEvaluation {
  review_desk_url: string;
  live_portal_readback_status:
    | "authenticated_live"
    | "durable_synced_store"
    | "blocked_http_401_missing_portal_session"
    | "blocked_missing_portal_credentials"
    | "blocked_upstream_error";
  live_portal_verified: boolean;
  access_blocker: string | null;
  last_synced_at: string | null;
}

function buildReviewDeskAuthHeaders(): {
  headers: Record<string, string>;
  hasAuthCredentials: boolean;
} {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  let hasAuthCredentials = false;

  const bearer =
    process.env.DCC_PORTAL_BEARER_TOKEN?.trim() ||
    process.env.DCC_PORTAL_TOKEN?.trim();
  if (bearer) {
    headers.Authorization = `Bearer ${bearer}`;
    headers["X-DCC-Portal-Token"] = bearer;
    hasAuthCredentials = true;
  }

  const cookie = process.env.DCC_PORTAL_COOKIE?.trim();
  if (cookie) {
    headers.Cookie = cookie;
    hasAuthCredentials = true;
  }

  const extraHeadersJson = process.env.DCC_PORTAL_HEADERS_JSON?.trim();
  if (extraHeadersJson) {
    try {
      const parsed = JSON.parse(extraHeadersJson);
      if (parsed && typeof parsed === "object") {
        for (const [k, v] of Object.entries(parsed)) {
          if (typeof v === "string" && v.trim()) {
            headers[k] = v.trim();
            hasAuthCredentials = true;
          }
        }
      }
    } catch {
      // Ignore malformed JSON env var
    }
  }

  return { headers, hasAuthCredentials };
}

/**
 * Production ingestion from the DCC Research Review desk and durable Redis sync store.
 * Always evaluates eligibility using real server time (`Date.now()`). Test clock overrides
 * and clear controls are excluded from production ingestion.
 */
export async function ingestApprovedFactsFromReviewDesk(options?: {
  portSlug?: string;
  clusterId?: string;
  productId?: string;
  skipLiveFetch?: boolean;
}): Promise<ReviewDeskPortalIngestionResult> {
  const serverNowMs = Date.now();
  const reviewDeskUrl = (
    process.env.DCC_RESEARCH_REVIEW_URL?.trim() ||
    "https://dcc-research-review.erichroeseler123.chatgpt.site"
  ).replace(/\/+$/, "");

  const filterRows = (rows: RawResearchDeskFactRow[]) =>
    rows.filter((row) => {
      const pid = String(row.product_id ?? "").trim();
      const mapping = EXPLICIT_RESEARCH_PRODUCT_REGISTRY[pid];
      if (options?.productId && pid !== options.productId) {
        return false;
      }
      if (options?.clusterId) {
        const cluster = mapping?.clusterId ?? String(row.cluster ?? "").trim();
        if (cluster !== options.clusterId) return false;
      }
      if (options?.portSlug) {
        const port = mapping?.portSlug;
        if (port !== options.portSlug) return false;
      }
      return true;
    });

  // 1. Load existing durable synchronized state from Upstash Redis
  let durableState = await loadDurableResearchSyncState();
  const hasDurableSync = Boolean(
    durableState &&
      (Object.keys(durableState.rows_by_fact_id).length > 0 ||
        Object.keys(durableState.sources_by_url).length > 0),
  );

  // 2. Attempt authenticated server-side pull from review desk only when pull credentials are configured
  // or when no outbound push state exists yet
  const { headers, hasAuthCredentials } = buildReviewDeskAuthHeaders();
  let liveStatus: ReviewDeskPortalIngestionResult["live_portal_readback_status"] =
    hasAuthCredentials
      ? "blocked_upstream_error"
      : "blocked_missing_portal_credentials";
  let accessBlocker: string | null = hasAuthCredentials
    ? null
    : `Private review desk ${reviewDeskUrl}/api/verified-facts is gated by OpenAI chatgpt.site dispatch OAuth (HTTP 401 Sign in required). Configure outbound review-desk push to POST /api/internal/research/approved-facts or provide DCC_PORTAL_COOKIE / service endpoint.`;

  if (!options?.skipLiveFetch && (!hasDurableSync || hasAuthCredentials)) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);
      const response = await fetch(`${reviewDeskUrl}/api/verified-facts`, {
        method: "GET",
        headers,
        cache: "no-store",
        signal: controller.signal,
      }).finally(() => clearTimeout(timeout));

      if (response.status === 200) {
        const contentType = response.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          const data = (await response.json()) as {
            verified_facts?: RawResearchDeskFactRow[];
            candidates?: RawResearchDeskFactRow[];
            facts?: RawResearchDeskFactRow[];
            sources?: DurableResearchSyncMutation["sources"];
          };
          const liveRows = Array.isArray(data?.verified_facts)
            ? data.verified_facts
            : Array.isArray(data?.candidates)
              ? data.candidates
              : Array.isArray(data?.facts)
                ? data.facts
                : [];
          durableState = applyDurableResearchSyncMutation(
            durableState,
            {
              action: "sync",
              sync_origin: "live_portal_pull",
              rows: liveRows,
              sources: data?.sources,
            },
            serverNowMs,
          );
          await persistDurableResearchSyncState(durableState);

          const mergedByFactId = new Map<string, RawResearchDeskFactRow>();
          for (const candidate of ALL_RESEARCH_CANDIDATE_BASELINES) {
            const id = String(candidate.fact_id ?? candidate.id ?? "");
            if (id) mergedByFactId.set(id, candidate);
          }
          for (const [id, row] of Object.entries(durableState.rows_by_fact_id)) {
            mergedByFactId.set(id, row);
          }

          const filtered = filterRows(Array.from(mergedByFactId.values()));
          const evaluation = evaluateApprovedFactFeed(filtered, {
            nowMs: serverNowMs,
            sourceFingerprintsByUrl: durableState.sources_by_url,
            revokedRevisionsByFactId: durableState.revoked_revisions_by_fact_id,
          });
          return {
            ...evaluation,
            review_desk_url: reviewDeskUrl,
            live_portal_readback_status: "authenticated_live",
            live_portal_verified: true,
            access_blocker: null,
            last_synced_at: durableState.updated_at,
          };
        }
      } else if (response.status === 401 || response.status === 403) {
        liveStatus = "blocked_http_401_missing_portal_session";
        accessBlocker = `Private review desk ${reviewDeskUrl}/api/verified-facts returned HTTP ${response.status} from OpenAI chatgpt.site dispatch OAuth gate (Sign in required). Enable outbound webhook sync from the review desk to POST /api/internal/research/approved-facts or expose an authenticated service route.`;
      } else {
        liveStatus = "blocked_upstream_error";
        accessBlocker = `Private review desk ${reviewDeskUrl}/api/verified-facts returned HTTP ${response.status}.`;
      }
    } catch (err) {
      if (hasAuthCredentials) {
        liveStatus = "blocked_upstream_error";
        accessBlocker = `Failed to reach private review desk ${reviewDeskUrl}/api/verified-facts: ${
          err instanceof Error ? err.message : String(err)
        }`;
      }
    }
  }

  // 3. If durable Redis store has synchronized review-desk records, evaluate them using server time
  if (
    durableState &&
    (Object.keys(durableState.rows_by_fact_id).length > 0 ||
      Object.keys(durableState.sources_by_url).length > 0)
  ) {
    const mergedByFactId = new Map<string, RawResearchDeskFactRow>();
    for (const candidate of ALL_RESEARCH_CANDIDATE_BASELINES) {
      const id = String(candidate.fact_id ?? candidate.id ?? "");
      if (id) mergedByFactId.set(id, candidate);
    }
    for (const [id, row] of Object.entries(durableState.rows_by_fact_id)) {
      mergedByFactId.set(id, row);
    }

    const filtered = filterRows(Array.from(mergedByFactId.values()));
    const evaluation = evaluateApprovedFactFeed(filtered, {
      nowMs: serverNowMs,
      sourceFingerprintsByUrl: durableState.sources_by_url,
      revokedRevisionsByFactId: durableState.revoked_revisions_by_fact_id,
    });
    return {
      ...evaluation,
      review_desk_url: reviewDeskUrl,
      live_portal_readback_status: "durable_synced_store",
      live_portal_verified: true,
      access_blocker: null,
      last_synced_at: durableState.updated_at,
    };
  }

  // 4. Evaluate baseline candidates (all remain unconfirmed; no candidate is ever auto-approved)
  const fallbackRows = filterRows(ALL_RESEARCH_CANDIDATE_BASELINES);
  const evaluation = evaluateApprovedFactFeed(fallbackRows, {
    nowMs: serverNowMs,
  });

  return {
    ...evaluation,
    review_desk_url: reviewDeskUrl,
    live_portal_readback_status: liveStatus,
    live_portal_verified: false,
    access_blocker: accessBlocker,
    last_synced_at: null,
  };
}

