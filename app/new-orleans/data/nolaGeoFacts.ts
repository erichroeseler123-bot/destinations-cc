export interface NolaGeoFact {
  id: string;
  categorySlug: string;
  directQuestion: string;
  directAnswer: string;
  pricingLabel: string;
  pricingValue: string;
  durationLabel: string;
  durationValue: string;
  meetingPointLabel: string;
  meetingPointValue: string;
  safetyBufferLabel: string;
  safetyBufferValue: string;
  faqSchema?: {
    question: string;
    answer: string;
  }[];
}

export const NOLA_GEO_FACTS: Record<string, NolaGeoFact> = {
  "swamp-tours": {
    id: "swamp-tours",
    categorySlug: "swamp-tours",
    directQuestion: "How much is a New Orleans swamp tour and do they include transportation?",
    directAnswer:
      "New Orleans swamp tours cost $55 to $95 per person with round-trip transportation included, or $35 to $60 per person if you drive yourself. Tour swamps are located in the Barataria Preserve or Honey Island Swamp (a 35-to-45 minute drive from downtown). Daily departures offer hotel pickup from French Quarter and Canal Street hotels with 100% refunds for weather cancellations.",
    pricingLabel: "Tour Rates",
    pricingValue: "$55–$95 w/ Hotel Pickup • $35–$60 Self-Drive",
    durationLabel: "Duration & Drive",
    durationValue: "3.5–4 hours total (~2 hours on the water)",
    meetingPointLabel: "Hotel Pickup Zone",
    meetingPointValue: "French Quarter, Canal St & Downtown/CBD hotels",
    safetyBufferLabel: "Weather & Guarantees",
    safetyBufferValue: "100% Weather Refund • Active Alligator Sightings (May–Oct)",
    faqSchema: [
      {
        question: "Do you need a car to do a swamp tour in New Orleans?",
        answer:
          "No. Most visitors book tours that include round-trip minibus or coach transportation directly from French Quarter and Downtown/CBD hotels, avoiding the need for rental cars or surge-priced rideshares.",
      },
      {
        question: "What is the best time of year to see alligators on a New Orleans swamp tour?",
        answer:
          "Alligators are most active during warm months from April through October. In cooler winter months (November–February), alligators brumate, but tours still operate to view bald eagles, wild boars, and moss-draped cypress scenery.",
      },
    ],
  },

  "airboat-tours": {
    id: "airboat-tours",
    categorySlug: "airboat-tours",
    directQuestion: "What is the difference between an airboat tour and a traditional swamp boat in New Orleans?",
    directAnswer:
      "Airboats are high-speed, fan-powered vessels carrying 6 to 16 passengers that can glide over shallow marshes and tidal bayous unreachable by conventional boats. Tours cost $85 to $125 per person and deliver a faster, adrenaline-filled open-air ride. Traditional covered swamp boats are slower, shaded, carry 25 to 35 passengers, and cost less ($55–$75).",
    pricingLabel: "Airboat Pricing",
    pricingValue: "$85–$125 per person (Noise protection included)",
    durationLabel: "Ride Duration",
    durationValue: "1.5–2 hours on water • ~4 hours with hotel transit",
    meetingPointLabel: "Transportation",
    meetingPointValue: "Canal St / French Quarter hotel pickup or on-site dock",
    safetyBufferLabel: "Restrictions",
    safetyBufferValue: "Minimum height 48\" on small airboats • Shaded boats for toddlers",
    faqSchema: [
      {
        question: "Are New Orleans airboat tours loud?",
        answer:
          "Yes. Giant aircraft-style propellers generate substantial noise, but all licensed operators provide professional noise-canceling headsets or earmuffs for every passenger.",
      },
    ],
  },

  "covered-swamp-boat-tours": {
    id: "covered-swamp-boat-tours",
    categorySlug: "covered-swamp-boat-tours",
    directQuestion: "Are covered swamp boat tours better for families and seniors in New Orleans?",
    directAnswer:
      "Yes. Covered tour boats feature overhead canvas canopies providing shade from the Louisiana sun and rain, stable flat-bottom hulls, and comfortable bench seating for 20 to 35 guests. At $55 to $75 with hotel transfers, they are ideal for families with young children, seniors, wildlife photographers, and anyone who prefers a peaceful, conversation-friendly bayou tour.",
    pricingLabel: "Covered Boat Rate",
    pricingValue: "$55–$75 w/ Transit • Lower rates for children",
    durationLabel: "Pacing & Time",
    durationValue: "2 hours on water • Calm, smooth cruising",
    meetingPointLabel: "Pickup Hub",
    meetingPointValue: "Central New Orleans hotel pickups included",
    safetyBufferLabel: "Weather Protection",
    safetyBufferValue: "Full roof coverage • Operates rain or shine safely",
  },

  "ghost-tours": {
    id: "ghost-tours",
    categorySlug: "ghost-tours",
    directQuestion: "How much do New Orleans ghost tours cost and do they go inside cemeteries at night?",
    directAnswer:
      "New Orleans ghost and haunted history tours cost $25 to $35 per adult and run 1.5 to 2 hours covering roughly 1 mile of flat walking through the French Quarter. Night tours do not enter historic cemeteries because the Archdiocese of New Orleans locks gates at dusk to protect sacred above-ground tombs; daytime cemetery tours are required for interior access.",
    pricingLabel: "Ticket Price",
    pricingValue: "$25–$35 per person • Discounts for students/seniors",
    durationLabel: "Walking Distance",
    durationValue: "1.5–2 hours • ~1 mile flat historic walk",
    meetingPointLabel: "Central Meeting Point",
    meetingPointValue: "Jackson Square, St. Louis Cathedral, or French Quarter taverns",
    safetyBufferLabel: "Cemetery Access Rules",
    safetyBufferValue: "Night tours view exterior gates • Daylight tours for interior tombs",
    faqSchema: [
      {
        question: "Can you drink alcohol on a New Orleans ghost tour?",
        answer:
          "Yes. New Orleans municipal law allows open plastic containers (go-cups) of alcohol on public streets and sidewalks throughout the French Quarter, and many evening tours include a quick bar stop.",
      },
      {
        question: "Are New Orleans ghost tours appropriate for children?",
        answer:
          "Most standard ghost tours are family-friendly (PG-13 rated folklore and history). However, late-night 'uncensored' 18+ tours discuss graphic crime, true crime, and brothel history, so check tour ratings before booking.",
      },
    ],
  },

  "riverboat-cruises": {
    id: "riverboat-cruises",
    categorySlug: "riverboat-cruises",
    directQuestion: "How much is a Mississippi River cruise in New Orleans on the Steamboat Natchez?",
    directAnswer:
      "Mississippi River cruises on the authentic Steamboat Natchez or Riverboat City of New Orleans cost $45 to $55 for daytime sightseeing or $90 to $105 for evening dinner cruises with live jazz. Departures board at the Toulouse Street Wharf behind Jackson Square, cruising 2 hours along the historic New Orleans harbor with live steam engine viewing and calliope music.",
    pricingLabel: "Cruise Pricing",
    pricingValue: "$45–$55 Sightseeing Only • $90–$105 with Buffet & Live Jazz",
    durationLabel: "Cruise Length",
    durationValue: "2 hours on the Mississippi River (Boarding 30 min prior)",
    meetingPointLabel: "Boarding Wharf",
    meetingPointValue: "Toulouse St Wharf (400 Toulouse St, French Quarter riverfront)",
    safetyBufferLabel: "Vessel Type",
    safetyBufferValue: "True Steam Propulsion (Natchez) & Modern Luxury (City of NOLA)",
    faqSchema: [
      {
        question: "Is food included on New Orleans riverboat cruises?",
        answer:
          "Food is optional. You can buy a sightseeing-only ticket to enjoy the decks, river breeze, and live jazz, or add the Creole/Cajun buffet option during booking.",
      },
    ],
  },

  "garden-district-tours": {
    id: "garden-district-tours",
    categorySlug: "garden-district-tours",
    directQuestion: "How do you get to the Garden District from the French Quarter and what do walking tours cover?",
    directAnswer:
      "The Garden District is 2.5 miles uptown from the French Quarter, easily reached via the historic St. Charles Avenue Streetcar ($1.25 cash or $3 Jazzy Pass). Walking tours cost $25 to $35, last 2 hours, and showcase antebellum Greek Revival mansions, celebrity homes (Sandra Bullock, John Goodman), historic oak canopies, and the perimeter of Lafayette Cemetery No. 1.",
    pricingLabel: "Walking Tour Price",
    pricingValue: "$25–$35 per person • Small group format",
    durationLabel: "Tour Duration",
    durationValue: "2 hours • ~1.2 miles walking under shade oaks",
    meetingPointLabel: "Meeting Point",
    meetingPointValue: "St. Charles Streetcar stops (Washington Ave / 6th St)",
    safetyBufferLabel: "Transit Advice",
    safetyBufferValue: "Take St. Charles Streetcar 20 min before meeting time",
  },

  "plantation-tours": {
    id: "plantation-tours",
    categorySlug: "plantation-tours",
    directQuestion: "How far are Louisiana plantations from New Orleans and which is best to visit?",
    directAnswer:
      "Historic River Road plantations are 50 to 55 miles west of New Orleans (about 1 hour by coach). Oak Alley is the most famous for its 300-year-old oak tree alley and restored Greek Revival mansion. The Whitney Plantation is the most educational, exclusively focused on the lives of enslaved people. Tours with round-trip coach transport cost $75 to $115 per person and run 5 to 6 hours total.",
    pricingLabel: "Coach & Admission",
    pricingValue: "$75–$115 per person (Includes entrance tickets & bus transit)",
    durationLabel: "Total Experience",
    durationValue: "5–6 hours round trip (~2.5 hours on plantation grounds)",
    meetingPointLabel: "Transportation Hub",
    meetingPointValue: "French Quarter / Canal St hotel pickups or central departure depot",
    safetyBufferLabel: "Combo Tours Available",
    safetyBufferValue: "Full-day combos pair Oak Alley + Barataria swamp tour in 1 day",
  },

  "french-quarter-tours": {
    id: "french-quarter-tours",
    categorySlug: "french-quarter-tours",
    directQuestion: "What is the best way to tour the French Quarter on your first visit?",
    directAnswer:
      "A guided morning or afternoon walking tour ($25–$35) is the best introduction to the 300-year-old French Quarter (Vieux Carré). Tours cover Jackson Square, the Cabildo, Spanish-influenced iron lace balconies on Royal Street, pirate history of Jean Lafitte, and local food traditions like beignets and chicory coffee, all within an easy 1.5-mile flat stroll.",
    pricingLabel: "Walking Tour Price",
    pricingValue: "$25–$35 per adult • Children discounted",
    durationLabel: "Tour Length",
    durationValue: "1.5–2 hours • Flat historic sidewalks",
    meetingPointLabel: "Departure Location",
    meetingPointValue: "Jackson Square / 700 block of Decatur St",
    safetyBufferLabel: "Pacing",
    safetyBufferValue: "Frequent shady stops • Open plastic drink containers allowed",
  },

  "city-tours": {
    id: "city-tours",
    categorySlug: "city-tours",
    directQuestion: "What does a comprehensive New Orleans city bus tour cover?",
    directAnswer:
      "A guided New Orleans city bus tour ($45–$65) covers 30 miles of historic neighborhoods in 2.5 to 3 hours in climate-controlled mini-coaches. Routes explore the French Quarter, Esplanade Avenue, St. Louis Cemetery, historic City Park, Lake Pontchartrain hurricane surge barriers, the Ninth Ward, and the Garden District.",
    pricingLabel: "Coach Tour Rate",
    pricingValue: "$45–$65 per person (Climate-controlled minibus)",
    durationLabel: "Tour Duration",
    durationValue: "2.5–3 hours total with step-off photo stops",
    meetingPointLabel: "Pickup Options",
    meetingPointValue: "Direct pickup at French Quarter & Downtown/CBD hotels",
    safetyBufferLabel: "Comfort",
    safetyBufferValue: "Air-conditioned • Minimal walking required",
  },

  "oak-alley-vs-whitney": {
    id: "oak-alley-vs-whitney",
    categorySlug: "guides",
    directQuestion: "Should you visit Oak Alley Plantation or the Whitney Plantation?",
    directAnswer:
      "Choose Oak Alley if your priority is iconic antebellum architecture, photography of the 300-year-old live oak canopy, and Big House historic tours. Choose the Whitney Plantation if you want the definitive, unflinching educational museum dedicated to the enslaved people who built Louisiana. Both sit along River Road 50 miles from New Orleans; full-day tours take approximately 5 to 6 hours.",
    pricingLabel: "Tour Comparison",
    pricingValue: "$75–$95 single plantation • $125–$160 combo with swamp tour",
    durationLabel: "Trip Duration",
    durationValue: "5–6 hours round-trip (~1 hour drive each way)",
    meetingPointLabel: "Hotel Pickup",
    meetingPointValue: "Direct coach pickup from Canal St / French Quarter hotels",
    safetyBufferLabel: "Booking Advice",
    safetyBufferValue: "Whitney requires advance tickets due to limited docent capacity",
    faqSchema: [
      {
        question: "Can you visit both Oak Alley and Whitney in one day?",
        answer:
          "Yes. Several specialty full-day River Road excursions bundle both Oak Alley and the Whitney Plantation into a 7 to 8-hour day trip with lunch included.",
      },
      {
        question: "Is there public transportation from New Orleans to Louisiana plantations?",
        answer:
          "No public transit or city buses run along River Road. Visitors must book an organized coach tour or rent a car for the 50-mile drive.",
      },
    ],
  },
};

export function getNolaGeoFact(categorySlug: string): NolaGeoFact | null {
  if (NOLA_GEO_FACTS[categorySlug]) {
    return NOLA_GEO_FACTS[categorySlug];
  }
  return null;
}
