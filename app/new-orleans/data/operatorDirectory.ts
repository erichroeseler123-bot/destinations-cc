export interface OperatorBookingProduct {
  title: string;
  description: string;
  viatorUrl: string;
  /** Set only after confirming the FareHarbor product and WNO attribution. */
  fareHarborUrl?: string;
}

export function getOperatorBooking(product: OperatorBookingProduct, slug: string) {
  if (product.fareHarborUrl) return { provider: "FareHarbor", url: product.fareHarborUrl };
  const url = new URL(product.viatorUrl);
  const campaign = `wno-operator-${slug}`;
  for (const [key, value] of Object.entries({ pid: "P00306962", mcid: "42383", medium: "link", campaign, utm_source: "welcometoneworleanstours.com", utm_medium: "affiliate", utm_campaign: campaign })) url.searchParams.set(key, value);
  return { provider: "Viator", url: url.toString() };
}

/** Operator profiles with verified partner product links. Prices and availability are checked at checkout. */
export interface ResearchedOperator {
  slug: string;
  name: string;
  category: string;
  officialUrl: string;
  summary: string;
  planningNotes: string[];
  checkedOn: string;
  products: OperatorBookingProduct[];
}

export const RESEARCHED_OPERATORS: ResearchedOperator[] = [
  {
    "slug": "cajun-encounters",
    "name": "Cajun Encounters",
    "category": "Swamp, city, ghost and plantation tours",
    "officialUrl": "https://www.cajunencounters.com/",
    "summary": "Cajun Encounters offers Honey Island Swamp outings alongside city bus tours, ghost bus tours and plantation excursions. It is worth comparing when your group wants a guided outing by boat or bus, or is weighing several Louisiana experiences.",
    "planningNotes": [
      "Choose the specific tour before comparing prices; swamp, city and plantation outings have different itineraries.",
      "Check the pickup location and whether transportation is included in the selected option.",
      "Allow for the full excursion and return journey when planning another tour that day."
    ],
    "checkedOn": "2026-09-30",
    products: [
    {
        "title": "Honey Island Swamp Boat Tour",
        "description": "Travel to the departure point yourself for a guided swamp boat outing.",
        "viatorUrl": "https://www.viator.com/tours/New-Orleans/Honey-Island-Swamp-Tour/d675-6953SWAMP"
    },
    {
        "title": "Honey Island Swamp Tour with Transportation",
        "description": "Choose a swamp boat outing with transportation from New Orleans.",
        "viatorUrl": "https://www.viator.com/tours/New-Orleans/Honey-Island-Swamp-Tour-With-Transport/d675-6953SWAMPTRANS"
    }
]
  },
  {
    "slug": "cajun-pride-swamp-tours",
    "name": "Cajun Pride Swamp Tours",
    "category": "Swamp boat tours",
    "officialUrl": "https://www.cajunprideswamptours.com/tours/swamp-tours",
    "summary": "Cajun Pride offers swamp boat tours from its LaPlace location, with an optional transportation version. Compare the outing itself and the journey there: a self-drive reservation and a tour with transportation can have different costs and schedules.",
    "planningNotes": [
      "Select the option with or without transportation that matches your plans.",
      "Confirm the departure location and check-in instructions in your reservation.",
      "Wildlife sightings vary; choose the outing for the overall swamp experience."
    ],
    "checkedOn": "2026-09-30",
    products: [
    {
        "title": "Manchac Swamp Boat Tour",
        "description": "A swamp boat outing for visitors arranging their own transport to LaPlace.",
        "viatorUrl": "https://www.viator.com/tours/New-Orleans/Drive-Out-Swamp-Tour/d675-141126P1"
    },
    {
        "title": "Swamp Tour with Transportation",
        "description": "Choose the shuttle option when you need transportation from New Orleans.",
        "viatorUrl": "https://www.viator.com/tours/New-Orleans/Swamp-Tour-with-Transportation/d675-141126P2"
    }
]
  },
  {
    "slug": "haunted-history-tours",
    "name": "Haunted History Tours",
    "category": "Ghost, vampire, cemetery and history tours",
    "officialUrl": "https://hauntedhistorytours.com/our-tours/",
    "summary": "Haunted History Tours offers ghost and vampire walks, cemetery experiences, Garden District tours and bus outings. Start with the format your group wants: an evening storytelling walk and a bus tour involve different amounts of walking and different meeting arrangements.",
    "planningNotes": [
      "Compare the exact itinerary rather than assuming every ghost tour visits the same locations.",
      "Check walking requirements, meeting point and age guidance for the selected experience.",
      "Leave time to reach the meeting point after dinner or another activity."
    ],
    "checkedOn": "2026-09-30",
    products: [
    {
        "title": "Haunted History Ghost Tour",
        "description": "Explore French Quarter ghost stories on a guided walking tour.",
        "viatorUrl": "https://www.viator.com/tours/New-Orleans/New-Orleans-Haunted-History-Ghost-Tour/d675-3252_1"
    },
    {
        "title": "New Orleans Vampire Tour",
        "description": "A walking tour focused on New Orleans vampire stories.",
        "viatorUrl": "https://www.viator.com/tours/New-Orleans/New-Orleans-Vampire-Tour/d675-3252_5"
    }
]
  },
  {
    "slug": "city-sightseeing-new-orleans",
    "name": "City Sightseeing New Orleans",
    "category": "Hop-on hop-off sightseeing",
    "officialUrl": "https://citysightseeingneworleans.com/tours/hop-on-hop-off/",
    "summary": "City Sightseeing New Orleans offers hop-on hop-off bus sightseeing. This format lets you explore around the route stops, rather than spending the entire outing with one walking group. Compare the ticket duration and included experiences before deciding how it fits your visit.",
    "planningNotes": [
      "Check the current route map and operating hours before choosing your starting stop.",
      "Review the ticket validity period and any included walking tours or other extras.",
      "Plan around the final departure and current service information."
    ],
    "checkedOn": "2026-09-30",
    products: [
    {
        "title": "New Orleans Hop-On Hop-Off Tour",
        "description": "Explore the city along a sightseeing bus route; review current ticket options and stops.",
        "viatorUrl": "https://www.viator.com/tours/New-Orleans/City-Sightseeing-New-Orleans-Hop-On-Hop-Off-Tour/d675-5694NOHOHO"
    }
]
  },
  {
    "slug": "doctor-gumbo-tours",
    "name": "Doctor Gumbo Tours",
    "category": "Food and cocktail history tours",
    "officialUrl": "https://doctorgumbo.com/tours/",
    "summary": "Doctor Gumbo Tours offers food history walks, cocktail history tours and a combined food-and-cocktail experience. It adds a culinary option alongside swamp, sightseeing and ghost outings when you want to build a varied New Orleans itinerary.",
    "planningNotes": [
      "Check dietary restrictions with the operator before booking; accommodations differ by tour.",
      "Review age requirements for cocktail experiences.",
      "Allow time for the walking itinerary and confirm the meeting point for your selected tour."
    ],
    "checkedOn": "2026-09-30",
    products: [
    {
        "title": "New Orleans Food and History Tour",
        "description": "Discover local food and history on a walking tour with tastings.",
        "viatorUrl": "https://www.viator.com/tours/New-Orleans/New-Orleans-Food-and-History-Tour/d675-6484NOLAFOOD"
    },
    {
        "title": "Cocktail and Food History Tour",
        "description": "Combine food tastings and cocktail history in one walking outing.",
        "viatorUrl": "https://www.viator.com/tours/New-Orleans/Combo-Cocktail-and-Food-History-Tour/d675-6484P3"
    }
]
  },
  {
    "slug": "new-orleans-kayak-swamp-tours",
    "name": "New Orleans Kayak Swamp Tours",
    "category": "Guided swamp kayaking",
    "officialUrl": "https://neworleanskayakswamptours.com/tours/",
    "summary": "New Orleans Kayak Swamp Tours offers guided paddling experiences in Louisiana wetlands, including Manchac and Honey Island options. Kayaking is a different activity from riding in an airboat or covered tour boat: your group participates in moving the craft.",
    "planningNotes": [
      "Choose the location and outing that match your itinerary.",
      "Confirm physical requirements, age rules and weather policies before booking.",
      "Check whether transportation is included or needs to be arranged separately."
    ],
    "checkedOn": "2026-09-30",
    products: [
    {
        "title": "Manchac Wildlife Kayak Tour",
        "description": "A guided paddling outing with a New Orleans transportation option; check the selected departure details.",
        "viatorUrl": "https://www.viator.com/tours/New-Orleans/Manchac-Mystic-Wildlife-Kayak-Tour/d675-22050P2"
    }
]
  }
];

export function getResearchedOperator(slug: string) {
  return RESEARCHED_OPERATORS.find((operator) => operator.slug === slug) ?? null;
}
