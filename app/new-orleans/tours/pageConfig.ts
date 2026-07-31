export interface NolaFareHarborProduct {
  id: string;
  title: string;
  category: string;
  operatorName: string;
  description: string;
  bestFor?: string;
  imageUrl: string;
  imageAlt?: string;
  imagePresentation?: "standard" | "editorial";
  ctaLabel?: string;
  slug: string;
  relatedTourSlug: string;

  // Booking variants for multi-option products
  bookingVariants?: {
    label: string;
    itemId: string;
    flowId: string;
    bookingUrl: string;
  }[];

  // New optional detail fields for Step 4
  detailSummary?: string;
  bestFit?: string[];
  notIdealFor?: string[];
  childrenConsiderations?: string[];
  confirmedInclusions?: string[];
  bookingConfirmations?: string[];
  physicalFormat?: {
    walking?: string;
    riding?: string;
    seating?: string;
    exposure?: string;
  };
  logistics?: {
    meetingPoint?: string;
    pickup?: string;
    transportation?: string;
  };
  historicalContextNote?: string;

  companyShortname: string;
  itemId?: string;
  flowId?: string;

  detailPageTitle: string;
  metaDescription: string;
  durationLabel?: string;
  transportationSummary?: string;
  pickupSummary?: string;
  wikimediaId?: string;
  representativeCaption?: string;
  highlights?: string[];
  bookingNote?: string;
}

export const NEW_ORLEANS_ORIGIN = "https://www.welcometoneworleanstours.com";
export const NEW_ORLEANS_TOURS_PATH = "/new-orleans/tours";
export const FAREHARBOR_ASN = "aktourcenter";

export const getFareHarborUrl = (companyShortname: string, itemId?: string | number, flowId?: string | number) => {
  let url = `https://fareharbor.com/embeds/book/${companyShortname}/`;
  if (itemId) {
    url += `items/${itemId}/`;
  }
  const params = new URLSearchParams();
  params.append("asn", FAREHARBOR_ASN);
  if (flowId) {
    params.append("flow", String(flowId));
  }
  params.append("full-items", "yes");
  return `${url}?${params.toString()}`;
};

