export type PreSiteGuideCitation = {
  id: string;
  label: string;
  organization: string;
  url: string;
  checkedAt: string;
  claimSupported: string;
};

export type PreSiteGuideOptionComparison = {
  optionType: "direct_operator" | "marketplace" | "specialist" | "public_or_free" | "no_purchase";
  name: string;
  fitSummary: string;
  whenUnsuitable: string;
  url?: string;
  urlLabel?: string;
};

export type PreSiteGuide = {
  slug: string;
  category: "cruise" | "new-orleans" | "alaska" | "colorado" | "red-rocks" | "wisconsin" | "transportation";
  eyebrow: string;
  title: string;
  description: string;
  answer: string;
  matters: string[];
  tradeoffs: { label: string; body: string }[];
  questions: string[];
  nextStep: {
    label: string;
    body: string;
    href: string;
  };
  verifiedAt?: string;
  assumptionsAndUnknowns?: string[];
  citations?: PreSiteGuideCitation[];
  optionComparison?: PreSiteGuideOptionComparison[];
};

export const PRE_SITE_GUIDES: PreSiteGuide[] = [
  {
    slug: "what-can-you-do-in-an-8-hour-cruise-port-day",
    category: "cruise",
    eyebrow: "Cruise port planning",
    title: "What can you realistically do in an 8-hour cruise port day?",
    description: "A practical framework for turning an eight-hour port call into a plan without treating all eight hours as usable excursion time.",
    answer: "Start with the ship clock, not the attraction list. Subtract disembarkation time, travel time, meeting-point time, a conservative return buffer (such as a 90-minute planning buffer before all-aboard), and any weather or traffic exposure before deciding how much activity actually fits. Never treat a planning buffer or published schedule as a guarantee of ship return.",
    matters: ["All-aboard time, not published departure time", "Distance from the pier", "Transportation reliability", "Weather sensitivity", "A realistic return-to-ship margin"],
    tradeoffs: [
      { label: "More activity", body: "You see more, but every extra transfer or timed stop reduces recovery room if something slips." },
      { label: "One anchor experience", body: "You may do less, but the day is easier to protect and easier to change if conditions move." },
      { label: "Independent plan", body: "Often more flexible, but you own the timing and return logistics." },
    ],
    questions: ["What time can you actually be off the ship?", "How far is the experience from the pier?", "What is your latest comfortable return time?", "What is your fallback if weather or traffic changes the plan?"],
    nextStep: { label: "Plan the whole cruise", body: "Once the port-day decision is clear, put it into a shared cruise plan with your group.", href: "https://cruisepromenade.com" },
  },
  {
    slug: "juneau-helicopter-tour-weather-backup-plan",
    category: "alaska",
    eyebrow: "Juneau shore day",
    title: "What should your backup be if a Juneau helicopter tour is canceled?",
    description: "Build the backup before the port day so a weather cancellation does not turn into wasted time at the pier.",
    answer: "Treat the helicopter flight as Plan A and choose a lower-weather-risk Plan B before arrival. FAA Part 135 helicopter operators (TEMSCO, Coastal, NorthStar) frequently hold or cancel icefield landings when cloud ceilings drop below 1,500 ft or flat light obscures the glacier, even while surface activities like Auke Bay whale watching (~3.5–4.0 hrs dock-to-dock) and USFS Mendenhall Glacier ground shuttles (~2.5–3.5 hrs) continue operating. Never treat a surface weather forecast as a guarantee that flights will or will not dispatch; only the licensed operator cancels a flight.",
    matters: ["Flight weather can differ from conditions at the dock", "Cancellation timing", "How quickly you can pivot", "Remaining port time after cancellation", "Backup meeting location"],
    tradeoffs: [
      { label: "Wait for flight conditions", body: "You preserve the marquee experience but may lose the window for a strong backup." },
      { label: "Pivot early", body: "You protect the day but may give up a flight that could have operated later." },
      { label: "Keep a simple backup", body: "A less complicated Plan B is easier to execute after a late cancellation." },
    ],
    questions: ["When does the operator make the weather call?", "Is the backup bookable close to departure?", "How much ship time remains after a cancellation?", "Can the backup start near downtown or the cruise docks?"],
    nextStep: { label: "Compare Juneau flight choices", body: "Use Juneau Flight Deck when you are ready to narrow the actual flightseeing and backup options.", href: "https://juneauflightdeck.com/helicopter" },
  },
  {
    slug: "juneau-whale-watching-or-glacier-flight",
    category: "alaska",
    eyebrow: "Juneau comparison",
    title: "Whale watching or a glacier flight in Juneau?",
    description: "Choose between two signature Juneau experiences by looking at weather risk, intensity, scenery, group fit, and the ship clock.",
    answer: "Pick the experience whose failure mode you are most comfortable with. Helicopter glacier landings (TEMSCO, Coastal, NorthStar; 3.0–4.25 hrs dock-to-dock including 30–45 min pre-flight check-in and JNU Airport shuttle) deliver aerial icefield views and time on the ice, but depend on FAA Part 135 ceiling/visibility clearance and passenger weight balance. Auke Bay whale watching (e.g., Allen Marine; 3.5–4.0 hrs dock-to-dock including 20 min check-in, 25 min transfer each way, and ~150 min on-water) operates under low cloud ceilings that ground helicopters. Both require protecting your ship's all-aboard time with a conservative 90-minute planning buffer (which is a planning margin, not a guarantee).",
    matters: ["Weather tolerance", "Fear of flying or motion sensitivity", "Mobility", "Total excursion duration", "Whether your group values wildlife or landscape more"],
    tradeoffs: [
      { label: "Glacier flight", body: "Higher visual drama and a unique perspective, with more weather sensitivity." },
      { label: "Whale watching", body: "Wildlife-focused and less dependent on flight conditions, but still weather- and sea-condition dependent." },
      { label: "Try to combine both", body: "Potentially memorable, but requires ~7.5–9.0+ hours in port, coordinated Auke Bay <-> JNU Airport valley transfer (15–25 min), and a 90-minute planning buffer." },
    ],
    questions: ["Would you be more disappointed to miss wildlife or aerial glacier scenery?", "How much weather uncertainty are you comfortable with?", "Does anyone in the group have mobility, motion, or flight concerns?", "How much uncommitted time remains before all-aboard?"],
    nextStep: { label: "See Juneau flight options", body: "When the decision points toward flightseeing, continue with the specialist Juneau site.", href: "https://juneauflightdeck.com/helicopter" },
  },
  {
    slug: "new-orleans-airboat-vs-covered-swamp-boat",
    category: "new-orleans",
    eyebrow: "New Orleans swamp tours",
    title: "Airboat or covered swamp boat in New Orleans?",
    description: "Choose the swamp experience that fits your group instead of assuming the fastest or loudest boat is automatically better.",
    answer: "Choose by child age, noise tolerance, shade/weather exposure, and whether you need hotel pickup from New Orleans. Covered flat-bottom pontoon boats offer overhead roofs, guardrails, and quieter narration: Cajun Encounters in Honey Island Swamp welcomes all ages on its Original Swamp Tour (from $39.99/person, up to 22 guests; its 10–12 guest VIP Small-Boat Tour requires age 13+ unless booked private) with optional French Quarter/downtown hotel pickup; Cajun Pride in Manchac Bayou welcomes all ages with optional shuttle pickup from New Orleans, Metairie, and Kenner hotels; and Gray Line New Orleans in Jean Lafitte welcomes all ages ($65 adults 13+, $58.50 seniors 65+, $32 children 6–12, infants 2–5 free) with round-trip motorcoach transportation included from the Steamboat NATCHEZ dock at 400 Toulouse St. High-speed airboats (such as Airboat Adventures in Jean Lafitte, 6–30 passenger open boats from $89/person) enforce a strict minimum age of 5 years, prohibit pregnant women and anyone with neck or back injuries, require guests to board unassisted, require hearing protection, and have no roof. Without a rental car, always choose a pickup-included tour or shuttle add-on (Airboat Adventures charges $30/person round-trip from Downtown/French Quarter hotels only, beginning 1 hr 15 min prior, and excludes residential addresses/Airbnbs) because rural bayou docks 30–45 minutes outside New Orleans do not have return cab/Uber/Lyft coverage. For public/self-guided wetlands, note that the NPS Barataria Preserve Visitor Center and most trails are closed for ~2 years starting February 2, 2026: only the Twin Canals parking lot, trail, and canoe launch remain open free (no restrooms), while the open Wetland Trace Boardwalk is at the relocated Louisiana Wetlands Education Center (4917 City Park Drive, Jean Lafitte), which charges admission ($10 adults; $5 seniors/ages 13–17/LA residents/military; under 12 free with parent). Unknowns to check: exact child ages, hotel pickup eligibility, travel date, and live seat/shuttle availability.",
    verifiedAt: "2026-11-02",
    assumptionsAndUnknowns: [
      "Unknown: Youngest child's exact age — children under age 5 are barred from high-speed airboats (Airboat Adventures min age 5) and must ride a covered pontoon boat (note: Cajun Encounters allows all ages on its Original Swamp Tour, but requires age 13+ on its VIP Small-Boat Tour unless private).",
      "Unknown: Whether your group has a car or needs hotel/coach pickup — self-drive tickets leave travelers stranded at rural Slidell/Manchac/Lafitte docks because return cab/Uber/Lyft service is unavailable, and Airboat Adventures' $30/person shuttle serves Downtown/French Quarter hotels only (no Airbnbs or residential addresses).",
      "Unknown: Travel date, departure slot, and live boat/shuttle availability (forecasts and published schedules do not guarantee open seats or wildlife sightings).",
    ],
    citations: [
      {
        id: "nola-cajun-encounters",
        label: "Cajun Encounters — Honey Island Swamp Tour (Original All-Ages vs. VIP 13+ & Hotel Shuttle)",
        organization: "Cajun Encounters Tour Company",
        url: "https://www.cajunencounters.com/tours/swamp-tour-new-orleans",
        checkedAt: "2026-11-02",
        claimSupported: "Covered flat-bottom boat in Honey Island Swamp (Slidell, ~45 min from French Quarter; ~2 hrs on water, 4–5 hrs total with optional French Quarter/downtown hotel pickup); Original Swamp Tour (from $39.99) welcomes all ages, while VIP Small-Boat Tour (from $99.99) requires age 13+ unless booked private.",
      },
      {
        id: "nola-cajun-pride",
        label: "Cajun Pride Swamp Tours — Manchac Bayou Covered Boat, All-Ages & Hotel Shuttle FAQ",
        organization: "Cajun Pride Swamp Tours",
        url: "https://www.cajunprideswamptours.com/questions",
        checkedAt: "2026-11-02",
        claimSupported: "Covered pontoon swamp boat on private Manchac wildlife refuge (LaPlace, 27 miles from French Quarter) open to any age group, with optional round-trip shuttle pickup from New Orleans, Metairie, and Kenner area hotels.",
      },
      {
        id: "nola-gray-line",
        label: "Gray Line New Orleans — Swamp & Bayou Covered Boat Tour (Included 400 Toulouse St. Coach)",
        organization: "Gray Line New Orleans",
        url: "https://www.graylineneworleans.com/swamp-tours/swamp-bayou-tour/",
        checkedAt: "2026-11-02",
        claimSupported: "Covered pontoon boat in Jean Lafitte open to all ages ($65 adults 13+, $58.50 seniors 65+, $32 children 6–12, infants 2–5 free) with round-trip motorcoach transportation included from the Lighthouse Ticket Office at the Steamboat NATCHEZ dock (400 Toulouse St.; 3 hrs 45 min total).",
      },
      {
        id: "nola-airboat-adventures-pickup",
        label: "Airboat Adventures — Pickup Locations ($30/Person Downtown/FQ Hotel Shuttle)",
        organization: "Airboat Adventures",
        url: "https://airboatadventures.com/pickup-locations/",
        checkedAt: "2026-11-02",
        claimSupported: "Round-trip hotel transportation is $30/person extra (pickup begins 1 hr 15 min prior to tour time) from Downtown/French Quarter area hotels only (no residential addresses or Airbnbs), and cab/rideshare service is not available for return from Lafitte.",
      },
      {
        id: "nola-airboat-adventures-faqs",
        label: "Airboat Adventures — FAQs (Minimum Age 5, Pregnancy, Neck/Back & Boarding Rules)",
        organization: "Airboat Adventures",
        url: "https://airboatadventures.com/faqs/",
        checkedAt: "2026-11-02",
        claimSupported: "Children under 5 years old, pregnant women, and anyone with neck or back injuries are not allowed on airboats, and guests must be able to board the airboat without assistance.",
      },
      {
        id: "nola-nps-barataria",
        label: "Jean Lafitte National Historical Park and Preserve — Barataria Preserve Closure & Relocated Boardwalk",
        organization: "U.S. National Park Service (NPS)",
        url: "https://www.nps.gov/jela/planyourvisit/barataria-preserve.htm",
        checkedAt: "2026-11-02",
        claimSupported: "Starting Feb 2, 2026, the Barataria Preserve Visitor Center and most trails are closed for ~2 years; only the Twin Canals parking lot, trail, and canoe launch remain open free (no restrooms), while visitor services and the open Wetland Trace Boardwalk are relocated 6 miles away to the Louisiana Wetlands Education Center (4917 City Park Drive, Jean Lafitte), which charges admission ($10 adults; $5 seniors/ages 13–17/LA residents/military; under 12 free with parent). No public transit serves either site.",
      },
    ],
    optionComparison: [
      {
        optionType: "direct_operator",
        name: "Covered Pontoon Swamp Boat with Hotel/Coach Transport (Cajun Encounters / Cajun Pride / Gray Line)",
        fitSummary: "Best fit for families with kids (including under age 5) and travelers without a car: shaded flat-bottom boat, guardrails, quieter narration, and coordinated round-trip New Orleans hotel shuttle (Cajun Encounters Original Tour all ages; Cajun Pride all ages) or included 400 Toulouse St. coach departure (Gray Line all ages).",
        whenUnsuitable: "Unsuitable if your group specifically wants a high-speed open-air airboat ride and all participants are age 5+ (also note Cajun Encounters' VIP Small-Boat requires age 13+ unless private).",
        url: "https://www.cajunencounters.com/tours/swamp-tour-new-orleans",
        urlLabel: "Cajun Encounters Official Swamp Tour",
      },
      {
        optionType: "direct_operator",
        name: "High-Speed Airboat with $30/Person Hotel Pickup Add-On (Airboat Adventures)",
        fitSummary: "Fits groups where everyone is age 5+ who want a fast, louder, open-air marsh ride (small airboats from $89/person; round-trip Downtown/French Quarter hotel shuttle add-on is $30/person).",
        whenUnsuitable: "Prohibited for children under age 5, pregnant women, and anyone with neck/back injuries; guests must board unassisted; no roof shade; hotel shuttle does not pick up at Airbnbs or residential addresses.",
        url: "https://airboatadventures.com/pickup-locations/",
        urlLabel: "Airboat Adventures Pickup & Tour Details",
      },
      {
        optionType: "marketplace",
        name: "Verified Marketplace Hotel-Pickup Listings (/operators/cajun-encounters-swamp)",
        fitSummary: "Review preserved Viator Partner API v2 product specifications (e.g., Cajun Encounters 6953SWAMPTRANS and Cajun Pride 141126P2 with hotel pickup).",
        whenUnsuitable: "Avoid self-drive-only marketplace SKUs if you do not have a rental car.",
        url: "/operators/cajun-encounters-swamp",
        urlLabel: "DCC Verified Operator & Product Evidence",
      },
      {
        optionType: "specialist",
        name: "Welcome to the Swamp — Family & Pickup Comparison Surface",
        fitSummary: "DCC specialist site with warm-transfer context for family and no-car swamp tour comparison.",
        whenUnsuitable: "Unnecessary if booking directly with the operator or skipping a paid swamp tour.",
        url: "https://welcometotheswamp.com/plan?intent=compare&topic=swamp-tours&subtype=families&context=no-car&source=dcc&sourcePage=%2Fnew-orleans%2Fswamp-tours%2Fairboat-vs-boat",
        urlLabel: "Compare on Welcome to the Swamp",
      },
      {
        optionType: "public_or_free",
        name: "NPS Barataria Preserve (Twin Canals Only Free) & Paid Wetland Trace Boardwalk ($10 Adult)",
        fitSummary: "Self-drive wetland walk option: starting Feb 2, 2026 for ~2 years, the Barataria Preserve Visitor Center and most trails are closed; only the Twin Canals parking lot, trail, and canoe launch remain open free (no restrooms), while the open Wetland Trace Boardwalk at the relocated Louisiana Wetlands Education Center (4917 City Park Drive, Jean Lafitte) charges admission ($10 adults; $5 seniors/ages 13–17/LA residents/military; under 12 free with parent).",
        whenUnsuitable: "No public transit reaches either site; most Barataria Preserve boardwalks are closed for ~2 years; and Wetland Trace Boardwalk requires paid admission plus a car.",
        url: "https://www.nps.gov/jela/planyourvisit/barataria-preserve.htm",
        urlLabel: "NPS Barataria Closure & Relocation Alert",
      },
      {
        optionType: "no_purchase",
        name: "Skip the Swamp Excursion / Stay in New Orleans via Streetcar",
        fitSummary: "No-purchase / transit option: take the $1.25 RTA streetcar to City Park (Couturie Forest & bayou lagoons) or Audubon Park without a 4-hour rural transfer.",
        whenUnsuitable: "Does not replace a deep cypress-tupelo swamp boat ride outside the city levees.",
      },
    ],
    matters: ["Young children (airboats require age 5+; Cajun Encounters VIP Small-Boat requires 13+ unless private)", "Noise sensitivity", "Weather exposure & roof shade", "Mobility & unassisted boarding", "Hotel shuttle pickup ($30/pp on Airboat Adventures; included coach from 400 Toulouse St. on Gray Line) vs. self-drive"],
    tradeoffs: [
      { label: "Airboat (Age 5+ only)", body: "More speed and open-air sensation, with loud engine noise, no roof, a strict minimum age of 5 years (no pregnancy or neck/back injuries; unassisted boarding required), and a $30/person Downtown/FQ hotel shuttle add-on on Airboat Adventures." },
      { label: "Covered pontoon boat (All ages)", body: "Calmer, shaded, guardrailed, and open to infants/toddlers (Cajun Encounters Original Tour, Cajun Pride, and Gray Line), though without high-speed airboat slides." },
      { label: "Hotel shuttle vs. self-drive", body: "Without a car, book a hotel-pickup SKU, Gray Line's 400 Toulouse St. coach departure, or Airboat Adventures' $30/pp Downtown/FQ hotel shuttle; rural docks in Slidell/Manchac/Lafitte lack return Uber/Lyft service." },
    ],
    questions: ["Are any children under age 5?", "Does anyone dislike loud rides or lack of shade?", "Is your hotel inside the Downtown/French Quarter pickup zone (not an Airbnb)?", "Do you have a car, or do you need a round-trip hotel shuttle / coach SKU?"],
    nextStep: { label: "Compare family & pickup swamp experiences", body: "Continue to the family and no-car comparison plan on Welcome to the Swamp, or verify seats directly with Cajun Encounters, Cajun Pride, or Gray Line.", href: "https://welcometotheswamp.com/plan?intent=compare&topic=swamp-tours&subtype=families&context=no-car&source=dcc&sourcePage=%2Fnew-orleans%2Fswamp-tours%2Fairboat-vs-boat" },
  },
  {
    slug: "what-to-do-in-new-orleans-with-no-plan",
    category: "new-orleans",
    eyebrow: "New Orleans planning",
    title: "What should you do in New Orleans if you arrived with no plan?",
    description: "A simple way to choose what to do when your group is already in New Orleans and nobody wants to spend an hour researching.",
    answer: "Start with the amount of time you actually have and how much effort the group wants to spend. Then choose one anchor: understand the city, get on the river, go into the swamp, visit a plantation site, eat and drink, or do something spooky after dark.",
    matters: ["How many usable hours you have", "Whether everyone is together yet", "Walking tolerance", "Daytime vs evening", "Pickup and transportation needs"],
    tradeoffs: [
      { label: "Stay in the city", body: "Easy to execute and flexible if the group is assembling at different times." },
      { label: "Leave the city", body: "Swamp and plantation experiences can feel more distinct, but require a larger time commitment." },
      { label: "Book nothing yet", body: "You preserve flexibility, but popular timed experiences may have less availability later." },
    ],
    questions: ["How many hours does everyone actually have together?", "Does the group want history, scenery, food, nightlife, or wildlife?", "How much walking is comfortable?", "Does anyone need hotel pickup or simple transportation?"],
    nextStep: { label: "See New Orleans choices", body: "Once you know the kind of day you want, use the New Orleans specialist site to choose the actual experience.", href: "https://welcometoneworleanstours.com" },
  },
  {
    slug: "first-hour-in-the-french-quarter",
    category: "new-orleans",
    eyebrow: "French Quarter orientation",
    title: "What should you learn in your first hour in the French Quarter?",
    description: "Get oriented before you start wandering so the rest of the visit is easier to understand and navigate.",
    answer: "Use the first hour to understand the Quarter's shape, the river, the major streets, where nightlife concentrates, where quieter blocks begin, and how far your hotel or meeting point is from the places you want to revisit later.",
    matters: ["Your hotel or starting point", "River orientation", "Nighttime plans", "Walking tolerance", "Where your group will regroup later"],
    tradeoffs: [
      { label: "Wander immediately", body: "Fun and spontaneous, but you may spend the rest of the trip repeatedly checking maps." },
      { label: "Orient first", body: "Less spontaneous for the first hour, but it can make every later decision easier." },
      { label: "Deep tour first", body: "More context, but it may be more commitment than a newly arrived group wants." },
    ],
    questions: ["Where are you staying?", "What do you want to return to tonight?", "Who in the group needs the easiest walking route?", "Where will everyone meet if you split up?"],
    nextStep: { label: "Get French Quarter oriented", body: "Use the dedicated orientation site when you want a focused first-step experience rather than a full destination tour.", href: "https://frenchquarterorientation.com" },
  },
  {
    slug: "denver-airport-to-vail-rental-car-vs-private-transfer",
    category: "colorado",
    eyebrow: "Colorado mountain transportation",
    title: "DEN to Vail: rental car, shared shuttle, or private transfer (including groups of 7 with ski bags)?",
    description: "Compare the real capacity, winter-driving, and pricing tradeoffs between private vans/SUVs, shared shuttles, rental cars, and public transit from Denver Airport to Vail.",
    answer: "Never conflate passenger seat count with winter ski-bag capacity. On the ~100-mile I-70 climb from Denver International Airport (DEN) to Vail over the 11,158-ft Eisenhower Tunnel and 10,662-ft Vail Pass, 7 people with ski/snowboard bags and winter suitcases physically cannot fit in a single standard private SUV (capped at 5–6 passengers max, or 4–5 with ski gear) or a single 7-seat minivan/midsize SUV. For 7 travelers with ski bags, compare four realistic choices: (1) a private full-size passenger van / Sprinter (10–14 seat class) that keeps all 7 people and ski bags together door-to-door (on GoSno, private SUVs up to 6 pax list at $499 one-way DEN–Vail, while private vans up to 10 pax required for 7 people are marked quoteOnly: true and require a live quote/availability check—never assume an instant van rate); (2) a per-seat shared shuttle such as Epic Mountain Express (published DEN–Vail rates vary by travel date and peak/holiday periods from $59–$129/guest to Vail Transfer Center or $69–$139/guest door-to-door before 20% Epic Pass discount on non-blackout dates, allowing 2 baggage items including a ski/snowboard bag plus 1 small personal item per guest), which works best when flight arrivals are staggered; (3) two AWD/4WD rental SUVs with ski racks, which must comply with the Colorado Statutory Traction Law (C.R.S. § 42-4-106, Code 15, mandatory Sept 1–May 31 on I-70) while accounting for rental-contract chain prohibitions and $40–$65+/night per-vehicle Vail Village parking (where in-town Vail buses are free); or (4) public transit via the RTD A-Line ($10.50/person) to Denver Union Station plus CDOT Bustang West Line ($17/person) to Vail Transportation Center. Unknowns to confirm: travel date, flight arrival windows, exact count of ski bags + suitcases, child car-seat needs, and live vehicle/quote availability.",
    verifiedAt: "2026-11-02",
    assumptionsAndUnknowns: [
      "Unknown: Exact count and length of ski/snowboard bags plus checked suitcases — 7 passengers plus winter ski bags exceed any 6-passenger private SUV and require a 10–14 passenger van, per-seat shared shuttle, or two vehicles.",
      "Unknown: Travel date, DEN flight arrival time(s), and whether all 7 travelers land together — staggered arrivals across terminals/hours often favor per-seat shared shuttles over holding one private van, and shared shuttle fares vary by travel date and peak/holiday periods.",
      "Unknown: Live vehicle availability and custom van quote — GoSno's captured DEN–Vail catalog lists private SUVs (up to 6 pax) at $499 one-way, while private vans (up to 10 pax, required for 7 travelers) are quote-only (quoteOnly: true) and must be confirmed directly.",
      "Unknown: Child car-seat/booster requirements and exact Vail lodging location (pedestrian Vail Village vs. outlying condo with parking).",
      "Planning Assumption: Sept 1–May 31 travel on I-70 (MP 133 Dotsero to MP 259 Morrison) is subject to Colorado Statutory Traction Law (C.R.S. § 42-4-106 Code 15), and winter storms or tunnel metering can extend the 2h 00m–2h 30m baseline drive to 3.5+ hours.",
    ],
    citations: [
      {
        id: "col-gosno-catalog",
        label: "GoSno Private Mountain Transfer — DEN to Vail Vehicle Capacity & Quote-Only Van Rule",
        organization: "GoSno LLC (CO PUC LL-03577)",
        url: "https://gosno.co/vail",
        checkedAt: "2026-11-02",
        claimSupported: "GoSno operates private SUVs (up to 6 passengers, $499 one-way DEN–Vail baseline) and private vans (up to 10 passengers, marked quoteOnly: true for groups of 7+ with ski bags; never shared per-seat shuttles).",
      },
      {
        id: "col-epic-shuttle",
        label: "Epic Mountain Express — Official Shuttle Service Rates & Bag Policy (DEN to Vail)",
        organization: "Epic Mountain Express",
        url: "https://www.epicmountainexpress.com/shuttle-rates",
        checkedAt: "2026-11-02",
        claimSupported: "Published DEN–Vail shared shuttle rates vary by travel date and peak/holiday periods from $59–$129/guest (Vail Transfer Center) to $69–$139/guest (door-to-door), or $55–$111 door-to-door with 20% Epic Mountain Rewards on non-blackout dates; each guest is allowed 2 baggage items (including a ski/snowboard bag) plus 1 small personal item.",
      },
      {
        id: "col-cdot-traction",
        label: "CDOT Passenger Vehicle Traction & Chain Laws (C.R.S. § 42-4-106)",
        organization: "Colorado Department of Transportation (CDOT)",
        url: "https://www.codot.gov/travel/winter-driving/tractionlaw",
        checkedAt: "2026-10-23",
        claimSupported: "From Sept 1 to May 31 on I-70 (MP 133 to MP 259), all passenger vehicles must have AWD/4WD or M+S/3PMSF winter tires with at least 3/16-inch tread depth.",
      },
      {
        id: "col-cdot-bustang",
        label: "CDOT Bustang West Line — Denver Union Station to Vail Transportation Center",
        organization: "Colorado Department of Transportation (CDOT)",
        url: "https://www.codot.gov/travel/bustang",
        checkedAt: "2026-10-23",
        claimSupported: "Public motorcoach service from Denver Union Station ($10.50 RTD A-Line from DEN) to Vail Transportation Center ($17 one-way) with under-coach ski/luggage bays.",
      },
    ],
    optionComparison: [
      {
        optionType: "direct_operator",
        name: "Private Full-Size Passenger Van / Sprinter (10–14 Pax Class, e.g., GoSno Private Van)",
        fitSummary: "Best single-vehicle fit for 7 people with ski bags: keeps all 7 passengers and ski/boot bags together door-to-door from DEN to Vail with an experienced mountain driver. Note: GoSno SUVs cap at 6 pax ($499); 7-passenger private vans (up to 10 pax) are quoteOnly: true and require a live quote/availability check.",
        whenUnsuitable: "Unsuitable if your 7 travelers arrive on flights several hours apart and do not want to wait at DEN, or if you want the lowest budget transit fare.",
        url: "https://gosno.co/vail?origin=DEN&destination=Vail&passengers=7&passengerCount=7&vehicleClass=van",
        urlLabel: "GoSno Vail Route & Van Inquiry",
      },
      {
        optionType: "direct_operator",
        name: "Shared Airport Shuttle (Epic Mountain Express / Peak 1 Express)",
        fitSummary: "Per-seat airport shuttle (Epic Mountain Express published DEN–Vail rates vary by travel date from $59–$129/guest to Vail Transfer Center or $69–$139/guest door-to-door) allowing 2 baggage items (including a ski/snowboard bag) + 1 small personal item per guest; ideal if your 7 travelers arrive on staggered flights.",
        whenUnsuitable: "For 7 people arriving together on peak dates, 7 per-seat tickets can approach a private van while adding airport staging and multi-hotel stop delays.",
        url: "https://www.epicmountainexpress.com/shuttle-rates",
        urlLabel: "Epic Mountain Express Official Shuttle Rates",
      },
      {
        optionType: "direct_operator",
        name: "Two AWD/4WD Rental SUVs with Ski Racks (or 12-Passenger Rental Van)",
        fitSummary: "Gives independent regional driving if you plan day trips outside the Vail Valley.",
        whenUnsuitable: "A single 7-seat SUV/minivan cannot hold 7 people + ski bags; renting two AWD vehicles doubles rental cost, I-70 winter driving exposure under C.R.S. § 42-4-106, rental chain-ban risk, and Vail Village overnight parking ($40–$65+/night per vehicle).",
        url: "https://www.codot.gov/travel/winter-driving/tractionlaw",
        urlLabel: "CDOT I-70 Traction Law Requirements",
      },
      {
        optionType: "public_or_free",
        name: "Public Transit: RTD A-Line ($10.50) + CDOT Bustang West Line ($17) + Free Vail Bus",
        fitSummary: "Lowest-cost option (~$27.50/person one-way) from DEN to Vail Transportation Center via Denver Union Station, connecting directly into the Town of Vail's 100% free municipal bus network.",
        whenUnsuitable: "Requires transferring 7 people and ski bags between the RTD commuter train and Bustang coach at Union Station and reserving 7 coach seats ahead of time.",
        url: "https://www.codot.gov/travel/bustang",
        urlLabel: "CDOT Bustang West Line Schedule & Fares",
      },
      {
        optionType: "no_purchase",
        name: "Skip Renting an In-Resort Car (Use Free Town of Vail Transit)",
        fitSummary: "Once in Vail, the Town of Vail bus system is free and frequent across Vail Village, Lionshead, and Golden Peak—so groups staying near the village or bus routes do not need a parked rental car during their stay.",
        whenUnsuitable: "Does not solve the 100-mile DEN-to-Vail airport transfer itself.",
      },
    ],
    matters: ["Passenger count vs. ski-bag cargo volume (7 people + ski bags exceed a 6-pax SUV)", "Colorado I-70 Traction Law (C.R.S. § 42-4-106, Sept 1–May 31)", "Whether you need a car in Vail (free in-town buses vs. $40–$65+/night parking)", "Same-flight vs. staggered arrival times", "Quote-only private van vs. date-variable per-seat shared shuttle pricing"],
    tradeoffs: [
      { label: "Private 10–14 pax van", body: "Keeps all 7 people and ski bags in one door-to-door vehicle without I-70 driving or parking costs; requires a live quote/availability check (quoteOnly: true on GoSno for 7+ pax)." },
      { label: "Shared shuttle (per seat)", body: "Includes 2 baggage items (such as a ski bag) + 1 personal item per guest and handles staggered flight arrivals well, though per-seat fares vary by travel date ($59–$139/guest on Epic Mountain Express) and 7 peak-date seats can approach a private van." },
      { label: "Two AWD rental SUVs", body: "Provides off-resort driving freedom, but a single SUV cannot fit 7 people + ski bags, and two vehicles double winter driving risk and $40–$65+/night Vail parking." },
      { label: "RTD A-Line + CDOT Bustang", body: "Lowest fare (~$27.50/person to Vail Transportation Center), but requires carrying ski bags through a Union Station transfer." },
    ],
    questions: ["How many total ski/snowboard bags and large suitcases are the 7 travelers bringing?", "Are all 7 people landing at DEN on the same flight window?", "Will you actually drive outside Vail when Town of Vail in-town buses are free?", "Have you requested a live quote for a 10–14 passenger van rather than assuming a 6-seat SUV fits?"],
    nextStep: { label: "Check GoSno Vail private van & route options", body: "If a private transfer fits, continue to GoSno's dedicated Vail route page (SUVs fit up to 6 pax; groups of 7 with ski bags require a quote-only 10-passenger van) or inspect the DCC GoSno operator profile (/operators/gosno).", href: "https://gosno.co/vail?origin=DEN&destination=Vail&passengers=7&passengerCount=7&vehicleClass=van" },
  },
  {
    slug: "do-you-need-a-car-in-breckenridge",
    category: "colorado",
    eyebrow: "Breckenridge trip planning",
    title: "Do you actually need a car in Breckenridge?",
    description: "Decide whether a rental car will improve the trip or simply become something you have to park and manage.",
    answer: "Base the decision on what happens after check-in. If most of the trip is centered on the resort, town, and local transportation, a car may add less value than expected. If you plan independent day trips, dispersed lodging, or frequent travel outside the core area, the calculation changes.",
    matters: ["Where you are staying", "Planned day trips", "Local transportation access", "Parking", "Winter driving comfort"],
    tradeoffs: [
      { label: "No car", body: "Simpler arrival and no parking burden, with more dependence on local transportation." },
      { label: "Rental car", body: "More regional freedom, with the cost and responsibility of keeping a vehicle." },
      { label: "Private arrival transfer", body: "Separates the airport problem from the in-town mobility problem." },
    ],
    questions: ["Can you walk or shuttle to most planned activities?", "Are there specific day trips that require a car?", "Does your lodging include practical parking?", "Would the driver be comfortable with snow and mountain roads?"],
    nextStep: { label: "Solve the airport transfer", body: "If you decide you do not need a rental car for the stay, GoSno can handle the airport-to-resort leg.", href: "https://gosno.co" },
  },
  {
    slug: "best-way-to-get-to-red-rocks-without-driving",
    category: "red-rocks",
    eyebrow: "Red Rocks transportation",
    title: "What is the best way to get to Red Rocks without driving?",
    description: "Compare the transportation options by the part that matters most: what happens before and especially after the show.",
    answer: "Choose based on the return plan, not just the ride out. A transportation option that feels easy before the concert can become frustrating when thousands of people leave at once. Decide where you want to be dropped after the show and how much certainty you want around departure.",
    matters: ["Post-show pickup plan", "Where you are staying", "Group size", "Alcohol plans", "Tolerance for waiting after the concert"],
    tradeoffs: [
      { label: "Scheduled shuttle", body: "A defined departure and return structure, with less flexibility if your plans change." },
      { label: "Rideshare", body: "Flexible in theory, but post-event demand and pickup logistics can complicate the exit." },
      { label: "Private vehicle", body: "More control for a group, with a higher cost than shared transportation." },
    ],
    questions: ["Where do you want to end the night?", "Does everyone leave together?", "How much waiting after the show is acceptable?", "Do you want a fixed return departure or maximum flexibility?"],
    nextStep: { label: "Choose Red Rocks transportation", body: "When you are ready to buy the ride, continue to the Red Rocks transportation site.", href: "https://partyatredrocks.com" },
  },
  {
    slug: "red-rocks-day-visit-without-a-car",
    category: "red-rocks",
    eyebrow: "Red Rocks daytime",
    title: "Can you visit Red Rocks during the day without a car?",
    description: "Plan a daytime Red Rocks visit separately from concert transportation—the timing and transportation problem are different.",
    answer: "Yes, but treat it as a transportation itinerary rather than assuming the venue works like a downtown attraction. Decide your departure point, how long you want on site, and exactly how you are getting back before you go.",
    matters: ["Departure point", "Time on site", "Return transportation", "Event-day restrictions", "Walking and elevation tolerance"],
    tradeoffs: [
      { label: "Fixed round trip", body: "Simple and predictable, but your visit length is predetermined." },
      { label: "Rideshare both ways", body: "Flexible, but availability and pickup conditions can vary." },
      { label: "Rental car", body: "Maximum control, with the usual parking and driving responsibilities." },
    ],
    questions: ["Are you visiting on a concert day?", "How long do you want at the amphitheatre?", "Where do you want the return ride to end?", "Is everyone comfortable with stairs and elevation?"],
    nextStep: { label: "See the daytime ride", body: "For the dedicated daytime transportation product, continue to Red Rocks Fast Pass.", href: "https://redrocksfastpass.com" },
  },
  {
    slug: "airport-pickup-after-visiting-a-dispensary-denver",
    category: "transportation",
    eyebrow: "Denver airport planning",
    title: "How should you plan airport pickup if cannabis-friendly stops are part of the trip?",
    description: "Separate transportation planning from consumption rules so the ride stays simple and legal.",
    answer: "Plan the transportation around legal pickup, luggage, timing, and destination first. Do not assume that a transportation provider allows consumption in the vehicle or that airport, hotel, or public-space rules are the same as private-property rules.",
    matters: ["Airport pickup rules", "Vehicle policies", "Legal consumption location", "Luggage", "Final destination"],
    tradeoffs: [
      { label: "Standard airport ride", body: "Simplest logistics, with any cannabis-related stop handled separately." },
      { label: "Specialized pickup service", body: "May better fit the itinerary, but policies and permitted conduct still need to be clear." },
      { label: "Rental car", body: "Adds flexibility but also driving responsibility; impairment and driving never mix." },
    ],
    questions: ["Where is the legal stop occurring?", "What does the vehicle provider allow?", "Who is driving afterward?", "Where can any consumption legally occur?"],
    nextStep: { label: "See the specialized pickup option", body: "If the trip calls for a cannabis-friendly transportation provider, continue to the specialist site for its current rules and booking path.", href: "https://420friendlyairportpickup.com" },
  },
  {
    slug: "wisconsin-dells-first-trip-what-to-plan-first",
    category: "wisconsin",
    eyebrow: "Wisconsin Dells",
    title: "First trip to Wisconsin Dells: what should you plan first?",
    description: "Avoid building a trip from a random attraction list by deciding the shape of the trip first.",
    answer: "Start with lodging location, who is traveling, how much waterpark time the group wants, and whether you are building a resort-centered trip or a broader Dells itinerary. Those choices determine how much driving, dining planning, and advance booking you really need.",
    matters: ["Ages in the group", "Resort vs town location", "Indoor vs outdoor priorities", "Meal logistics", "How many days you have"],
    tradeoffs: [
      { label: "Resort-centered trip", body: "Easy for families and groups, but you may see less beyond the property." },
      { label: "Explore the wider Dells", body: "More variety, with more transportation and scheduling." },
      { label: "Plan every hour", body: "Reduces uncertainty but can make a leisure destination feel over-scheduled." },
    ],
    questions: ["Who is traveling?", "How many full days are available?", "Is the lodging itself a major attraction?", "Does the group care more about waterparks, scenery, dining, nightlife, or family attractions?"],
    nextStep: { label: "Explore the Dells specialist site", body: "Use the destination site after you know the shape of the trip you want.", href: "https://welcometothedells.com" },
  },
  {
    slug: "how-to-plan-a-cruise-with-a-group",
    category: "cruise",
    eyebrow: "Group cruise planning",
    title: "How do you plan a cruise with a group without planning every minute?",
    description: "Use a shared structure for the few decisions that actually need coordination while leaving the rest of the cruise flexible.",
    answer: "Coordinate only the decisions that create consequences for other people: port-day anchors, dinners that require everyone, ticketed activities, meeting points, and anything with a hard departure time. Everything else can stay optional.",
    matters: ["Port-day anchors", "Hard reservation times", "Who is participating", "Meeting points", "Changes everyone needs to see"],
    tradeoffs: [
      { label: "Detailed group schedule", body: "Everyone knows the plan, but the cruise can start to feel like a conference." },
      { label: "No shared plan", body: "Maximum freedom, but people repeatedly ask the group chat what is happening." },
      { label: "Shared anchors only", body: "Coordinates the important pieces without forcing everyone into the same day." },
    ],
    questions: ["Which activities truly require the whole group?", "Which plans have hard times?", "Who needs to know about each change?", "What can safely remain spontaneous?"],
    nextStep: { label: "Build the shared cruise plan", body: "Cruise Promenade is the planning layer once the decisions are made.", href: "https://cruisepromenade.com" },
  },
  {
    slug: "independent-cruise-port-driver-vs-bus-tour",
    category: "cruise",
    eyebrow: "Independent shore day",
    title: "Private local driver or bus tour at a cruise port?",
    description: "Choose between a structured group excursion and a more personal local ride based on flexibility, certainty, and how your group likes to travel.",
    answer: "A bus tour works best when you want a defined itinerary and minimal decision-making. A private local driver works best when the person and flexibility matter as much as the attraction list. In either case, the ship clock remains the non-negotiable constraint.",
    matters: ["Group size", "Mobility", "How fixed you want the itinerary", "Return-to-ship plan", "Whether local personality is part of the experience"],
    tradeoffs: [
      { label: "Bus tour", body: "Structured and simple, with less control over pace and stops." },
      { label: "Private local driver", body: "More personal and flexible, with more responsibility to understand the plan and confirmation terms." },
      { label: "Walk/taxi independently", body: "Maximum spontaneity, but you are building the day yourself." },
    ],
    questions: ["Do you want a fixed itinerary?", "Does anyone need a slower or more flexible pace?", "How important is having one local person with your group?", "What return margin are you comfortable with?"],
    nextStep: { label: "Find the local-driver experience", body: "When the private-person model fits, continue to Vibe Around Town to see available local drivers and reservation options.", href: "https://vibearoundtown.com" },
  },
  {
    slug: "alaska-shore-excursion-how-to-choose",
    category: "alaska",
    eyebrow: "Alaska cruise planning",
    title: "How should you choose an Alaska shore excursion?",
    description: "Choose the excursion by what would be hardest to recreate later—not by scrolling the longest list of products.",
    answer: "For each Alaska port, identify the one experience that depends most on that specific place, then check weather sensitivity, physical demands, travel time, and the ship clock. Build the port day around one anchor and keep the backup simple.",
    matters: ["What is unique to the port", "Weather sensitivity", "Transit time", "Mobility", "Return-to-ship margin"],
    tradeoffs: [
      { label: "Big signature excursion", body: "Highest potential payoff, often with higher cost or weather exposure." },
      { label: "Several smaller activities", body: "More variety, with more transitions and more ways for the schedule to slip." },
      { label: "Stay close to port", body: "Lower logistical risk, but you may miss the experience that made the destination special." },
    ],
    questions: ["What can you only do in this port?", "What part is most weather-sensitive?", "How much travel time is involved?", "What is the backup if the anchor experience fails?"],
    nextStep: { label: "Browse Alaska shore excursions", body: "Once the decision is narrowed, use the DCC owned specialist site (Last Frontier Shore Excursions) to compare the actual excursion choices.", href: "https://www.lastfrontiershoreexcursions.com/ports/juneau" },
  },
];

export function getPreSiteGuide(slug: string) {
  return PRE_SITE_GUIDES.find((guide) => guide.slug === slug);
}
