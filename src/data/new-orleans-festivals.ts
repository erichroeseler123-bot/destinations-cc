export type FestivalStatus = "confirmed" | "expected";

export type NewOrleansFestival = {
  slug: string;
  name: string;
  dateNote: string;
  status: FestivalStatus;
  location: string;
  summary: string;
  demandImpact: string;
  officialUrl?: string;
  viatorQuery: string;
  cruisePortNote: string;
  updatedAt: string;
};

export const NEW_ORLEANS_FESTIVALS: NewOrleansFestival[] = [
  {
    slug: "mardi-gras",
    name: "Mardi Gras Season",
    dateNote: "January 6, 2026 to Tuesday, February 17, 2026. Main parade window: February 13 to February 17, 2026.",
    status: "confirmed",
    location: "French Quarter, Uptown, St. Charles Avenue, City Park",
    summary:
      "The city's defining annual event: krewes, parades, costumes, king cake, and citywide logistics pressure.",
    demandImpact:
      "Hotels, transfers, and parade-zone routing tighten up far in advance. Street closures and crowd density materially change trip planning.",
    officialUrl: "https://www.mardigrasneworleans.com/",
    viatorQuery: "New Orleans Mardi Gras parade viewing tours",
    cruisePortNote:
      "Cruise arrivals during Mardi Gras should expect heavier traffic, surge pricing, and tighter transfer windows around parade routes.",
    updatedAt: "2026-03-11",
  },
  {
    slug: "jazz-fest",
    name: "New Orleans Jazz and Heritage Festival",
    dateNote: "Expected: April 24 to May 3, 2026",
    status: "expected",
    location: "Fair Grounds Race Course",
    summary:
      "The city's biggest music-and-food demand window after Mardi Gras, built around jazz, blues, brass, zydeco, and headline festival traffic.",
    demandImpact:
      "High demand for hotels, food reservations, and local transport. Music-first visitors usually book early and protect buffer time.",
    officialUrl: "https://www.nojazzfest.com/",
    viatorQuery: "New Orleans Jazz Fest food tours",
    cruisePortNote:
      "Port NOLA sailings during Jazz Fest should treat excursions and transfers as early-book windows because festival demand spills across the city.",
    updatedAt: "2026-03-11",
  },
  {
    slug: "french-quarter-festival",
    name: "French Quarter Festival",
    dateNote: "Expected: April 9 to April 12, 2026",
    status: "expected",
    location: "French Quarter streets and riverfront stages",
    summary:
      "A free, highly local music-and-food weekend that makes the Quarter feel even denser than a standard spring visit.",
    demandImpact:
      "Less extreme than Mardi Gras or Jazz Fest, but still a meaningful crowd and routing event in core visitor zones.",
    officialUrl: "https://frenchquarterfest.org/",
    viatorQuery: "French Quarter Festival walking tours",
    cruisePortNote:
      "Cruise visitors should expect more pressure in the Quarter and along the riverfront, especially for late-morning and evening blocks.",
    updatedAt: "2026-03-11",
  },
  {
    slug: "essence-festival",
    name: "Essence Festival of Culture",
    dateNote: "Expected: July 2 to July 6, 2026",
    status: "expected",
    location: "Smoothie King Center and Ernest N. Morial Convention Center",
    summary:
      "One of the city's biggest summer tourism weekends, with music, culture, wellness, and convention-center demand concentrated into one period.",
    demandImpact:
      "Large visitor volume, higher central-city demand, and more pressure around downtown and convention-center movement.",
    officialUrl: "https://www.essencefestival.com/",
    viatorQuery: "New Orleans Essence Festival experiences",
    cruisePortNote:
      "Cruise travelers near the convention center should expect heavier demand for transfers, dining, and event-adjacent mobility during Essence weekend.",
    updatedAt: "2026-03-11",
  },
  {
    slug: "southern-decadence",
    name: "Southern Decadence",
    dateNote: "Expected: Labor Day weekend 2026",
    status: "expected",
    location: "French Quarter",
    summary:
      "A major LGBTQ+ event with strong nightlife demand, street activity, and club-heavy visitor behavior.",
    demandImpact:
      "French Quarter nightlife density rises sharply, so buyers should treat it as a distinct festival-planning mode rather than a normal late-summer weekend.",
    officialUrl: "https://www.southerndecadence.com/",
    viatorQuery: "New Orleans Southern Decadence nightlife experiences",
    cruisePortNote:
      "Cruise arrivals over Southern Decadence weekend should expect a nightlife-first Quarter and book transport earlier than usual.",
    updatedAt: "2026-03-11",
  },
  {
    slug: "satchmo-summerfest",
    name: "Satchmo SummerFest",
    dateNote: "Expected: early August 2026",
    status: "expected",
    location: "New Orleans Jazz Museum and French Quarter edge",
    summary:
      "Louis Armstrong-centered jazz, brass, and heritage programming with a strong culture-first audience.",
    demandImpact:
      "Smaller than Jazz Fest, but still meaningful for music-focused travelers who want jazz-specific programming instead of broad nightlife.",
    viatorQuery: "New Orleans jazz heritage tours",
    cruisePortNote:
      "Cruise visitors who want jazz-first planning should use this weekend for heritage-music routing rather than generic Quarter wandering.",
    updatedAt: "2026-03-11",
  },
];