export const STOREFRONT_PRODUCTS: NolaFareHarborProduct[] = [
  {
    id: "southernstyle-city-tour",
    companyShortname: "southernstyletours",
    itemId: "51942",
    flowId: "4344",
    title: "City Tour Of New Orleans",
    category: "City Tours",
    operatorName: "Southern Style Tours",
    description: "A comprehensive overview of New Orleans covering the French Quarter, Garden District, and more.",
    bestFor: "Best for first-time visitors",
    imageUrl: "/images/travel-markets/new-orleans/french-quarter-street.jpg",
    imageAlt: "French Quarter street in New Orleans",
    slug: "city-tour-of-new-orleans",
    relatedTourSlug: "oak-alley-or-laura-plantation-tour",
    detailPageTitle: "City Tour Of New Orleans | Welcome to New Orleans Tours",
    metaDescription: "A comprehensive overview of New Orleans covering the French Quarter, Garden District, and more. Best for first-time visitors.",
    durationLabel: "Duration varies by traffic and route. Check estimates during booking.",
    transportationSummary: "Minibus transportation",
    pickupSummary: "Pickup availability and zones are confirmed during booking.",
    highlights: [
      "French Quarter",
      "Tremé",
      "Esplanade Avenue",
      "Garden District",
      "Metairie Cemetery",
      "Warehouse District"
    ],
    detailSummary: "A broad city overview offered through Southern Style Tours.",
    bestFit: [
      "First-time visitors seeking a broad introduction",
      "Groups with roughly three hours available"
    ],
    notIdealFor: [
      "Those looking for deep dives into single historical sites",
      "Visitors wanting a highly active or outdoor-only experience"
    ],
    childrenConsiderations: [
      "Often a better match for groups prioritizing a calmer format."
    ],
    confirmedInclusions: [],
    bookingConfirmations: [
      "Current itinerary and route",
      "Exact schedule and departure time",
      "Transportation format",
      "Pickup availability and zones"
    ],
    physicalFormat: {
      riding: "A riding-focused city overview offered through the participating operator."
    },
    logistics: {
      transportation: "Transportation format and availability are confirmed during booking."
    },
  },
  {
    id: "southernstyle-plantation",
    companyShortname: "southernstyletours",
    itemId: "83002",
    flowId: "4344",
    title: "Oak Alley Or Laura Plantation Tour",
    category: "Plantation Tours",
    operatorName: "Southern Style Tours",
    description: "Journey outside the city to explore historic Louisiana plantations and learn their complex history.",
    bestFor: "Best for a longer day trip",
    imageUrl: "/images/travel-markets/new-orleans/french-quarter-street.jpg",
    imagePresentation: "editorial",
    slug: "oak-alley-or-laura-plantation-tour",
    relatedTourSlug: "city-tour-of-new-orleans",
    detailPageTitle: "Oak Alley Or Laura Plantation Tour | Welcome to New Orleans Tours",
    metaDescription: "Journey outside the city to explore historic Louisiana plantations and learn their complex history. Best for a longer day trip.",
    durationLabel: "Tour duration varies. Exact schedule confirmed during booking.",
    transportationSummary: "Minibus transportation",
    bookingNote: "Pickup and return timing may make the complete outing longer. The available plantation option, current itinerary and exact schedule are confirmed during booking.",
    highlights: [
      "History and architecture connected to either Oak Alley or Laura Plantation",
      "Historic grounds and gardens",
      "The lives of people connected to the plantation sites",
      "The history of slavery represented at these locations"
    ],
    wikimediaId: "oak-alley-front",
    representativeCaption: "Representative image: Oak Alley Plantation. Tour selection may include Oak Alley or Laura Plantation.",
    detailSummary: "A historic-site excursion to Oak Alley or Laura Plantation, with the selected site and current logistics confirmed during booking.",
    bestFit: [
      "Visitors interested in a historic-site excursion",
      "Visitors preparing for a longer outing outside the city"
    ],
    notIdealFor: [
      "Visitors with less than half a day available",
      "Those looking for a fast-paced or strictly outdoor nature experience"
    ],
    childrenConsiderations: [
      "Often a better match for older children or teens with historical interest. Verify child eligibility and age requirements in checkout."
    ],
    confirmedInclusions: [],
    bookingConfirmations: [
      "Available plantation options (Oak Alley or Laura)",
      "Exact schedule and departure time",
      "Transportation format",
      "Walking and standing requirements"
    ],
    physicalFormat: {
      walking: "Confirm the current format and participation requirements during booking.",
      riding: "Extended travel time to and from the sites"
    },
    logistics: {
      transportation: "Transportation and return timing are confirmed during booking."
    },
    historicalContextNote: "Plantation sites in Louisiana are inextricably connected to the history of slavery and forced labor. The depth and focus of historical interpretation vary by site. We encourage visitors to review the selected plantation’s specific historical program and educational approach."
  },
  {
    id: "ragincajun-covered-boat",
    companyShortname: "ragincajuntours",
    itemId: "590176",
    flowId: "392449",
    title: "Covered Tour Boat",
    category: "Swamp Tours",
    operatorName: "Ragin Cajun Tours",
    description: "A covered tour-boat experience offered through Ragin Cajun Tours.",
    bestFor: "Covered tour boat",
    imageUrl: "/images/travel-markets/new-orleans/covered-boat-swamp.png",
    imageAlt: "Covered tour boat in a Louisiana swamp",
    slug: "covered-tour-boat",
    relatedTourSlug: "ragin-cajun-airboat-options",
    detailPageTitle: "Covered Tour Boat Swamp Ride | Welcome to New Orleans Tours",
    metaDescription: "A covered tour-boat experience offered through Ragin Cajun Tours.",
    durationLabel: "Duration confirmed during booking.",
    transportationSummary: "Covered boat format",
    pickupSummary: "Transportation options are confirmed during booking.",
    highlights: [
      "A covered-boat format"
    ],
    detailSummary: "A covered tour-boat experience.",
    bestFit: [
      "Visitors seeking a relaxed, comfortable ride",
      "Groups wanting shade and a lower-intensity travel experience"
    ],
    notIdealFor: [
      "Those looking for high speeds or thrills"
    ],
    childrenConsiderations: [
      "Often a better match for groups prioritizing a calmer format. Verify child eligibility and age requirements in checkout."
    ],
    confirmedInclusions: [],
    bookingConfirmations: [
      "Exact departure time",
      "Meeting or transportation location",
      "Weather conditions and cancellation policy",
      "Accessibility and age policies"
    ],
    physicalFormat: {
      exposure: "Covered-boat format; exact vessel configuration is confirmed by the operator."
    },
    logistics: {
      transportation: "Transportation options are confirmed during booking."
    },
  },
  {
    id: "ragincajun-airboat",
    companyShortname: "ragincajuntours",
    flowId: "940162",
    title: "Ragin Cajun Airboat Options",
    category: "Airboat Rides",
    operatorName: "Ragin Cajun Tours",
    description: "The faster, more adventurous, open-air swamp format.",
    bestFor: "Airboat options",
    imageUrl: "/images/travel-markets/new-orleans/airboat-swamp.png",
    imageAlt: "Airboat traveling through a Louisiana swamp",
    ctaLabel: "View Airboat Options →",
    slug: "ragin-cajun-airboat-options",
    relatedTourSlug: "covered-tour-boat",
    detailPageTitle: "Ragin Cajun Airboat Options | Welcome to New Orleans Tours",
    metaDescription: "The faster, more adventurous, open-air swamp format offered by Ragin Cajun Tours.",
    durationLabel: "Duration confirmed during booking.",
    transportationSummary: "Boat formats confirmed during booking.",
    pickupSummary: "Transportation options confirmed during booking.",
    bookingNote: "Confirm the current format and participation requirements during booking.",
    highlights: [
      "The operator describes the route as traveling through privately accessed swamp property"
    ],
    detailSummary: "An open-air format. Current airboat configurations and available options are selected directly in the operator checkout. Eligibility, duration, transportation options, group format, and live pricing must all be verified during checkout.",
    bestFit: [
      "Visitors looking for a fast, adventurous ride",
      "Those who prefer an open-air outdoor experience"
    ],
    notIdealFor: [
      "Groups wanting a quiet, relaxed, or shaded environment",
      "Visitors sensitive to loud noises"
    ],
    childrenConsiderations: [
      "Verify age minimums and child eligibility directly in the operator checkout before booking."
    ],
    confirmedInclusions: [],
    bookingConfirmations: [
      "Confirm the current format and participation requirements during booking.",
      "Meeting or transportation location",
      "Weather conditions and cancellation policy"
    ],
    physicalFormat: {
      riding: "Airboat ride",
      exposure: "Open-air exposure"
    },
    logistics: {
      transportation: "Transportation options confirmed during booking."
    },
  },
  {
    id: "southernstyle-city-plantation-combo",
    companyShortname: "southernstyletours",
    itemId: "51953",
    flowId: "4344",
    title: "All-Day City + Plantation",
    category: "Combo Tours",
    operatorName: "Southern Style Tours",
    description: "An 8-hour combination of a New Orleans city tour and either Oak Alley or Laura Plantation.",
    bestFor: "City and plantation in one day",
    imageUrl: "/images/travel-markets/new-orleans/french-quarter-street.jpg",
    imageAlt: "French Quarter street in New Orleans",
    slug: "all-day-city-plantation-combo",
    relatedTourSlug: "oak-alley-or-laura-plantation-tour",
    detailPageTitle: "All-Day City + Plantation Combo | Welcome to New Orleans Tours",
    metaDescription: "Combine a New Orleans city tour with Oak Alley or Laura Plantation in an 8-hour experience operated by Southern Style Tours.",
    durationLabel: "8 hours",
    transportationSummary: "Morning pickup is included",
    pickupSummary: "The operator describes a morning pickup window of 8:00–8:30 a.m.",
    highlights: [
      "New Orleans city tour",
      "Oak Alley or Laura Plantation",
      "An 8-hour combined experience"
    ],
    detailSummary: "An 8-hour combination of a New Orleans city tour and either Oak Alley or Laura Plantation, with a morning pickup window described by the operator as 8:00–8:30 a.m.",
    bestFit: [
      "Visitors who want a city tour and plantation experience in one day",
      "Groups prepared for an 8-hour outing"
    ],
    notIdealFor: [
      "Visitors with less than a full day available",
      "Children younger than 4"
    ],
    childrenConsiderations: [
      "The operator lists this experience for ages 4 and older."
    ],
    confirmedInclusions: [
      "New Orleans city tour",
      "Oak Alley or Laura Plantation"
    ],
    bookingConfirmations: [
      "Available plantation option",
      "Live departure availability",
      "Current pickup details",
      "Current pricing"
    ],
    physicalFormat: {
      riding: "A combined city and plantation outing."
    },
    logistics: {
      pickup: "The operator describes a morning pickup window of 8:00–8:30 a.m.",
      transportation: "Transportation is part of the combined itinerary."
    },
    historicalContextNote: "Plantation sites in Louisiana are inextricably connected to the history of slavery and forced labor. The depth and focus of historical interpretation vary by site. We encourage visitors to review the selected plantation’s specific historical program and educational approach."
  },
  {
    id: "ragincajun-covered-plantation-combo",
    companyShortname: "ragincajuntours",
    itemId: "603090",
    flowId: "392449",
    title: "Covered Boat + Plantation",
    category: "Combo Tours",
    operatorName: "Ragin Cajun Airboat Tours",
    description: "A covered boat and plantation combination lasting approximately 7 hours.",
    bestFor: "Covered boat and plantation in one outing",
    imageUrl: "/images/travel-markets/new-orleans/covered-boat-swamp.png",
    imageAlt: "Covered tour boat in a Louisiana swamp",
    slug: "covered-boat-plantation-combo",
    relatedTourSlug: "covered-tour-boat",
    detailPageTitle: "Covered Boat + Plantation Combo | Welcome to New Orleans Tours",
    metaDescription: "Combine a covered boat tour with Oak Alley or Laura Plantation in an approximately 7-hour experience with transportation.",
    durationLabel: "Approximately 7 hours",
    transportationSummary: "Transportation and pickup included",
    pickupSummary: "Pickup is included as described by the operator.",
    highlights: [
      "Covered boat tour",
      "Oak Alley or Laura Plantation",
      "Transportation and pickup"
    ],
    detailSummary: "An approximately 7-hour combination of a covered boat tour and either Oak Alley or Laura Plantation, with transportation and pickup included as described by the operator.",
    bestFit: [
      "Visitors who want a covered boat tour and plantation experience in one outing",
      "Groups prepared for an approximately 7-hour experience"
    ],
    notIdealFor: [
      "Visitors with less than a full day available",
      "Children younger than 5"
    ],
    childrenConsiderations: [
      "The operator lists adult and child pricing types and an age minimum of 5."
    ],
    confirmedInclusions: [
      "Covered boat tour",
      "Oak Alley or Laura Plantation",
      "Transportation and pickup as described by the operator"
    ],
    bookingConfirmations: [
      "Available plantation option",
      "Live departure availability",
      "Current pickup details",
      "Adult and child pricing",
      "Current pricing"
    ],
    physicalFormat: {
      riding: "A covered boat and plantation combination."
    },
    logistics: {
      pickup: "Pickup is included as described by the operator.",
      transportation: "Transportation is included as described by the operator."
    },
    historicalContextNote: "Plantation sites in Louisiana are inextricably connected to the history of slavery and forced labor. The depth and focus of historical interpretation vary by site. We encourage visitors to review the selected plantation’s specific historical program and educational approach."
  },
  {
    id: "evening-jazz-cruise",
    companyShortname: "neworleanssteamboatcompany",
    title: "Evening Jazz Cruise",
    category: "River Cruises",
    operatorName: "New Orleans Steamboat Company",
    description: "Experience the Mississippi River at night with live jazz and stunning city views.",
    imageUrl: "/images/travel-markets/new-orleans/steamboat-natchez.jpg",
    slug: "evening-jazz-cruise",
    relatedTourSlug: "daytime-jazz-cruise",
    detailPageTitle: "Evening Jazz Cruise | Welcome to New Orleans Tours",
    metaDescription: "Experience the Mississippi River at night with live jazz. Choose from dinner seatings or sightseeing-only options.",
    detailSummary: "A classic evening steamboat cruise featuring live jazz and spectacular views of the New Orleans skyline.",
    bestFit: [
      "Visitors looking for a classic New Orleans evening on the river",
      "Couples and groups wanting live music and dining in one experience"
    ],
    notIdealFor: [
      "Those who prefer a fast-paced or highly active evening"
    ],
    childrenConsiderations: [
      "Children are welcome. Verify child pricing and seating options during checkout."
    ],
    bookingConfirmations: [
      "Selected seating time (Sightseeing, Early Dinner, Late Dinner)",
      "Exact departure time and boarding location",
      "Menu and inclusions"
    ],
    bookingVariants: [
      {
        label: "CHECK SIGHTSEEING AVAILABILITY",
        itemId: "560825",
        flowId: "1621291",
        bookingUrl: "https://fareharbor.com/embeds/book/neworleanssteamboatcompany/items/560825/?ref=WelcomeToNewOrleansTours&schedule-uuid=154cb35d-dbcd-4233-aef8-3bc8c48776b3&asn=welcometoneworleanstours&full-items=yes&flow=1621291"
      },
      {
        label: "CHECK EARLY DINNER (6:00 PM)",
        itemId: "560778",
        flowId: "1621291",
        bookingUrl: "https://fareharbor.com/embeds/book/neworleanssteamboatcompany/items/560778/?ref=WelcomeToNewOrleansTours&schedule-uuid=154cb35d-dbcd-4233-aef8-3bc8c48776b3&asn=welcometoneworleanstours&full-items=yes&flow=1621291"
      },
      {
        label: "CHECK LATE DINNER (7:45 PM)",
        itemId: "560822",
        flowId: "1621291",
        bookingUrl: "https://fareharbor.com/embeds/book/neworleanssteamboatcompany/items/560822/?ref=WelcomeToNewOrleansTours&schedule-uuid=154cb35d-dbcd-4233-aef8-3bc8c48776b3&asn=welcometoneworleanstours&full-items=yes&flow=1621291"
      },
      {
        label: "CHECK SEASONAL PARTY PACKAGE",
        itemId: "560827",
        flowId: "1621291",
        bookingUrl: "https://fareharbor.com/embeds/book/neworleanssteamboatcompany/items/560827/?ref=WelcomeToNewOrleansTours&schedule-uuid=154cb35d-dbcd-4233-aef8-3bc8c48776b3&asn=welcometoneworleanstours&full-items=yes&flow=1621291"
      }
    ]
  },
  {
    id: "daytime-jazz-cruise",
    companyShortname: "neworleanssteamboatcompany",
    title: "Daytime Jazz Cruise",
    category: "River Cruises",
    operatorName: "New Orleans Steamboat Company",
    description: "Enjoy a relaxing daytime cruise on the Mississippi River with live jazz.",
    imageUrl: "/images/travel-markets/new-orleans/steamboat-natchez.jpg",
    slug: "daytime-jazz-cruise",
    relatedTourSlug: "evening-jazz-cruise",
    detailPageTitle: "Daytime Jazz Cruise | Welcome to New Orleans Tours",
    metaDescription: "Enjoy a relaxing daytime cruise on the Mississippi River with live jazz. Multiple lunch seatings available.",
    detailSummary: "A daytime steamboat excursion on the Mississippi River, featuring live jazz and historical narration.",
    bestFit: [
      "Families and visitors looking for a daytime river activity",
      "Those who want to combine lunch and a tour"
    ],
    childrenConsiderations: [
      "Children are welcome. Verify child pricing and seating options during checkout."
    ],
    bookingConfirmations: [
      "Selected seating time (Sightseeing or Lunch)",
      "Exact departure time and boarding location"
    ],
    bookingVariants: [
      {
        label: "CHECK SIGHTSEEING AVAILABILITY",
        itemId: "561220",
        flowId: "1621342",
        bookingUrl: "https://fareharbor.com/embeds/book/neworleanssteamboatcompany/items/561220/?ref=WelcomeToNewOrleansTours&schedule-uuid=154cb35d-dbcd-4233-aef8-3bc8c48776b3&asn=welcometoneworleanstours&full-items=yes&flow=1621342"
      },
      {
        label: "CHECK 11:00 AM LUNCH SEATING",
        itemId: "561185",
        flowId: "1621342",
        bookingUrl: "https://fareharbor.com/embeds/book/neworleanssteamboatcompany/items/561185/?ref=WelcomeToNewOrleansTours&schedule-uuid=154cb35d-dbcd-4233-aef8-3bc8c48776b3&asn=welcometoneworleanstours&full-items=yes&flow=1621342"
      },
      {
        label: "CHECK 12:15 PM LUNCH SEATING",
        itemId: "561216",
        flowId: "1621342",
        bookingUrl: "https://fareharbor.com/embeds/book/neworleanssteamboatcompany/items/561216/?ref=WelcomeToNewOrleansTours&schedule-uuid=154cb35d-dbcd-4233-aef8-3bc8c48776b3&asn=welcometoneworleanstours&full-items=yes&flow=1621342"
      },
      {
        label: "CHECK 2:00 PM LUNCH SEATING",
        itemId: "566787",
        flowId: "1621342",
        bookingUrl: "https://fareharbor.com/embeds/book/neworleanssteamboatcompany/items/566787/?ref=WelcomeToNewOrleansTours&schedule-uuid=154cb35d-dbcd-4233-aef8-3bc8c48776b3&asn=welcometoneworleanstours&full-items=yes&flow=1621342"
      },
      {
        label: "CHECK 3:15 PM LUNCH SEATING",
        itemId: "566794",
        flowId: "1621342",
        bookingUrl: "https://fareharbor.com/embeds/book/neworleanssteamboatcompany/items/566794/?ref=WelcomeToNewOrleansTours&schedule-uuid=154cb35d-dbcd-4233-aef8-3bc8c48776b3&asn=welcometoneworleanstours&full-items=yes&flow=1621342"
      },
      {
        label: "CHECK SEASONAL PARTY PACKAGE",
        itemId: "561392",
        flowId: "1621342",
        bookingUrl: "https://fareharbor.com/embeds/book/neworleanssteamboatcompany/items/561392/?ref=WelcomeToNewOrleansTours&schedule-uuid=154cb35d-dbcd-4233-aef8-3bc8c48776b3&asn=welcometoneworleanstours&full-items=yes&flow=1621342"
      }
    ]
  },
  {
    id: "sunday-jazz-brunch-cruise",
    companyShortname: "neworleanssteamboatcompany",
    title: "Sunday Jazz Brunch Cruise",
    category: "River Cruises",
    operatorName: "New Orleans Steamboat Company",
    description: "A festive Sunday morning on the river featuring a jazz brunch.",
    imageUrl: "/images/travel-markets/new-orleans/steamboat-natchez.jpg",
    slug: "sunday-jazz-brunch-cruise",
    relatedTourSlug: "daytime-jazz-cruise",
    detailPageTitle: "Sunday Jazz Brunch Cruise | Welcome to New Orleans Tours",
    metaDescription: "A festive Sunday morning on the river featuring a jazz brunch. Choose from brunch seatings or sightseeing options.",
    detailSummary: "A traditional Sunday jazz brunch experience aboard a classic riverboat.",
    bestFit: [
      "Weekend visitors seeking a traditional New Orleans brunch experience"
    ],
    childrenConsiderations: [
      "Verify child pricing and availability during checkout."
    ],
    bookingConfirmations: [
      "Selected option (Sightseeing or Brunch)",
      "Departure time"
    ],
    bookingVariants: [
      {
        label: "CHECK SIGHTSEEING AVAILABILITY",
        itemId: "561369",
        flowId: "1621326",
        bookingUrl: "https://fareharbor.com/embeds/book/neworleanssteamboatcompany/items/561369/?ref=WelcomeToNewOrelansTours&schedule-uuid=154cb35d-dbcd-4233-aef8-3bc8c48776b3&asn=welcometoneworleanstours&full-items=yes&flow=1621326"
      },
      {
        label: "CHECK BRUNCH AVAILABILITY",
        itemId: "561390",
        flowId: "1621326",
        bookingUrl: "https://fareharbor.com/embeds/book/neworleanssteamboatcompany/items/561390/?ref=WelcomeToNewOrelansTours&schedule-uuid=154cb35d-dbcd-4233-aef8-3bc8c48776b3&asn=welcometoneworleanstours&full-items=yes&flow=1621326"
      },
      {
        label: "CHECK SEASONAL PARTY PACKAGE",
        itemId: "561403",
        flowId: "1621326",
        bookingUrl: "https://fareharbor.com/embeds/book/neworleanssteamboatcompany/items/561403/?ref=WelcomeToNewOrelansTours&schedule-uuid=154cb35d-dbcd-4233-aef8-3bc8c48776b3&asn=welcometoneworleanstours&full-items=yes&flow=1621326"
      }
    ]
  },
  {
    id: "oak-alley-plantation-tour-grey-line",
    companyShortname: "neworleanssteamboatcompany",
    itemId: "561477",
    flowId: "1578687",
    title: "Oak Alley Plantation Tour",
    category: "Plantation Tours",
    operatorName: "Grey Line",
    description: "Explore the iconic Oak Alley Plantation with its famous canopy of southern live oak trees.",
    imageUrl: "/images/travel-markets/new-orleans/french-quarter-street.jpg",
    slug: "oak-alley-plantation-tour-grey-line",
    relatedTourSlug: "whitney-plantation-tour",
    detailPageTitle: "Oak Alley Plantation Tour by Grey Line | Welcome to New Orleans Tours",
    metaDescription: "Explore the iconic Oak Alley Plantation with its famous canopy of southern live oak trees on this Grey Line tour.",
    detailSummary: "A guided tour to Oak Alley Plantation operated by Grey Line.",
    historicalContextNote: "Plantation sites in Louisiana are inextricably connected to the history of slavery and forced labor. The depth and focus of historical interpretation vary by site. We encourage visitors to review the selected plantation’s specific historical program and educational approach.",
    bookingVariants: [
      {
        label: "CHECK AVAILABILITY",
        itemId: "561477",
        flowId: "1578687",
        bookingUrl: "https://fareharbor.com/embeds/book/neworleanssteamboatcompany/items/561477/?ref=WelcomeToNewOrleansTours&schedule-uuid=154cb35d-dbcd-4233-aef8-3bc8c48776b3&asn=welcometoneworleanstours&full-items=yes&flow=1578687"
      }
    ]
  },
  {
    id: "whitney-plantation-tour",
    companyShortname: "neworleanssteamboatcompany",
    itemId: "561539",
    flowId: "1578687",
    title: "Whitney Plantation Tour",
    category: "Plantation Tours",
    operatorName: "Grey Line",
    description: "Visit the Whitney Plantation, dedicated entirely to understanding the facts of slavery in Louisiana.",
    imageUrl: "/images/travel-markets/new-orleans/french-quarter-street.jpg",
    slug: "whitney-plantation-tour",
    relatedTourSlug: "oak-alley-plantation-tour-grey-line",
    detailPageTitle: "Whitney Plantation Tour | Welcome to New Orleans Tours",
    metaDescription: "Visit the Whitney Plantation, dedicated entirely to understanding the facts of slavery in Louisiana.",
    detailSummary: "A guided visit to the Whitney Plantation, with an exclusive focus on the lives of enslaved people.",
    historicalContextNote: "Plantation sites in Louisiana are inextricably connected to the history of slavery and forced labor. The Whitney Plantation focuses exclusively on the history and experiences of the enslaved population.",
    bookingVariants: [
      {
        label: "CHECK AVAILABILITY",
        itemId: "561539",
        flowId: "1578687",
        bookingUrl: "https://fareharbor.com/embeds/book/neworleanssteamboatcompany/items/561539/?ref=WelcomeToNewOrleansTours&schedule-uuid=154cb35d-dbcd-4233-aef8-3bc8c48776b3&asn=welcometoneworleanstours&full-items=yes&flow=1578687"
      }
    ]
  },
  {
    id: "swamp-bayou-tour",
    companyShortname: "neworleanssteamboatcompany",
    itemId: "561484",
    flowId: "1220421",
    title: "Swamp & Bayou Tour",
    category: "Swamp Tours",
    operatorName: "Grey Line",
    description: "A classic boat tour exploring the Louisiana swamp and bayou ecosystem.",
    imageUrl: "/images/travel-markets/new-orleans/covered-boat-swamp.png",
    slug: "swamp-bayou-tour",
    relatedTourSlug: "small-airboat-swamp-adventure",
    detailPageTitle: "Swamp & Bayou Tour | Welcome to New Orleans Tours",
    metaDescription: "A classic boat tour exploring the Louisiana swamp and bayou ecosystem with Grey Line.",
    detailSummary: "A guided boat tour into the Louisiana swamps and bayous.",
    bookingVariants: [
      {
        label: "CHECK AVAILABILITY",
        itemId: "561484",
        flowId: "1220421",
        bookingUrl: "https://fareharbor.com/embeds/book/neworleanssteamboatcompany/items/561484/?ref=WelcomeToNewOrleansTours&schedule-uuid=154cb35d-dbcd-4233-aef8-3bc8c48776b3&asn=welcometoneworleanstours&full-items=yes&flow=1220421"
      }
    ]
  },
  {
    id: "small-airboat-swamp-adventure",
    companyShortname: "neworleanssteamboatcompany",
    itemId: "561547",
    flowId: "1220421",
    title: "Small Airboat Swamp Adventure",
    category: "Airboat Rides",
    operatorName: "Grey Line",
    description: "An intimate and high-speed airboat ride through the Louisiana swamps.",
    imageUrl: "/images/travel-markets/new-orleans/airboat-swamp.png",
    slug: "small-airboat-swamp-adventure",
    relatedTourSlug: "large-airboat-swamp-adventure",
    detailPageTitle: "Small Airboat Swamp Adventure | Welcome to New Orleans Tours",
    metaDescription: "An intimate and high-speed airboat ride through the Louisiana swamps with Grey Line.",
    detailSummary: "A fast-paced small airboat tour in the Louisiana bayou.",
    bookingVariants: [
      {
        label: "CHECK AVAILABILITY",
        itemId: "561547",
        flowId: "1220421",
        bookingUrl: "https://fareharbor.com/embeds/book/neworleanssteamboatcompany/items/561547/?ref=WelcomeToNewOrleansTours&schedule-uuid=154cb35d-dbcd-4233-aef8-3bc8c48776b3&asn=welcometoneworleanstours&full-items=yes&flow=1220421"
      }
    ]
  },
  {
    id: "large-airboat-swamp-adventure",
    companyShortname: "neworleanssteamboatcompany",
    itemId: "562175",
    flowId: "1220421",
    title: "Large Airboat Swamp Adventure",
    category: "Airboat Rides",
    operatorName: "Grey Line",
    description: "A fast-paced airboat ride on a larger vessel through the Louisiana swamps.",
    imageUrl: "/images/travel-markets/new-orleans/airboat-swamp.png",
    slug: "large-airboat-swamp-adventure",
    relatedTourSlug: "small-airboat-swamp-adventure",
    detailPageTitle: "Large Airboat Swamp Adventure | Welcome to New Orleans Tours",
    metaDescription: "A fast-paced airboat ride on a larger vessel through the Louisiana swamps with Grey Line.",
    detailSummary: "A fast-paced large airboat tour in the Louisiana bayou.",
    bookingVariants: [
      {
        label: "CHECK AVAILABILITY",
        itemId: "562175",
        flowId: "1220421",
        bookingUrl: "https://fareharbor.com/embeds/book/neworleanssteamboatcompany/items/562175/?ref=WelcomeToNewOrleansTours&schedule-uuid=154cb35d-dbcd-4233-aef8-3bc8c48776b3&asn=welcometoneworleanstours&full-items=yes&flow=1220421"
      }
    ]
  },
  {
    id: "swamp-boat-oak-alley-combo",
    companyShortname: "neworleanssteamboatcompany",
    itemId: "562191",
    flowId: "1220421",
    title: "Swamp Boat and Oak Alley Combination",
    category: "Combo Tours",
    operatorName: "Grey Line",
    description: "Experience both a Louisiana swamp boat tour and the historic Oak Alley Plantation in one trip.",
    imageUrl: "/images/travel-markets/new-orleans/french-quarter-street.jpg",
    slug: "swamp-boat-oak-alley-combo",
    relatedTourSlug: "swamp-boat-whitney-combo",
    detailPageTitle: "Swamp Boat and Oak Alley Combination | Welcome to New Orleans Tours",
    metaDescription: "Experience both a Louisiana swamp boat tour and the historic Oak Alley Plantation in one trip with Grey Line.",
    detailSummary: "A full-day combination tour featuring Oak Alley Plantation and a swamp boat ride.",
    historicalContextNote: "Plantation sites in Louisiana are inextricably connected to the history of slavery and forced labor.",
    bookingVariants: [
      {
        label: "CHECK AVAILABILITY",
        itemId: "562191",
        flowId: "1220421",
        bookingUrl: "https://fareharbor.com/embeds/book/neworleanssteamboatcompany/items/562191/?ref=WelcomeToNewOrleansTours&schedule-uuid=154cb35d-dbcd-4233-aef8-3bc8c48776b3&asn=welcometoneworleanstours&full-items=yes&flow=1220421"
      }
    ]
  },
  {
    id: "swamp-boat-whitney-combo",
    companyShortname: "neworleanssteamboatcompany",
    itemId: "670738",
    flowId: "1220421",
    title: "Swamp Boat and Whitney Combination",
    category: "Combo Tours",
    operatorName: "Grey Line",
    description: "Experience both a Louisiana swamp boat tour and the historic Whitney Plantation.",
    imageUrl: "/images/travel-markets/new-orleans/french-quarter-street.jpg",
    slug: "swamp-boat-whitney-combo",
    relatedTourSlug: "swamp-boat-oak-alley-combo",
    detailPageTitle: "Swamp Boat and Whitney Combination | Welcome to New Orleans Tours",
    metaDescription: "Experience both a Louisiana swamp boat tour and the historic Whitney Plantation with Grey Line.",
    detailSummary: "A full-day combination tour featuring Whitney Plantation and a swamp boat ride.",
    historicalContextNote: "Plantation sites in Louisiana are inextricably connected to the history of slavery and forced labor.",
    bookingVariants: [
      {
        label: "CHECK AVAILABILITY",
        itemId: "670738",
        flowId: "1220421",
        bookingUrl: "https://fareharbor.com/embeds/book/neworleanssteamboatcompany/items/670738/?ref=WelcomeToNewOrleansTours&schedule-uuid=154cb35d-dbcd-4233-aef8-3bc8c48776b3&asn=welcometoneworleanstours&full-items=yes&flow=1220421"
      }
    ]
  },
  {
    id: "cocktail-walking-tour",
    companyShortname: "neworleanssteamboatcompany",
    itemId: "682856",
    flowId: "1578708",
    title: "Cocktail Walking Tour",
    category: "Walking Tours",
    operatorName: "Grey Line",
    description: "A walking tour exploring New Orleans' historic cocktail culture.",
    imageUrl: "/images/travel-markets/new-orleans/french-quarter-street.jpg",
    slug: "cocktail-walking-tour",
    relatedTourSlug: "craft-cocktail-walking-tour",
    detailPageTitle: "Cocktail Walking Tour | Welcome to New Orleans Tours",
    metaDescription: "A walking tour exploring New Orleans' historic cocktail culture.",
    detailSummary: "A guided walking tour focusing on New Orleans' famous cocktails.",
    bookingVariants: [
      {
        label: "CHECK AVAILABILITY",
        itemId: "682856",
        flowId: "1578708",
        bookingUrl: "https://fareharbor.com/embeds/book/neworleanssteamboatcompany/items/682856/?ref=WelcomeToNewOrleansTours&schedule-uuid=154cb35d-dbcd-4233-aef8-3bc8c48776b3&asn=welcometoneworleanstours&full-items=yes&flow=1578708"
      }
    ]
  },
  {
    id: "craft-cocktail-walking-tour",
    companyShortname: "neworleanssteamboatcompany",
    itemId: "562204",
    flowId: "1578708",
    title: "Craft Cocktail Walking Tour",
    category: "Walking Tours",
    operatorName: "Grey Line",
    description: "Discover the craft cocktail scene and history in the French Quarter.",
    imageUrl: "/images/travel-markets/new-orleans/french-quarter-street.jpg",
    slug: "craft-cocktail-walking-tour",
    relatedTourSlug: "cocktail-walking-tour",
    detailPageTitle: "Craft Cocktail Walking Tour | Welcome to New Orleans Tours",
    metaDescription: "Discover the craft cocktail scene and history in the French Quarter.",
    detailSummary: "A guided walking tour focusing on craft cocktails and history.",
    bookingVariants: [
      {
        label: "CHECK AVAILABILITY",
        itemId: "562204",
        flowId: "1578708",
        bookingUrl: "https://fareharbor.com/embeds/book/neworleanssteamboatcompany/items/562204/?ref=WelcomeToNewOrleansTours&schedule-uuid=154cb35d-dbcd-4233-aef8-3bc8c48776b3&asn=welcometoneworleanstours&full-items=yes&flow=1578708"
      }
    ]
  },
  {
    id: "ghosts-spirits-walking-tour",
    companyShortname: "neworleanssteamboatcompany",
    itemId: "562250",
    flowId: "1578708",
    title: "Ghosts & Spirits Walking Tour",
    category: "Walking Tours",
    operatorName: "Grey Line",
    description: "An interactive evening walking tour through the haunted history of New Orleans.",
    imageUrl: "/images/travel-markets/new-orleans/french-quarter-street.jpg",
    slug: "ghosts-spirits-walking-tour",
    relatedTourSlug: "craft-cocktail-walking-tour",
    detailPageTitle: "Ghosts & Spirits Walking Tour | Welcome to New Orleans Tours",
    metaDescription: "An interactive evening walking tour through the haunted history of New Orleans.",
    detailSummary: "A guided walking tour exploring the spooky side of the city.",
    bookingVariants: [
      {
        label: "CHECK AVAILABILITY",
        itemId: "562250",
        flowId: "1578708",
        bookingUrl: "https://fareharbor.com/embeds/book/neworleanssteamboatcompany/items/562250/?ref=WelcomeToNewOrleansTours&schedule-uuid=154cb35d-dbcd-4233-aef8-3bc8c48776b3&asn=welcometoneworleanstours&full-items=yes&flow=1578708"
      }
    ]
  },
  {
    id: "city-cemetery-garden-district-tour",
    companyShortname: "neworleanssteamboatcompany",
    itemId: "564661",
    flowId: "1578708",
    title: "City, Cemetery and Garden District Tour",
    category: "City Tours",
    operatorName: "Grey Line",
    description: "A comprehensive tour covering the city's highlights, historic cemeteries, and the Garden District.",
    imageUrl: "/images/travel-markets/new-orleans/french-quarter-street.jpg",
    slug: "city-cemetery-garden-district-tour",
    relatedTourSlug: "city-of-new-orleans-riverboat-cruise",
    detailPageTitle: "City, Cemetery and Garden District Tour | Welcome to New Orleans Tours",
    metaDescription: "A comprehensive tour covering the city's highlights, historic cemeteries, and the Garden District with Grey Line.",
    detailSummary: "A guided city overview including the Garden District and a cemetery stop.",
    bookingVariants: [
      {
        label: "CHECK AVAILABILITY",
        itemId: "564661",
        flowId: "1578708",
        bookingUrl: "https://fareharbor.com/embeds/book/neworleanssteamboatcompany/items/564661/?ref=WelcomeToNewOrleansTours&schedule-uuid=154cb35d-dbcd-4233-aef8-3bc8c48776b3&asn=welcometoneworleanstours&full-items=yes&flow=1578708"
      }
    ]
  },
  {
    id: "city-of-new-orleans-riverboat-cruise",
    companyShortname: "neworleanssteamboatcompany",
    itemId: "694782",
    flowId: "1621347",
    title: "CITY of NEW ORLEANS Riverboat Cruise",
    category: "River Cruises",
    operatorName: "New Orleans Steamboat Company",
    description: "A 75-minute riverboat cruise offering a quick and scenic tour of the Mississippi River.",
    imageUrl: "/images/travel-markets/new-orleans/steamboat-natchez.jpg",
    slug: "city-of-new-orleans-riverboat-cruise",
    relatedTourSlug: "daytime-jazz-cruise",
    detailPageTitle: "75-Minute CITY of NEW ORLEANS Riverboat Cruise | Welcome to New Orleans Tours",
    metaDescription: "A 75-minute riverboat cruise offering a quick and scenic tour of the Mississippi River.",
    detailSummary: "A shorter, 75-minute riverboat experience on the Mississippi.",
    bookingVariants: [
      {
        label: "CHECK AVAILABILITY",
        itemId: "694782",
        flowId: "1621347",
        bookingUrl: "https://fareharbor.com/embeds/book/neworleanssteamboatcompany/items/694782/?ref=WelcomeToNewOrleansTours&schedule-uuid=154cb35d-dbcd-4233-aef8-3bc8c48776b3&asn=welcometoneworleanstours&full-items=yes&flow=1621347"
      }
    ]
  }
];

export interface ListingNode {
  id: string;
  name: string;
  category: string;
  location?: string;
  description?: string;
  menuUrl?: string;
  hours?: { open: number; close: number };
  verification_status?: string;
  rating?: number;
  reviewsCount?: number;
  price?: string | number;
  vibe?: string;
  logistics: Record<string, string>;
}

export const DIRECTORY_DATA: ListingNode[] = STOREFRONT_PRODUCTS.map(p => ({
  id: p.id,
  name: p.title,
  category: p.category.toLowerCase().includes("swamp") || p.category.toLowerCase().includes("airboat") ? "swamp" : "tours",
  description: p.description,
  verification_status: "verified_active",
  menuUrl: `/new-orleans/tours#${p.id}`,
  logistics: p.durationLabel ? { "Duration": p.durationLabel } as Record<string, string> : {} as Record<string, string>,
}));

export const METADATA = {
  title: "Browse New Orleans Tours | Welcome to New Orleans Tours",
  description: "Browse six current city, plantation, swamp, airboat, and full-day combination experiences from participating New Orleans operators.",
  keywords: ["new orleans tours", "new orleans city tour", "plantation tours new orleans", "cajun swamp tour", "airboat rides"]
};
