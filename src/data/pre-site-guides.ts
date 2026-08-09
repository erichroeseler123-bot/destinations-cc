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
};

export const PRE_SITE_GUIDES: PreSiteGuide[] = [
  {
    slug: "what-can-you-do-in-an-8-hour-cruise-port-day",
    category: "cruise",
    eyebrow: "Cruise port planning",
    title: "What can you realistically do in an 8-hour cruise port day?",
    description: "A practical framework for turning an eight-hour port call into a plan without treating all eight hours as usable excursion time.",
    answer: "Start with the ship clock, not the attraction list. Subtract disembarkation time, travel time, meeting-point time, a conservative return buffer, and any weather or traffic exposure before deciding how much activity actually fits.",
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
    answer: "Treat the helicopter flight as Plan A and choose a lower-weather-risk Plan B before arrival. The best backup is one that still feels distinctly Alaska, fits the remaining ship clock, and does not require a complicated same-day transfer.",
    matters: ["Flight weather can differ from conditions at the dock", "Cancellation timing", "How quickly you can pivot", "Remaining port time after cancellation", "Backup meeting location"],
    tradeoffs: [
      { label: "Wait for flight conditions", body: "You preserve the marquee experience but may lose the window for a strong backup." },
      { label: "Pivot early", body: "You protect the day but may give up a flight that could have operated later." },
      { label: "Keep a simple backup", body: "A less complicated Plan B is easier to execute after a late cancellation." },
    ],
    questions: ["When does the operator make the weather call?", "Is the backup bookable close to departure?", "How much ship time remains after a cancellation?", "Can the backup start near downtown or the cruise docks?"],
    nextStep: { label: "Compare Juneau flight choices", body: "Use Juneau Flight Deck when you are ready to narrow the actual flightseeing and backup options.", href: "https://juneauflightdeck.com" },
  },
  {
    slug: "juneau-whale-watching-or-glacier-flight",
    category: "alaska",
    eyebrow: "Juneau comparison",
    title: "Whale watching or a glacier flight in Juneau?",
    description: "Choose between two signature Juneau experiences by looking at weather risk, intensity, scenery, group fit, and the ship clock.",
    answer: "Pick the experience whose failure mode you are most comfortable with. Glacier flying delivers a dramatic aerial perspective but is more exposed to aviation weather. Whale watching keeps you on the water, usually involves a longer continuous outing, and gives a very different Alaska experience.",
    matters: ["Weather tolerance", "Fear of flying or motion sensitivity", "Mobility", "Total excursion duration", "Whether your group values wildlife or landscape more"],
    tradeoffs: [
      { label: "Glacier flight", body: "Higher visual drama and a unique perspective, with more weather sensitivity." },
      { label: "Whale watching", body: "Wildlife-focused and less dependent on flight conditions, but still weather- and sea-condition dependent." },
      { label: "Try to combine both", body: "Potentially memorable, but only if the ship clock and transfer logistics leave a generous margin." },
    ],
    questions: ["Would you be more disappointed to miss wildlife or aerial glacier scenery?", "How much weather uncertainty are you comfortable with?", "Does anyone in the group have mobility, motion, or flight concerns?", "How much uncommitted time remains before all-aboard?"],
    nextStep: { label: "See Juneau flight options", body: "When the decision points toward flightseeing, continue with the specialist Juneau site.", href: "https://juneauflightdeck.com" },
  },
  {
    slug: "new-orleans-airboat-vs-covered-swamp-boat",
    category: "new-orleans",
    eyebrow: "New Orleans swamp tours",
    title: "Airboat or covered swamp boat in New Orleans?",
    description: "Choose the swamp experience that fits your group instead of assuming the fastest or loudest boat is automatically better.",
    answer: "Choose by group comfort and desired experience. Airboats emphasize speed, exposure, and a more kinetic ride. Covered boats emphasize a calmer pace, more shelter, and easier conversation. Transportation to the swamp can matter as much as the boat type.",
    matters: ["Young children", "Noise sensitivity", "Weather exposure", "Mobility", "Transportation from New Orleans"],
    tradeoffs: [
      { label: "Airboat", body: "More speed and open-air sensation, with more noise and exposure." },
      { label: "Covered boat", body: "Calmer and more sheltered, but less of the high-energy airboat feel." },
      { label: "Self-drive vs pickup", body: "Driving can add flexibility; included transportation can remove a major planning problem." },
    ],
    questions: ["Does anyone dislike loud rides?", "Are young children traveling?", "How important is shade or rain protection?", "Do you have a car, or do you need transportation from the city?"],
    nextStep: { label: "Compare swamp experiences", body: "When you are ready to choose an actual New Orleans swamp option, continue to the specialist tour site.", href: "https://welcometotheswamp.com" },
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
    title: "DEN to Vail: rental car or private transfer?",
    description: "Compare the real tradeoff between controlling your own vehicle and handing the mountain drive to someone else.",
    answer: "The decision is less about mileage than about whether you want responsibility for winter driving, parking, luggage, and the return trip. A rental car creates flexibility. A private transfer removes most of the transportation workload once you leave the airport.",
    matters: ["Winter road conditions", "Group size and luggage", "Whether you need a car in Vail", "Parking cost and availability", "Return-flight timing"],
    tradeoffs: [
      { label: "Rental car", body: "Maximum freedom, but you own weather, driving, parking, and vehicle return logistics." },
      { label: "Private transfer", body: "Less driving responsibility and easier group movement, but less spontaneous mobility after arrival." },
      { label: "Shared shuttle", body: "Often a middle ground on cost, with less control over stops and timing." },
    ],
    questions: ["Will you use the car after arriving?", "Is anyone comfortable driving mountain roads in winter?", "How much luggage and ski gear is coming?", "How valuable is door-to-door timing to the group?"],
    nextStep: { label: "Check private transfer options", body: "If the decision points toward a private ride, continue to GoSno for the actual route and booking path.", href: "https://gosno.co" },
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
    nextStep: { label: "Browse Alaska shore excursions", body: "Once the decision is narrowed, use the Alaska specialist site to compare the actual excursion choices.", href: "https://lastfrontiershoreexcursions.com" },
  },
];

export function getPreSiteGuide(slug: string) {
  return PRE_SITE_GUIDES.find((guide) => guide.slug === slug);
}
